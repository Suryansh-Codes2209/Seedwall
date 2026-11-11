import type { Generator, ParamSchema, Preset } from "./types";
import { contourPaths } from "./shared/contours";
import { range } from "./shared/rng";
import { esc, n, rect, svgDoc, unit } from "./shared/svg";
import { clearZonesMask, layoutText, textParams, type TextParams } from "./shared/text";

type P = TextParams & {
  bg: string;
  sand: string;
  line: string;
  m: number;
  n: number;
  blend: number;
  zoom: number;
  grains: number;
  lines: boolean;
  seed: number;
};

const params: ParamSchema<P> = {
  bg: { kind: "color", label: "Plate", default: "#0b0c10", group: "Colours", role: "bg" },
  sand: { kind: "color", label: "Sand", default: "#f2e9d8", group: "Colours", role: "fg" },
  line: { kind: "color", label: "Nodal lines", default: "#e0a458", group: "Colours", role: "accent" },
  m: { kind: "range", label: "Mode m", min: 1, max: 14, step: 1, default: 3, group: "Sound", help: "Two whole numbers pick the note. Higher = finer pattern." },
  n: { kind: "range", label: "Mode n", min: 1, max: 14, step: 1, default: 7, group: "Sound" },
  blend: { kind: "range", label: "Blend", min: -1, max: 1, step: 0.05, default: -1, group: "Sound", help: "How the two standing waves combine. -1 and 1 are the classic figures." },
  zoom: { kind: "range", label: "Plate size", min: 0.5, max: 2.5, step: 0.05, default: 1.3, group: "Sound" },
  grains: { kind: "range", label: "Grains of sand", min: 2000, max: 24000, step: 1000, default: 14000, group: "Sand" },
  lines: { kind: "toggle", label: "Draw nodal lines", default: false, group: "Sand" },
  seed: { kind: "seed", label: "Seed", default: 11 },
  ...textParams({ "text.none": true, "text.line1": "Sound has", "text.line2": "a *shape*.", "text.color": "#f2e9d8", "text.size": 5, "text.position": "lower" }),
};

const presets: Preset<P>[] = [
  { id: "plate", title: "Brass plate", params: {} },
  { id: "bone", title: "Bone on ink", params: { bg: "#101a2b", sand: "#e8eef7", line: "#6ea8fe", m: 5, n: 8, blend: 1, seed: 4 } },
  { id: "ember", title: "Ember", params: { bg: "#170a08", sand: "#ffb37a", line: "#ff5d3b", m: 2, n: 9, blend: -0.6, grains: 18000, lines: true, seed: 21 } },
  { id: "chalk", title: "Chalk (light)", params: { bg: "#efeae0", sand: "#23201b", line: "#b4552d", m: 4, n: 6, blend: -1, seed: 8, "text.color": "#23201b" } },
  { id: "fine", title: "High note", params: { bg: "#07110e", sand: "#c9f2dc", line: "#3ddc97", m: 9, n: 13, blend: 1, grains: 24000, zoom: 1.6, seed: 33 } },
  { id: "quote", title: "With a quote", params: { m: 6, n: 2, blend: 0.5, zoom: 1.6, seed: 5, "text.none": false } },
];

export const cymatics: Generator<P> = {
  id: "cymatics",
  name: "Cymatics",
  description: "Chladni figures: the patterns sand settles into on a vibrating plate. Two numbers pick the note, and every note has its own shape.",
  params,
  presets,
  render(p, size, rng) {
    const u = unit(size);
    const half = 50 * u * p.zoom;
    const cx = size.w / 2, cy = size.h / 2;
    const m = Math.round(p.m), nn = Math.round(p.n);
    const f = (x: number, y: number): number => {
      const a = ((x - cx) / half) * Math.PI, b = ((y - cy) / half) * Math.PI;
      return Math.cos(nn * a) * Math.cos(m * b) + p.blend * Math.cos(m * a) * Math.cos(nn * b);
    };

    // Sand gathers where the plate doesn't move (f ≈ 0): keep a random point with a probability that falls off with |f|.
    const target = Math.round(p.grains);
    const sigma = 0.06;
    const buckets: string[][] = [[], [], []];
    let placed = 0;
    for (let tries = 0; placed < target && tries < target * 90; tries++) {
      const x = rng() * size.w, y = rng() * size.h;
      const v = f(x, y) / sigma;
      if (rng() > Math.exp(-v * v)) continue;
      const bucket = buckets[Math.floor(rng() * 3)];
      if (bucket) bucket.push(`M${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10}h.01`);
      placed++;
    }
    const widths = [0.18, 0.27, 0.38];
    const sand = buckets
      .map((b, i) => `<path d="${b.join("")}" stroke-width="${n((widths[i] ?? 0.2) * u)}" stroke-opacity="${n(range(rng, 0.7, 0.95))}"/>`)
      .join("");

    let lines = "";
    if (p.lines) {
      const cell = 0.8 * u;
      const cols = Math.ceil(size.w / cell), rows = Math.ceil(size.h / cell);
      const data = new Float32Array((cols + 1) * (rows + 1));
      for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) data[j * (cols + 1) + i] = f(i * cell, j * cell);
      lines = `<path d="${contourPaths(data, cols, rows, cell, 0)}" fill="none" stroke="${esc(p.line)}" stroke-width="${n(0.1 * u)}" stroke-opacity="0.55" stroke-linejoin="round"/>`;
    }

    const text = layoutText(p, size, { padding: 0.8 });
    return svgDoc(
      size,
      clearZonesMask("cy-zones", size, text.zones),
      rect(0, 0, size.w, size.h, `fill="${esc(p.bg)}"`) +
        `<g mask="url(#cy-zones)">${lines}<g fill="none" stroke="${esc(p.sand)}" stroke-linecap="round">${sand}</g></g>` +
        text.svg,
    );
  },
};
