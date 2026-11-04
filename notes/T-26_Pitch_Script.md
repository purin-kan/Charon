# T-26 pitch script draft (November 4, 2026)

Owner: bosthanapatw. Support: purin-kan. Draft for the team to review. It follows the slide numbers in `notes/T-18_Presentation_Outline.md` and the rules in `outputs/The_Ferryman_Desktop_v0.8.1/rules/RULES.md` at rules version `0.8-t45`. **Every rule line is provisional until the November 6 freeze**, #26 (boat Wraith at Anger 5) is merged, and slides 6 and 15 change when #27 (memory rules) merges. Slides 7 and 12 change if #28 drops Long levels or spread, or if Long arrivals become per cycle.

How to read this script:

* Lines under each slide are spoken, at about 130 words per minute. The time per slide is an estimate from the word count.
* `[Action]` lines are stage directions, not spoken.
* Speakers are not assigned yet. Suggested split: one speaker for Part 1, one for Part 2, one driver and one narrator for Part 3.
* The course limit is 15 minutes. This draft is about 8 to 9 minutes of speech before Q&A, plus the time to drive the demo. If time is short, cut slide 9 first.

## Part 1: Description (about 3.5 minutes)

**Slide 1. Title** (10 s)

Hello. This is The Ferryman, a desktop game built with Phaser 4 and Electron for Windows. Our team is [names and roles, read from the slide].

**Slide 2. The pitch** (30 s)

You play the apprentice of Charon, the ferryman of the dead. Souls wait on the shore, and each one has a wish: one of six destinations in the underworld. Your lantern is your life. Fog on the river costs Light, and when the Light reaches zero, the run ends. There is no final level and no victory screen. The goal is to last as long as you can.

**Slide 3. The story** (30 s)

You are the apprentice of Charon, the old master of the river. Each soul you carry has a name, a story and a wish. But the river is not safe. The Longs are lost souls from another land who believe they belong here. The Light of your lantern keeps them away, and as it dims, they sneak in. Souls that wait too long become Wraiths.

**Slide 4. The core loop** (35 s)

[Action: point at each step of the loop diagram.]

Each cycle has four steps. First, board: choose souls from the shore, up to four seats. Second, cross: at each fork, pick one of two routes. Each route shows its fog cost. Third, deliver: when the boat reaches a soul's wish, that soul gets off. Fourth, return: with an empty boat, go back to the shore and recover one Light. While you are away, the souls on the shore grow angry.

**Slide 5. Resources and pressure** (30 s)

Two numbers drive the game. Light is your life: you start with six, fog takes it, and the return gives one back. Anger is the souls' patience. A soul left waiting on the shore, or sailing too long, turns into a Wraith, and Wraiths cost Light. The fog also gets thicker as the run goes on, from cycle 6 and again from cycle 12, except at Haven.

**Slide 6. Memories** (30 s)

When a soul is delivered, it often leaves a memory card. Twelve of the fifteen ordinary souls do. You can hold three. Memories are your tools. For example, Light restores one Light, and Calm lowers the Anger of every soul on the boat. Some stories end with a special memory, like the Sword or the Golden Apple.

**Slide 7. Longs** (25 s)

Then there are the Longs: lost souls from another land. One boards on every third outward round, and each Long breaks one rule. For example, Long Mist adds fog, and Long Hollow steals memories. They get stronger with each encounter.

**Slide 8. Stories** (20 s)

The souls are not only cargo. Pairs of souls share a story, and the order of delivery matters. Penelope the Mother and Theo the Child. The two Soldiers. The Bard and the Listener. For example, the Merchant must be delivered before the Blacksmith, or there is no Sword.

**Slide 9. Heroes** (15 s)

Sometimes a hero asks for a ride. Heracles must face Cerberus, and both travel to the same destination; the reward is the Golden Apple. Odysseus meets Tiresias and must choose between Charybdis and Scylla.

## Part 2: Algorithmic Implementation (about 3 minutes)

**Slide 10. One seeded random generator** (50 s)

Now, how it works. The team decided what is random and why, and AI wrote most of the implementation from our prompts. Every random event in the game draws from one random number generator: a linear congruential generator, in the function `draw`. The generator starts from a seed, and the seed is saved with the game. With the same seed and the same choices, you get the same run. This helps three things: a repeatable demo, bug reports that a teammate can replay, and automated tests. Our test script replays 128 seeded runs and checks that each one plays out the same way twice.

**Slide 11. Procedural content** (35 s)

The river is generated, not designed by hand. At each fork, `deal` draws two different destinations, and the game keeps three forks ahead. The order in which new souls arrive comes from a Fisher-Yates shuffle. Hero wishes are drawn from the six destinations. And Long Grasp can force Haven into a fork the player has not seen yet, but never into one already shown, so a route the player has already seen never changes.

**Slide 12. Random systems that create pressure** (45 s)

Randomness also creates pressure. The type of each Long is a tiered random pick: Long Veil and Long Grasp can only appear from the third encounter. A random hero may be offered at each return. Cerberus frightens up to two random passengers off the boat. The Restless River can give most Longs extra Anger, and the chance rises over the run. Other targets are random too: the memory Charybdis takes, Scylla's victim, which soul a Long spreads to, which route Long Veil hides, and, from level 3, which memory Long Hollow takes. Below level 3 the player chooses.

**Slide 13. Deterministic rules** (30 s)

Not everything is random. The fog cost is a fixed calculation: the route's base fog, plus the cycle increase, plus Long fog and overload, minus any shields. The player sees this cost before confirming a route, unless Long Veil hides it. All rules live in one engine and one data file, and every scene reads from them, so the rules are never written twice.

**Slide 14. Luck and skill** (25 s)

Some of the game is luck, and some is skill. Chance decides the routes, the arrivals and which Longs appear. The player decides who boards, which fork to take and when to play a memory. With one seeded generator, the same seed and the same choices replay the same run, so a good or bad result can be studied again.

## Part 3: Demo play (about 2 minutes)

**Slide 15. Demo** (about 2 min: 75 s of speech plus play time, not measured)

[Action: open the built `.exe`. Start a new game with the demo seed, typed on the title screen. If the live demo fails, play the recorded video (T-41).]

Let's play. This is a fixed seed, so if we make the same choices, the run matches our rehearsal.

[Action: the driver plays the path below. The narrator speaks at each step. This is **candidate seed 116**, the first cycle only. It was replayed through `rules/engine.js` on `main` at `e599583`, with #26 merged, not in the game window. Run it again after the freeze: see "Demo seed" below.]

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

Candidate only. The outline chooses the final seed after the November 6 freeze (to-do 3).

* Seed 116 was picked from a search of seeds 1 to 5000 with one fixed boarding (Mother, Child, Merchant, Cook) and a simple route rule. The search kept seeds where a memory comes before the first Long and the first cycle ends.
* After #26, the Cook no longer becomes a Wraith at fork 4, so the path has a fifth fork. It finishes a story, plays a memory and delivers all four souls.
* Replayed twice through `rules/engine.js` on `main` at `e599583`: both runs gave the same final state.
* #27 may change the memories. Replay the path after the freeze.
* NOT_RUN: this path in the real game. CrossingScene (T-19) is still a stub on `main` and nothing mounts RouteUI yet, so the fog display on slide 13 and in this path is also unconfirmed in the game window.

## Not done for T-26

* **Early gameplay footage** (in the T-26 done-when line) is not captured. It needs a human to play the build; CrossingScene (T-19) is due November 5, so footage taken today would not show a crossing.
* Speakers and timing per person are not assigned.
* The demo steps on slide 15 use a candidate seed; the final seed waits for the freeze (T-41).
* VarisPah chose the name Heracles (#21), so this script uses it. The game still shows "Hercules the traveler" (`content.json`) until that rename lands.
* The script was not read aloud or timed; the times above are word-count estimates.
