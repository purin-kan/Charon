# The Ferryman v0.6: complete physical workshop kit

Start with [the complete print kit](Print_and_Play_v0.6.pdf). Print all 31 pages once per player station, color A4, single-sided, actual size / 100 percent. Disable fit-to-page and booklet printing. Measure the first page's 50 mm line before printing the rest. Keep pages 1-16 whole; cut the marked outer borders on pages 17-31. Do not also print the replacement cutout PDF for a normal single set.

This Handoff A build follows the accepted v0.6 shared rules and recorded user clarifications. It supports endless play, recycled ordinary souls, fresh memories on every eligible delivery, a once-per-run family quest and facilitator-controlled route offers. The kit needs basic stationery and a person supplying route offers. No app, account or internet connection is needed to play.

## Files to use

| Deliverable | Pages | Use |
|---|---:|---|
| [Complete kit](Print_and_Play_v0.6.pdf) | 31 | Print this entire file for one station |
| [Cutout sheets](Cutout_Sheets_v0.6.pdf) | 15 | Replacement set, identical to master pages 17-31 |
| [Player guide](Player_Guide_v0.6.pdf) | 1 | Extra table reference, master page 2 |
| [Assembly and setup](Assembly_and_Setup_v0.6.pdf) | 3 | Master pages 1, 3 and 4 |
| [Full rules](Full_Rules_v0.6.pdf) | 6 | Master pages 5-10, including worked examples |
| [Blank workshop record](Workshop_Record_v0.6.pdf) | 1 | Master page 11, no invented human results |
| [Readable inventory](COMPONENT_INVENTORY.md) and [JSON inventory](COMPONENT_INVENTORY.json) | n/a | Every component ID, quantity, page, size and supply role |
| Original A-only delivery | n/a | Historical archive retained in the development checkout; deliberately not nested in the combined ZIP |

The supporting PDFs retain the master page numbers so instructions remain consistent. The combined package contains all editable print/browser sources and original artwork directly. The original A-only archive remains in the development checkout as `Handoff_A_v0.6.zip`; it is excluded from the combined archive to avoid duplication. [A_DELIVERY_MANIFEST.json](A_DELIVERY_MANIFEST.json) is its historical handoff manifest, not the current combined manifest.

## One station's supplies

The master supplies 78 cut pieces and five keep-whole A4 play mats. The cut pieces are eight ordinary souls, four PoLong cards, six destination maps, 29 memories, six route offer slips, two reusable PoLong templates, 22 markers and one Soldier second-seat marker. The mats are the shore, two boat panels, dashboard and route staging sheet. Counts trace to [the build result](../verification/print/build-result.json) and inventory.

Bring a color printer, A4 paper or opaque card, scissors, pencil, eraser, extra writing paper and optional glue for mounting. Use cardstock supported by the printer, or mount paper on opaque card. Concealed offers and shuffled souls need indistinguishable plain opaque backs. No precise duplex alignment is needed. Place the two boat sheets side by side, with the PoLong lane below the ordinary seats. Keep the shore and memory reserves separate.

Soul, destination and memory cards are 90 x 112 mm. Route slips are 90 x 50 mm. PoLong templates are 90 x 66 mm. Markers are 15 x 15 mm. The Soldier occupancy marker is 90 x 24 mm. Mat bounds in the inventory describe their printed area; retain each full 210 x 297 mm sheet.

Four memories per rewarding source allow three earlier copies to remain held when a new reward is earned. Used and discarded memories return to that source's reserve. Passage is one separate quest reward per run. Extra PoLong pieces do not create extra arrivals or impose a gameplay limit. Each instance keeps its own anger track. Written global-round and cycle counters can continue on extra paper without a game-ending cap. The supply proof is recorded in [supply-results.json](../verification/print/supply-results.json).

The six destination pictures are references, not a prescribed deck order. Mark the six reusable offer slips with the facilitator's chosen current and next two pairs. Conceal unrevealed pairs. Record revealed offers before reusing slips so Foresight information remains available for the cycle. If required offers are absent, pause without spending a memory or advancing time. Optional duplicate map pictures can be printed from master pages 20-21.

## Sources, checks and integration

[Current combined validation](../VALIDATION.md) and [integration receipt](../verification/integration/print-delivery.json) record the completed content comparison, 19 paper-to-engine scenarios, every-page review and portable rebuild. Only page 7 spacing changed during integration, by 3 mm; all six PDFs were rebuilt. [A's original validation](VALIDATION.md) and [instructions for B](INTEGRATION_FOR_B.md) remain as historical handoff notes. Their prior NOT_RUN browser status is superseded by current combined evidence, not by an assumption.

[Editable build instructions](../tools/print/README.md), [art manifest](../art/ASSET_MANIFEST.json), [generation prompts](../art/GENERATION_RECORDS.json) and [rights record](../art/LICENSES.md) are included. All 23 original PNGs remain reusable by the browser. Historical provenance records retain their original project paths; those archival references are not build dependencies. New artwork follows the existing painterly teal, ivory and amber presentation. Team art approval remains a human decision.

Earlier game versions are preserved. No publishing, deployment or external submission was performed.
