# The Ferryman v0.6 design workbook

## Current accepted direction

Solo endless survival with 6 Light maximum, four ordinary seats, facilitator-controlled two-destination offers, and loss immediately at zero Light. Eight unique ordinary souls recycle from resolved discard only when arrival supply runs out. Every eligible delivery awards a new fixed memory; Child and PoLong award none. Family quest success or failure persists for the run.

Exact roster, effects, timings and worked example: [rules](RULES.md). Editable source: [content](content.json). Authority and implementation limits: [decisions](DESIGN_DECISIONS.md).

## Deliverable status

| Area | Status | Evidence |
|---|---|---|
| Shared content and stable IDs | Matched to A | `verification/print/b-content-comparison.json`, `PRINT_TEXT.json` |
| Browser engine and save format | Implemented | `engine.js`, `tests/engine-check.js` |
| Guided local browser interface | Implemented | `app.js`, `tests/browser-check.js` |
| Complete paper station | 31 pages, 78 pieces, five mats | `verification/integration/print-delivery.json` |
| Integrated artwork | All 23 original PNGs | `verification/art-integration.json` |
| Local complete submission | Combined; current release gates required | `verification/submission-status.json` and external package receipt |
| Physical and human workshop checks | NOT_RUN | `verification/human-workshop-checklist.md` |

## Review questions for the team

Record facilitator ordering used in each human session; do not infer a default route policy from a test fixture. Observe whether memory overflow, soul recycling, shore expiry and Passage's return allowance are learned without help. Measure actual setup/play time and record voluntary stop separately from Light loss. No target duration, enjoyment or balance outcome has been established for this version.

## Submission information still unknown

Course deadline/portal, rubric, file size/filename constraints, team identifiers, number of stations and actual printer characteristics. These do not prevent local preparation of the combined single-station package. The separately mentioned remote B branch was not visible on either configured remote; preserved local B work is integrated instead.
