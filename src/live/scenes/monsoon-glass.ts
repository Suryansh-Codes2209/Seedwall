import type { ParamSchema, Params, Preset } from "@/generators/types";
import type { LiveScene } from "../types";

type P = Params & {
  bg: string;
  light: string;
  neon: string;
  rain: number;
  blur: number;
  speed: number;
  seed: number;
};

const params: ParamSchema<P> = {
  bg: { kind: "color", label: "Night", default: "#0a1028", group: "Colours", role: "bg" },
  light: { kind: "color", label: "Street lights", default: "#ffa940", group: "Colours", role: "accent" },
  neon: { kind: "color", label: "Neon", default: "#ff4f9a", group: "Colours", role: "fg" },
  rain: { kind: "range", label: "Rain", min: 0.2, max: 1, step: 0.05, default: 0.65, group: "Glass" },
  blur: { kind: "range", label: "Blur", min: 0.5, max: 1.8, step: 0.05, default: 1, group: "Glass" },
  speed: { kind: "range", label: "Speed", min: 0.5, max: 2, step: 0.25, default: 1, group: "Motion" },
  seed: { kind: "seed", label: "Seed", default: 4 },
};

const presets: Preset<P>[] = [
  { id: "mumbai-night", title: "Mumbai night", params: {} },
  { id: "amber", title: "Amber", params: { bg: "#170a04", light: "#ffb347", neon: "#ffe08a", rain: 0.55, blur: 1.15, seed: 12 } },
  { id: "teal", title: "Teal", params: { bg: "#03141a", light: "#3fe0cf", neon: "#7d9dff", rain: 0.75, blur: 0.9, seed: 21 } },
  { id: "grey-day", title: "Grey day", params: { bg: "#7f878f", light: "#fff3dc", neon: "#cfe2ee", rain: 0.85, blur: 1.3, seed: 33 } },
];

/*
 * Rain on a window at night, in 2.5D. Behind the glass is a city of defocused lights: bokeh discs
 * drawn analytically at any blur (no blur taps), with a band of traffic. On the glass are fixed
 * beads, and drops that slide down in columns with stick-slip pauses, leaving clear trails dotted
 * with droplets that dry as the trail fades. Each sliding drop runs a whole number of cycles of a
 * 1.5-high path per loop, so it leaves the bottom and comes back from above the top, and the whole
 * field repeats once per loop. Drops refract the city (the lookup is offset by the drop's dome
 * normal, which shows it flipped and sharper); the misted glass between them veils it. The
 * traffic scrolls one full period of its lights per loop, and the mouse shifts the city behind the
 * glass for parallax.
 */
const fragment = /* glsl */ `
const float H = 1.5;     // height of one sliding-drop cycle (taller than the screen)
const float TOP = 0.75;  // drops start above the top edge (y = 0.5)

// Angle of k whole turns per loop, wrapped first so phase 1 lands on exactly the angles of phase 0.
float turns(float k) { return TAU * fract(uPhase * k); }

vec3 lightColour(float h) {
  vec3 warm = toLinear(u_light), neon = toLinear(u_neon);
  if (h < 0.55) return warm;
  if (h < 0.85) return neon;
  return mix(warm, vec3(1.0), 0.6);
}

// One layer of bokeh lights in cells of size s, more of them low down where the buildings are.
vec3 bokehLayer(vec2 p, float s, float blur, float layer) {
  vec3 acc = vec3(0.0);
  vec2 cell = floor(p / s);
  for (int j = -1; j <= 1; j++)
    for (int i = -1; i <= 1; i++) {
      vec2 c = cell + vec2(float(i), float(j));
      vec2 key = c + vec2(layer * 91.7, uSeed * 137.0);
      float h0 = hash21(key);
      float dens = mix(0.06, 0.5, smoothstep(0.3, -0.25, (c.y + 0.5) * s));
      if (h0 > dens) continue;
      float h1 = hash21(key + 3.1), h2 = hash21(key + 7.7), h3 = hash21(key + 11.3);
      vec2 pos = (c + 0.3 + 0.4 * vec2(h1, h2)) * s;
      // Never wider than about a cell, so the 3x3 neighbourhood holds every disc that reaches p.
      float r = min(s * mix(0.14, 0.45, h3 * h3) * blur, 0.8 * s);
      float d = length(p - pos);
      float soft = r * mix(0.12, 0.4, h1) + 0.0015;
      float disc = smoothstep(r, r - soft, d);
      float ring = 0.7 + 0.4 * smoothstep(0.4 * r, r - soft * 0.5, d);
      float flick = 1.0 + 0.25 * step(0.65, h3) * sin(turns(1.0 + floor(3.0 * h1)) + h2 * TAU);
      acc += lightColour(h2) * disc * ring * flick * mix(0.12, 0.7, pow(h0 / dens, 2.0)) / (0.55 + blur);
    }
  return acc;
}

// Two lanes of traffic low in the view, scrolling one full period of their lights per loop.
vec3 traffic(vec2 p, float blur) {
  const float CW = 0.16, NC = 16.0; // light spacing and lights per period
  vec3 acc = vec3(0.0);
  for (int lane = 0; lane < 2; lane++) {
    float fl = float(lane);
    float dir = lane == 0 ? 1.0 : -1.0;
    float y0 = -0.27 - 0.045 * fl;
    float x = p.x - dir * NC * CW * fract(uPhase);
    float c0 = floor(x / CW);
    for (int i = -1; i <= 1; i++) {
      float c = c0 + float(i);
      vec2 key = vec2(mod(c, NC), fl * 13.0 + uSeed * 71.0);
      float h0 = hash21(key);
      if (h0 > 0.6) continue;
      float h1 = hash21(key + 5.3), h2 = hash21(key + 9.1);
      vec2 pos = vec2((c + 0.25 + 0.5 * h1) * CW, y0 + 0.035 * (h2 - 0.5));
      float r = min(CW * mix(0.1, 0.24, h1 * h2) * blur, 0.7 * CW);
      float d = length(vec2(x, p.y) - pos);
      float disc = smoothstep(r, r * 0.75 - 0.0015, d);
      vec3 col = lane == 0 ? toLinear(u_neon) : mix(toLinear(u_light), vec3(1.0), 0.5);
      acc += col * disc * (0.8 + 0.35 * smoothstep(0.45 * r, r, d)) * mix(0.25, 0.75, h2) / (0.55 + blur);
    }
  }
  return acc;
}

// The city behind the glass at a given blur (1 = as seen past the drops).
vec3 city(vec2 p, float blur) {
  vec3 bg = toLinear(u_bg);
  vec3 col = bg * mix(1.35, 0.7, smoothstep(-0.5, 0.5, p.y));
  col += toLinear(u_light) * 0.025 * smoothstep(0.15, -0.45, p.y);
  col += bokehLayer(p, 0.085, blur, 0.0) * 0.55;
  col += bokehLayer(p + 0.37, 0.13, blur, 1.0) * 0.8;
  col += bokehLayer(p + 0.71, 0.21, blur, 2.0);
  col += bokehLayer(p * 0.5 + 0.23, 0.17, blur * 1.2, 3.0) * 0.35; // a few huge, faint near lights
  col += traffic(p, blur);
  return col;
}

// Drops are vec4(mask, q.xy, r): q is the position inside the drop in radii (also its dome normal's
// xy), r its radius.
vec4 pickDrop(vec4 a, vec4 b) { return b.x > a.x ? b : a; }

float pathX(float y, float ci, float cw, float h1, float h2) {
  // Wanders at most 0.17 of the column, so a drop (radius up to 0.3) stays inside its column.
  return (ci + 0.5 + 0.13 * sin(y * 9.0 + h1 * TAU) + 0.04 * sin(y * 23.0 + h2 * TAU)) * cw;
}

// One layer of sliding drops in columns cw wide. Adds its clear trail to clear.
vec4 slideLayer(vec2 p, float cw, float layer, inout float clear) {
  float ci = floor(p.x / cw);
  vec2 key = vec2(ci, layer * 17.0 + uSeed * 53.0);
  float h0 = hash21(key);
  if (h0 > u_rain * 0.85) return vec4(0.0);
  float h1 = hash21(key + 2.3), h2 = hash21(key + 4.9), h3 = hash21(key + 8.2);
  // k whole cycles per loop, with m stick-slip surges: k*(phase + A/(TAU*m)*sin(TAU*m*phase + c)),
  // monotonic for A < 1, and k cycles further on at phase 1.
  float k = 1.0 + floor(h1 * 3.0);
  float m = 2.0 + floor(h2 * 3.0);
  float u = fract(k * uPhase) + k * 0.8 / (TAU * m) * sin(turns(m) + h3 * TAU);
  float yd = TOP - fract(u + h0 * 7.13) * H;
  float r = cw * mix(0.22, 0.3, h3);
  float aa = 1.5 / uRes.y;

  vec2 q = (p - vec2(pathX(yd, ci, cw, h1, h2), yd)) / r;
  q.y /= q.y > 0.0 ? 1.45 : 1.0; // a short tail above the drop
  float d = length(q);
  vec4 drop = vec4(smoothstep(1.0, 1.0 - aa / r, d), q, r);

  // The trail above the drop: how long ago the drop passed this height, as a distance along its path.
  float dy = mod(p.y - yd, H);
  float px = p.x - pathX(p.y, ci, cw, h1, h2);
  float str = exp(-dy / 0.32);
  clear = max(clear, str * smoothstep(r * 0.85, r * 0.4, abs(px)));

  // Droplets left in the trail: fixed on the glass, shrinking as the trail dries.
  float ts = cw * 0.3;
  float tj = floor(p.y / ts);
  vec2 tk = vec2(tj, ci * 7.0 + layer * 31.0 + uSeed * 19.0);
  float t0 = hash21(tk), t1 = hash21(tk + 1.7), t2 = hash21(tk + 3.9);
  if (t0 < 0.65) {
    float ty = (tj + 0.3 + 0.4 * t1) * ts;
    float ts2 = exp(-mod(ty - yd, H) / 0.32);
    float tr = r * mix(0.16, 0.32, t2) * sqrt(ts2);
    if (tr > 0.0008) {
      vec2 tq = (p - vec2(pathX(ty, ci, cw, h1, h2) + (t2 - 0.5) * r * 0.5, ty)) / tr;
      drop = pickDrop(drop, vec4(smoothstep(1.0, 1.0 - aa / tr, length(tq)), tq, tr));
    }
  }
  return drop;
}

// Fixed beads in cells of size s, wiped away where a trail is clear.
vec4 beadLayer(vec2 p, float s, float layer, float clear) {
  vec2 c = floor(p / s);
  vec2 key = c + vec2(layer * 47.0, uSeed * 97.0);
  float h0 = hash21(key);
  if (h0 > mix(0.08, 0.42, u_rain)) return vec4(0.0);
  float h1 = hash21(key + 1.3), h2 = hash21(key + 5.1), h3 = hash21(key + 6.7);
  vec2 pos = (c + 0.3 + 0.4 * vec2(h1, h2)) * s;
  float r = s * mix(0.1, 0.27, h3 * h3);
  vec2 q = (p - pos) / r;
  q.y *= 1.1;
  float aa = 1.5 / uRes.y;
  return vec4(smoothstep(1.0, 1.0 - aa / r, length(q)) * (1.0 - clear), q, r);
}

vec3 scene(vec2 uv) {
  float clear = 0.0;
  vec4 drop = slideLayer(uv, 0.11, 0.0, clear);
  drop = pickDrop(drop, slideLayer(uv + vec2(0.043, 0.0), 0.075, 1.0, clear));
  drop = pickDrop(drop, beadLayer(uv, 0.03, 0.0, clear));
  drop = pickDrop(drop, beadLayer(uv + 0.019, 0.055, 1.0, clear));
  float m = drop.x;
  vec2 q = drop.yz;
  float d = length(q);

  // Inside a drop the city is seen flipped and smaller (the drop is a small lens), and sharper.
  vec2 parallax = uMouse * vec2(0.035, 0.025);
  // The view is pulled down a little, towards the street, where most of the light is.
  // The whole offset applies even on a drop's anti-aliased edge (a part offset would land on unrelated
  // lights and speckle the outline); the edge's blur is high, so the outer share stays soft.
  float inside = step(0.002, m);
  vec2 lookup = uv + parallax - (q * (drop.w + 0.16) + vec2(0.0, 0.1)) * inside;
  float mist = (1.0 - clear) * (1.0 - m);
  // Inside a drop the image is sharper, but softened towards the rim and in tiny beads so the bent,
  // shrunken lights never alias into single bright pixels.
  float rim = smoothstep(0.5, 1.0, d);
  float dropBlur = (0.5 + 1.2 * rim) * max(1.0, 0.012 / max(drop.w, 1e-4));
  // Outside drops the lights keep one size (the defocus is the eye's); the mist only veils them.
  float blur = u_blur * mix(1.0, dropBlur, inside);
  vec3 col = city(lookup, blur);

  // Misted glass scatters a little of the city's light and lifts the blacks.
  vec3 bg = toLinear(u_bg);
  col = mix(col, col * 0.85 + bg * 0.3 + toLinear(u_light) * 0.008, mist * 0.6);

  // Drop shading: darker rims (light bends away there), and a small highlight up and to the left.
  // A drop gathers light from a wide view, so its body is brighter than the glass around it.
  vec3 inDrop = (col * 1.35 + bg * 0.35 + toLinear(u_light) * 0.03) * mix(1.0, 0.45, rim);
  col = mix(col, inDrop, m);
  float spec = exp(-dot(q - vec2(-0.35, 0.42), q - vec2(-0.35, 0.42)) * 22.0);
  col += mix(toLinear(u_light), vec3(1.0), 0.6) * spec * m * 0.35;

  col *= mix(1.0, 0.8, smoothstep(0.45, 1.15, length(uv * vec2(0.8, 1.0))));
  return finishDither(rolloff(max(col, 0.0)));
}
`;

export const monsoonGlass: LiveScene<P> = {
  id: "monsoon-glass",
  name: "Monsoon Glass",
  description: "Rain sliding down a window at night, each drop bending the blurred city lights behind it.",
  params,
  presets,
  loopSeconds: 20,
  mouse: true,
  fragment,
};
