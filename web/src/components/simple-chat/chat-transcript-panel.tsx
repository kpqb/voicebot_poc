"use client";

import { useEffect, useRef } from "react";
import { ChevronDown, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgent } from "@/hooks/use-agent";
import { Button } from "@/components/ui/button";

function formatTime(ms?: number) {
  if (!ms) return "";
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatTranscriptPanel() {
  const { displayTranscriptions } = useAgent();
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const userCount = displayTranscriptions.filter(
    (t) => !t.participant?.isAgent,
  ).length;
  const agentCount = displayTranscriptions.filter(
    (t) => t.participant?.isAgent,
  ).length;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayTranscriptions]);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-neutral-500" />
          <span className="text-sm font-semibold text-neutral-900">
            Transcript
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>You: {userCount}</span>
          <span>·</span>
          <span>Arya: {agentCount}</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 min-h-0"
      >
        {displayTranscriptions.length === 0 ? (
          <div className="flex h-full min-h-[120px] items-center justify-center text-center px-4">
            <p className="text-sm text-neutral-400">
              Your conversation will appear here as you and Arya speak.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayTranscriptions.map(({ segment, participant }) => {
              const text = segment.text.trim();
              if (!text) return null;
              const isAgent = participant?.isAgent;

              return (
                <div
                  key={segment.id}
                  className={cn(
                    "flex flex-col gap-1 max-w-[90%]",
                    isAgent ? "items-start" : "items-end ml-auto",
                  )}
                >
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                    <span className="font-medium">
                      {isAgent ? "Arya" : "You"}
                    </span>
                    <span>{formatTime(segment.firstReceivedTime)}</span>
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      isAgent
                        ? "bg-neutral-100 text-neutral-900 rounded-tl-sm"
                        : "bg-emerald-600 text-white rounded-tr-sm",
                    )}
                  >
                    {text}
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {displayTranscriptions.length > 0 && (
        <div className="border-t p-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-neutral-500"
            onClick={scrollToBottom}
          >
            <ChevronDown className="mr-1 h-3.5 w-3.5" />
            Jump to latest
          </Button>
        </div>
      )}
    </div>
  );
}
