# Charon: categorized team ideas

Organized from [collectiveThoughts.md](../collectiveThoughts.md) on September 26, 2026. This is a discussion inventory, not an approved design or implementation plan. Overlapping ideas are grouped; alternatives, examples, questions and implementation suggestions are retained.

## Source note

Source: [collectiveThoughts.md](../collectiveThoughts.md), modified September 26, 2026 at 21:56:30 local time. It is untracked and has no Git commit date. The latest commit affecting the demo verification directory is September 25, 2026 at 21:20:08 +07:00. Modification time is not a playtest date. **POSSIBLY STALE:** rule descriptions, workbook references and experiment claims have not been checked against current code or result files.

Ideas are grouped by topic without member attribution. Line references point to the original notes. Repeated suggestions are combined and distinct alternatives remain visible.

## 1. Run structure, pacing and endings

**Concerns:** crossings feel repetitive and predictable; souls may run out before the ending; the reason to keep playing and the definition of victory need clarification. [lines 7–13; lines 79–84; lines 100, 103; lines 119–130; lines 277]

| Direction | Ideas retained | Source |
|---|---|---|
| Endless or roguelike play | Remove the fixed crossing limit; survive for as many trips as possible. A run could represent one night of work, continuing until defeat. | lines 9–13; lines 183–185 |
| Level-based play | Use levels instead of endless nights. Winning and completion criteria remain open. | lines 11–13; lines 213 |
| More passengers | Expand the soul supply, with 12 to 16 offered as an example, to sustain choices through the ending. | lines 46; lines 100 |
| Shorter or changing rounds | Test four rounds instead of six, or change later rounds through harder shore refill, new soul types or escalating events. | lines 277 |
| Clear Shore ending | End when both shore and supply are empty; charge the final quota immediately. | lines 123 |
| More demanding victory | Add a minimum number of delivered souls or a maximum number of created wraiths. | lines 103 |
| Narrative ending | Record who travelled together, who became a wraith and which memories remain, rather than reducing the ending to a score. | lines 124 |

**Retained implementation notes:** Clear Shore would require a Shore-phase check and final-quota handling in `engine.js`, an ending record in `app.js`, workbook sections 6–7 updates, and tests for early completion, an unpaid final quota and a normal six-crossing run. The contributor explicitly requests a playtest because full rescue could become a faster win. [lines 125–130]

**Retained testing idea:** observe attention and decision pace, especially in rounds 4–6. The source interprets sharply falling decision time as fatigue; this is a hypothesis to test, not an established distinction from mastery. [lines 277]

**Open decision:** choose among endless survival, levels, a shorter fixed run or early completion. Increasing the soul supply and ending early are distinct responses to empty late rounds.

## 2. Crossing gameplay, events and randomness

**Shared direction:** make travel itself more substantial and introduce situations that change decisions. [lines 15–21; lines 79–84; lines 176–179; lines 276]

- Add encounters during travel, inspired by Slay the Spire question-mark encounters. Events could also occur after a crossing and award rewards or debuffs. [lines 18; lines 82–84]
- Introduce randomness through soul cards, encounters, river events or the map. The location and timing of randomness remain open. [lines 19–21; lines 187–189]
- Enable events from the beginning or use a rotating situation-of-the-round card. The source points to E01–E04, section 11 and D09 as implementation references, which need checking. [lines 276]
- Let the player steer through fog, wraith hands, storms and requests for a ride. Passengers react and can be moved during travel. Keep steering simple so passenger selection and seating remain central. [lines 176–179]

### Shuffled shore proposal

The source marks this idea with five stars. That expresses emphasis in one contribution, not team-wide priority. [lines 132–147]

- Shuffle future arrivals so the whole run cannot be planned from a known fixed sequence.
- Resolve randomness before the player chooses. Arrived souls remain fully visible and the crossing preview stays exact.
- Paper proposal: shuffle the 12 soul cards face down and refill the shore to five at each Shore phase.
- Digital proposal: shuffle the supply at setup using a reproducible seed; display the seed in the journal and exported log.
- Verification proposal: use fixed seeds in tests and run experiments across multiple seeds to investigate whether runs are winnable.
- Documentation proposal: update workbook setup in section 6 and refill in section 7; label section 8 worked examples as fixed-order examples.
- Stated risks: low-fare opening draws might make the three-obol quota at crossing 3 impossible; a fixed-order winning record would not establish that shuffled runs are winnable.
- Open question: should Mother/Child and Musician/Listener arrive together, or be shuffled independently?

**Open decisions:** real-time or turn-based crossings; the source tentatively suggests turn-based may be easier to build. Also resolve whether uncertain events can occur after departure, since that differs from the source's exact-preview proposal. [lines 212; lines 136]

## 3. Boat interaction, seating and presentation

- Replace card selection with a visible boat and soul characters that the player drags aboard, to strengthen the feeling of being Charon. [lines 161–164]
- Give seat position mechanical meaning: Mother and Child sit together; adjacent soldiers fight; heavy souls concentrated on one side tilt the boat. [lines 168–170]
- Show fear, anger and imminent escape through character mood, with numerical details on hover. [lines 172–174]
- Reduce numerical clutter on soul cards and the right-hand sidebar; decide which information must remain visible and how to make it readable. [lines 59–63]
- Decide between a top-down and side view. [lines 214]

**Explicit preservation requests:** retain seat limits, two-seat large souls, linked souls and separation penalties, left-behind souls becoming wraiths, and the preview before departure. These are proposals, not a recorded team agreement. [lines 203–208]

## 4. Soul individuality, relationships and quests

**Concerns:** souls feel too similar, some lack distinctive roles beyond their memory reward, and some read as generic passengers. [lines 85–89; lines 278]

- Add more souls, random names and soul classifications. Include recognizable figures, famous people or the player as souls or encounters. Classification criteria remain open. [lines 44–49]
- Give every soul a small distinguishing trait: a bonus, restriction or interaction. the source specifically names Cook, Mason and Messenger as candidates and contrasts them with Poet, Keeper and the linked/conflicting pairs. [lines 278]
- Give souls quests tied to player actions. Example: carrying Red Soldier alone leads to a request to transport his mother later, with a buff for completion. [lines 88–89]
- Make hostile relationships worth considering rather than only avoiding. Reward transporting both soldiers despite conflict, potentially resolving their feud and granting a strong memory. Alternatively, make their conflict affect the shore by adding refusals to each other while both wait. [lines 248–254]
- Reconsider the timing of Accord: the source argues that earning it after delivering a soldier may leave little opportunity to use its conflict cancellation. [lines 251]

**Open questions:** how should souls be classified, and should a hostile relationship offer a worthwhile risk? Spatial adjacency in the source and shared-boat conflict in the source are different designs that need reconciliation.

## 5. Destinations, wishes, route access and maps

**Concern:** destinations need differences beyond money and pressure. [lines 39–49; lines 104; lines 151]

- Give each destination a unique gameplay effect. [lines 104]
- Require particular destinations for some souls; decide which souls have such requirements. [lines 43, 49]
- Alternatively, keep wishes advisory: grant +1 Standing for fulfilling a wish, at most once per boat; an unfulfilled wish changes only the story. [lines 152]
- Retain one destination per boat and all three routes for the showcase. Later, consider Persephone's calendar, with routes opening and closing on known crossings. [lines 111–117]
- Add a branching map, inspired by Slay the Spire, where the next stop is selected after dropping souls off. Randomize the map between runs. [lines 187–193]

**Retained implementation notes:** The source points to M02 in workbook section 19 and a schedule check in engine route validation for the calendar. For wishes, it points to the soft M01 variant, a soul wish field, an arrival check and a card icon. These references are proposals to verify before implementation. [lines 117, 153]

**Open decision:** mandatory destinations versus advisory wishes; calendar-based access versus a branching map. These suggestions should not silently become one combined system.

## 6. Economy, Standing, difficulty and failure

### Fares and bargaining

- Build on the distinction between souls with and without an obol.
- Let souls negotiate passage. A soul without money might offer something else in exchange for a particular destination.
- Decide what non-monetary offers are possible. [lines 31–37]

### Standing and wraith consequences

- Reduce starting Standing and the number of souls that award it, responding to the source's concern that pressure is insufficiently dangerous. [lines 101]
- Increase wraith pressure or add another negative effect. [lines 102]
- Add stronger victory requirements, as listed in section 1. [lines 103]

### Escape and additional loss conditions

- Waiting souls can escape; some may want to remain in the living world.
- Too many escapes anger Hades and cost Charon his job. Define the threshold and how it fits the run structure. [lines 23–29]
- Boat sinking, exhausted Standing and being fired for escapes are proposed loss conditions. [lines 195–197]

### Resource simplification

- The source proposes simplifying or merging Residue and Refusal, describing Obol, Standing, Residue and Refusal as four counters layered onto an eight-step round. This is the contributor's description, not a verified inventory of active rules. [lines 275]

**Tensions to resolve:** The source proposes less Standing, while The source proposes additional Standing from wishes. Escape must also be reconciled with the source's request to keep waiting souls becoming wraiths. Neither combination is specified in the notes.

## 7. Memories: availability, value and cost

**Concerns:** memories arrive too late, go unused or have weak effects; paying Standing may encourage hoarding because that resource also protects survival. [lines 105; lines 221–240]

| Area | Proposed alternatives | Source |
|---|---|---|
| Availability | Make memories available earlier; send newly earned memories directly to the hand. | lines 105; lines 226 |
| Frequency | Allow multiple plays per crossing, or make memories rarer and stronger instead of giving one for every delivered soul. | lines 226–227 |
| Value | Give each memory a clear net benefit; lower weak-card costs; let weak cards create a story moment instead of a numerical effect. | lines 228–234 |
| Cost | Pay an obol, sacrifice a boat seat, use a limited number of activations per run, or make memories free with one play per crossing. | lines 235–240 |

**Specific card concerns retained:** the source describes Faint Memory as costing one Standing for one protection, with no net gain and a loss at zero pressure; Recollection as costing one Standing to prevent one refusal without protection; and Vigil as providing nothing without a two-seat soul aboard. These are member interpretations to verify, not conclusions that these cards are always useless. [lines 229–233]

**Open questions:** should every delivered soul leave a memory? Should every memory be useful? What should use cost? Should playing a memory feel like sacrifice or reward?

## 8. Future warnings and informed choices

**Concern:** an immediate crossing preview may not reveal choices that lead to an unavoidable later failure. [lines 241–247]

- Show obols still needed for the next quota.
- Show the next crossing's wraith pressure in advance.
- Add a danger-ahead warning when the next quota appears unreachable.
- Decide whether discovering future failure is intended challenge or whether players should receive a warning. [lines 246–247]

Keep this distinction visible when discussing randomness: uncertainty about who arrives next differs from uncertainty about what the current departure will do. [lines 135–147]

## 9. Paper bookkeeping, learning and showcase usability

**Concerns:** rule-by-rule explanation is difficult to absorb; visitors need to play to understand; manual tracking may consume showcase time or introduce mistakes. [lines 90–92; lines 255–270]

- Simplify memory ordering for paper, for example by putting new memories at the bottom of the pile.
- Add a turn-order checklist card.
- Use a shared tracker board for refusals, wraiths and quotas.
- Script crossing 1 as a guided tutorial.
- Introduce rules in stages, for example memories beginning on crossing 2.
- Provide a one-page quick reference. [lines 265–270]

**Bookkeeping identified for review:** individual refusal counts, soul-ID memory ordering, played-card-first and left-to-right discard ordering, oldest-discard-first recycling, wraith-pressure timing and extra separation refusals. [lines 256–262]

**Teaching load identified for review:** seats, the pressure formula, protection, tolls before fares, refusals, pair separation, wraith timing and quotas. [lines 268]

**Open question:** which rules can be removed or simplified while preserving the intended experience? Resource and display simplification also appear in sections 3 and 6.

## 10. Charon, mythology and narrative world

- Clarify Charon's purpose: routine work, a personal agenda or a secret plan gradually revealed through choices and encounters.
- Define his personality and whether he speaks.
- Explore underworld factions, politics and power struggles involving the player. [lines 51–57]
- Use more Greek myth material, including Cerberus, Hades, the Styx, gods and monsters. [lines 93–95]

**Myth references supplied by the source, retained as research prompts rather than independently verified facts:** Charon ferries the dead; Acheron or Styx appears in different tellings; the obol relates to fares and burial; lack of burial or payment can prevent crossing in some accounts; living visitors are exceptional; Charon transports souls while Hades rules; the river represents the boundary between life and death. [lines 65–73]

## 11. Progression between runs

- Upgrade the boat between runs, with additional seats, a stronger boat and a better lantern as examples. [lines 199–201]
- Route progression through Persephone's calendar is a separate suggestion, described in section 5. [lines 113–117]

Neither contribution specifies upgrade prices, unlock conditions or persistent resources.

## 12. Reported evidence requiring verification

These claims are preserved so their motivation is not lost. They are not validated results of this organization task.

| Reported claim | Source | Verification needed |
|---|---|---|
| A winning run delivered 12 souls by crossing 4, leaving crossings 5–6 empty. | lines 121 | Inspect the cited `all-souls-run.json`, `finalState.log[3..5]`, and its date/version. |
| Up to 12 memories can be earned, but only five can be played because crossing 1 starts without a hand. | lines 222–223 | Check current reward rules, linked-pair exceptions, hand timing and play limits. |
| Simulated wins averaged about 11 memories earned, three played and two never drawn. | lines 224 | Locate the underlying experiment and verify denominators, definitions and version. |
| Across 2,000 simulated runs avoiding red warnings, every loss was a dead end and most occurred on crossing 6. | lines 243–244 | Locate the results, policy and definition of a dead end; this is not human-playtest evidence. |
| Standing is easy to accumulate, wraiths are weak and winning feels nearly automatic. | lines 101–103 | Treat as member assessment until supporting playtest records are identified. |
| Four counters and an eight-step round create excessive tracking. | lines 275–277 | Confirm which systems are active in the intended prototype version. |

## Discussion choices still unresolved

The following summarizes competing proposals without ranking them or selecting a direction:

| Topic | Alternatives to discuss |
|---|---|
| Run format | Endless nights; levels; shorter fixed runs; Clear Shore completion |
| Late-game pace | More souls; fewer rounds; early ending; different later-round mechanics |
| Randomness | Shuffled arrivals before decisions; river events after departure; randomized maps |
| Crossing control | Real-time steering; turn-based interaction; event-driven crossings |
| Soul routing | Mandatory destinations; advisory wishes; unique destination effects |
| Route progression | Keep routes open; scheduled access; branching map |
| Memory identity | Frequent rewards; rarer stronger memories; sacrifice versus free limited use |
| Difficulty | Less Standing; stronger wraiths; extra victory conditions; clearer future warnings |
| Waiting consequences | Wraith transformation; escape; an explicitly defined combination |
| Showcase scope | Simplified paper tracking and teaching; substantial character-and-boat redesign |
| Presentation | Top-down or side view; expressive characters with accessible numerical detail |

No member assignments, vote counts, final engine choice, approved art direction or rule changes are inferred from these notes.
