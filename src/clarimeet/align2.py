# src/clarimeet/align.py
# Phase 1 Word Alignment: proportional char-length timing with uniform fallback.
from __future__ import annotations
import json, os, re
from typing import List, Dict, Iterable

_WORD_RE = re.compile(r"[A-Za-z0-9']+")

def _tokenize_words(text: str) -> List[str]:
    # Keep only alphanumeric-ish tokens as "words" for highlighting.
    return _WORD_RE.findall(text or "")

def _align_segment_proportional(seg: Dict, seg_index: int, min_word_dur: float = 0.06) -> List[Dict]:
    """
    Distribute segment duration across its words proportionally to character counts.
    Ensures a small minimum duration for each word for smoother karaoke.
    """
    start = float(seg.get("start", 0.0))
    end = float(seg.get("end", start))
    duration = max(0.0, end - start)

    words = _tokenize_words(seg.get("text", ""))
    if not words or duration <= 0.0:
        return []

    # Weights based on character length (at least 1)
    char_counts = [max(1, len(w)) for w in words]
    total_chars = float(sum(char_counts))

    # Allocate: first reserve min duration per word, then distribute the leftover proportionally
    min_total = min_word_dur * len(words)
    leftover = max(0.0, duration - min_total)

    # If duration is very short, spread uniformly
    if leftover <= 1e-6:
        per = duration / len(words)
        t = start
        out = []
        for w in words:
            w_start = t
            w_end = min(end, w_start + per)
            out.append({"word": w, "start": round(w_start, 3), "end": round(w_end, 3), "segment_index": seg_index})
            t = w_end
        # Nudge final end exactly to segment end to remove drift
        if out:
            out[-1]["end"] = round(end, 3)
        return out

    # Proportional allocation of leftover
    proportional = [leftover * (c / total_chars) for c in char_counts]
    durations = [min_word_dur + p for p in proportional]

    # Fix rounding drift to match exactly segment duration
    total_assigned = sum(durations)
    drift = duration - total_assigned
    durations[-1] += drift  # safe small correction on last word

    # Build timeline
    out = []
    t = start
    for w, d in zip(words, durations):
        d = max(0.0, d)  # safety
        w_start = t
        w_end = min(end, w_start + d)
        out.append({"word": w, "start": round(w_start, 3), "end": round(w_end, 3), "segment_index": seg_index})
        t = w_end
    # Ensure last word ends exactly at seg end
    if out:
        out[-1]["end"] = round(end, 3)
    return out

def _align_segment_uniform(seg: Dict, seg_index: int) -> List[Dict]:
    """Simple uniform fallback: equal time per word."""
    start = float(seg.get("start", 0.0))
    end = float(seg.get("end", start))
    duration = max(0.0, end - start)

    words = _tokenize_words(seg.get("text", ""))
    if not words or duration <= 0.0:
        return []

    per = duration / len(words)
    out, t = [], start
    for w in words:
        w_start = t
        w_end = min(end, w_start + per)
        out.append({"word": w, "start": round(w_start, 3), "end": round(w_end, 3), "segment_index": seg_index})
        t = w_end
    if out:
        out[-1]["end"] = round(end, 3)
    return out

def _read_transcript_jsonl(path: str) -> List[Dict]:
    segs: List[Dict] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                segs.append(json.loads(line))
            except Exception:
                # tolerate small jsonl issues
                continue
    return segs

def _write_aligned_json(words: Iterable[Dict], out_path: str) -> None:
    data = {"words": list(words)}
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def align_transcript(asr_dir: str, use_uniform_fallback: bool = True) -> str:
    """
    Main entrypoint used by pipeline/report:
    - asr_dir: path like .../storage/<meeting_id>/asr/<run_id>
    Returns path to transcript_aligned.json
    """
    transcript_path = os.path.join(asr_dir, "transcript.jsonl")
    out_path = os.path.join(asr_dir, "transcript_aligned.json")

    if not os.path.exists(transcript_path):
        # Graceful no-op if transcript missing
        _write_aligned_json([], out_path)
        return out_path

    segs = _read_transcript_jsonl(transcript_path)
    all_words: List[Dict] = []
    for idx, seg in enumerate(segs):
        aligned = _align_segment_proportional(seg, idx)
        if not aligned and use_uniform_fallback:
            aligned = _align_segment_uniform(seg, idx)
        all_words.extend(aligned)

    _write_aligned_json(all_words, out_path)
    return out_path

# Optional CLI for manual runs: python -m clarimeet.align <asr_dir>
if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python -m clarimeet.align <path_to_asr_dir>")
        sys.exit(1)
    result = align_transcript(sys.argv[1])
    print(f"wrote {result}")
