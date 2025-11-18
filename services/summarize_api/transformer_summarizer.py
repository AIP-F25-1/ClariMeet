"""
Transformer-based summarizer using BART/T5.
"""

import re
import spacy
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

MODEL_NAME = "facebook/bart-large-cnn"       # or "t5-base"
MAX_INPUT_TOKENS = 900
MAX_SUMMARY_TOKENS = 180
DEVICE = "cuda" if __import__("torch").cuda.is_available() else "cpu"


def sentencize(text: str):
    """Split long transcript into sentences."""
    nlp = spacy.load("en_core_web_sm", disable=["ner", "tagger", "lemmatizer"])
    nlp.add_pipe("sentencizer")
    doc = nlp(text)
    return [s.text.strip() for s in doc.sents if s.text.strip()]


class TransformerSummarizer:
    def __init__(self, model_name: str = MODEL_NAME):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=True)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(model_name).to(DEVICE)

    def _batch_sentences(self, sentences):
        """Group sentences into chunks under token limit."""
        chunks, cur, cur_tok = [], [], 0
        for s in sentences:
            l = len(self.tokenizer.tokenize(s))
            if cur and (cur_tok + l) > MAX_INPUT_TOKENS:
                chunks.append(" ".join(cur))
                cur, cur_tok = [s], l
            else:
                cur.append(s)
                cur_tok += l
        if cur:
            chunks.append(" ".join(cur))
        return chunks

    def _generate(self, text: str):
        """Run the model on a single chunk."""
        if "t5" in MODEL_NAME or "flan" in MODEL_NAME:
            text = "summarize: " + text
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=MAX_INPUT_TOKENS).to(DEVICE)
        ids = self.model.generate(**inputs, max_length=MAX_SUMMARY_TOKENS, num_beams=4, early_stopping=True)
        return self.tokenizer.decode(ids[0], skip_special_tokens=True).strip()

    def summarize(self, text: str):
        """Full summarization pipeline."""
        sents = sentencize(text)
        if not sents:
            return ""
        chunks = self._batch_sentences(sents)
        partials = [self._generate(c) for c in chunks]
        combined = " ".join(partials)
        final = self._generate(combined)
        return re.sub(r"\s+", " ", final).strip()
