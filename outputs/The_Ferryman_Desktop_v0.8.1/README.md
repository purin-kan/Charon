# The Ferryman, desktop build (v0.8.1 scaffold)

Phaser 4 inside Electron, bundled with Vite through Electron Forge. This is Scaffold A: a minimal
base that teammates build scenes on. Packaging (`.exe`) is Scaffold B.

## Install

Needs Node >= 22.13.0 (Electron Forge 8 requirement; developed on Node 25.1.0, npm 11.6.2).

```powershell
cd outputs\The_Ferryman_Desktop_v0.8.1
npm install
```

Dependency versions are pinned exactly in `package.json` and `package-lock.json`. Do not add or
upgrade packages without asking the scaffold owner.

## Run

```powershell
npm start
```

This is `electron-forge start`. It opens the Electron window with hot reload. The renderer console
is echoed to the terminal with a `[renderer]` prefix. Expected lines:

```
[ferry] Phaser 4.2.1 booted (renderer: WEBGL)
[ferry] Ferry.create(1) -> state.phase = boarding (version 0.7-trial)
```

Other commands:

| Command | What it does |
| --- | --- |
| `npm run fixtures` | Regenerates `src/dev/fixtures/*.json` from rules/engine.js |
| `npm run check` | Node checks: engine loads, `Ferry.create(1)` has a phase, phase to scene mapping on all fixtures |
| `npm run package` | Builds `out/The Ferryman-win32-x64/The Ferryman.exe` (folder of about 359 MB; never commit `out/`) |
| `npm run make` | Zips the packaged app for win32 (no installer) |

## Rules source

The rules live in `rules/`, copied from the v0.7 snapshot (content SHA-256 `a5a686c5...`). This
folder depends on no other folder. `src/ferry.js` imports `rules/content.js` first (sets
`globalThis.FerryData`), then `rules/engine.js` (publishes `globalThis.Ferry`, or its CommonJS
export in a production build). Never edit `engine.js` to fix loading; wrap it.

To change rules: edit `rules/content.json`, then from `rules/` run:

```powershell
node tools/build-content.js   # regenerates content.js, rules.json, RULES.md
node tests/quest-check.js     # writes verification/quest-results.json
cd ..; npm run fixtures; npm run check
```

Scenes import the engine with `import { Ferry } from '../ferry.js'`. Scenes never duplicate rules:
read `state`, act through `this.game.router.dispatch(action)`.

## Layout

```
src/main.js          Electron main process (echoes renderer console to stdout)
src/renderer.js      Creates the Phaser game and the router
src/ferry.js         Loads content.js then engine.js, exports Ferry
src/router.js        state.phase -> scene, waits for exitDone()
src/phase-map.js     The pure phase -> scene table
src/preloader.js     Asset lookup by file name, with fallbacks
src/scenes/          One file per scene, listed in scenes/index.js
src/dev/             Dev launcher and fixture states
assets/              art/ backgrounds/ audio/ fonts/ and tuning.json
tools/               make-fixtures.mjs, check-engine.mjs, check-router.mjs
```

## Dev launcher (open any scene with a saved state)

Fixtures live in `src/dev/fixtures/<name>.json`: boarding, window, fork, review, delivery, choice,
trim, return, review-return, ended. All come from engine runs except `trim`, which is the `window`
state with a 4-memory hand (random play rarely reaches the hand limit).

In `npm start` windows a small menu at the top right picks a scene and fixture. To start directly:

```powershell
$env:FERRY_QUERY = '?scene=DeliveryScene&fixture=delivery'
npm start
```

Omit `fixture` to use the scene's default. Set `$env:FERRY_DEVTOOLS = '1'` to open DevTools.

## Tuning panel (animation timing, easing, snap sizes, river paths)

In `npm start`, press F2 or click **Tuning (F2)** at the bottom right. Changes apply while the game
runs. **Save to tuning.json** writes `assets/tuning.json`; commit that file when you are done, one
tuner at a time. Values that differ from the saved file are marked with `*`. A path value such as
`crossing.riverPath` has **Edit on screen**: drag the points, click empty space to add one at the
end, right-click a point to remove it. The packaged `.exe` uses the committed values but cannot
save (no dev server). The rules engine never reads `tuning.json`; gameplay balance stays in
`rules/content.json`.

In a scene, read a value at the moment you use it, so panel changes apply at once:

```js
import { tune, defineTuning } from '../tuning.js';
this.tweens.add({ targets: boat, duration: tune('crossing.travelMs'), ease: tune('crossing.travelEase') });
defineTuning({ 'delivery.glowMs': { type: 'number', default: 400, min: 0, max: 2000, step: 10 } }); // your own value
```

Types: `number` (min, max, step), `ease` (Phaser ease name), `bool`, `points` (`[[x, y], ...]` in
1280 x 720 game coordinates). The starting keys are listed at the bottom of `src/tuning.js`; their
defaults match the scene constants where one exists.

## Router and exit animations

`CROSS` moves the engine to `delivery` at once, so the router never switches scenes on its own.
Flow: a scene calls `router.dispatch(action)`. The router stores the new state, emits
`ferry-state` on `game.events`, and if the new state needs another scene it waits. The current
scene finishes its exit animation, then calls `router.exitDone()`. Use
`router.willLeave(this.scene.key)` inside a `ferry-state` handler to know when to start the exit
animation. If a scene never calls `exitDone()`, the router switches anyway after 5 seconds.
`ChoiceOverlay` and `TrimOverlay` open on top of the running scene and close when the phase changes.

## Assets

Drop files in; no manifest to edit:

- `assets/art/<id>.png`, `assets/backgrounds/<id>.png`, `assets/audio/<id>.ogg`
- Request them with `queueAssets(this, { art: [...], backgrounds: [...], audio: [...] })` in `preload()`
- Draw with `addArt(this, x, y, id, size)`: a missing image shows a letter emblem. A missing sound
  makes `playSound(this, id)` a silent no-op.

The id naming convention is decided in the art pipeline task. The code accepts any id.

## Add a scene

1. Create `src/scenes/MyScene.js`: a class extending `Phaser.Scene`, constructor `super('MyScene')`.
   Read `this.registry.get('state')`, listen to `this.game.events.on('ferry-state', ...)`, act with
   `this.game.router.dispatch(action)`, call `this.game.router.exitDone()` when the exit animation ends.
   Remove listeners on `this.events.once('shutdown', ...)`.
2. Register it: import it in `src/scenes/index.js` and add it to `SCENES`.
3. Route it: add a rule in `src/phase-map.js` (`sceneFor`). For an overlay, also add its key to `OVERLAYS`.
4. Check: `npm run check`, then open it with `?scene=MyScene&fixture=<name>`.

Only the scaffold owner edits `scenes/index.js`, `package.json` and the lockfile; send a one-line request.
