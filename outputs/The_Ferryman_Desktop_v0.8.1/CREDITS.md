# Credits (draft)

Started for T-18 by bosthanapatw on November 2, 2026. Collected from the provenance notes in `assets/`; add a row whenever an art, audio or font file is committed. This draft is not a legal clearance: it lists only what the source records state.

## Team

| Member | Role |
|---|---|
| bosthanapatw | Production and presentation |
| Kanyakorn-goya | Art |
| Tinpatpun | Gameplay support and UI |
| Jaoguya | Gameplay and UI; co-PM |
| SupaOhm | Gameplay |
| VarisPah | Audio, QA and balance; PM |
| purin-kan | Scaffold and builds |

Roles are from `notes/Project_Plan_Oct30_Nov8.md`. Each member should check their own line.

## Music and sound

Source: `assets/audio/AUDIO_NOTES.md`.

* "RPG - Underworld Theme - Loop" by Joseph Collard (jocolloman), https://opengameart.org/content/rpg-underworld-theme-loop, licensed CC-BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Converted from WAV to OGG. Used as the menu loop (`bgm-menu`). **CC-BY: this credit must appear in the README and the presentation.**

## Art

Source: `assets/source-art/ARTWORK_NOTES.md` and the v0.6 rights record (`outputs/The_Ferryman_v0.6/art/LICENSES.md`, last present in commit `faf9ea5`).

* The portraits, destinations, memory icons, boat and shore in `assets/source-art/` are project artwork. The v0.6 record says the older raster art and eight v0.6 images were generated with a built-in AI image tool; no stock or downloaded images were added. No third-party licence is recorded for them.
* Farmer v7, Blacksmith v4 and Priest (normal v2, exhausted v3) were copied from the October 30 catalog's local images.
* Sprite cut-outs and new art for the desktop build: Kanyakorn-goya (to fill in as files land in `assets/art/` and `assets/backgrounds/`).
* Final art approval by the team is pending.

## Fonts

* Bitstream Vera, under the Bitstream Vera licence (`assets/fonts/bitstream-vera-license.txt`). Bundled, not yet loaded by any scene.

## Software

Versions from `package.json`; licences from each package's own `package.json`.

| Package | Version | Licence |
|---|---|---|
| Phaser | 4.2.1 | MIT |
| Electron | 45.2.1 | MIT |
| Vite | 8.3.5 | MIT |
| Electron Forge | 8.0.1 | MIT |

## Story sources

* Greek myth: Charon, Styx, Acheron, Asphodel, Elysium, Tartarus, Heracles and Cerberus, Odysseus, Tiresias, Charybdis and Scylla, Hermes.
* Polong (tainted soul) inspirations: see the entity catalog, `notes/Charon_Entity_Catalog_Public_2026-10-31.xlsx`.

## Development

Most code was written by AI coding assistants from team prompts; the team made the design decisions (`notes/Project_Plan_Oct30_Nov8.md`, section 1).
