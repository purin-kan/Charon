# The Ferryman: playable digital paper trial

Ready for the team's first digital test. Rules follow workbook v0.2; interface build 0.2.1. The separate [playtest report](PLAYTEST_REPORT.md) includes a quick summary, observed runs, design concerns and a team checkpoint.

## Open and play

Double-click **index.html** in this folder. It opens in your browser. Keep this folder together: the HTML, two JavaScript files, style sheet and assets folder are all needed. No installation, account, internet connection or game engine is required.

Use a current desktop Chrome, Edge, Firefox or Safari browser. A larger screen is useful when discussing choices together. The layout also adapts to a narrow screen, with the crossing preview below the selection areas.

If using the ZIP, extract the entire folder before opening `index.html`. Browser checks in this session used the local preview; direct file opening and other browser families have not been independently tested. See [validation](VALIDATION.md) for coverage.

1. Select passengers on the shore, totaling no more than four seats.
2. Optionally choose one memory. If it prevents normal refusal, select a waiting target when one exists.
3. Choose Elysium, Asphodel or Tartarus.
4. Read **This crossing**, then confirm departure. An explicitly warned losing choice remains legal.
5. Review the phase-by-phase result. Continue until six crossings or an early failure.

The first run starts with Asphodel selected, two obols, three Standing, and souls S01-S05. Opening memory zones are empty. A New run action asks before resetting your current run and notes.

Expand **All 12 souls and 6 memory rules / reference** to inspect future cards before they arrive. These entries are reference information; select passengers using the cards on the current shore.

## What is implemented

This follows the existing base trial in the design workbook v0.2, sections 5-10: all 12 souls, seat costs, linked pairs and separation, soldier conflict, Poet and Keeper effects, all six memory types, source identity, deterministic queue/discard order, three always-open destinations, tolls, pressure, fares, Standing, quotas, refusals, persistent wraiths, and the six-crossing finish. Optional modules, random events, purchases, upgrades and destination wishes are off. Empty departures are legal.

The screen previews costs and consequences before commitment. Successful arrival rewards cannot fund departure costs or rescue a pressure failure. Failure at a quota retains the preceding arrival but stops before Decay. Newly created wraiths act from the next crossing. The journal records actual phase results.

The game automatically performs Shore and Recall before each planning screen. After a departure, the result explains the resolved phases and the next shore. No timing-based actions are required. There is no undo after commitment, matching the paper trial.

## Saving and team feedback

The demo tries to save your current run, choices and notes in this browser's local storage. Refresh restores it by replaying the committed decisions against the rules. Some browsers restrict local saving for files opened directly; a notice appears if saving is blocked. Do not rely on the browser alone for records you want to keep.

Choose **Export play log** to download a JSON record containing decisions, phase results, final resources, queues, deliveries, notes and timestamps. You can send that file back for analysis. Planning times are elapsed wall time, including pauses and time reading results, not measured active thinking time. Exported records are for review; importing a log is not part of this simple demo.

There is no shared multiplayer session. One person operates the browser while others discuss or observe. Nothing is uploaded. Test records must come from actual team play; the included technical verification is not human playtest or balance evidence.

## Suggested first team test

Give a teammate the opening shore without coaching their choices. Ask them to explain why they selected the passengers and destination. Note any rule they needed help with. Complete a run or resolve the real failure, export the log, and agree one change to test next. Keep the original trial intact until deciding which rule to change.

For a check against the workbook's example, select Mother, Child and Poet for Asphodel on crossing 1, with no memory. Expected result: zero pressure, two obols, six Standing, Mother and Child each leave Joined Memory, and Merchant and Red Soldier gain one refusal each. The next shore adds Blue Soldier, Cook and Mason.

## Files and editable scope

| File | Purpose |
| --- | --- |
| index.html | App structure and instructions |
| styles.css | Responsive visual layout |
| app.js | Selection interface, previews, journal, browser saving and export |
| engine.js | Pure, deterministic base rules and content |
| assets/ | Copies of the four existing concept illustrations |
| VALIDATION.md | Completed technical checks and remaining human tests |
| PLAYTEST_REPORT.md | Design opinion, actual browser outcomes, comparison results and team test template |
| verification/ | Optional repeatable rule checks, deterministic experiments and exported browser test logs |

This is a test interface for the paper design, not a commitment to a final engine, platform, progression system or art direction. The artwork is the proposed ink-and-lantern direction created for the paper showcase.

Source: `../The_Ferryman_Design_Workbook.md`, especially lines 177-244, 274-359 and 666-679. The source was checked by modification time before implementation; this folder has no Git history. The derived component inventory in `work/mockup_content.json` was cross-checked against that source.
