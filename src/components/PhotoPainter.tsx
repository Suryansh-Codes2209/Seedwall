"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { analysePhoto, paintField, PAINT_DEFAULTS, type PaintPhotoOptions, type PhotoField, type PhotoPixels } from "@/lib/paintPhoto";
import { downloadBlob, svgToPngBlob } from "@/lib/svgToPng";
import { trackDownload } from "@/lib/analytics";
import { useDebounced } from "@/lib/useDebounced";
import { DevicePicker } from "./DevicePicker";
import { LiveThumb } from "./LiveThumb";
import { Preview } from "./Preview";

/** Longest side the photo is read at. The painter averages it onto a coarser grid anyway. */
const MAX_SIDE = 1600;

async function readPhoto(file: File): Promise<PhotoPixels> {
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
    const img = ctx.getImageData(0, 0, w, h);
    return { width: w, height: h, data: img.data };
  } finally {
    bmp.close();
  }
}

interface RangeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  help?: string;
  onChange: (v: number) => void;
}

function Range({ label, value, min, max, step, help, onChange }: RangeProps) {
  const id = useId();
  return (
    <div className="field">
      <div className="field-row">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{value.toFixed(2)}</output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {help && <small>{help}</small>}
    </div>
  );
}

export function PhotoPainter() {
  const [pixels, setPixels] = useState<PhotoPixels | null>(null);
  const [name, setName] = useState("photo");
  const [size, setSize] = useState({ device: "macbook14", w: 3024, h: 1964 });
  const [opts, setOpts] = useState<PaintPhotoOptions>(PAINT_DEFAULTS);
  const [dragging, setDragging] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lightId = useId();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const load = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setToast("That isn't an image");
      return;
    }
    try {
      setPixels(await readPhoto(file));
      setName(file.name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").slice(0, 40) || "photo");
    } catch {
      setToast("Couldn't read that image. Try a JPEG or PNG.");
    }
  };

  // Analysis depends on the photo, canvas size and colour boost; painting on everything else.
  // Debounce the state objects themselves (stable identities) so sliders don't repaint on every tick.
  const settled = { size: useDebounced(size, 250), opts: useDebounced(opts, 250) };
  const field = useMemo<PhotoField | null>(
    () => (pixels ? analysePhoto(pixels, { w: settled.size.w, h: settled.size.h }, settled.opts.boost) : null),
    [pixels, settled.size.w, settled.size.h, settled.opts.boost],
  );
  const svg = useMemo(
    () => (field ? paintField(field, { w: settled.size.w, h: settled.size.h }, settled.opts) : ""),
    [field, settled.size.w, settled.size.h, settled.opts],
  );
  const busy = settled.size !== size || settled.opts !== opts;

  const set = <K extends keyof PaintPhotoOptions>(k: K, v: PaintPhotoOptions[K]) => setOpts((o) => ({ ...o, [k]: v }));
  const filename = (ext: string) => `seedwall-impasto-${name}-${settled.size.w}x${settled.size.h}.${ext}`;

  const downloadPng = async () => {
    if (!svg) return;
    setExporting(true);
    try {
      downloadBlob(await svgToPngBlob(svg, settled.size.w, settled.size.h), filename("png"));
      trackDownload({ source: "paint", format: "png", generator: "impasto-photo", width: settled.size.w, height: settled.size.h });
      setToast(`Saved ${settled.size.w}×${settled.size.h} PNG`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="studio">
      <aside className="studio-col picker-col" aria-label="Photo">
        <section className="col-section">
          <span className="label">Your photo</span>
          <label
            className="dropzone"
            data-dragging={dragging ? "true" : "false"}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void load(e.dataTransfer.files[0]);
            }}
          >
            <input ref={inputRef} type="file" accept="image/*" className="visually-hidden" onChange={(e) => void load(e.target.files?.[0])} />
            <strong>{pixels ? "Choose another photo" : "Drop a photo here"}</strong>
            <span>or click to browse · JPEG, PNG, WebP</span>
          </label>
          <p className="empty" style={{ marginTop: 10 }}>
            Painted in your browser. The photo is never uploaded.
          </p>
        </section>
        <section className="col-section">
          <span className="label">Tips</span>
          <ul className="tips">
            <li>Strong light and clear shapes paint best: portraits by a window, still lifes, landscapes at golden hour.</li>
            <li>Raise <em>Detail</em> for faces; lower it and enlarge the knife for a looser, bolder painting.</li>
            <li>Paint only photos you have the rights to.</li>
          </ul>
        </section>
      </aside>

      <section className="studio-stage" aria-label="Preview">
        <div className="stage-bar">
          <div className="stage-title">
            <h1>Paint my photo</h1>
            <p>Palette-knife impasto · {settled.size.w}×{settled.size.h}</p>
          </div>
          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={downloadPng} disabled={!svg || exporting}>
              {exporting ? "Rendering…" : "Download PNG"}
            </button>
            <button
              type="button"
              className="btn"
              disabled={!svg}
              onClick={() => {
                downloadBlob(new Blob([svg], { type: "image/svg+xml" }), filename("svg"));
                trackDownload({ source: "paint", format: "svg", generator: "impasto-photo", width: settled.size.w, height: settled.size.h });
              }}
            >
              SVG
            </button>
          </div>
        </div>

        {svg ? (
          <Preview svg={svg} w={settled.size.w} h={settled.size.h} busy={busy} />
        ) : (
          <button type="button" className="preview-wrap paint-empty" onClick={() => inputRef.current?.click()}>
            <div className="paint-sample">
              <LiveThumb gen="impasto" preset="harbour-dusk" w={1600} h={1000} label="An impasto painting" />
            </div>
            <span>Drop a photo to paint it in thick palette-knife strokes</span>
          </button>
        )}

        <div className="stage-bar">
          <p className="preview-dims">{svg ? `Seed ${opts.seed} · repaint for a different set of strokes` : "Nothing is uploaded: the painting happens on this device."}</p>
        </div>
      </section>

      <aside className="studio-col params-col" aria-label="Controls">
        <section className="col-section">
          <span className="label">Device</span>
          <DevicePicker device={size.device} w={size.w} h={size.h} onChange={(device, w, h) => setSize({ device, w, h })} />
        </section>
        <section className="col-section">
          <span className="label">Knife</span>
          <Range label="Knife size" value={opts.knife} min={0.6} max={1.6} step={0.05} onChange={(v) => set("knife", v)} />
          <Range label="Paint thickness" value={opts.relief} min={0} max={1} step={0.05} onChange={(v) => set("relief", v)} />
          <Range label="Detail" value={opts.detail} min={0} max={1} step={0.05} help="Fine strokes on edges and features." onChange={(v) => set("detail", v)} />
          <Range label="Colour push" value={opts.boost} min={0} max={1} step={0.05} onChange={(v) => set("boost", v)} />
          <Range label="Canvas grain" value={opts.grain} min={0} max={0.2} step={0.01} onChange={(v) => set("grain", v)} />
          <div className="field">
            <label className="field-row" htmlFor={lightId}>Light from</label>
            <select id={lightId} className="select" value={opts.lightFrom} onChange={(e) => set("lightFrom", e.target.value as PaintPhotoOptions["lightFrom"])}>
              <option value="top-left">Top left</option>
              <option value="top">Above</option>
              <option value="top-right">Top right</option>
            </select>
          </div>
        </section>
        <section className="col-section">
          <button type="button" className="btn btn-sm btn-block" onClick={() => set("seed", 1 + Math.floor(Math.random() * 999_998))}>
            Repaint (new strokes)
          </button>
          <button type="button" className="btn btn-sm btn-block" style={{ marginTop: 8 }} onClick={() => setOpts((o) => ({ ...PAINT_DEFAULTS, seed: o.seed }))}>
            Reset controls
          </button>
        </section>
      </aside>

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}
