from __future__ import annotations
from pathlib import Path
from typing import Optional, List
import uuid, shutil, os, re

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

# reuse your existing helper
from clarimeet.ingest import ingest_extract

app = FastAPI(title="ClariMeet — Upload & Audio Extract API")

STORAGE_DEFAULT = Path(os.getenv("CLARIMEET_STORAGE", "storage"))

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
        video_path = _find_original_video(base, meeting_id)

        res = ingest_extract(
            video_path=str(video_path),
            org_id=org,
            meeting_id=meeting_id,
            storage_root=str(storage),
        )
        return ExtractResp(
            org_id=res.org_id,
            meeting_id=res.meeting_id,
            audio_uri=res.audio_uri,
            sample_rate=res.sample_rate,
            channels=res.channels,
            duration_sec=res.duration_sec,
            storage_root=str(res.storage_root),
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=f"not_found: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"extract_failed: {e}")
