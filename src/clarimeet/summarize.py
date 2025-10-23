from __future__ import annotations
from pathlib import Path
from dataclasses import dataclass
import json, re, logging

log = logging.getLogger("clarimeet.summarize")

_STOPWORDS = set("""
a an the and or but if while of in on at to from for by with without about into through during before after above below over under
is are was were be been being am do does did doing have has had having can could should would may might must shall will
i you he she it we they me him her us them my your his her its our their mine yours hers ours theirs this that these those
as than then so such not no nor too very just also only same own each other more most some any all few many much
""".split())

_SENT_SPLIT_RE = re.compile(r'(?<=[.!?])\s+|\n+')

@dataclass
class SummaryOutputs:
    short_bullets: list[str]
    key_points: list[str]
    decisions: list[dict]
    actions: list[dict]
    open_questions: list[str]

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

def _sentences_from_segments(segs: list[dict]) -> list[str]:
    text = " ".join((s.get("text") or "").strip() for s in segs).strip()
    if not text:
        return []
    parts = _SENT_SPLIT_RE.split(text)
    # Clean & keep sentences with some letters
    sents = [re.sub(r'\s+', ' ', p).strip() for p in parts if re.search(r'[A-Za-z]', p or "")]
    return sents

def _tokenize(text: str) -> list[str]:
    return [w.lower() for w in re.findall(r"[A-Za-z']+", text)]

def _sentence_score(sent: str, freqs: dict[str,int]) -> float:
    toks = [t for t in _tokenize(sent) if t not in _STOPWORDS and len(t) > 2]
    if not toks:
        return 0.0
    score = sum(freqs.get(t, 0) for t in toks)
    # light length penalty to avoid overly long sentences
    return score / (1.0 + 0.02 * max(0, len(toks) - 12))

def _build_freqs(sents: list[str]) -> dict[str,int]:
    freqs: dict[str,int] = {}
    for s in sents:
        for t in _tokenize(s):
            if t in _STOPWORDS or len(t) <= 2:
                continue
            freqs[t] = freqs.get(t, 0) + 1
    return freqs

# --- Heuristics for decisions & actions (baseline, no-LLM) ---

_DECISION_PATTERNS = [
    r"\bdecided to\b", r"\bwe decided\b", r"\bdecision\b", r"\bapproved\b", r"\bapprove\b",
    r"\bagreed to\b", r"\bagreed that\b", r"\bconcluded\b", r"\bchoose\b|\bchose\b"
]
_ACTION_PATTERNS = [
    r"\bwill\b", r"\bto (?:do|create|prepare|send|email|schedule|review|update|fix|implement|deploy)\b",
    r"\bplease\b", r"\bfollow ?up\b", r"\baction\b", r"\bassign\b", r"\btake care of\b"
]
_DUE_PAT = re.compile(r"\b(?:by|due)\s+([A-Za-z]{3,9}\s+\d{1,2}|\d{4}-\d{2}-\d{2}|\d{1,2}/\d{1,2}/\d{2,4}|tomorrow|today|monday|tuesday|wednesday|thursday|friday|next week)\b", re.I)
_ASSIGNEE_PATS = [
    re.compile(r"\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+will\b"),
    re.compile(r"\bassign(?:ed)?\s+to\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b"),
]

def _extract_decisions(sents: list[str]) -> list[dict]:
    out = []
    for i, s in enumerate(sents):
        if any(re.search(p, s, re.I) for p in _DECISION_PATTERNS):
            out.append({"sentence_index": i, "text": s.strip(), "confidence": 0.7})
    return out

def _extract_actions(sents: list[str]) -> list[dict]:
    out = []
    for i, s in enumerate(sents):
        if any(re.search(p, s, re.I) for p in _ACTION_PATTERNS):
            assignee = None
            for pat in _ASSIGNEE_PATS:
                m = pat.search(s)
                if m:
                    assignee = m.group(1)
                    break
            due = None
            m = _DUE_PAT.search(s)
            if m:
                due = m.group(1)
            conf = 0.6 + (0.1 if assignee or due else 0.0)
            out.append({"sentence_index": i, "text": s.strip(), "assignee": assignee, "due": due, "confidence": round(conf, 2)})
    return out

def _top_n_sentences(sents: list[str], n: int) -> list[str]:
    freqs = _build_freqs(sents)
    scored = [(i, _sentence_score(s, freqs)) for i, s in enumerate(sents)]
    # keep only informative sentences
    scored = [(i, sc) for i, sc in scored if sc > 0]
    scored.sort(key=lambda x: x[1], reverse=True)
    chosen_idx = sorted(i for i, _ in scored[:n])
    return [sents[i].strip() for i in chosen_idx]

def _first_k_key_points(sents: list[str], k: int = 5) -> list[str]:
    # a slightly longer list of informative sentences
    return _top_n_sentences(sents, min(k, max(3, len(sents)//5 or 3)))

def _open_questions(sents: list[str]) -> list[str]:
    # capture questions that look like unresolved
    qs = []
    for s in sents:
        if s.strip().endswith("?") and not re.search(r"\b(answered|resolved|decided)\b", s, re.I):
            qs.append(s.strip())
    return qs[:5]

def summarize_session(session_dir: str | Path, max_bullets: int = 3) -> SummaryOutputs:
    sdir = Path(session_dir)
    segs = _read_segments(sdir)
    sents = _sentences_from_segments(segs)
    if not sents:
        return SummaryOutputs(short_bullets=[], key_points=[], decisions=[], actions=[], open_questions=[])

    short = _top_n_sentences(sents, max_bullets)
    keys = _first_k_key_points(sents, k=max(5, max_bullets + 2))
    decisions = _extract_decisions(sents)
    actions = _extract_actions(sents)
    open_q = _open_questions(sents)

    return SummaryOutputs(short_bullets=short, key_points=keys, decisions=decisions, actions=actions, open_questions=open_q)

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
            f.write("- (No speech detected or summary unavailable)\n")
        f.write("\n## Key Points\n")
        for kp in outs.key_points:
            f.write(f"- {kp}\n")
        f.write("\n## Decisions\n")
        if outs.decisions:
            for d in outs.decisions:
                f.write(f"- {d['text']}\n")
        else:
            f.write("- None detected\n")
        f.write("\n## Action Items\n")
        if outs.actions:
            for a in outs.actions:
                who = f" (assignee: {a['assignee']})" if a.get("assignee") else ""
                due = f" (due: {a['due']})" if a.get("due") else ""
                f.write(f"- {a['text']}{who}{due}\n")
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
    _write_jsonl(decisions_path, outs.decisions)
    written.append(decisions_path.name)

    actions_path = sdir / "actions.jsonl"
    _write_jsonl(actions_path, outs.actions)
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
