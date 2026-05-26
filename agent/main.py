from __future__ import annotations

import asyncio
import json
import logging
import uuid
from dataclasses import asdict, dataclass
from typing import Any, Dict, Literal

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentSession,
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    WorkerType,
    cli,
    llm,
)
from livekit.plugins import openai
from openai.types.realtime import realtime_audio_input_turn_detection

load_dotenv()

logger = logging.getLogger("my-worker")
logger.setLevel(logging.INFO)

DEFAULT_TURN_DETECTION = realtime_audio_input_turn_detection.ServerVad(
    type="server_vad",
    threshold=0.5,
    prefix_padding_ms=200,
    silence_duration_ms=300,
    create_response=True,
)


@dataclass
class SessionConfig:
    openai_api_key: str
    instructions: str
    voice: str
    temperature: float
    max_response_output_tokens: str | int
    modalities: list[Literal["text", "audio"]]
    turn_detection: realtime_audio_input_turn_detection.ServerVad

    def __post_init__(self):
        if self.modalities is None:
            self.modalities = self._modalities_from_string("text_and_audio")

    def to_dict(self):
        return {k: v for k, v in asdict(self).items() if k != "openai_api_key"}

    @staticmethod
    def _modalities_from_string(modalities: str) -> list[Literal["text", "audio"]]:
        modalities_map: dict[str, list[Literal["text", "audio"]]] = {
            "text_and_audio": ["text", "audio"],
            "text_only": ["text"],
        }
        return modalities_map.get(modalities, ["text", "audio"])

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, SessionConfig):
            return False
        return self.to_dict() == other.to_dict()


def parse_session_config(data: Dict[str, Any]) -> SessionConfig:
    turn_detection = DEFAULT_TURN_DETECTION

    if data.get("turn_detection"):
        turn_detection_json = json.loads(data.get("turn_detection"))
        turn_detection = realtime_audio_input_turn_detection.ServerVad(
            type="server_vad",
            threshold=turn_detection_json.get("threshold", 0.5),
            prefix_padding_ms=turn_detection_json.get("prefix_padding_ms", 200),
            silence_duration_ms=turn_detection_json.get("silence_duration_ms", 300),
            create_response=True,
        )

    max_output_tokens = data.get("max_output_tokens")
    if max_output_tokens == "inf":
        max_tokens: str | int = "inf"
    else:
        max_tokens = int(max_output_tokens or 2048)

    return SessionConfig(
        openai_api_key=data.get("openai_api_key", ""),
        instructions=data.get("instructions", ""),
        voice=data.get("voice", "alloy"),
        temperature=float(data.get("temperature", 0.8)),
        max_response_output_tokens=max_tokens,
        modalities=SessionConfig._modalities_from_string(
            data.get("modalities", "text_and_audio")
        ),
        turn_detection=turn_detection,
    )


async def entrypoint(ctx: JobContext):
    logger.info(f"connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    participant = await ctx.wait_for_participant()
    await run_playground_agent(ctx, participant)

    logger.info("agent started")


async def run_playground_agent(ctx: JobContext, participant: rtc.Participant):
    config = parse_session_config(json.loads(participant.metadata))

    logger.info(f"starting playground agent with config: {config.to_dict()}")

    if not config.openai_api_key:
        raise Exception("OpenAI API Key is required")

    model = openai.realtime.RealtimeModel(
        api_key=config.openai_api_key,
        voice=config.voice,
        modalities=config.modalities,
        turn_detection=config.turn_detection,
    )
    model.update_options(max_response_output_tokens=config.max_response_output_tokens)

    agent = Agent(instructions=config.instructions)
    session = AgentSession(llm=model)

    current_config = config

    @ctx.room.local_participant.register_rpc_method("pg.updateConfig")
    async def update_config(data: rtc.rpc.RpcInvocationData):
        nonlocal current_config
        if data.caller_identity != participant.identity:
            return json.dumps({"changed": False})

        new_config = parse_session_config(json.loads(data.payload))
        if current_config == new_config:
            return json.dumps({"changed": False})

        logger.info(
            f"config changed: {new_config.to_dict()}, participant: {participant.identity}"
        )

        await agent.update_instructions(new_config.instructions)
        model.update_options(
            voice=new_config.voice,
            turn_detection=new_config.turn_detection,
            max_response_output_tokens=new_config.max_response_output_tokens,
        )
        current_config = new_config
        return json.dumps({"changed": True})

    await session.start(agent=agent, room=ctx.room)

    rt_session = agent.realtime_llm_session
    if rt_session is None:
        raise RuntimeError("realtime session not available after start")

    setup_playground_handlers(ctx, participant, rt_session)

    if "audio" in config.modalities:
        await session.generate_reply(
            instructions=(
                "Please begin the interaction with the user in a manner "
                "consistent with your instructions."
            )
        )


def setup_playground_handlers(
    ctx: JobContext,
    participant: rtc.Participant,
    rt_session: llm.RealtimeSession,
):
    last_transcript_id: str | None = None

    async def send_transcription(
        remote_participant: rtc.Participant,
        track_sid: str | None,
        segment_id: str,
        text: str,
        is_final: bool = True,
    ):
        if not track_sid:
            return

        transcription = rtc.Transcription(
            participant_identity=remote_participant.identity,
            track_sid=track_sid,
            segments=[
                rtc.TranscriptionSegment(
                    id=segment_id,
                    text=text,
                    start_time=0,
                    end_time=0,
                    language="en",
                    final=is_final,
                )
            ],
        )
        await ctx.room.local_participant.publish_transcription(transcription)

    async def show_toast(
        title: str,
        description: str | None,
        variant: Literal["default", "success", "warning", "destructive"],
    ):
        await ctx.room.local_participant.perform_rpc(
            destination_identity=participant.identity,
            method="pg.toast",
            payload=json.dumps(
                {"title": title, "description": description, "variant": variant}
            ),
        )

    def get_remote_mic_track_sid() -> tuple[rtc.Participant | None, str | None]:
        remote_participant = next(iter(ctx.room.remote_participants.values()), None)
        if not remote_participant:
            return None, None

        track_sid = next(
            (
                track.sid
                for track in remote_participant.track_publications.values()
                if track.source == rtc.TrackSource.SOURCE_MICROPHONE
            ),
            None,
        )
        return remote_participant, track_sid

    @rt_session.on("openai_server_event_received")
    def on_server_event(event: dict[str, Any]):
        if event.get("type") != "response.done":
            return

        response = event.get("response", {})
        status = response.get("status")
        if status == "completed":
            return

        variant: Literal["warning", "destructive"]
        description: str | None = None
        title: str

        if status == "incomplete":
            status_details = response.get("status_details") or {}
            reason = status_details.get("reason")
            if reason == "max_output_tokens":
                variant = "warning"
                title = "Max output tokens reached"
                description = "Response may be incomplete"
            elif reason == "content_filter":
                variant = "warning"
                title = "Content filter applied"
                description = "Response may be incomplete"
            else:
                variant = "warning"
                title = "Response incomplete"
        elif status == "failed":
            status_details = response.get("status_details") or {}
            error = status_details.get("error") or {}
            error_code = error.get("code")
            if error_code == "server_error":
                variant = "destructive"
                title = "Server error"
            elif error_code == "rate_limit_exceeded":
                variant = "destructive"
                title = "Rate limit exceeded"
            else:
                variant = "destructive"
                title = "Response failed"
        else:
            return

        asyncio.create_task(show_toast(title, description, variant))

    @rt_session.on("input_speech_started")
    def on_input_speech_started(_: llm.InputSpeechStartedEvent):
        nonlocal last_transcript_id
        remote_participant, track_sid = get_remote_mic_track_sid()
        if not remote_participant:
            return

        if last_transcript_id:
            asyncio.create_task(
                send_transcription(
                    remote_participant, track_sid, last_transcript_id, ""
                )
            )

        new_id = str(uuid.uuid4())
        last_transcript_id = new_id
        asyncio.create_task(
            send_transcription(
                remote_participant, track_sid, new_id, "…", is_final=False
            )
        )

    @rt_session.on("input_audio_transcription_completed")
    def on_input_audio_transcription_completed(
        _: llm.InputTranscriptionCompleted,
    ):
        nonlocal last_transcript_id
        if not last_transcript_id:
            return

        remote_participant, track_sid = get_remote_mic_track_sid()
        if not remote_participant:
            return

        asyncio.create_task(
            send_transcription(
                remote_participant, track_sid, last_transcript_id, ""
            )
        )
        last_transcript_id = None

    @rt_session.on("openai_server_event_received")
    def on_transcription_failed(event: dict[str, Any]):
        nonlocal last_transcript_id
        if event.get("type") != "conversation.item.input_audio_transcription.failed":
            return
        if not last_transcript_id:
            return

        remote_participant, track_sid = get_remote_mic_track_sid()
        if not remote_participant:
            return

        asyncio.create_task(
            send_transcription(
                remote_participant,
                track_sid,
                last_transcript_id,
                "⚠️ Transcription failed",
            )
        )
        last_transcript_id = None


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, worker_type=WorkerType.ROOM))
