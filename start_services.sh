#!/usr/bin/env bash
set -euo pipefail

# --- config ---
PORT_UPLOAD=8001
PORT_REPORT=8004
PORT_PIPE=8006
PORT_DASH=8010

# Optional: set your HF token here (or via clarimeet.json)
# export HF_TOKEN="hf_xxx"

# Activate venv (Git Bash on Windows)
if [ -f ".venv/Scripts/activate" ]; then
  # shellcheck disable=SC1091
  source .venv/Scripts/activate
fi

# Colored echo
say() { printf "\033[1;36m%s\033[0m\n" "$*"; }

# Start a service and record its PID
pids=()
start_srv () {
  local name="$1"; shift
  say "▶ starting $name ..."
  "$@" &                        # run in background
  pids+=($!)                    # capture PID
}

# --- launch services ---
start_srv "upload_extract (:$PORT_UPLOAD)" \
  uvicorn services.upload_extract.main:app --host 0.0.0.0 --port "$PORT_UPLOAD" --reload
start_srv "report_export (:$PORT_REPORT)" \
  uvicorn services.report_export.main:app --host 0.0.0.0 --port "$PORT_REPORT" --reload
start_srv "pipeline (:$PORT_PIPE)" \
  uvicorn services.pipeline.main:app --host 0.0.0.0 --port "$PORT_PIPE" --reload
start_srv "dash (:$PORT_DASH)" \
  uvicorn services.dash.main:app --host 0.0.0.0 --port "$PORT_DASH" --reload

say "✅ all services started:
- upload_extract  http://127.0.0.1:$PORT_UPLOAD/health
- export_report   http://127.0.0.1:$PORT_REPORT/health
- pipeline        http://127.0.0.1:$PORT_PIPE/health
- dash UI         http://127.0.0.1:$PORT_DASH/"

# Graceful shutdown on Ctrl+C
cleanup () {
  say "⏹ stopping services..."
  # Try POSIX kill for each PID; ignore errors if already stopped
  for pid in "${pids[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  # Extra safety on Windows: kill any uvicorn left (requires cmd.exe)
  command -v cmd.exe >/dev/null 2>&1 && \
    cmd.exe /c "taskkill /F /IM uvicorn.exe >NUL 2>&1" || true
  say "bye!"
}
trap cleanup INT TERM

# Wait for background services
wait
