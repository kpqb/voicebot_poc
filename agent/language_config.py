"""Realtime voice + language defaults for the salesbot."""

from __future__ import annotations

import os

DEFAULT_REALTIME_MODEL = os.getenv("REALTIME_MODEL", "gpt-realtime")
DEFAULT_VOICE = os.getenv("REALTIME_VOICE", "alloy")
DEFAULT_INPUT_LANGUAGE = os.getenv("INPUT_LANGUAGE", "en")
DEFAULT_TRANSCRIPTION_MODEL = os.getenv(
    "TRANSCRIPTION_MODEL", "gpt-4o-mini-transcribe"
)

ENGLISH_VOICE_PREAMBLE = """\
## CRITICAL — ENGLISH ONLY (READ FIRST)

You are a voice agent on a live phone call. Follow these rules before everything else:

1. **Speak and understand ONLY in English** — every word of every response and all caller input treated as English.
2. **Never use Hindi, Gujarati, Spanish, or any other language** — not even one phrase.
3. **Pronounce numbers, times, emails, dates, and product names clearly and correctly.**
4. Product names: AI Sante, Sales Bot, Support Copilot, CRM, email.
5. Your first message on every call must be entirely in English.

---

"""
