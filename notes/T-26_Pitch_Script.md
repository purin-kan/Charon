# T-26 pitch script draft (November 4, 2026)

Owner: bosthanapatw. Support: purin-kan. Draft for the team to review. It follows the slide numbers in `notes/T-18_Presentation_Outline.md` and the rules in `outputs/The_Ferryman_Desktop_v0.8.1/rules/RULES.md` at rules version `0.8-t45c` (`main` at `a06c0a4`, after #50). **Still open:** return healing may change in T-35 (November 7), and no route toll with a hero aboard (#45) is not decided. Slide 15 waits for a new seed.

How to read this script:

* Lines under each slide are spoken, at about 130 words per minute. The time per slide is an estimate from the word count.
* `[Action]` lines are stage directions, not spoken.
* Speakers are not assigned yet. Suggested split: one speaker for Part 1, one for Part 2, one driver and one narrator for Part 3.
* The course limit is 15 minutes. This draft is about 9 to 10 minutes of speech before Q&A, plus the time to drive the demo. If time is short, cut slide 9 first.

## Part 1: Description (about 4 minutes)

**Slide 1. Title** (10 s)

Hello. This is The Ferryman, a desktop game built with Phaser 4 and Electron for Windows. Our team is [names and roles, read from the slide].

**Slide 2. The pitch** (30 s)

You play the apprentice of Charon, the ferryman of the dead. Souls wait on the shore, and each one has a wish: one of six destinations in the underworld. Your lantern is your life. Fog on the river costs Light, and when the Light reaches zero, the run ends. There is no final level and no victory screen. The goal is to last as long as you can.

**Slide 3. The story** (30 s)

You are the apprentice of Charon, the old master of the river. Each soul you carry has a name, a story and a wish. But the river is not safe. The Longs are lost souls from another land who believe they belong here. The Light of your lantern keeps them away, and as it dims, they sneak in. Souls that wait too long become Wraiths.

**Slide 4. The core loop** (40 s)

[Action: point at each step of the loop diagram.]

Each cycle has four steps. First, board: choose souls from the shore, up to four seats. Second, cross: at each fork, pick one of two routes. Each route shows its fog cost. Third, deliver: when the boat reaches a soul's wish, that soul gets off. A soul can also leave early at any stop, but that costs one Light. Fourth, return: with an empty boat, go back to the shore and recover two Light. While you are away, the souls on the shore grow angry.

**Slide 5. Resources and pressure** (30 s)

Two numbers drive the game. Light is your life: you start with seven, fog takes it, and the return gives two back. Anger is the souls' patience. A soul left waiting on the shore, or sailing too long, turns into a Wraith, and Wraiths cost Light. The fog also gets thicker as the run goes on, from cycle 9 and again from cycle 15, except at Haven.

**Slide 6. Memories** (25 s)

When a soul reaches its wish, it often leaves a memory card. Thirteen of the fifteen ordinary souls do. You can hold three, and play one at each stop. Memories are your tools. For example, Light restores one Light, and Calm lowers the Anger of every soul on the boat. Some stories end with a special memory, like the Sword or the Golden Apple.

**Slide 7. Longs** (20 s)

Then there are the Longs: lost souls from another land. From cycle 3, one boards each cycle, and later two or three. Each Long breaks one rule. For example, Long Mist adds fog, and Long Hollow steals memories. They get stronger with each encounter.

**Slide 8. Stories** (20 s)

The souls are not only cargo. Pairs of souls share a story, and the order of delivery matters. Penelope the Mother and Theo the Child. The two Soldiers. The Bard and the Listener. For example, the Merchant must be delivered before the Blacksmith, or there is no Sword.

**Slide 9. Heroes** (20 s)

Later in a run, a hero may ask for a ride: Odysseus from cycle 6, Heracles from cycle 9. Heracles must face Cerberus, and both travel to the same destination; the reward is the Golden Apple. Odysseus meets Tiresias and must choose between Charybdis and Scylla.

## Part 2: Algorithmic Implementation (about 3.5 minutes)

**Slide 10. One seeded random generator** (50 s)

Now, how it works. The team decided what is random and why, and AI wrote most of the implementation from our prompts. Every random event in the game draws from one random number generator: a linear congruential generator, in the function `draw`. The generator starts from a seed, and the seed is saved with the game. With the same seed and the same choices, you get the same run. This helps three things: a repeatable demo, bug reports that a teammate can replay, and automated tests. Our test script replays 128 seeded runs and checks that each one plays out the same way twice.

**Slide 11. Procedural content** (35 s)

The river is generated, not designed by hand. At each fork, `deal` draws two different destinations, and the game keeps three forks ahead. The order in which new souls arrive comes from a Fisher-Yates shuffle. Hero wishes are drawn from the six destinations. And Long Grasp can force Haven into a fork the player has not seen yet, but never into one already shown, so a route the player has already seen never changes.

**Slide 12. Random systems that create pressure** (45 s)

Randomness also creates pressure. The type of each Long is a tiered random pick: Long Veil and Long Grasp can only appear from the third encounter. From cycle 6, a hero may be offered, with a 25 percent chance. Cerberus frightens up to two random passengers off the boat. The Restless River can give most Longs extra Anger, and the chance rises over the run. Other targets are random too: the memory Charybdis takes, Scylla's victim, which soul a Long spreads to, which route Long Veil hides, and, from level 3, which memory Long Hollow takes. Below level 3 the player chooses.

**Slide 13. Deterministic rules** (30 s)

Not everything is random. The fog cost is a fixed calculation: the route's base fog, plus the cycle increase, plus Long fog and overload, minus any shields. The player sees this cost before confirming a route, unless Long Veil hides it. All rules live in one engine and one data file, and every scene reads from them, so the rules are never written twice.

**Slide 14. Luck and skill** (45 s)

Some of the game is luck, and some is skill. Chance decides the routes, the arrivals and which Longs appear. The player decides who boards, which fork to take and when to play a memory. With one seeded generator, the same seed and the same choices replay the same run, so a good or bad result can be studied again. In a bot test of 5,000 seeded runs per player type, the median run ended at cycle 8 for a good strategy and cycle 2 for random play. These are bots, not people, but they show that decisions matter.

## Part 3: Demo play (about 2 minutes)

**Slide 15. Demo** (about 2 min: 75 s of speech plus play time, not measured)

[Action: Jaoguya opens the built `.exe` and starts a new game with the demo seed, typed on the title screen. After the first boarding and crossing, show the clips: a Long boarding, a delivery and a quest. If the live part fails, play the recorded video (T-41).]

Let's play. This is a fixed seed, so if we make the same choices, the run matches our rehearsal.

[**Out of date, do not rehearse.** The path below is old seed 116, from before #50. It stays here only as a pattern until the new seed replaces it: see "Demo seed" below.]

1. Boarding (Light 6). Board Mother, Child, Merchant and Cook. Leave the Odysseus offer. "Here is the shore. Four seats, four souls. Mother and Child board together, so their story starts."
2. Fork 1: Acheron (fog 1) or Haven (fog 0). Take Haven and deliver Child. "Haven costs no fog, and the Child's wish is Haven. The Child must arrive before the Mother."
3. Fork 2: River Styx (fog 1) or Asphodel (fog 2). Take River Styx and deliver Merchant (Light 5). "River Styx costs less fog than Asphodel, so the Merchant goes first and the Cook waits. The Merchant leaves a memory: Foresight."
4. Fork 3: Long Mist boards. Acheron (fog 1) or Haven (fog 0). Take Haven and deliver no one. "A Long boards: Long Mist. Its wish is Tartarus. Nobody aboard wishes for these two routes, so take the free one."
5. Fork 4: Elysium (fog 3) or Tartarus (fog 3). Take Tartarus (Light 2), then deliver Mother and Long Mist (Light 3). "The Mother's story is complete, and it gives the Passenger memory. Long Mist pays one Light for its fare."
6. Memory: before fork 5, play the Light memory (Light 4). "The next route costs fog, so we use the Light memory the Mother left."
7. Fork 5: Asphodel (fog 2) or Elysium (fog 3). Take Asphodel (Light 2) and deliver Cook. "Asphodel is the Cook's wish. The Cook leaves a memory: Calm."
8. Return (Light 3, cycle 2). "The boat is empty, so we go back and recover one Light. The next cycle begins."

**Slide 16. Credits** (20 s)

[Action: show the credits slide. Read both CC-BY credits aloud.]

The menu music is "RPG - Underworld Theme - Loop" by Joseph Collard, and the footstep sounds are from "Pirate Pack Vol 1" by JC Sounds, both under CC-BY 4.0. Full credits are in the project's credits file.

**Slide 17. Questions**

Thank you. We are happy to take questions.

## Likely questions (prepared answers)

* **Is there AI in the game?** No computer-controlled opponent. The pressure comes from seeded random systems and fixed rules (slides 10 to 13). AI tools were used to write code from the team's prompts.
* **Can a run be won?** No. The run is endless; the goal is to keep the lantern lit as long as possible.
* **Why a seed?** Repeatable runs for the demo, for bug reports and for automated tests.
* **What are the Longs based on?** To confirm with the team from the entity catalog before answering (outline slide 7 note).

## Demo seed

Not chosen yet (T-41).

* Seed 116 no longer fits. The Light, tolls and Long timing all changed after it was picked, so the path on slide 15 is out of date.
* Pick a new seed after #46 and #47 merge, then replay it through the engine and in the game window.
* A Long cannot board before cycle 3, so the first live crossing will not show one. The clips cover it.

## Not done for T-26

* **Early gameplay footage** (in the T-26 done-when line) is not captured. purin-kan agreed on #22 that it can be added after #34 (CrossingScene) merges, so T-26 stays In progress until then.
* Speakers and timing per person are not assigned.
* The demo steps on slide 15 are out of date; the final seed waits for #46 and #47 (T-41).
* VarisPah chose the name Heracles (#21), so this script uses it. The game still shows "Hercules the traveler" (`content.json`) until that rename lands.
* The script was not read aloud or timed; the times above are word-count estimates.
