from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Dict
from .transformer_summarizer import TransformerSummarizer
from .extractors import extract_key_bullets, extract_action_items
import re, os, uuid, tempfile, subprocess, shutil

app = FastAPI(title="Meeting Summary")

# ---------- Clean transcript ----------
SPEAKER_LABEL = re.compile(r"^\s*[A-Z][a-zA-Z]+:\s*$")

def normalize_transcript(text: str) -> str:
    lines = [l.rstrip() for l in text.splitlines()]
    out = []
    i = 0
    while i < len(lines):
        cur = lines[i].strip()
        if SPEAKER_LABEL.match(cur):
            if i + 1 < len(lines):
                out.append(f"{cur} {lines[i+1].strip()}")
                i += 2
                continue
            i += 1
            continue
        out.append(cur)
        i += 1
    return "\n".join([l for l in out if l])

# ---------- Summarizer setup ----------
summarizer = TransformerSummarizer()

class SummarizeRequest(BaseModel):
    transcript_text: str

class SummarizeResponse(BaseModel):
    summary: str
    key_points: List[str]
    action_items: List[Dict]

def summarize_from_text(text: str) -> SummarizeResponse:
    clean_text = normalize_transcript(text)
    summary = summarizer.summarize(clean_text)
    bullets = extract_key_bullets(summary)
    actions = extract_action_items(clean_text)
    return SummarizeResponse(summary=summary, key_points=bullets, action_items=actions)

@app.post("/summarize", response_model=SummarizeResponse)
def summarize(req: SummarizeRequest):
    return summarize_from_text(req.transcript_text)

# ================== Upload / YouTube ingest ==================
def _ensure_ffmpeg():
    if not shutil.which("ffmpeg"):
        raise HTTPException(500, detail="FFmpeg not found on PATH. Install it and retry.")

def extract_audio_to_wav(src_path: str, dst_wav: str):
    _ensure_ffmpeg()
    cmd = ["ffmpeg", "-y", "-i", src_path, "-ac", "1", "-ar", "16000", dst_wav]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)

_whisper_model = None
def transcribe_audio(wav_path: str) -> str:
    global _whisper_model
    from faster_whisper import WhisperModel
    if _whisper_model is None:
        device = "cuda" if shutil.which("nvidia-smi") else "cpu"
        _whisper_model = WhisperModel("small", device=device)
    segments, _info = _whisper_model.transcribe(wav_path, vad_filter=True)
    return " ".join(seg.text.strip() for seg in segments if seg.text)

@app.post("/ingest/upload", response_model=SummarizeResponse)
async def ingest_upload(file: UploadFile = File(...)):
    tmpdir = tempfile.mkdtemp(prefix=f"ingest_{uuid.uuid4().hex[:8]}_")
    in_path = os.path.join(tmpdir, file.filename)
    try:
        with open(in_path, "wb") as f:
            f.write(await file.read())
        wav_path = os.path.join(tmpdir, "audio.wav")
        extract_audio_to_wav(in_path, wav_path)
        transcript = transcribe_audio(wav_path)
        if not transcript.strip():
            raise HTTPException(400, detail="Transcription returned empty text.")
        return summarize_from_text(transcript)
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

class YTRequest(BaseModel):
    url: str

@app.post("/ingest/youtube", response_model=SummarizeResponse)
def ingest_youtube(req: YTRequest):
    tmpdir = tempfile.mkdtemp(prefix=f"ingest_{uuid.uuid4().hex[:8]}_")
    media_path = os.path.join(tmpdir, "download.m4a")
    try:
        cmd = ["yt-dlp", "-f", "bestaudio[ext=m4a]/bestaudio", "-o", media_path, req.url]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
        wav_path = os.path.join(tmpdir, "audio.wav")
        extract_audio_to_wav(media_path, wav_path)
        transcript = transcribe_audio(wav_path)
        if not transcript.strip():
            raise HTTPException(400, detail="Transcription returned empty text.")
        return summarize_from_text(transcript)
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

# ================== Simple Web UI ==================
HTML_BASE = """
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Meeting Summary</title>
<style>
  body {{ font-family: Segoe UI, system-ui, -apple-system, Arial; background:#0f172a; color:#e2e8f0; margin:0; }}
  .wrap {{ max-width: 900px; margin: 24px auto; padding: 0 16px; }}
  h1 {{ font-weight:700; margin: 4px 0 16px; }}
  .card {{ background:#111827; border:1px solid #1f2937; border-radius:14px; padding:16px; margin-bottom:16px; }}
  label {{ display:block; margin:8px 0 6px; color:#93c5fd }}
  input[type="file"], input[type="text"] {{ width:100%; padding:10px; border-radius:8px; border:1px solid #334155; background:#0b1220; color:#e2e8f0; }}
  button {{ background:#3b82f6; color:#fff; border:none; padding:10px 16px; border-radius:10px; cursor:pointer; margin-top:10px; }}
  .grid {{ display:grid; grid-template-columns: 1fr 1fr; gap:16px; }}
  ul {{ margin-top:8px }}
  .muted {{ color:#9ca3af }}
  table {{ width:100%; border-collapse: collapse; margin-top:8px }}
  td, th {{ border-bottom:1px solid #1f2937; padding:8px; text-align:left; }}
  .mono {{ font-family: Consolas, Menlo, monospace; white-space: pre-wrap; }}
</style>
</head>
<body>
<div class="wrap">
  <h1>Meeting Summary</h1>
  <div class="grid">
    <div class="card">
      <h3>Upload URL</h3>
      <form method="post" action="/ui/youtube">
        <label>Paste YouTube URL</label>
        <input type="text" name="url" placeholder="https://www.youtube.com/watch?v=..." required />
        <button type="submit">Generate Summary</button>
      </form>
    </div>
    <div class="card">
      <h3>Upload File</h3>
      <form method="post" action="/ui/upload" enctype="multipart/form-data">
        <label>Select audio/video file (.mp3 .wav .mp4 ...)</label>
        <input type="file" name="file" required />
        <button type="submit">Generate Summary</button>
      </form>
    </div>
  </div>
  {result_section}
</div>
</body>
</html>
"""

def render_result(res: SummarizeResponse | None, error: str | None = None) -> HTMLResponse:
    if error:
        section = f'<div class="card"><h3>Error</h3><div class="muted mono">{error}</div></div>'
    elif res is None:
        section = ""
    else:
        bullets = "".join(f"<li>{b}</li>" for b in res.key_points)
        rows = "".join(
            f"<tr><td class='mono'>{a.get('sentence','')}</td>"
            f"<td>{a.get('owner') or '—'}</td>"
            f"<td>{a.get('due') or '—'}</td></tr>"
            for a in res.action_items
        )
        section = f"""
        <div class="card">
          <h3>Summary</h3>
          <div class="mono">{res.summary or '<span class="muted">(empty)</span>'}</div>
          <h3 style="margin-top:14px;">Key Points</h3>
          <ul>{bullets or '<li class="muted">(none)</li>'}</ul>
          <h3 style="margin-top:14px;">Action Items</h3>
          <table>
            <thead><tr><th>Sentence</th><th>Owner</th><th>Due</th></tr></thead>
            <tbody>{rows or '<tr><td colspan="3" class="muted">None</td></tr>'}</tbody>
          </table>
        </div>"""
    html = HTML_BASE.format(result_section=section)
    return HTMLResponse(content=html)

@app.get("/", response_class=HTMLResponse)
def ui_home():
    return render_result(None)

@app.post("/ui/upload", response_class=HTMLResponse)
async def ui_upload(file: UploadFile = File(...)):
    try:
        api_res = await ingest_upload(file=file)
        res = SummarizeResponse(**api_res.dict())
        return render_result(res)
    except Exception as e:
        return render_result(None, str(e))

@app.post("/ui/youtube", response_class=HTMLResponse)
def ui_youtube(url: str = Form(...)):
    try:
        api_res = ingest_youtube(YTRequest(url=url))
        res = SummarizeResponse(**api_res.dict())
        return render_result(res)
    except Exception as e:
        return render_result(None, str(e))
