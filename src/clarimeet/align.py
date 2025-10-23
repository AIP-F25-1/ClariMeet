from __future__ import annotations
from pathlib import Path
from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple
import json, re, math, logging

log = logging.getLogger("clarimeet.align")

WORD_RE = re.compile(r"[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?", re.UNICODE)

def _read_jsonl(p: Path) -> List[Dict]:
    rows: List[Dict] = []
    with p.open("r", encoding="utf-8") as f:
        for ln in f:
            ln = ln.strip()
            if ln:
                rows.append(json.loads(ln))
    rows.sort(key=lambda r: float(r.get("start", 0.0)))
    return rows

def _write_manifest_append(session_dir: Path, names: List[str]) -> None:
    mf = session_dir / "manifest.json"
    try:
        data = {"files": []}
        if mf.exists():
            data = json.loads(mf.read_text(encoding="utf-8"))
        s = set(data.get("files", []))
        s.update(names)
        data["files"] = sorted(s)
        mf.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except Exception as e:
        log.warning("Could not update manifest.json: %s", e)

def _tokens_chars(text: str) -> Tuple[List[str], int]:
    words = WORD_RE.findall(text or "")
    total_chars = sum(len(w) for w in words)
    return words, total_chars

def _align_segment_chars(seg: Dict) -> List[Dict]:
    """Distribute the segment duration across words by character length."""
    s = float(seg.get("start", 0.0))
    e = float(seg.get("end", s))
    text = (seg.get("text") or "").strip()
    if e <= s or not text:
        return []
    words, total = _tokens_chars(text)
    if not words or total <= 0:
        return []
    dur = max(0.0, e - s)
    out: List[Dict] = []
    t = s
    for i, w in enumerate(words):
        frac = len(w) / total
        wdur = dur * frac
        wstart = t
        wend = s + dur if i == len(words) - 1 else (t + wdur)
        out.append({
            "word": w,
            "start": round(wstart, 3),
            "end": round(wend, 3),
        })
        t = wend
    return out

def _align_segment_words(seg: Dict) -> List[Dict]:
    """Distribute evenly by word count."""
    s = float(seg.get("start", 0.0))
    e = float(seg.get("end", s))
    text = (seg.get("text") or "").strip()
    if e <= s or not text:
        return []
    words = WORD_RE.findall(text)
    if not words:
        return []
    dur = max(0.0, e - s)
    step = dur / len(words)
    out: List[Dict] = []
    for i, w in enumerate(words):
        wstart = s + i * step
        wend = s + dur if i == len(words) - 1 else (s + (i + 1) * step)
        out.append({
            "word": w,
            "start": round(wstart, 3),
            "end": round(wend, 3),
        })
    return out

@dataclass
class AlignResult:
    session_dir: Path
    method: str
    words: int
    files: List[str]

def align_session(session_dir: str | Path, method: str = "chars") -> AlignResult:
    sdir = Path(session_dir)
    tj = sdir / "transcript.jsonl"
    if not tj.exists():
        raise FileNotFoundError(f"Missing transcript.jsonl in {sdir} (run asr-run first for this meeting/session).")

    rows = _read_jsonl(tj)
    words_all: List[Dict] = []
    for idx, seg in enumerate(rows):
        aligned = _align_segment_chars(seg) if method == "chars" else _align_segment_words(seg)
        # enrich with segment pointer (index + segment times)
        for w in aligned:
            w["segment_index"] = idx
            w["segment_start"] = round(float(seg.get("start", 0.0)), 3)
            w["segment_end"] = round(float(seg.get("end", 0.0)), 3)
        words_all.extend(aligned)

    # write JSON (single file, not JSONL)
    out_json = sdir / "transcript_aligned.json"
    out_doc = {
        "schema": "clarimeet.alignment@v1",
        "generator": {"name": "clarimeet", "method": method},
        "session_dir": str(sdir),
        "word_count": len(words_all),
        "words": words_all,
    }
    out_json.write_text(json.dumps(out_doc, indent=2), encoding="utf-8")

    # quick TSV for visual inspection
    out_tsv = sdir / "aligned_words.tsv"
    with out_tsv.open("w", encoding="utf-8") as f:
        f.write("i\tword\tstart\tend\tsegment_index\tsegment_start\tsegment_end\n")
        for i, w in enumerate(words_all):
            f.write(f"{i}\t{w['word']}\t{w['start']}\t{w['end']}\t{w['segment_index']}\t{w['segment_start']}\t{w['segment_end']}\n")

    _write_manifest_append(sdir, [out_json.name, out_tsv.name])

    return AlignResult(session_dir=sdir, method=method, words=len(words_all),
                       files=[out_json.name, out_tsv.name])
