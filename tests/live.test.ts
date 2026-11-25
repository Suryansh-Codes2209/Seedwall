import { afterEach, describe, expect, it, vi } from "vitest";
import { coerceParam } from "@/generators/render";
import { createRng } from "@/generators/shared/rng";
import type { Params } from "@/generators/types";
import { LIVE_SCENES, getLiveScene, resolveLiveParams } from "@/live";
import type { LiveScene } from "@/live/types";
import { loopMultiplier } from "@/live/loop";
import { posterPath } from "@/live/poster";
import { paramUniforms } from "@/live/uniforms";
import { buildFragment } from "@/live/glsl/prelude";
import { createLivePlayer } from "@/live/player";
import { createHoverIntent, createSharedPlayer } from "@/live/shared";
import { fakeGl } from "./fixtures/fakeGl";

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

describe("posterPath", () => {
  it("builds the landscape and phone poster paths", () => {
    expect(posterPath("glass-orbs", "aurora")).toBe("/live/glass-orbs/aurora.jpg");
    expect(posterPath("glass-orbs", "aurora", false)).toBe("/live/glass-orbs/aurora.jpg");
    expect(posterPath("glass-orbs", "aurora", true)).toBe("/live/glass-orbs/aurora-phone.jpg");
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

  it.each(["chrome-tide", "planetfall", "grid-run", "monolith", "monsoon-glass", "diya-lake", "nebula-drift"])("registers %s", (id) => {
    expect(getLiveScene(id)).toBeDefined();
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

  it("every speed step gives a different loop length", () => {
    const def = s.params.speed;
    expect(def?.kind).toBe("range");
    if (def?.kind !== "range") return;
    const steps: number[] = [];
    for (let v = def.min; v <= def.max + 1e-9; v += def.step) steps.push(loopMultiplier(v));
    expect(steps.length).toBeGreaterThan(1);
    expect(new Set(steps).size).toBe(steps.length);
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

describe("shared player program cache", () => {
  afterEach(() => vi.unstubAllGlobals());
  const sceneN = (n: number): LiveScene => ({ ...scene, id: `scene-${n}`, fragment: `vec3 scene(vec2 uv) { return vec3(${n}.0); }` });

  it("A, B, A on one canvas compiles A once", () => {
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const { canvas, calls } = fakeGl();
    const shared = createSharedPlayer((s, p) => createLivePlayer(canvas, s, p, { scale: 1, mouse: false }));
    const [a, b] = [sceneN(1), sceneN(2)];
    for (const s of [a, b, a, b]) expect(shared.show(s, resolveLiveParams(s))).toBe(true);
    expect(calls.fragments.filter((f) => f === buildFragment(a))).toHaveLength(1);
    expect(calls.fragments.filter((f) => f === buildFragment(b))).toHaveLength(1);
    expect(calls.links).toBe(2);
    shared.dispose();
  });

  it("caches per GL context, so another canvas compiles its own program", () => {
    const a = sceneN(1);
    const one = fakeGl();
    const two = fakeGl();
    createLivePlayer(one.canvas, a, {}, { scale: 1 })?.dispose();
    createLivePlayer(two.canvas, a, {}, { scale: 1 })?.dispose();
    expect(one.calls.links).toBe(1);
    expect(two.calls.links).toBe(1);
  });

  it("drops the cache when the context is lost", () => {
    const a = sceneN(1);
    const { canvas, calls } = fakeGl();
    createLivePlayer(canvas, a, {}, { scale: 1 });
    canvas.dispatchEvent(new Event("webglcontextlost"));
    createLivePlayer(canvas, a, {}, { scale: 1 });
    expect(calls.links).toBe(2);
  });
});

describe("createHoverIntent", () => {
  afterEach(() => vi.useRealTimers());

  it("activates only after the pointer rests for the delay", () => {
    vi.useFakeTimers();
    const activate = vi.fn();
    const intent = createHoverIntent(150, activate);
    intent.enter("a");
    vi.advanceTimersByTime(149);
    expect(activate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(activate).toHaveBeenCalledExactlyOnceWith("a");
  });

  it("a sweep across cards activates only the card the pointer stops on", () => {
    vi.useFakeTimers();
    const activate = vi.fn();
    const intent = createHoverIntent(150, activate);
    for (const id of ["a", "b", "c"]) {
      intent.enter(id);
      vi.advanceTimersByTime(60);
      intent.leave(id);
    }
    intent.enter("d");
    vi.advanceTimersByTime(500);
    expect(activate.mock.calls).toEqual([["d"]]);
  });

  it("leaving before the delay cancels; leaving another card doesn't", () => {
    vi.useFakeTimers();
    const activate = vi.fn();
    const intent = createHoverIntent(150, activate);
    intent.enter("a");
    intent.leave("a");
    vi.advanceTimersByTime(500);
    expect(activate).not.toHaveBeenCalled();
    intent.enter("b");
    intent.leave("a");
    vi.advanceTimersByTime(150);
    expect(activate.mock.calls).toEqual([["b"]]);
  });

  it("now() activates at once and drops a pending hover; cancel() drops it too", () => {
    vi.useFakeTimers();
    const activate = vi.fn();
    const intent = createHoverIntent(150, activate);
    intent.enter("a");
    intent.now("b");
    expect(activate.mock.calls).toEqual([["b"]]);
    intent.enter("c");
    intent.cancel();
    vi.advanceTimersByTime(500);
    expect(activate.mock.calls).toEqual([["b"]]);
  });
});
