"use client";

import { useEffect, useState } from "react";
import {
  TrackToggle,
  useLocalParticipant,
  useMediaDeviceSelect,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import {
  ChevronDown,
  Mic,
  MicOff,
  PhoneOff,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatConnection } from "@/hooks/use-chat-connection";

export function ChatControlBar({ onNewSession }: { onNewSession?: () => void }) {
  const { disconnect } = useChatConnection();
  const localParticipant = useLocalParticipant();
  const deviceSelect = useMediaDeviceSelect({ kind: "audioinput" });
  const [isMuted, setIsMuted] = useState(!localParticipant.isMicrophoneEnabled);

  useEffect(() => {
    setIsMuted(!localParticipant.isMicrophoneEnabled);
  }, [localParticipant.isMicrophoneEnabled]);

  const activeDevice = deviceSelect.devices.find(
    (d) => d.deviceId === deviceSelect.activeDeviceId,
  );

  return (
    <div className="flex flex-col gap-3 border-t bg-white p-4 shrink-0">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 rounded-full border bg-neutral-50 pl-1 pr-3 py-1">
          <TrackToggle
            source={Track.Source.Microphone}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white border shadow-sm hover:bg-neutral-50 transition-colors"
            showIcon={false}
          >
            {isMuted ? (
              <MicOff className="h-5 w-5 text-red-500" />
            ) : (
              <Mic className="h-5 w-5 text-emerald-600" />
            )}
          </TrackToggle>
          <span className="text-sm font-medium text-neutral-700 min-w-[52px]">
            {isMuted ? "Muted" : "Live"}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="max-w-[200px]">
              <span className="truncate">
                {activeDevice?.label || "Microphone"}
              </span>
              <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-[280px]">
            <DropdownMenuLabel className="text-xs uppercase tracking-wider">
              Input device
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {deviceSelect.devices.map((device) => (
              <DropdownMenuCheckboxItem
                key={device.deviceId}
                checked={device.deviceId === deviceSelect.activeDeviceId}
                onCheckedChange={() =>
                  deviceSelect.setActiveMediaDevice(device.deviceId)
                }
              >
                <span className="truncate">{device.label}</span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {onNewSession && (
          <Button variant="outline" size="sm" onClick={onNewSession}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            New session
          </Button>
        )}

        <Button variant="destructive" size="sm" onClick={disconnect}>
          <PhoneOff className="mr-1.5 h-4 w-4" />
          End call
        </Button>
      </div>
    </div>
  );
}
