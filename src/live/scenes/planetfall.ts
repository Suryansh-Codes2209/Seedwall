import type { ParamSchema, Params, Preset } from "@/generators/types";
import type { LiveScene } from "../types";

type P = Params & {
  bg: string;
  planet: string;
  bands: string;
  atmo: string;
  rings: string;
  ring: number;
  tilt: number;
  speed: number;
  seed: number;
};

const params: ParamSchema<P> = {
  bg: { kind: "color", label: "Space", default: "#05060c", group: "Colours", role: "bg" },
  planet: { kind: "color", label: "Planet", default: "#d9b98a", group: "Colours", role: "accent" },
  bands: { kind: "color", label: "Bands", default: "#8c5f3c", group: "Colours" },
  atmo: { kind: "color", label: "Atmosphere", default: "#8fc4ff", group: "Colours", role: "fg" },
  rings: { kind: "color", label: "Rings", default: "#e6d2ae", group: "Colours" },
  ring: { kind: "range", label: "Ring density", min: 0, max: 1, step: 0.05, default: 0.8, group: "Planet" },
  tilt: { kind: "range", label: "Ring tilt", min: 0.1, max: 0.6, step: 0.05, default: 0.3, group: "Planet" },
  speed: { kind: "range", label: "Speed", min: 0.5, max: 2, step: 0.25, default: 1, group: "Motion" },
  seed: { kind: "seed", label: "Seed", default: 4 },
};

const presets: Preset<P>[] = [
  { id: "saturnine", title: "Saturnine", params: {} },
  { id: "ice-giant", title: "Ice giant", params: { bg: "#03070d", planet: "#9fe3ef", bands: "#4f9fc0", atmo: "#7fe8ff", rings: "#bcd8e6", ring: 0.35, tilt: 0.2, seed: 21 } },
  { id: "ember", title: "Ember", params: { bg: "#0b0405", planet: "#e2703a", bands: "#5a1610", atmo: "#ff9a5c", rings: "#8a5a48", ring: 0.6, tilt: 0.45, seed: 9 } },
  { id: "jade", title: "Jade", params: { bg: "#020906", planet: "#8fd6a4", bands: "#2f7a5e", atmo: "#a8ffd8", rings: "#d6e8c8", ring: 0.7, tilt: 0.35, seed: 37 } },
];

/*
 * A banded, ringed planet seen from space. All geometry is analytic: a ray-sphere hit for the planet,
 * a ray-plane hit for the rings, and the closest-approach distance for the atmosphere glow. The planet
 * turns once per loop (TAU*uPhase), ring clumps orbit once per loop, star twinkle uses whole-number
 * frequencies, and the camera drifts round a small circle once per loop, which slides the three star
 * layers by different amounts (parallax). Phase 0 and phase 1 are the same frame.
 */
const fragment = /* glsl */ `
const float R = 1.0;      // planet radius
const float ATMO_H = 0.05; // atmosphere scale height
const float RING_IN = 1.35;
const float RING_OUT = 2.25;

vec3 sunDir() { return normalize(vec3(-0.9, 0.28, 0.3)); }

vec3 ringNormal() {
  float t = u_tilt;
  return normalize(vec3(-0.22, cos(t), sin(t)));
}

// Rotation about the planet's own axis (y in planet space).
vec3 spin(vec3 p, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

// Fractal noise on the sphere without a seam: three planar projections blended by the normal.
float triFbm(vec3 q, float sc) {
  vec3 w = pow(abs(q), vec3(4.0));
  w /= w.x + w.y + w.z;
  return w.x * fbm(q.yz * sc + 3.1, 5) + w.y * fbm(q.zx * sc + 7.7, 5) + w.z * fbm(q.xy * sc + 1.3, 5);
}

// Gas-giant albedo in planet space: turbulent latitude bands plus one storm oval.
vec3 planetAlbedo(vec3 q) {
  vec3 pc = toLinear(u_planet);
  vec3 bc = toLinear(u_bands);
  float turb = triFbm(q, 2.6) - 0.5;
  float freq = 11.0 + 6.0 * uSeed;
  float b = sin(q.y * freq + turb * 3.2 + uSeed * 40.0) + 0.5 * sin(q.y * freq * 2.3 + turb * 5.0)
    + 0.25 * sin(q.y * freq * 5.1 + turb * 8.0);
  vec3 c = mix(pc, bc, smoothstep(-0.7, 0.9, b));
  c *= 0.85 + 0.3 * triFbm(q, 9.0);
  // A storm oval at a seeded spot; it sits in planet space, so it turns with the planet.
  float lat = (hash21(vec2(uSeed, 3.0)) - 0.5) * 0.9;
  float lon = hash21(vec2(uSeed, 8.0)) * TAU;
  vec3 s = vec3(cos(lat) * sin(lon), sin(lat), cos(lat) * cos(lon));
  vec3 d = q - s;
  float oval = exp(-(d.x * d.x + d.z * d.z) * 90.0 - d.y * d.y * 300.0);
  c = mix(c, pc * 1.3, oval * 0.65);
  return c;
}

// Ring density at a radius, 0..1: seeded gaps and ringlets, fading at both edges.
float ringDensity(float r, vec3 p) {
  float x = (r - RING_IN) / (RING_OUT - RING_IN);
  float d = smoothstep(0.0, 0.06, x) * smoothstep(1.0, 0.9, x);
  d *= 0.35 + 0.65 * noise(vec2(r * 26.0, uSeed * 50.0));
  d *= 0.6 + 0.4 * noise(vec2(r * 95.0, uSeed * 70.0 + 3.0));
  float gap = 0.55 + 0.2 * hash21(vec2(uSeed, 1.0));
  d *= smoothstep(0.012, 0.03, abs(x - gap));
  // Clumps that orbit once per loop; sampled on a circle so the angle has no seam.
  vec3 n = ringNormal();
  vec3 e1 = normalize(cross(n, vec3(0.0, 0.0, 1.0)));
  vec3 e2 = cross(n, e1);
  float a = atan(dot(p, e2), dot(p, e1)) - TAU * uPhase;
  d *= 0.82 + 0.18 * noise(vec2(cos(a), sin(a)) * 5.0 + r * 3.0);
  return d * u_ring;
}

// Ray against the planet sphere: entry distance, or -1.
float hitPlanet(vec3 ro, vec3 rd) {
  float b = dot(ro, rd);
  float h = b * b - dot(ro, ro) + R * R;
  if (h < 0.0) return -1.0;
  return -b - sqrt(h);
}

// One star layer: at most one star per cell, twinkling at a whole-number rate.
vec3 stars(vec2 p, float scale, float density, float bright, float salt) {
  vec2 g = p * scale;
  vec2 cell = floor(g);
  vec2 f = fract(g);
  float h = hash21(cell + salt);
  if (h > density) return vec3(0.0);
  vec2 pos = 0.15 + 0.7 * vec2(hash21(cell + salt + 11.0), hash21(cell + salt + 29.0));
  float px = scale / uRes.y; // one pixel in cell units
  float rad = px * (0.7 + 0.9 * hash21(cell + salt + 5.0));
  float d = length(f - pos);
  float k = floor(1.0 + 3.0 * hash21(cell + salt + 17.0));
  float tw = 0.7 + 0.3 * sin(TAU * uPhase * k + h * 97.0);
  float lum = bright * pow(hash21(cell + salt + 41.0), 3.0) * tw;
  vec3 tint = mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.9, 0.75), hash21(cell + salt + 53.0));
  return tint * lum * exp(-d * d / (rad * rad));
}

vec3 scene(vec2 uv) {
  float aspect = uRes.x / uRes.y;
  vec2 suv = uv / min(aspect * 0.86, 1.0); // portrait screens zoom out so the rings still fit across
  // Landscape screens move the planet right of centre; portrait keeps it centred.
  suv.x -= 0.22 * smoothstep(1.1, 1.7, aspect);

  // Camera drift: one small circle per loop, nudged by the pointer.
  vec2 drift = vec2(cos(TAU * uPhase), sin(TAU * uPhase)) * 0.6 + uMouse * 0.5;

  vec3 bgc = toLinear(u_bg);
  vec3 atmo = toLinear(u_atmo);
  vec3 L = sunDir();

  // Background: faint haze plus three star layers, nearer layers sliding further.
  vec3 col = bgc * (0.75 + 0.5 * fbm(suv * 1.3 + drift * 0.01 + uSeed * 9.0, 4));
  col += atmo * 0.012 * smoothstep(0.35, 0.9, fbm(suv * 2.2 + drift * 0.01 + 4.0, 4));
  col += stars(suv + drift * 0.004, 140.0, 0.09, 0.5, 1.0);
  col += stars(suv + drift * 0.01, 70.0, 0.07, 0.8, 37.0);
  col += stars(suv + drift * 0.022, 32.0, 0.045, 1.3, 91.0);

  vec3 ro = vec3(drift * 0.18, 6.4);
  vec3 rd = normalize(vec3(suv, -1.8));

  // Atmosphere halo from the ray's closest approach to the planet centre.
  float tca = -dot(ro, rd);
  vec3 pc = ro + rd * tca;
  float bDist = length(pc);
  vec3 nc = pc / max(bDist, 1e-4);
  float lit = clamp(dot(nc, L) * 0.9 + 0.3, 0.0, 1.0);

  float tp = hitPlanet(ro, rd);
  if (tp > 0.0) {
    vec3 p = ro + rd * tp;
    vec3 n = normalize(p);
    vec3 q = spin(n, TAU * uPhase);
    vec3 alb = planetAlbedo(q);
    float ndl = dot(n, L);
    float diff = smoothstep(-0.08, 0.6, ndl) * (0.4 + 0.6 * max(ndl, 0.0));
    // The rings' shadow on the planet.
    vec3 rn = ringNormal();
    float tr = -dot(p, rn) / dot(L, rn);
    float shadow = 1.0;
    if (tr > 0.0) {
      vec3 rp = p + L * tr;
      shadow = 1.0 - 0.85 * ringDensity(length(rp), rp);
    }
    float ndv = clamp(dot(n, -rd), 0.0, 1.0);
    vec3 surf = alb * diff * shadow * 1.15 + alb * bgc * 0.6;
    surf *= mix(0.7, 1.0, pow(ndv, 0.35)); // limb darkening
    // Rayleigh-style rim: scattered light gathers where the view grazes the lit atmosphere.
    float rimLit = clamp(ndl * 0.9 + 0.35, 0.0, 1.0);
    surf += atmo * pow(1.0 - ndv, 3.0) * rimLit * 0.65;
    col = surf;
  } else {
    float halo = exp(-max(bDist - R, 0.0) / ATMO_H);
    col += atmo * halo * lit * 0.65 * step(0.0, tca);
  }

  // Rings: drawn when in front of the planet (or with no planet behind them).
  vec3 rn = ringNormal();
  float den = dot(rd, rn);
  if (abs(den) > 1e-4) {
    float tr = -dot(ro, rn) / den;
    if (tr > 0.0 && (tp < 0.0 || tr < tp)) {
      vec3 rp = ro + rd * tr;
      float r = length(rp);
      if (r > RING_IN && r < RING_OUT) {
        float a = ringDensity(r, rp);
        float sh = hitPlanet(rp, L) > 0.0 ? 0.08 : 1.0; // the planet's shadow across the rings
        float light = (0.35 + 0.65 * abs(dot(rn, L))) * sh;
        vec3 rc = toLinear(u_rings) * (light * 1.1 + bgc * 0.5);
        col = mix(col, rc, clamp(a * 1.15, 0.0, 0.97));
      }
    }
  }

  col *= mix(1.0, 0.8, smoothstep(0.5, 1.2, length(uv * vec2(0.75, 1.0))));
  return finishDither(rolloff(max(col, 0.0)));
}
`;

export const planetfall: LiveScene<P> = {
  id: "planetfall",
  name: "Planetfall",
  description: "A banded, ringed planet turning slowly, its rim glowing with scattered light against three drifting layers of stars.",
  params,
  presets,
  loopSeconds: 40,
  mouse: true,
  fragment,
};
