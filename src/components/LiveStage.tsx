"use client";

import { useEffect, useRef, useState } from "react";
import type { Params } from "@/generators/types";
import { pointerToMouse } from "@/live/loop";
import { createLivePlayer, loseContext, type LivePlayer } from "@/live/player";
import { posterPath } from "@/live/poster";
import type { AnyLiveScene } from "@/live/types";
import { cssFit } from "./Preview";

interface Props {
  scene: AnyLiveScene;
  /** Preset id, for the poster shown when the scene can't play. */
  preset: string;
  params: Params;
  /** The target screen; the stage keeps its aspect ratio. */
  w: number;
  h: number;
  /** Frame-rate cap. Changing it restarts the player. */
  fps?: 30 | 60;
}

/**
 * Plays a live scene in a stage sized to the device's aspect ratio (fit like Preview).
 * The player is created once per scene and frame rate; param edits only rebind uniforms, so nothing recompiles.
 * Without WebGL2, or if the GPU context is lost, it shows the preset's poster instead.
 */
export function LiveStage({ scene, preset, params, w, h, fps = 30 }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const playerRef = useRef<LivePlayer | null>(null);
  const paramsRef = useRef(params);
  const reducedRef = useRef(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const cs = getComputedStyle(el);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const vh = parseFloat(cs.getPropertyValue("--preview-vh")) || (window.innerWidth < 760 ? 0.6 : 0.68);
      setBox({ w: el.clientWidth - padX, h: window.innerHeight * vh });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reducedRef.current = reduced;
    // A fresh canvas per player, so losing the old context on cleanup never breaks the next player
    // (a frame-rate change, or StrictMode's dev remount). In the stage before the player starts, so it sizes to it.
    const canvas = document.createElement("canvas");
    el.prepend(canvas);
    const player = createLivePlayer(canvas, scene, paramsRef.current, { reducedMotion: reduced, fps });
    if (!player) {
      canvas.remove();
      setFailed(true);
      return;
    }
    setFailed(false);
    playerRef.current = player;
    let lost = false;
    const onLost = () => {
      lost = true;
      canvas.hidden = true;
      setFailed(true);
    };
    canvas.addEventListener("lost", onLost);
    // Start after the first paint, and run only while the stage is on screen, so loading the page
    // and scrolling past the player don't compete with the render loop.
    let onScreen = true;
    let ready = false;
    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(([entry]) => {
            onScreen = entry?.isIntersecting ?? true;
            if (ready) (onScreen ? player.start() : player.stop());
          })
        : null;
    io?.observe(el);
    let timer = 0;
    const frame = requestAnimationFrame(() => {
      timer = window.setTimeout(() => {
        ready = true;
        if (onScreen) player.start();
      }, 0);
    });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      io?.disconnect();
      canvas.removeEventListener("lost", onLost);
      player.dispose();
      if (!lost) loseContext(player.gl); // free the GPU context now, not when the canvas is collected
      canvas.remove();
      playerRef.current = null;
    };
  }, [scene, fps]);

  useEffect(() => {
    paramsRef.current = params;
    playerRef.current?.setParams(params);
  }, [params]);

  // Fit to the stage width and ~2/3 of the viewport height, as Preview does.
  const scale = Math.min((box.w || 320) / w, Math.max(200, box.h || 560) / h);
  const dw = Math.max(1, Math.floor(w * scale));
  const dh = Math.max(1, Math.floor(h * scale));
  const measured = box.w > 0;

  // A resize clears the canvas; with reduced motion nothing else would redraw it.
  useEffect(() => {
    if (reducedRef.current) playerRef.current?.renderFrame(0);
  }, [dw, dh]);

  const poster = posterPath(scene.id, preset, h > w);

  return (
    <div className="preview-wrap live-stage" ref={wrap}>
      <div
        className="preview"
        ref={stage}
        data-fit={measured ? undefined : "css"}
        style={measured ? { width: dw, height: dh } : cssFit(w, h)}
        role="img"
        aria-label={`${scene.name} live wallpaper, ${w} by ${h} pixels`}
        onPointerMove={(e) => {
          const [x, y] = pointerToMouse(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
          playerRef.current?.setMouse(x, y);
        }}
        onPointerLeave={() => playerRef.current?.setMouse(0, 0)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size poster from /public, no optimisation needed */}
        {failed && <img src={poster} alt="" />}
      </div>
      {failed && <p className="live-fallback">This browser can&apos;t play live wallpapers. Here&apos;s a still.</p>}
    </div>
  );
}
