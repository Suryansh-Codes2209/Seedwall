import type { Generator, ParamSchema, Preset } from "./types";
import { range } from "./shared/rng";
import { esc, n, rect, svgDoc, unit } from "./shared/svg";
import { layoutText, textParams, type TextParams } from "./shared/text";

type P = TextParams & {
  bg: string;
  c1: string;
  c2: string;
  c3: string;
  a: number;
  b: number;
  c: number;
  d: number;
  points: number;
  weight: number;
  seed: number;
};

/**
 * Sine and cosine from + − × ÷ only. Math.sin can differ in the last bit between JS engines, and a chaotic
 * system magnifies that until the browser and the server draw different pictures. Basic arithmetic is exact
 * IEEE-754 everywhere, so these give the same points on every machine. Accurate to about 1e-12.
 */
const TAU = 6.283185307179586, HALF_PI = 1.5707963267948966;
function sin(v: number): number {
  let x = v - Math.round(v / TAU) * TAU;
  if (x > HALF_PI) x = Math.PI - x;
  else if (x < -HALF_PI) x = -Math.PI - x;
  const q = x * x;
  return x * (1 - (q / 6) * (1 - (q / 20) * (1 - (q / 42) * (1 - (q / 72) * (1 - (q / 110) * (1 - (q / 156) * (1 - q / 210)))))));
}
const cos = (v: number): number => sin(v + HALF_PI);

const coef = (label: string, def: number) => ({ kind: "range" as const, label, min: -2.5, max: 2.5, step: 0.01, default: def, group: "Equation" });

const params: ParamSchema<P> = {
  bg: { kind: "color", label: "Background", default: "#07080d", group: "Colours", role: "bg" },
  c1: { kind: "color", label: "Slow points", default: "#4cc9f0", group: "Colours", role: "accent" },
  c2: { kind: "color", label: "Medium points", default: "#f72585", group: "Colours", role: "accent" },
  c3: { kind: "color", label: "Fast points", default: "#ffe8a3", group: "Colours", role: "fg" },
  a: { ...coef("a", -1.4), help: "Four numbers in a two-line equation. Tiny changes give a completely different shape." },
  b: coef("b", 1.6),
  c: coef("c", 1.0),
  d: coef("d", 0.7),
  points: { kind: "range", label: "Points", min: 6000, max: 44000, step: 2000, default: 30000, group: "Drawing" },
  weight: { kind: "range", label: "Point size", min: 0.05, max: 0.5, step: 0.01, default: 0.2, group: "Drawing" },
  seed: { kind: "seed", label: "Seed", default: 2 },
  ...textParams({ "text.none": true, "text.line1": "Chaos has", "text.line2": "a *pattern*.", "text.color": "#ffffff", "text.size": 4.5, "text.position": "lower" }),
};

const presets: Preset<P>[] = [
  { id: "ribbon", title: "Ribbon", params: {} },
  { id: "wings", title: "Wings", params: { bg: "#0b0714", c1: "#7b2cbf", c2: "#ff6d00", c3: "#fff3b0", a: 1.7, b: 1.7, c: 0.6, d: 1.2, seed: 9 } },
  { id: "shell", title: "Shell", params: { bg: "#03110f", c1: "#2ec4b6", c2: "#cbf3f0", c3: "#ff9f1c", a: -1.7, b: 1.3, c: -0.1, d: -1.21, seed: 14 } },
  { id: "knot", title: "Knot", params: { bg: "#10060a", c1: "#ff4d6d", c2: "#ffb3c1", c3: "#ffffff", a: -1.8, b: -2.0, c: -0.5, d: -0.9, seed: 31 } },
  { id: "graphite", title: "Graphite (light)", params: { bg: "#f2efe9", c1: "#1d1d1f", c2: "#5c5f66", c3: "#c1121f", a: 1.5, b: -1.8, c: 1.6, d: 0.9, weight: 0.2, seed: 6, "text.color": "#1d1d1f" } },
];

export const attractor: Generator<P> = {
  id: "attractor",
  name: "Strange Attractor",
  description: "One point, moved by the same two-line equation tens of thousands of times. It never settles and never repeats, yet it draws a shape.",
  params,
  presets,
  render(p, size, rng) {
    const u = unit(size);
    // Clifford attractor: x' = sin(a·y) + c·cos(a·x), y' = sin(b·x) + d·cos(b·y)
    let x = range(rng, -0.5, 0.5), y = range(rng, -0.5, 0.5);
    const step = (): number => {
      const nx = sin(p.a * y) + p.c * cos(p.a * x);
      const ny = sin(p.b * x) + p.d * cos(p.b * y);
      const speed = Math.sqrt((nx - x) * (nx - x) + (ny - y) * (ny - y));
      x = nx;
      y = ny;
      return speed;
    };
    for (let i = 0; i < 60; i++) step();

    const total = Math.round(p.points);
    const xs = new Float32Array(total), ys = new Float32Array(total), speeds = new Float32Array(total);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, top = 1e-6;
    for (let i = 0; i < total; i++) {
      const speed = step();
      xs[i] = x;
      ys[i] = y;
      speeds[i] = speed;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      if (speed > top) top = speed;
    }

    // Fit the shape to the canvas, turning it on its side when that fills the screen better (phones).
    const sx = Math.max(x1 - x0, 1e-3), sy = Math.max(y1 - y0, 1e-3);
    const fit = 0.84;
    const upright = Math.min(size.w / sx, size.h / sy), turned = Math.min(size.w / sy, size.h / sx);
    const turn = turned > upright * 1.05;
    const scale = (turn ? turned : upright) * fit;
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const cx = size.w / 2, cy = size.h / 2;

    const buckets: string[][] = [[], [], []];
    for (let i = 0; i < total; i++) {
      const dx = ((xs[i] ?? 0) - mx) * scale, dy = ((ys[i] ?? 0) - my) * scale;
      const px = cx + (turn ? dy : dx), py = cy + (turn ? dx : dy);
      const bucket = buckets[Math.min(2, Math.floor(((speeds[i] ?? 0) / top) * 3))];
      if (bucket) bucket.push(`M${Math.round(px * 10) / 10} ${Math.round(py * 10) / 10}h.01`);
    }
    const colors = [p.c1, p.c2, p.c3];
    const dots = buckets
      .map((b, i) => (b.length ? `<path d="${b.join("")}" stroke="${esc(colors[i] ?? p.c1)}" stroke-opacity="${n(0.62 + 0.14 * i)}"/>` : ""))
      .join("");

    const text = layoutText(p, size);
    return svgDoc(
      size,
      "",
      rect(0, 0, size.w, size.h, `fill="${esc(p.bg)}"`) +
        `<g fill="none" stroke-linecap="round" stroke-width="${n(p.weight * u)}">${dots}</g>` +
        text.svg,
    );
  },
};
