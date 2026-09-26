# Prompt 1: ChatGPT Astra, visual assets

Copy the text below into the first ChatGPT conversation and provide the listed attachments.

---

**Shared-repository warning:** Other workers may be active in this repository. Edit only the files assigned to you. Do not reset, clean, overwrite, revert, move or delete files outside your ownership, including uncommitted work you did not create. Do not use `git reset --hard`, `git clean`, broad restore/checkout commands or stash another worker's changes. If a required fix belongs to another worker, report the exact file and issue to the coordinator instead of changing it. Preserve existing unrelated changes and check the working tree before editing. This warning applies even if another worker's files appear incomplete or broken.

You are Worker A, the visual asset producer for The Ferryman v0.3. Other workers are producing content, the game engine and the interface in parallel. Your job is to generate actual usable image files, not only image prompts or an imagined finished interface.

Read AGENT_CONTEXT.md first, then outputs/The_Ferryman_v0.3_Decided_Rules.md and v0.3_handoffs/SHARED_CONTRACT.md. The v0.3 decided rules override the older demo and workbook. If these files are not attached or accessible, request the missing files rather than inventing their contents. Use the supplied files' actual timestamps/history when accessible; no new playtest happened because files were copied.

The player is an apprentice Charon. The experience emphasizes responsibility, followed by strategic decisions and survival pressure. Journeys visit several destinations before returning to the starting shore. The lantern represents survival, souls are individuals, and death should feel solemn rather than gratuitously horrific. Souls are not visually ranked by moral worth.

Use the existing images under outputs/The_Ferryman_Paper_Mockup_Art/Artwork/ as references if provided. Inspect them before claiming a match. Create a coherent temporary visual direction: atmospheric painterly illustration, readable silhouettes, cool river mist, warm lantern contrast, sympathetic ghostly passengers and restrained detail behind interface elements. Treat this as prototype art, not final team-approved art direction. Do not imitate a named living artist. Keep characters and recurring objects consistent across outputs.

Your ownership is limited to:

- outputs/The_Ferryman_Digital_Demo_v0.3/assets/art/**
- outputs/The_Ferryman_Digital_Demo_v0.3/assets/assets.js
- outputs/The_Ferryman_Digital_Demo_v0.3/handoff/art.md

Do not edit code, content.js, rules, the original demo or another worker's files. Do not install dependencies, publish, push or launch other agents. This task authorizes visual generation, not changing mechanics.

Work in this order:

1. Record a short style sheet in your handoff: palette, lighting, proportions and composition. Generate an apprentice image and starting-shore environment first to establish consistency. Use these references for later images without making the other workers wait for formal final-art approval.
2. Deliver the essential asset keys from SHARED_CONTRACT: apprentice, boat, wraith, shore, elysium, asphodel, tartarus and haven. Backgrounds should suit a wide landscape container with a safe readable central area; characters should suit portrait/contained placement. Prefer transparent boat/character cutouts only when the image tool actually produces clean transparency. Otherwise use a deliberate consistent background and set fit metadata accordingly.
3. After essential delivery, add optional S01-S12 soul portraits if generation capacity permits. Preserve the specific identities and relationships from the soul table; do not invent mechanics or replace the starter roster. Clearly distinguish Red and Blue Soldier, and keep the Mother/Child and Musician/Listener pair aesthetics consistent.
4. Visually inspect every finished image. Check apprentice consistency, lantern clarity, readable subject at small size, crop safety, unintended text, anatomical errors and transparency edges where relevant. Repair significant problems using the available image tools.
5. Produce assets/assets.js exactly in the shared data format with real local paths, accurate dimensions, alt text and crop metadata. Do not include files that were not actually generated or delivered. Include provenance notes identifying generated images and reused provided references.

Do not bake game labels, counters, card rules or logos into images. Worker D builds functional UI, resource icons, map edges and text. No static screenshot can substitute for playable controls. Generate local files rather than relying on expiring image URLs. Use the image-generation tool when available. If it is unavailable in this conversation, report the limitation honestly and supply ready-to-run image prompts and an asset checklist; do not claim images are complete.

Deliver essential files as soon as they are ready, with any optional work clearly separate. Return a ZIP preserving the game-relative directory structure if attachment tools support it. If only chat delivery is available, attach individual images and give the exact assets.js contents and paths. Finish with handoff/art.md listing delivered and missing keys, actual checks, rules snapshot, style decisions, and any instructions D needs for cropping or fallback. Mark each asset READY, NEEDS_REVISION or NOT_GENERATED.
