from __future__ import annotations
import argparse
import json
import platform
from pathlib import Path

from . import __version__
from .logging_config import setup_logging
from .audio_probe import probe_wav
from .transcribe import transcribe_file
from .summarize import summarize_session, write_outputs
from .config import load_config, get_cfg
from .printing import print_kv_block
from .speaker import diarize_pause_alternation
from .diarize_hf import diarize_with_pyannote  # NEW
from .report import render_report
from .ingest import ingest_extract
from .asr_job import asr_run
from .report import render_report
from .align import align_session
from .exporters import export_vtt
from .exporters import export_vtt, export_transcript_json

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="clarimeet", description="ClariMeet CLI")
    parser.add_argument("-v", "--verbose", action="count", default=0,
                        help="Increase verbosity (-v, -vv)")
    parser.add_argument("--config", type=str, default=None,
                        help="Path to clarimeet.json (or use ./clarimeet.json / ~/.clarimeet/clarimeet.json)")
    sub = parser.add_subparsers(dest="cmd", required=True)

    # hello
    hello_p = sub.add_parser("hello", help="Sanity check")
    hello_p.add_argument("--json", action="store_true", help="Print JSON")

    # probe
    probe_p = sub.add_parser("probe", help="Probe a WAV file (stdlib only)")
    probe_p.add_argument("audio", type=str, help="Path to a .wav file")
    probe_p.add_argument("--json", action="store_true", help="Output JSON")

    # transcribe
    tr_p = sub.add_parser("transcribe", help="Offline transcription (Whisper)")
    tr_p.add_argument("audio", type=str, help="Path to audio/video file")
    tr_p.add_argument("--out-dir", type=str, default=None, help="Base directory for outputs")
    tr_p.add_argument("--session", type=str, default=None, help="Session folder name under --out-dir")
    tr_p.add_argument("--model", type=str, default=None,
                      help="Whisper model: tiny | base | small | medium | large")
    tr_p.add_argument("--language", type=str, default=None,
                      help="Force language (e.g., 'en'); default: auto-detect")
    tr_p.add_argument("--temperature", type=float, default=None, help="Whisper decoding temperature")
    tr_p.add_argument("--seed", type=int, default=None, help="Random seed for reproducibility")
    tr_p.add_argument("--json", action="store_true", help="Print JSON summary")

    # summarize
    sum_p = sub.add_parser("summarize", help="Create short/long summaries and extract actions/decisions")
    grp = sum_p.add_mutually_exclusive_group(required=True)
    grp.add_argument("--session", type=str, help="Existing session name under --out-dir (e.g., demo1)")
    grp.add_argument("--session-dir", type=str, help="Direct path to an existing session folder")
    sum_p.add_argument("--out-dir", type=str, default=None, help="Base outputs dir (used with --session)")
    sum_p.add_argument("--max-bullets", type=int, default=None, help="Short summary bullet count (1-5)")
    sum_p.add_argument("--json", action="store_true", help="Print JSON summary")

    # diarize (pause-based)
    dia_p = sub.add_parser("diarize", help="Assign simple speaker tags by pause alternation (no heavy deps)")
    g2 = dia_p.add_mutually_exclusive_group(required=True)
    g2.add_argument("--session", type=str, help="Existing session name under --out-dir")
    g2.add_argument("--session-dir", type=str, help="Direct path to an existing session folder")
    dia_p.add_argument("--out-dir", type=str, default=None, help="Base outputs dir (used with --session)")
    dia_p.add_argument("--min-pause", type=float, default=None, help="Pause (sec) to flip speakers; default from config or 0.8")
    dia_p.add_argument("--json", action="store_true", help="Print JSON summary")

    # diarize-hf (Pyannote)
    dhf = sub.add_parser("diarize-hf", help="Speaker diarization using Hugging Face (pyannote.audio)")
    g3 = dhf.add_mutually_exclusive_group(required=True)
    g3.add_argument("--session", type=str, help="Existing session name under --out-dir")
    g3.add_argument("--session-dir", type=str, help="Direct path to an existing session folder")
    dhf.add_argument("--out-dir", type=str, default=None, help="Base outputs dir (used with --session)")
    dhf.add_argument("--hf-token", type=str, default=None, help="Hugging Face token (or set HF_TOKEN env / config.huggingface.token)")
    dhf.add_argument("--pipeline", type=str, default=None, help="Pyannote pipeline id (default from config or pyannote/speaker-diarization-3.1)")
    dhf.add_argument("--num-speakers", type=int, default=None, help="If known, enforce a fixed speaker count")
    dhf.add_argument("--json", action="store_true", help="Print JSON summary")

    # report
    rep = sub.add_parser("report", help="Build a single-file HTML report for a session")
    g4 = rep.add_mutually_exclusive_group(required=True)
    g4.add_argument("--session", type=str, help="Existing session name under --out-dir")
    g4.add_argument("--session-dir", type=str, help="Direct path to an existing session folder")
    rep.add_argument("--out-dir", type=str, default=None, help="Base outputs dir (used with --session)")
    rep.add_argument("--open", action="store_true", help="Open the HTML in your default browser")
    rep.add_argument("--json", action="store_true", help="Print JSON summary")

    # ingest-extract
    ing = sub.add_parser("ingest-extract", help="Store original video and extract canonical WAV to storage layout")
    ing.add_argument("video", type=str, help="Path to input video (mp4/mkv/mov/etc.) or audio")
    ing.add_argument("--org", type=str, default=None, help="Organization id (folder under storage/)")
    ing.add_argument("--meeting", type=str, default=None, help="Meeting id (UUID or slug). If omitted, a UUID is generated.")
    ing.add_argument("--storage", type=str, default="storage", help="Base storage root (default: storage)")
    ing.add_argument("--json", action="store_true", help="Print JSON summary")

    # asr-run (run Whisper on a stored meeting's canonical WAV)
    asr = sub.add_parser("asr-run", help="Run ASR on storage/<org>/<meeting>/audio/<meeting>.wav and write artifacts under /asr/<session>")
    asr.add_argument("--org", type=str, required=True, help="Organization id")
    asr.add_argument("--meeting", type=str, required=True, help="Meeting id")
    asr.add_argument("--storage", type=str, default="storage", help="Storage root (default: storage)")
    asr.add_argument("--session", type=str, default=None, help="Session name under /asr (default: meeting id)")
    asr.add_argument("--model", type=str, default=None, help="Whisper model (default from config or tiny)")
    asr.add_argument("--language", type=str, default=None, help="Force language (e.g., en)")
    asr.add_argument("--temperature", type=float, default=None, help="Decoding temperature (default 0.0)")
    asr.add_argument("--seed", type=int, default=None, help="Random seed for reproducibility")
    asr.add_argument("--json", action="store_true", help="Print JSON summary")

    # asr-report — build HTML report for a stored ASR session
    ar = sub.add_parser("asr-report", help="Render report.html for storage/<org>/<meeting>/asr/<session>")
    ar.add_argument("--org", type=str, required=True, help="Organization id")
    ar.add_argument("--meeting", type=str, required=True, help="Meeting id")
    ar.add_argument("--session", type=str, default=None, help="ASR session (default: latest from asr_latest.json)")
    ar.add_argument("--storage", type=str, default="storage", help="Storage root (default: storage)")
    ar.add_argument("--open", action="store_true", help="Open report in your browser")
    ar.add_argument("--json", action="store_true", help="Print JSON summary")

    # align — produce word-level timings from transcript.jsonl
    al = sub.add_parser("align", help="Create transcript_aligned.json for a session (naive per-segment alignment)")
    g = al.add_mutually_exclusive_group(required=True)
    g.add_argument("--session-dir", type=str, help="Direct path to an ASR session folder")
    g.add_argument("--org", type=str, help="Org id (use with --meeting/--storage[/--session])")
    al.add_argument("--meeting", type=str, help="Meeting id (requires --org)")
    al.add_argument("--session", type=str, default=None, help="ASR session (default: latest)")
    al.add_argument("--storage", type=str, default="storage", help="Storage root (default: storage)")
    al.add_argument("--method", type=str, choices=["chars","words"], default="chars", help="Distribute time by 'chars' or 'words'")
    al.add_argument("--json", action="store_true", help="Print JSON summary")

    # export-vtt — write a WebVTT file for a session
    ev = sub.add_parser("export-vtt", help="Export WebVTT from the best available transcript in a session")
    g = ev.add_mutually_exclusive_group(required=True)
    g.add_argument("--session-dir", type=str, help="Direct path to an ASR session folder")
    g.add_argument("--org", type=str, help="Org id (use with --meeting/--storage[/--session])")
    ev.add_argument("--meeting", type=str, help="Meeting id (requires --org)")
    ev.add_argument("--session", type=str, default=None, help="ASR session (default: latest)")
    ev.add_argument("--storage", type=str, default="storage", help="Storage root (default: storage)")
    ev.add_argument("--json", action="store_true", help="Print JSON summary")

    # export-json — stable transcript JSON (v1)
    ej = sub.add_parser("export-json", help="Export transcript in a stable JSON schema (clarimeet.transcript@v1)")
    g = ej.add_mutually_exclusive_group(required=True)
    g.add_argument("--session-dir", type=str, help="Direct path to an ASR session folder")
    g.add_argument("--org", type=str, help="Org id (use with --meeting/--storage[/--session])")
    ej.add_argument("--meeting", type=str, help="Meeting id (requires --org)")
    ej.add_argument("--session", type=str, default=None, help="ASR session (default: latest)")
    ej.add_argument("--storage", type=str, default="storage", help="Storage root (default: storage)")
    ej.add_argument("--json", action="store_true", help="Print JSON summary")


    args = parser.parse_args(argv)
    cfg = load_config(args.config)
    setup_logging(args.verbose)



    if args.cmd == "export-json":
        # resolve session_dir
        if args.session_dir:
            session_dir = Path(args.session_dir)
        else:
            if not args.org or not args.meeting:
                print("[error] provide --session-dir OR --org and --meeting"); return 2
            base = Path(args.storage) / args.org / args.meeting
            asr_dir = base / "asr"
            sess = args.session
            if not sess:
                ptr = base / "asr_latest.json"
                if not ptr.exists():
                    print(f"[error] no --session given and {ptr} not found"); return 2
                sess = json.loads(ptr.read_text(encoding="utf-8")).get("latest_session")
            session_dir = asr_dir / sess

        if not session_dir.exists():
            print(f"[error] session folder not found: {session_dir}"); return 2

        run_log = session_dir / "run.log"
        setup_logging(args.verbose, log_file=run_log)

        try:
            res = export_transcript_json(session_dir=session_dir)
        except FileNotFoundError as e:
            print(f"[error] {e}"); return 2
        except Exception as e:
            print(f"[error] export-json failed: {e}"); return 2

        result = {
            "session_dir": str(res.session_dir),
            "variant": res.variant,
            "json": str(res.out_file),
            "segments": res.segments,
            "speakers": res.speakers,
            "words_total": res.words_total,
        }
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print_kv_block("ClariMeet — Export JSON (v1)", [
                ("Session dir", result["session_dir"]),
                ("Variant", result["variant"]),
                ("JSON", result["json"]),
                ("Segments", str(result["segments"])),
                ("Speakers", str(result["speakers"])),
                ("Words (aligned)", str(result["words_total"])),
            ])
        return 0



    if args.cmd == "export-vtt":
        # resolve session_dir
        if args.session_dir:
            session_dir = Path(args.session_dir)
        else:
            if not args.org or not args.meeting:
                print("[error] provide --session-dir OR --org and --meeting"); return 2
            base = Path(args.storage) / args.org / args.meeting
            asr_dir = base / "asr"
            sess = args.session
            if not sess:
                ptr = base / "asr_latest.json"
                if not ptr.exists():
                    print(f"[error] no --session given and {ptr} not found"); return 2
                sess = json.loads(ptr.read_text(encoding="utf-8")).get("latest_session")
            session_dir = asr_dir / sess

        if not session_dir.exists():
            print(f"[error] session folder not found: {session_dir}"); return 2

        run_log = session_dir / "run.log"
        setup_logging(args.verbose, log_file=run_log)

        try:
            res = export_vtt(session_dir=session_dir)
        except FileNotFoundError as e:
            print(f"[error] {e}"); return 2
        except Exception as e:
            print(f"[error] export-vtt failed: {e}"); return 2

        result = {"session_dir": str(res.session_dir), "variant": res.variant, "vtt": str(res.out_file), "cues": res.cues}
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print_kv_block("ClariMeet — Export VTT", [
                ("Session dir", result["session_dir"]),
                ("Variant", result["variant"]),
                ("VTT", result["vtt"]),
                ("Cues", str(result["cues"])),
            ])
        return 0



    if args.cmd == "align":
        # resolve session_dir
        if args.session_dir:
            session_dir = Path(args.session_dir)
        else:
            if not args.org or not args.meeting:
                print("[error] provide --session-dir OR --org and --meeting"); return 2
            base = Path(args.storage) / args.org / args.meeting
            asr_dir = base / "asr"
            sess = args.session
            if not sess:
                ptr = base / "asr_latest.json"
                if not ptr.exists():
                    print(f"[error] no --session given and {ptr} not found"); return 2
                sess = json.loads(ptr.read_text(encoding="utf-8")).get("latest_session")
            session_dir = asr_dir / sess

        if not session_dir.exists():
            print(f"[error] session folder not found: {session_dir}"); return 2

        run_log = session_dir / "run.log"
        setup_logging(args.verbose, log_file=run_log)

        try:
            res = align_session(session_dir=session_dir, method=args.method)
        except FileNotFoundError as e:
            print(f"[error] {e}"); return 2
        except Exception as e:
            print(f"[error] align failed: {e}"); return 2

        result = {"session_dir": str(res.session_dir), "method": res.method, "word_count": res.words, "outputs": res.files}
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print_kv_block("ClariMeet — Align Summary", [
                ("Session dir", result["session_dir"]),
                ("Method", result["method"]),
                ("Words", str(result["word_count"])),
                ("Outputs", ", ".join(result["outputs"])),
            ])
        return 0


    if args.cmd == "hello":
        info = {"clarimeet_version": __version__, "python_version": platform.python_version(), "platform": platform.platform()}
        print(json.dumps(info, indent=2) if args.json else f"ClariMeet v{info['clarimeet_version']} on Python {info['python_version']} ({info['platform']})")
        return 0

    if args.cmd == "probe":
        wav = probe_wav(args.audio)
        out = {"path": str(wav.path), "channels": wav.channels, "sample_rate": wav.sample_rate, "frames": wav.frames,
               "duration_sec": round(wav.duration_sec, 3), "sampwidth_bytes": wav.sampwidth_bytes}
        print(json.dumps(out, indent=2) if args.json else f"{out['path']} — {out['channels']}ch @ {out['sample_rate']}Hz — {out['duration_sec']}s — sampwidth {out['sampwidth_bytes']}B")
        return 0

    if args.cmd == "transcribe":
        out_dir = args.out_dir or get_cfg(cfg, "transcribe", "out_dir", default="outputs")
        session = args.session or get_cfg(cfg, "transcribe", "session", default=None)
        model = args.model or get_cfg(cfg, "transcribe", "model", default="base")
        language = args.language or get_cfg(cfg, "transcribe", "language", default=None)
        temperature = args.temperature if args.temperature is not None else float(get_cfg(cfg, "transcribe", "temperature", default=0.0))
        seed_cfg = args.seed if args.seed is not None else get_cfg(cfg, "transcribe", "seed", default=None)
        seed = int(seed_cfg) if isinstance(seed_cfg, (int, str)) and str(seed_cfg).isdigit() else None
        try:
            res = transcribe_file(audio_path=args.audio, out_dir=out_dir, model_name=model, language=language, session=session, temperature=temperature, seed=seed)
        except FileNotFoundError as e:
            print(f"[error] {e}"); return 2
        except Exception as e:
            print(f"[error] transcription failed: {e}"); return 2
        run_log = Path(res.session_dir) / "run.log"; setup_logging(args.verbose, log_file=run_log)
        summary = {"session_id": res.session_id, "session_dir": str(res.session_dir), "language": res.language, "segments": len(res.segments),
                   "duration_sec": round(res.duration_sec, 2), "model": model, "out_dir": out_dir, "seed": seed,
                   "outputs": ["transcript.txt","captions.srt","transcript.jsonl","meta.json","manifest.json","run.log"]}
        print(json.dumps(summary, indent=2) if args.json else
              print_kv_block("ClariMeet — Transcribe Summary", [("Session", summary["session_id"]), ("Session dir", summary["session_dir"]),
                                                                ("Language", summary["language"]), ("Segments", str(summary["segments"])),
                                                                ("Model", summary["model"]), ("Seed", str(summary["seed"]) if summary["seed"] is not None else "(none)"),
                                                                ("Outputs", ", ".join(summary["outputs"]))]))
        return 0

    if args.cmd == "summarize":
        session_dir = Path(args.session_dir) if args.session_dir else Path(args.out_dir or get_cfg(cfg, "summarize", "out_dir", default="outputs")) / args.session
        if not session_dir.exists(): print(f"[error] session folder not found: {session_dir}"); return 2
        run_log = session_dir / "run.log"; setup_logging(args.verbose, log_file=run_log)
        max_bullets = args.max_bullets if args.max_bullets is not None else int(get_cfg(cfg, "summarize", "max_bullets", default=3))
        try:
            outs = summarize_session(session_dir=session_dir, max_bullets=max(1, min(max_bullets, 5))); written = write_outputs(session_dir=session_dir, outs=outs)
        except FileNotFoundError as e: print(f"[error] {e}"); return 2
        except Exception as e: print(f"[error] summarize failed: {e}"); return 2
        result = {"session_dir": str(session_dir), "written": written, "short_bullets": outs.short_bullets,
                  "decisions_count": len(outs.decisions), "actions_count": len(outs.actions)}
        print(json.dumps(result, indent=2) if args.json else
              print_kv_block("ClariMeet — Summarize Summary", [("Session dir", result["session_dir"]), ("Written", ", ".join(result["written"])),
                                                               ("TL;DR bullets", str(len(result["short_bullets"]))), ("Decisions", str(result["decisions_count"])),
                                                               ("Actions", str(result["actions_count"]))]))
        return 0

    if args.cmd == "diarize":
        session_dir = Path(args.session_dir) if args.session_dir else Path(args.out_dir or get_cfg(cfg, "diarize", "out_dir", default="outputs")) / args.session
        if not session_dir.exists(): print(f"[error] session folder not found: {session_dir}"); return 2
        run_log = session_dir / "run.log"; setup_logging(args.verbose, log_file=run_log)
        min_pause = args.min_pause if args.min_pause is not None else float(get_cfg(cfg, "diarize", "min_pause", default=0.8))
        try:
            rows, speakers = diarize_pause_alternation(session_dir=session_dir, min_pause=min_pause)
        except FileNotFoundError as e: print(f"[error] {e}"); return 2
        except Exception as e: print(f"[error] diarize failed: {e}"); return 2
        summary = {"session_dir": str(session_dir), "segments_tagged": len(rows), "speakers": speakers, "min_pause": min_pause,
                   "outputs": ["transcript_spk.jsonl", "captions_spk.srt", "speakers.json"]}
        print(json.dumps(summary, indent=2) if args.json else
              print_kv_block("ClariMeet — Diarize Summary", [("Session dir", summary["session_dir"]), ("Segments tagged", str(summary["segments_tagged"])),
                                                             ("Speakers", ", ".join(summary["speakers"])), ("Min pause (sec)", str(summary["min_pause"])),
                                                             ("Outputs", ", ".join(summary["outputs"]))]))
        return 0

    if args.cmd == "diarize-hf":
        session_dir = Path(args.session_dir) if args.session_dir else Path(args.out_dir or get_cfg(cfg, "diarize", "out_dir", default="outputs")) / args.session
        if not session_dir.exists(): print(f"[error] session folder not found: {session_dir}"); return 2
        run_log = session_dir / "run.log"; setup_logging(args.verbose, log_file=run_log)
        hf_token = args.hf_token or get_cfg(cfg, "huggingface", "token", default=None)
        pipeline = args.pipeline or get_cfg(cfg, "huggingface", "pipeline", default="pyannote/speaker-diarization-3.1")
        num_speakers = args.num_speakers
        try:
            res = diarize_with_pyannote(session_dir=session_dir, hf_token=hf_token, pipeline_name=pipeline, num_speakers=num_speakers)
        except FileNotFoundError as e: print(f"[error] {e}"); return 2
        except Exception as e: print(f"[error] diarize-hf failed: {e}"); return 2
        result = {"session_dir": str(res.session_dir), "segments_tagged": res.segments_tagged, "speakers": res.speakers,
                  "pipeline": res.pipeline, "token_source": res.token_source,
                  "outputs": ["transcript_spk_pyannote.jsonl", "captions_spk_pyannote.srt", "speakers_pyannote.json"]}
        print(json.dumps(result, indent=2) if args.json else
              print_kv_block("ClariMeet — Diarize (Pyannote) Summary", [("Session dir", result["session_dir"]),
                                                                         ("Segments tagged", str(result["segments_tagged"])),
                                                                         ("Speakers", ", ".join(result["speakers"])),
                                                                         ("Pipeline", result["pipeline"]),
                                                                         ("Token source", result["token_source"]),
                                                                         ("Outputs", ", ".join(result["outputs"]))]))
        return 0

    # --- MOVE REPORT HANDLER ABOVE ANY FALLBACKS ---
    if args.cmd == "report":
        if args.session_dir:
            session_dir = Path(args.session_dir)
        else:
            base_out = Path(args.out_dir or get_cfg(cfg, "summarize", "out_dir", default="outputs"))
            session_dir = base_out / args.session
        if not session_dir.exists():
            print(f"[error] session folder not found: {session_dir}")
            return 2

        run_log = session_dir / "run.log"
        setup_logging(args.verbose, log_file=run_log)

        try:
            p = render_report(session_dir=session_dir, auto_open=bool(args.open))
        except FileNotFoundError as e:
            print(f"[error] {e}")
            return 2
        except Exception as e:
            print(f"[error] report failed: {e}")
            return 2

        result = {"session_dir": str(session_dir), "report": str(p)}
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print_kv_block("ClariMeet — Report Summary", [
                ("Session dir", result["session_dir"]),
                ("Report", result["report"]),
            ])
        return 0

    if args.cmd == "ingest-extract":
        try:
            res = ingest_extract(video_path=args.video, org_id=args.org, meeting_id=args.meeting, storage_root=args.storage)
        except FileNotFoundError as e:
            print(f"[error] {e}"); return 2
        except Exception as e:
            print(f"[error] ingest-extract failed: {e}"); return 2
        out = {
            "org_id": res.org_id,
            "meeting_id": res.meeting_id,
            "video_uri": res.video_uri,
            "audio_uri": res.audio_uri,
            "sample_rate": res.sample_rate,
            "channels": res.channels,
            "duration_sec": res.duration_sec,
            "storage_root": str(res.storage_root),
        }
        if args.json:
            print(json.dumps(out, indent=2))
        else:
            from .printing import print_kv_block
            print_kv_block("ClariMeet — Ingest Extract", [
                ("Org", out["org_id"]),
                ("Meeting", out["meeting_id"]),
                ("Video", out["video_uri"]),
                ("Audio", out["audio_uri"]),
                ("Sample rate", str(out["sample_rate"])),
                ("Channels", str(out["channels"])),
                ("Duration (s)", str(out["duration_sec"])),
            ])
        return 0

    if args.cmd == "asr-run":
        # merge config defaults
        model = args.model or get_cfg(cfg, "transcribe", "model", default="tiny")
        temperature = args.temperature if args.temperature is not None else float(get_cfg(cfg, "transcribe", "temperature", default=0.0))
        seed = args.seed
        if seed is None:
            seed_cfg = get_cfg(cfg, "transcribe", "seed", default=None)
            seed = int(seed_cfg) if isinstance(seed_cfg, (int, str)) and str(seed_cfg).isdigit() else None
        try:
            res = asr_run(
                org_id=args.org,
                meeting_id=args.meeting,
                storage_root=args.storage,
                model=model,
                language=args.language,
                temperature=temperature,
                seed=seed,
                session=args.session,
            )
        except FileNotFoundError as e:
            print(f"[error] {e}"); return 2
        except Exception as e:
            print(f"[error] asr-run failed: {e}"); return 2

        summary = {
            "org_id": res.org_id,
            "meeting_id": res.meeting_id,
            "storage_root": str(res.storage_root),
            "session_id": res.session_id,
            "session_dir": str(res.session_dir),
            "model": res.model,
            "language": res.language,
            "segments": res.segments,
            "outputs": ["transcript.txt", "captions.srt", "transcript.jsonl", "meta.json", "manifest.json", "run.log"],
        }
        if args.json:
            print(json.dumps(summary, indent=2))
        else:
            print_kv_block("ClariMeet — ASR Run Summary", [
                ("Org", summary["org_id"]),
                ("Meeting", summary["meeting_id"]),
                ("Session", summary["session_id"]),
                ("Session dir", summary["session_dir"]),
                ("Language", str(summary["language"])),
                ("Segments", str(summary["segments"])),
                ("Model", summary["model"]),
                ("Outputs", ", ".join(summary["outputs"])),
            ])
        return 0

    if args.cmd == "asr-report":
        base = Path(args.storage) / args.org / args.meeting
        asr_dir = base / "asr"
        session = args.session
        if not session:
            # read latest pointer
            ptr = base / "asr_latest.json"
            if not ptr.exists():
                print(f"[error] no --session given and {ptr} not found")
                return 2
            try:
                session = json.loads(ptr.read_text(encoding="utf-8")).get("latest_session")
            except Exception as e:
                print(f"[error] could not read {ptr}: {e}")
                return 2
        session_dir = asr_dir / session
        if not session_dir.exists():
            print(f"[error] session folder not found: {session_dir}")
            return 2

        # log to that session's run.log as well
        run_log = session_dir / "run.log"
        setup_logging(args.verbose, log_file=run_log)

        try:
            p = render_report(session_dir=session_dir, auto_open=bool(args.open))
        except FileNotFoundError as e:
            print(f"[error] {e}")
            return 2
        except Exception as e:
            print(f"[error] asr-report failed: {e}")
            return 2

        result = {"org_id": args.org, "meeting_id": args.meeting, "session": session, "report": str(p)}
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            from .printing import print_kv_block
            print_kv_block("ClariMeet — ASR Report", [
                ("Org", result["org_id"]),
                ("Meeting", result["meeting_id"]),
                ("Session", result["session"]),
                ("Report", result["report"]),
            ])
        return 0



    # Fallback for unknown cmd (shouldn't happen because subparsers are required)
    print("[error] Unknown command")
    return 2
    


if __name__ == "__main__":
    raise SystemExit(main())
