import type { Generator, ParamSchema, Preset } from "./types";
import { backgroundParams, liftForBlack, type BackgroundParams } from "./shared/background";
import { isDark, lighten, mix } from "./shared/color";
import { range } from "./shared/rng";
import { blurFilter, esc, n, rect, smoothPath, svgDoc, unit } from "./shared/svg";
import { clearZonesMask, layoutText, textParams, type Box, type TextParams } from "./shared/text";

type P = TextParams & BackgroundParams & {
  sky1: string;
  sky2: string;
  bubble: string;
  ground: string;
  floor: string;
  bubbles: number;
  bubbleSize: number;
  rays: number;
  swoosh: boolean;
  sparkles: boolean;
  seed: number;
};

const params: ParamSchema<P> = {
  sky1: { kind: "color", label: "Sky top", default: "#1f7fe0", group: "Colours", role: "bg" },
  sky2: { kind: "color", label: "Sky bottom", default: "#c8f0ff", group: "Colours", role: "accent" },
  bubble: { kind: "color", label: "Bubble tint", default: "#8fe3ff", group: "Colours", role: "accent" },
  ground: { kind: "color", label: "Water or grass", default: "#14a6d4", group: "Colours", role: "accent" },
  floor: {
    kind: "select",
    label: "Ground",
    options: [
      { value: "water", label: "Water" },
      { value: "grass", label: "Grassy hill" },
      { value: "none", label: "None, just sky" },
    ],
    default: "water",
    group: "Scene",
  },
  bubbles: { kind: "range", label: "Bubbles", min: 0, max: 40, step: 1, default: 14, group: "Scene" },
  bubbleSize: { kind: "range", label: "Bubble size", min: 0.4, max: 2.5, step: 0.05, default: 1, group: "Scene" },
  rays: { kind: "range", label: "Light rays", min: 0, max: 1, step: 0.05, default: 0.6, group: "Scene" },
  swoosh: { kind: "toggle", label: "Light swooshes", default: true, group: "Scene" },
  sparkles: { kind: "toggle", label: "Sparkles", default: true, group: "Scene" },
  seed: { kind: "seed", label: "Seed", default: 3 },
  ...backgroundParams(),
  ...textParams({ "text.none": true, "text.line1": "Clear skies *ahead*.", "text.line2": "", "text.font": "sans", "text.size": 5.5, "text.position": "upper", "text.color": "#ffffff" }),
};

const presets: Preset<P>[] = [
  { id: "sky-bubbles", title: "Sky bubbles", params: {} },
  { id: "meadow", title: "Meadow", params: { sky1: "#2a8ee8", sky2: "#e3f7ff", ground: "#4fbf2a", floor: "grass", bubbles: 8, bubbleSize: 1.2, seed: 11 } },
  { id: "lagoon", title: "Lagoon", params: { sky1: "#00a7c7", sky2: "#c9fff4", bubble: "#a6fff0", ground: "#008fb0", bubbles: 26, bubbleSize: 0.8, rays: 0.45, seed: 6 } },
  { id: "eco-lime", title: "Eco lime", params: { sky1: "#5fcf3a", sky2: "#eaffd0", bubble: "#e6ffb8", ground: "#2f9e2a", floor: "grass", bubbles: 12, rays: 0.7, swoosh: true, seed: 21, "text.color": "#ffffff" } },
  { id: "night-aero", title: "Night + quote", params: { sky1: "#03142e", sky2: "#0b5c8c", bubble: "#5fd8ff", ground: "#0a7fb8", bubbles: 18, rays: 0.35, seed: 9, "text.none": false } },
];

const hits = (zones: Box[], x: number, y: number, r: number): boolean =>
  zones.some((z) => x + r > z.x && x - r < z.x + z.w && y + r > z.y && y - r < z.y + z.h);

export const frutigerAero: Generator<P> = {
  id: "frutiger-aero",
  name: "Frutiger Aero",
  description: "The glossy look of mid-2000s screens: a bright sky gradient, shiny see-through bubbles, soft light rays and a curve of water or grass.",
  params,
  presets,
  trueBlack: { native: true },
  render(p, size, rng) {
    const { w, h } = size;
    const u = unit(size);
    const black = p["background.trueBlack"];
    const text = layoutText(black ? { ...p, "text.color": liftForBlack(p["text.color"], 4.5) } : p, size);
    const defs: string[] = [];
    const body: string[] = [];

    // Sky
    if (black) body.push(rect(0, 0, w, h, `fill="#000000"`));
    else {
      defs.push(`<linearGradient id="fa-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${esc(p.sky1)}"/><stop offset="0.75" stop-color="${esc(p.sky2)}"/></linearGradient>`);
      body.push(rect(0, 0, w, h, `fill="url(#fa-sky)"`));
    }

    // Sun glow and rays fanning down from a point above the top edge.
    const sx = w * range(rng, 0.15, 0.85);
    const sy = -h * 0.08;
    if (!black) {
      defs.push(`<radialGradient id="fa-sun" gradientUnits="userSpaceOnUse" cx="${n(sx)}" cy="0" r="${n(Math.max(w, h) * 0.55)}"><stop offset="0" stop-color="#ffffff" stop-opacity="${isDark(p.sky1) ? 0.22 : 0.75}"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>`);
      body.push(rect(0, 0, w, h, `fill="url(#fa-sun)"`));
    }
    if (p.rays > 0 && !black) {
      const reach = Math.hypot(w, h) * 1.1;
      const count = 9;
      const rays: string[] = [];
      for (let i = 0; i < count; i++) {
        const mid = Math.PI / 2 + range(rng, -0.95, 0.95);
        const half = range(rng, 0.03, 0.08);
        const x1 = sx + Math.cos(mid - half) * reach, y1 = sy + Math.sin(mid - half) * reach;
        const x2 = sx + Math.cos(mid + half) * reach, y2 = sy + Math.sin(mid + half) * reach;
        rays.push(`<path d="M${n(sx)} ${n(sy)}L${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}Z" opacity="${n(range(rng, 0.35, 1))}"/>`);
      }
      defs.push(`<radialGradient id="fa-ray" gradientUnits="userSpaceOnUse" cx="${n(sx)}" cy="${n(sy)}" r="${n(Math.max(w, h) * 0.9)}"><stop offset="0" stop-color="#ffffff" stop-opacity="0.85"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>`);
      defs.push(blurFilter("fa-rayblur", 1.6 * u, size));
      body.push(`<g fill="url(#fa-ray)" opacity="${n(0.5 * p.rays)}" filter="url(#fa-rayblur)">${rays.join("")}</g>`);
    }

    // Soft white swooshes: wide translucent ribbons sweeping across.
    if (p.swoosh) {
      const sw: string[] = [];
      for (let i = 0; i < 3; i++) {
        const y0 = h * range(rng, 0.35, 0.7);
        const amp = h * range(rng, 0.05, 0.14) * (rng() < 0.5 ? -1 : 1);
        const thick = range(rng, 1.2, 4) * u;
        const pts: [number, number][] = [];
        for (let k = 0; k <= 6; k++) {
          const t = k / 6;
          pts.push([-0.05 * w + t * 1.1 * w, y0 + Math.sin(t * Math.PI * range(rng, 0.9, 1.1)) * amp - t * amp * 0.6]);
        }
        const top = smoothPath(pts);
        const bottom = smoothPath(pts.map(([x, y]) => [x, y + thick] as [number, number]).reverse(), false);
        sw.push(`<path d="${top}${bottom}Z" opacity="${n(range(rng, 0.25, 0.55) * (black ? 0.4 : 1))}"/>`);
      }
      defs.push(`<linearGradient id="fa-swoosh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset="0.5" stop-color="#ffffff"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>`);
      defs.push(blurFilter("fa-swblur", 0.5 * u));
      body.push(`<g fill="url(#fa-swoosh)" filter="url(#fa-swblur)">${sw.join("")}</g>`);
    }

    // Water or grass: a wide glossy curve along the bottom.
    let groundTop = h;
    if (p.floor !== "none") {
      const grass = p.floor === "grass";
      const base = h * (grass ? 0.78 : 0.8);
      const lift = h * (grass ? range(rng, 0.07, 0.13) : range(rng, 0.03, 0.08));
      const peak = range(rng, 0.25, 0.75);
      const pts: [number, number][] = [];
      for (let k = 0; k <= 12; k++) {
        const t = k / 12;
        const bump = Math.exp(-(((t - peak) / 0.45) ** 2));
        pts.push([-0.02 * w + t * 1.04 * w, base - lift * bump + (grass ? 0 : Math.sin(t * 9 + peak * 7) * 0.25 * u)]);
      }
      groundTop = Math.min(...pts.map((q) => q[1]));
      if (grass) {
        // A paler hill behind, for depth.
        const back: [number, number][] = pts.map(([x], k) => {
          const t = k / 12;
          return [x, base - h * 0.05 - lift * 0.9 * Math.exp(-(((t - (1 - peak)) / 0.35) ** 2))];
        });
        body.push(`<path d="${smoothPath(back)}L${n(w * 1.02)} ${h}L${n(-0.02 * w)} ${h}Z" fill="${esc(mix(p.ground, p.sky2, 0.45))}"/>`);
      }
      const top = smoothPath(pts);
      const g = p.ground;
      defs.push(
        `<linearGradient id="fa-ground" gradientUnits="userSpaceOnUse" x1="0" y1="${n(groundTop)}" x2="0" y2="${h}">` +
          `<stop offset="0" stop-color="${esc(lighten(g, grass ? 0.35 : 0.45))}"/><stop offset="0.18" stop-color="${esc(g)}"/><stop offset="1" stop-color="${esc(mix(g, "#001018", grass ? 0.35 : 0.5))}"/></linearGradient>`,
      );
      body.push(`<path d="${top}L${n(w * 1.02)} ${h}L${n(-0.02 * w)} ${h}Z" fill="url(#fa-ground)"/>`);
      // Gloss along the top edge, like light catching a curved surface.
      defs.push(blurFilter("fa-rim", 0.5 * u));
      body.push(`<path d="${top}" fill="none" stroke="#ffffff" stroke-width="${n(0.6 * u)}" stroke-opacity="0.75" stroke-linecap="round" filter="url(#fa-rim)"/>`);
      if (!grass) {
        // A few long glints on the water.
        const glints: string[] = [];
        for (let i = 0; i < 7; i++) {
          const y = groundTop + (h - groundTop) * range(rng, 0.2, 0.9);
          const x = w * range(rng, 0.05, 0.85);
          glints.push(`<rect x="${n(x)}" y="${n(y)}" width="${n(range(rng, 6, 20) * u)}" height="${n(0.35 * u)}" rx="${n(0.2 * u)}"/>`);
        }
        body.push(`<g fill="#ffffff" opacity="0.4" filter="url(#fa-rim)">${glints.join("")}</g>`);
      } else {
        defs.push(`<linearGradient id="fa-sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/><stop offset="0.3" stop-color="#ffffff" stop-opacity="0"/></linearGradient>`);
        body.push(`<path d="${top}L${n(w * 1.02)} ${h}L${n(-0.02 * w)} ${h}Z" fill="url(#fa-sheen)"/>`);
      }
    }

    // Glossy bubbles. Each one is a tinted, see-through sphere with a bright rim, a big highlight
    // at the top and a small bounce light at the bottom. They skip the quote's clear zones.
    const tint = esc(p.bubble);
    defs.push(
      `<radialGradient id="fa-bub" cx="0.5" cy="0.55" r="0.5"><stop offset="0" stop-color="${tint}" stop-opacity="0.05"/><stop offset="0.7" stop-color="${tint}" stop-opacity="0.18"/><stop offset="0.93" stop-color="${tint}" stop-opacity="0.6"/><stop offset="1" stop-color="#ffffff" stop-opacity="0.85"/></radialGradient>`,
      `<linearGradient id="fa-hi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>`,
      `<radialGradient id="fa-low" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffffff" stop-opacity="0.7"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>`,
    );
    const bubbles: string[] = [];
    const placed: [number, number, number][] = [];
    const want = Math.round(p.bubbles);
    for (let tries = 0; placed.length < want && tries < want * 30; tries++) {
      const r = range(rng, 2.5, 11) * u * p.bubbleSize * (rng() < 0.15 ? 1.8 : 1);
      const x = range(rng, -0.05, 1.05) * w;
      const y = range(rng, 0.04, 0.95) * Math.max(groundTop + r * 0.6, h * 0.5);
      if (hits(text.zones, x, y, r)) continue;
      if (placed.some(([px, py, pr]) => Math.hypot(px - x, py - y) < (pr + r) * 0.9)) continue;
      placed.push([x, y, r]);
    }
    placed.sort((a, b) => a[2] - b[2]); // small ones behind
    for (const [x, y, r] of placed)
      bubbles.push(
        `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="url(#fa-bub)"/>` +
          `<ellipse cx="${n(x - r * 0.05)}" cy="${n(y - r * 0.48)}" rx="${n(r * 0.62)}" ry="${n(r * 0.36)}" fill="url(#fa-hi)"/>` +
          `<ellipse cx="${n(x + r * 0.1)}" cy="${n(y + r * 0.66)}" rx="${n(r * 0.42)}" ry="${n(r * 0.16)}" fill="url(#fa-low)"/>` +
          `<circle cx="${n(x - r * 0.42)}" cy="${n(y - r * 0.12)}" r="${n(r * 0.07)}" fill="#ffffff" fill-opacity="0.8"/>`,
      );

    // Sparkles: tiny four-point glints.
    const sparkles: string[] = [];
    if (p.sparkles)
      for (let i = 0; i < 18; i++) {
        const x = rng() * w, y = rng() * Math.min(h * 0.85, groundTop - 2 * u), s = range(rng, 0.6, 1.8) * u, t = s * 0.18;
        sparkles.push(`<path d="M${n(x - s)} ${n(y)}L${n(x - t)} ${n(y - t)}L${n(x)} ${n(y - s)}L${n(x + t)} ${n(y - t)}L${n(x + s)} ${n(y)}L${n(x + t)} ${n(y + t)}L${n(x)} ${n(y + s)}L${n(x - t)} ${n(y + t)}Z" opacity="${n(range(rng, 0.5, 0.95))}"/>`);
      }

    defs.push(clearZonesMask("fa-zones", size, text.zones));
    return svgDoc(
      size,
      defs.join(""),
      body.join("") + `<g mask="url(#fa-zones)">${bubbles.join("")}<g fill="#ffffff">${sparkles.join("")}</g></g>` + text.svg,
    );
  },
};
