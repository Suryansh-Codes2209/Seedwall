/**
 * Multi-monitor span: one big canvas as wide as all the monitors plus the bezel gaps between them,
 * so the picture lines up physically, then one slice per monitor (gap pixels dropped).
 *
 * The big canvas is only ever an SVG. Each slice is rasterised at its own monitor size, so the
 * per-monitor limit (CUSTOM_LIMITS, 8192 px) still holds and no giant canvas is needed. Only the
 * optional single wide image (for Windows "Span" mode) is drawn on one canvas, see combinedFits().
 */
import { clampDimension } from "@/config/devices";
import type { Size } from "@/generators";
import { seedwallName } from "./exportSet";

export type SpanAlign = "top" | "center" | "bottom";

export interface SpanMonitor {
  /** Desktop device id, or "custom". */
  device: string;
  w: number;
  h: number;
}

export interface Rect { x: number; y: number; w: number; h: number }

export interface SpanLayout {
  /** The full canvas, gaps included. */
  canvas: Size;
  /** Where each monitor sits on the canvas, left to right. */
  slices: Rect[];
  /** The single wide image for Windows "Span" mode: monitors side by side, no gaps. */
  combined: Size;
  /** Where each slice goes in the wide image. */
  placements: { x: number; y: number }[];
}

export const SPAN_LIMITS = {
  minMonitors: 2,
  maxMonitors: 3,
  maxGap: 2000,
  /** Browsers refuse canvases past these, so the wide image is skipped above them. */
  maxCombinedSide: 16384,
  maxCombinedPixels: 120_000_000,
} as const;

export const clampGap = (gap: number): number =>
  Number.isFinite(gap) ? Math.round(Math.min(SPAN_LIMITS.maxGap, Math.max(0, gap))) : 0;

const offset = (space: number, h: number, align: SpanAlign): number =>
  align === "top" ? 0 : align === "bottom" ? space - h : Math.floor((space - h) / 2);

export function spanLayout(monitors: readonly SpanMonitor[], gap: number, align: SpanAlign): SpanLayout {
  const g = clampGap(gap);
  const sizes = monitors.map((m) => ({ w: clampDimension(m.w), h: clampDimension(m.h) }));
  const H = Math.max(0, ...sizes.map((s) => s.h));
  const slices: Rect[] = [];
  const placements: { x: number; y: number }[] = [];
  let x = 0;
  let cx = 0;
  for (const s of sizes) {
    const y = offset(H, s.h, align);
    slices.push({ x, y, w: s.w, h: s.h });
    placements.push({ x: cx, y });
    x += s.w + g;
    cx += s.w;
  }
  return { canvas: { w: Math.max(0, x - g), h: H }, slices, combined: { w: cx, h: H }, placements };
}

/** Whether the single wide image fits in a browser canvas. */
export const combinedFits = (l: SpanLayout): boolean =>
  l.combined.w <= SPAN_LIMITS.maxCombinedSide && l.combined.h <= SPAN_LIMITS.maxCombinedSide && l.combined.w * l.combined.h <= SPAN_LIMITS.maxCombinedPixels;

/**
 * One monitor's part of the full canvas SVG. The original document is nested, shifted by the
 * slice offset, inside an SVG the size of the monitor. Nesting (rather than changing the viewBox)
 * keeps percentage-sized filters and masks resolving against the full canvas, exactly as before.
 */
export function cropSvg(svg: string, r: Rect): string {
  const end = svg.indexOf(">");
  if (!svg.startsWith("<svg") || end < 0) throw new Error("Not an SVG document");
  const root = svg.slice(0, end + 1);
  const width = /\swidth="([^"]+)"/.exec(root)?.[1];
  const height = /\sheight="([^"]+)"/.exec(root)?.[1];
  const viewBox = /\sviewBox="([^"]+)"/.exec(root)?.[1] ?? `0 0 ${width} ${height}`;
  const inner = `<svg x="${-r.x}" y="${-r.y}" width="${width}" height="${height}" viewBox="${viewBox}">`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${r.w}" height="${r.h}" viewBox="0 0 ${r.w} ${r.h}">${inner}${svg.slice(end + 1)}</svg>`;
}

const POSITION_NAMES = { 2: ["left", "right"], 3: ["left", "middle", "right"] } as Record<number, string[]>;

/** `seedwall-<generator>-<seed>-monitor-<n>-<left|middle|right>.<ext>` */
export function spanFilename(gen: string, seed: number | string, index: number, count: number, ext: string): string {
  const where = POSITION_NAMES[count]?.[index] ?? String(index + 1);
  return seedwallName(gen, seed, `monitor-${index + 1}-${where}`, ext);
}

/**
 * True when a horizontally centred quote would land on or near a bezel gap (for example with two
 * monitors), where it would be split between screens.
 */
export function quoteNearGap(l: SpanLayout, position: string): boolean {
  if (position.includes("-")) return false;
  const cx = l.canvas.w / 2;
  const margin = l.canvas.w * 0.08;
  for (let i = 0; i + 1 < l.slices.length; i++) {
    const a = l.slices[i]!;
    const b = l.slices[i + 1]!;
    if (cx > a.x + a.w - margin && cx < b.x + margin) return true;
  }
  return false;
}
