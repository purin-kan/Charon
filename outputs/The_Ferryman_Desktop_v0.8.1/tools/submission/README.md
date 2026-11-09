# The Ferryman (v1.1.1)

A 2D single-player game about the ferryman of the underworld. You carry souls across the river to
the places they wish to reach, keep your lantern burning, and face the Longs, tainted souls that
board along the way. Built with Phaser 4 inside Electron.

Group Assignment 2: final version of the game.

## Play on Windows

1. Unzip the Windows folder anywhere (for example, your Desktop).
2. Open the folder and double-click **`The Ferryman.exe`**. Nothing needs to be installed.
   Windows 10 or 11, 64-bit.
3. The game is not signed by a publisher, so Windows may ask before it starts:
   * "The publisher could not be verified. Are you sure you want to run this software?": click **Run**.
   * "Windows protected your PC" (SmartScreen): click **More info**, then **Run anyway**.

The first launch can take a few seconds longer than later ones. The game saves after every move;
**Continue** on the title screen resumes the saved run.

## How to play

Your lantern starts with 7 Light. Fog, angry souls and Wraiths cost Light, and the run ends when the
lantern goes out. There is no final victory: see how many cycles you survive.

Each cycle has four steps:

1. **Boarding.** Drag souls from the shore onto the boat (4 seats). Each soul wishes to reach one
   destination, shown with the soul. Some pairs of souls start a quest when they depart together.
2. **Crossing.** Approach each fork and choose a route. A route's fog costs Light when you cross it.
3. **Delivery.** At each stop, let off the passengers whose wish is that place. A soul delivered to
   its wish gives you a memory. A soul let off anywhere else costs 1 Light.
4. **Return.** When the boat is empty you return to the starting shore. Souls left waiting grow
   angry (at Anger 2 a soul becomes a Wraith and costs Light), then the lantern recovers 2 Light.

**Memories** are one-use cards: restore Light, reveal routes, block fog, calm the boat and more.
You may play one memory per stop and hold at most three at the end of a round.

**Longs** start arriving from cycle 3. Each boards at a fork and causes trouble until it leaves the
boat. **Heroes** (Odysseus from cycle 6, Heracles from cycle 9) may ask for a seat and bring their
own encounters.

### Controls

* Mouse: drag souls between the shore and the boat, and click buttons, routes and memories.
* Keyboard: on the title screen, click the seed line, type digits and press Enter to start a run
  with a fixed seed. The same seed and the same choices replay the same routes and encounters.

## Randomness and procedural content

All random events come from one seeded generator, so a run can be replayed from its seed. The rules
engine is `rules/engine.js`:

* `draw`: a linear congruential generator; the seed is saved with the game.
* `shuffle`: a Fisher-Yates shuffle that sets the order in which new souls arrive.
* `deal`: generates the river, drawing two different destinations for each fork, three forks ahead.
* `randomWish`: draws the wishes of heroes.
* `drawPolong`: picks which Long arrives, from a harder tier as encounters build up.
* `offerHero` and `heroicArrival`: random hero offers, and Cerberus frightening two random souls.
* `fog`: the fog cost of a route, a deterministic calculation.

The game has no computer-controlled opponent.

## Build from source

Needs Node.js 22.13 or newer (Node 24 LTS recommended) and npm. From this folder:

```sh
npm install        # installs the exact versions in package-lock.json
npm start          # opens the game in a development window
npm run package    # builds out/The Ferryman-win32-x64/The Ferryman.exe (run on Windows)
npm run make       # also zips that folder into out/make/
```

On macOS or Linux, build the Windows version with
`npx electron-forge package --platform win32 --arch x64`.

On Node 25, `npm run make` fails at the zip step (a dependency calls a Node function that Node 25
removed). Use `npm run package` and zip the `out/The Ferryman-win32-x64` folder yourself, or build
with Node 24.

### Changing the rules

The rules live in `rules/content.json`. After editing it, run `node tools/build-content.js` from
`rules/` to regenerate `content.js`, `rules.json` and `RULES.md` (the full rules reference).
Animation timings are in `assets/tuning.json` and never change the rules.

## Project layout

```
index.html, src/renderer.js   Page and Phaser game setup
src/main.js, src/preload.js   Electron main process and preload script
src/ferry.js                  Loads the rules engine (rules/content.js, then rules/engine.js)
src/router.js, phase-map.js   Picks the scene for each game phase
src/scenes/                   One file per scene (title, boarding, crossing, delivery, return,
                              game over and overlays), with their layout and effect helpers
src/components/               Memory hand and route display
src/save.js, src/text.js      Save slot and on-screen text (src/data/scene-text.json)
src/dev/                      Developer scene launcher and tuning panel (inactive in the .exe)
rules/                        Rules engine, rules data and the generated rules reference
assets/                       Art, backgrounds, audio, fonts and animation tuning
forge.config.mjs, vite.*.mjs  Electron Forge and Vite build configuration
```

## Team

| Name | Student ID | GitHub | Role |
|---|---|---|---|
| Mr. Varis Pahira | 6622770780 | VarisPah | Audio, QA and game balance; project manager |
| Mr. Thanapat Wicharn | 6622770822 | bosthanapatw | Production and presentation lead |
| Ms. Kanyakorn Na Songkhla | 6622771499 | Kanyakorn-goya | Art |
| Mr. Supakorn Prayongyam | 6622781084 | SupaOhm | Gameplay development |
| Mr. Tagrid Chongkolrattanapond | 6622781175 | Jaoguya | Gameplay development and UI; co-project manager |
| Mr. Tinpat Vittayaphanpracha | 6622781860 | Tinpatpun | Gameplay support and UI |
| Mr. Purin Kanjanakumnerd | 6622770368 | purin-kan | Project setup and builds |

The team decided the rules and what is random and why, and AI wrote most of the implementation
from our prompts.

## Credits

Full art, audio, font and software credits are in [CREDITS.md](CREDITS.md).

* Menu music: "RPG - Underworld Theme - Loop" by Joseph Collard (jocolloman),
  https://opengameart.org/content/rpg-underworld-theme-loop, CC-BY 4.0.
* Board and unboard footsteps: "Pirate Pack Vol 1" by JC Sounds,
  https://opengameart.org/content/jc-sounds-pirate-pack-vol-1, CC-BY 4.0.
* The delivery jingle, the Wraith sound and the crossing ambience were generated with ElevenLabs
  (elevenlabs.io), https://elevenlabs.io/app/sound-effects.
* UI click by Kenney and the fog sound by Ogrebane, both CC0.
* Fonts: Cinzel Decorative and Cormorant Garamond (SIL Open Font License 1.1), Bitstream Vera.
* Built with Phaser, Electron, Vite and Electron Forge (MIT).
