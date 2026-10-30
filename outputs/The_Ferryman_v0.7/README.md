# The Ferryman: quest trial

Open `index.html` in a browser. Everything needed to play is bundled. No installation, account or hosted service is required.

Choose a save, select passengers, and optionally accept the offered hero. Depart, use memories or passenger abilities, approach the fork, review a route and confirm. Deliver eligible passengers, resolve any encounter choices, then finish the round. With an empty boat, return to the shore. Zero Light ends the run.

The journal explains active quests and records consequences. Guide & save contains the rules, optional seed, JSON export/import and save-slot controls. Saves belong to this trial; the old v0.6 game keeps its own slots. Moving the game or changing browsers may change local save storage, so export first.

This prototype includes eight repeatable quests, all five Polong variants, separate Heaven, Priest purification and heroic rewards. It uses the user's accepted temporary choices in `TRIAL_RULES_DRAFT.md`. Final balance and artwork remain under review. `IMPLEMENTATION_STATUS.md` records source freshness and verification limits.

The old paper kit is historical and does not describe this trial. This package contains the HTML trial, current text rules, source, assets and automated scenario tests.

For developer checks, use `node tools/build-content.js` and `node tests/quest-check.js`. Playing does not require Node.

Drug Dealer, Fool and Killer are included in the roster reference with rules TBA; they are not assigned invented playable effects. Scale progression awaits team direction. The current game lives in outputs/The_Ferryman_v0.7 on main. Entity spreadsheet deliverables stay local and gitignored.
