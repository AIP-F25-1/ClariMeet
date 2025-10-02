from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
import json

from .transcribe import transcribe_file

@dataclass
class AsrResult:
    org_id: str
    meeting_id: str
    storage_root: Path
    session_id: str
    session_dir: Path
    model: str
    language: Optional[str]
    segments: int

def _meeting_paths(storage_root: Path, org: str, meeting: str) -> dict[str, Path]:
    base = storage_root / org / meeting
    return {
        "base": base,
        "original": base / "original",
        "audio": base / "audio",
        "asr": base / "asr",
        "ingest_meta": base / "meta_ingest.json",
        "audio_wav": base / "audio" / f"{meeting}.wav",
    }

def asr_run(
    org_id: str,
    meeting_id: str,
    storage_root: str | Path = "storage",
    *,
    model: str = "tiny",
    language: str | None = None,
    temperature: float = 0.0,
    seed: int | None = None,
    session: str | None = None
) -> AsrResult:
    paths = _meeting_paths(Path(storage_root), org_id, meeting_id)
    audio = paths["audio_wav"]
    if not audio.exists():
        raise FileNotFoundError(f"audio wav not found: {audio}\nRun 'clarimeet ingest-extract ...' first for this meeting.")

    out_dir = paths["asr"]  # we’ll write inside storage under /asr/<session>/
    out_dir.mkdir(parents=True, exist_ok=True)

    res = transcribe_file(
        audio_path=audio,
        out_dir=out_dir,
        model_name=model,
        language=language,
        session=session or meeting_id,   # default: reuse meeting id
        temperature=temperature,
        seed=seed,
    )

    # append a small pointer at the meeting root (optional convenience)
    pointer = {
        "schema": "clarimeet.asr.pointer@v1",
        "latest_session": res.session_id,
        "session_dir": str(res.session_dir),
        "model": model,
        "language": res.language,
    }
    (paths["base"] / "asr_latest.json").write_text(json.dumps(pointer, indent=2), encoding="utf-8")

    return AsrResult(
        org_id=org_id,
        meeting_id=meeting_id,
        storage_root=Path(storage_root),
        session_id=res.session_id,
        session_dir=res.session_dir,
        model=model,
        language=res.language,
        segments=len(res.segments),
    )
