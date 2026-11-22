"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getGenerator } from "@/generators";
import { HERO_DESK, HERO_PHONE, renderHeroLook, type HeroLook } from "@/lib/heroLooks";

const CYCLE_MS = 5200;

interface Props {
  looks: HeroLook[];
  /** The first look, rendered on the server so the hero isn't empty before hydration. */
  first: { desk: string; phone: string };
}

/**
 * The hero's laptop and phone, cycling through real generated wallpapers. Each look is
 * rendered only when it's about to show; the auto-advance pauses on hover, on focus, while
 * the tab is hidden, and never starts for visitors who prefer reduced motion.
 */
export function HeroShowcase({ looks, first }: Props) {
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [playing, setPlaying] = useState(true);
  const [held, setHeld] = useState(false);
  // The next look is drawn ahead of time, but only once the browser is idle after hydration.
  const [ready, setReady] = useState(false);
  const cache = useRef(new Map<number, { desk: string; phone: string }>([[0, first]]));

  const art = useCallback(
    (i: number) => {
      let hit = cache.current.get(i);
      if (!hit) {
        const look = looks[i]!;
        hit = { desk: renderHeroLook(look, HERO_DESK, `hd${i}`), phone: renderHeroLook(look, HERO_PHONE, `hp${i}`) };
        cache.current.set(i, hit);
      }
      return hit;
    },
    [looks],
  );

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 400));
    idle(() => setReady(true));
    const onVis = () => setHeld(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const next = (active + 1) % looks.length;
  const show = useCallback(
    (i: number) => {
      if (i === active) return;
      setPrev(active);
      setActive(i);
    },
    [active],
  );

  const running = playing && !held;
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => show((active + 1) % looks.length), CYCLE_MS);
    return () => clearTimeout(t);
  }, [running, active, looks.length, show]);

  // Draw the previous look (fading out), the current one and the next one (ready to fade in).
  const mounted = [...new Set([prev, active, ready ? next : null].filter((i): i is number => i !== null))].sort((a, b) => a - b);
  const look = looks[active]!;
  const g = getGenerator(look.gen);
  const presetTitle = g?.presets.find((p) => p.id === look.preset)?.title ?? look.preset;

  return (
    <div
      className="showcase"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHeld(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHeld(false);
      }}
    >
      <div className="devices" aria-hidden="true">
        <div className="device laptop">
          <div className="screen">
            {mounted.map((i) => (
              <div key={i} className="layer" data-active={i === active} dangerouslySetInnerHTML={{ __html: art(i).desk }} />
            ))}
          </div>
          <div className="laptop-base" />
        </div>
        <div className="device phone">
          <div className="screen">
            {mounted.map((i) => (
              <div key={i} className="layer" data-active={i === active} dangerouslySetInnerHTML={{ __html: art(i).phone }} />
            ))}
          </div>
        </div>
      </div>

      <div className="showcase-bar">
        <p className="now-showing" aria-live={running ? "off" : "polite"}>
          <span className="ns-gen">{g?.name ?? look.gen}</span>
          <span className="ns-preset">{presetTitle}</span>
        </p>
        <div className="look-dots" role="group" aria-label="Pick a look">
          {looks.map((l, i) => {
            const name = getGenerator(l.gen)?.name ?? l.gen;
            return (
              <button
                key={`${l.gen}-${l.preset}`}
                type="button"
                className="look-dot"
                aria-pressed={i === active}
                aria-label={`Show ${name}`}
                title={name}
                onClick={() => show(i)}
              >
                {i === active && running && <i key={active} className="look-progress" style={{ animationDuration: `${CYCLE_MS}ms` }} />}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="icon-btn showcase-play"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause the slideshow" : "Play the slideshow"}
          title={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
              <rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor" />
              <rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill="currentColor" />
            </svg>
          )}
        </button>
        <Link className="showcase-open" href={`/studio?g=${look.gen}&p=${look.preset}`}>
          Open this one
        </Link>
      </div>
    </div>
  );
}
