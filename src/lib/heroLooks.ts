import { getGenerator, renderWallpaper, resolveParams } from "@/generators";
import { scopeSvgIds } from "./scopeSvg";

export interface HeroLook {
  gen: string;
  preset: string;
}

/** What the home hero's laptop and phone cycle through: the brand-blue mat, the newest looks, then old favourites. */
export const HERO_LOOKS: HeroLook[] = [
  { gen: "cutting-mat", preset: "blue-bold" },
  { gen: "frutiger-aero", preset: "sky-bubbles" },
  { gen: "nebula", preset: "violet" },
  { gen: "event-horizon", preset: "gargantua" },
  { gen: "aurora", preset: "borealis" },
  { gen: "kintsugi", preset: "indigo" },
];

/** Laptop and phone sizes the hero draws each look at (MacBook Air 13" and iPhone 15). */
export const HERO_DESK = { w: 2560, h: 1664 } as const;
export const HERO_PHONE = { w: 1179, h: 2556 } as const;

/** Renders one look for one device, with ids scoped so several can share the page. */
export function renderHeroLook(look: HeroLook, size: { w: number; h: number }, scope: string): string {
  const g = getGenerator(look.gen);
  if (!g) return "";
  return scopeSvgIds(renderWallpaper(g, resolveParams(g, look.preset), size), scope);
}
