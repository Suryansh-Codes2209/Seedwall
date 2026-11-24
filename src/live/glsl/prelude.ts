import type { AnyLiveScene } from "../types";
import { paramUniforms } from "../uniforms";

/**
 * Shared GLSL ES 3.00 code placed before every scene's fragment. The scene defines
 * `vec3 scene(vec2 uv)`; `main()` here calls it.
 */
export const PRELUDE = /* glsl */ `
// Seedwall Live prelude. A scene defines: vec3 scene(vec2 uv)
// - uv = (gl_FragCoord.xy - 0.5*uRes) / uRes.y: centred on the canvas, y up, aspect-correct
//   (the short vertical axis spans -0.5..0.5).
// - Colour uniforms (u_*) are sRGB in 0-1, NOT linearised. Call toLinear() on them before lighting.
//   scene() returns linear colour; main() applies output gamma (pow 1/2.2).
// - Time arrives only as uPhase in [0,1) over one loop of uLoop seconds. Use TAU*uPhase in
//   periodic functions so the loop is seamless.
// - uMouse is the smoothed pointer in -1..1, x right, y up; (0,0) is the centre and the rest value.
// - Raymarching scenes define the SW_RAYMARCH macro at the top of their fragment (it is moved
//   above this prelude) and define float map(vec3 p); that enables calcNormal() and softShadow().
// - Shared finishing helpers: rolloff(c) eases linear highlights above 0.8 towards 1 instead of
//   clipping; finishDither(c) adds a 1/255 dither in display space (against banding) and returns
//   linear colour again, so a scene can end with: return finishDither(rolloff(max(col, 0.0)));
// - turns(k) is the angle of k whole turns per loop, TAU*fract(uPhase*k), wrapped first so phase 1
//   lands on exactly the angles of phase 0. Use it with a whole-number k for every periodic motion.
// - lookYawPitch(yaw, pitch) is a camera basis (columns: right, up, forward) looking along +z at
//   yaw/pitch 0, with world up = +y: rd = normalize(lookYawPitch(yaw, pitch) * vec3(uv, focal)).
uniform vec2 uRes;
uniform float uPhase, uLoop, uSeed;
uniform vec2 uMouse;
out vec4 fragColor;

#define TAU 6.28318530718

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Value noise in 0-1.
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i), b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0)), d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Fractal noise, up to 8 octaves, roughly 0-1.
float fbm(vec2 p, int octaves) {
  float sum = 0.0, amp = 0.5, norm = 0.0;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    sum += amp * noise(p);
    norm += amp;
    p = mat2(1.6, 1.2, -1.2, 1.6) * p;
    amp *= 0.5;
  }
  return sum / max(norm, 1e-4);
}

float sdSphere(vec3 p, float r) { return length(p) - r; }

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// Polynomial smooth minimum with blend radius k.
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// Angle of k whole turns per loop (k a whole number), wrapped so phase 1 gives exactly phase 0's angles.
float turns(float k) { return TAU * fract(uPhase * k); }

vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }

// Keeps highlights from clipping hard: identity below 0.8, eased towards 1 above it.
vec3 rolloff(vec3 c) {
  vec3 hi = 0.8 + 0.2 * (1.0 - exp(-(c - 0.8) * 5.0));
  return mix(c, hi, step(0.8, c));
}

// Dithers in display space so dark gradients do not band, then returns linear colour for main().
vec3 finishDither(vec3 col) {
  vec3 s = pow(col, vec3(1.0 / 2.2)) + (hash21(gl_FragCoord.xy) - 0.5) / 255.0;
  return pow(max(s, 0.0), vec3(2.2));
}

// Camera basis (right, up, forward) for a camera looking along +z at yaw = pitch = 0, world up +y.
mat3 lookYawPitch(float yaw, float pitch) {
  vec3 fw = vec3(sin(yaw) * cos(pitch), sin(pitch), cos(yaw) * cos(pitch));
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(rt, fw);
  return mat3(rt, up, fw);
}

#ifdef SW_RAYMARCH
float map(vec3 p);

vec3 calcNormal(vec3 p) {
  const vec2 e = vec2(1e-3, -1e-3);
  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
}

// Soft shadow towards rd; k sets the penumbra sharpness.
float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
  float res = 1.0, t = mint;
  for (int i = 0; i < 48; i++) {
    if (t >= maxt) break;
    float h = map(ro + rd * t);
    if (h < 1e-4) return 0.0;
    res = min(res, k * h / t);
    t += clamp(h, 0.01, 0.25);
  }
  return clamp(res, 0.0, 1.0);
}
#endif

vec3 scene(vec2 uv);

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 c = scene(uv);
  fragColor = vec4(pow(max(c, 0.0), vec3(1.0 / 2.2)), 1.0);
}
`;

const GLSL_TYPE = { "3f": "vec3", "1f": "float", "1i": "int" } as const;
const RAYMARCH_DEFINE = /^[ \t]*#define[ \t]+SW_RAYMARCH\b.*$/m;

/**
 * The full fragment source: version, precision, one uniform per schema param, the prelude, then
 * the scene. A `#define SW_RAYMARCH` in the scene is moved above the prelude so it takes effect there.
 */
export function buildFragment(scene: AnyLiveScene): string {
  const defaults = Object.fromEntries(Object.entries(scene.params).map(([k, d]) => [k, d.default]));
  const uniforms = Object.entries(paramUniforms(scene, defaults))
    .filter(([name]) => name !== "uSeed")
    .map(([name, u]) => `uniform ${GLSL_TYPE[u.type]} ${name};`);
  const raymarch = RAYMARCH_DEFINE.test(scene.fragment);
  const body = raymarch ? scene.fragment.replace(RAYMARCH_DEFINE, "") : scene.fragment;
  return [
    "#version 300 es",
    "precision highp float;",
    "precision highp int;",
    ...uniforms,
    ...(raymarch ? ["#define SW_RAYMARCH"] : []),
    PRELUDE,
    body,
  ].join("\n");
}
