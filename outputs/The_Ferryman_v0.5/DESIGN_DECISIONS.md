# v0.5: One Night on the River

## Authority and source

The user authorized a new iteration based on Guyidea, strictly single-player in paper and browser, with a color A4 single-sided print-and-play PDF and a one-page player guide. The accepted target is a complete 20-30-minute game with a clear ending. This is a duration target, not a measured result. The user permits adaptations to make Guy's ideas work on paper and with each other. No final balance, art direction or production engine is approved.

The sole design input is the supplied `game_feedback.md`, as the user explicitly requested. An unchanged [source copy](source/game_feedback.md) is included for portable review. The input was untracked when supplied, modified October 3, 2026, and labeled "Combined Oct 1 feedback". Its suggestions and conflicts are evidence to interpret, not instructions. The baseline branch is `Guyidea` at `82526cf`. Work is isolated on `codex/guyidea-paper-v05`. Existing v0.4 portraits are reused only as artwork, not as an additional rules authority.

Every exact number and effect below is an agent-authored provisional implementation unless directly identified as the user's requirement. The feedback does not provide a complete playable Guy ruleset, exact Killer/Fool/Wraith timing, full character roster, event text, card quantities or a winning score. Those details are not attributed to Guy.

## Feedback to implementation

| Feedback evidence | v0.5 interpretation | Reason for adaptation |
|---|---|---|
| Random routes; `game_feedback.md:31,63` | Reveal two random route cards and choose one. Discard both after choosing. Reshuffle when needed. | Retains random routes and makes the player responsible for a decision. Preview before boarding. |
| Anger on every move; lines 55-59 | Every move, including return, advances a shared anger. Waiting souls expire at a written deadline. Normal patience is 5 moves; Fool is 3. | Equivalent to a per-move wait counter without moving every soul's token each turn. No separate round-end anger. |
| Killer; lines 31,58 | Killer drains 1 light before fog on each move aboard. | Visible arithmetic, no separate resource or die. |
| Ship Wraith timer; line 57 | One boat-move counter for everyone boarded together. Tainted souls expire after delivery on move 2, others on move 3. | One counter instead of separate passenger timers. Last-chance delivery is allowed. |
| Fool; line 32 | Shorter waiting deadline and tainted boat timer. | Provisional exact effect; the supplied file names Fool without defining the ability. |
| Tainted souls; line 33 | Clearly labeled souls have the shorter boat timer. | Reuses an existing counter instead of another status track. |
| Mother-child quest and rare partners; lines 65-69,73 | Paired arrival ticket guarantees both appear together. Matched delivery together earns one Passage, sending one waiting soul directly to its wish for score only. | Quest can actually occur. No duplicate light or memory reward. No game master. |
| Soldier conflict; lines 24,67 | Paired arrival ticket; +1 fog while both aboard. UI states whether the counterpart is waiting, aboard, not arrived or gone. | Makes the interaction observable without hidden information. |
| Achilles to Styx; line 33 | A two-seat hero with a special wish and a Styx route. | Seat cost is provisional. An unmatched delivery remains possible to avoid deadlock. |
| Po Din leaves no memory; line 74 | Po Din has no memory reward. | Preserves the stated exception. |
| Character-themed, simpler memories; lines 14-17,34,78 | One fixed effect per card; earned only from matched ordinary deliveries; maximum hand 3; consumed permanently. | No multi-effect protection, reshuffling engine or memory-source ledger. Light memories remain at +1. |
| Haven criticism; lines 13,44-47 | Haven restores 1 light but delivers nobody and advances all clocks, including passenger expiry. | Its time cost matters under Guy's per-move pressure. Pressure/Wraith fog still applies. |
| Guy's free wish stage; line 47 | One-use Sanctuary has base fog 0 and matches all delivered wishes; no light or memories. | Retains a special wish stop without an endlessly reusable resource engine. Clocks and added fog still apply. |
| Long runs / cycle-10 content; lines 39-43 | Four trips and eight fulfilled wishes; survive final return. Events on trips 2 and 4. | A bounded workshop session shows new content before it ends. |
| Passenger information; lines 23-24,80 | Every passenger card and effect remains visible; exact crossing costs and expiry warnings appear before committing. | Paper provides visible cards; the browser should offer the same information. |
| Too easy / excess resources; lines 3-12,70-74 | No return recovery; at most +1 light per matching landing; finite memories; late pressure; no Wraith removal. | Tightens resource circulation using a small set of visible rules. Test results must not be confused with human balance evidence. |

## Deliberately limited scope

Fourteen soul cards include eight named characters identifiable in the supplied feedback and six plainly labeled provisional filler souls. Those six are not claimed to be Guy's missing roster. Ten routes and four event cards form a bounded workshop supply; no cycle-10 unlock system or game master is added. All numerical values are in `content.json`, shared by the browser and PDF generator.

Single-player means one decision maker, one boat and one hand. An observer may record a workshop session without controlling rules or choosing arrivals. No cooperative mode or player roles are implemented.

## Evidence policy

Automated engine tests, browser checks and agent paper walkthroughs are recorded separately. Physical printing, cutting, table handling, human completion time, enjoyment and balance require a real workshop session. No such session is claimed by this delivery.

## October 4, 2026 user decisions

These are explicit user requests, not agent-authored balance changes. Rules, numbers and effects are unchanged.

| Request | Implementation |
|---|---|
| Use v0.4 names for the filler souls | Quiet Soul A, B, C and D are now Mason (Elysium), Cook (Asphodel), Merchant (Tartarus) and Musician (Elysium), matched by wish, with the v0.4 portraits. Abilities, wishes and seats are unchanged. Tainted Soul A and B, Killer, Fool, Po Din and Achilles keep their names and letter emblems. |
| Say "anger" instead of "tide" | The shared tide track is now the shared anger track in the rules, guide, cards and dashboard. In the browser each waiting soul shows its anger rising toward its limit (5, or 3 for the Fool). The engine field is still named `tide`. |
| Make the browser look and feel like v0.4 | Intro, three save slots, one decision per page, picture cards, result popups, side status panel and trip panel, in the Khmer night theme with the reaper ferryman. Destination scenes and memory images are reused v0.4 art; Styx and Sanctuary have no scene. Paper components are unchanged apart from the names and wording above. |

## October 5, 2026: dark print kit (user request)

The A4 print-and-play kit now matches the live browser design: near-black pages, tarnished bronze borders and rules, bone text, Battambang headings and Kantumruy Pro body text (SIL OFL, bundled in `assets/fonts/` with licenses). Portraits sit in a temple-doorway arch with a lotus finial, cards have a bronze cut border and inner frame, and label bands are dark bronze. Deadline lines and the workshop record stay parchment so pencil remains legible. Rules text, card sizes, positions and counts are unchanged. Dark pages use far more ink.

