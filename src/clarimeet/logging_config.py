import logging
import sys
from pathlib import Path

def setup_logging(verbosity: int = 0, log_file: str | Path | None = None) -> None:
    level = logging.WARNING
    if verbosity == 1:
        level = logging.INFO
    elif verbosity >= 2:
        level = logging.DEBUG

    fmt = logging.Formatter("[%(levelname)s] %(asctime)s %(name)s: %(message)s")

    root = logging.getLogger()
    root.setLevel(level)

    # Avoid duplicate handlers if called twice
    def _already(hcls): return any(isinstance(h, hcls) for h in root.handlers)

    if not _already(logging.StreamHandler):
        sh = logging.StreamHandler(stream=sys.stdout)
        sh.setFormatter(fmt)
        root.addHandler(sh)

    if log_file is not None and not _already(logging.FileHandler):
        lf = Path(log_file)
        lf.parent.mkdir(parents=True, exist_ok=True)
        fh = logging.FileHandler(lf, encoding="utf-8")
        fh.setFormatter(fmt)
        root.addHandler(fh)
