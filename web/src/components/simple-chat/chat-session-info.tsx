"use client";

import { Headset, Sparkles, Clock, Shield } from "lucide-react";

const PRODUCTS = [
  {
    name: "AI Sales Bot",
    description: "24/7 lead qualification and pipeline automation",
  },
  {
    name: "Support Copilot",
    description: "Faster ticket handling with consistent replies",
  },
];

const TIPS = [
  "Speak naturally — Arya handles discovery, demos, and objections.",
  "Use your microphone; the transcript updates in real time.",
  "Say “book a demo” when you're ready to schedule.",
];

export function ChatSessionInfo() {
  return (
    <aside className="flex flex-col gap-4 p-4 text-sm">
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Headset className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-neutral-900">Arya</p>
            <p className="text-xs text-neutral-500">AI Sante sales consultant</p>
          </div>
        </div>
        <p className="text-neutral-600 text-xs leading-relaxed">
          Warm, confident pre-sales and sales voice agent. Speaks English only.
          Handles discovery, product overview, objections, and demo booking.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          <Sparkles className="h-3.5 w-3.5" />
          Products
        </div>
        <ul className="space-y-3">
          {PRODUCTS.map((product) => (
            <li key={product.name}>
              <p className="font-medium text-neutral-900">{product.name}</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {product.description}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          <Clock className="h-3.5 w-3.5" />
          Demo hours
        </div>
        <p className="text-neutral-700 text-xs">
          Monday–Friday, 10 AM – 7 PM (your local time)
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          <Shield className="h-3.5 w-3.5" />
          Tips
        </div>
        <ul className="space-y-2 text-xs text-neutral-600 list-disc pl-4">
          {TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
