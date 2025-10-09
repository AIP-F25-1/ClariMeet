# Export & Report API

Endpoints:
- POST /api/export/vtt        → writes a .vtt (auto-picks speaker variant if present)
- POST /api/report/render     → renders report.html for the session
- GET  /api/report/file       → serves the report.html (renders on-demand if missing)

## Run
```bash
cd /c/Users/utsav/Desktop/Project/clarimeet-step1
source .venv/Scripts/activate
pip install fastapi uvicorn
pip install -e .
uvicorn services.export_report.main:app --host 0.0.0.0 --port 8004 --reload
