import type { Size } from "../types";
import { mix } from "./color";
import { range } from "./rng";
import { esc } from "./svg";

/**
 * Palette-knife strokes, shared by the Impasto generator and the photo painter.
 *
 * Each pass lays a jittered, shuffled grid of strokes. The caller decides each stroke's colour,
 * angle and relief (or skips it); this module draws the knife shape: a crisp, skewed leading edge,
 * a ragged tail, a ridge that splits it into a lit face and a shadowed face, a specular glint,
 * a cast shadow, drag grooves and a paint lip. Plain filled and stroked paths only, so browsers
 * and resvg render the same thing.
 */

export type Pt = readonly [number, number];

export interface KnifePass {
  /** Stroke length, width and grid spacing, in px. */
  len: number;
  wid: number;
  step: number;
  /** Random angle spread, in radians either side. */
  jitter: number;
  /** Below 0.5 the strokes are flat (an underpainting); otherwise this scales the relief. */
  relief: number;
}

export interface KnifeSpot {
  color: string;
  ang: number;
  /** Multiplies the overall relief for this stroke (e.g. calmer behind text). */
  relief: number;
  /** Multiplies this stroke's length and width (e.g. a smaller knife on fine detail). */
  scale?: number;
}

export interface KnifeOptions {
  size: Size;
  rng: () => number;
  passes: readonly KnifePass[];
  /** The stroke at (x, y) in pass `i`, or null to skip it. Called in paint order; may use rng. */
  spot: (x: number, y: number, pass: KnifePass, i: number) => KnifeSpot | null;
  /** Overall paint thickness, 0..1. */
  relief: number;
  /** -1 light from the top left, 0 from above, +1 from the top right. */
  side: number;
  /** Colours highlights and shadows lean toward. */
  hiTint: string;
  loTint: string;
  /** Coordinate rounding step in px. */
  q: number;
}

/**
 * Path with relative segments. Points are rounded to `q` first so nothing drifts
 * (0.1 px on small canvases, whole pixels on big ones keeps exports lean).
 */
export function polyD(pts: readonly Pt[], close: boolean, q: number): string {
  const r = (v: number): number => Math.round(v / q) * q;
  const s = (v: number): string => String(Math.round(v * 10) / 10);
  const pr = pts.map(([x, y]) => [r(x), r(y)] as const);
  let d = `M${s(pr[0]![0])} ${s(pr[0]![1])}`;
  for (let i = 1; i < pr.length; i++) d += `l${s(pr[i]![0] - pr[i - 1]![0])} ${s(pr[i]![1] - pr[i - 1]![1])}`;
  return close ? d + "z" : d;
}

const f1 = (v: number): string => String(Math.round(v * 10) / 10);

/** Rounding step for a canvas: whole pixels once a unit (1% of the short side) is ≥ 8 px. */
export const knifePrecision = (size: Size): number => (Math.min(size.w, size.h) / 100 >= 8 ? 1 : 0.1);

/** Paint every pass. Returns a `<g>` of paths. */
export function paintKnife(o: KnifeOptions): string {
  const { size, rng, q, side } = o;
  // Light direction in screen space (y down). Edges facing it get the highlight.
  const lAng = side < 0 ? -Math.PI * 0.7 : side > 0 ? -Math.PI * 0.3 : -Math.PI / 2;
  const lx = Math.cos(lAng);
  const ly = Math.sin(lAng);
  const out: string[] = [];

  o.passes.forEach((pass, pi) => {
    const step = pass.step;
    const spots: [number, number][] = [];
    for (let y = -step / 2; y < size.h + step; y += step)
      for (let x = -step / 2; x < size.w + step; x += step) spots.push([x + (rng() - 0.5) * step, y + (rng() - 0.5) * step]);
    // Shuffle so overlaps don't read as rows.
    for (let i = spots.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = spots[i]!;
      spots[i] = spots[j]!;
      spots[j] = t;
    }

    for (const [x, y] of spots) {
      const s = o.spot(x, y, pass, pi);
      if (!s) continue;
      const c = s.color;

      const ang = s.ang + (rng() - 0.5) * pass.jitter * 2 + (rng() < 0.5 ? Math.PI : 0);
      const dx = Math.cos(ang), dy = Math.sin(ang);
      const nx = -dy, ny = dx;
      const sc = s.scale ?? 1;
      const L = pass.len * sc * range(rng, 0.55, 1.5);
      const Wd = pass.wid * sc * range(rng, 0.65, 1.35);
      const hl = L / 2, hw = Wd / 2;
      const P = (along: number, across: number): Pt => [x + dx * along + nx * across, y + dy * along + ny * across];
      const wob = (): number => (rng() - 0.5) * 0.16 * Wd;
      const skew = (rng() - 0.5) * 0.6 * Wd;

      // Knife stroke: crisp, skewed leading edge (+along), ragged thinning tail (-along).
      const tail = [-hl + (rng() - 0.2) * 0.25 * L, -hl + (rng() - 0.2) * 0.25 * L] as const;
      const A = [P(tail[0], -hw * 0.8), P(-hl / 3, -hw + wob()), P(hl / 3, -hw + wob()), P(hl + skew, -hw)];
      const B = [P(tail[1], hw * 0.7), P(-hl / 3, hw + wob()), P(hl / 3, hw + wob()), P(hl - skew, hw)];

      if (pass.relief < 0.5) {
        out.push(`<path d="${polyD([...A, ...[...B].reverse()], true, q)}" fill="${esc(c)}"/>`);
        continue;
      }
      const relief = o.relief * pass.relief * s.relief;
      const facing = nx * lx + ny * ly; // > 0 → the +across edge (B) faces the light
      const strength = 0.35 + 0.65 * Math.abs(facing);
      // The knife leaves a ridge, set a little toward the lit side, so the stroke has two faces.
      const sgn = facing > 0 ? 1 : -1;
      const rt = sgn * hw * range(rng, 0.05, 0.35);
      const ridge = [P((tail[0] + tail[1]) / 2, rt * 0.5), P(-hl / 3, rt + wob() * 0.5), P(hl / 3, rt + wob() * 0.5), P(hl, rt * 0.6)];
      const [litEdge, darkEdge] = facing > 0 ? [B, A] : [A, B];
      const litC = mix(c, o.hiTint, 0.06 + 0.22 * relief * strength);
      const darkC = mix(c, o.loTint, 0.05 + 0.3 * relief * strength);
      // Dark face first (overlapping the ridge a touch so no seam shows), then the lit face.
      const ov = sgn * hw * 0.08;
      const ridgeBack = [...ridge].reverse();
      out.push(`<path d="${polyD([...darkEdge, ...ridgeBack.map((pt): Pt => [pt[0] + nx * ov, pt[1] + ny * ov])], true, q)}" fill="${esc(darkC)}"/>`);
      out.push(`<path d="${polyD([...litEdge, ...ridgeBack], true, q)}" fill="${esc(litC)}"/>`);
      if (relief <= 0.05) continue;

      // Specular glint along part of the ridge, as wet paint catches the light.
      if (rng() < 0.25 + 0.6 * relief * strength) {
        const a0 = range(rng, -0.6, 0.1), a1 = a0 + range(rng, 0.25, 0.7);
        const t0 = rt + sgn * hw * 0.12;
        out.push(`<path d="${polyD([P(hl * a0, t0), P(hl * a1, t0 + wob() * 0.4)], false, q)}" stroke="${esc(mix(c, o.hiTint, 0.45 + 0.4 * relief))}" stroke-width="${f1(Math.max(0.5, Wd * 0.07))}" stroke-opacity="${f1(0.35 + 0.5 * relief * strength)}"/>`);
      }

      // Cast shadow outside the far edge, a drag groove inside, and the lip at the leading end.
      const out5 = sgn * Wd * 0.05;
      let loD = polyD(darkEdge.map((pt): Pt => [pt[0] - nx * out5, pt[1] - ny * out5]), false, q);
      if (rng() < 0.7) {
        const t = -sgn * hw * range(rng, 0.25, 0.7);
        loD += polyD([P(-hl * range(rng, 0.3, 0.9), t), P(hl * range(rng, 0.2, 0.8), t + wob() * 0.5)], false, q);
      }
      if (dx * lx + dy * ly < 0) loD += polyD([P(hl + skew * 0.9, -hw * 0.9), P(hl - skew * 0.9, hw * 0.9)], false, q);
      out.push(`<path d="${loD}" stroke="${esc(mix(c, o.loTint, 0.6))}" stroke-width="${f1(Math.max(0.6, Wd * 0.08))}" stroke-opacity="${f1(0.2 + 0.45 * relief)}"/>`);
    }
  });

  return `<g fill="none" stroke-linejoin="round" stroke-linecap="round">${out.join("")}</g>`;
}
