# T-26 pitch script draft (November 4, 2026)

Owner: bosthanapatw. Support: purin-kan. Draft for the team to review. It follows the slide numbers in `notes/T-18_Presentation_Outline.md` and the rules in `outputs/The_Ferryman_Desktop_v0.8.1/rules/RULES.md` at rules version `0.8-t45`. **Every rule line is provisional until the November 6 freeze**, and slides 4 and 5 change if #26 (Anger limit) or #27 (memory rules) is approved.

How to read this script:

* Lines under each slide are spoken, at about 130 words per minute. The time per slide is an estimate from the word count.
* `[Action]` lines are stage directions, not spoken.
* Speakers are not assigned yet. Suggested split: one speaker for Part 1, one for Part 2, one driver and one narrator for Part 3.
* The course time limit is not known yet (outline to-do 1). This draft runs about 8 to 9 minutes before Q&A. Cut slide 13 first, then slide 8.

## Part 1: Description (about 3.5 minutes)

**Slide 1. Title** (15 s)

Hello. This is The Ferryman, a desktop game built with Phaser 4 and Electron for Windows. Our team is [names and roles, read from the slide].

**Slide 2. The pitch** (30 s)

You play Charon's apprentice, the ferryman of the dead. Souls wait on the shore, and each one has a wish: one of six destinations in the underworld. Your lantern is your life. Each crossing through the fog costs Light, and when the Light reaches zero, the run ends. There is no final level and no victory screen. The goal is to last as long as you can.

**Slide 3. The core loop** (35 s)

[Action: point at each step of the loop diagram.]

Each cycle has four steps. First, board: choose souls from the shore, up to four seats. Second, cross: at each fork, pick one of two routes. Each route shows its fog cost. Third, deliver: when the boat reaches a soul's wish, that soul gets off. Fourth, return: with an empty boat, go back to the shore and recover one Light. While you are away, the souls on the shore grow angry.

**Slide 4. Resources and pressure** (35 s)

Two numbers drive the game. Light is your life: you start with six, fog takes it, and the return gives one back. Anger is the souls' patience. A soul left waiting on the shore, or sailing too long, turns into a Wraith, and Wraiths cost Light. The fog also gets thicker as the run goes on, from cycle 6 and again from cycle 12, except at Haven, which stays safe.

**Slide 5. Memories** (30 s)

When a soul is delivered, it often leaves a memory card. Twelve of the fifteen ordinary souls do. You can hold three. Memories are your tools: Light restores one Light, Foresight shows the next forks, Calm lowers the Anger of every soul on the boat, and Fog Shield lowers the fog. Finishing a story gives a special memory, like the Sword or the Golden Apple.

**Slide 6. Longs** (30 s)

Then there are the Longs: lost souls from another land. One boards on every third outward round, and each Long breaks one rule. Long Mist adds fog. Long Veil hides a route. Long Hollow steals memories. Long Burden takes seats. Long Grasp refuses to leave. They get stronger with each encounter.

**Slide 7. Stories** (30 s)

The souls are not only cargo. Pairs of souls share a story, and the order of delivery matters. Penelope the Mother and Theo the Child. The two Soldiers. The Bard and the Listener. For example, the Merchant must be delivered before the Blacksmith, or the Sword is never forged.

**Slide 8. Heroes** (25 s)

Sometimes a hero asks for a ride. Heracles must face Cerberus, and both travel to the same destination; the reward is the Golden Apple. Odysseus meets Tiresias and must choose between Charybdis and Scylla.

## Part 2: Algorithmic Implementation (about 3 minutes)

**Slide 9. One seeded random generator** (40 s)

Now, how it works. Every random event in the game draws from one random number generator: a linear congruential generator, in the function `draw`. The generator starts from a seed, and the seed is saved with the game. With the same seed and the same choices, you get the same run. This helps three things: a repeatable demo, bug reports that a teammate can replay, and automated tests. Our test script replays 128 seeded runs and checks that each one plays out the same way twice.

**Slide 10. Procedural content** (40 s)

The river is generated, not designed by hand. At each fork, `deal` draws two different destinations, and the game keeps three forks ahead. The order in which new souls arrive comes from a Fisher-Yates shuffle. Hero wishes are drawn from the six destinations. And Long Grasp can force Haven into a fork the player has not seen yet, but never into one already shown, so the player is never tricked.

**Slide 11. Random systems that create pressure** (45 s)

Randomness also creates pressure. The type of each Long is a tiered random pick: Long Veil and Long Grasp can only appear from the third encounter. A random hero may be offered at each return. Cerberus frightens up to two random passengers off the boat. Other targets are random too: the memory Charybdis takes, Scylla's victim, which soul a Long spreads to, and, from level 3, which memory Long Hollow takes. Below level 3 the player chooses.

**Slide 12. Deterministic rules** (35 s)

Not everything is random. The fog cost is a fixed calculation: the route's base fog, plus the cycle increase, plus Long fog and overload, minus any shields. The player sees this cost before confirming a route, unless Long Veil hides it. All rules live in one engine file, and every scene reads from it, so the rules are never written twice.

**Slide 13. How it was built** (optional, 25 s)

Each phase of the game is a Phaser scene, chosen from the engine's state. Phaser has no visual editor, so a developer panel tunes timings and river paths. Most code was written by AI from our prompts. The design decisions were made by the team.

## Part 3: Demo play (about 2 minutes)

**Slide 14. Demo** (2 min)

[Action: open the built `.exe`. Start a new game with the demo seed, typed on the title screen. If the live demo fails, play the recorded video (T-41).]

Let's play. This is a fixed seed, so if we make the same choices, the run matches our rehearsal.

[Action: the driver plays the path below. The narrator speaks at each step. The steps are a placeholder until the seed is chosen after the freeze (outline to-do 3).]

1. Boarding: "Here is the shore. I pick souls that share a direction, up to four seats."
2. Fork: "Two routes. This one costs [n] fog, this one [n]. I take the cheaper one that reaches a wish."
3. Delivery: "[Soul] reaches [destination] and leaves a memory: [memory]."
4. Long boarding: "A Long boards. This one is [Long], so [effect]."
5. Return: "The boat is empty, so we go back and recover one Light. The waiting souls are angrier now."

**Slide 15. Credits** (15 s)

[Action: show the credits slide. Read both CC-BY credits aloud.]

The menu music is "RPG - Underworld Theme - Loop" by Joseph Collard, and the footstep sounds are from "Pirate Pack Vol 1" by JC Sounds, both under CC-BY 4.0. Full credits are in the game's `CREDITS.md`.

**Slide 16. Questions**

Thank you. We are happy to take questions.

## Likely questions (prepared answers)

* **Is there AI in the game?** No computer-controlled opponent. The pressure comes from seeded random systems and fixed rules (slides 9 to 12). AI tools were used to write code from the team's prompts.
* **Can a run be won?** No. The run is endless; the score is how long the lantern lasts.
* **Why a seed?** Repeatable runs for the demo, for bug reports and for automated tests.
* **What are the Longs based on?** To confirm with the team from the entity catalog before answering (outline slide 6 note).

## Not done for T-26

* **Early gameplay footage** (in the T-26 done-when line) is not captured. It needs a human to play the build; CrossingScene (T-19) is due November 5, so footage taken today would not show a crossing.
* Speakers and timing per person are not assigned.
* The demo steps on slide 14 wait for the seed (T-41).
* The game shows "Hercules the traveler" (`content.json`), while the outline and this script say Heracles. Pick one name for the slides and the speech.
* The script was not read aloud or timed; the times above are word-count estimates.
