import type { Params } from "@/generators/types";
import type { AnyLiveScene } from "./types";

/** Loop-length multipliers a `speed` value snaps to (speed 2 → 0.5× the loop, speed 0.5 → 2×). */
const LOOP_MULTIPLIERS = [2, 1.5, 1, 0.75, 0.5] as const;

/** The multiplier closest to 1/speed, so every speed still yields a seamless loop. */
export function loopMultiplier(speed: number): number {
  const want = speed > 0 ? 1 / speed : LOOP_MULTIPLIERS[0];
  let best: number = LOOP_MULTIPLIERS[0];
  for (const m of LOOP_MULTIPLIERS) if (Math.abs(m - want) < Math.abs(best - want)) best = m;
  return best;
}

/** Seconds one loop really lasts: the scene's loop scaled by the multiplier its `speed` param snaps to. */
export function effectiveLoopSeconds(scene: AnyLiveScene, params: Params): number {
  const s = Number(params.speed ?? scene.params.speed?.default ?? 1);
  return scene.loopSeconds * loopMultiplier(Number.isFinite(s) ? s : 1);
}

/** Loop phase in [0, 1) after `elapsedMs`, for a scene loop of `loopSeconds` played at `speed`. */
export function phaseAt(elapsedMs: number, loopSeconds: number, speed: number): number {
  const loopMs = loopSeconds * loopMultiplier(speed) * 1000;
  const p = (elapsedMs % loopMs) / loopMs;
  return p < 0 ? p + 1 : p;
}

/** Slack for requestAnimationFrame jitter, so a 30 fps cap on a 60 Hz display draws every other frame. */
const FRAME_SLACK_MS = 2;

/** Whether enough time has passed since the last drawn frame to draw again at `fps`. */
export function shouldDraw(nowMs: number, lastMs: number, fps: number): boolean {
  return nowMs - lastMs >= 1000 / fps - FRAME_SLACK_MS;
}

const MOUSE_HALF_LIFE_MS = 120;

/** Eases the pointer towards `target` exponentially, covering half the distance every 120 ms. */
export function smoothMouse(prev: [number, number], target: [number, number], dtMs: number): [number, number] {
  const k = 1 - 2 ** (-Math.max(0, dtMs) / MOUSE_HALF_LIFE_MS);
  return [prev[0] + (target[0] - prev[0]) * k, prev[1] + (target[1] - prev[1]) * k];
}

/** Pointer in -1..1 (x right, y up, 0 at centre), clamped per axis; non-finite values become 0. */
export function clampMouse(x: number, y: number): [number, number] {
  const c = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(-1, v)) : 0);
  return [c(x), c(y)];
}

/** A pointer position in client pixels → −1…1 over `rect` (x right, y up), clamped like setMouse. */
export function pointerToMouse(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }): [number, number] {
  if (!(rect.width > 0 && rect.height > 0)) return [0, 0];
  return clampMouse(((clientX - rect.left) / rect.width) * 2 - 1, 1 - ((clientY - rect.top) / rect.height) * 2);
}
