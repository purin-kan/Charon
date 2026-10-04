# CLAUDE.md

## Current project

The current workshop iteration is v0.5, "One Night on the River": a strictly single-player game with matching browser and paper rules, based only on the supplied [game_feedback.md](game_feedback.md). Read [AGENT_CONTEXT.md](AGENT_CONTEXT.md) first, then [AGENTS.md](AGENTS.md). Status refreshed October 4, 2026 after merging `codex/guyidea-paper-v05` into `main`.

Current authority is [v0.5 RULES.md](outputs/The_Ferryman_v0.5/RULES.md), with [DESIGN_DECISIONS.md](outputs/The_Ferryman_v0.5/DESIGN_DECISIONS.md) separating the feedback from agent-authored details needed for play. Four trips, eight wishes, a final return and the 20-30-minute duration are provisional targets, not human-validated balance. Exact added abilities and values are not final team approval.

## Launch and verification

Open `outputs/The_Ferryman_v0.5/index.html` or use [START_HERE.html](START_HERE.html). Print `outputs/The_Ferryman_v0.5/print/Print_and_Play_v0.5.pdf`: A4, color, single-sided, actual size / 100%, one copy per player. `Player_Guide_v0.5.pdf` duplicates kit page 2. `outputs/The_Ferryman_v0.5.zip` is the verified distribution. See [launch instructions](outputs/The_Ferryman_v0.5/README.md) and [validation](outputs/The_Ferryman_v0.5/VALIDATION.md).

Recorded evidence: 37 passing engine records, zero failures, 200 seeded nights / 4,820 legal transitions; a synthetic policy won 72 of 100 seeds (not a human balance sample); browser winning/losing walkthroughs and desktop/narrow layouts; 16 PDF pages visually reviewed; ZIP bytes verified. The browser interface was later rebuilt in the v0.4 style at the user's request; on it, headless Chromium on macOS replayed the seed 1 win and loss with identical results, 10 browser checks passed and 10 are NOT_RUN (see `verification/browser-results.json`). Export download, direct-file launch, real phones, printing, handling and human play remain unverified or NOT_RUN. Do not replace NOT_RUN entries with inferred results.

From the v0.5 folder: `node tests/engine-check.js` writes `verification/engine-results.json`; `node tests/simulation.js` writes simulation and winning-replay evidence; `python tools/build.py` (reportlab, pypdf, Poppler) regenerates `content.js`, RULES.md, PDFs, inventory and provenance; `python tools/check_artifacts.py` (also pdfplumber) runs static checks; `python tools/package.py` rebuilds and verifies the ZIP. Runners overwrite their evidence. Use `?qa=1` for browser QA so the separate `ferryman-v05-qa` save key preserves player saves.

## Current v0.5 architecture

All runtime files are under `outputs/The_Ferryman_v0.5/`. `content.json` (cards, quantities, settings, guide copy) and `rules.json` (detailed rules) are the editable sources shared by the browser engine and PDF generator. `content.js` is generated from `content.json` and exposes `FerryData`; do not edit it by hand. `engine.js` exposes `Ferry` and CommonJS exports including create, transition, preview, routes, capacity, seats, pressure, matches, validate, save and load. `app.js`, `index.html` and `styles.css` form the interface; saves use `ferryman-v05-night`.

After any rule or component change: edit the JSON sources, run the build, review changed PDF pages, rerun checks and rebuild the ZIP. `.gitattributes` in the folder preserves release bytes. Eight portraits (Mother, Child, both Soldiers, Mason, Cook, Merchant, Musician), five river scenes, the wraith scene and three memory images are reused v0.4 art with recorded hashes; the scenes and memory images appear only in the browser. Other characters use neutral letter emblems, not a final art direction. The shared counter is called anger (engine field `tide`). The browser uses the v0.4 interface style; `app.js` renders and dispatches only. `source/game_feedback.md` is an unchanged copy of the design input.

## Preserved v0.4 browser prototype

`outputs/The_Ferryman_Digital_Demo_v0.4/` is a preserved guided browser prototype with its own [rules](outputs/The_Ferryman_Digital_Demo_v0.4/RULES.md) and [validation](outputs/The_Ferryman_Digital_Demo_v0.4/VALIDATION.md): 35 engine records, 40 browser checks, zero failures, Chrome 154/macOS only. `engine.js` exposes `Ferryman`; dispatch returns `{ok,state,error}` without mutating input. Saves use `ferryman-v0.4-run`. From its folder, `node tests/engine-check.cjs`, `node tests/static-check.cjs` and `node tests/browser-fixtures.cjs` regenerate evidence. Its labeled draft interpretations and memory art remain v0.4-only. No v0.4 ZIP or physical kit exists. The [v0.4 handoff](history/handoffs/V0.4_HANDOFF.md) is completed history.

## Preserved v0.3 checks

With an existing Node.js runtime, run from `outputs/The_Ferryman_Digital_Demo_v0.3/`:

```text
node --test "tests/engine/*.test.js"
node tests/integration/integration-check.cjs
node tests/integration/browser-flows.cjs
```

The integration runner overwrites `tests/integration/results.json`. The browser runner requires local Chrome and writes results, screenshots and exports under `verification/browser/runs/`; it accepts `--chrome` with a browser executable path. `verification/engine/run-verification.cjs` and `policy-experiments.cjs` also write evidence. Preserve recorded evidence unless the requested work calls for a new verification run. Consult [release notes](outputs/The_Ferryman_Digital_Demo_v0.3/RELEASE_NOTES.md) for recorded results and limits.

## Preserved v0.3 architecture

All paths in this section are under `outputs/The_Ferryman_Digital_Demo_v0.3/`.

- `rules-data.js`: frozen rules/content tables exposed as `CharonRules`.
- `engine.js`: deterministic state transitions, view, legality and serialization exposed as `CharonEngine`. Core API: `createGame`, `getView`, `dispatch`, `serialize`, `deserialize`, plus `previewDelivery`. Read [ENGINE_API.md](outputs/The_Ferryman_Digital_Demo_v0.3/docs/ENGINE_API.md) before changing integration.
- `content.js`: player-facing text. `assets/assets.js` and `assets/art/`: current art manifest and revision 2 artwork.
- `app.js`, `index.html`, `styles.css`: interface, persistence, import/export and discovered-event reference. Rules and failure calculations belong in the engine.
- `tests/`, `verification/`: automated checks and dated evidence. `docs/`, `handoff/`: guides and delivery history.

For phase order and boundary behavior use the current rules and engine API, not v0.2's crossing sequence.

## Physical kit and packaging

The current print kit is the v0.5 kit described above (16 A4 pages, 67 cut pieces per player, single player, no game master). The older `outputs/The_Ferryman_Workshop_Kit_v0.3/` uses v0.3 rules and must not be mixed with v0.5 pieces. It contains its PDF, section PDFs, editable sources, art copies, source snapshots, previews and validation. Its companion ZIP is present. Start with its [README](outputs/The_Ferryman_Workshop_Kit_v0.3/README.md) and [physical checklist](outputs/The_Ferryman_Workshop_Kit_v0.3/VALIDATION.md#physical-print-and-rehearsal-checklist). Physical printing and human rehearsal remain NOT_RUN.

`outputs/The_Ferryman_Digital_Demo_v0.3.zip` is referenced in the original integration handoff but absent from this checkout. Do not claim it is available. A new distribution must be assembled and verified from the current folder.

Preserve source snapshots and archived art handoffs inside verified packages. Explain their superseded status in current indexes. Approved rule/layout changes require synchronized sources, print outputs, previews, evidence and packages. Windows `core.autocrlf=true` can change checkout text hashes; distinguish line-ending differences from content changes.

## Legacy material and repository layout

- `Gamelist/` holds soul and memory reference lists from the Guyidea branch.
- `outputs/legacy-v0.2/The_Ferryman_Digital_Demo/` is the preserved v0.2 game. Its old tests do not validate v0.3.
- The workbook, easy playguide, paper mockup kit and older playtest reports are historical and live in `outputs/legacy-v0.2/`. [outputs/README.md](outputs/README.md) labels versions.
- `history/handoffs/v0.3_handoffs/` contains the original browser-worker prompts, workshop follow-up and shared contract; `history/context-log.md` holds dated agent checkpoints. Old paths inside recorded evidence refer to the pre-reorganization layout, see [history/README.md](history/README.md).
- `notes/` retains decisions, ideas and the historical team plan. Earlier suggestions are not current rules.
- `sources/` and `archive/` preserve original-concept and production history. The original concept PDF is absent.
- Use ignored `work/` for scratch files. `temp/`, if present, is also scratch. Local tool-state directories are not deliverables.

## Working constraints

Follow AGENTS.md: preserve user changes; no unsolicited mechanics, balance, final-engine or art-direction decisions; no delegation unless explicitly requested; no push, force-push or remote-branch deletion. Check source freshness and cite actual evidence. Separate automated checks from human playtests. Use PowerShell and UTF-8 on Windows, avoid em dashes, and update AGENT_CONTEXT.md at handoff. The September 28 deadline is historical; submission completion is not recorded.
