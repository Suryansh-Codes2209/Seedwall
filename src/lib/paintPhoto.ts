/**
 * Paint a photo as a palette-knife impasto, using the same knife strokes as the Impasto look.
 *
 * Pure and deterministic: (pixels, options) → SVG string. Runs in the browser (the photo never
 * leaves the device) and in Node for tests.
 *
 *   1. Cover-fit the photo to the canvas and box-average it onto an analysis grid.
 *   2. Boost contrast and saturation a little, as a painter pushes colour.
 *   3. Blur the grid at three radii: broad colour for the underpainting, finer for the body,
 *      sharp for details.
 *   4. A smoothed structure tensor gives the stroke direction (along edges and contours);
 *      gradient strength decides where detail strokes go and how small the knife gets.
 */
import type { Size } from "@/generators/types";
import { darken, lighten, mix, rgbToHex } from "@/generators/shared/color";
import { knifePrecision, paintKnife, type KnifePass } from "@/generators/shared/knife";
import { createRng } from "@/generators/shared/rng";
import { esc, grainFilter, grainRect, rect, svgDoc, unit } from "@/generators/shared/svg";

/** RGBA pixels, as in ImageData. */
export interface PhotoPixels {
  width: number;
  height: number;
  data: Uint8ClampedArray | Uint8Array;
}

export interface PaintPhotoOptions {
  /** Knife size multiplier, 0.6 (fine) … 1.6 (bold). */
  knife: number;
  /** Paint thickness 0..1. */
  relief: number;
  /** How many fine strokes go on edges and features, 0..1. */
  detail: number;
  /** Colour push 0..1 (saturation and contrast). */
  boost: number;
  lightFrom: "top-left" | "top" | "top-right";
  grain: number;
  seed: number;
}

export const PAINT_DEFAULTS: PaintPhotoOptions = { knife: 1, relief: 0.7, detail: 0.6, boost: 0.3, lightFrom: "top-left", grain: 0.06, seed: 1 };

/** Analysis cells per unit (1% of the canvas' short side). */
const CELLS_PER_UNIT = 2.4;

interface Grid {
  gw: number;
  gh: number;
  /** Interleaved r, g, b floats 0..255. */
  rgb: Float32Array;
}

/** Cover-fit the photo to `size` and box-average it onto a gw × gh grid. */
function sampleToGrid(px: PhotoPixels, size: Size, gw: number, gh: number): Grid {
  const scale = Math.max(size.w / px.width, size.h / px.height);
  const offX = (size.w - px.width * scale) / 2;
  const offY = (size.h - px.height * scale) / 2;
  const sum = new Float64Array(gw * gh * 3);
  const cnt = new Float64Array(gw * gh);
  const cx = gw / size.w;
  const cy = gh / size.h;
  for (let y = 0; y < px.height; y++) {
    const gy = Math.floor((offY + (y + 0.5) * scale) * cy);
    if (gy < 0 || gy >= gh) continue;
    for (let x = 0; x < px.width; x++) {
      const gx = Math.floor((offX + (x + 0.5) * scale) * cx);
      if (gx < 0 || gx >= gw) continue;
      const i = (y * px.width + x) * 4;
      const a = px.data[i + 3]! / 255;
      const g = gy * gw + gx;
      // Transparent pixels read as black, like a dark ground.
      sum[g * 3] = sum[g * 3]! + px.data[i]! * a;
      sum[g * 3 + 1] = sum[g * 3 + 1]! + px.data[i + 1]! * a;
      sum[g * 3 + 2] = sum[g * 3 + 2]! + px.data[i + 2]! * a;
      cnt[g] = cnt[g]! + 1;
    }
  }
  const rgb = new Float32Array(gw * gh * 3);
  for (let g = 0; g < gw * gh; g++) {
    const c = cnt[g]!;
    if (c > 0) for (let k = 0; k < 3; k++) rgb[g * 3 + k] = sum[g * 3 + k]! / c;
  }
  // A photo much smaller than the grid leaves empty cells: fill them from the nearest filled row/column.
  fillHoles(rgb, cnt, gw, gh);
  return { gw, gh, rgb };
}

function fillHoles(rgb: Float32Array, cnt: Float64Array, gw: number, gh: number): void {
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++) {
      const g = y * gw + x;
      if (cnt[g]! > 0) continue;
      // Search outward on a small square ring until a filled cell is found.
      for (let r = 1; r < Math.max(gw, gh); r++) {
        let found = -1;
        for (let dy = -r; dy <= r && found < 0; dy++)
          for (let dx = -r; dx <= r; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= gw || yy >= gh) continue;
            const h = yy * gw + xx;
            if (cnt[h]! > 0) {
              found = h;
              break;
            }
          }
        if (found >= 0) {
          for (let k = 0; k < 3; k++) rgb[g * 3 + k] = rgb[found * 3 + k]!;
          break;
        }
      }
    }
}

/** Separable box blur on `ch`-channel data, run twice (close to a Gaussian). */
function blur(src: Float32Array, gw: number, gh: number, ch: number, r: number): Float32Array {
  if (r < 1) return src.slice();
  let a = src.slice();
  let b = new Float32Array(src.length);
  const R = Math.round(r);
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < gh; y++)
      for (let k = 0; k < ch; k++) {
        let acc = 0;
        for (let x = -R; x <= R; x++) acc += a[(y * gw + Math.min(gw - 1, Math.max(0, x))) * ch + k]!;
        for (let x = 0; x < gw; x++) {
          b[(y * gw + x) * ch + k] = acc / (2 * R + 1);
          const add = Math.min(gw - 1, x + R + 1), sub = Math.max(0, x - R);
          acc += a[(y * gw + add) * ch + k]! - a[(y * gw + sub) * ch + k]!;
        }
      }
    for (let x = 0; x < gw; x++)
      for (let k = 0; k < ch; k++) {
        let acc = 0;
        for (let y = -R; y <= R; y++) acc += b[(Math.min(gh - 1, Math.max(0, y)) * gw + x) * ch + k]!;
        for (let y = 0; y < gh; y++) {
          a[(y * gw + x) * ch + k] = acc / (2 * R + 1);
          const add = Math.min(gh - 1, y + R + 1), sub = Math.max(0, y - R);
          acc += b[(add * gw + x) * ch + k]! - b[(sub * gw + x) * ch + k]!;
        }
      }
  }
  return a;
}

/** Push saturation and contrast, in place. */
function boostColour(rgb: Float32Array, amount: number): void {
  if (amount <= 0) return;
  const sat = 1 + 0.6 * amount;
  const con = 1 + 0.35 * amount;
  for (let i = 0; i < rgb.length; i += 3) {
    const r = rgb[i]!, g = rgb[i + 1]!, b = rgb[i + 2]!;
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    for (let k = 0; k < 3; k++) {
      const v = l + (rgb[i + k]! - l) * sat;
      rgb[i + k] = Math.max(0, Math.min(255, (v - 128) * con + 128));
    }
  }
}

export interface PhotoField {
  gw: number;
  gh: number;
  /** Colour levels: [broad, body, sharp]. */
  levels: Float32Array[];
  /** Stroke angle per cell (radians, along contours). */
  angle: Float32Array;
  /** Edge strength per cell, normalised so the 90th percentile ≈ 1. */
  edge: Float32Array;
  /** Mean colour, for the ground. */
  mean: string;
}

/** Everything the painter needs from the photo, at a given canvas size. Exported for tests. */
export function analysePhoto(px: PhotoPixels, size: Size, boost: number): PhotoField {
  const u = unit(size);
  const gw = Math.max(8, Math.round((size.w / u) * CELLS_PER_UNIT));
  const gh = Math.max(8, Math.round((size.h / u) * CELLS_PER_UNIT));
  const grid = sampleToGrid(px, size, gw, gh);
  boostColour(grid.rgb, boost);

  const cpu = CELLS_PER_UNIT;
  const levels = [blur(grid.rgb, gw, gh, 3, 2.2 * cpu), blur(grid.rgb, gw, gh, 3, 0.9 * cpu), blur(grid.rgb, gw, gh, 3, 0.25 * cpu)];

  // Luminance of the lightly blurred level, then Sobel gradients.
  const lum = new Float32Array(gw * gh);
  const src = levels[2]!;
  for (let g = 0; g < gw * gh; g++) lum[g] = 0.299 * src[g * 3]! + 0.587 * src[g * 3 + 1]! + 0.114 * src[g * 3 + 2]!;
  const L = (x: number, y: number): number => lum[Math.min(gh - 1, Math.max(0, y)) * gw + Math.min(gw - 1, Math.max(0, x))]!;
  const tensor = new Float32Array(gw * gh * 3);
  const mag = new Float32Array(gw * gh);
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++) {
      const gx = L(x + 1, y - 1) + 2 * L(x + 1, y) + L(x + 1, y + 1) - L(x - 1, y - 1) - 2 * L(x - 1, y) - L(x - 1, y + 1);
      const gy = L(x - 1, y + 1) + 2 * L(x, y + 1) + L(x + 1, y + 1) - L(x - 1, y - 1) - 2 * L(x, y - 1) - L(x + 1, y - 1);
      const g = y * gw + x;
      tensor[g * 3] = gx * gx;
      tensor[g * 3 + 1] = gx * gy;
      tensor[g * 3 + 2] = gy * gy;
      mag[g] = Math.hypot(gx, gy);
    }
  // Smoothing the tensor (not the angle) keeps directions coherent across flat areas.
  const st = blur(tensor, gw, gh, 3, 2.5 * cpu);
  const angle = new Float32Array(gw * gh);
  for (let g = 0; g < gw * gh; g++) {
    const xx = st[g * 3]!, xy = st[g * 3 + 1]!, yy = st[g * 3 + 2]!;
    // Dominant gradient direction, turned 90° so strokes run along the contour.
    angle[g] = 0.5 * Math.atan2(2 * xy, xx - yy) + Math.PI / 2;
  }

  const edgeSm = blur(mag, gw, gh, 1, 0.4 * cpu);
  const sorted = Array.from(edgeSm).sort((a, b) => a - b);
  const p90 = sorted[Math.floor(sorted.length * 0.9)] || 1;
  const edge = new Float32Array(gw * gh);
  for (let g = 0; g < gw * gh; g++) edge[g] = edgeSm[g]! / p90;

  let mr = 0, mg = 0, mb = 0;
  for (let g = 0; g < gw * gh; g++) {
    mr += grid.rgb[g * 3]!;
    mg += grid.rgb[g * 3 + 1]!;
    mb += grid.rgb[g * 3 + 2]!;
  }
  const N = gw * gh;
  return { gw, gh, levels, angle, edge, mean: rgbToHex({ r: mr / N, g: mg / N, b: mb / N }) };
}

/** Paint the photo. Returns a complete SVG document at `size`. */
export function paintPhoto(px: PhotoPixels, size: Size, opts: Partial<PaintPhotoOptions> = {}): string {
  const o = { ...PAINT_DEFAULTS, ...opts };
  const field = analysePhoto(px, size, o.boost);
  return paintField(field, size, o);
}

/** Paint an already analysed photo (lets the UI re-paint without re-analysing). */
export function paintField(field: PhotoField, size: Size, opts: Partial<PaintPhotoOptions> = {}): string {
  const o = { ...PAINT_DEFAULTS, ...opts };
  const rng = createRng(o.seed);
  const u = unit(size);
  const { gw, gh } = field;
  const cell = (x: number, y: number): number => {
    const gx = Math.min(gw - 1, Math.max(0, Math.floor((x / size.w) * gw)));
    const gy = Math.min(gh - 1, Math.max(0, Math.floor((y / size.h) * gh)));
    return gy * gw + gx;
  };
  const colourAt = (level: number, g: number): [number, number, number] => {
    const c = field.levels[level]!;
    return [c[g * 3]!, c[g * 3 + 1]!, c[g * 3 + 2]!];
  };

  const k = o.knife;
  const passes: KnifePass[] = [
    { len: 9 * k * u, wid: 4.6 * k * u, step: 3.8 * k * u, jitter: 0.45, relief: 0.3 },
    { len: 5 * k * u, wid: 2.2 * k * u, step: 2.5 * k * u, jitter: 0.3, relief: 1 },
    { len: 2.8 * k * u, wid: 1.15 * k * u, step: 1.6 * k * u, jitter: 0.22, relief: 1 },
    { len: 1.6 * k * u, wid: 0.62 * k * u, step: 0.95 * k * u, jitter: 0.15, relief: 0.8 },
  ];
  const side = o.lightFrom === "top-left" ? -1 : o.lightFrom === "top-right" ? 1 : 0;
  const ground = darken(field.mean, 0.7);

  let prev = field.mean;
  const strokes = paintKnife({
    size,
    rng,
    passes,
    relief: o.relief,
    side,
    hiTint: lighten(mix(field.mean, "#fff4e0", 0.6), 0.5),
    loTint: darken(ground, 0.6),
    q: knifePrecision(size),
    spot: (x, y, _pass, i) => {
      const g = cell(x, y);
      const e = field.edge[g]!;
      // Fine passes only where the photo has structure: features, edges, texture.
      if (i === 2 && rng() > 0.15 + o.detail * Math.min(1, e * 0.9)) return null;
      if (i === 3 && (e < 1.25 - o.detail * 0.6 || rng() > o.detail * 0.85)) return null;
      const level = i === 0 ? 0 : i === 1 ? (e > 1.2 ? 2 : 1) : 2;
      const [r, gg, b] = colourAt(level, g);
      const j = 1 + (rng() - 0.5) * 0.08; // a touch of broken colour
      let c = rgbToHex({ r: r * j, g: gg * j, b: b * j });
      c = mix(c, prev, rng() * (i >= 2 ? 0.05 : 0.12)); // the knife carries some of the last colour
      prev = c;
      // Shrink the knife over detail so features aren't smeared; broad areas keep big strokes.
      const scale = i <= 1 ? 1 / (1 + Math.max(0, e - 0.4) * (0.6 + o.detail)) : 1;
      return { color: c, ang: field.angle[g]!, relief: 1, scale };
    },
  });

  const defs = o.grain > 0 ? grainFilter("pp-grain", o.grain, 0.9) : "";
  return svgDoc(size, defs, rect(0, 0, size.w, size.h, `fill="${esc(ground)}"`) + strokes + (o.grain > 0 ? grainRect(size, "pp-grain") : ""));
}
