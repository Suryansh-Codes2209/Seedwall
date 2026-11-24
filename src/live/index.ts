import type { Params } from "@/generators/types";
import { coerceParam } from "@/generators/render";
import type { AnyLiveScene } from "./types";

/** Every live scene on the site. Add a scene = add a file + one line here. */
export const LIVE_SCENES: readonly AnyLiveScene[] = [];

export function getLiveScene(id: string): AnyLiveScene | undefined {
  return LIVE_SCENES.find((s) => s.id === id);
}

/** defaults ← preset ← overrides (validated), the same layering as resolveParams. */
export function resolveLiveParams(scene: AnyLiveScene, presetId?: string, overrides: Partial<Params> = {}): Params {
  const out: Params = {};
  for (const [key, def] of Object.entries(scene.params)) out[key] = def.default;
  const preset = scene.presets.find((p) => p.id === presetId);
  for (const layer of [preset?.params ?? {}, overrides])
    for (const [key, raw] of Object.entries(layer)) {
      const def = scene.params[key];
      if (!def) continue;
      const v = coerceParam(def, raw);
      if (v !== undefined) out[key] = v;
    }
  return out;
}
