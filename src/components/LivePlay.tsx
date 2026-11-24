"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LIVE_SCENES, getLiveScene, resolveLiveParams } from "@/live";
import { pointerToMouse } from "@/live/loop";
import { createLivePlayer, type LivePlayer } from "@/live/player";
import { posterPath } from "@/live/poster";
import { decodeLiveState, decodePlayOptions } from "@/lib/liveState";

/** What the Mac app drives through evaluateJavaScript. */
export interface SeedwallLiveControl {
  /** Pointer in −1…1 (x right, y up, 0 at centre), passed straight to the player. */
  setMouse(x: number, y: number): void;
  pause(): void;
  resume(): void;
  /** True once the first frame (or the poster) is on screen. */
  ready: boolean;
}

declare global {
  interface Window {
    seedwallLive?: SeedwallLiveControl;
  }
}

/** The full-viewport player on /live/[id]/play. It covers the site chrome and hides page scrolling. */
export function LivePlay({ sceneId }: { sceneId: string }) {
  const search = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [poster, setPoster] = useState<string | null>(null);
  const query = search.toString();

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const q = new URLSearchParams(query);
    const state = decodeLiveState(sceneId, q);
    const scene = getLiveScene(state.scene) ?? LIVE_SCENES[0]!;
    const opts = decodePlayOptions(q);
    const posterUrl = posterPath(scene.id, state.preset, window.innerHeight > window.innerWidth);

    let player: LivePlayer | null = null;
    let raf = 0;
    const control: SeedwallLiveControl = {
      setMouse: (x, y) => player?.setMouse(x, y),
      pause: () => player?.stop(),
      resume: () => player?.start(),
      ready: false,
    };
    window.seedwallLive = control;

    const showPoster = () => {
      player?.dispose();
      player = null;
      setPoster(posterUrl);
    };

    // Reduced motion: the poster, still. Never start the animation loop.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      showPoster();
    } else {
      player = createLivePlayer(canvas, scene, resolveLiveParams(scene, state.preset, state.overrides), {
        fps: opts.fps,
        scale: opts.scale,
        mouse: scene.mouse,
      });
      if (!player) showPoster();
      else {
        setPoster(null);
        player.start();
        // Queued after the player's first tick in the same frame, so that frame has been drawn.
        raf = requestAnimationFrame(() => {
          control.ready = true;
        });
      }
    }

    const onLost = () => showPoster();
    canvas.addEventListener("lost", onLost);
    const onPointer = (e: PointerEvent) =>
      player?.setMouse(...pointerToMouse(e.clientX, e.clientY, { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }));
    if (opts.pointer) window.addEventListener("pointermove", onPointer);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("lost", onLost);
      window.removeEventListener("pointermove", onPointer);
      player?.dispose();
      if (window.seedwallLive === control) delete window.seedwallLive;
    };
  }, [sceneId, query]);

  return (
    <div className="live-play">
      <canvas ref={canvasRef} hidden={poster !== null} />
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element -- a fixed-size poster from /public, no optimisation needed
        <img
          src={poster}
          alt=""
          onLoad={() => {
            if (window.seedwallLive) window.seedwallLive.ready = true;
          }}
        />
      )}
    </div>
  );
}
