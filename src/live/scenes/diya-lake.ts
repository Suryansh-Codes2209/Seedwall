import type { ParamSchema, Params, Preset } from "@/generators/types";
import type { LiveScene } from "../types";

type P = Params & {
  bg: string;
  lantern: string;
  water: string;
  count: number;
  ripple: number;
  speed: number;
  seed: number;
};

const params: ParamSchema<P> = {
  bg: { kind: "color", label: "Night sky", default: "#170b2e", group: "Colours", role: "bg" },
  lantern: { kind: "color", label: "Lanterns", default: "#ff9a36", group: "Colours", role: "accent" },
  water: { kind: "color", label: "Water", default: "#080a18", group: "Colours", role: "fg" },
  count: { kind: "range", label: "Lanterns", min: 0.3, max: 1, step: 0.05, default: 0.7, group: "Lake" },
  ripple: { kind: "range", label: "Ripple", min: 0, max: 1, step: 0.05, default: 0.4, group: "Lake" },
  speed: { kind: "range", label: "Speed", min: 0.5, max: 2, step: 0.25, default: 1, group: "Motion" },
  seed: { kind: "seed", label: "Seed", default: 6 },
};

const presets: Preset<P>[] = [
  { id: "diwali", title: "Diwali", params: {} },
  { id: "dusk-blue", title: "Dusk blue", params: { bg: "#1b2f63", lantern: "#ffbe6b", water: "#0a1430", count: 0.6, ripple: 0.5, seed: 14 } },
  { id: "lotus", title: "Lotus", params: { bg: "#2e0d2c", lantern: "#ff7a9c", water: "#12061a", count: 0.75, ripple: 0.35, seed: 22 } },
  { id: "gold", title: "Gold", params: { bg: "#0e0805", lantern: "#ffbb45", water: "#0a0705", count: 0.85, ripple: 0.25, seed: 31 } },
];

/*
 * Paper sky lanterns rising over a still lake at night, in 2.5D. Three depth layers, each with its
 * own waterline below the horizon (nearer layers lower, larger, brighter and faster, as they have
 * further to climb in the same time), floating diyas spread in front of that line, and lanterns
 * rising from it. Every lantern sits in a column of its layer; its height is fract(base + phase), so
 * it climbs out of the water, fades in, leaves past the top edge and comes back from the water
 * exactly once per loop. Sway and flicker
 * are whole numbers of turns per loop too (wrapped with fract), so phase 0 and 1 are the same frame.
 * The water is a mirror: below a layer's waterline the same lanterns are drawn mirrored about it,
 * dimmed and broken up a little by a periodic ripple, with a glitter streak under each light. Each
 * layer is one evaluation per pixel (either the sky side or the mirror side), so the cost is
 * 3 layers x 3 columns x 2 lanterns, all analytic. The mouse shifts the layers for parallax.
 */
const fragment = /* glsl */ `
const float HORIZON = -0.1;
const float TOPY = 0.62; // lanterns leave above this (past the top edge)

vec3 skyCol(float y) {
  vec3 bg = toLinear(u_bg), warm = toLinear(u_lantern);
  vec3 col = bg * mix(1.15, 0.35, smoothstep(HORIZON, 0.55, y));
  // A warm haze low over the lake, lit by the lanterns and the far shore.
  col += warm * 0.05 * exp(-max(y - HORIZON, 0.0) * 6.0);
  return col;
}

// One paper lantern: a box tapering towards the bottom, lit from a flame in its open base.
// q is the position from its centre, s the half-width of its top, aa its edge softness.
vec3 lantern(vec2 q, float s, float aa, float flick, vec3 warm) {
  float hh = 0.68 * s;                       // half height
  float t = clamp(q.y / (2.0 * hh) + 0.5, 0.0, 1.0); // 0 at the base, 1 at the top
  float hw = s * mix(0.74, 1.0, t);
  float d = max(abs(q.x) - hw, abs(q.y) - hh);
  float body = smoothstep(-aa, aa, -d);
  // Brightest low down by the flame, a little shading round the sides and a darker top rim.
  float side = 1.0 - 0.45 * pow(clamp(abs(q.x) / hw, 0.0, 1.0), 2.0);
  float inten = mix(2.6, 1.0, t) * side * (1.0 - 0.35 * smoothstep(0.82, 0.95, t));
  vec2 fq = (q - vec2(0.0, -0.62 * hh)) / s;
  vec3 hot = mix(warm, vec3(1.0, 0.95, 0.8), 0.6);
  vec3 col = (warm * inten + hot * 2.5 * exp(-dot(fq, fq) * 30.0)) * body;
  // Halo round the lantern.
  float r = length(q * vec2(1.0, 0.85)) / s;
  col += warm * (0.32 * exp(-r * r * 0.9) + 0.05 * exp(-r * 1.1));
  return col * flick;
}

// The flame of a clay diya floating on the water (its glow is added apart, see layer()).
vec3 diyaFlame(vec2 q, float s, float flick, vec3 warm) {
  vec2 fq = q - vec2(0.0, 0.55 * s);
  fq.y /= fq.y > 0.0 ? 2.0 : 1.0;          // a teardrop: taller above its middle
  float f = exp(-dot(fq, fq) / (0.12 * s * s));
  vec3 hot = mix(warm, vec3(1.0, 0.93, 0.75), 0.5);
  return hot * 2.2 * f * flick;
}

// Everything in one depth layer: lanterns above the waterline yw, or their mirror image below it.
// cw is the column width, s the lantern size, band how far in front of yw its diyas spread, dim the
// haze of distance. Every lantern climbs once per loop.
vec3 layer(vec2 p, float li, float yw, float cw, float s, float band, float dim) {
  vec3 warm = toLinear(u_lantern);
  bool mirror = p.y < yw;
  vec2 lp = p;
  float below = max(yw - p.y, 0.0);
  if (mirror) {
    // Still water with a faint periodic ripple, stronger nearer the viewer.
    float rip = u_ripple * (0.0015 + 0.03 * below) * sin(p.y * 260.0 / (0.3 + below * 4.0) + turns(3.0) + li * 2.0);
    lp = vec2(p.x + rip, 2.0 * yw - p.y);
  }
  vec3 acc = vec3(0.0);
  vec3 lit = vec3(0.0);
  float c0 = floor(lp.x / cw);
  for (int i = -1; i <= 1; i++) {
    float c = c0 + float(i);
    for (int j = 0; j < 2; j++) {
      vec2 key = vec2(c * 2.0 + float(j), li * 37.0 + uSeed * 59.0);
      float h0 = hash21(key);
      // Denser in a broad stream across the middle of the lake.
      float stream = 0.55 + 0.45 * noise(vec2(c * cw * 1.8 + li * 3.1, uSeed * 7.0));
      if (h0 > u_count * stream) continue;
      float h1 = hash21(key + 1.7), h2 = hash21(key + 4.3), h3 = hash21(key + 8.9);
      float ss = s * mix(0.7, 1.25, h1);
      float u = fract(h2 + float(j) * 0.5 + uPhase);
      float y = mix(yw + 0.02 * s, TOPY + 2.0 * ss, u);
      float sway = 0.18 * cw * sin(turns(1.0 + floor(h3 * 2.0)) + h1 * TAU) * smoothstep(0.0, 0.3, u);
      float x = (c + 0.25 + 0.5 * h3) * cw + sway;
      // Fade in as it lifts off the water.
      float fade = smoothstep(0.0, 0.12, u);
      float flick = 0.85 + 0.1 * sin(turns(7.0 + floor(h0 * 5.0)) + h2 * TAU) + 0.05 * sin(turns(17.0) + h1 * TAU);
      // A little hue spread: some lanterns burn redder, some yellower.
      vec3 tint = warm * mix(vec3(1.08, 0.86, 0.75), vec3(0.95, 1.08, 1.12), h3);
      // Reflections are softer the nearer the water is to the viewer.
      float aa = 1.2 / uRes.y + (mirror ? below * 0.06 * ss / s : 0.0);
      lit += lantern(lp - vec2(x, y), ss, aa, flick, tint) * fade;
    }
  }
  // Diyas floating on the water in a band in front of this layer's waterline (nearer ones lower on
  // screen and larger), each with a glitter streak below it. Each floats on its own line, so it is
  // mirrored about that line.
  float dc = floor(p.x / (cw * 0.7));
  for (int i = -1; i <= 1; i++) {
    float c = dc + float(i);
    vec2 key = vec2(c, li * 71.0 + uSeed * 13.0);
    float h0 = hash21(key);
    if (h0 > 0.25 + 0.45 * u_count) continue;
    float h1 = hash21(key + 2.9), h2 = hash21(key + 6.1), h3 = hash21(key + 9.4);
    float near = h3 * h3;
    float ds = s * mix(0.3, 0.45, h1) * (1.0 + 0.8 * near);
    float dw = yw - near * band - 0.004;
    float x = (c + 0.15 + 0.7 * h2) * cw * 0.7;
    float y = dw + ds * 0.3 + 0.08 * ds * sin(turns(1.0) + h1 * TAU);
    float flick = 0.8 + 0.15 * sin(turns(9.0 + floor(h2 * 4.0)) + h0 * TAU) + 0.05 * sin(turns(23.0) + h2 * TAU);
    bool dm = p.y < dw;
    vec2 q = p - vec2(x, y);
    if (dm) q.y = 2.0 * dw - p.y - y;
    acc += diyaFlame(q, ds, flick, warm) * (dm ? 0.45 : 1.0);
    // Its glow spreads wide over the water, the same on both sides of the line (no seam there).
    vec2 g = (p - vec2(x, dw + ds * 0.4)) * vec2(1.0, 2.2);
    acc += warm * 0.2 * flick * exp(-dot(g, g) / (3.0 * ds * ds));
    if (dm) {
      float dx = p.x - x, db = dw - p.y;
      acc += warm * 0.3 * flick * exp(-dx * dx / (0.15 * ds * ds)) * exp(-db / (2.5 * ds))
           * (0.6 + 0.4 * sin(db * 600.0 / (1.0 + db * 6.0) + turns(5.0) + h1 * TAU));
    }
  }
  if (mirror) lit *= 0.5 * exp(-below * 1.5);
  return (acc + lit) * dim;
}

vec3 scene(vec2 uv) {
  vec3 col;
  if (uv.y >= HORIZON) col = skyCol(uv.y);
  else {
    // The lake: dark water reflecting the sky's low haze, darker towards the viewer.
    vec3 water = toLinear(u_water);
    float below = HORIZON - uv.y;
    col = mix(skyCol(HORIZON + below * 2.0) * 0.55, water, smoothstep(0.0, 0.12, below));
    col += toLinear(u_lantern) * 0.012 * exp(-below * 10.0);
  }
  // A soft line where the far shore meets the water.
  col = mix(col, toLinear(u_water) * 0.8, 0.6 * exp(-abs(uv.y - HORIZON) * 240.0));

  vec2 m = uMouse * vec2(0.03, 0.01);
  col += layer(uv + m * 0.3, 0.0, HORIZON - 0.012, 0.055, 0.009, 0.04, 0.55);
  col += layer(uv + m * 0.6, 1.0, HORIZON - 0.06, 0.1, 0.018, 0.12, 0.8);
  col += layer(uv + m * 1.0, 2.0, HORIZON - 0.2, 0.15, 0.036, 0.15, 1.0);

  col *= mix(1.0, 0.75, smoothstep(0.5, 1.2, length(uv * vec2(0.75, 1.0))));
  return finishDither(rolloff(max(col, 0.0)));
}
`;

export const diyaLake: LiveScene<P> = {
  id: "diya-lake",
  name: "Diya Lake",
  description: "Warm paper lanterns rising from a still lake at night, with floating diyas and their reflections on the water.",
  params,
  presets,
  loopSeconds: 30,
  mouse: true,
  fragment,
};
