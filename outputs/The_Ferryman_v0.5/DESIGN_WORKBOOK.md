# The Ferryman v0.5 design workbook

Status: provisional workshop iteration, October 4, 2026. One player in both media. The team retains final design and art decisions.

## Read this version together

Use [rules](RULES.md), [one-page guide](print/Player_Guide_v0.5.pdf), [complete paper kit](print/Print_and_Play_v0.5.pdf) and [browser game](index.html) from this folder. Do not mix earlier components into this iteration. The [decision map](DESIGN_DECISIONS.md) distinguishes Guy's summarized ideas from added implementation details.

## Experience to test

Choose who boards, compare two uncertain routes, and decide whether to spend a limited memory or accept a missed wish. Waiting souls and passengers aboard use different clocks. A finite night makes the consequences visible within a workshop session. The duration target is 20-30 minutes; no human completion time has been measured.

| Design question | Current prototype choice | Source |
|---|---|---|
| How does the night end? | Survive four trips and fulfill eight wishes; an empty shore and supply after a return can end earlier at the same target. | content.json: config; RULES.md: Objective |
| Who plays? | One ferryman controls every decision. No facilitator is needed to run the rules. | User decision; RULES.md: Return and events |
| What changes each move? | Pay light, advance shared tide, resolve waiting deadlines, deliver, check boat expiry. | RULES.md: Tide, anger and the last delivery chance |
| How is resource abundance reduced? | One light per matched landing, finite single-effect memories, hand limit three, no return recovery. | content.json: config.handLimit; RULES.md: Deliveries, wishes and the hand limit |
| What carries Guy's idea? | Random routes, per-move waiting pressure, Killer, Fool, Ship Wraiths, tainted souls, family quest, Po Din and Achilles/Styx. | DESIGN_DECISIONS.md: Feedback to implementation |
| What keeps paper tracking manageable? | Five track markers, written waiting deadlines and visible Wraith cards; one common boat-move counter. | print/COMPONENT_INVENTORY.json; kit pages 6-7 and 16 |

## Current values

These are agent-authored trial values, not approved final balance.

| Parameter | Value | Exact data field |
|---|---|---|
| Start / maximum light | 5 / 6 | content.json: config.startLight / maxLight |
| Boat seats / hand limit | 4 / 3 | content.json: config.seats / handLimit |
| Outward move limit / tainted limit | 3 / 2 | content.json: config.maxSteps / taintedLimit |
| Waiting patience | 5, Fool 3 | content.json: souls[].patience |
| Night pressure by trip | 0, 0, 1, 1 | content.json: config.pressure |
| Souls / Routes / Memories / Arrivals / Events | 14 / 10 / 13 / 12 / 4 | print/COMPONENT_INVENTORY.json: perPlayer |
| Physical cut pieces | 67, including references and markers | verification/static-results.json: details.componentCount |

Ten routes and fourteen souls are a bounded supply, not a claim that the missing full Guy roster has been recovered. Six souls are plainly labeled provisional fillers. Eight named characters are identifiable in the supplied summary.

## Workshop protocol

Print one complete kit per player. Page 1 gives paper and cutting instructions. Check its 50 mm line with a ruler before cutting. Page 2 is the quick guide; pages 3-5 resolve edge cases and give an example. Keep the tracker and boat mat whole. Use pencil for erasable deadlines. Shuffle Arrivals, Routes and Events separately; Memory cards stay in a visible reserve.

Let the player learn from the one-page guide first, with the full rules available. An observer may write down questions and timing but must not choose routes, passengers or arrivals. Stop at a normal ending or record why the session stopped.

Record actual setup time, game time, ending, wishes, Wraiths, rule questions and difficult or automatic choices on page 16. Separate observed behavior from the player's opinion. No specific enjoyment or win-rate target is established yet.

## Decisions after a human session

| Question | Evidence to collect | Decision remains open |
|---|---|---|
| Is the night short enough? | Start/finish times and time spent consulting rules. | Trip count and target score. |
| Are losses understandable? | First unaffordable move and choices leading to it. | Pressure, recovery and waiting patience. |
| Does Haven have a meaningful cost? | When it is chosen and who expires or waits because of it. | Haven recovery and route frequency. |
| Does random routing preserve agency? | Cases where both offers feel equivalent or unusable. | Route composition and number of offers. |
| Can paper tracking run smoothly? | Missed deadlines, arithmetic corrections, crowded cards and marker handling. | Clock layout and component sizes. |
| Do special characters create memorable choices? | Family quest, soldiers, Killer, Fool and Achilles actually encountered. | Exact abilities and roster. |

## Evidence and limitations

[Validation](VALIDATION.md) records engine checks, a synthetic policy experiment, browser walkthroughs and an agent desk audit. They establish implementation and file behavior within the stated scope. They do not establish enjoyment, human balance, a 20-30-minute duration, printer accuracy or handling quality. Physical checks and human playtesting remain NOT_RUN.

