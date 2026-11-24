/**
 * Live scene posters, and the shader check: every scene × preset is compiled and drawn on a real
 * GPU in headless Chrome, so a broken shader fails this script.
 *   npm run live:posters               → every scene
 *   npm run live:posters glass-orbs    → one scene
 * Writes public/live/<scene>/<preset>.jpg (1920×1080) and <preset>-phone.jpg (1179×2556), phase 0.
 *
 * It starts `next dev` on a free port, or uses LIVE_BASE_URL (e.g. http://localhost:3000) if set,
 * and drives the dev-only /live-harness page in the system Chrome (playwright-core, channel "chrome").
 *
 * GPU flags: Chrome's new headless mode gets WebGL2 on macOS through ANGLE's Metal backend
 * (`--use-angle=metal`). `--enable-unsafe-swiftshader` lets it fall back to the software rasteriser
 * on machines without a usable GPU (slow, but the shader check still runs).
 * Exits non-zero if any page reports an error or draws a blank (single-colour) frame.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { chromium } from "playwright-core";
import sharp from "sharp";
import { LIVE_SCENES } from "../src/live";

const SIZES = [
  { suffix: "", w: 1920, h: 1080 },
  { suffix: "-phone", w: 1179, h: 2556 },
] as const;
const CHROME_ARGS = ["--use-angle=metal", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
const READY_TIMEOUT_MS = 60_000;

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once("error", reject);
    srv.listen(0, () => {
      const addr = srv.address();
      srv.close(() => (addr && typeof addr === "object" ? resolve(addr.port) : reject(new Error("no port"))));
    });
  });
}

/** Starts `next dev` and waits until the harness answers (the first compile can take a while). */
async function startDev(): Promise<{ base: string; child: ChildProcess }> {
  const port = await freePort();
  const child = spawn("node_modules/.bin/next", ["dev", "-p", String(port)], { stdio: ["ignore", "pipe", "pipe"], detached: true });
  let log = "";
  child.stdout?.on("data", (d) => (log += String(d)));
  child.stderr?.on("data", (d) => (log += String(d)));
  const base = `http://localhost:${port}`;
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`next dev exited early:\n${log}`);
    try {
      const res = await fetch(`${base}/live-harness`);
      if (res.ok) return { base, child };
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`next dev did not come up on ${base}:\n${log}`);
}

function stopDev(child: ChildProcess | undefined) {
  if (!child?.pid || child.exitCode !== null) return;
  try {
    process.kill(-child.pid, "SIGTERM"); // the whole group: next dev forks workers
  } catch {
    child.kill("SIGTERM");
  }
}

const only = process.argv[2];
const scenes = only ? LIVE_SCENES.filter((s) => s.id === only) : LIVE_SCENES;
if (scenes.length === 0) {
  console.error(`No live scene "${only}". Known: ${LIVE_SCENES.map((s) => s.id).join(", ")}`);
  process.exit(1);
}

const failures: string[] = [];
let dev: ChildProcess | undefined;
try {
  let base = process.env.LIVE_BASE_URL?.replace(/\/$/, "");
  if (!base) {
    const started = await startDev();
    base = started.base;
    dev = started.child;
  }
  const browser = await chromium.launch({ channel: "chrome", headless: true, args: CHROME_ARGS });
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    page.on("pageerror", (e) => console.error(`  page error: ${e.message}`));
    for (const scene of scenes) {
      const dir = `public/live/${scene.id}`;
      mkdirSync(dir, { recursive: true });
      for (const preset of scene.presets)
        for (const size of SIZES) {
          const label = `${scene.id}/${preset.id}${size.suffix}`;
          await page.setViewportSize({ width: size.w, height: size.h });
          const q = new URLSearchParams({ scene: scene.id, preset: preset.id, w: String(size.w), h: String(size.h), phase: "0" });
          await page.goto(`${base}/live-harness?${q}`);
          const ready = await page
            .waitForFunction(() => window.__liveReady, null, { timeout: READY_TIMEOUT_MS })
            .then((h) => h.jsonValue())
            .catch((e: Error) => `error:timed out waiting for the frame (${e.message.split("\n")[0]})`);
          if (ready !== true) {
            failures.push(`${label}: ${String(ready)}`);
            console.error(`✗ ${label}\n${String(ready)}`);
            continue;
          }
          const dataUrl = await page.evaluate(() => window.__liveCapture?.() ?? "");
          const png = Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ""), "base64");
          const { channels } = await sharp(png).stats();
          if (channels.slice(0, 3).every((c) => c.stdev < 1)) {
            failures.push(`${label}: blank frame`);
            console.error(`✗ ${label}: blank frame`);
            continue;
          }
          const file = `${dir}/${preset.id}${size.suffix}.jpg`;
          writeFileSync(file, await sharp(png).flatten().jpeg({ quality: 85, mozjpeg: true }).toBuffer());
          console.log(`✓ ${file}`);
        }
    }
  } finally {
    await browser.close();
  }
} finally {
  stopDev(dev);
}

if (failures.length) {
  console.error(`\n${failures.length} live frame(s) failed:\n${failures.join("\n")}`);
  process.exit(1);
}
