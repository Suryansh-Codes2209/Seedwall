/**
 * Renders wallpapers off the main thread, so the studio stays responsive while a set or a
 * monitor span is being built. The output is the same SVG string renderWallpaper gives anywhere.
 */
import { getGenerator, renderWallpaper, type Params } from "@/generators";

interface Job {
  id: number;
  gen: string;
  params: Params;
  w: number;
  h: number;
}

const scope = self as unknown as { onmessage: ((e: MessageEvent<Job>) => void) | null; postMessage(m: unknown): void };

scope.onmessage = (e) => {
  const { id, gen, params, w, h } = e.data;
  const g = getGenerator(gen);
  if (!g) {
    scope.postMessage({ id, error: `Unknown generator ${gen}` });
    return;
  }
  try {
    scope.postMessage({ id, svg: renderWallpaper(g, params, { w, h }) });
  } catch (err) {
    scope.postMessage({ id, error: err instanceof Error ? err.message : "Render failed" });
  }
};
