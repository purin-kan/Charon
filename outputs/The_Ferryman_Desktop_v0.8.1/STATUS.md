# STATUS, Scaffold A (Oct 31, 2026)

## Lore intro after New game (branch `sfx-volume`, Nov 8, 2026)

New game now plays five short lore screens (`lore.screens` in `src/data/scene-text.json`) before the run; Continue does not. Each screen fades in line by line, holds, and fades out; a click or a plain key moves on, Esc starts the run (no Skip button; the only hint on screen is "Esc to skip", at the bottom). Lone modifier keys (Alt+Tab), Ctrl/Alt/Meta chords, F-keys and held-key repeats do not move it on (`advancesLore` in `src/scenes/lore-layout.js`).

| Check | Command or method | Result |
|---|---|---|
| Automated checks | `npm run check` (new `tools/check-lore.mjs`) | 14 of 14 passed |
| Renderer build | `vite build --config vite.renderer.config.mjs` | passed |
| Packaged exe, after the Skip button and "Click to continue" were removed | exe over its debug port, real clicks and keys, screenshots read | New game shows screen 1 with only "Esc to skip" below; Esc starts cycle 1 boarding with the save written; left alone, all five screens play and cycle 1 boarding starts on its own; Continue goes straight to boarding; 0 exceptions. Found and fixed on the way: `finishLore` still disabled the removed Skip button (`lore.frame[2]`), so the intro crashed instead of starting the run; `check-lore` now checks every `lore.frame[i]` exists |
| Menu bar hidden (`src/main.js`, `setMenuBarVisibility(false)`) | packaged exe, window captured with PrintWindow | no File / Edit / View / Window bar; the game area grew from 655 to 681 px tall; the menu's shortcuts are kept |
| Title music into the run | Web Audio gain values logged in the exe while Esc started the run | the title music fell from 0.47 to 0 over about 3 s along the new curve (0.24, 0.12, 0.05, 0.01, 0), no cut |

`check-lore` covers the pure logic only: the screen text, timings, the sequence state machine (the run starts once under random clicks, keys, timers and Esc), which keys move on, and `entryPlan` (New game plays the lore, Continue does not). The TitleScene wiring that also guards against a second start (`this.leaving` in `enterRun`, `this.lore = null` in `finishLore`, the `this.lore !== lore` checks in the fade callbacks) is not tested automatically.

| Check | Who | Result |
|---|---|---|
| Watch the intro in the game window (fades, text fits) | human | NOT_RUN |
| Double start: New game, then Esc, clicks and waiting for the hold timer in quick mixes; the run must start once | human | NOT_RUN |

## Sound levels (branch `sfx-volume` at `ac46a8d`, Nov 8, 2026, after the freeze)

Update, Nov 8 evening: the title music cut off when a run started. Music and ambience fades used the screen-motion timing (`MS.slow`, 700 ms, or 90 ms with reduced motion) and a straight-line fade. They now use `SOUND_FADE_MS` (3000 ms in and out, never shortened by reduced motion) and a curve that settles into silence (`fadeProgress` in `src/sound-levels.js`); `check-sound` covers both.

purin-kan played the final zip and found the sound effects too loud, the delivery one most. Every sound played at full volume except the title music (0.5). Measured with ffmpeg: delivery -18.8 LUFS, fog -21.0, Wraith -22.9, run ambience -44.2, title music -16.1. `src/sound-levels.js` now sets one volume per sound (delivery 0.28, fog 0.35, Wraith 0.45, click 0.45, board and unboard 0.55, ambience 1, title music 0.5), read by `playSound` and `fadeInLoop`. This changes the build after the hard freeze (#38), so it needs the team's agreement there.

| Check | Command or method | Result |
|---|---|---|
| Automated checks | `npm run check` (new `tools/check-sound.mjs`) | 13 of 13 passed |
| Levels reach the packaged exe | `npm run package`, exe over its debug port with Web Audio gain values logged, one soul boarded | the board sound played at gain 0.55; 0 console errors |
| Zip | `tar -a` of `out/The Ferryman-win32-x64` | `The Ferryman-win32-x64-0.8.1-ac46a8d-sound.zip`, 198.9 MB |

NOT_RUN: hearing the new balance (purin-kan to listen); the delivery, fog and Wraith cues played in the exe (same `playSound` path as the board sound).

## Final build candidate and re-test (branch `delivery-name-spacing` at `92268c6`, Nov 8, 2026)

`main` at `1681b4f` (#57 and #58 merged) plus one commit: names in a boat row now also sit at two heights when two wide names are side by side (Long Grasp next to Merchant in `delivery-match`, found in #56). Built and tested by a Claude Code session on purin-kan's Windows PC (Windows 11 Pro 10.0.26200, Node v25.1.0). Agent checks over the exe's debug port, screenshots read. Not a human playtest, and not a second Windows machine.

| Check | Method | Result |
|---|---|---|
| Automated checks | `npm run check`; `node tests/quest-check.js` from `rules/` | 12 of 12 passed (new case: Long Grasp and Merchant names at different heights); quest-check 34 passed, 0 failed |
| Name fix on screen | Vite dev server, `?scene=DeliveryScene&fixture=delivery-match`, headless Edge screenshot | Merchant and Cook lifted, Long Grasp and Mason level; no names touch. `delivery` fixture (Mother, Child, Mason) stays level |
| Package | `npm run package` | `out/The Ferryman-win32-x64/The Ferryman.exe` |
| Zip | `npm run make` fails at the zip step on Node 25 (`cross-zip` calls `fs.rmdir` with `recursive`, removed in newer Node); zipped by hand with `tar -a` | `The Ferryman-win32-x64-0.8.1-92268c6.zip`, 198.9 MB, SHA-256 `1EE9535B...72482`; extracted to a new folder, boots to the title, 0 errors |
| Smoke run, `FERRY_QA=final-smoke` | packaged exe, random seed, drag to board, real clicks | Title, New game, board 4 (drag), cast off, bow-view fork (names clear, QA-03), Asphodel (Light 7 → 6), Cook delivered with a memory, River Styx with Merchant delivered and Mason dropped early: "Leaving away from a wish costs 1 Light each: 1 marked, Light 6 → 5" (QA-01), Haven with Child, return review "Light 5/7 → 7/7", cycle 2 boarding with 5 souls ashore. 0 console errors |
| Save persistence | exe closed mid-delivery, reopened | Continue read "Cycle 1 · Light 6/7" and resumed at the Asphodel delivery |
| Background window | the job had no visible desktop: `visibilityState` was `hidden` and Phaser paused | rerun with `--disable-renderer-backgrounding --disable-backgrounding-occluded-windows` and a visibility override injected over CDP; this does not change the shipped build |

NOT_RUN: a second Windows machine (T-44 asks for one); SmartScreen on a downloaded copy of this zip; hearing the sound; game over, heroes, Longs and quests in this build (covered by SupaOhm's run on `942d825` above and the automated checks, not re-played here); a human playtest.

## Windows packaged exe, the #56 Windows part (Nov 8, 2026)

Run by a Claude Code session on SupaOhm's Windows PC (Windows 11 Pro 10.0.26300, Node v24.13.0, 1920x1080 at 144 Hz) on `main` at `942d825`, so the `qa-56-fixes` commits below are **not** in this build. Real mouse input over the exe's debug port (`--remote-debugging-port=9333`), screenshots read. Agent checks, not a human playtest. Evidence (screenshots, exe stdout, scripts) stays outside the repo on that PC and was handed over as a folder.

| Check | Method | Result |
|---|---|---|
| Install and package | `npm install`, `npm run package`, `npm run make` | 152 packages, 0 vulnerabilities; package 12.6 s, `out/` 407 MB, `app.asar` 52.9 MB; zip 198.6 MB |
| Assets in the `.asar` | `npx @electron/asar list` | all 71 PNG and 8 OGG under `.vite/renderer/main_window/assets/`, none loose on disk; 4 of 7 TTF (the ones the CSS uses) |
| Launch time | exe stdout | title 9.1 s on the first launch (no app data), 1.0 s on the second; no error or warning lines in either |
| Smoke run, `FERRY_QA=qa` | full run, random seed | 4 cycles, 9 deliveries, returns, a Long taking a memory, two trims, game over at cycle 5 ("Long Grasp delivery"); 0 console errors or warnings |
| Close mid-run and Continue | closed at cycle 2 boarding (window close), reopened | "Continue, Cycle 2, Light 7/7"; Continue restored Boarding with the two picked souls aboard |
| Save separation and F2 | `localStorage`, key presses | only `the-ferryman:desktop:qa:qa:save` written; F2 opens no tuning panel in the exe |
| Art | screens seen | 78 textures, real art everywhere, no name plates; Charybdis (QA-02) never came up |
| Sound | `sound.play` counted | all 8 sound ids played (menu music, crossing ambience, 48 clicks, 11 board and 2 unboard footsteps, delivery, fog, 4 Wraith); Web Audio `running` |
| Minimize and restore mid-crossing | window minimized 6 s | crossing paused, resumed on restore, arrived correctly |
| Alt-tab mid-crossing | another window in front 6 s | game kept running, arrived correctly |
| Slow PC, simulated | CDP CPU throttle 6x and 20x | 6x 143 to 144 fps; 20x median 43, min 37 fps; crossing timing unchanged, no errors |
| Reduced motion | emulated `prefers-reduced-motion` reduce and no-preference | both clean, 135 to 144 fps |
| Downloaded-file warning | zip extracted with the downloaded-file mark; exe `NotSigned` | SupaOhm saw "The publisher could not be verified. Are you sure you want to run this software?" with Run and Cancel, and clicked Run; the game opened about 100 s after launch. This is Windows' Open File security warning, not the SmartScreen "Windows protected your PC" screen |
| 10 fixtures | dev window (`npm start`) | `boarding`, `window`, `fork`, `review`, `crossing-prep`, `crossing-concealed`, `crossing-heracles`, `crossing-lethal`, `delivery-match`, `ended` each open on the scene the router expects, no errors |
| Findings | | QA-05 reproduces in the exe (fixed on `qa-56-fixes`); in `delivery-match` the "Long Grasp" and "Merchant" names touch in Delivery (not in #56) |
| Hearing the sounds | person with speakers | NOT_RUN |
| No audio device | audio device disabled | NOT_RUN |
| A real slow PC | | NOT_RUN |
| SmartScreen on a second PC (T-14 retest) | | NOT_RUN |
| Charybdis art in play (QA-02) | | NOT_RUN |
| Played by a person | human | NOT_RUN |

## QA-01, QA-03, QA-04 and QA-05 from #56 (branch `qa-56-fixes`, Nov 8, 2026)

Presentation only; `rules/` unchanged. One commit per fix, each with its checks.

- QA-04: the game over summary says "1 cycle", "1 ordinary soul" and "1 quest" for a count of one (`gameover-layout.js`). The old `check-gameover` case expected the plural and passed only because it copied the bug.
- QA-05: New game on the title screen no longer asks to replace a run that has already ended; a run in progress or an unreadable save still asks (`asksBeforeNewGame` in the new pure `src/scenes/title-layout.js`, new `tools/check-title.mjs`).
- QA-01 (SupaOhm, Delivery owner, Nov 8): marking a soul away from its wish always shows a plain line, "Leaving away from a wish costs 1 Light each: 1 marked, Light 4 → 3."; the red warning stays for when the lantern goes out, and the two never show together. `exitCost` in `delivery-layout.js` mirrors only the engine's deliver step (Mason last, Long Grasp level 3+ damage that Guard absorbs, 1 Light per stray, Long Mist fare at Tartarus). It leaves out the rest of DELIVER (Anger, Wraiths, thefts), which is not the cost of leaving and would preview random outcomes. `check-delivery` compares it with the engine; breaking any of the four rules fails a check.
- QA-03: bow view souls stand 128 px apart instead of 92, wider than the 96 px name label (`CREW` and `crewXs` moved to `crossing-layout.js`, checked in `check-crossing`).
- QA-02 (no Charybdis art) is left open for art.
- Seen while checking, not fixed: in Delivery with `delivery-match`, the "Long Grasp" and "Merchant" names touch. That was already so before this branch and is not in #56.

| Check | Command or method | Result |
|---|---|---|
| Automated | `npm run check` | 12 of 12 (new `check-title.mjs`) |
| Rules | `node tests/quest-check.js` | 34 passed, 0 failed |
| Screens (screenshots, real clicks in a hidden headless Chrome on the Vite dev server, not a playtest) | game over (`ended`), title with an ended save then New game, title with a run in progress then New game, Delivery (`delivery-match`) marking the Cook, bow view (`crossing-odysseus`) | as intended: singular summary; no dialog for the ended run (log shows the new game start); the dialog still shows for a run in progress; cost line "Light 4 → 3" in plain text; Odysseus and Long Hollow names apart |
| Issue repro for QA-01 | seed 7, Mother, Child and Cook to Acheron | NOT_RUN (the `delivery-match` fixture covers the same case) |
| Red warning in the running game | Delivery with low Light | NOT_RUN (covered by `check-delivery`) |
| Packaged exe, Windows | `npm run package` | NOT_RUN |
| Played by a person | human | NOT_RUN |

## Crew in the bow view and clearer soul info (Nov 7, 2026)

Presentation only; `rules/` unchanged. At the left and right choice the souls aboard stand at the bottom centre of the bow view, with their names, wish marks and Anger, and hover detail; the subtitle moved to the top centre. The hover box now lays out Wish, Anger (coloured by how close to the limit) and Memory as labelled rows, the memory as its name only ("Memory: Fog Shield"), then rules and quests with the quest name in gold. `check-crossing.mjs` now expects "Anger:" and "Memory:".

| Check | Command or method | Result |
|---|---|---|
| Automated | `npm run check` | 11 of 11 |
| Scenes (screenshots, hidden browser, not a playtest) | fork with three souls, hovering Child and Mason | as intended, 0 console errors |
| Played by a person | human | NOT_RUN |

## Route choice from the bow (branch `v1.2-fork-view`, PR #54, Nov 7, 2026)

Presentation only; `rules/` unchanged. After a stop: disembark, Approach the fork, the boat rows off to the right, then the view from the bow shows one route on each side as floating text (name, Light cost, who wishes for it; no "remaining"). Only the text is clickable; the picked route shows a small Confirm under it, and clicking the other side switches. Under it only a subtitle, nothing to click. The old river signs and the fork panel are gone. Buttons in the bottom panels and the boarding panel are centred, with the warning or message on its own line.

| Check | Command or method | Result |
|---|---|---|
| Automated | `npm run check` | 11 of 11 |
| Scenes (screenshots, real clicks in a hidden browser, not a playtest) | delivery to approach, fork, pick, switch, Confirm, arrival; boarding, hero offer, return, prepare | as intended, 0 console errors |
| Played by a person | human | NOT_RUN |

## Memory hand and rewards (Nov 7, 2026)

Presentation only; `rules/` unchanged. The memory hand moved from the top right to the left, under the Light plate (`hud.handX` 24, `hud.handY` 112), and grows to the right; the red status line sits below it. A memory earned at a stop shows as its art alone (`delivery.rewardArt` 200 px), no name, text or heading, then flies to the hand. A delivered soul now moves right, toward the pier, as it fades. After the Starting Shore the boat rows in to the centre (`crossing.prepareX` 640) for memories and passenger abilities; at a later stop it stays at the pier.

| Check | Command or method | Result |
|---|---|---|
| Automated | `npm run check` | 11 of 11 |
| Scenes (screenshots, not a playtest) | crossing, boarding, delivery fixtures on the dev server | hand under the Light plate, no overlap, 0 console errors |
| Reward art and soul exit seen on screen | agent or human | NOT_RUN |
| Played by a person | human | NOT_RUN |

## Shore, souls and stops (Nov 7, 2026)

Presentation only; `rules/` unchanged. Soul heights from `src/data/soul-heights.json` (every Long 140 cm), souls stand still (no bob, no tail sway), one long dock under the starting shore row, the boarding and return panel at the top, the pier at a stop on the right screen edge with the boat parked beside it, and the game over screen lists every quest (repeats as one row with a count).

| Check | Command or method | Result |
|---|---|---|
| Automated | `npm run check` | 11 of 11 |
| Scenes (screenshots, not a playtest) | boarding, return, crossing, delivery, game over, on the dev server | as intended, 0 console errors |
| Planned run, seed 33, real mouse input in the dev window | title to the start of cycle 20, 212 moves | 0 console errors (run planned by a search with the seed known, not normal play) |
| Quest run, seed 27, real mouse input in the dev window | title to game over at cycle 15 | 9 quests completed, 7 of 8 kinds (not A poet awakens), 0 console errors |
| Arrival at a stop below about 10 frames per second | hidden browser, software rendering | painting and pier appear late or not at all (timers run on game time, the arrival on real time); fine at 30 frames per second |
| Played by a person | human | NOT_RUN |

## Motion polish (branch `polish-transitions`, Nov 6, 2026, not pushed)

Update, Nov 7: merged `main` (with #48's run-wide loops) into this branch. Menu music and the run ambience are now shared loops that fade: `fadeInLoop` and `fadeOutLoop` in `src/preloader.js`, called by `TitleScene.js` and `src/router.js`, so `router.js` is no longer unchanged. `npm run check` 11 of 11; fades, including a new run during a fade-out, checked only with simulated sounds. Sound fades heard: NOT_RUN.

Update, Nov 6 (agent, not a playtest): Tinpatpun asked for the boat to be on the water, going right, rowing slowly through fog as in `outputs/The_Ferryman_2D_Concept`. CrossingScene no longer zooms out over a drawn river. The boat is full size, the water, fog and painting slide left past it, and each 2.4 s stroke pushes it forward with a ring at the oar (`Water` in `river-boat.js`, `water.*`, `night.roamPx`, `crossing.fogBanks`). At the fork the boat waits on the left with the signs ahead of it. Fog takes the boat mid-crossing, the place and pier change inside it, and the boat pulls up to its stop. To the fork takes 4.2 s and a crossing 7 s. `crossing.bobPx`, `crossing.bobMs`, `crossing.riverAlpha`, `crossing.travelEase`, `crossing.enterFrom` and the unread `crossing.riverPath` are gone. On this code: `npm run check` 11 of 11, build passes, 14 memory cards in 69 cases all worked, full run seed 7 ended at GameOver at 241 fps with 0 console problems, 0 scene loads, 0 frames over 80 ms, slowest exit 2,909 ms. A hidden sign and the Foresight panel were seen on the new fork. A run in a hidden window drops to about 1 fps and stalls: that is Windows throttling, not the game. NOT_RUN: how it feels to a person.

Presentation only, on top of `full-game-restyle`; `rules/`, `package.json`, the lockfile, `src/scenes/index.js` and `src/router.js` are unchanged. Scene changes crossfade from the last frame, with a teal fade as fallback; Crossing and Delivery stay seamless. The interface uses one rhythm (`motion.*`: 180, 350, 700 ms); journeys keep their own lengths. All assets load at boot. Reduced motion is `motion.reduced` in F2 and follows the Windows setting.

| Check | Command or method | Result |
|---|---|---|
| Automated | `npm run check`, `quest-check` | 11 of 11 after each group; rules unchanged from `3168a38`, last run 33 passed |
| Fixtures (agent, not a playtest) | every fixture in `src/dev/fixtures/`, on the dev server | 18 of 18 opened, 0 console problems, worst frame 15 ms at 240 fps |
| Full run, seed 7 (agent, real mouse input) | title to GameOver | 4 cycles, 5 deliveries, 0 console problems, 0 scene loads, 0 frames over 80 ms, slowest exit 2,905 ms, snapshot about 25 ms |
| Same run, reduced motion emulated | `prefers-reduced-motion: reduce` | Same ending, 0 console problems, no crossfade frames |
| Memory cards (agent, real clicks) | 14 cards, every legal place | 69 of 69 used with their effect, 0 console problems |
| Visual feel of every transition | human | NOT_RUN |
| Sound fades heard | human | NOT_RUN |
| Reduced motion with the real Windows setting | human | NOT_RUN (emulated only) |
| Hero, quest and choice paths in a full run; F2 with the new keys | agent or human | NOT_RUN (the seed 7 run reaches none of them) |
| Packaged `.exe`, slower PC | human | NOT_RUN; all numbers above are from the dev server on one PC |

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
| Boat Anger limit 5 (branch `anger-max-5`, Nov 4, macOS, PM decision on #26) | `node rules/tools/build-content.js`, `node rules/tests/quest-check.js`, `npm run fixtures`, `npm run check` | quest-check 24 passed, 0 failed (new: boat Wraith at 5, shore 2 and departure reset unchanged); fixtures regenerated; 6 of 6 checks OK. No `npm start` or human playtest |
| #27 rework: Farmer Calm, meal, save `0.8-t45b` (branch `rules-memories-quests`, Nov 4, Windows 10, Node 24.22.1) | `node tools/build-content.js` and `node tests/quest-check.js` from `rules/`, `npm run fixtures`, `npm run check` | content `093c65f6...`; quest-check 25 passed, 0 failed (new: Farmer gives Calm, none after the meal; meal lowers every other soul including Longs, Cook +2; the lethal-meal check, commented out by a stray `//` since #26, runs again); each new check failed with its rule turned off in a scratch copy; fixtures regenerated; 10 of 10 checks OK. Memory timing is not in this change (SupaOhm, T-19). No `npm start` or human playtest |
| #27 after #37, Farmer meal or Calm (branch `rules-memories-quests`, Nov 5, macOS) | `main` merged in; `node rules/tools/build-content.js`, `node rules/tests/quest-check.js`, `npm run fixtures`, `npm run check` | content `08925833...`; quest-check 26 passed, 0 failed (new: Farmer gives Calm, but no memory if he shared the meal, which fails with the rule turned off; meal: every other soul -1 including Longs, Cook +2; Shared Harvest removed); fixtures regenerated for `0.8-t45b`; 10 of 10 checks OK. Memory timing is in #34. No `npm start` or human playtest |
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
| T-20 follow-up: long memory text (Nov 4) | `npm run check`, `node tools/check-delivery.mjs`, `node tests/quest-check.js` from `rules/` on macOS, Node v25.9.0; `npm start` with ChoiceOverlay and a temporary 8-memory copy of `choice` (removed afterwards), screenshot read | 10 of 10 checks pass; `check-delivery` 72 OK, 0 FAIL, with two new checks (a tall row pushes the next one down, each column starts at the top again); quest-check 23 passed, 0 failed. In the window the Long Hollow list shows all four lines of the Passenger text, which was cut at three before, and a column of the five longest texts (Passenger, Soldiers' Peace, Shared Harvest, Calm, Foresight, from a second temporary copy) ends just inside the panel; there the error line, shown only when the engine rejects a pick, would overlap the last row. The delivery rule is unchanged: a soul leaves only at its wish (VarisPah on #23) |
| T-19 CrossingScene (Nov 4) | `npm run check` on macOS, Node v25.9.0 (`check-crossing` is new); `node tests/quest-check.js` from `rules/`; `npm start` with the crossing fixtures, scripted real mouse input (moves and clicks) over the debug port, screenshots read | 11 of 11 checks pass; `check-crossing` 61 OK, 0 FAIL against the real engine, including that each branch ends with the boat and dock where DeliveryScene draws them; quest-check 23 passed, 0 failed. Breaking purify targets, the Light paid, the concealed flag or the arrival view each made `check-crossing` fail. In the window (one river world, the view pans and zooms): `crossing-prep` shows the boat at the Starting Shore, the memory strip, meal and purify, the warning; hovering the Cook shows his wish, Anger, Calm and the shared meal; hovering a memory shows the full card; purify outlines only the Farmer and Cook and calms the one clicked; the meal raises the Cook to Anger 2. Approach the fork: Long Hollow fades in with its line, the boat sails to the fork and the view pulls back to both branches with signs (River Styx, Asphodel, cost, wishes; hover shows the fog breakdown). Clicking Asphodel opens the review panel; Confirm sails the boat down the branch with ripples and fog, Light 6 to 4 with "−2 Light", the view returns to zoom 1, the dock appears and DeliveryScene opens with the boat, dock and river in the same place. `crossing-heracles`: Child and Merchant leave, Cerberus boards, Heracles' new wish, then DeliveryScene. `crossing-lethal`: "The lantern goes out.", then GameOverScene. `crossing-concealed`: "?" until arrival, then River Styx and DeliveryScene. `crossing-odysseus`: Tiresias's choice opens after the arrival. Not seen in the window: a memory that takes a target (Passenger, Sword) clicked on the boat, Back in review, a memory that empties the boat (to ReturnScene), DeliveryScene into the next crossing. `crossing-prep` and `crossing-concealed` are synthetic (souls swapped in an engine state, `validate` passes). Hand test by SupaOhm (Nov 4, macOS, `npm start` from `crossing-prep`): played through with no CrossingScene defect reported. Two findings: the shore (BoardingScene) did not say what each soul does when picking, now fixed with a hover on shore souls and the hero line (wish, Anger, the Priest's purify, the Merchant, Blacksmith and Mason rule, the memory it gives, its possible quests with partners; `check-crossing` 71 OK; SupaOhm checked it in the window, Nov 4); and the game still uses drawn shapes instead of the team's paintings in `assets/source-art/`, left for a separate art pass |
| T-19 rule changes (Nov 4) | `node tools/build-content.js` and `node tests/quest-check.js` from `rules/`; `npm run fixtures`; `npm run check` on macOS, Node v25.9.0; `npm start` with `crossing-prep` and a temporary `delivery-match` copy with two memories (removed afterwards), scripted mouse input, screenshots read | content `df9552ef...`, save version unchanged (`0.8-t45`; the new `longForks` field is optional, so older saves load with no Long scheduled for that cycle). quest-check 27 passed, 0 failed, with three new tests: one memory per stop at any point of it, one at boarding (Boat Space only, only there) and one on the return trip; Longs from cycle 3 (1 per cycle, 2 from cycle 9, 3 from cycle 18) at a fork picked from 1 to 3 on departure, skipped if the trip ends first; any soul but a Long may leave at any stop, with no memory, delivery count or fare unless it is its wish, and a quest soul that leaves early fails its quest. Turning off the memory cap, giving every cycle a Long, or restoring "only at its wish" each made quest-check fail. All fixtures regenerated; `choice` and `crossing-concealed` are now scripted from `window` with a Long due at the next fork, since random runs end before cycle 3. 11 of 11 checks pass (`check-crossing` 65, `check-delivery` 80, `check-memory` 16 OK). In the window: Light played at the fork, then the other card shows "One memory per stop: one is already played here." there and at the dock; in DeliveryScene a memory hovers with its full text and plays (Light 2 to 3), and souls hover with their details. Then, with temporary fixtures from engine runs (removed afterwards): a Long scheduled for fork 2 does not board at fork 1, "Keep everyone" goes from DeliveryScene into the next crossing with the same boat and dock, and Long Mist boards at fork 2; at River Styx the Child hovers with its quest, Passenger outlines the three souls, a click sends the Cook to his wish and gives Calm, and the Child dropped there leaves with "Mother and Child failed: Child left the boat before Haven." (a new line, `delivery.questFailed`, checked in `check-delivery`); Passenger on the only soul before the fork empties the boat and ReturnScene opens with Calm still playable on the return trip. Not run: Windows and the packaged `.exe` |
| T-19 after the PR #34 reviews (Nov 5) | merged `main` (`7f842a8`); `node tools/build-content.js` and `node tests/quest-check.js` from `rules/`; `npm run fixtures`; `npm run check` on macOS, Node v25.9.0 | Jaoguya's two changes (#6 and #34, Nov 4): Longs may leave at any stop (Long Grasp still refused below Anger 2), and the Mason may leave at any time, his quest failing if he leaves before the Merchant or ahead of another passenger (Longs count). purin-kan's item 5: Fog Shield, Full Fog Protection and Guard are refused at delivery with the reason shown. Heracles and Odysseus are unchanged, still refused, pending a PM answer. content `43e608dd...`, save version unchanged (`0.8-t45`, no state change). quest-check 28 passed, 0 failed (one new test: Fog and Full Fog Protection refused at the dock and playable at the next stop; the Mason and Long tests rewritten, Long Grasp below Anger 2 added). 11 of 11 checks pass (`check-delivery` 85 OK). `delivery-match` is now synthetic when random play has no refused soul: the fallback state plus a Long Grasp at Anger 0 (`validate` passes). Turning off each change in turn made quest-check fail, and `check-delivery` for the Long and Mason changes. Guard is covered only by the code, since no soul gives it yet. Not run: the window, Windows and the packaged `.exe` |
| T-19 after Varis's #34 and #33 comments (Nov 5) | merged `t-28-audio` (#33); `node tests/quest-check.js` from `rules/` (28 passed, 0 failed); `npm run check` 11 of 11, macOS, Node v25.9.0 | A soul let off at a stop other than its wish now costs 1 Light (Guard cannot prevent it and the last Light ends the run, PM answer in person Nov 5; DeliveryScene warns before confirming when the marked exits would put the lantern out), on top of no memory, fare or delivery count and a failed quest (Varis, #34). Heracles and Odysseus stay refused. CrossingScene plays `amb-crossing` while open and `sfx-fog` once on confirming a route whose engine fog is 1 or more (before the Light loss shows); DeliveryScene plays `sfx-delivery-success` when someone reaches their wish and `sfx-wraith` for a Wraith. Tests: the any-stop test and `check-delivery` expect the Light cost. NOT_RUN: hearing the sounds in the window, Windows, the `.exe`. One memory per stop now follows Varis's boundary: a stop starts on arrival (`crossing()` resets the count), and delivery, window, fork and review share it; `DELIVER` no longer resets it, and the return trip keeps its own. Merged `main` (`7413087`, hero timing): `make-fixtures.mjs` builds the hero forks at cycle 6 and 9, `crossing-prep` takes any waiting soul as its Priest, and `delivery-match` needs 3 Light and a leaver that fails no quest. Merged `main` again (`6c7dcc3`, #27): in `meal()` the Cook does not eat (#27) and the empty-boat return window is fresh (this PR); the Farmer's memory in the any-stop test is now `MEM-CALM`; save version `0.8-t45b`. Content `2d50dc72...`; quest-check 31 passed, 0 failed; `npm run check` 11 of 11. |
| T-19 after Jaoguya's review of #34 (Nov 5) | `node tests/quest-check.js` from `rules/` (31 passed, 0 failed); `npm run check` 11 of 11; `vite build`; macOS, Node v25.9.0 | Fixed: the memory hand is hidden once the boat sails; heroes (Heracles and Cerberus too) leave only at their wish at every stage; in one DELIVER the Mason is handled last, so who leaves with him counts as gone; a Long let off away from its wish no longer plays the delivery sound; the Long text on the boarding line; `keepValidMarks` drops only invalid marks; JSDoc fixes; `testRun` answers are cached per state. Not changed: the save version (already `0.8-t45b` from #27, and `validate` refuses other versions). NOT_RUN: hearing the sounds, clicking the scenes, Windows, the `.exe`. |
| T-19 Longs and the Mason (Nov 5, Jaoguya's reply on #34) | `node tools/build-content.js` and `node tests/quest-check.js` from `rules/` (31 passed, 0 failed); `npm run fixtures`; `npm run check` 11 of 11; macOS, Node v25.9.0 | Longs (tainted souls) are no longer passengers for Room for one more: the Mason leaving with only Longs left aboard completes the quest; any ordinary soul still aboard fails it. Test rewritten (Mason and a Long last, Mason leaves, quest completes; a Farmer aboard fails it). content `fafc437f...`. NOT_RUN: the window, Windows, the `.exe`. |
| Hero timing (branch `hero-timing`, Nov 4, Windows 10, Node 24.22.1, co-PM decision on #6) | `node tools/build-content.js` and `node tests/quest-check.js` from `rules/`, `npm run fixtures`, `npm run check` | content `738d1e80...`; `config.heroArrival`: Odysseus from cycle 6, Heracles from cycle 9, each offered at 25% per boarding (Heracles still needs more than three shore souls; one hero at a time). quest-check 25 passed, 0 failed; the new hero test (none in cycles 1 to 5, about 25% Odysseus in cycles 6 to 8 with no Heracles, both from cycle 9) failed with the cycle rule or the chance roll turned off in a scratch copy. Fixtures regenerated: `boarding-heracles` and `choice-odysseus` are now built from a state moved to cycle 9 or 6, since random play rarely reaches them. `check-boarding` puts Odysseus's offer on a cycle-6 copy; `check-delivery`'s Mason check builds its own two-soul boat (the new `delivery` fixture has three). 10 of 10 checks OK. No `npm start` or human playtest |
| ReturnScene plays `sfx-wraith` (branch `return-wraith-sound`, Nov 5, macOS) | `node tools/check-return.mjs`, `npm run check` | 3 new return checks (Confirm with a Wraith gives `sfx-wraith`; Confirm without one, Back and Review return give none); 10 of 10 checks OK. The sound file comes with #33; until then `playSound` stays silent. Not heard in `npm start` |
| Art import from handoff v4 (branch `art-import`, Nov 4, Windows 10, Node 24.22.1) | `node tools/check-art.mjs`, `npm run check`, `npx vite build --config vite.renderer.config.mjs` into a scratch folder | 49 PNGs copied from `The_Ferryman_Art_Handoff_Nov1_v4_RULES_SYNCED.zip` (release `art-handoff-nov1-v4`) into `assets/art/{souls,longs,heroes,boat,memories,wraith}/` and `assets/backgrounds/`; the six memories without a v4 placeholder (Light, Foresight, Guard, Calm, Fog Shield, Passenger) come from `assets/source-art/`. Art: 38 of 38 engine ids have a file; backgrounds: 6 of 6. The preloader globs now include subfolders; the Vite build bundled 56 PNGs; the new unique-name check failed with a duplicate `sprite-mother` added and passed once it was removed. 10 of 10 checks OK. `npm start` (art seen in a scene) and the exe NOT_RUN |
| Scene art: shore, boat, Wraith frames (branch `art-import`, Nov 5, macOS) | `npm run check`, `npx vite build --config vite.renderer.config.mjs`, `npm start` with `BoardingScene` / `boarding` | BoardingScene draws `bg-starting-shore` and `sprite-boat-horizontal` under the seats; ReturnScene draws `bg-starting-shore` and plays the five `wraith-transform` frames over each soul that turns on Confirm, then fades. 10 of 10 checks OK; build OK; Boarding opened with no errors. Placement not yet checked by eye; Delivery and Crossing left to #34 |
| Soul data from #6 (branch `soul-data`, Nov 5, macOS, rebuilt after #34) | `node rules/tools/build-content.js`, `node rules/tests/quest-check.js`, `npm run fixtures`, `npm run check` | content `874448e3...`; quest-check 32 passed, 0 failed (Red Soldier Tartarus + Guard, Blue Soldier Asphodel + Guard, Messenger Asphodel, Blacksmith Fog Shield; Soldiers quest completes across two stops; the Wraith-through-fog-protection check uses Fog Shield, and #34's dock-refusal check uses Guard, since Full Fog Protection has no source); fixtures regenerated (16 files); 11 of 11 checks OK. No `npm start` or human playtest |
| T-35 balance: Light and route tolls (branch `t-35-balance`, Nov 6, Windows 11, Node 24.11.0, PM decision on #45) | `node tools/build-content.js` and `node tests/quest-check.js` from `rules/`, `npm run fixtures`, `npm run check` | Values changed, each with its reason. **Start and maximum Light 6 to 7** and **return healing 1 to 2**: a trip takes about 3 to 4 forks, so 6 Light with +1 per return ran out in cycle 2 or 3 (T-30 runs on #38, VarisPah's runs Nov 6). **Route tolls -1** (Styx and Acheron 1 to 0, Asphodel 2 to 1, Elysium and Tartarus 3 to 2; Haven 0; the +1 from cycle 6 and +2 from cycle 12 unchanged): a fork offering two expensive routes forced 2 or 3 Light whatever the choice (Jaoguya, #45). A bot simulation (1,000 seeded runs per option, real engine, heroes declined; not a playtest) gave a median of 5 cycles and 41% of runs reaching cycle 6, against 2 cycles and 0% before. Save version `0.8-t45b` to `0.8-t45c`, since `validate` refuses a save whose maximum Light is below the new 7. Text: the engine's return line reads `config.returnLight` instead of a fixed "+1", and `return.cost` in `scene-text.json` says +2. Tests: quest-check's Po Long fare reads the Tartarus toll from data, and its fatal crossing and its Fog-Shield-with-Wraith check use Asphodel (now the only 1-toll route) instead of Styx (now 0); `check-boarding` reads Light from the state; `make-fixtures` always builds `trim` with the fixed 4-card hand (random play now reaches the hand limit on its own), and `delivery-match` needs an early leaver that gives a memory and fails no quest, as `check-delivery` assumes. content `6ecbf969...`; quest-check 33 passed, 0 failed; fixtures regenerated; 11 of 11 checks OK. The hero toll (#45 part 2) is not in this change. NOT_RUN: `npm start`, human playtest (T-33), the `.exe` |
| T-35 balance: route increase from cycle 9 (branch `t-35-balance`, Nov 6, Windows 11, Node 24.11.0, PM exception to the freeze on #45) | `node tools/build-content.js` and `node tests/quest-check.js` from `rules/`, `npm run fixtures`, `npm run check` | **Route fog +1 from cycle 9 and +2 from cycle 15**, instead of cycle 6 and 12 (Haven still none): one line in `engine.js` `fog()`, and the routes rule text in `content.json`. Reason: purin-kan's bot study on #45 (best of 36 strategies, 5,000 seeds; not a playtest) found cycle 6 a wall for good players; with this change good players reach a median of cycle 8 (35% reach cycle 9, against 0.5%), while random-play novices are unchanged (median cycle 2). Engine change after the T-29 freeze, as a PM exception (VarisPah). New quest test: route fog at cycles 1, 8, 9, 14 and 15 for Styx and Tartarus, and Haven always 0; it failed with the cycle 6 / 12 rule put back. content `e8fc2cfe...`; quest-check 34 passed, 0 failed; fixtures regenerated; 11 of 11 checks OK. NOT_RUN: `npm start`, human playtest, the `.exe` |

## Full game restyle, all scenes (branch `full-game-restyle`, Nov 6, 2026, not pushed)

Update 3, Nov 6 (agent, not a playtest): every memory card was tested in every place the engine allows, 14 cards in 69 cases, on temporary fixtures since deleted. Each was played with a real click and checked against the running game's state: 69 of 69 used the card and had its effect, 0 console problems. Passenger and Sword were aimed at a soul. Boat Space was checked by itself after its first try ran in a hidden window at 1 fps. Fixed: picking Passenger or Sword in CrossingScene overflowed the stack, because `MemoryHand.render` told its host about the targets on every render and the host rendered again. Open for VarisPah: Full Fog Protection works when held, but after #40 no soul or quest gives it. NOT_RUN: human playtest of the cards.

Update 2, Nov 6 (agent, not a playtest): the player name is Heracles again, Tinpatpun's later decision, now also in the soul and quest data (`Heracles the traveler`); the Hercules text in the update below was reverted. Longs ride on the deck with the souls, at the left end of one row: the row starts at the first seat, clear of the lantern, ends before the ferryman, tightens with Longs aboard, and every other name sits higher when the row is tight. Capacity and the rules are unchanged. All Longs ride on the left, Long Burden too. DeliveryScene and CrossingScene now share BoardingScene's stage (boat, seats, painting shift), so only the painting changes between places; souls step ashore in an arc, grow and gain a shadow, and souls aboard rock with the boat. The pier is `assets/art/boat/sprite-dock.png`, the painted pier of the starting shore traced out by hand, with `art.pier.*` in F2; a missing file leaves souls standing on the painting. This replaced a dock drawn in code that Tinpatpun rejected. Full run on this stage, seed 7, real mouse input, before the Long Burden fix: 61 fps, 4 cycles, 5 deliveries, Wraiths, Trim, GameOver, 0 console problems, with screenshots read of a boat arriving and of souls on the pier. #40 is merged in locally. NOT_RUN: human playtest, hero and quest paths on this stage, the packaged exe.
Update, Nov 6 (agent, not a playtest): `origin/main` (`1507394`, with #36) merged into this branch with no code conflicts, and the player text now says Hercules (ids and file names keep `HERACLES`). On that code: `npm run check` 11 of 11, `quest-check` 32 passed 0 failed, `vite build` passes. Moly played by real click with temporary fixtures (since deleted) in CrossingScene (two Longs) and DeliveryScene (one Long): the Longs leave, Memories drops to 0/3, signs and fog update, no console problems. Longs vanish at once, with no leaving animation. The rest of the full run was not repeated after the merge.

Correction to the art list below: `check-art` proves a file exists, not that the art is finished. Nine memory cards are v4 placeholder images with PLACEHOLDER printed on them: `last-prayer`, `moly`, `nobody`, `shared-harvest`, `last-masterwork`, `all-fog`, `golden-apple`, `boat-space`, `soldier-peace`.

Every scene now uses the shared theme, HUD, hand, night stage and bottom panel. Rules, `package.json`, the lockfile, `src/scenes/index.js`, `assets/source-art/` and the sprites are unchanged (`git diff origin/main HEAD` on those paths is empty).

| Check | Command | Result |
| --- | --- | --- |
| Logic | `npm run check` | 11 of 11 pass; `check-boarding` 81, `check-crossing` 71, `check-delivery` 77, `check-return` 23, `check-memory` 16, `check-route` 19, `check-gameover` 10, `check-art` 20, all OK, 0 FAIL |
| Build | `npx vite build --config vite.renderer.config.mjs --base ./` into a scratch folder | builds |
| Art | `node tools/check-art.mjs` | 37 of 37 art ids and 6 of 6 backgrounds have a file, so no engine id uses the name plate. The Charybdis card asks for `sprite-charybdis`, which has no file, so that one card shows its plate |
| Full run, seed 7 (agent, scripted real mouse input, not a playtest) | `npm start` with `FERRY_QA=restyle`, from TitleScene to GameOverScene on the final commit | 4 cycles, 5 deliveries, 3 returns, the run ended at 0 Light (the script plays to reach each flow, then lost on a fog cost). Scenes seen: Title, Boarding, Crossing, Delivery, Return, Trim, GameOver. Light loss, Wraiths at the return and a trim all played. 0 console errors or warnings |
| Fixtures (agent) | `window`, `fork`, `review`, `crossing-prep`, `crossing-lethal`, `crossing-concealed`, `crossing-heracles`, `crossing-odysseus`, `delivery`, `delivery-match`, `choice`, `choice-odysseus`, `trim`, `return`, `review-return`, `ended`, `boarding`, `boarding-heracles` | all opened and were driven; no exceptions. Heracles' toll from boarding through to CrossingScene, a lethal route through "The lantern goes out." to GameOverScene, Odysseus's choice over CrossingScene with its reward, the replace-save dialog, and GameOverScene's New game and Back to title |
| Quest completion (agent) | a temporary fixture built with real engine actions, removed afterwards | Room for one more completes on delivery and its Boat Space reward shows and goes into the hand |

The full run did not reach a hero, a completed quest or a choice, so those rest on the fixtures above.

NOT_RUN: every human check, including how the motion feels; the F2 panel with the new values; hearing the sounds; a real Boat Space card earned in play; the packaged `.exe`; a weaker PC (only the boarding scene's frame rate was measured, 60 fps on this machine).

Notes: `CrossingScene` keeps its own river path and camera, so `crossing.riverPath` stays unread, as it was. `RouteUI.js` is imported by nothing and keeps its old style; the scene uses `routeModel` directly. A return's animation has to fit the router's 5 s limit, about 4 s at the defaults with five souls. Long riders sit in front of the hull, under the boat, because the deck row is below it.

### First checkpoint

Done first: `src/theme.js`, the shared HUD (`src/components/Hud.js`), the HUD memory hand, the shared night stage (`night-fx.js`), the name plate for missing art, `art.*` frames in tuning, TitleScene, and BoardingScene moved onto all of these. Tinpatpun asked to keep the cut-outs from the v0.6 paintings although the restyle brief says to make no art files, on the understanding that the art may change: 11 files in `assets/art/figures/`, and `assets/source-art/` and the sprites are unchanged. Both soldiers share one figure, since the brief forbids recolouring and there is one painting. After seeing them in the game, Tinpatpun asked for 2D characters, so the sprites are the default again and the figures stay as an F2 option (`art.useFigures`, off).

| Check | Command | Result |
| --- | --- | --- |
| Logic | `npm run check` | 11 of 11 pass; `check-art` has 3 new figure checks |
| In the window (agent, not a playtest) | `npm start` with `FERRY_QA=restyle`, scripted real mouse input, screenshots read | Title: letter spacing fade, seed 7 typed, New game reaches BoardingScene from a real start. Boarding: figures on shore and boat, Cast off to CrossingScene. HUD hand with a temporary fixture (removed afterwards): hover shows the full card, Boat Space played takes seats from 4 to 5, the second card is refused with the engine's reason. Missing art, tested by making `addArt`, `soulArtId` and the boat treat images as absent for one run (reverted): dark name plates for souls and memory cards, an empty drawn hull for the boat, and a seated soul still shows |
| #46 merged with `main` after #50 (branch `full-game-restyle`, Nov 6, macOS) | `node rules/tools/build-content.js`, `node rules/tests/quest-check.js`, `npm run fixtures`, `npm run check` | Conflicts were only in the generated rules files, rebuilt from the merged `content.json` (content `af20b41f...`, save `0.8-t45c`). `check-return.mjs` assumed +1 Light on return, so its two flame checks now read `config.returnLight`; the game code already did. quest-check 34 passed, 0 failed; 11 of 11 checks OK. `assets/art/figures/` still in the branch. No `npm start` or human playtest on this merge |
| Build | `npx vite build --config vite.renderer.config.mjs --base ./` into a scratch folder | builds |


## Boarding panel click redesign (branch `boarding-click-redesign`, Nov 5, 2026)

Machine: Windows 11, Node v25.1.0. BoardingScene only: click replaces drag, with the night stage, bottom panel, Light flames, seat bar, chips, Undo, Clear boat and Cast off. `rules/`, `package.json`, the lockfile and `src/scenes/index.js` are unchanged. Delivery and Crossing keep `addSoulToken`, `layoutBoarding` and `boatZone`.

| Check | Command | Result |
| --- | --- | --- |
| Logic | `npm run check` | 11 of 11 pass; `check-boarding` 67 OK, 0 FAIL |
| Build | `npx vite build --config vite.renderer.config.mjs --base ./` into a scratch folder | builds; the four font files are emitted and the CSS refers to them by relative path |
| In the window (agent, not a playtest) | `npm start` with `boarding`, `boarding-heracles` and a temporary fixture (removed afterwards), scripted real mouse input over the debug port, screenshots read | Board 4; 5th refused with "Not enough seats."; seat click, chip, Undo and Clear boat send souls back; other souls hold their shore spots and seats close up; a soul turned back mid-walk from its chip and from a click on the moving soul, both ending at home with Seats 0/4; Undo, Clear boat and Cast off off with nobody aboard; Cast off sails and CrossingScene opens; Merchant + Blacksmith + Mason refused with the engine's message; a soul at Anger 1 shows a red pip; hero offer, toll mode, Cancel, toll paid (Light 6 to 5, Heracles locked with a padlock, clicking him does nothing), "Leave a seat for the hero.", Decline. No console errors |
| Animation pass (Nov 6, uncommitted, agent, not a playtest) | `npm run check`; `vite build`; `npm start` with `boarding` and `boarding-heracles`, scripted real mouse input, screenshots read, frame rate measured in the page | 11 of 11 pass; `check-boarding` 78 OK, 0 FAIL (11 new: walk arc, boat sway, riders, spring, tail); build OK; 60 fps in this window on this machine. Seen: fade-in, boat gliding in, souls appearing in turn, arc over the gunwale, tail bend, mist trail, ripple, the toll soul dissolving, a lone hero sailing (Light 5) to CrossingScene, no console errors. Found and fixed in the window: Accept did nothing (a new button state), a crash in `update` after shutdown, the reflection lying over the dark floor, souls arcing along the shore |
| Fonts | canvas `measureText` in the window | the `lnum` descriptor in `src/index.css` gives lining figures in canvas text in this Chromium (digit height 39 to 64), so the font files stay unmodified |

NOT_RUN: all hand checks by a person (board 4, try a 5th, remove one, Undo, Clear boat, click mid-walk, Cast off, the hero offer). Also NOT_RUN: seeing the refuse shake at full speed (the screenshots are too far apart), Odysseus's offer in the window (same code path as Heracles without the toll), hearing `sfx-board` and `sfx-unboard`, the F2 panel with the new `boarding.*` values, a two-seat soul in the window (`check-boarding` only), and the packaged `.exe` with the new fonts and animation. Also NOT_RUN: whether the motion feels right to a person (still screenshots cannot show it), and the frame rate on a weaker PC.

Notes: the grey line's "gain 1 anger" is fixed text, since the engine has no config value for it (`returnShore` does `x.anger++`); `{limit}` comes from config. The painting moves up 110 px to clear the panel, which crops the moon; `boarding.backdropShift` changes that. `boarding.dropPadding` was removed with the drag code. Bob size and speed in the F2 panel apply to new souls only.

## T-33 balance playtests and T-35 result (VarisPah, Nov 6 and 7, Windows 11)

Played by hand with `npm start` (separate saves), plus two bot simulations. These are one person's runs, not a team playtest.

**Runs**

| Build | Rules | What happened |
|---|---|---|
| `main` | old: 6 Light, tolls 0/1/1/2/3/3, return +1, increase from cycle 6 | First crossing cost 2 of 6 Light (stopped early) |
| #46 + #47 local merge | old | Run 1: one trip of 5 crossings (Styx 1, Asphodel 2, Haven 0, Acheron 1, Tartarus 2): lantern out in cycle 1. Run 2: cycle 1 cost 5 of 6 Light; in cycle 2, four free Haven crossings in a row let Anger rise until the Mother became a Wraith: game over in cycle 2 |
| `t-35-balance` (#50, first commit) | 7 Light, tolls -1, return +2, increase still from cycle 6 | Reached **cycle 5** (4 returns): Light fell slowly, 7 → 6 → 5 → 4 → 4. Fog Shield cut Tartarus from 2 to 1. Trim and the Long Hollow choice came up. Game over when the Farmer became a Wraith. "A lot easier than before while being challenging" |
| `boarding-heracles` test state, cycle 9 | as above | Heracles works. The lantern went out after 3 crossings: 1 to take the hero, Asphodel 2, Styx 2 (cycle increase plus a Long's fog) |
| `t-35-balance` (#50, with the cycle 9 increase) | 7 Light, tolls -1, return +2, increase from cycle 9 | Reached **cycle 5** again (4 returns). Light stayed high: full at two returns (the +2 was wasted once) and never below 3 at a return. Trim came up 4 times. Cycle 5's trip took 9 crossings and the Merchant's wish (Styx) never came up, so his Anger reached the limit: Wraith, lantern out. The cycle 9 increase was not reached, so it is not tested by hand |
| #49 local merge with `main` (Nov 6) | as `main` after #50 | Reached **cycle 5**; game over when a Long Burden became a Wraith. No errors |
| `main` after #46 (Nov 6) | as above | Reached **cycle 4**. From cycle 3 a Long aboard made Styx and Acheron cost 1 each. The last stop lost 3 Light at once (Wraiths or early drops), and the Bard became a Wraith |
| `main` at `33bf7ef`, Boat Space test (Nov 7) | as above, from a temporary boarding state with Boat Space in hand (removed afterwards) | Boat Space played from the Boarding memory hand: seats went from 4 to 5. No errors |
| `main` at `33bf7ef` (Nov 7) | as above | Reached **cycle 3**: Elysium and Tartarus (2 each) in cycles 1 and 3, plus Wraiths, put the lantern out |
| `main` at `33bf7ef` (Nov 7) | as above | Reached **cycle 6**. Odysseus was offered and his quest (Tiresias's choice) worked; the lantern went out at Asphodel. No errors |

**Observations**
* **Light:** under the old rules, a trip needs 3 to 5 forks at about 1 Light each, and a return gives back 1, so the lantern goes out in cycle 1 to 3. With the new values it runs down over about 5 cycles, and in the last run it was no longer the limit.
* **Fog:** a fork offering two expensive routes forced 2 or 3 Light whatever the choice (old rules). Fog Shield matters on expensive routes. From cycle 9, Longs add fog on top of the cycle increase, which made the late game a wall.
* **Anger:** once routes are cheap, Anger becomes the main pressure. Stalling on free Haven routes doesn't work, because waiting souls keep getting angrier until they become Wraiths. Most runs on the new values ended from Anger or Wraiths (one ended from Light): a soul whose wish route is not offered during a long trip reaches the Anger limit.
* **Simulations (bots, not playtests):** my bot (1,000 seeds) went from a median of 2 cycles to 5 with the new values. purin-kan's study on #45 (best of 36 strategies, 5,000 seeds): good players go from a median of cycle 2 to cycle 6, and to cycle 8 with the increase moved to cycle 9, while novices stay at cycle 2.

**Changes proposed to the group:** on #45 (Jaoguya, purin-kan) and in #50: 7 Light, tolls -1, return +2, route increase from cycle 9 and 15.

**T-35 result (Nov 7):** the #50 values are final for submission (decision on #38). Six hand runs on them ended in cycles 3, 4, 5, 5, 5 and 6; Tartarus and Elysium at 2 Light can hurt when wishes stack up, but it is doable with planning, and a careful run reaches the heroes. Elysium 2 to 1 was simulated (my bot, 2,000 seeds: 64% of runs reach cycle 6 instead of 43%, median cycle 6 instead of 5) and not taken.

**After submission:** the hero no-toll idea (#45 part 2), a full boat being a trap (purin-kan's finding), easing runs that end from Anger after long trips.

## Verified: T-16 memory UI and T-17 GameOverScene (Jaoguya, Nov 1, 2026)

Machine: Windows 10 Pro, Node v24.22.1, npm 11.19.1.

| Check | Command | Result |
| --- | --- | --- |
| Memory hand view model | `node tools/check-memory.mjs` | 15 of 15 OK: playable cards and Calm targets in the outward window, Light with no target, hand locked after `START_CROSSING` with the engine's reason, Light refused during boarding, hand usable in the return window, empty hand note, trim fixture 4 held / 1 excess, one `DISCARD_MEMORY` returns to `window` |
| Game-over view model | `node tools/check-gameover.mjs` | 10 of 10 OK on the `ended` fixture plus synthetic quest lists (names, Done/Failed/Unfinished, failure reason, 8-row cap) |
| Existing checks | `npm run check` | 12 of 12 OK (unchanged) |
| TrimOverlay in Electron | `FERRY_QUERY=?scene=TrimOverlay&fixture=trim`, a person clicked Discard | `TrimOverlay shown (phase trim, hand 4)` then `CrossingScene shown (phase window)`: `router.dispatch` from a scene and the overlay close both work |
| GameOverScene in Electron | `FERRY_QUERY=?scene=GameOverScene&fixture=ended`, a person clicked Start a new run | `GameOverScene shown (...)`, `back to title for a new run`, `TitleScene shown`, then a new run reached `BoardingScene` |

## Verified: T-21 ReturnScene and T-22 Route UI (Jaoguya, Nov 1, 2026)

| Check | Command | Result |
| --- | --- | --- |
| Return view model | `node tools/check-return.mjs` | 16 of 16 OK: every shore soul gains Anger, a soul at the limit becomes a Wraith with the engine's "shore expiry: 1 Light lost" line, Light before and after, lethal warning, review mode with Confirm and Back, Confirm reaches the next cycle in BoardingScene, Back returns to the window, log diff with a full 80-entry log |
| Route view model | `node tools/check-route.mjs` | 17 of 17 OK: hidden before the fork, Foresight rows from `Ferry.routeView`, option fog and Light from `Ferry.preview`, PLAN CROSS to review, review numbers match, Back keeps the same fork, Confirm pays the previewed Light, lethal flag, Po Mued concealment (view model only), hidden in return windows |
| ReturnScene in Electron | `FERRY_QUERY=?scene=ReturnScene&fixture=return`, a person clicked Review return and Confirm (3 runs) | `ReturnScene shown`, `rowing back to the Starting Shore`, `BoardingScene shown (phase boarding)`; with the `fork` fixture the panel showed the engine's "Return with an empty boat." without an error |
| Screenshots | temporary snapshot hooks, removed after | ReturnScene prepare (Wraith style, Calm targets on shore souls, memory hand mounted) and review (Back / Confirm, hand locked with the engine's reason); route UI review (two option cards, review panel). One fix found: a Wraith-bound soul hid its gold target outline |

Not verified for T-21 / T-22: playing Calm on a shore soul by mouse; the route UI inside CrossingScene (SupaOhm mounts it in T-19), its option clicks in the window and the Foresight rows on screen; Po Mued concealment with a valid save.

Not verified for T-16 / T-17: the memory hand inside a real scene (no scene mounts `MemoryHand` yet), card and target picking by mouse, the failure-reason hover on GameOverScene, more than 5 cards in TrimOverlay. `check-memory.mjs` and `check-gameover.mjs` are not in `npm run check` (that needs a `package.json` change by purin-kan).

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
