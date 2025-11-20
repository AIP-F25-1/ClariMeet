import base64, io, json
from pathlib import Path
from typing import Tuple
from PIL import Image

def b64_to_pil(b64_str: str) -> Image.Image:
    """Decode base64 PNG/JPEG into a PIL Image (RGB)."""
    data = base64.b64decode(b64_str)
    img = Image.open(io.BytesIO(data))
    if img.mode != "RGB":
        img = img.convert("RGB")
    return img

def ensure_dirs(root: Path, meeting_id: str) -> Tuple[Path, Path]:
    """Create /frames and /snapshots dirs for a meeting and return their paths."""
    frames_dir = root / "whiteboard" / meeting_id / "frames"
    snaps_dir = root / "whiteboard" / meeting_id / "snapshots"
    frames_dir.mkdir(parents=True, exist_ok=True)
    snaps_dir.mkdir(parents=True, exist_ok=True)
    return frames_dir, snaps_dir

def write_json(path: Path, obj: dict):
    """Write JSON with UTF-8 and nice indent."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
