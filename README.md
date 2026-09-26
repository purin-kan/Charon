# The Ferryman / Charon

An apprentice ferryman game about responsibility, strategy and survival.

**Current design: v0.3 endless prototype. Existing playable build: v0.2.** The new rules are decided; the new game has not been generated in this checkout.

## Start here

Open [START_HERE.html](START_HERE.html) for a clickable project home.

| Task | Start with |
|---|---|
| Build the next version | [v0.3 decided rules](outputs/The_Ferryman_v0.3_Decided_Rules.md) |
| Assign the four AI workers | [Handoff pack](v0.3_handoffs/README.md) and [shared contract](v0.3_handoffs/SHARED_CONTRACT.md) |
| Review decisions and their authors | [Decision log](notes/Decisions_and_Team_Plan.md) |
| Review the team's ideas | [Categorized ideas](notes/categorized%20team%20ideas.md) |
| Play the existing version | [v0.2 browser demo](outputs/The_Ferryman_Digital_Demo/index.html) |
| Find printable material | [Deliverables guide](outputs/README.md) |
| Continue with an agent | [AGENT_CONTEXT.md](AGENT_CONTEXT.md), then [AGENTS.md](AGENTS.md) |

The v0.3 rules supersede conflicting historical proposals. Existing PDFs, the old demo and its recorded results are not updated merely because the Markdown decisions changed.

## Repository map

```text
Charon/
  README.md, START_HERE.html       Project entry points
  AGENT_CONTEXT.md                 Current state and handoff
  AGENTS.md, CLAUDE.md             Agent working guidance
  v0.3_handoffs/                   Four prompts and the shared interface contract
  notes/                          Decision log and categorized team ideas
  outputs/                        Rules, game deliverables, print material and evidence
    The_Ferryman_v0.3_Decided_Rules.md
    The_Ferryman_Digital_Demo/     Existing v0.2 source, assets and verification
    The_Ferryman_Paper_Mockup_Art/ Existing printable kit and artwork
  sources/                        Preserved original-concept extracts and page images
  archive/                        Historical production archive
  temp/                           Ignored scratch notes, when present
  work/                           Ignored scratch/build work, created when needed
```

The next game belongs in `outputs/The_Ferryman_Digital_Demo_v0.3/` when implementation begins. Keep the old demo for comparison. Do not move game files or rename worker-owned paths without updating the handoff contract.

Local `.claude/`, `.remember/` and `.git/` directories are tool/repository state, not game deliverables. They are not reorganized as project content.

## Working in parallel

Use the four prompts in [v0.3_handoffs/](v0.3_handoffs/README.md). Each defines its file ownership and includes the shared-repository warning. Separate worktrees or copies are preferable; shared-checkout workers must preserve each other's changes. Worker D integrates the final files. Do not push or publish from an agent task.

Regular web conversations need the actual attachments. A path on one teammate's computer does not grant another chat access to that file.

## Playing and checking the existing demo

The v0.2 game is local HTML/CSS/JavaScript with no required installation or account. Keep its folder intact. If local-file saving is restricted by the browser, export the play log before closing. Recorded automated browser checks used local HTTP; direct-file and real-device coverage must not be assumed. See [VALIDATION.md](outputs/The_Ferryman_Digital_Demo/VALIDATION.md).

Optional verification with an already available Node.js runtime:

```text
node outputs/The_Ferryman_Digital_Demo/verification/demo-tests.cjs
node outputs/The_Ferryman_Digital_Demo/verification/demo_design_experiments.cjs
```

These commands overwrite their corresponding result JSON files. Do not run them as an organization check or label their old-rule results as v0.3 evidence.

## Team and source context

The supplied submission deadline is September 28, 2026, midnight, Asia/Bangkok. The exact portal cutoff, assessed contents and named responsibilities still need the team's confirmation; see the dated plan in [notes](notes/Decisions_and_Team_Plan.md).

[Sources](sources/README.md) identifies derived concept material and the missing original PDF. [Archive guidance](archive/README.md) explains the historical production ZIP. Older absolute paths, timing plans and rule proposals are historical context, not current instructions.

The organization pass changed navigation and documentation locations, not game mechanics, artwork or recorded playtest results.
