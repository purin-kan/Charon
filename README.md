# The Ferryman / Charon

A paper game design prototype about ferrying souls, and a digital version for testing it together.

## Start here

Open **START_HERE.html** for a clickable project home page. It works with relative links, so the folder can be moved or sent to a teammate.

- **Play:** open [the game](outputs/The_Ferryman_Digital_Demo/index.html) in a browser. Keep the folder together. The game needs no installation or account.
- **Learn:** read [the easy playguide](outputs/The_Ferryman_Easy_Playguide.pdf).
- **Print:** use [the print-and-play kit](outputs/The_Ferryman_Paper_Mockup_Art/Print_and_Play_Kit.pdf) and [assembly instructions](outputs/The_Ferryman_Paper_Mockup_Art/START_HERE.md).
- **Present:** use [the art boards](outputs/The_Ferryman_Paper_Mockup_Art/Presentation_Art_Boards.pdf).
- **Design:** edit [the workbook](outputs/The_Ferryman_Design_Workbook.md); the [PDF](outputs/The_Ferryman_Design_Workbook.pdf) is its reading copy.
- **Discuss:** read [the short opinion](outputs/The_Ferryman_Playtest_Opinion.md) or [full playtest report](outputs/The_Ferryman_Digital_Demo/PLAYTEST_REPORT.md).
- **Plan the next three days:** use [open decisions and the five team lists](outputs/The_Ferryman_Open_Decisions_and_3_Day_Plan.md).
- **Continue with an agent:** start with [AGENT_CONTEXT.md](AGENT_CONTEXT.md). AGENTS.md contains project working rules.

If your browser restricts saving when opening a local HTML file, export your play log before closing. Direct file opening was not browser-automated; the recorded interface tests used a local HTTP preview. See the demo's VALIDATION.md for exact coverage.

## What is included

| Location | Contents |
| --- | --- |
| outputs/ | The original 37 finished files (38 minus the removed demo ZIP) plus the open-decisions/team-plan document, including the workbook, easy guide, print kit, artwork, editable SVGs, playable source, test evidence, opinion and longer handoff prompt |
| sources/ | Cached original-concept text and four page previews; original PDF was unavailable at its former location |
| archive/Production_Work.zip | All 335 pre-transfer production files, preserving work/ paths: builders, source caches, review renders, checks and older drafts |
| AGENT_CONTEXT.md | Current state, deadline, decisions, rules references, evidence and next steps |
| AGENTS.md | Instructions for agents working in this repository |

The original concept PDF itself is not included. Its cached extraction and page previews are identified as derived copies, not the original PDF. The original Codex workspace remains intact.

## Group checkpoint

There are seven members. The user-provided deadline is Monday, September 28, 2026, midnight, in the Asia/Bangkok context. Confirm the exact course-portal timestamp and assessed contents. Member names, assignments, presentation length and actual human playtest results have not been supplied.

Suggested responsibilities: coordinator/submission, rules, playtesting, balance/demo checks, physical kit, narrative/visuals, presentation/rehearsal. These are suggestions, not assigned people.

Before submission: agree the temporary scope, play the unchanged baseline, choose at most one mechanical experiment, synchronize materials, then rehearse the full paper run and reset. The workbook's section 17A/C01 is the readiness checklist. Its old 'coming week' date fields are superseded by the deadline above.

## Sharing and development

Share the complete project ZIP supplied with the transfer, or share this repository's contents. Extract the ZIP first and open START_HERE.html. No localhost address is needed for a teammate's copy. Browser saves are local to that teammate; use Export play log to share results.

The existing Git repository is preserved. No commit or remote push was made during transfer. No license has been invented for your team. Before any public release, the team should choose its own license and distribution terms.

To rerun rule checks, install Node.js separately if needed, then run from this repository:

```text
node outputs/The_Ferryman_Digital_Demo/verification/demo-tests.cjs
node outputs/The_Ferryman_Digital_Demo/verification/demo_design_experiments.cjs
```

Node is optional for verification and is not required to play. Each runner replaces its associated JSON result. Record design changes before rerunning comparisons. The PDF builders are archived; see archive/README.md before using them.
