# from __future__ import annotations
# from pathlib import Path
# from dataclasses import dataclass
# import json, re, logging

# log = logging.getLogger("clarimeet.summarize")

# _STOPWORDS = set("""
# a an the and or but if while of in on at to from for by with without about into through during before after above below over under
# is are was were be been being am do does did doing have has had having can could should would may might must shall will
# i you he she it we they me him her us them my your his her its our their mine yours hers ours theirs this that these those
# as than then so such not no nor too very just also only same own each other more most some any all few many much
# """.split())

# _SENT_SPLIT_RE = re.compile(r'(?<=[.!?])\s+|\n+')

# @dataclass
# class SummaryOutputs:
#     short_bullets: list[str]
#     key_points: list[str]
#     decisions: list[dict]
#     actions: list[dict]
#     open_questions: list[str]

# def _read_segments(session_dir: Path) -> list[dict]:
#     p = session_dir / "transcript.jsonl"
#     if not p.exists():
#         raise FileNotFoundError(f"Missing transcript.jsonl in {session_dir}")
#     segs = []
#     with p.open("r", encoding="utf-8") as f:
#         for line in f:
#             line = line.strip()
#             if not line:
#                 continue
#             segs.append(json.loads(line))
#     return segs

# def _sentences_from_segments(segs: list[dict]) -> list[str]:
#     text = " ".join((s.get("text") or "").strip() for s in segs).strip()
#     if not text:
#         return []
#     parts = _SENT_SPLIT_RE.split(text)
#     # Clean & keep sentences with some letters
#     sents = [re.sub(r'\s+', ' ', p).strip() for p in parts if re.search(r'[A-Za-z]', p or "")]
#     return sents

# def _tokenize(text: str) -> list[str]:
#     return [w.lower() for w in re.findall(r"[A-Za-z']+", text)]

# def _sentence_score(sent: str, freqs: dict[str,int]) -> float:
#     toks = [t for t in _tokenize(sent) if t not in _STOPWORDS and len(t) > 2]
#     if not toks:
#         return 0.0
#     score = sum(freqs.get(t, 0) for t in toks)
#     # light length penalty to avoid overly long sentences
#     return score / (1.0 + 0.02 * max(0, len(toks) - 12))

# def _build_freqs(sents: list[str]) -> dict[str,int]:
#     freqs: dict[str,int] = {}
#     for s in sents:
#         for t in _tokenize(s):
#             if t in _STOPWORDS or len(t) <= 2:
#                 continue
#             freqs[t] = freqs.get(t, 0) + 1
#     return freqs

# # --- Heuristics for decisions & actions (baseline, no-LLM) ---

# _DECISION_PATTERNS = [
#     r"\bdecided to\b", r"\bwe decided\b", r"\bdecision\b", r"\bapproved\b", r"\bapprove\b",
#     r"\bagreed to\b", r"\bagreed that\b", r"\bconcluded\b", r"\bchoose\b|\bchose\b"
# ]
# _ACTION_PATTERNS = [
#     r"\bwill\b", r"\bto (?:do|create|prepare|send|email|schedule|review|update|fix|implement|deploy)\b",
#     r"\bplease\b", r"\bfollow ?up\b", r"\baction\b", r"\bassign\b", r"\btake care of\b"
# ]
# _DUE_PAT = re.compile(r"\b(?:by|due)\s+([A-Za-z]{3,9}\s+\d{1,2}|\d{4}-\d{2}-\d{2}|\d{1,2}/\d{1,2}/\d{2,4}|tomorrow|today|monday|tuesday|wednesday|thursday|friday|next week)\b", re.I)
# _ASSIGNEE_PATS = [
#     re.compile(r"\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+will\b"),
#     re.compile(r"\bassign(?:ed)?\s+to\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b"),
# ]

# def _extract_decisions(sents: list[str]) -> list[dict]:
#     out = []
#     for i, s in enumerate(sents):
#         if any(re.search(p, s, re.I) for p in _DECISION_PATTERNS):
#             out.append({"sentence_index": i, "text": s.strip(), "confidence": 0.7})
#     return out

# def _extract_actions(sents: list[str]) -> list[dict]:
#     out = []
#     for i, s in enumerate(sents):
#         if any(re.search(p, s, re.I) for p in _ACTION_PATTERNS):
#             assignee = None
#             for pat in _ASSIGNEE_PATS:
#                 m = pat.search(s)
#                 if m:
#                     assignee = m.group(1)
#                     break
#             due = None
#             m = _DUE_PAT.search(s)
#             if m:
#                 due = m.group(1)
#             conf = 0.6 + (0.1 if assignee or due else 0.0)
#             out.append({"sentence_index": i, "text": s.strip(), "assignee": assignee, "due": due, "confidence": round(conf, 2)})
#     return out

# def _top_n_sentences(sents: list[str], n: int) -> list[str]:
#     freqs = _build_freqs(sents)
#     scored = [(i, _sentence_score(s, freqs)) for i, s in enumerate(sents)]
#     # keep only informative sentences
#     scored = [(i, sc) for i, sc in scored if sc > 0]
#     scored.sort(key=lambda x: x[1], reverse=True)
#     chosen_idx = sorted(i for i, _ in scored[:n])
#     return [sents[i].strip() for i in chosen_idx]

# def _first_k_key_points(sents: list[str], k: int = 5) -> list[str]:
#     # a slightly longer list of informative sentences
#     return _top_n_sentences(sents, min(k, max(3, len(sents)//5 or 3)))

# def _open_questions(sents: list[str]) -> list[str]:
#     # capture questions that look like unresolved
#     qs = []
#     for s in sents:
#         if s.strip().endswith("?") and not re.search(r"\b(answered|resolved|decided)\b", s, re.I):
#             qs.append(s.strip())
#     return qs[:5]

# def summarize_session(session_dir: str | Path, max_bullets: int = 3) -> SummaryOutputs:
#     sdir = Path(session_dir)
#     segs = _read_segments(sdir)
#     sents = _sentences_from_segments(segs)
#     if not sents:
#         return SummaryOutputs(short_bullets=[], key_points=[], decisions=[], actions=[], open_questions=[])

#     short = _top_n_sentences(sents, max_bullets)
#     keys = _first_k_key_points(sents, k=max(5, max_bullets + 2))
#     decisions = _extract_decisions(sents)
#     actions = _extract_actions(sents)
#     open_q = _open_questions(sents)

#     return SummaryOutputs(short_bullets=short, key_points=keys, decisions=decisions, actions=actions, open_questions=open_q)

# def _write_jsonl(path: Path, rows: list[dict]) -> None:
#     with path.open("w", encoding="utf-8") as f:
#         for r in rows:
#             f.write(json.dumps(r, ensure_ascii=False) + "\n")

# def write_outputs(session_dir: str | Path, outs: SummaryOutputs) -> list[str]:
#     sdir = Path(session_dir)
#     written: list[str] = []

#     short_md = sdir / "summary_short.md"
#     with short_md.open("w", encoding="utf-8") as f:
#         f.write("# TL;DR\n\n")
#         for b in outs.short_bullets:
#             f.write(f"- {b}\n")
#     written.append(short_md.name)

#     long_md = sdir / "summary_long.md"
#     with long_md.open("w", encoding="utf-8") as f:
#         f.write("# Meeting Summary\n\n## Overview\n")
#         if outs.short_bullets:
#             for b in outs.short_bullets:
#                 f.write(f"- {b}\n")
#         else:
#             f.write("- (No speech detected or summary unavailable)\n")
#         f.write("\n## Key Points\n")
#         for kp in outs.key_points:
#             f.write(f"- {kp}\n")
#         f.write("\n## Decisions\n")
#         if outs.decisions:
#             for d in outs.decisions:
#                 f.write(f"- {d['text']}\n")
#         else:
#             f.write("- None detected\n")
#         f.write("\n## Action Items\n")
#         if outs.actions:
#             for a in outs.actions:
#                 who = f" (assignee: {a['assignee']})" if a.get("assignee") else ""
#                 due = f" (due: {a['due']})" if a.get("due") else ""
#                 f.write(f"- {a['text']}{who}{due}\n")
#         else:
#             f.write("- None detected\n")
#         f.write("\n## Open Questions\n")
#         if outs.open_questions:
#             for q in outs.open_questions:
#                 f.write(f"- {q}\n")
#         else:
#             f.write("- None noted\n")
#     written.append(long_md.name)

#     decisions_path = sdir / "decisions.jsonl"
#     _write_jsonl(decisions_path, outs.decisions)
#     written.append(decisions_path.name)

#     actions_path = sdir / "actions.jsonl"
#     _write_jsonl(actions_path, outs.actions)
#     written.append(actions_path.name)

#     # Update manifest if present
#     manifest = sdir / "manifest.json"
#     if manifest.exists():
#         try:
#             data = json.loads(manifest.read_text(encoding="utf-8"))
#             files = set(data.get("files", []))
#             files.update(written)
#             data["files"] = sorted(files)
#             manifest.write_text(json.dumps(data, indent=2), encoding="utf-8")
#         except Exception as e:
#             log.warning("Could not update manifest.json: %s", e)

#     return written




from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, List, Dict
import json, logging, os, re

log = logging.getLogger("clarimeet.summarize")

# ---------------------------------------------------------------------
# Public API types (unchanged)
# ---------------------------------------------------------------------

@dataclass
class SummaryOutputs:
    short_bullets: list[str]
    key_points: list[str]
    decisions: list[dict]
    actions: list[dict]
    open_questions: list[str]

# ---------------------------------------------------------------------
# Utilities (read transcript)
# ---------------------------------------------------------------------

def _read_segments(session_dir: Path) -> list[dict]:
    p = session_dir / "transcript.jsonl"
    if not p.exists():
        raise FileNotFoundError(f"Missing transcript.jsonl in {session_dir}")
    segs = []
    with p.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            segs.append(json.loads(line))
    return segs

def _segments_to_compact_text(segs: list[dict], include_speakers: bool = True, max_chars: int = 60_000) -> str:
    """Turn segments into a single compact text block for the LLM."""
    parts: List[str] = []
    total = 0
    for s in segs:
        t = (s.get("text") or "").strip()
        if not t:
            continue
        if include_speakers and s.get("speaker"):
            line = f"{s['speaker']}: {t}"
        else:
            line = t
        parts.append(line)
        total += len(line) + 1
        if total >= max_chars:
            break
    return "\n".join(parts)

# ---------------------------------------------------------------------
# LLM client (lazy import so the module works even if requests not available)
# ---------------------------------------------------------------------

def _get_llm_client():
    from .llm_client import LLMClient  # lazy import
    return LLMClient(
        model=os.getenv("CLARIMEET_LLM_MODEL", "gpt-4o-mini"),
        base_url=os.getenv("CLARIMEET_LLM_BASE", "https://api.openai.com/v1"),
        api_key=os.getenv("CLARIMEET_LLM_API_KEY") or os.getenv("OPENAI_API_KEY") or os.getenv("GROQ_API_KEY"),
        timeout=float(os.getenv("CLARIMEET_LLM_TIMEOUT", "120")),
    )

# ---------------------------------------------------------------------
# Heuristic fallback (your original lightweight rules),
# kept inline to avoid breaking pipeline if LLM is unavailable.
# ---------------------------------------------------------------------

_STOPWORDS = set("""
a an the and or but if while of in on at to from for by with without about into through during before after above below over under
is are was were be been being am do does did doing have has had having can could should would may might must shall will
i you he she it we they me him her us them my your his her its our their mine yours hers ours theirs this that these those
as than then so such not no nor too very just also only same own each other more most some any all few many much
""".split())

_SENT_SPLIT_RE = re.compile(r'(?<=[.!?])\s+|\n+')

def _sentences_from_segments(segs: list[dict]) -> list[str]:
    text = " ".join((s.get("text") or "").strip() for s in segs).strip()
    if not text:
        return []
    parts = _SENT_SPLIT_RE.split(text)
    sents = [re.sub(r'\s+', ' ', p).strip() for p in parts if re.search(r'[A-Za-z]', p or "")]
    return sents

def _tokenize(text: str) -> list[str]:
    return [w.lower() for w in re.findall(r"[A-Za-z']+", text)]

def _build_freqs(sents: list[str]) -> dict[str,int]:
    freqs: dict[str,int] = {}
    for s in sents:
        for t in _tokenize(s):
            if t in _STOPWORDS or len(t) <= 2:
                continue
            freqs[t] = freqs.get(t, 0) + 1
    return freqs

def _sentence_score(sent: str, freqs: dict[str,int]) -> float:
    toks = [t for t in _tokenize(sent) if t not in _STOPWORDS and len(t) > 2]
    if not toks:
        return 0.0
    score = sum(freqs.get(t, 0) for t in toks)
    return score / (1.0 + 0.02 * max(0, len(toks) - 12))

def _top_n_sentences(sents: list[str], n: int) -> list[str]:
    freqs = _build_freqs(sents)
    scored = [(i, _sentence_score(s, freqs)) for i, s in enumerate(sents)]
    scored = [(i, sc) for i, sc in scored if sc > 0]
    scored.sort(key=lambda x: x[1], reverse=True)
    chosen_idx = sorted(i for i, _ in scored[:n])
    return [sents[i].strip() for i in chosen_idx]

def _fallback_rule_based(segs: list[dict], max_bullets: int) -> SummaryOutputs:
    sents = _sentences_from_segments(segs)
    short = _top_n_sentences(sents, max_bullets) if sents else []
    keys  = _top_n_sentences(sents, min(5, max(3, max_bullets+2))) if sents else []
    return SummaryOutputs(
        short_bullets=short,
        key_points=keys,
        decisions=[],
        actions=[],
        open_questions=[s for s in sents if s.endswith("?")][:5] if sents else [],
    )

# ---------------------------------------------------------------------
# LLM prompt & extraction
# ---------------------------------------------------------------------

_SYSTEM = (
    "You are an expert meeting-minutes generator. "
    "Given a transcript, produce concise and faithful minutes. "
    "Only use information present in the transcript; do not invent facts. "
    "Return STRICT JSON matching the required schema."
)

def _make_user_prompt(compact_text: str, max_bullets: int) -> str:
    return f"""
You are given a multi-speaker meeting transcript (one line per utterance).
Create a structured minutes object with the following **sections**:

- short_bullets: {max_bullets} bullet TL;DR (each ≤ 25 words, crisp and specific).
- key_points: 5-8 informative bullets capturing the most important discussion points.
- decisions: array of objects: {{ "text": string, "rationale": string | optional }}.
- actions: array of objects:
    {{
      "text": string,               // the action phrased clearly
      "assignee": string | null,    // person if stated or inferable (else null)
      "due": string | null,         // natural date phrase if stated (e.g., "Friday", "2025-01-10"), else null
      "confidence": number          // 0.0-1.0 reflecting how explicit the action was
    }}
- open_questions: up to 5 unresolved questions explicitly asked in the meeting

Rules:
- Keep each bullet or item short and precise.
- Use only content that appears in the transcript.
- If assignee or due date are not explicit, set them to null (do not guess names/dates).
- Prefer active voice.

Return JSON with exactly these keys:
{{
  "short_bullets": string[],
  "key_points": string[],
  "decisions": {{"text": string, "rationale"?: string}}[],
  "actions": {{"text": string, "assignee": string | null, "due": string | null, "confidence": number}}[],
  "open_questions": string[]
}}

Transcript:
\"\"\"\n{compact_text}\n\"\"\"
""".strip()

def _call_llm(compact_text: str, max_bullets: int) -> Dict:
    client = _get_llm_client()
    messages = [
        {"role": "system", "content": _SYSTEM},
        {"role": "user", "content": _make_user_prompt(compact_text, max_bullets)},
    ]
    # generous tokens for structured output
    return client.chat_json(messages, temperature=0.2, max_tokens=1500)

def _coerce_outputs(d: Dict) -> SummaryOutputs:
    def _arr(key: str) -> List:
        v = d.get(key, [])
        return v if isinstance(v, list) else []
    def _str_list(key: str) -> List[str]:
        out = []
        for x in _arr(key):
            if isinstance(x, str):
                out.append(x.strip())
        return out
    def _obj_list(key: str) -> List[Dict]:
        out = []
        for x in _arr(key):
            if isinstance(x, dict):
                out.append(x)
        return out

    return SummaryOutputs(
        short_bullets=_str_list("short_bullets"),
        key_points=_str_list("key_points"),
        decisions=_obj_list("decisions"),
        actions=_obj_list("actions"),
        open_questions=_str_list("open_questions"),
    )

# ---------------------------------------------------------------------
# Public function (signature unchanged)
# ---------------------------------------------------------------------

def summarize_session(session_dir: str | Path, max_bullets: int = 3) -> SummaryOutputs:
    sdir = Path(session_dir)
    segs = _read_segments(sdir)
    # Prepare input text for the LLM
    compact = _segments_to_compact_text(segs, include_speakers=True)

    # If no LLM configured, fall back gracefully
    use_llm = bool(
        os.getenv("OPENAI_API_KEY")
        or os.getenv("GROQ_API_KEY")
        or os.getenv("CLARIMEET_LLM_API_KEY")
    )

    if not use_llm:
        log.warning("No LLM API key found; using heuristic fallback summarizer.")
        return _fallback_rule_based(segs, max_bullets)

    try:
        raw = _call_llm(compact, max_bullets=max_bullets)
        outs = _coerce_outputs(raw)
        return outs
    except Exception as e:
        log.error("LLM summarization failed, using fallback. Error: %s", e)
        return _fallback_rule_based(segs, max_bullets)

# ---------------------------------------------------------------------
# Write outputs (unchanged public API)
# ---------------------------------------------------------------------

def _write_jsonl(path: Path, rows: list[dict]) -> None:
    with path.open("w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

def write_outputs(session_dir: str | Path, outs: SummaryOutputs) -> list[str]:
    sdir = Path(session_dir)
    written: list[str] = []

    short_md = sdir / "summary_short.md"
    with short_md.open("w", encoding="utf-8") as f:
        f.write("# TL;DR\n\n")
        for b in outs.short_bullets:
            f.write(f"- {b}\n")
    written.append(short_md.name)

    long_md = sdir / "summary_long.md"
    with long_md.open("w", encoding="utf-8") as f:
        f.write("# Meeting Summary\n\n## Overview\n")
        if outs.short_bullets:
            for b in outs.short_bullets:
                f.write(f"- {b}\n")
        else:
            f.write("- (No summary available)\n")
        f.write("\n## Key Points\n")
        for kp in outs.key_points:
            f.write(f"- {kp}\n")
        f.write("\n## Decisions\n")
        if outs.decisions:
            for d in outs.decisions:
                txt = d.get("text", "").strip()
                if not txt:
                    continue
                rationale = d.get("rationale")
                if rationale:
                    f.write(f"- {txt} — rationale: {rationale}\n")
                else:
                    f.write(f"- {txt}\n")
        else:
            f.write("- None detected\n")
        f.write("\n## Action Items\n")
        if outs.actions:
            for a in outs.actions:
                if not isinstance(a, dict):
                    continue
                text = a.get("text", "").strip()
                if not text:
                    continue
                who = f" (assignee: {a['assignee']})" if a.get("assignee") else ""
                due = f" (due: {a['due']})" if a.get("due") else ""
                conf = a.get("confidence")
                cf = f" (conf: {conf:.2f})" if isinstance(conf, (int, float)) else ""
                f.write(f"- {text}{who}{due}{cf}\n")
        else:
            f.write("- None detected\n")
        f.write("\n## Open Questions\n")
        if outs.open_questions:
            for q in outs.open_questions:
                f.write(f"- {q}\n")
        else:
            f.write("- None noted\n")
    written.append(long_md.name)

    decisions_path = sdir / "decisions.jsonl"
    _write_jsonl(decisions_path, outs.decisions if outs.decisions else [])
    written.append(decisions_path.name)

    actions_path = sdir / "actions.jsonl"
    _write_jsonl(actions_path, outs.actions if outs.actions else [])
    written.append(actions_path.name)

    # Update manifest if present
    manifest = sdir / "manifest.json"
    if manifest.exists():
        try:
            data = json.loads(manifest.read_text(encoding="utf-8"))
            files = set(data.get("files", []))
            files.update(written)
            data["files"] = sorted(files)
            manifest.write_text(json.dumps(data, indent=2), encoding="utf-8")
        except Exception as e:
            log.warning("Could not update manifest.json: %s", e)

    return written
