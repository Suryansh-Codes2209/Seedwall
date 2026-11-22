import { getDevice } from "../../config/devices";
import type { Size } from "../types";
import type { Box } from "./text";

/**
 * Lock-screen safe area: extra clear zones over the clock and date at the top of a phone or
 * tablet lock screen, and optionally the flashlight and camera buttons at the bottom.
 *
 * It is a hidden param of the shared text layer (`text.safeArea`), so every look that masks its
 * shapes out of the text's clear zones keeps these areas clear too. The default is "off", which
 * adds no zones, so existing renders and seed links stay byte-identical.
 */
export const SAFE_AREA = "text.safeArea";

export const SAFE_AREA_MODES = [
  { value: "off", label: "Off" },
  { value: "clock", label: "Clock and date" },
  { value: "clock-bottom", label: "Clock, date and bottom buttons" },
] as const;

export type SafeAreaMode = (typeof SAFE_AREA_MODES)[number]["value"];

/** Fractions of the height kept clear: [top band, bottom strip]. */
function bands(size: Size): [number, number] {
  const r = size.h / size.w;
  if (r >= 1.6) return [0.3, 0.12]; // phone, portrait
  if (r >= 1) return [0.24, 0.08]; // tablet, portrait
  return [0.3, 0.1]; // landscape tablet or phone
}

/** The zones to keep clear for a mode, in canvas pixels. Unknown modes count as "off". */
export function lockScreenZones(size: Size, mode: unknown): Box[] {
  if (mode !== "clock" && mode !== "clock-bottom") return [];
  const [top, bottom] = bands(size);
  const zones: Box[] = [{ x: 0, y: 0, w: size.w, h: Math.round(size.h * top) }];
  if (mode === "clock-bottom") {
    const hb = Math.round(size.h * bottom);
    zones.push({ x: 0, y: size.h - hb, w: size.w, h: hb });
  }
  return zones;
}

/** Whether the studio offers the toggle: phone and tablet presets, or a portrait custom size. */
export function safeAreaApplies(device: string, w: number, h: number): boolean {
  const d = getDevice(device);
  if (d) return d.kind === "phone" || d.kind === "tablet";
  return device === "custom" && h > w;
}
