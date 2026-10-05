# v0.6 implementation decisions

## Authority and freshness

The local handoff is the repository counterpart of the user's `E:\Charon` references. Git handoff commit `bb4e1d1`, October 4, 2026 23:32:53 +0700, is newer than the v0.5 results commit `f3a39b2`, 21:59:01 +0700. Read the preserved source records in `source/SOURCE_FRESHNESS.json` and conflict resolutions in `source/SOURCE_DECISIONS.md`. Checkout/copy dates are not playtest dates. Earlier package code is a reference only; this package is built by new v0.6 tools.

User clarifications select endless survival, delivered/expired ordinary recycling, fresh memory rewards and the family quest once per run. The full matching contract is generated in `RULES.md`. No substantive new game decisions were needed or approved by B.

## Implementation details

- Facilitator offers are explicit pairs, no random or repeating route algorithm. The first pending pair is normally visible; Foresight reveals at most the current and next two. Consumed offers leave the queue but their complete pairs and chosen destinations remain in a visible cycle ledger, matching paper. Unused offers and that ledger reset on a survived return because the shared rule calls for the next cycle's offers. Older v0.6 saves remain valid; consumed offers already discarded by the earlier implementation cannot be reconstructed.
- Foresight during a return still needs three remaining offers in that cycle and gives no privilege over the next cycle. It is legal but may have no future utility. No new restriction on permitted memory types is invented.
- No memory can be spent for an outward journey lacking its required route data. Passage targeting the sole passenger is the exception because it starts a return instead of travel. Invalid actions work on a cloned state and leave the original unchanged.
- Resolve selected matching deliveries together, then increment every remaining passenger, process expiry in boat order and stop on the first zero-Light event. Return increments waiting anger before processing expiry in shore order. At a fatal interruption, remaining souls may display threshold anger; no later loss, healing or reward is processed.
- Guard lasts through the same crossing's ship expiry and absorbs only the next damage point. It never crosses into a fresh return window. Passage-empty return has its memory allowance marked spent, including after reward overflow.
- Rewards have monotonically increasing instance IDs and source labels. Discards remove held instances without keeping an endless memory history. Logs retain at most 80 entries. Ordinary identity conservation is checked after every transition.
- Save counters use decimal strings and BigInt arithmetic, avoiding Number precision loss. Practical import limits are 5 MB, counters at most 1000 digits and at most 10,000 pending route pairs, with 1000 pairs per input. These are storage protections, not game endings; consumed routes free space and the UI requests additional offers during play.
- Save validation checks version, phase, soul conservation, distinct ordinary/PoLong/memory IDs, seat limits, anger, quest states, reward sources, spawn counter, visibility and pending confirmations. It protects valid state structure, not against a user deliberately editing their own history. Browser autosave preserves the selected memory/route screen and pending confirmation.
- All 23 A artwork originals are integrated byte-for-byte, including the eight newly supplied identities. No earlier character mechanics are inherited from artwork. Final art authority remains with the team.

## Physical supply evidence for A

The engine suite exhaustively explores 23 relaxed PoLong states with one free Calm each round, ignoring Light and finite memory availability. Maximum concurrent instances before travel and after a round are both three. Removing/delivering an instance cannot increase overlap. The specified two base pieces plus two spares cover this bound, while reusable slips remain useful for handling. This is an automated upper-bound model, not a human playtest or a change to spawn rules. Four copies per rewarding source accommodate three old held copies plus its next reward.

## Release boundary

A owns the original print/art delivery. The user's subsequent integration authorization permits combining and resolving discrepancies while preserving both workers. The integrator changes only page 7 spacing, retains original A evidence and archive, adapts B's asset/receipt interfaces to A's actual schemas, and adds the missing browser route ledger. No new game mechanic or art choice is introduced. The complete-release packager requires current exact-byte evidence. No push, deployment, art approval, course upload or human outcome is claimed.

## October 5, 2026: print kit redesign (user request)

The user asked for every printed card and page to match the live browser design, fully dark. All 31 pages now use the Khmer night theme: near-black background, tarnished bronze borders and lines, bone text, Battambang headings and Kantumruy Pro body text. Card art sits in a temple-doorway arch with a lotus finial, cut cards have a bronze cut border and inner frame, and the cover carries the reaper ferryman from the browser. Writing areas (workshop record, dashboard counters, offer-slip checkboxes) are parchment so pencil stays legible. Rules text, card geometry, component counts and artwork are unchanged. Dark full-page printing uses much more ink.

