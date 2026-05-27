import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ChatProviders } from "@/components/providers/chat-providers";
import { SimpleChatRoom } from "@/components/simple-chat/simple-chat-room";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export const metadata: Metadata = {
  title: "AI Sante — Voice Chat",
  description: "Talk with Arya, the AI Sante voice sales assistant.",
};

export default function ChatPage() {
  const session = cookies().get(SESSION_COOKIE)?.value;
  if (!verifySessionToken(session)) {
    redirect("/");
  }

  return (
    <ChatProviders>
      <div className="h-screen flex flex-col">
        <SimpleChatRoom />
      </div>
    </ChatProviders>
  );
}
