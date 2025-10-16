from __future__ import annotations
from pathlib import Path
import json
from typing import Any, Dict, Optional

_DEFAULT_LOCATIONS = [
    Path("./clarimeet.json"),
    Path.home() / ".clarimeet" / "clarimeet.json",
]

def _read_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}

def load_config(config_path: Optional[str]) -> dict:
    """Load configuration from an explicit path or common defaults.
    Returns {} if no config found or parse fails."""
    if config_path:
        p = Path(config_path)
        if p.exists():
            return _read_json(p)
        return {}
    for p in _DEFAULT_LOCATIONS:
        if p.exists():
            return _read_json(p)
    return {}

def get_cfg(d: dict, *keys, default=None):
    cur = d
    for k in keys:
        if not isinstance(cur, dict) or k not in cur:
            return default
        cur = cur[k]
    return cur or default
