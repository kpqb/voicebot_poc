"use client";

import { PlaygroundStateProvider } from "@/hooks/use-playground-state";
import { ConnectionProvider } from "@/hooks/use-connection";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

export function PlaygroundProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PlaygroundStateProvider>
      <ConnectionProvider>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </ConnectionProvider>
    </PlaygroundStateProvider>
  );
}
