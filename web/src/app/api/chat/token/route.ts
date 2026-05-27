import { AccessToken } from "livekit-server-sdk";
import { cookies } from "next/headers";
import { chatSessionDefaults } from "@/data/chat-defaults";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = cookies().get(SESSION_COOKIE)?.value;
  if (!verifySessionToken(session)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.LIVEKIT_URL;

  if (!openaiApiKey) {
    return Response.json(
      { error: "Server misconfigured: OPENAI_API_KEY must be set" },
      { status: 500 },
    );
  }

  if (!apiKey || !apiSecret || !livekitUrl) {
    return Response.json(
      {
        error:
          "Server misconfigured: LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET must be set",
      },
      { status: 500 },
    );
  }

  const roomName = `chat-${Math.random().toString(36).slice(2, 10)}`;
  const {
    voice,
    temperature,
    maxOutputTokens,
    turnDetection,
    modalities,
    vadThreshold,
    vadSilenceDurationMs,
    vadPrefixPaddingMs,
  } = chatSessionDefaults;

  const at = new AccessToken(apiKey, apiSecret, {
    identity: `user-${Math.random().toString(36).slice(2, 8)}`,
    metadata: JSON.stringify({
      modalities,
      voice,
      temperature,
      max_output_tokens: maxOutputTokens,
      openai_api_key: openaiApiKey,
      turn_detection: JSON.stringify({
        type: turnDetection,
        threshold: vadThreshold,
        silence_duration_ms: vadSilenceDurationMs,
        prefix_padding_ms: vadPrefixPaddingMs,
      }),
    }),
  });

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
    canUpdateOwnMetadata: true,
  });

  return Response.json({
    accessToken: await at.toJwt(),
    url: livekitUrl,
  });
}
