"use client";

import { useEffect, useRef, useState } from "react";

/** A dashed guide drawn over the preview, in canvas pixels. */
export interface PreviewZone {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
}

interface Props {
  svg: string;
  w: number;
  h: number;
  busy?: boolean;
  zones?: readonly PreviewZone[];
}

/** Shows the full-size SVG inline, scaled to fit the stage while keeping its aspect ratio. */
export function Preview({ svg, w, h, busy, zones }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const cs = getComputedStyle(el);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      // CSS can set --preview-vh (a fraction of the viewport height), e.g. for the pinned studio preview on phones.
      const vh = parseFloat(cs.getPropertyValue("--preview-vh")) || (window.innerWidth < 760 ? 0.6 : 0.68);
      setBox({ w: el.clientWidth - padX, h: window.innerHeight * vh });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fit to the stage width and ~2/3 of the viewport height.
  const scale = Math.min((box.w || 320) / w, Math.max(200, box.h || 560) / h);
  const dw = Math.max(1, Math.floor(w * scale));
  const dh = Math.max(1, Math.floor(h * scale));

  return (
    <div className="preview-wrap" ref={wrap}>
      <div
        className="preview"
        data-busy={busy ? "true" : "false"}
        style={{ width: dw, height: dh }}
        role="img"
        aria-label={`Wallpaper preview, ${w} by ${h} pixels`}
      >
        <div className="preview-art" dangerouslySetInnerHTML={{ __html: svg }} />
        {zones?.map((z, i) => (
          <div
            key={i}
            className="preview-zone"
            aria-hidden="true"
            style={{ left: `${(z.x / w) * 100}%`, top: `${(z.y / h) * 100}%`, width: `${(z.w / w) * 100}%`, height: `${(z.h / h) * 100}%` }}
          >
            {z.label && <span>{z.label}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
