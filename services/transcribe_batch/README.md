# Transcription Job API

Endpoints:
- POST /api/transcribe/batch
- GET  /api/meetings/{meeting}/asr/latest
- GET  /api/meetings/{meeting}/asr/sessions

## Run

```bash
cd /c/Users/utsav/Desktop/Project/clarimeet-step1
source .venv/Scripts/activate
pip install fastapi uvicorn
pip install -e .
uvicorn services.transcribe_batch.main:app --host 0.0.0.0 --port 8002 --reload
