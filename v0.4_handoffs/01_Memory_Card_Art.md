# Handoff: memory card artwork (v0.4)

Copy the text below into an image-capable conversation (for example ChatGPT with image generation) and attach the listed reference files.

---

**Shared-repository warning:** Other people may be working in this repository. Edit only the files assigned to you below. Do not reset, clean, overwrite, move or delete anything else, including uncommitted work you did not create. If something outside your files needs changing, report it instead of changing it.

## Your job

You are the visual asset producer for **The Ferryman v0.4**, a browser game prototype. The player is an apprentice ferryman carrying souls across a misty river of the dead. Delivering a soul leaves the player a **memory card**, and the player can spend one memory per crossing to push back the fog that drains their lantern.

Right now the memory cards are plain text boxes. Your job is to **generate six real, usable image files**, one for each memory card type, so the cards feel as alive as the soul portraits and destination scenes. Produce images, not only prompts. This task covers art only: do not change rules, card names, card effects or game code.

## Attach these references

Look at them before you start, and match their style:

- `outputs/The_Ferryman_Digital_Demo_v0.4/assets/shore-r2.png`: starting shore, the night river mood
- `outputs/The_Ferryman_Digital_Demo_v0.4/assets/elysium-r2.png`: warm, hopeful destination
- `outputs/The_Ferryman_Digital_Demo_v0.4/assets/haven-r2.png`: quiet recovery place
- `outputs/The_Ferryman_Digital_Demo_v0.4/assets/S01.png`, `S02.png`: Mother and Child portraits (linked pair)
- `outputs/The_Ferryman_Digital_Demo_v0.4/assets/S04.png`, `S06.png`: Red Soldier and Blue Soldier
- `outputs/The_Ferryman_Digital_Demo_v0.4/assets/S11.png`, `S12.png`: Musician and Listener (linked pair)
- `outputs/The_Ferryman_Digital_Demo_v0.4/assets/apprentice.png`: the player character

If a reference is missing, ask for it instead of guessing what it looks like.

## Style (match the existing art)

- **Look**: atmospheric painterly illustration with visible brush texture and restrained detail.
- **Palette**: cool teal and blue river mist, deep shadow, with a warm amber lantern glow as the focal contrast.
- **Mood**: solemn, tender and hopeful. Memories are gifts from souls who reached their rest, so they should feel precious, not scary.
- **Composition**: one clear central motif that still reads at thumbnail size (about 260 × 175 px on screen). Keep the middle 70% free of important detail cut-offs, and use soft dark edges (vignette) so the card text sits well below the image.
- **Consistency**: all six should look like one set. Use the same lighting direction, the same brush style and the same amber light. Recognisable people or objects (soldier cloaks, the lantern, the Mother and Child) must match the reference portraits.
- **Never include**: written text, letters, numbers, card frames, icons, logos or UI. The game draws names and rules itself.
- **Also avoid**: gore, horror and glowing eyes. Don't copy a named living artist's style.

## Format

- **Size**: 1536 × 1024 PNG (3:2 landscape), the same as the destination scenes. The card shows it at 3:2 with a small crop.
- **Transparency**: none. Use a full painted background.
- **File names**, in `outputs/The_Ferryman_Digital_Demo_v0.4/assets/`:

| File | Card |
|---|---|
| `memory-R01.png` | Steadiness |
| `memory-R02.png` | Vigil |
| `memory-R03.png` | Recollection |
| `memory-R04.png` | Accord |
| `memory-R05.png` | Joined Memory |
| `memory-R06.png` | Faint Memory |

## The six cards

Names and effects come from `engine.js` and must not change. The "comes from" column says which delivered souls leave this memory, so the image can echo them.

| ID | Name | Effect in the game | Comes from | Image idea |
|---|---|---|---|---|
| R01 | **Steadiness** | Prevent 2 fog on this crossing | Messenger, Keeper | The apprentice's hand firm on the pole, the lantern flame standing perfectly upright, still water parting calmly around the bow. Feeling: calm control. |
| R02 | **Vigil** | Prevent 1 fog, or 3 if a two-seat passenger is aboard | Merchant, Mason | A lantern kept burning through a long night: a lone light on the boat's prow, mist held back in a ring, a heavy cloak or stone-dusted hands resting nearby. Feeling: patient watchfulness. |
| R03 | **Recollection** | Prevent 1 fog; may also protect one waiting soul from anger | Poet, Cook | A warm remembered scene glowing inside the mist, such as a table with an empty place set or an unrolled scroll, with a thread of amber light reaching back toward a small waiting figure on the shore. Feeling: remembering someone kindly. |
| R04 | **Accord** | Prevent 1 fog and cancel the soldiers' clash | Red Soldier, Blue Soldier | A red-cloaked and a blue-cloaked soldier's hands laying their blades down side by side, or two helmets resting together in the boat. Matching the reference portraits' colours matters. Feeling: truce and peace. |
| R05 | **Joined Memory** | Prevent 2 fog; may also protect one waiting soul | Linked pairs delivered **together** (Mother and Child, Musician and Listener) | Two lights twisting into one bright warm flame, or two hands of different sizes clasped in lantern light. The brightest, warmest card of the set. Feeling: reunion. |
| R06 | **Faint Memory** | Prevent 1 fog on this crossing | Linked pairs delivered **apart** | The Joined Memory motif, but incomplete: one small light alone, its partner only a faded outline in the mist, with cooler colours. Pair it visually with R05. Feeling: bittersweet absence, not tragedy. |

**Strength cue**: cards that prevent more fog (R01, R05) can carry slightly more warm light than the 1-fog cards (R02, R03, R04, R06). Keep it subtle, because the game shows the numbers.

## Work in this order

1. **Style sheet**: write a short note (palette, light direction, brush style, framing), then generate **R05 Joined Memory** and **R06 Faint Memory** first. They are a matched pair and set the tone.
2. **Remaining cards**: generate R01, R02, R03 and R04 to match.
3. **Inspect every image** at full size and at thumbnail size. Check:
   - no text or letters
   - the motif reads when small
   - hands and anatomy are correct
   - soldier colours are right
   - the set feels consistent
   - nothing important sits at the edges

   Regenerate anything that fails.
4. **Deliver** the six PNGs with the exact file names above. Use local files; don't hand over temporary image links that can expire.

## What to hand back

- The six PNG files, or a ZIP with them in `outputs/The_Ferryman_Digital_Demo_v0.4/assets/`.
- A short note (`memory-art.md`) with:
  - **Status**: each file marked **READY**, **NEEDS_REVISION** or **NOT_GENERATED**.
  - **Checks**: what you actually checked.
  - **Style note**: the style sheet from step 1.
  - **Prompts**: the prompt used for each image, so it can be regenerated.
  - **Provenance**: which tool generated each image, for `assets/PROVENANCE.json`.
- If image generation isn't available in your conversation, say so plainly. Hand back the six ready-to-use prompts instead, and don't claim the images exist.

## Out of scope

- **Game code**: showing the images inside the game (`app.js`, `styles.css`) is a separate follow-up task; don't edit code.
- **Rules**: don't rename cards, change effects, or add new memory types.
- **Existing art**: don't edit or replace the current soul, destination or apprentice images.
- **Publishing**: don't push, publish or share the files anywhere public.
- **Approval**: treat this as prototype art. Final art direction is the team's decision.
