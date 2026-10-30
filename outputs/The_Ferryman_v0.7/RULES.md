# The Ferryman 0.7-trial

Quest prototype: eight quests and five Polong variants. Scale progression is pending team direction; roster entries with unspecified rules are listed as TBA.

Generated from content.json. SHA-256: `a5a686c5a5cb4803b167dd89d8ec67e5828ed2dfec17fc26a50f68d00b71cbc3`.

These rules describe this HTML quest prototype. The old paper kit is historical and has not been updated for this version.

## Setup

Start with 6 Light; maximum 6. Boat capacity 4. Return healing 1.

Initial shore: Mother, Child, Merchant, Mason, Cook.

Arrival pool: Poet, Keeper, Red Soldier, Blue Soldier, Messenger, Bard, Listener, Farmer, Blacksmith, Priest.

## Active baseline souls

| ID | Name | Seats | Wish | Memory |
|---|---|---:|---|---|
| SOUL-MOTHER | Mother | 1 | Tartarus | Light |
| SOUL-CHILD | Child | 1 | Heaven | None |
| SOUL-MERCHANT | Merchant | 1 | River Styx | Foresight |
| SOUL-POET | Poet | 1 | Elysium | Foresight |
| SOUL-COOK | Cook | 1 | Asphodel | Calm |
| SOUL-MASON | Mason | 1 | Acheron | Fog Shield |
| SOUL-KEEPER | Keeper | 1 | Asphodel | Fog Shield |
| SOUL-POLONG | PoLong | 0 | Tartarus | None |
| SOUL-RED-SOLDIER | Red Soldier | 1 | River Styx | Full Fog Protection |
| SOUL-BLUE-SOLDIER | Blue Soldier | 1 | River Styx | Full Fog Protection |
| SOUL-MESSENGER | Messenger | 1 | River Styx | Foresight |
| SOUL-MUSICIAN | Bard | 1 | Elysium | Calm |
| SOUL-LISTENER | Listener | 1 | Elysium | None |
| SOUL-FARMER | Farmer | 1 | Asphodel | Shared Harvest |
| SOUL-BLACKSMITH | Blacksmith | 1 | Heaven | None |
| SOUL-PRIEST | Priest | 1 | Heaven | Last Prayer |
| SOUL-PO-LUEM | Po Luem | 0 | Asphodel | None |
| SOUL-PO-NAK | Po Nak | 0 | Acheron | None |
| SOUL-PO-MUED | Po Mued | 0 | River Styx | None |
| SOUL-PO-DUE | Po Due | 0 | Haven | None |
| SOUL-HERACLES | Hercules the traveler | 1 | Haven | None |
| SOUL-ODYSSEUS | Odysseus the traveler | 1 | Haven | None |
| CHAR-CERBERUS | Cerberus | 1 | Haven | None |

## scope

Quest prototype: eight quests and five Polong variants. Scale progression is pending team direction; roster entries with unspecified rules are listed as TBA.

## objective

Keep the lantern burning through repeated trips. Zero Light ends the run. This trial has no victory or cycle cap.

## boarding

Select ordinary passengers within capacity. Heroes need a seat. Merchant, Blacksmith and Mason cannot depart together. Souls reset Anger on departure. The next Polong is shown before departure.

## memories

No use cap before travel or return. Each use consumes one held copy. Ordinary eligible deliveries create source-labeled memories; quest rewards are separate. End-round hand limit is three. Overflow cannot be spent before trimming. Sword removes a tainted passenger without expiry consequences.

## quest

All eight quests are active. Pair attempts bind to characters that depart together and can repeat only with fresh returned character instances. Loss/transformation fails an unfinished attempt. The journal shows stages and restrictions.

## routes

All seven destinations are open for this trial. Heaven is separate, with base fog 2. Hero wishes draw from the six older destinations. Routes and random losses use saved randomness. Base route fog rises by 1 from cycle 6 and by 2 from cycle 12, except Haven.

## polongs

Every third outward round brings the shown Polong unless Moly suppresses it. Encounters escalate independently from the round counter. See the accepted trial-rules document for all five variants, concealment, Restless River, memory theft, overload, refusal and spread.

## effects

Capacity, Moly and Nobody expire at the next return. Capacity and effect duration do not stack. Golden Apple permanently increases maximum Light by 1 per use during this run. Priest purification is once per boarding and forfeits his memory for that boarding.

## recycling

Resolved ordinary characters return to the arrival pool when it empties, using their origin identity. A transformed Listener returns as Listener; a corrupted ordinary soul returns as its original character. Hero offers are separate.

## damage

Fog protection does not prevent Wraith or toll damage. Original Po Long delivered normally to Tartarus restores 1 Light; Passenger and Sword do not. Other Polongs grant no Light or memory.

## Memories

- **Light:** Restore 1 Light, up to your current maximum.
- **Foresight:** Reveal both options at the current fork and next two forks. Revealed options stay visible for this cycle.
- **Guard:** Prevent the next 1 point of damage this outward round or return. Does not stack.
- **Calm:** Reduce one active soul's current Shore or Ship Anger by 1, minimum 0. It may target PoLong. It cannot revive a removed soul.
- **Fog Shield:** Reduce total fog for this crossing by 1, minimum 0. It does not prevent wraith damage.
- **Passenger:** Deliver one eligible onboard passenger directly to its wish. No travel fog, route count or scheduled arrival; delivery restrictions and quest consequences still apply.
- **Last Prayer:** Restore 1 Light up to your current maximum.
- **Shared Harvest:** Reduce one active soul’s Anger by 1, minimum zero.
- **Full Fog Protection:** Prevent all fog on this crossing. Does not prevent Wraith damage.
- **Sword:** Remove one tainted passenger. No reward, Wraith damage or spread.
- **Soldiers’ Peace:** Reduce one active soul’s Anger by 3, minimum zero.
- **Boat Space:** One extra seat until the next return. Does not stack.
- **Golden Apple:** Increase maximum Light by 1 for this run and restore Light to that maximum.
- **Moly of Hermes:** Prevent future scheduled Polong arrivals until the next return. Existing passengers remain.
- **Nobody:** Prevent all crossing fog until the next return. Other damage still applies.

## Outward round

1. Play any number of held memories and available abilities before approaching the fork. Excess rewards cannot be played before trimming.
2. Approach the fork: advance the outward round and board a scheduled Polong unless Moly suppresses it. Its level/effects apply immediately.
3. Choose a visible or concealed option, review, then confirm. Pay fog after protection. Zero Light ends the run immediately.
4. Resolve a heroic encounter or Tiresias choice, then optionally deliver eligible passengers.
5. Resolve pair shared-crossing effects, then ordinary Anger and Restless River rolls. Blacksmith protects Merchant from Anger increases.
6. Resolve Wraith damage, removals and eligible spread. Po Luem takes memories; choose excess memories to discard to three.
7. Begin the next memory window, or return if the boat is empty.

## Return

1. With an empty boat, play held memories if desired.
2. Waiting souls gain one Anger; at two, resolve Wraith damage/removal. Zero Light ends the run before healing.
3. If alive, recover 1 Light up to the current maximum. Expire trip effects, refill shore and prepare the next hero offer.

## Included roster entries awaiting playable rules

- **Drug Dealer:** Included roster entry. Wish, memory and ability have not been specified.
- **Fool:** Included roster entry. Wish, memory and ability have not been specified.
- **Killer:** Included roster entry. Wish, memory and ability have not been specified.

## Decisions pending

- Team direction on Scale unlocks and adaptive routes
- Drug Dealer, Fool and Killer playable rules
- Human playtesting and balance
- Final engine and artwork

No balance, enjoyment, final art approval or human playtest is claimed.
