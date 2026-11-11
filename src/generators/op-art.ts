import type { Generator, ParamSchema, Preset } from "./types";
import { range } from "./shared/rng";
import { esc, rect, svgDoc, unit } from "./shared/svg";
import { clearZonesMask, layoutText, textParams, type TextParams } from "./shared/text";

type P = TextParams & {
  bg: string;
  ink: string;
  accent: string;
  pattern: string;
  density: number;
  angle: number;
  bulges: number;
  strength: number;
  accentEvery: number;
  seed: number;
};

const params: ParamSchema<P> = {
  bg: { kind: "color", label: "Background", default: "#f4f1ea", group: "Colours", role: "bg" },
  ink: { kind: "color", label: "Ink", default: "#111111", group: "Colours", role: "fg" },
  accent: { kind: "color", label: "Accent", default: "#e63946", group: "Colours", role: "accent" },
  pattern: { kind: "select", label: "Pattern", options: [{ value: "stripes", label: "Stripes" }, { value: "checks", label: "Checks" }], default: "stripes", group: "Pattern" },
  density: { kind: "range", label: "Density", min: 8, max: 48, step: 1, default: 26, group: "Pattern" },
  angle: { kind: "range", label: "Angle (°)", min: 0, max: 175, step: 5, default: 0, group: "Pattern" },
  accentEvery: { kind: "range", label: "Accent every Nth band", min: 0, max: 8, step: 1, default: 0, group: "Pattern", help: "0 = no accent." },
  bulges: { kind: "range", label: "Bulges", min: 0, max: 5, step: 1, default: 3, group: "Warp" },
  strength: { kind: "range", label: "Strength", min: 0.1, max: 1, step: 0.05, default: 0.85, group: "Warp" },
  seed: { kind: "seed", label: "Seed", default: 4 },
  ...textParams({ "text.none": true, "text.line1": "Look", "text.line2": "*again*.", "text.color": "#e63946", "text.size": 6 }),
};

const presets: Preset<P>[] = [
  { id: "swell", title: "Swell", params: {} },
  { id: "checker-dome", title: "Checker dome", params: { pattern: "checks", density: 22, bulges: 2, strength: 0.95, seed: 12 } },
  { id: "night-stripes", title: "Night stripes", params: { bg: "#0a0a12", ink: "#f5f5f5", accent: "#4cc9f0", density: 34, angle: 90, bulges: 3, accentEvery: 5, seed: 7 } },
  { id: "signal", title: "Signal red", params: { bg: "#e63946", ink: "#fdf0d5", accent: "#1d3557", density: 20, angle: 45, bulges: 2, accentEvery: 4, seed: 23 } },
  { id: "tiles", title: "Warped tiles", params: { bg: "#102a43", ink: "#f0b429", accent: "#ffffff", pattern: "checks", density: 16, angle: 45, bulges: 4, strength: 0.6, accentEvery: 3, seed: 18 } },
];

export const opArt: Generator<P> = {
  id: "op-art",
  name: "Op Art",
  description: "Flat stripes or checks pushed around invisible spheres, so a still image seems to bulge out of the screen.",
  params,
  presets,
  render(p, size, rng) {
    const u = unit(size);
    const cx = size.w / 2, cy = size.h / 2;
    const bulges = Array.from({ length: Math.round(p.bulges) }, () => ({
      x: range(rng, 0.12, 0.88) * size.w,
      y: range(rng, 0.15, 0.85) * size.h,
      r: range(rng, 26, 50) * u,
      // Mostly bulges; now and then a pinch.
      s: rng() < 0.78 ? p.strength : -0.55 * p.strength,
    }));

    const rad = (p.angle * Math.PI) / 180;
    const ex = Math.cos(rad), ey = Math.sin(rad);
    /** Pattern coords (along the stripe, across it) → warped canvas point. */
    const place = (s: number, t: number): string => {
      const x = cx + s * ex - t * ey, y = cy + s * ey + t * ex;
      let dx = 0, dy = 0;
      for (const b of bulges) {
        const d2 = ((x - b.x) ** 2 + (y - b.y) ** 2) / (b.r * b.r);
        if (d2 >= 1) continue;
        const k = b.s * (1 - d2) * (1 - d2);
        dx += (x - b.x) * k;
        dy += (y - b.y) * k;
      }
      return `${Math.round((x + dx) * 10) / 10} ${Math.round((y + dy) * 10) / 10}`;
    };

    const band = (100 * u) / p.density;
    const reach = Math.hypot(size.w, size.h) / 2 + band;
    const count = Math.ceil(reach / band);
    const every = Math.round(p.accentEvery);
    const ink: string[] = [], accent: string[] = [];

    if (p.pattern === "checks") {
      const sub = 3;
      for (let j = -count; j < count; j++)
        for (let i = -count; i < count; i++) {
          if ((i + j) % 2 !== 0) continue;
          const s0 = i * band, t0 = j * band;
          // Skip cells that can't reach the canvas even after warping.
          const mx = cx + (s0 + band / 2) * ex - (t0 + band / 2) * ey, my = cy + (s0 + band / 2) * ey + (t0 + band / 2) * ex;
          if (mx < -band * 2 || my < -band * 2 || mx > size.w + band * 2 || my > size.h + band * 2) continue;
          const pts: string[] = [];
          for (let k = 0; k < sub; k++) pts.push(place(s0 + (band * k) / sub, t0));
          for (let k = 0; k < sub; k++) pts.push(place(s0 + band, t0 + (band * k) / sub));
          for (let k = 0; k < sub; k++) pts.push(place(s0 + band - (band * k) / sub, t0 + band));
          for (let k = 0; k < sub; k++) pts.push(place(s0, t0 + band - (band * k) / sub));
          const cell = Math.abs(Math.floor((i + j) / 2));
          (every > 0 && cell % every === 0 ? accent : ink).push(`M${pts.join("L")}Z`);
        }
    } else {
      const step = 1.4 * u;
      const samples = Math.ceil((reach * 2) / step);
      for (let j = -count; j < count; j += 2) {
        const top: string[] = [], bottom: string[] = [];
        for (let k = 0; k <= samples; k++) {
          const s = -reach + k * step;
          top.push(place(s, j * band));
          bottom.push(place(s, (j + 1) * band));
        }
        const idx = Math.abs(j / 2);
        (every > 0 && idx % every === 0 ? accent : ink).push(`M${top.join("L")}L${bottom.reverse().join("L")}Z`);
      }
    }

    const text = layoutText(p, size, { padding: 0.9 });
    return svgDoc(
      size,
      clearZonesMask("oa-zones", size, text.zones),
      rect(0, 0, size.w, size.h, `fill="${esc(p.bg)}"`) +
        `<g mask="url(#oa-zones)"><path d="${ink.join("")}" fill="${esc(p.ink)}"/>${accent.length ? `<path d="${accent.join("")}" fill="${esc(p.accent)}"/>` : ""}</g>` +
        text.svg,
    );
  },
};
