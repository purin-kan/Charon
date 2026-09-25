# The Ferryman / Charon: agent context

Updated September 25, 2026 after adding the open-decisions and three-day team plan in E:\Charon. All paths below are relative to the repository root and remain valid when the folder is shared.

## Immediate context

The user requested that the complete game project and relevant generated files be gathered in E:\Charon for sharing with friends, with agent context included. At transfer, the target was an existing empty Git repository on branch main. The user has since committed the imported files and added CLAUDE.md; inspect current Git history rather than assuming it is still empty. Preserve its .git directory. Do not push or publish.

The user has a seven-member group. Deadline supplied: Monday September 28, 2026, midnight, Asia/Bangkok context. Exact portal timestamp, assessed submission contents, presentation duration, member names and confirmed role assignments remain unknown. Recalculate time remaining when resuming. Prior 'coming week' fields are stale.

The immediate outcome is a paper prototype that showcases the concept. The browser demo lets the team test before printing. Final experience, morality, destination eligibility, ending, progression, engine, platform and art direction remain team decisions.

## Read these first

1. README.md and START_HERE.html: shareable entry points.
2. outputs/The_Ferryman_Design_Workbook.md: editable design baseline, v0.2. Quick summary line 11; decisions line 130; trial rules sections 5-10; showcase checkpoint section 17A/C01; playtesting section 18; optional modules section 19; myth sources/adaptations section 20.
3. outputs/The_Ferryman_Digital_Demo/engine.js: executable base rules. app.js contains interaction and save/export; index.html and styles.css provide the interface.
4. outputs/The_Ferryman_Digital_Demo/PLAYTEST_REPORT.md and VALIDATION.md: observed evidence, interpretation, coverage and limitations.
5. outputs/The_Ferryman_Easy_Playguide.pdf: later four-page accessible guide, generated September 25.
6. outputs/The_Ferryman_Open_Decisions_and_3_Day_Plan.md: all twelve decision IDs and the five requested lists: decisions today, tweaks/tests, temporary settings, seven responsibilities, and dated schedule. Includes owner fields and readiness checkboxes. Recommendations are not team approvals.

The longer outputs/The_Ferryman_Project_Handoff_Prompt.md is preserved as a historical detailed handoff. Its old C: workspace and Downloads paths describe the original environment. This file supersedes those location and repository statements. All finished files now exist under this repository's outputs/. Original files were copied without modifying their historical content.

## Completed artifacts

- Workbook v0.2: editable Markdown and previously verified 53-page PDF, quick summary page 2, paper showcase pages 36-39. No final workbook DOCX exists.
- Paper kit: 13-page Print_and_Play_Kit.pdf; 5-page Presentation_Art_Boards.pdf; four PNG illustrations; four editable SVG assets plus instructions and artwork prompts. Location: outputs/The_Ferryman_Paper_Mockup_Art/.
- Browser demo build 0.2.1 implementing the base trial, with local artwork, preview, journal, notes, browser save/reload and JSON export. No install, framework or account needed to play. Source is under outputs/The_Ferryman_Digital_Demo/; a packaged demo ZIP is also preserved.
- Full agent playtest report, standalone opinion, optional repeatable rule tests and policy experiments, saved browser logs.
- Easy playguide and complete earlier handoff prompt.
- No actual human group playtest, final team approval or completed course submission is known.

## Core trial rules, for orientation

Use the workbook and engine for precise implementation. The following is a summary, not permission to change them.

- Six crossings, four seats, start with two obols and three Standing. Fixed supply S01-S12; refill the shore to five. All information visible, no random events.
- Each boat uses one destination. Elysium: toll one obol, base pressure zero. Asphodel: no toll, pressure one. Tartarus: no toll, pressure two, plus one service obol only after a nonempty arrival. All souls are eligible for all routes in this trial.
- Departure costs must be affordable before arrival. Standing pays memory cost and pressure; exactly enough Standing survives. Arrival rewards cannot rescue a pressure failure.
- Quotas of three obols follow arrivals on crossings three and six. Pressure failure occurs before arrival; quota failure retains arrival rewards and stops before decay.
- Waiting souls receive one normal refusal; separating an available linked pair adds one extra refusal to the waiting partner. Three refusals create a persistent wraith, adding pressure from the next crossing. No appeasement in the base trial.
- Recall up to two memories from a deterministic queue; play at most one for one Standing. New memories enter by source-soul ID. Discard the played card first, then unplayed cards left to right. Recycle oldest discard first when needed.
- R01 protects two; R02 protects three if a two-seat passenger boards; R03 prevents a waiting soul's normal refusal; R04 cancels the soldiers' conflict and protects one; R05 protects two and prevents normal refusal; R06 protects one. Target prevention does not cancel separation refusal.
- Mother/Child and Musician/Listener earn joint memories only when delivered together. Poet protects one with at least two other passengers. Keeper protects one when alone. Red/Blue Soldier conflict adds one pressure once per boat.
- Empty boats remain legal and still face pressure, costs, quotas and waiting-soul decay. No Tartarus service income on empty arrivals.
- Optional events, wishes, route locks, upgrades, forgetting and metaprogression are off.

## Evidence and limits

Recorded September 18 evidence:
- verification/demo-test-results.json: 32 passed, zero failed.
- verification/demo_design_experiments.json: seven deliberate deterministic policies and two branch probes. These are not independent players or statistical balance evidence.
- verification/browser/all-souls-run.json: actual guided browser run won, 12 delivered, zero wraiths, five obols, two Standing. All souls arrived by crossing four; five and six were empty.
- verification/browser/pressure-failure-run.json: actual deliberately warned loss on crossing three, six delivered, one wraith, eight obols, two Standing. Elysium and Asphodel previews survived the same departure; the Tartarus loss was avoidable.
- verification/browser/ui-observations.json: UI text including route previews and an explicitly labelled aborted control test.

Browser tests covered a complete success, pressure failure, targets, save/reload, downloaded exports, reset, future-card reference and a narrow 390x844 viewport. Fixes included scrolling in the tall preview, removal of animated scrolling, a complete card reference and terminal wording. No new browser playtest was performed just by transferring files.

Direct file URL navigation was blocked by the prior browser automation policy. Local HTTP was tested. Do not bypass that restriction or claim automated direct-file launch, real-device, multi-browser, full accessibility or human playtest coverage. The old localhost8765 address is not a hosted site and may no longer be running. Teammates open their own local copy.

## Open decisions and recommended priorities

The group has not approved final answers to workbook D01-D12: primary experience; Charon's authority; routing/access; meaning of Standing; memory structure; ending/quotas; wraith recovery; shore arrivals; river information; destination wishes; progression/forgetting; production scope.

Most urgent observations are ending pace (two empty late turns in the guided win), late-earned memories never reaching the hand, and Faint Memory's cost cancelling its protection in one recorded comparison. Route resource tradeoffs work in the tested examples; narrative identity remains a team question. Full rescue is possible under several fixed policies; this does not prove ease for new players.

For the deadline, prioritize clear rules, a physical rehearsal and reset, complete components and synchronized material versions. Run the baseline with a teammate before selecting one substantial mechanical experiment. Do not silently rebalance because an agent found a winning plan.

Suggested seven responsibilities, not confirmed assignments: coordinator/submission; rules; playtests; balance/demo verification; physical components; narrative/visuals; presentation/rehearsal. Confirm requirements and exact timing first. Aim for a ready package Sunday September 27 evening, with remaining time reserved for final checks and submission.

## Archive and source provenance

sources/Concept_Report_Extracted.txt and sources/concept_pages/ preserve the cached source text and four rendered pages. The original The_Ferryman_Concept_Report.pdf was absent from its former Downloads location at transfer, so do not claim the original PDF was copied.

archive/Production_Work.zip preserves the 335 pre-transfer files from work/, including build scripts, the template resource, source caches, research, render evidence and superseded drafts. Read archive/README.md. Older resume notes and incomplete drafts in that archive are historical and can contradict the final files. Never treat them as the current instructions or approved rules.

## Next action

The transfer and requested team-plan addition are complete. The team plan is linked from README.md and START_HERE.html and included in the refreshed complete-project ZIP. No game rules or recorded playtest results changed. Await the team's next instruction or new playtest evidence. Do not automatically add features, revise the game's balance, commit, push or publish. Use TRANSFER_MANIFEST.json to verify the delivered snapshot; record future approved changes in the workbook and this context.
