"use client";

import React, {
  createContext,
  useState,
  useCallback,
  useContext,
} from "react";

export type ConnectFn = () => Promise<void>;

export type ChatConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "error"
  | "ended";

type ChatConnectionContextValue = {
  status: ChatConnectionStatus;
  error: string | null;
  shouldConnect: boolean;
  wsUrl: string;
  token: string;
  disconnect: () => Promise<void>;
  connect: ConnectFn;
};

const ChatConnectionContext = createContext<
  ChatConnectionContextValue | undefined
>(undefined);

export function ChatConnectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [connectionDetails, setConnectionDetails] = useState({
    wsUrl: "",
    token: "",
    shouldConnect: false,
  });
  const [status, setStatus] = useState<ChatConnectionStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(null);

    try {
      const response = await fetch("/api/chat/token", { method: "POST" });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start chat session");
      }

      const { accessToken, url } = await response.json();
      setConnectionDetails({
        wsUrl: url,
        token: accessToken,
        shouldConnect: true,
      });
      setStatus("connected");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start chat session";
      setError(message);
      setStatus("error");
      throw err;
    }
  }, []);

  const disconnect = useCallback(async () => {
    setConnectionDetails({ wsUrl: "", token: "", shouldConnect: false });
    setStatus("ended");
    setError(null);
  }, []);

  return (
    <ChatConnectionContext.Provider
      value={{
        status,
        error,
        wsUrl: connectionDetails.wsUrl,
        token: connectionDetails.token,
        shouldConnect: connectionDetails.shouldConnect,
        connect,
        disconnect,
      }}
    >
      {children}
    </ChatConnectionContext.Provider>
  );
}

export function useChatConnection() {
  const context = useContext(ChatConnectionContext);
  if (!context) {
    throw new Error(
      "useChatConnection must be used within ChatConnectionProvider",
    );
  }
  return context;
}
