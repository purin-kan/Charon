# Prompt 3: Claude, rules engine and automated verification

Copy the text below into the first Claude conversation and provide the listed attachments.

---

**Shared-repository warning:** Other workers may be active in this repository. Edit only the files assigned to you. Do not reset, clean, overwrite, revert, move or delete files outside your ownership, including uncommitted work you did not create. Do not use `git reset --hard`, `git clean`, broad restore/checkout commands or stash another worker's changes. If a required fix belongs to another worker, report the exact file and issue to the coordinator instead of changing it. Preserve existing unrelated changes and check the working tree before editing. This warning applies even if another worker's files appear incomplete or broken.

You are Worker C, the rules-engine owner for The Ferryman v0.3. Worker D is implementing the browser interface against the attached frozen API. ChatGPT workers are producing art and copy. Build a pure deterministic rules engine and meaningful automated tests. Start now without waiting for art or narrative.

Read AGENT_CONTEXT.md first, then outputs/The_Ferryman_v0.3_Decided_Rules.md and v0.3_handoffs/SHARED_CONTRACT.md. Existing outputs/The_Ferryman_Digital_Demo/ is v0.2 reference only. Preserve it. Use the v0.3 document for behavior, and the shared contract for public interfaces. Report a genuine conflict with exact section references rather than importing old rules or silently rebalancing.

Only edit these paths under outputs/The_Ferryman_Digital_Demo_v0.3/:

- engine.js and rules-data.js
- tests/engine/** and verification/engine/**
- docs/ENGINE_API.md and handoff/engine.md

No UI, art, prose pack or root documentation changes. No remote pushes, publishing, dependency installation or sub-agent delegation. Use available local tools; if your conversation has no terminal/file execution, return complete source files and runnable commands, clearly marked unexecuted. Do not invent test results.

First produce rules-data.js and a minimal real engine exposing the exact global/CommonJS API in SHARED_CONTRACT. Send D an early checkpoint with createGame, getView and dispatch working. Keep public identifiers, action names, phases and return types stable. Document additive fields; route breaking changes through the coordinator before using them. Do not wait to implement everything before giving D a usable integration target.

Implement the full phase machine and all decided rules. In particular:

- Multi-destination travel, visited-node restrictions, normal/rocky edges and the cycle escalation schedule.
- Origin-only loading, capacity, different delivery subsets at successive stops, and one confirmed delivery action including empty delivery.
- Fixed soul order with distinct endless cohort IDs; links/conflicts within matching cohorts only.
- Departure waiting/separation snapshots; anger exclusively on completed return; protected normal anger but not separation; no anger for newly refilled or returned aboard souls; preserve shore overflow.
- Fog then hull failure before arrival rewards; exact-zero light survives; no actions or rewards after terminal failure.
- Return reprimands, dismissal before quotas/recovery, recurring quotas, recovery and refill in the specified order.
- Free memory play, draw-to-three once per stop, seeded discard recycling, no replay/redraw exploits, source-linked memory instances and correct joint delivery rewards.
- Calming expiry, voluntary affordable wraith release, repairs and legal phase restrictions.
- Hidden event predicates with arrival snapshots, automatic versus choice events, once-per-run flags and idempotent effect resolution.
- Advisory wishes and per-soul reward accounting; no mismatch punishment.
- JSON save/load validation with schema version and serializable RNG/state; no localStorage inside engine.

Create engine-owned view projections and previews. Worker D must not have to reproduce arithmetic, reconstruct legal actions or guess failure ordering. Validate actions at dispatch even if the UI has disabled a button. Repeated double-clicks or replayed confirmed delivery/event actions must not duplicate rewards. State logs must support evidence, debugging and failure summaries without revealing undiscovered event conditions through the normal view.

Use Node's built-in test/assert facilities if available. Tests should assert specified outcomes, not copy the engine's formulas into an identical implementation. Include boundary cases and sequences: zero-light release, simultaneous cycle-end causes, newly formed wraith timing, linked pair across cohorts, supply rollover beyond original 12, multiple destination drop-offs, empty delivery, no phase skipping, protected anger/separation, memory draw once, full-cap gains, rocky sinking before reward, quota due cycles, missed quota dismissal, event accept/decline/repeat, malformed saves and deterministic replay.

Maintain a rule-to-test matrix with spec sections and test names. Run tests when able and capture exact commands, runtime versions and results. Agent-generated policies are automated experiments, not human playtests or balance proof. If a boundary is underspecified, report it to the coordinator and continue other tests; do not falsify a pass by changing expected values to match your code.

Deliver complete files, API examples, rule matrix, test command and evidence. Handoff/engine.md must identify rules snapshot, contract version, current limitations and anything D needs to integrate. If delivering a ZIP, preserve paths. Keep engine tests executable without installing dependencies. Mark each validation as PASS, FAIL or NOT_RUN based on actual execution.
