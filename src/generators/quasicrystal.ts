import type { Generator, ParamSchema, Preset } from "./types";
import { mix } from "./shared/color";
import { contourPaths } from "./shared/contours";
import { esc, n, rect, svgDoc, unit } from "./shared/svg";
import { clearZonesMask, layoutText, textParams, type TextParams } from "./shared/text";

type P = TextParams & {
  bg: string;
  c1: string;
  c2: string;
  fold: number;
  scale: number;
  levels: number;
  style: string;
  centered: boolean;
  seed: number;
};

const params: ParamSchema<P> = {
  bg: { kind: "color", label: "Background", default: "#0d1021", group: "Colours", role: "bg" },
  c1: { kind: "color", label: "Low colour", default: "#3d5af1", group: "Colours", role: "accent" },
  c2: { kind: "color", label: "High colour", default: "#ffd6a5", group: "Colours", role: "fg" },
  fold: { kind: "range", label: "Symmetry (waves)", min: 4, max: 12, step: 1, default: 5, group: "Crystal", help: "5, 7, 8 and 12 give patterns that never repeat." },
  scale: { kind: "range", label: "Scale", min: 3, max: 12, step: 0.5, default: 6, group: "Crystal" },
  levels: { kind: "range", label: "Layers", min: 2, max: 6, step: 1, default: 4, group: "Crystal" },
  style: { kind: "select", label: "Style", options: [{ value: "bands", label: "Filled bands" }, { value: "lines", label: "Contour lines" }], default: "bands", group: "Crystal" },
  centered: { kind: "toggle", label: "Symmetric about the centre", default: true, group: "Crystal" },
  seed: { kind: "seed", label: "Seed", default: 3 },
  ...textParams({ "text.none": true, "text.line1": "Order without", "text.line2": "*repetition*.", "text.color": "#ffffff", "text.size": 5 }),
};

const presets: Preset<P>[] = [
  { id: "penrose-blue", title: "Fivefold blue", params: {} },
  { id: "sevenfold", title: "Sevenfold dusk", params: { bg: "#1a0b2e", c1: "#c2255c", c2: "#ffd43b", fold: 7, scale: 5, levels: 5, seed: 12 } },
  { id: "twelve", title: "Twelvefold jade", params: { bg: "#041b15", c1: "#0ca678", c2: "#e6fcf5", fold: 12, scale: 9, levels: 4, seed: 7 } },
  { id: "ink", title: "Ink lines (light)", params: { bg: "#f3efe6", c1: "#1c1c1c", c2: "#c0392b", fold: 8, scale: 8, levels: 5, style: "lines", seed: 9, "text.color": "#1c1c1c" } },
  { id: "drift", title: "Drift (off-centre)", params: { bg: "#0b132b", c1: "#5bc0be", c2: "#fdfffc", fold: 5, scale: 8, levels: 3, centered: false, seed: 41 } },
];

export const quasicrystal: Generator<P> = {
  id: "quasicrystal",
  name: "Quasicrystal",
  description: "Interference of a handful of plane waves. With 5, 7, 8 or 12 of them the pattern has perfect symmetry yet never repeats.",
  params,
  presets,
  render(p, size, rng) {
    const u = unit(size);
    const fold = Math.round(p.fold);
    const rot = rng() * Math.PI;
    const waves = Array.from({ length: fold }, (_, k) => {
      const a = rot + (k * Math.PI) / fold;
      return { kx: Math.cos(a), ky: Math.sin(a), phase: p.centered ? 0 : rng() * Math.PI * 2 };
    });
    const freq = (2 * Math.PI * p.scale) / (100 * u);
    const cx = size.w / 2, cy = size.h / 2;

    // Sample the field on a grid with a low border, so contours close into fillable loops.
    const cell = Math.max(0.45, 3.2 / p.scale) * u;
    const cols = Math.ceil(size.w / cell) + 2, rows = Math.ceil(size.h / cell) + 2;
    const data = new Float32Array((cols + 1) * (rows + 1));
    for (let j = 0; j <= rows; j++)
      for (let i = 0; i <= cols; i++) {
        let v = -9;
        if (i > 0 && j > 0 && i < cols && j < rows) {
          const x = (i - 1) * cell - cx, y = (j - 1) * cell - cy;
          v = 0;
          for (const w of waves) v += Math.cos((x * w.kx + y * w.ky) * freq + w.phase);
          v /= fold;
        }
        data[j * (cols + 1) + i] = v;
      }

    const levels = Math.round(p.levels);
    const layers: string[] = [];
    for (let k = 0; k < levels; k++) {
      const t = -0.28 + (0.78 * k) / Math.max(1, levels - 1);
      const color = esc(mix(p.c1, p.c2, levels === 1 ? 1 : k / (levels - 1)));
      if (p.style === "lines") {
        const d = contourPaths(data, cols, rows, cell, t, { ox: -cell, oy: -cell });
        if (d) layers.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${n((0.1 + 0.05 * k) * u)}" stroke-linejoin="round"/>`);
      } else {
        const d = contourPaths(data, cols, rows, cell, t, { closed: true, ox: -cell, oy: -cell });
        if (d) layers.push(`<path d="${d}" fill="${color}" fill-rule="evenodd" fill-opacity="${n(0.5 + (0.5 * k) / levels)}"/>`);
      }
    }

    const text = layoutText(p, size, { padding: 0.8 });
    return svgDoc(
      size,
      clearZonesMask("qc-zones", size, text.zones),
      rect(0, 0, size.w, size.h, `fill="${esc(p.bg)}"`) + `<g mask="url(#qc-zones)">${layers.join("")}</g>` + text.svg,
    );
  },
};
