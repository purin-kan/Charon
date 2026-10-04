# Handoff A: physical workshop kit and artwork

## Assignment

Build the complete print-and-cut workshop version of The Ferryman v0.6 from `SHARED_RULES.md`, the two supplied guides and the recorded user clarifications. The physical workshop kit is a primary deliverable. Do not substitute browser screenshots, a rules-only PDF or a digital-only demo for usable paper components.

The user explicitly prioritizes printing and cutouts. The original guide requests a print style similar to the HTML demo and missing character, memory and map pictures. The edited guide requires six destination maps excluding the shore, with the user controlling map order and shuffling. Sources: original P084-P085; edited P055-P070; `sources/USER_CLARIFICATIONS.md`.

## Ownership and coordination

Own `outputs/The_Ferryman_v0.6/print/`, `art/`, `assets/art/`, `tools/print/` and print-specific records in `verification/print/`. Worker B owns browser files, machine-readable rules and final packaging. Both workers use the stable IDs in the shared rules. Do not change gameplay numbers to fit the page.

Start by sending or supplying B the intended asset manifest schema: component ID, image path, source/provenance, license or generation record, crop notes, resolution, and hash. B should supply a machine-readable content export matching `SHARED_RULES.md` before final text is typeset. A can draft layout and art while that export is prepared. Keep task branches or agreed disjoint folders if both work in the same repository. Do not push or spawn other agents without separate user authorization.

## Required physical deliverables

1. `print/Print_and_Play_v0.6.pdf`: complete, color A4, single-sided kit for one player station. This is the file to print in full.
2. `print/Cutout_Sheets_v0.6.pdf`: the same final cut-piece pages extracted from the complete kit, for replacement sets. Clearly say not to print both PDFs for an ordinary single set.
3. `print/Player_Guide_v0.6.pdf`: separate one-page player reference, identical to its page in the full kit. It covers the sequence and points to the full rules rather than squeezing all rules into tiny text.
4. `print/Assembly_and_Setup_v0.6.pdf`: page ranges, materials, cutting and assembly, component inventory, an illustrated table setup and reset/recycling procedure. The corresponding content also appears in the full kit.
5. `print/Full_Rules_v0.6.pdf`: complete reconciled rules, memory and quest details, and worked examples; identical to the relevant master pages.
6. `print/COMPONENT_INVENTORY.json` and readable `print/COMPONENT_INVENTORY.md`: IDs, quantities, dimensions, page numbers, cut/keep-whole status, and spare/replacement distinction.
7. `print/Workshop_Record_v0.6.pdf`: blank human session record with printer settings, setup time, duration, rounds/cycles, ending reason, unclear rules and feedback. It must not contain invented results.
8. Editable layout/generation sources and all required local fonts/art. Rebuilding must not depend on somebody's Downloads folder or an unavailable machine-specific path.

The complete PDF must be sufficient to assemble and play the paper game with basic stationery and the facilitator's route ordering. No phone, app, internet, QR code or account may be required to understand a printed effect.

## Component coverage

| Component | Required coverage |
|---|---|
| Ordinary souls | Eight unique identities from the shared roster. Large name, destination, seat cost, memory reward and usable anger tracking. |
| PoLong | Two specified base pieces plus at least two clearly labeled spare instance pieces or equivalent reusable instance slips. No extra spawn rule is introduced by extra paper copies. |
| Destination maps | Six distinct illustrated destination pieces, with matching IDs and base fog values; provide a clearly labeled repeat-print option if the facilitator wants duplicates. |
| Starting shore | Separate uncut shore/boarding mat with waiting, arrival-pile and resolved-soul-discard zones. It is not a seventh destination. |
| Boat | Four clearly visible ordinary seats and a separate area for zero-seat PoLong instances. Include a two-seat occupancy marker for Soldier. |
| Memories | Exact fixed rewards for seven rewarding ordinary sources, plus Passage. Child and PoLong have no memory. Use enough copies to support repeated rewards while older rewards remain held. |
| Status and counters | Light 0-6, per-soul Shore/Ship Anger, global outward round and spawn cadence, completed cycles, quest state and hand limit reference. Counters must support endless sessions without a printed cap that ends the game. |
| Route staging | A current-fork area with two options and a concealed staging method for the next two forks so Foresight can be executed physically. Ordering remains the facilitator's choice. |
| References | Memory effects, round order, return order, quest and soul/memory recycling. |

Recommended production allocation for recurring memories: four copies for each of the seven rewarding source souls, plus one Passage, for 29 memory pieces. Three copies of one source's memory can already be held when that same soul is delivered again, so a single original card is not sufficient. A different physical representation is acceptable only if it supports every legal reward and hand choice without adding a gameplay limit. Label repeated copies consistently, for example `SOUL-MERCHANT-MEM-01` through `04`.

Do not assume the original two PoLong pieces are always enough after memories become renewable. A held set of Calm memories can prolong an instance while later arrivals occur. Extra physical copies are supplies, not a maximum legal number of active tainted souls. Verify the worst reachable overlap; include a reusable blank instance template if needed.

Use writable or extendable round/cycle counters rather than treating the edge of a numbered track as a game ending. A three-position arrival reminder may supplement the written global round count but does not replace it in logs.

## Printing and cutting requirements

- A4, color, single-sided, actual size / 100 percent. No duplex alignment or booklet printing is required.
- Preserve at least 10 mm safe page margins. Put cut borders, card text and calibration marks inside the printable region.
- Include a labeled 50 mm calibration line or square on the first page.
- Clearly mark CUT pages and KEEP WHOLE pages. Show exact final page ranges and copies per station after pagination is final.
- Use straight cut lines and practical gutters. Avoid intricate silhouettes as required gameplay pieces. Scissors should be sufficient; a paper cutter can be optional.
- Target at least 11 pt for gameplay text, never reduce primary effects below 10 pt merely to meet a page count. Small IDs can be smaller if visibly secondary.
- Prefer markers at least 12 mm across and tracking spaces large enough to handle them. If a card cannot accommodate legible tracks, use a clear adjacent tracking mat or writable field.
- Use high-contrast light text panels for effects and a consistent illustrated border style. Do not rely on color alone for destination, seat or anger meaning.
- Provide exact dimensions. Choose card sizes for usable art and text rather than assuming the previous kit's sizes. All copies of the same component class should match.
- Use opaque cardstock, or plain paper mounted to opaque card, for shuffled and concealed components. Show how blank backs preserve hidden route information; optional backs must not require precise duplex alignment.
- State basic supplies: printer, paper/card, scissors, pencil/eraser and optional glue for mounting. Do not require people to invent or handwrite missing rules on components.
- Print enough genuine play pieces in the complete master kit. Do not hide required copies in an optional supplement.

Do not claim a page count before the finished export. Calculate pages and component totals from the inventory, then generate the printing instructions from those values.

## Artwork and visual continuity

Inspect the current v0.5 browser presentation and its existing art before choosing the matching print treatment. Its files are reference material, not authority for new rules. Reuse suitable original images without modifying older files. Verify actual image identity rather than assigning a renamed portrait without review.

The v0.5 asset inventory includes Mother, Child, Merchant, Cook, Mason and soldier portraits; it does not establish complete coverage for the new roster and destinations. Audit Keeper, Poet, PoLong, Acheron, River Styx, all memory effects and Passage explicitly. `musician.png` is not automatically an approved Poet portrait. Generate or supply missing images through the available image-generation workflow when the build is authorized. Record prompts, sources, output paths, hashes and any crops. Preserve font licenses.

Each of the six destination pieces should have its own recognizable scene, readable name and large fog value. The shore is visually distinct. Soul and memory art must leave enough room for clear gameplay information. Do not use placeholder initials as the final answer to the request for missing pictures unless a generation limitation is explicitly reported.

Deliver reusable image files for B, not only flattened PDF crops. Make local resolution suitable for the intended print size. Prefer approximately 300 pixels per printed inch for raster artwork; inspect at the real size. This is a production target, not a claim about existing assets.

## Verification and acceptance

Run the appropriate PDF/document skill workflow at build time. Render every page of the final master PDF and visually inspect it. Re-render after any layout or text change. Separately check:

- Every required component ID and copy appears in both the inventory and actual pages.
- No clipped text, overlaps, missing glyphs, illegible effects or unsafe cut lines.
- Actual page dimensions, embedded fonts, margins, cut-piece sizes and calibration marks.
- Extracted guide, rules and cutout PDFs match the corresponding final master pages.
- Printed effects exactly match B's shared content, including endless recycling, immediate zero-Light loss, fresh memories, quest state and facilitator map control.
- Desk-walk setup, first departure, third-round spawn with a full boat, foresight reveal, ordinary delivery, repeated soul/memory reward, Calm on PoLong, simultaneous expiries, quest success/failure, Passage ending a cycle, hand overflow, shore expiry before healing and reset.
- Verify enough physical memory and PoLong supplies for legal situations. A missing piece must not impose an unstated rule.
- The kit can be reset and reused. Clearly distinguish soul discards from used-memory reserves.

Record automated checks and agent desk walkthroughs as such. Actual print scale, cut handling, opacity, human rule learning, duration, enjoyment and balance remain NOT_RUN until a person checks them. Include a short human checklist rather than fabricating a pass.

## Delivery to B

Provide all final PDFs, component inventory, art and source manifests, editable print sources, licenses and print verification records. Give B the final filenames, page counts and known limitations. B must rebuild the final ZIP after importing these files. A final release without the full usable kit fails this assignment even if the browser works.
