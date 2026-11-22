import type { ColorDef, Params, ParamSchema } from "../types";
import { hexToRgb, luminance, rgbToHex } from "./color";

/**
 * "True black" for OLED screens: a shared toggle that paints the background pure #000000.
 *
 * It is opt-in per generator. A generator that supports it spreads `...backgroundParams()` into
 * its schema and sets `trueBlack` on itself:
 *
 *   trueBlack: { bg: ["bg"] }    the shared render path (renderWallpaper) sets those colour params
 *                                to #000000 and lifts any ink that would be too dark to read on black.
 *   trueBlack: { native: true }  the generator reads `background.trueBlack` itself, for backgrounds
 *                                that are built from more than one colour.
 *
 * The toggle defaults to off, and when it is off renderWallpaper passes the params through
 * untouched, so existing renders stay byte-identical.
 */
export const TRUE_BLACK = "background.trueBlack";

export type BackgroundParams = { "background.trueBlack": boolean };

/** What the studio needs to show the toggle: a label, a group and a one-line description. */
export const TRUE_BLACK_LABEL = "True black (OLED)";
export const TRUE_BLACK_HELP = "Makes the background pure black, which looks deeper on OLED phones and uses less battery. Dark inks are lightened so they stay readable.";

/** Spread into a generator's schema to offer the true-black toggle. */
export function backgroundParams(): ParamSchema<BackgroundParams> {
  return {
    "background.trueBlack": { kind: "toggle", label: TRUE_BLACK_LABEL, default: false, group: "Background", help: TRUE_BLACK_HELP },
  };
}

export interface TrueBlackSupport {
  /** Colour params the shared render path sets to #000000 when the toggle is on. */
  bg?: readonly string[];
  /** True when the generator handles `background.trueBlack` inside its own render(). */
  native?: boolean;
}

/** Contrast ratio of a colour against pure black (WCAG, 1 to 21). */
export const contrastOnBlack = (hex: string): number => (luminance(hex) + 0.05) / 0.05;

function rgbToHsl(hex: string): [number, number, number] {
  const { r, g, b } = hexToRgb(hex);
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === R ? (G - B) / d + (G < B ? 6 : 0) : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return [h / 6, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  if (s === 0) return rgbToHex({ r: l * 255, g: l * 255, b: l * 255 });
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const ch = (t: number): number => {
    const x = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return rgbToHex({ r: ch(h + 1 / 3) * 255, g: ch(h) * 255, b: ch(h - 1 / 3) * 255 });
}

/**
 * Returns a colour that reads on black with at least `minContrast`. Colours that already pass are
 * returned unchanged. Dark ones keep their hue: lightness is mirrored first (dark navy becomes pale
 * blue), then raised step by step until the contrast is met.
 */
export function liftForBlack(hex: string, minContrast: number): string {
  if (contrastOnBlack(hex) >= minContrast) return hex;
  const [h, s, l] = rgbToHsl(hex);
  let L = Math.max(l, 1 - l);
  let out = hslToHex(h, s, L);
  while (contrastOnBlack(out) < minContrast && L < 1) {
    L = Math.min(1, L + 0.02);
    out = hslToHex(h, s, L);
  }
  return out;
}

/**
 * Params with the true-black look applied, for a generator with `trueBlack.bg`:
 * the listed background colours become #000000, foreground and accent colours that would vanish on
 * black are lifted (3:1 for shapes), the text colour is lifted to 4.5:1, and film grain is turned off.
 */
export function applyTrueBlack(schema: Record<string, { kind: string }>, bgKeys: readonly string[], params: Params): Params {
  const out: Params = { ...params };
  for (const key of bgKeys) if (schema[key]?.kind === "color") out[key] = "#000000";
  // Film grain is a light noise overlay, so it would turn the black grey. Turn it off.
  if (schema.grain?.kind === "range" && typeof out.grain === "number") out.grain = 0;
  for (const [key, def] of Object.entries(schema)) {
    if (def.kind !== "color" || bgKeys.includes(key)) continue;
    const role = (def as ColorDef).role;
    const v = out[key];
    if (typeof v !== "string") continue;
    if (key === "text.color") out[key] = liftForBlack(v, 4.5);
    else if (role === "fg" || role === "accent") out[key] = liftForBlack(v, 3);
  }
  return out;
}
