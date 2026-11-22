"use client";

import { useId } from "react";
import type { SafeAreaMode } from "@/generators/shared/safeArea";

interface Props {
  mode: SafeAreaMode;
  onChange: (mode: SafeAreaMode) => void;
}

/** Lock-screen safe area for phones and tablets: keeps the clock (and optionally the bottom buttons) clear. */
export function SafeAreaToggle({ mode, onChange }: Props) {
  const id = useId();
  const on = mode !== "off";
  return (
    <div className="safe-area">
      <label className="toggle" htmlFor={`${id}-top`}>
        Keep the clock area clear
        <input id={`${id}-top`} type="checkbox" role="switch" checked={on} onChange={(e) => onChange(e.target.checked ? "clock" : "off")} />
      </label>
      {on && (
        <label className="toggle" htmlFor={`${id}-bottom`}>
          Keep the bottom buttons clear too
          <input
            id={`${id}-bottom`}
            type="checkbox"
            role="switch"
            checked={mode === "clock-bottom"}
            onChange={(e) => onChange(e.target.checked ? "clock-bottom" : "clock")}
          />
        </label>
      )}
      <small className="hint">
        {on ? "The dashed box shows the area I keep free of shapes." : "Handy for a lock screen, so the time stays easy to read."}
      </small>
    </div>
  );
}
