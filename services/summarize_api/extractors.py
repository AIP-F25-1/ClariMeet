"""
Rule-based key-point and action-item extractor.
"""

import re
import spacy

NAMES = {"mansi", "siddhi", "nidhiben", "utsav", "advait", "jatin", "sachin"}
ACTION_VERBS = {
    "prepare","create","finalize","send","share","schedule","follow","align",
    "implement","update","review","deploy","test","fix","investigate","document",
    "present","train","integrate","configure","migrate","clean","collect","analyze"
}
DATE_PAT = re.compile(
    r"\b(by|before|on|due|EOD|end of day|tomorrow|next week|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|"
    r"Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|"
    r"Nov(?:ember)?|Dec(?:ember)?|\d{1,2}/\d{1,2}(?:/\d{2,4})?)\b",
    re.I
)

def _nlp():
    return spacy.load("en_core_web_sm", disable=["ner","tagger","lemmatizer"])

def extract_key_bullets(summary: str, max_points: int = 6):
    """Find 3–6 crisp key bullet sentences from summary."""
    nlp = _nlp()
    sents = [s.text.strip() for s in nlp(summary).sents if s.text.strip()]
    scored = []
    for s in sents:
        score = 0
        w = len(s.split())
        if 10 <= w <= 35: score += 2
        if re.search(r"\b\d+(\.\d+)?\b", s): score += 1
        if re.search(r"\b(decision|risk|deadline|issue|blocked|metric|next step|action|owner)\b", s, re.I): score += 2
        scored.append((score, s))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [s for _, s in scored[:max_points]]

def extract_action_items(text: str):
    """Detect who/what/when tasks from text."""
    nlp = _nlp()
    items = []
    for sent in nlp(text).sents:
        s = sent.text.strip()
        if any(re.search(fr"\b{v}\b", s, re.I) for v in ACTION_VERBS):
            who = None
            due = None
            m = re.search(r"@([A-Za-z0-9_]+)", s)
            if m:
                who = m.group(1)
            else:
                for n in NAMES:
                    if re.search(rf"\b{n}\b", s, re.I):
                        who = n
                        break
            m2 = DATE_PAT.search(s)
            if m2:
                due = m2.group(0)
            items.append({"sentence": s, "owner": who, "due": due})
    return items
