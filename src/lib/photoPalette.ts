/**
 * "Use colours from a photo": pull a small palette out of a photo and map it onto a look's
 * colour params. Pure and deterministic, so it runs in the browser (the photo never leaves the
 * device) and in Node for tests.
 *
 *   1. Sample the photo on a coarse grid (about 4,000 pixels), skipping transparent ones.
 *   2. Median cut splits the samples into up to k boxes; their means seed k-means, which then
 *      settles the clusters. Clusters that end up almost the same colour are merged.
 *   3. Mapping: the background gets the darkest colour for a dark look (the lightest for a light
 *      one), foregrounds get the colours that stand out most against it, accents get the rest, and
 *      the text colour is nudged until it reads at 4.5:1.
 */
import type { AnyGenerator, Params } from "@/generators/types";
import { contrastRatio, ensureContrast, isDark, luminance, rgbToHex } from "@/generators/shared/color";
import type { PhotoPixels } from "./paintPhoto";

export interface PaletteColor {
  hex: string;
  /** Share of the photo, 0..1. The weights of a palette add up to 1. */
  weight: number;
}

type Px = [number, number, number];

const SAMPLES = 4096;
const MERGE_DIST = 12;

function sample(px: PhotoPixels): Px[] {
  const step = Math.max(1, Math.floor(Math.sqrt((px.width * px.height) / SAMPLES)));
  const out: Px[] = [];
  for (let y = Math.floor(step / 2); y < px.height; y += step)
    for (let x = Math.floor(step / 2); x < px.width; x += step) {
      const i = (y * px.width + x) * 4;
      if (px.data[i + 3]! < 128) continue;
      out.push([px.data[i]!, px.data[i + 1]!, px.data[i + 2]!]);
    }
  return out;
}

function widest(box: Px[]): { ch: 0 | 1 | 2; range: number } {
  let best: { ch: 0 | 1 | 2; range: number } = { ch: 0, range: -1 };
  for (const ch of [0, 1, 2] as const) {
    let lo = 255, hi = 0;
    for (const p of box) {
      if (p[ch] < lo) lo = p[ch];
      if (p[ch] > hi) hi = p[ch];
    }
    if (hi - lo > best.range) best = { ch, range: hi - lo };
  }
  return best;
}

function medianCut(samples: Px[], k: number): Px[][] {
  const boxes: Px[][] = [samples];
  while (boxes.length < k) {
    // Split the box with the widest spread of colour, weighted by how many pixels it holds.
    let pick = -1, score = 0;
    boxes.forEach((b, i) => {
      const { range } = widest(b);
      const s = range * Math.sqrt(b.length);
      if (range > 0 && s > score) (pick = i), (score = s);
    });
    if (pick < 0) break;
    const box = boxes[pick]!;
    const { ch } = widest(box);
    const sorted = [...box].sort((a, b) => a[ch] - b[ch] || a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
    // Cut at the median, moved to the nearest change of value so equal colours stay together.
    let mid = sorted.length >> 1;
    while (mid > 0 && sorted[mid - 1]![ch] === sorted[mid]![ch]) mid--;
    if (mid === 0) {
      mid = sorted.length >> 1;
      while (mid < sorted.length && sorted[mid - 1]![ch] === sorted[mid]![ch]) mid++;
    }
    boxes.splice(pick, 1, sorted.slice(0, mid), sorted.slice(mid));
  }
  return boxes;
}

const mean = (pts: Px[]): Px => {
  const s: Px = [0, 0, 0];
  for (const p of pts) (s[0] += p[0]), (s[1] += p[1]), (s[2] += p[2]);
  return [s[0] / pts.length, s[1] / pts.length, s[2] / pts.length];
};

const dist2 = (a: Px, b: Px): number => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

/** Up to `k` main colours of a photo, most common first. */
export function extractPalette(px: PhotoPixels, k = 6): PaletteColor[] {
  const samples = sample(px);
  if (!samples.length) return [];
  let centres = medianCut(samples, k).map(mean);
  let counts: number[] = [];

  for (let iter = 0; iter < 12; iter++) {
    const sums = centres.map((): Px => [0, 0, 0]);
    counts = centres.map(() => 0);
    for (const p of samples) {
      let best = 0, bd = Infinity;
      centres.forEach((c, i) => {
        const d = dist2(p, c);
        if (d < bd) (bd = d), (best = i);
      });
      const s = sums[best]!;
      (s[0] += p[0]), (s[1] += p[1]), (s[2] += p[2]);
      counts[best]!++;
    }
    const next = centres.map((c, i): Px => (counts[i] ? [sums[i]![0] / counts[i]!, sums[i]![1] / counts[i]!, sums[i]![2] / counts[i]!] : c));
    const moved = next.some((c, i) => dist2(c, centres[i]!) > 0.25);
    centres = next;
    if (!moved) break;
  }

  // Drop empty clusters, then merge ones that came out nearly the same colour.
  const clusters = centres.map((c, i) => ({ c, n: counts[i]! })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  const merged: { c: Px; n: number }[] = [];
  for (const cl of clusters) {
    const near = merged.find((m) => dist2(m.c, cl.c) < MERGE_DIST ** 2);
    if (!near) merged.push({ c: [...cl.c] as Px, n: cl.n });
    else {
      const t = near.n + cl.n;
      near.c = [0, 1, 2].map((ch) => (near.c[ch]! * near.n + cl.c[ch]! * cl.n) / t) as Px;
      near.n = t;
    }
  }

  const total = merged.reduce((a, m) => a + m.n, 0);
  return merged
    .map((m) => ({ hex: rgbToHex({ r: m.c[0], g: m.c[1], b: m.c[2] }), weight: m.n / total }))
    .sort((a, b) => b.weight - a.weight || (a.hex < b.hex ? -1 : 1));
}

/**
 * Recolours a look from a palette. Only colour params with a role change (like editor themes), so
 * it is safe on any generator. The first "bg" param sets the tone: if it is dark now, the darkest
 * photo colour becomes the background, otherwise the lightest.
 */
export function mapPaletteToParams(gen: AnyGenerator, params: Params, palette: readonly PaletteColor[]): Params {
  if (!palette.length) return params;
  const colours = Object.entries(gen.params).filter(([, d]) => d.kind === "color" && d.role && !d.hidden);
  const bgKeys = colours.filter(([, d]) => d.kind === "color" && d.role === "bg").map(([k]) => k);
  const fgKeys = colours.filter(([k, d]) => d.kind === "color" && d.role === "fg" && k !== "text.color").map(([k]) => k);
  const accentKeys = colours.filter(([, d]) => d.kind === "color" && d.role === "accent").map(([k]) => k);
  const firstBg = bgKeys[0];
  if (!firstBg) return params;

  const dark = isDark(String(params[firstBg] ?? gen.params[firstBg]?.default ?? "#000000"));
  const byLum = [...palette].sort((a, b) => luminance(a.hex) - luminance(b.hex));
  const bgOrder = dark ? byLum : byLum.reverse();
  const bg = bgOrder[0]!.hex;

  const out: Params = { ...params };
  bgKeys.forEach((k, i) => (out[k] = bgOrder[Math.min(i, bgOrder.length - 1)]!.hex));

  // Everything but the background, most common first. A one-colour photo gets a readable partner.
  let rest = palette.filter((c) => c.hex !== bg).map((c) => c.hex);
  if (!rest.length) rest = [ensureContrast(bg, bg, 3)];
  const byContrast = [...rest].sort((a, b) => contrastRatio(b, bg) - contrastRatio(a, bg));

  fgKeys.forEach((k, i) => (out[k] = byContrast[i % byContrast.length]!));
  const usedByFg = new Set(fgKeys.map((_, i) => byContrast[i % byContrast.length]!));
  const accentOrder = [...rest.filter((c) => !usedByFg.has(c)), ...rest.filter((c) => usedByFg.has(c))];
  accentKeys.forEach((k, i) => (out[k] = accentOrder[i % accentOrder.length]!));

  if (gen.params["text.color"]?.kind === "color") out["text.color"] = ensureContrast(byContrast[0]!, bg, 4.5);
  return out;
}
