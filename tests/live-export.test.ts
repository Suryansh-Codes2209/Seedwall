import { afterEach, describe, expect, it, vi } from "vitest";
import { clampExportSize, exportFileName, pickVideoMime, recordLoop } from "@/live/export";
import type { AnyLiveScene } from "@/live/types";

const SCENE = {
  id: "export-test",
  name: "Export test",
  description: "A scene used only by the export tests.",
  params: {
    seed: { kind: "seed", label: "Seed", default: 3 },
    speed: { kind: "range", label: "Speed", min: 0.5, max: 2, step: 0.25, default: 1 },
  },
  presets: [],
  loopSeconds: 10,
  mouse: false,
  fragment: "vec3 scene(vec2 uv) { return vec3(0.0); }",
} as unknown as AnyLiveScene;

describe("clampExportSize", () => {
  it("scales down to the GPU limit, keeping the aspect ratio", () => {
    expect(clampExportSize(6144, 3456, 4096)).toEqual({ w: 4096, h: 2304, scaled: true });
  });

  it("leaves sizes within the limit alone", () => {
    expect(clampExportSize(1179, 2556, 8192)).toEqual({ w: 1179, h: 2556, scaled: false });
  });

  it("clamps a tall size by its height", () => {
    expect(clampExportSize(1179, 2556, 2048)).toEqual({ w: 945, h: 2048, scaled: true });
  });
});

describe("pickVideoMime", () => {
  it("prefers VP9 WebM when MP4 is unsupported", () => {
    expect(pickVideoMime((m) => m.startsWith("video/webm"))).toEqual({ mime: "video/webm;codecs=vp9", ext: "webm" });
  });

  it("prefers H.264 MP4 when supported", () => {
    expect(pickVideoMime(() => true)).toEqual({ mime: "video/mp4;codecs=avc1", ext: "mp4" });
  });

  it("returns null when nothing is supported", () => {
    expect(pickVideoMime(() => false)).toBeNull();
  });
});

describe("exportFileName", () => {
  it("names scene, preset and size", () => {
    expect(exportFileName("glass-orbs", "dusk", 1920, 1080, "mp4")).toBe("seedwall-live-glass-orbs-dusk-1920x1080.mp4");
  });
});

/** A WebGL2 stand-in that compiles everything and records the uPhase of every draw. */
function fakeGl(phases: number[], loseContext: () => void) {
  return {
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
    deleteVertexArray: () => {},
    deleteProgram: () => {},
    getExtension: (name: string) => (name === "WEBGL_lose_context" ? { loseContext } : null),
    getUniformLocation: (_p: unknown, name: string) => ({ name }),
    viewport: () => {},
    useProgram: () => {},
    bindVertexArray: () => {},
    uniform1f: (l: { name: string }, v: number) => {
      if (l.name === "uPhase") phases.push(v);
    },
    uniform1i: () => {},
    uniform2f: () => {},
    uniform3f: () => {},
    drawArrays: () => {},
  };
}

/** Fakes document, the canvas, MediaRecorder and requestAnimationFrame for recordLoop. */
function fakeBrowser(opts: { recorderThrows?: boolean; hidden?: boolean } = {}) {
  const phases: number[] = [];
  const loseContext = vi.fn();
  const track = { requestFrame: () => {}, stop: vi.fn() };
  const listeners = new Map<string, Set<() => void>>();
  const doc = {
    hidden: opts.hidden ?? false,
    visibilityState: opts.hidden ? "hidden" : "visible",
    addEventListener: (type: string, fn: () => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(fn);
    },
    removeEventListener: (type: string, fn: () => void) => listeners.get(type)?.delete(fn),
    createElement: () => ({
      width: 300,
      height: 150,
      clientWidth: 0,
      clientHeight: 0,
      getContext: () => fakeGl(phases, loseContext),
      captureStream: () => ({ getVideoTracks: () => [track], getTracks: () => [track] }),
    }),
  };
  const recorders: FakeRecorder[] = [];
  const throws = opts.recorderThrows ?? false;
  class FakeRecorder {
    static isTypeSupported = (m: string) => m.startsWith("video/webm");
    state = "inactive";
    ondataavailable: ((e: { data: Blob }) => void) | null = null;
    onstop: (() => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    constructor(
      _stream: unknown,
      public opts: { mimeType: string },
    ) {
      if (throws) throw new Error("recorder failed");
      recorders.push(this);
    }
    start() {
      this.state = "recording";
    }
    stop() {
      if (this.state === "inactive") return;
      this.state = "inactive";
      this.ondataavailable?.({ data: new Blob(["frames"], { type: this.opts.mimeType }) });
      this.onstop?.();
    }
  }
  let frames: ((t: number) => void)[] = [];
  vi.stubGlobal("document", doc);
  vi.stubGlobal("MediaRecorder", FakeRecorder);
  vi.stubGlobal("requestAnimationFrame", (cb: (t: number) => void) => frames.push(cb));
  vi.stubGlobal("cancelAnimationFrame", () => {});
  return {
    phases,
    recorders,
    loseContext,
    track,
    hide() {
      doc.hidden = true;
      doc.visibilityState = "hidden";
      for (const fn of listeners.get("visibilitychange") ?? []) fn();
    },
    listenerCount: () => listeners.get("visibilitychange")?.size ?? 0,
    /** Runs animation frames at `fps` from t = 1000 ms until `untilMs` of elapsed time. */
    pump(untilMs: number, fps = 60) {
      for (let t = 1000; t <= 1000 + untilMs; t += 1000 / fps) {
        const run = frames;
        frames = [];
        for (const cb of run) cb(t);
      }
    },
  };
}

describe("recordLoop", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("rejects when the tab is hidden", async () => {
    const browser = fakeBrowser();
    const done = recordLoop(SCENE, { speed: 1 }, 640, 360, 30);
    browser.pump(500);
    browser.hide();
    await expect(done).rejects.toThrow(new Error("Recording stopped: tab was hidden"));
    expect(browser.recorders[0]?.state).toBe("inactive");
    expect(browser.listenerCount()).toBe(0);
    expect(browser.track.stop).toHaveBeenCalled();
    expect(browser.loseContext).toHaveBeenCalled();
  });

  it("rejects at once when the tab is already hidden", async () => {
    const browser = fakeBrowser({ hidden: true });
    await expect(recordLoop(SCENE, { speed: 1 }, 640, 360, 30)).rejects.toThrow(new Error("Recording stopped: tab was hidden"));
    expect(browser.recorders).toHaveLength(0); // nothing created, so nothing to release
    expect(browser.loseContext).not.toHaveBeenCalled();
    expect(browser.listenerCount()).toBe(0);
  });

  it("releases the context when the recorder can't be created", async () => {
    const browser = fakeBrowser({ recorderThrows: true });
    await expect(recordLoop(SCENE, { speed: 1 }, 640, 360, 30)).rejects.toThrow("recorder failed");
    expect(browser.track.stop).toHaveBeenCalled();
    expect(browser.loseContext).toHaveBeenCalled();
    expect(browser.listenerCount()).toBe(0);
  });

  it("fails cleanly when recorder.start throws inside a frame", async () => {
    const browser = fakeBrowser();
    const done = recordLoop(SCENE, { speed: 1 }, 640, 360, 30);
    browser.recorders[0]!.start = () => {
      throw new Error("start failed");
    };
    browser.pump(100);
    await expect(done).rejects.toThrow("start failed");
    expect(browser.track.stop).toHaveBeenCalled();
    expect(browser.loseContext).toHaveBeenCalled();
    expect(browser.listenerCount()).toBe(0);
  });

  it("fails cleanly on a recorder error", async () => {
    const browser = fakeBrowser();
    const done = recordLoop(SCENE, { speed: 1 }, 640, 360, 30);
    browser.pump(500);
    browser.recorders[0]!.onerror?.(new Event("error"));
    await expect(done).rejects.toThrow("Recording failed");
    expect(browser.recorders[0]?.state).toBe("inactive");
    expect(browser.loseContext).toHaveBeenCalled();
  });

  it("rejects with an AbortError when aborted mid-recording", async () => {
    const browser = fakeBrowser();
    const ctrl = new AbortController();
    const done = recordLoop(SCENE, { speed: 1 }, 640, 360, 30, undefined, ctrl.signal);
    browser.pump(500);
    ctrl.abort();
    await expect(done).rejects.toMatchObject({ name: "AbortError" });
    expect(browser.recorders[0]?.state).toBe("inactive");
    expect(browser.track.stop).toHaveBeenCalled();
    expect(browser.loseContext).toHaveBeenCalled();
    expect(browser.listenerCount()).toBe(0);
    const framesBefore = browser.phases.length;
    browser.pump(1000);
    expect(browser.phases.length).toBe(framesBefore);
  });

  it("rejects at once with an already-aborted signal", async () => {
    const browser = fakeBrowser();
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(recordLoop(SCENE, { speed: 1 }, 640, 360, 30, undefined, ctrl.signal)).rejects.toMatchObject({ name: "AbortError" });
    expect(browser.recorders).toHaveLength(0);
  });

  it("records exactly one effective loop length", async () => {
    const browser = fakeBrowser();
    const progress: number[] = [];
    // speed 2 halves the 10 s loop
    const done = recordLoop(SCENE, { speed: 2 }, 640, 360, 30, (s) => progress.push(s));
    browser.pump(6000);
    const { blob, ext } = await done;
    expect(ext).toBe("webm");
    expect(blob.type).toBe("video/webm;codecs=vp9");
    expect(browser.phases[0]).toBe(0);
    expect(Math.max(...browser.phases)).toBeLessThan(1);
    expect(Math.max(...browser.phases)).toBeGreaterThan(0.98);
    expect(progress.at(-1)).toBe(5);
    expect(browser.listenerCount()).toBe(0);
  });

  it("draws at most fps frames per second", async () => {
    const browser = fakeBrowser();
    const done = recordLoop(SCENE, { speed: 2 }, 640, 360, 30);
    browser.pump(6000, 60);
    await done;
    expect(browser.phases.length).toBeGreaterThanOrEqual(149);
    expect(browser.phases.length).toBeLessThanOrEqual(151);
  });
});
