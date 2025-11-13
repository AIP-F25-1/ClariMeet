from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict, Optional
import json
import logging

log = logging.getLogger("clarimeet.whiteboard")

# Try OCR dependencies (optional)
try:
    from PIL import Image  # type: ignore
    import pytesseract  # type: ignore

    _HAS_OCR = True
except Exception:
    _HAS_OCR = False

_IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}


@dataclass
class WhiteboardItem:
    frame_path: Path
    rel_path: str
    ts_hint: Optional[float]
    ocr_text: str


@dataclass
class WhiteboardProcessResult:
    session_dir: Path
    meeting_dir: Optional[Path]
    frames_found: int
    ocr_enabled: bool
    items_written: int
    manifest_path: Optional[Path]


# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------


def _infer_meeting_dir_from_meta(session_dir: Path) -> Optional[Path]:
    """
    First try to infer the meeting directory from meta.json's audio.path.
    This is how the real ASR pipeline wires things.
    """
    meta = session_dir / "meta.json"
    if not meta.exists():
        return None

    try:
        data = json.loads(meta.read_text(encoding="utf-8"))
    except Exception as e:
        log.warning("whiteboard: could not read meta.json (%s): %s", meta, e)
        return None

    ap = data.get("audio", {}).get("path")
    if not ap:
        return None

    audio_path = Path(ap)
    # If it's relative, interpret from project root (cwd)
    if not audio_path.is_absolute():
        audio_path = Path.cwd() / audio_path

    # We expect .../<org>/<meeting>/audio/<file>
    # So meeting_dir = parent of "audio" directory
    parent = audio_path.parent  # .../audio
    if parent.name.lower() == "audio":
        meeting_dir = parent.parent
    else:
        # Fallback: go one level up
        meeting_dir = parent

    if meeting_dir.exists():
        return meeting_dir

    return None


def _infer_meeting_dir_from_path(session_dir: Path) -> Optional[Path]:
    """
    Fallback inference purely from folder structure:

      storage/<org>/<meeting>/asr/<session_id>

    meeting_dir = storage/<org>/<meeting>
    """
    p = session_dir.resolve()
    parts = list(p.parts)
    if "asr" not in parts:
        return None

    idx = parts.index("asr")
    if idx <= 0:
        return None

    meeting_dir = Path(*parts[:idx])  # everything above 'asr'
    if meeting_dir.exists():
        return meeting_dir

    return None


def _infer_meeting_dir(session_dir: Path) -> Path:
    """
    Robust meeting root inference using:
      1) meta.json audio.path
      2) hard-coded /asr/ pattern
    """
    # 1) Try meta.json → audio.path
    mdir = _infer_meeting_dir_from_meta(session_dir)
    if mdir is not None:
        return mdir

    # 2) Try structural pattern
    mdir = _infer_meeting_dir_from_path(session_dir)
    if mdir is not None:
        return mdir

    raise FileNotFoundError(f"Could not infer meeting_dir from session {session_dir}")


def _iter_frame_files(frames_dir: Path) -> List[Path]:
    if not frames_dir.exists():
        return []
    paths: List[Path] = []
    for p in sorted(frames_dir.iterdir()):
        if p.is_file() and p.suffix.lower() in _IMAGE_EXTS:
            paths.append(p)
    return paths


def _ocr_image(p: Path) -> str:
    if not _HAS_OCR:
        return ""
    try:
        img = Image.open(p)
        text = pytesseract.image_to_string(img)
        return text.strip()
    except Exception as e:
        log.warning("whiteboard: OCR failed for %s: %s", p, e)
        return ""


def _parse_timestamp_hint(path: Path) -> Optional[float]:
    """
    Very light heuristic:
    - If filename looks like 0123.png → treat '0123' as seconds.
    - Otherwise, None (report will still show the image).
    """
    stem = path.stem
    try:
        return float(stem)
    except Exception:
        return None


def _write_jsonl(path: Path, rows: List[Dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


# ---------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------


def process_whiteboard_for_session(session_dir: str | Path) -> WhiteboardProcessResult:
    """
    Scan the meeting's whiteboard frames, run OCR (if available),
    and write artifacts under meeting_dir/whiteboard:

      - wb_items.jsonl   (one record per frame, with OCR text)
      - wb_manifest.json (summary / list of frames)

    This does NOT require a real audio file; it only needs the folder structure
    and (optionally) meta.json for better meeting_dir inference.
    """
    sdir = Path(session_dir)
    if not sdir.exists():
        raise FileNotFoundError(f"Session dir not found: {sdir}")

    try:
        meeting_dir = _infer_meeting_dir(sdir)
    except Exception as e:
        # propagate the same error to make debugging obvious
        log.error("whiteboard: failed to infer meeting dir from %s: %s", sdir, e)
        raise

    wb_root = meeting_dir / "whiteboard"
    frames_dir = wb_root / "frames"

    frame_files = _iter_frame_files(frames_dir)
    if not frame_files:
        log.info("whiteboard: no frame images found under %s", frames_dir)
        return WhiteboardProcessResult(
            session_dir=sdir,
            meeting_dir=meeting_dir,
            frames_found=0,
            ocr_enabled=_HAS_OCR,
            items_written=0,
            manifest_path=None,
        )

    log.info("whiteboard: found %d frame(s) under %s", len(frame_files), frames_dir)

    items: List[Dict] = []
    for idx, p in enumerate(frame_files):
        ts_hint = _parse_timestamp_hint(p)
        text = _ocr_image(p)
        rel = p.relative_to(meeting_dir).as_posix()

        items.append(
            {
                "schema": "clarimeet.whiteboard.item@v1",
                "index": idx,
                "path": rel,
                "timestamp_hint": ts_hint,
                "ocr_text": text,
            }
        )

    # Write JSONL with one record per frame
    items_path = wb_root / "wb_items.jsonl"
    _write_jsonl(items_path, items)

    # Write manifest (single JSON)
    manifest = {
        "schema": "clarimeet.whiteboard.manifest@v1",
        "meeting_dir": str(meeting_dir),
        "frames_dir": str(frames_dir),
        "frames": [i["path"] for i in items],
        "ocr_enabled": _HAS_OCR,
        "count": len(items),
    }
    manifest_path = wb_root / "wb_manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    log.info(
        "whiteboard: wrote %d item(s) to %s and manifest to %s",
        len(items),
        items_path,
        manifest_path,
    )

    return WhiteboardProcessResult(
        session_dir=sdir,
        meeting_dir=meeting_dir,
        frames_found=len(frame_files),
        ocr_enabled=_HAS_OCR,
        items_written=len(items),
        manifest_path=manifest_path,
    )
