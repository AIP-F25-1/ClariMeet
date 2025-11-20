from __future__ import annotations
from pathlib import Path
from datetime import datetime
import hashlib

def make_session_id(prefix: str = "cm") -> str:
    # e.g., cm_20250923_114500
    return f"{prefix}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

def now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"

def sha256_of_file(path: str | Path, chunk_size: int = 1 << 20) -> str:
    p = Path(path)
    h = hashlib.sha256()
    with p.open("rb") as f:
        while True:
            b = f.read(chunk_size)
            if not b:
                break
            h.update(b)
    return h.hexdigest()


import os, random

def seed_everything(seed: int | None) -> None:
    """Best-effort reproducibility across Python/Torch/NumPy if present."""
    if seed is None:
        return
    os.environ["PYTHONHASHSEED"] = str(seed)
    try:
        import numpy as np  # optional
        np.random.seed(seed)
    except Exception:
        pass
    try:
        import torch  # optional
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)
        # These can impact performance; safe on CPU paths
        try:
            torch.use_deterministic_algorithms(True)
        except Exception:
            pass
    except Exception:
        pass
    random.seed(seed)
