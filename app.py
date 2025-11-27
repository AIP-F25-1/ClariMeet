from services.pipeline.actions_integration import push_actions_to_tools
from fastapi import FastAPI, UploadFile, File, HTTPException, Form, WebSocket, WebSocketDisconnect, Depends
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from pathlib import Path
from urllib.parse import unquote
import sys
import os
import tempfile
import subprocess
import shutil
import json
import base64
import logging
from datetime import datetime
from typing import Optional, Dict, Any

log = logging.getLogger("clarimeet.pipeline")

# Add parent directory to path to import clarimeet
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from clarimeet.config import load_config
from clarimeet.report import render_report
from clarimeet.utils import make_session_id, now_iso, sha256_of_file
from .diarization import run_diarization, assign_speakers_to_transcript, format_speaker_label

# Import whiteboard services
try:
    from services.whiteboard.whiteboard_service import (
        process_whiteboard_for_meeting,
        get_whiteboard_summary_for_meeting
    )
    _HAS_WHITEBOARD = True
except ImportError as e:
    _HAS_WHITEBOARD = False
    import logging
    logging.warning(f"Whiteboard services not available: {e}")

app = FastAPI(title="ClariMeet Pipeline")

# Mount static files
WEB_DIR = Path(__file__).parent.parent.parent / "web"
if WEB_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(WEB_DIR / "static")), name="static")

# Load config
_config = load_config(None)
STORAGE_ROOT = Path("./storage").resolve()
STORAGE_ROOT.mkdir(parents=True, exist_ok=True)

def _ensure_ffmpeg():
    if not shutil.which("ffmpeg"):
        raise HTTPException(500, detail="FFmpeg not found on PATH. Install it and retry.")

def extract_audio_to_wav(src_path: str, dst_wav: str):
    _ensure_ffmpeg()
    cmd = ["ffmpeg", "-y", "-i", src_path, "-ac", "1", "-ar", "16000", dst_wav]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)

_whisper_model = None
def transcribe_audio(wav_path: str, model_name: str = "tiny"):
    global _whisper_model
    # Try faster_whisper first
    try:
        from faster_whisper import WhisperModel
        if _whisper_model is None or model_name != getattr(_whisper_model, '_model_name', None):
            device = "cuda" if shutil.which("nvidia-smi") else "cpu"
            _whisper_model = WhisperModel(model_name, device=device)
            _whisper_model._model_name = model_name
        segments, _info = _whisper_model.transcribe(wav_path, vad_filter=True, beam_size=5)
        # Convert generator to list and filter out empty segments
        segment_list = []
        for seg in segments:
            text = seg.text.strip()
            if text:  # Only include segments with actual text
                segment_list.append({
                    "start": seg.start,
                    "end": seg.end,
                    "text": text
                })
        return segment_list
    except ImportError:
        pass
    
    # Fallback to openai-whisper
    try:
        import whisper
        model = whisper.load_model(model_name)
        result = model.transcribe(wav_path)
        segments = []
        for seg in result["segments"]:
            text = seg["text"].strip()
            if text:  # Only include segments with actual text
                segments.append({
                    "start": seg["start"],
                    "end": seg["end"],
                    "text": text
                })
        return segments
    except ImportError:
        raise HTTPException(500, detail="Neither faster-whisper nor openai-whisper is installed. Please install one: pip install faster-whisper OR pip install openai-whisper")

def write_transcript_jsonl(segments, output_path: Path):
    """Write transcript as JSONL format."""
    with output_path.open("w", encoding="utf-8") as f:
        for seg in segments:
            f.write(json.dumps(seg, ensure_ascii=False) + "\n")

def write_transcript_txt(segments, output_path: Path):
    """Write transcript as plain text."""
    with output_path.open("w", encoding="utf-8") as f:
        for seg in segments:
            f.write(seg["text"] + "\n")

def generate_summary(transcript_text: str, max_bullets: int = 3):
    """Generate a simple summary from transcript."""
    # Simple extractive summary - take first few sentences
    sentences = [s.strip() for s in transcript_text.split('.') if s.strip()]
    summary_text = '. '.join(sentences[:max(3, len(sentences) // 4)]) + '.'
    
    # Extract key points (simple approach)
    key_points = sentences[:max_bullets] if len(sentences) >= max_bullets else sentences
    
    return {
        "summary_short": summary_text[:200] + "..." if len(summary_text) > 200 else summary_text,
        "summary_long": summary_text,
        "key_points": key_points[:max_bullets]
    }

@app.post("/ui/run")
async def run_pipeline(
    file: UploadFile = File(...),
    org_id: str = Form("demo"),
    meeting_id: str = Form(...),
    model: str = Form("tiny"),
    max_bullets: str = Form("3"),
    num_speakers: str = Form("2")
):
    """Main pipeline endpoint that processes uploaded audio file."""
    try:
        max_bullets_int = int(max_bullets)
        num_speakers_int = int(num_speakers)
    except ValueError:
        raise HTTPException(400, detail="max_bullets and num_speakers must be integers")
    
    # Create session directory structure
    org_dir = STORAGE_ROOT / org_id
    meeting_dir = org_dir / meeting_id
    session_id = make_session_id()
    session_dir = meeting_dir / "asr" / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    
    # Create audio directory
    audio_dir = meeting_dir / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    
    # Save original file
    original_dir = meeting_dir / "original"
    original_dir.mkdir(parents=True, exist_ok=True)
    
    # Extract just the filename (in case file.filename includes a path like "meeting-audio/xxx.webm")
    # Handle both forward and backslashes, and remove any directory components
    raw_filename = file.filename or "audio.webm"
    # Replace backslashes with forward slashes, then get the last component
    filename = raw_filename.replace("\\", "/").split("/")[-1]
    # Ensure we have a valid filename
    if not filename or filename == "." or filename == "..":
        filename = "audio.webm"
    
    original_path = original_dir / filename
    
    # Ensure parent directory exists (should already exist, but double-check)
    original_path.parent.mkdir(parents=True, exist_ok=True)
    
    with original_path.open("wb") as f:
        content = await file.read()
        f.write(content)
    
    # Extract audio to WAV
    wav_path = audio_dir / f"{meeting_id}.wav"
    try:
        extract_audio_to_wav(str(original_path), str(wav_path))
    except Exception as e:
        raise HTTPException(500, detail=f"Audio extraction failed: {str(e)}")
    
    # Check if audio file exists and has content
    if not wav_path.exists():
        raise HTTPException(500, detail=f"Audio file not found: {wav_path}")
    
    file_size = wav_path.stat().st_size
    if file_size == 0:
        raise HTTPException(400, detail="Audio file is empty. Please record some audio.")
    
    # Transcribe
    try:
        segments = transcribe_audio(str(wav_path), model_name=model)
    except Exception as e:
        import traceback
        error_detail = f"Transcription failed: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(500, detail=error_detail)
    
    if not segments:
        # Check if audio file is too short or silent
        raise HTTPException(400, detail="Transcription returned no segments. This usually means:\n1. The audio file is too short or silent\n2. No speech was detected\n3. The audio quality is too poor. Please try recording again with clear audio.")
    
    # Write transcript files
    write_transcript_jsonl(segments, session_dir / "transcript.jsonl")
    transcript_text = " ".join(seg["text"] for seg in segments)
    write_transcript_txt(segments, session_dir / "transcript.txt")
    
    # Run speaker diarization if requested
    diarization_segments = []
    if num_speakers_int > 0:
        try:
            # Get HuggingFace token from config or environment
            hf_token = None
            if _config and "huggingface" in _config:
                hf_token = _config["huggingface"].get("token")
            if not hf_token:
                import os
                hf_token = os.getenv("HUGGINGFACE_TOKEN") or os.getenv("HF_TOKEN")
            
            if hf_token:
                log.info(f"Running diarization with {num_speakers_int} speakers...")
                diarization_segments = run_diarization(
                    audio_path=wav_path,
                    num_speakers=num_speakers_int if num_speakers_int > 1 else None,
                    hf_token=hf_token
                )
                
                if diarization_segments:
                    # Assign speakers to transcript segments
                    segments_with_speakers = assign_speakers_to_transcript(segments, diarization_segments)
                    
                    # Write diarized transcript
                    write_transcript_jsonl(segments_with_speakers, session_dir / "transcript_spk_pyannote.jsonl")
                    
                    # Also write speaker mapping
                    speakers = sorted(set(seg.get("speaker", "UNKNOWN") for seg in segments_with_speakers))
                    speaker_mapping = {
                        speaker: format_speaker_label(speaker)
                        for speaker in speakers
                    }
                    (session_dir / "speakers_pyannote.json").write_text(
                        json.dumps(speaker_mapping, indent=2),
                        encoding="utf-8"
                    )
                    
                    log.info(f"Diarization complete: {len(speakers)} speakers identified")
                    
                    # TODO: Expose diarization features/stats via API/UI
                    # Compute diarization features for analytics
                    try:
                        from clarimeet.analytics.diarization_features import (
                            compute_diarization_features,
                            DiarizationSegment
                        )
                        
                        # Convert diarization segments to DiarizationSegment objects
                        diar_segments = [
                            DiarizationSegment(
                                start=seg["start"],
                                end=seg["end"],
                                speaker=seg["speaker"]
                            )
                            for seg in diarization_segments
                        ]
                        
                        # Compute features
                        diar_stats = compute_diarization_features(
                            meeting_id=meeting_id,
                            segments=diar_segments,
                            total_meeting_duration_seconds=None  # Auto-compute from segments
                        )
                        
                        # Save stats to file
                        stats_file = session_dir / "diarization_stats.json"
                        stats_file.write_text(diar_stats.to_json(), encoding="utf-8")
                        log.info(f"Diarization stats saved: {stats_file}")
                    except Exception as e:
                        log.warning(f"Failed to compute diarization features (non-fatal): {e}", exc_info=True)
                else:
                    log.warning("Diarization returned no segments. Continuing without speaker labels.")
            else:
                log.warning("⚠️ HuggingFace token not found. Skipping diarization.")
                log.warning("   To enable speaker identification:")
                log.warning("   1. Install: pip install pyannote.audio")
                log.warning("   2. Get token: https://huggingface.co/settings/tokens")
                log.warning("   3. Set: export HUGGINGFACE_TOKEN='your_token'")
                log.warning("   4. Accept terms: https://huggingface.co/pyannote/speaker-diarization-3.1")
                log.warning("   5. Restart the service")
        except Exception as e:
            log.warning(f"Diarization failed (non-fatal): {e}", exc_info=True)
            # Continue without diarization
    
    # Generate summary
    summary_data = generate_summary(transcript_text, max_bullets_int)
    # === Jira & Trello integration (non-fatal if it fails) ===
    try:
        push_actions_to_tools(
            transcript_text=transcript_text,
            org_id=org_id,
            meeting_id=meeting_id,
            summary=summary_data,
        )
    except Exception as e:
        log.warning(f"Failed to push actions to Jira/Trello (non-fatal): {e}", exc_info=True)
   
    # Write summary files
    (session_dir / "summary_short.md").write_text(
        f"# TL;DR\n\n{summary_data['summary_short']}\n\n## Key Points\n\n" +
        "\n".join(f"- {point}" for point in summary_data['key_points']),
        encoding="utf-8"
    )
    (session_dir / "summary_long.md").write_text(
        f"# Meeting Summary\n\n{summary_data['summary_long']}",
        encoding="utf-8"
    )
    
    # Create meta.json
    meta = {
        "created_at": now_iso(),
        "model": {
            "whisper": model
        },
        "audio": {
            "path": str(wav_path),
            "sha256": sha256_of_file(wav_path)
        },
        "session_id": session_id,
        "org_id": org_id,
        "meeting_id": meeting_id
    }
    (session_dir / "meta.json").write_text(
        json.dumps(meta, indent=2),
        encoding="utf-8"
    )
    
    # Process whiteboard/screenshots (synchronously to ensure content is ready)
    if _HAS_WHITEBOARD:
        try:
            log.info("Processing whiteboard/screenshots synchronously...")
            whiteboard_result = process_whiteboard_for_meeting(
                meeting_dir=meeting_dir,
                org_id=org_id,
                meeting_id=meeting_id,
                process_screenshots=True,
                process_whiteboard_frames=True,
                use_change_detection=False,  # Process all screenshots, not just key frames
                enqueue_for_async=False  # Process synchronously to ensure content is ready
            )
            log.info(f"Whiteboard processing complete: {whiteboard_result['screenshots_processed']} screenshots, {whiteboard_result['ocr_jobs_enqueued']} OCR jobs")
        except Exception as e:
            log.error(f"Whiteboard processing failed: {e}", exc_info=True)
            # Don't fail the whole pipeline, but log the error
    else:
        log.warning("Whiteboard services not available. Screenshots will not be processed with OCR.")
    
    # Generate report
    try:
        report_path = render_report(session_dir, auto_open=False)
        
        # Fix audio URL in report to use HTTP instead of file://
        if report_path.exists():
            report_html = report_path.read_text(encoding="utf-8")
            
            # Replace file:// audio URLs with HTTP URLs
            if wav_path.exists():
                audio_rel_path = wav_path.relative_to(STORAGE_ROOT)
                audio_http_url = f"http://127.0.0.1:8010/report/{audio_rel_path.as_posix()}"
                
                # Find and replace file:// URLs in the audio player
                import re
                # Replace file:// URLs with HTTP URLs
                report_html = re.sub(
                    r'src=["\']file://[^"\']+/([^/]+\.wav)["\']',
                    f'src="{audio_http_url}"',
                    report_html
                )
                # Also replace any direct file:// paths
                audio_file_uri = wav_path.resolve().as_uri()
                if audio_file_uri in report_html:
                    report_html = report_html.replace(audio_file_uri, audio_http_url)
            
            report_path.write_text(report_html, encoding="utf-8")
    except Exception as e:
        # If report generation fails, still return success with session info
        report_path = session_dir / "report.html"
        if not report_path.exists():
            report_path = None
    
    # Generate HTTP URL for the report instead of file:// URL
    if report_path and report_path.exists():
        # Create a relative path from storage root
        rel_path = report_path.relative_to(STORAGE_ROOT)
        report_url = f"http://127.0.0.1:8010/report/{rel_path.as_posix()}"
    else:
        report_url = None
    
    return JSONResponse({
        "status": "success",
        "session_id": session_id,
        "report_url": report_url or f"http://127.0.0.1:8010/report/{org_id}/{meeting_id}/asr/{session_id}/report.html",
        "session_dir": str(session_dir)
    })

@app.post("/ui/test_actions")
def test_actions(org_id: str = "demo", meeting_id: str = "test_meeting"):
    """
    Simple endpoint to test Jira + Trello integration without running audio pipeline.
    """
    transcript_text = """
    We need to send the project status report to the client tomorrow.
    Advait should prepare the slides for Friday's meeting.
    Someone must update the Jira board by end of day.
    Let's follow up with the client next week about the deployment timeline.
    """

    summary_data = {
        "summary_short": "Test summary for Jira/Trello integration.",
        "key_points": [
            "Send status report to client",
            "Prepare slides for Friday",
            "Update Jira board",
            "Follow up with client next week",
        ],
    }

    # This will extract action-like sentences and push them to Jira + Trello
    push_actions_to_tools(
        transcript_text=transcript_text,
        org_id=org_id,
        meeting_id=meeting_id,
        summary=summary_data,
    )

    return {
        "status": "ok",
        "org_id": org_id,
        "meeting_id": meeting_id,
        "message": "Test actions pushed to Jira/Trello (if credentials are valid).",
    }


@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/whiteboard/process")
async def process_whiteboard(
    org_id: str = Form("demo"),
    meeting_id: str = Form(...),
    use_change_detection: str = Form("true"),
    enqueue_async: str = Form("true")
):
    """
    Process whiteboard content for a meeting.
    
    This endpoint:
    - Detects key frames using change detection (if enabled)
    - Enqueues OCR jobs for processing (if async enabled)
    - Or processes OCR synchronously (if async disabled)
    """
    if not _HAS_WHITEBOARD:
        raise HTTPException(503, detail="Whiteboard services not available")
    
    meeting_dir = STORAGE_ROOT / org_id / meeting_id
    
    if not meeting_dir.exists():
        raise HTTPException(404, detail=f"Meeting not found: {meeting_dir}")
    
    try:
        result = process_whiteboard_for_meeting(
            meeting_dir=meeting_dir,
            org_id=org_id,
            meeting_id=meeting_id,
            process_screenshots=True,
            process_whiteboard_frames=True,
            use_change_detection=use_change_detection.lower() == "true",
            enqueue_for_async=enqueue_async.lower() == "true"
        )
        return JSONResponse(result)
    except Exception as e:
        raise HTTPException(500, detail=f"Whiteboard processing failed: {str(e)}")

@app.get("/whiteboard/summary")
def get_whiteboard_summary(
    org_id: str = "demo",
    meeting_id: str = None
):
    """
    Get whiteboard summary for a meeting.
    
    Returns bullet points and checklist candidates extracted from OCR results.
    """
    if not _HAS_WHITEBOARD:
        raise HTTPException(503, detail="Whiteboard services not available")
    
    if not meeting_id:
        raise HTTPException(400, detail="meeting_id is required")
    
    meeting_dir = STORAGE_ROOT / org_id / meeting_id
    
    if not meeting_dir.exists():
        raise HTTPException(404, detail=f"Meeting not found: {meeting_dir}")
    
    try:
        summary = get_whiteboard_summary_for_meeting(
            meeting_dir=meeting_dir,
            org_id=org_id,
            meeting_id=meeting_id
        )
        return JSONResponse(summary)
    except Exception as e:
        raise HTTPException(500, detail=f"Failed to get whiteboard summary: {str(e)}")

@app.post("/report/regenerate")
async def regenerate_report(
    org_id: str = Form(...),
    meeting_id: str = Form(...),
    session_id: str = Form(...)
):
    """Regenerate report HTML for an existing session (useful when screenshots are added later)."""
    session_dir = STORAGE_ROOT / org_id / meeting_id / "asr" / session_id
    
    if not session_dir.exists():
        raise HTTPException(404, detail=f"Session not found: {session_dir}")
    
    try:
        report_path = render_report(session_dir, auto_open=False)
        
        # Fix audio URL in report to use HTTP instead of file://
        if report_path.exists():
            report_html = report_path.read_text(encoding="utf-8")
            
            # Find audio path from meta.json
            meta_path = session_dir / "meta.json"
            if meta_path.exists():
                meta = json.loads(meta_path.read_text(encoding="utf-8"))
                audio_path_str = meta.get("audio", {}).get("path", "")
                if audio_path_str:
                    wav_path = Path(audio_path_str)
                    if wav_path.exists():
                        audio_rel_path = wav_path.relative_to(STORAGE_ROOT)
                        audio_http_url = f"http://127.0.0.1:8010/report/{audio_rel_path.as_posix()}"
                        
                        import re
                        report_html = re.sub(
                            r'src=["\']file://[^"\']+/([^/]+\.wav)["\']',
                            f'src="{audio_http_url}"',
                            report_html
                        )
                        audio_file_uri = wav_path.resolve().as_uri()
                        if audio_file_uri in report_html:
                            report_html = report_html.replace(audio_file_uri, audio_http_url)
            
            report_path.write_text(report_html, encoding="utf-8")
        
        rel_path = report_path.relative_to(STORAGE_ROOT)
        report_url = f"http://127.0.0.1:8010/report/{rel_path.as_posix()}"
        
        return JSONResponse({
            "status": "success",
            "report_url": report_url,
            "session_dir": str(session_dir)
        })
    except Exception as e:
        raise HTTPException(500, detail=f"Failed to regenerate report: {str(e)}")

@app.post("/screenshot/upload")
async def upload_screenshot(
    file: UploadFile = File(...),
    org_id: str = Form("demo"),
    meeting_id: str = Form(...)
):
    """Upload and store a screenshot."""
    # Create screenshots directory structure
    org_dir = STORAGE_ROOT / org_id
    meeting_dir = org_dir / meeting_id
    screenshots_dir = meeting_dir / "screenshots"
    screenshots_dir.mkdir(parents=True, exist_ok=True)
    
    # Extract filename and ensure it's safe
    raw_filename = file.filename or "screenshot.png"
    filename = raw_filename.replace("\\", "/").split("/")[-1]
    if not filename or filename == "." or filename == "..":
        filename = "screenshot.png"
    
    # Ensure it has .png extension
    if not filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        filename = filename.rsplit('.', 1)[0] + '.png'
    
    screenshot_path = screenshots_dir / filename
    
    # Save the screenshot
    with screenshot_path.open("wb") as f:
        content = await file.read()
        f.write(content)
    
    # Return success with file info
    return JSONResponse({
        "status": "success",
        "filename": filename,
        "path": str(screenshot_path),
        "url": f"http://127.0.0.1:8010/report/{org_id}/{meeting_id}/screenshots/{filename}",
        "org_id": org_id,
        "meeting_id": meeting_id
    })

@app.get("/report/{path:path}")
def serve_report(path: str):
    """Serve report HTML files via HTTP so they can be opened from the extension."""
    report_path = STORAGE_ROOT / path
    
    # Security: ensure the path is within storage root
    try:
        report_path.resolve().relative_to(STORAGE_ROOT.resolve())
    except ValueError:
        raise HTTPException(403, detail="Access denied")
    
    if not report_path.exists():
        raise HTTPException(404, detail="Report not found")
    
    # Determine content type based on file extension
    content_type = "application/octet-stream"
    if report_path.suffix == ".html":
        content_type = "text/html"
    elif report_path.suffix == ".wav":
        content_type = "audio/wav"
    elif report_path.suffix == ".webm":
        content_type = "audio/webm"
    elif report_path.suffix == ".mp3":
        content_type = "audio/mpeg"
    elif report_path.suffix == ".json":
        content_type = "application/json"
    elif report_path.suffix == ".jsonl":
        content_type = "application/jsonl"
    elif report_path.suffix == ".txt":
        content_type = "text/plain"
    elif report_path.suffix == ".md":
        content_type = "text/markdown"
    elif report_path.suffix == ".png":
        content_type = "image/png"
    elif report_path.suffix == ".jpg" or report_path.suffix == ".jpeg":
        content_type = "image/jpeg"
    elif report_path.suffix == ".gif":
        content_type = "image/gif"
    elif report_path.suffix == ".webp":
        content_type = "image/webp"
    elif report_path.suffix == ".svg":
        content_type = "image/svg+xml"
    elif report_path.suffix in [".png", ".jpg", ".jpeg", ".gif", ".webp"]:
        if report_path.suffix == ".png":
            content_type = "image/png"
        elif report_path.suffix in [".jpg", ".jpeg"]:
            content_type = "image/jpeg"
        elif report_path.suffix == ".gif":
            content_type = "image/gif"
        elif report_path.suffix == ".webp":
            content_type = "image/webp"
    
    return FileResponse(
        report_path,
        media_type=content_type,
        headers={"Cache-Control": "no-cache"}
    )

# ================== Ingest API Endpoints ==================
# Integrated ingest endpoints for live meeting audio

# Security for ingest API
ingest_security = HTTPBearer(auto_error=False)
INGEST_API_TOKEN = os.getenv("CLARIMEET_INGEST_API_TOKEN", "dev-token-change-in-production")

def verify_ingest_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(ingest_security)) -> bool:
    """Verify API token for ingest endpoints."""
    if not credentials:
        if INGEST_API_TOKEN == "dev-token-change-in-production":
            return True
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    if credentials.credentials != INGEST_API_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid API token")
    return True

class AudioChunkRequest(BaseModel):
    """Request model for audio chunk ingestion."""
    meeting_id: str
    sequence_number: int
    timestamp_ms: int
    audio_data: str  # Base64 encoded
    audio_format: str = "pcm"
    sample_rate: int = 16000
    channels: int = 1
    participant_id: Optional[str] = None
    source: str = "unknown"
    platform_meeting_id: Optional[str] = None

class IngestResponse(BaseModel):
    """Response model for ingest operations."""
    success: bool
    message: str
    chunk_id: Optional[str] = None

@app.post("/api/ingest/audio-chunk", response_model=IngestResponse)
async def ingest_audio_chunk(
    chunk: AudioChunkRequest,
    authenticated: bool = Depends(verify_ingest_token)
):
    """Ingest a single audio chunk via HTTP POST."""
    try:
        from workers.queues import enqueue_transcript_chunk
        
        audio_bytes = base64.b64decode(chunk.audio_data)
        if len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="Audio data is empty")
        
        chunk_dict = {
            "meeting_id": chunk.meeting_id,
            "sequence_number": chunk.sequence_number,
            "timestamp_ms": chunk.timestamp_ms,
            "audio_data": audio_bytes,
            "audio_format": chunk.audio_format,
            "sample_rate": chunk.sample_rate,
            "channels": chunk.channels,
            "participant_id": chunk.participant_id,
            "source": chunk.source,
            "platform_meeting_id": chunk.platform_meeting_id,
        }
        
        success = enqueue_transcript_chunk(chunk_dict)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to enqueue audio chunk")
        
        chunk_id = f"{chunk.meeting_id}_{chunk.sequence_number}_{chunk.timestamp_ms}"
        log.info(f"Ingested audio chunk: meeting={chunk.meeting_id} seq={chunk.sequence_number} source={chunk.source}")
        
        return IngestResponse(
            success=True,
            message="Audio chunk enqueued successfully",
            chunk_id=chunk_id
        )
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Error ingesting audio chunk: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.websocket("/ws/ingest/audio")
async def websocket_ingest_audio(websocket: WebSocket):
    """WebSocket endpoint for streaming audio chunks."""
    await websocket.accept()
    
    authenticated = False
    meeting_id = None
    chunks_received = 0
    
    try:
        from workers.queues import enqueue_transcript_chunk
        
        auth_msg = await websocket.receive_json()
        if auth_msg.get("type") == "auth":
            token = auth_msg.get("token")
            if token == INGEST_API_TOKEN or INGEST_API_TOKEN == "dev-token-change-in-production":
                authenticated = True
                await websocket.send_json({"type": "auth", "status": "ok"})
            else:
                await websocket.send_json({"type": "auth", "status": "error", "message": "Invalid token"})
                await websocket.close(code=1008, reason="Authentication failed")
                return
        else:
            if INGEST_API_TOKEN == "dev-token-change-in-production":
                authenticated = True
                auth_msg = None
            else:
                await websocket.send_json({"type": "error", "message": "Authentication required"})
                await websocket.close(code=1008, reason="Authentication required")
                return
        
        while True:
            if auth_msg:
                msg = auth_msg
                auth_msg = None
            else:
                msg = await websocket.receive_json()
            
            msg_type = msg.get("type")
            
            if msg_type == "chunk":
                try:
                    audio_bytes = base64.b64decode(msg.get("audio_data", ""))
                    if len(audio_bytes) == 0:
                        await websocket.send_json({"type": "error", "message": "Empty audio data"})
                        continue
                    
                    chunk_dict = {
                        "meeting_id": msg.get("meeting_id"),
                        "sequence_number": msg.get("sequence_number", 0),
                        "timestamp_ms": msg.get("timestamp_ms", 0),
                        "audio_data": audio_bytes,
                        "audio_format": msg.get("audio_format", "pcm"),
                        "sample_rate": msg.get("sample_rate", 16000),
                        "channels": msg.get("channels", 1),
                        "participant_id": msg.get("participant_id"),
                        "source": msg.get("source", "unknown"),
                        "platform_meeting_id": msg.get("platform_meeting_id"),
                    }
                    
                    if not meeting_id:
                        meeting_id = chunk_dict["meeting_id"]
                    
                    success = enqueue_transcript_chunk(chunk_dict)
                    if success:
                        chunks_received += 1
                        await websocket.send_json({
                            "type": "ack",
                            "sequence_number": chunk_dict["sequence_number"],
                            "chunks_received": chunks_received
                        })
                    else:
                        await websocket.send_json({"type": "error", "message": "Failed to enqueue chunk"})
                except Exception as e:
                    log.error(f"Error processing WebSocket chunk: {e}", exc_info=True)
                    await websocket.send_json({"type": "error", "message": f"Processing error: {str(e)}"})
            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})
            elif msg_type == "close":
                break
            else:
                await websocket.send_json({"type": "error", "message": f"Unknown message type: {msg_type}"})
    
    except WebSocketDisconnect:
        log.info(f"WebSocket disconnected: meeting={meeting_id} chunks={chunks_received}")
    except Exception as e:
        log.error(f"WebSocket error: {e}", exc_info=True)
    finally:
        try:
            await websocket.close()
        except:
            pass

@app.get("/api/ingest/health")
async def ingest_health_check():
    """Health check for ingest API."""
    return {"status": "ok", "service": "ingest"}

# Web UI endpoints
@app.get("/")
async def serve_web_ui():
    """Serve the main web UI."""
    index_path = WEB_DIR / "templates" / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return HTMLResponse("""
    <html>
        <head><title>ClariMeet</title></head>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #0a0e27; color: #fff;">
            <h1>ClariMeet Web UI</h1>
            <p>Web UI files not found. Please ensure web/templates/index.html exists.</p>
        </body>
    </html>
    """)

@app.get("/api/meetings")
async def get_meetings(org_id: str = "demo"):
    """Get list of meetings."""
    org_dir = STORAGE_ROOT / org_id
    meetings = []
    
    if org_dir.exists():
        for meeting_dir in org_dir.iterdir():
            if meeting_dir.is_dir():
                asr_dir = meeting_dir / "asr"
                if asr_dir.exists():
                    # Get latest session
                    sessions = sorted(asr_dir.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True)
                    if sessions:
                        latest_session = sessions[0]
                        meta_path = latest_session / "meta.json"
                        if meta_path.exists():
                            try:
                                meta = json.loads(meta_path.read_text())
                                created_at = meta.get("created_at", "")
                                date_part = created_at.split("T")[0] if "T" in created_at else ""
                                time_part = created_at.split("T")[1][:5] if "T" in created_at and len(created_at.split("T")) > 1 else ""
                                
                                created_datetime = None
                                if created_at:
                                    try:
                                        # Parse ISO format datetime
                                        if "T" in created_at:
                                            # Handle Z suffix (UTC)
                                            dt_str = created_at.replace("Z", "+00:00")
                                            created_datetime = datetime.fromisoformat(dt_str)
                                        else:
                                            created_datetime = datetime.fromisoformat(created_at)
                                    except Exception as e:
                                        log.debug(f"Error parsing datetime {created_at}: {e}")
                                        # Fallback: use current time
                                        created_datetime = datetime.now()
                                
                                # Use datetime for sorting, fallback to created_at string
                                sort_key = created_datetime if created_datetime else created_at
                                
                                meetings.append({
                                    "id": meeting_dir.name,
                                    "name": meeting_dir.name,
                                    "date": date_part,
                                    "time": time_part,
                                    "datetime": created_datetime.isoformat() if created_datetime else created_at,
                                    "sort_datetime": created_datetime,  # For sorting
                                    "duration": f"{meta.get('duration_seconds', 0) // 60}m",
                                    "participants": meta.get("num_speakers", 0),
                                    "status": "completed"
                                })
                            except Exception as e:
                                log.debug(f"Error loading meeting {meeting_dir.name}: {e}")
                                pass
    
    # Sort meetings by datetime (ascending - oldest first)
    def get_sort_key(m):
        dt = m.get("sort_datetime")
        if dt:
            return dt
        # Fallback to datetime string
        dt_str = m.get("datetime", "")
        if dt_str:
            try:
                return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
            except:
                pass
        # Last resort: use date + time
        return f"{m.get('date', '')} {m.get('time', '')}"
    
    meetings.sort(key=get_sort_key, reverse=False)
    
    return {"meetings": meetings}

@app.get("/api/meeting/{meeting_id}")
async def get_meeting_details(meeting_id: str, org_id: str = "demo"):
    """Get meeting details including transcript and summary."""
    # URL decode the meeting_id to handle special characters
    meeting_id = unquote(meeting_id)
    
    org_dir = STORAGE_ROOT / org_id
    meeting_dir = org_dir / meeting_id
    asr_dir = meeting_dir / "asr"
    
    log.debug(f"Looking for meeting: org={org_id}, meeting_id={meeting_id}, path={meeting_dir}")
    
    if not meeting_dir.exists():
        log.warning(f"Meeting directory not found: {meeting_dir}")
        raise HTTPException(404, detail=f"Meeting directory not found: {meeting_id}")
    
    if not asr_dir.exists():
        log.warning(f"ASR directory not found: {asr_dir}")
        raise HTTPException(404, detail=f"ASR directory not found for meeting: {meeting_id}")
    
    # Get latest session
    sessions = sorted(asr_dir.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True)
    if not sessions:
        raise HTTPException(404, detail="No sessions found")
    
    latest_session = sessions[0]
    
    # Load transcript
    transcript_path = latest_session / "transcript_spk_pyannote.jsonl"
    if not transcript_path.exists():
        transcript_path = latest_session / "transcript.jsonl"
    
    transcript_text = ""
    transcript_segments = []
    if transcript_path.exists():
        try:
            lines = transcript_path.read_text().strip().split("\n")
            transcript_segments = [json.loads(line) for line in lines if line.strip()]
            transcript_text = " ".join(seg.get("text", "") for seg in transcript_segments)
        except Exception as e:
            log.debug(f"Error loading transcript: {e}")
    
    # Load summary
    summary_path = latest_session / "summary_long.md"
    summary_text = ""
    if summary_path.exists():
        summary_text = summary_path.read_text()
        # Remove markdown heading if present (e.g., "# Meeting Summary\n\n")
        summary_text = summary_text.strip()
        # Remove common markdown headings
        if summary_text.startswith("# Meeting Summary"):
            summary_text = summary_text.replace("# Meeting Summary", "", 1).strip()
        elif summary_text.startswith("## Meeting Summary"):
            summary_text = summary_text.replace("## Meeting Summary", "", 1).strip()
        elif summary_text.startswith("**# Meeting Summary**"):
            summary_text = summary_text.replace("**# Meeting Summary**", "", 1).strip()
        # Remove leading newlines and markdown formatting
        summary_text = summary_text.lstrip("\n#* ").strip()
    
    # Load meta
    meta_path = latest_session / "meta.json"
    meta = {}
    if meta_path.exists():
        try:
            meta = json.loads(meta_path.read_text())
        except Exception as e:
            log.debug(f"Error loading meta: {e}")
    
    created_at = meta.get("created_at", "")
    date_part = created_at.split("T")[0] if "T" in created_at else ""
    time_part = created_at.split("T")[1][:5] if "T" in created_at and len(created_at.split("T")) > 1 else ""
    
    return {
        "id": meeting_id,
        "name": meeting_id,
        "date": date_part,
        "time": time_part,
        "duration": f"{meta.get('duration_seconds', 0) // 60}m",
        "status": "completed",
        "transcript": transcript_text,
        "transcript_segments": transcript_segments,  # Include segments for dialog-wise display
        "summary": summary_text
    }

@app.post("/api/ai/chat")
async def ai_chat(request: dict):
    """AI chat endpoint for meeting analysis and assistance."""
    message = request.get("message", "").strip().lower()
    history = request.get("history", [])
    
    if not message:
        raise HTTPException(400, detail="Message is required")
    
    # Get all meetings for context
    org_dir = STORAGE_ROOT / "demo"
    meetings_data = []
    
    if org_dir.exists():
        for meeting_dir in org_dir.iterdir():
            if meeting_dir.is_dir():
                asr_dir = meeting_dir / "asr"
                if asr_dir.exists():
                    sessions = sorted(asr_dir.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True)
                    if sessions:
                        latest_session = sessions[0]
                        meta_path = latest_session / "meta.json"
                        summary_path = latest_session / "summary_long.md"
                        transcript_path = latest_session / "transcript.txt"
                        
                        meeting_info = {
                            "id": meeting_dir.name,
                            "name": meeting_dir.name
                        }
                        
                        if meta_path.exists():
                            try:
                                meta = json.loads(meta_path.read_text())
                                meeting_info["date"] = meta.get("created_at", "")
                                meeting_info["duration"] = meta.get("duration_seconds", 0)
                            except:
                                pass
                        
                        if summary_path.exists():
                            summary_text = summary_path.read_text()
                            # Remove markdown heading
                            summary_text = summary_text.replace("# Meeting Summary", "").strip()
                            meeting_info["summary"] = summary_text[:500]  # First 500 chars
                        
                        if transcript_path.exists():
                            transcript_text = transcript_path.read_text()
                            meeting_info["transcript_preview"] = transcript_text[:300]  # First 300 chars
                        
                        meetings_data.append(meeting_info)
    
    # Intelligent response based on user query
    response = generate_ai_response(message, meetings_data, history)
    
    return JSONResponse({"response": response})

def generate_ai_response(message: str, meetings_data: list, history: list) -> str:
    """Generate intelligent AI response based on user query and meeting data."""
    
    # Check for specific intents
    if "summar" in message or "summary" in message:
        if not meetings_data:
            return "I don't see any meetings in your account yet. Record a meeting first to get summaries!"
        
        response = "Here are concise summaries for each meeting:\n\n"
        for i, meeting in enumerate(meetings_data[:10], 1):  # Limit to 10 most recent
            date_str = meeting.get("date", "Unknown date")
            if "T" in date_str:
                date_str = date_str.split("T")[0]
            
            summary = meeting.get("summary", "No summary available")
            if len(summary) > 200:
                summary = summary[:200] + "..."
            
            response += f"{i}. **{meeting['name']}** ({date_str})\n"
            response += f"   • Main points: {summary}\n\n"
        
        return response
    
    elif "action" in message or "todo" in message or "task" in message:
        if not meetings_data:
            return "I don't see any meetings yet. Record a meeting to extract action items!"
        
        response = "Here are action items I found across your meetings:\n\n"
        action_count = 0
        for meeting in meetings_data[:5]:
            transcript = meeting.get("transcript_preview", "")
            # Simple extraction - look for action words
            if any(word in transcript.lower() for word in ["need to", "should", "will", "must", "let's", "action"]):
                action_count += 1
                response += f"• From '{meeting['name']}': Check transcript for specific action items\n"
        
        if action_count == 0:
            response += "No explicit action items found. Would you like me to analyze a specific meeting transcript?"
        
        return response
    
    elif "clean" in message or "transcript" in message:
        return "I can help clean up transcripts! Here's what I can do:\n\n• Remove filler words (um, uh, like)\n• Fix grammar and punctuation\n• Format for readability\n• Extract key points\n\nWhich meeting transcript would you like me to clean?"
    
    elif "email" in message or "draft" in message:
        if not meetings_data:
            return "I need meeting data to draft an email. Record a meeting first!"
        
        latest = meetings_data[0] if meetings_data else None
        if latest:
            summary = latest.get("summary", "Meeting summary")
            date = latest.get("date", "").split("T")[0] if "T" in latest.get("date", "") else "recent"
            
            email_draft = f"""Subject: Meeting Summary - {date}

Hi Team,

Here's a summary of our recent meeting:

{summary[:300]}

Best regards,
Team"""
            
            return f"Here's a draft email based on your latest meeting:\n\n```\n{email_draft}\n```"
        else:
            return "I can draft emails based on meeting summaries. Which meeting would you like me to use?"
    
    elif "help" in message or "what can" in message:
        return """I'm ClariMeet AI! I can help you with:

📋 **Summarise meetings** - Get concise summaries of all your meetings
✅ **Extract action items** - Find tasks and action items from transcripts  
🧹 **Clean transcript** - Format and clean up transcript text
📧 **Draft an email** - Create email drafts from meeting summaries
🔍 **Answer questions** - Ask me anything about your meetings

Just type what you'd like me to do, or click one of the quick action buttons!"""
    
    else:
        # General response
        if meetings_data:
            return f"I found {len(meetings_data)} meeting(s) in your account. I can help you:\n\n• Summarize meetings\n• Extract action items\n• Clean transcripts\n• Draft emails\n• Answer questions about your meetings\n\nWhat would you like me to do?"
        else:
            return "Hi! I'm ClariMeet AI. I can help you analyze your meetings once you've recorded some. Try asking me to:\n\n• Summarise meetings\n• Extract action items\n• Clean transcripts\n• Draft emails\n\nOr just ask me anything!"

@app.get("/api/meeting/{meeting_id}/download")
async def download_meeting_report(meeting_id: str, org_id: str = "demo", file_type: str = "report"):
    """Download meeting report, summary, or transcript."""
    meeting_id = unquote(meeting_id)
    
    org_dir = STORAGE_ROOT / org_id
    meeting_dir = org_dir / meeting_id
    
    if not meeting_dir.exists():
        raise HTTPException(404, detail=f"Meeting not found: {meeting_id}")
    
    # Find latest session
    asr_dir = meeting_dir / "asr"
    if not asr_dir.exists():
        raise HTTPException(404, detail="No transcriptions found for this meeting")
    
    sessions = sorted(asr_dir.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True)
    if not sessions:
        raise HTTPException(404, detail="No sessions found")
    
    latest_session = sessions[0]
    
    # Determine which file to download
    if file_type == "report":
        file_path = latest_session / "report.html"
        filename = f"{meeting_id}_report.html"
        media_type = "text/html"
    elif file_type == "summary":
        file_path = latest_session / "summary_long.md"
        if not file_path.exists():
            file_path = latest_session / "summary_short.md"
        filename = f"{meeting_id}_summary.md"
        media_type = "text/markdown"
    elif file_type == "transcript":
        file_path = latest_session / "transcript.txt"
        if not file_path.exists():
            file_path = latest_session / "transcript.jsonl"
        filename = f"{meeting_id}_transcript.txt"
        media_type = "text/plain"
    else:
        raise HTTPException(400, detail=f"Invalid file_type: {file_type}. Must be 'report', 'summary', or 'transcript'")
    
    if not file_path.exists():
        raise HTTPException(404, detail=f"{file_type.capitalize()} file not found")
    
    return FileResponse(
        file_path,
        media_type=media_type,
        filename=filename,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache"
        }
    )

@app.get("/api/meeting/{meeting_id}/whiteboard")
async def get_meeting_whiteboard(meeting_id: str, org_id: str = "demo"):
    """Get whiteboard screenshots and OCR notes for a meeting."""
    meeting_id = unquote(meeting_id)
    
    org_dir = STORAGE_ROOT / org_id
    meeting_dir = org_dir / meeting_id
    
    if not meeting_dir.exists():
        raise HTTPException(404, detail=f"Meeting not found: {meeting_id}")
    
    whiteboard_items = []
    
    # Load from whiteboard/wb_items.jsonl
    wb_items_path = meeting_dir / "whiteboard" / "wb_items.jsonl"
    if wb_items_path.exists():
        try:
            with wb_items_path.open("r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        item = json.loads(line)
                        # Construct HTTP URL for the image
                        rel_path = item.get("path", "")
                        if rel_path:
                            # Path is relative to meeting_dir, e.g., "whiteboard/frames/frame_001.png"
                            http_url = f"http://127.0.0.1:8010/report/{org_id}/{meeting_id}/{rel_path}"
                            whiteboard_items.append({
                                "index": item.get("index", 0),
                                "path": rel_path,
                                "image_url": http_url,
                                "ocr_text": item.get("ocr_text", ""),
                                "timestamp_hint": item.get("timestamp_hint")
                            })
        except Exception as e:
            log.debug(f"Error loading whiteboard items: {e}")
    
    # Also load screenshots from screenshots directory
    screenshots_dir = meeting_dir / "screenshots"
    if screenshots_dir.exists():
        screenshot_files = sorted(screenshots_dir.glob("*.png")) + sorted(screenshots_dir.glob("*.jpg")) + sorted(screenshots_dir.glob("*.jpeg"))
        for idx, screenshot_path in enumerate(screenshot_files):
            http_url = f"http://127.0.0.1:8010/report/{org_id}/{meeting_id}/screenshots/{screenshot_path.name}"
            
            # Try to load OCR results from multiple possible locations
            ocr_text = ""
            
            # Try whiteboard/ocr directory first
            ocr_path = meeting_dir / "whiteboard" / "ocr" / f"{screenshot_path.stem}.json"
            if not ocr_path.exists():
                # Try screenshots directory
                ocr_path = meeting_dir / "screenshots" / f"{screenshot_path.stem}.json"
            if not ocr_path.exists():
                # Try root whiteboard directory
                ocr_path = meeting_dir / "whiteboard" / f"{screenshot_path.stem}.json"
            
            if ocr_path.exists():
                try:
                    ocr_data = json.loads(ocr_path.read_text())
                    # Extract text from OCR result - handle different formats
                    if isinstance(ocr_data, dict):
                        # Try different possible keys (full_text is common in EasyOCR results)
                        ocr_text = (ocr_data.get("full_text", "") or
                                   ocr_data.get("text", "") or 
                                   ocr_data.get("ocr_text", "") or
                                   ocr_data.get("extracted_text", "") or
                                   ocr_data.get("content", ""))
                        
                        # If it's a list of blocks, extract text from each
                        if isinstance(ocr_text, list):
                            ocr_text = " ".join(str(t.get("text", t) if isinstance(t, dict) else t) for t in ocr_text if t)
                        
                        # If there are text_blocks, extract from them
                        if not ocr_text and "text_blocks" in ocr_data:
                            blocks = ocr_data.get("text_blocks", [])
                            texts = []
                            for block in blocks:
                                if isinstance(block, dict):
                                    block_text = block.get("text", "") or block.get("ocr_text", "")
                                    if block_text:
                                        texts.append(str(block_text))
                            ocr_text = " ".join(texts)
                        
                        # If there are blocks with text, extract from them
                        if not ocr_text and "blocks" in ocr_data:
                            blocks = ocr_data.get("blocks", [])
                            texts = []
                            for block in blocks:
                                if isinstance(block, dict):
                                    block_text = block.get("text", "") or block.get("ocr_text", "")
                                    if block_text:
                                        texts.append(str(block_text))
                            ocr_text = " ".join(texts)
                            
                except Exception as e:
                    log.debug(f"Error loading OCR for {screenshot_path.name}: {e}")
            
            whiteboard_items.append({
                "index": len(whiteboard_items),
                "path": f"screenshots/{screenshot_path.name}",
                "image_url": http_url,
                "ocr_text": ocr_text,
                "timestamp_hint": None
            })
    
    # Sort by index
    whiteboard_items.sort(key=lambda x: x.get("index", 0))
    
    return {
        "meeting_id": meeting_id,
        "count": len(whiteboard_items),
        "items": whiteboard_items
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8010)

