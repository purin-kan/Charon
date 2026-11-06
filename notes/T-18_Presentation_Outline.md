# T-18 presentation outline (November 2, 2026)

Owner: bosthanapatw. Support on the script and slides later: purin-kan (T-26, T-38). Draft for the team: the structure follows the three required parts in `notes/Project_Plan_Oct30_Nov8.md` ("Submission Deliverables"). The Description is drafted from the generated `outputs/The_Ferryman_Desktop_v0.8.1/rules/RULES.md` as it stands. Revised November 4 after the owner review on PR 22, and November 6 against rules `0.8-t45c` on `main` at `a06c0a4` (after #50). **Still open:** return healing may change in T-35 (November 7), and no route toll with a hero aboard (#45) is not decided.

Slide text rules (AGENTS.md): short bullets, no "we" on slides, no em dashes, every number traceable to a recorded result.

The course limit is 15 minutes. Revised November 4 after purin-kan's suggestions on issue 32: more story, fewer rule details, and luck and skill in place of how it was built.

## Part 1: Description

**Slide 1. Title**
* The Ferryman
* Team members by role (bosthanapatw, Kanyakorn-goya, Tinpatpun, Jaoguya, SupaOhm, VarisPah, purin-kan)
* Built with Phaser 4 and Electron, for Windows

**Slide 2. The pitch**
* The player is Charon's apprentice, ferrying souls across the river of the dead
* Each soul has a wish: one of six destinations
* Keep the lantern lit. Zero Light ends the run
* Endless: no victory or cycle cap, the goal is to last

**Slide 3. The story**
* The apprentice learns the river under Charon, the old master
* Each soul has a name, a story and a wish
* Longs: lost souls from another land who believe they belong here
* The Light keeps them away; as it dims, they sneak in
* Souls that wait too long become Wraiths

**Slide 4. The core loop** (diagram)
* Board souls from the shore, within the boat's seats
* Cross: pick one of two routes at each fork
* Pay fog in Light for each crossing
* Deliver souls whose wish matches the destination; a soul can leave early at any stop for 1 Light, and gives no memory
* Return with an empty boat; waiting souls grow angry

**Slide 5. Resources and pressure**
* Light: the run's life. Start with 7. Fog costs Light, the return heals 2
* Anger: souls left waiting or sailing too long turn into Wraiths, which cost Light
* Fog rises with the cycle number (by 1 from cycle 9, by 2 from cycle 15), except at Haven
* Six destinations, fog 0 to 2: Haven, River Styx, Acheron, Asphodel, Elysium, Tartarus

**Slide 6. Memories**
* 13 of the 15 ordinary souls leave a memory card when delivered to their wish (Child and Listener have none); hand limit 3, one memory per stop
* Two examples: Light (+1 Light), Calm (Anger -1 for every soul on the boat). Full list in the speaker notes
* Quest rewards are special memories, for example Passenger, Sword, Boat Space, Soldiers' Peace, Golden Apple

**Slide 7. Longs (tainted souls)**
* Lost souls from another land. From cycle 3, one boards each cycle; two from cycle 9, three from cycle 18
* Each Long breaks one rule, for example Long Mist (extra fog) and Long Hollow (stolen memories). Full list in the speaker notes
* Encounters grow stronger over the run; a top-level Long that turns into a Wraith can corrupt another soul
* Folklore inspirations for each variant: see the entity catalog (to confirm wording with the team)

**Slide 8. Stories (quests)**
* Pairs of souls with linked stories: Mother and Child, the two Soldiers, Bard and Listener, Farmer and Cook, Merchant with Blacksmith or Mason
* Order matters: for example, the Sword is earned only if the Merchant is delivered before the Blacksmith
* Personal names: Penelope the Mother, Theo the Child, Homer the Bard and the rest of the 15

**Slide 9. Heroes**
* Offered at boarding, 25% chance: Odysseus from cycle 6, Heracles from cycle 9
* Heracles: pays Hades' toll, fights Cerberus, and both travel to the same destination. Reward: Golden Apple
* Odysseus: meets Tiresias and picks Charybdis or Scylla. Reward: Moly of Hermes or Nobody

## Part 2: Algorithmic Implementation

Source of the list: the plan's "Algorithmic Implementation" item, checked against `rules/engine.js` on `main` (function names are given instead of line numbers, since lines move with rule edits). The plan says the group makes the design decisions and the AI writes the implementation, and the presentation says so. AI logic is not claimed: the game has no computer-controlled opponent.

**Slide 10. One seeded random generator**
* The team decided what is random and why; AI wrote most of the implementation (required by the plan)
* Every random event draws from one seeded generator (`draw`, a linear congruential generator)
* The seed is saved with the game, so the same seed and the same choices replay the same run
* Uses: reproducible demo, bug reports, automated tests
* Evidence: `quest-check.js` replays 128 seeded runs deterministically (`rules/verification/quest-results.json`)

**Slide 11. Procedural content: routes and arrivals**
* Route forks: two different destinations drawn per fork, three forks ahead (`deal`)
* Arrival order of souls: Fisher-Yates shuffle (`shuffle`)
* Hero wishes drawn from the six destinations (`randomWish`)
* Long Grasp forces Haven into an unseen fork, never a fork already shown

**Slide 12. Random systems that create pressure**
* Each Long gets a random fork among the first three of the trip, with a tiered random pick: Long Veil and Long Grasp can first appear at the third encounter (`drawPolong`)
* Random hero offer, 25% chance, from cycle 6 (Odysseus) and cycle 9 (Heracles) (`offerHero`)
* Cerberus frightens up to two random ordinary passengers off the boat (`heroicArrival`)
* Restless River: from round 4, most Longs can gain extra Anger, and the chance rises over the run
* Random targets: Charybdis's stolen memory, Scylla's victim, Long spread, the route Long Veil hides, and Long Hollow's memory theft from level 3 (below that the player chooses; `thefts`)

**Slide 13. Deterministic rules**
* Fog cost is a fixed calculation, not random: base fog + cycle escalation + Long fog + overload, minus shields (`fog`)
* The player sees the cost before confirming a route, unless Long Veil hides that route
* One rules engine (`engine.js`) drives every scene; scenes never duplicate rules

**Slide 14. Luck and skill**
* Chance: routes, arrivals, Long picks, Restless River
* Player: who boards, which fork, when to play a memory
* One seeded generator: the same seed and choices replay the same run
* Bot test, 5,000 seeded runs per player type (purin-kan's study on #50, not a playtest): median run ends at cycle 8 for a good strategy, cycle 2 for random play

## Part 3: Demo play

**Slide 15. Demo**
* Plan from #32: Jaoguya plays the first boarding and crossing live from the built `.exe` with a fixed seed (TitleScene seed line)
* Short clips then show what takes too long to reach live: a Long boarding (cycle 3 or later), a delivery and a quest
* Recorded video as a backup if the live part fails (T-41, from the build that passed T-44)
* The seed is chosen after #46 and #47 merge

**Slide 16. Credits**
* From `outputs/The_Ferryman_Desktop_v0.8.1/CREDITS.md`
* Must include both CC-BY credits: the menu music (Joseph Collard) and the footstep sounds (JC Sounds)

**Slide 17. Questions**

## To do before the slides (T-26, T-38)

1. Give each part a time within the 15-minute limit.
2. Rules on slides 2 to 9 and 12 were rechecked against `RULES.md` on November 6. Check again after T-35 (slides 4 and 5 if return healing changes, slide 14 if balance values change) and if #45 adds no route toll with a hero (slide 9).
3. Pick the demo seed and record what it shows (T-41).
4. Confirm with the PM whether the Long spawn should be called "random" or "AI" (the plan says random; confirm after the freeze).
5. Screenshots for slides 4 to 9 once the scenes have art.
