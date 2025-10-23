from __future__ import annotations

# --- SAFE UNPICKLE SHIM (optional) ---
import importlib

try:
    from torch.serialization import add_safe_globals  # PyTorch >= 2.4
except Exception:
    def add_safe_globals(_objs):  # no-op fallback for older Torch
        return None

try:
    from torch.torch_version import TorchVersion  # newer Torch
except Exception:
    class TorchVersion:  # minimal shim
        pass

def _allow(*qualified_names: str) -> None:
    for qn in qualified_names:
        try:
            mod, name = qn.rsplit(".", 1)
            obj = getattr(importlib.import_module(mod), name)
            add_safe_globals([obj])  # safe even if no-op
        except Exception as e:
            print(f"[safe-unpickle] warn: could not allow {qn}: {e}")

_allow(
    "pyannote.audio.core.task.Specifications",
    "pyannote.audio.core.task.Problem",
    "pyannote.audio.core.task.Task",
    "pyannote.audio.core.task.Resolution",
    "pyannote.audio.core.task.Dimension",
)
add_safe_globals([TorchVersion])
# -------------------------------------


from pyannote.audio import Pipeline



from pathlib import Path
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional
import json, logging, math

from pyannote.audio import Pipeline  # pip install pyannote.audio

log = logging.getLogger("clarimeet.diarize_hf")

# ---------- I/O helpers ----------

def _read_manifest_audio_path(session_dir: Path) -> Path:
    meta = session_dir / "meta.json"
    if not meta.exists():
        raise FileNotFoundError(f"Missing meta.json in {session_dir} (run transcribe first).")
    data = json.loads(meta.read_text(encoding="utf-8"))
    ap = data.get("audio", {}).get("path")
    if not ap:
        raise RuntimeError("meta.json does not include audio.path.")
    return Path(ap)

def _read_segments(session_dir: Path) -> List[Dict]:
    tj = session_dir / "transcript.jsonl"
    if not tj.exists():
        raise FileNotFoundError(f"Missing transcript.jsonl in {session_dir}")
    rows: List[Dict] = []
    with tj.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    rows.sort(key=lambda r: float(r.get("start", 0.0)))
    return rows

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
    mf = session_dir / "manifest.json"
    data = {"files": []}
    try:
        if mf.exists():
            data = json.loads(mf.read_text(encoding="utf-8"))
        files = set(data.get("files", []))
        files.update(new_files)
        data["files"] = sorted(files)
        mf.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except Exception as e:
        log.warning("Could not update manifest.json: %s", e)

# ---------- Core mapping logic ----------

def _collect_pyannote_segments(annotation) -> List[Tuple[float, float, str]]:
    """Convert pyannote Annotation to a list of (start, end, label)."""
    out: List[Tuple[float, float, str]] = []
    # Each 'track' has a time segment and a label (e.g., SPEAKER_00)
    for segment, _, label in annotation.itertracks(yield_label=True):
        start = float(getattr(segment, "start", 0.0) or 0.0)
        end = float(getattr(segment, "end", start) or start)
        lab = str(label or "SPEAKER_00")
        if end > start:
            out.append((start, end, lab))
    # ensure sorted
    out.sort(key=lambda x: (x[0], x[1]))
    return out

def _overlap(a_start: float, a_end: float, b_start: float, b_end: float) -> float:
    """Duration of overlap between [a_start, a_end] and [b_start, b_end]."""
    lo = max(a_start, b_start)
    hi = min(a_end, b_end)
    return max(0.0, hi - lo)

def _assign_speaker_to_whisper_segment(ws: Dict, diar_segs: List[Tuple[float, float, str]], prev_label: Optional[str]) -> str:
    """Pick the pyannote speaker with the largest overlap with this Whisper segment."""
    s = float(ws.get("start", 0.0))
    e = float(ws.get("end", s))
    if e <= s:
        return prev_label or "SPEAKER_00"
    best_label, best_ov = None, 0.0
    for ds, de, lab in diar_segs:
        ov = _overlap(s, e, ds, de)
        if ov > best_ov:
            best_ov, best_label = ov, lab
    if best_label is None:
        return prev_label or "SPEAKER_00"
    return best_label

# ---------- Public API ----------

@dataclass
class DiarizeHFResult:
    session_dir: Path
    speakers: List[str]
    segments_tagged: int
    pipeline: str
    token_source: str

def diarize_with_pyannote(
    session_dir: str | Path,
    hf_token: Optional[str],
    pipeline_name: str = "pyannote/speaker-diarization-3.1",
    num_speakers: Optional[int] = None,  # you can pass a fixed number if you know it
) -> DiarizeHFResult:
    sdir = Path(session_dir)
    audio_path = _read_manifest_audio_path(sdir)
    whisper_segments = _read_segments(sdir)

    token_source = "arg"
    if not hf_token:
        # fallbacks to env vars (HF_TOKEN or HUGGINGFACE_TOKEN)
        import os
        hf_token = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_TOKEN")
        token_source = "env" if hf_token else "missing"

    if not hf_token:
        raise RuntimeError("Hugging Face token is required. Set it in clarimeet.json under huggingface.token or export HF_TOKEN.")

    log.info("loading pyannote pipeline: %s", pipeline_name)
    pipe = Pipeline.from_pretrained(pipeline_name, use_auth_token=hf_token)

    log.info("running diarization on %s", audio_path)
    kwargs = {}
    if num_speakers is not None:
        # Pyannote supports fixed speaker count in many pipelines
        kwargs["num_speakers"] = int(num_speakers)
    annotation = pipe(str(audio_path), **kwargs)

    diar_segs = _collect_pyannote_segments(annotation)

    # Assign a label for each Whisper segment
    out_rows: List[Dict] = []
    prev = None
    labels_seen: List[str] = []
    for seg in whisper_segments:
        lab = _assign_speaker_to_whisper_segment(seg, diar_segs, prev)
        prev = lab
        if lab not in labels_seen:
            labels_seen.append(lab)
        rec = dict(seg)
        rec["speaker"] = lab
        out_rows.append(rec)

    # Write artifacts
    spk_jsonl = sdir / "transcript_spk_pyannote.jsonl"
    _write_jsonl(spk_jsonl, out_rows)

    srt_spk = sdir / "captions_spk_pyannote.srt"
    with srt_spk.open("w", encoding="utf-8") as f:
        for i, seg in enumerate(out_rows, start=1):
            st = max(0.0, float(seg["start"]))
            en = max(st, float(seg["end"]))
            text = (seg.get("text") or "").strip()
            who = seg.get("speaker", "SPEAKER_00")
            f.write(f"{i}\n{_fmt_srt_ts(st)} --> {_fmt_srt_ts(en)}\n[{who}] {text}\n\n")

    spk_meta = sdir / "speakers_pyannote.json"
    meta = {
        "schema": "clarimeet.speakers@pyannote@v1",
        "pipeline": pipeline_name,
        "speakers": labels_seen,
        "token_source": token_source,
        "num_speakers": num_speakers,
    }
    spk_meta.write_text(json.dumps(meta, indent=2), encoding="utf-8")

    _update_manifest(sdir, [spk_jsonl.name, srt_spk.name, spk_meta.name])

    return DiarizeHFResult(
        session_dir=sdir,
        speakers=labels_seen,
        segments_tagged=len(out_rows),
        pipeline=pipeline_name,
        token_source=token_source,
    )
