/**
 * Browser helpers for long exports (matching sets, monitor spans): render the SVG in a worker,
 * rasterise it, and give the page a frame between steps so progress can paint.
 */
import { getGenerator, renderWallpaper, type Params } from "@/generators";
import { svgToPngBlob } from "./svgToPng";

type Reply = { id: number; svg?: string; error?: string };
type Pending = { resolve: (svg: string) => void; reject: (e: Error) => void };

let worker: Worker | null | undefined;
let nextId = 1;
const pending = new Map<number, Pending>();

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  try {
    worker = new Worker(new URL("./render.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<Reply>) => {
      const job = pending.get(e.data.id);
      if (!job) return;
      pending.delete(e.data.id);
      if (typeof e.data.svg === "string") job.resolve(e.data.svg);
      else job.reject(new Error(e.data.error ?? "Render failed"));
    };
    worker.onerror = () => {
      // The worker couldn't start or crashed: fall back to the main thread from now on.
      worker?.terminate();
      worker = null;
      for (const job of pending.values()) job.reject(new Error("worker failed"));
      pending.clear();
    };
  } catch {
    worker = null;
  }
  return worker;
}

/** Lets the browser paint (progress, spinners) before the next heavy step. */
export const nextFrame = (): Promise<void> =>
  new Promise((resolve) => (typeof requestAnimationFrame === "function" ? requestAnimationFrame(() => setTimeout(resolve, 0)) : setTimeout(resolve, 0)));

function renderHere(gen: string, params: Params, w: number, h: number): string {
  const g = getGenerator(gen);
  if (!g) throw new Error(`Unknown generator ${gen}`);
  return renderWallpaper(g, params, { w, h });
}

/** The same SVG as renderWallpaper, rendered in a worker when one is available. */
export async function renderSvgAsync(gen: string, params: Params, w: number, h: number): Promise<string> {
  const wk = getWorker();
  if (wk) {
    try {
      return await new Promise<string>((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        wk.postMessage({ id, gen, params, w, h });
      });
    } catch {
      /* fall through to the main thread */
    }
  }
  await nextFrame();
  return renderHere(gen, params, w, h);
}

/** PNG bytes for an SVG, ready for a zip. */
export async function pngBytes(svg: string, w: number, h: number): Promise<Uint8Array> {
  const blob = await svgToPngBlob(svg, w, h);
  return new Uint8Array(await blob.arrayBuffer());
}

/** Draws PNG parts onto one canvas (black where nothing is drawn) and encodes it as a PNG. */
export async function composePng(parts: readonly { data: Uint8Array; x: number; y: number }[], w: number, h: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is unavailable");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  for (const p of parts) {
    const bmp = await createImageBitmap(new Blob([p.data as Uint8Array<ArrayBuffer>], { type: "image/png" }));
    ctx.drawImage(bmp, p.x, p.y);
    bmp.close();
    await nextFrame();
  }
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("The wide image is too big for this browser"))), "image/png"),
  );
}
