# Scene Architecture (T-06)

November 1, 2026. Owner: Jaoguya. Support: SupaOhm. Status: agreed by Jaoguya; waiting for SupaOhm.

Derived from the code in `outputs/The_Ferryman_Desktop_v0.8.1/`: `rules/engine.js` (`transition`, lines 300-335), `src/phase-map.js`, `src/router.js` and `src/scenes/index.js`. Line numbers are for the current `rules/engine.js` and will move when rules change. This file describes presentation only; it adds no rules.

## Ground rules (already in the scaffold)

- The engine owns every rule. Scenes read `state` (from `this.registry.get('state')` or the `ferry-state` event) and change it only through `router.dispatch(action)`.
- Scenes never start each other. The router picks the scene from `state.phase` with `sceneFor` in `src/phase-map.js`.
- When the phase calls for a different full-screen scene, the router waits for the current scene to call `router.exitDone()` (5 s safety timeout). That gives the boat animation time to finish after `CROSS`, which moves the engine to `delivery` at once.
- `ChoiceOverlay` and `TrimOverlay` open on top of the running scene and close when the phase leaves `choice` or `trim`.

## Phase to scene map

| `state.phase` | `state.window.kind` | Scene | Owner |
|---|---|---|---|
| (no run yet) | | `BootScene` -> `TitleScene` | purin-kan, Tinpatpun |
| `boarding` | outward | `BoardingScene` | SupaOhm |
| `window` | outward | `CrossingScene` | SupaOhm |
| `review` | outward (pending `CROSS`) | `CrossingScene` | SupaOhm |
| `delivery` | outward | `DeliveryScene` | SupaOhm |
| `choice` | outward | `ChoiceOverlay` (over `DeliveryScene`) | SupaOhm |
| `trim` | either | `TrimOverlay` (over the current scene) | Jaoguya (T-16, discard prompt) |
| `window` | return | `ReturnScene` | Jaoguya |
| `review` | return (pending `RETURN`) | `ReturnScene` | Jaoguya |
| `ended` | | `GameOverScene` | Jaoguya |

## Actions per scene

| Scene | Actions it dispatches | Engine guard (what must be true) |
|---|---|---|
| `TitleScene` | none; calls `router.newGame(seed)` | |
| `BoardingScene` | `BOARD {id}` (toggles selection), `ACCEPT_HERO {target}`, `DECLINE_HERO`, `PLAY_MEMORY {id, target}` (Boat Space only), `DEPART` | `DEPART` needs at least one passenger; Merchant cannot depart with both Blacksmith and Mason |
| `CrossingScene` (window) | `PLAY_MEMORY`, `MEAL {questId}`, `PURIFY {actorId, target}`, then `START_CROSSING` | memories, meals and purify only before `START_CROSSING` (`travelPrepared` false) |
| `CrossingScene` (fork) | `PLAN {action: {type: 'CROSS', option: 0 or 1}}` | after `START_CROSSING`; preview with `Ferry.preview` / `Ferry.routeView` |
| `CrossingScene` (review) | `CONFIRM` (runs the `CROSS`), `BACK` | |
| `DeliveryScene` | `DELIVER {ids}` | `Ferry.deliveryReason(state, actor)` explains why a soul cannot be delivered |
| `ChoiceOverlay` | `CHOOSE {branch: 'charybdis' or 'zilla'}` (Odysseus) or `CHOOSE {id}` (memory-loss: pick a held memory) | `state.choice.kind` says which |
| `TrimOverlay` | `DISCARD_MEMORY {id}` until hand is at `config.handLimit` | |
| `ReturnScene` | `PLAY_MEMORY` (before returning), `PLAN {action: {type: 'RETURN'}}`, `CONFIRM`, `BACK` | boat must be empty |
| `GameOverScene` | none; restart via `router.newGame(seed)` | reads `cycle`, `completed`, `deliveries`, `quests`, `ending` |
| any scene | `STOP` (pause), `RESUME` | not assigned to a scene yet (see Still open) |

## The real loop

The plan's list (Boarding -> Crossing -> Delivery -> Return) is one trip with one stop. The engine loops instead:

```
Title -> Boarding --DEPART--> Crossing --CONFIRM(CROSS)--> Delivery --DELIVER-->
   boat still has passengers?  yes -> Crossing (next outward window)
                               no  -> Return --CONFIRM(RETURN)--> Boarding (next cycle)
Light reaches 0 at any step -> GameOver
```

Evidence: `nextWindow` (engine.js line 210) sets `window.kind` to `outward` if the boat is not empty, else `return`. So `CrossingScene` and `DeliveryScene` alternate several times per cycle, and `ReturnScene` runs once per cycle.

Where the overlays fire:

- `choice` (memory-loss): after `DELIVER`, when a Po Luem steals and the player must pick the memory (`thefts`, line 215). Odysseus choice: during delivery of the hero (line 162). After `CHOOSE` the phase goes back to `delivery` or on to the next window.
- `trim`: after delivery when the hand is over the limit (`finishRound`, line 211; then a new window), or when playing a memory empties the boat (line 277; then the same window, now of kind `return`).
- `ended` can come from almost any action that costs Light (crossing fog, wraiths, shore expiry), so every scene should expect to be replaced by `GameOverScene`.

## Components (not scenes)

- **Memory UI (T-16, Jaoguya):** a component, not a scene, used inside `BoardingScene` (Boat Space only), `CrossingScene` and `ReturnScene`. Shows `state.hand` (up to `config.handLimit`), uses `Ferry.memoryTargets(state, type)` to highlight targets, dispatches `PLAY_MEMORY`. Hidden or disabled once `state.travelPrepared` is true.
- **Route UI (T-22, Jaoguya):** a component inside `CrossingScene`. Shows the two options from `Ferry.routeView(state)` (hidden routes show no destination), previews fog with `Ferry.preview(state, option)`, and dispatches `PLAN` / `CONFIRM` / `BACK`.

## Differences from the scaffold

The scaffold already matches this map: `sceneFor` sends `window` and `review` to `CrossingScene` or `ReturnScene` by `window.kind`, and `npm run check` passes for all ten fixtures. No stub changes are needed for the map itself.

## Decisions (updated November 1, 2026)

1. **`ChoiceOverlay` owner: SupaOhm.** T-20 (DeliveryScene) is done when "matching-wish feedback, delivery, soul departure, memory reward and choice overlay work", and the overlay fires during delivery.
2. **Components live in `src/components/`.** The memory hand is there already (`MemoryHand.js`, `memory-layout.js`). New files need no request; only `src/scenes/index.js` needs purin-kan.
3. **`TrimOverlay` shares the memory card display.** It uses `drawCard` from `src/components/MemoryHand.js`, so cards look the same in the hand and in the discard prompt.
4. **Boat position (Jaoguya's answer).** Within one trip the boat goes from stop to stop: after a delivery, the next crossing starts from the destination it just reached, until every passenger is delivered. Once the boat is empty it returns to the Starting Shore (`ReturnScene`), and every new cycle starts from the Starting Shore in `BoardingScene`. The engine does not track boat position, so this is presentation only: SupaOhm's CrossingScene starts the boat at the last destination (`state.routes.history`, last `chosen`) or at the Starting Shore on the first crossing of a cycle.
5. **GameOver restart returns to `TitleScene`** (Tinpatpun's suggestion in PR 16), so the player sees the seed field and the replace-save confirmation. Built in T-17.
6. **Scene text comes from `t('<scene>.<key>')`** (Tinpatpun, PR 15). Missing lines are added to `src/data/scene-text.json` in the scene owner's own pull request.

## Still open

- **Pause (`STOP` / `RESUME`):** a shared pause button component, or left out of the first build? No task in the register covers it.

## Agreement

- [x] Jaoguya (November 1, 2026)
- [ ] SupaOhm
- [x] Stub changes needed: none (the scene list is unchanged)
