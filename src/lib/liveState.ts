import { DEFAULT_DEVICE, clampDimension, getDevice } from "@/config/devices";
import { coerceParam } from "@/generators/render";
import type { ParamDef, Params, ParamValue } from "@/generators/types";
import { LIVE_SCENES, getLiveScene, resolveLiveParams } from "@/live";
import type { AnyLiveScene } from "@/live/types";
import { b64urlDecode, b64urlEncode } from "./studioState";

/** Everything needed to reproduce a live wallpaper: scene, preset, the params changed from it, and the screen. */
export interface LiveState {
  scene: string;
  preset: string;
  /** Params that differ from the preset. */
  overrides: Partial<Params>;
  /** Device id, or "custom". */
  device: string;
  w: number;
  h: number;
}

const SEED_LIMIT = 1_000_000;

function sceneOrFirst(id: string): AnyLiveScene {
  const scene = getLiveScene(id) ?? LIVE_SCENES[0];
  if (!scene) throw new Error("No live scenes registered");
  return scene;
}

/**
 * coerceParam, except a seed outside 0…999999 (or not a whole number) is dropped rather than
 * wrapped, so a hand-edited link falls back to the preset's seed instead of a surprising one.
 */
function validParam(def: ParamDef, raw: unknown): ParamValue | undefined {
  if (def.kind === "seed") {
    const n = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() !== "" ? Number(raw) : Number.NaN;
    if (!Number.isInteger(n) || n < 0 || n >= SEED_LIMIT) return undefined;
  }
  return coerceParam(def, raw);
}

/** Valid overrides that differ from the preset; unknown keys and bad values are dropped. */
function cleanOverrides(scene: AnyLiveScene, preset: string, raw: Record<string, unknown>): Partial<Params> {
  const base = resolveLiveParams(scene, preset);
  const out: Partial<Params> = {};
  for (const [key, value] of Object.entries(raw)) {
    const def = scene.params[key];
    if (!def) continue;
    const v = validParam(def, value);
    if (v !== undefined && v !== base[key]) out[key] = v;
  }
  return out;
}

/** Query string: p, d (or w+h for custom; nothing for the default device), x = base64url JSON of overrides, seed. */
export function encodeLiveState(s: LiveState): string {
  const scene = sceneOrFirst(s.scene);
  const q = new URLSearchParams({ p: s.preset });
  if (s.device === "custom") {
    q.set("w", String(s.w));
    q.set("h", String(s.h));
  } else if (s.device !== DEFAULT_DEVICE) q.set("d", s.device);
  const { seed, ...rest } = cleanOverrides(scene, s.preset, s.overrides);
  if (Object.keys(rest).length) q.set("x", b64urlEncode(JSON.stringify(rest)));
  if (seed !== undefined) q.set("seed", String(seed));
  return q.toString();
}

/** Reads a scene page's query. Anything unknown or malformed falls back to the preset and default device. */
export function decodeLiveState(id: string, q: URLSearchParams): LiveState {
  const scene = sceneOrFirst(id);
  const p = q.get("p");
  const preset = scene.presets.find((x) => x.id === p)?.id ?? scene.presets[0]?.id ?? "";

  let raw: Record<string, unknown> = {};
  const x = q.get("x");
  if (x) {
    try {
      const parsed: unknown = JSON.parse(b64urlDecode(x));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) raw = { ...(parsed as Record<string, unknown>) };
    } catch {
      /* malformed share link: fall back to the preset */
    }
  }
  const seed = q.get("seed");
  if (seed !== null) raw.seed = seed;

  const def = getDevice(DEFAULT_DEVICE);
  const out: LiveState = { scene: scene.id, preset, overrides: cleanOverrides(scene, preset, raw), device: DEFAULT_DEVICE, w: def?.w ?? 3024, h: def?.h ?? 1964 };
  const d = getDevice(q.get("d") ?? "");
  const w = Number(q.get("w"));
  const h = Number(q.get("h"));
  if (d) Object.assign(out, { device: d.id, w: d.w, h: d.h });
  else if (w > 0 && h > 0) Object.assign(out, { device: "custom", w: clampDimension(w), h: clampDimension(h) });
  return out;
}

export const liveHref = (s: LiveState): string => `/live/${s.scene}?${encodeLiveState(s)}`;

/** The chromeless player URL for the Mac app: the same state plus fps, render scale and pointer tracking. */
export function livePlayHref(s: LiveState, opts: { fps?: number; scale?: number; mouse?: boolean }): string {
  const q = new URLSearchParams(encodeLiveState(s));
  if (opts.fps !== undefined) q.set("fps", String(opts.fps));
  if (opts.scale !== undefined) q.set("scale", String(opts.scale));
  if (opts.mouse !== undefined) q.set("mouse", opts.mouse ? "1" : "0");
  return `/live/${s.scene}/play?${q.toString()}`;
}
