# Auto Service Manager (Person 4)

## Purpose
This script ensures all required ClariMeet services (Redis, ASR, report server, etc.) start automatically, instead of being run manually.

## Files
- `src/clarimeet/auto_service.py` → Main manager to start/stop services
- `src/clarimeet/service_config.yaml` → List of services to launch
- `tests/test_auto_service.py` → Unit tests with mocks
- `docs/AUTOSERVICE.md` → This doc

## Usage
1. Edit `service_config.yaml` to list the services.
   ```bash
   python src/clarimeet/auto_service.py
