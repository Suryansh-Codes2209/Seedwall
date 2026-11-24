import { afterEach, describe, expect, it, vi } from "vitest";
import { buildFragment } from "@/live/glsl/prelude";
import { clampMouse, effectiveLoopSeconds, phaseAt, pointerToMouse, shouldDraw, smoothMouse } from "@/live/loop";
import { createLivePlayer } from "@/live/player";
import type { AnyLiveScene } from "@/live/types";

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
    speed: { kind: "range", label: "Speed", min: 0.5, max: 2, step: 0.25, default: 1 },
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

/** A WebGL2 stand-in that compiles and links everything and records draws and colour uniforms. */
function fakeGl() {
  const calls = { draws: 0, colors: [] as number[][] };
  const gl = {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    TRIANGLES: 5,
    createShader: () => ({}),
    shaderSource: () => {},
    compileShader: () => {},
    getShaderParameter: () => true,
    deleteShader: () => {},
    createProgram: () => ({}),
    attachShader: () => {},
    linkProgram: () => {},
    getProgramParameter: () => true,
    createVertexArray: () => ({}),
    getUniformLocation: (_p: unknown, name: string) => ({ name }),
    viewport: () => {},
    useProgram: () => {},
    bindVertexArray: () => {},
    uniform1f: () => {},
    uniform1i: () => {},
    uniform2f: () => {},
    uniform3f: (_l: unknown, r: number, g: number, b: number) => calls.colors.push([r, g, b]),
    drawArrays: () => {
      calls.draws++;
    },
  };
  const canvas = { width: 0, height: 0, clientWidth: 64, clientHeight: 32, getContext: () => gl } as unknown as HTMLCanvasElement;
  return { canvas, calls };
}

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
