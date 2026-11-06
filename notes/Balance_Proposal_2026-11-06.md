# Balance proposal: Light tolls (Nov 6, 2026)

## The problem

After playing the demo, the game is too hard. Light runs out too quickly: one Tartarus or Elysium crossing costs 3 of your 6 Light in cycle 1, and a return trip only gives back 1.

## Proposal

**1. Lower every route's toll by 1 (Haven stays at 0).**

| Route | Now: cycles 1-5 | Now: 6-11 | Now: 12+ | New: cycles 1-5 | New: 6-11 | New: 12+ |
|---|---|---|---|---|---|---|
| Haven | 0 | 0 | 0 | 0 | 0 | 0 |
| River Styx | 1 | 2 | 3 | 0 | 1 | 2 |
| Acheron | 1 | 2 | 3 | 0 | 1 | 2 |
| Asphodel | 2 | 3 | 4 | 1 | 2 | 3 |
| Elysium | 3 | 4 | 5 | 2 | 3 | 4 |
| Tartarus | 3 | 4 | 5 | 2 | 3 | 4 |

The later-cycle increase (+1 from cycle 6, +2 from cycle 12) stays as it is.

**2. No route toll while Heracles or Odysseus is aboard.** Taking a hero should feel like a reward, and this gives the player a reason to accept one. Fog from Longs and from overloading the boat still counts, so Longs stay dangerous and the Nobody memory stays useful.

## What would change in the code

* Route tolls: data only, in `rules/content.json`, then rebuild.
* Hero toll: a small change to `fog()` in `rules/engine.js`, so this part is a rule change.
* Tests and fixtures need updating.

## Side effects to know

* **Fog Shield and Guard get weaker.** Styx and Acheron cost 0 in cycles 1-5, so these cards do nothing there.
* **Haven stops being special early on.** Styx and Acheron cost the same as Haven until cycle 6.
* **Demo seed:** the pitch replay of seed 116 may play out differently and need checking.
* **Freeze:** T-29 allows bug fixes only after today. This needs a PM exception, and the hero toll is the harder ask because it changes the engine.
* **#40:** the generated rules files will conflict, so whichever merges later rebuilds.

## Not tested

These numbers come from playing the demo, not from a simulation or a team playtest. If only one part fits the freeze, take the route tolls first, because they are data only.

## Decision needed

1. Route tolls: approve, or give other numbers?
2. Hero toll: approve, or leave it for after submission?
