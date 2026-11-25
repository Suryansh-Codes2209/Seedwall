# Seedwall Live: 3D and animated wallpapers, plus more stills

Date: 2026-11-24 · Status: draft for review

## Intent

Wallpaper Engine is popular because its wallpapers move, look 3D and react to the mouse. That's why people use it. Seedwall today makes only still SVG wallpapers. This adds **Seedwall Live**, a set of original, seed-driven, looping 3D/animated scenes that:

1. play on the website and can be tweaked like a generator (colours, speed, seed),
2. download as a still PNG or a seamless looping video, for phones and for other apps,
3. run as the actual desktop wallpaper through the existing Mac menu-bar app.

It also adds a batch of new still generators and puts the 17 generators that seed links currently never pick into seed links.

The user chose "go ahead with what people like". So the calls below are Claude's, and the user can correct any of them.

## Goals
- Ship 8 original live scenes at launch. At least 5 should look clearly 3D (raymarched depth, lighting, parallax).
- Every scene loops seamlessly, so the exported video and the desktop never visibly jump.
- Mouse parallax on the site and on the Mac desktop.
- The Mac app gets a **Live** mode that plays a scene behind the desktop icons on every screen, at a low cost to battery and GPU.
- Add 6 new still generators, plus a seed pool V2 that includes all generators, without changing any existing `/s/<seed>` or past daily seed.

## Non-goals (v1)
- Audio-reactive wallpapers. They need microphone or system-audio capture and permission prompts. Next version.
- User-uploaded scenes or a workshop.
- The text layer on live scenes.
- Live scenes inside seed links, `/api/render`, or the MCP server. Those stay still-only. Live scenes get their own catalogue endpoint.
- Windows or Linux desktop players.

## Anti-goals (a failure even if it works)
- Recreating Wallpaper Engine's own content, or any specific workshop wallpaper, game or franchise. Every scene is original.
- A live desktop that drains the battery or runs the fans in normal use. Pausing must be on by default.
- Breaking any existing seed link, daily seed, test snapshot or still-wallpaper export.

## Constraints (from the codebase)
- Next 16 has breaking changes. Read `node_modules/next/dist/docs/` before writing routes (see AGENTS.md).
- Still generators must stay pure and deterministic, and must pass `tests/generators.test.ts` for every device.
- `src/lib/seed.ts` pools are frozen. `POOL_V1` covers every seed in 1–999,999, so V2 needs a new seed range.
- The Mac app targets macOS 13+ with SwiftUI and no third-party packages. It builds with `mac/build.sh`.
- There's no WebGL in the repo yet. `public/sw.js` already does offline caching.

## Approaches considered
| | Approach | Trade-off |
|---|---|---|
| **A (picked)** | **Raw WebGL2 full-screen fragment shaders.** Scenes are raymarched in GLSL, with a tiny shared runtime. | No dependency and a tiny bundle. Runs in any browser and in the Mac app's `WKWebView`. Raymarching gives real 3D (glass, chrome, terrain, planets) and loops by construction. The cost is that scenes are GLSL, not meshes. |
| B | three.js / R3F mesh scenes | Easier for scenes built from models. It adds ~150 KB gz, and it's harder to make every scene loop perfectly and look the same everywhere. Kept for later, if a scene needs models. |
| C | Pre-rendered video loops only | Cheapest player, but no live parameters and no mouse parallax, and every preset has to be rendered offline. Loses the reason people like this. |

## Design

### Scene model (`src/live/`)
- `LiveScene<P>` reuses the generators' `ParamSchema`/`Preset`, so `ParamsPanel` works unchanged. It has `id, name, description, params, presets, loopSeconds, mouse: boolean, fragment` (GLSL ES 3.00 source that defines `vec3 scene(vec2 uv)`).
- Params become uniforms automatically: `color` → `vec3 u_<key>`, `range`/`seed` → `float`, `toggle` → `float` 0/1, `select` → `int` index. Dots in keys become `_`.
- A shared prelude supplies `uRes`, `uPhase` (0→1 across the loop), `uLoop` (seconds), `uMouse` (smoothed, −1…1), `uSeed` (0…1 from `createRng(seed)`), plus helpers for hash, value noise, fbm, SDF ops and soft shadows.
- **Looping rule:** scenes may use time only through `uPhase`, as an angle `TAU*uPhase` or `fract`. A test greps every fragment and fails on `uTime`.

### Runtime (`src/live/player.ts`)
`createLivePlayer(canvas, scene, params, opts)` does the following:
- compiles the shader once and rebinds uniforms when params change
- caps frame rate (30 by default, 60 optional) and renders at a scale (1 on the site with DPR capped at 2, 0.66 on the Mac by default)
- pauses when the page is hidden
- under `prefers-reduced-motion`, shows one still frame and never starts animating

It also exposes `captureStill(w,h,phase)` and `recordLoop(w,h,fps)`. `recordLoop` records exactly one loop through `MediaRecorder`, using mp4 where supported and webm otherwise.

### Site
- `/live`: a grid of scenes with poster images. One shared player animates whichever card is hovered or focused, so the page never opens many WebGL contexts.
- `/live/[id]`: the player, presets, `ParamsPanel`, device picker, seed, an fps toggle, and buttons for **Download still**, **Download loop**, **Copy link** and **Set on Mac**. The URL holds the state as `?p=<preset>&x=<base64url overrides>&seed=`, in the same `x` format as `/studio`.
- `/live/[id]/play`: a full-screen player with no page chrome, for the Mac app. It takes the same query plus `fps`, `scale` and `mouse=0|1`, and listens for `window.seedwallLive.setMouse(x,y)` and `.pause()/.resume()`.
- `/api/live`: the catalogue as JSON (scenes, params, presets, poster URLs).
- Posters are generated and checked in at `public/live/<scene>/<preset>.jpg` (1920×1080, phase 0) and `…-phone.jpg` (1179×2556). `npm run live:posters` makes them with headless Chrome. The same script compiles every shader, so a broken shader fails the script.
- Navigation gets a new header link, **Live**, with the note "Moving 3D wallpapers". Sitemap entries are added too.

### Launch scenes (all original)
| id | Name | Look | 3D |
|---|---|---|---|
| `glass-orbs` | Glass Orbs | Glossy metaballs that merge and split, with refraction and a soft studio floor | yes |
| `chrome-tide` | Chrome Tide | A liquid-chrome sea under a gradient sky, with slow swells | yes |
| `planetfall` | Planetfall | A ringed planet turning, with atmospheric scattering and a parallax starfield | yes |
| `grid-run` | Grid Run | Flying low over an endless wireframe heightfield toward a sun | yes |
| `monolith` | Monolith | Floating stone slabs in fog with god-rays. The mouse tilts the camera | yes |
| `monsoon-glass` | Monsoon Glass | Rain drops running down a window over out-of-focus city lights | 2.5D |
| `diya-lake` | Diya Lake | Lanterns drifting up over still water, with reflections | 2.5D |
| `nebula-drift` | Nebula Drift | A slowly drifting version of the Nebula still, with depth-layered stars | 2.5D |

Each scene has ≥4 presets (matching the still-generator rule), its own colour params, `speed` (scales `loopSeconds` among a set of whole-loop values so it still loops) and `seed`.

### Mac app Live mode
- A new `Mode.live`, with a scene and preset picker filled from `/api/live`.
- For each `NSScreen`, it opens a borderless `NSWindow` at `CGWindowLevelForKey(.desktopWindow)`. The window has collection behaviour `[.canJoinAllSpaces, .stationary, .ignoresCycle]`, has `ignoresMouseEvents = true`, and holds a `WKWebView` loading `/live/<id>/play?...` at that screen's size.
- Mouse: it polls `NSEvent.mouseLocation` 30 times a second, which needs no Accessibility permission, and forwards the position through `evaluateJavaScript`.
- The scene's poster is also set as the real desktop picture, so the lock screen, Mission Control and a crashed player still look right.
- **Pause defaults (on):** on battery, when the window is fully covered (`occlusionState`), when the screen sleeps or locks, or when Low Power Mode is on. The menu offers "Pause live wallpaper" and 30/60 fps.
- Leaving Live mode closes the windows and goes back to the still flow.

### More stills (seed pool V2)
- 6 new still generators. Final picks are left to the builder. Candidates: Isometric Blocks, Paper Cut (layered shadows), Voronoi Glass, Rangoli, Low-poly Peaks, Riso Bloom. Each passes the existing generator test suite.
- `POOL_V2` holds every generator, including the 17 that seed links never pick today (event-horizon through frutiger-aero, plus the new ones). It's used for seeds 1,000,000–1,999,999, and `SEED_MAX` rises to match.
- `dailySeed(date)` keeps its V1 formula for dates before the V2 launch date. From that date on it maps into the V2 range. The snapshot test stays green, and a new snapshot pins V2.

## Delivery order (one plan each)
1. **Live engine + site** (scene model, runtime, the first scene, pages, exports, posters). Plan: `docs/superpowers/plans/2026-11-24-live-wallpapers-web.md`
2. **The other 7 scenes**, one task each, on the same plan's scene template.
3. **Mac Live mode**: a separate plan, written once part 1 ships the `/play` route.
4. **More stills + seed V2**: a separate plan, independent of the others, so it can run in parallel.

## Left to the builder
Shader art direction within each scene's one-line brief, preset colours, the exact poster phase if phase 0 looks dull, and copy on the `/live` pages (following the site's neutral tone).
