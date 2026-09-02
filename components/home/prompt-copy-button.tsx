"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function PromptCopyButton({ prompt }: { prompt: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2400);
    } catch {
      setStatus("error");
    }
  }

  const label =
    status === "copied"
      ? "コピーしました"
      : status === "error"
        ? "コピーできませんでした"
        : "頼み方をコピー";

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        className="soft-control inline-flex min-h-11 items-center gap-2 border border-interactive-border bg-paper-white px-4 text-xs font-semibold text-brand-dark transition-colors hover:border-sapphire hover:text-sapphire"
        onClick={copyPrompt}
        type="button"
      >
        {status === "copied" ? (
          <Check aria-hidden="true" className="size-4 text-success" />
        ) : (
          <Copy aria-hidden="true" className="size-4" />
        )}
        {label}
      </button>
      <span aria-live="polite" className="sr-only">
        {status === "idle" ? "" : label}
      </span>
    </div>
  );
}
