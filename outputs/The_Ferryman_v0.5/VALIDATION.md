# v0.5 validation and limits

This is a generated, checked prototype ready for a human workshop trial. It has not been physically printed, cut, assembled or played by a person as part of this delivery.

## Executed checks

| Check | Recorded result | Evidence |
|---|---|---|
| Engine regressions | 37 pass, 0 fail; 200 seeded random nights, 4,820 legal transitions | [engine-results.json](verification/engine-results.json): counts, randomSeeds, randomTransitions |
| Synthetic visible-state policy | 100 seeds; 72 wins, 28 losses; mean 8.56 wishes | [simulation-results.json](verification/simulation-results.json): seeds, wins, losses, meanWishes |
| Browser winning walkthrough | Seed 1: 8 wishes, 14 delivered souls, 4 completed trips, tide 8, light 5, no Wraiths | [browser-results.json](verification/browser-results.json): winningWalkthrough |
| Browser losing walkthrough | Seed 1: Killer becomes a Ship Wraith at move 2; return costs 1 with 0 light; loss occurs before tide advances | [browser-results.json](verification/browser-results.json): losingWalkthrough |
| Browser usability and persistence | Passenger visibility, Back, memory choice, overflow, quest, Sanctuary, help, New Night cancel, reload and imported seed 42 checked | [browser-results.json](verification/browser-results.json): checks |
| Browser layout | Desktop 1280 x 900 and narrow 390 x 844 viewport checks; no horizontal overflow observed | [browser-results.json](verification/browser-results.json): viewports |
| PDF and source consistency | A4 page counts, matching separate guide, embedded used fonts, safe glyph margins, component mapping, source hashes and links | [static-results.json](verification/static-results.json): counts, records, details |
| Visual paper review | All 16 master pages inspected as rendered images; marker size and portrait crop corrected | [paper-review.json](verification/paper-review.json): visualReview |
| Final render comparison | All 16 final pages pixel-match their reviewed previews | [paper-review.json](verification/paper-review.json): finalRenderComparison |
| Portable rebuild | Extracted package regenerates equivalent PDF drawing content using its bundled art and fonts | [portable-build.json](verification/portable-build.json): checks |
| Paper procedure | Agent desk audit of setup, movement, deadlines, deliveries, events, ending and reset | [paper-review.json](verification/paper-review.json): procedureChecks |
| Distribution ZIP | File list, CRC and exact bytes checked against the completed folder | [package-check.json](verification/package-check.json) |

The synthetic policy is a program using visible information, not a sample of human players. Its 72% win rate does not establish balanced difficulty. The recorded winning replay is a reproducible software example, not a recommended strategy.

[Source freshness](verification/source-freshness.json) lists evidence oldest first and flags older assets as POSSIBLY STALE for design interpretation. They are reused only as artwork/fonts. The supplied feedback is the sole design source. [Navigation checks](verification/navigation-results.json) record 101 checked project links with no missing targets.

## Browser scope

Checks used the Codex in-app browser on Windows and local HTTP with the isolated test save key. Viewport resizing is not a real phone test. Full browser compatibility, a complete accessibility audit and direct-file browser launch are unverified. The runtime uses local plain scripts and includes all its assets.

October 4, 2026 interface rebuild (user request): the browser now uses the v0.4 interface style (intro, three save slots, one decision per page, picture cards, popups, Khmer night theme, reaper boat). Rules, engine and seeded outcomes are unchanged. On the rebuilt page, headless Chromium on macOS over file:// replayed the seed 1 winning night (all 39 moves) at 1280 and 390 px and the seed 1 losing night, with identical results and no page errors; ten checks passed and ten are NOT_RUN on the new interface (passenger information, Preview and Back, reload, Killer and event, calm target, Sanctuary, last-chance warning, help, New Night cancel, save import). See browser-results.json; the original interface run is kept under previousRun.

The browser tool did not confirm a save download, so that UI download check is UNVERIFIED. JSON serialization, validation and round trips passed in the engine, browser reload preserved a reviewed crossing, and importing a generated seed-42 JSON save displayed that seed and its expected initial shore. Import/export do not require an account.

No browser JavaScript warnings or errors were returned in the checked log snapshots. This is limited to the observed session, not a universal error-free claim.

## Print scope

The complete kit is 16 A4 pages. The separate guide is one A4 page and matches page 2 of the kit. It contains 67 cut pieces; see the [inventory](print/COMPONENT_INVENTORY.json): perPlayer and components. Markers are 10 x 10 mm and fit the smallest 20 x 11 mm track cells.

Main rules, guide and card effect text use approximately 10-11 pt; compact IDs and footers are smaller. See static-results.json: minimumTextPt and embeddedUsedFonts. All used glyphs and cut pieces are checked against 10 mm page margins. Four portraits reuse original bytes; their placement crops were visually reviewed. Font licensing is bundled.

Print A4, color, single-sided, actual size / 100%. Check the 50 mm calibration line. Use opaque card for shuffled pieces or mount printed paper to opaque card. The kit requires no aligned front/back printing.

## Remaining physical and human checks

- NOT_RUN: ruler check on an actual printer, clipping, color reproduction and actual-size reading.
- NOT_RUN: cutting, card opacity, shuffling, pencil erasing, table layout and marker handling.
- NOT_RUN: unaided learning from the guide, completion time, enjoyment and perceived difficulty.
- NOT_RUN: broader device/browser coverage and full accessibility audit.

Record these on kit page 16. Do not replace the NOT_RUN entries with inferred results.

## Reproduce

Run `node tests/engine-check.js` and `node tests/simulation.js` from this folder. For document generation, use Python with reportlab and pypdf: `python tools/build.py`. The generator uses existing repository art when available and otherwise verifies the bundled copies against provenance. `python tools/check_artifacts.py` also uses pdfplumber. No development dependency is needed to play or print.

Checks store source hashes, and rebuilding overwrites generated files and their evidence. After any rule or component change, regenerate the browser data, rules, guide and PDFs, review changed pages, rerun checks and rebuild the ZIP.

