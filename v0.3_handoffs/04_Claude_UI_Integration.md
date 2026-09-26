# Prompt 4: Claude, browser interface, integration and release verification

Copy the text below into the second Claude conversation and provide the listed attachments.

---

**Shared-repository warning:** Other workers may be active in this repository. Edit only the files assigned to you. Do not reset, clean, overwrite, revert, move or delete files outside your ownership, including uncommitted work you did not create. Do not use `git reset --hard`, `git clean`, broad restore/checkout commands or stash another worker's changes. If a required fix belongs to another worker, report the exact file and issue to the coordinator instead of changing it. Preserve existing unrelated changes and check the working tree before editing. This warning applies even if another worker's files appear incomplete or broken.

You are Worker D, interface builder and final integrator for The Ferryman v0.3. Worker C owns engine.js/rules-data.js and engine tests; Worker A supplies art; Worker B supplies content. Build the interface in parallel, then integrate their actual deliverables and verify the playable result. Do not wait for finished images to begin.

Read AGENT_CONTEXT.md first, then outputs/The_Ferryman_v0.3_Decided_Rules.md and v0.3_handoffs/SHARED_CONTRACT.md. Read the old demo only as reusable structure/style reference. The rules file overrides its mechanics. If required files are inaccessible, request them; do not pretend to have local access. Follow your environment's browser/tool restrictions. Do not bypass blocked file navigation or claim tool access you do not have.

You own these paths under outputs/The_Ferryman_Digital_Demo_v0.3/:

- index.html, app.js, styles.css and ui/**
- tests/integration/** and verification/browser/**
- README.md, RELEASE_NOTES.md and handoff/integration.md

You may assemble supplied files from other owners and create outputs/The_Ferryman_Digital_Demo_v0.3.zip, but fixes to their source belong to their authors. Preserve the v0.2 folder/ZIP. Do not change root docs, rules, shared contract or engine internals. No push, publishing, dependency installation or sub-agent delegation. If tools cannot write files, deliver full files; if browser execution is unavailable, mark browser checks NOT_RUN and do not call the build verified.

Start with a working static shell and fixtures under ui/ using the exact view schema. Keep fixtures explicitly labeled and development-only. When C provides its first checkpoint, connect createGame/getView/dispatch and remove any simulated gameplay path from release code. All calculations, legality, rewards, predictions and end states come from C. UI state may contain selected cards/routes and dialog choices, but must not maintain a competing game state.

Implement:

- A clear turn-based map with multiple destination choices, visited stops, haven and return-to-shore options. Distinguish one edge/crossing from a full cycle.
- Visible boat occupancy, starting-shore passengers and waiting anger. Click/tap and keyboard controls for boarding/unboarding. No hover-only essential information.
- Lantern, obols, hull, reprimands and next quota. One prominent fog number per route plus explicit rocky hull-damage indicator. Show known lethal departure and return-dismissal warnings with deliberate confirmation.
- Destination delivery selection, including a labeled way to deliver nobody and continue. Do not allow preparing/departing before required delivery and event choices resolve.
- One free memory per crossing, source identity, legal optional targets and disabled reasons. Calming, repairs and wraith-release controls follow engine permissions and phases.
- Conditional event reveal and choice flow, a separately opened spoiler reference, discovered annotations and clear-discoveries control.
- Save/resume, new run and JSON export. Store run data and discovery knowledge separately. New Run clears game state without silently deleting the optional knowledge reference. Invalid saves must not destroy a working run. Confirm destructive resets where appropriate.
- Distinct terminal summaries with the recorded cause and statistics. No finite victory or sixth-crossing ending.

Use plain HTML/CSS/JavaScript and local assets only. Load scripts in contract order. Provide working fallback text and labeled image placeholders if A/B deliveries are delayed. Copy complete A/B packs into their agreed locations without renaming identifiers. Render content text safely. Keep temporary art honest and usable without animation. Consider mobile viewport layout and keyboard focus; do not claim real-phone testing from a narrow browser viewport.

Integrate in checkpoints: real engine first, then content, then art. Run C's test command yourself if available and record the result. Independently check the specification against key UI behavior rather than treating C's green tests as sufficient.

Browser verification must cover actual interactions: initial resources; multi-destination travel; no intermediate anger; return anger/wraith timing; free memory and no double play; calming; affordable/unaffordable release; zero light; repairs/rocky warning; wish rewards; delivery/event idempotency; all failure screens; quota information; save/reload and JSON export; new-run reset versus knowledge retention; keyboard interaction; narrow viewport and missing-asset fallback. Use legal play where practical. Any diagnostic seeded state must be labeled a diagnostic fixture, not a complete played run, and must not enable cheats in release.

Record exact steps, expected/observed values, actual screenshots/logs when possible, and coverage limits. Classify failures: mechanics to C, copy to B, assets to A, UI to yourself. Send reproducible evidence, integrate the revised file and rerun affected checks. Do not silently rebalance or claim human enjoyment/learning results.

After integration, remove release fixture dependencies, check local paths and console errors, write launch instructions and release notes, and package the exact delivered folder. Verify the ZIP includes the same engine/content/assets and no stale v0.2 copy. Report hashing/extraction comparison if actually done. Do not call packaging or verification complete when tools could not perform it.

Final handoff: exact files/package, versions and rules snapshot, checks/results, outstanding defects, launch instructions, and the human playtest still required. Provide a concise coordinator update suitable for later insertion into AGENT_CONTEXT.md, but do not edit that root file yourself.
