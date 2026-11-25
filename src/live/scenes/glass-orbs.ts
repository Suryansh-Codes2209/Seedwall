import type { ParamSchema, Params, Preset } from "@/generators/types";
import type { LiveScene } from "../types";

type P = Params & {
  bg: string;
  glass: string;
  light: string;
  count: number;
  gloss: number;
  speed: number;
  seed: number;
};

const params: ParamSchema<P> = {
  bg: { kind: "color", label: "Backdrop", default: "#e6e1d9", group: "Colours", role: "bg" },
  glass: { kind: "color", label: "Glass", default: "#5d9cff", group: "Colours", role: "accent" },
  light: { kind: "color", label: "Light", default: "#fff8ee", group: "Colours", role: "fg" },
  count: { kind: "range", label: "Orbs", min: 3, max: 7, step: 1, default: 5, group: "Orbs" },
  gloss: { kind: "range", label: "Gloss", min: 0, max: 1, step: 0.05, default: 0.7, group: "Orbs" },
  speed: { kind: "range", label: "Speed", min: 0.5, max: 2, step: 0.5, default: 1, group: "Motion" },
  seed: { kind: "seed", label: "Seed", default: 11 },
};

const presets: Preset<P>[] = [
  { id: "studio", title: "Studio", params: {} },
  { id: "midnight", title: "Midnight", params: { bg: "#0b1022", glass: "#7b6cff", light: "#c4d0ff", count: 6, gloss: 0.85, seed: 3 } },
  { id: "candy", title: "Candy", params: { bg: "#ffd3e2", glass: "#ff4f9a", light: "#fff2df", count: 4, gloss: 0.6, seed: 27 } },
  { id: "mono", title: "Mono", params: { bg: "#18181a", glass: "#d8d8dc", light: "#ffffff", count: 5, gloss: 0.9, seed: 42 } },
];

/*
 * Glass metaballs (smooth-min of spheres) floating over an infinite studio floor.
 * Every moving term is sin/cos(TAU*uPhase*k + offset) with whole-number k, so phase 0 and 1 match.
 * Cost per pixel stays bounded: orb centres are computed once, the outer march (64 steps) only runs
 * inside a bounding sphere, the inner march is 28 steps, and floor shadows only run near the orbs.
 */
const fragment = /* glsl */ `
#define SW_RAYMARCH

const int MAX_ORBS = 7;
vec4 gOrb[MAX_ORBS]; // xyz centre, w radius
int gCount;
vec3 gBoundC;
float gBoundR;

// Places the orbs for this frame. Frequencies k are whole numbers so the motion loops.
void setupOrbs() {
  gCount = int(clamp(floor(u_count + 0.5), 3.0, 7.0));
  float a = TAU * uPhase;
  gBoundC = vec3(0.0);
  for (int i = 0; i < MAX_ORBS; i++) {
    float fi = float(i);
    float s = uSeed * TAU + fi * 2.39996; // golden-angle spread per orb
    float k1 = float(1 + i % 2);
    float k2 = float(1 + (i + 1) % 3);
    float ring = 0.55 + 0.45 * hash21(vec2(fi, uSeed * 17.0));
    vec3 c = vec3(
      ring * 1.05 * sin(a * k1 + s),
      0.95 + 0.38 * sin(a * k2 + s * 1.7),
      ring * 0.7 * cos(a * k1 + s)
    );
    float r = 0.34 + 0.14 * hash21(vec2(uSeed * 31.0, fi + 3.0)) + 0.03 * sin(a * float(1 + i % 3) + s * 2.3);
    gOrb[i] = vec4(c, r);
  }
  gBoundR = 2.2;
  gBoundC = vec3(0.0, 0.95, 0.0);
}

// Signed distance to the merged orbs.
float map(vec3 p) {
  float d = 1e5;
  for (int i = 0; i < MAX_ORBS; i++) {
    if (i >= gCount) break;
    d = smin(d, length(p - gOrb[i].xyz) - gOrb[i].w, 0.32);
  }
  return d;
}

vec3 lightDir() { return normalize(vec3(-0.55, 1.0, 0.45)); }

// The lit floor with no shadow. The backdrop meets it at the horizon, so the studio has no seam.
vec3 floorBase() {
  return toLinear(u_bg) * (0.5 + 0.55 * toLinear(u_light) * lightDir().y);
}

// Studio environment: seamless backdrop, a large softbox in the light direction, a rim strip and a
// faint overhead sheen (what keeps glass readable on dark backdrops).
vec3 env(vec3 rd) {
  vec3 lc = toLinear(u_light);
  vec3 c = floorBase() * mix(1.0, 1.12, smoothstep(0.0, 0.9, rd.y));
  c += lc * 0.07 * smoothstep(0.1, 1.0, rd.y);
  float box = smoothstep(0.88, 0.96, dot(rd, lightDir()));
  c += lc * box * (1.4 + 2.6 * u_gloss);
  float rim = smoothstep(0.93, 0.985, dot(rd, normalize(vec3(0.95, 0.25, -0.55))));
  c += lc * rim * 0.9;
  return c;
}

vec3 glassTint() { return max(toLinear(u_glass), vec3(0.015)); }

// Lens focus spots: each orb gathers light into a bright, tinted spot inside its shadow.
float caustics(vec3 p) {
  vec3 L = lightDir();
  float acc = 0.0;
  for (int i = 0; i < MAX_ORBS; i++) {
    if (i >= gCount) break;
    vec3 c = gOrb[i].xyz;
    vec3 onFloor = c - L * (c.y / L.y);
    float d = length(p.xz - onFloor.xz) / gOrb[i].w;
    acc += exp(-d * d * 14.0);
  }
  return acc;
}

// Floor at y = 0. shadows = false skips the shadow march (used for rays seen through the glass).
vec3 floorShade(vec3 p, bool shadows) {
  vec3 bg = toLinear(u_bg);
  vec3 lc = toLinear(u_light);
  vec3 L = lightDir();
  float sh = 1.0;
  float ao = 1.0;
  if (length(p.xz - gBoundC.xz) < gBoundR + 2.5) {
    float d = map(p);
    ao = mix(0.45, 1.0, smoothstep(0.0, 0.9, d));
    if (shadows) sh = softShadow(p + vec3(0.0, 1e-3, 0.0), L, 0.02, 5.0, 7.0);
  }
  vec3 tint = glassTint();
  vec3 tintN = tint / max(max(tint.r, max(tint.g, tint.b)), 1e-3);
  // Light passing through glass is tinted rather than fully blocked.
  vec3 shade = mix(0.35 + 0.35 * tintN, vec3(1.0), sh);
  vec3 c = bg * (0.5 * ao + 0.55 * lc * L.y * shade);
  // A soft pool of light under the orbs gives dark backdrops a visible stage.
  float pool = exp(-dot(p.xz - gBoundC.xz, p.xz - gBoundC.xz) / 7.0);
  c += lc * 0.05 * pool * mix(0.25, 1.0, sh) * ao;
  c += tintN * lc * caustics(p) * 0.25 * (1.0 - sh * 0.7);
  return c;
}

// Whatever a ray sees past the glass: floor (no shadow) or environment, faded together at range.
vec3 backdrop(vec3 ro, vec3 rd) {
  if (rd.y < -1e-3) {
    float t = -ro.y / rd.y;
    vec3 p = ro + rd * t;
    return mix(floorShade(p, false), env(rd), smoothstep(7.0, 20.0, t));
  }
  return env(rd);
}

// Ray against the bounding sphere: entry and exit distances, or (-1,-1) on a miss.
vec2 boundHit(vec3 ro, vec3 rd) {
  vec3 oc = ro - gBoundC;
  float b = dot(oc, rd);
  float h = b * b - dot(oc, oc) + gBoundR * gBoundR;
  if (h < 0.0) return vec2(-1.0);
  h = sqrt(h);
  return vec2(max(-b - h, 0.0), -b + h);
}

vec3 shadeGlass(vec3 p, vec3 rd) {
  vec3 n = calcNormal(p);
  vec3 L = lightDir();
  vec3 lc = toLinear(u_light);
  vec3 tint = glassTint();
  float ndv = clamp(dot(n, -rd), 0.0, 1.0);
  float fres = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);

  // Refraction: march through the glass to the far side, bend again, and look at what lies behind.
  vec3 rdIn = refract(rd, n, 1.0 / 1.45);
  if (dot(rdIn, rdIn) < 1e-6) rdIn = rd;
  vec3 q = p - n * 0.02;
  float th = 0.02;
  float d = 1.0;
  for (int i = 0; i < 28; i++) {
    d = -map(q);
    if (d < 5e-4) break;
    float stepLen = max(d, 0.006);
    q += rdIn * stepLen;
    th += stepLen;
  }
  // A ray grazing a thin neck may not reach the far side; let it leave unbent rather than guess.
  vec3 nOut = d < 4e-3 ? calcNormal(q) : rdIn;
  // Blend into total internal reflection instead of switching, which would draw a hard edge.
  float c = dot(rdIn, nOut);
  float k = 1.0 - 1.45 * 1.45 * (1.0 - c * c);
  vec3 rdRefr = refract(rdIn, -nOut, 1.45);
  vec3 rdRefl = reflect(rdIn, -nOut);
  vec3 rdOut = k > 0.0 ? normalize(mix(rdRefl, rdRefr, smoothstep(0.0, 0.35, k))) : rdRefl;
  vec3 behind = backdrop(q + rdOut * 0.02, rdOut);
  // Mostly a body tint, with only a little depth-dependent absorption: path length jumps where
  // orbs merge, and strong absorption would draw that jump as a hard edge.
  vec3 tintN = tint / max(max(tint.r, max(tint.g, tint.b)), 1e-3);
  vec3 trans = behind * mix(vec3(1.0), tintN, 0.55) * exp(log(tint) * 0.15 * th);

  // Reflection of the studio, plus a sharp highlight whose size follows gloss.
  vec3 rf = reflect(rd, n);
  vec3 refl = env(rf);
  float spec = pow(max(dot(rf, L), 0.0), mix(24.0, 320.0, u_gloss)) * mix(0.6, 5.0, u_gloss);
  // Light scattered towards the rim keeps the body readable against dark backdrops.
  float wrap = 0.5 + 0.5 * dot(n, L);
  vec3 glow = tintN * lc * wrap * (0.03 + 0.2 * pow(1.0 - ndv, 2.0));

  return mix(trans + glow, refl, fres * mix(0.55, 1.0, u_gloss)) + lc * spec;
}

vec3 scene(vec2 uv) {
  setupOrbs();
  float aspect = uRes.x / uRes.y;
  vec2 suv = uv / min(aspect, 1.0); // portrait screens zoom out so the cluster still fits across

  float yaw = 0.18 + uMouse.x * 0.15;
  float pitch = 0.3 + uMouse.y * 0.15;
  vec3 target = vec3(0.0, 0.8, 0.0);
  vec3 ro = target + 5.6 * vec3(sin(yaw) * cos(pitch), sin(pitch), cos(yaw) * cos(pitch));
  vec3 fw = normalize(target - ro);
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(rt, fw);
  vec3 rd = normalize(suv.x * rt + suv.y * up + 1.75 * fw);

  vec3 col = env(rd);
  if (rd.y < -1e-3) {
    float t = -ro.y / rd.y;
    col = mix(floorShade(ro + rd * t, true), col, smoothstep(7.0, 20.0, t));
  }

  vec2 bh = boundHit(ro, rd);
  if (bh.y > 0.0) {
    float t = bh.x;
    bool hit = false;
    for (int i = 0; i < 64; i++) {
      float d = map(ro + rd * t);
      if (d < 3e-4 * t) { hit = true; break; }
      t += d;
      if (t > bh.y) break;
    }
    if (hit) col = shadeGlass(ro + rd * t, rd);
  }

  // Soft vignette, highlight rolloff, then a display-space dither (prelude helpers).
  col *= mix(1.0, 0.82, smoothstep(0.35, 1.1, length(uv * vec2(0.85, 1.0))));
  return finishDither(rolloff(max(col, 0.0)));
}
`;

export const glassOrbs: LiveScene<P> = {
  id: "glass-orbs",
  name: "Glass Orbs",
  description: "Glossy glass metaballs that merge and split over a soft studio floor, with refraction, tinted shadows and lens-bright caustics.",
  params,
  presets,
  loopSeconds: 20,
  mouse: true,
  fragment,
};
