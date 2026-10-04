# Handoff B: browser game and digital submission integration

## Assignment

Build the next browser version from `SHARED_RULES.md`, coordinate its content with the physical kit worker, and assemble all final game-related files into a portable submission package. The browser and kit must express the same accepted rules. Packaging the old game with new notes is not a completed next version.

The current turn produced this handoff, not the new game. Execute this assignment when the user starts the next build. Preserve earlier versions. No push, deployment or course upload is authorized by this file.

## Ownership and integration contract

Own `outputs/The_Ferryman_v0.6/` browser files, shared `content.json`/rules data, tests, `tools/package/`, top-level docs and final archives. Worker A owns the print/art folders described in its handoff. Use the component IDs from `SHARED_RULES.md` and give A a stable content export before final typesetting.

Define one source of truth for names, values, effects, timings and component identities. Generate browser data, printable card text and rule summaries from that source wherever practical. Record the shared content hash in both browser and print build records. Do not independently rewrite effects in the UI or PDFs.

Resolve differing source wording through `SOURCE_DECISIONS.md`, not by silently falling back to v0.5 mechanics. Any newly discovered substantive rule gap should be recorded and brought to the user; layout, file naming and implementation details can be decided routinely.

## Browser implementation

Retain the useful existing guided interaction style, legible picture cards, visible Light and boat state, and explanatory results. Use the current browser as a visual/technical starting point, not as the rules authority. Preserve existing artwork and older game versions.

Required behavior includes:

- Endless cycles with no hidden three/four-trip cap or fixed wish target.
- Eight unique ordinary souls moving between arrival supply, shore, boat and resolved-soul discard; recycle only resolved souls when refilling an exhausted arrival pile.
- Correct seats, wishes and fixed rewards from the shared roster. Soldier uses two seats. PoLong uses zero seats and unique active instance IDs.
- Global outward rounds drive PoLong arrivals every third round across cycle boundaries. Return and teleport do not increment them.
- Separate Shore and Ship Anger, resetting Ship Anger on boarding, with expiry at two and four respectively.
- Exact ordered fog, prevention, delivery, reward, anger, expiry and return processing. Immediate loss at zero precedes possible reward/healing.
- Renewable memory rewards that can coexist with earlier copies in a three-card hand. Explicit overflow choice, persistent unused cards and one-memory timing.
- PoLong fog from its current Ship Anger, additive across instances and responsive to Calm. Wraiths do not impose continuing fog.
- Once-per-run quest state that survives recycling. Include both normal and Passage rewards and correct Passage behavior when the boat becomes empty.
- Clear voluntary stop/save for workshop sessions without calling it a victory.

### Facilitator-controlled routes

The user explicitly owns ordering, shuffling and handing out maps. Provide a facilitator setup/input mode or importable route queue of two-destination offers, with a clear way to add further offers during endless play. Accept only the six destination IDs. Keep unexposed future offers concealed in the player view until Foresight or ordinary progress reveals them.

Do not revive the assistant's discarded repeating-three-fork algorithm or first-cycle route guarantee as the official mode. If demo/sample offers are bundled, label them as a sample and make them replaceable. When future offers required for travel or Foresight are missing, request facilitator input without consuming cards or advancing game state. The paper staging instructions must support the same reveal behavior.

### Saves and portability

Use a new versioned save format and storage namespace. Do not overwrite user saves from older versions. Validate imports for component conservation, unique ordinary locations, active PoLong IDs, legal counters, memory instances, quest state and route visibility. Export/import and reload should preserve the exact phase and next spawn timing. Confirm destructive New Run actions.

Bundle all runtime assets and use relative local paths. Do not require an account, installation or remote asset host to play. Test direct-file launch if permitted by the approved browser tooling. If direct-file testing is unavailable, document that limitation and the tested local-server path honestly rather than claiming it passed.

## Verification cases

Write focused tests for the rules and important state transitions, including:

1. Ordinary card conservation over multiple reshuffles; waiting/aboard souls are never duplicated into the draw pile.
2. Repeated delivery creates another memory while an older copy remains held; full-hand reward and multiple rewards permit correct discard choices.
3. Guard blocks only the next one damage point and expires at the correct boundary; Fog Shield cannot stop wraith damage.
4. Light hitting zero during crossing stops before delivery; zero during shore expiry stops before return healing.
5. Scheduled PoLong joins a full ordinary boat; correct timing on the third global round spanning short cycles.
6. Multiple PoLong penalties, Calm reducing a penalty, same-round spawn and anger increment, expiry and piece-supply correspondence.
7. Last-chance preferred delivery occurs before Ship Anger expiry. Optional retention remains legal.
8. Child before Mother across cycles; failure states; repeated family arrivals never grant another Passage after completion or failure.
9. Passage targets a normal soul or PoLong, grants correct rewards, uses no outward round and does not trigger a scheduled spawn when it empties the boat.
10. Passage-empty return prevents a second memory; ordinary empty-boat return has its own unused memory allowance.
11. Foresight reveals current and next two forks without exposing additional offers or spending the card when required facilitator data is unavailable.
12. Save/reload/import/export preserves counters, memory copies, quest state, phase and hidden/revealed route information.
13. Long-run execution has no accidental end cap, counter overflow or unbounded retained event-log requirement. Logs may be summarized without altering gameplay.

Use browser tools for the real interface with isolated test saves. Review desktop and narrow layouts, navigation, help, preview/confirmation, hand overflow, route input and error messages. Report actual browser/environment coverage. Simulations and agent walkthroughs are not human playtests and cannot establish enjoyment or balance.

## Final submission folder

Assemble `outputs/The_Ferryman_v0.6_Submission/` as a self-contained release, then create `outputs/The_Ferryman_v0.6_Submission.zip`. The outer ZIP should contain one clearly named root folder and open with a readable `START_HERE.html` plus a plain-text/Markdown equivalent.

Suggested structure:

```text
The_Ferryman_v0.6_Submission/
  START_HERE.html
  README.md
  RELEASE_NOTES.md
  SUBMISSION_INVENTORY.md
  MANIFEST.json
  01_Print_Kit/
    Print_and_Play_v0.6.pdf
    Cutout_Sheets_v0.6.pdf
    Player_Guide_v0.6.pdf
    Assembly_and_Setup_v0.6.pdf
    Full_Rules_v0.6.pdf
    Workshop_Record_v0.6.pdf
    COMPONENT_INVENTORY.json
    COMPONENT_INVENTORY.md
  02_Browser_Game/
    index.html
    app.js
    engine.js
    styles.css
    content.js
    assets/
  03_Rules_and_Design/
    RULES.md
    DESIGN_DECISIONS.md
    DESIGN_WORKBOOK.md
    content.json
    rules.json
  04_Source_and_Assets/
    supplied_guides/
    editable_print_sources/
    build_and_package_tools/
    original_art/
    art_provenance.json
    licenses/
    REBUILD.md
  05_Verification/
    VALIDATION.md
    engine_results.json
    browser_results.json
    print_results.json
    package_results.json
    human_workshop_checklist.md
```

A different structure is acceptable if equally clear and all required material is included. Do not add empty placeholder deliverables or invent a spreadsheet just because older iterations had one; update/include any current design workbook in its actual format. Include source code, editable generation tools, final art and necessary dependencies/assets with license information. Do not bundle `.git`, caches, installed dependency trees, personal browser saves, unrelated Downloads files or obsolete game packages inside the final submission.

The opening page must plainly distinguish Play, Print the complete kit, Read the guide, and View editable sources. Link locally to real files. State that the separate cutout/guide PDFs duplicate portions of the master kit, so users do not accidentally print extra sets. Provide print settings and the exact version label everywhere.

The supplied source DOCX files are provenance, not the final player rules. Keep them under sources, with their hashes and conflict-resolution record. The finalized rules must contain the endless-play corrections throughout.

## Packaging gates

- Obtain A's final artifacts and checks before declaring the release complete.
- Verify every required file exists, is nonempty and opens in an appropriate reader.
- Verify all local links and runtime asset paths after extracting the ZIP into a clean folder.
- Re-run meaningful engine/browser/print checks against the exact packaged content. Compare shared-source hashes and inventories across media.
- Generate a manifest with paths, byte sizes and SHA-256 values. Define self-reporting exclusions to avoid a self-referential hash loop.
- Test ZIP CRC, exact file membership and byte equality against the staging folder. Rebuild the ZIP whenever any payload changes.
- Include a release receipt with actual page/piece counts, test evidence and unresolved human checks. Do not copy old v0.5 pass counts into new results.
- Verify that rebuilding uses bundled source/art paths rather than files outside the package. Document existing tools required for rebuilding separately from playing.
- State actual archive size. Course size limits, deadline, required filenames and rubric remain unknown until the user supplies them.

Prepare the package locally and provide its verified path to the user. Actual course submission remains the user's action unless separately authorized. Do not say submitted or approved by the team without evidence.

## Completion report

Report the complete print-kit link first, then the all-files ZIP and playable game. Summarize what was verified and what still needs actual printing or human play. Update AGENT_CONTEXT.md with current decisions, paths and remaining limitations. Do not stop with a working browser while the physical materials or archive are unfinished.
