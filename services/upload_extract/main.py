from __future__ import annotations
from pathlib import Path
from typing import Optional, List
import uuid, shutil, os, re

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

import subprocess, shutil
from clarimeet.audio_probe import probe_wav

# reuse your existing helper
from clarimeet.ingest import ingest_extract

app = FastAPI(title="ClariMeet — Upload & Audio Extract API")

STORAGE_DEFAULT = Path(os.getenv("CLARIMEET_STORAGE", "storage"))

def _ensure_ffmpeg() -> str:
    exe = shutil.which("ffmpeg")
    if not exe:
        raise RuntimeError("ffmpeg not found in PATH. Install FFmpeg and restart the server shell.")
    return exe

def _extract_audio_only(video_path: Path, out_wav: Path) -> tuple[int, int, float]:
    """
    Extract mono 16 kHz PCM WAV from video_path → out_wav using FFmpeg,
    then probe the WAV for (sample_rate, channels, duration_sec).
    """
    out_wav.parent.mkdir(parents=True, exist_ok=True)
    exe = _ensure_ffmpeg()
    cmd = [
        exe, "-y",
        "-i", str(video_path),
        "-vn",
        "-ac", "1",
        "-ar", "16000",
        "-c:a", "pcm_s16le",
        str(out_wav),
    ]
    subprocess.run(cmd, check=True)
    # probe
    wav = probe_wav(str(out_wav))
    return wav.sample_rate, wav.channels, float(wav.duration_sec)

def _slug_or_uuid(s: Optional[str]) -> str:
    if s and s.strip():
        slug = re.sub(r"[^a-zA-Z0-9_-]+", "-", s.strip()).strip("-").lower()
        if slug:
            return slug
    return str(uuid.uuid4())

def _find_original_video(base: Path, meeting: str) -> Path:
    """Return the uploaded original for this meeting (any common extension)."""
    orig = base / "original"
    candidates: List[Path] = []
    for p in orig.glob(f"{meeting}.*"):
        if p.is_file():
            candidates.append(p)
    if not candidates:
        # fallback: any single file in original/
        all_files = [p for p in orig.glob("*") if p.is_file()]
        if len(all_files) == 1:
            return all_files[0]
        raise FileNotFoundError(f"no original file for meeting '{meeting}' under {orig}")
    # prefer mp4/mov/mkv/m4a, else first
    pref = {".mp4": 0, ".mov": 1, ".mkv": 2, ".m4a": 3, ".wav": 4}
    candidates.sort(key=lambda p: pref.get(p.suffix.lower(), 99))
    return candidates[0]

class UploadResp(BaseModel):
    org_id: str
    meeting_id: str
    video_uri: str
    status: str = "stored"

class ExtractResp(BaseModel):
    org_id: str
    meeting_id: str
    audio_uri: str
    sample_rate: int
    channels: int
    duration_sec: float
    storage_root: str

@app.get("/health")
async def health():
    return {"ok": True}

@app.post("/api/videos/upload", response_model=UploadResp)
async def upload_video(
    file: UploadFile = File(...),
    org_id: str = Form("demo"),
    meeting_id: Optional[str] = Form(None),
    storage_root: Optional[str] = Form(None),
):
    try:
        org = (org_id or "demo").strip()
        meeting = _slug_or_uuid(meeting_id)
        storage = Path(storage_root or STORAGE_DEFAULT)
        base = storage / org / meeting
        orig_dir = base / "original"
        orig_dir.mkdir(parents=True, exist_ok=True)

        ext = Path(file.filename or "").suffix or ".mp4"
        dest = orig_dir / f"{meeting}{ext}"

        with dest.open("wb") as out:
            shutil.copyfileobj(file.file, out)

        return UploadResp(org_id=org, meeting_id=meeting, video_uri=str(dest))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"upload_failed: {e}")

@app.post("/api/videos/{meeting_id}/extract-audio", response_model=ExtractResp)
async def extract_audio(
    meeting_id: str,
    org_id: str = Form("demo"),
    storage_root: Optional[str] = Form(None),
):
    try:
        org = (org_id or "demo").strip()
        storage = Path(storage_root or STORAGE_DEFAULT)
        base = storage / org / meeting_id
        video_path = _find_original_video(base, meeting_id)  # already uploaded original

        audio_dir = base / "audio"
        out_wav   = audio_dir / f"{meeting_id}.wav"

        sr, ch, dur = _extract_audio_only(video_path, out_wav)

        return ExtractResp(
            org_id=org,
            meeting_id=meeting_id,
            audio_uri=str(out_wav),
            sample_rate=sr,
            channels=ch,
            duration_sec=dur,
            storage_root=str(storage),
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=f"not_found: {e}")
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"ffmpeg_failed: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"extract_failed: {e}")

