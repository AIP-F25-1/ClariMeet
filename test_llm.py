from dotenv import load_dotenv
load_dotenv()

from clarimeet.llm_client import LLMClient

client = LLMClient()
out = client.chat_json(
    [{"role": "user", "content": "Return JSON: {\"ok\": true, \"msg\": \"hello\"}"}],
    temperature=0.0,
    max_tokens=50
)
print(out)
