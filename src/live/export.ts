import type { Params } from "@/generators/types";
import { loopMultiplier, shouldDraw } from "./loop";
import { createLivePlayer, type LivePlayer } from "./player";
import type { AnyLiveScene } from "./types";

/** Fits w×h inside a maxSide square, keeping the aspect ratio. `scaled` says whether it had to shrink. */
export function clampExportSize(w: number, h: number, maxSide: number): { w: number; h: number; scaled: boolean } {
  const k = maxSide / Math.max(w, h);
  if (k >= 1) return { w, h, scaled: false };
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)), scaled: true };
}

const VIDEO_MIMES = [
  { mime: "video/mp4;codecs=avc1", ext: "mp4" },
  { mime: "video/mp4", ext: "mp4" },
  { mime: "video/webm;codecs=vp9", ext: "webm" },
  { mime: "video/webm", ext: "webm" },
] as const;

/** The first recordable video type, MP4 before WebM; null when the browser can record neither. */
export function pickVideoMime(isSupported: (m: string) => boolean): { mime: string; ext: "mp4" | "webm" } | null {
  const hit = VIDEO_MIMES.find((v) => isSupported(v.mime));
  return hit ? { mime: hit.mime, ext: hit.ext } : null;
}

/** The browser's recordable video type, or null without MediaRecorder. */
export function browserVideoMime(): { mime: string; ext: "mp4" | "webm" } | null {
  if (typeof MediaRecorder === "undefined") return null;
  return pickVideoMime((m) => MediaRecorder.isTypeSupported(m));
}

export function exportFileName(scene: string, preset: string, w: number, h: number, ext: string): string {
  return `seedwall-live-${scene}-${preset}-${w}x${h}.${ext}`;
}

let maxSide: number | undefined;

/** The largest render size this GPU allows (MAX_RENDERBUFFER_SIZE), read once from a throwaway context. */
export function exportMaxSide(): number {
  if (maxSide !== undefined) return maxSide;
  const gl = document.createElement("canvas").getContext("webgl2");
  maxSide = gl ? (gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number) : 4096;
  gl?.getExtension("WEBGL_lose_context")?.loseContext();
  return maxSide;
}

/** Seconds one loop really lasts: the scene's loop scaled by the speed multiplier the player uses. */
function effectiveLoopSeconds(scene: AnyLiveScene, params: Params): number {
  const s = Number(params.speed ?? scene.params.speed?.default ?? 1);
  return scene.loopSeconds * loopMultiplier(Number.isFinite(s) ? s : 1);
}

/**
 * A player on its own detached w×h canvas, so exporting never touches the on-screen player.
 * Its context has no preserveDrawingBuffer, so callers read the canvas in the same task as renderFrame.
 */
function exportPlayer(scene: AnyLiveScene, params: Params, w: number, h: number, fps: 30 | 60 = 30) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const player = createLivePlayer(canvas, scene, params, { scale: 1, mouse: false, fps });
  if (!player) throw new Error("This browser can't render live wallpapers");
  const release = (p: LivePlayer) => {
    p.dispose();
    p.gl.getExtension("WEBGL_lose_context")?.loseContext(); // free the context now, not at GC
  };
  return { canvas, player, release: () => release(player) };
}

/** One frame at `phase` as a w×h PNG. */
export function captureStill(scene: AnyLiveScene, params: Params, w: number, h: number, phase = 0): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let out: ReturnType<typeof exportPlayer>;
    try {
      out = exportPlayer(scene, params, w, h);
    } catch (e) {
      reject(e);
      return;
    }
    const { canvas, player, release } = out;
    player.renderFrame(phase);
    // toBlob copies the bitmap synchronously, before the drawing buffer is cleared.
    canvas.toBlob((blob) => {
      release();
      if (blob) resolve(blob);
      else reject(new Error("Couldn't encode the PNG"));
    }, "image/png");
  });
}

/**
 * Records exactly one effective loop as video. The phase follows the wall clock, capped at `fps`,
 * and recording stops when one loop has passed, so the file plays back seamlessly on repeat.
 * Rejects if the tab is hidden mid-recording (the browser stops animation frames).
 */
export function recordLoop(
  scene: AnyLiveScene,
  params: Params,
  w: number,
  h: number,
  fps: 30 | 60,
  onProgress?: (s: number) => void,
): Promise<{ blob: Blob; ext: string }> {
  return new Promise((resolve, reject) => {
    const type = browserVideoMime();
    if (!type) {
      reject(new Error("This browser can't record video"));
      return;
    }
    let out: ReturnType<typeof exportPlayer>;
    try {
      out = exportPlayer(scene, params, w, h, fps);
    } catch (e) {
      reject(e);
      return;
    }
    const { canvas, player, release } = out;
    const loopSeconds = effectiveLoopSeconds(scene, params);
    const loopMs = loopSeconds * 1000;

    // Frames are pushed by hand right after each draw, in the same task, so each one is captured.
    const stream = canvas.captureStream(0);
    const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined;
    const recorder = new MediaRecorder(stream, {
      mimeType: type.mime,
      videoBitsPerSecond: Math.round(Math.min(40_000_000, Math.max(4_000_000, w * h * fps * 0.12))),
    });
    const chunks: Blob[] = [];
    let raf = 0;
    let t0: number | null = null;
    let last = -Infinity;
    let finished = false;

    const cleanup = () => {
      finished = true;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      for (const t of stream.getTracks()) t.stop();
      release();
    };
    const onVisibility = () => {
      if (document.visibilityState !== "hidden" || finished) return;
      recorder.onstop = null;
      if (recorder.state !== "inactive") recorder.stop();
      cleanup();
      reject(new Error("Recording stopped: tab was hidden"));
    };

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      cleanup();
      onProgress?.(loopSeconds);
      resolve({ blob: new Blob(chunks, { type: recorder.mimeType || type.mime }), ext: type.ext });
    };

    const frame = (now: number) => {
      if (finished) return;
      if (t0 === null) {
        t0 = now;
        recorder.start();
      }
      const elapsed = now - t0;
      if (elapsed >= loopMs) {
        // Phase 1 is phase 0 again: stop before drawing it, so the loop joins without a repeat.
        finished = true;
        recorder.stop();
        return;
      }
      raf = requestAnimationFrame(frame);
      if (!shouldDraw(now, last, fps)) return;
      last = now;
      player.renderFrame(elapsed / loopMs);
      track?.requestFrame();
      onProgress?.(elapsed / 1000);
    };

    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(frame);
  });
}
