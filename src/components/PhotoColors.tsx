"use client";

import { useId, useRef, useState } from "react";
import type { AnyGenerator, Params } from "@/generators/types";
import { extractPalette, mapPaletteToParams, type PaletteColor } from "@/lib/photoPalette";
import type { PhotoPixels } from "@/lib/paintPhoto";

/** Longest side the photo is read at. A palette needs very few pixels. */
const MAX_SIDE = 160;

async function readSmall(file: File): Promise<PhotoPixels> {
  const bmp = await createImageBitmap(file);
  try {
    const s = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * s));
    const h = Math.max(1, Math.round(bmp.height * s));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas isn't available in this browser");
    ctx.drawImage(bmp, 0, 0, w, h);
    return { width: w, height: h, data: ctx.getImageData(0, 0, w, h).data };
  } finally {
    bmp.close();
  }
}

interface Props {
  gen: AnyGenerator;
  params: Params;
  onApply: (params: Params) => void;
  onMessage: (msg: string) => void;
}

/** "Use colours from a photo": read in the browser, never uploaded. */
export function PhotoColors({ gen, params, onApply, onMessage }: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [before, setBefore] = useState<{ gen: string; params: Params } | null>(null);
  const [reading, setReading] = useState(false);

  const apply = (pal: PaletteColor[]) => {
    setBefore({ gen: gen.id, params });
    onApply(mapPaletteToParams(gen, params, pal));
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onMessage("That isn't an image");
      return;
    }
    setReading(true);
    try {
      const pal = extractPalette(await readSmall(file), 6);
      if (!pal.length) {
        onMessage("I couldn't find any colours in that image");
        return;
      }
      setPalette(pal);
      apply(pal);
      onMessage(`Used ${pal.length} colours from your photo`);
    } catch {
      onMessage("I couldn't read that image");
    } finally {
      setReading(false);
      if (input.current) input.current.value = "";
    }
  };

  const canUndo = before !== null && before.gen === gen.id;

  return (
    <div className="photo-colors">
      <input
        ref={input}
        id={id}
        className="visually-hidden"
        type="file"
        accept="image/*"
        onChange={(e) => void pick(e.target.files?.[0])}
      />
      <label htmlFor={id} className="btn btn-sm btn-block" aria-disabled={reading}>
        {reading ? "Reading the photo…" : palette.length ? "Try another photo" : "Use colours from a photo"}
      </label>
      {palette.length > 0 && (
        <>
          <div className="swatches" role="list" aria-label="Colours from your photo">
            {palette.map((c) => (
              <span
                key={c.hex}
                role="listitem"
                className="swatch"
                title={`${c.hex}, ${Math.round(c.weight * 100)}% of the photo`}
                style={{ background: c.hex, flexGrow: Math.max(0.4, c.weight * 6) }}
              >
                <span className="visually-hidden">{c.hex}</span>
              </span>
            ))}
          </div>
          <div className="photo-actions">
            {canUndo ? (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  // Put back only the colours, so edits made since then are kept.
                  const back: Params = { ...params };
                  for (const [k, d] of Object.entries(gen.params)) if (d.kind === "color" && k in before.params) back[k] = before.params[k]!;
                  onApply(back);
                  setBefore(null);
                  onMessage("Back to the colours you had");
                }}
              >
                Undo
              </button>
            ) : (
              <button type="button" className="btn btn-sm" onClick={() => apply(palette)}>
                Apply to this look
              </button>
            )}
          </div>
        </>
      )}
      <small className="hint">Your photo stays on this device. I only read its colours.</small>
    </div>
  );
}
