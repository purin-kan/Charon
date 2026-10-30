# Proposed rules for the first all-quest trial

30 October 2026. **Accepted for the local trial.** The user selected “Use the draft's temporary rules” after confirming separate Heaven, all ordinary and heroic quests, and repeatability when characters return. These are temporary choices for testing the complete quest set, not final balancing. The user and team retain major game decisions under AGENTS.md. The original draft filename is preserved for traceability.

## Confirmed in this implementation conversation

- Heaven is a separate destination, not Haven or Elysium: use `DEST-HEAVEN`.
- Include all six ordinary quests and both heroic quests in the first playable update.
- Quests can repeat when the required characters return. A new attempt binds to new runtime participant instances; an old attempt never grants rewards for a recycled character.
- Earlier user decisions still apply: +1 Light on return, Priest memory +1 Light, newer Soldier fog memories, and retaining the separate five-variant Polong system. The later user correction reinstates all five numbered roster entries.

## Proposed trial configuration

These defaults fill gaps solely to make a reviewable trial possible. Changing them later should be data-driven where feasible.

| Topic | Proposed temporary choice | Why a choice is needed |
|---|---|---|
| Heaven | Fog 2; available from the first trip. | New destination has no cost or unlock stage in the source. |
| Progression | Open all seven destinations and the full selected roster in this trial. Do not implement incomplete unlock/adaptive probability notes. Apply the documented +1 route fog from cycle 6 and +2 from cycle 12, except Haven. | All new quests need reachable destinations; Scale's stages are incomplete. Heaven counts as a normal non-Haven route for this increase. |
| Basic limits | Start/max Light 6, boat 4 seats, shore target 5, ordinary Ship Anger limit 4 and Shore Anger limit 2, hand limit 3. | Retains established baseline limits until trial feedback. |
| Memories | No per-window numerical use cap. Play held memories before an outward crossing or return. After rewards, finish the round then discard excess to three; excess cannot be used before trimming. | Source rejects one-use cap; cap two is only a possible later tuning option. |
| Protection | Multiple fog reductions add; all-fog protection overrides crossing fog. Neither prevents Wraith damage. Prevent-Anger memories reduce one active soul's current Anger by one, minimum zero. | Defines stacking and preserves the current Calm interpretation of “prevent 1 Anger” for this trial. |
| Ordinary seats | One seat each, including Red and Blue Soldiers. Legacy Soldier is excluded from the new roster. | New split-soldier seat values are unspecified. |
| Ordinary wishes | Retain existing wishes for Mother, Merchant, Mason, Cook, Keeper and Poet. Child, Priest and Blacksmith go to Heaven. Red/Blue Soldiers: Styx. Listener and Bard: Elysium. Messenger: Styx. Farmer: Asphodel. | New ordinary wishes are missing; Farmer's narrative wish remains TBA in the entity catalog. These are trial routing values only. |
| Naming | Display Bard; keep `SOUL-MUSICIAN`. Display Heracles; keep `SOUL-HERACLES`. Keep Zilla as written. Passenger is the existing Passage concept, displayed Passenger with existing `MEM-PASSAGE`. | Resolves UI labels without merging stable identities or revising mythology. |
| Returns / lifecycle | A trip/cycle runs from shore departure through the following return. Ordinary souls reset Anger on boarding. Delivered, expired or sacrificed ordinary characters can enter the later recycling pool. | New Anger-reduction-on-boarding suggestion and final ending/recycling direction are incomplete. |
| Event order | Before-crossing player actions and memories; scheduled Polong arrival; route choice/reveal and fog; destination encounter/hero choice; optional ordinary deliveries; pair shared-route effects; ordinary and tainted Anger; Wraiths/spread; memory loss and hand trimming. Return: shore Anger/expiry, heal if alive, expire cycle effects, refill. Zero Light stops later resolution immediately. | Interactions need one explicit order. A full crossing counts once after delivery, including passengers retained on board. Returns do not count as shared routes. |
| Target/removal | Sword removes one tainted passenger with no memory, Light reward, Wraith damage or spread. Sacrifice/frightening also grants no memory. Expiry alone triggers Polong spread. Transforming a required quest participant fails that attempt. | Different removal reasons cannot share an undefined reward/expiry path. |
| Repetition | Pair quest starts when both required current instances depart together. Participant loss or an invalid departure order fails that attempt. New arrivals can form a new attempt. Completed participants cannot start a second attempt during the same boarding. | Implements repeat-on-return without repeated reward farming from one pair. |

## Proposed ordinary quest details

| Quest | Proposed trial interpretation |
|---|---|
| Mother + Child | Both must depart on the same boat. Deliver Child to Heaven, then Mother to Tartarus during that trip. Reversed order or loss fails the attempt. Completion grants one Passenger. Ordinary Mother memory is separate. Passenger may complete matching quest delivery stages. |
| Red + Blue | Count crossings only while both remain aboard after the delivery step. Every second shared crossing gives every other passenger, including Polongs/heroes, +1 Anger before normal Anger. Delivering either stops the pair penalty. Deliver both at their wishes to complete; reward reduces one active soul's Anger by three. |
| Bard + Listener | On the third crossing with both still aboard, Listener transforms into Poet before normal Anger. Preserve instance/origin, current Anger and boarding identity; wish becomes Elysium, ordinary memory becomes Foresight. Standalone Poet can coexist. When recycled, this character returns as Listener. Transformation completes the quest without a separate reward card. |
| Farmer + Cook | A “Prepare meal” action before crossing, once per shared boarding. All aboard, including Cook, lose one Anger; Cook then gains two. Resolve any resulting expiry immediately. The meal completes this interaction; no additional quest memory. |
| Merchant + Blacksmith | Cannot depart with Merchant, Blacksmith and Mason together. While this pair quest is active and both are aboard, Blacksmith blocks Anger increases on Merchant. Deliver Merchant first; Blacksmith can leave at Heaven on a later crossing or by Passenger after Merchant. Completion grants one Sword. Blacksmith's ordinary delivery never grants a second Sword. |
| Merchant + Mason | Same three-character incompatibility. Mason can disembark only after Merchant and as the last passenger aboard, counting heroes and Polongs. Completion grants one capacity memory. Playing it grants +1 seat for the rest of the current trip and expires on return, when the boat is empty. Multiple capacity memories do not stack within a trip. |
| Priest ability | Before crossing, target any other current boat passenger, including a Polong or living hero. Reset its Anger to zero once per Priest boarding. Priest becomes Exhausted and gives no ordinary memory on delivery during that boarding. A later arrival/boarding restores the normal state. Ability use does not consume a memory use/card. |

## Proposed hero handling

- At each shore phase, offer one randomly selected eligible hero who is not already active. Heracles requires more than three shore souls; Odysseus has no additional threshold. Player may accept or decline. Accept at most one hero for that departure. Heroes use one seat, gain normal Ship Anger, and can expire. Declined/finished heroes become eligible again at a later shore phase. Their appearances do not replace ordinary roster supply.
- Heracles' toll: choose one ordinary shore soul, remove it to the resolved recycling pool and lose one Light as a Wraith toll. If this ends the run, stop before boarding Heracles. No ordinary memory from the toll.
- Hero destination draws use the original six non-Heaven destinations, preserving the source's “random from six.” Since all are open in this trial, every generated wish is reachable.
- At Heracles' first wish, Cerberus boards and the game selects up to two other ordinary passengers to frighten away into the resolved recycling pool, with no Light damage. Heracles and Cerberus are not eligible. Cerberus uses one seat; if no room remains after frightening, the boat is overloaded for +1 fog until capacity is available. Do not eject additional passengers automatically.
- After the fight, Heracles and Cerberus receive individually drawn destination wishes from those six destinations. They cannot immediately complete the new stage in the same arrival event. Deliver both to finish; loss of either fails. Cerberus grants no ordinary memory.
- Golden Apple is a consumed memory: restore Light to the increased maximum and increase that maximum by one for the remainder of the run. Repeated Apples stack. This is an explicit trial exception to the older flat-power note.
- Odysseus disembarks at his first wish, then the Tiresias choice resolves immediately, before ordinary deliveries. Charybdis discards one random held memory if available; an empty hand loses nothing. Award Moly afterward. Zilla converts one random remaining ordinary boat passenger into a Wraith, loses one Light, grants no ordinary memory and removes that passenger to the recycling pool. If none is eligible, it causes no soul/Light loss. Award Nobody only if the player survives.
- Moly suppresses future scheduled Polong arrivals until the next return; it does not remove passengers already aboard. A suppressed arrival does not increase encounter level. Nobody prevents all crossing fog until that return; it does not block Wraith or other non-fog damage. Both effects expire on return and do not stack in duration. Moly/Nobody are held memories until played.

## Proposed Polong integration details

Use all five variants and the source's encounter-level rules, Restless River formula and once-every-three-outward-round schedule. Each newly boarding Polong snapshots its level; later encounters do not retroactively upgrade an older passenger. Levels stack: start Anger 1 from level 2, empowered from 3, Wraith damage 2 from 4, spread from 5.

The next variant is drawn and shown before boarding selection. After it boards, draw the next from the tier eligible for the next encounter. Treat variants as reusable types with independent instance IDs; allow duplicate types aboard rather than inventing a finite physical deck limit.

- Po Luem: one loss per eligible surviving Po Luem at end of round, excluding its boarding round. Base lets the player choose; empowered chooses randomly. Empty hand does nothing. Resolve this before hand-limit trimming.
- Po Nak: use its current seat cost in occupancy; when occupancy exceeds capacity, add one overload fog total, not one per Po Nak. Capacity can be exceeded only by forced additions; voluntary boarding still respects the limit.
- Po Mued: choose hidden option(s) once per fork using saved randomness. UI must not reveal hidden names, artwork, fog or matching passengers in previews. Foresight overrides concealment for its revealed forks.
- Po Due: delivery requires Anger at least two, including Passenger; empowered delivery costs one Light. The two-fork Haven guarantee applies to the next two not-yet-chosen forks while it is aboard and is renewed after a Haven offer. Never change an already revealed offer; use a later eligible offer to satisfy the guarantee.
- Spread: choose one remaining ordinary passenger excluding Mother/Child, turn it into a base Po Long at Anger zero, no memory, no spread. Preserve its original roster identity for conservation and recycle it as its original character after removal. This fails any quest requiring the transformed instance.
- Delivering an original Po Long to Tartarus by normal travel grants +1 Light, capped at current maximum. Passenger/Sword gives no such bonus. Do not extend this to other variants or spread-created passengers.

## Scope of acceptance

Accepting this draft would authorize these named temporary interpretations for the local trial only. It would not approve final balance, art direction, an engine migration, cloud publication or a catalog rewrite. Otherwise, leave affected features pending and decide the disputed rows before enabling them.

Roster sync, 30 October 2026: the user requested synchronization with the current Doc. Priest now restores one Light, superseding the earlier local two-Light decision. Hero display names are Hercules the traveler and Odysseus the traveler. Personal names remain TBA; all numbered roster entries are included, with unspecified playable rules remaining TBA. All other accepted trial rules remain in force.

## Subsequent team-direction boundary

The user reinstated Drug Dealer, Po Nak, Fool, Po Long and Killer. Po Nak and Po Long refer to existing variants; Drug Dealer, Fool and Killer are included roster concepts with playable rules TBA. The user deferred major Scale decisions to the team. This prototype retains all destinations/selected playable souls open and the temporary every-three-round arrival schedule until a team-directed Scale revision. The user clarified that the intended Scale counts mean arrivals per cycle, not a simultaneous cap; their activation/timing remains part of the deferred Scale implementation.
