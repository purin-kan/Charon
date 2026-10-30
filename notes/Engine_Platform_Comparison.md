# Engine and platform comparison

Agent-prepared October 25, 2026 (Godot vs Phaser sections added October 28) for decision D12 ([Decisions_and_Team_Plan.md](Decisions_and_Team_Plan.md), line 199).

**Decision, confirmed by the user on October 30, 2026:** Phaser + Electron. AI writes most of the code from team prompts, and an AI-built tuning panel lets the team adjust animation speed, timing and paths. It settles engine and platform only, not controls, art or audio. The build plan is [Project_Plan_Oct30_Nov8.md](Project_Plan_Oct30_Nov8.md); the comparison below is the October 25 analysis behind the choice.

**Constraints:** seven-person team with no engine experience; Windows download; due in 2 weeks (about November 8, 2026); 2D, not card-based; turn-based crossing with animation, with souls dragged onto a boat that travels the river.

## Comparison

| Engine | Cost | Editor / language | Reuses v0.7 rules code | Strength | Weakness | 2-week fit |
|---|---|---|---|---|---|---|
| **Phaser + Electron** (provisional pick) | Free | Code only / JavaScript | Yes, unchanged | Existing rules and tests; strongest AI support | No visual editor; Electron is one more tool and a larger download | **High** if AI writes the code |
| **Godot 4.7.2** | Free | Visual / GDScript | Port needed | 2D-first editor; built-in Windows export | Rules port; Godot 3 material breaks in Godot 4 | **High** |
| GameMaker | Free for non-commercial use | Visual / GML | Port needed | Built for beginner 2D | Account and licence terms; drag-and-drop scripted by hand | Medium-High |
| GDevelop | Free, export-limited | Visual / no-code | Not directly | No-code event sheets | 1 one-click desktop export per day; complex rule order hard to express | Medium |
| Unity 6 Personal | Free under $200,000 revenue | Visual / C# | Port needed | Industry standard; largest tutorial base | Heavy install; many concepts; C# | Low-Medium |
| Construct 3 | Paid for desktop export | Visual / no-code | Not directly | Easiest no-code editor | Free version: web only, 50 events, 2 layers | Low |
| Defold | Free | Visual / Lua | Port needed | Light and capable in 2D | Fewer beginner resources | Low |
| LÖVE, MonoGame, raylib | Free | Code only / Lua, C#, C | Port needed | Full control | No editor and no rules reuse | Low |
| Ren'Py | Free | Script / Python | Port needed | Fast for story scenes | Visual novel engine; drag-and-drop play works against it | Low |
| RPG Maker | Paid | Visual / JavaScript plugins | Not directly | Fast tile-based RPGs | Wrong genre | Low |
| Unreal | Free to start | Visual / C++, Blueprints | Port needed | Top-end 3D | Very large; 3D-oriented | Low |

Strengths, weaknesses and fit are agent judgments, not measured results. **High:** a beginner team can plausibly ship the core loop in 2 weeks. **Medium:** only with scope cuts. **Low:** unlikely. "v0.7 rules code" is [engine.js](../outputs/The_Ferryman_v0.7/engine.js) (400 lines) and [content.json](../outputs/The_Ferryman_v0.7/content.json). The October 25 text cited the v0.6 files (363 lines); updated October 31, 2026.

## Godot vs Phaser + Electron

**Godot is a full engine with an editor. Phaser + Electron is a code library inside a browser wrapper.**

| | Godot | Phaser + Electron |
|---|---|---|
| Type | Engine with scene, animation and UI editors | Code-only framework; scenes built in code or Tiled |
| How it runs | Native engine binary | JavaScript inside bundled Chromium |
| Export size | Smaller (roughly tens of MB) | Larger (roughly 100+ MB, from Chromium) |
| Performance | Stronger with many objects or physics | Adequate for most 2D; browser adds overhead |

Export size and performance are general estimates, not measured on this project.

**Rule of thumb:** Phaser when reusing the existing JavaScript rules code and AI-written code; Godot when the team wants to build scenes and animation in an editor.

### Team collaboration

**Phaser suits programmer teams. Godot suits mixed teams with artists and designers, at the cost of more merge friction.**

| | Godot | Phaser + Electron |
|---|---|---|
| Git and merges | Scenes are text, but two people editing one scene causes messy conflicts | All code; conflicts as low as any JS project |
| Non-programmers | Work directly in the editor | Need extra tools (Tiled, Phaser Editor) |
| Onboarding | Everyone learns Godot and GDScript | Any JS developer contributes quickly |
| Version pinning | Everyone must use the same Godot version | `package.json` and lockfile pin everything |

**If choosing Godot:** keep scenes small, assign scene ownership, pin the engine version, use Git LFS for large assets.

## Applies to every engine

- All 24 images in [v0.6 assets/art](../outputs/The_Ferryman_v0.6/assets/art/) have solid backgrounds. Souls and the boat need transparent cut-out sprites.
- An unsigned .exe shows a Windows SmartScreen warning. Test a build on a second PC early.

## Sources

Accessed October 25, 2026: [Godot download](https://godotengine.org/download/windows/) (4.7.2), [Godot Windows export](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_windows.html), [Phaser download](https://phaser.io/download/stable) (v4.2.1), [GameMaker licence](https://gamemaker.io/en/help/articles/how-to-upgrade-your-gamemaker-licence), [GDevelop pricing](https://gdevelop.io/pricing), [Unity plans](https://unity.com/runtime-fee), [Construct 3 purchase page](https://www.construct.net/en/make-games/buy-construct).

Repository files used were last committed before the newest results commit (67619b5, October 5, 18:04) and are POSSIBLY STALE by the project's freshness rule. The October 25 text cited the v0.6 engine.js and content.json, which had no commits after October 5, 08:45. The current rules code is the v0.7 folder (last commit October 30, 17:27).
