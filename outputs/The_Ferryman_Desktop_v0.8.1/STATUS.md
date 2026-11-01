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
| Fresh clone | clone of main at `af7dcb8`, `npm ci`, `npm run check`, `npm start` | installs and boots; 12 of 12 checks OK |
| Electron app | `npm start`, killed afterwards | stdout showed Phaser 4.2.1 WEBGL booted, `Ferry.create(1) -> state.phase = boarding`, `TitleScene shown`. When the window was hidden, scenes did not start until it was visible (Phaser runs on animation frames) |
| Live scene switch | one interactive `npm start` session (a person clicked Next) | `TitleScene: Next pressed, starting a new run (seed 1)` then `BoardingScene shown (phase boarding)` |
| Dev launcher | `FERRY_QUERY=?scene=ReturnScene&fixture=review-return` | `ReturnScene shown (phase review)`, router maps fixture to ReturnScene |
| Packaged app | `npm run package`, then run `out/The Ferryman-win32-x64/The Ferryman.exe` for 40 s | packaged with asar (359 MB `out/`); exe stdout showed Phaser booted, `Ferry.create(1) -> boarding`, `TitleScene shown`, so the CommonJS fallback in `src/ferry.js` works in production |

## Verified: T-16 memory UI and T-17 GameOverScene (Jaoguya, Nov 1, 2026)

Machine: Windows 10 Pro, Node v24.22.1, npm 11.19.1.

| Check | Command | Result |
| --- | --- | --- |
| Memory hand view model | `node tools/check-memory.mjs` | 15 of 15 OK: playable cards and Calm targets in the outward window, Light with no target, hand locked after `START_CROSSING` with the engine's reason, Light refused during boarding, hand usable in the return window, empty hand note, trim fixture 4 held / 1 excess, one `DISCARD_MEMORY` returns to `window` |
| Game-over view model | `node tools/check-gameover.mjs` | 10 of 10 OK on the `ended` fixture plus synthetic quest lists (names, Done/Failed/Unfinished, failure reason, 8-row cap) |
| Existing checks | `npm run check` | 12 of 12 OK (unchanged) |
| TrimOverlay in Electron | `FERRY_QUERY=?scene=TrimOverlay&fixture=trim`, a person clicked Discard | `TrimOverlay shown (phase trim, hand 4)` then `CrossingScene shown (phase window)`: `router.dispatch` from a scene and the overlay close both work |
| GameOverScene in Electron | `FERRY_QUERY=?scene=GameOverScene&fixture=ended`, a person clicked Start a new run | `GameOverScene shown (...)`, `back to title for a new run`, `TitleScene shown`, then a new run reached `BoardingScene` |

Not verified for T-16 / T-17: the memory hand inside a real scene (no scene mounts `MemoryHand` yet), card and target picking by mouse, the failure-reason hover on GameOverScene, more than 5 cards in TrimOverlay. `check-memory.mjs` and `check-gameover.mjs` are not in `npm run check` (that needs a `package.json` change by purin-kan).

## Not verified

- `router.dispatch` from a scene and `exitDone()` gating with a real exit animation; the 5 s timeout.
- Preloader with a real file (asset folders are empty); emblem fallback code not exercised, `addArt` unused by the stubs. Asset paths inside the `.asar` are untested for the same reason.
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
