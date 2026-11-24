import type { ParamSchema, Params, Preset } from "@/generators/types";
import type { LiveScene } from "../types";

type P = Params & {
  bg: string;
  slab: string;
  light: string;
  haze: number;
  rays: number;
  speed: number;
  seed: number;
};

const params: ParamSchema<P> = {
  bg: { kind: "color", label: "Fog", default: "#2a3039", group: "Colours", role: "bg" },
  slab: { kind: "color", label: "Stone", default: "#34343a", group: "Colours", role: "accent" },
  light: { kind: "color", label: "Light", default: "#f6efe2", group: "Colours", role: "fg" },
  haze: { kind: "range", label: "Fog density", min: 0.3, max: 1.6, step: 0.05, default: 1, group: "Atmosphere" },
  rays: { kind: "range", label: "God rays", min: 0, max: 2, step: 0.05, default: 1, group: "Atmosphere" },
  speed: { kind: "range", label: "Speed", min: 0.5, max: 2, step: 0.25, default: 1, group: "Motion" },
  seed: { kind: "seed", label: "Seed", default: 3 },
};

const presets: Preset<P>[] = [
  { id: "basalt", title: "Basalt", params: {} },
  { id: "desert", title: "Desert", params: { bg: "#7d5a40", slab: "#80583a", light: "#ffd9a0", haze: 1.2, rays: 1.1, seed: 11 } },
  { id: "temple", title: "Temple", params: { bg: "#27433e", slab: "#3f3b33", light: "#ffdf8c", haze: 1.1, rays: 1.2, seed: 17 } },
  { id: "void", title: "Void", params: { bg: "#030306", slab: "#0c0c12", light: "#8a9cff", haze: 0.5, rays: 0.2, seed: 29 } },
];

/*
 * Stone slabs floating in fog, backlit by a low light that sits just behind the tall slab at the
 * focal point. Everything is analytic, so there is no march to run out of steps: slabs are oriented
 * boxes hit with the slab method, surface shadows are box tests towards the light, and the god-rays
 * are 16 jittered samples along the view ray, each tested against the boxes in their own frames
 * (the pixels of a 2x2 quad share their sums, which hides the jitter).
 * Slabs bob and sway, the light swings, the fog's noise drifts round a circle and the camera drifts,
 * all at whole numbers of turns per loop (wrapped with fract), so phase 0 and 1 are the same frame.
 * Silhouettes are anti-aliased from the box's signed distance at the middle of the ray's crossing
 * (the closest approach of a ray that just misses), blending the nearest slab over what lies behind.
 */
const fragment = /* glsl */ `
const int NS = 8;
const float FOCAL = 1.6;
const float SHAFT_END = 48.0; // god-ray samples stop here, past every slab (so no shaft ends at a seam)
mat3 gRot[NS];  // world -> slab frame
vec3 gPos[NS];
vec3 gHalf[NS];
vec3 gLm[NS];   // 1 / (light direction in the slab frame)
vec3 gLk[NS];   // |gLm| * half size, for the shadow test
vec3 gLd[NS];   // light direction in the slab frame
vec3 gL;        // direction towards the light

vec3 safeDir(vec3 d) { return (2.0 * step(0.0, d) - 1.0) * max(abs(d), vec3(1e-5)); }

mat3 rotYZ(float yaw, float roll) {
  float cy = cos(yaw), sy = sin(yaw), cr = cos(roll), sr = sin(roll);
  mat3 ry = mat3(cy, 0.0, -sy, 0.0, 1.0, 0.0, sy, 0.0, cy);
  mat3 rz = mat3(cr, sr, 0.0, -sr, cr, 0.0, 0.0, 0.0, 1.0);
  return transpose(ry * rz); // inverse of the slab's orientation
}

// Places the slabs and the light for this frame.
void setupScene() {
  float a = turns(1.0);
  gL = normalize(vec3(0.07 * sin(a), 0.14 + 0.03 * cos(a), 1.0));

  // The tall slab at the focal point, with the light just over its top edge.
  gPos[0] = vec3(0.0, 1.4 + 0.12 * sin(a), 36.0);
  gHalf[0] = vec3(1.55, 5.6, 0.4);
  gRot[0] = rotYZ(0.06 * sin(a + 1.0), 0.0);

  for (int i = 1; i < NS; i++) {
    float fi = float(i);
    vec4 h = vec4(hash21(vec2(fi, uSeed * 17.0)), hash21(vec2(fi * 3.1, uSeed * 29.0)),
                  hash21(vec2(fi * 7.3, uSeed * 41.0)), hash21(vec2(fi * 1.7, uSeed * 53.0)));
    float side = mod(fi, 2.0) < 0.5 ? 1.0 : -1.0;
    float ph = h.w * TAU;
    float bobK = 1.0 + floor(h.z * 2.0); // 1 or 2 bobs per loop
    gPos[i] = vec3(side * (1.8 + 3.4 * h.x), 0.6 + 4.0 * h.y + 0.3 * sin(turns(bobK) + ph), 8.0 + fi * 3.4 + (h.z - 0.5) * 2.0);
    gHalf[i] = vec3(0.16 + 0.14 * h.w, 0.9 + 1.5 * h.x, 0.45 + 0.6 * h.z);
    float yaw = (h.y - 0.5) * 2.4 + 0.35 * sin(a + ph);
    float roll = (h.w - 0.5) * 0.9 + 0.12 * sin(turns(2.0) + ph * 1.3);
    gRot[i] = rotYZ(yaw, roll);
  }
  for (int i = 0; i < NS; i++) {
    gLd[i] = gRot[i] * gL;
    gLm[i] = 1.0 / safeDir(gLd[i]);
    gLk[i] = abs(gLm[i]) * gHalf[i];
  }
}

// (tNear, tFar) of a ray given in slab i's frame; a hit has tNear < tFar and tFar > 0.
vec2 boxT(vec3 o, vec3 d, vec3 hs) {
  vec3 m = 1.0 / safeDir(d);
  vec3 n = m * o, k = abs(m) * hs;
  vec3 t1 = -n - k, t2 = -n + k;
  return vec2(max(max(t1.x, t1.y), t1.z), min(min(t2.x, t2.y), t2.z));
}

// How much a slab-frame point q is shaded from the light by slab i, zero when the slab is behind q.
// The box's signed distance at the middle of the light ray's crossing gives a lateral penumbra that
// widens with distance from the slab, as under a light with some size.
float occlusion(int i, vec3 q) {
  vec3 n = gLm[i] * q;
  vec3 t1 = -n - gLk[i], t2 = -n + gLk[i];
  float tN = max(max(t1.x, t1.y), t1.z), tF = min(min(t2.x, t2.y), t2.z);
  if (tF <= 0.0) return 0.0;
  float tm = max(0.5 * (tN + tF), 0.0);
  float pen = 0.03 + 0.025 * tm;
  return 1.0 - smoothstep(-pen, pen, sdBox(q + gLd[i] * tm, gHalf[i]));
}

float lightVis(vec3 p) {
  float v = 1.0;
  for (int i = 0; i < NS; i++) v *= 1.0 - occlusion(i, gRot[i] * (p - gPos[i]));
  return v;
}

// The fog's own colour along rd (what distant things fade to), with the glow round the light.
vec3 fogColour(vec3 rd) {
  vec3 fog = toLinear(u_bg);
  vec3 c = mix(fog * 0.4, fog, smoothstep(-0.35, 0.35, rd.y));
  float cl = max(dot(rd, gL), 0.0);
  return c + toLinear(u_light) * (0.02 * pow(cl, 6.0) + 0.06 * pow(cl, 60.0));
}

vec3 sky(vec3 rd) {
  float cl = dot(rd, gL);
  float disc = smoothstep(0.99965, 0.9998, cl);
  return fogColour(rd) + toLinear(u_light) * (disc * 2.0 + 0.25 * pow(max(cl, 0.0), 600.0));
}

// Radiance leaving slab i at distance t along the ray.
vec3 shadeSlab(int i, vec3 ro, vec3 rd, float t) {
  vec3 p = ro + rd * t;
  // Clamped onto the box: anti-aliased edge pixels shade a ray that just misses it.
  vec3 q = clamp(gRot[i] * (p - gPos[i]), -gHalf[i], gHalf[i]);
  vec3 r = abs(q) / gHalf[i];
  vec3 nl = sign(q) * step(r.yzx, r) * step(r.zxy, r);
  vec3 n = nl * gRot[i]; // back to world space (gRot is orthonormal)
  // Distance to the nearest edge of the face, for the backlit rim.
  vec3 g = gHalf[i] - abs(q) + abs(nl) * 1e3;
  float edge = min(g.x, min(g.y, g.z));
  vec2 fuv = abs(nl.x) > 0.5 ? q.yz : (abs(nl.y) > 0.5 ? q.xz : q.xy);

  vec3 lightC = toLinear(u_light);
  vec3 stone = toLinear(u_slab) * (0.7 + 0.6 * fbm(fuv * 2.3 + float(i) * 7.0 + uSeed * 31.0, 4));
  // Faces seen edge-on are slivers under a pixel wide; their direct light fades so they do not flicker.
  float diff = max(dot(n, gL), 0.0) * smoothstep(0.02, 0.2, abs(dot(n, rd)));
  float sh = diff > 0.0 ? lightVis(p + n * 2e-3) : 0.0;
  vec3 amb = toLinear(u_bg) * (0.45 + 0.3 * n.y) + lightC * 0.03;
  vec3 col = stone * (lightC * diff * sh * 1.8 + amb);
  float back = pow(max(dot(rd, gL), 0.0), 4.0);
  col += lightC * exp(-edge / 0.035) * (0.03 + 0.45 * back) * (0.4 + 0.6 * lightVis(p + n * 2e-3 + gL * 0.05));
  return col;
}

// Mean of v over the pixel's 2x2 quad; qd is the pixel's position in it (0 or 1 on each axis).
float quadAverage(float v, vec2 qd) {
  vec2 sg = 1.0 - 2.0 * qd;
  float row = 0.5 * (v + v + sg.x * dFdx(v));
  return 0.5 * (row + row + sg.y * dFdy(row));
}

vec3 scene(vec2 uv) {
  setupScene();
  float a = turns(1.0);
  float aspect = uRes.x / uRes.y;
  vec2 suv = uv / min(aspect * 1.15, 1.0); // portrait widens the view
  vec3 ro = vec3(0.5 * sin(a), 1.2 + 0.1 * sin(turns(2.0)), 0.0);
  float yaw = 0.025 * sin(a) + uMouse.x * 0.15;
  float pitch = 0.1 + uMouse.y * 0.1;
  vec3 rd = normalize(lookYawPitch(yaw, pitch) * vec3(suv, FOCAL));
  float pixAngle = 1.0 / (FOCAL * uRes.y * min(aspect * 1.15, 1.0));

  // Nearest slab within about a pixel of the ray (front, with its coverage), and the nearest solid
  // hit behind it (back).
  float tFront = 1e9, cov = 0.0;
  int iFront = -1;
  vec2 hits[NS];
  for (int i = 0; i < NS; i++) {
    vec3 o = gRot[i] * (ro - gPos[i]), d = gRot[i] * rd;
    vec2 tt = boxT(o, d, gHalf[i]);
    hits[i] = tt;
    if (tt.y <= 0.0) continue;
    // Signed distance from the box at the middle of the ray's (near-)crossing: close to the ray's
    // closest approach when it just misses, and its depth inside the box when it hits.
    float tm = max(0.5 * (tt.x + tt.y), 0.0);
    float sd = sdBox(o + d * tm, gHalf[i]);
    float w = 0.7 * max(tm, 0.5) * pixAngle;
    if (sd < w && tt.x < tFront) { tFront = tt.x; iFront = i; cov = 1.0 - smoothstep(-w, w, sd); }
  }
  float tBack = 1e9;
  int iBack = -1;
  for (int i = 0; i < NS; i++) {
    vec2 tt = hits[i];
    if (i != iFront && tt.x < tt.y && tt.y > 0.0 && tt.x < tBack) { tBack = tt.x; iBack = i; }
  }
  if (iFront < 0) cov = 0.0;

  float sigma = 0.045 * u_haze;
  vec3 fogC = fogColour(rd);
  vec3 back = sky(rd);
  if (iBack >= 0) back = mix(fogC, shadeSlab(iBack, ro, rd, tBack), exp(-sigma * tBack));
  vec3 front = back;
  if (iFront >= 0 && cov > 0.0) front = mix(fogC, shadeSlab(iFront, ro, rd, max(tFront, 0.0)), exp(-sigma * max(tFront, 0.0)));

  // God-rays: 16 jittered samples up to the back layer, summed separately for the front layer.
  float tEnd = min(cov > 0.999 ? tFront : (iBack >= 0 ? tBack : SHAFT_END), SHAFT_END);
  // The four pixels of each 2x2 quad jitter by different quarters of a step and then share their sums
  // (read through screen derivatives), which smooths the shafts like 64 samples for the cost of 16.
  vec2 qd = mod(floor(gl_FragCoord.xy), 2.0);
  float jit = fract(hash21(floor(gl_FragCoord.xy * 0.5) + 17.0) + (qd.x * 2.0 + qd.y) * 0.25);
  vec2 drift = 2.5 * vec2(cos(a), sin(a));
  float ds = tEnd / 16.0;
  float accB = 0.0, accF = 0.0;
  for (int j = 0; j < 16; j++) {
    float s = (float(j) + jit) * ds;
    vec3 p = ro + rd * s;
    float dens = 1.8 * pow(fbm(vec2(p.x * 0.2 + p.y * 0.13, p.z * 0.2 - p.y * 0.09) + drift, 3), 1.6);
    // Little fog right at the camera, so the lit air there does not wash out the shafts further in.
    dens *= smoothstep(2.0, 10.0, s);
    float v = dens * lightVis(p) * exp(-sigma * s) * sigma * ds;
    accB += v;
    accF += v * clamp((tFront - s) / ds + 0.5, 0.0, 1.0);
  }
  // Quads that straddle a silhouette keep their own sums, so shafts do not bleed across the edge.
  float steady = 1.0 - smoothstep(0.02, 0.08, fwidth(tEnd) / tEnd + fwidth(cov));
  accB = mix(accB, quadAverage(accB, qd), steady);
  accF = mix(accF, quadAverage(accF, qd), steady);
  float c = dot(rd, gL);
  float g = 0.8;
  float phase = 0.01 + 0.016 * (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * c, 1.5);
  vec3 shaft = toLinear(u_light) * u_rays * phase * 4.0;

  vec3 col = mix(back + shaft * accB, front + shaft * accF, cov);
  col *= mix(1.0, 0.78, smoothstep(0.4, 1.15, length(uv * vec2(0.8, 1.0))));
  return finishDither(rolloff(max(col, 0.0)));
}
`;

export const monolith: LiveScene<P> = {
  id: "monolith",
  name: "Monolith",
  description: "Stone slabs drifting in fog, backlit by a low light that throws slow god-rays between them.",
  params,
  presets,
  loopSeconds: 30,
  mouse: true,
  fragment,
};
