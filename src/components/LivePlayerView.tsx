"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ParamValue } from "@/generators/types";
import { LIVE_SCENES, getLiveScene, resolveLiveParams } from "@/live";
import { browserVideoMime, captureStill, clampExportSize, exportFileName, exportMaxSide, recordLoop } from "@/live/export";
import { loopMultiplier } from "@/live/loop";
import { decodeLiveState, liveHref, type LiveState } from "@/lib/liveState";
import { useDebounced } from "@/lib/useDebounced";
import { downloadBlob } from "@/lib/svgToPng";
import { DevicePicker } from "./DevicePicker";
import { LiveStage } from "./LiveStage";
import { ParamsPanel } from "./ParamsPanel";

/** The /live/[id] page body: the playing scene on the left, presets and controls on the right. */
export function LivePlayerView({ sceneId }: { sceneId: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const [state, setState] = useState<LiveState>(() => decodeLiveState(sceneId, new URLSearchParams(search.toString())));
  const [toast, setToast] = useState("");
  const [fps, setFps] = useState<30 | 60>(30);
  const [canRecord, setCanRecord] = useState(false);
  const [exporting, setExporting] = useState(false);
  /** Whole seconds recorded so far, or null when not recording. */
  const [recorded, setRecorded] = useState<number | null>(null);

  const scene = getLiveScene(state.scene) ?? LIVE_SCENES[0]!;
  const params = useMemo(() => resolveLiveParams(scene, state.preset, state.overrides), [scene, state.preset, state.overrides]);

  // Keep the URL shareable. Debounced so dragging a slider doesn't navigate on every step.
  const debounced = useDebounced(state, 250);
  useEffect(() => {
    const href = liveHref(debounced);
    if (href !== `${window.location.pathname}${window.location.search}`) router.replace(href, { scroll: false });
  }, [debounced, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const setParam = useCallback((key: string, value: ParamValue) => {
    setState((s) => ({ ...s, overrides: { ...s.overrides, [key]: value } }));
  }, []);

  const pickPreset = (preset: string) => setState((s) => ({ ...s, preset, overrides: {} }));

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${liveHref(state)}`);
      setToast("Share link copied");
    } catch {
      setToast("Couldn't access the clipboard");
    }
  };

  useEffect(() => setCanRecord(browserVideoMime() !== null), []);

  // Leaving the page cancels a recording: its context, frame loop and recorder stop with it.
  const recording = useRef<AbortController | null>(null);
  useEffect(() => () => recording.current?.abort(), []);

  const speed = Number(params.speed ?? 1);
  const loopSeconds = scene.loopSeconds * loopMultiplier(Number.isFinite(speed) ? speed : 1);
  const busy = exporting || recorded !== null;

  /** The page's size, shrunk to what the GPU can render, plus a note when it had to shrink. */
  const exportSize = () => {
    const size = clampExportSize(state.w, state.h, exportMaxSide());
    return { ...size, note: size.scaled ? `Exported at ${size.w}×${size.h}, the largest this GPU allows.` : "" };
  };

  const downloadStill = async () => {
    setExporting(true);
    try {
      const { w, h, note } = exportSize();
      downloadBlob(await captureStill(scene, params, w, h), exportFileName(scene.id, state.preset, w, h, "png"));
      setToast(note || `Saved ${w}×${h} PNG`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const downloadLoop = async () => {
    const ctrl = new AbortController();
    recording.current = ctrl;
    setRecorded(0);
    try {
      const { w, h, note } = exportSize();
      const progress = (s: number) => {
        if (!ctrl.signal.aborted) setRecorded(Math.floor(s));
      };
      const { blob, ext } = await recordLoop(scene, params, w, h, fps, progress, ctrl.signal);
      if (ctrl.signal.aborted) return;
      downloadBlob(blob, exportFileName(scene.id, state.preset, w, h, ext));
      setToast(note || `Saved ${w}×${h} ${ext.toUpperCase()} loop`);
    } catch (e) {
      if (!ctrl.signal.aborted) setToast(e instanceof Error ? e.message : "Recording failed");
    } finally {
      if (recording.current === ctrl) recording.current = null;
      if (!ctrl.signal.aborted) setRecorded(null);
    }
  };

  const presetTitle = scene.presets.find((p) => p.id === state.preset)?.title ?? state.preset;

  return (
    <div className="studio live-studio">
      <section className="studio-stage" aria-label="Preview">
        <div className="stage-bar">
          <div className="stage-title">
            <h1>{scene.name}</h1>
            <p>{presetTitle} · {state.w}×{state.h}</p>
          </div>
          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={downloadStill} disabled={busy}>
              {exporting ? "Rendering…" : "Download still"}
            </button>
            {canRecord && (
              <button type="button" className="btn" onClick={downloadLoop} disabled={busy} aria-live="polite">
                {recorded === null ? "Download loop" : `Recording ${recorded} / ${Number(loopSeconds.toFixed(1))} s`}
              </button>
            )}
            <button type="button" className="btn" onClick={copyLink}>
              Copy link
            </button>
          </div>
        </div>

        <LiveStage scene={scene} preset={state.preset} params={params} w={state.w} h={state.h} fps={fps} />

        <div className="stage-bar">
          <p className="preview-dims">
            Loops every {Number(loopSeconds.toFixed(1))} s. Seed {String(params.seed)} gives the same motion every time.
          </p>
        </div>
      </section>

      <aside className="studio-col params-col" aria-label="Controls">
        <section className="col-section">
          <span className="label">Presets</span>
          <div className="live-presets">
            {scene.presets.map((p) => (
              <button key={p.id} type="button" className="chip" aria-pressed={p.id === state.preset} onClick={() => pickPreset(p.id)}>
                {p.title}
              </button>
            ))}
          </div>
        </section>
        <section className="col-section">
          <span className="label">Frame rate</span>
          <div className="live-presets" role="group" aria-label="Frame rate">
            {([30, 60] as const).map((f) => (
              <button key={f} type="button" className="chip" aria-pressed={fps === f} disabled={recorded !== null} onClick={() => setFps(f)}>
                {f} fps
              </button>
            ))}
          </div>
        </section>
        <section className="col-section">
          <span className="label">Device</span>
          <DevicePicker device={state.device} w={state.w} h={state.h} onChange={(device, w, h) => setState((s) => ({ ...s, device, w, h }))} />
        </section>
        <section className="col-section">
          <ParamsPanel gen={scene} params={params} onChange={setParam} />
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
