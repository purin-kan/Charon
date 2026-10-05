# The Ferryman v0.6 rules

Generated from `content.json`. Shared SHA-256: `2f1dc6b5019016196fe447eb20e1248166d95c634c86075175f154630dc43454`.

## Setup

One player. Start Light 6, maximum 6; 4 ordinary seats; no memories; cycle 1; global outward round 0; all anger 0.

Initial shore: Mother, Child, Merchant, Mason and Cook. Shuffle Soldier, Poet and Keeper as arrivals.

## Souls

| ID | Soul | Seats | Destination | Fresh memory |
|---|---|---:|---|---|
| SOUL-MOTHER | Mother | 1 | Tartarus | Light |
| SOUL-CHILD | Child | 1 | Haven | None |
| SOUL-MERCHANT | Merchant | 1 | River Styx | Foresight |
| SOUL-SOLDIER | Soldier | 2 | River Styx | Guard |
| SOUL-POET | Poet | 1 | Elysium | Foresight |
| SOUL-COOK | Cook | 1 | Asphodel | Calm |
| SOUL-MASON | Mason | 1 | Acheron | Fog Shield |
| SOUL-KEEPER | Keeper | 1 | Asphodel | Fog Shield |
| SOUL-POLONG | PoLong | 0 | Tartarus | None |

## Destinations

| ID | Name | Base fog |
|---|---|---:|
| DEST-HAVEN | Haven | 0 |
| DEST-STYX | River Styx | 1 |
| DEST-ACHERON | Acheron | 1 |
| DEST-ASPHODEL | Asphodel | 2 |
| DEST-ELYSIUM | Elysium | 3 |
| DEST-TARTARUS | Tartarus | 3 |

## Objective

Endless solo survival. Zero Light is immediate loss. Voluntary stop records a session without a victory.

## Boarding

Board at least one ordinary soul, at most four seats. Reverse boarding choices before departure. Soldier uses two seats. PoLong uses no ordinary seat. No other passive abilities apply.

## Recycling

Keep eight unique ordinary souls across arrival pile, shore, boat and resolved discard. Refill to five on return. Only when arrivals run out, shuffle resolved ordinary souls. Never duplicate waiting or aboard souls. Delivered and expired PoLong leave their instance supply.

## Memories

Start with no memories. Play at most one before each outward round or return. Each use consumes that held copy. Every eligible delivery creates a fresh source-labeled memory, including repeats. Unused copies persist. After rewards choose excess cards to discard to three. Used and discarded paper memories return to a reserve; never take a held card to supply a reward.

## Quest

Deliver Child to Haven before Mother to Tartarus, possibly across cycles. Qualifying Mother gives her normal Light memory and one Passage. Mother delivered first, or a required family member expiring before its required delivery, fails the quest for the run. A later recycled Child's fate cannot undo a qualifying Child delivery. Completion and failure survive recycling; Passage is granted at most once per run.

## Routes

The facilitator orders, shuffles and hands out two-destination offers using only the six destination IDs. No generator, repeating map, first-cycle guarantee or map-ending penalty applies. Missing offers pause play without spending a memory or advancing time. Foresight requires the current and next two complete offers; revealed offers remain visible in this cycle.

## Passage

Passage may deliver any onboard soul, including PoLong, with its normal rewards. It causes no fog, anger, outward-round increment or scheduled spawn. If it empties the boat, it spends the immediate return's memory allowance too.

## Damage

Guard prevents only the next one damage point in its round or return and then expires. Fog Shield reduces crossing fog only. Wraiths leave immediately and have no continuing fog. Ordinary delivery and Haven do not heal. Return healing happens only after surviving shore expiry.

## Example

Before global round 6, Light 4, Keeper and Soldier at Ship Anger 3. Play Fog Shield, spawn PoLong at 0, choose Asphodel: pay 1 fog, Light 3. Deliver Keeper for fresh Fog Shield. Soldier expires for 1 Light, leaving Light 2. PoLong advances to anger 1. This is a rule example, not a playtest.

## Memories

- **Light (MEM-LIGHT):** Restore 1 Light, maximum 6.
- **Foresight (MEM-FORESIGHT):** Reveal both options at the current fork and next two forks. Revealed options stay visible for this cycle.
- **Guard (MEM-GUARD):** Prevent the next 1 point of Light loss during this outward round or return, including fog or wraith damage. Unused protection expires at that round/return's end.
- **Calm (MEM-CALM):** Reduce one active soul's current Shore or Ship Anger by 1, minimum 0. It may target PoLong. It cannot revive a removed soul.
- **Fog Shield (MEM-FOG):** Reduce total fog for this crossing by 1, minimum 0. It does not prevent wraith damage.
- **Passage (MEM-PASSAGE):** Instantly deliver one onboard soul to its preferred destination with the ordinary reward for that soul, no fog, no anger advance and no outward-round advance. It may target PoLong.

## PoLong and anger

A new zero-seat PoLong arrives before travel on every 3rd global outward round, after the memory. Each adds 1 fog at current Ship Anger 2 or 3; lower anger adds none. Contributions add. Calm changes current anger, including fog contribution. No separate timer applies. Shore expiry is at 2; ship expiry is at 4. Boarding resets Ship Anger to zero. Do not unload after departure.

## Outward round

1. Optionally play one memory; resolve its effect and any rewards or hand overflow.
2. If Passage empties the boat, return immediately using the same spent memory allowance.
3. Advance the global outward round. On a multiple of three, add a new PoLong at Ship Anger 0.
4. Choose one of the facilitator's two destinations. Calculate base fog plus current PoLong fog minus Fog Shield, minimum zero.
5. Apply Guard to the next damage point and pay fog. Zero Light ends the run before delivery.
6. Optionally deliver any matching passengers and receive fresh fixed memories and any quest reward.
7. All remaining passengers gain one Ship Anger, including the new PoLong.
8. Each reaching four becomes a wraith, costs one Light subject to Guard, and leaves. Stop immediately at zero Light.
9. Choose excess memories to discard down to three. Empty boat: return with a new memory allowance. Otherwise begin the next outward window.

## Return

1. Return has no travel fog and does not advance the outward round. Optionally play one memory if its allowance is available.
2. All waiting ordinary souls gain one Shore Anger. At two, each becomes a wraith, costs one Light subject to Guard, and enters the resolved discard. Stop immediately at zero Light.
3. If alive, restore two Light, maximum six, and record a completed cycle.
4. Refill shore to five. When the arrival pile is empty, shuffle only resolved ordinary souls into it. New arrivals start at zero Shore Anger.
5. Begin the next cycle with facilitator-supplied offers. Boarding resets Ship Anger to zero. Play continues without a cycle or delivery cap.

## Authority and remaining checks

The supplied guides and later clarifications are preserved in `source/`. The shared handoff resolves their conflicts. Rules are implementation requirements, not evidence of balance, human play or final team art approval.
