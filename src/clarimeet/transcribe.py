from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
import json
import time
import platform
import logging

import whisper  # pip install openai-whisper

from .utils import make_session_id, now_iso, sha256_of_file, seed_everything

log = logging.getLogger("clarimeet.transcribe")

@dataclass
class TranscribeResult:
    language: str
    duration_sec: float
    segments: list[dict]
    session_id: str
    session_dir: Path

def _ensure_session_dir(out_root: Path, session_id: str | None) -> tuple[str, Path]:
    """Create a unique per-run session directory under out_root."""
    sid = session_id or make_session_id()
    sdir = out_root / sid
    if sdir.exists():
        i = 2
        while True:
            alt = out_root / f"{sid}_{i}"
            if not alt.exists():
                sdir = alt
                sid = f"{sid}_{i}"
                break
            i += 1
    sdir.mkdir(parents=True, exist_ok=True)
    return sid, sdir

def _write_txt(sdir: Path, segments: list[dict]) -> Path:
    p = sdir / "transcript.txt"
    with p.open("w", encoding="utf-8") as f:
        for seg in segments:
            f.write((seg.get("text") or "").strip() + "\n")
    return p

def _fmt_srt_ts(ts: float) -> str:
    ms = int(round((ts - int(ts)) * 1000))
    s = int(ts) % 60
    m = (int(ts) // 60) % 60
    h = int(ts) // 3600
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

def _write_srt(sdir: Path, segments: list[dict]) -> Path:
    p = sdir / "captions.srt"
    with p.open("w", encoding="utf-8") as f:
        for i, seg in enumerate(segments, start=1):
            start = max(0.0, float(seg.get("start", 0.0)))
            end = max(start, float(seg.get("end", 0.0)))
            text = (seg.get("text") or "").strip()
            f.write(f"{i}\n{_fmt_srt_ts(start)} --> {_fmt_srt_ts(end)}\n{text}\n\n")
    return p

def _write_jsonl(sdir: Path, session_id: str, segments: list[dict]) -> Path:
    p = sdir / "transcript.jsonl"
    with p.open("w", encoding="utf-8") as f:
        for idx, seg in enumerate(segments):
            rec = {
                "schema": "clarimeet.segment@v1",
                "session_id": session_id,
                "idx": idx,
                "start": float(seg.get("start", 0.0)),
                "end": float(seg.get("end", 0.0)),
                "text": (seg.get("text") or "").strip(),
                "avg_logprob": seg.get("avg_logprob"),
                "no_speech_prob": seg.get("no_speech_prob"),
                "temperature": seg.get("temperature"),
            }
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    return p

def _write_meta(
    sdir: Path, *,
    session_id: str,
    audio_path: Path,
    model_name: str,
    language: str | None,
    used_language: str,
    segments_count: int,
    config: dict
) -> Path:
    p = sdir / "meta.json"
    meta = {
        "schema": "clarimeet.transcript-run@v1",
        "session_id": session_id,
        "created_at": now_iso(),
        "audio": {"path": str(audio_path), "sha256": sha256_of_file(audio_path)},
        "model": {"whisper": model_name},
        "requested_language": language,
        "detected_language": used_language,
        "segments": segments_count,
        "env": {"python": platform.python_version(), "platform": platform.platform()},
        "config": config,  # includes seed, temperature, etc.
    }
    with p.open("w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    return p

def _write_manifest(sdir: Path, files: list[str]) -> Path:
    p = sdir / "manifest.json"
    with p.open("w", encoding="utf-8") as f:
        json.dump({"files": files}, f, indent=2)
    return p

def transcribe_file(
    audio_path: str | Path,
    out_dir: str | Path,
    model_name: str = "base",
    language: str | None = None,
    session: str | None = None,
    temperature: float = 0.0,
    seed: int | None = None,
) -> TranscribeResult:
    """
    Transcribe audio to text, SRT, and JSONL using Whisper,
    writing standardized outputs into outputs/<session>/
    """
    t0 = time.time()
    audio_path = Path(audio_path)
    if not audio_path.exists():
        raise FileNotFoundError(f"No such audio file: {audio_path}")

    out_root = Path(out_dir)
    session_id, session_dir = _ensure_session_dir(out_root, session)

    # Reproducibility
    seed_everything(seed)
    log.info("starting transcription: audio=%s model=%s session=%s seed=%s", audio_path, model_name, session_id, seed)

    # Load model
    model = whisper.load_model(model_name)

    # Deterministic-ish options for CPU
    options = dict(
        language=language,
        temperature=temperature,
        condition_on_previous_text=False,
        fp16=False,   # CPU path
        seed=seed,    # just for metadata; whisper ignores it
    )

    result = model.transcribe(str(audio_path), **{k: v for k, v in options.items() if k != "seed"})

    # Normalize segments
    segments = []
    for seg in result.get("segments", []):
        segments.append({
            "start": float(seg.get("start", 0.0)),
            "end": float(seg.get("end", 0.0)),
            "text": (seg.get("text") or "").strip(),
            "avg_logprob": seg.get("avg_logprob"),
            "no_speech_prob": seg.get("no_speech_prob"),
            "temperature": seg.get("temperature"),
        })

    # Write outputs
    txt = _write_txt(session_dir, segments)
    srt = _write_srt(session_dir, segments)
    jsn = _write_jsonl(session_dir, session_id, segments)
    meta = _write_meta(
        session_dir,
        session_id=session_id,
        audio_path=audio_path,
        model_name=model_name,
        language=language,
        used_language=result.get("language", "unknown"),
        segments_count=len(segments),
        config=options,
    )
    _write_manifest(session_dir, [str(p.relative_to(session_dir)) for p in [txt, srt, jsn, meta]])

    dur = time.time() - t0
    log.info("finished transcription: session=%s segments=%d in %.2fs", session_id, len(segments), dur)

    return TranscribeResult(
        language=result.get("language", "unknown"),
        duration_sec=dur,
        segments=segments,
        session_id=session_id,
        session_dir=session_dir,
    )
