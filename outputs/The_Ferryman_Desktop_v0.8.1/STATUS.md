# STATUS, Scaffold A (Oct 31, 2026)

Machine: Windows 11, Node v25.1.0, npm 11.6.2. Committed on branch `worktree-scaffold-a`, not pushed.

## Pinned versions (package.json, exact)

phaser 4.2.1, electron 45.2.1, vite 8.3.5, @electron-forge/cli 8.0.1, plugin-vite 8.0.1,
plugin-fuses 8.0.1, plugin-auto-unpack-natives 8.0.1, maker-squirrel 8.0.1, maker-zip 8.0.1,
@electron/fuses 2.1.3, electron-squirrel-startup 1.0.1. `engines.node` is `>=22.13.0`
(the `engines` field of @electron-forge/cli 8.0.1).

## Verified

| Check | Command | Result |
| --- | --- | --- |
| Fixtures | `node tools/make-fixtures.mjs` | 10 files saved; 9 from engine runs (seeds 1 and 34), `trim` synthetic |
| Engine loads under Node | `node tools/check-engine.mjs` | `OK Ferry.create(1) -> phase = boarding \| shore = 5 \| light = 6` |
| Phase to scene map | `node tools/check-router.mjs` | 10 of 10 fixtures map to the expected scene; one `BOARD` from `create(1)` returns a state that maps to BoardingScene (the contract `router.dispatch` relies on) |
| Production loader | `npx vite build -c vite.renderer.config.mjs`, then read the bundle | Vite wraps `engine.js` as CommonJS, so `globalThis.Ferry` is not set; `src/ferry.js` falls back to the module export (compiled code checked, not run in a packaged app) |
| Renderer bundle | `npx vite build -c vite.renderer.config.mjs` | built, 1,444.80 kB JS |
| Electron app | `npm start`, ~25 s, killed afterwards | stdout showed Phaser 4.2.1 WEBGL booted, `Ferry.create(1) -> state.phase = boarding`, `TitleScene shown` |
| Dev launcher | `FERRY_QUERY=?scene=ReturnScene&fixture=review-return` | `ReturnScene shown (phase review)`, router maps fixture to ReturnScene |

## Not verified

- Clicking "Next" buttons and live scene switching through the router (only the pure mapping and boot paths were run).
- `exitDone()` gating and the 5 s timeout (code written, not exercised).
- Preloader with a real file (asset folders are empty); emblem fallback code not exercised, `addArt` unused by the stubs.
- Dev menu (top-right selector) not clicked.
- `npm run package` / `make` (Scaffold B), Windows `.exe`, `.asar`, SmartScreen.
- Fixture play: seed 1 and 34 only; no human playtest.

## Deviations and notes

- `trim` fixture is synthetic: random play never exceeded a 1-memory hand at game end; it is the `window` state with 4 memories that pass `Ferry.validate`.
- `review` of a return window maps to `ReturnScene` (engine keeps `window.kind` during review).
- Emblem letter skips a prefix such as `SOUL-` (otherwise every soul would show "S").
- TitleScene's Next starts a run through `router.newGame(1)`; the other stubs only call `exitDone()`.
- Forge template makers for deb/rpm and oxlint/oxfmt were removed. MakerZIP is still darwin-only; Scaffold B decides makers.
- `npm audit` reports advisories from the Forge toolchain; not addressed.
- Electron prints a CSP warning in dev; no CSP is set yet.
- One `npm start` run logged "The AudioContext encountered an error from the audio device" (likely no audio device in that session; not investigated).
- Vera fonts copied into `assets/fonts/` (with licence); not yet loaded by any scene.
