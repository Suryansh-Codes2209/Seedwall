"use client";

import { useState } from "react";

interface Props {
  code: string;
  /** What the block is, for the copy button's label (e.g. "PowerShell script"). */
  label: string;
}

/** A code block with a copy button. Without JavaScript it is still a plain, selectable <pre>. */
export function CopyCode({ code, label }: Props) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 1800);
  }

  return (
    <div className="code-block">
      <pre>{code}</pre>
      <button type="button" className="btn btn-sm code-copy" onClick={copy} aria-label={`Copy the ${label}`}>
        {state === "copied" ? "Copied" : state === "failed" ? "Select and copy" : "Copy"}
      </button>
      <span className="sr-only" aria-live="polite">{state === "copied" ? `${label} copied` : ""}</span>
    </div>
  );
}
