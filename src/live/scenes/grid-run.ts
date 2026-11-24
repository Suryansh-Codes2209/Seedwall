import type { ParamSchema, Params, Preset } from "@/generators/types";
import type { LiveScene } from "../types";

type P = Params & {
  bg: string;
  grid: string;
  sun: string;
  glow: string;
  relief: number;
  speed: number;
  seed: number;
};

const params: ParamSchema<P> = {
  bg: { kind: "color", label: "Sky", default: "#0b0424", group: "Colours", role: "bg" },
  grid: { kind: "color", label: "Grid", default: "#ff36d2", group: "Colours", role: "accent" },
  sun: { kind: "color", label: "Sun", default: "#ffd23a", group: "Colours", role: "fg" },
  glow: { kind: "color", label: "Horizon", default: "#ff2f74", group: "Colours" },
  relief: { kind: "range", label: "Relief", min: 1, max: 5, step: 0.25, default: 3, group: "Terrain" },
  speed: { kind: "range", label: "Speed", min: 0.5, max: 2, step: 0.5, default: 1, group: "Motion" },
  seed: { kind: "seed", label: "Seed", default: 6 },
};

const presets: Preset<P>[] = [
  { id: "neon", title: "Neon", params: {} },
  { id: "vapor", title: "Vapor", params: { bg: "#170a36", grid: "#3fe4ff", sun: "#ffb8ea", glow: "#8a5cff", relief: 2.5, seed: 14 } },
  { id: "mono-green", title: "Mono green", params: { bg: "#010803", grid: "#3dff70", sun: "#b8ffb4", glow: "#1d8a38", relief: 3.5, seed: 23 } },
  { id: "sunrise", title: "Sunrise", params: { bg: "#1a2756", grid: "#ffb066", sun: "#fff1c4", glow: "#ff6a3d", relief: 4, seed: 31 } },
];

/*
 * A wireframe fbm heightfield flown over towards a banded sun. The terrain repeats every TILE world
 * units along z (its value noise wraps its lattice there), and the camera moves exactly one TILE per
 * loop, so phase 0 and phase 1 are the same frame. Grid cells are 1 unit and TILE is a whole number,
 * so the lines line up too. The sun's bands slide down twice per loop. The heightfield march is at
 * most 80 steps plus a 5-step bracketed refine; the grid is filtered by its screen footprint so the
 * far field fades into the horizon glow instead of shimmering.
 */
const fragment = /* glsl */ `
const float TILE = 32.0;    // terrain repeat length along z, in grid cells
const float LATTICE = 4.0;  // grid cells per noise lattice cell (TILE / LATTICE is whole)

// Value noise whose lattice wraps every per cells along y.
float pnoise(vec2 p, float per) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float y0 = mod(i.y, per), y1 = mod(i.y + 1.0, per);
  vec2 s = vec2(uSeed * 61.0, 0.0);
  float a = hash21(vec2(i.x, y0) + s), b = hash21(vec2(i.x + 1.0, y0) + s);
  float c = hash21(vec2(i.x, y1) + s), d = hash21(vec2(i.x + 1.0, y1) + s);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Four octaves at doubling frequency; each octave's period doubles too, so the sum wraps every TILE.
float pfbm(vec2 p) {
  float per = TILE / LATTICE;
  float sum = 0.0, amp = 0.5, norm = 0.0;
  for (int i = 0; i < 4; i++) {
    sum += amp * pnoise(p, per);
    norm += amp;
    p *= 2.0;
    per *= 2.0;
    amp *= 0.5;
  }
  return sum / norm;
}

// Terrain height at world x and scrolled z: a flat valley down the middle, ridges either side.
float height(vec2 c) {
  float n = pfbm(c / LATTICE);
  float side = smoothstep(1.4, 7.5, abs(c.x));
  return u_relief * side * pow(n, 1.7) * 2.2 + 0.08 * (n - 0.5);
}

vec3 sunDir() { return normalize(vec3(0.0, 0.085, 1.0)); }

// The sky gradient on its own; the far terrain fades into it, so the horizon has no seam.
vec3 skyGradient(vec3 rd) {
  vec3 glow = toLinear(u_glow);
  float e = rd.y;
  vec3 c = mix(glow * 0.9, toLinear(u_bg), smoothstep(-0.02, 0.22, e));
  return c + glow * 0.5 * exp(-abs(e) * 28.0);
}

// Sky: the gradient plus sparse stars and the banded sun.
vec3 sky(vec3 rd) {
  vec3 glow = toLinear(u_glow);
  float e = rd.y;
  vec3 c = skyGradient(rd);

  // Stars: one per cell at most, fading out towards the horizon glow.
  vec2 sp = rd.xy / max(rd.z, 0.2) * 90.0;
  vec2 cell = floor(sp);
  float h = hash21(cell + 7.0);
  if (h < 0.05) {
    vec2 pos = 0.2 + 0.6 * vec2(hash21(cell + 3.0), hash21(cell + 9.0));
    float d = length(fract(sp) - pos);
    float tw = 0.7 + 0.3 * sin(TAU * uPhase * floor(1.0 + 3.0 * hash21(cell + 2.0)) + h * 50.0);
    c += vec3(0.9, 0.85, 1.0) * exp(-d * d * 60.0) * tw * smoothstep(0.08, 0.3, e) * 0.8;
  }

  // The sun, measured in the screen-like plane facing it. Its lower half is cut by bands that thicken
  // downwards and slide down twice per loop.
  vec3 sd = sunDir();
  vec2 q = vec2(rd.x, rd.y - sd.y * rd.z) / max(rd.z, 1e-3);
  float r = length(q);
  float rad = 0.17;
  float aa = 1.5 / uRes.y;
  float disc = smoothstep(rad + aa, rad - aa, r);
  float y = q.y / rad; // -1 bottom .. 1 top
  float band = fract(y * 7.0 + 2.0 * uPhase);
  float cut = clamp(0.35 - y * 0.55, 0.0, 0.9);
  float bandAa = 7.0 * aa / rad;
  // Where the cut thins to nothing the band is faded out rather than left as a hairline.
  disc *= 1.0 - (1.0 - smoothstep(cut - bandAa, cut + bandAa, band)) * smoothstep(0.0, 0.05, cut);
  vec3 sunCol = mix(glow * 1.4, toLinear(u_sun) * 1.6, smoothstep(-0.9, 0.8, y));
  c = mix(c, sunCol, disc);
  c += glow * 0.25 * exp(-max(r - rad, 0.0) * 9.0) * smoothstep(-0.05, 0.02, e);
  return c;
}

vec3 scene(vec2 uv) {
  float scroll = TILE * uPhase; // exactly one tile per loop
  float yaw = uMouse.x * 0.12;
  float pitch = -0.04 + uMouse.y * 0.06;
  vec3 ro = vec3(0.0, 0.85, 0.0);
  mat3 cam = lookYawPitch(yaw, pitch);
  float aspect = uRes.x / uRes.y;
  vec2 suv = uv / min(aspect * 1.2, 1.0); // portrait widens the view a little
  vec3 rd = normalize(cam * vec3(suv, 1.5));

  vec3 col = sky(rd);
  float hMax = u_relief * 2.2 + 0.1;
  const float FAR = 75.0;
  // Haze is complete by FOG_END, a little before FAR, so terrain at the end of the valley meets the
  // haze drawn for rays that pass FAR (or run out of steps) without a seam.
  const float FOG_END = 66.0;

  // March the heightfield, then refine the crossing inside its bracket.
  float t = 0.05;
  float ta = t, da = ro.y - height(vec2(ro.x, ro.z + scroll));
  float tb = -1.0, db = 0.0;
  // Closest the ray came to the terrain, in pixels, for anti-aliasing ridges against the sky.
  float pixAngle = 1.0 / (1.5 * uRes.y * min(aspect * 1.2, 1.0));
  float nearPx = 1e9, nearT = FAR;
  for (int i = 0; i < 80; i++) {
    vec3 p = ro + rd * t;
    if (t > FAR || (p.y > hMax && rd.y >= 0.0)) break;
    float d = p.y - height(vec2(p.x, p.z + scroll));
    if (d < 0.0) { tb = t; db = d; break; }
    ta = t; da = d;
    float px = d * max(-rd.y + 0.5, 0.5) / (t * pixAngle);
    if (px < nearPx) { nearPx = px; nearT = t; }
    // Steps scale with the height gap over the ray's descent rate, so rays grazing the flat valley
    // still reach FAR (about 46 steps at worst); the cap limits tunnelling through ridges, and an
    // overshoot into terrain is caught by the bracket refine below.
    t += min(max(0.5 * d / max(-rd.y, 0.05), 0.02 + t * 0.01), 0.8 + t * 0.06);
  }
  bool hit = tb > 0.0;
  // A ray that missed below the horizon (past FAR, or out of steps) is over distant terrain: draw it
  // as full haze, which is also what terrain at FOG_END fades to. The sun sets behind that haze.
  vec3 pe = ro + rd * t;
  if (!hit && (rd.y < 0.0 || (t <= FAR && pe.y <= hMax))) col = skyGradient(rd);
  // Sky pixels that grazed a ridge take part of the ridge's dark face, which softens the silhouette.
  if (!hit) {
    vec3 ridge = mix(toLinear(u_bg) * 0.35, skyGradient(rd), smoothstep(14.0, FOG_END, nearT));
    col = mix(col, ridge, 1.0 - smoothstep(0.0, 1.0, nearPx));
  }
  if (hit) {
    for (int i = 0; i < 5; i++) {
      float tm = ta + da * (tb - ta) / max(da - db, 1e-6);
      vec3 p = ro + rd * tm;
      float dm = p.y - height(vec2(p.x, p.z + scroll));
      if (dm < 0.0) { tb = tm; db = dm; } else { ta = tm; da = dm; }
    }
    t = ta + da * (tb - ta) / max(da - db, 1e-6);
  }

  // Shading runs for every pixel (misses use a stand-in point) so fwidth() sits in uniform control flow.
  vec3 p = ro + rd * (hit ? t : FAR);
  vec2 c = vec2(p.x, p.z + scroll);
  vec2 fw2 = fwidth(c);
  if (hit) {
    float e = 0.05;
    vec3 n = normalize(vec3(height(c - vec2(e, 0.0)) - height(c + vec2(e, 0.0)), 2.0 * e,
                            height(c - vec2(0.0, e)) - height(c + vec2(0.0, e))));

    // Dark faces, faintly lit by the sun glow ahead.
    vec3 glow = toLinear(u_glow);
    vec3 face = toLinear(u_bg) * 0.35 + glow * 0.06 * max(dot(n, normalize(vec3(0.0, 0.5, 1.0))), 0.0);

    // Filtered grid lines about one pixel wide, with a soft halo; both fade as cells shrink below a
    // few pixels so the distance does not shimmer.
    // fwidth jumps at ridge silhouettes (neighbours land on a far slope); cap it with the footprint
    // the slope itself would give, so edge pixels keep their lines and halo.
    vec2 fwc = min(fw2, vec2(3.0 * t * pixAngle / max(abs(dot(n, rd)), 0.2)));
    vec2 g = abs(fract(c - 0.5) - 0.5);
    vec2 gl = g / max(fwc, 1e-4);
    float line = 1.0 - min(min(gl.x, gl.y), 1.0);
    float halo = exp(-min(gl.x, gl.y) * 0.45) * 0.35;
    float fade = 1.0 - smoothstep(0.12, 0.45, max(fwc.x, fwc.y));
    vec3 gridCol = toLinear(u_grid);
    col = face + gridCol * (line * 1.6 + halo) * fade;
    // Distance haze into the horizon glow.
    float fog = smoothstep(14.0, FOG_END, t);
    col = mix(col, skyGradient(rd), fog);
  }

  col *= mix(1.0, 0.82, smoothstep(0.45, 1.15, length(uv * vec2(0.8, 1.0))));
  return finishDither(rolloff(max(col, 0.0)));
}
`;

export const gridRun: LiveScene<P> = {
  id: "grid-run",
  name: "Grid Run",
  description: "A low flight down a glowing wireframe valley towards a banded sun, the terrain rolling past one tile per loop.",
  params,
  presets,
  loopSeconds: 16,
  mouse: true,
  fragment,
};
