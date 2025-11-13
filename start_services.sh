#!/usr/bin/env bash
set -euo pipefail

# -----------------------------
# Load .env (LLM keys, model, etc.)
# -----------------------------
set -a
[ -f .env ] && source .env
set +a

# -----------------------------
# Ports (override via env if you want)
# -----------------------------
PORT_UPLOAD="${PORT_UPLOAD:-8001}"
PORT_REPORT="${PORT_REPORT:-8004}"
PORT_PIPE="${PORT_PIPE:-8006}"
PORT_DASH="${PORT_DASH:-8010}"

# -----------------------------
# Optional: surface key config (non-secret)
# -----------------------------
echo "== ClariMeet =="
echo "LLM base : ${CLARIMEET_LLM_BASE:-<default>}"
echo "LLM model: ${CLARIMEET_LLM_MODEL:-<unset>}"
echo "Storage  : ${CLARIMEET_STORAGE:-storage}"
echo

# -----------------------------
# Activate venv (Git Bash on Windows / POSIX)
# -----------------------------
if [ -f ".venv/Scripts/activate" ]; then
  # shellcheck disable=SC1091
  source .venv/Scripts/activate
elif [ -f ".venv/bin/activate" ]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

# -----------------------------
# Small helper
# -----------------------------
say() { printf "\033[1;36m%s\033[0m\n" "$*"; }

# Track PIDs for graceful shutdown
pids=()
start_srv () {
  local name="$1"; shift
  say "▶ starting $name ..."
  "$@" &                # background
  pids+=($!)            # remember PID
}

# -----------------------------
# Launch services
# -----------------------------
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

# -----------------------------
# Graceful shutdown
# -----------------------------
cleanup () {
  say "⏹ stopping services..."
  for pid in "${pids[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  # Extra safety on Windows: ensure uvicorn.exe is gone
  command -v cmd.exe >/dev/null 2>&1 && \
    cmd.exe /c "taskkill /F /IM uvicorn.exe >NUL 2>&1" || true
  say "bye!"
}
trap cleanup INT TERM

wait
