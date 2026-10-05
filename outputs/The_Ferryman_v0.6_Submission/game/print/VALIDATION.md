# Handoff A verification, October 5, 2026

**Historical A-only handoff record.** The results and original master hash below describe A's delivery at commit a62f1493. Integration subsequently increased one section gap on page 7, rebuilt all six PDFs and completed browser parity. Use [current combined validation](../VALIDATION.md) and [current exact-hash receipt](../verification/integration/print-delivery.json). A's unchanged original evidence is retained under `verification/integration/handoff-a-original/`; no human result has been added.

The complete physical kit is digitally built and checked against the accepted shared rules. The master has 31 A4 pages, 78 cut pieces and five keep-whole mats. All six PDFs rebuilt byte-for-byte identically from an unrelated folder containing only A's local inputs. Browser-to-paper comparison awaits B's actual content export. Physical printing and human play checks remain NOT_RUN.

## Digital results

| Check | Result and scope | Evidence |
|---|---|---|
| Build and quantities | PASS: 31 master pages, 78 cut pieces, five mats, six PDFs | [build-result.json](../verification/print/build-result.json), `page_count`, `cut_pieces`, `keep_whole_mats`, `pdf_files`; [inventory](COMPONENT_INVENTORY.json) |
| PDF/file checks | PASS: 18 checks, zero failures | [static-results.json](../verification/print/static-results.json), `counts` and `checks` |
| Every final master page | PASS: all 31 pages rendered at 120 dpi and opened for readable visual inspection; no unresolved clipping, overlap, missing glyphs or cut-border defects | [visual-review.json](../verification/print/visual-review.json), `pages`; [render-receipt.json](../verification/print/render-receipt.json), hashes |
| Supporting PDFs | PASS: all 26 extracted pages independently rendered and pixel-identical to their reviewed master pages; PDF content/text also equal | [extracted-render-comparison.json](../verification/print/extracted-render-comparison.json); static extraction check |
| Printed components | PASS: all 78 individual cut pieces checked by cropped-page text for IDs and applicable seats, destinations, fog and memory effects | Static `Each individual cut piece matches identity and gameplay fields` check |
| Rules desk walkthroughs | PASS: 18 agent scenarios, zero failures; not browser-engine tests or human sessions | [desk-walkthroughs.json](../verification/print/desk-walkthroughs.json), `cases`, `pass_count`, `fail_count` |
| Renewable memory supply | PASS: four copies for each of seven rewarding souls plus one Passage, 29 memory pieces | Static copy/effect checks and [supply-results.json](../verification/print/supply-results.json), `memory_proof` |
| PoLong supply | PASS: four instance cards plus two templates exceed the conservative upper bound of three simultaneous instances in the relaxed state model | Supply `states:29`, `transitions:364`, `max_instances_after_spawn_upper_bound:3` |
| Artwork | PASS: 23 source PNG hashes match the manifest; 15 unchanged reused images and eight newly generated images | [asset manifest](../art/ASSET_MANIFEST.json), [generation records](../art/GENERATION_RECORDS.json), static asset check |
| Independent print rebuild | PASS: six of six rebuilt PDFs byte-identical, all 18 rebuilt static checks pass | [portable-rebuild.json](../verification/print/portable-rebuild.json), `identical_pdf_count`, `pdf_comparisons`, `rebuilt_static_counts` |
| A-only delivery ZIP | See the completed adjacent receipt for exact membership, bytes, CRC and manifest-hash verification | [a-package-check.json](../verification/print/a-package-check.json); [A delivery manifest](A_DELIVERY_MANIFEST.json) |
| B content/browser parity | NOT_RUN: no B-owned content or browser files present at A completion | [b-content-comparison.json](../verification/print/b-content-comparison.json) |

The reviewed master SHA-256 is `e7060289ba37fea763789170dd7796ef6601098d6ce14afe4822dfb226345a2a`. The visual record refers to that exact PDF. Full-size page renders remain in `E:/Charon/work/v06-print/renders/`; they can be regenerated from the delivered PDF using the build instructions. Digital inspection does not simulate printer output.

## Readability and production measurements

Actual PDF page dimensions are 210 x 297 mm. Recorded layout objects remain within the 10 mm safe region. The minimum measured text-to-page-edge distance is 10.5 mm; the minimum text inset inside large cut pieces is 3.719 mm. Small 15 mm markers were separately reviewed. Main memory effects are 11 pt, soul details 10-11 pt, and secondary IDs are 7.5 pt. All used fonts are embedded. The first page carries a 50 mm calibration line. These measurements trace to the static check details and [text ledger](../verification/print/text-ledger.json).

Soul, memory and destination cards are 90 x 112 mm. Main card gutters are 6 mm horizontally and 12 mm vertically. Markers are 15 x 15 mm with 4 mm gutters; card anger spaces are also 15 mm across. Cut-piece coordinates and sizes are in the inventory and [layout ledger](../verification/print/layout-ledger.json). Keep-whole mat size entries describe printed-area bounds; the physical sheet remains full A4.

Minimum effective card-art resolution is 295.6 pixels per inch. The lowest decorative banner resolution is 209.8 pixels per inch; it is a larger shore illustration, not gameplay text. Original PNGs retain their full resolution and bytes. PDF illustrations use high-quality embedded compression with clear text drawn separately. No PDF is a flattened page screenshot.

The memory proof is a supply argument: at most three copies of a source's memory can already be held, and one unique ordinary soul can add at most one new reward for that source before hand overflow. Spent/discarded memories replenish the reserve. The PoLong check exhausts a relaxed finite graph with unlimited one-per-round Calm and free removals, ignoring Light survival and memory scarcity. Legal runs are a subset. Its upper bound proves supply adequacy, not that every modeled state is reachable in the full game or that the game is balanced. Empty-boat returns cannot carry PoLong into another cycle.

## Source freshness and boundaries

Before reliance, tracked source dates and file modification dates were checked and listed oldest-first in [source-freshness.json](../verification/print/source-freshness.json). The latest prior results-changing commit was `f3a39b2`, October 4, 2026 at 21:59:01 +0700. Earlier art, fonts and provenance were flagged POSSIBLY STALE relative to that result commit. They were used only for visual continuity, unchanged font bytes and historical origin, not as v0.6 mechanics or new playtest evidence.

The oldest provenance records are dated September 27, followed by the September 29 v0.4 assets and October 1 memory-art record. Some reused v0.5 asset/font records are dated October 4 at 20:32:49. Accepted v0.6 handoff rules and user clarifications were committed October 4 at 23:32:53, after the results baseline. Local copies preserve those accepted decisions. [Delivery freshness](../verification/print/delivery-freshness.json) records final file dates and hashes; uncommitted build outputs have no Git commit date and are not a new playtest.

A's changes are confined to its five owned folder roots and the requested root project-context update. Prior releases are preserved. The print projection under `verification/print/` is an audit interface, not a competing B-owned shared content source. Missing B input is explicitly recorded; no equality pass was fabricated. [Integration instructions](INTEGRATION_FOR_B.md) give the comparison and final packaging steps.

## Human checks still required

All items below are NOT_RUN. Record observations in the supplied [blank workshop sheet](Workshop_Record_v0.6.pdf), with extra sheets for an endless session.

- Measure the first-page line as 50 mm at actual-size printing, and inspect outer-edge clipping.
- Check color, contrast and dark illustration detail on the intended printer and stock.
- Cut one sample sheet and check card dimensions, readable labels and 15 mm marker handling.
- Check identical opaque backs, soul shuffling and concealment of the next two offer pairs.
- Assemble the station, board Soldier across two seats, handle independent PoLong tracks, recycle souls/memories and reset.
- Ask a person to learn and use the printed rules without app help. Record any ambiguity and facilitator burden.
- Record actual session duration, pacing, enjoyment and balance observations without substituting agent desk checks.
- Obtain team review of the artwork. The agent's continuity inspection is not final art approval.

No human test results, institution-specific submission compliance, hosted deployment, external upload or push are claimed. B owns the combined browser/print/workbook package and its verification.
