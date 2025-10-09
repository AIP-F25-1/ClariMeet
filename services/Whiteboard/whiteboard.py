from dataclasses import dataclass, asdict
from typing import List, Dict
from pathlib import Path
import numpy as np
import cv2
import pytesseract
from skimage.metrics import structural_similarity as ssim
from PIL import Image
import json

# If OCR returns empty text on macOS, you can optionally point directly to the binary:
# pytesseract.pytesseract.tesseract_cmd = "/opt/homebrew/bin/tesseract"

# ---- Data models ----
@dataclass
class Item:
    type: str               # "text" | "line"
    bbox: tuple             # (x, y, w, h)
    text: str = ""
    extra: dict | None = None

@dataclass
class Snapshot:
    meeting_id: str
    ts_ms: int
    image_path: str
    items: list

# ---- Processor ----
class WhiteboardProcessor:
    """
    Detects frame changes (SSIM), OCR text (Tesseract), and simple lines (HoughLinesP).
    Writes a snapshot JSON + saves the frame image.
    """
    def __init__(self, storage_root: Path):
        self.storage_root = storage_root
        self._prev_gray: Dict[str, np.ndarray] = {}

    # --- utils ---
    @staticmethod
    def _pil_to_bgr(img: Image.Image) -> np.ndarray:
        arr = np.array(img.convert("RGB"))
        return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)

    def _ensure_dirs(self, meeting_id: str):
        frames_dir = self.storage_root / "whiteboard" / meeting_id / "frames"
        snaps_dir  = self.storage_root / "whiteboard" / meeting_id / "snapshots"
        frames_dir.mkdir(parents=True, exist_ok=True)
        snaps_dir.mkdir(parents=True, exist_ok=True)
        return frames_dir, snaps_dir

    def _interesting(self, meeting_id: str, curr_gray: np.ndarray, thresh: float = 0.85) -> bool:
        prev = self._prev_gray.get(meeting_id)
        if prev is None:
            self._prev_gray[meeting_id] = curr_gray
            return True
        score = ssim(prev, curr_gray)
        if score < thresh:
            self._prev_gray[meeting_id] = curr_gray
            return True
        return False

    # --- detectors ---
    def _detect_text(self, img_bgr: np.ndarray) -> List[Item]:
        """
        Robust OCR pipeline:
        - Convert to gray
        - Slight upscale
        - Contrast boost + Otsu threshold (invert if whiteboard)
        - Light dilation to connect strokes
        - Tesseract with --oem 3 --psm 6
        - Merge words into line-like groups (simple y-clustering)
        """
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

        # Upscale slightly to help OCR
        upscale = cv2.resize(gray, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_CUBIC)

        # Normalize/denoise a bit
        norm = cv2.normalize(upscale, None, 0, 255, cv2.NORM_MINMAX)
        blur = cv2.GaussianBlur(norm, (3, 3), 0)

        # Try Otsu on both polarities; choose the one with more black pixels after threshold
        _, th1 = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        _, th2 = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        # Pick the version that seems to produce text as black strokes on white
        th = th2 if (cv2.countNonZero(th2) < cv2.countNonZero(th1)) else th1

        # Light dilation to connect thin marker strokes
        kernel = np.ones((2, 2), np.uint8)
        proc = cv2.dilate(th, kernel, iterations=1)

        # OCR
        config = "--oem 3 --psm 6 -l eng"
        data = pytesseract.image_to_data(proc, output_type=pytesseract.Output.DICT, config=config)

        # Collect word boxes (filter very small boxes/noisy fragments)
        words = []
        n = len(data.get("text", []))
        for i in range(n):
            txt = (data["text"][i] or "").strip()
            if not txt:
                continue
            x, y, w, h = int(data["left"][i]), int(data["top"][i]), int(data["width"][i]), int(data["height"][i])
            if w < 8 or h < 10:
                continue
            conf_strs = data.get("conf")
            conf = int(conf_strs[i]) if conf_strs and conf_strs[i].isdigit() else -1
            if conf != -1 and conf < 40:
                continue
            words.append((x, y, w, h, txt))

        if not words:
            return []

        # Merge nearby words into lines (simple y clustering)
        words.sort(key=lambda t: (t[1], t[0]))  # sort by y, then x
        lines: List[List[tuple]] = []
        line = [words[0]]
        y_tol = 15  # vertical tolerance for same line (since we upscaled)
        for wbox in words[1:]:
            _, y_prev, _, _, _ = line[-1]
            x, y, w, h, txt = wbox
            if abs(y - y_prev) <= y_tol:
                line.append(wbox)
            else:
                lines.append(line)
                line = [wbox]
        if line:
            lines.append(line)

        # Build Items for each line (map back to original scale)
        items: List[Item] = []
        for group in lines:
            xs = [x for x, y, w, h, t in group]
            ys = [y for x, y, w, h, t in group]
            x0, y0 = min(xs), min(ys)
            x1 = max(x + w for x, y, w, h, t in group)
            y1 = max(y + h for x, y, w, h, t in group)
            text_line = " ".join(t for x, y, w, h, t in group)
            items.append(
                Item(
                    type="text",
                    bbox=(int(x0 / 1.5), int(y0 / 1.5), int((x1 - x0) / 1.5), int((y1 - y0) / 1.5)),
                    text=text_line
                )
            )

        return items

    def _detect_lines(self, img_bgr: np.ndarray) -> List[Item]:
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 70, 200)
        lines = cv2.HoughLinesP(
            edges, 1, np.pi/180,
            threshold=100, minLineLength=40, maxLineGap=12
        )
        items: List[Item] = []
        if lines is not None:
            for l in lines[:, 0, :]:
                x1, y1, x2, y2 = [int(v) for v in l]
                w = abs(x2 - x1)
                h = abs(y2 - y1)
                # Drop zero-length or tiny lines
                if w < 3 and h < 3:
                    continue
                items.append(Item(
                    type="line",
                    bbox=(min(x1, x2), min(y1, y2), max(1, w), max(1, h)),
                    extra={"from": [x1, y1], "to": [x2, y2]}
                ))
        return items

    # --- main entry ---
    def process(self, meeting_id: str, ts_ms: int, img_pil: Image.Image) -> str | None:
        frames_dir, snaps_dir = self._ensure_dirs(meeting_id)

        img_bgr = self._pil_to_bgr(img_pil)
        small = cv2.resize(img_bgr, (0, 0), fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)
        curr_gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)

        # Only emit snapshot if frame changed enough
        if not self._interesting(meeting_id, curr_gray):
            return None

        frame_path = frames_dir / f"{ts_ms}.jpg"
        cv2.imwrite(str(frame_path), img_bgr)

        items: List[Item] = []
        try:
            items += self._detect_text(img_bgr)
        except Exception as e:
            print("OCR error:", e)
        try:
            items += self._detect_lines(img_bgr)
        except Exception as e:
            print("Line detection error:", e)

        snap = Snapshot(meeting_id, ts_ms, str(frame_path).replace("\\", "/"), [asdict(i) for i in items])
        snap_path = snaps_dir / f"{ts_ms}.json"
        snap_path.parent.mkdir(parents=True, exist_ok=True)
        with open(snap_path, "w", encoding="utf-8") as f:
            json.dump(asdict(snap), f, indent=2, ensure_ascii=False)

        return str(snap_path).replace("\\", "/")
