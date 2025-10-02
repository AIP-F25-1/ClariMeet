import subprocess
import signal
import sys
import yaml
from pathlib import Path

CONFIG_FILE = Path(__file__).parent / "service_config.yaml"

processes = []

def load_config():
    """Load list of services from YAML config file."""
    with open(CONFIG_FILE, "r") as f:
        cfg = yaml.safe_load(f)
    return cfg.get("services", [])

def start_services():
    """Start all services listed in config."""
    global processes
    services = load_config()

    for svc in services:
        print(f"[AutoService] Starting: {svc}")
        proc = subprocess.Popen(svc, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        processes.append(proc)

def stop_services(signum=None, frame=None):
    """Stop all running services."""
    global processes
    print("[AutoService] Stopping services...")
    for proc in processes:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
    processes.clear()
    sys.exit(0)

def main():
    """Main loop for auto service manager."""
    signal.signal(signal.SIGINT, stop_services)
    signal.signal(signal.SIGTERM, stop_services)

    start_services()
    print("[AutoService] All services started. Press Ctrl+C to stop.")

    # Keep running until killed
    try:
        while True:
            for proc in processes:
                if proc.poll() is not None:
                    print(f"[AutoService] Service exited unexpectedly: {proc.args}")
            # Sleep a bit
            import time; time.sleep(2)
    except KeyboardInterrupt:
        stop_services()

if __name__ == "__main__":
    main()
