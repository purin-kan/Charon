# The Ferryman / Charon: agent context

Updated September 29, 2026 after the repository freshness audit and documentation refresh. Current status below supersedes the dated delivery history at the end of this file.

## v0.4 work in progress, September 29, 2026

The user authorized generating v0.4 and asked for design clarification. Confirmed: remove hull, reprimands, obols and quotas; retain lantern light and memories; use guided passenger/route/memory/result steps with a small persistent light/boat summary; retain multiple destinations per trip; deliver a browser demo, updated rules and quick start first. A v0.4 physical kit is deferred until the user tries the new flow. Preserve v0.3 as a playable comparison.

The user answered all remaining questions: retain existing soul abilities and all six memory effects, including soldier conflict, special passenger powers and separation anger; every delivery grants a memory and only a matched destination wish restores 1 light; require delivery of all passengers before returning to the shore. No questionnaire answers remain pending.

The user then stopped the build because of session limits and requested a root-level handoff. Resume from [V0.4_HANDOFF.md](V0.4_HANDOFF.md). The new folder contains index.html/styles.css, unchanged reused art copies with hashes, and a first engine.js draft. It is NOT yet playable: app.js, rules, quick start and validation remain unfinished. The engine passed a JavaScript syntax check only; no behavioral or browser tests have run. The handoff records confirmed choices, untested implementation interpretations, current files and remaining work. Current launch links still point to completed v0.3. No agents were delegated and nothing was pushed. Do not continue the build until the user resumes it.

The user subsequently requested paper-play considerations in the handoff. V0.4_HANDOFF.md now covers physical guided steps, visible decision information, component-based tracking, retained-ability arithmetic, endless-cohort/memory handling, and separate human/print validation. These are considerations, not additional approved rule changes. Physical-kit generation remains deferred and the build remains paused.

## Current completed version: v0.3

The v0.3 browser game is integrated and the physical workshop kit is generated. The source, artwork and recorded evidence are present locally. The user authorized this documentation refresh after the audit; no mechanics, game code, artwork, PDFs or test evidence were changed.

- Play: [v0.3 index.html](outputs/The_Ferryman_Digital_Demo_v0.3/index.html). Keep the whole game folder together. [Launch instructions](outputs/The_Ferryman_Digital_Demo_v0.3/README.md) describe direct opening and local HTTP. No installation or account is needed to play.
- Print: [workshop PDF](outputs/The_Ferryman_Workshop_Kit_v0.3/Print_and_Play_Workshop_v0.3.pdf), [assembly guide](outputs/The_Ferryman_Workshop_Kit_v0.3/README.md) and [workshop ZIP](outputs/The_Ferryman_Workshop_Kit_v0.3.zip).
- Rules: [decided v0.3 specification](outputs/The_Ferryman_v0.3_Decided_Rules.md). The user confirmed endless play and delegated the recorded remaining mechanics to ChatGPT. User requirements and delegated choices are labeled separately. Numerical defaults are not human-validated balance.
- Digital distribution: `outputs/The_Ferryman_Digital_Demo_v0.3.zip` is absent from this checkout. Worker D's original package notes are historical. Rebuild and verify a new package if requested.
- Local history includes browser integration commit 0e06ce2 and workshop merge 63f3088. The earlier PR authorization notes below are completed history, not fresh authorization to push or merge.
- Human playtesting, final team art approval and course submission completion are not recorded.

## Read these first

1. [README.md](README.md), [START_HERE.html](START_HERE.html) and [outputs/README.md](outputs/README.md): current navigation and version labels.
2. [Decided rules](outputs/The_Ferryman_v0.3_Decided_Rules.md), then current game source under `outputs/The_Ferryman_Digital_Demo_v0.3/`. See [ENGINE_API.md](outputs/The_Ferryman_Digital_Demo_v0.3/docs/ENGINE_API.md) for the implemented API.
3. [Quick start](outputs/The_Ferryman_Digital_Demo_v0.3/docs/QUICK_START.md) and [showcase script](outputs/The_Ferryman_Digital_Demo_v0.3/docs/SHOWCASE_SCRIPT.md). The script still needs human rehearsal.
4. [Digital release notes](outputs/The_Ferryman_Digital_Demo_v0.3/RELEASE_NOTES.md) and [integration handoff](outputs/The_Ferryman_Digital_Demo_v0.3/handoff/integration.md): recorded automated checks and limits.
5. Workshop [inventory](outputs/The_Ferryman_Workshop_Kit_v0.3/COMPONENT_INVENTORY.md), [validation](outputs/The_Ferryman_Workshop_Kit_v0.3/VALIDATION.md) and [handoff](outputs/The_Ferryman_Workshop_Kit_v0.3/handoff.md).
6. [Decisions and team plan](notes/Decisions_and_Team_Plan.md): current decisions followed by historical discussion. Earlier proposed rules and schedule checkboxes are not current implementation authority.

## Evidence and limits

Recorded v0.3 engine results contain 126 passing tests and zero failures in [engine-test-results.json](outputs/The_Ferryman_Digital_Demo_v0.3/verification/engine/engine-test-results.json), fields `counts` and `overall`. The [integration results](outputs/The_Ferryman_Digital_Demo_v0.3/tests/integration/results.json) record 15 passes; [browser results](outputs/The_Ferryman_Digital_Demo_v0.3/verification/browser/runs/results.json) record 30 passes. These are automated checks, not human sessions or evidence of enjoyment/balance. Browser coverage was headless Chrome on macOS, including direct-file opening; no Windows browser, real-device or multi-browser coverage is established.

The workshop [validation record](outputs/The_Ferryman_Workshop_Kit_v0.3/VALIDATION.md) records eight static check groups and thirteen agent walkthrough checks passing. The [kit README](outputs/The_Ferryman_Workshop_Kit_v0.3/README.md) specifies 36 A4 pages: print pages 1-30 for a starter station and pages 31-36 for continuation cohorts. One station, English, A4 and single-sided assembly are production defaults, not confirmed attendance or print budget.

The September 29 audit found the workshop ZIP checksum still matched its [receipt](outputs/The_Ferryman_Workshop_Kit_v0.3/validation/package_check.json). Its nine [source snapshots](outputs/The_Ferryman_Workshop_Kit_v0.3/source/source_snapshot.json) and 44 [reused assets](outputs/The_Ferryman_Workshop_Kit_v0.3/source/asset_manifest.json) matched current sources after normalizing text line endings. Windows `core.autocrlf=true` produces CRLF checkout differences from LF release hashes. The archived ZIP remains the recorded release; do not mistake checkout byte differences for changed content or silently rewrite historical checks.

The original art package is superseded by art-r2. Historical art/content delivery notes retain their original pre-integration status and are superseded by Worker D's integration record. The original art handoff is also embedded in verified packages, so current indexes explain its status without rewriting those snapshots.

## Remaining work

- Complete the kit's [physical print and rehearsal checklist](outputs/The_Ferryman_Workshop_Kit_v0.3/VALIDATION.md#physical-print-and-rehearsal-checklist): printer scale, cutting, legibility, memory opacity, table handling, setup/bookkeeping/reset and a human session.
- Confirm workshop participants/stations, session duration and facilitator assignments. These are not established by the one-station production default.
- Record human feedback separately from automation. Team rules/art review and any approved revisions must be recorded before changing mechanics.
- Rebuild and verify a digital-demo ZIP only if a distributable package is requested. Do not claim an absent package is available.
- The supplied September 28, 2026 midnight deadline is past. Exact portal cutoff and submission outcome remain unknown; do not reuse the old countdown as an active plan.
- Preserve the existing v0.2 game, workbook, easy playguide and paper mockup kit as historical material. They are not v0.3 workshop instructions.
- Follow the user's current request for further scope. No delegation, push, publishing or remote-branch deletion is authorized by this status update.

## Documentation refresh checkpoint

September 29, 2026: updated project navigation, deliverables index, agent guidance, current decision-log status, handoff index and digital package-availability notes. Original rules, artwork, paper outputs, source snapshots, art archives and recorded test results were preserved. Validation for this refresh is limited to documentation links, status consistency and the changed-file diff; it is not a new game, browser or physical playtest.

## Historical records

The following records describe what was known and authorized at each delivery date. Statements such as “not generated” or “remaining integration” below are historical and are superseded by the current state above. They do not authorize repeating completed work.

## Archive and source provenance

sources/Concept_Report_Extracted.txt and sources/concept_pages/ preserve the cached source text and four rendered pages. The original The_Ferryman_Concept_Report.pdf was absent from its former Downloads location at transfer, so do not claim the original PDF was copied.

archive/Production_Work.zip preserves the 335 pre-transfer files from work/, including build scripts, the template resource, source caches, research, render evidence and superseded drafts. Read archive/README.md. Older resume notes and incomplete drafts in that archive are historical and can contradict the final files. Never treat them as the current instructions or approved rules.

## Historical repository organization checkpoint

September 27, 2026: root README.md and START_HERE.html now distinguish the decided v0.3 design from the existing playable v0.2 build. outputs/README.md and notes/README.md map deliverables and history. The decision log moved from the root to notes/Decisions_and_Team_Plan.md; its relative links were repaired. The user's prior move of v0.3_handoffs/ to the root was retained, and worker prompt references now match. The missing collectiveThoughts.md source is labeled absent, not reconstructed. Game, artwork, PDF, evidence, archive and tool-state paths remain unchanged. Staging was not intentionally modified. temp/ remains ignored local scratch; new temporary work belongs in work/.

## Historical handoff-preparation checkpoint

September 27, 2026: prepared v0.3_handoffs/ with four copy/paste handoff prompts, a coordination README and a shared API/content/asset contract. User allocation: two ChatGPT Astra conversations for art and content; two Claude conversations for engine/tests and UI/integration/browser QA. Worker D owns final assembly; file ownership is non-overlapping. Distribute the exact same v0.3 rules and contract to every worker. This task only wrote handoff materials; no workers were launched and no game/assets were generated. Next-generation code target is a separate outputs/The_Ferryman_Digital_Demo_v0.3/ folder, preserving v0.2. Chat-only environments receive attachments and return complete files; actual tool access and executed checks must be disclosed, not assumed from subscriptions.

The requested decision recording is complete. The next authorized scope must be read from the user's current request; this task did not implement a new game. The v0.3 rules are ready to use for implementation, followed by automated/browser checks and human playtesting. Preserve the old prototype as a comparison. Do not push or publish. Update this context when implementation or validation occurs.

## Historical Worker B content handoff

September 27, 2026: the user explicitly assigned the work in v0.3_handoffs/02_ChatGPT_Content.md. Completed outputs/The_Ferryman_Digital_Demo_v0.3/content.js, docs/QUICK_START.md, docs/SHOWCASE_SCRIPT.md, docs/CONTENT_REVIEW.md and handoff/content.md. The content pack covers five stops, twelve soul templates, six memories, four events, thirteen required UI labels, nine required help entries plus fifteen documented additions, three failure causes and seven tutorial steps. The recorded rules SHA-256 is 459d7a8501b5e0674e95e31db09806dd6657117da1470b44a42684d5f9e5cdfb; contract v1 SHA-256 is 2a90fb7c41c0abf086034ef21da23bfdfb7ad5ba343fb08698f44e3ff879528a. No mechanics were changed.

Node.js v25.9.0 syntax/load and content-format verification passed: eleven check groups, zero failures. Local scratch evidence is work/v03-content/check-results.json; the five-file handoff records commands, coverage, source sections and integration instructions. These are content checks only. No engine, browser or human playtest was performed, and the showcase route and duration remain unverified. Event text must remain hidden until discovery or explicit spoiler-reference access. C/D implementation and integration checks, browser verification, human rehearsal and D's full game package remain outstanding. Existing v0.2 artifacts and the rules/contract were preserved. This context note records the handoff as required by AGENTS.md; other workers' deliverables were not edited.

The user subsequently requested a pull request for this completed content work. This request authorizes publishing this task's branch for review. The PR branch is codex/v03-content, targeting purin-kan/Charon:main from the SupaOhm fork because the authenticated account has read access to the upstream repository. The review contains the five content deliverables and this context note. Merge, deployment and course submission remain outside this request.

The user then explicitly authorized merging PR #1 (https://github.com/purin-kan/Charon/pull/1) and pulling the latest upstream changes into local main. At this merge handoff, the authenticated account has WRITE access, GitHub reports the PR mergeable with no reported CI checks, and the reviewed content files still match their recorded validation hashes. Merge authorization supersedes the earlier publishing restriction for this PR only. Engine/browser verification, human rehearsal, deployment and submission are not completed by merging the content pack.

## Historical workshop kit implementation checkpoint

September 27, 2026: the user explicitly requested implementation of v0.3_handoffs/05_ChatGPT_Workshop_Art.md. Completed outputs/The_Ferryman_Workshop_Kit_v0.3/ and outputs/The_Ferryman_Workshop_Kit_v0.3.zip. This supersedes the earlier checkpoint's statement that the v0.3 physical kit was not generated. The complete PDF has 36 A4 pages, with ten matching section PDFs: 24 unique starter soul cards, 32 memory-front alternatives and 24 identical backs, directed board and three mats, 20 obol counters, 48 status pieces, four tracker/ledger sheets, player/facilitator references, four event faces and covers, discovery/observation forms, and six continuation pages. The continuation batch supplies 12 fresh-cohort souls, 16 memory alternatives and 12 backs; printed quantities never cap the endless rules. Defaults remain one station, English, A4 and single-sided assembly, not confirmed attendance or print budget.

Editable Python layouts, structured JSON, 44 needed reused art assets, local licensed fonts, nine source snapshots, all 36 page previews, grayscale samples, a station overview, inventory, provenance, validation and handoff are included. Rules SHA-256 remains 459d7a8501b5e0674e95e31db09806dd6657117da1470b44a42684d5f9e5cdfb. No mechanics, original artwork, old kit, browser game or other worker files were changed. The final repository check was on main at b863aa8; all reused assets and source references still matched their current originals. No dependencies were installed, agents delegated, or files pushed/published during this workshop task.

Recorded checks: eight automated source/PDF check groups passed with zero failures; all 11 PDFs rendered (72 pages including section duplicates), all 36 section pages pixel-matched the complete PDF; all master pages visually inspected, with affected pages checked again after revisions. Minimum text is 10 pt, actual glyphs fit 10 mm page margins, calibration vectors measure 50 mm, cards are 63 x 88 mm and minimum embedded image resolution is 449.6 dpi. Thirteen bounded agent component/rules walkthrough checks passed, covering setup through reset and constructed failure/event states. These are file/layout and agent desk checks, not browser tests or human playtests. The ZIP was rebuilt and its exact contents, CRC and file bytes checked against the final delivery; PACKAGE_MANIFEST.json and validation/package_check.json record current counts and hashes.

All requested file deliverables are marked READY in the kit handoff. Physical printer alignment, actual-size legibility, cutting/handling, memory-back opacity, table readability and human rehearsal remain NOT_RUN. Use kit VALIDATION.md and the blank observation/feedback forms for those checks. No enjoyment, balance, final team art approval, publishing or submission completion is claimed. New temporary work is under work/workshop-kit-v0.3/. Any approved later rule/layout change must rebuild the sources, PDFs, previews, evidence and ZIP together.

The user subsequently requested syncing main with upstream changes and opening a PR for the workshop kit. This explicitly authorizes publishing the workshop branch for review, superseding the general no-push restriction for this task. The branch is codex/v03-workshop-kit, targeting purin-kan/Charon:main. The review includes the complete kit, its verified ZIP and this context checkpoint. Merge, deployment and course submission are not part of this request.

Local main was fast-forwarded to upstream 0e06ce2, which adds Worker D's browser interface, integration checks and browser evidence. That commit leaves the workshop rules/art sources unchanged. The workshop PR branch starts from this synchronized main; those integration files are preserved as upstream work and are not changes introduced by the workshop PR.

September 28, 2026: the user explicitly authorized merging workshop PR #3 (https://github.com/purin-kan/Charon/pull/3) into upstream main. This supersedes the earlier merge restriction for that PR. GitHub reports the reviewed workshop head 232ffcb as mergeable with clean merge status and no reported CI checks; the authenticated account has WRITE access. The PR originates from SupaOhm/Charon:codex/v03-workshop-kit. This was the authorization checkpoint; local history now records the completed merge at 63f3088 on September 28. Do not repeat the merge. Physical print/rehearsal checks, final team art approval and course submission remain outstanding; merging adds no new gameplay or human-test evidence.
