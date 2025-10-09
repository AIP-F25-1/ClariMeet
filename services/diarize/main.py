from __future__ import annotations
from pathlib import Path
from typing import Optional, List
import os, json

from fastapi import FastAPI, Form, HTTPException
from pydantic import BaseModel

# existing helper
from clarimeet.diarize_hf import diarize_with_pyannote
# NEW: read clarimeet.json (project root or ~/.clarimeet/clarimeet.json or explicit env path)
from clarimeet.config import load_config, get_cfg

app = FastAPI(title="ClariMeet — Diarization API")

STORAGE_DEFAULT = Path(os.getenv("CLARIMEET_STORAGE", "storage"))

class DiarizeResp(BaseModel):
    org_id: str
    meeting_id: str
    session: str
    session_dir: str
    segments_tagged: int
    speakers: List[str]
    pipeline: str
    token_source: str
    outputs: List[str]

@app.get("/health")
async def health():
    return {"ok": True}

def _latest_session(storage: Path, org: str, meeting: str) -> Optional[str]:
    ptr = storage / org / meeting / "asr_latest.json"
    try:
        if ptr.exists():
            return json.loads(ptr.read_text(encoding="utf-8")).get("latest_session")
    except Exception:
        pass
    return None

def _session_dir(storage: Path, org: str, meeting: str, session: str) -> Path:
    return storage / org / meeting / "asr" / session

@app.post("/api/diarize/run", response_model=DiarizeResp)
async def run_diarization(
    org_id: str = Form("demo"),
    meeting_id: str = Form(...),
    storage_root: Optional[str] = Form(None),
    session: Optional[str] = Form(None),            # if omitted → use latest
    hf_token: Optional[str] = Form(None),           # optional override
    pipeline: Optional[str] = Form(None),           # optional override
    num_speakers: Optional[int] = Form(None),       # optional fixed K
):
    try:
        org = (org_id or "demo").strip()
        meeting = meeting_id.strip()
        storage = Path(storage_root or STORAGE_DEFAULT)

        # Load config (CLARIMEET_CONFIG can point to a specific file)
        cfg_path = os.getenv("CLARIMEET_CONFIG", None)
        cfg = load_config(cfg_path)

        # Resolve session dir
        sess = session or _latest_session(storage, org, meeting)
        if not sess:
            raise HTTPException(status_code=404, detail="no_session: run transcription first or pass session")
        sdir = _session_dir(storage, org, meeting, sess)
        if not sdir.exists():
            raise HTTPException(status_code=404, detail=f"session_dir_missing: {sdir}")

        # Resolve token and pipeline from (request) → (config) → (env)
        token = (
            hf_token
            or get_cfg(cfg, "huggingface", "token", default=None)
            or os.getenv("HF_TOKEN")
        )
        pipe = pipeline or get_cfg(cfg, "huggingface", "pipeline", default="pyannote/speaker-diarization-3.1")

        if not token:
            raise HTTPException(
                status_code=400,
                detail="Hugging Face token is required. Set huggingface.token in clarimeet.json, "
                       "or export HF_TOKEN, or pass hf_token in the request."
            )

        res = diarize_with_pyannote(
            session_dir=sdir,
            hf_token=token,
            pipeline_name=pipe,
            num_speakers=num_speakers,
        )

        return DiarizeResp(
            org_id=org,
            meeting_id=meeting,
            session=sess,
            session_dir=str(res.session_dir),
            segments_tagged=res.segments_tagged,
            speakers=res.speakers,
            pipeline=res.pipeline,
            token_source=res.token_source,
            outputs=[
                "transcript_spk_pyannote.jsonl",
                "captions_spk_pyannote.srt",
                "speakers_pyannote.json",
            ],
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"diarize_failed: {e}")
