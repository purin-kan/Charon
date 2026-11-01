# Blockers resolved (October 31, 2026)

Team answers to the open blockers, collected by SupaOhm for T-43. **Not final:** game decisions belong to the PM (VarisPah) and co-PM (Jaoguya). Nothing here has been applied to `engine.js` or `content.json`, and nothing has been playtested.

The entity side of these answers is in `notes/Charon_Entity_Catalog_Public_2026-10-31.xlsx`: see the last Entities column, and the `Changes 2026-10-31` sheet for every changed cell. Rule numbers are kept here too because the catalog's scope excludes mechanics and balance.

## Decide first

These answers disagree with each other, so the PM or co-PM needs to pick one. They are tracked in [issue 6](https://github.com/purin-kan/Charon/issues/6).

| # | Issue | Why it matters |
|---|---|---|
| 1 | **Heaven.** The fog table and "random from our 6 destinations" list six destinations without Heaven, and "there is only 1 Heaven". But the Priest wishes for Heaven, the Child quest goes to Heaven, and v0.7 has it as a seventh destination at fog 2. | Decides whether there are 6 or 7 destinations, and where the Priest and Child go. |
| 2 | **Child's wish.** The backstory says Haven; the quest and soul table say Heaven. | Tied to item 1. |
| 3 | **Bard is listed twice** in the soul table (Restore Light and Calm), giving 16 rows but 15 distinct souls. The milestone table needs 16 ordinary souls. | Either a sixteenth soul is missing or the milestones should stop at 15. |
| 4 | **Cerberus destination.** The quest and blockers say the same as Heracles (random); the catalog answer says Acheron. | The catalog records both until decided. |
| 5 | **Keeper and Messenger** each have two different stories, and their quest entry is blank. | The catalog uses the lighthouse keeper and mountain runner for now, and keeps the second versions in the decisions column. |
| 6 | **Personal names.** The answer says they are decided in the Soul tabs, but the supplied table only has the example "Penelope the Mother". | Names stay open. |
| 7 | **Protecting the Merchant.** One answer says it is just a storyline; the quest says Blacksmith must protect him until he reaches his wish. v0.7 makes it a real rule: Blacksmith blocks Anger on the Merchant. | Decides whether this needs any game logic. |

## Needs an owner

| # | Issue | Why it matters |
|---|---|---|
| 8 | **Applying the rule answers.** None of the 44 register tasks changes the game rules to match these answers: T-35 only sets balance values and T-31 only cuts features. See "Differences from v0.7" below. | [Pull request 9](https://github.com/purin-kan/Charon/pull/9) proposes T-45 for this, with bosthanapatw as owner; not yet agreed. The boarding and memory rules affect T-12 and T-19. |

## Still unanswered

* When tainted arrivals happen within a cycle.
* Adaptive route probabilities are a yes, but weights, limits and performance conditions are not given.
* The order of encounters, deliveries, quest effects, Anger, Wraith expiry and rewards.
* What fails the Mother and Child quest (the answer stops at "Failures could be mother and child never").
* Number of copies of each Polong variant, and so whether duplicates can be aboard.
* Whether quest participants other than Mother and Child are protected from spread.
* Bard and Listener: whether only outward crossings count, whether Anger carries over, and whether a transformed Listener can coexist with the Poet.
* Heracles' toll: whether the selected shore soul becomes a Wraith, and whether it costs Light.
* Cerberus' Anger.
* Backstories for the old Soldier, Po Din and Achilles.
* The old Soldier concept, the owner-less memories (Steadiness, Vigil, Recollection, Accord, Joined Memory, Faint memory), Full fog protection, Styx being used by both Achilles and Po Mued, final appearance, final inclusion of locations, and missing artwork.

## Scale and progression

| Cycle | Destinations | Ordinary souls | Tainted arrivals per cycle |
|---|---|---|---|
| 1 | 4 | 6 | 0 |
| 3 | 5 | 9 | 1 |
| 6 | 6 | 13 | 1 |
| 9 | 6 | 16 | 2 |
| 18 | 6 | 16 | 3 |

* These milestones are intended. Unlocked souls and destinations are random each run.
* There are no blank cycles: when a cycle starts the player must choose to bring a certain number of souls.
* Drug Dealer, Fool and Killer are scrapped for the Polongs / Tainted souls. They stay in the catalog as Unused and their old ability drafts are not restored.

## Destinations

| Destination | Fog | Why |
|---|---|---|
| Haven | 0 | Safe harbor, a free rest point |
| River Styx | 1 | The threshold every soul crosses, so it's the cheap gate |
| Acheron | 1 | River of woe, the first taste of the underworld, same shallow depth as Styx |
| Asphodel | 2 | The gray middle fields, thick with the fog of forgetting |
| Elysium | 3 | Paradise for the worthy, the far edge of the good |
| Tartarus | 3 | The deepest pit, the far edge of the bad |

## Core rules

* Anger: memories reduce the anger of souls rather than preventing it. "Prevent Anger by 1" means reduce by 1.
* Boarding reduces Anger by 3.
* Memories can only be used one per round.
* Golden Apple can stack within a run.
* The game is endless.

## Souls and memories

| Soul | Wish | Memory | Effect |
|---|---|---|---|
| Mother | Tartarus | Restore Light | Light +1 |
| Priest | Heaven | Restore Light | Light +1 |
| Bard | Elysium | Restore Light, and Calm (decision 3) | Light +1 / ship anger -1 |
| Blue Soldier | Asphodel | Guard | Prevent Light tolls |
| Red Soldier | Tartarus | Guard | Prevent Light tolls |
| Poet | Elysium | Foresight | See next 3 routes |
| Messenger | Asphodel | Foresight | See next 3 routes |
| Merchant | Styx | Foresight | See next 3 routes |
| Cook | Asphodel | Calm | Ship anger -1 |
| Farmer | Asphodel | Calm | Ship anger -1 |
| Child | Heaven (decision 2) | None | None |
| Listener | Elysium | None | None |
| Mason | Acheron | Fog shield | Crossing fog -1 |
| Blacksmith | Acheron | Fog shield | Crossing fog -1 |
| Keeper | Asphodel | Fog shield | Crossing fog -1 |

| Reward | Source | Effect |
|---|---|---|
| Passenger | Mother and Child quest | Deliver 1 good soul; normal souls only (such as Mother, Child, Priest) |
| Sword | Merchant and Blacksmith quest | Kill 1 Tainted soul; Tainted souls only (such as Polong) |
| Tools | Merchant and Mason quest | Seat +1 for 1 cycle |
| White flag | Red and Blue Soldier quest | Reduce boat anger by 3 |
| Golden Apple | Heracles | Restore all Light, Max Light +1 |
| Moly of Hermes | Odysseus | No Tainted souls for 1 cycle; existing Polongs leave the ship |
| Nobody | Odysseus | No fog tolls for 1 cycle |

## Quests

* **Mother and Child:** both in the same boat, send Child to Heaven, then Mother to Tartarus, in that order. Reward: Passenger.
* **Red and Blue Soldier:** opposing forces. With both in the same boat, other souls aboard get +1 Anger every 2 routes passed. Done by disembarking both at their wishes. Reward: White flag.
* **Bard and Listener:** when the Listener stays with the Bard for more than 2 routes, the player chooses whether the Listener becomes Poet.
* **Farmer and Cook:** optional and one-time, started by the player when both are in the same boat. Farmer gives crops, everyone aboard gets -1 Anger, and Cook gets +2 Anger from the stress. Cook gains stress only if the quest is accepted.
* **Merchant and Blacksmith:** cannot bring Mason if you pick Blacksmith. Merchant gives ores to forge the Sword; Blacksmith must protect him until he reaches his wish, then disembark later (see decision 7). Reward: Sword.
* **Merchant and Mason:** cannot bring Blacksmith if you pick Mason (read from "if you pick blacksmith", which looks like a typo). With both aboard, Mason can only deliver last. If the last two are Polong and Mason, Mason can disembark first because Polong is a Tainted soul. Reward: Tools.

## Heroic souls

Heroic souls arrive in the form of the Traveler, with a brief description of which one it is. Two cannot arrive at the same time. The Traveler asks the player for a quest, and the player can accept or decline.

**The Fighter (Heracles).** Needs more than 3 souls on the shore; arrives after cycle 9, randomly at 25%. Toll: select 1 soul on the shore. His wish is random from the 6 destinations. On arrival he fights Cerberus and brings him aboard, scaring 2 random souls off. Frightened souls leave the boat and do not become Wraiths. Cerberus takes 2 seats and gives no memory. Deliver both to receive the Golden Apple; the quest then ends.

**The Strategist (Odysseus).** Arrives after cycle 6, randomly at 25%. His wish is random from the 6 destinations. On arrival he meets Tiresias, and the player chooses one:

* **Charybdis:** lose 1 random memory, receive Moly of Hermes.
* **Scylla:** lose 1 random soul, which turns into a Wraith, and Light -1; receive Nobody. Scylla only eats normal souls (not Tainted or heroic). If hand or boat is empty, Light drops by 1.

## Polong edge cases

* A Polong keeps its original encounter level; existing Polongs do not upgrade. Polong level rises for every Polong that boards.
* Overload fog applies once; overloaded is a single active status.
* Po Due: Haven must appear within the next 2 forks. Foresight reveals routes normally, and revealed routes cannot change.
* Mother and Child are protected from Polong spread.

## Priest and passengers

* Purification: the player chooses the soul. After using it the Priest does not return to his normal state.
* Passenger can only deliver normal souls. Sword can only remove Tainted souls.

## World and story

* The player is Chairon's apprentice, and the old master is their master. This is story background only.
* Scylla replaces the source name Zilla, and Bard replaces Musician everywhere.
* Passage becomes the Passenger memory.
* Merchant partners with Blacksmith or Mason; Blacksmith and Mason are not related to each other.
* Wraiths are souls that become rageful after many undelivered trips.
* Polongs / Tainted souls are lost souls from another land who believed they belonged to this realm, causing distress in normal souls.
* Light is a shield against unwanted, harmful or Tainted souls. It dims over time, which lets Tainted souls sneak in.
* The ferry boat is a yacht.
* Backstories, wishes and the Polong inspirations are in the catalog.

## Differences from v0.7

The v0.7 folder is no longer in the tree, but `engine.js`, `content.json` and `RULES.md` in the desktop build's `rules/` folder are identical copies, so these differences still apply. The answers above change these v0.7 behaviours. All 15 ordinary souls' wishes and memories were compared with `content.json`; the other rows come from a check of `engine.js` and `RULES.md`, so hero arrival timing and similar details may differ too.

| Topic | v0.7 today | Answer |
|---|---|---|
| Boarding | Anger resets to 0 | Reduce Anger by 3 |
| Memory use | Unlimited (`memoriesPerWindow` is null) | One per round |
| Polong arrivals | Every third round (`spawnInterval`) | Per-cycle counts from the milestone table |
| Calm | One chosen soul | "Reduce ship anger by 1" |
| White flag | One soul, Anger -3 | Boat anger -3 |
| Priest | Recovers at the next boarding | Does not return to normal |
| Moly | Existing Polongs stay aboard | Existing Polongs leave the ship |
| Protecting the Merchant | Blacksmith blocks Anger | Decision 7 |
| Heroes' wish | Haven | Random from the destinations |
| Red and Blue Soldier | Wish Styx, Full Fog Protection | Tartarus and Asphodel, Guard |
| Messenger | Wish Styx | Asphodel |
| Blacksmith | Wish Heaven, no ordinary memory | Acheron, Fog shield |
| Farmer | Shared Harvest | Calm |
| Destinations | 7 including Heaven | Decision 1 |
