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
  bg: { kind: "color", label: "Night", default: "#0c1736", group: "Colours", role: "bg" },
  light: { kind: "color", label: "Street lights", default: "#ffa940", group: "Colours", role: "accent" },
  neon: { kind: "color", label: "Neon", default: "#ff4f9a", group: "Colours", role: "fg" },
  rain: { kind: "range", label: "Rain", min: 0.2, max: 1, step: 0.05, default: 0.65, group: "Glass" },
  blur: { kind: "range", label: "Blur", min: 0.5, max: 1.8, step: 0.05, default: 1, group: "Glass" },
  speed: { kind: "range", label: "Speed", min: 0.5, max: 2, step: 0.25, default: 1, group: "Motion" },
  seed: { kind: "seed", label: "Seed", default: 4 },
};

const presets: Preset<P>[] = [
  { id: "mumbai-night", title: "Mumbai night", params: {} },
  { id: "amber", title: "Amber", params: { bg: "#0e0603", light: "#ffb347", neon: "#ffd27a", rain: 0.55, blur: 1.15, seed: 12 } },
  { id: "teal", title: "Teal", params: { bg: "#03141a", light: "#3fe0cf", neon: "#7d9dff", rain: 0.75, blur: 0.9, seed: 21 } },
  { id: "grey-day", title: "Grey day", params: { bg: "#7f878f", light: "#fff3dc", neon: "#cfe2ee", rain: 0.85, blur: 1.3, seed: 33 } },
];

/*
 * Rain on a window at night, in 2.5D. Behind the glass is a city of defocused lights, all bokeh discs
 * drawn analytically at any blur (no blur taps): windows clustered in low blocks and a few towers
 * under a dark sky, a row of street lamps, and two lanes of cars (headlight and tail-light pairs).
 * On the glass are beads gathered in patches, and drops that slide down in columns with stick-slip pauses, leaving clear trails dotted
 * with droplets that dry as the trail fades. Each sliding drop runs a whole number of cycles of a
 * 1.5-high path per loop, so it leaves the bottom and comes back from above the top, and the whole
 * field repeats once per loop. Drops refract the city (the lookup is offset by the drop's dome
 * normal and centred on the street, which shows it flipped, small and sharper) and glow brighter
 * than the misted glass between them. The traffic scrolls one full period of its cars per loop, and the mouse shifts the city behind the
 * glass for parallax.
 */
const fragment = /* glsl */ `
const float H = 1.5;          // height of one sliding-drop cycle (taller than the screen)
const float TOP = 0.75;       // drops start above the top edge (y = 0.5)
const float HORIZON = -0.04;  // where the low city meets the sky
const float STREET = -0.3;    // the traffic lanes

// Angle of k whole turns per loop, wrapped first so phase 1 lands on exactly the angles of phase 0.
float turns(float k) { return TAU * fract(uPhase * k); }

// A soft disc of radius r with an edge soft wide (both > 0): 1 inside, 0 outside.
float disc(float d, float r, float soft) { return 1.0 - smoothstep(r - soft, r, d); }

// Top of the skyline at x: low blocks along a gentle rise, with a few tall towers.
float skyline(float x) {
  const float BW = 0.15;
  float bi = floor(x / BW);
  float h = hash21(vec2(bi, uSeed * 29.0));
  float tower = step(0.62, h) * (0.1 + 0.3 * pow(hash21(vec2(bi, uSeed * 31.0 + 4.0)), 1.5));
  return HORIZON + 0.025 * sin(x * 1.7 + uSeed * 9.0) + 0.03 * h + tower;
}

// Window lights in cells of size s: only inside buildings (above the street, below the skyline),
// almost none in the open sky.
// The cell grid is shifted by off so the two layers do not line up.
vec3 windows(vec2 p, float s, float blur, float layer, vec2 off) {
  vec3 acc = vec3(0.0);
  vec2 cell = floor((p + off) / s);
  vec3 warm = toLinear(u_light), neon = toLinear(u_neon);
  for (int j = -1; j <= 1; j++)
    for (int i = -1; i <= 1; i++) {
      vec2 c = cell + vec2(float(i), float(j));
      vec2 key = c + vec2(layer * 91.7, uSeed * 137.0);
      float h0 = hash21(key);
      vec2 mid = (c + 0.5) * s - off;
      float inCity = step(mid.y, skyline(mid.x) - 0.01) * step(STREET + 0.06, mid.y);
      float dens = mix(0.006, 0.6, inCity);
      if (h0 > dens) continue;
      float h1 = hash21(key + 3.1), h2 = hash21(key + 7.7), h3 = hash21(key + 11.3);
      vec2 pos = (c + 0.3 + 0.4 * vec2(h1, h2)) * s - off;
      // Never wider than 0.8 cell, so the 3x3 neighbourhood holds every disc that reaches p.
      float r = min(s * mix(0.18, 0.42, h3) * blur, 0.8 * s);
      float d = length(p - pos);
      float soft = r * mix(0.15, 0.4, h1) + 0.0015;
      float ring = 0.75 + 0.35 * smoothstep(0.4 * r, r, d);
      float flick = 1.0 + 0.25 * step(0.7, h3) * sin(turns(1.0 + floor(3.0 * h1)) + h2 * TAU);
      vec3 col = h2 < 0.8 ? warm : (h2 < 0.93 ? neon : mix(warm, vec3(1.0), 0.6));
      acc += col * disc(d, r, soft) * ring * flick * mix(0.25, 0.9, h0 / dens) / (0.55 + blur);
    }
  return acc;
}

// Street lamps: big, bright discs in a row just above the traffic.
vec3 lamps(vec2 p, float blur) {
  const float LW = 0.34;
  vec3 acc = vec3(0.0);
  float c0 = floor(p.x / LW);
  for (int i = -1; i <= 1; i++) {
    float c = c0 + float(i);
    float h = hash21(vec2(c, uSeed * 43.0));
    vec2 pos = vec2((c + 0.35 + 0.3 * h) * LW, STREET + 0.12 + 0.02 * h);
    float r = min(mix(0.032, 0.048, h) * blur, 0.3 * LW);
    float d = length(p - pos);
    acc += mix(toLinear(u_light), vec3(1.0), 0.25) * disc(d, r, r * 0.3 + 0.0015) * (0.85 + 0.3 * smoothstep(0.4 * r, r, d)) * mix(0.8, 1.3, h);
  }
  return acc;
}

// Two lanes of cars, each car a pair of lights: headlights coming one way, tail lights going the
// other. Each lane scrolls one full period of its cars per loop.
vec3 traffic(vec2 p, float blur) {
  const float CW = 0.105, NC = 24.0; // car spacing and cars per period
  vec3 head = mix(toLinear(u_light), vec3(1.0), 0.7);
  vec3 tail = mix(toLinear(u_neon), vec3(1.0, 0.05, 0.03), 0.55);
  vec3 acc = vec3(0.0);
  for (int lane = 0; lane < 2; lane++) {
    float fl = float(lane);
    float dir = lane == 0 ? -1.0 : 1.0;
    float y0 = STREET - 0.045 * fl;
    float x = p.x - dir * NC * CW * fract(uPhase);
    float c0 = floor(x / CW);
    for (int i = -1; i <= 1; i++) {
      float c = c0 + float(i);
      vec2 key = vec2(mod(c, NC), fl * 13.0 + uSeed * 71.0);
      if (hash21(key) > 0.82) continue;
      float h1 = hash21(key + 5.3), h2 = hash21(key + 9.1);
      float cx = (c + 0.5 + 0.2 * (h1 - 0.5)) * CW;
      float r = min(CW * 0.17 * blur, 0.4 * CW);
      for (int k = 0; k < 2; k++) {
        vec2 pos = vec2(cx + (float(k) - 0.5) * CW * 0.4, y0 + 0.004 * (h2 - 0.5));
        float d = length(vec2(x, p.y) - pos);
        acc += (lane == 0 ? head : tail) * disc(d, r, r * 0.35 + 0.0015) * (0.8 + 0.3 * smoothstep(0.4 * r, r, d)) * mix(0.55, 0.95, h2) / (0.4 + 0.6 * blur);
      }
    }
  }
  return acc;
}

// The city behind the glass at a given blur (1 = as seen past the drops).
vec3 city(vec2 p, float blur) {
  vec3 bg = toLinear(u_bg);
  vec3 warm = toLinear(u_light);
  // Night sky with the city's glow low down; buildings a little darker than the glow behind them.
  vec3 col = bg * mix(1.0, 0.55, smoothstep(HORIZON, 0.5, p.y));
  col += (bg * 0.9 + warm * 0.012) * exp(-max(p.y - HORIZON, 0.0) * 7.0);
  // Out of focus, so the outline is averaged across three points and the road blends in softly.
  float e = 0.025 * blur;
  float bld = 0.0;
  for (int i = -1; i <= 1; i++) bld += 1.0 - smoothstep(-e, e, p.y - skyline(p.x + float(i) * e));
  vec3 block = bg * 0.7 + warm * 0.015;
  col = mix(col, block, bld / 3.0 * 0.8);
  col = mix(col, block, 0.8 * (1.0 - smoothstep(STREET - 0.06, STREET + 0.06, p.y)));
  // The wet street: a band of light round the lanes and its glow on the road below.
  col += warm * 0.05 * exp(-abs(p.y - STREET) * 16.0);
  col += windows(p, 0.05, blur, 0.0, vec2(0.0)) * 0.7;
  col += windows(p, 0.09, blur, 1.0, vec2(0.31));
  col += lamps(p, blur);
  col += traffic(p, blur);
  return col;
}

// A rough blurred average of the lit city, what a drop gathers from its wide view.
vec3 cityGlow() {
  return toLinear(u_bg) * 0.7 + toLinear(u_light) * 0.02 + toLinear(u_neon) * 0.01;
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
  vec4 drop = vec4(1.0 - smoothstep(1.0 - aa / r, 1.0, d), q, r);

  // The trail above the drop: how long ago the drop passed this height, as a distance along its path.
  float dy = mod(p.y - yd, H);
  float px = p.x - pathX(p.y, ci, cw, h1, h2);
  float str = exp(-dy / 0.32);
  clear = max(clear, str * (1.0 - smoothstep(r * 0.4, r * 0.85, abs(px))));

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
      drop = pickDrop(drop, vec4(1.0 - smoothstep(1.0 - aa / tr, 1.0, length(tq)), tq, tr));
    }
  }
  return drop;
}

// Fixed beads in cells of size s, gathered in patches; most are tiny. Wiped away where a trail is clear.
vec4 beadLayer(vec2 p, float s, float layer, float clear) {
  vec2 c = floor(p / s);
  vec2 key = c + vec2(layer * 47.0, uSeed * 97.0);
  float h0 = hash21(key);
  float clump = noise((c + 0.5) * s * 2.4 + vec2(layer * 5.3, uSeed * 17.0));
  if (h0 > mix(0.08, 0.6, u_rain) * smoothstep(0.3, 0.75, clump)) return vec4(0.0);
  float h1 = hash21(key + 1.3), h2 = hash21(key + 5.1), h3 = hash21(key + 6.7);
  vec2 pos = (c + 0.3 + 0.4 * vec2(h1, h2)) * s;
  float r = s * mix(0.07, 0.27, h3 * h3 * h3);
  vec2 q = (p - pos) / r;
  q.y *= 1.1;
  float aa = 1.5 / uRes.y;
  // Small beads stay faint; only the larger ones show as clear lenses.
  float strength = mix(0.4, 1.0, smoothstep(0.0025, 0.008, r));
  return vec4((1.0 - smoothstep(1.0 - aa / r, 1.0, length(q))) * (1.0 - clear) * strength, q, r);
}

vec3 scene(vec2 uv) {
  float clear = 0.0;
  vec4 drop = slideLayer(uv, 0.11, 0.0, clear);
  drop = pickDrop(drop, slideLayer(uv + vec2(0.043, 0.0), 0.075, 1.0, clear));
  drop = pickDrop(drop, beadLayer(uv, 0.024, 0.0, clear));
  drop = pickDrop(drop, beadLayer(uv + 0.019, 0.05, 1.0, clear));
  float m = drop.x;
  vec2 q = drop.yz;
  float d = length(q);
  float rim = smoothstep(0.85, 1.0, d);

  // Inside a drop the city is seen flipped and small (the drop is a lens with a wide view), centred
  // on the lit street band so every drop holds a few bright lights. The whole offset applies even on
  // a drop's anti-aliased edge (a part offset would land on unrelated lights and speckle the
  // outline); the rim's blur is high, so that edge stays soft.
  vec2 parallax = uMouse * vec2(0.035, 0.025);
  float inside = step(0.002, m);
  vec2 inView = vec2(uv.x - q.x * (drop.w + 0.1), mix(uv.y, STREET + 0.1, 0.8) - q.y * 0.16);
  vec2 lookup = mix(uv, inView, inside) + parallax;
  // Sharper inside drops, softened at the rim and in tiny beads so shrunken lights never alias.
  float dropBlur = (0.4 + 1.2 * rim) * max(1.0, 0.01 / max(drop.w, 1e-4));
  // Outside drops the lights keep one size (the defocus is the eye's); the mist only veils them.
  float blur = u_blur * mix(1.0, dropBlur, inside);
  vec3 col = city(lookup, blur);

  // Misted glass veils the city a little; trails and drops are clear.
  vec3 glow = cityGlow();
  float mist = (1.0 - clear) * (1.0 - m);
  col = mix(col, col * 0.75 + glow * 0.4, mist * 0.7);

  // A drop is brighter than the glass: it gathers light, has a bright crescent low down where
  // light focuses, a thin dark rim, and a highlight up and to the left.
  vec3 inDrop = col * 1.5 + glow * 0.5;
  inDrop += toLinear(u_light) * 0.18 * smoothstep(0.2, 0.9, -q.y) * (1.0 - rim);
  inDrop *= mix(1.0, 0.35, rim);
  vec2 hq = q - vec2(-0.35, 0.42);
  inDrop += vec3(1.0) * exp(-dot(hq, hq) * 22.0) * 0.35;
  col = mix(col, inDrop, m);

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
