from __future__ import annotations
from pathlib import Path
from typing import Optional, List
import os, json

from fastapi import FastAPI, Form, HTTPException
from pydantic import BaseModel

# Use your existing ASR runner
from clarimeet.asr_job import asr_run

# Deterministic CUDA on Windows (prevents CuBLAS nondeterminism errors)
os.environ.setdefault("CUBLAS_WORKSPACE_CONFIG", ":4096:8")

app = FastAPI(title="ClariMeet — Transcription Job API")

STORAGE_DEFAULT = Path(os.getenv("CLARIMEET_STORAGE", "storage"))

class AsrResp(BaseModel):
    org_id: str
    meeting_id: str
    storage_root: str
    session_id: str
    session_dir: str
    model: str
    language: Optional[str] = None
    segments: int
    outputs: List[str]

class LatestResp(BaseModel):
    org_id: str
    meeting_id: str
    latest_session: str

@app.get("/health")
async def health():
    return {"ok": True}

def _audio_path(storage: Path, org: str, meeting: str) -> Path:
    return storage / org / meeting / "audio" / f"{meeting}.wav"

def _sessions_dir(storage: Path, org: str, meeting: str) -> Path:
    return storage / org / meeting / "asr"

def _read_latest(storage: Path, org: str, meeting: str) -> Optional[str]:
    p = storage / org / meeting / "asr_latest.json"
    try:
        if p.exists():
            return json.loads(p.read_text(encoding="utf-8")).get("latest_session")
    except Exception:
        pass
    return None

@app.post("/api/transcribe/batch", response_model=AsrResp)
async def start_asr(
    org_id: str = Form("demo"),
    meeting_id: str = Form(...),
    storage_root: Optional[str] = Form(None),
    model: Optional[str] = Form(None),          # tiny|base|small|medium|large
    language: Optional[str] = Form(None),       # e.g., en
    temperature: Optional[float] = Form(None),  # default 0.0
    seed: Optional[int] = Form(None),
    session: Optional[str] = Form(None),        # optional fixed session name
):
    try:
        org = (org_id or "demo").strip()
        meeting = meeting_id.strip()
        storage = Path(storage_root or STORAGE_DEFAULT)

        wav = _audio_path(storage, org, meeting)
        if not wav.exists():
            raise HTTPException(status_code=404, detail=f"audio_missing: {wav}")

        res = asr_run(
            org_id=org,
            meeting_id=meeting,
            storage_root=str(storage),
            model=model or "tiny",
            language=language,
            temperature=float(temperature) if temperature is not None else 0.0,
            seed=seed,
            session=session,
        )

        out = {
            "org_id": res.org_id,
            "meeting_id": res.meeting_id,
            "storage_root": str(res.storage_root),
            "session_id": res.session_id,
            "session_dir": str(res.session_dir),
            "model": res.model,
            "language": res.language,
            "segments": res.segments,
            "outputs": [
                "transcript.txt", "captions.srt", "transcript.jsonl",
                "meta.json", "manifest.json", "run.log"
            ],
        }
        return AsrResp(**out)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"asr_failed: {e}")

@app.get("/api/meetings/{meeting_id}/asr/latest", response_model=LatestResp)
async def get_latest(meeting_id: str, org_id: str = "demo", storage_root: Optional[str] = None):
    storage = Path(storage_root or STORAGE_DEFAULT)
    latest = _read_latest(storage, org_id, meeting_id)
    if not latest:
        raise HTTPException(status_code=404, detail="latest_not_found")
    return LatestResp(org_id=org_id, meeting_id=meeting_id, latest_session=latest)

@app.get("/api/meetings/{meeting_id}/asr/sessions")
async def list_sessions(meeting_id: str, org_id: str = "demo", storage_root: Optional[str] = None):
    storage = Path(storage_root or STORAGE_DEFAULT)
    asr_dir = _sessions_dir(storage, org_id, meeting_id)
    if not asr_dir.exists():
        return {"sessions": []}
    names = [p.name for p in asr_dir.iterdir() if p.is_dir()]
    names.sort()
    return {"sessions": names}
