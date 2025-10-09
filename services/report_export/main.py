from __future__ import annotations
from pathlib import Path
from typing import Optional, List
import os, json

from fastapi import FastAPI, Form, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel

from clarimeet.exporters import export_vtt
from clarimeet.report import render_report

app = FastAPI(title="ClariMeet — Export & Report API")

STORAGE_DEFAULT = Path(os.getenv("CLARIMEET_STORAGE", "storage"))

# ---------- models ----------

class VttResp(BaseModel):
    org_id: str
    meeting_id: str
    session: str
    session_dir: str
    variant: str
    vtt_file: str
    cues: int

class ReportResp(BaseModel):
    org_id: str
    meeting_id: str
    session: str
    session_dir: str
    report: str

# ---------- helpers ----------

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

# ---------- routes ----------

@app.get("/health")
async def health():
    return {"ok": True}

@app.post("/api/export/vtt", response_model=VttResp)
async def export_vtt_api(
    org_id: str = Form("demo"),
    meeting_id: str = Form(...),
    storage_root: Optional[str] = Form(None),
    session: Optional[str] = Form(None),  # if omitted → latest
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

        res = export_vtt(sdir)
        return VttResp(
            org_id=org,
            meeting_id=meeting,
            session=sess,
            session_dir=str(res.session_dir),
            variant=res.variant,
            vtt_file=str(res.out_file),
            cues=res.cues,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"export_failed: {e}")

@app.post("/api/report/render", response_model=ReportResp)
async def render_report_api(
    org_id: str = Form("demo"),
    meeting_id: str = Form(...),
    storage_root: Optional[str] = Form(None),
    session: Optional[str] = Form(None),  # if omitted → latest
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

        out = render_report(sdir, auto_open=False)
        return ReportResp(
            org_id=org,
            meeting_id=meeting,
            session=sess,
            session_dir=str(sdir),
            report=str(out),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"report_failed: {e}")

@app.get("/api/report/file")
async def get_report_file(
    org_id: str = Query("demo"),
    meeting_id: str = Query(...),
    storage_root: Optional[str] = Query(None),
    session: Optional[str] = Query(None),  # if omitted → latest
):
    org = (org_id or "demo").strip()
    meeting = meeting_id.strip()
    storage = Path(storage_root or STORAGE_DEFAULT)

    sess = session or _latest_session(storage, org, meeting)
    if not sess:
        raise HTTPException(status_code=404, detail="no_session: run transcription first or pass session")

    sdir = _session_dir(storage, org, meeting, sess)
    report_path = sdir / "report.html"
    if not report_path.exists():
        # try rendering now
        try:
            render_report(sdir, auto_open=False)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"render_on_demand_failed: {e}")
        if not report_path.exists():
            raise HTTPException(status_code=404, detail="report_not_found")

    return FileResponse(path=report_path, media_type="text/html", filename=report_path.name)
