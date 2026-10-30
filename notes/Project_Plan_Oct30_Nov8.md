# Game Development Project Plan (Oct 30 - Nov 8)

Revised October 30, 2026 to match the repository's file formats and working conventions. Rule, balance and art values stay provisional team decisions. Roles below follow the seats the members chose (the older seven-slot table in `notes/Decisions_and_Team_Plan.md` section 4 was for the paper submission). Tasks are tracked in the [task register](Task_Register_Oct30_Nov8.md). The seven members are bosthanapatw, Kanyakorn-goya, Tinpatpun, Jaoguya, SupaOhm, VarisPah and purin-kan (scaffold and builds).

## 1. Project Context & Principles

* **Engine & Target:** Phaser (HTML5 Framework) + Electron (Desktop Wrapper), confirmed by the user on October 30. This settles the engine and platform part of D12 only; controls, production art and audio stay open. Final deliverable is a standalone Windows executable (`.exe`). A macOS `.app` is optional and not planned, since only Windows is a stated target (`notes/Engine_Platform_Comparison.md` line 7).
* **Development Workflow:** AI writes most game and scene code from team prompts, accelerating delivery for the team without prior engine experience. An AI-built developer tuning panel provides real-time adjustment of animation speed, timing, and river paths, mitigating Phaser's lack of a visual editor.
* **Starting Point:** `outputs/The_Ferryman_v0.7/` is a provisional rules snapshot and working browser prototype, not the final version: the team is still deciding the rules, and the final version is the `.exe`. Its code is vanilla JS: `engine.js` 400 lines, `app.js` 258 lines, `content.json` 554 lines. It has 15 ordinary souls, 8 quests, 5 Polong variants, hero encounters (Hercules, Odysseus, Cerberus), 7 destinations and 15 memory types. Evidence: 22 passing scenario groups, 0 failed (`verification/quest-results.json`); no human playtest, no Windows or Phaser run. The v0.6 paper kit and submission package are historical and not part of this build.
* **What "Phaser + Electron" means for existing code:** `engine.js` (pure JS, no DOM) and `content.json` are the starting point and change as the team decides the rules. `app.js`, `index.html` and `styles.css` are the vanilla DOM interface and are replaced by Phaser scenes. `engine.js` is a UMD module: under Node it reads `content.json`, in a browser it reads `globalThis.FerryData`, which only the generated `content.js` sets, and it publishes `globalThis.Ferry`. The bundle must load `content.js` before `engine.js` (see the Phase 1 scaffold task). Do not edit `engine.js` to fix bundling or loading; wrap it. Rule changes are the only reason to edit it.
* **Rules are not final:** The team's rule decisions land in the desktop build, which is the final version. Whichever folder holds the rules source, edits go in `content.json` followed by `node tools/build-content.js` and `node tests/quest-check.js`. In v0.7 these hash `engine.js`, `content.json`, `app.js` and the test file, and `tools/package.py` checks them again. If the desktop folder takes its own copy, the tests and `package.py` must be adapted first (they require `app.js` and `../engine.js` at fixed paths). Whether the rules source is an own copy or stays in v0.7 is still to be chosen. If it stays in v0.7, the submitted project files must include that folder too, because the desktop folder cannot build or run without it.
* **Project location:** One new self-contained folder under `outputs/`, following the existing `outputs/The_Ferryman_<name>_v<ver>/` pattern (proposed: `outputs/The_Ferryman_Desktop_v0.8/`, name to be confirmed). No `package.json`, `src/` or `node_modules/` at the repository root.
* **Buffer Strategy:** Buffer time is built into daily estimates; no dedicated buffer days.
* **Version Control:** Hosted on GitHub. Code-driven integration mitigates scene-merge conflicts. Pin dependencies in `package.json` and lockfile, and pin the Node version (this machine runs Node v25.1.0; confirm which version Electron Forge supports before committing the lockfile).
* **Asset Pipeline:** Assets are committed as PNGs and JSONs, matching the existing repo. No source files (`.psd`, `.blend`). Existing art is in `outputs/The_Ferryman_v0.7/assets/art/` (28 files) and is mapped by ID in `asset-map.js` (`FerryArt`). Sprites need transparent cut-outs, but coverage is partial (see Section 4, Sprite Preparation).
* **Evidence and honesty:** Record test results in one short status file for the team (not a submission item). Anything not run is marked `NOT_RUN`. Agent or team smoke tests are not human playtests, and balance changes are team-set values, not validated balance.

## Submission Deliverables

Only three items are submitted: the project files, the `.exe` and a presentation. Anything else in this plan exists only to produce those three.

1. **Project files (purin-kan):** the desktop project folder under `outputs/`: source, assets, `package.json` and lockfile, and a short README on how to run and build, plus `outputs/The_Ferryman_v0.7/` if the rules source stays there. No hash manifests or receipts.
2. **`.exe` (purin-kan, tested by VarisPah):** the final Windows build from Electron Forge.
3. **Presentation (bosthanapatw coordinates):** must include three parts.
   * **Description:** game rules, gameplay mechanics and narrative, taken from the frozen rules.
   * **Algorithmic Implementation:** where game informatics, procedural content generation (PCG), AI logic or random systems are used. In the v0.7 snapshot these are: a seeded pseudo-random generator (`draw`, `engine.js` line 30), a Fisher-Yates shuffle (line 31), route forks drawn at random from eligible destinations (`deal`, line 37), random wishes (`randomWish`, line 138), a Polong spawn every `spawnInterval` rounds with a tiered random pick (`drawPolong`, line 49), random hero offers (`offerHero`, line 50) and Cerberus frightening two random souls (`heroicArrival`, line 150). Fog is a deterministic calculation (`fog`, line 111). AI logic is not claimed: the game has no computer-controlled opponent, and Polong spawning is listed above as a random system, not AI (confirm after the rules freeze). Line numbers belong to the v0.7 snapshot and will move. The group makes the design decisions (what is random and why); the AI writes the implementation, and the presentation says so.
   * **Demo play:** a live demo and a recorded video of the built `.exe`. Use a fixed seed (`Ferry.create(seed)`) so the demo's routes and encounters repeat.

## 2. Team Roles & Responsibilities

Seats were chosen by the members as comments on pull request 5 (recorded October 31, 2026). Members are shown by GitHub username. Task counts are from the [task register](Task_Register_Oct30_Nov8.md) and are counts, not effort.

| Member | Role | Tasks |
|---|---|---|
| bosthanapatw | Production & Presentation Lead | 7 |
| Kanyakorn-goya | Art (characters, environment, interface) | 7 |
| Tinpatpun | Gameplay support & UI | 4 |
| Jaoguya | Gameplay Dev & UI; co-PM | 6 |
| SupaOhm | Gameplay Dev | 4 |
| VarisPah | Audio, QA & Game Balance; PM | 8 |
| purin-kan | Scaffold & builds | 7 |

**Decisions go to the PM (VarisPah).** Jaoguya is the co-PM.

**Help for bosthanapatw.** purin-kan helps bosthanapatw with the presentation: purin-kan is listed as support on the pitch script (T-26) and the slides (T-38), and knows the engine for the Algorithmic Implementation slides. purin-kan's own tasks fall on Oct 31, Nov 2, Nov 6 and Nov 8, with scaffold questions from the team in between, and Nov 6 has three tasks (T-30, T-31, T-32).

**bosthanapatw's early capacity.** bosthanapatw's work depends on the frozen rules and the built game, so it starts late: only the blockers list (Oct 31) and the presentation outline (Nov 2) come early, and the script, freeze, slides, video and rehearsal fall on Nov 5 to 8. From now to about Nov 4, bosthanapatw helps VarisPah with the audio: listed as support on T-07, T-15 and T-28. If time remains, the Nov 2 cut-outs (about 14 images, T-09 and T-10) are the next place to help, for the PM (VarisPah) to confirm.

* **purin-kan (scaffold owner):** Project scaffold and folder structure, Electron Forge and Vite configuration, `engine.js` loading, the scene router and dev launcher, and the `.exe` builds (early, release candidate and final).
* **bosthanapatw (Production & Presentation Lead):** Presentation (script, slides, demo video), reviewing the task register (owners update their own rows), the README and credits notes, and a second tester on the built `.exe`.
* **Kanyakorn-goya (Art):** All art in one seat: cut-out soul, Polong, boat and shore sprites, destination backgrounds, memory placeholders, wraith transformation frames and art polish. Peak load is Nov 2 (14 cut-outs); a background-removal tool can speed this up, and the results still need a visual check.
* **Tinpatpun (Gameplay support & UI):** The extra hand freed by combining the art seats, placed where the load was heaviest (SupaOhm). Owns TitleScene with the single save, the developer tuning panel, scene text data and visual polish, and supports SupaOhm on the scene work.
* **Jaoguya (Gameplay Dev & UI; co-PM):** Memory UI overlay, GameOverScene, ReturnScene and route display, built on purin-kan's scaffold. Shares scene architecture design with SupaOhm.
* **SupaOhm (Gameplay Dev):** BoardingScene (drag-and-drop), CrossingScene (boat river crossing) and DeliveryScene, the three core-loop scenes. Integrates `engine.js` as the rules authority and owns tweens, visual effects and scene transitions.
* **VarisPah (Audio, QA, & Game Balance; PM):** Receives team decisions. BGM and SFX. Tests compiled `.exe` builds on secondary Windows PCs. Uses the developer tuning panel and `content.json` to calibrate animation timing and game balance variables, starting balance playtests on Nov 6 rather than Nov 7.

## 3. Master Project Schedule (Oct 30 - Nov 8)

### How the work runs in parallel

purin-kan scaffolds the engine (Scaffold A below) so the others can start from a working base. Only Scaffold A blocks other work, so it is kept minimal and targeted for midnight at the end of Oct 31. Everything after it runs side by side:

* **One file per scene or component.** Each owner edits only their own files. The scene list, `package.json` and lockfile are changed only by the scaffold owner; others send a one-line request. `tuning.json` is created by purin-kan and then written only by the tuning panel; one tuner commits it at a time, since several people editing one JSON file will conflict.
* **Scenes never call each other.** Every scene reads `state` and dispatches `Ferry.transition`; a router picks the scene from `state.phase`. No scene waits for another.
* **Scenes are built standalone.** The dev launcher from Scaffold A opens any scene with a saved engine state for its phase, so Delivery, Return, Memory UI and the rest can be built and viewed before Crossing exists.
* **Code never waits for assets.** Art and audio are added by dropping files named per the convention from "Lock art pipeline". The preloader falls back to a letter emblem (art) or silence (audio) when a file is missing, and nobody edits a shared manifest.
* **Art, audio and presentation have no code dependency** before the freeze beyond file naming, so bosthanapatw, Kanyakorn-goya and VarisPah can work from Oct 30.
* **Before Scaffold A lands**, Tinpatpun, Jaoguya and SupaOhm write draft scene code against the engine API (`Ferry.transition`, the phases listed in Scene architecture design) and paste it into the stub files once the scaffold is pushed.
* **Packaging is separate.** Scaffold B (packaged `.exe`, `.asar` and SmartScreen checks) runs alongside scene work and blocks nobody.

### Phase 1: Scaffolding & Early Design (Oct 30 - Oct 31)

| Task | Description | Assigned |
| --- | --- | --- |
| Blockers | Open blockers are being worked on and must be resolved by Oct 31. | All |
| Publish spreadsheet and blockers | SupaOhm pushes the consolidated spreadsheet and the resolved blockers to the repo through a pull request once both are done. If the spreadsheet sits in the folder that `.gitignore` keeps local (`/outputs/charon-game-database-2026-10-25/`), the pull request changes that entry. | SupaOhm |
| Repo setup | The task register is the task list; no separate board. Add `.gitattributes` `-text` for the new folder and for `outputs/The_Ferryman_v0.7/` (only v0.6 has it; `core.autocrlf=true` otherwise changes `content.json` bytes and breaks the recorded hashes). Adding the rule to the committed v0.7 folder makes its files show as modified on Windows until each person checks out again. Extend `.gitignore` with `out/`, `dist/` and `.vite/` (`node_modules/` is already ignored). | bosthanapatw, purin-kan |
| Lock art pipeline | Decide sprite resolution and naming convention (extend the existing flat lowercase names in `assets/art/` and the `asset-map.js` ID keys; keep original solid-background files untouched and add cut-outs as new files, since the v0.7 browser and its recorded hashes use the originals). Cut one test character from solid-background PNG to transparent sprite. Confirm Phaser import. | Kanyakorn-goya |
| Scaffold A: dev environment | Target midnight at the end of Oct 31. Create the folder, `npm init`, install Phaser (comparison source lists v4.2.1, `notes/Engine_Platform_Comparison.md` line 62), Electron Forge, Vite. Pin versions in `package.json` and lockfile. Run a Phaser canvas in the Electron dev window (the packaged `.exe` is Scaffold B). Import `content.js`, then `engine.js`, from the chosen rules source (starting snapshot: v0.7; wrapper, no edits to `engine.js` for loading) and verify `globalThis.Ferry.create(1)` returns a valid state. Also add: one stub file per proposed scene, registered in a scene list; a router that picks the scene from `state.phase` and switches only after the current scene reports its exit animation done (`CROSS` moves the state to `delivery` at once, so a plain phase switch would cut the boat animation); a dev launcher that opens any scene with a saved engine state for its phase (fixture states generated by a script from the engine); an asset preloader that reads files by the naming convention and falls back to a letter emblem or silence when a file is missing; an empty `tuning.json`; and a short README on how to add a scene. Push and tell the team. | purin-kan |
| Scene architecture design | Design the Phaser scene graph on paper. Not blocking: Scaffold A uses the proposed scene list below, and this task only refines it. Scenes follow `state.phase` from the engine, not their own rules: `boarding` (BOARD, DEPART, ACCEPT_HERO, DECLINE_HERO), `window` (PLAY_MEMORY, MEAL, PURIFY, START_CROSSING, PLAN), `review` (CONFIRM, BACK), `delivery` (DELIVER), `choice` (CHOOSE), `trim` (DISCARD_MEMORY), `ended`; `window` of kind `return` ends with RETURN. Proposed scenes: `BootScene` -> `TitleScene` -> `BoardingScene` -> `CrossingScene` (memories, route fork, review, travel) -> `DeliveryScene` -> `ReturnScene` -> `GameOverScene`, with choice and memory-trim as overlays. Map each scene's entry and exit to `Ferry.transition(state, action)` calls. | Jaoguya, SupaOhm |
| Audio asset strategy | Identify needed tracks (menu BGM, crossing BGM, delivery jingle, wraith SFX, UI clicks). Produce or source a placeholder menu loop. Record the source and licence of every audio file (the repo records rights and never assigns an invented licence), as `ARTWORK_NOTES.md` does for art. | VarisPah |

### Phase 2: Engine Prep & Base Build (Nov 1 - Nov 2)

| Task | Description | Assigned |
| --- | --- | --- |
| Scaffold B: packaged build | The preloader already exists from Scaffold A. Package a test `.exe` and verify asset pathing survives Electron's `.asar` packaging. Blocks nobody. | purin-kan |
| Core sprites delivery | Transparent cut-outs from existing art: Mother, Child, Merchant, Mason, Cook, Poet, Keeper, Farmer, Blacksmith, Priest (normal and exhausted), Polong (`newpolong.jpg`, a JPG), boat and shore. Red Soldier, Blue Soldier, Messenger, Musician and Listener have no image mapped in `asset-map.js`; they stay letter-initial placeholders (as `ARTWORK_NOTES.md` says) unless the team approves new art. Kanyakorn-goya delivers all of these sprites. Push into the locked `assets/` folders. | Kanyakorn-goya |
| TitleScene + save UI | Title screen with Continue and New game over a single save slot. New game accepts an optional seed, so the demo can use a fixed one. Rebuild the save logic from `app.js` (it is replaced, so it cannot be reused as is) on top of `Ferry.exportSave` / `importSave` validation, with a new namespace such as `the-ferryman:desktop:player:` and a QA launch flag or separate QA namespace (a packaged app has no URL for `?qa=`) so player saves are never touched by tests. No JSON export/import. Never read or write `the-ferryman:v0.7-trial:` or v0.6 keys. | Tinpatpun |
| BoardingScene prototype | Render shore souls as interactive sprites. Implement Phaser drag-and-drop (`setInteractive({ draggable: true })`) with snap drop zones on boat seats. A drop dispatches `BOARD` (it toggles selection, so a second drag off the boat is also `BOARD`; there is no `unboard`); validate with the exported `Ferry.seats`, `capacity` and `actorSeats`; `DEPART` commits. Show the hero offer, Light and seat counters. | SupaOhm |
| Developer tuning panel | Build an in-game debug/tuning overlay (e.g. using lil-gui, pinned) so Kanyakorn-goya and VarisPah can adjust boat travel duration, tween easing, animation speeds, drop-zone snap radii, and river paths. It must save to a committed presentation-only data file (proposed `assets/tuning.json`), separate from `content.json`, so tuned values reach the repo as data and gameplay balance is never mixed with animation timing. The engine never reads it. The empty `tuning.json` comes from Scaffold A. The panel saves from the dev build (`npm run dev`); a packaged `.exe` cannot write into its own files, so Kanyakorn-goya and VarisPah need the repo and Node set up to tune. | Tinpatpun |
| Early `.exe` & SmartScreen test | VarisPah runs Scaffold B's test `.exe` on a second PC and checks Windows SmartScreen behavior and asset pathing. | VarisPah, purin-kan |
| Base BGM & SFX | Menu BGM loop. One crossing ambient track. Board and unboard click SFX. Push to `/assets/audio/`. | VarisPah |
| Memory UI overlay | Functional version with placeholder art. Hand display (up to `config.handLimit`, 3). Play-before-crossing flow via `Ferry.memoryTargets`. `DISCARD_MEMORY` prompt in the `trim` phase. SupaOhm plugs it into CrossingScene in Phase 3. | Jaoguya |
| GameOverScene | Display run summary from state (`cycle`, `completed`, `deliveries`, quest statuses, `ending`). The game is endless, so there is no win screen. Offer restart. | Jaoguya |
| Presentation outline | Slide structure for Description, Algorithmic Implementation and Demo play. Draft the Description from the generated `RULES.md` as it stands (provisional until the freeze). Start the README and a credits note collecting art and audio sources. | bosthanapatw |

### Phase 3: Core Loop & Content (Nov 3 - Nov 5)

| Task | Description | Assigned |
| --- | --- | --- |
| CrossingScene | Memory window (`PLAY_MEMORY`, `MEAL`, `PURIFY`), `START_CROSSING` to reveal the two engine-drawn route options, `PLAN` / `CONFIRM` / `BACK` review, then `CROSS`. Animate the boat along a path (Phaser PathFollower or tweens) between departure shore and destination. Show the fog calculation from `Ferry.routeView` / `preview` (tileSprite or alpha tweens). Visualize Light loss. Route display comes from Jaoguya's route UI task and the memory overlay from Phase 2. | SupaOhm |
| DeliveryScene | Destination arrival. Show matching-wish feedback from `Ferry.deliveryReason`. `DELIVER` via engine. Animate soul departure. Show memory reward. Handle `choice` phase (hero and memory-theft choices) as an overlay. | SupaOhm |
| ReturnScene | `RETURN` with an empty boat: shore anger resolution, wraith conversion, Light restoration, shore refill. Transition to next cycle's `BoardingScene`. | Jaoguya |
| Tuning & pacing calibration | Kanyakorn-goya, Tinpatpun, and VarisPah use the developer tuning panel to adjust boat crossing speed, soul drag-snap feel, and wraith animation pacing. | Kanyakorn-goya, Tinpatpun, VarisPah |
| Destination & effect art | Destination backgrounds/cards: 6 of 7 locations exist (Haven, Styx, Acheron, Asphodel, Elysium, Tartarus); Heaven has none. Memory art: 6 of 15 memory types exist (Light, Foresight, Guard, Calm, Fog, Passage); the other 9 use placeholders unless the team approves new art. Kanyakorn-goya delivers backgrounds, memory placeholders and wraith transformation animation frames. | Kanyakorn-goya |
| Route UI | No facilitator input is needed: v0.7 already draws routes in the engine (`startPairs`, random route draws). Implement only the fork display, review and Foresight preview, as a component SupaOhm uses in CrossingScene. | Jaoguya |
| Pitch script draft | Write presentation script covering Description, Algorithmic Implementation and Demo play (see Submission Deliverables). Begin slide deck. Capture early gameplay footage for demo video. The group supplies the design decisions for the Algorithmic Implementation slides; bosthanapatw drafts them from the list in Submission Deliverables. | bosthanapatw |
| Scene text | Collect button labels, help text and ending text for the scenes from `app.js` and `content.json` into a data file the scenes read. | Tinpatpun |
| Crossing & delivery audio | Crossing ambient variants. Delivery success jingle. Wraith SFX. Fog ambiance. | VarisPah |

### Phase 4: Feature & Asset Freeze (Nov 6)

| Task | Description | Assigned |
| --- | --- | --- |
| Hard freeze | No new mechanics, quest types or major art after this date. Balance values in `content.json` may still change on Nov 7. All scenes merged. Drug Dealer, Fool and Killer have no playable rules (`pendingSouls` in `content.json`); they stay out of play and are not given invented effects. | All |
| Integration check | Full playthrough of the `.exe`: boot -> title -> boarding -> crossing -> delivery -> return -> multiple cycles -> game over. Confirm save/load. | purin-kan, VarisPah |
| Scope-cut triage | There is no content flag to switch off hero encounters or Polong variants: they are rules inside `engine.js`. If hero encounters or advanced Polong variants are not stable, cut them and ship the core loop at minimum. Cutting them is an `engine.js` change plus reruns of `node tools/build-content.js` and `node tests/quest-check.js`, made before the Nov 6 freeze. | purin-kan, SupaOhm |
| Release candidate build | Build the `.exe` after the freeze so VarisPah and bosthanapatw test a real build on Nov 7. | purin-kan |
| Balance playtests | Play the core loop from the integration build and log observations of Light, anger and fog in the status file. Propose `content.json` changes to the group; final adjustments follow on Nov 7. | VarisPah |

### Phase 5: QA, Balance & Polish (Nov 7)

| Task | Description | Assigned |
| --- | --- | --- |
| `.exe` testing | VarisPah, with bosthanapatw as second tester, tests the release candidate on a second Windows machine. Check SmartScreen warning, asset pathing, memory stability, save persistence. Record results in the status file; untested items stay `NOT_RUN`. | VarisPah, bosthanapatw |
| Balance tuning | Final adjustments, building on the Nov 6 playtests. Adjust values in the desktop build's `content.json` (the chosen rules source): `config.startLight`, `returnLight`, `shoreAngerLimit`, `shipAngerLimit`, `spawnInterval`, `polongFogThreshold`, `polongFog`, and each destination's `fog`. The cycle 6 / 12 fog escalation is hard-coded at `engine.js` line 112 and is not tunable from `content.json`. After each edit run `node tools/build-content.js` and `node tests/quest-check.js`. Log each change and its reason; these are team-set values, not validated balance. | VarisPah |
| Bug fixes | Address issues from VarisPah's test log. | Jaoguya, SupaOhm |
| Visual polish | Scene transitions and screen shake first. Particle effects (fog, wraith transformation, Light glow) only once the bug list is empty. | Tinpatpun |
| Slides finalize | Final slide edits. | bosthanapatw |
| Art polish | Touch up any placeholder sprites. Finalize UI elements. | Kanyakorn-goya |

### Phase 6: Build, Export & Rehearsal (Nov 8)

| Task | Description | Assigned |
| --- | --- | --- |
| Final `.exe` compile | Rebuild the release candidate with the Nov 7 fixes (a clean build). Validate asset pathing, memory stability, no console errors. Write the short README (how to run and build). Collect the project files and the `.exe` for submission. The installer and any ZIP are not committed (see Package Size). | purin-kan |
| Demo video recording | Record the demo video from the final `.exe` with a fixed seed. | bosthanapatw, VarisPah |
| Presentation rehearsal | Full team run-through of the presentation (Description, Algorithmic Implementation, Demo play) with the live demo and Q&A. | All |

## 4. Technical & Workflow Guidelines

* **Directory Architecture:** purin-kan defines the exact folder structure by Oct 31 inside the new `outputs/` folder. Template (rules files `engine.js`, `content.json`, `tools/build-content.js` and `tests/` sit in this folder if the chosen rules source is an own copy of the v0.7 snapshot):
  ```
  outputs/The_Ferryman_Desktop_v0.8/     # name to be confirmed
    package.json, lockfile
    README.md, STATUS.md   # run/build notes; test log
    src/
      scenes/            # Phaser scenes (one file per scene)
      ui/                # reusable UI components
    assets/
      art/               # transparent character sprites (new files only)
      backgrounds/       # destination and shore backgrounds
      audio/             # BGM and SFX
      fonts/             # bundled fonts (Vera exists in v0.7 assets/fonts)
      tuning.json        # presentation timings from the tuning panel
  ```
* **Developer Tuning Panel:** Because Phaser has no visual editor, the AI-built in-game tuning panel gives non-programmers (Kanyakorn-goya, VarisPah) an interactive overlay to adjust animation durations, tweens, drop-zone radii, and river path coordinates without touching code, and writes them to `tuning.json`.
* **Engine as Authority:** Developers must not duplicate game rules in scene code. All state transitions go through `Ferry.transition(state, action)`. Scenes read `state` and render it, as `app.js` does today ("this file renders and dispatches actions").
* **Balance File:** The desktop build's `content.json` is the single gameplay configuration source, and the rules in it are provisional until the freeze. `content.js`, `rules.json` and `RULES.md` are generated by `tools/build-content.js` and are never edited by hand. VarisPah edits `content.json` only. No gameplay constants in scene code.
* **Relative Pathing:** Use Vite path resolution to ensure assets survive Electron's `.asar` packaging. Test on a built `.exe`, not just `npm run dev`.
* **Git Sync Protocol:** Non-developers pushing art assets must `git pull` before staging and committing. Keep commits small and file-scoped to avoid merge conflicts. Work is tracked as one GitHub issue per register task (ID in the title) and lands through a pull request that closes it. Team members push their own work; AI agents in this repo never push and hand publishing back to the user.
* **Sprite Preparation:** Existing art has opaque backgrounds (24 images in v0.6 `assets/art/`, 28 files in v0.7). Kanyakorn-goya creates transparent-background versions as new files, keep the originals, and record sources in a short art credits note. Team art approval is a human decision; a copy of existing art does not assert a new licence. See `notes/Engine_Platform_Comparison.md` line 57.
* **SmartScreen:** An unsigned `.exe` triggers a Windows SmartScreen warning. Test on a second PC early (Nov 2). See `notes/Engine_Platform_Comparison.md` line 58.
* **Package Size:** Electron bundled with Chromium produces an export around 100+ MB (an unmeasured estimate, `notes/Engine_Platform_Comparison.md` line 35). GitHub rejects regular files over 100 MiB and Git LFS is not installed (`AGENT_CONTEXT.md`, October 5 push entry). Never commit `out/`, `dist/`, installers or the ZIP; keep them gitignored locally, like `/outputs/The_Ferryman_v0.7.zip`, and share the `.exe` directly or through a GitHub release uploaded by the user.
