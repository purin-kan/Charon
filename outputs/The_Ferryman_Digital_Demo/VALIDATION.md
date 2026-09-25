# Validation record

18 September 2026 | Paper rules v0.2 | Interface build 0.2.1

## Completed

- Pure engine checks: **32 passed, 0 failed**, recorded in [demo-test-results.json](verification/demo-test-results.json). Covers worked opening, capacity, prepayment, the six memory effects, targets, linked separation, conflict, aboard protection, ordered recall/discard, wraith timing, quota timing, empty departures, and terminal outcomes. Runners are included for optional reuse.
- Seven explicit deterministic policy runs and two branch comparisons. Exact inputs and outputs are in [demo_design_experiments.json](verification/demo_design_experiments.json). These are design probes, not audience results or exhaustive state-space coverage.
- Actual browser success: six crossings, 12 delivered, no wraiths, 5 obols and 2 Standing. Actual browser failure: crossing 3 pressure loss, 6 delivered, one wraith, 8 obols and 2 Standing. Exported logs are in [verification/browser](verification/browser/).
- Capacity and target guards: overcapacity disabled departure; a selected Joined Memory required a waiting target. Selecting Mason enabled departure, and his normal refusal was prevented in the resolved result.
- Persistence: selected passengers restored on reload; a completed run and written notes restored on reload. Export created JSON files in Downloads; the actual downloaded records parsed successfully and matched both final outcomes. A browser automation download-event wait timed out, but the files were present and inspected, so the export was independently verified.
- Reset: warning dialog offered export before clearing the run and notes. Reset returned to 2 obols, 3 Standing and the initial shore.
- UI fixes: bounded scrolling in the tall desktop preview; removed animated page scrolling; exposed all 12 souls and 6 memory effects in a reference; corrected terminal empty-shore wording. Asset version tags load the current UI instead of older browser-cached files.
- Final reference check: all 12 soul entries and all 6 memory effects rendered; Listener's future stats, relationship rule and residue were readable before arrival. Reference entries are separate from boarding buttons.
- Responsive smoke test at 390 by 844: no horizontal page overflow, passenger selection and departure worked, opening result matched the desktop outcome. Viewport override was reset afterward. Desktop final viewport was 1280 wide with document width 1265, including the browser's scrollbar arrangement.
- No error-level browser log entries were returned at the completed success, failure, or subsequent reference checks. This is not a claim that every possible UI path has been exercised.

## Limits

- No human playtests, accessibility audit, physical phone test or multi-browser test has been completed. A narrow browser viewport is not a real-device test.
- Browser automation blocked direct `file:` navigation. I did not bypass that restriction. Testing used the local HTTP preview. The app has local classic scripts and images, no fetched data or external dependencies, and is designed to open directly from `index.html`; this launch path still needs a manual check in the team's browser.
- Local saving depends on the browser's storage policy, especially for local files. A visible notice handles a failed save; export is the portable record. Private-mode or blocked-storage behavior was not separately forced during this session.
- Quota-failure edge cases are covered by engine tests. The actual browser loss run exercised pressure failure.
- Repeated automated policies are not independent players and do not measure enjoyment, learning time or balance. Planning timestamps include pauses and result-reading time.

## Source freshness

`git log -1 --format=%ci -- <file>` was attempted for every substantive source listed below. This workspace is not a Git repository, so no latest-results commit or commit-based stale comparison is available. Modification times were checked instead. Order below is oldest first, in local time on 17-18 September 2026.

| File | Modification time | Use |
| --- | --- | --- |
| `../The_Ferryman_Design_Workbook.md` | 17 Sep, 18:41:03 | Versioned paper-rule baseline |
| `engine.js` | 18 Sep, 01:58:08 | Current unchanged engine exercised by all saved checks |
| `verification/browser/all-souls-run.json` | 18 Sep, 13:48:29 | Downloaded browser success record |
| `verification/demo-test-results.json` | 18 Sep, 13:48:46 | Current engine checks |
| `verification/demo_design_experiments.json` | 18 Sep, 13:48:46 | Current engine policy comparisons |
| `styles.css` | 18 Sep, 13:50:43 | Final scrolling behavior |
| `app.js` | 18 Sep, 13:51:32 | Final reference and terminal-copy fixes |
| `verification/browser/pressure-failure-run.json` | 18 Sep, 13:52:49 | Downloaded browser pressure-loss record |
| `index.html` | 18 Sep, 13:54:29 | Updated asset versions and reference structure |

The saved success result predates the final interface-only fixes. It remains evidence for the unchanged rules and that run's choices, not a screenshot or full validation of the final UI. The final catalogue, selection and responsive checks were performed after those fixes. Old pause notes claiming that no executable game exists are **STALE** and have been superseded by this delivery and the updated resume note.

The engine tests can be rerun with optional Node.js using the commands in [verification/README.md](verification/README.md). Playing the demo does not require Node.js.
