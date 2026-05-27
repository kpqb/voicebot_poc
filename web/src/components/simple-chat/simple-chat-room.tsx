"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
  BarVisualizer,
  useConnectionState,
  useVoiceAssistant,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import type { AgentState } from "@livekit/components-react";
import {
  Loader2,
  LogOut,
  AlertCircle,
  Phone,
  Info,
  MessageSquare,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentProvider, useAgent } from "@/hooks/use-agent";
import { useChatConnection } from "@/hooks/use-chat-connection";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ChatSessionInfo } from "@/components/simple-chat/chat-session-info";
import { ChatTranscriptPanel } from "@/components/simple-chat/chat-transcript-panel";
import { ChatControlBar } from "@/components/simple-chat/chat-control-bar";

type MobileTab = "voice" | "transcript" | "info";

function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: "neutral" | "connecting" | "live" | "listening" | "speaking" | "thinking";
}) {
  const colors = {
    neutral: "bg-neutral-100 text-neutral-600",
    connecting: "bg-amber-100 text-amber-800",
    live: "bg-emerald-100 text-emerald-800",
    listening: "bg-blue-100 text-blue-800",
    speaking: "bg-violet-100 text-violet-800",
    thinking: "bg-orange-100 text-orange-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colors[variant],
      )}
    >
      <span
        className={cn(
          "mr-1.5 h-1.5 w-1.5 rounded-full",
          variant === "connecting" && "animate-pulse bg-amber-500",
          variant === "live" && "bg-emerald-500",
          variant === "listening" && "bg-blue-500 animate-pulse",
          variant === "speaking" && "bg-violet-500 animate-pulse",
          variant === "thinking" && "bg-orange-500 animate-pulse",
          variant === "neutral" && "bg-neutral-400",
        )}
      />
      {label}
    </span>
  );
}

function ChatHeader({
  statusBadge,
  onLogout,
}: {
  statusBadge: React.ReactNode;
  onLogout: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-white shrink-0 shadow-sm">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-neutral-900 truncate">
          AI Sante
        </h1>
        <p className="text-xs text-neutral-500 truncate">
          Voice sales assistant · Arya
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {statusBadge}
        <Button variant="ghost" size="sm" onClick={onLogout}>
          <LogOut className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </div>
    </header>
  );
}

function MobileTabBar({
  active,
  onChange,
}: {
  active: MobileTab;
  onChange: (tab: MobileTab) => void;
}) {
  const tabs: { id: MobileTab; label: string; icon: React.ElementType }[] = [
    { id: "voice", label: "Voice", icon: Volume2 },
    { id: "transcript", label: "Transcript", icon: MessageSquare },
    { id: "info", label: "Info", icon: Info },
  ];

  return (
    <div className="flex border-b bg-white lg:hidden shrink-0">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
            active === id
              ? "border-b-2 border-emerald-600 text-emerald-700 bg-emerald-50/50"
              : "text-neutral-500 hover:text-neutral-700",
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

function VoicePanel({
  statusLabel,
  statusVariant,
  isLive,
  state,
  audioTrack,
}: {
  statusLabel: string;
  statusVariant: "neutral" | "connecting" | "live" | "listening" | "speaking" | "thinking";
  isLive: boolean;
  state: AgentState;
  audioTrack: ReturnType<typeof useVoiceAssistant>["audioTrack"];
}) {
  return (
    <div className="flex flex-col flex-1 items-center justify-center p-6 gap-5 min-h-[240px]">
      <div className="text-center space-y-2">
        <StatusBadge label={statusLabel} variant={statusVariant} />
        <p className="text-sm text-neutral-500 max-w-xs">
          {isLive
            ? "Speak naturally — Arya will respond when you pause."
            : "Connecting you to Arya…"}
        </p>
      </div>

      <div className="relative flex h-52 w-52 items-center justify-center">
        <div
          className={cn(
            "absolute inset-0 rounded-full transition-all duration-500",
            isLive && state === "speaking" && "bg-violet-100 scale-110",
            isLive && state === "listening" && "bg-blue-50 scale-105",
            isLive && state === "thinking" && "bg-orange-50",
            !isLive && "bg-neutral-100",
          )}
        />
        <div className="relative z-10 flex h-36 w-36 items-center justify-center rounded-full bg-white border-2 border-neutral-200 shadow-md overflow-hidden">
          {isLive ? (
            <BarVisualizer
              state={state}
              barCount={5}
              trackRef={audioTrack}
              className="w-full h-full px-4"
            />
          ) : (
            <Loader2 className="h-10 w-10 animate-spin text-neutral-300" />
          )}
        </div>
      </div>

      {isLive && (
        <p className="text-xs text-neutral-400 text-center">
          Microphone active · transcript updates live on the right
        </p>
      )}
    </div>
  );
}

function ChatSession({ onNewSession }: { onNewSession: () => void }) {
  const connectionState = useConnectionState();
  const { audioTrack, state } = useVoiceAssistant();
  const { agent } = useAgent();
  const [hasSeenAgent, setHasSeenAgent] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("voice");

  useEffect(() => {
    if (agent) setHasSeenAgent(true);
  }, [agent]);

  const roomConnected = connectionState === ConnectionState.Connected;
  const isLive = roomConnected && hasSeenAgent;

  const { statusLabel, statusVariant } = (() => {
    if (connectionState === ConnectionState.Connecting) {
      return { statusLabel: "Joining room", statusVariant: "connecting" as const };
    }
    if (connectionState === ConnectionState.Disconnected) {
      return { statusLabel: "Disconnected", statusVariant: "neutral" as const };
    }
    if (roomConnected && !hasSeenAgent) {
      return { statusLabel: "Waiting for Arya", statusVariant: "connecting" as const };
    }
    if (state === "listening") {
      return { statusLabel: "Listening", statusVariant: "listening" as const };
    }
    if (state === "thinking") {
      return { statusLabel: "Thinking", statusVariant: "thinking" as const };
    }
    if (state === "speaking") {
      return { statusLabel: "Speaking", statusVariant: "speaking" as const };
    }
    return { statusLabel: "Connected", statusVariant: "live" as const };
  })();

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <MobileTabBar active={mobileTab} onChange={setMobileTab} />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Info sidebar — desktop always, mobile when tab selected */}
        <div
          className={cn(
            "w-full lg:w-[280px] xl:w-[300px] border-r bg-neutral-50 overflow-y-auto shrink-0",
            mobileTab === "info" ? "flex" : "hidden lg:block",
          )}
        >
          <ChatSessionInfo />
        </div>

        {/* Voice center — desktop always visible, mobile when tab selected */}
        <div
          className={cn(
            "flex flex-col flex-1 min-w-0 min-h-0 bg-neutral-50/80",
            mobileTab === "voice" ? "flex" : "hidden lg:flex",
          )}
        >
          <VoicePanel
            statusLabel={statusLabel}
            statusVariant={statusVariant}
            isLive={isLive}
            state={state}
            audioTrack={audioTrack}
          />
        </div>

        {/* Transcript — desktop always visible, mobile when tab selected */}
        <div
          className={cn(
            "w-full lg:w-[340px] xl:w-[380px] border-l min-h-0 shrink-0 flex flex-col",
            mobileTab === "transcript" ? "flex flex-1" : "hidden lg:flex",
          )}
        >
          <ChatTranscriptPanel />
        </div>
      </div>

      {roomConnected && <ChatControlBar onNewSession={onNewSession} />}
    </div>
  );
}

function ConnectionError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <div>
        <p className="text-lg font-medium text-neutral-900">
          Could not start chat
        </p>
        <p className="mt-2 text-sm text-neutral-500 max-w-md">{message}</p>
      </div>
      <Button onClick={onRetry} className="bg-oai-green">
        Try again
      </Button>
    </div>
  );
}

function SessionEnded({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
        <Phone className="h-7 w-7 text-neutral-400" />
      </div>
      <div>
        <p className="text-lg font-medium text-neutral-900">Call ended</p>
        <p className="mt-2 text-sm text-neutral-500 max-w-sm">
          Your session has ended. Start a new conversation anytime to talk with
          Arya again.
        </p>
      </div>
      <Button onClick={onRestart} className="bg-oai-green">
        <Phone className="mr-2 h-4 w-4" />
        Start new conversation
      </Button>
    </div>
  );
}

export function SimpleChatRoom() {
  const router = useRouter();
  const {
    status,
    error,
    shouldConnect,
    wsUrl,
    token,
    connect,
    disconnect,
  } = useChatConnection();
  const autoStarted = useRef(false);

  const startSession = () => {
    connect().catch(() => {});
  };

  useEffect(() => {
    if (autoStarted.current) return;
    if (status !== "idle") return;
    autoStarted.current = true;
    connect().catch(() => {});
  }, [status, connect]);

  const handleLogout = async () => {
    await disconnect();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const handleNewSession = () => {
    startSession();
  };

  const handleRestart = () => {
    autoStarted.current = true;
    startSession();
  };

  const headerBadge =
    status === "connecting" || status === "idle" ? (
      <StatusBadge label="Connecting" variant="connecting" />
    ) : status === "connected" ? (
      <StatusBadge label="In call" variant="live" />
    ) : status === "ended" ? (
      <StatusBadge label="Ended" variant="neutral" />
    ) : status === "error" ? (
      <StatusBadge label="Error" variant="neutral" />
    ) : null;

  return (
    <div className="flex flex-col h-full bg-neutral-100">
      <ChatHeader statusBadge={headerBadge} onLogout={handleLogout} />

      {status === "error" && error && (
        <ConnectionError message={error} onRetry={handleRestart} />
      )}

      {(status === "idle" || status === "connecting") && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
          <div className="text-center">
            <p className="font-medium text-neutral-900">Starting your session</p>
            <p className="mt-1 text-sm text-neutral-500">
              Connecting to Arya via LiveKit…
            </p>
          </div>
        </div>
      )}

      {status === "ended" && <SessionEnded onRestart={handleRestart} />}

      {status === "connected" && shouldConnect && wsUrl && token && (
        <LiveKitRoom
          key={token}
          serverUrl={wsUrl}
          token={token}
          connect={shouldConnect}
          audio={true}
          className="flex flex-col flex-1 min-h-0"
          style={{ "--lk-bg": "transparent" } as React.CSSProperties}
          options={{ publishDefaults: { stopMicTrackOnMute: true } }}
          onError={(err) => {
            toast({
              title: "Connection error",
              description: err.message,
              variant: "destructive",
            });
          }}
        >
          <AgentProvider>
            <ChatSession onNewSession={handleNewSession} />
            <RoomAudioRenderer />
            <StartAudio label="Click to enable speaker audio" />
          </AgentProvider>
        </LiveKitRoom>
      )}
    </div>
  );
}
