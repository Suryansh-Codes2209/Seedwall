import type { Params } from "@/generators/types";
import { buildFragment } from "./glsl/prelude";
import { loopMultiplier, phaseAt, shouldDraw, smoothMouse } from "./loop";
import type { AnyLiveScene } from "./types";
import { paramUniforms, type UniformValue } from "./uniforms";

export interface LivePlayerOptions {
  /** Frame-rate cap. Default 30. */
  fps?: 30 | 60;
  /** Backing-store pixels per CSS pixel. Default min(devicePixelRatio, 2). */
  scale?: number;
  /** Feed pointer moves (setMouse) to the shader. Default: the scene's `mouse` flag. */
  mouse?: boolean;
  /** Draw one still frame on start() and never run the animation loop. */
  reducedMotion?: boolean;
}

export interface LivePlayer {
  start(): void;
  stop(): void;
  setParams(p: Params): void;
  /** Pointer position in 0–1 canvas space, y up. */
  setMouse(x: number, y: number): void;
  renderFrame(phase: number): void;
  readonly gl: WebGL2RenderingContext;
  dispose(): void;
}

/** Full-screen triangle from gl_VertexID; no vertex buffers. */
const VERTEX = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  console.error(`Seedwall Live: shader failed to compile\n${gl.getShaderInfoLog(shader) ?? ""}`);
  gl.deleteShader(shader);
  return null;
}

function link(gl: WebGL2RenderingContext, fragment: string): WebGLProgram | null {
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  if (!vs) return null;
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragment);
  if (!fs) {
    gl.deleteShader(vs);
    return null;
  }
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  console.error(`Seedwall Live: shader failed to link\n${gl.getProgramInfoLog(program) ?? ""}`);
  gl.deleteProgram(program);
  return null;
}

/**
 * Plays a live scene on `canvas` with WebGL2. Returns null when WebGL2 is unavailable or the
 * shader fails to compile, so the caller can show a poster instead. Dispatches a `"lost"` event
 * on the canvas if the GL context is lost.
 */
export function createLivePlayer(
  canvas: HTMLCanvasElement,
  scene: AnyLiveScene,
  params: Params,
  opts: LivePlayerOptions = {},
): LivePlayer | null {
  const ctx = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: false }) as WebGL2RenderingContext | null;
  if (!ctx) return null;
  const gl: WebGL2RenderingContext = ctx;
  const program = link(gl, buildFragment(scene));
  if (!program) return null;

  const fps = opts.fps ?? 30;
  const scale = opts.scale ?? Math.min(globalThis.devicePixelRatio ?? 1, 2);
  const mouseOn = opts.mouse ?? scene.mouse;
  const reducedMotion = opts.reducedMotion ?? false;

  const vao = gl.createVertexArray();
  const locations = new Map<string, WebGLUniformLocation | null>();
  const loc = (name: string) => {
    if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name));
    return locations.get(name) ?? null;
  };

  let uniforms: Record<string, UniformValue> = {};
  let speed = 1;
  let loopSeconds = scene.loopSeconds;
  let mouse: [number, number] = [0.5, 0.5];
  let mouseTarget: [number, number] = [0.5, 0.5];
  let mouseAt = 0;

  let running = false; // the caller wants the loop playing
  let raf = 0;
  let lastDraw = -Infinity;
  let startedAt = 0; // performance.now() at elapsed 0
  let pausedElapsed = 0;
  let lost = false;

  function setParams(p: Params) {
    uniforms = paramUniforms(scene, p);
    const s = Number(p.speed ?? scene.params.speed?.default ?? 1);
    speed = Number.isFinite(s) ? s : 1;
    loopSeconds = scene.loopSeconds * loopMultiplier(speed);
  }

  function resize() {
    const w = Math.max(1, Math.round((canvas.clientWidth || canvas.width) * scale));
    const h = Math.max(1, Math.round((canvas.clientHeight || canvas.height) * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  function renderFrame(phase: number) {
    if (lost) return;
    resize();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    for (const [name, u] of Object.entries(uniforms)) {
      const l = loc(name);
      if (u.type === "3f") gl.uniform3f(l, u.v[0], u.v[1], u.v[2]);
      else if (u.type === "1f") gl.uniform1f(l, u.v);
      else gl.uniform1i(l, u.v);
    }
    gl.uniform2f(loc("uRes"), canvas.width, canvas.height);
    gl.uniform1f(loc("uPhase"), phase);
    gl.uniform1f(loc("uLoop"), loopSeconds);
    gl.uniform2f(loc("uMouse"), mouse[0], mouse[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function tick(now: number) {
    raf = requestAnimationFrame(tick);
    if (!shouldDraw(now, lastDraw, fps)) return;
    if (mouseOn) mouse = smoothMouse(mouse, mouseTarget, now - mouseAt);
    mouseAt = now;
    lastDraw = now;
    renderFrame(phaseAt(now - startedAt, scene.loopSeconds, speed));
  }

  function play() {
    if (raf || lost) return;
    const now = performance.now();
    startedAt = now - pausedElapsed;
    mouseAt = now;
    lastDraw = -Infinity;
    raf = requestAnimationFrame(tick);
  }

  function pause() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
    pausedElapsed = performance.now() - startedAt;
  }

  const onVisibility = () => {
    if (document.hidden) pause();
    else if (running) play();
  };
  const onLost = () => {
    lost = true;
    running = false;
    pause();
    canvas.dispatchEvent(new CustomEvent("lost"));
  };
  if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener?.("webglcontextlost", onLost);

  setParams(params);

  return {
    gl,
    start() {
      if (reducedMotion) {
        renderFrame(0);
        return;
      }
      running = true;
      if (typeof document === "undefined" || !document.hidden) play();
    },
    stop() {
      running = false;
      pause();
    },
    setParams,
    setMouse(x, y) {
      if (mouseOn) mouseTarget = [x, y];
    },
    renderFrame,
    dispose() {
      running = false;
      pause();
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener?.("webglcontextlost", onLost);
      if (!lost) {
        gl.deleteVertexArray(vao);
        gl.deleteProgram(program);
      }
    },
  };
}
