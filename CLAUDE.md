# CLAUDE.md

## Current project

The Ferryman now has a completed v0.4 guided browser prototype. The physical kit remains v0.3 and uses different rules. Read [AGENT_CONTEXT.md](AGENT_CONTEXT.md) first, then [AGENTS.md](AGENTS.md). Status refreshed September 29, 2026 after completing the resumed v0.4 handoff.

Current authority is [v0.4 RULES.md](outputs/The_Ferryman_Digital_Demo_v0.4/RULES.md), which separates explicit user choices, retained v0.3 defaults and implementation interpretations. The [v0.4 handoff](V0.4_HANDOFF.md) is completed history with paper considerations for a later task. Earlier worker prompts are not instructions to regenerate completed work.

## Launch and verification

Open `outputs/The_Ferryman_Digital_Demo_v0.4/index.html` or use [START_HERE.html](START_HERE.html). Playing needs no installation, account or build step. See [launch instructions](outputs/The_Ferryman_Digital_Demo_v0.4/README.md) and [validation](outputs/The_Ferryman_Digital_Demo_v0.4/VALIDATION.md). The evidence has 35 passing engine records, 40 browser checks and direct-file smoke, with no failures. Browser scope is Chrome 154/macOS at desktop and narrow emulated widths; no human, Windows or real-phone coverage is claimed.

From the v0.4 folder, `node tests/engine-check.cjs` writes engine evidence, `node tests/static-check.cjs` checks links/provenance, and `node tests/browser-fixtures.cjs` generates constructed boundary fixtures in `work/v04/`. `tests/browser-check.js` runs through the browser tool in an isolated context via local HTTP. Adjust its explicit repository/URL constants for another machine. `tests/file-smoke.js` preserves an executed isolated smoke script; a later dedicated navigation attempt reported file URLs blocked. Use HTTP for future agent QA, without bypassing that restriction. Preserve existing browser saves and older versions' evidence.

## Current v0.4 architecture

All runtime files are under `outputs/The_Ferryman_Digital_Demo_v0.4/`. `engine.js` exposes `Ferryman` and CommonJS exports: createGame, dispatch, preview, routes, soul, partner, seats, forecast, deliveryPreview, validate, serialize and deserialize. Dispatch returns `{ok,state,error}` without mutating the input. Phases: boarding, route, memory, review, result, delivery, ended. Result Continue advances only; it must never reapply committed effects.

`app.js` owns safe text rendering, local storage, import/export and focus; game calculations stay in the engine. `index.html`, `styles.css` and 20 unchanged PNGs in `assets/` form the standalone runtime. Saves use `ferryman-v0.4-run`; discoveries use `ferryman-v0.4-discoveries`. v0.3 imports reject without replacing the current run. Input limit is 5 MB.

Keep the draft interpretations labeled in RULES.md: retire events requiring removed resources, require delivery at the final destination, persist results and reject old saves. No replacement rewards or new mechanics are authorized. A user trial comes before a v0.4 physical kit; do not generate it yet. No v0.4 ZIP exists.

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

`outputs/The_Ferryman_Workshop_Kit_v0.3/` contains the current PDF, section PDFs, editable sources, art copies, source snapshots, previews and validation. Its companion ZIP is present. Start with its [README](outputs/The_Ferryman_Workshop_Kit_v0.3/README.md) and [physical checklist](outputs/The_Ferryman_Workshop_Kit_v0.3/VALIDATION.md#physical-print-and-rehearsal-checklist). Physical printing and human rehearsal remain NOT_RUN.

`outputs/The_Ferryman_Digital_Demo_v0.3.zip` is referenced in the original integration handoff but absent from this checkout. Do not claim it is available. A new distribution must be assembled and verified from the current folder.

Preserve source snapshots and archived art handoffs inside verified packages. Explain their superseded status in current indexes. Approved rule/layout changes require synchronized sources, print outputs, previews, evidence and packages. Windows `core.autocrlf=true` can change checkout text hashes; distinguish line-ending differences from content changes.

## Legacy material and repository layout

- `outputs/The_Ferryman_Digital_Demo/` is the preserved v0.2 game. Its old tests do not validate v0.3.
- The workbook, easy playguide, paper mockup kit and older playtest reports are historical. [outputs/README.md](outputs/README.md) labels versions.
- `v0.3_handoffs/` contains the original browser-worker prompts, workshop follow-up and shared contract.
- `notes/` retains decisions, ideas and the historical team plan. Earlier suggestions are not current rules.
- `sources/` and `archive/` preserve original-concept and production history. The original concept PDF is absent.
- Use ignored `work/` for scratch files. `temp/`, if present, is also scratch. Local tool-state directories are not deliverables.

## Working constraints

Follow AGENTS.md: preserve user changes; no unsolicited mechanics, balance, final-engine or art-direction decisions; no delegation unless explicitly requested; no push, force-push or remote-branch deletion. Check source freshness and cite actual evidence. Separate automated checks from human playtests. Use PowerShell and UTF-8 on Windows, avoid em dashes, and update AGENT_CONTEXT.md at handoff. The September 28 deadline is historical; submission completion is not recorded.
