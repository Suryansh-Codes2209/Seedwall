"use client";

import { useId, useMemo, useState } from "react";
import { CUSTOM_LIMITS, DEVICES, clampDimension, getDevice } from "@/config/devices";
import { getGenerator, renderWallpaper, type Params } from "@/generators";
import { SAFE_AREA } from "@/generators/shared/safeArea";
import { scopeSvgIds } from "@/lib/scopeSvg";
import { useDebounced } from "@/lib/useDebounced";
import { SPAN_LIMITS, clampGap, combinedFits, quoteNearGap, spanLayout, type SpanAlign, type SpanLayout, type SpanMonitor } from "@/lib/span";

const DESKTOPS = DEVICES.filter((d) => d.kind === "desktop");
const SIDE = { 2: ["Left", "Right"], 3: ["Left", "Middle", "Right"] } as Record<number, string[]>;

interface Props {
  gen: string;
  params: Params;
  busy: boolean;
  onDownload: (layout: SpanLayout, params: Params, kind: "slices" | "wide") => void;
}

const preset = (id: string): SpanMonitor => {
  const d = getDevice(id)!;
  return { device: d.id, w: d.w, h: d.h };
};

/** "Span across monitors": arrange 2 or 3 monitors, preview the layout and download one image per screen. */
export function SpanPanel({ gen, params, busy, onDownload }: Props) {
  const id = useId();
  const [on, setOn] = useState(false);
  const [monitors, setMonitors] = useState<SpanMonitor[]>(() => [preset("1440p"), preset("1440p")]);
  const [gap, setGap] = useState(60);
  const [align, setAlign] = useState<SpanAlign>("center");

  // The safe area is for lock screens; a desktop span never uses it.
  const spanParams = useMemo(() => ({ ...params, [SAFE_AREA]: "off" }), [params]);
  const layout = useMemo(() => spanLayout(monitors, gap, align), [monitors, gap, align]);
  const mixedHeights = new Set(layout.slices.map((s) => s.h)).size > 1;
  const fits = combinedFits(layout);
  const splitQuote = params["text.none"] !== true && quoteNearGap(layout, String(params["text.position"] ?? "center"));

  const setCount = (n: number) =>
    setMonitors((ms) => (n > ms.length ? [...ms, ...Array.from({ length: n - ms.length }, () => ({ ...ms[ms.length - 1]! }))] : ms.slice(0, n)));
  const update = (i: number, m: SpanMonitor) => setMonitors((ms) => ms.map((x, j) => (j === i ? m : x)));
  const move = (i: number, by: number) =>
    setMonitors((ms) => {
      const j = i + by;
      if (j < 0 || j >= ms.length) return ms;
      const next = [...ms];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });

  return (
    <div className="span-panel">
      <label className="toggle" htmlFor={`${id}-on`}>
        Span across monitors
        <input id={`${id}-on`} type="checkbox" role="switch" checked={on} onChange={(e) => setOn(e.target.checked)} />
      </label>
      {!on ? (
        <small className="hint">One picture across two or three screens, lined up across the gaps between them.</small>
      ) : (
        <>
          <div className="field">
            <span className="field-row">Monitors</span>
            <div className="chips" role="group" aria-label="Number of monitors">
              {[2, 3].map((n) => (
                <button key={n} type="button" className="chip" aria-pressed={monitors.length === n} onClick={() => setCount(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {monitors.map((m, i) => (
            <MonitorRow
              key={i}
              label={SIDE[monitors.length]?.[i] ?? `Monitor ${i + 1}`}
              monitor={m}
              first={i === 0}
              last={i === monitors.length - 1}
              onChange={(x) => update(i, x)}
              onMove={(by) => move(i, by)}
            />
          ))}

          <div className="field">
            <label className="field-row" htmlFor={`${id}-gap`}>
              Gap between screens
              <output htmlFor={`${id}-gap`}>{clampGap(gap)} px</output>
            </label>
            <input
              id={`${id}-gap`}
              className="input"
              type="number"
              min={0}
              max={SPAN_LIMITS.maxGap}
              value={gap}
              onChange={(e) => setGap(clampGap(Number(e.target.value)))}
            />
            <small>Measure the bezels and the space between the screens, in pixels of the monitor next to them.</small>
          </div>

          {mixedHeights && (
            <div className="field">
              <label className="field-row" htmlFor={`${id}-align`}>Line them up at the</label>
              <select id={`${id}-align`} className="select" value={align} onChange={(e) => setAlign(e.target.value as SpanAlign)}>
                <option value="top">Top</option>
                <option value="center">Centre</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
          )}

          <SpanPreview gen={gen} params={spanParams} layout={layout} />
          <p className="span-dims">
            Canvas {layout.canvas.w}×{layout.canvas.h}, {monitors.length} images
          </p>
          {splitQuote && <p className="span-note">The quote lands on the gap between screens. Try a corner position, or turn text off.</p>}

          <button type="button" className="btn btn-sm btn-block" disabled={busy} onClick={() => onDownload(layout, spanParams, "slices")}>
            Download {monitors.length} screens (zip)
          </button>
          <button type="button" className="btn btn-sm btn-block" disabled={busy || !fits} onClick={() => onDownload(layout, spanParams, "wide")}>
            One wide image for Windows Span
          </button>
          <small className="hint">
            {fits
              ? `Set each screen's wallpaper to Fill. The wide image is ${layout.combined.w}×${layout.combined.h} with no gaps, for Windows' Span option.`
              : `The wide image would be ${layout.combined.w}×${layout.combined.h}, which is too big for a browser to draw. The per-screen zip still works.`}
          </small>
        </>
      )}
    </div>
  );
}

interface RowProps {
  label: string;
  monitor: SpanMonitor;
  first: boolean;
  last: boolean;
  onChange: (m: SpanMonitor) => void;
  onMove: (by: number) => void;
}

function MonitorRow({ label, monitor, first, last, onChange, onMove }: RowProps) {
  const id = useId();
  return (
    <div className="span-monitor">
      <div className="field-row">
        <label htmlFor={id}>{label}</label>
        <span className="span-move">
          <button type="button" className="btn btn-sm" disabled={first} aria-label={`Move ${label.toLowerCase()} screen left`} onClick={() => onMove(-1)}>
            ←
          </button>
          <button type="button" className="btn btn-sm" disabled={last} aria-label={`Move ${label.toLowerCase()} screen right`} onClick={() => onMove(1)}>
            →
          </button>
        </span>
      </div>
      <select
        id={id}
        className="select"
        value={monitor.device}
        onChange={(e) => {
          const d = getDevice(e.target.value);
          onChange(d ? { device: d.id, w: d.w, h: d.h } : { ...monitor, device: "custom" });
        }}
      >
        {DESKTOPS.map((d) => (
          <option key={d.id} value={d.id}>
            {d.label} ({d.w}×{d.h})
          </option>
        ))}
        <option value="custom">Custom size…</option>
      </select>
      {monitor.device === "custom" && (
        <div className="custom-size">
          <input
            className="input"
            type="number"
            aria-label={`${label} width in pixels`}
            min={CUSTOM_LIMITS.min}
            max={CUSTOM_LIMITS.max}
            value={monitor.w}
            onChange={(e) => onChange({ ...monitor, w: clampDimension(Number(e.target.value)) })}
          />
          <span aria-hidden="true">×</span>
          <input
            className="input"
            type="number"
            aria-label={`${label} height in pixels`}
            min={CUSTOM_LIMITS.min}
            max={CUSTOM_LIMITS.max}
            value={monitor.h}
            onChange={(e) => onChange({ ...monitor, h: clampDimension(Number(e.target.value)) })}
          />
        </div>
      )}
    </div>
  );
}

/** A small render of the whole canvas with each screen outlined and the gaps shaded. */
function SpanPreview({ gen, params, layout }: { gen: string; params: Params; layout: SpanLayout }) {
  const settled = useDebounced({ gen, params, layout }, 150);
  const { canvas } = settled.layout;
  const svg = useMemo(() => {
    const g = getGenerator(settled.gen);
    if (!g || !canvas.w) return "";
    const s = Math.min(1, 640 / canvas.w);
    return scopeSvgIds(renderWallpaper(g, settled.params, { w: Math.max(1, Math.round(canvas.w * s)), h: Math.max(1, Math.round(canvas.h * s)) }), "sp");
  }, [settled, canvas]);
  const W = layout.canvas.w;
  const H = layout.canvas.h;
  const holes = layout.slices.map((r) => `M${r.x} ${r.y}h${r.w}v${r.h}h${-r.w}Z`).join("");

  return (
    <div className="span-preview" style={{ aspectRatio: `${W} / ${H}` }} role="img" aria-label={`Layout preview: ${layout.slices.length} screens on a ${W} by ${H} canvas`}>
      <div className="span-art" dangerouslySetInnerHTML={{ __html: svg }} />
      <svg className="span-frames" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <path d={`M0 0H${W}V${H}H0Z${holes}`} fillRule="evenodd" fill="rgb(0 0 0 / 0.72)" />
        {layout.slices.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke="#fff" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
    </div>
  );
}
