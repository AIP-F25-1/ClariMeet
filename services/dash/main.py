from __future__ import annotations
from pathlib import Path
import os, asyncio
from typing import Optional, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
import httpx

# Ports of your existing services
PORT_UPLOAD = int(os.getenv("PORT_UPLOAD", 8001))   # videos: upload/extract
PORT_PIPE   = int(os.getenv("PORT_PIPE",   8006))   # one-shot pipeline
PORT_REPORT = int(os.getenv("PORT_REPORT", 8004))   # export/report (serves report.html)

app = FastAPI(title="ClariMeet — Dash")

# Serve the static index
STATIC_DIR = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/", response_class=HTMLResponse)
async def home():
    return (STATIC_DIR / "index.html").read_text(encoding="utf-8")

@app.get("/health")
async def health():
    return {"ok": True}

async def _post_multipart(url: str, data: Dict[str, Any], files: Optional[Dict[str, Any]] = None):
    timeout = httpx.Timeout(1800.0, connect=30.0)  # allow long pipeline
    async with httpx.AsyncClient(timeout=timeout) as client:
        return await client.post(url, data=data, files=files)

@app.post("/ui/run")
async def ui_run(
    file: UploadFile = File(...),
    org_id: str = Form("demo"),
    meeting_id: str = Form(...),
    model: str = Form("tiny"),
    max_bullets: int = Form(3),
    num_speakers: Optional[int] = Form(2),  # speed up diarization
):
    try:
        # 1) upload
        up_url = f"http://127.0.0.1:{PORT_UPLOAD}/api/videos/upload"
        files = {"file": (file.filename, await file.read(), file.content_type or "application/octet-stream")}
        data  = {"org_id": org_id, "meeting_id": meeting_id}
        r1 = await _post_multipart(up_url, data=data, files=files)
        if r1.status_code >= 400:
            raise HTTPException(status_code=r1.status_code, detail=f"upload_failed: {r1.text}")

        # 2) extract audio
        ex_url = f"http://127.0.0.1:{PORT_UPLOAD}/api/videos/{meeting_id}/extract-audio"
        r2 = await _post_multipart(ex_url, data={"org_id": org_id})
        if r2.status_code >= 400:
            raise HTTPException(status_code=r2.status_code, detail=f"extract_failed: {r2.text}")

        # 3) run pipeline (reuses artifacts on later runs if session=meeting_id)
        pipe_url = f"http://127.0.0.1:{PORT_PIPE}/api/pipeline/run"
        pdata = {
            "org_id": org_id,
            "meeting_id": meeting_id,
            "session": meeting_id,         # reuse session if it exists
            "model": model,
            "max_bullets": str(max_bullets),
        }
        if num_speakers:
            pdata["num_speakers"] = str(num_speakers)
        r3 = await _post_multipart(pipe_url, data=pdata)
        if r3.status_code >= 400:
            raise HTTPException(status_code=r3.status_code, detail=f"pipeline_failed: {r3.text}")
        j3 = r3.json()

        # 4) final report URL (served by port 8004)
        report_url = f"http://127.0.0.1:{PORT_REPORT}/api/report/file?org_id={org_id}&meeting_id={meeting_id}"

        return JSONResponse({
            "ok": True,
            "org_id": org_id,
            "meeting_id": meeting_id,
            "session": j3.get("session"),
            "report_url": report_url,
            "vtt_file": j3.get("vtt_file"),
            "words": j3.get("words"),
            "speakers": j3.get("speakers"),
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ui_run_failed: {e}")
