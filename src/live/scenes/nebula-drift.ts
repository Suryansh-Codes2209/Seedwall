import type { ParamSchema, Params, Preset } from "@/generators/types";
import type { LiveScene } from "../types";

type P = Params & {
  bg: string;
  c1: string;
  c2: string;
  c3: string;
  star: string;
  shape: string;
  clouds: number;
  scale: number;
  dust: boolean;
  core: boolean;
  stars: number;
  speed: number;
  seed: number;
};

// Colours, shapes and the four presets follow the Nebula still (src/generators/nebula.ts).
const params: ParamSchema<P> = {
  bg: { kind: "color", label: "Space", default: "#06040f", group: "Colours", role: "bg" },
  c1: { kind: "color", label: "Gas 1", default: "#6a2bd9", group: "Colours", role: "accent" },
  c2: { kind: "color", label: "Gas 2", default: "#e0459b", group: "Colours", role: "accent" },
  c3: { kind: "color", label: "Gas 3", default: "#3f8cff", group: "Colours", role: "accent" },
  star: { kind: "color", label: "Stars", default: "#fff4e8", group: "Colours", role: "fg" },
  shape: {
    kind: "select",
    label: "Shape",
    options: [
      { value: "cloud", label: "Cloud" },
      { value: "band", label: "Band across the sky" },
      { value: "drift", label: "Drifting off the edge" },
    ],
    default: "cloud",
    group: "Nebula",
  },
  clouds: { kind: "range", label: "Gas", min: 0, max: 1, step: 0.05, default: 0.7, group: "Nebula", help: "How much glowing gas there is." },
  scale: { kind: "range", label: "Cloud size", min: 0.5, max: 2.5, step: 0.05, default: 1, group: "Nebula" },
  dust: { kind: "toggle", label: "Dark dust lanes", default: true, group: "Nebula" },
  core: { kind: "toggle", label: "Bright core", default: true, group: "Nebula" },
  stars: { kind: "range", label: "Stars", min: 0, max: 3, step: 0.1, default: 1, group: "Stars" },
  speed: { kind: "range", label: "Speed", min: 0.5, max: 2, step: 0.25, default: 1, group: "Motion" },
  seed: { kind: "seed", label: "Seed", default: 7 },
};

const presets: Preset<P>[] = [
  { id: "violet", title: "Violet", params: {} },
  { id: "veil", title: "Teal veil", params: { bg: "#020a0f", c1: "#0f8f9c", c2: "#5fe0c8", c3: "#2a5bd7", star: "#e8f6ff", shape: "drift", clouds: 0.75, scale: 1.3, core: false, seed: 19 } },
  { id: "ember", title: "Ember", params: { bg: "#0a0503", c1: "#c2401c", c2: "#f29a3a", c3: "#7a1f3d", star: "#fff1dc", clouds: 0.8, scale: 0.9, seed: 4 } },
  { id: "milky-way", title: "Milky Way", params: { bg: "#04050b", c1: "#6d5a7e", c2: "#d9b48c", c3: "#3e5c8f", star: "#ffffff", shape: "band", clouds: 0.55, scale: 1.1, stars: 2.2, core: false, seed: 12 } },
];

/*
 * The Nebula still, set drifting. The gas follows the still's recipe: a body strung along a path
 * (a cloud along the long side, a band from edge to edge, or a plume drifting in from a corner),
 * filled with noise in each colour (soft patches of gas 1 and gas 3, thin creases of gas 2 with
 * white-hot cores), dark dust lanes and an optional bright core, composited "over" in sRGB like the
 * SVG filters. Stars sit in three depth layers: fine dust far away, then small stars, then a few
 * bright ones with a glow and, the brightest, four-point spikes.
 * Motion: the camera drifts round a small circle once per loop, so each layer shifts by its depth
 * (near stars most, the gas least), and each gas layer's noise slides round its own circle, so the
 * gas churns as the layers pass over one another. Twinkles are whole numbers of turns per loop and
 * every angle is wrapped with fract, so phase 0 and 1 are the same frame. All analytic: about twenty
 * noise lookups for the gas (skipped outside the body) plus 3x3 cells for two star layers.
 */
const fragment = /* glsl */ `
// Angle of k whole turns per loop, wrapped first so phase 1 lands on exactly the angles of phase 0.
float turns(float k) { return TAU * fract(uPhase * k); }
vec2 circ(float a) { return vec2(cos(a), sin(a)); }

float rnd(float k) { return hash21(vec2(uSeed * 61.7 + k, k * 3.3 + 1.0)); }

// Creases of noise: low along the folds, like SVG "turbulence", roughly 0-0.5.
float ridged(vec2 p, int octaves) {
  float sum = 0.0, amp = 0.5;
  for (int i = 0; i < 4; i++) {
    if (i >= octaves) break;
    sum += amp * abs(2.0 * noise(p) - 1.0);
    p = mat2(1.6, 1.2, -1.2, 1.6) * p + 7.3;
    amp *= 0.5;
  }
  return sum * 0.6;
}

// The nebula's path from a to b, in uv. Set by setupPath().
vec2 gA, gB;
float gBend;

void setupPath(float aspect) {
  float longSide = max(aspect, 1.0);      // the long side in uv
  bool landscape = aspect >= 1.0;
  gBend = 0.0;
  if (u_shape == 1) {
    // A band from one edge to the other, tilted a little.
    float tilt = (rnd(1.0) - 0.5) * 0.5;
    gA = landscape ? vec2(-0.6 * aspect, tilt) : vec2(tilt * aspect, 0.6);
    gB = -gA;
  } else if (u_shape == 2) {
    // Enters from a top corner and fades out towards the middle.
    float flip = rnd(2.0) < 0.5 ? 1.0 : -1.0;
    gA = vec2(flip * 0.55 * aspect, 0.5 - mix(-0.05, 0.25, rnd(3.0)));
    gB = vec2((mix(0.4, 0.6, rnd(4.0)) - 0.5) * aspect, 0.5 - mix(0.55, 0.75, rnd(5.0)));
    gBend = (rnd(6.0) - 0.5) * 0.24;
  } else {
    vec2 c = (vec2(mix(0.38, 0.62, rnd(7.0)), mix(0.4, 0.62, rnd(8.0))) - 0.5) * vec2(aspect, 1.0);
    float ang = (landscape ? 0.0 : 1.5708) + (rnd(9.0) - 0.5) * 1.2;
    vec2 d = vec2(cos(ang), sin(ang)) * 0.28 * longSide;
    gA = c - d;
    gB = c + d;
    gBend = (rnd(6.0) - 0.5) * 0.24;
  }
  gBend *= length(gB - gA);
}

// How deep inside the body p is (0-1), and t, where along the path it lies.
float body(vec2 p, float size, out float t) {
  vec2 ab = gB - gA;
  float len = length(ab);
  vec2 dir = ab / len, nrm = vec2(-dir.y, dir.x);
  float s = dot(p - gA, dir);
  t = clamp(s / len, 0.0, 1.0);
  float off = dot(p - gA, nrm) - sin(t * 3.14159) * gBend;
  float over = s - t * len;               // past either end
  float full = u_shape == 1 ? 1.0 : 0.55 + 0.45 * sin(t * 3.14159);
  float w = size * (u_shape == 1 ? 0.8 : 1.1) * full;
  // A firm but soft edge, like the still's blurred blobs.
  return smoothstep(0.06, 0.6, exp(-(off * off + over * over) / (w * w)));
}

// One star layer in cells of size cs. lum shapes how many are bright; spikes on the brightest.
vec3 starLayer(vec2 p, float cs, float li, float dens, float lum, float bandBoost) {
  vec3 acc = vec3(0.0);
  vec2 c0 = floor(p / cs);
  float px = 1.0 / uRes.y;
  vec3 tints[5] = vec3[5](toLinear(u_star), vec3(1.0), toLinear(vec3(0.81, 0.88, 1.0)), toLinear(vec3(1.0, 0.89, 0.75)), toLinear(mix(u_star, u_c3, 0.4)));
  for (int j = -1; j <= 1; j++)
    for (int i = -1; i <= 1; i++) {
      vec2 c = c0 + vec2(float(i), float(j));
      vec2 key = c + vec2(li * 113.0, uSeed * 89.0);
      float h0 = hash21(key);
      if (h0 > dens * bandBoost) continue;
      float h1 = hash21(key + 1.9), h2 = hash21(key + 3.7), h3 = hash21(key + 5.3);
      vec2 pos = (c + 0.15 + 0.7 * vec2(h1, h2)) * cs;
      vec2 d = p - pos;
      float m = pow(h3, lum);             // most are faint, a few are bright
      float r = max(px * (0.5 + 2.6 * m), 0.6 * px);
      float tw = 1.0 + 0.3 * step(0.6, h2) * sin(turns(2.0 + floor(h1 * 4.0)) + h0 * TAU);
      vec3 tint = tints[int(h1 * 4.99)];
      float dd = dot(d, d);
      float v = mix(0.35, 1.0, m) * exp(-dd / (r * r)) * 1.6;
      // Glow round the bright ones, and spikes on the brightest, both kept inside the 3x3 cells
      // around the pixel (a star is never more than 1.15 cells from the edge of that block).
      float box = 1.0 - smoothstep(0.45 * cs, 1.1 * cs, max(abs(d.x), abs(d.y)));
      v += box * step(0.45, m) * (0.25 + 0.5 * m) * 0.45 * exp(-sqrt(dd) / (r * 2.2));
      if (m > 0.85) {
        float sl = min(r * 10.0, 0.3 * cs), th = r * 0.35;
        v += box * 0.45 * (exp(-abs(d.x) / sl) * exp(-d.y * d.y / (th * th)) + exp(-abs(d.y) / sl) * exp(-d.x * d.x / (th * th)));
      }
      acc += tint * v * tw;
    }
  return acc;
}

vec3 scene(vec2 uv) {
  float aspect = uRes.x / uRes.y;
  float S = min(aspect, 1.0);             // the short side in uv (the still's 100 units)
  float size = 0.3 * u_scale * S;         // the still's blob size (30 units * scale)
  setupPath(aspect);

  // The camera drifts round a small circle once per loop; nearer layers shift more.
  vec2 cam = circ(turns(1.0)) * 0.035 * S + uMouse * 0.02;
  vec2 pg = uv + cam * 0.4;               // the gas is far behind the near stars

  float t;
  // Cloudy edges: the body is read through a gently warped position.
  vec2 warp = vec2(fbm(pg / size * 0.9 + 3.1, 3), fbm(pg / size * 0.9 + 8.7, 3)) - 0.5;
  float mask = body(pg + warp * size * 1.1, size, t);

  // Space, with a faint haze of gas 1 round the nebula.
  vec3 col = u_bg;
  vec2 mid = 0.5 * (gA + gB);
  col = mix(col, mix(u_bg, u_c1, 0.12), (1.0 - smoothstep(0.0, 0.8 * max(aspect, 1.0), length(uv - mid))) * (u_shape == 1 ? 0.6 : 1.0));

  float amount = u_clouds;
  if (amount > 0.0 && mask > 0.002) {
    vec2 q = pg / (size * 0.55);          // the still's noise frequency
    float more = 0.25 * amount;
    float opSoft = min(1.0, 0.55 + 0.45 * amount), opFil = min(1.0, 0.4 + 0.45 * amount);
    // Each layer's noise slides round its own circle, so the layers churn past one another.
    float n1 = fbm(q * 0.6 + circ(turns(1.0) + 0.5) * 0.35 + uSeed * 31.0, 3);
    float n3 = fbm(q * 0.6 + circ(-turns(1.0) + 2.0) * 0.3 + uSeed * 47.0 + 11.0, 3);
    float f1 = ridged(q * 1.1 + circ(turns(1.0) + 4.0) * 0.25 + uSeed * 13.0, 4);
    float f2 = ridged(q * 1.1 + circ(-turns(1.0) + 1.0) * 0.22 + uSeed * 19.0 + 5.0, 4);

    // A soft wash of gas 1 over the whole body.
    col = mix(col, u_c1, 0.35 * amount * 0.5 * mask);
    col = mix(col, u_c1, clamp(2.4 * (n1 * 1.25 - 0.12) - (0.95 - more), 0.0, 1.0) * opSoft * mask);
    col = mix(col, u_c3, clamp(3.0 * (n3 * 1.25 - 0.12) - (1.35 - more), 0.0, 1.0) * opSoft * mask);
    col = mix(col, u_c2, clamp(-4.2 * f1 + 0.95 + more, 0.0, 1.0) * opFil * mask);
    col = mix(col, mix(u_c2, vec3(1.0), 0.45), clamp(-5.0 * f2 + 0.7 + more, 0.0, 1.0) * opFil * mask);
    if (u_dust > 0.5) {
      float nd = fbm(q * 0.6 + circ(turns(1.0) + 3.0) * 0.3 + uSeed * 23.0 + 29.0, 3);
      col = mix(col, u_bg * 0.6, clamp(4.0 * (nd * 1.25 - 0.12) - 2.1, 0.0, 1.0) * 0.75 * mask);
    }
  }
  vec3 lin = toLinear(col);

  // A bright core where the gas is thickest.
  if (u_core > 0.5 && amount > 0.0) {
    float tc = u_shape == 2 ? 0.75 : mix(0.4, 0.6, rnd(10.0));
    vec2 ab = gB - gA, nrm = normalize(vec2(-ab.y, ab.x));
    vec2 cp = gA + ab * tc + nrm * sin(tc * 3.14159) * gBend;
    float r = length(pg - cp) / (size * 0.75);
    vec3 cc = mix(toLinear(u_c2), vec3(1.0), 0.75);
    lin += vec3(1.0) * exp(-r * r * 500.0) * 1.2;
    lin += cc * 0.9 * exp(-r * r * 60.0);
    lin += toLinear(u_c2) * 0.35 * exp(-r * r * 9.0) + toLinear(u_c1) * 0.12 * exp(-r * r * 2.5);
  }

  // Stars in three depths, the band shape gathering fine dust along the gas.
  float sd = u_stars;
  float band = u_shape == 1 ? 1.0 + 1.5 * mask : 1.0;
  lin += starLayer(uv + cam * 0.6, 0.012 * S, 0.0, 0.18 * sd, 30.0, band) * 0.35;
  lin += starLayer(uv + cam * 1.0, 0.04 * S, 1.0, 0.22 * sd, 14.0, 1.0) * 0.7;
  lin += starLayer(uv + cam * 1.7, 0.1 * S, 2.0, 0.2 * sd, 6.0, 1.0);

  return finishDither(rolloff(max(lin, 0.0)));
}
`;

export const nebulaDrift: LiveScene<P> = {
  id: "nebula-drift",
  name: "Nebula Drift",
  description: "Glowing clouds of gas churning slowly in deep space, with stars at three depths drifting past.",
  params,
  presets,
  loopSeconds: 40,
  mouse: true,
  fragment,
};
