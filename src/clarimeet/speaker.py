from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
import json, logging
from typing import List, Dict, Tuple

log = logging.getLogger("clarimeet.speaker")

def _read_segments(session_dir: Path) -> List[Dict]:
    p = session_dir / "transcript.jsonl"
    if not p.exists():
        raise FileNotFoundError(f"Missing transcript.jsonl in {session_dir}")
    segs: List[Dict] = []
    with p.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            segs.append(json.loads(line))
    # ensure sorted
    segs.sort(key=lambda s: float(s.get("start", 0.0)))
    return segs

def _fmt_srt_ts(ts: float) -> str:
    ms = int(round((ts - int(ts)) * 1000))
    s = int(ts) % 60
    m = (int(ts) // 60) % 60
    h = int(ts) // 3600
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

def _write_jsonl(path: Path, rows: List[Dict]) -> None:
    with path.open("w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

def _update_manifest(session_dir: Path, new_files: List[str]) -> None:
    man = session_dir / "manifest.json"
    try:
        data = json.loads(man.read_text(encoding="utf-8")) if man.exists() else {"files": []}
        files = set(data.get("files", []))
        files.update(new_files)
        data["files"] = sorted(files)
        man.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except Exception as e:
        log.warning("Could not update manifest.json: %s", e)

def diarize_pause_alternation(
    session_dir: str | Path,
    min_pause: float = 0.8,
    speakers: List[str] | None = None,
) -> Tuple[List[Dict], List[str]]:
    """
    Very simple 'diarization':
      - iterate whisper segments
      - when pause between segments >= min_pause, flip speaker
      - assigns labels cyclically from `speakers` (default: 2 speakers)
    """
    sdir = Path(session_dir)
    segs = _read_segments(sdir)
    if speakers is None or len(speakers) == 0:
        speakers = ["SPEAKER_01", "SPEAKER_02"]

    out: List[Dict] = []
    if not segs:
        return out, speakers

    cur_idx = 0  # index into speakers
    prev_end = float(segs[0].get("start", 0.0))
    for seg in segs:
        start = float(seg.get("start", 0.0))
        end = float(seg.get("end", start))
        # flip speaker on long pause
        if (start - prev_end) >= float(min_pause):
            cur_idx = (cur_idx + 1) % len(speakers)
        prev_end = end
        rec = dict(seg)
        rec["speaker"] = speakers[cur_idx]
        out.append(rec)

    # Write outputs
    spk_jsonl = sdir / "transcript_spk.jsonl"
    _write_jsonl(spk_jsonl, out)

    srt_spk = sdir / "captions_spk.srt"
    with srt_spk.open("w", encoding="utf-8") as f:
        for i, seg in enumerate(out, start=1):
            start = max(0.0, float(seg["start"]))
            end = max(start, float(seg["end"]))
            text = (seg.get("text") or "").strip()
            who = seg.get("speaker", "SPEAKER_01")
            f.write(f"{i}\n{_fmt_srt_ts(start)} --> {_fmt_srt_ts(end)}\n[{who}] {text}\n\n")

    spk_meta = sdir / "speakers.json"
    meta = {
        "schema": "clarimeet.speakers@v1",
        "method": "pause-alternation",
        "min_pause": float(min_pause),
        "speakers": speakers,
    }
    spk_meta.write_text(json.dumps(meta, indent=2), encoding="utf-8")

    _update_manifest(sdir, [spk_jsonl.name, srt_spk.name, spk_meta.name])
    return out, speakers
