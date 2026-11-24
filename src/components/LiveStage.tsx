"use client";

import { useEffect, useRef, useState } from "react";
import type { Params } from "@/generators/types";
import { pointerToMouse } from "@/live/loop";
import { createLivePlayer, type LivePlayer } from "@/live/player";
import type { AnyLiveScene } from "@/live/types";

interface Props {
  scene: AnyLiveScene;
  /** Preset id, for the poster shown when the scene can't play. */
  preset: string;
  params: Params;
  /** The target screen; the stage keeps its aspect ratio. */
  w: number;
  h: number;
}

/**
 * Plays a live scene in a stage sized to the device's aspect ratio (fit like Preview).
 * The player is created once per scene; param edits only rebind uniforms, so nothing recompiles.
 * Without WebGL2, or if the GPU context is lost, it shows the preset's poster instead.
 */
export function LiveStage({ scene, preset, params, w, h }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reducedRef.current = reduced;
    const player = createLivePlayer(canvas, scene, paramsRef.current, { reducedMotion: reduced });
    if (!player) {
      setFailed(true);
      return;
    }
    setFailed(false);
    playerRef.current = player;
    const onLost = () => setFailed(true);
    canvas.addEventListener("lost", onLost);
    player.start();
    return () => {
      canvas.removeEventListener("lost", onLost);
      player.dispose();
      playerRef.current = null;
    };
  }, [scene]);

  useEffect(() => {
    paramsRef.current = params;
    playerRef.current?.setParams(params);
  }, [params]);

  // Fit to the stage width and ~2/3 of the viewport height, as Preview does.
  const scale = Math.min((box.w || 320) / w, Math.max(200, box.h || 560) / h);
  const dw = Math.max(1, Math.floor(w * scale));
  const dh = Math.max(1, Math.floor(h * scale));

  // A resize clears the canvas; with reduced motion nothing else would redraw it.
  useEffect(() => {
    if (reducedRef.current) playerRef.current?.renderFrame(0);
  }, [dw, dh]);

  const poster = `/live/${scene.id}/${preset}${h > w ? "-phone" : ""}.jpg`;

  return (
    <div className="preview-wrap live-stage" ref={wrap}>
      <div
        className="preview"
        style={{ width: dw, height: dh }}
        role="img"
        aria-label={`${scene.name} live wallpaper, ${w} by ${h} pixels`}
        onPointerMove={(e) => {
          const [x, y] = pointerToMouse(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
          playerRef.current?.setMouse(x, y);
        }}
        onPointerLeave={() => playerRef.current?.setMouse(0, 0)}
      >
        <canvas ref={canvasRef} hidden={failed} />
        {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size poster from /public, no optimisation needed */}
        {failed && <img src={poster} alt="" />}
      </div>
      {failed && <p className="live-fallback">This browser can&apos;t play live wallpapers. Here&apos;s a still.</p>}
    </div>
  );
}
