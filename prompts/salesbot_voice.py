"""Single-prompt voice sales + pre-sales agent for LiveKit Realtime — no tools, full flow."""

from pathlib import Path

_PROMPT_PATH = Path(__file__).with_name("prompt.txt")

SALESBOT_VOICE_PROMPT = _PROMPT_PATH.read_text(encoding="utf-8").strip()
