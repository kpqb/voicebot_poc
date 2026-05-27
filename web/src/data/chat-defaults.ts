/** Defaults for the simple /chat UI — kept separate to avoid loading the full prompt bundle. */
export const chatSessionDefaults = {
  voice: "alloy",
  temperature: 0.8,
  maxOutputTokens: null as number | null,
  turnDetection: "server_vad",
  modalities: "text_and_audio",
  vadThreshold: 0.5,
  vadSilenceDurationMs: 200,
  vadPrefixPaddingMs: 300,
};
