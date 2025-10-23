from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple
import json, logging
from dataclasses import dataclass


log = logging.getLogger("clarimeet.exporters")

def _read_jsonl(p: Path) -> List[Dict]:
    rows: List[Dict] = []
    with p.open("r", encoding="utf-8") as f:
        for ln in f:
            ln = ln.strip()
            if ln:
                rows.append(json.loads(ln))
    rows.sort(key=lambda r: float(r.get("start", 0.0)))
    return rows

def _pick_transcript_variant(sdir: Path) -> Tuple[Path, str]:
    for name, tag in [
        ("transcript_spk_pyannote.jsonl", "pyannote"),
        ("transcript_spk.jsonl", "pause"),
        ("transcript.jsonl", "raw"),
    ]:
        p = sdir / name
        if p.exists():
            return p, tag
    raise FileNotFoundError("No transcript JSONL found (looked for *_spk_pyannote.jsonl, *_spk.jsonl, transcript.jsonl).")

def _vtt_ts(sec: float) -> str:
    # HH:MM:SS.mmm (WebVTT uses '.' for milliseconds)
    sec = max(0.0, float(sec))
    h = int(sec) // 3600
    m = (int(sec) // 60) % 60
    s = int(sec) % 60
    ms = int(round((sec - int(sec)) * 1000))
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"

def _update_manifest(sdir: Path, name: str) -> None:
    mf = sdir / "manifest.json"
    try:
        data = {"files": []}
        if mf.exists():
            data = json.loads(mf.read_text(encoding="utf-8"))
        files = set(data.get("files", []))
        files.add(name)
        data["files"] = sorted(files)
        mf.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except Exception as e:
        log.warning("Could not update manifest.json: %s", e)

def export_vtt(session_dir: str | Path) -> VttResult:
    sdir = Path(session_dir)
    tj, variant = _pick_transcript_variant(sdir)
    rows = _read_jsonl(tj)

    # choose filename based on variant
    out_name = {
        "pyannote": "captions_spk_pyannote.vtt",
        "pause":    "captions_spk.vtt",
        "raw":      "captions.vtt",
    }[variant]
    out_path = sdir / out_name

    # build VTT
    lines = ["WEBVTT", ""]
    cues = 0
    for r in rows:
        start = float(r.get("start", 0.0))
        end   = float(r.get("end", start))
        text  = (r.get("text") or "").strip()
        spk   = r.get("speaker")
        if not text:
            continue
        ts = f"{_vtt_ts(start)} --> {_vtt_ts(end)}"
        cue_text = f"{spk}: {text}" if spk else text
        # no cue numbers needed in WebVTT
        lines.append(ts)
        lines.append(cue_text)
        lines.append("")  # blank line separates cues
        cues += 1

    out_path.write_text("\n".join(lines), encoding="utf-8")
    _update_manifest(sdir, out_path.name)
    return VttResult(session_dir=sdir, variant=variant, out_file=out_path, cues=cues)

def _read_json(p: Path):
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return {}

def _load_alignment_by_seg(sdir: Path):
    p = sdir / "transcript_aligned.json"
    if not p.exists():
        return {}
    try:
        doc = json.loads(p.read_text(encoding="utf-8"))
        by_seg: dict[int, list[dict]] = {}
        for w in doc.get("words", []) or []:
            i = int(w.get("segment_index", -1))
            if i < 0: 
                continue
            by_seg.setdefault(i, []).append({
                "w": str(w.get("word","")),
                "start": float(w.get("start", 0.0)),
                "end": float(w.get("end", 0.0)),
            })
        # sort each list
        for k in list(by_seg.keys()):
            by_seg[k].sort(key=lambda x: (x["start"], x["end"]))
        return by_seg
    except Exception:
        return {}

def _unique_speakers(rows: list[dict]) -> list[str]:
    seen, out = set(), []
    for r in rows:
        s = r.get("speaker")
        if s and s not in seen:
            seen.add(s); out.append(s)
    return out

def export_transcript_json(session_dir: str | Path) -> JsonExportResult:
    sdir = Path(session_dir)
    tj, variant = _pick_transcript_variant(sdir)
    rows = _read_jsonl(tj)

    # optional context
    meta = _read_json(sdir / "meta.json")
    created_at = meta.get("created_at")
    model = meta.get("model", {}) or {}
    audio_meta = meta.get("audio", {}) or {}
    session_id = sdir.name

    # speakers (prefer file if present)
    spk_file = sdir / "speakers_pyannote.json"
    if not spk_file.exists():
        spk_file = sdir / "speakers.json"
    speakers_list = []
    if spk_file.exists():
        data = _read_json(spk_file)
        # accept either {"speakers":[...]} or a dict with keys being speaker ids
        if isinstance(data, dict) and "speakers" in data and isinstance(data["speakers"], list):
            speakers_list = [str(x) for x in data["speakers"]]
        elif isinstance(data, dict):
            speakers_list = [str(k) for k in data.keys()]
    if not speakers_list:
        speakers_list = _unique_speakers(rows)

    # alignment per segment (if available)
    align_by_seg = _load_alignment_by_seg(sdir)
    words_total = sum(len(v) for v in align_by_seg.values())

    # build segments
    segs_out = []
    for idx, r in enumerate(rows):
        seg = {
            "index": idx,
            "start": float(r.get("start", 0.0)),
            "end": float(r.get("end", r.get("start", 0.0))),
            "text": (r.get("text") or "").strip(),
        }
        if r.get("speaker"):
            seg["speaker"] = r["speaker"]
        if idx in align_by_seg and align_by_seg[idx]:
            seg["words"] = align_by_seg[idx]
        segs_out.append(seg)

    doc = {
        "schema": "clarimeet.transcript@v1",
        "session": {"id": session_id, "dir": str(sdir), "created_at": created_at},
        "audio": {"path": audio_meta.get("path"), "duration_sec": audio_meta.get("duration_sec")},
        "model": {"whisper": model.get("whisper"), "language": model.get("language")},
        "variant": variant,
        "speakers": speakers_list,
        "segments": segs_out,
    }

    out_path = sdir / "transcript.v1.json"
    out_path.write_text(json.dumps(doc, indent=2), encoding="utf-8")
    _update_manifest(sdir, out_path.name)

    return JsonExportResult(
        session_dir=sdir,
        out_file=out_path,
        variant=variant,
        segments=len(segs_out),
        speakers=len(speakers_list),
        words_total=words_total,
    )


@dataclass
class VttResult:
    session_dir: Path
    variant: str
    out_file: Path
    cues: int

@dataclass
class JsonExportResult:
    session_dir: Path
    out_file: Path
    variant: str
    segments: int
    speakers: int
    words_total: int

