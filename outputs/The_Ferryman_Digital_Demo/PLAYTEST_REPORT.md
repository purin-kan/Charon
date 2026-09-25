# The Ferryman: digital prototype playtest review

18 September 2026 | Base paper rules v0.2 | Interface build 0.2.1

## Quick summary

**My opinion: this is a promising rescue and resource puzzle, ready for a first team playtest. The most urgent design work is the ending and the payoff of memories.** Capacity, linked passengers, money and pressure produce understandable consequences. The short trial does not yet demonstrate the full promise of carrying people's memories through a mythic underworld.

I completed one successful browser run and one deliberately losing browser run, compared destination previews, and checked seven deterministic policies separately. These are agent-operated checks and design analysis, not human playtests or proof that the game is fun or balanced.

- **Keep:** linked passengers, visible consequences, and the tradeoff between obols and Standing.
- **Test next:** the two empty late crossings and whether memories meaningfully change a player's plan.
- **Leave to the team:** rescue puzzle versus unavoidable sacrifice, ending structure, and how destinations should reflect a soul's wishes or judgment.
- **Ready to use:** open `index.html`, play together on one screen, write notes, and export the play log. The base rules have not been rebalanced.

## What I actually played

| Browser run | Result | Delivered | Wraiths | Final obols | Final Standing |
| --- | --- | ---: | ---: | ---: | ---: |
| Guided full rescue, mixed routes | Completed all 6 crossings | 12 | 0 | 5 | 2 |
| Fare-first Tartarus policy | Deliberate pressure failure on crossing 3 | 6 | 1 | 8 | 2 |

The successful sequence was:

| Crossing | Passengers | Route | Memory |
| --- | --- | --- | --- |
| 1 | Mother, Child, Poet | Asphodel | None |
| 2 | Merchant, Red Soldier, Blue Soldier | Tartarus | Mother's Joined Memory, protect Mason |
| 3 | Cook, Mason, Messenger | Tartarus | Merchant's Vigil |
| 4 | Keeper, Musician, Listener | Tartarus | Red Soldier's Accord |
| 5 | Empty boat | Asphodel | None |
| 6 | Empty boat | Asphodel | Messenger's Steadiness |

The failure run carried Child, Merchant and Red Soldier first, then Poet, Blue Soldier and Mason. Leaving Mother twice, including the initial separation, made her a wraith. On crossing 3 I selected Cook, Messenger, Musician and Listener and inspected all three destinations. I intentionally confirmed the warned Tartarus loss to verify the failure behavior. It was avoidable, not a forced loss.

Evidence: [successful exported log](verification/browser/all-souls-run.json), fields `decisions` and `finalState`; [failure exported log](verification/browser/pressure-failure-run.json), the same fields. [Observed interface text](verification/browser/ui-observations.json) also preserves the route previews. That record includes an aborted control test before the scrolling fix; it is not counted as a completed design run.

## 1. Linked passengers give the resource puzzle a clear subject

Mother and Child are the best opening demonstration. Together with Poet they fill all four seats, generate three Standing on arrival, and leave two Joined Memories. The other opening I tested instead took Child with two fare-paying souls. Mother immediately reached two refusals, then became a wraith on the following crossing.

That connection is the strongest part of the design in my assessment: the consequence belongs to a named person and returns later as pressure. It gives the team a concrete event to discuss with participants. Whether people feel attachment, guilt or frustration remains a human-test question.

Evidence: successful log `finalState.log[0]`; failure log `finalState.log[0..1]`. The browser showed the extra separation refusal before commitment.

## 2. Routes already create a useful economic choice

At the failure run's third departure, the same boat and resources produced these previews:

| Destination | Toll | Total pressure, including one wraith | Result at this departure |
| --- | ---: | ---: | --- |
| Elysium | 1 | 1 | Survives, projected 6 obols / 3 Standing after quota |
| Asphodel | 0 | 2 | Survives, projected 7 obols / 2 Standing after quota |
| Tartarus | 0 | 3 | Fails before arrival, retains existing 8 obols / 2 Standing |

This is a useful demonstration of why money alone does not guarantee survival. Eight obols cannot pay pressure under the base rules. A safer destination matters even after a financially successful opening.

The current destinations differ through toll, pressure and service income. Every soul can use every route, and printed soul rewards are unchanged by the destination. My concern is that the destinations' emotional meaning may remain mostly in their names and artwork. After the base loop is understood, a **team option** is to test one visible destination request for one soul. Decide whether honoring it affects story, memory, reward, or nothing mechanical before expanding that idea.

Evidence: observed interface text, `runs[2].elysiumAlternative`, `asphodelAlternative` and `tartarusWarning`; [design experiments](verification/demo_design_experiments.json), `probes.routeProbe`; [interface](index.html), destination instructions; [engine](engine.js), route definitions.

## 3. The ending currently outlasts the passenger decisions

The successful browser run delivered all 12 souls by crossing 4. Crossings 5 and 6 still required departure, pressure payment, memory decisions and the final quota, but there was nobody left to choose. This also occurred in the all-Asphodel, all-Tartarus and Standing-first desk runs. The fare-first Asphodel run delivered 11 and created one wraith, then also had two empty crossings.

I would prioritize this before adding more mechanics. The presentation risks ending with administration after its most meaningful decision. Empty crossings can still be tense when resources are tight, so this observation does not by itself prove they should be removed.

**Team decision:** compare the current ending with exactly one alternative: a shorter trial with retuned quotas, additional late souls, or an end condition that settles obligations when supply and shore are exhausted. Each changes pacing and economy. None is implemented here.

Evidence: successful log `finalState.log[3..5]`; design experiments `runs[].summary.emptyCrossings` and `allSoulsDeliveredAfter`.

## 4. Memories need more opportunity to justify their central role

Mother's Joined Memory worked well in the successful browser run: it reduced pressure while protecting Mason from normal refusal. That connects a past rescue to a later decision.

However, the Musician and Listener's Joined Memories, earned on crossing 4, remained in the draw queue when that run ended. They never reached the hand. The separate Standing-first Asphodel policy rescued all 12 and won while playing only one memory.

A focused desk comparison also found that playing Child's Faint Memory on the fare-first second crossing produced exactly the same next state as skipping it, apart from the explanatory log: its one Standing cost cancelled its one pressure reduction. Other hands can change discard order, so this is not a claim that playing it is always identical in every future state.

My assessment is that memories have a strong thematic purpose but uneven mechanical payoff in this short trial. **Team options** include a distinct situational use for solo memories, an earlier chance to draw late memories, or a different recall structure. First ask a participant whether they remember whose card helped them, and whether obtaining it changed their plan.

Evidence: successful log `finalState.queue`; design experiments `runs[id=compassion_asphodel].steps` and `probes.faintProbe.sameResultingStateApartFromLog`.

## 5. Decide what kind of challenge the showcase should promise

The fixed supply allows a reliable full-rescue sequence. With the same passenger and memory choices, all-Asphodel and all-Tartarus desk runs both won, finishing respectively at 2 obols / 4 Standing and 6 obols / 0 Standing. A different Standing-first policy also rescued everyone, although it separated the later pair.

These results establish that full rescue is possible under several defined policies. They do not establish that new players will find it easy. My preference for the first showcase is to present it as a compact rescue puzzle, then let real players reveal where the difficulty and emotional tension are. If the intended identity requires unavoidable sacrifice, that is a separate team decision, not a difficulty change to make silently.

Evidence: design experiments `runs[id=same_asphodel|same_tartarus|compassion_asphodel]`. Seven policies are a small, deliberate comparison set, not a statistical sample.

## Suggested team session and checkpoint

Use a fresh run and let one teammate operate while another observes. Keep this report's winning sequence hidden from that participant.

| Record | Team notes |
| --- | --- |
| Participant, date, prior familiarity | |
| First choice and the reason given | |
| Rules that required help | |
| Was the separation penalty anticipated? | |
| Did a memory change a later choice? Which soul's memory? | |
| Did the destination have a story meaning or only a resource meaning? | |
| Reaction to empty late crossings, if reached | |
| Run outcome and exported log filename | |
| One proposed change, with the observation motivating it | |

**Checkpoint before printing:** record one uncoached run to its real end, review the exported choices against the participant's explanation, and choose at most one rule variation for a comparison. Passing this checkpoint means the team has evidence to discuss, not that balance or enjoyment has been proven.

## Technical scope

The included engine passed **32 checks with 0 failures**. Browser work covered a full successful run, a pressure failure, route previews, memory targeting, save/reload, downloaded logs, reset, reference information and a narrow-screen departure. I fixed the unreachable tall departure panel, scrolling during rapid selection, missing future-card reference information, and misleading terminal empty-shore text.

Direct `file:` launch could not be automated because the browser tool blocks that URL scheme. The folder uses local scripts and assets and is designed for double-click opening, but that launch path is not claimed as browser-tested. See [validation and freshness record](VALIDATION.md) for exact coverage and remaining limits.
