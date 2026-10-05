# Rebuild the print kit

This folder is owned by worker A. All fonts, source-rule snapshots and artwork needed for a rebuild are included in the v0.6 directory. No Downloads folder, browser game, account or internet connection is needed at build time.

Requirements: Python 3 with ReportLab, Pillow, pypdf and pdfplumber; Poppler for final page rendering. These were available in the Codex bundled runtime during production. Package versions used are recorded in `../../verification/print/runtime.json`. Printing the already built PDFs needs none of these tools.

From the v0.6 directory, using an available Python executable:

```text
python tools/print/build.py
python tools/print/verify.py
pdftoppm -r 120 -png print/Print_and_Play_v0.6.pdf PATH_TO_RENDERS/master
python tools/print/verify.py --renders PATH_TO_RENDERS
```

Create `PATH_TO_RENDERS` first. Review every resulting master page at readable size. The five supporting PDFs are exact extractions, not separately typeset documents. After a change, rebuild all six, render again and replace the visual-review receipt only after actual inspection. `verify.py` never invents a visual-review pass.

`build.py` parses all roster, destination and exact memory-effect tables from `source-contract/SHARED_RULES.md`. It writes an explicit projection to `verification/print/printed-content-contract.json`. Page prose lives in named functions in `build.py`; the included snapshot is the rule authority and must be reviewed together with any approved revision. Layout dimensions are millimetres from the top-left. The generator checks page bounds and exports every text, artwork and cut-piece rectangle for auditing.

To compare B's shared-content export, derive a JSON projection from B's actual content with the fields described in `../../print/INTEGRATION_FOR_B.md`, then run:

```text
python tools/print/check_b_projection.py PATH_TO_B_PROJECTION.json
```

The print projection is a verification interface, not a replacement shared game-content file. Do not modify B's engine or content from this folder. The compare tool reports omissions/differences and exits nonzero on failure. It cannot prove B's runtime ordering, which needs B's engine/browser checks.

Optional A-only delivery archive: `python tools/print/package_a.py`. This packages only the owned A folders, includes a manifest, and checks ZIP membership, bytes and CRC. It does not build the final A+B submission ZIP.
