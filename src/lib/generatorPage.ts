import { getDevice } from "@/config/devices";
import { DESCRIPTION_MAX } from "@/config/seo";
import { GENERATORS, type AnyGenerator } from "@/generators";
import type { GalleryItem } from "./gallery";

const SUFFIX = "Free PNG and SVG for any screen.";

/** The look's description plus a short suffix, falling back to its first sentence when the whole thing is too long. */
export function generatorDescription(gen: AnyGenerator): string {
  const full = `${gen.description} ${SUFFIX}`;
  if (full.length <= DESCRIPTION_MAX) return full;
  const first = /^.*?[.!?](?=\s|$)/.exec(gen.description)?.[0];
  if (first && `${first} ${SUFFIX}`.length <= DESCRIPTION_MAX) return `${first} ${SUFFIX}`;
  return gen.description;
}

/** Up to `n` other looks: the ones after this one in registry order, wrapping round. */
export function relatedLooks(gen: AnyGenerator, n = 6): AnyGenerator[] {
  const i = GENERATORS.findIndex((g) => g.id === gen.id);
  return Array.from({ length: Math.min(n, GENERATORS.length - 1) }, (_, k) => GENERATORS[(i + 1 + k) % GENERATORS.length]!);
}

/** Alt text and caption for one sample: look, preset, device and size. */
export function sampleLabel(gen: AnyGenerator, item: GalleryItem): { preset: string; device: string; alt: string } {
  const preset = gen.presets.find((p) => p.id === item.presetId)?.title ?? item.title;
  const device = getDevice(item.device)?.label ?? item.device;
  return { preset, device, alt: `${gen.name} wallpaper, ${preset} preset, ${device}, ${item.width}×${item.height}` };
}
