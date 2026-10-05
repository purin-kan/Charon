# Handoff A to B: exact integration instructions

Historical worker handoff preserved for provenance. The October 5 combined integration is recorded in [INTEGRATION.md](../INTEGRATION.md); current parity and package results supersede the pending status below. A's original standalone archive is deliberately excluded from the combined ZIP, with its contents present directly.

A has completed the physical kit against the accepted shared rules and recorded user clarifications. No B-owned content export or browser files were present in `outputs/The_Ferryman_v0.6/` when A checked. The content comparison is therefore NOT_RUN. Do not describe the combined release as verified until the comparison and B's runtime checks are complete.

## Import without ownership collisions

Use the current A folders already in this release, or extract `print/Handoff_A_v0.6.zip` at the v0.6 root in a separate staging directory before merging. Its roots are exactly `print/`, `art/`, `assets/art/`, `tools/print/` and `verification/print/`. A has not edited browser code, B's machine-readable rules, workbook or final packaging files. Preserve the original handoff and earlier releases.

Use `art/ASSET_MANIFEST.json` schema version 1. Each asset supplies `component_ids`, `path`, `source`, `provenance`, `license`, `generation_record`, `crop_notes`, `width_px`, `height_px` and `sha256`. IDs are from the shared rules. PoLong's runtime instances should reuse the `SOUL-POLONG` image; printed instance suffixes identify physical copies. Mother and other rewarding source IDs map to their soul portraits, while `MEM-*` IDs map to memory art. Boat and shore use `MAT-BOAT` and `MAT-SHORE`. Retain the original PNGs and their hashes; browser crop styling may differ without modifying original art. Keep all provenance and font-license records in the final archive.

## Compare actual shared content

The print build parses the accepted roster, destination and exact memory-effect tables from `tools/print/source-contract/SHARED_RULES.md`. That snapshot's normalized UTF-8 text SHA-256 is `9f2486ed111c3666d2f71910dfac04813678c65d753ec9801a9f1736d0570e15`. Original source identity and modification dates are in `verification/print/source-freshness.json`. Do not treat old art provenance as current rules or playtest results.

1. Export a normalized projection from B's actual shared content. Derive every value from B's source, rather than copying the print projection as purported evidence. Save it in a B-owned location and record its producer/source hash.
2. Use `verification/print/printed-content-contract.json` only as the comparison schema. Include the fields in the table below. Normalize UI aliases to stable IDs and strip unrelated runtime fields.
3. From the v0.6 root, run `python tools/print/check_b_projection.py PATH_TO_B_PROJECTION.json`. It writes `verification/print/b-content-comparison.json`, records the input hash and exits nonzero on any omission/difference. Array ordering of roster, destinations and starting groups is ignored. Exact effect strings and gameplay values must agree.
4. Reconcile a mismatch with the accepted handoff and user clarifications. Do not rebalance or silently alter a mechanic. If an actual unresolved decision remains, bring that decision to the user. If the shared source legitimately changes, update the A snapshot and page prose together, rebuild all PDFs and repeat every-page review.

| Field | Required shape |
|---|---|
| `souls` | Nine objects: `id`, `name`, integer `seats`, destination ID in `destination`, memory ID or null in `memory` |
| `destinations` | Six objects: `id`, `name`, integer `fog` |
| `memories` | Object mapping six `MEM-*` IDs to exact printed effect strings |
| `constants` | `initialLight:6`, `maxLight:6`, `capacity:4`, `handLimit:3`, `spawnEvery:3`, `shipExpiry:4`, `shoreExpiry:2`, `returnRecovery:2` |
| `initialShore` | Mother, Child, Merchant, Mason, Cook IDs |
| `initialArrivals` | Soldier, Poet, Keeper IDs; shuffle at setup |
| Boolean flags | `endless`, `ordinaryRecycle`, `freshMemoryEveryEligibleDelivery`, `questOncePerRun`, `facilitatorRoutes`, all true |

Content equality is insufficient to prove runtime ordering. Reproduce the state scenarios in `verification/print/desk-walkthroughs.json` in B's engine/browser, recording actual outcomes separately. In particular, verify immediate loss at Light zero before delivery or recovery; global rounds across cycles; forced zero-seat PoLong at every third outward round; independent anger and fog per instance; one memory per round/return; renewable source-specific rewards and hand overflow; ordinary arrival recycling; quest success/failure persisting after recycling; Passage emptying the boat without round advance and sharing the immediate return's memory allowance; shore expiry before recovery; and pause without cost when route inputs are missing. Foresight reveals both options at the current and next two forks with information retained for the cycle. No mandatory map loop or first-route guarantee is supplied by A.

## Final files and package

| File under `print/` | Pages | Corresponding master pages |
|---|---:|---|
| `Print_and_Play_v0.6.pdf` | 31 | Entire kit |
| `Cutout_Sheets_v0.6.pdf` | 15 | 17-31 |
| `Player_Guide_v0.6.pdf` | 1 | 2 |
| `Assembly_and_Setup_v0.6.pdf` | 3 | 1, 3, 4 |
| `Full_Rules_v0.6.pdf` | 6 | 5-10 |
| `Workshop_Record_v0.6.pdf` | 1 | 11 |

1. Retain all six PDFs, both inventories, print README/validation/integration notes, art, original fonts and license, source snapshots, editable generator and print verification records. `verification/print/build-result.json` gives the final PDF hashes and sizes. `print/A_DELIVERY_MANIFEST.json` gives A's packaged file hashes.
2. Add B's finished browser, shared content, current workbook, run instructions, licenses, tests and submission documentation in B-owned paths. Check every final relative link. Keep `print/Print_and_Play_v0.6.pdf` prominent in the submission index.
3. Rebuild B's final A+B ZIP after importing A, and again after any subsequent file change. Check exact member set, CRC and extracted bytes. Extract to an unrelated folder and verify the browser and print rebuild there. A's portability check covers only A.
4. Exclude the nested A-only ZIP from the combined archive to avoid duplicating the large PDFs and artwork. The adjacent A package receipt verifies the standalone A archive; label that scope in the combined package. Preserve A's manifest as a dated handoff record if B integration updates a verification file.
5. Keep physical print/handling/play checks as NOT_RUN until a person records results. The blank workshop record is supplied for this. Team art approval and institution-specific filename, size, deadline and station-count requirements remain outside A's verified scope.

No upload, deployment or push has been performed. B's final package should remain local under the current user instruction.
