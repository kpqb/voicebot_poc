"use client";

import { ChatConnectionProvider } from "@/hooks/use-chat-connection";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

export function ChatProviders({ children }: { children: React.ReactNode }) {
  return (
    <ChatConnectionProvider>
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </ChatConnectionProvider>
  );
}
