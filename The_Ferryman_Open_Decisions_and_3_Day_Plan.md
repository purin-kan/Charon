# The Ferryman: open decisions and three-day team plan

Prepared September 25, 2026 for the seven-member group.

**Deadline supplied by the team:** Monday, September 28, 2026, midnight, in the Asia/Bangkok context. Confirm the exact course-portal timestamp and required submission contents. This is the three-day plan discussed on September 25; recalculate remaining time when reading it later.

**Status:** All recommendations below are provisional. No team member names, final assignments, new rule approvals or human group playtest results have been recorded. Adding this document does not change the game rules.

**Main recommendation:** prioritize a complete, understandable paper prototype. Give larger game decisions temporary answers, test the unchanged baseline, and select at most one substantial mechanical experiment before freezing the submission materials.

## 1. Decisions to settle today

| Decision | What needs answering | Recommendation for Monday | Owner / decision |
| --- | --- | --- | --- |
| Submission requirements | Physical prototype, report, slides, video, digital demo, or a combination? How long is the demonstration? | One member checks the actual brief and exact submission timestamp. | [assign / record] |
| D01: Main player experience | Responsibility, strategic mastery, or survival pressure? | Choose one primary aim. Suggested focus: responsibility through planning. | [assign / record] |
| Showcase scope | Which mechanics are actually included in this submission? | Existing base set: souls, relationships, memories, three routes, resources and wraiths. Optional modules off. | [assign / record] |
| D02: Charon's role | Carrier, guide, or judge? Why can souls travel to different destinations? | Write a short explanation matching the prototype. Decide whether route choice represents judgment or transport. | [assign / record] |
| D04: Meaning of Standing | What does this resource represent in the fiction? | Pick one definition, such as Charon's resolve, and use it consistently. | [assign / record] |
| Demonstration format | Full run or shorter example for visitors? | Prepare a short introduction and a complete playable run. Label a shortened demonstration as an excerpt. | [assign / record] |
| Final approval and version | Who decides readiness, and which rules are authoritative? | Assign a coordinator and a rules owner. Use the same version across rules, cards and demonstration materials. | [assign / record] |

Use [workbook section 4](The_Ferryman_Design_Workbook.md#4-major-decisions-reserved-for-the-team) for the original D01-D12 register, source lines 130-149. Choosing a temporary answer for the showcase does not approve it as the final game design.

## 2. Things to test or tweak before freezing the prototype

| Priority | Issue | Group action | Owner / result |
| --- | --- | --- | --- |
| High | Ending can become empty: the successful agent run delivered all 12 souls by crossing 4, leaving two empty crossings. | Play a full run. Decide whether to keep the ending for this submission or test one alternative. A shorter run also requires a quota-timing review. | [assign / record] |
| High | Some memories arrive too late: Musician and Listener's Joined Memories never reached the hand in that run. | Check whether players experience a useful memory payoff. If recall timing changes, test the resulting sequence before printing. | [assign / record] |
| High | Faint Memory can have little practical value: one comparison found its cost cancelled its protection benefit. | Decide whether the weak reward communicates separation or feels pointless. Test one revised effect or cost only if this is the chosen change. | [assign / record] |
| High | Rule explanation needs human testing: separation, memory targets, wraith timing and payment order may cause confusion. | Give the rules to someone who did not write them. Record requests for help and fix unclear wording. | [assign / record] |
| Medium | Destinations mainly differ economically: a soul's destination does not change its printed rewards in the base trial. | Explain the current purpose. If narrative route choice is essential to the pitch, consider one simple request example before adding a larger system. | [assign / record] |
| Medium | Difficulty and replayability remain uncertain: fixed supply supports repeatable winning sequences. | Test with fresh players. Keep the fixed order unless evidence supports changing it. | [assign / record] |
| High | Digital checks do not establish that the physical kit is easy to operate. | Rehearse drawing, discarding, refusal markers, wraith flips, quotas and reset with actual paper pieces. | [assign / record] |

**Recommended order:** clarity and physical handling first, then ending, then memory payoff. Compare one substantial mechanical change at a time. No proposed revision in this table has been implemented by this document.

Evidence from the September 18 agent review:

- Ending and late memories: [successful browser log](The_Ferryman_Digital_Demo/verification/browser/all-souls-run.json), `finalState.log[3..5]` and `finalState.queue`; [full report](The_Ferryman_Digital_Demo/PLAYTEST_REPORT.md), lines 62-82.
- Faint Memory comparison: [design experiments](The_Ferryman_Digital_Demo/verification/demo_design_experiments.json), `probes.faintProbe.sameResultingStateApartFromLog`.
- Route behavior and fixed-order comparisons: the same experiment file, `probes.routeProbe` and `runs`; full report, lines 46-60 and 84-90.

These are agent/browser checks and deterministic experiments. They do not establish human enjoyment, balance or learning difficulty.

## 3. Open decisions that can keep their current temporary settings

| Decision | Question still open | Recommended temporary setting | Team answer |
| --- | --- | --- | --- |
| D03: Routing and access | One destination or multiple stops? Paid or event-gated access? | One destination per crossing; all three routes open. | [open] |
| D05: Memory structure | Drawn hand, tableau, archive, or another arrangement? | Existing ordered queue and hand, unless memory handling is the chosen experiment. | [open] |
| D06: Ending and failure | Final ending, scoring, quota amount and escalation? | Preserve the tested base rules unless an ending experiment is approved and checked. | [open] |
| D07: Wraith recovery | Can wraiths be removed or appeased? | Persistent wraiths for this submission. | [open] |
| D08: Shore arrivals | Refill, fixed arrivals, crowding or overflow? | Refill to five from the fixed supply. | [open] |
| D09: River information | Random events, previewed conditions or hidden information? | Fully visible conditions; no random events. | [open] |
| D10: Destination wishes | Binding, advisory or negotiable requests? | No mechanical destination restriction unless explicitly added and tested. | [open] |
| D11: Progression and forgetting | Upgrades, memory removal, archive or long-term progression? | Defer until after the showcase. | [open] |
| D12: Production scope | Final engine, platform, controls, production art and audio? | Defer final production choices. Use existing paper materials and digital test demo. | [open] |

Together with D01, D02 and D04 in list 1, this covers all twelve major decisions in the workbook. Record what is temporary and what remains open; do not silently convert a trial setting into a final approval.

## 4. Suggested responsibilities for seven members

| Member slot | Responsibility | Concrete output | Name |
| --- | --- | --- | --- |
| 1 | Coordinator and submission owner | Confirmed requirements, schedule, final package and submission receipt. | [assign] |
| 2 | Rules owner | One authoritative rule sheet and a record of approved changes. | [assign] |
| 3 | Playtest lead | Test sessions, player explanations and recorded confusion. | [assign] |
| 4 | Balance and demo checker | Checks of resources, ending and memories; verification of approved changes. | [assign] |
| 5 | Physical component owner | Complete printed, cut, assembled and counted kit. | [assign] |
| 6 | Narrative and visual owner | Consistent Charon/destination explanation, readable cards and presentation visuals. | [assign] |
| 7 | Presentation and rehearsal owner | Demonstration script, timed rehearsal and reset checklist. | [assign] |

These are suggested responsibilities, not confirmed assignments. Everyone should play or observe a run. Rotate the player so the rules are not tested only by their author.

## 5. Three-day priorities and submission buffer

| Date | Priority | Evidence to finish with |
| --- | --- | --- |
| Friday, September 25 | Confirm requirements, assign owners, settle temporary decisions and run the unchanged prototype. | Brief and timestamp checked; named owners; dated scope; recorded baseline run. |
| Saturday, September 26 | Test one proposed change if needed, settle rules, then synchronize cards, instructions and demo. | Comparison notes; approved decision; consistent materials with one version. |
| Sunday, September 27 | Finish the physical kit, rehearse presentation and reset, and check the submission package. Aim to be ready that evening. | Complete inventory; timed rehearsal; reset completed; package checked. |
| Monday, September 28 | Final checks and submission before the confirmed cutoff. | Uploaded or delivered files verified; submission receipt saved. |

The exact portal cutoff controls this plan. If its timestamp is earlier than an assumed end-of-Monday deadline, move submission earlier. The supplied word "midnight" must not be used to justify missing the actual deadline.

### Final readiness check

- [ ] Required submission contents, exact cutoff and presentation duration are recorded.
- [ ] Every needed component is present and uses the approved packet version.
- [ ] A full paper rehearsal reaches the correct ending without an improvised rule.
- [ ] Capacity, memory targeting, joint/solo memories, wraith timing, pressure failure and quota failure have been checked.
- [ ] A participant has made a choice and explained its tradeoff; prior involvement is recorded.
- [ ] Explanation, play and reset times are recorded and fit the available slot.
- [ ] The kit and submission files are packed, checked and assigned to an owner.

This condenses [workbook checkpoint C01](The_Ferryman_Design_Workbook.md#c01-readiness-checklist), source lines 776-789. Leave boxes unchecked until there is actual evidence.

### Record a decision

Decision ID: [ ] | Owner: [ ] | Date: [ ] | Temporary or final: [ ]

Chosen answer and reason: [ ]

Observed evidence, log or participant quote: [ ]

Affected cards, rules, demo and guide: [ ]

Who updates each file, by when, and what must be rechecked: [ ]

## Source and freshness note

Original source dates, oldest first: workbook modified September 17, 2026 at 18:41; agent playtest report modified September 18 at 13:58. Both were imported into this repository in the September 25, 21:20:08 +07:00 commit. Importing them does not constitute a newer playtest. Their historical "coming week" wording is superseded by the user's September 28 deadline. The recommendations above preserve the five lists discussed with the user on September 25.
