"use client";

import { useId } from "react";
import type { SafeAreaMode } from "@/generators/shared/safeArea";

interface Props {
  mode: SafeAreaMode;
  /** False when the current look has no shapes to move out of the way. */
  hasEffect?: boolean;
  onChange: (mode: SafeAreaMode) => void;
}

function hint(on: boolean, hasEffect: boolean): string {
  if (!on) return "Handy for a lock screen, so the time stays easy to read.";
  if (hasEffect) return "The dashed box shows the area I keep free of shapes.";
  return "This look is a soft blend with nothing to move, so it looks the same. Try Topographic or Cutting Mat.";
}

/** Lock-screen safe area for phones and tablets: keeps the clock (and optionally the bottom buttons) clear. */
export function SafeAreaToggle({ mode, hasEffect = true, onChange }: Props) {
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
        {hint(on, hasEffect)}
      </small>
    </div>
  );
}
