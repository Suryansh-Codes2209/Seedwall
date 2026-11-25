import { afterEach, describe, expect, it, vi } from "vitest";
import { buildFragment } from "@/live/glsl/prelude";
import { clampMouse, effectiveLoopSeconds, phaseAt, pointerToMouse, shouldDraw, smoothMouse } from "@/live/loop";
import { createLivePlayer } from "@/live/player";
import type { AnyLiveScene } from "@/live/types";
import { fakeGl } from "./fixtures/fakeGl";

const SCENE = {
  id: "player-test",
  name: "Player test",
  description: "A scene used only by the player tests.",
  params: {
    bg: { kind: "color", label: "Background", default: "#102030" },
    amt: { kind: "range", label: "Amount", min: 0, max: 1, step: 0.01, default: 0.5 },
    mode: {
      kind: "select",
      label: "Mode",
      options: [
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ],
      default: "a",
    },
    title: { kind: "text", label: "Title", default: "hi" },
    seed: { kind: "seed", label: "Seed", default: 3 },
    speed: { kind: "range", label: "Speed", min: 0.5, max: 2, step: 0.5, default: 1 },
  },
  presets: [],
  loopSeconds: 10,
  mouse: false,
  fragment: "vec3 scene(vec2 uv) { return toLinear(u_bg); }",
} as unknown as AnyLiveScene;

describe("phaseAt", () => {
  it("wraps over one loop", () => {
    expect(phaseAt(0, 10, 1)).toBe(0);
    expect(phaseAt(5000, 10, 1)).toBe(0.5);
    expect(phaseAt(10000, 10, 1)).toBe(0);
  });

  it("half speed makes the loop twice as long", () => {
    expect(phaseAt(5000, 10, 0.5)).toBe(0.25);
  });

  it("snaps speed to a fixed set of loop multipliers", () => {
    expect(phaseAt(5000, 10, 2)).toBe(0); // loop 5 s
    expect(phaseAt(5000, 10, 1.9)).toBe(0); // nearest is still 2×
    expect(phaseAt(15000, 20, 1 / 1.5)).toBeCloseTo(0.5, 10); // loop 30 s
  });
});

describe("effectiveLoopSeconds", () => {
  it("scales the scene loop by the speed multiplier", () => {
    expect(effectiveLoopSeconds(SCENE, { speed: 1 })).toBe(10);
    expect(effectiveLoopSeconds(SCENE, { speed: 2 })).toBe(5);
    expect(effectiveLoopSeconds(SCENE, { speed: 0.5 })).toBe(20);
  });

  it("falls back to the scene's speed default, then 1", () => {
    const fast = { ...SCENE, params: { ...SCENE.params, speed: { ...SCENE.params.speed!, default: 2 } } } as AnyLiveScene;
    expect(effectiveLoopSeconds(fast, {})).toBe(5);
    const noSpeed = { ...SCENE, params: { seed: SCENE.params.seed! } } as AnyLiveScene;
    expect(effectiveLoopSeconds(noSpeed, {})).toBe(10);
    expect(effectiveLoopSeconds(SCENE, { speed: "fast" })).toBe(10);
  });
});

describe("shouldDraw", () => {
  it("caps the frame rate", () => {
    expect(shouldDraw(1000, 990, 30)).toBe(false);
    expect(shouldDraw(1034, 1000, 30)).toBe(true);
  });
});

describe("smoothMouse", () => {
  it("moves half-way in one half-life", () => {
    const [x, y] = smoothMouse([0, 0], [1, 1], 120);
    expect(x).toBeCloseTo(0.5, 2);
    expect(y).toBeCloseTo(0.5, 2);
  });
});

describe("clampMouse", () => {
  it("clamps the pointer to -1..1", () => {
    expect(clampMouse(5, -5)).toEqual([1, -1]);
    expect(clampMouse(0.25, -0.5)).toEqual([0.25, -0.5]);
    expect(clampMouse(Number.NaN, 0)).toEqual([0, 0]);
  });
});

describe("pointerToMouse", () => {
  const rect = { left: 100, top: 50, width: 200, height: 100 };
  it("maps the element to -1..1 with y up", () => {
    expect(pointerToMouse(200, 100, rect)).toEqual([0, 0]);
    expect(pointerToMouse(100, 50, rect)).toEqual([-1, 1]); // top left
    expect(pointerToMouse(300, 150, rect)).toEqual([1, -1]); // bottom right
    expect(pointerToMouse(400, 100, rect)).toEqual([1, 0]); // clamped
    expect(pointerToMouse(10, 10, { left: 0, top: 0, width: 0, height: 0 })).toEqual([0, 0]);
  });
});

describe("buildFragment", () => {
  it("starts with the version line and declares schema uniforms", () => {
    const src = buildFragment(SCENE);
    expect(src.startsWith("#version 300 es\n")).toBe(true);
    expect(src).toContain("uniform vec3 u_bg;");
    expect(src).toContain("uniform float u_amt;");
    expect(src).toContain("uniform int u_mode;");
    expect(src).not.toContain("u_title");
    expect(src).not.toContain("uniform float u_seed;");
    expect(src.indexOf("uniform vec3 u_bg;")).toBeLessThan(src.indexOf("void main()"));
    expect(src.endsWith(SCENE.fragment)).toBe(true);
  });

  it("hoists SW_RAYMARCH above the prelude", () => {
    const rm = { ...SCENE, fragment: "#define SW_RAYMARCH\nfloat map(vec3 p) { return length(p) - 1.0; }\nvec3 scene(vec2 uv) { return vec3(0.0); }" };
    const src = buildFragment(rm);
    expect(src.match(/#define SW_RAYMARCH/g)).toHaveLength(1);
    expect(src.indexOf("#define SW_RAYMARCH")).toBeLessThan(src.indexOf("#ifdef SW_RAYMARCH"));
  });
});

describe("createLivePlayer", () => {
  afterEach(() => vi.restoreAllMocks());

  it("player falls back when getContext returns null", () => {
    const canvas = { getContext: () => null } as unknown as HTMLCanvasElement;
    expect(createLivePlayer(canvas, SCENE, {})).toBeNull();
  });

  it("returns null and logs the info log when the shader fails to compile", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const gl = {
      VERTEX_SHADER: 1,
      FRAGMENT_SHADER: 2,
      COMPILE_STATUS: 3,
      createShader: () => ({}),
      shaderSource: () => {},
      compileShader: () => {},
      getShaderParameter: () => false,
      getShaderInfoLog: () => "ERROR: 0:1: bad",
      deleteShader: () => {},
    };
    const canvas = { getContext: () => gl } as unknown as HTMLCanvasElement;
    expect(createLivePlayer(canvas, SCENE, {})).toBeNull();
    expect(error).toHaveBeenCalledWith(expect.stringContaining("ERROR: 0:1: bad"));
  });
});

describe("createLivePlayer setParams", () => {
  it("redraws the last frame when a param changes while not animating", () => {
    const { canvas, calls } = fakeGl();
    const player = createLivePlayer(canvas, SCENE, { bg: "#000000" }, { reducedMotion: true, scale: 1 });
    expect(player).not.toBeNull();
    player!.setParams({ bg: "#ff0000" });
    expect(calls.draws).toBe(0); // nothing drawn yet, so nothing to refresh
    player!.start();
    expect(calls.draws).toBe(1);
    player!.setParams({ bg: "#ffffff" });
    expect(calls.draws).toBe(2);
    expect(calls.colors.at(-1)).toEqual([1, 1, 1]);
  });
});

/** A hand-driven clock and requestAnimationFrame queue: frame(t) sets the time and runs the queued callbacks. */
function fakeFrames() {
  let now = 0;
  let queue: FrameRequestCallback[] = [];
  const raf = vi.fn((cb: FrameRequestCallback) => {
    queue.push(cb);
    return queue.length;
  });
  const caf = vi.fn(() => {
    queue = [];
  });
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.stubGlobal("requestAnimationFrame", raf);
  vi.stubGlobal("cancelAnimationFrame", caf);
  return {
    raf,
    caf,
    frame(t: number) {
      now = t;
      const run = queue;
      queue = [];
      for (const cb of run) cb(t);
    },
    setNow(t: number) {
      now = t;
    },
  };
}

describe("createLivePlayer speed changes", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps the current phase when the speed changes while playing", () => {
    const f = fakeFrames();
    const { canvas, calls } = fakeGl();
    const player = createLivePlayer(canvas, SCENE, { speed: 1 }, { scale: 1 })!;
    player.start();
    f.frame(5000); // 10 s loop → phase 0.5
    expect(calls.phases.at(-1)).toBeCloseTo(0.5, 6);
    player.setParams({ speed: 2 }); // 5 s loop from here on
    f.frame(5050);
    expect(calls.phases.at(-1)).toBeCloseTo(0.5 + 50 / 5000, 6);
  });

  it("keeps the paused phase when the speed changes while stopped", () => {
    const f = fakeFrames();
    const { canvas, calls } = fakeGl();
    const player = createLivePlayer(canvas, SCENE, { speed: 1 }, { scale: 1 })!;
    player.start();
    f.frame(2500); // phase 0.25
    f.setNow(2500);
    player.stop();
    player.setParams({ speed: 0.5 }); // 20 s loop
    f.setNow(9000);
    player.start();
    f.frame(9000);
    expect(calls.phases.at(-1)).toBeCloseTo(0.25, 6);
  });
});

describe("createLivePlayer playback", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("stops playing and dispatches \"lost\" when the GL context is lost", () => {
    const f = fakeFrames();
    const { canvas, calls } = fakeGl();
    const lost = vi.fn();
    canvas.addEventListener("lost", lost);
    const player = createLivePlayer(canvas, SCENE, {}, { scale: 1 })!;
    player.start();
    f.frame(100);
    expect(calls.draws).toBe(1);

    canvas.dispatchEvent(new Event("webglcontextlost"));
    expect(lost).toHaveBeenCalledTimes(1);
    expect(lost.mock.calls[0]![0]).toBeInstanceOf(CustomEvent);
    expect(f.caf).toHaveBeenCalled();

    // Nothing more is drawn, and start() can't bring the loop back on a lost context.
    const requested = f.raf.mock.calls.length;
    f.frame(200);
    player.start();
    f.frame(300);
    expect(calls.draws).toBe(1);
    expect(f.raf.mock.calls.length).toBe(requested);
  });

  it("never calls requestAnimationFrame under reduced motion", () => {
    const f = fakeFrames();
    const { canvas, calls } = fakeGl();
    const player = createLivePlayer(canvas, SCENE, {}, { scale: 1, reducedMotion: true })!;
    player.start();
    player.setParams({ bg: "#ffffff" });
    player.stop();
    player.start();
    expect(f.raf).not.toHaveBeenCalled();
    expect(calls.draws).toBeGreaterThan(0); // the still frame
    expect(calls.phases.every((p) => p === 0)).toBe(true);
  });
});
