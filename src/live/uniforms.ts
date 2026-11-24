import type { Params } from "@/generators/types";
import { createRng } from "@/generators/shared/rng";
import type { AnyLiveScene } from "./types";

export type UniformValue = { type: "1f"; v: number } | { type: "1i"; v: number } | { type: "3f"; v: [number, number, number] };

/** "#rrggbb" → sRGB channels in 0–1. */
function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1, 7), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * Maps resolved params to shader uniforms: `u_<key>` with `.` → `_`. Colours are 3f, ranges and
 * toggles 1f, selects 1i (option index). The `seed` param becomes `uSeed`, a float in [0, 1)
 * from the same rng the SVG generators use. Text params have no uniform.
 */
export function paramUniforms(scene: AnyLiveScene, params: Params): Record<string, UniformValue> {
  const out: Record<string, UniformValue> = {};
  for (const [key, def] of Object.entries(scene.params)) {
    const value = params[key] ?? def.default;
    const name = `u_${key.replaceAll(".", "_")}`;
    switch (def.kind) {
      case "color":
        out[name] = { type: "3f", v: hexToRgb(String(value)) };
        break;
      case "range":
        out[name] = { type: "1f", v: Number(value) };
        break;
      case "toggle":
        out[name] = { type: "1f", v: value === true ? 1 : 0 };
        break;
      case "select":
        out[name] = { type: "1i", v: Math.max(0, def.options.findIndex((o) => o.value === value)) };
        break;
      case "seed":
        out[key === "seed" ? "uSeed" : name] = { type: "1f", v: createRng(Number(value))() };
        break;
      case "text":
        break;
    }
  }
  return out;
}
