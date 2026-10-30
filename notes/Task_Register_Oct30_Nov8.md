# Task Register (Oct 30 - Nov 8)

Derived from [Project_Plan_Oct30_Nov8.md](Project_Plan_Oct30_Nov8.md) on October 30, 2026. The plan holds the detail; this register tracks who does what, by when, and whether it is done. If the two disagree, fix the plan first and then the register.

## How to use it

* **Owner:** one accountable person per task. Where a plan row named two owners, the register picks one Owner and lists the other under Support, except the sprite and destination or effect art rows, which are split into separate tasks. Purin is one of the seven members; the member number is still open, so Purin's tasks are listed under the name Purin.
* **Support:** people who help or review.
* **Depends on:** task IDs that must be done first. T-05 (Scaffold A) is the only gate that blocks other work; see "How the work runs in parallel" in the plan.
* **Deliverable:** Game (code, art and audio built into the `.exe` and included in the project files), `.exe` (build and test steps), Presentation, or Process (repo and admin work).
* **Priority:** Must (the submission fails without it), Should (the game or pitch is weaker without it), Nice (cut first when time is short).
* **Status:** Not started, In progress, Blocked, Done, Cut. Each owner updates their own Status and Evidence; M1 reviews the register and keeps it in step with the plan.
* **Evidence:** a commit, file path or test note. Anything not run is `NOT_RUN`. Agent or team smoke tests are not human playtests.
* **Due:** the end of the phase unless the task says otherwise.

## Phase 1: Scaffolding & Early Design

| ID | Task | Due | Owner | Support | Depends on | Deliverable | Priority | Status | Done when | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| T-01 | Blockers | 2026-10-31 | M1 | All | | Process | Must | In progress | Open blockers resolved and recorded | |
| T-02 | Repo setup | 2026-10-31 | Purin | M1 | | Process | Must | Not started | `.gitattributes` `-text` rule for the new folder and v0.7 folder, and `.gitignore` entries for `out/`, `dist/`, `.vite/`, committed | |
| T-03 | Lock art pipeline | 2026-10-31 | M2 | M3 | | Game | Must | Not started | Sprite resolution and naming convention written; one test character cut out and committed | |
| T-04 | Confirm test sprite loads in Phaser | 2026-11-01 | M2 | Purin | T-03, T-05 | Game | Must | Not started | The test sprite renders in the dev window through the preloader | |
| T-05 | Scaffold A: dev environment | 2026-10-31 (end of day) | Purin | | | Game | Must | Not started | Phaser runs in the Electron dev window; `Ferry.create(1)` returns a valid state; scene stubs, router, dev launcher, preloader fallback, empty `tuning.json` and README pushed and announced | |
| T-06 | Scene architecture design | 2026-10-31 | M4 | M5, M6 | | Process | Should | Not started | Scene, phase and action map written and agreed; scaffold stubs updated if it differs | |
| T-07 | Audio asset strategy | 2026-10-31 | M7 | | | Game | Should | Not started | Track list written, placeholder menu loop sourced, source and licence of each file recorded | |

## Phase 2: Engine Prep & Base Build

| ID | Task | Due | Owner | Support | Depends on | Deliverable | Priority | Status | Done when | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| T-08 | Scaffold B: packaged build | 2026-11-02 | Purin | | T-05 | .exe | Must | Not started | A test `.exe` runs and loads assets from the `.asar` package | |
| T-09 | Soul sprites | 2026-11-02 | M2 | | T-03 | Game | Must | Not started | Cut-outs for Mother, Child, Merchant, Mason, Cook, Poet, Keeper, Farmer, Blacksmith, Priest (normal and exhausted) committed; the other five ordinary souls stay letter placeholders unless art is approved | |
| T-10 | Polong, boat and shore sprites | 2026-11-02 | M3 | | T-03 | Game | Must | Not started | Cut-outs for Polong, boat and shore committed | |
| T-11 | TitleScene, single save and optional seed | 2026-11-02 | M6 | | T-05 | Game | Must | Not started | Continue and New game work over one save slot; New game accepts an optional seed; saves use the desktop namespace only | |
| T-12 | BoardingScene | 2026-11-02 | M5 | | T-05 | Game | Must | Not started | Drag-and-drop dispatches `BOARD` and `DEPART`; hero offer, Light and seat counters shown | |
| T-13 | Developer tuning panel | 2026-11-02 | M6 | M4 | T-05 | Game | Should | Not started | Panel adjusts timings, easing, snap radii and paths in the dev build and saves `tuning.json` | |
| T-14 | Early `.exe` and SmartScreen test | 2026-11-02 | M7 | Purin | T-08 | .exe | Must | Not started | Test `.exe` run on a second PC; SmartScreen behavior and asset pathing noted | |
| T-15 | Base BGM and SFX | 2026-11-02 | M7 | | T-07 | Game | Should | Not started | Menu loop, one crossing ambient track and board and unboard click SFX committed with sources recorded | |
| T-16 | Memory UI overlay | 2026-11-02 | M4 | | T-05 | Game | Must | Not started | Hand display, play-before-crossing flow and discard prompt work against fixture states | |
| T-17 | GameOverScene | 2026-11-02 | M4 | | T-05 | Game | Must | Not started | Run summary shown from state; restart works | |
| T-18 | Presentation outline | 2026-11-02 | M1 | | | Presentation | Must | Not started | Slide structure for Description, Algorithmic Implementation and Demo play; Description drafted from the generated `RULES.md`; README and credits note started | |

## Phase 3: Core Loop & Content

| ID | Task | Due | Owner | Support | Depends on | Deliverable | Priority | Status | Done when | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| T-19 | CrossingScene | 2026-11-05 | M5 | M4 | T-05; integrates T-16 and T-22 | Game | Must | Not started | Memory window, route choice, review and boat animation work; fog and Light loss shown | |
| T-20 | DeliveryScene | 2026-11-05 | M6 | | T-05 | Game | Must | Not started | Matching-wish feedback, delivery, soul departure, memory reward and choice overlay work | |
| T-21 | ReturnScene | 2026-11-05 | M4 | | T-05 | Game | Must | Not started | Return resolves anger, wraith conversion and Light restoration, then starts the next cycle | |
| T-22 | Route UI | 2026-11-05 | M4 | | T-05 | Game | Must | Not started | Fork display, review and Foresight preview work as a component for CrossingScene | |
| T-23 | Tuning and pacing calibration | 2026-11-05 | M7 | M2, M3 | T-13, T-19 | Game | Should | Not started | Crossing speed, snap feel and wraith pacing tuned; `tuning.json` committed by one person | |
| T-24 | Destination backgrounds and memory placeholders | 2026-11-05 | M3 | | T-03 | Game | Should | Not started | Six existing destinations cut or placed; Heaven and the nine memory types without art have placeholders | |
| T-25 | Wraith transformation frames | 2026-11-05 | M2 | | T-03 | Game | Should | Not started | Animation frames committed with naming convention | |
| T-26 | Pitch script draft | 2026-11-05 | M1 | | T-18 | Presentation | Must | Not started | Script covers Description, Algorithmic Implementation and Demo play; early gameplay footage captured | |
| T-27 | Scene text | 2026-11-05 | M1 | M6 | T-05 | Game | Should | Not started | Button, help and ending text collected into a data file the scenes read | |
| T-28 | Crossing and delivery audio | 2026-11-05 | M7 | | T-15 | Game | Should | Not started | Crossing variants, delivery jingle, wraith SFX and fog ambiance committed with sources recorded | |

## Phase 4: Feature & Asset Freeze

| ID | Task | Due | Owner | Support | Depends on | Deliverable | Priority | Status | Done when | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| T-29 | Hard freeze | 2026-11-06 | M1 | All | T-31 | Process | Must | Not started | All scenes merged; no new mechanics, quest types or major art after this point; Drug Dealer, Fool and Killer stay out of play | |
| T-30 | Integration check | 2026-11-06 | Purin | M7 | T-08, T-11, T-12, T-16, T-17, T-19, T-20, T-21, T-22 | .exe | Must | Not started | Full playthrough boot to game over across multiple cycles; save and load confirmed | |
| T-31 | Scope-cut triage | 2026-11-06 | Purin | M5, M6 | T-30 | Game | Should | Not started | Unstable hero encounters or Polong variants cut or kept; any engine change followed by `build-content.js` and `quest-check.js` reruns | |
| T-32 | Release candidate build | 2026-11-06 | Purin | | T-29 | .exe | Must | Not started | Release candidate `.exe` built and handed to M7 and M1 | |
| T-33 | Balance playtests | 2026-11-06 | M7 | | T-30 | Game | Should | Not started | Observations of Light, anger and fog logged in the status file; proposed `content.json` changes sent to the group | |

## Phase 5: QA, Balance & Polish

| ID | Task | Due | Owner | Support | Depends on | Deliverable | Priority | Status | Done when | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| T-34 | `.exe` testing | 2026-11-07 | M7 | M1 | T-32 | .exe | Must | Not started | Release candidate tested on a second Windows machine; SmartScreen, asset pathing, memory stability and save persistence recorded; untested items marked `NOT_RUN` | |
| T-35 | Balance tuning | 2026-11-07 | M7 | | T-33 | Game | Should | Not started | Final `content.json` values set, each change logged with its reason, `build-content.js` and `quest-check.js` rerun | |
| T-36 | Bug fixes | 2026-11-07 | M4 | M5, M6 | T-34 | Game | Must | Not started | Issues from M7's test log fixed, each owner fixing their own scenes | |
| T-37 | Visual polish | 2026-11-07 | M5 | M6 | T-29 | Game | Nice | Not started | Scene transitions and screen shake in; particle effects only once the bug list is empty | |
| T-38 | Slides finalize | 2026-11-07 | M1 | | T-26 | Presentation | Must | Not started | Final slides cover all three required parts | |
| T-39 | Art polish | 2026-11-07 | M3 | M2 | T-29 | Game | Nice | Not started | Placeholder sprites touched up and UI elements finalized | |

## Phase 6: Build, Export & Rehearsal

| ID | Task | Due | Owner | Support | Depends on | Deliverable | Priority | Status | Done when | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| T-40 | Final `.exe` compile and project files | 2026-11-08 | Purin | | T-35, T-36, T-37, T-39 | .exe | Must | Not started | Clean build with no console errors; README written; project files and `.exe` collected for submission | |
| T-41 | Demo video recording | 2026-11-08 | M1 | M7 | T-40 | Presentation | Must | Not started | Video recorded from the final `.exe` with a fixed seed | |
| T-42 | Presentation rehearsal | 2026-11-08 | M1 | All | T-38, T-41 | Presentation | Must | Not started | Full run-through of Description, Algorithmic Implementation and Demo play, with live demo and Q&A | |
