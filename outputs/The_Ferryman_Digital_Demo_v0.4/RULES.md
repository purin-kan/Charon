# The Ferryman v0.4 rules

September 29, 2026. These rules describe the v0.4 browser prototype. The team owns final game decisions. Numerical defaults remain unvalidated by human playtesting. The v0.3 game and paper kit remain separate versions.

## Authority

**Explicit user decisions:** keep lantern light and memories; remove hull, reprimands, obols, quotas and associated repairs, rocky routes and paid calming. Show one decision at a time with a small persistent light/boat summary. Keep multiple destinations per trip, all existing soul abilities and all six memory effects, including soldier conflict, Poet/Keeper powers, cohort links and separation anger. Every delivery grants one memory; only a matched wish restores 1 light. All passengers must be delivered before returning. Deliver the browser demo, rules and quick start first; defer the v0.4 physical kit until the user tries the flow.

**Retained baseline:** the v0.3 decided rules supply unchanged numbers, soul order, map, memory circulation, anger timing, wraith release, recovery and endless escalation. The cuts above supersede any conflicting v0.3 text. This prototype does not choose a final production engine or approve the artwork.

**Implementation interpretations recorded in the paused handoff:** retire Unfinished Message, Old Feud and Broken Landing because their effects require removed resources; retain Shared Farewell with no replacement events or repricing. At the final unvisited destination, deliver everyone remaining to avoid a deadlock under the no-return rule. A Haven detour cannot strand passengers after all destinations are used. Result screens persist without reapplying rewards. v0.3 saves are incompatible. These implement the confirmed intent and are distinguished from separately selected user mechanics.

## Objective and setup

Play an apprentice ferryman, carrying souls to accepting destinations. Wishes are preferences, not moral judgments. Continue through unlimited cycles until a crossing's fog exceeds your light. There is no fixed victory threshold or guarantee that every state is survivable.

- Start at the Starting Shore in cycle 1 with 2 light, maximum 6, and an empty four-seat boat.
- Fill the waiting shore with the first five souls in the supply order below. Anger starts at 0.
- Start with no memories, wraiths, delivered souls or used event flags. A new run resets all gameplay state.
- A crossing is one edge. A cycle is a complete trip out from, and back to, the Starting Shore. UI instructions also call it a trip.

## Guided journey

1. **Passengers:** at the Starting Shore only, board within four seats. Boarding and unboarding are reversible until departure. Do not refill during boarding. Empty departures are legal.
2. **Route:** choose a legal next stop. Preview fog before memory protection. You may release a wraith here for 2 light, immediately removing its 1 fog contribution. Repeat if affordable. Exactly 0 light after payment is legal.
3. **Memory:** choose no card or one card from your hand. Recollection and Joined Memory may select an unprotected waiting soul, from any stop.
4. **Review:** show final fog, remaining light, optional anger protection and any final-destination requirement. Back changes provisional choices without spending cards. Confirm commits the card and target, then resolves fog. A known lethal crossing requires the explicit “Accept failure and cross” action.
5. **Result:** show the committed outcome. Continue only advances the phase; reloading or repeating Continue cannot repeat effects.
6. **Delivery:** after surviving arrival at a destination, choose all disembarking souls in one action. Resolve rewards and the arrival event, then draw memories and return to the route step. At the final destination, all remaining passengers must disembark.

At Haven, skip delivery, recover 1 light, draw memories and prepare the next route. On returning to shore, resolve the cycle-end sequence below and then board again. Release and crossing are committed actions. Delivery checkbox choices are provisional and reset on reload; confirmed route/memory/review choices persist.

## Map and fog

| From | Possible next stops |
|---|---|
| Starting Shore | Elysium, Asphodel, Tartarus |
| A destination | Other unvisited destinations, unvisited Haven, Starting Shore if boat empty |
| Haven | Unvisited destinations, Starting Shore if boat empty |

Visit each destination and Haven at most once per cycle. No self-loops. A destination must be visited before return. Passengers cannot unload at Haven, reboard after delivery or be discarded. Aboard passengers may prefer different destinations.

| Entering | Base fog |
|---|---:|
| Elysium | 0 |
| Asphodel | 1 |
| Tartarus | 2 |
| Haven | 0 |
| Starting Shore | 0 |

`final fog = max(0, base + cycle modifier + active wraiths + soldier conflict - passenger protection - memory protection)`

- Same-cohort Red/Blue soldiers aboard add 1 conflict fog per pair. Accord cancels all such conflict on its crossing.
- Each Poet with at least two other passengers prevents 1 fog. A Keeper traveling as the only passenger prevents 1 fog. Count passengers, not occupied seats.
- Each active wraith adds 1 fog to every crossing, including return.
- Cycles 1–4 use no cycle modifier. From cycle 5, add 1 fog on every non-return crossing, including Haven. From cycle 6, a favored destination ignores that modifier: Elysium in cycle 6, Asphodel in 7, Tartarus in 8, then repeat. It does not remove base fog or other pressure.
- If final fog **exceeds** light, end before arrival, recovery or delivery. The chosen memory is committed, but there is no destination reward. Otherwise subtract fog. Exactly zero survives. Protection never generates light.

## Delivery, souls and memories

Every delivered soul grants one source-linked memory. Matching the preferred destination restores 1 light, capped at 6. An unmatched delivery grants the memory with no light reward and no mismatch penalty. There is no old coin/flame reward in addition to this.

| ID | Soul | Seats | Wish | Memory |
|---|---|---:|---|---|
| S01 | Mother | 2 | Elysium | Faint / Joined |
| S02 | Child | 1 | Elysium | Faint / Joined |
| S03 | Merchant | 1 | Tartarus | Vigil |
| S04 | Red Soldier | 2 | Tartarus | Accord |
| S05 | Poet | 1 | Asphodel | Recollection |
| S06 | Blue Soldier | 1 | Asphodel | Accord |
| S07 | Cook | 1 | Asphodel | Recollection |
| S08 | Mason | 2 | Elysium | Vigil |
| S09 | Messenger | 1 | Asphodel | Steadiness |
| S10 | Keeper | 2 | Tartarus | Steadiness |
| S11 | Musician | 1 | Elysium | Faint / Joined |
| S12 | Listener | 1 | Elysium | Faint / Joined |

Mother/Child and Musician/Listener are linked within the same cohort. Deliver both matching partners in the same action for one Joined Memory per soul. Separate deliveries give Faint Memories with no later upgrade, even if both reach the same destination. A different cohort's partner does not count. Soldier conflicts are also cohort scoped. Other souls have no additional active ability beyond those described.

| Memory | Crossing effect |
|---|---|
| Steadiness | Prevent 2 fog. |
| Vigil | Prevent 1 fog; prevent 3 instead if any two-seat passenger is aboard. |
| Recollection | Prevent 1 fog; optionally guard one waiting soul against normal anger at return. |
| Accord | Prevent 1 fog and cancel all soldier conflict for this crossing. |
| Joined Memory | Prevent 2 fog; optionally guard one waiting soul against normal anger at return. |
| Faint Memory | Prevent 1 fog. |

Add new memories to the bottom of the draw pile in numeric cohort, then template-ID order. Each records its own source identity and destination. Once after destination delivery/events, Haven arrival or shore return, draw to a hand of three or until no cards remain. Keep unplayed cards. If the deck empties, shuffle the discard into a new deck using the run's seeded random stream. Do not shuffle the soul supply.

Choose at most one memory per crossing for no light cost. At confirmation discard it; do not redraw at the same stop. The next successful arrival/delivery preparation enables another draw. No permanent memory removal, deck trimming or upgrades. Pending choices apply no guard until confirmed. Guards do not stack and do not prevent separation anger. Playing without a waiting target still grants the card's fog protection.

## Return, anger and fresh cohorts

On confirmed departure from the shore, snapshot the souls still waiting. Mark a waiting linked partner as separated if their same-cohort partner leaves aboard. Tentative boarding alone creates no lasting mark.

Return is unavailable with passengers aboard. On a successful empty-boat return:

1. For every soul in the departure snapshot still waiting, add 1 normal anger unless guarded by a memory. Add 1 extra anger to each separated waiting partner even if guarded. No anger rises during intermediate crossings.
2. At anger 3 or more, move that soul from the shore to the wraith area. These new wraiths affect the next crossing, not the return just survived.
3. Record a completed cycle; advance the cycle number. Clear visited stops, waiting/separation snapshots and guards.
4. Restore 1 light up to 6. Refill the shore to five. Draw memories once to a hand of three.

Refill in the twelve-template order. Exhausting a cohort starts another with fresh IDs such as C02-S01. Newly added souls start at 0 anger and are exempt from the return update just completed. Souls do not return after delivery. The printed supply of the older kit is not a limit on this game.

## Event reference (spoiler)

**Shared Farewell:** the first time a same-cohort linked pair disembarks together at Elysium, restore 1 extra light, capped at 6. Resolve after normal delivery rewards and before drawing memories. It occurs once per run and its flag resets with a new run.

The UI reveals it when encountered or when the player opens the explicit spoiler reference. The browser can retain a discovery annotation independently of the run; “Clear remembered discovery” clears that annotation without changing gameplay. It grants no unlocks or bonuses. Importing a run that contains the event records it as discovered.

Unfinished Message, Old Feud and Broken Landing are retired. In particular, there is no paid permanent soldier reconciliation in v0.4; Accord still cancels conflict on its crossing.

## Scope and next review

This is a dependency-free local browser prototype, not the final engine or art direction. Saves use a separate v0.4 key and schema, with validation before import. They are not converted from v0.3. The file/text importer accepts up to 5 MB; browser storage capacity can impose another practical limit on very long runs. These are storage limits, not game victory conditions.

The v0.4 paper kit is deferred. The v0.3 workshop components, old workbook examples and PDFs contain removed resources and rewards and must not be used as v0.4 rules. Preserve them as historical comparisons. After the user tries the browser flow, review the paper considerations in the root handoff before authorizing print production. Automated results are in [VALIDATION.md](VALIDATION.md); human readability, enjoyment and balance remain untested.
