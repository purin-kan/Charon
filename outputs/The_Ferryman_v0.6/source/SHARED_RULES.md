# Shared rules for the next Ferryman demo

This is the common design contract for the paper kit and browser. Authority is the user's later chat clarifications, then the edited answers, then the original guide where it supplies compatible context. Source paragraph references refer to the complete indexed extracts in `sources/`. Printing quantities and layout choices in Handoff A are production provisions, not additional gameplay mechanics.

## Premise and objective

One player acts as Charon's apprentice, carrying souls to their preferred destinations. Each outward round offers two destinations and the player chooses one. A cycle begins with boarding at the shore and ends when the boat becomes empty and returns. Preferred-destination delivery is optional; passengers can be retained for a later stop. [Original P003-P019]

Play is endless survival. There is no three-cycle cap, six-delivery target, final scheduled return or automatic victory. Light reaching zero causes immediate loss, including fog or wraith damage. Stopping voluntarily for a workshop ends the recorded session without inventing a victory. Cycles, outward rounds and ordinary deliveries may be recorded as descriptive results, not win thresholds. [Edited P004-P008; user clarification 2]

## Setup and component identities

Start Light at 6, maximum 6, ordinary capacity 4 seats, no memories, cycle 1, global outward round 0, and all soul anger at 0. Initial shore: Mother, Child, Merchant, Mason and Cook. Shuffle Soldier, Poet and Keeper as the initial arrival pile. [Edited P010-P012, P134-P135]

| ID | Soul | Seats | Preferred destination | Memory effect |
|---|---|---:|---|---|
| SOUL-MOTHER | Mother | 1 | DEST-TARTARUS | MEM-LIGHT |
| SOUL-CHILD | Child | 1 | DEST-HAVEN | None |
| SOUL-MERCHANT | Merchant | 1 | DEST-STYX | MEM-FORESIGHT |
| SOUL-SOLDIER | Soldier | 2 | DEST-STYX | MEM-GUARD |
| SOUL-POET | Poet | 1 | DEST-ELYSIUM | MEM-FORESIGHT |
| SOUL-COOK | Cook | 1 | DEST-ASPHODEL | MEM-CALM |
| SOUL-MASON | Mason | 1 | DEST-ACHERON | MEM-FOG |
| SOUL-KEEPER | Keeper | 1 | DEST-ASPHODEL | MEM-FOG |
| SOUL-POLONG | PoLong | 0 | DEST-TARTARUS | None |

The table is from edited P013-P052. Ordinary identities have one active soul card each. Memory copies are distinct from soul instances. PoLong arrivals are separate instances of one type.

Board at least one ordinary soul, using at most four ordinary seats. Choices can be reversed before departure. No additional passive abilities are inherited from earlier game versions. Soldier occupies two seats; the paper mat must make the blocked second seat visible. PoLong takes no ordinary seat. [Edited P053-P054, P075]

## Endless soul supply

Delivered and expired ordinary souls leave the active river/shore and enter a resolved-soul discard. They do not stay removed for the entire run. Whenever the arrival pile runs out while refilling, shuffle the resolved ordinary souls to form the new arrival pile. Never shuffle souls currently waiting or aboard. Reintroduced souls begin at zero Shore Anger. Refill until five ordinary souls wait. A temporarily empty draw and discard supply does not manufacture duplicates. [User clarification 2 overrides edited P012 and the word permanently in P123]

Keep PoLong outside the ordinary arrival pile. Its scheduled arrivals use fresh instances at zero Ship Anger. Reuse a removed physical PoLong card only after clearing its old state. Piece shortage must not cancel a legal spawn or remove an existing instance.

## Destinations and facilitator control

| ID | Destination | Base fog |
|---|---|---:|
| DEST-HAVEN | Haven | 0 |
| DEST-STYX | River Styx | 1 |
| DEST-ACHERON | Acheron | 1 |
| DEST-ASPHODEL | Asphodel | 2 |
| DEST-ELYSIUM | Elysium | 3 |
| DEST-TARTARUS | Tartarus | 3 |

Provide six distinct destination map pieces, excluding the starting shore. The user will order, shuffle and hand out the maps. Supply a separate shore/boarding mat. Do not impose the earlier proposed repeating three-fork map, first-cycle Haven/Tartarus positions, procedural generation or destination guarantees. [Edited P055-P070 supersedes original P013 and the assistant's prior proposal]

Retain the original choice of one of two destinations each outward round. The facilitator prepares these offers. Foresight needs both options at the current fork and the next two forks to be available, concealed until normally revealed or revealed by memory. The handoff does not choose the user's ordering method. Describe how to stage and reveal the offers without forcing a particular order. [Original P005, P015; edited P101-P102]

For the browser, implement a facilitator-supplied route queue or equivalent explicit input. If more route information is required, pause for facilitator input without spending a memory or advancing time. Do not invent a map-ending penalty or use secret random routes as the default. A demonstration sequence must be labeled as an example, not the official route rule.

## Tainted arrivals and fog

Use one global outward-round counter across cycles. A PoLong boards before travel on rounds 3, 6, 9 and later multiples of three. Returning, boarding and Passage do not advance this counter. Play the optional memory before spawning. If Passage empties the boat, return instead of starting that outward round or spawning its PoLong. [Edited P071-P075]

Each PoLong adds zero fog at Ship Anger 0 or 1, and one fog at Ship Anger 2 or 3. Calculate contributions from current anger before crossing. Multiple contributions add. At anger 4 the instance becomes a wraith and leaves. Calm may lower its anger and contribution. There is no separate three-turn debuff timer. [Edited P076-P088]

Fog payable is destination base fog plus current PoLong contributions minus a played Fog Shield, with a minimum of zero. Guard is damage prevention, applied after calculating fog. No night pressure, soldier conflict, persistent-wraith fog or old event modifiers are inherited.

## Memories and replenishment

Play at most one memory before each outward round or return. Each use consumes that card from the hand. Unused cards persist across cycles. Hand limit is three; after receiving rewards, choose which excess cards to discard. Earned rewards are usable only before a later round or return, not to rescue a player already at zero Light. [Edited P089-P109]

Every eligible delivery creates a fresh memory reward, including a soul's later deliveries after recycling. This overrides treating the finite original memory cards as the whole run's supply. Used and discarded physical memory cards return to a reserve for future rewards. A held card is never taken away to supply another reward. Do not reshuffle memory effects randomly; each source soul gives its fixed effect. [User clarification 3]

| ID | Effect |
|---|---|
| MEM-LIGHT | Restore 1 Light, maximum 6. |
| MEM-FORESIGHT | Reveal both options at the current fork and next two forks. Revealed options stay visible for this cycle. |
| MEM-GUARD | Prevent the next 1 point of Light loss during this outward round or return, including fog or wraith damage. Unused protection expires at that round/return's end. |
| MEM-CALM | Reduce one active soul's current Shore or Ship Anger by 1, minimum 0. It may target PoLong. It cannot revive a removed soul. |
| MEM-FOG | Reduce total fog for this crossing by 1, minimum 0. It does not prevent wraith damage. |
| MEM-PASSAGE | Instantly deliver one onboard soul to its preferred destination with the ordinary reward for that soul, no fog, no anger advance and no outward-round advance. It may target PoLong. |

Merchant and Poet have separate source-labeled Foresight rewards; Mason and Keeper have separate Fog Shield rewards. Passage follows the hand limit and one-memory limit. If it empties the boat, its use also occupies the memory allowance for the immediate return. [Edited P109, P129-P131]

## Anger and outward sequence

Ordinary arrivals begin at zero Shore Anger. Boarding starts Ship Anger at zero regardless of Shore Anger. Do not unload passengers back onto the shore after departure. [Edited P111]

1. Optionally play one memory, resolving its full effect and any resulting reward/hand overflow.
2. If the boat is empty, return immediately. Do not start an outward round.
3. Advance the global outward counter and add a scheduled PoLong at Ship Anger 0.
4. Choose one offered destination and calculate fog from the current state.
5. Apply protection and pay Light. Zero Light is an immediate loss before delivery.
6. Optionally deliver any subset of matching passengers and receive their memories and quest rewards. Keep unmatched passengers aboard.
7. Every remaining passenger gains one Ship Anger, including a newly spawned PoLong.
8. Each reaching four Ship Anger becomes a wraith: apply its one-Light loss, then remove it. Guard can prevent the next one point of damage. If Light reaches zero, stop the run immediately.
9. Resolve hand overflow. If the boat is empty, return. Otherwise the next outward round is available.

This order follows edited P112-P123. Wraiths have no continuing fog effect. Removed ordinary souls later recycle; removed PoLong instances become reusable supplies.

## Return sequence

Return has zero travel fog and is not an outward round. If the return's memory allowance is available, optionally play one memory before resolving it.

1. Each ordinary soul already waiting gains one Shore Anger. At two, it becomes a wraith, costs one Light subject to Guard, and moves to the resolved-soul discard. Stop immediately on zero Light.
2. If alive, restore two Light, capped at six.
3. Record a completed cycle and continue endless play. There is no cycle-limit ending check.
4. Refill the shore to five, recycling the resolved ordinary supply as needed. New arrivals have zero anger and do not receive the just-resolved shore increment.
5. The facilitator supplies the next cycle's map offers. Reset Ship Anger on the next boarding, not a still-active passenger.

Ordinary delivery does not itself restore Light. Mother supplies a playable Light memory. Haven has zero base fog and no healing; PoLong can still make it cost Light. [Edited P122, P133-P142, adjusted by user clarification 2]

## Mother and Child quest

Deliver Child to Haven before Mother to Tartarus; these may occur in different cycles. On the qualifying Mother delivery receive both her ordinary Light memory and one Passage memory. The quest is optional and grants Passage at most once per run. [Edited P124-P132; user clarification 3]

Retain the edited guide's failure condition: delivering Mother before a qualifying Child delivery, or losing a required family member before its required delivery, makes the quest unavailable for this run. Recycling souls does not reset completed or failed quest state. This preserves the existing failure rule rather than adding repeat attempts. Show the state explicitly: available, Child delivered, completed, or failed. A later recycled Child's fate does not undo an already recorded qualifying Child delivery.

Remove the stale reference to a winning delivery target in edited P130. Ordinary deliveries can still be recorded for workshop observation.

## Shared worked example

Before global round 6, Light is 4, Keeper and Soldier each have Ship Anger 3, and the player holds Fog Shield. Play it, then add the scheduled PoLong at anger 0. Choose Asphodel: base 2 minus shield 1 gives fog payment 1, leaving Light 3. Deliver Keeper and receive its Fog Shield memory. Soldier reaches anger 4 and becomes a wraith, reducing Light to 2; its card enters the resolved ordinary discard. PoLong reaches anger 1 and remains aboard, so the cycle continues. This is a rule example, not a recorded playtest. [Edited P145, with recycling correction]
