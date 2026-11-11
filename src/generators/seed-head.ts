import type { Generator, ParamSchema, Preset } from "./types";
import { mix } from "./shared/color";
import { esc, n, rect, svgDoc, unit } from "./shared/svg";
import { clearZonesMask, layoutText, textParams, type TextParams } from "./shared/text";

type P = TextParams & {
  bg: string;
  c1: string;
  c2: string;
  c3: string;
  count: number;
  angle: number;
  dot: number;
  arms: string;
  origin: string;
  seed: number;
};

const params: ParamSchema<P> = {
  bg: { kind: "color", label: "Background", default: "#14110f", group: "Colours", role: "bg" },
  c1: { kind: "color", label: "Centre", default: "#f4a259", group: "Colours", role: "accent" },
  c2: { kind: "color", label: "Edge", default: "#5b8e7d", group: "Colours", role: "accent" },
  c3: { kind: "color", label: "Highlight", default: "#f4e285", group: "Colours", role: "fg" },
  count: { kind: "range", label: "Seeds", min: 300, max: 4000, step: 100, default: 1600, group: "Spiral" },
  angle: { kind: "range", label: "Turn between seeds (°)", min: 136.5, max: 138.5, step: 0.01, default: 137.51, group: "Spiral", help: "137.51° is the golden angle sunflowers use. Nudge it and spiral arms appear." },
  dot: { kind: "range", label: "Seed size", min: 0.3, max: 1.3, step: 0.05, default: 1, group: "Spiral" },
  arms: { kind: "select", label: "Highlight spirals", options: [{ value: "0", label: "None" }, { value: "13", label: "13" }, { value: "21", label: "21" }, { value: "34", label: "34" }, { value: "55", label: "55" }], default: "21", group: "Spiral", help: "Sunflower spirals come in Fibonacci numbers." },
  origin: { kind: "select", label: "Centre", options: [{ value: "center", label: "Centre" }, { value: "bottom", label: "Bottom edge" }, { value: "corner", label: "Corner" }], default: "center", group: "Spiral" },
  seed: { kind: "seed", label: "Seed", default: 6 },
  ...textParams({ "text.none": true, "text.line1": "Grow in", "text.line2": "*spirals*.", "text.color": "#f4e285", "text.size": 5 }),
};

const presets: Preset<P>[] = [
  { id: "sunflower", title: "Sunflower", params: {} },
  { id: "arms", title: "Off by a hair", params: { bg: "#0b1020", c1: "#f72585", c2: "#4361ee", c3: "#4cc9f0", angle: 137.3, arms: "0", count: 3000, seed: 14 } },
  { id: "rising", title: "Rising (bottom)", params: { bg: "#101915", c1: "#d9ed92", c2: "#168aad", c3: "#ffffff", origin: "bottom", arms: "34", count: 3200, seed: 2 } },
  { id: "paper", title: "Paper (light)", params: { bg: "#f2ede3", c1: "#bc4b51", c2: "#2f3e46", c3: "#f4a259", arms: "13", dot: 0.9, seed: 19, "text.color": "#2f3e46" } },
  { id: "corner", title: "Corner bloom", params: { bg: "#1b1024", c1: "#ffd166", c2: "#7b2cbf", c3: "#ffffff", origin: "corner", count: 4000, arms: "55", seed: 30 } },
];

export const seedHead: Generator<P> = {
  id: "seed-head",
  name: "Seed Head",
  description: "Phyllotaxis: thousands of seeds, each turned by the golden angle from the last, packing into the spirals of a sunflower.",
  params,
  presets,
  render(p, size, rng) {
    const u = unit(size);
    const cx = p.origin === "corner" ? size.w * 0.12 : size.w / 2;
    const cy = p.origin === "center" ? size.h / 2 : p.origin === "bottom" ? size.h * 1.02 : size.h * 0.88;
    // Reach the farthest corner so the head fills the canvas at any aspect ratio.
    const reach = Math.max(Math.hypot(cx, cy), Math.hypot(size.w - cx, cy), Math.hypot(cx, size.h - cy), Math.hypot(size.w - cx, size.h - cy));
    const count = Math.round(p.count);
    const spacing = reach / Math.sqrt(count);
    const turn = (p.angle * Math.PI) / 180;
    const start = rng() * Math.PI * 2;
    const arms = Number(p.arms) || 0;
    const lit = arms ? Math.floor(rng() * arms) : -1;

    const groups = new Map<string, string[]>();
    for (let i = 1; i <= count; i++) {
      const r = spacing * Math.sqrt(i);
      const a = start + i * turn;
      const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      const rad = p.dot * spacing * (0.3 + 0.42 * Math.sqrt(i / count));
      if (x < -rad || y < -rad || x > size.w + rad || y > size.h + rad) continue;
      const t = i / count;
      // Highlight a few of the spiral arms: seeds whose index shares a remainder lie on one spiral.
      const onArm = arms > 0 && (i % arms === lit || i % arms === (lit + Math.round(arms / 3)) % arms || i % arms === (lit + Math.round((2 * arms) / 3)) % arms);
      const color = onArm ? p.c3 : mix(p.c1, p.c2, Math.round(Math.sqrt(t) * 12) / 12);
      const list = groups.get(color) ?? [];
      list.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${n(rad)}"/>`);
      groups.set(color, list);
    }
    const dots = [...groups].map(([color, list]) => `<g fill="${esc(color)}">${list.join("")}</g>`).join("");

    const text = layoutText(p, size, { padding: 0.8 });
    return svgDoc(
      size,
      clearZonesMask("sh-zones", size, text.zones),
      rect(0, 0, size.w, size.h, `fill="${esc(p.bg)}"`) + `<g mask="url(#sh-zones)">${dots}</g>` + text.svg,
    );
  },
};
