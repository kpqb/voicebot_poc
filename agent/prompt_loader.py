"""Load the voice salesbot system prompt from prompts/."""

from __future__ import annotations

import os
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parent.parent
_DEFAULT_PROMPT = _REPO_ROOT / "prompts" / "prompt.txt"


def load_salesbot_prompt() -> str:
    prompt_path = os.getenv("PROMPT_FILE", str(_DEFAULT_PROMPT))
    path = Path(prompt_path)
    if not path.is_file():
        raise FileNotFoundError(f"Salesbot prompt not found: {path}")
    return path.read_text(encoding="utf-8").strip()
