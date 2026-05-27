"""Load the voice salesbot system prompt from prompts/."""

from __future__ import annotations

import os
from pathlib import Path

from language_config import ENGLISH_VOICE_PREAMBLE

_REPO_ROOT = Path(__file__).resolve().parent.parent
_DEFAULT_PROMPT = _REPO_ROOT / "prompts" / "prompt.txt"


def load_salesbot_prompt() -> str:
    prompt_path = os.getenv("PROMPT_FILE", str(_DEFAULT_PROMPT))
    path = Path(prompt_path)
    if not path.is_file():
        raise FileNotFoundError(f"Salesbot prompt not found: {path}")
    body = path.read_text(encoding="utf-8").strip()
    return f"{ENGLISH_VOICE_PREAMBLE}{body}"
