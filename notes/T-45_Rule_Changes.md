# T-45 rule changes (November 2, 2026)

Owner: purin-kan (from November 1). Draft and change note: bosthanapatw. Engine review: Jaoguya. Draft for the owner to review: these edits apply the PM and co-PM decisions in [issue 6](https://github.com/purin-kan/Charon/issues/6) (VarisPah, confirmed by Jaoguya, November 1). Nothing here has been playtested.

All paths are under `outputs/The_Ferryman_Desktop_v0.8.1/`.

## Rules changed

| # | Decision (issue 6) | Change | Files |
|---|---|---|---|
| 1 | No separate Heaven; every Heaven becomes Haven; 6 destinations | `DEST-HEAVEN` removed. Priest wish Heaven to Haven. Hero wishes now draw from all six destinations (the Heaven filter in `randomWish` is gone). The start-of-run log no longer says Heaven is separate. Routes rule text updated. | `rules/content.json`, `rules/engine.js` |
| 1 | (follows from removing Heaven) | Blacksmith wish Heaven to **Acheron**, the wish in the entity catalog and the blockers note soul table. See "Needs confirmation". | `rules/content.json` |
| 2 | Child's wish is Haven | Child wish Heaven to Haven. Mother and Child quest text: "Deliver Child to Haven, then Mother to Tartarus." | `rules/content.json` |
| 3 | One Bard with Calm; 15 ordinary souls | No data change needed: `content.json` already had one Bard (`SOUL-MUSICIAN`, Calm) and 15 ordinary souls. A test now checks both. The milestone table is not in the game data yet (Scale progression is still pending), so the cap at 15 has nothing to change. | `rules/tests/quest-check.js` |
| 4 | Cerberus goes to the same destination as Heracles | When Cerberus boards, Heracles gets a new random wish from the six and Cerberus copies it (before, each drew its own). Both can now be delivered at the same stop. | `rules/engine.js` |
| 5 | Keeper and Messenger: version A, no quest | No data change: the game data has no backstories and no Keeper and Messenger quest. | |
| 6 | Personal names | New `personalName` field on all 15 ordinary souls (Penelope, Elias, Homer, Glaukos, Phoenix, Sappho, Nikos, Hermon, Sikon, Georgios, Theo, Echo, Petros, Chalkon, Hero). `name` is unchanged, so no scene changes. `RULES.md` gains a Personal name column. | `rules/content.json`, `rules/tools/build-content.js` |
| 7 | Protecting the Merchant is story only; Sword only if Merchant is delivered before Blacksmith | Blacksmith no longer blocks the Merchant's Anger. Nothing blocks the Blacksmith's delivery (the "deliver Merchant first" and "later crossing" checks are gone). Delivering the Blacksmith first fails the quest, so no Sword. Merchant then Blacksmith, even at the same stop, gives the Sword. Quest and round-step text updated. | `rules/content.json`, `rules/engine.js` |
| - | Scylla replaces Zilla (blockers note, "World and story") | Player-facing text only: quest text, engine log and error messages, and the `choice.zilla` label in scene text. The internal branch id `zilla` and the `zilla*` text keys stay, so scenes and saves keep working. | `rules/content.json`, `rules/engine.js`, `src/data/scene-text.json` |

Drug Dealer, Fool and Killer stay out of play (still in `pendingSouls` only).

## Checks (agent, automated)

* `node tools/build-content.js`: built content `55f1026e...` (`rules/verification/content-build.json`).
* `node tests/quest-check.js`: 22 passed, 0 failed (`rules/verification/quest-results.json`). Tests changed: six destinations without Heaven; Priest, Child and Bard data; personal names present; Family and Priest delivered at Haven; Merchant gains Anger with Blacksmith aboard; Blacksmith first fails the Sword quest; Cerberus shares Heracles' wish.
* `npm run fixtures`: all fixtures regenerated, since the old ones held Heaven wishes.
* `npm run check`: 5 of 5 checks passed (engine, router, art, boarding, text), after rebasing on `main` at `e9358e5`.
* Not run: `npm start`, the packaged `.exe` and any human playtest.

## Needs confirmation (VarisPah, Jaoguya)

1. **Blacksmith's wish:** Acheron (catalog and soul table) or Haven (a literal "every Heaven becomes Haven")?
2. **Calm:** decision 3 describes Calm as "ship anger -1". The engine still applies Calm to one chosen soul. Changing it to every soul aboard is a rule change, and it also affects Cook and Farmer, so it was not made here.
3. **Save version:** `version` is still `0.7-trial`. A save made before this change that holds a Heaven wish now fails validation (`DEST[x.wish]` in `validate`), with the generic "not a current save" message. Bumping the version would reject all older saves the same way, but on purpose. This is a scaffold call for purin-kan.
4. **Other blockers note answers** ("Differences from v0.7": Anger -3 on boarding, one memory per round, per-cycle Polong arrivals, White flag, Moly, Priest recovery, soldier wishes and memories, Messenger wish, Blacksmith Fog shield, Farmer Calm) are not in issue 6 and were not applied. Should T-45 cover them, or does each need its own decision?
5. **Scene text** still says "Face the five Polongs. Follow eight stories" (`title.tagline`). The game data has five Polong variants and eight quests, so it is unclear what should replace it. Tinpatpun owns the scene text.
