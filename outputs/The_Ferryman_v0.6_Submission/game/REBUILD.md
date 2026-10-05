# Rebuild v0.6

Playing uses only bundled browser files and requires no installation or account. For local HTTP, run python3 -m http.server 8766 --bind 127.0.0.1 from this folder and open http://127.0.0.1:8766/. Direct-file launch remains unverified because the browser tool blocks file URLs.

## Existing build tools

Browser/data tests require Node.js with BigInt support. Packaging uses Python 3 standard library and Poppler pdfinfo. Full combined verification also requires the existing ReportLab, Pillow, pypdf and pdfplumber Python packages, plus pdftoppm on PATH. No dependency installation was performed during integration. Print font/art inputs and licenses are bundled. See [print source instructions](tools/print/README.md).

From this game folder, using the available Python environment:

```text
node tools/package/build-content.js
node tools/package/build-assets.js
node tools/package/project-print-content.js
node tests/engine-check.js
node tests/print-parity-check.js
python3 tools/print/build.py
python3 tools/print/verify.py
python3 tools/print/check_b_projection.py verification/B_CONTENT_PROJECTION.json
```

Inspect every final PDF page after any print change. Update verification/integration/visual-review.json only after actual inspection, tying it to the final master SHA-256. Then run:

```text
python3 tools/package/check-print-integration.py --work PATH_OUTSIDE_GAME
```

That command verifies the review hash, reruns parity/static checks, rebuilds all six PDFs in isolation and renders/compares every extracted page. It writes a current integration receipt, not an A worker sign-off.

## Browser and package

Run tests/browser-check.js with the approved Playwright browser tool's file-run capability after navigating to this folder's HTTP index.html. It uses a fresh context and QA save namespace. Save the actual returned JSON as verification/browser-results.json, then run node tools/package/stamp-browser.js. This file is a browser-tool function, not a standalone Node program.

Run python3 tools/package/package.py --prepare to make a candidate archive. Extract it outside this folder, navigate to the extracted game/index.html and run the same browser check. Save that actual result as verification/extracted-browser-results.json, including the tested archive's hash, then stamp it with node tools/package/stamp-browser.js verification/extracted-browser-results.json. All tested runtime bytes must match the final source.

Run python3 tools/package/package.py --complete using the Python environment with the print dependencies. It refuses missing/stale evidence, verifies all links/assets/hashes, and runs engine, paper-parity and exact print rebuild checks after physical extraction. It checks ZIP membership, every byte and CRC, and writes an external archive receipt. Never rename an incomplete archive as complete.

Use --output-parent PATH for a different destination. Unknown staging files are preserved by an error; only previous manifest-managed staging files may be regenerated. The package keeps all editable sources, both supplied original guides, provenance, original art and licenses. Only the nested historical A-only ZIP/checksum and runtime caches are excluded. The two manifest/report self-records are explicitly excluded from recursive hashing.

The original A-only ZIP remains untouched in the development folder. Its package_a.py is an archival worker tool, not the combined release command.
