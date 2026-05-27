"""Sync prompts/prompt.txt into web/src/data/salesbot-prompt.ts for the Vercel UI preset."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROMPT = ROOT / "prompts" / "prompt.txt"
OUT = ROOT / "web" / "src" / "data" / "salesbot-prompt.ts"


def main() -> None:
    text = PROMPT.read_text(encoding="utf-8")
    OUT.write_text(f"export const SALESBOT_VOICE_PROMPT = {text!r};\n", encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
