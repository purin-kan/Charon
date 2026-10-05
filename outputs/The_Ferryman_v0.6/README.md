# The Ferryman v0.6

[Play locally](index.html) · [Full rules](RULES.md) · [Rebuild](REBUILD.md) · [Verification](VALIDATION.md) · [A/B integration status](INTEGRATION.md)

The combined v0.6 delivery includes [the complete 24-page print kit](print/Print_and_Play_v0.6.pdf), its five supporting PDFs, 78 cut pieces, five whole mats, all 23 original artwork assets and the matching browser. See the current package receipt and [integration record](INTEGRATION.md), including the unidentified remote B branch limitation.

## Play

Open `index.html` in a modern browser. All scripts, fonts and current images are local; there is no installation, account or remote asset requirement. Direct-file launch has not been verified because the approved browser tool blocks file URLs. The tested fallback is a local HTTP server: from this folder, run `python3 -m http.server 8766 --bind 127.0.0.1`, then open `http://127.0.0.1:8766/`. Python is only needed for that optional server, not by the game itself.

Choose a save slot, use **Facilitator routes** to enter pairs, board souls, and follow memory, route, confirmation, delivery and return screens. There is no default map. The editable sample in the route editor is just an example; inserting it does not apply it. The facilitator can append offers or replace only concealed offers. Each new cycle starts an empty queue. Future offers never appear in normal player rendering until revealed. A player sharing the facilitator's computer can inspect save JSON, so this is screen concealment, not access control.

**Stop and save session** records a voluntary stop without a victory. Resume continues that same run. Autosave uses three separate `the-ferryman:v0.6:player:` slots. Older save keys are never read, removed or overwritten. Export JSON before moving files, browsers or computers. Imports are validated before a replacement confirmation. Storage failure displays an export reminder; continuing then keeps progress only in memory until exported.

## Rules in this build

Endless survival, eight unique recycling ordinary souls, a new fixed memory on every eligible delivery, distinct PoLong instances every third global outward round, and the family quest once per run. The machine-readable source is `content.json`; `content.js`, `rules.json`, `PRINT_TEXT.json` and `RULES.md` are generated from it. This build uses no earlier-version powers, win target or cycle cap.

All A illustrations are integrated unchanged. The browser retains revealed offers throughout the cycle, matching the paper ledger. Earlier v0.6 saves still load; already discarded pre-upgrade route history cannot be reconstructed. Team art approval is not implied by integration.

## Submission

`tools/package/package.py --complete` creates the combined submission only when all current print, browser and extracted-package gates pass. The outer START_HERE.html prominently links the full print kit and game. The packaged `game/` folder retains this folder's paths so rebuild tools stay portable. Earlier INCOMPLETE and A-only archives are historical, not the combined delivery.

Actual printer scale, cutting, opacity, handling, human learning, enjoyment and balance remain untested. Institutional deadline, rubric, filename/size limits and course/team identifiers remain unknown. No push, deployment or external submission is performed.
