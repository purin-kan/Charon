# The Ferryman v0.7: implementation status

30 October 2026. The user requested the synchronized game on main and the spreadsheets kept local. The canonical current game is `outputs/The_Ferryman_v0.7/index.html`. Version `0.7-trial`, save schema 3, uses its own three-slot player/QA storage namespace. Old v0.6 saves stay in v0.6.

## Current content

The selected playable roster includes 15 ordinary souls, Hercules the traveler, Odysseus the traveler, Cerberus, and five Polong variants. All eight quests, ordinary/quest memories, Priest purification/exhaustion, heroic encounters, repeatable participant-bound quest attempts, random route draws, overload, concealment, memory theft and spread are implemented. Priest restores one Light. Return restores one Light. Memory hand limit is three; there is no pre-travel use cap. Heaven is a separate destination.

Drug Dealer, Po Nak, Fool, Po Long and Killer are all included by the user's correction. Po Nak and Po Long are the existing Polong identities, not duplicate ordinary characters. Drug Dealer, Fool and Killer are visible in the game's roster reference with destination/memory/ability TBA; the current Doc supplies names without sufficient playable rules. No old removed Fool/Killer ability has been reactivated. Personal naming examples do not assign final names to characters.

## Deferred team decisions

Scale unlock lists, random unlock policy, blank-cycle progression and adaptive route weighting await team direction. All seven destinations and 15 specified ordinary souls remain available under the earlier accepted trial configuration. The prototype still uses one scheduled Polong every three outward rounds. The user's clarification that Scale counts mean arrivals per cycle is recorded, but that deferred Scale system is not active. Do not describe this prototype as fully implementing Scale.

Existing difficulty includes +1 route fog from cycle six and +2 from cycle twelve except Haven, encounter-level Polong escalation and Restless River. Golden Apple maximum-Light growth remains an approved trial exception to the old flat-power proposal. Missing balance values and interactions use the accepted temporary rules in `TRIAL_RULES_DRAFT.md`. Final engine, art and balance remain team decisions.

## Source and scope

All 15 GameDev tabs were re-read. Doc modified time remains `2026-10-29T19:37:27.386Z`. The roster uses Bard, Hercules the traveler, Odysseus the traveler and Priest Light restoration; source detail does not settle all prototype interactions. The source Google Doc was not changed.

The earlier ignored HTML trial and October handoff are historical preparation. This main game is canonical. Spreadsheet catalogs remain entity-only, local and gitignored. The current sync reinstates all named characters in both catalogs and retains old removed abilities as legacy references. No spreadsheet content is required to run or build this game.

The v0.6 paper kit and submission package remain historical. They have different rules and were not rebuilt as v0.7 materials. This version has its own current text rules, instructions, source, asset references, tests and portable ZIP. Rebuild its ZIP after changing contained files.

## Verification and limits

Run `node tools/build-content.js` then `node tests/quest-check.js`. The scenario suite covers all eight quests, Polong variants, repeatability, source provenance, pending saves, fatal ordering and seeded legal runs. Read `verification/quest-results.json` for current counts and hashes. Fixture tests can supply extra Light to isolate long quest behavior; they are not survival/balance findings.

Earlier native Chrome/macOS smoke checks covered seeded boarding, hero acceptance, route review/reload, matching delivery, Fog Shield, separate Heaven, Tiresias/Charybdis and Moly reward. This is agent testing, not human playtesting. Current direct-file, mobile, Windows and other-browser coverage is not claimed. Native Excel interaction is untested. Some entities use text/initial placeholders pending art.

`verification/delivery.json` and the sibling ZIP receipt describe the current package. The main source requires no account or dependency installation to play. No hosting or remote push is part of this synchronization.
