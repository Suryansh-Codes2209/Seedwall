import type { ParamSchema, Params, Preset } from "@/generators/types";
import type { LiveScene } from "../types";

type P = Params & {
  bg: string;
  horizon: string;
  sun: string;
  chrome: string;
  swell: number;
  speed: number;
  seed: number;
};

const params: ParamSchema<P> = {
  bg: { kind: "color", label: "Sky", default: "#3a2a6e", group: "Colours", role: "bg" },
  horizon: { kind: "color", label: "Horizon", default: "#ff9466", group: "Colours", role: "accent" },
  sun: { kind: "color", label: "Sun", default: "#ffe2b3", group: "Colours", role: "fg" },
  chrome: { kind: "color", label: "Chrome", default: "#dcdde8", group: "Colours" },
  swell: { kind: "range", label: "Swell", min: 0.4, max: 1.6, step: 0.05, default: 1, group: "Sea" },
  speed: { kind: "range", label: "Speed", min: 0.5, max: 2, step: 0.5, default: 1, group: "Motion" },
  seed: { kind: "seed", label: "Seed", default: 5 },
};

const presets: Preset<P>[] = [
  { id: "dusk", title: "Dusk", params: {} },
  { id: "arctic", title: "Arctic", params: { bg: "#0b2340", horizon: "#bfe4ff", sun: "#ffffff", chrome: "#cfe0ee", swell: 0.8, seed: 19 } },
  { id: "gold", title: "Gold", params: { bg: "#2e1a06", horizon: "#ffbf55", sun: "#fff1c8", chrome: "#ffd27f", swell: 1.15, seed: 14 } },
  { id: "noir", title: "Noir", params: { bg: "#050507", horizon: "#5c5d68", sun: "#ffffff", chrome: "#a2a3ad", swell: 1.3, seed: 8 } },
];

/*
 * A liquid-chrome sea: a heightfield of ten directional swells, each sin(k·x + w·TAU*uPhase) with
 * a whole-number w, so phase 0 and 1 match. Heights and slopes are analytic (no finite differences),
 * the march only runs between the crest and trough planes (at most 64 steps plus a 6-step bracketed
 * refine), and short swells fade out with distance so the far sea does not sparkle.
 */
const fragment = /* glsl */ `
const int NW = 10;
vec4 gWave[NW]; // xy direction * spatial frequency, z amplitude, w temporal phase
float gMaxH;

// Places the swells for this frame. Temporal frequencies (1, 1, 2, 2, ..., 5, 5) are whole numbers so the sea loops.
void setupWaves() {
  float a = TAU * uPhase;
  float base = (uSeed - 0.5) * 0.8;
  gMaxH = 0.0;
  for (int i = 0; i < NW; i++) {
    float fi = float(i);
    // Crests travel against k, so k near +z rolls them towards the camera. Shorter swells spread wider.
    float ang = base + (hash21(vec2(fi, uSeed * 13.0)) - 0.5) * (0.8 + fi * 0.35);
    float k = 0.55 * pow(1.33, fi);
    float amp = 0.42 * pow(0.66, fi) * u_swell;
    float w = float(1 + i / 2);
    gWave[i] = vec4(vec2(sin(ang), cos(ang)) * k, amp, w * a + hash21(vec2(uSeed * 7.0, fi)) * TAU);
    gMaxH += amp;
  }
}

// Height and slope (h, dh/dx, dh/dz). dist fades the short swells out towards the horizon.
vec3 sea(vec2 p, float dist) {
  vec3 r = vec3(0.0);
  for (int i = 0; i < NW; i++) {
    vec4 wv = gWave[i];
    float kl = length(wv.xy);
    float fade = exp(-pow(kl * dist * 0.03, 2.0));
    float x = dot(wv.xy, p) + wv.w;
    float A = wv.z * fade;
    r += vec3(A * sin(x), A * cos(x) * wv.xy);
  }
  return r;
}

vec3 sunDir() {
  return normalize(vec3(0.35 * sin(uSeed * 23.0), 0.1, 1.0));
}

// Gradient sky with a low sun and faint bands near the horizon (the bands give the chrome stripes).
vec3 sky(vec3 rd) {
  vec3 top = toLinear(u_bg);
  vec3 hor = toLinear(u_horizon);
  vec3 sc = toLinear(u_sun);
  float e = rd.y;
  vec3 c = mix(hor, top, pow(smoothstep(-0.02, 0.4, e), 0.6));
  // Two broad bands above the horizon; the chrome turns them into bright stripes.
  c += hor * 0.35 * (exp(-pow((e - 0.06) * 30.0, 2.0)) + 0.6 * exp(-pow((e - 0.17) * 22.0, 2.0)));
  float s = max(dot(rd, sunDir()), 0.0);
  c += sc * (smoothstep(0.9993, 0.9996, s) * 4.0 + pow(s, 80.0) * 0.5 + pow(s, 8.0) * 0.08);
  // Below the horizon (only reflected rays see it): a darker, tinted floor.
  c = mix(c, mix(hor, top, 0.6) * 0.35, smoothstep(0.0, -0.25, e));
  return c;
}

vec3 scene(vec2 uv) {
  setupWaves();
  float yaw = uMouse.x * 0.15;
  // Portrait screens tilt up a little so the horizon sits nearer the middle.
  float pitch = -0.09 + 0.14 * (1.0 - min(uRes.x / uRes.y, 1.0)) + uMouse.y * 0.08;
  // Always above the highest possible crest, so the march never starts under the sea.
  vec3 ro = vec3(0.0, max(1.6, gMaxH + 0.15), 0.0);
  mat3 cam = lookYawPitch(yaw, pitch);
  vec3 rd = normalize(cam * vec3(uv, 1.6));

  vec3 col = sky(rd);
  if (rd.y < -1e-3) {
    float ry = -rd.y;
    float t = max((ro.y - gMaxH) / ry, 0.0);
    float tEnd = min((ro.y + gMaxH) / ry, 140.0);
    // March down until the ray is below the surface, then refine inside that bracket.
    float ta = t, da = ro.y + rd.y * t - sea((ro + rd * t).xz, t).x;
    float tb = tEnd, db = -1.0;
    for (int i = 0; i < 64; i++) {
      float tn = min(t + clamp(0.55 * da / ry, 0.02, 0.6 + t * 0.08), tEnd);
      vec3 p = ro + rd * tn;
      float d = p.y - sea(p.xz, tn).x;
      if (d < 0.0) { tb = tn; db = d; break; }
      t = tn; ta = tn; da = d;
      if (tn >= tEnd) break;
    }
    if (db < 0.0) {
      // False position, always keeping a bracket, so it cannot diverge.
      for (int i = 0; i < 6; i++) {
        float tm = ta + da * (tb - ta) / max(da - db, 1e-6);
        vec3 p = ro + rd * tm;
        float dm = p.y - sea(p.xz, tm).x;
        if (dm < 0.0) { tb = tm; db = dm; } else { ta = tm; da = dm; }
      }
      t = ta + da * (tb - ta) / max(da - db, 1e-6);
    }
    vec3 p = ro + rd * t;
    vec3 s = sea(p.xz, t);
    vec3 n = normalize(vec3(-s.y, 1.0, -s.z));
    vec3 rf = reflect(rd, n);
    float ndv = clamp(dot(n, -rd), 0.0, 1.0);
    float fres = 0.72 + 0.28 * pow(1.0 - ndv, 5.0);
    vec3 tint = toLinear(u_chrome);
    // A little horizon light in every reflection keeps steep, zenith-facing views (portrait) from going flat.
    vec3 refl = mix(sky(rf), toLinear(u_horizon), 0.08) * tint * fres;
    // Troughs between crests catch less of the sky.
    refl *= mix(0.55, 1.0, smoothstep(-gMaxH, gMaxH * 0.6, p.y));
    col = mix(refl, sky(rd), smoothstep(40.0, 135.0, t));
  }

  col *= mix(1.0, 0.85, smoothstep(0.4, 1.1, length(uv * vec2(0.8, 1.0))));
  return finishDither(rolloff(max(col, 0.0)));
}
`;

export const chromeTide: LiveScene<P> = {
  id: "chrome-tide",
  name: "Chrome Tide",
  description: "A sea of liquid chrome rolling in slow swells, mirroring a gradient sky and a low sun.",
  params,
  presets,
  loopSeconds: 24,
  mouse: true,
  fragment,
};
