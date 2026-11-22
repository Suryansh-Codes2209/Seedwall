import { DEFAULT_DEVICE, getDevice } from "@/config/devices";
import type { Params } from "@/generators";
import { SAFE_AREA } from "@/generators/shared/safeArea";
import type { StudioState } from "./studioState";

/** One image in a matching set. */
export interface ExportTarget {
  id: string;
  label: string;
  w: number;
  h: number;
  filename: string;
  params: Params;
}

const seedOf = (params: Params): string => (typeof params.seed === "number" ? String(params.seed) : "0");

/** `seedwall-<generator>-<seed>-<suffix>.<ext>` */
export const seedwallName = (gen: string, seed: number | string, suffix: string, ext: string): string =>
  `seedwall-${gen}-${seed}-${suffix}.${ext}`;

/** The desktop size for a set: the picked desktop (preset or landscape custom size), else MacBook Pro 14. */
function desktopSize(s: StudioState): { w: number; h: number; label: string } {
  const d = getDevice(s.device);
  if (d?.kind === "desktop") return { w: d.w, h: d.h, label: d.label };
  if (s.device === "custom" && s.w >= s.h) return { w: s.w, h: s.h, label: `${s.w}×${s.h}` };
  const fallback = getDevice(DEFAULT_DEVICE)!;
  return { w: fallback.w, h: fallback.h, label: fallback.label };
}

/**
 * The four images of a matching set: desktop, iPhone, Android and iPad, all with the same look,
 * params and seed. Layout is in units of the short side, so they match without any extra work.
 * The lock-screen safe area only applies to the phones and the tablet.
 */
export function setTargets(s: StudioState): ExportTarget[] {
  const seed = seedOf(s.params);
  const desk = desktopSize(s);
  const out: ExportTarget[] = [
    { id: "desktop", label: desk.label, w: desk.w, h: desk.h, filename: "", params: { ...s.params, [SAFE_AREA]: "off" } },
  ];
  for (const id of ["iphone", "android", "ipad"]) {
    const d = getDevice(id)!;
    out.push({ id, label: d.label, w: d.w, h: d.h, filename: "", params: { ...s.params } });
  }
  return out.map((t) => ({ ...t, filename: seedwallName(s.gen, seed, t.id, "png") }));
}

export const setZipName = (s: StudioState): string => seedwallName(s.gen, seedOf(s.params), "set", "zip");
