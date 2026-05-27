import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/simple-chat/login-form";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { Headset, MessageSquare, Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Sante — Sign in",
  description: "Sign in to talk with Arya, the AI Sante voice sales assistant.",
};

const FEATURES = [
  {
    icon: Headset,
    title: "Live voice conversation",
    description: "Talk naturally with Arya, your AI Sante sales consultant.",
  },
  {
    icon: MessageSquare,
    title: "Real-time transcript",
    description: "See every message from you and Arya as the call progresses.",
  },
  {
    icon: Calendar,
    title: "Demo booking",
    description: "Schedule a product demo directly during the conversation.",
  },
];

export default function LoginPage() {
  const session = cookies().get(SESSION_COOKIE)?.value;
  if (verifySessionToken(session)) {
    redirect("/chat");
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-100">
      <div className="flex flex-1 flex-col justify-center px-6 py-10 lg:px-12 lg:py-16">
        <div className="max-w-md mx-auto lg:mx-0 w-full">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600 mb-2">
            AI Sante
          </p>
          <h1 className="text-3xl font-bold text-neutral-900 leading-tight">
            Voice sales assistant
          </h1>
          <p className="mt-3 text-neutral-600 leading-relaxed">
            Sign in to start a live voice call with <strong>Arya</strong> — pre-sales
            and sales for AI Sales Bot and Support Copilot.
          </p>

          <ul className="mt-8 space-y-4">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-10 lg:py-16">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-neutral-900">Sign in</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Use your demo credentials to access the voice chat.
            </p>
          </div>
          <LoginForm />
          <p className="mt-6 text-center text-xs text-neutral-400">
            Demo: <span className="font-mono text-neutral-500">admin</span> /{" "}
            <span className="font-mono text-neutral-500">demo</span>
          </p>
        </div>
      </div>
    </div>
  );
}
