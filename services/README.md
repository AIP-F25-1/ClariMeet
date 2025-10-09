# Services (FastAPI)

- **Upload & Extract**: `services/upload_extract/main.py` → port 8001 (video → 16kHz mono WAV)
- **Transcribe (Whisper)**: `services/transcribe_batch/main.py` → port 8002
- **Diarize (pyannote)**: `services/diarize/main.py` → port 8003
- **Summarize**: `services/summarize_api/main.py` → port 8004
- **Report & Export**: `services/report_export/main.py` → port 8005
- **Pipeline (end-to-end)**: `services/pipeline/main.py` → port 8006
- **Dash UI**: `services/dash/main.py` (+ `services/dash/static/index.html`) → port 8010

These services depend on the `clarimeet` core package (in `src/clarimeet`). Teammates will add core modules and requirements.
