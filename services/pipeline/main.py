from __future__ import annotations
from pathlib import Path
from typing import Optional, List, Dict
import os, json

from fastapi import FastAPI, Form, HTTPException
from pydantic import BaseModel

# core building blocks you already have
from clarimeet.asr_job import asr_run
from clarimeet.diarize_hf import diarize_with_pyannote
from clarimeet.align import align_session
from clarimeet.summarize import summarize_session, write_outputs
from clarimeet.exporters import export_vtt
from clarimeet.report import render_report
from clarimeet.config import load_config, get_cfg

# deterministic CUDA on Windows if present
os.environ.setdefault("CUBLAS_WORKSPACE_CONFIG", ":4096:8")

app = FastAPI(title="ClariMeet — Pipeline API")

STORAGE_DEFAULT = Path(os.getenv("CLARIMEET_STORAGE", "storage"))

class PipelineResp(BaseModel):
    org_id: str
    meeting_id: str
    session: str
    session_dir: str
    model: str
    language: Optional[str]
    segments: int
    speakers: List[str]
    words: int
    vtt_file: str
    report: str
    files: List[str]

@app.get("/health")
async def health():
    return {"ok": True}

def _audio_path(storage: Path, org: str, meeting: str) -> Path:
    return storage / org / meeting / "audio" / f"{meeting}.wav"

def _session_dir(storage: Path, org: str, meeting: str, session: str) -> Path:
    return storage / org / meeting / "asr" / session

@app.post("/api/pipeline/run", response_model=PipelineResp)
async def run_pipeline(
    org_id: str = Form("demo"),
    meeting_id: str = Form(...),
    storage_root: Optional[str] = Form(None),

    # ASR
    model: Optional[str] = Form("tiny"),
    language: Optional[str] = Form(None),
    temperature: Optional[float] = Form(0.0),
    seed: Optional[int] = Form(None),
    session: Optional[str] = Form(None),

    # diarization
    hf_token: Optional[str] = Form(None),
    pipeline: Optional[str] = Form(None),
    num_speakers: Optional[int] = Form(None),

    # summarization
    max_bullets: Optional[int] = Form(3),
):
    try:
        org = (org_id or "demo").strip()
        meeting = meeting_id.strip()
        storage = Path(storage_root or STORAGE_DEFAULT)

        # check audio exists
        wav = _audio_path(storage, org, meeting)
        if not wav.exists():
            raise HTTPException(status_code=404, detail=f"audio_missing: {wav}")


        def _asr_done(sess_dir: Path) -> bool:
            return (sess_dir / "transcript.jsonl").exists()

        # decide desired session name (use request param or meeting id)
        sess = session or meeting
        sdir = _session_dir(storage, org, meeting, sess)

        if _asr_done(sdir):
            # Reuse existing ASR artifacts
            class _ASR: ...
            asr = _ASR()
            asr.session_id = sess
            asr.session_dir = str(sdir)

            # Try to read metadata
            meta = {}
            try:
                meta = json.loads((sdir / "meta.json").read_text(encoding="utf-8"))
            except Exception:
                meta = {}

            # Model & language from meta (fallbacks to request params)
            asr.model = ((meta.get("model") or {}).get("whisper")) or (model or "tiny")
            asr.language = meta.get("detected_language") or meta.get("requested_language") or None

            # Segments count from transcript.jsonl
            try:
                tj = sdir / "transcript.jsonl"
                asr.segments = sum(1 for _ in tj.open("r", encoding="utf-8"))
            except Exception:
                asr.segments = 0
        else:
            # No ASR yet → run it once
            asr = asr_run(
                org_id=org, meeting_id=meeting, storage_root=str(storage),
                model=model or "tiny", language=language,
                temperature=float(temperature or 0.0), seed=seed, session=sess,
            )
            sess = asr.session_id
            sdir = Path(asr.session_dir)



        # # 1) ASR
        # asr = asr_run(
        #     org_id=org,
        #     meeting_id=meeting,
        #     storage_root=str(storage),
        #     model=model or "tiny",
        #     language=language,
        #     temperature=float(temperature or 0.0),
        #     seed=seed,
        #     session=session,
        # )
        # sess = asr.session_id
        # sdir = Path(asr.session_dir)

        # 2) diarization (read token/pipeline from config if not provided)
        cfg = load_config(os.getenv("CLARIMEET_CONFIG", None))
        token = hf_token or get_cfg(cfg, "huggingface", "token", default=None) or os.getenv("HF_TOKEN")
        pipe  = pipeline or get_cfg(cfg, "huggingface", "pipeline", default="pyannote/speaker-diarization-3.1")
        if not token:
            # It’s valid to skip diarization; but for the pipeline we strongly prefer having it.
            # If token is missing, we fall back to a pause-based transcript (already in repo),
            # but since you’re using pyannote successfully, we’ll require token here.
            raise HTTPException(status_code=400, detail="missing_hf_token: set huggingface.token or pass hf_token")

        dia = diarize_with_pyannote(
            session_dir=sdir,
            hf_token=token,
            pipeline_name=pipe,
            num_speakers=num_speakers,
        )

        # 3) align
        # # 3) align
        # ali = align_session(sdir, method="uniform")

        # # robust words count (supports older AlignResult without .words_count)
        # words_total = getattr(ali, "words_count", None)
        # if words_total is None:
        #     try:
        #         doc = json.loads(Path(ali.out_file).read_text(encoding="utf-8"))
        #         words_total = len(doc.get("words", []))
        #     except Exception:
        #         words_total = 0


        # # 3) align
        # ali = align_session(sdir, method="uniform")

        # # robust words count with fallbacks
        # words_total = None
        # try:
        #     # Preferred: attribute on AlignResult
        #     words_total = getattr(ali, "words_count", None)
        # except Exception:
        #     words_total = None

        # if not words_total:
        #     try:
        #         # Fallback 1: read transcript_aligned.json
        #         doc = json.loads(Path(ali.out_file).read_text(encoding="utf-8"))
        #         words_total = len(doc.get("words", []))
        #     except Exception as e:
        #         print(f"[pipeline] could not read aligned words: {e}")
        #         words_total = 0

        # # Final guard
        # if words_total is None:
        #     words_total = 0


        # # 3) align
        # ali = align_session(sdir, method="uniform")

        # # robust words count with fallbacks
        # words_total = None
        # try:
        #     # Preferred: attribute on AlignResult
        #     words_total = getattr(ali, "words_count", None)
        # except Exception:
        #     words_total = None

        # if words_total is None or words_total == 0:
        #     # Fallback 1: read JSON words
        #     try:
        #         doc = json.loads(Path(ali.out_file).read_text(encoding="utf-8"))
        #         words_total = len(doc.get("words", []))
        #     except Exception as e:
        #         print(f"[pipeline] could not read aligned JSON words: {e}")
        #         words_total = 0

        # if words_total == 0:
        #     # Fallback 2: TSV line count (minus header if present)
        #     tsv = sdir / "aligned_words.tsv"
        #     if tsv.exists():
        #         try:
        #             # quick line count
        #             n = sum(1 for _ in tsv.open("r", encoding="utf-8", errors="ignore"))
        #             # if there is a header, subtract 1; otherwise keep n
        #             words_total = max(0, n-1) if n > 0 else 0
        #         except Exception as e:
        #             print(f"[pipeline] could not count TSV words: {e}")
        #             # keep words_total as 0

        

        # 3) align
        ali = align_session(sdir, method="uniform")

        # words count, with fallbacks
        words_total = getattr(ali, "words", None)
        if words_total is None or words_total == 0:
            try:
                aligned_json = sdir / "transcript_aligned.json"
                doc = json.loads(aligned_json.read_text(encoding="utf-8"))
                words_total = int(doc.get("word_count", 0) or len(doc.get("words", [])))
            except Exception as e:
                print(f"[pipeline] could not read aligned JSON words: {e}")
                words_total = 0

        if words_total == 0:
            tsv = sdir / "aligned_words.tsv"
            if tsv.exists():
                try:
                    n = sum(1 for _ in tsv.open("r", encoding="utf-8", errors="ignore"))
                    words_total = max(0, n - 1)  # minus header
                except Exception as e:
                    print(f"[pipeline] could not count TSV words: {e}")
                    words_total = 0
       
        # Final guard
        if words_total is None:
            words_total = 0

        # 4) summarize
        outs = summarize_session(sdir, max_bullets=max_bullets or 3)
        written = write_outputs(sdir, outs)

        # 5) export VTT
        vtt = export_vtt(sdir)

        # 6) render report
        report_path = render_report(sdir, auto_open=False)

        # gather manifest/file list (best-effort)
        files = []
        mf = sdir / "manifest.json"
        try:
            if mf.exists():
                data = json.loads(mf.read_text(encoding="utf-8"))
                files = data.get("files", [])
        except Exception:
            pass

        return PipelineResp(
            org_id=org,
            meeting_id=meeting,
            session=sess,
            session_dir=str(sdir),
            model=asr.model,
            language=asr.language,
            segments=asr.segments,
            speakers=dia.speakers,
            words=words_total,
            vtt_file=str(vtt.out_file),
            report=str(report_path),
            files=sorted(set(files + [
                "transcript.txt", "captions.srt", "transcript.jsonl",
                "transcript_spk_pyannote.jsonl", "captions_spk_pyannote.srt", "speakers_pyannote.json",
                "transcript_aligned.json", "summary_short.md", "summary_long.md",
                "actions.json", "decisions.json", "report.html"
            ])),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"pipeline_failed: {e}")

