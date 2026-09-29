# v0.4 validation and handoff

September 29, 2026. **Playable browser prototype, with automated checks passed.** This records agent and browser automation, not human playtesting, balance or enjoyment.

## Evidence

| Check | Recorded result | Source |
|---|---|---|
| JavaScript parsing | `engine.js` and `app.js` pass `node --check` | Commands in README; Node runner loads the same engine |
| Pure engine | 35 passing records, zero failures | [engine-results.json](verification/engine-results.json), `counts` |
| Randomized legal journeys | 100 seeds, 16,585 transitions, save invariants checked after each transition | Engine results, `results` entry “Randomized transition coverage”; included in the 35 records |
| Browser interactions | 40 passes, zero failures and zero captured JavaScript runtime errors | [browser-results.json](verification/browser-results.json), `counts`, `errors` |
| Direct-file smoke | Launch, boarding, reload/resume and all five rendered soul images pass | [file-smoke.json](verification/file-smoke.json), `status`, `checks` |
| Static artifacts | Local links, standalone entry references, 20 art copies, screenshots and result records | [static-results.json](verification/static-results.json), `counts`, `results`, `hashes` |

The engine tests cover rewards/cap, both linked pairs, separate/cohort deliveries, all six memories, soldier conflict/Accord, Poet/Keeper/Vigil, normal versus separation anger, remote guard/expiry, refill exemption, wraith timing/release, exact zero, lethal confirmation, route/return constraints, final delivery, Haven, cycle modifiers, card recycling, endless identities including cohorts 99/100, numerical source ordering, all guided save phases, rejected imports and repeated-action protection.

Browser coverage includes a complete Mother/Child/Merchant trip through Elysium and Tartarus and back, then reload and export/reimport of the resulting state. Constructed, engine-validated fixtures cover retained abilities, release to zero, last-destination delivery and failure. These fixtures are not natural player histories. It also checks invalid import preservation, inert imported result text, discovery clearing, New Run accept/cancel, Tab/Enter boarding, Escape/focus restoration, sticky summary and narrow viewport overflow.

The runner creates a fresh isolated browser context, leaving existing user saves intact. An earlier proposed runner was rejected by automatic approval review because it cleared existing local storage. It did not run; the accepted runner avoids that action through isolation.

## Browser and visual scope

Recorded browser: Chrome 154 on macOS, as reported by the user-agent field. Full interaction run: local HTTP. The direct-file smoke ran in an isolated script context. A subsequent attempt to leave the normal browser tool on that file URL was rejected because its navigator blocks the `file:` protocol. No alternative was attempted after that restriction was reported. Preserve the executed smoke record, but use local HTTP for future agent browser checks; do not treat the script result as permission to bypass a tool restriction. Viewports: 1280 × 900 and 390 × 844 CSS pixels. Narrow width is emulation, not a real phone test. No Windows, Safari, Firefox or screen-reader session was recorded.

Agent visual inspection covered these captured screens, with no clipped controls or horizontal overflow observed:

- [Desktop boarding](verification/boarding-desktop.png)
- [Desktop crossing review](verification/review-desktop.png)
- [Desktop run summary](verification/failure-desktop.png)
- [Narrow boarding](verification/boarding-mobile.png)
- [Narrow route](verification/route-mobile.png)
- [Narrow memory](verification/memory-mobile.png)
- [Narrow crossing review](verification/review-mobile.png)

The narrow screens require vertical scrolling, especially with all abilities shown. The light/boat summary stays visible; tactical information is expanded by default. Human testing must establish whether this amount of text works for the intended audience. Keyboard checks are bounded, not a complete accessibility audit.

## Changes from the paused draft

Added the missing interface and guides. Fixed standalone navigation, planning anger forecasts, numeric cohort ordering past C99 and save validation for duplicate sources, impossible collections, memory types and phase/result consistency. Memory choice stays provisional until crossing; rewards/draws occur in engine transitions only. Imported text uses DOM text nodes. Separate discovery storage can be cleared without being repopulated by every later action.

The draft's three interpretations are explicitly labeled in RULES.md: retirement of events tied to removed resources, mandatory delivery at the final destination, and persisted result phases/incompatible v0.3 saves. No replacement currency, penalty, event, final engine or art approval was introduced.

The source freshness baseline is commit `ce12a40` (“handoff 0.4”, September 29, 2026), following the v0.3 workshop merge `63f3088`. The handoff's old Windows path and uncommitted-work statements describe the prior session; the resumed checkout is on macOS and began clean. Checkout modification times are not a new human playtest.

## Remaining work and delivery boundary

- User/team trial of the new guided flow; record confusion, decisions, arithmetic burden, enjoyment and balance separately from automation.
- Review the labeled implementation interpretations and final art direction with the team.
- Actual devices, other browsers and assistive technology coverage remain open.
- v0.4 paper kit, print checks and human rehearsal remain deferred. Use the root handoff's paper considerations when authorized. Do not mix the v0.3 kit with v0.4 rules.
- No distribution ZIP, push, publishing, hosting service, dependency installation or submission was performed. The intact demo folder is the current deliverable. The temporary loopback server is only a verification aid.

Reproduce the checks through [README.md](README.md). Runtime and runner hashes are recorded in the JSON evidence. Preserve older versions' files, packages and evidence. Before distributing a later ZIP, assemble and verify it from the final folder; no package is implied by this validation.
