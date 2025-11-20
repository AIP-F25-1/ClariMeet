from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import glob, json, html, re, os

from .schemas import IngestReq, IngestResp
from .utils import b64_to_pil
from .whiteboard import WhiteboardProcessor

app = FastAPI(title="Whiteboard Capture Service", version="0.1.1")

STORAGE = Path("storage")
STORAGE.mkdir(parents=True, exist_ok=True)
app.mount("/storage", StaticFiles(directory=str(STORAGE), html=True), name="storage")

@app.get("/")
def home():
    return {"message": "Whiteboard Capture Service is running", "try": ["/health", "/docs", "/storage/"]}

@app.get("/health")
def health():
    return {"ok": True}

# whiteboard processor
processor = WhiteboardProcessor(storage_root=STORAGE)

@app.post("/ingest/frame", response_model=IngestResp)
def ingest_frame(req: IngestReq):
    try:
        img_pil = b64_to_pil(req.frame_b64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid image: {e}")
    snap_path = processor.process(req.meeting_id, req.ts_ms, img_pil)
    return IngestResp(snapshot=bool(snap_path), snapshot_path=snap_path)

@app.get("/meetings/{meeting_id}/snapshots")
def list_snapshots(meeting_id: str):
    sanitized_id = re.sub(r"[^a-zA-Z0-9_\-]", "_", meeting_id)
    snaps = sorted(glob.glob(str(STORAGE / "whiteboard" / sanitized_id / "snapshots" / "*.json")))
    out = []
    for s in snaps:
        with open(s, "r", encoding="utf-8") as f:
            out.append(json.load(f))
    return {"meeting_id": sanitized_id, "count": len(out), "snapshots": out}

@app.get("/gallery/{meeting_id}", response_class=HTMLResponse)
def gallery(meeting_id: str):

    safe_meeting_id = re.sub(r"[^a-zA-Z0-9_\-]", "_", meeting_id)

   
    snaps_dir = (STORAGE / "whiteboard" / safe_meeting_id / "snapshots").resolve()
    if not str(snaps_dir).startswith(str(STORAGE.resolve())):
        raise HTTPException(status_code=400, detail="Invalid meeting_id path")

    paths = sorted(glob.glob(str(snaps_dir / "*.json")))
    rows = []

    for p in paths:
        try:
            with open(p, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            continue

        ts = html.escape(str(data.get("ts_ms", "")))
        img_url = f"/storage/whiteboard/{safe_meeting_id}/frames/{ts}.jpg"


        items = data.get("items", [])
        texts = " ".join(
            html.escape(it.get("text", "")) for it in items if it.get("type") == "text"
        )

        rows.append(f"""
        <div style="display:flex;gap:16px;align-items:flex-start;margin:14px 0;padding-bottom:14px;border-bottom:1px solid #eee">
          <img src="{img_url}" alt="snapshot {ts}" style="width:360px;height:auto;border:1px solid #ddd;border-radius:8px"/>
          <div>
            <div style="font-family:monospace;font-size:13px;color:#666">ts_ms: {ts}</div>
            <div style="max-width:560px;white-space:pre-wrap;font-family:system-ui, -apple-system, sans-serif">
              <b>OCR text:</b> {texts or "(none)"}
            </div>
          </div>
        </div>
        """)

    body = "\n".join(rows) or "<p>No snapshots yet. POST /ingest/frame first.</p>"
    return f"""
    <html><head><title>Whiteboard Gallery — {html.escape(safe_meeting_id)}</title></head>
    <body style="margin:24px; font-family:system-ui, -apple-system, sans-serif">
      <h2>Whiteboard Gallery — {html.escape(safe_meeting_id)}</h2>
      <div><a href="/docs">API Docs</a> • <a href="/health">Health</a></div>
      <hr/>{body}
    </body></html>
    """
