import type { Generator, ParamSchema, Preset } from "./types";
import { isDark, mix } from "./shared/color";
import { range } from "./shared/rng";
import { blurFilter, esc, n, rect, svgDoc, unit } from "./shared/svg";
import { layoutText, textParams, type TextParams } from "./shared/text";

type P = TextParams & {
  bg: string;
  hot: string;
  warm: string;
  size: number;
  tilt: number;
  reach: number;
  rings: number;
  glow: number;
  stars: boolean;
  seed: number;
};

const params: ParamSchema<P> = {
  bg: { kind: "color", label: "Space", default: "#03040a", group: "Colours", role: "bg" },
  hot: { kind: "color", label: "Hot gas", default: "#fff1d6", group: "Colours", role: "fg" },
  warm: { kind: "color", label: "Cooler gas", default: "#ff8a2a", group: "Colours", role: "accent" },
  size: { kind: "range", label: "Hole size", min: 5, max: 22, step: 0.5, default: 15, group: "Black hole" },
  tilt: { kind: "range", label: "Disk tilt", min: 0.05, max: 0.45, step: 0.01, default: 0.17, group: "Black hole", help: "Low = seen edge-on. High = seen from above." },
  reach: { kind: "range", label: "Disk reach", min: 2.5, max: 7, step: 0.1, default: 4.6, group: "Black hole" },
  rings: { kind: "range", label: "Streaks", min: 16, max: 90, step: 1, default: 56, group: "Black hole" },
  glow: { kind: "range", label: "Glow", min: 0, max: 1, step: 0.05, default: 0.7, group: "Black hole" },
  stars: { kind: "toggle", label: "Stars", default: true, group: "Black hole" },
  seed: { kind: "seed", label: "Seed", default: 17 },
  ...textParams({ "text.none": true, "text.line1": "Nothing escapes", "text.line2": "*curiosity*.", "text.color": "#fff1d6", "text.size": 4.5, "text.position": "lower" }),
};

const presets: Preset<P>[] = [
  { id: "gargantua", title: "Amber disk", params: {} },
  { id: "blueshift", title: "Blueshift", params: { bg: "#02040c", hot: "#eaf6ff", warm: "#3a86ff", tilt: 0.22, seed: 5 } },
  { id: "edge-on", title: "Edge-on", params: { tilt: 0.07, reach: 6.4, size: 12, rings: 70, seed: 29 } },
  { id: "from-above", title: "From above", params: { bg: "#07030c", hot: "#ffe3f1", warm: "#d6336c", tilt: 0.4, size: 12, reach: 5.2, seed: 8 } },
  { id: "diagram", title: "Ink diagram (light)", params: { bg: "#f1ece2", hot: "#1b1b1b", warm: "#c0392b", glow: 0, stars: false, rings: 40, seed: 3, "text.color": "#1b1b1b" } },
  { id: "quote", title: "With a quote", params: { size: 12, seed: 40, "text.none": false } },
];

export const eventHorizon: Generator<P> = {
  id: "event-horizon",
  name: "Event Horizon",
  description: "A black hole drawn in lines: the glowing disk in front, and its far side bent up and over the shadow by gravity.",
  params,
  presets,
  render(p, size, rng) {
    const u = unit(size);
    const cx = size.w / 2, cy = size.h * 0.48;
    // On a narrow phone, let the disk run a little off the sides rather than shrinking the hole to a dot.
    const rs = Math.min(p.size * u, (size.w * 0.72) / p.reach);
    const rIn = rs * 1.7, rOut = rs * p.reach;
    const dark = isDark(p.bg);
    const hot = esc(p.hot), warm = esc(p.warm);

    // The side of the disk spinning towards us looks brighter (Doppler beaming): fade every stroke from left to right.
    const tones = [p.hot, mix(p.hot, p.warm, 0.55), p.warm];
    const defs: string[] = tones.map(
      (c, i) =>
        `<linearGradient id="eh-g${i}" gradientUnits="userSpaceOnUse" x1="${n(cx - rOut)}" y1="0" x2="${n(cx + rOut)}" y2="0">` +
        `<stop offset="0" stop-color="${esc(c)}"/><stop offset="0.55" stop-color="${esc(c)}" stop-opacity="0.75"/><stop offset="1" stop-color="${esc(c)}" stop-opacity="0.22"/></linearGradient>`,
    );
    defs.push(blurFilter("eh-blur", 2.2 * u));

    const back: string[] = [], front: string[] = [];
    const rings = Math.round(p.rings);
    for (let i = 0; i < rings; i++) {
      const t = (i + rng() * 0.9) / rings;
      const r = rIn + (rOut - rIn) * Math.pow(t, 1.2);
      const ry = r * p.tilt;
      const width = range(rng, 0.05, 0.24) * u * (1 - 0.45 * t);
      const opacity = Math.pow(1 - t, 0.8) * range(rng, 0.35, 1);
      const tone = t < 0.25 ? 0 : t < 0.6 ? 1 : 2;
      const dash = `stroke-dasharray="${n(range(rng, 10, 46) * u)} ${n(range(rng, 0.4, 3.5) * u)}" stroke-dashoffset="${n(range(rng, 0, 40) * u)}"`;
      const attrs = `stroke="url(#eh-g${tone})" stroke-width="${n(width)}" stroke-opacity="${n(opacity)}" ${dash}`;
      back.push(`<path d="M${n(cx - r)} ${n(cy)}A${n(r)} ${n(ry)} 0 0 1 ${n(cx + r)} ${n(cy)}" ${attrs}/>`);
      front.push(`<path d="M${n(cx - r)} ${n(cy)}A${n(r)} ${n(ry)} 0 0 0 ${n(cx + r)} ${n(cy)}" ${attrs}/>`);
    }

    // Light from the far side of the disk is bent over the top of the hole (thick) and under it (thin).
    const halo: string[] = [];
    const over = 24, under = 9;
    for (let k = 0; k < over; k++) {
      const t = k / (over - 1);
      halo.push(`<circle cx="${n(cx)}" cy="${n(cy - rs * 0.42 * t)}" r="${n(rs * (1.05 + 0.6 * t))}" stroke="url(#eh-g${t < 0.3 ? 0 : 1})" stroke-width="${n(range(rng, 0.08, 0.2) * u)}" stroke-opacity="${n(Math.pow(1 - t, 1.5) * 0.95 + 0.03)}"/>`);
    }
    for (let k = 0; k < under; k++) {
      const t = k / (under - 1);
      halo.push(`<circle cx="${n(cx)}" cy="${n(cy + rs * 0.16 * t)}" r="${n(rs * (1.05 + 0.2 * t))}" stroke="url(#eh-g1)" stroke-width="${n(0.1 * u)}" stroke-opacity="${n(Math.pow(1 - t, 1.3) * 0.6)}"/>`);
    }

    const glow =
      p.glow > 0
        ? `<g filter="url(#eh-blur)" fill="none" opacity="${n(p.glow)}">` +
          `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n((rIn + rOut) * 0.42)}" ry="${n((rIn + rOut) * 0.42 * p.tilt)}" stroke="${warm}" stroke-width="${n(Math.max(1.2 * u, (rOut - rIn) * p.tilt * 0.55))}" stroke-opacity="0.5"/>` +
          `<circle cx="${n(cx)}" cy="${n(cy - rs * 0.1)}" r="${n(rs * 1.22)}" stroke="${warm}" stroke-width="${n(rs * 0.5)}" stroke-opacity="0.55"/>` +
          `</g>`
        : "";

    const stars = p.stars
      ? Array.from({ length: 240 }, () => {
          const x = rng() * size.w, y = rng() * size.h, r = range(rng, 0.04, 0.2) * u, o = range(rng, 0.2, 0.9);
          return Math.hypot(x - cx, y - cy) < rs * 1.9 ? "" : `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" opacity="${n(o)}"/>`;
        }).join("")
      : "";

    const text = layoutText(p, size);
    const tiltDeg = range(rng, -13, 13);
    return svgDoc(
      size,
      defs.join(""),
      rect(0, 0, size.w, size.h, `fill="${esc(p.bg)}"`) +
        `<g fill="${hot}">${stars}</g>` +
        `<g transform="rotate(${n(tiltDeg)} ${n(cx)} ${n(cy)})" fill="none" stroke-linecap="round">` +
        glow +
        back.join("") +
        halo.join("") +
        `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(rs)}" fill="${dark ? "#000000" : hot}"/>` +
        `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(rs * 1.03)}" stroke="${hot}" stroke-width="${n(0.16 * u)}" stroke-opacity="0.9"/>` +
        front.join("") +
        `</g>` +
        text.svg,
    );
  },
};
