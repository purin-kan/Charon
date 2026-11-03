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
| T-45 Long names and save version (Nov 2, Windows 11, Node 25.1.0) | same commands, then `npm start` with `?scene=BoardingScene&fixture=boarding` | content `acac57d0...`; quest-check 22 passed, 0 failed; fixtures regenerated; `npm run check` 5 of 5 passed; BoardingScene opened on version `0.8-t45`, no errors. The exe NOT_RUN for this change |
| T-45 Calm and White flag (Nov 3, Windows 11, Node 25.1.0) | same commands | content `2c13c429...`; quest-check 23 passed, 0 failed; fixtures unchanged; `npm run check` 5 of 5 passed; BoardingScene opened on `0.8-t45`, no errors. The exe NOT_RUN for this change |
| Anger 5 rule (branch `anger-max-5`, Nov 3, macOS, Node local) | `node rules/tools/build-content.js`, `node rules/tests/quest-check.js`, `npm run fixtures`, `npm run check` | after merging main (#21, #23): quest-check 24 passed, 0 failed (new: Anger 5 safe, 6 Wraith, departure -3); fixtures regenerated; 6 of 6 checks OK, `check-delivery` Wraith setups use `shipAngerLimit - 1`. No `npm start` or human playtest |
| Fresh clone | clone of main at `af7dcb8`, `npm ci`, `npm run check`, `npm start` | installs and boots; 12 of 12 checks OK |
| Electron app | `npm start`, killed afterwards | stdout showed Phaser 4.2.1 WEBGL booted, `Ferry.create(1) -> state.phase = boarding`, `TitleScene shown`. When the window was hidden, scenes did not start until it was visible (Phaser runs on animation frames) |
| Live scene switch | one interactive `npm start` session (a person clicked Next) | `TitleScene: Next pressed, starting a new run (seed 1)` then `BoardingScene shown (phase boarding)` |
| Dev launcher | `FERRY_QUERY=?scene=ReturnScene&fixture=review-return` | `ReturnScene shown (phase review)`, router maps fixture to ReturnScene |
| Packaged app | `npm run package`, then run `out/The Ferryman-win32-x64/The Ferryman.exe` for 40 s | packaged with asar (359 MB `out/`); exe stdout showed Phaser booted, `Ferry.create(1) -> boarding`, `TitleScene shown`, so the CommonJS fallback in `src/ferry.js` works in production |
| Assets inside `.asar` (T-08, Nov 1) | temporary local test: placeholder `assets/art/t08-test.png` (copy of `source-art/mother.png`, 2.9 MB), `assets/backgrounds/t08-test-bg.png` (copy of `shore.png`), `assets/audio/t08-test.ogg` (3 s ffmpeg tone, 8 KB, above Vite's 4 KB inline limit), TitleScene calling `queueAssets`, `addArt` and `playSound` for those ids plus a missing id; clean `npm run package`; exe run for 40 s | `asar list` shows all three as hashed files under `.vite/renderer/main_window/assets/` and none loose on disk. Exe log: page at `.../resources/app.asar/.vite/renderer/main_window/index.html`; Phaser `filecomplete` for all three, no `loaderror`; `addArt` returned an Image (1024x1536 texture) for art and background and a letter-emblem Container for the missing id; `playSound` returned a playing sound for the OGG and `null` for the missing id. The test edits and files were removed afterwards and not committed |
| T-20 logic (Nov 2) | `npm run check` on macOS, Node v25.9.0 | all 6 checks pass; `tools/check-delivery.mjs` 60 OK, 0 FAIL against the real engine |
| T-20 in the window (Nov 2) | scripted real mouse input over the debug port in `npm start`, screenshots read; temporary fixtures for the exits, removed afterwards | DeliveryScene: wish outline and dimming, refused drop shows the engine's reason, drag to the dock and back, click and drop on water change nothing, departure, reward, reward skipped by a click, confirm straight after a drop, deck row for souls with no seat, then on to CrossingScene and ReturnScene stubs, TrimOverlay stub, ChoiceOverlay and GameOverScene stub. ChoiceOverlay: Po Luem with 1 and 8 memories, Charybdis and Zilla, empty boat and `Finish round`. After the self-review: a marked deck soul returns to its deck spot, undoing the soul ahead of Mason sends him back with the engine's reason, a level 3 Po Luem theft of a held memory and of a new reward both show a line, and a double-click through a reward with about 120 ms and 40 ms between clicks loses nothing. With `choice.inputDelayMs` set to 0 for one run, the same double-click did lose a memory, so the delay is what prevents it. After the second review: `Keep everyone` with a level 3 Po Luem theft now shows its lines (it closed unseen before), a Wraith inside `DELIVER` shows the soul and the Light lost, also when it ends the run, and the board behind the Po Luem choice shows the new Light and seats. Memory text is cut at three lines, seen with 8 memories including the longest text, Passenger. TitleScene Continue on a save at phase `choice` moves on with no 5 s wait. `delivery-match` and `choice-odysseus` were rerun after rebasing on main at `e9358e5`; the others ran just before it, and the rebase brought in the preloader and asset-name change |
| T-20 played by hand (Nov 2) | SupaOhm, `npm start` on macOS with `delivery-match`, then `choice-odysseus` and `choice` from the dev menu | passed: Mother to the dock and back, Mason refused with "Wishes for Acheron.", delivery with departure and reward, both Odysseus options, the Po Luem choice. Played by the task owner, not a playtest |
| T-20 after purin-kan's review (Nov 3) | `npm run check` on macOS; `npm start` with `choice-odysseus`, `delivery-match` and `choice`, scripted real mouse input, screenshots read | all 6 checks pass; `check-delivery` 70 OK, 0 FAIL. New checks against the real engine: a lethal Wraith names only itself; a soul marked after a Po Due that ends the run is refused with its own reason, and the Po Due itself may still be marked; a Po Due below Anger 2 is not outlined though its wish matches; a Po Long fare beside a Wraith shows Lost 1 and Gained 1 Light; Charybdis and Zilla with a held memory and a Farmer aboard list the memory taken, the Wraith and the Light; the memory picked for Po Luem is not listed as lost. Each new check failed with its fix turned off. In the window: Charybdis and Zilla show Moly and Nobody before DeliveryScene opens, the delivery reward still shows, a Po Luem pick goes straight on. The costly Odysseus branches were not seen in the window |

## Not verified

- T-20: a playtest by someone other than the owner; ChoiceOverlay over a real CrossingScene (Odysseus's choice fires on arrival, over CrossingScene, so T-19 must handle the boat animation being covered); DeliveryScene re-entry from a real CrossingScene; TrimOverlay itself after a delivery (only its stub is on main); a delivery that ends the run partway through a list of souls, in the window or against the engine (`check-delivery` uses a hand-built next state; a lethal Wraith is covered by both); a level 5 Polong corrupting another soul shows no line; a real destination background and real sprites; Windows; packaged `.exe`.

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
