# Optional verification tools

The game itself needs only a browser. Node.js is optional and is needed only to rerun the checks in this folder. These scripts use Node's built-in modules; no package installation is required.

From the demo folder, run:

```text
node verification/demo-tests.cjs
node verification/demo_design_experiments.cjs
```

The scripts find `../engine.js` relative to their own location. Keep this folder beside that file when moving or sharing the demo. Each run replaces its matching JSON result in this folder.

| File | Purpose |
| --- | --- |
| `demo-tests.cjs` | 32 rule checks, including the worked opening, memory effects, linked souls, timing, quotas, and failure. Returns a failing exit code if a check fails. |
| `demo-test-results.json` | Saved check result: 32 passed, 0 failed for the included base engine. |
| `demo_design_experiments.cjs` | Seven explicit deterministic policies and two focused comparisons. Records exact choices and resulting states. |
| `demo_design_experiments.json` | Saved experiment records, forecasts, outcomes, and a route-budget calculation. |

These are deterministic software checks and design experiments. They are not human playtests, audience feedback, random samples, or proof of balance. Some experiment policies deliberately make poor choices. `policy_blocked` means a chosen route became unaffordable, so no invalid move was executed; it is different from an in-game loss.

The experiments preserve the base paper rules and make no changes to the game. Their saved results describe only the included engine version. Rerun both scripts after changing that engine, and interpret any old report against its recorded version.
