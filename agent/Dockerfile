FROM python:3.11-slim

WORKDIR /app

COPY agent/requirements.txt ./agent/requirements.txt
RUN pip install --no-cache-dir -r agent/requirements.txt

COPY agent/ ./agent/
COPY prompts/ ./prompts/

WORKDIR /app/agent

ENV PROMPT_FILE=/app/prompts/prompt.txt

CMD ["python", "main.py", "start"]
