# The Ferryman: decisions and team plan

Prepared September 25, 2026 for the seven-member group.

**Deadline supplied by the team:** Monday, September 28, 2026, midnight, in the Asia/Bangkok context. Confirm the exact course-portal timestamp and required submission contents. This is the three-day plan discussed on September 25; recalculate remaining time when reading it later.

**Status:** Current gameplay decisions are consolidated below and in the v0.3 specification. The playable artifacts still implement v0.2; new values require implementation and testing.

## Current authority: v0.3 endless prototype

**User decision:** the run is endless. **Delegation:** the user explicitly asked ChatGPT to make the remaining decisions and record their authorship.

[The Ferryman v0.3 decided rules](../outputs/The_Ferryman_v0.3_Decided_Rules.md) is the authoritative specification for the next prototype. It labels retained user requirements separately from **Decided by ChatGPT** resolutions. The remaining gameplay gaps discussed here are resolved for implementation, with numerical values marked as untested defaults.

| Topic | Current decision | Author |
|---|---|---|
| D01 / D02 | Responsibility, strategy, survival; apprentice carrier/guide, not moral judge | Priority and apprentice: user; authority: ChatGPT |
| D03 | Branching multi-destination cycles returning to starting shore; crossing = one edge; origin-only boarding | Multi-destination: user; topology/timing: ChatGPT |
| D04 | Lantern starts at 2; cap 6; zero survives until fog exceeds available light | Start/meaning: user; cap and zero rule: ChatGPT |
| D05 | Soul-linked memories; free, one per crossing; draw to three once per stop; recycle discard, no permanent removal | Source/cost/limit: user; circulation/effects: ChatGPT |
| D06 | Endless; lantern failure, sinking at hull 0, dismissal at 3 reprimands; quota 2 obols every third completed cycle, miss adds 1 reprimand | Endless/failure categories: user; thresholds and recurring quotas: ChatGPT |
| D07 | Voluntary release costs 2 light, removes wraith immediately, repairs 1 reprimand, repeatable if affordable | Cost/choice: user; timing and repair: ChatGPT |
| D08 | Anger only on return; normal +1, separation +1, transform at 3; refill origin to five using fresh cohorts of 12 templates | Cycle-only anger: user; full timing and endless supply: ChatGPT |
| D09 | Hidden conditional arrival events, then reveal; optional persistent knowledge reference with no gameplay unlocks | Reveal concept: user; event set/persistence exception: ChatGPT |
| D10 | Advisory wishes; match grants +1 light per soul; mismatch has no penalty | Advisory/no penalty: user; bonus: ChatGPT |
| D11 | No upgrades, memory pruning or resources/content unlocks between runs; current-run memories grow; knowledge reference is explicit exception | Restrictions: user; reference reconciliation: ChatGPT |
| Calming | 1 obol prevents one normal anger increase at next return; starting-shore only, once before departure | Action/cap: user; cost/effect/location: ChatGPT |
| Escalation | Rocky alternatives from cycle 3; capped fog modifier from cycle 5; rotating favorable destination from cycle 6 | Endless escalation: user; schedule: ChatGPT |
| D12 | Local turn-based HTML/CSS/JavaScript browser prototype; existing art temporary, final production engine/art deferred | ChatGPT prototype scope |

These decisions do not certify balance. No implementation, PDF rebuild, packaging, browser validation or human playtest is completed by this record.

## Historical discussion and prior plans

Everything below preserves the earlier discussion and dated team plan. Its statements that choices remain open, that quotas are excluded, or that no numerical values are selected are superseded by the specification above. Links were repaired when this record moved into notes/ on September 27, 2026. This move is not new design or playtest evidence.

### Earlier currency and D07-D11 decisions: September 26, 2026

This latest record supersedes conflicting earlier choices where the user's replacement is explicit. Conflicts within this message or with an unspecified run scope remain unresolved. All changes here are recorded design rules, not implemented or tested behavior.

**Currency and presentation, D04/D05**

- Standing is now the boat's lantern light, framed as survival rather than patience. Fog/pressure dims it; grateful souls refill it.
- Starting light is 2, replacing 3 in the old prototype.
- Memories relate to transported souls and are free to play, with at most one per crossing. Removing their cost is intended to discourage hoarding; it does not establish that every effect is useful in every situation.
- Obols pay Hades' quotas and can also calm a waiting soul before wraith transformation. Calming is limited to once per crossing. Its price, timing and effect on refusals are not specified.
- Soul cards show their reward as a coin or flame; route danger is presented as one number per route. How required capacity, links, wishes and discovered event information remain accessible is not yet specified.
- The broad intent is one clear role per currency. The explicit rules nevertheless give obols two spending uses and allow light to be spent on wraith release; retain those explicit choices while clarifying the survival-only wording.

**D07, wraith recovery**

- The player may voluntarily release a wraith for 2 Standing/light.
- Release is not automatic. Unreleased wraiths continue contributing pressure.
- Timing, releases per crossing, and whether spending the last light causes failure remain open. The once-per-crossing cap applies to calming waiting souls, not automatically to wraith release.

**D08, shore arrivals**

- **Latest timing correction:** anger increases only when a cycle completes, defined as the boat returning to the starting shore. No anger increase occurs at intermediate stops, individual departures or individual river segments. This supersedes the assistant's proposed per-departure anger/refusal timing.
- Anger increment, affected waiting souls, transformation threshold and order relative to refill/boarding remain to specify. Any separation-based anger must respect the same cycle-completion timing unless the user later changes it. Calming duration and when newly formed wraith pressure begins need alignment with this timing.

- At the start of each crossing, refill the shore up to five from a fixed-order supply of 12 souls, while supply remains.
- This selects predictable arrivals, not shuffling.
- The user's comments about supply running low around crossing 4 and an often-empty shore by crossing 6 are motivation, not newly verified frequency evidence.
- No replenishment or recycling rule exists for extending this finite supply into the previously selected endless run.

**D09, river information**

- Events are hidden and conditional. Meeting their conditions triggers them without advance disclosure.
- After first occurrence, reveal and record the event and its trigger conditions on the related soul card or in an event logbook, enabling planning in later runs.
- Hidden conditional does not imply random. The actual triggers, effects and timing are unspecified.
- Persisting these discoveries conflicts with D11's instruction that nothing carries over and no between-game tracking is needed. Scope must be resolved.
- A route danger number cannot be described as a guaranteed complete outcome preview if an undisclosed event can change that outcome.

**D10, destination wishes**

- Every soul has a preferred destination. Wishes are advisory, not mandatory.
- Fulfilling a wish grants a small bonus. Sending the soul elsewhere has no penalty.
- Bonus type, amount, award timing and any per-soul/per-stop/per-crossing cap remain unspecified. Do not assume the earlier proposed +1 Standing once per boat.
- Missing a wish must not silently count as a broken commitment that causes dismissal. Any distinct binding commitment needs a separate definition.

**D11, progression and forgetting**

- No boat upgrades, memory removal or forgetting. Nothing carries over between games; each game is a complete independent run with no additional between-game tracking.
- This replaces the previously selected between-run unlocks of souls, encounters and routes.
- Soul-linked memories still provide abilities within the run; no memory pruning is authorized. Whether a limited active set exists alongside retained inactive cards still needs a rule.
- Lethe-inspired forgetting and a one-time bigger-boat choice are deferred ideas for after human playtests, not active rules.
- The user's description of carrying souls, paying two quotas and surviving wraiths suggests a finite basic-run scope, but does not explicitly specify its length or revoke endless play, dismissal or sinking.

**Unresolved scope and implementation decisions**

1. Endless multi-stop runs versus a finite basic run with a fixed supply of 12 and two quotas. Define the end condition and whether this message sets a paper-showcase ruleset separate from the intended endless game.
2. Quotas have been reintroduced as a stated use for obols, reversing their prior exclusion. Amounts, due points and nonpayment consequences are not explicitly selected here. Do not silently restore the old quota-loss rule.
3. D09 discovery persistence versus D11 no carryover: retain learned event records, reset them, or distinguish player knowledge from saved game state.
4. D04 survival-only light versus D07 spending two light to release wraiths; especially whether zero light is immediately fatal or only fails against unmet pressure.
5. Define crossing, stop and shift for branching multi-destination travel. This controls shore refill, memory play limits, calming limits, pressure and quota timing.
6. Set calming price/effect, wish bonus, memory access/effects and wraith-release timing. D02 authority and D12 production scope remain open.
7. Specify whether dismissal and sinking remain part of the current ruleset, and define any retained thresholds and damage/repair rules.

**Evidence limitation:** existing recorded results describe old values and mechanics. The latest values and interactions require new checks and human playtests; no balance, enjoyment or learning claims are established by recording these decisions.

### Earlier user decisions recorded September 26, 2026

- **D01, answered:** responsibility is the primary experience, followed by strategic play, then survival pressure.
- **D02, identity answered; authority still open:** the player character is an apprentice Charon. The user's intent is to make mistakes and uncertainty natural within the fiction and strengthen the connection to the setting. Whether the apprentice acts as carrier, guide or judge, and who determines destination eligibility, still needs an answer. This is the game's fictional premise, not a claim about historical mythology.
- **D04, answered:** Standing means patience. The existing resource is being given a fictional meaning; its values, costs, rewards and failure rules are unchanged.
- **D03, structure answered:** branching paths with multiple stops and multiple destinations within a journey; events occur at stops. The user explicitly rejects one destination per boat/journey. Passengers can be delivered at different destination stops instead of sharing a single boat-wide destination. Access, eligibility and exact drop-off rules remain open.
- **D05, memory source answered:** gained memories must relate to the souls transported. The user called this D4 in the follow-up; it maps to D05 in this register. Hand/queue/archive structure, effects and acquisition timing remain open.
- **D06, direction selected:** endless runs with shift-based escalation; failure through patience exhaustion, apprenticeship dismissal or boat sinking. Unpaid dues are excluded. See the detailed record below for D05/D11 memory progression and unresolved tuning.

These records supersede the earlier recommendations for these topics. The six-crossing demo and existing paper rules remain the old implemented prototype; branching multi-stop routes and endless runs are recorded design decisions, not implemented changes. Demo wording, PDFs, paper pieces and packaged copies have not yet been synchronized. Failure and progression suggestions made during discussion are proposals until selected.

**Main recommendation:** prioritize a complete, understandable paper prototype. Give larger game decisions temporary answers, test the unchanged baseline, and select at most one substantial mechanical experiment before freezing the submission materials.

### Earlier endless-run decisions: review against latest scope above

This records the user's acceptance of the preceding design proposal. It is a design decision, not an implemented or playtested ruleset.

**Failure conditions, D06**

- Patience exhaustion: difficult encounters and passenger conflicts can drain patience; exhaustion ends the run. Rest stops and meaningful interactions can restore patience.
- Apprenticeship dismissal: repeated unresolved abandonment or broken commitments can cause Charon to revoke the apprenticeship. Provide warnings and opportunities to repair mistakes before dismissal.
- Boat sinking: dangerous routes can damage the boat; repairs compete with other stops. Sinking ends the run.
- Exclude unpaid dues and mandatory payment quotas as failure conditions in the new design. The user's reason is that they feel inconsistent with the intended mythology. This records a creative preference, not a researched historical claim. It does not remove soul fares or obols.
- Make commitments visible before acceptance. Declining a passenger differs from accepting a passenger and breaking a promise; ordinary beginner mistakes should be recoverable.

**Endless escalation, D03/D06**

- Organize the endless run into repeating shifts. A shift contains a branching journey and ends at a safe hub; completing a shift is a checkpoint, not victory.
- Loop: choose passengers, choose a path, resolve events at stops, deliver souls, receive their memories, recover and prepare for the next shift.
- At each shift's end, show who arrived, which promises were kept and which memories they left.
- Early shifts use clearly signposted routes and straightforward requests.
- Developing shifts introduce different requested stops, detours and seat-management tradeoffs.
- Later shifts combine conflicting promises, impatient passengers and distinct route hazards.
- Deep runs bring back unresolved consequences while new obligations compete for attention.
- Increase difficulty through combinations and consequences, introducing one pressure at a time. Include easier stretches and recovery opportunities rather than raising every cost indefinitely.

**Soul-linked memory progression, D05/D11**

- Memories provide new ways to handle difficulties and connect visibly to the transported soul and what the player learned about them during the journey.
- Use a limited active set of memories so growth involves choosing which passengers' memories to carry forward. The capacity and acquisition/equipment rules remain unspecified.
- Between runs, initially unlock new souls, encounters and route possibilities rather than permanent patience increases. Unlock requirements remain unspecified.
- Musician calming an argument, mason enabling passage at a damaged landing, and messenger revealing an upcoming stop remain illustrative effects, not approved card rules.
- Boat upgrades, memory removal and forgetting are not decided by this record.

**Still to specify:** patience drain/restoration and exact exhaustion timing; dismissal thresholds and repair actions; boat damage/repair values; shift length and escalation schedule; memory capacity, effects, costs and acquisition timing; unlock conditions; and whether a failed run ends only a shift or the apprentice's career in the fiction. No numerical balance values are approved here.

## 1. Decisions to settle today

| Decision | What needs answering | Recommendation for Monday | Owner / decision |
| --- | --- | --- | --- |
| Submission requirements | Physical prototype, report, slides, video, digital demo, or a combination? How long is the demonstration? | One member checks the actual brief and exact submission timestamp. | [assign / record] |
| D01: Main player experience | What is the priority among responsibility, strategy and survival? | Responsibility first, strategic play second, survival pressure third. | User decision, September 26, 2026 |
| Showcase scope | Which mechanics are actually included in this submission? | Existing base set: souls, relationships, memories, three routes, resources and wraiths. Optional modules off. | [assign / record] |
| D02: Charon's role | Carrier, guide, or judge? Why can souls travel to different destinations? | Player character: apprentice Charon, making mistakes and uncertainty natural in the fiction. Authority and destination eligibility remain open. | Identity chosen by user, September 26, 2026; authority open |
| D04: Meaning of Standing | How does survival-only light interact with spending light on release? | Boat lantern; fog dims it, grateful souls refill it; start at 2. | Latest choice supersedes patience; zero-light rule open |
| Demonstration format | Full run or shorter example for visitors? | Prepare a short introduction and a complete playable run. Label a shortened demonstration as an excerpt. | [assign / record] |
| Final approval and version | Who decides readiness, and which rules are authoritative? | Assign a coordinator and a rules owner. Use the same version across rules, cards and demonstration materials. | [assign / record] |

Use [workbook section 4](../outputs/The_Ferryman_Design_Workbook.md#4-current-decisions-and-version-authority) for the updated D01-D12 register. The original line references in this historical plan predate that section's revision. Choosing a temporary answer for the showcase does not approve it as the final game design.

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

- Ending and late memories: [successful browser log](../outputs/The_Ferryman_Digital_Demo/verification/browser/all-souls-run.json), `finalState.log[3..5]` and `finalState.queue`; [full report](../outputs/The_Ferryman_Digital_Demo/PLAYTEST_REPORT.md), lines 62-82.
- Faint Memory comparison: [design experiments](../outputs/The_Ferryman_Digital_Demo/verification/demo_design_experiments.json), `probes.faintProbe.sameResultingStateApartFromLog`.
- Route behavior and fixed-order comparisons: the same experiment file, `probes.routeProbe` and `runs`; full report, lines 46-60 and 84-90.

These are agent/browser checks and deterministic experiments. They do not establish human enjoyment, balance or learning difficulty.

## 3. Open decisions that can keep their current temporary settings

| Decision | Question still open | Recommended temporary setting | Team answer |
| --- | --- | --- | --- |
| D03: Routing and access | How do access, eligibility and drop-offs work on the map? | Branching multi-destination journeys with events at stops; one destination per boat/journey explicitly rejected. | Structure selected September 26; detailed rules open |
| D05: Memory structure | What capacity, effects and acquisition rules apply? | Soul-linked; free to play; at most one per crossing; no removal/forgetting. | Cost and limit selected; access structure open |
| D06: Ending and failure | Endless or finite scope? Which failure conditions and quota rules apply? | Earlier endless shifts conflict with latest fixed supply/two-quota framing. | Needs reconciliation |
| D07: Wraith recovery | When and how often can release occur? Can its cost exhaust the lantern? | Voluntary release for 2 light; unreleased wraiths continue pressure. | Core rule selected; timing and zero-light rule open |
| D08: Shore arrivals and anger | What follows supply exhaustion, and how are return-to-shore actions ordered? | Refill to five from 12 fixed-order souls; anger increases only at cycle completion, on return to starting shore. | Anger timing selected; refill relation and endless supply unresolved |
| D09: River information | How do discovery records persist under no-carryover D11? | Hidden conditional events; reveal event and trigger after occurrence. | Direction selected; persistence conflict open |
| D10: Destination wishes | What bonus and award limit apply? | Advisory preference; small bonus for matching, no penalty otherwise. | Direction selected; bonus unspecified |
| D11: Progression and forgetting | How does no carryover coexist with event discoveries? | No upgrades, memory removal, forgetting or between-run unlocks; later ideas deferred. | Latest choice replaces unlock progression; persistence conflict open |
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

This condenses [workbook checkpoint C01](../outputs/The_Ferryman_Design_Workbook.md#c01-readiness-checklist), source lines 776-789. Leave boxes unchecked until there is actual evidence.

### Record a decision

Decision ID: [ ] | Owner: [ ] | Date: [ ] | Temporary or final: [ ]

Chosen answer and reason: [ ]

Observed evidence, log or participant quote: [ ]

Affected cards, rules, demo and guide: [ ]

Who updates each file, by when, and what must be rechecked: [ ]

## Source and freshness note

Original source dates, oldest first: workbook modified September 17, 2026 at 18:41; agent playtest report modified September 18 at 13:58. Both were imported into this repository in the September 25, 21:20:08 +07:00 commit. Importing them does not constitute a newer playtest. Their historical "coming week" wording is superseded by the user's September 28 deadline. The recommendations above preserve the five lists discussed with the user on September 25.
