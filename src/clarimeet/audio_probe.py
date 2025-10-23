from __future__ import annotations
import contextlib
import wave
from pathlib import Path
from dataclasses import dataclass

@dataclass
class WavInfo:
    path: Path
    channels: int
    sample_rate: int
    frames: int
    duration_sec: float
    sampwidth_bytes: int

def probe_wav(path: str | Path) -> WavInfo:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"No such file: {p}")
    with contextlib.closing(wave.open(str(p), 'rb')) as wf:
        channels = wf.getnchannels()
        sample_rate = wf.getframerate()
        frames = wf.getnframes()
        sampwidth = wf.getsampwidth()
        duration = frames / float(sample_rate) if sample_rate else 0.0
        return WavInfo(
            path=p,
            channels=channels,
            sample_rate=sample_rate,
            frames=frames,
            duration_sec=duration,
            sampwidth_bytes=sampwidth,
        )
