from __future__ import annotations
import json, shutil, subprocess, uuid, sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Dict, Any

FFMPEG = "ffmpeg"
FFPROBE = "ffprobe"

@dataclass
class IngestResult:
    org_id: str
    meeting_id: str
    storage_root: Path
    video_uri: str
    audio_uri: str
    sample_rate: int
    channels: int
    duration_sec: float

def _check_tool(name: str) -> None:
    if shutil.which(name) is None:
        raise RuntimeError(f"Required tool not found in PATH: {name}")

def _ext_of(p: Path) -> str:
    return (p.suffix or "").lower()

def _ensure_storage(storage_root: Path, org_id: str, meeting_id: str) -> Dict[str, Path]:
    base = storage_root / org_id / meeting_id
    original = base / "original"
    audio = base / "audio"
    original.mkdir(parents=True, exist_ok=True)
    audio.mkdir(parents=True, exist_ok=True)
    return {"base": base, "original": original, "audio": audio}

def _copy_original(src: Path, dst_dir: Path, meeting_id: str) -> Path:
    ext = _ext_of(src) or ".mp4"
    dst = dst_dir / f"{meeting_id}{ext}"
    shutil.copy2(src, dst)
    return dst

def _run_ffmpeg_extract(in_video: Path, out_wav: Path) -> None:
    # Canonical command: -vn (no video), -ac 1 (mono), -ar 16000 (16kHz), pcm_s16le (16-bit PCM)
    # ref spec
    cmd = [
        FFMPEG, "-y",
        "-i", str(in_video),
        "-vn", "-ac", "1", "-ar", "16000",
        "-acodec", "pcm_s16le",
        str(out_wav),
    ]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg failed ({proc.returncode}): {proc.stderr.strip()[:500]}")

def _run_ffprobe(in_media: Path) -> Dict[str, Any]:
    cmd = [FFPROBE, "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", str(in_media)]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"ffprobe failed ({proc.returncode}): {proc.stderr.strip()[:500]}")
    return json.loads(proc.stdout)

def _audio_meta_from_probe(probe_json: Dict[str, Any]) -> Dict[str, Any]:
    # try audio stream first
    sr, ch = None, None
    dur = None
    for s in probe_json.get("streams", []):
        if s.get("codec_type") == "audio":
            sr = int(s.get("sample_rate")) if s.get("sample_rate") else None
            ch = int(s.get("channels")) if s.get("channels") else None
    fmt = probe_json.get("format") or {}
    if fmt.get("duration"):
        try:
            dur = float(fmt["duration"])
        except Exception:
            dur = None
    return {"sample_rate": sr or 16000, "channels": ch or 1, "duration": float(dur) if dur is not None else 0.0}

def ingest_extract(
    video_path: str | Path,
    org_id: Optional[str] = None,
    meeting_id: Optional[str] = None,
    storage_root: str | Path = "storage",
) -> IngestResult:
    _check_tool(FFMPEG); _check_tool(FFPROBE)

    src = Path(video_path)
    if not src.exists():
        raise FileNotFoundError(f"No such file: {src}")

    org_id = org_id or "org_demo"
    meeting_id = meeting_id or uuid.uuid4().hex

    paths = _ensure_storage(Path(storage_root), org_id, meeting_id)

    stored_original = _copy_original(src, paths["original"], meeting_id)
    out_wav = paths["audio"] / f"{meeting_id}.wav"

    _run_ffmpeg_extract(stored_original, out_wav)
    probe = _run_ffprobe(out_wav)
    meta = _audio_meta_from_probe(probe)

    # write ingest metadata next to base
    meta_doc = {
        "meeting_id": meeting_id,
        "org_id": org_id,
        "original_video": str(stored_original),
        "audio_wav": str(out_wav),
        "sample_rate": meta["sample_rate"],
        "channels": meta["channels"],
        "duration_sec": round(meta["duration"], 3),
    }
    (paths["base"] / "meta_ingest.json").write_text(json.dumps(meta_doc, indent=2), encoding="utf-8")

    return IngestResult(
        org_id=org_id,
        meeting_id=meeting_id,
        storage_root=Path(storage_root),
        video_uri=str(stored_original),
        audio_uri=str(out_wav),
        sample_rate=meta["sample_rate"],
        channels=meta["channels"],
        duration_sec=round(meta["duration"], 3),
    )
