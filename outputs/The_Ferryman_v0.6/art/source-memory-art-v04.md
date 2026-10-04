# Memory card art, v0.4

Status: **READY for prototype integration**. Generated and reviewed October 1, 2026, Asia/Bangkok. Final team art direction remains pending.

## Deliverables

| File | Card | Status | Visual review |
|---|---|---|---|
| [memory-R01.png](assets/memory-R01.png) | Steadiness | **READY** | Pole grip and upright lantern flame clear; one plausible hand, teal sleeve and ivory cuff. |
| [memory-R02.png](assets/memory-R02.png) | Vigil | **READY** | Single lantern and folded heavy cloak clear; dark river and restrained amber pool. |
| [memory-R03.png](assets/memory-R03.png) | Recollection | **READY** | Empty bowl/place and chair clear; waiting figure and light thread are secondary details. |
| [memory-R04.png](assets/memory-R04.png) | Accord | **READY** | Paired bronze helmets clear; rust-red cloth at left and navy-blue cloth at right match soldier palette. |
| [memory-R05.png](assets/memory-R05.png) | Joined Memory | **READY** | Two light roots merge into a shared bright flame; strongest warm focal glow. |
| [memory-R06.png](assets/memory-R06.png) | Faint Memory | **READY** | One amber light and a pale fading companion; cooler visual echo of R05. |

## Checks actually performed

- Opened all 10 requested reference images before generation.
- Generated 6 separate images using the built-in image tool, in order R05, R06, R01, R02, R03, R04. No revision generations were needed after review.
- Decoded every final file with System.Drawing: 6 PNGs, each 1536 x 1024, Format24bppRgb, opaque. SHA-256 records below.
- Visually inspected every saved PNG at original resolution and every card at 260 x 175 pixels on a contact sheet. No visible letters, text, numerals, frame, icons, logos, gore or glowing eyes found.
- Checked the R01 hand grip, R04 helmet shapes and cloak colors, paired R05/R06 flame motifs, dominant motif readability, full-frame edge clearance and consistency of brush texture and teal/amber palette. Pole shafts, cloth and background scenery intentionally extend off-frame; identifying motifs remain readable.
- Thumbnail labels appear only on the review sheet, never in delivered art. [Local thumbnail review](../../work/memory-art-v04/thumbnail-review.png), [file checks](../../work/memory-art-v04/file-checks.json). These work/ files are tracked review evidence, not required runtime assets.
- Hash comparison against the pre-generation asset snapshot found 0 changes to existing asset files. Game source and rules were not edited.
- These are agent visual and file checks, not human art approval or an in-game/browser test. Actual UI crop, layout, contrast with card text and loading behavior remain for the integration task. The faint companion and distant waiting figure are intentionally secondary at thumbnail size.

## Source freshness and scope

Before use, checked each source with `git log -1 --format=%ci -- <file>` and filesystem modification dates. Oldest first:

| Sources | Last commit (+07) | Freshness |
|---|---|---|
| `assets/apprentice.png`, `assets/elysium-r2.png`, `assets/haven-r2.png`, `assets/PROVENANCE.json`, `assets/S01.png`, `assets/S02.png`, `assets/S04.png`, `assets/S06.png`, `assets/S11.png`, `assets/S12.png`, `assets/shore-r2.png` | 2026-09-29 20:53:47 | POSSIBLY STALE relative to latest results commit; used only as the exact art references requested by the newer handoff. |
| `AGENT_CONTEXT.md`, `engine.js` | 2026-09-29 21:32:22 | Same timestamp as latest results commit eef2c24. |
| `v0.4_handoffs/01_Memory_Card_Art.md` | 2026-09-30 22:50:13 | Current task specification, newer than results. |

Asset modification times were September 29 at 20:40 +07; engine modification time September 30 at 16:37 +07; context and handoff modification times October 1 at 00:01 +07. Modification dates are checkout metadata, not new playtests. Paths beginning assets/ and engine.js are relative to this demo folder; the context and handoff are at repository root.

Names and effects were checked in [engine.js](engine.js#L25), lines 25-31. Source mapping is in lines 11-23 and joint/apart assignment in line 82. No rule interpretations were added. `RTK.md` was absent.

## Provenance for integration

The existing `assets/PROVENANCE.json` describes reused v0.3 art and was left intact. The following records can be incorporated by the integration owner as newly generated art, separate from its unchanged reused-art records. Original tool outputs remain under `C:/Users/purin/.codex/generated_images/01a0f344-4434-7091-a4f4-46e6484845e1/`. The exact image model and seed were not exposed.

The inspected references were available in conversation context. No local file-path attachment argument was passed for these new-image generations. To regenerate in a fresh conversation, show the requested reference images first, generate R05 then R06, then the remaining cards using the exact prompts below.

```json
{
  "tool": "image_gen.imagegen (built-in)",
  "generatedDateLocal": "2026-10-01",
  "timezone": "Asia/Bangkok",
  "model": "Not exposed by the built-in tool",
  "status": "Prototype art, team approval pending",
  "generationOrder": [
    "R05",
    "R06",
    "R01",
    "R02",
    "R03",
    "R04"
  ],
  "postprocessing": "None on delivered PNGs; copied byte-for-byte from tool output",
  "files": [
    {
      "file": "assets/memory-R01.png",
      "tool": "image_gen.imagegen",
      "sourceGeneratedFile": "exec-2edf7a96-a807-4ac5-aa7b-a7c7b3ac3c94.png",
      "sha256": "096d8f5540d1be5381558ed7f2bed29892d906821e4ba0a48fa5caf66d5c6f46",
      "width": 1536,
      "height": 1024,
      "opaque": true,
      "promptSection": "R01"
    },
    {
      "file": "assets/memory-R02.png",
      "tool": "image_gen.imagegen",
      "sourceGeneratedFile": "exec-6936cb29-1fcd-4b71-89a7-62062429dc81.png",
      "sha256": "30ea7e1c85a2e0b453981ed50824763ea7e56cc061decbe7f2cefd8f7ec7e2a9",
      "width": 1536,
      "height": 1024,
      "opaque": true,
      "promptSection": "R02"
    },
    {
      "file": "assets/memory-R03.png",
      "tool": "image_gen.imagegen",
      "sourceGeneratedFile": "exec-18666d2d-9da4-4673-88c3-8ffce70c0543.png",
      "sha256": "c465bdba38b5952dbb678f92ced9f54ccae6385d1d150b4bdfd03b15a2d10597",
      "width": 1536,
      "height": 1024,
      "opaque": true,
      "promptSection": "R03"
    },
    {
      "file": "assets/memory-R04.png",
      "tool": "image_gen.imagegen",
      "sourceGeneratedFile": "exec-bb0311cb-dabc-4f2d-b4d3-1367b17818fb.png",
      "sha256": "431573954947b3c8053119b6a75bc854191f0f7a9a45ef538d7cb6a6d301c038",
      "width": 1536,
      "height": 1024,
      "opaque": true,
      "promptSection": "R04"
    },
    {
      "file": "assets/memory-R05.png",
      "tool": "image_gen.imagegen",
      "sourceGeneratedFile": "exec-f03a1371-b216-4791-b7a4-52ca09a5f519.png",
      "sha256": "7ffca2135b2c810854767d074b4016567a260e4c60ea6971ceb7fb3547f69417",
      "width": 1536,
      "height": 1024,
      "opaque": true,
      "promptSection": "R05"
    },
    {
      "file": "assets/memory-R06.png",
      "tool": "image_gen.imagegen",
      "sourceGeneratedFile": "exec-d5b024cd-7325-48a3-8b6e-895c8af85faf.png",
      "sha256": "0068fe8bed0d9c51d041ecfa29725e62d48a84036182fed3d9febf9f559b6c2e",
      "width": 1536,
      "height": 1024,
      "opaque": true,
      "promptSection": "R06"
    }
  ]
}
```

## Remaining integration

Showing these images in the game and incorporating provenance are follow-up work. Keep the original card names and effects. No game code, previous artwork, publishing or final art approval was part of this delivery.

## Style sheet

Deep teal and blue river mist, near-black edges, weathered wood and aged bronze; amber light from just left of center toward the right, cool diffuse fill. Visible dry-brush and oil-like texture, restrained detail. One central motif within the middle 70%, quiet bottom and soft dark vignette, 3:2 opaque landscape. R05 is warmest; R06 is its cooler incomplete echo.

## Generation prompts

Tool: built-in image_gen.imagegen. One separate generation per image. Existing images are style references, not edit targets.

### R05

Use case: illustration-story.
Create one finished prototype memory-card illustration for The Ferryman, a tender and solemn river-of-the-dead game. Output exactly 1536 x 1024 pixels, 3:2 landscape PNG, opaque full painted background.
Style references: the existing shore, haven, Elysium and soul portraits inspected earlier in this conversation. Match their visible fine dry-brush and oil-like painted texture, restrained detail, deep blue-teal river mist, weathered wood and aged bronze; avoid glossy digital concept-art surfaces. The apprentice wears a deep teal cloak over ivory linen and an ochre scarf. His lantern is cylindrical antique bronze, clear glass with thin vertical ribs, a domed cap and round loop.
Set-wide lighting: amber light originates just left of the central motif, lighting toward the right, with diffuse cool teal fill. Muted dark outer edges and bottom. One clear dominant motif, all identifying features comfortably within the central 70% of the canvas, readable at 260 x 175 pixels. Peripheral scenery stays quiet and soft. Solemn, precious, hopeful, never frightening.
No written text, letters, numerals, markings resembling writing, symbols, icons, card frame, border, logos, watermark or UI. No gore, horror or glowing eyes. No named artist imitation.
Card subject: Joined Memory. An intimate view across still river water beside the weathered gunwale of the ferry. Two distinct small amber lights rise from adjacent points over the water and gently twist into a single warm luminous flame at center, with the larger ribbon on the left and the smaller on the right. The two roots must remain clearly visible so the image reads as reunion. Their reflected light joins on the water. Natural brush-painted flame wisps, not a diagram or an icon, no hard neon outlines. A soft teal mist encloses this precious gift. This is the warmest and brightest card of the set, yet retains deep cool shadows. No people, no hands, no extra lamps.

### R06

Use case: illustration-story.
Create one finished prototype memory-card illustration for The Ferryman, a tender and solemn river-of-the-dead game. Output exactly 1536 x 1024 pixels, 3:2 landscape PNG, opaque full painted background.
Style references: the existing shore, haven, Elysium and soul portraits inspected earlier in this conversation. Match their visible fine dry-brush and oil-like painted texture, restrained detail, deep blue-teal river mist, weathered wood and aged bronze; avoid glossy digital concept-art surfaces. The apprentice wears a deep teal cloak over ivory linen and an ochre scarf. His lantern is cylindrical antique bronze, clear glass with thin vertical ribs, a domed cap and round loop.
Set-wide lighting: amber light originates just left of the central motif, lighting toward the right, with diffuse cool teal fill. Muted dark outer edges and bottom. One clear dominant motif, all identifying features comfortably within the central 70% of the canvas, readable at 260 x 175 pixels. Peripheral scenery stays quiet and soft. Solemn, precious, hopeful, never frightening.
No written text, letters, numerals, markings resembling writing, symbols, icons, card frame, border, logos, watermark or UI. No gore, horror or glowing eyes. No named artist imitation.
Card subject: Faint Memory. Matched composition to Joined Memory generated earlier: same still river, dark weathered ferry gunwale, teal mist, viewpoint, brush texture and soft vignette. At the left root position a single small amber flame-wisp remains, while the companion on the right is only a delicate incomplete cool gray-teal outline dissipating into mist. The solitary light gives a small subdued reflection. No joined crown, no second bright flame. Much cooler and dimmer than Joined Memory but the remaining amber flame is clearly readable and quietly hopeful. Bittersweet absence, not tragedy. Natural painted wisps, not symbols or a diagram. No people, no hands, no extra lamps.

### R01

Use case: illustration-story.
Create one finished prototype memory-card illustration for The Ferryman, a tender and solemn river-of-the-dead game. Output exactly 1536 x 1024 pixels, 3:2 landscape PNG, opaque full painted background.
Style references: the existing shore, haven, Elysium and soul portraits inspected earlier in this conversation. Match their visible fine dry-brush and oil-like painted texture, restrained detail, deep blue-teal river mist, weathered wood and aged bronze; avoid glossy digital concept-art surfaces. The apprentice wears a deep teal cloak over ivory linen and an ochre scarf. His lantern is cylindrical antique bronze, clear glass with thin vertical ribs, a domed cap and round loop.
Set-wide lighting: amber light originates just left of the central motif, lighting toward the right, with diffuse cool teal fill. Muted dark outer edges and bottom. One clear dominant motif, all identifying features comfortably within the central 70% of the canvas, readable at 260 x 175 pixels. Peripheral scenery stays quiet and soft. Solemn, precious, hopeful, never frightening.
No written text, letters, numerals, markings resembling writing, symbols, icons, card frame, border, logos, watermark or UI. No gore, horror or glowing eyes. No named artist imitation.
Card subject: Steadiness. Close view of the apprentice's one hand firmly and naturally gripping a weathered wooden punting pole near the center-right; a deep teal cloak sleeve with an ivory linen cuff matches the inspected apprentice portrait. Five anatomically plausible digits with normal grip occlusion. On the boat's bow just left of center rests his matching aged bronze cylindrical glass lantern, with a perfectly upright, steady amber flame. The calm river parts smoothly around the bow in the background. The hand, pole grip, entire lantern and tranquil water form one compact readable scene. No face, no extra hands, no dramatic waves. Slightly more warm light than the other single-fog cards, less than Joined Memory. Feeling: calm control.

### R02

Use case: illustration-story.
Create one finished prototype memory-card illustration for The Ferryman, a tender and solemn river-of-the-dead game. Output exactly 1536 x 1024 pixels, 3:2 landscape PNG, opaque full painted background.
Style references: the existing shore, haven, Elysium and soul portraits inspected earlier in this conversation. Match their visible fine dry-brush and oil-like painted texture, restrained detail, deep blue-teal river mist, weathered wood and aged bronze; avoid glossy digital concept-art surfaces. The apprentice wears a deep teal cloak over ivory linen and an ochre scarf. His lantern is cylindrical antique bronze, clear glass with thin vertical ribs, a domed cap and round loop.
Set-wide lighting: amber light originates just left of the central motif, lighting toward the right, with diffuse cool teal fill. Muted dark outer edges and bottom. One clear dominant motif, all identifying features comfortably within the central 70% of the canvas, readable at 260 x 175 pixels. Peripheral scenery stays quiet and soft. Solemn, precious, hopeful, never frightening.
No written text, letters, numerals, markings resembling writing, symbols, icons, card frame, border, logos, watermark or UI. No gore, horror or glowing eyes. No named artist imitation.
Card subject: Vigil. A lone matching antique bronze cylindrical glass lantern stands just left of center on the weathered ferry prow, steadily burning through the long night. Its modest amber pool of light holds a soft curved bank of teal mist away from the prow, expressed through natural atmospheric illumination, never a graphic ring. A heavy plain charcoal-blue wool cloak is folded close beside the lamp, suggesting someone has kept watch. The compact lamp and cloak are isolated against a broad quiet dark river. No visible person or hands, no extra lamps. Moderate warm light, visibly less than Joined Memory. Feeling: patient watchfulness.

### R03

Use case: illustration-story.
Create one finished prototype memory-card illustration for The Ferryman, a tender and solemn river-of-the-dead game. Output exactly 1536 x 1024 pixels, 3:2 landscape PNG, opaque full painted background.
Style references: the existing shore, haven, Elysium and soul portraits inspected earlier in this conversation. Match their visible fine dry-brush and oil-like painted texture, restrained detail, deep blue-teal river mist, weathered wood and aged bronze; avoid glossy digital concept-art surfaces. The apprentice wears a deep teal cloak over ivory linen and an ochre scarf. His lantern is cylindrical antique bronze, clear glass with thin vertical ribs, a domed cap and round loop.
Set-wide lighting: amber light originates just left of the central motif, lighting toward the right, with diffuse cool teal fill. Muted dark outer edges and bottom. One clear dominant motif, all identifying features comfortably within the central 70% of the canvas, readable at 260 x 175 pixels. Peripheral scenery stays quiet and soft. Solemn, precious, hopeful, never frightening.
No written text, letters, numerals, markings resembling writing, symbols, icons, card frame, border, logos, watermark or UI. No gore, horror or glowing eyes. No named artist imitation.
Card subject: Recollection. In cool river mist, a small remembered rustic table with one empty place set glows warmly: a simple earthenware bowl, wooden spoon, modest piece of bread and empty wooden chair, all grouped within the central area. Warm light enters from just left of the central motif, as if from a lantern just outside the remembered scene. The table edges dissolve gently into teal mist rather than a portal outline. One delicate amber thread of remembered light trails toward a tiny still waiting human silhouette on the distant right-hand shore, well inside the safe margins. Clear dominant motif is the warmly set empty place. No scroll, no writing, no extra faces or hands, no crowd. Restrained amber glow. Feeling: remembering someone kindly.

### R04

Use case: illustration-story.
Create one finished prototype memory-card illustration for The Ferryman, a tender and solemn river-of-the-dead game. Output exactly 1536 x 1024 pixels, 3:2 landscape PNG, opaque full painted background.
Style references: the existing shore, haven, Elysium and soul portraits inspected earlier in this conversation. Match their visible fine dry-brush and oil-like painted texture, restrained detail, deep blue-teal river mist, weathered wood and aged bronze; avoid glossy digital concept-art surfaces. The apprentice wears a deep teal cloak over ivory linen and an ochre scarf. His lantern is cylindrical antique bronze, clear glass with thin vertical ribs, a domed cap and round loop.
Set-wide lighting: amber light originates just left of the central motif, lighting toward the right, with diffuse cool teal fill. Muted dark outer edges and bottom. One clear dominant motif, all identifying features comfortably within the central 70% of the canvas, readable at 260 x 175 pixels. Peripheral scenery stays quiet and soft. Solemn, precious, hopeful, never frightening.
No written text, letters, numerals, markings resembling writing, symbols, icons, card frame, border, logos, watermark or UI. No gore, horror or glowing eyes. No named artist imitation.
Card subject: Accord. Two worn ancient Greek bronze helmets rest quietly side by side on a wooden ferry bench, angled gently toward one another. Match the helmet held by the Red Soldier in the inspected S04 portrait: rounded aged bronze crown, long central nose guard, broad dark eye opening and cheek guards, no plume. One rests on the muted rust-red wool cloak of S04 at left; the other on the deep muted navy-blue wool cloak of S06 at right. Both cloaks have the coarse textured folds seen in the portraits. Bronze catches soft amber light from left of center. The pair of helmets and clearly different cloth colors form a single compact central motif, with quiet teal river fog behind. No people, no hands, no eyes inside helmets, no crests or emblems, no weapons raised. Feeling: truce and peace. Restrained warm light, less than Joined Memory.
