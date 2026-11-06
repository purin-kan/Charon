# Handoff: Tinpatpun to Jaoguya (November 6, 2026)

Jaoguya takes over the visual work from here. Everything below was built with Claude Code on Tinpatpun's direction. All results are agent runs on one Windows PC, not human playtests, unless a line says otherwise.

## Start here

| Branch | What it holds | PR |
|---|---|---|
| `full-game-restyle` | Every scene restyled, the painted pier, #40 soul data merged in, Heracles naming | to `main` |
| `polish-transitions` | Scene transitions, motion, reduced motion, rowing through fog, this note | to `full-game-restyle` |

Merge the restyle PR first, then the polish PR. After the first merges, retarget the second to `main`.

To see it:

```powershell
git switch polish-transitions
cd outputs/The_Ferryman_Desktop_v0.8.1
npm install
$env:FERRY_QA = 'restyle'; npm start
```

`FERRY_QA` keeps a separate save. F2 opens the tuning panel.

## Read this before T-36

- **Boat Space already works here.** The T-30 finding on #38 is true of `main`, but these branches give BoardingScene the memory hand. Boat Space was played by a real click and set `capacity`. SupaOhm's Plan A and VarisPah's Plan B (the quest giving Full Fog Protection) are only needed if these branches do not land by the Nov 7 deadline. Please tell them, so the work is not done twice.
- **"The Long card sitting below the seat row" is fixed here.** Longs now ride on the deck.
- **#40 is inside `full-game-restyle`.** Its generated rules conflicts were rebuilt from `content.json`. Landing the restyle also lands #40, so #40 can be closed or merged first; either order is clean.
- **These branches landed after the T-29 freeze date.** The team needs to decide whether they count as T-36 and T-37 or as an exception.
- **#44 (the art the PM chose) is not merged here.** Only images change and file names stay, so it should drop in. Check these after it lands:
  - `assets/art/boat/sprite-dock.png` is cut from the current `bg-starting-shore.png` and will not match new art. Re-cut it or replace it. Position is `art.pier.*` in F2. If the file is missing, souls stand on the painting and nothing breaks.
  - The boat's `art.boat.*` frame values. #44 says the deck and floor stay at the same fractions.
  - The stale notes in #44's body: souls no longer sit in a 64 px box here.

## What changed

**Restyle**
- `src/theme.js` holds colours, fonts, buttons, panels and motion. Scenes share `Hud`, the compact `MemoryHand`, `DecisionPanel` and `NightStage`.
- Boarding and Delivery are click, not drag. SupaOhm should know about Delivery.
- Delivery and Crossing use the Boarding stage: same boat, seats and painting shift. Only the painting changes.
- Longs ride level with the souls at the left end of one row (`boatSpots` in `delivery-layout.js`). They still take no seat, and capacity is unchanged.
- The display name is Heracles everywhere, data included. Ids and file names keep `HERACLES`.

**Polish**
- `leaveScene` and `enterScene` in `theme.js` crossfade from the last frame, with a teal fade as fallback. Use them for any new scene change. Crossing and Delivery join with no fade on purpose.
- Rhythm: `MS.fast`, `MS.base`, `MS.slow` (180, 350, 700 ms), and `EASE.enter`, `EASE.exit`, `EASE.move`. Journeys keep their own lengths.
- All assets load in `BootScene`, so nothing loads during play.
- Reduced motion is `motion.reduced` in F2 and also follows the Windows setting.

**Rowing (Tinpatpun's last request)**
- CrossingScene no longer zooms out over a drawn river. The boat is full size and rows slowly to the right, as `outputs/The_Ferryman_2D_Concept` does. That concept is now in the repo for reference; its art links point at the removed v0.6 folder.
- The water, fog and painting slide left past the boat. `Water` is in `src/scenes/river-boat.js`.
- At the fork the boat waits on the left with the signs ahead of it. Fog takes it mid-crossing and the place changes inside the fog.
- Tune with `water.*`, `night.roamPx`, `crossing.approachMs`, `crossing.travelMs`, `crossing.fogBanks`.

## Results on the last commit

- `npm run check` 11 of 11, `quest-check` 33 passed 0 failed, `vite build` passes.
- All 14 memory cards, in all 69 places the engine allows, played by real click and checked against the game state: 69 of 69.
- All 18 fixtures open with no console problems. Both Choice overlays were clicked through.
- Full run, seed 7: ended at GameOver, 241 fps, 0 console problems, 0 files loaded during play, 0 frames over 80 ms, slowest scene exit 2,909 ms. The router limit is 5,000 ms.
- Full run with reduced motion emulated: same ending, no crossfade. This was before the rowing work.

Bug found and fixed: picking Passenger or Sword in Crossing overflowed the stack.

## Not done, or not known

- **No human has played this.** Rate the checklist in the desktop `STATUS.md`, under Motion polish.
- The `.exe` and a slower PC. Every number above is from the dev server on one PC. A hidden or minimized window drops to about 1 fps and looks stuck; that is Windows, not the game.
- Heroes and quests in a full run. Those rest on fixtures.
- Sound was never heard, only checked in code.
- Nine memory cards are placeholder images with PLACEHOLDER printed on them, until #44.
- The ferryman is part of the boat image, so he cannot be animated while rowing. The stroke is shown by the boat's surge, the water and a ring at the oar. A separate ferryman image would allow more.
- The boat keeps its bow on the left, so it travels stern first. Flipping it is an art and layout call: the lantern and the Long row sit at that end.
- Boarding still sails the boat out in 1.8 s, faster than the rowing. Tinpatpun did not ask to change it.

## Decisions waiting on others

- **VarisPah:** Full Fog Protection works when held, but no soul or quest gives it after #40. Plan B would solve it, but with Boat Space working Plan B is not triggered.
- **PM:** whether these branches may land after the freeze (above).
- **Kanyakorn-goya:** the pier, once #44 lands.

## Rules for this work

No changes to `rules/`, `package.json`, the lockfile, `src/scenes/index.js` or the router contract in the polish work. Art loads by file name and is fitted by the `art.*` frames, so no scene depends on a file's pixels.
