# STATUS, Scaffold A (Oct 31, 2026)

Machine: Windows 11, Node v25.1.0, npm 11.6.2.

## Pinned versions (package.json, exact)

phaser 4.2.1, electron 45.2.1, vite 8.3.5, @electron-forge/cli 8.0.1, plugin-vite 8.0.1,
plugin-fuses 8.0.1, plugin-auto-unpack-natives 8.0.1, maker-zip 8.0.1, @electron/fuses 2.1.3.
`engines.node` is `>=22.13.0` (the `engines` field of @electron-forge/cli 8.0.1).

`overrides` pin glob 14.0.3 and minimatch 11.0.3 (used by `@electron/asar` during packaging) to clear
advisories GHSA-3g3m-2fjr-6pw4 and GHSA-g3hv-75wg-m249. `npm audit`: 0 vulnerabilities.

## Verified

| Check | Command | Result |
| --- | --- | --- |
| Fixtures | `node tools/make-fixtures.mjs` | 10 files saved; 9 from engine runs (seeds 1 and 34), `trim` synthetic |
| Engine loads under Node | `node tools/check-engine.mjs` | `OK Ferry.create(1) -> phase = boarding \| shore = 5 \| light = 6` |
| Phase to scene map | `node tools/check-router.mjs` | 10 of 10 fixtures map to the expected scene; one `BOARD` from `create(1)` returns a state that maps to BoardingScene (the contract `router.dispatch` relies on) |
| Rules test | `node rules/tests/quest-check.js` | 22 passed, 0 failed; rerunning leaves `quest-results.json` unchanged (no timestamp) |
| T-45 rules update (Nov 2, macOS, Node 26.8.2) | `node tools/build-content.js`, `node tests/quest-check.js` from `rules/`, then `npm run fixtures` and `npm run check` | content `55f1026e...`; quest-check 22 passed, 0 failed; fixtures regenerated; see `notes/T-45_Rule_Changes.md`. `npm start` and the exe NOT_RUN for this change |
| Fresh clone | clone of main at `af7dcb8`, `npm ci`, `npm run check`, `npm start` | installs and boots; 12 of 12 checks OK |
| Electron app | `npm start`, killed afterwards | stdout showed Phaser 4.2.1 WEBGL booted, `Ferry.create(1) -> state.phase = boarding`, `TitleScene shown`. When the window was hidden, scenes did not start until it was visible (Phaser runs on animation frames) |
| Live scene switch | one interactive `npm start` session (a person clicked Next) | `TitleScene: Next pressed, starting a new run (seed 1)` then `BoardingScene shown (phase boarding)` |
| Dev launcher | `FERRY_QUERY=?scene=ReturnScene&fixture=review-return` | `ReturnScene shown (phase review)`, router maps fixture to ReturnScene |
| Packaged app | `npm run package`, then run `out/The Ferryman-win32-x64/The Ferryman.exe` for 40 s | packaged with asar (359 MB `out/`); exe stdout showed Phaser booted, `Ferry.create(1) -> boarding`, `TitleScene shown`, so the CommonJS fallback in `src/ferry.js` works in production |
| Assets inside `.asar` (T-08, Nov 1) | temporary local test: placeholder `assets/art/t08-test.png` (copy of `source-art/mother.png`, 2.9 MB), `assets/backgrounds/t08-test-bg.png` (copy of `shore.png`), `assets/audio/t08-test.ogg` (3 s ffmpeg tone, 8 KB, above Vite's 4 KB inline limit), TitleScene calling `queueAssets`, `addArt` and `playSound` for those ids plus a missing id; clean `npm run package`; exe run for 40 s | `asar list` shows all three as hashed files under `.vite/renderer/main_window/assets/` and none loose on disk. Exe log: page at `.../resources/app.asar/.vite/renderer/main_window/index.html`; Phaser `filecomplete` for all three, no `loaderror`; `addArt` returned an Image (1024x1536 texture) for art and background and a letter-emblem Container for the missing id; `playSound` returned a playing sound for the OGG and `null` for the missing id. The test edits and files were removed afterwards and not committed |

## Not verified

- `router.dispatch` from a scene and `exitDone()` gating with a real exit animation; the 5 s timeout.
- Preloader in the dev window (`npm start`) with a real file: the T-08 test ran only in the packaged exe. That the sound is audible is not checked: the machine logs an AudioContext device error (see notes), although the OGG loaded and decoded into the cache.
- Dev menu (top-right selector) not clicked.
- `npm run make` (win32 zip), SmartScreen, a second PC.
- Fixture play: seed 1 and 34 only; no human playtest.

## Deviations and notes

- `trim` fixture is synthetic: random play never exceeded a 1-memory hand at game end; it is the `window` state with 4 memories that pass `Ferry.validate`.
- `review` of a return window maps to `ReturnScene` (engine keeps `window.kind` during review).
- Emblem letter skips a prefix such as `SOUL-` (otherwise every soul would show "S").
- TitleScene's Next starts a run through `router.newGame(1)`; the other stubs only call `exitDone()`.
- No Squirrel installer: the Squirrel maker pulled in old glob 7 / minimatch 3 that cannot be overridden safely, so it and `electron-squirrel-startup` were removed. The deliverable is the packaged `The Ferryman.exe` folder; `npm run make` zips it for win32.
- Forge template makers for deb/rpm and oxlint/oxfmt were removed.
- Electron prints a CSP warning in dev; no CSP is set yet.
- `npm start` and the exe log "The AudioContext encountered an error from the audio device" on this machine's session (likely no audio device available; not investigated).
- Vera fonts copied into `assets/fonts/` (with licence); not yet loaded by any scene.
