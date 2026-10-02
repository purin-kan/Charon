# The Ferryman / Charon: agent context

## October 1, 2026: v0.4 memory art delivery

Completed the user's request to work on `v0.4_handoffs/01_Memory_Card_Art.md`. Six new prototype images are saved as `outputs/The_Ferryman_Digital_Demo_v0.4/assets/memory-R01.png` through `memory-R06.png`. [Memory art handoff](outputs/The_Ferryman_Digital_Demo_v0.4/memory-art.md) records each file as READY, exact generation prompts, style, source freshness, tool provenance and SHA-256 hashes. Built-in image generation produced every file; file checks confirm 1536 x 1024 opaque PNGs. All six received agent review at original resolution and 260 x 175 thumbnails. Existing asset hashes are unchanged. These are art/file checks, not browser tests, human playtests or final team approval.

Remaining: integrate the images in the UI and incorporate the supplied provenance records in a separate task, then review the actual card crop and team art direction. Game code, rules and existing artwork were preserved. No push or publishing occurred. The following September 29 status is retained as the completed browser-version checkpoint.

Updated September 29, 2026 after completing the resumed v0.4 handoff. Current status below supersedes the paused draft and dated delivery history.

## Current completed browser version: v0.4

The user authorized generating v0.4 and asked for design clarification. Confirmed: remove hull, reprimands, obols and quotas; retain lantern light and memories; use guided passenger/route/memory/result steps with a small persistent light/boat summary; retain multiple destinations per trip; deliver a browser demo, updated rules and quick start first. A v0.4 physical kit is deferred until the user tries the new flow. Preserve v0.3 as a playable comparison.

The user answered all remaining questions: retain existing soul abilities and all six memory effects, including soldier conflict, special passenger powers and separation anger; every delivery grants a memory and only a matched destination wish restores 1 light; require delivery of all passengers before returning to the shore. No questionnaire answers remain pending.

The user paused for session limits, then explicitly resumed with “do V0.4_HANDOFF.md”. The browser-first handoff is now complete. [Play v0.4](outputs/The_Ferryman_Digital_Demo_v0.4/index.html), [launch/save instructions](outputs/The_Ferryman_Digital_Demo_v0.4/README.md), [rules](outputs/The_Ferryman_Digital_Demo_v0.4/RULES.md), [quick start](outputs/The_Ferryman_Digital_Demo_v0.4/QUICK_START.md) and [validation](outputs/The_Ferryman_Digital_Demo_v0.4/VALIDATION.md). Root navigation points to v0.4 and retains v0.3 as a comparison.

Implemented the guided interface, persistent summary, tactical information, exact fog previews, provisional memory choice/Back, final-destination warning, result/delivery steps, wraith release, help, local resume, confirmed New Run and JSON export/import. Fixed draft planning forecasts, numeric cohort ordering after C99 and save invariants. All 20 reused art copies match their recorded hashes and original v0.3 sources. No artwork was regenerated.

Recorded evidence: [engine-results.json](outputs/The_Ferryman_Digital_Demo_v0.4/verification/engine-results.json) has 35 passing records and zero failures, including 100 seeds / 16,585 randomized legal transitions. [browser-results.json](outputs/The_Ferryman_Digital_Demo_v0.4/verification/browser-results.json) has 40 passes, zero failures and zero JavaScript runtime errors. [file-smoke.json](outputs/The_Ferryman_Digital_Demo_v0.4/verification/file-smoke.json) records direct-file launch, boarding, reload/resume and loaded images. [Static results](outputs/The_Ferryman_Digital_Demo_v0.4/verification/static-results.json) record links, provenance, screenshots and hashes. Browser scope is Chrome 154 on macOS at 1280 × 900 and 390 × 844 CSS pixels, not Windows, other browsers, actual phones or a full accessibility audit. Seven screenshots received agent visual review. These checks do not establish human enjoyment, balance or paper usability.

The browser runner uses an isolated context to preserve existing user saves. Automatic approval review rejected its initial storage-clearing proposal; that rejected script did not run. The accepted isolated runner completed without the risky action. Local HTTP required approved sandbox escalation; no dependencies or account access were used. After the isolated direct-file smoke had run, the dedicated navigator rejected a file URL as blocked. No alternate route was attempted after that restriction was reported. Use local HTTP for future agent browser QA; preserve the smoke as executed evidence, not permission to bypass a restriction.

Implementation interpretations remain labeled, not silently promoted to separately approved mechanics: retire the three events tied to removed resources; retain Shared Farewell; require full delivery at the final destination to prevent stranding; persist result phases and reject v0.3 saves. Save imports are limited to 5 MB and browser storage has practical limits for very long runs. No distribution ZIP was requested or generated. Runtime files are standalone in the v0.4 folder.

Remaining: user/team trial of the guided flow, review of interpretations and art, then an explicitly authorized physical-kit task. [V0.4_HANDOFF.md](history/handoffs/V0.4_HANDOFF.md) retains paper considerations for guided steps, visible tactical facts, component tracking, arithmetic, endless cohorts/memories and separate human/print checks. They are considerations, not new mechanics. Do not generate v0.4 print materials yet. Existing v0.3 paper files and older workbook/PDF examples are preserved and version-labeled.

Freshness: this resumed checkout is `/Users/supa/projects/SIIT/charon` on macOS, beginning clean at `ce12a40` (September 29 handoff commit), after `63f3088`. The handoff's Windows path, uncommitted-work statements and “not playable” status are historical. At the implementation handoff all work remained local, with no delegation, commit, push or publishing. Submission completion remains unknown.

September 29 git delivery authorization: the user subsequently said “push it”, explicitly authorizing committing and pushing the completed v0.4 work, superseding the earlier no-push restriction for this delivery. The current branch is `main`, tracking `origin/main` at `https://github.com/purin-kan/charon.git`. A fresh fetch found both at `ce12a40`, with no divergence. The engine, browser and static records still report zero failures and their stored source hashes match. This checkpoint accompanies the v0.4 commit for a normal fast-forward push. No force-push, remote deletion, deployment, new physical kit or submission is authorized by this request.

## Preserved comparison and physical kit: v0.3

The v0.3 browser game is integrated and the physical workshop kit is generated. Its source, artwork and recorded evidence remain unchanged by the v0.4 continuation. The earlier documentation-only freshness audit is preserved below as history.

- Play: [v0.3 index.html](outputs/The_Ferryman_Digital_Demo_v0.3/index.html). Keep the whole game folder together. [Launch instructions](outputs/The_Ferryman_Digital_Demo_v0.3/README.md) describe direct opening and local HTTP. No installation or account is needed to play.
- Print: [workshop PDF](outputs/The_Ferryman_Workshop_Kit_v0.3/Print_and_Play_Workshop_v0.3.pdf), [assembly guide](outputs/The_Ferryman_Workshop_Kit_v0.3/README.md) and [workshop ZIP](outputs/The_Ferryman_Workshop_Kit_v0.3.zip).
- Rules: [decided v0.3 specification](outputs/The_Ferryman_v0.3_Decided_Rules.md). The user confirmed endless play and delegated the recorded remaining mechanics to ChatGPT. User requirements and delegated choices are labeled separately. Numerical defaults are not human-validated balance.
- Digital distribution: `outputs/The_Ferryman_Digital_Demo_v0.3.zip` is absent from this checkout. Worker D's original package notes are historical. Rebuild and verify a new package if requested.
- Local history includes browser integration commit 0e06ce2 and workshop merge 63f3088. The earlier PR authorization notes below are completed history, not fresh authorization to push or merge.
- Human playtesting, final team art approval and course submission completion are not recorded.

## v0.3 reference files

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

## Archive and source provenance

sources/Concept_Report_Extracted.txt and sources/concept_pages/ preserve the cached source text and four rendered pages. The original The_Ferryman_Concept_Report.pdf was absent from its former Downloads location at transfer, so do not claim the original PDF was copied.

archive/Production_Work.zip preserves the 335 pre-transfer files from work/, including build scripts, the template resource, source caches, research, render evidence and superseded drafts. Read archive/README.md. Older resume notes and incomplete drafts in that archive are historical and can contradict the final files. Never treat them as the current instructions or approved rules.


## Historical checkpoints and reorganization

Dated checkpoints (documentation refresh, handoff preparation, worker content handoff, workshop kit implementation, PR and merge authorizations) moved to [history/context-log.md](history/context-log.md). They are history, not current instructions or authorizations.

September 30, 2026: repository reorganized on branch `organize-repo`. `v0.3_handoffs/` and `V0.4_HANDOFF.md` moved under `history/handoffs/`; v0.2 game, paper kit, workbook, playguide and older handoff documents moved under `outputs/legacy-v0.2/`. v0.3, v0.4, workshop kit and recorded evidence were not moved or edited, so old path strings inside recorded evidence (source snapshots, provenance JSON, hashed v0.3 files) are historical. Path map in [history/README.md](history/README.md). No push or merge has been done.
