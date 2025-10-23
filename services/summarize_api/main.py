from __future__ import annotations
from pathlib import Path
from typing import Optional, List
import os, json

from fastapi import FastAPI, Form, HTTPException
from pydantic import BaseModel

from clarimeet.summarize import summarize_session, write_outputs

app = FastAPI(title="ClariMeet — Summarization API")

STORAGE_DEFAULT = Path(os.getenv("CLARIMEET_STORAGE", "storage"))

class SummarizeResp(BaseModel):
    org_id: str
    meeting_id: str
    session: str
    session_dir: str
    written: List[str]
    bullets: int
    actions: int
    decisions: int

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

@app.post("/api/summarize/run", response_model=SummarizeResp)
async def run_summarize(
    org_id: str = Form("demo"),
    meeting_id: str = Form(...),
    storage_root: Optional[str] = Form(None),
    session: Optional[str] = Form(None),
    max_bullets: Optional[int] = Form(3),
):
    try:
        org = (org_id or "demo").strip()
        meeting = meeting_id.strip()
        storage = Path(storage_root or STORAGE_DEFAULT)

        sess = session or _latest_session(storage, org, meeting)
        if not sess:
            raise HTTPException(status_code=404, detail="no_session: run transcription first or pass session")
        sdir = _session_dir(storage, org, meeting, sess)
        if not sdir.exists():
            raise HTTPException(status_code=404, detail=f"session_dir_missing: {sdir}")

        outs = summarize_session(sdir, max_bullets=max_bullets or 3)
        written = write_outputs(sdir, outs)

        return SummarizeResp(
            org_id=org, meeting_id=meeting, session=sess, session_dir=str(sdir),
            written=written, bullets=len(outs.short_bullets),
            actions=len(outs.actions), decisions=len(outs.decisions)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"summarize_failed: {e}")
