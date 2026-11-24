"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LIVE_SCENES, resolveLiveParams } from "@/live";
import { createLivePlayer } from "@/live/player";
import { createSharedPlayer, type SharedPlayer } from "@/live/shared";

/**
 * The /live grid. Every card shows its poster; one shared canvas moves into whichever card is
 * hovered or focused (on touch screens, the card in the middle of the viewport) and plays it there,
 * so the page never holds more than one WebGL context. Under reduced motion the posters stay still.
 */
export function LiveGrid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sharedRef = useRef<SharedPlayer | null>(null);
  const slots = useRef(new Map<string, HTMLDivElement>());
  const cards = useRef(new Map<string, HTMLAnchorElement>());
  const activeRef = useRef<string | null>(null);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvasRef.current = canvas;
    const shared = createSharedPlayer((scene, params) => createLivePlayer(canvas, scene, params, { fps: 30, mouse: false }));
    sharedRef.current = shared;
    // A lost GPU context ends the animation for this visit; the posters carry on.
    const onLost = () => {
      shared.dispose();
      sharedRef.current = null;
      canvas.remove();
      activeRef.current = null;
      setActive(null);
    };
    canvas.addEventListener("lost", onLost);
    return () => {
      canvas.removeEventListener("lost", onLost);
      shared.dispose();
      canvas.remove();
      sharedRef.current = null;
      canvasRef.current = null;
      activeRef.current = null;
    };
  }, []);

  const activate = useCallback((id: string) => {
    const shared = sharedRef.current;
    const canvas = canvasRef.current;
    const slot = slots.current.get(id);
    const scene = LIVE_SCENES.find((s) => s.id === id);
    if (!shared || !canvas || !slot || !scene || activeRef.current === id) return;
    shared.hide();
    // In the card before the player starts, so it sizes the canvas to the card.
    slot.appendChild(canvas);
    if (shared.show(scene, resolveLiveParams(scene, scene.presets[0]?.id))) {
      activeRef.current = id;
      setActive(id);
    } else {
      canvas.remove();
    }
  }, []);

  const deactivate = useCallback((id: string) => {
    if (activeRef.current !== id) return;
    sharedRef.current?.hide();
    canvasRef.current?.remove();
    activeRef.current = null;
    setActive(null);
  }, []);

  // Touch screens have no hover: play the card nearest the middle of the viewport.
  useEffect(() => {
    if (!window.matchMedia("(hover: none)").matches || !("IntersectionObserver" in window)) return;
    const ids = new Map<Element, string>();
    for (const [id, el] of cards.current) ids.set(el, id);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = ids.get(e.target);
          if (!id) continue;
          if (e.isIntersecting) activate(id);
          else deactivate(id);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const el of ids.keys()) io.observe(el);
    return () => io.disconnect();
  }, [activate, deactivate]);

  return (
    <div className="grid-cards live-grid">
      {LIVE_SCENES.map((scene) => {
        const preset = scene.presets[0]?.id ?? "";
        return (
          <Link
            key={scene.id}
            href={`/live/${scene.id}`}
            className="card live-card"
            data-playing={active === scene.id}
            ref={(el) => {
              if (el) cards.current.set(scene.id, el);
              else cards.current.delete(scene.id);
            }}
            onPointerEnter={(e) => e.pointerType !== "touch" && activate(scene.id)}
            onPointerLeave={(e) => e.pointerType !== "touch" && deactivate(scene.id)}
            onFocus={() => activate(scene.id)}
            onBlur={() => deactivate(scene.id)}
          >
            <div className="card-media">
              {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size poster from /public, no optimisation needed */}
              <img src={`/live/${scene.id}/${preset}.jpg`} alt={`${scene.name} live wallpaper`} loading="lazy" width={1920} height={1080} />
              <div
                className="live-card-slot"
                ref={(el) => {
                  if (el) slots.current.set(scene.id, el);
                  else slots.current.delete(scene.id);
                }}
              />
            </div>
            <div className="card-body">
              <h3>{scene.name}</h3>
              <p>{scene.description}</p>
              <div className="card-meta">
                <span className="tag">{scene.loopSeconds}s loop</span>
                <span className="tag">{scene.presets.length} presets</span>
                {scene.mouse && <span className="tag">follows the pointer</span>}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
