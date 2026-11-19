import type { Generator, ParamSchema, Preset, Size } from "./types";
import { darken, isDark, lighten, mix } from "./shared/color";
import { createNoise2D, fbm } from "./shared/noise";
import { range } from "./shared/rng";
import { esc, grainFilter, grainRect, rect, svgDoc, unit } from "./shared/svg";
import { knifePrecision, paintKnife, type KnifePass } from "./shared/knife";
import { layoutText, textParams, type Box, type TextParams } from "./shared/text";

/**
 * Impasto: a palette-knife oil painting. A scene is a tone field (dark → light, plus an accent
 * weight) and a direction field. Thousands of flat, angular knife strokes sample it in three
 * passes (block-in, body, detail), and each stroke gets a lit ridge, a cast shadow and drag
 * striations so the paint reads as thick. No SVG lighting filters, so browsers and resvg match.
 */

type P = TextParams & {
  scene: string;
  ground: string;
  shadow: string;
  mid: string;
  light: string;
  accent: string;
  knife: number;
  relief: number;
  broken: number;
  lightFrom: string;
  vignette: number;
  grain: number;
  seed: number;
};

const SCENES = [
  { value: "panels", label: "Wood panels" },
  { value: "horizon", label: "Sun over water" },
  { value: "bloom", label: "Blooms" },
  { value: "peaks", label: "Mountains" },
  { value: "drift", label: "Abstract drift" },
] as const;

const params: ParamSchema<P> = {
  scene: { kind: "select", label: "Subject", options: SCENES, default: "panels", group: "Painting" },
  ground: { kind: "color", label: "Ground (darkest)", default: "#1a0c05", group: "Colours", role: "bg" },
  shadow: { kind: "color", label: "Shadow", default: "#4a210c", group: "Colours", role: "accent" },
  mid: { kind: "color", label: "Mid tone", default: "#a4501f", group: "Colours", role: "accent" },
  light: { kind: "color", label: "Light", default: "#e9a75e", group: "Colours", role: "fg" },
  accent: { kind: "color", label: "Hot accent", default: "#ff7a2a", group: "Colours", role: "accent" },
  knife: { kind: "range", label: "Knife size", min: 0.75, max: 1.8, step: 0.05, default: 1, group: "Knife" },
  relief: { kind: "range", label: "Paint thickness", min: 0, max: 1, step: 0.05, default: 0.7, group: "Knife" },
  broken: { kind: "range", label: "Broken colour", min: 0, max: 1, step: 0.05, default: 0.45, group: "Knife" },
  lightFrom: {
    kind: "select",
    label: "Light from",
    options: [
      { value: "top-left", label: "Top left" },
      { value: "top", label: "Above" },
      { value: "top-right", label: "Top right" },
    ],
    default: "top-left",
    group: "Knife",
  },
  vignette: { kind: "range", label: "Vignette", min: 0, max: 0.8, step: 0.05, default: 0.35, group: "Knife" },
  grain: { kind: "range", label: "Canvas grain", min: 0, max: 0.3, step: 0.01, default: 0.08, group: "Knife" },
  seed: { kind: "seed", label: "Seed", default: 7 },
  ...textParams({ "text.line1": "Lay it on", "text.line2": "*thick*.", "text.color": "#f6e2c6", "text.font": "display", "text.size": 6, "text.position": "bottom-left" }),
};

const presets: Preset<P>[] = [
  { id: "ember-panels", title: "Ember Panels", params: {} },
  {
    id: "harbour-dusk",
    title: "Harbour Dusk",
    params: { scene: "horizon", ground: "#0c1222", shadow: "#24365c", mid: "#6e5b8c", light: "#f4bd86", accent: "#ff8a3d", seed: 3, "text.color": "#fbe7d2", "text.position": "top-left" },
  },
  {
    id: "still-life",
    title: "Still Life",
    params: { scene: "bloom", ground: "#111613", shadow: "#2c3d33", mid: "#b0465a", light: "#f4dccb", accent: "#f2b632", seed: 11, "text.none": true },
  },
  {
    id: "alpine",
    title: "Alpine",
    params: { scene: "peaks", ground: "#0f1720", shadow: "#2e4a64", mid: "#7f9db8", light: "#eef3f6", accent: "#e3a56c", seed: 5, "text.color": "#0f1720", "text.position": "upper" },
  },
  {
    id: "ochre-drift",
    title: "Ochre Drift",
    params: { scene: "drift", ground: "#1f130b", shadow: "#5b3a1e", mid: "#c27a37", light: "#f1d9aa", accent: "#2f7178", broken: 0.6, seed: 9, "text.none": true },
  },
  {
    id: "midnight-panels",
    title: "Midnight Panels",
    params: { ground: "#07090d", shadow: "#1d2533", mid: "#46536a", light: "#aeb9cb", accent: "#d8c39a", relief: 0.8, seed: 2, "text.color": "#e7ecf4" },
  },
];

/** What a scene says about one point (coordinates in units): tone 0..1, accent weight 0..1, stroke angle. */
interface Sample { v: number; a: number; ang: number }
type Field = (X: number, Y: number) => Sample;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (e0: number, e1: number, x: number): number => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

interface SceneCtx {
  W: number;
  H: number;
  rng: () => number;
  noise: (x: number, y: number) => number;
  noise2: (x: number, y: number) => number;
  /** -1 light from the left, 0 from above, +1 from the right. */
  side: number;
}

function panelsScene({ W, H, noise, side }: SceneCtx): Field {
  const cols = Math.max(2, Math.round(W / 34));
  const pw = W / cols;
  const rows = Math.max(1, Math.round(H / 55));
  const ph = H / rows;
  const frame = Math.min(pw, ph) * 0.15;
  const bevel = Math.min(pw, ph) * 0.1;
  const lx0 = side < 0 ? 0.25 : side > 0 ? 0.75 : 0.5;
  return (X, Y) => {
    const ci = Math.floor(X / pw);
    const ri = Math.floor(Y / ph);
    const lx = X - ci * pw;
    const ly = Y - ri * ph;
    const dl = lx - frame, dr = pw - frame - lx, dt = ly - frame, db = ph - frame - ly;
    const inner = Math.min(dl, dr, dt, db);
    const grainV = fbm(noise, X * 0.11 + ci * 7.3, Y * 0.016, 3);
    const grainH = fbm(noise, X * 0.016, Y * 0.11 + ri * 5.1, 3);
    const glow = 1 - Math.min(1, Math.hypot(X / W - lx0, (Y / H - 0.2) * 0.8) * 1.15);
    let v: number;
    let ang: number;
    if (inner < 0) {
      const stile = lx < frame || lx > pw - frame;
      ang = stile ? Math.PI / 2 : 0;
      v = 0.38 + 0.34 * (stile ? grainV : grainH) + 0.28 * glow;
      if (inner > -0.9) v = 0.06; // the dark seam around each raised panel
    } else if (inner < bevel) {
      // Bevel: the edges facing the light catch it, the others fall into shadow.
      const lit = inner === dt || (side <= 0 && inner === dl) || (side >= 0 && inner === dr);
      const vert = inner === dl || inner === dr;
      ang = vert ? Math.PI / 2 : 0;
      v = (lit ? 0.72 : 0.22) + 0.15 * grainV + 0.15 * glow;
    } else {
      ang = Math.PI / 2;
      v = 0.42 + 0.36 * grainV + 0.32 * glow;
    }
    return { v, a: smooth(0.68, 0.95, v) * 0.75, ang };
  };
}

function horizonScene({ W, H, noise, noise2 }: SceneCtx): Field {
  const hy = H * (H > W ? 0.58 : 0.62);
  const m = Math.min(W, H);
  const sx = W * 0.64;
  const sy = hy - m * 0.13;
  const sr = m * 0.07;
  return (X, Y) => {
    const shore = 1.2 + 3.2 * Math.max(0, fbm(noise2, X * 0.035, 3.3, 3) + 0.15);
    const d = Math.hypot(X - sx, Y - sy);
    const glow = Math.exp(-((d / (m * 0.26)) ** 2));
    if (Y < hy - shore) {
      const t = Y / hy;
      const cloud = fbm(noise, X * 0.022, Y * 0.1, 4);
      if (d < sr) return { v: 1, a: 0.85, ang: Math.atan2(Y - sy, X - sx) + Math.PI / 2 };
      const v = 0.28 + 0.42 * t ** 1.6 + 0.42 * glow + 0.32 * cloud;
      return { v, a: clamp01(glow * 0.9 + Math.max(0, cloud) * glow * 1.5), ang: cloud * 0.5 };
    }
    if (Y < hy) return { v: 0.08 + 0.06 * fbm(noise2, X * 0.2, Y * 0.2, 2), a: 0, ang: 0 };
    const depth = (Y - hy) / Math.max(1, H - hy);
    const ripple = fbm(noise, X * 0.05, Y * 0.32, 3);
    const col = Math.exp(-(((X - sx) / (sr * 0.8 + depth * m * 0.16)) ** 2));
    const bands = 0.5 + 0.5 * Math.sin(Y * 1.9 + ripple * 5);
    const refl = col * bands * (1 - depth * 0.45);
    const v = 0.2 + 0.18 * (1 - depth) + 0.7 * refl + 0.16 * ripple;
    return { v, a: refl * 0.85, ang: ripple * 0.25 };
  };
}

function bloomScene({ W, H, rng, noise, side }: SceneCtx): Field {
  const count = Math.max(3, Math.min(5, Math.round((W * H) / 5000)));
  const blooms = Array.from({ length: count }, (_, i) => ({
    x: range(rng, 0.14, 0.86) * W,
    y: range(rng, 0.14, 0.86) * H,
    r: range(rng, 13, 21) * (i === 0 ? 1.3 : 1),
    k: Math.floor(range(rng, 5, 9)),
    rot: rng() * Math.PI,
  }));
  const la = side < 0 ? -Math.PI * 0.75 : side > 0 ? -Math.PI * 0.25 : -Math.PI / 2;
  return (X, Y) => {
    const g = fbm(noise, X * 0.03, Y * 0.03, 3);
    let best: Sample = { v: 0.16 + 0.16 * g, a: 0, ang: Math.PI / 4 + g * 1.6 };
    let bestQ = Infinity;
    for (const b of blooms) {
      const dx = X - b.x;
      const dy = Y - b.y;
      const r = Math.hypot(dx, dy);
      const th = Math.atan2(dy, dx);
      const edge = b.r * (0.55 + 0.45 * Math.abs(Math.cos((b.k * (th - b.rot)) / 2)));
      const q = r / edge;
      if (q < 1 && q < bestQ) {
        bestQ = q;
        if (r < b.r * 0.2) best = { v: 0.3 + 0.35 * (1 - r / (b.r * 0.2)), a: 1, ang: th + Math.PI / 2 };
        else best = { v: 0.42 + 0.42 * (1 - q) ** 0.6 + 0.16 * Math.cos(th - la), a: 0, ang: th };
      } else if (q < 1.3 && bestQ === Infinity) best = { ...best, v: best.v - 0.07 };
    }
    return best;
  };
}

function peaksScene({ W, H, noise, noise2, side }: SceneCtx): Field {
  const layers = 4;
  const ridge = (i: number, X: number): number => {
    const base = H * (0.36 + i * 0.14);
    const amp = 22 - i * 3;
    const ridged = 1 - Math.abs(fbm(noise, X * (0.018 + i * 0.009) + i * 31.7, i * 7.7, 4) * 1.6);
    return base - amp * ridged;
  };
  return (X, Y) => {
    for (let i = layers - 1; i >= 0; i--) {
      const top = ridge(i, X);
      if (Y < top) continue;
      const depthT = i / (layers - 1);
      const dy = Y - top;
      // A rough surface per range: its x-gradient decides which faces turn to the light.
      const m = (x: number, y: number): number => fbm(noise2, x * 0.045 + i * 9.1, y * 0.07, 3);
      const gx = m(X + 0.6, Y) - m(X - 0.6, Y);
      const gy = m(X, Y + 0.6) - m(X, Y - 0.6);
      const slope = ridge(i, X + 0.5) - ridge(i, X - 0.5);
      const face = side === 0 ? -Math.tanh(gy * 10) : side * Math.tanh((gx + slope * 0.08) * 10);
      let v = 0.78 - depthT * 0.6 + face * (0.2 - depthT * 0.06) + 0.12 * m(X, Y);
      if (i <= 1 && dy < 2 + (1 - depthT) * 3 + 2.5 * m(X * 2, Y)) v = 0.97 - 0.1 * depthT; // snow on the far ridges
      v += 0.12 * smooth(6, 20, dy) * (1 - depthT * 0.5); // haze pooling in the valley
      const ang = dy < 6 ? Math.atan(slope) : Math.atan2(gy, gx) + Math.PI / 2;
      return { v, a: 0, ang };
    }
    const t = clamp01(Y / (H * 0.5));
    const cloud = fbm(noise, X * 0.02 + 50, Y * 0.08, 3);
    return { v: 0.55 + 0.32 * t + 0.25 * cloud, a: smooth(0.5, 1, t) * 0.6, ang: cloud * 0.4 };
  };
}

function driftScene({ noise, noise2 }: SceneCtx): Field {
  return (X, Y) => {
    const f = fbm(noise, X * 0.017, Y * 0.017, 4);
    const g = fbm(noise2, X * 0.028 + 9, Y * 0.028, 3);
    const raw = clamp01(0.5 + f * 1.1);
    const v = Math.round(raw * 5) / 5 * 0.55 + raw * 0.45;
    return { v, a: smooth(0.12, 0.32, g), ang: f * Math.PI * 2.2 + g };
  };
}

const SCENE_FNS: Record<string, (c: SceneCtx) => Field> = {
  panels: panelsScene,
  horizon: horizonScene,
  bloom: bloomScene,
  peaks: peaksScene,
  drift: driftScene,
};

/** 0 outside every zone, 1 inside, smooth over `soft` px. */
function zoneWeight(zones: Box[], x: number, y: number, soft: number): number {
  let w = 0;
  for (const z of zones) {
    const dx = Math.max(z.x - x, 0, x - (z.x + z.w));
    const dy = Math.max(z.y - y, 0, y - (z.y + z.h));
    w = Math.max(w, 1 - smooth(0, soft, Math.hypot(dx, dy)));
  }
  return w;
}

export const impasto: Generator<P> = {
  id: "impasto",
  name: "Impasto",
  description: "A palette-knife oil painting: thick, angular strokes that follow the form, with lit ridges and cast shadows.",
  params,
  presets,
  render(p, size: Size, rng) {
    const u = unit(size);
    const W = size.w / u;
    const H = size.h / u;
    const text = layoutText(p, size);
    const side = p.lightFrom === "top-left" ? -1 : p.lightFrom === "top-right" ? 1 : 0;
    const ctx: SceneCtx = { W, H, rng, noise: createNoise2D(rng), noise2: createNoise2D(rng), side };
    const field = (SCENE_FNS[p.scene] ?? panelsScene)(ctx);

    // Leave a calm, flat passage behind the words, the way a painter would.
    const calmTone = isDark(p["text.color"]) ? 0.9 : 0.12;
    const sample = (x: number, y: number): Sample & { calm: number } => {
      const s = field(x / u, y / u);
      // Light falls off toward the edges of the canvas.
      const vx = x / size.w - 0.5, vy = y / size.h - 0.45;
      s.v *= 1 - p.vignette * Math.min(1, (vx * vx + vy * vy) * 2.6);
      const calm = text.zones.length ? zoneWeight(text.zones, x, y, 5 * u) : 0;
      return { v: clamp01(s.v + (calmTone - s.v) * calm * 0.7), a: clamp01(s.a) * (1 - calm * 0.85), ang: s.ang, calm };
    };

    const ramp = (v: number): string =>
      v < 1 / 3 ? mix(p.ground, p.shadow, v * 3) : v < 2 / 3 ? mix(p.shadow, p.mid, v * 3 - 1) : mix(p.mid, p.light, v * 3 - 2);

    const k = p.knife;
    const passes: KnifePass[] = [
      { len: 11 * k * u, wid: 5.2 * k * u, step: 4.6 * k * u, jitter: 0.5, relief: 0.3 },
      { len: 5.8 * k * u, wid: 2.4 * k * u, step: 3.0 * k * u, jitter: 0.35, relief: 1 },
      { len: 3.2 * k * u, wid: 1.3 * k * u, step: 2.2 * k * u, jitter: 0.3, relief: 1 },
    ];

    let prev = p.mid;
    const strokes = paintKnife({
      size,
      rng,
      passes,
      relief: p.relief,
      side,
      hiTint: lighten(p.light, 0.45),
      loTint: darken(p.ground, 0.6),
      q: knifePrecision(size),
      spot: (x, y, _pass, i) => {
        const s = sample(x, y);
        if (i === 2) {
          // Detail strokes gather at edges of form, and never in the calm passage.
          const e = 1.2 * u;
          const gx = field((x + e) / u, y / u).v - field((x - e) / u, y / u).v;
          const gy = field(x / u, (y + e) / u).v - field(x / u, (y - e) / u).v;
          if (rng() > 0.22 + Math.hypot(gx, gy) * 3 || s.calm > 0.4) return null;
        }
        let v = s.v + (rng() - 0.5) * 0.2 * p.broken;
        if (rng() < 0.1 * p.broken) v += (rng() - 0.5) * 0.45; // a stray stroke of a neighbouring tone
        let c = ramp(clamp01(v));
        if (s.a > 0) c = mix(c, p.accent, s.a * range(rng, 0.55, 1));
        c = mix(c, prev, rng() * 0.18 * p.broken); // the knife carries some of the last colour
        prev = c;
        return { color: c, ang: s.ang, relief: 1 - s.calm * 0.6 };
      },
    });

    const defs = p.grain > 0 ? grainFilter("im-grain", p.grain, 0.9) : "";
    const body =
      rect(0, 0, size.w, size.h, `fill="${esc(p.ground)}"`) +
      strokes +
      (p.grain > 0 ? grainRect(size, "im-grain") : "") +
      text.svg;
    return svgDoc(size, defs, body);
  },
};
