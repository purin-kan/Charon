# T-03 Art Pipeline

## Purpose
This document locks the temporary art pipeline for The Ferryman desktop build.
It defines file preparation standards only. Character designs are still provisional and may be revised later.

## Character Sprite Standard

- Source canvas: **512 × 768 px**
- Format: **PNG**
- Background: **Transparent**
- Pose: **Full-body neutral standing pose**
- Placement: Character centered on the canvas with consistent padding
- Baseline: Feet should sit at a consistent vertical level across character sprites
- Rendering: Clear silhouette and readable details at reduced in-game scale
- Quality target: Concept / implementation reference quality; final production polish is not required at this stage
- Scaling: The source file remains 512 × 768 px. Phaser will scale the sprite at runtime for different screen sizes and layouts.

## Naming Convention

Use lowercase kebab-case with the `sprite-` prefix.

Examples:

- `sprite-mother.png`
- `sprite-child.png`
- `sprite-merchant.png`
- `sprite-blacksmith.png`
- `sprite-priest-normal.png`
- `sprite-priest-exhausted.png`
- `sprite-long-mist.png`

Existing original artwork must remain unchanged. Transparent game-ready/test cut-outs are added as new files.

## Test Asset

- File: `sprite-mother-test.png`
- Size: 512 × 768 px
- Format: Transparent PNG
- Purpose: Pipeline and Phaser-loading test only
- Status: **Temporary test asset — not final Mother character art**

The final Mother design and the final designs of other Souls remain open for later art review.

## Device / Runtime Note

The 512 × 768 px size is the source asset size, not the fixed on-screen display size.
Phaser should scale sprites at runtime, allowing the same source assets to be used across desktop and other screen sizes if the game is later adapted for tablet or mobile layouts.
