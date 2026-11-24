import { afterEach, describe, expect, it, vi } from "vitest";
import { buildFragment } from "@/live/glsl/prelude";
import { phaseAt, shouldDraw, smoothMouse } from "@/live/loop";
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
