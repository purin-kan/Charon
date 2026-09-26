# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A paper game design project ("The Ferryman") for a seven-person team assignment, plus a vanilla-JS browser demo that implements the paper rules for digital playtesting. There is no build system, package manager, or framework: the demo is plain HTML/CSS/JS read directly by a browser, and the only tooling is two Node scripts used for rule verification.

For the next version, read `outputs/The_Ferryman_v0.3_Decided_Rules.md` as the authoritative rules and `v0.3_handoffs/SHARED_CONTRACT.md` as the worker interface contract. The v0.3 game is not yet built. The architecture and verification commands below describe the preserved v0.2 demo only.

Read `AGENT_CONTEXT.md` first for current state, open decisions, and the deadline. Read `AGENTS.md` for working rules: it governs how you should operate here and takes precedence over generic defaults (e.g. it forbids silently changing game balance/mechanics, spawning subagents without being asked, and pushing/publishing).

## Commands

Run from the repository root or from `outputs/The_Ferryman_Digital_Demo/`; no install step, no `package.json`, no dependencies: the verification scripts use only Node's built-in modules.

```
node outputs/The_Ferryman_Digital_Demo/verification/demo-tests.cjs
node outputs/The_Ferryman_Digital_Demo/verification/demo_design_experiments.cjs
```

- `demo-tests.cjs`: 32 deterministic rule checks against `engine.js` (worked examples, memory effects, linked souls, quotas, failure states). Non-zero exit code on any failure. Overwrites `demo-test-results.json`.
- `demo_design_experiments.cjs`: seven scripted policies plus two comparison probes exercised against the engine. Not statistical balance evidence, just recorded deterministic runs. Overwrites `demo_design_experiments.json`.

Both scripts resolve `../engine.js` relative to their own location, so keep `verification/` beside `engine.js` when moving files.

To play the demo itself: open `outputs/The_Ferryman_Digital_Demo/index.html` directly in a browser (or via `START_HERE.html` at the repo root). No server or build step needed. Direct `file://` opening and non-Chrome/local-preview browsers have not been fully validated: see `VALIDATION.md` in that folder before claiming new coverage.

## Architecture

### Digital demo (`outputs/The_Ferryman_Digital_Demo/`)

- **`engine.js`**: the entire rules engine. Pure and deterministic: no DOM access, no randomness. Exports via a UMD wrapper (`module.exports` for Node, `root.FerrymanEngine` for the browser) so the same file is `require()`-d by the verification scripts and `<script>`-included by `index.html`. Contains the frozen content tables (`SOULS`, `RESIDUES`, `ROUTES`) and the state machine: `createGame()` builds initial state, `preview(state, selection)` computes the consequences of a candidate move without committing it, and departure/commit functions apply phases in order (Shore → Recall → Departure costs → Crossing pressure/conflict → Arrival rewards → Quota → Decay). Rewards from an arrival can never retroactively fund that same departure or rescue a pressure failure: this ordering constraint is central to the rules and must not be reordered casually.
- **`app.js`**: UI/interaction layer: selection state, calling `engine.js`'s `preview`/commit functions, journal rendering, browser `localStorage` save/reload, and JSON export of the play log. Contains no rules logic itself: it should only ever call into `engine.js` for anything that affects game state.
- **`index.html` / `styles.css`**: structure and responsive layout (narrow-viewport layout moves the crossing preview below selection areas).
- **`assets/`**: the four concept illustrations reused from `outputs/The_Ferryman_Paper_Mockup_Art/`.
- **`verification/`**: the two Node scripts above, their JSON output, and `verification/browser/` (captured browser-driven playtest logs: a full win, a pressure-failure loss, UI observations). These browser logs are recorded evidence, not something to regenerate casually: they represent specific manual/agent-driven runs.

For v0.2 maintenance, workbook sections 5-10 document the legacy trial. For v0.3 implementation, `outputs/The_Ferryman_v0.3_Decided_Rules.md` is authoritative and the worker ownership contract is `v0.3_handoffs/SHARED_CONTRACT.md`. Implement v0.3 separately in `outputs/The_Ferryman_Digital_Demo_v0.3/`; do not apply old six-crossing tests as new-version validation. Preserve evidence files unless a requested verification run explicitly needs to regenerate them. If the packaged demo ZIP (`outputs/The_Ferryman_Digital_Demo.zip`, if present) exists alongside changed source, it is now stale and needs rebuilding: check before treating it as current.

### Repository layout

- `outputs/` contains the current v0.3 rule specification alongside legacy playable/print artifacts. Read `outputs/README.md` for version labels; not every file is current for v0.3.
- `v0.3_handoffs/` contains four worker prompts, coordination instructions and the shared contract. Each worker edits only its owned files.
- `notes/` contains the decision log and categorized ideas. Earlier discussion is not implementation authority.
- `temp/` is existing ignored scratch. Use ignored `work/` for new temporary files.
- `sources/`: cached original-concept text and page previews; the original concept PDF itself is not present (see `AGENT_CONTEXT.md` for why).
- `archive/Production_Work.zip`: pre-transfer `work/` history (Python PDF builders using `reportlab`, source caches, drafts). Historical only; see `archive/README.md` before touching it. Not authoritative, and requires Python/reportlab plus Windows fonts to rebuild PDFs from it: the finished PDFs in `outputs/` don't need any of that to read.
- `.remember/`: session memory buffer/history for this agent's own use across sessions; not game content.

## Working rules that matter for code changes

These are the operational rules from `AGENTS.md` most relevant to making edits here (see that file for the complete list):

- Trial rules, balance, and engine choice belong to the user/team, not to an agent's judgment: don't rebalance or add mechanics unassisted, even if a scripted policy in `verification/` "found a winning plan."
- Numeric or evidence claims (e.g. about play outcomes) must trace to a specific file/field in `verification/` or `verification/browser/`, not be asserted from general impression. Distinguish agent/scripted checks from actual human playtests explicitly.
- Check `git log` / modification times before relying on files under `sources/`, `archive/`, or older workbook drafts: they can be stale or superseded.
- No em dashes, no first-person plural ("we") in slide/presentation text; keep slide bullets short.
- On Windows, use PowerShell with literal paths and UTF-8; avoid heredocs; don't retry recursive deletes into locked directories: report and hand back instead.
- Never `git push`, force-push, delete remote branches, or otherwise publish; that's the user's to do.
