# The Ferryman v0.5: One Night on the River

A single-player prototype based on the supplied Guy feedback. One ruleset supports the browser and a complete paper game. Four trips, eight wishes and a final return are provisional balance values. The 20-30-minute duration is a target, not a measured result.

## Play and print

- Open `index.html` in a browser, keeping this whole folder together. No installation, account or network is needed by the game.
- Send `print/Print_and_Play_v0.5.pdf` to a printer: A4, color, single-sided, actual size / 100%, one copy per player. Do not select booklet printing or fit-to-page.
- `print/Player_Guide_v0.5.pdf` is a separate one-page reference. It is already included in the complete kit.
- Follow the first PDF page for exact page ranges and assembly. Use opaque cardstock for shuffled pieces; ordinary paper can be mounted to opaque card. Blank backs are intentional. No aligned duplex printing is needed.
- Keep the full-size mats and rules sheets uncut. Cut cards and tokens along their outer borders. Use a pencil and eraser to write and reset waiting deadlines.

Read [complete rules](RULES.md), [design decisions](DESIGN_DECISIONS.md), [design workbook](DESIGN_WORKBOOK.md) and [validation](VALIDATION.md). Older v0.4/v0.3 components use different rules and must not be mixed with this kit.

## Local saves

The browser autosaves committed actions to its own v0.5 storage key. Export a JSON save for a portable backup. Import validates the version, counters, component conservation and crossing preview before replacement. Old game saves are incompatible. New Night asks before replacing local progress. A test URL with `?qa=1` uses a separate save key, preserving normal player saves.

For a local web server, any static server can serve this directory. The game also uses plain script tags and relative files for direct-file use. Browser-specific storage restrictions may require export/import rather than autosave.

## Editable sources

`content.json` contains card text, quantities, shared settings and guide copy. `rules.json` contains the detailed rules. `tools/build.py` generates the browser data wrapper, printable PDFs, rules Markdown, component inventory and provenance. The browser engine and PDF generator use the same content source. `tests/engine-check.js` checks the rules; `tests/simulation.js` records a synthetic policy experiment. These scripts use existing Node.js, Python/reportlab/pypdf and Poppler; playing the deliverables requires none of them.

The build reuses eight existing v0.4 character portraits, plus five v0.4 river scenes, the wraith scene and three memory images for the browser only, without modifying the original files. In an extracted package it verifies and reuses the bundled copies. New characters use neutral letter emblems, not an asserted final art direction. The PDF embeds reusable fonts and records the source hashes. An unchanged copy of the supplied feedback is in `source/game_feedback.md`.

To regenerate the distribution after changes, run `python tools/package.py`. It includes every deliverable, checks ZIP CRC and compares the contents byte for byte. `PACKAGE_MANIFEST.json` records payload hashes. The local `.gitattributes` preserves release bytes across operating systems.

## Workshop record

Use the final kit page to record a real physical session: printer scale, legibility, setup time, completion time, wishes, ending, confusing rules and decisions. An observer may record the session, but there is exactly one player and no game master.

No enjoyment, balance, actual print handling or human session is established by automated checks. See `VALIDATION.md` for executed checks and remaining physical work.
