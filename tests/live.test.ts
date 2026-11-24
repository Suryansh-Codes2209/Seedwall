import { describe, expect, it, vi } from "vitest";
import { coerceParam } from "@/generators/render";
import { createRng } from "@/generators/shared/rng";
import type { Params } from "@/generators/types";
import { LIVE_SCENES, getLiveScene, resolveLiveParams } from "@/live";
import type { LiveScene } from "@/live/types";
import { paramUniforms } from "@/live/uniforms";
import { createSharedPlayer } from "@/live/shared";

type TestP = Params & { bg: string; amt: number; on: boolean; mode: string; seed: number };

const TEST_SCENE: LiveScene<TestP> = {
  id: "test-scene",
  name: "Test scene",
  description: "A scene used only to check the param-to-uniform mapping.",
  params: {
    bg: { kind: "color", label: "Background", default: "#ff8000" },
    amt: { kind: "range", label: "Amount", min: 0, max: 1, step: 0.01, default: 0.5 },
    on: { kind: "toggle", label: "On", default: true },
    mode: {
      kind: "select",
      label: "Mode",
      options: [
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ],
      default: "b",
    },
    seed: { kind: "seed", label: "Seed", default: 7 },
  },
  presets: [{ id: "p1", title: "P1", params: { amt: 0.25, mode: "a" } }],
  loopSeconds: 12,
  mouse: false,
  fragment: "vec3 scene(vec2 uv) { return vec3(0.0); }",
};
const scene = TEST_SCENE as unknown as LiveScene;

describe("paramUniforms", () => {
  it("paramUniforms maps kinds", () => {
    const u = paramUniforms(scene, resolveLiveParams(scene));
    expect(u.u_bg).toEqual({ type: "3f", v: [1, 128 / 255, 0] });
    expect(u.u_amt).toEqual({ type: "1f", v: 0.5 });
    expect(u.u_on).toEqual({ type: "1f", v: 1 });
    expect(u.u_mode).toEqual({ type: "1i", v: 1 });
    expect(u.uSeed).toEqual({ type: "1f", v: createRng(7)() });
  });

  it("replaces dots in param keys with underscores", () => {
    const dotted = { ...scene, params: { "look.amt": { kind: "range", label: "A", min: 0, max: 1, step: 0.1, default: 0.3 } } } as unknown as LiveScene;
    expect(paramUniforms(dotted, { "look.amt": 0.3 })).toEqual({ u_look_amt: { type: "1f", v: 0.3 } });
  });
});

describe("resolveLiveParams", () => {
  it("layers defaults, preset and validated overrides", () => {
    expect(resolveLiveParams(scene)).toEqual({ bg: "#ff8000", amt: 0.5, on: true, mode: "b", seed: 7 });
    expect(resolveLiveParams(scene, "p1")).toMatchObject({ amt: 0.25, mode: "a" });
    expect(resolveLiveParams(scene, "p1", { amt: 2, mode: "zzz", seed: 42, nope: 1 })).toEqual({ bg: "#ff8000", amt: 1, on: true, mode: "a", seed: 42 });
    expect(resolveLiveParams(scene, "missing")).toEqual(resolveLiveParams(scene));
  });
});

describe("registry", () => {
  it("getLiveScene finds registered scenes and returns undefined otherwise", () => {
    for (const s of LIVE_SCENES) expect(getLiveScene(s.id)).toBe(s);
    expect(getLiveScene("does-not-exist")).toBeUndefined();
  });

  it("has at least one scene", () => {
    expect(LIVE_SCENES.length).toBeGreaterThan(0);
    expect(getLiveScene("glass-orbs")).toBeDefined();
  });

  it("scene ids are unique", () => {
    expect(new Set(LIVE_SCENES.map((s) => s.id)).size).toBe(LIVE_SCENES.length);
  });
});

describe.each(LIVE_SCENES.map((s) => [s.id, s] as const))("%s", (_id, s) => {
  it("has metadata and ≥4 unique presets", () => {
    expect(s.name).toBeTruthy();
    expect(s.description.length).toBeGreaterThan(20);
    expect(s.presets.length).toBeGreaterThanOrEqual(4);
    expect(new Set(s.presets.map((p) => p.id)).size).toBe(s.presets.length);
  });

  it("presets only use valid param keys and values", () => {
    for (const preset of s.presets)
      for (const [key, value] of Object.entries(preset.params)) {
        const def = s.params[key];
        expect(def, `${preset.id}.${key}`).toBeDefined();
        if (def) expect(coerceParam(def, value), `${preset.id}.${key}=${String(value)}`).toBe(value);
      }
  });

  it("loops between 8 and 60 seconds", () => {
    expect(s.loopSeconds).toBeGreaterThanOrEqual(8);
    expect(s.loopSeconds).toBeLessThanOrEqual(60);
  });

  it("has a seed param and a speed param", () => {
    expect(s.params.seed?.kind).toBe("seed");
    expect(s.params.speed).toBeDefined();
  });

  it("uses time only through uPhase and defines scene()", () => {
    expect(s.fragment).not.toMatch(/\b(uTime|iTime)\b/);
    expect(s.fragment).toContain("vec3 scene(");
  });
});

describe("createSharedPlayer", () => {
  const sceneN = (n: number): LiveScene => ({ ...scene, id: `scene-${n}`, fragment: `vec3 scene(vec2 uv) { return vec3(${n}.0); }` });

  function mockFactory() {
    let alive = 0;
    let maxAlive = 0;
    const log: string[] = [];
    const factory = vi.fn((s: LiveScene, _p: Params) => {
      alive++;
      maxAlive = Math.max(maxAlive, alive);
      log.push(`create ${s.id}`);
      return {
        start: vi.fn(() => log.push(`start ${s.id}`)),
        stop: vi.fn(() => log.push(`stop ${s.id}`)),
        setParams: vi.fn(() => log.push(`params ${s.id}`)),
        dispose: vi.fn(() => {
          alive--;
          log.push(`dispose ${s.id}`);
        }),
      };
    });
    return { factory, log, stats: () => ({ alive, maxAlive }) };
  }

  it("LiveGrid uses one shared player: at most one context alive at any time", () => {
    const m = mockFactory();
    const shared = createSharedPlayer(m.factory);
    const scenes = [1, 2, 3, 4, 5].map(sceneN);
    for (const s of scenes) expect(shared.show(s, resolveLiveParams(s))).toBe(true);
    expect(m.factory).toHaveBeenCalledTimes(5);
    expect(m.stats().maxAlive).toBe(1);
    // The previous player is disposed before the next one is created.
    expect(m.log.indexOf("dispose scene-1")).toBeLessThan(m.log.indexOf("create scene-2"));
    expect(m.log.indexOf("dispose scene-4")).toBeLessThan(m.log.indexOf("create scene-5"));
    shared.dispose();
    expect(m.stats().alive).toBe(0);
  });

  it("reuses the player for the same shader and only rebinds params", () => {
    const m = mockFactory();
    const shared = createSharedPlayer(m.factory);
    const s = sceneN(1);
    shared.show(s, resolveLiveParams(s));
    shared.hide();
    shared.show(s, { ...resolveLiveParams(s), amt: 0.9 });
    expect(m.factory).toHaveBeenCalledTimes(1);
    expect(m.log).toEqual(["create scene-1", "start scene-1", "stop scene-1", "params scene-1", "start scene-1"]);
  });

  it("hide stops the player and show reports a failed factory", () => {
    const shared = createSharedPlayer(() => null);
    expect(shared.show(sceneN(1), {})).toBe(false);
    expect(() => shared.hide()).not.toThrow();
  });
});
