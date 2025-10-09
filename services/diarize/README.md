# Diarization API

POST /api/diarize/run → runs pyannote diarization on a session (or the latest session) and writes:
- transcript_spk_pyannote.jsonl
- captions_spk_pyannote.srt
- speakers_pyannote.json

## Run

```bash
cd /c/Users/utsav/Desktop/Project/clarimeet-step1
source .venv/Scripts/activate
pip install fastapi uvicorn
pip install -e .
uvicorn services.diarize.main:app --host 0.0.0.0 --port 8003 --reload
