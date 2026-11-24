"use client";

import { useEffect, useRef } from "react";
import { getLiveScene, resolveLiveParams } from "@/live";
import { createLivePlayer } from "@/live/player";

declare global {
  interface Window {
    /** Set once the frame is drawn: `true`, or `"error:<log>"` when the scene can't render. */
    __liveReady?: true | string;
    /** Redraws the frame and reads it back as a PNG data URL in the same task (no preserveDrawingBuffer needed). */
    __liveCapture?: () => string;
  }
}

interface Props {
  sceneId: string;
  presetId?: string;
  w: number;
  h: number;
  phase: number;
}

/** Draws one frame of a live scene at exactly w×h device pixels, pinned over the page chrome. */
export function LiveHarness({ sceneId, presetId, w, h, phase }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    window.__liveReady = undefined;
    const scene = getLiveScene(sceneId);
    if (!scene) {
      window.__liveReady = `error:unknown scene "${sceneId}"`;
      return;
    }
    if (presetId && !scene.presets.some((p) => p.id === presetId)) {
      window.__liveReady = `error:unknown preset "${presetId}" for ${sceneId}`;
      return;
    }

    // The player reports compile and link logs through console.error; keep them for the error string.
    const logs: string[] = [];
    const consoleError = console.error;
    console.error = (...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
      consoleError(...args);
    };
    let player: ReturnType<typeof createLivePlayer>;
    try {
      player = createLivePlayer(canvas, scene, resolveLiveParams(scene, presetId), { scale: 1, mouse: false });
    } finally {
      console.error = consoleError;
    }
    if (!player) {
      window.__liveReady = `error:${logs.join("\n") || "WebGL2 is unavailable"}`;
      return;
    }

    const live = player;
    live.renderFrame(phase);
    const glError = live.gl.getError();
    if (glError !== live.gl.NO_ERROR) {
      window.__liveReady = `error:GL error 0x${glError.toString(16)} after drawing`;
      return () => live.dispose();
    }
    window.__liveCapture = () => {
      live.renderFrame(phase);
      return canvas.toDataURL("image/png");
    };
    window.__liveReady = true;
    return () => {
      delete window.__liveCapture;
      live.dispose();
    };
  }, [sceneId, presetId, w, h, phase]);

  return (
    <canvas
      ref={ref}
      width={w}
      height={h}
      style={{ position: "fixed", left: 0, top: 0, width: w, height: h, zIndex: 2147483647, display: "block" }}
    />
  );
}
