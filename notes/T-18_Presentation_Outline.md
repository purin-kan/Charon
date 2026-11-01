# T-18 presentation outline (November 2, 2026)

Owner: bosthanapatw. Support on the script and slides later: purin-kan (T-26, T-38). Draft for the team: the structure follows the three required parts in `notes/Project_Plan_Oct30_Nov8.md` ("Submission Deliverables"). The Description is drafted from the generated `outputs/The_Ferryman_Desktop_v0.8.1/rules/RULES.md` as it stands, plus the issue 6 decisions that T-45 applies. **Everything here is provisional until the November 6 freeze.**

Slide text rules (AGENTS.md): short bullets, no "we" on slides, no em dashes, every number traceable to a recorded result.

Total time and the time per part are not given in the plan. Fill them in once the course limit is known.

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

**Slide 3. The core loop** (diagram)
* Board souls from the shore, within the boat's seats
* Cross: pick one of two routes at each fork
* Pay fog in Light for each crossing
* Deliver souls whose wish matches the destination
* Return with an empty boat; waiting souls grow angry

**Slide 4. Resources and pressure**
* Light: the run's life. Fog costs Light, the return heals 1
* Anger: souls left waiting or sailing too long turn into Wraiths, which cost Light
* Fog rises with the cycle number (by 1 from cycle 6, by 2 from cycle 12), except at Haven
* Six destinations, fog 0 to 3: Haven, River Styx, Acheron, Asphodel, Elysium, Tartarus

**Slide 5. Memories**
* Most delivered souls leave a memory card (Child and Listener have none); hand limit 3
* Examples: Light (+1 Light), Foresight (see the next 3 forks), Calm (Anger -1), Fog Shield (fog -1)
* Quest rewards are special memories: Passenger, Sword, Boat Space, Golden Apple

**Slide 6. Polongs (tainted souls)**
* Lost souls from another land that sneak aboard as Light dims
* Five variants, each breaking one rule: extra fog, hidden routes, stolen memories, extra seats, refusing to leave
* Encounters grow stronger over the run; a top-level Polong that turns into a Wraith can corrupt another soul
* Folklore inspirations for each variant: see the entity catalog (to confirm wording with the team)

**Slide 7. Stories (quests)**
* Pairs of souls with linked stories: Mother and Child, the two Soldiers, Bard and Listener, Farmer and Cook, Merchant with Blacksmith or Mason
* Order matters: for example, the Sword is earned only if the Merchant is delivered before the Blacksmith
* Personal names: Penelope the Mother, Theo the Child, Homer the Bard and the rest of the 15

**Slide 8. Heroes**
* Heracles: pays Hades' toll, fights Cerberus, and both travel to the same destination. Reward: Golden Apple
* Odysseus: meets Tiresias and picks Charybdis or Scylla. Reward: Moly of Hermes or Nobody

## Part 2: Algorithmic Implementation

Source of the list: the plan's "Algorithmic Implementation" item, checked against `rules/engine.js` on `main` (function names are given instead of line numbers, since lines move with rule edits). The plan says the group makes the design decisions and the AI writes the implementation, and the presentation says so. AI logic is not claimed: the game has no computer-controlled opponent.

**Slide 9. One seeded random generator**
* Every random event draws from one seeded generator (`draw`, a linear congruential generator)
* The seed is saved with the game, so a seed replays the same run
* Uses: reproducible demo, bug reports, automated tests
* Evidence: `quest-check.js` replays 128 seeded runs deterministically (`rules/verification/quest-results.json`)

**Slide 10. Procedural content: routes and arrivals**
* Route forks: two different destinations drawn per fork, three forks ahead (`deal`)
* Arrival order of souls: Fisher-Yates shuffle (`shuffle`)
* Hero wishes drawn from the six destinations (`randomWish`)
* Po Due forces Haven into an unseen fork, never a fork already shown

**Slide 11. Random systems that create pressure**
* Polong spawn on a fixed round interval, with a tiered random pick: a second tier of types from the second encounter on (`drawPolong`)
* Random hero offer each return (`offerHero`)
* Cerberus frightens two random passengers off the boat (`heroicArrival`)
* Random targets: Po Luem's memory theft, Scylla's victim, Polong spread

**Slide 12. Deterministic rules**
* Fog cost is a fixed calculation, not random: base fog + cycle escalation + Polong fog + overload, minus shields (`fog`)
* The player sees the cost before confirming a route, unless Po Mued hides that route
* One rules engine (`engine.js`) drives every scene; scenes never duplicate rules

**Slide 13. How it was built** (optional)
* Phaser scenes for each phase, routed from the engine's state
* Developer tuning panel for timing and river paths (Phaser has no visual editor)
* AI wrote most code from team prompts; the team made the design decisions

## Part 3: Demo play

**Slide 14. Demo**
* Live demo of the built `.exe` with a fixed seed (TitleScene seed line)
* Recorded video as a backup (T-41, from the build that passed T-44)
* Suggested path for the seed, to be chosen after the freeze: board, a fork choice, a delivery that gives a memory, a Polong boarding, a return

**Slide 15. Credits**
* From `outputs/The_Ferryman_Desktop_v0.8.1/CREDITS.md`
* Must include the CC-BY music credit

**Slide 16. Questions**

## To do before the slides (T-26, T-38)

1. Course time limit for the presentation, so each part gets a time.
2. Recheck every rule on slides 2 to 8 against `RULES.md` after the November 6 freeze; T-45 (issue 6 decisions) is not merged yet.
3. Pick the demo seed and record what it shows (T-41).
4. Confirm with the PM whether the Polong spawn should be called "random" or "AI" (the plan says random; confirm after the freeze).
5. Screenshots for slides 3 to 8 once the scenes have art.
