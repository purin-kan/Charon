# Artwork and font rights record

All 23 delivered PNG files are project artwork. Fifteen are byte-for-byte copies of existing project art; eight were generated for this v0.6 build using the built-in `image_gen.imagegen` tool. No stock photograph, downloaded web image or external image library was added. `ASSET_MANIFEST.json` records each component mapping, source, dimensions and SHA-256.

The existing records identify the older raster artwork as generated with the built-in image tool. Original prompts and source chains are retained in `source-provenance-v03.json`, `source-provenance-v03-r2.json`, `source-provenance-v04.json`, `source-provenance-v05.json` and `source-memory-art-v04.md`. Old game-mechanic descriptions inside historical records are not v0.6 rules.

`GENERATION_RECORDS.json` contains the exact prompts and tool-output locations for Poet, Keeper, PoLong, Acheron, River Styx, Foresight, Guard and Passage. The original model identifier and random seed were not exposed by the tool. Original PNG bytes are delivered unchanged; the PDF renderer uses centered/upper-center crops and high-quality JPEG encoding only inside the PDFs. It does not modify the source PNGs.

No Creative Commons, public-domain or other third-party open license is asserted for generated artwork. No separate third-party art license is recorded in the supplied project provenance. This file records origin and license status; it does not invent a grant of rights or make a legal clearance claim. Team approval of the final art direction remains a human decision.

Bitstream Vera regular, bold and italic are bundled under their original license. The full copyright and permission notice is included in `../tools/print/fonts/bitstream-vera-license.txt`. Font files are unchanged and embedded in the PDFs. No web-font connection is required to read, print or rebuild the kit.

The new print layout, cut borders, trackers and diagrams are authored generation sources in `../tools/print/build.py`. No new license has been assigned to the project's game rules or layout code by this handoff.
