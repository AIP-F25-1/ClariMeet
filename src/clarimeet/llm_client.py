from __future__ import annotations
import os, json, time
from typing import Dict, List, Optional
import requests

class LLMClient:
    """
    Minimal OpenAI-compatible Chat Completions client.
    Providers supported out-of-the-box:
      - OpenAI (set OPENAI_API_KEY)
      - Groq OpenAI-compatible endpoint (set GROQ_API_KEY and optionally CLARIMEET_LLM_BASE)
      - Any OpenAI-compatible base via CLARIMEET_LLM_BASE and CLARIMEET_LLM_API_KEY
    Env vars:
      CLARIMEET_LLM_MODEL (default: gpt-4o-mini)
      CLARIMEET_LLM_BASE  (default: https://api.openai.com/v1)
      OPENAI_API_KEY / GROQ_API_KEY / CLARIMEET_LLM_API_KEY
    """
    def __init__(
        self,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: float = 120.0,
    ):
        self.model = model or os.getenv("CLARIMEET_LLM_MODEL", "gpt-4o-mini")
        self.base_url = (
            base_url
            or os.getenv("CLARIMEET_LLM_BASE")
            or ("https://api.openai.com/v1")
        )

        # pick an API key
        self.api_key = (
            api_key
            or os.getenv("CLARIMEET_LLM_API_KEY")
            or os.getenv("OPENAI_API_KEY")
            or os.getenv("GROQ_API_KEY")
        )
        if not self.api_key:
            raise RuntimeError(
                "No LLM API key found. Set OPENAI_API_KEY or GROQ_API_KEY or CLARIMEET_LLM_API_KEY."
            )
        self.timeout = timeout
        self._session = requests.Session()

    def chat_json(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 1200,
        extra: Optional[Dict] = None,
    ) -> Dict:
        """
        Ask the model to strictly return JSON. Uses OpenAI 'response_format' when available;
        otherwise, instructs via the prompt and validates.
        """
        url = self.base_url.rstrip("/") + "/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        # Try native JSON mode if supported (OpenAI-style)
        body["response_format"] = {"type": "json_object"}

        if extra:
            body.update(extra)

        resp = self._session.post(url, headers=headers, json=body, timeout=self.timeout)
        if resp.status_code >= 400:
            raise RuntimeError(f"LLM HTTP {resp.status_code}: {resp.text[:500]}")
        data = resp.json()
        try:
            content = data["choices"][0]["message"]["content"]
        except Exception:
            raise RuntimeError(f"LLM bad response: {data}")
        # content should be JSON (response_format=json_object). Parse and return.
        try:
            return json.loads(content)
        except Exception as e:
            # best-effort: sometimes providers wrap JSON in code fences
            s = content.strip().strip("`")
            try:
                fence_start = s.find("{")
                fence_end = s.rfind("}")
                if fence_start != -1 and fence_end != -1:
                    return json.loads(s[fence_start:fence_end+1])
            except Exception:
                pass
            raise RuntimeError(f"LLM returned non-JSON content: {content[:250]} ... ({e})")
