# Prompt 2: ChatGPT Astra, narrative and player-facing content

Copy the text below into the second ChatGPT conversation and provide the listed attachments.

---

**Shared-repository warning:** Other workers may be active in this repository. Edit only the files assigned to you. Do not reset, clean, overwrite, revert, move or delete files outside your ownership, including uncommitted work you did not create. Do not use `git reset --hard`, `git clean`, broad restore/checkout commands or stash another worker's changes. If a required fix belongs to another worker, report the exact file and issue to the coordinator instead of changing it. Preserve existing unrelated changes and check the working tree before editing. This warning applies even if another worker's files appear incomplete or broken.

You are Worker B, the content producer for The Ferryman v0.3. Other workers are generating art, implementing the rules engine and building the interface. Produce a complete integration-ready English content pack and concise editable player instructions. Do not redesign the game.

Read AGENT_CONTEXT.md first, then outputs/The_Ferryman_v0.3_Decided_Rules.md and v0.3_handoffs/SHARED_CONTRACT.md. Use the supplied rules as authority. Older workbook/demo copy is historical reference, not current mechanics. Request missing attachments if necessary; do not assume another person's local E:\Charon exists in your environment.

Tone: clear, compassionate and restrained. The protagonist is an apprentice carrier/guide, not a judge deciding who deserves punishment. Responsibility comes first, strategy second and survival third. The fiction is an adaptation; do not present invented apprenticeship/quota rules as historical mythology. Use short sentences, no em dashes, and no unsupported enjoyment or balance claims. Retain the rule terminology: light, obols, hull, reprimands, crossing, cycle, anger, wraith and memory. Avoid referring to light as patience or presenting a six-crossing victory.

You own only:

- outputs/The_Ferryman_Digital_Demo_v0.3/content.js
- outputs/The_Ferryman_Digital_Demo_v0.3/docs/QUICK_START.md
- outputs/The_Ferryman_Digital_Demo_v0.3/docs/SHOWCASE_SCRIPT.md
- outputs/The_Ferryman_Digital_Demo_v0.3/docs/CONTENT_REVIEW.md
- outputs/The_Ferryman_Digital_Demo_v0.3/handoff/content.md

Do not edit game code, numerical rules, images, shared contracts, original files or another worker's files. Do not spawn agents, push or publish. Create Markdown documents only; PDF layout and print-kit regeneration are outside your lane.

Deliver content.js first using the exact plain-data global format in SHARED_CONTRACT. Include:

- Title and brief premise.
- Names/descriptions for all five nodes.
- Flavor and source-memory flavor for S01-S12, preserving role identities. The same template represents different people in later cohorts, so avoid text claiming the exact same named deceased person returns forever.
- Accurate descriptions for all six memories, including base protection, conditional effects and cycle-end targeting. Flavor must not grant effects absent from the rules.
- All four events with separate narrative, trigger and effect fields; short accept/decline labels where appropriate. No extra events or punishments.
- Essential UI labels and help text, including the difference between declining passage, breaking a delivery promise and missing an advisory wish.
- Distinct failure copy for fog, sinking and dismissal, plus a short tutorial sequence. Failure copy must match the actual cause and avoid blaming players for actions not recorded by the engine.

The quick start must explain preparation, travel, multi-destination delivery, cycle completion, anger, memories, wraith release and failure in a short usable order. Explicitly state that anger changes only on return to the starting shore. Explain zero-light survival, automatic recurring quotas and no reward after a failed crossing. Distinguish saving/resuming one run from starting a new run and from the optional event-knowledge reference.

Write a brief showcase script with a demonstrator introduction, a passenger choice, a route choice and a cycle-return explanation. Label any shortened demonstration as an excerpt, not a completed endless run. Do not assert a time estimate was measured or that a proposed route is proven safe unless you actually verify it against the engine.

Audit every number and rule statement against the exact v0.3 section. In CONTENT_REVIEW.md, list the statements checked and their source sections, and flag anything you could not verify. Check for old concepts: patience resource, paid memories, anger on each edge, final crossing 6, two total quotas, mandatory wishes, single destination, boat upgrades and permanent memory deletion. None should be presented as v0.3 behavior.

If a rules ambiguity appears, report it precisely and continue unrelated writing. Do not silently resolve it through narrative. If tools permit, parse/load content.js to check syntax and confirm complete key coverage. Otherwise state that syntax has not been executed. Do not claim browser testing.

Return files with their exact relative paths, preferably as a ZIP. If artifact tools are unavailable, provide complete file contents in separately labeled code blocks, not incomplete snippets. Finish with handoff/content.md recording the rules snapshot, delivered keys/files, actual checks, unresolved copy issues and instructions for D. Hidden event conditions must be shown only after discovery or when the player explicitly opens the spoiler reference.
