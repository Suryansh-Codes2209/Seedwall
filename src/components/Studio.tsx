"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GENERATORS, applyTheme, getGenerator, renderWallpaper, resolveParams, type Params, type ParamValue } from "@/generators";
import { getTheme } from "@/generators/shared/themes";
import { SAFE_AREA, lockScreenZones, safeAreaApplies, type SafeAreaMode } from "@/generators/shared/safeArea";
import { decodeState, encodeState, initialState, type StudioState } from "@/lib/studioState";
import { scopeSvgIds } from "@/lib/scopeSvg";
import { downloadBlob, svgToPngBlob } from "@/lib/svgToPng";
import { trackDownload } from "@/lib/analytics";
import { useDebounced } from "@/lib/useDebounced";
import { setTargets, setZipName } from "@/lib/exportSet";
import { composePng, nextFrame, pngBytes, renderSvgAsync } from "@/lib/renderAsync";
import { cropSvg, spanFilename, type SpanLayout } from "@/lib/span";
import { seedwallName } from "@/lib/exportSet";
import { buildZip, type ZipEntry } from "@/lib/zip";
import { saveToCollection } from "@/lib/collection";
import { DevicePicker } from "./DevicePicker";
import { ParamsPanel } from "./ParamsPanel";
import { Preview } from "./Preview";
import { LiveThumb } from "./LiveThumb";
import { CollectionPanel } from "./CollectionPanel";
import { ThemePicker } from "./ThemePicker";
import { SafeAreaToggle } from "./SafeAreaToggle";
import { SpanPanel } from "./SpanPanel";
import { PhotoColors } from "./PhotoColors";
import type { PreviewZone } from "./Preview";

export function Studio() {
  const search = useSearchParams();
  const [state, setState] = useState<StudioState>(() => decodeState(new URLSearchParams(search.toString())));
  const [toast, setToast] = useState("");
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; label: string } | null>(null);
  const [collectionVersion, setCollectionVersion] = useState(0);

  const gen = getGenerator(state.gen) ?? GENERATORS[0]!;
  const debounced = useDebounced(state, 90);
  const busy = debounced !== state;

  const svg = useMemo(() => {
    const g = getGenerator(debounced.gen);
    return g ? renderWallpaper(g, debounced.params, { w: debounced.w, h: debounced.h }) : "";
  }, [debounced]);
  const scoped = useMemo(() => scopeSvgIds(svg, "pv"), [svg]);

  // Keep the URL shareable without triggering navigation.
  useEffect(() => {
    const q = encodeState(debounced);
    if (`?${q}` !== window.location.search) window.history.replaceState(null, "", `/studio?${q}`);
  }, [debounced]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const setParam = useCallback((key: string, value: ParamValue) => {
    setState((s) => ({ ...s, params: { ...s.params, [key]: value } }));
  }, []);

  // Settings that belong to the screen, not the look, survive a change of generator or preset.
  const carried = (s: StudioState) => ({ "text.none": s.params["text.none"] ?? false, [SAFE_AREA]: s.params[SAFE_AREA] ?? "off" });

  const pickGenerator = (id: string) => {
    const next = initialState(id);
    setState((s) => ({ ...next, device: s.device, w: s.w, h: s.h, params: { ...next.params, ...carried(s) } }));
  };

  const pickPreset = (presetId: string) => {
    setState((s) => {
      const g = getGenerator(s.gen);
      if (!g) return s;
      return { ...s, preset: presetId, params: { ...resolveParams(g, presetId), ...carried(s) } };
    });
  };

  const filename = (ext: string) => `${state.gen}-${state.preset}-${state.w}x${state.h}.${ext}`;
  const fullSvg = () => renderWallpaper(gen, state.params, { w: state.w, h: state.h });
  const shareUrl = () => `${window.location.origin}/studio?${encodeState(state)}`;

  const copy = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast(msg);
    } catch {
      setToast("Couldn't access the clipboard");
    }
  };

  const downloadPng = async () => {
    setExporting(true);
    try {
      downloadBlob(await svgToPngBlob(fullSvg(), state.w, state.h), filename("png"));
      trackDownload({ source: "studio", format: "png", generator: state.gen, width: state.w, height: state.h });
      setToast(`Saved ${state.w}×${state.h} PNG`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  /** Monitor span: render the full canvas once, then rasterise one slice per screen. */
  const downloadSpan = (layout: SpanLayout, params: Params, kind: "slices" | "wide") => {
    const g = state.gen;
    const seed = typeof params.seed === "number" ? params.seed : 0;
    let full: Promise<string> | null = null;
    const canvasSvg = () => (full ??= renderSvgAsync(g, params, layout.canvas.w, layout.canvas.h));
    const n = layout.slices.length;
    const slice = (i: number) => async () => {
      const r = layout.slices[i]!;
      return pngBytes(cropSvg(await canvasSvg(), r), r.w, r.h);
    };
    const jobs = layout.slices.map((r, i) => ({ label: `screen ${i + 1} (${r.w}×${r.h})`, filename: spanFilename(g, seed, i, n, "png"), make: slice(i) }));
    trackDownload({ source: "studio", format: "png", generator: g, width: layout.canvas.w, height: layout.canvas.h });
    if (kind === "slices") {
      void exportZip(jobs, seedwallName(g, seed, "span", "zip"), `Saved ${n} screens`);
      return;
    }
    void (async () => {
      if (progress) return;
      try {
        const parts: { data: Uint8Array; x: number; y: number }[] = [];
        for (const [i, job] of jobs.entries()) {
          setProgress({ done: i, total: n + 1, label: job.label });
          await nextFrame();
          parts.push({ data: await job.make(), ...layout.placements[i]! });
        }
        setProgress({ done: n, total: n + 1, label: "the wide image" });
        await nextFrame();
        const { w, h } = layout.combined;
        downloadBlob(await composePng(parts, w, h), seedwallName(g, seed, `span-${w}x${h}`, "png"));
        setToast(`Saved one ${w}×${h} image`);
      } catch (e) {
        setToast(e instanceof Error ? e.message : "Export failed");
      } finally {
        setProgress(null);
      }
    })();
  };

  /** Renders each job in turn (off the main thread where possible), zips the PNGs and downloads the zip. */
  const exportZip = async (jobs: { label: string; filename: string; make: () => Promise<Uint8Array> }[], zipName: string, done: string) => {
    if (progress) return;
    const files: ZipEntry[] = [];
    try {
      for (const [i, job] of jobs.entries()) {
        setProgress({ done: i, total: jobs.length, label: job.label });
        await nextFrame();
        files.push({ name: job.filename, data: await job.make() });
      }
      setProgress({ done: jobs.length, total: jobs.length, label: "Zipping" });
      await nextFrame();
      downloadBlob(new Blob([buildZip(files) as Uint8Array<ArrayBuffer>], { type: "application/zip" }), zipName);
      setToast(done);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Export failed");
    } finally {
      setProgress(null);
    }
  };

  const downloadSet = () => {
    const targets = setTargets(state);
    void exportZip(
      targets.map((t) => ({
        label: `${t.label} (${t.w}×${t.h})`,
        filename: t.filename,
        make: async () => pngBytes(await renderSvgAsync(state.gen, t.params, t.w, t.h), t.w, t.h),
      })),
      setZipName(state),
      "Saved the set: desktop, iPhone, Android and iPad",
    );
    for (const t of targets) trackDownload({ source: "studio", format: "png", generator: state.gen, width: t.w, height: t.h });
  };

  const presetTitle = gen.presets.find((p) => p.id === state.preset)?.title ?? state.preset;
  const safeOffered = safeAreaApplies(state.device, state.w, state.h);
  const safeMode = (state.params[SAFE_AREA] ?? "off") as SafeAreaMode;
  const previewZones: PreviewZone[] = lockScreenZones({ w: debounced.w, h: debounced.h }, debounced.params[SAFE_AREA]).map((z, i) => ({
    ...z,
    label: i === 0 ? "Clock and date" : "Buttons",
  }));

  return (
    <div className="studio">
      <aside className="studio-col picker-col" aria-label="Generators and presets">
        <section className="col-section">
          <span className="label">Generator</span>
          <div className="gen-list">
            {GENERATORS.map((g) => (
              <button key={g.id} type="button" aria-pressed={g.id === state.gen} onClick={() => pickGenerator(g.id)}>
                {g.name}
                <span className="count">{g.presets.length}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="col-section">
          <span className="label">Presets</span>
          <div className="preset-grid">
            {gen.presets.map((p) => (
              <button key={`${gen.id}-${p.id}`} type="button" className="preset-btn" aria-pressed={p.id === state.preset} onClick={() => pickPreset(p.id)}>
                <div className="pm">
                  <LiveThumb gen={gen.id} preset={p.id} w={800} h={500} label={p.title} />
                </div>
                <span>{p.title}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="col-section">
          <span className="label">My collection</span>
          <CollectionPanel version={collectionVersion} onLoad={(s) => setState(s)} />
        </section>
      </aside>

      <section className="studio-stage" aria-label="Preview">
        <div className="stage-bar">
          <div className="stage-title">
            <h1>{gen.name}</h1>
            <p>{presetTitle} · {state.w}×{state.h}</p>
          </div>
          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={downloadPng} disabled={exporting}>
              {exporting ? "Rendering…" : "Download PNG"}
            </button>
            <button type="button" className="btn" onClick={downloadSet} disabled={progress !== null} title="Desktop, iPhone, Android and iPad in one zip">
              {progress ? `Set ${Math.min(progress.done + 1, progress.total)}/${progress.total}` : "Download set"}
            </button>
            <button type="button" className="btn" onClick={() => {
                downloadBlob(new Blob([fullSvg()], { type: "image/svg+xml" }), filename("svg"));
                trackDownload({ source: "studio", format: "svg", generator: state.gen, width: state.w, height: state.h });
              }}>
              SVG
            </button>
            <button type="button" className="btn" onClick={() => copy(shareUrl(), "Share link copied")}>
              Copy link
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                saveToCollection(state, `${gen.name} · ${presetTitle}`);
                setCollectionVersion((v) => v + 1);
                setToast("Saved to your collection");
              }}
            >
              Save
            </button>
          </div>
        </div>

        {progress && (
          <div className="export-progress" role="status" aria-live="polite">
            <progress value={progress.done} max={progress.total} />
            <span>
              {progress.done < progress.total ? `Rendering ${progress.label}, ${progress.done + 1} of ${progress.total}` : "Zipping it up"}
            </span>
          </div>
        )}

        <Preview svg={scoped} w={debounced.w} h={debounced.h} busy={busy} zones={previewZones} />

        <div className="stage-bar">
          <p className="preview-dims">
            {state.params.seed === undefined ? "Rendered from code." : `Rendered from code. Seed ${String(state.params.seed)} gives this exact result every time.`}
          </p>
        </div>
      </section>

      <aside className="studio-col params-col" aria-label="Controls">
        <section className="col-section">
          <span className="label">Device</span>
          <DevicePicker
            device={state.device}
            w={state.w}
            h={state.h}
            onChange={(device, w, h) =>
              setState((s) => {
                // The safe area only makes sense on a lock screen; switch it off for desktops.
                const keep = safeAreaApplies(device, w, h) || (s.params[SAFE_AREA] ?? "off") === "off";
                return { ...s, device, w, h, params: keep ? s.params : { ...s.params, [SAFE_AREA]: "off" } };
              })
            }
          />
          {safeOffered && <SafeAreaToggle mode={safeMode} onChange={(m) => setParam(SAFE_AREA, m)} />}
        </section>
        <section className="col-section">
          <span className="label">Multi-monitor</span>
          <SpanPanel gen={state.gen} params={state.params} busy={progress !== null} onDownload={downloadSpan} />
        </section>
        <section className="col-section">
          <span className="label">Syntax theme</span>
          <ThemePicker
            onApply={(id) => {
              setState((s) => {
                const g = getGenerator(s.gen);
                return g ? { ...s, params: applyTheme(g, s.params, id) } : s;
              });
              setToast(`Applied ${getTheme(id)?.name ?? id}`);
            }}
          />
        </section>
        <section className="col-section">
          <span className="label">Colours from a photo</span>
          <PhotoColors gen={gen} params={state.params} onApply={(params) => setState((s) => ({ ...s, params }))} onMessage={setToast} />
        </section>
        <section className="col-section">
          <ParamsPanel gen={gen} params={state.params} onChange={setParam} />
          <button type="button" className="btn btn-sm btn-block" onClick={() => pickPreset(state.preset)}>
            Reset to preset
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
