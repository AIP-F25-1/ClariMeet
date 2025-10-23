# from __future__ import annotations
# from pathlib import Path
# from typing import List, Dict, Optional
# import json, html, datetime, logging, webbrowser, os

# log = logging.getLogger("clarimeet.report")

# def _load_alignment(sdir: Path):
#     """Return list of aligned word dicts or [] if not present."""
#     p = sdir / "transcript_aligned.json"
#     if not p.exists():
#         return []
#     try:
#         doc = json.loads(p.read_text(encoding="utf-8"))
#         return doc.get("words", []) or []
#     except Exception:
#         return []


# def _file_uri(p: Path) -> str:
#     """Return a file:// URI for a local path (works on Windows & POSIX)."""
#     try:
#         return p.resolve().as_uri()
#     except Exception:
#         return ""

# def _read_text(p: Path) -> Optional[str]:
#     try:
#         return p.read_text(encoding="utf-8")
#     except Exception:
#         return None

# def _read_jsonl(p: Path) -> List[Dict]:
#     rows: List[Dict] = []
#     with p.open("r", encoding="utf-8") as f:
#         for line in f:
#             s = line.strip()
#             if s:
#                 rows.append(json.loads(s))
#     return rows

# def _pick_transcript_variant(sdir: Path) -> tuple[Path, str]:
#     # priority: pyannote > pause-based > raw
#     candidates = [
#         ("transcript_spk_pyannote.jsonl", "pyannote"),
#         ("transcript_spk.jsonl", "pause"),
#         ("transcript.jsonl", "raw"),
#     ]
#     for name, tag in candidates:
#         p = sdir / name
#         if p.exists():
#             return p, tag
#     raise FileNotFoundError("No transcript JSONL found (looked for *_spk_pyannote.jsonl, *_spk.jsonl, transcript.jsonl).")

# def _hhmmss(ts: float) -> str:
#     ts = max(0.0, float(ts))
#     h = int(ts) // 3600
#     m = (int(ts) // 60) % 60
#     s = int(ts) % 60
#     return f"{h:02d}:{m:02d}:{s:02d}"

# def _unique_order(seq):
#     seen = set()
#     out = []
#     for x in seq:
#         if x not in seen:
#             seen.add(x)
#             out.append(x)
#     return out

# def _simple_md_to_html(md: str) -> str:
#     """Tiny converter for our summaries (headings + bullet lists)."""
#     lines = [ln.rstrip() for ln in md.splitlines()]
#     out: List[str] = []
#     in_list = False
#     def end_list():
#         nonlocal in_list
#         if in_list:
#             out.append("</ul>")
#             in_list = False
#     for ln in lines:
#         if ln.startswith("### "):
#             end_list(); out.append(f"<h3>{html.escape(ln[4:])}</h3>")
#         elif ln.startswith("## "):
#             end_list(); out.append(f"<h2>{html.escape(ln[3:])}</h2>")
#         elif ln.startswith("# "):
#             end_list(); out.append(f"<h1>{html.escape(ln[2:])}</h1>")
#         elif ln.strip().startswith("- "):
#             if not in_list:
#                 out.append("<ul>")
#                 in_list = True
#             out.append(f"<li>{html.escape(ln.strip()[2:])}</li>")
#         elif ln.strip() == "":
#             end_list()
#             out.append("<br/>")
#         else:
#             end_list()
#             out.append(f"<p>{html.escape(ln)}</p>")
#     end_list()
#     return "\n".join(out)

# def _update_manifest(sdir: Path, name: str) -> None:
#     mf = sdir / "manifest.json"
#     try:
#         data = {"files": []}
#         if mf.exists():
#             data = json.loads(mf.read_text(encoding="utf-8"))
#         files = set(data.get("files", []))
#         files.add(name)
#         data["files"] = sorted(files)
#         mf.write_text(json.dumps(data, indent=2), encoding="utf-8")
#     except Exception as e:
#         log.warning("Could not update manifest.json: %s", e)

# def render_report(session_dir: str | Path, auto_open: bool = False) -> Path:
#     sdir = Path(session_dir)
#     if not sdir.exists():
#         raise FileNotFoundError(f"Session folder not found: {sdir}")

#     # meta & summaries
#     meta_p = sdir / "meta.json"
#     meta = json.loads(meta_p.read_text(encoding="utf-8")) if meta_p.exists() else {}
#     short_md = _read_text(sdir / "summary_short.md") or "# TL;DR\n\n- (no short summary found)"
#     long_md  = _read_text(sdir / "summary_long.md")  or "# Meeting Summary\n\n- (no long summary found)"
#     short_html = _simple_md_to_html(short_md)
#     long_html  = _simple_md_to_html(long_md)

#     # transcript variant
#     tr_path, variant = _pick_transcript_variant(sdir)
#     rows = _read_jsonl(tr_path)

#     # optional: word-level alignment
#     aligned_words = _load_alignment(sdir)
#     by_seg = {}
#     for w in aligned_words:
#         by_seg.setdefault(int(w.get("segment_index", -1)), []).append(w)
#     for seg_idx in list(by_seg.keys()):
#         by_seg[seg_idx].sort(key=lambda w: (float(w.get("start", 0.0)), float(w.get("end", 0.0))))

#     # speakers & palette
#     speakers = _unique_order([r.get("speaker", None) for r in rows if r.get("speaker")])
#     palette = ["#2563eb","#16a34a","#db2777","#db7c27","#0891b2","#8b5cf6","#059669","#b91c1c"]
#     color_for = {spk: palette[i % len(palette)] for i, spk in enumerate(speakers)}

#     # audio file (from meta) → file:// URI
#     audio_path_str = meta.get("audio", {}).get("path", "")
#     audio_path = Path(audio_path_str) if audio_path_str else None
#     audio_uri = _file_uri(audio_path) if audio_path and audio_path.exists() else ""

#     # build transcript HTML (each .seg has data-start seconds and a clickable timestamp)
#     tr_lines: List[str] = []
#     for idx, r in enumerate(rows):
#         st = float(r.get("start", 0.0))
#         en = float(r.get("end", st))
#         start = _hhmmss(st)
#         end   = _hhmmss(en)
#         txt   = html.escape((r.get("text") or "").strip())
#         spk   = r.get("speaker")
#         badge = ""
#         if spk:
#             col = color_for.get(spk, "#444")
#             badge = f'<span class="badge" style="background:{col}"></span><span class="spk">{html.escape(spk)}</span>'
#         tr_lines.append(f'''
#           <div class="seg" data-start="{st:.3f}">
#             <div class="meta">
#               <a href="#" class="ts" data-start="{st:.3f}">[{start}–{end}]</a>
#               {badge}
#             </div>
#             # AFTER:
#             {f'<div class="txt txt-aligned" data-seg-idx="{idx}">' +
#               " ".join(
#                 f'<span class="w" data-start="{float(w.get("start",0.0)):.3f}" data-end="{float(w.get("end",0.0)):.3f}">{html.escape(str(w.get("word","")))}</span>'
#                 for w in by_seg.get(idx, [])
#               ) +
#               "</div>"
#             if by_seg.get(idx) else
#             f'<div class="txt">{txt}</div>'}

#           </div>''')
#     transcript_html = "\n".join(tr_lines) if tr_lines else "<p>(No segments)</p>"

#     # artifacts list
#     art = []
#     for name in ["transcript.txt","captions.srt","transcript.jsonl","summary_short.md","summary_long.md",
#                  "transcript_spk.jsonl","captions_spk.srt","speakers.json",
#                  "transcript_spk_pyannote.jsonl","captions_spk_pyannote.srt","speakers_pyannote.json",
#                  "meta.json","manifest.json"]:
#         p = sdir / name
#         if p.exists():
#             art.append(f'<li><a href="{name}">{name}</a></li>')
#     artifacts_html = "<ul>" + "\n".join(art) + "</ul>" if art else "<p>(No artifacts found)</p>"

#     # assemble HTML (adds audio player + tiny JS to handle seeking)
#     created_at = meta.get("created_at", "")
#     model = meta.get("model", {}).get("whisper", "unknown")
#     audio = audio_path_str or ""
#     html_out = f"""<!doctype html>
# <html lang="en">
# <head>
# <meta charset="utf-8" />
# <title>ClariMeet Report — {html.escape(sdir.name)}</title>
# <meta name="viewport" content="width=device-width, initial-scale=1" />
# <style>
# :root {{
#   --bg:#0b1020; --bg2:#12192d; --panel:#0f172a; --ink:#e5e7eb; --muted:#a1a1aa;
#   --acc:#38bdf8; --border:#1f2937;
#   --mark:#fde047;
# }}
# html, body {{ background: var(--bg); color: var(--ink); font: 15px/1.6 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; margin:0; }}
# .container {{ max-width: 1000px; margin: 32px auto; padding: 0 16px; }}
# h1, h2, h3 {{ margin: 8px 0 10px; }}
# h1 {{ font-size: 28px; }}
# h2 {{ font-size: 20px; color: var(--acc); }}
# .panel {{ background: var(--panel); border:1px solid var(--border); border-radius: 12px; padding:16px; margin:16px 0; }}
# .grid {{ display:grid; grid-template-columns: 1fr 1fr; gap:16px; }}
# .badge {{ display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:8px; vertical-align:middle; }}
# .spk {{ color:#e5e7ff; margin-right:8px; font-weight:600; }}
# .ts  {{ color:#93c5fd; font-variant-numeric: tabular-nums; margin-right:8px; }}
# .seg {{ padding:10px 12px; border-left: 3px solid #1f2937; margin: 6px 0; background: var(--bg2); border-radius: 8px; }}
# .seg:hover {{ background:#19213a; }}
# .meta {{ margin-bottom: 4px; }}
# legend .item {{ display:inline-flex; align-items:center; margin-right:12px; }}
# legend .dot {{ width:10px;height:10px;border-radius:50%;display:inline-block;margin-right:6px; }}
# .small {{ color: var(--muted); font-size: 12px; }}
# a {{ color:#93c5fd; text-decoration: none; }}
# a:hover {{ text-decoration: underline; }}
# .stickyplayer {{ position: sticky; top: 0; z-index: 20; background: var(--bg); padding: 8px 0; }}
# audio {{ width: 100%; }}

# .w {{ padding: 0 1px; border-radius: 3px; cursor: pointer; }}
#   .w.current {{ background: var(--mark); color: #0b1020; }}
#   .txt-aligned {{ line-height: 1.9; }}

# </style>
# </head>
# <body>
# <div class="container">
#   <h1>ClariMeet Report — {html.escape(sdir.name)}</h1>
#   <p class="small">Created: {html.escape(created_at)} &nbsp;•&nbsp; Audio: {html.escape(str(audio))} &nbsp;•&nbsp; Model: {html.escape(model)} &nbsp;•&nbsp; Transcript variant: {html.escape(variant)}</p>

#   <div class="stickyplayer">
#     {"<audio id='player' controls src='" + html.escape(audio_uri) + "'></audio>" if audio_uri else "<div class='small'>(audio file not found; player disabled)</div>"}
#   </div>

#   <div class="grid">
#     <div class="panel">
#       {short_html}
#     </div>
#     <div class="panel">
#       <h2>Artifacts</h2>
#       {artifacts_html}
#       <h3>Speakers</h3>
#       <legend>
#         {"".join(f'<span class="item"><span class="dot" style="background:{color_for[s]}"></span>{html.escape(s)}</span>' for s in speakers) if speakers else "<span class='small'>(no speaker tags)</span>"}
#       </legend>
#     </div>
#   </div>

#   <div class="panel">
#     {long_html}
#   </div>

#   <div class="panel">
#     <h2>Transcript</h2>
#     {transcript_html}
#   </div>
# </div>

# <script>
# (function() {{
#   const player = document.getElementById('player');

#   // Seek helper (unchanged)
#   function seekTo(sec) {{
#     if (!player) return;
#     try {{
#       player.currentTime = Math.max(0, parseFloat(sec) || 0);
#       player.play().catch(()=>{{}});
#     }} catch (e) {{}}
#   }}

#   // Click timestamps or whole segments to seek (your original)
#   document.addEventListener('click', function(ev) {{
#     const a = ev.target.closest('a.ts');
#     if (a && a.dataset.start) {{
#       ev.preventDefault();
#       seekTo(a.dataset.start);
#       return;
#     }}
#     const seg = ev.target.closest('.seg');
#     if (seg && seg.dataset.start && !ev.target.closest('a')) {{
#       seekTo(seg.dataset.start);
#     }}
#   }});

#   // --- NEW: Karaoke word highlight + word click-to-seek ---
#   // Requires markup like: <span class="w" data-start="12.345" data-end="12.520">Hello</span>
#   const words = Array.from(document.querySelectorAll('.w'));
#   let currentWord = null;

#   function setCurrentWord(el) {{
#     if (currentWord === el) return;
#     if (currentWord) currentWord.classList.remove('current');
#     currentWord = el;
#     if (currentWord) {{
#       currentWord.classList.add('current');
#       // keep the current segment centered if it’s off-screen
#       const seg = currentWord.closest('.seg');
#       if (seg && !isInViewport(seg)) {{
#         seg.scrollIntoView({{ behavior: 'smooth', block: 'center' }});
#       }}
#     }}
#   }}

#   function isInViewport(el) {{
#     const r = el.getBoundingClientRect();
#     return r.top >= 0 && r.bottom <= (window.innerHeight || document.documentElement.clientHeight);
#   }}

#   // Binary search the flat word list by data-start
#   function findWordAt(t) {{
#     if (!words.length) return null;
#     let lo = 0, hi = words.length - 1, mid;
#     while (lo <= hi) {{
#       mid = (lo + hi) >> 1;
#       const s = parseFloat(words[mid].dataset.start);
#       if (s <= t) lo = mid + 1; else hi = mid - 1;
#     }}
#     const cand = words[Math.max(0, Math.min(words.length - 1, hi))];
#     if (!cand) return null;
#     const s = parseFloat(cand.dataset.start), e = parseFloat(cand.dataset.end);
#     return (t >= s && t < e) ? cand : null;
#   }}

#   // Highlight word under the playhead
#   if (player && words.length) {{
#     player.addEventListener('timeupdate', () => {{
#       const t = player.currentTime || 0;
#       const w = findWordAt(t);
#       if (w) setCurrentWord(w);
#     }});
#   }}

#   // Click any word to seek there
#   document.addEventListener('click', function(ev) {{
#     const w = ev.target.closest('.w');
#     if (w && w.dataset.start) {{
#       ev.preventDefault();
#       seekTo(w.dataset.start);
#     }}
#   }});
# }})();
# </script>


# </body>
# </html>"""

#     out_path = sdir / "report.html"
#     out_path.write_text(html_out, encoding="utf-8")
#     _update_manifest(sdir, out_path.name)

#     if auto_open:
#         try:
#             import os, webbrowser
#             if hasattr(os, "startfile"):
#                 os.startfile(out_path)  # type: ignore[attr-defined]
#             else:
#                 webbrowser.open(out_path.as_uri())
#         except Exception as e:
#             log.warning("Could not auto-open report: %s", e)

#     return out_path










from __future__ import annotations
from pathlib import Path
from typing import List, Dict, Optional
import json, html, logging, webbrowser, os

log = logging.getLogger("clarimeet.report")

def _file_uri(p: Path) -> str:
    """Return a file:// URI for a local path (works on Windows & POSIX)."""
    try:
        return p.resolve().as_uri()
    except Exception:
        return ""

def _read_text(p: Path) -> Optional[str]:
    try:
        return p.read_text(encoding="utf-8")
    except Exception:
        return None

def _read_jsonl(p: Path) -> List[Dict]:
    rows: List[Dict] = []
    with p.open("r", encoding="utf-8") as f:
        for line in f:
            s = line.strip()
            if s:
                rows.append(json.loads(s))
    # ensure chronological order
    rows.sort(key=lambda r: float(r.get("start", 0.0)))
    return rows

def _pick_transcript_variant(sdir: Path) -> tuple[Path, str]:
    # priority: pyannote > pause-based > raw
    candidates = [
        ("transcript_spk_pyannote.jsonl", "pyannote"),
        ("transcript_spk.jsonl", "pause"),
        ("transcript.jsonl", "raw"),
    ]
    for name, tag in candidates:
        p = sdir / name
        if p.exists():
            return p, tag
    raise FileNotFoundError("No transcript JSONL found (looked for *_spk_pyannote.jsonl, *_spk.jsonl, transcript.jsonl).")

def _hhmmss(ts: float) -> str:
    ts = max(0.0, float(ts))
    h = int(ts) // 3600
    m = (int(ts) // 60) % 60
    s = int(ts) % 60
    return f"{h:02d}:{m:02d}:{s:02d}"

def _unique_order(seq):
    seen = set()
    out = []
    for x in seq:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out

def _simple_md_to_html(md: str) -> str:
    """Tiny converter for our summaries (headings + bullet lists)."""
    lines = [ln.rstrip() for ln in md.splitlines()]
    out: List[str] = []
    in_list = False
    def end_list():
        nonlocal in_list
        if in_list:
            out.append("</ul>")
            in_list = False
    for ln in lines:
        if ln.startswith("### "):
            end_list(); out.append(f"<h3>{html.escape(ln[4:])}</h3>")
        elif ln.startswith("## "):
            end_list(); out.append(f"<h2>{html.escape(ln[3:])}</h2>")
        elif ln.startswith("# "):
            end_list(); out.append(f"<h1>{html.escape(ln[2:])}</h1>")
        elif ln.strip().startswith("- "):
            if not in_list:
                out.append("<ul>")
                in_list = True
            out.append(f"<li>{html.escape(ln.strip()[2:])}</li>")
        elif ln.strip() == "":
            end_list()
            out.append("<br/>")
        else:
            end_list()
            out.append(f"<p>{html.escape(ln)}</p>")
    end_list()
    return "\n".join(out)

def _update_manifest(sdir: Path, name: str) -> None:
    mf = sdir / "manifest.json"
    try:
        data = {"files": []}
        if mf.exists():
            data = json.loads(mf.read_text(encoding="utf-8"))
        files = set(data.get("files", []))
        files.add(name)
        data["files"] = sorted(files)
        mf.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except Exception as e:
        log.warning("Could not update manifest.json: %s", e)

def _load_alignment(sdir: Path):
    """Return list of aligned word dicts or [] if not present."""
    p = sdir / "transcript_aligned.json"
    if not p.exists():
        return []
    try:
        doc = json.loads(p.read_text(encoding="utf-8"))
        return doc.get("words", []) or []
    except Exception:
        return []

def render_report(session_dir: str | Path, auto_open: bool = False) -> Path:
    sdir = Path(session_dir)
    if not sdir.exists():
        raise FileNotFoundError(f"Session folder not found: {sdir}")

    # meta & summaries
    meta_p = sdir / "meta.json"
    meta = json.loads(meta_p.read_text(encoding="utf-8")) if meta_p.exists() else {}
    short_md = _read_text(sdir / "summary_short.md") or "# TL;DR\n\n- (no short summary found)"
    long_md  = _read_text(sdir / "summary_long.md")  or "# Meeting Summary\n\n- (no long summary found)"
    short_html = _simple_md_to_html(short_md)
    long_html  = _simple_md_to_html(long_md)

    # transcript variant
    tr_path, variant = _pick_transcript_variant(sdir)
    rows = _read_jsonl(tr_path)

    # optional: word-level alignment
    aligned_words = _load_alignment(sdir)
    by_seg: Dict[int, List[Dict]] = {}
    for w in aligned_words:
        by_seg.setdefault(int(w.get("segment_index", -1)), []).append(w)
    for seg_idx in list(by_seg.keys()):
        by_seg[seg_idx].sort(key=lambda w: (float(w.get("start", 0.0)), float(w.get("end", 0.0))))

    # speakers & palette
    speakers = _unique_order([r.get("speaker", None) for r in rows if r.get("speaker")])
    palette = ["#2563eb","#16a34a","#db2777","#db7c27","#0891b2","#8b5cf6","#059669","#b91c1c"]
    color_for = {spk: palette[i % len(palette)] for i, spk in enumerate(speakers)}

    # audio file (from meta) → file:// URI
    audio_path_str = meta.get("audio", {}).get("path", "")
    audio_path = Path(audio_path_str) if audio_path_str else None
    audio_uri = _file_uri(audio_path) if audio_path and audio_path.exists() else ""

    # build transcript HTML (each .seg has data-start and data-end seconds)
    tr_lines: List[str] = []
    for idx, r in enumerate(rows):
        st = float(r.get("start", 0.0))
        en = float(r.get("end", st))
        start = _hhmmss(st)
        end   = _hhmmss(en)
        txt   = html.escape((r.get("text") or "").strip())
        spk   = r.get("speaker")
        badge = ""
        if spk:
            col = color_for.get(spk, "#444")
            badge = f'<span class="badge" style="background:{col}"></span><span class="spk">{html.escape(spk)}</span>'

        # if we have aligned words for this segment, render <span class="w" ...> words
        if by_seg.get(idx):
            words_html = " ".join(
                f'<span class="w" data-start="{float(w.get("start",0.0)):.3f}" data-end="{float(w.get("end",0.0)):.3f}">{html.escape(str(w.get("word","")))}</span>'
                for w in by_seg[idx]
            )
            txt_div = f'<div class="txt txt-aligned" data-seg-idx="{idx}">{words_html}</div>'
        else:
            txt_div = f'<div class="txt">{txt}</div>'

        tr_lines.append(f"""
        <div class="seg" data-start="{st:.3f}" data-end="{en:.3f}">
            <div class="meta">
              <a href="#" class="ts" data-start="{st:.3f}">[{start}–{end}]</a>
              {badge}
            </div>
            {txt_div}
        </div>""")

    transcript_html = "\n".join(tr_lines) if tr_lines else "<p>(No segments)</p>"

    # artifacts list (extended)
    art = []
    for name in [
        "transcript.txt","captions.srt","transcript.jsonl",
        "summary_short.md","summary_long.md",
        "transcript_spk.jsonl","captions_spk.srt","speakers.json",
        "transcript_spk_pyannote.jsonl","captions_spk_pyannote.srt","speakers_pyannote.json",
        "captions.vtt","captions_spk.vtt","captions_spk_pyannote.vtt",
        "transcript_aligned.json","aligned_words.tsv","transcript.v1.json",
        "meta.json","manifest.json","report.html"
    ]:
        p = sdir / name
        if p.exists():
            art.append(f'<li><a href="{name}">{name}</a></li>')
    artifacts_html = "<ul>" + "\n".join(art) + "</ul>" if art else "<p>(No artifacts found)</p>"

    # assemble HTML
    created_at = meta.get("created_at", "")
    model = meta.get("model", {}).get("whisper", "unknown")
    audio = audio_path_str or ""
    html_out = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>ClariMeet Report — {html.escape(sdir.name)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
:root {{
  --bg:#0b1020; --bg2:#12192d; --panel:#0f172a; --ink:#e5e7eb; --muted:#a1a1aa;
  --acc:#38bdf8; --border:#1f2937;
  --mark:#fde047;
}}
html, body {{ background: var(--bg); color: var(--ink); font: 15px/1.6 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; margin:0; }}
.container {{ max-width: 1000px; margin: 32px auto; padding: 0 16px; }}
h1, h2, h3 {{ margin: 8px 0 10px; }}
h1 {{ font-size: 28px; }}
h2 {{ font-size: 20px; color: var(--acc); }}
.panel {{ background: var(--panel); border:1px solid var(--border); border-radius: 12px; padding:16px; margin:16px 0; }}
.grid {{ display:grid; grid-template-columns: 1fr 1fr; gap:16px; }}
.badge {{ display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:8px; vertical-align:middle; }}
.spk {{ color:#e5e7ff; margin-right:8px; font-weight:600; }}
.ts  {{ color:#93c5fd; font-variant-numeric: tabular-nums; margin-right:8px; }}
.seg {{ padding:10px 12px; border-left: 3px solid #1f2937; margin: 6px 0; background: var(--bg2); border-radius: 8px; }}
.seg:hover {{ background:#19213a; }}
.seg.current {{ 
  border-left-color: var(--acc);
  background: #18203a;
  box-shadow: 0 0 0 1px rgba(56,189,248,.15) inset;
}}
.meta {{ margin-bottom: 4px; }}
legend .item {{ display:inline-flex; align-items:center; margin-right:12px; }}
legend .dot {{ width:10px;height:10px;border-radius:50%;display:inline-block;margin-right:6px; }}
.small {{ color: var(--muted); font-size: 12px; }}
a {{ color:#93c5fd; text-decoration: none; }}
a:hover {{ text-decoration: underline; }}
.stickyplayer {{ position: sticky; top: 0; z-index: 20; background: var(--bg); padding: 8px 0; }}
audio {{ width: 100%; }}
.w {{ padding: 0 1px; border-radius: 3px; cursor: pointer; }}
.w.current {{ background: var(--mark); color: #0b1020; }}
.txt-aligned {{ line-height: 1.9; }}
</style>
</head>
<body>
<div class="container">
  <h1>ClariMeet Report — {html.escape(sdir.name)}</h1>
  <p class="small">Created: {html.escape(created_at)} &nbsp;•&nbsp; Audio: {html.escape(str(audio))} &nbsp;•&nbsp; Model: {html.escape(model)} &nbsp;•&nbsp; Transcript variant: {html.escape(variant)}</p>

  <div class="stickyplayer">
    {"<audio id='player' controls src='" + html.escape(audio_uri) + "'></audio>" if audio_uri else "<div class='small'>(audio file not found; player disabled)</div>"}
  </div>

  <div class="grid">
    <div class="panel">
      {short_html}
    </div>
    <div class="panel">
      <h2>Artifacts</h2>
      {artifacts_html}
      <h3>Speakers</h3>
      <legend>
        {"".join(f'<span class="item"><span class="dot" style="background:{color_for[s]}"></span>{html.escape(s)}</span>' for s in speakers) if speakers else "<span class='small'>(no speaker tags)</span>"}
      </legend>
    </div>
  </div>

  <div class="panel">
    {long_html}
  </div>

  <div class="panel">
    <h2>Transcript</h2>
    {transcript_html}
  </div>
</div>

<script>
(function() {{
  const player = document.getElementById('player');

  // Seek helper
  function seekTo(sec) {{
    if (!player) return;
    try {{
      player.currentTime = Math.max(0, parseFloat(sec) || 0);
      player.play().catch(()=>{{}});
    }} catch (e) {{}}
  }}

  // Click timestamps or whole segments to seek
  document.addEventListener('click', function(ev) {{
    const a = ev.target.closest('a.ts');
    if (a && a.dataset.start) {{
      ev.preventDefault();
      seekTo(a.dataset.start);
      return;
    }}
    const seg = ev.target.closest('.seg');
    if (seg && seg.dataset.start && !ev.target.closest('a')) {{
      seekTo(seg.dataset.start);
    }}
  }});

  // --- Karaoke word highlight + word click-to-seek ---
  // Requires markup like: <span class="w" data-start="12.345" data-end="12.520">Hello</span>
  const words = Array.from(document.querySelectorAll('.w'));
  let currentWord = null;
  // keep the current segment row in sync with the current word
  let currentSegRow = null;

  function setCurrentWord(el) {{
    if (currentWord === el) return;
    if (currentWord) currentWord.classList.remove('current');
    currentWord = el;
    if (currentWord) {{
      currentWord.classList.add('current');

      // sync row highlight to the word's segment (works even without data-end)
      const segEl = currentWord.closest('.seg');
      if (segEl && segEl !== currentSegRow) {{
        if (currentSegRow) currentSegRow.classList.remove('current');
        currentSegRow = segEl;
        currentSegRow.classList.add('current');
      }}

      // keep the current segment centered if off-screen
      const seg = currentWord.closest('.seg');
      if (seg && !isInViewport(seg)) {{
        seg.scrollIntoView({{ behavior: 'smooth', block: 'center' }});
      }}
    }}
  }}

  function isInViewport(el) {{
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= (window.innerHeight || document.documentElement.clientHeight);
  }}

  // Binary search the flat word list by data-start
  function findWordAt(t) {{
    if (!words.length) return null;
    let lo = 0, hi = words.length - 1, mid;
    while (lo <= hi) {{
      mid = (lo + hi) >> 1;
      const s = parseFloat(words[mid].dataset.start);
      if (s <= t) lo = mid + 1; else hi = mid - 1;
    }}
    const cand = words[Math.max(0, Math.min(words.length - 1, hi))];
    if (!cand) return null;
    const s = parseFloat(cand.dataset.start), e = parseFloat(cand.dataset.end);
    return (t >= s && t < e) ? cand : null;
  }}

  // Highlight word under the playhead
  if (player && words.length) {{
    player.addEventListener('timeupdate', () => {{
      const t = player.currentTime || 0;
      const w = findWordAt(t);
      if (w) setCurrentWord(w);
    }});
  }}

  // Click any word to seek there
  document.addEventListener('click', function(ev) {{
    const w = ev.target.closest('.w');
    if (w && w.dataset.start) {{
      ev.preventDefault();
      seekTo(w.dataset.start);
    }}
  }});

  // --- (Optional fallback) Segment highlight by times if alignment missing ---
  const segEls = Array.from(document.querySelectorAll('.seg'));
  const segs = segEls.map(el => (({{
    el,
    start: parseFloat(el.dataset.start || '0'),
    end:   parseFloat(el.dataset.end   || (parseFloat(el.dataset.start || '0') + 1e-3)),
  }})));
  let curSeg = null;

  function updateCurrentSegment(t) {{
    if (!segs.length || words.length) return; // karaoke handles row highlight when words exist
    // binary search by start time
    let lo = 0, hi = segs.length - 1, mid;
    while (lo <= hi) {{
      mid = (lo + hi) >> 1;
      if (segs[mid].start <= t) lo = mid + 1; else hi = mid - 1;
    }}
    let i = Math.max(0, Math.min(segs.length - 1, hi));
    while (i + 1 < segs.length && t >= segs[i].end) i++;

    const seg = segs[i];
    if (t < seg.start || t >= seg.end) return;

    if (curSeg === seg) return;
    if (curSeg) curSeg.el.classList.remove('current');
    curSeg = seg;
    curSeg.el.classList.add('current');

    const r = curSeg.el.getBoundingClientRect();
    if (r.top < 0 || r.bottom > (window.innerHeight || document.documentElement.clientHeight)) {{
      curSeg.el.scrollIntoView({{ behavior: 'smooth', block: 'center' }});
    }}
  }}

  if (player && segs.length) {{
    player.addEventListener('timeupdate', () => {{
      updateCurrentSegment(player.currentTime || 0);
    }});
  }}
}})();
</script>

</body>
</html>"""

    out_path = sdir / "report.html"
    out_path.write_text(html_out, encoding="utf-8")
    _update_manifest(sdir, out_path.name)

    if auto_open:
        try:
            if hasattr(os, "startfile"):
                os.startfile(out_path)  # type: ignore[attr-defined]
            else:
                webbrowser.open(out_path.as_uri())
        except Exception as e:
            log.warning("Could not auto-open report: %s", e)

    return out_path
