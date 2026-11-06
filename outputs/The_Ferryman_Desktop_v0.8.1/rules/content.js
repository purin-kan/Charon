globalThis.FerryData = {
  "schemaVersion": 3,
  "version": "0.8-t45b",
  "title": "The Ferryman",
  "config": {
    "startLight": 6,
    "maxLight": 6,
    "seats": 4,
    "shoreTarget": 5,
    "shoreAngerLimit": 2,
    "shipAngerLimit": 5,
    "handLimit": 3,
    "longsPerCycle": [
      {
        "fromCycle": 3,
        "count": 1
      },
      {
        "fromCycle": 9,
        "count": 2
      },
      {
        "fromCycle": 18,
        "count": 3
      }
    ],
    "longForkChoices": 3,
    "polongFogThreshold": 2,
    "polongFog": 1,
    "returnLight": 1,
    "wraithDamage": 1,
    "foresightForks": 3,
    "heroArrival": {
      "SOUL-ODYSSEUS": {
        "fromCycle": 6,
        "chance": 25
      },
      "SOUL-HERACLES": {
        "fromCycle": 9,
        "chance": 25
      }
    },
    "memoriesPerWindow": 1,
    "endless": true,
    "initialShore": [
      "SOUL-MOTHER",
      "SOUL-CHILD",
      "SOUL-MERCHANT",
      "SOUL-MASON",
      "SOUL-COOK"
    ],
    "initialArrivals": [
      "SOUL-POET",
      "SOUL-KEEPER",
      "SOUL-RED-SOLDIER",
      "SOUL-BLUE-SOLDIER",
      "SOUL-MESSENGER",
      "SOUL-MUSICIAN",
      "SOUL-LISTENER",
      "SOUL-FARMER",
      "SOUL-BLACKSMITH",
      "SOUL-PRIEST"
    ]
  },
  "souls": [
    {
      "id": "SOUL-MOTHER",
      "name": "Mother",
      "personalName": "Penelope",
      "seats": 1,
      "wish": "DEST-TARTARUS",
      "memory": "MEM-LIGHT",
      "ordinary": true,
      "tainted": false
    },
    {
      "id": "SOUL-CHILD",
      "name": "Child",
      "personalName": "Theo",
      "seats": 1,
      "wish": "DEST-HAVEN",
      "memory": null,
      "ordinary": true,
      "tainted": false
    },
    {
      "id": "SOUL-MERCHANT",
      "name": "Merchant",
      "personalName": "Hermon",
      "seats": 1,
      "wish": "DEST-STYX",
      "memory": "MEM-FORESIGHT",
      "ordinary": true,
      "tainted": false
    },
    {
      "id": "SOUL-POET",
      "name": "Poet",
      "personalName": "Sappho",
      "seats": 1,
      "wish": "DEST-ELYSIUM",
      "memory": "MEM-FORESIGHT",
      "ordinary": true,
      "tainted": false
    },
    {
      "id": "SOUL-COOK",
      "name": "Cook",
      "personalName": "Sikon",
      "seats": 1,
      "wish": "DEST-ASPHODEL",
      "memory": "MEM-CALM",
      "ordinary": true,
      "tainted": false
    },
    {
      "id": "SOUL-MASON",
      "name": "Mason",
      "personalName": "Petros",
      "seats": 1,
      "wish": "DEST-ACHERON",
      "memory": "MEM-FOG",
      "ordinary": true,
      "tainted": false
    },
    {
      "id": "SOUL-KEEPER",
      "name": "Keeper",
      "personalName": "Hero",
      "seats": 1,
      "wish": "DEST-ASPHODEL",
      "memory": "MEM-FOG",
      "ordinary": true,
      "tainted": false
    },
    {
      "id": "SOUL-POLONG",
      "name": "Long Mist",
      "seats": 0,
      "wish": "DEST-TARTARUS",
      "memory": null,
      "ordinary": false,
      "tainted": true,
      "text": "Adds 1 fog at Anger 2–3; empowered starts at Anger 1."
    },
    {
      "id": "SOUL-RED-SOLDIER",
      "name": "Red Soldier",
      "personalName": "Phoenix",
      "seats": 1,
      "wish": "DEST-STYX",
      "memory": "MEM-ALL-FOG",
      "ordinary": true,
      "tainted": false
    },
    {
      "id": "SOUL-BLUE-SOLDIER",
      "name": "Blue Soldier",
      "personalName": "Glaukos",
      "seats": 1,
      "wish": "DEST-STYX",
      "memory": "MEM-ALL-FOG",
      "ordinary": true,
      "tainted": false
    },
    {
      "id": "SOUL-MESSENGER",
      "name": "Messenger",
      "personalName": "Nikos",
      "seats": 1,
      "wish": "DEST-STYX",
      "memory": "MEM-FORESIGHT",
      "ordinary": true,
      "tainted": false
    },
    {
      "id": "SOUL-MUSICIAN",
      "name": "Bard",
      "personalName": "Homer",
      "seats": 1,
      "wish": "DEST-ELYSIUM",
      "memory": "MEM-CALM",
      "ordinary": true,
      "tainted": false
    },
    {
      "id": "SOUL-LISTENER",
      "name": "Listener",
      "personalName": "Echo",
      "seats": 1,
      "wish": "DEST-ELYSIUM",
      "memory": null,
      "ordinary": true,
      "tainted": false
    },
    {
      "id": "SOUL-FARMER",
      "name": "Farmer",
      "personalName": "Georgios",
      "seats": 1,
      "wish": "DEST-ASPHODEL",
      "memory": "MEM-CALM",
      "ordinary": true,
      "tainted": false
    },
    {
      "id": "SOUL-BLACKSMITH",
      "name": "Blacksmith",
      "personalName": "Chalkon",
      "seats": 1,
      "wish": "DEST-ACHERON",
      "memory": null,
      "ordinary": true,
      "tainted": false
    },
    {
      "id": "SOUL-PRIEST",
      "name": "Priest",
      "personalName": "Elias",
      "seats": 1,
      "wish": "DEST-HAVEN",
      "memory": "MEM-LAST-PRAYER",
      "ordinary": true,
      "tainted": false
    },
    {
      "id": "SOUL-PO-LUEM",
      "name": "Long Hollow",
      "seats": 0,
      "wish": "DEST-ASPHODEL",
      "memory": null,
      "ordinary": false,
      "tainted": true,
      "text": "After its boarding round, takes one memory each round. Empowered chooses randomly."
    },
    {
      "id": "SOUL-PO-NAK",
      "name": "Long Burden",
      "seats": 0,
      "wish": "DEST-ACHERON",
      "memory": null,
      "ordinary": false,
      "tainted": true,
      "text": "Uses one seat, or two when empowered. Over capacity adds 1 total fog."
    },
    {
      "id": "SOUL-PO-MUED",
      "name": "Long Veil",
      "seats": 0,
      "wish": "DEST-STYX",
      "memory": null,
      "ordinary": false,
      "tainted": true,
      "text": "Conceals one route option, or both when empowered. Foresight reveals them."
    },
    {
      "id": "SOUL-PO-DUE",
      "name": "Long Grasp",
      "seats": 0,
      "wish": "DEST-HAVEN",
      "memory": null,
      "ordinary": false,
      "tainted": true,
      "text": "Will only leave at Anger 2 or 3. Empowered delivery costs 1 Light."
    },
    {
      "id": "SOUL-HERACLES",
      "name": "Heracles the traveler",
      "seats": 1,
      "wish": "DEST-HAVEN",
      "memory": null,
      "ordinary": false,
      "tainted": false,
      "hero": true
    },
    {
      "id": "SOUL-ODYSSEUS",
      "name": "Odysseus the traveler",
      "seats": 1,
      "wish": "DEST-HAVEN",
      "memory": null,
      "ordinary": false,
      "tainted": false,
      "hero": true
    },
    {
      "id": "CHAR-CERBERUS",
      "name": "Cerberus",
      "seats": 1,
      "wish": "DEST-HAVEN",
      "memory": null,
      "ordinary": false,
      "tainted": false,
      "hero": true
    }
  ],
  "destinations": [
    {
      "id": "DEST-HAVEN",
      "name": "Haven",
      "fog": 0
    },
    {
      "id": "DEST-STYX",
      "name": "River Styx",
      "fog": 1
    },
    {
      "id": "DEST-ACHERON",
      "name": "Acheron",
      "fog": 1
    },
    {
      "id": "DEST-ASPHODEL",
      "name": "Asphodel",
      "fog": 2
    },
    {
      "id": "DEST-ELYSIUM",
      "name": "Elysium",
      "fog": 3
    },
    {
      "id": "DEST-TARTARUS",
      "name": "Tartarus",
      "fog": 3
    }
  ],
  "memories": [
    {
      "id": "MEM-LIGHT",
      "name": "Light",
      "kind": "light",
      "amount": 1,
      "text": "Restore 1 Light, up to your current maximum."
    },
    {
      "id": "MEM-FORESIGHT",
      "name": "Foresight",
      "kind": "foresight",
      "amount": 3,
      "text": "Reveal both options at the current fork and next two forks. Revealed options stay visible for this cycle."
    },
    {
      "id": "MEM-GUARD",
      "name": "Guard",
      "kind": "guard",
      "amount": 1,
      "text": "Prevent the next 1 point of damage this outward round or return. Does not stack."
    },
    {
      "id": "MEM-CALM",
      "name": "Calm",
      "kind": "calm",
      "amount": 1,
      "text": "Reduce the Anger of every soul on the boat by 1, minimum 0, Longs included. Souls on the shore are not affected."
    },
    {
      "id": "MEM-FOG",
      "name": "Fog Shield",
      "kind": "fog",
      "amount": 1,
      "text": "Reduce total fog for this crossing by 1, minimum 0. It does not prevent wraith damage."
    },
    {
      "id": "MEM-PASSAGE",
      "name": "Passenger",
      "kind": "passage",
      "amount": 1,
      "text": "Deliver one eligible onboard passenger directly to its wish. No travel fog, route count or scheduled arrival; delivery restrictions and quest consequences still apply."
    },
    {
      "id": "MEM-LAST-PRAYER",
      "name": "Last Prayer",
      "kind": "light",
      "amount": 1,
      "text": "Restore 1 Light up to your current maximum."
    },
    {
      "id": "MEM-ALL-FOG",
      "name": "Full Fog Protection",
      "kind": "all-fog",
      "amount": 0,
      "text": "Prevent all fog on this crossing. Does not prevent Wraith damage."
    },
    {
      "id": "MEM-LAST-MASTERWORK",
      "name": "Sword",
      "kind": "sword",
      "amount": 0,
      "text": "Remove one tainted passenger. No reward, Wraith damage or spread."
    },
    {
      "id": "MEM-SOLDIER-PEACE",
      "name": "Soldiers’ Peace",
      "kind": "calm",
      "amount": 3,
      "text": "Reduce the Anger of every soul on the boat by 3, minimum 0, Longs included. Souls on the shore are not affected."
    },
    {
      "id": "MEM-BOAT-SPACE",
      "name": "Boat Space",
      "kind": "capacity",
      "amount": 1,
      "text": "One extra seat until the next return. Does not stack."
    },
    {
      "id": "MEM-GOLDEN-APPLE",
      "name": "Golden Apple",
      "kind": "apple",
      "amount": 1,
      "text": "Increase maximum Light by 1 for this run and restore Light to that maximum."
    },
    {
      "id": "MEM-MOLY",
      "name": "Moly of Hermes",
      "kind": "moly",
      "amount": 0,
      "text": "Every Long on the boat leaves, including souls turned into a Long. No scheduled Long boards until the next return."
    },
    {
      "id": "MEM-NOBODY",
      "name": "Nobody",
      "kind": "nobody",
      "amount": 0,
      "text": "Prevent all crossing fog until the next return. Other damage still applies."
    }
  ],
  "roundSteps": [
    "Use available abilities before approaching the fork. One held memory may be played at any point of the stop: before the fork, at the fork or review, or at delivery. Excess rewards cannot be played before trimming.",
    "Approach the fork: advance the outward round and board any Long scheduled for this fork unless Moly suppresses it. Its level/effects apply immediately.",
    "Choose a visible or concealed option, review, then confirm. Pay fog after protection. Zero Light ends the run immediately.",
    "Resolve a heroic encounter or Tiresias choice, then optionally deliver eligible passengers.",
    "Resolve pair shared-crossing effects, then ordinary Anger and Restless River rolls.",
    "Resolve Wraith damage, removals and eligible spread. Long Hollow takes memories; choose excess memories to discard to three.",
    "Begin the next memory window, or return if the boat is empty."
  ],
  "returnSteps": [
    "With an empty boat, one held memory may be played.",
    "Waiting souls gain one Anger; at two, resolve Wraith damage/removal. Zero Light ends the run before healing.",
    "If alive, recover 1 Light up to the current maximum. Expire trip effects, refill shore and prepare the next hero offer."
  ],
  "rules": {
    "scope": "Quest prototype: eight quests and five Longs. Scale progression is pending team direction; roster entries with unspecified rules are listed as TBA.",
    "objective": "Keep the lantern burning through repeated trips. Zero Light ends the run. This trial has no victory or cycle cap.",
    "boarding": "Select ordinary passengers within capacity. Heroes need a seat. A hero can be offered at boarding only from cycle 6 (Odysseus) or cycle 9 (Heracles), each with a 25% chance; Heracles also needs more than three shore souls, and at most one hero is offered at a time. Merchant, Blacksmith and Mason cannot depart together. Souls reset Anger on departure. The next Long is shown before departure.",
    "memories": "One memory per stop (before the fork, at the fork or review, or at delivery), one at boarding (Boat Space only, which is played only then) and one on the return trip. Each use consumes one held copy. Fog Shield, Full Fog Protection and Guard protect a crossing, so they are not played at delivery. Any passenger, Longs included, may leave at any stop (away from its wish it costs 1 Light, which Guard cannot prevent, and the last Light ends the run), except that Long Grasp will not leave below Anger 2 and Heracles and Odysseus keep their own exits. If Mason leaves before the Merchant or before the last passenger (Longs are not passengers), his quest fails. Only a passenger delivered to its wish gives its memory; quest rewards are separate. End-round hand limit is three. Overflow cannot be spent before trimming. Sword removes a tainted passenger without expiry consequences.",
    "quest": "All eight quests are active. Pair attempts bind to characters that depart together and can repeat only with fresh returned character instances. Loss/transformation fails an unfinished attempt. A quest passenger that leaves at a stop other than its wish fails its quest. The journal shows stages and restrictions.",
    "routes": "All six destinations are open for this trial. Heaven is merged into Haven. Hero wishes draw from the six destinations, and Cerberus shares Heracles’ second wish. Routes and random losses use saved randomness. Base route fog rises by 1 from cycle 6 and by 2 from cycle 12, except Haven.",
    "polongs": "Longs arrive from cycle 3: one per cycle from cycle 3, two from cycle 9, three from cycle 18. When the boat departs, each is given one of the first three forks of the trip; a trip that ends before that fork skips it. Moly suppresses them. Encounters escalate independently from the round counter. See the accepted trial-rules document for all five Longs, concealment, Restless River, memory theft, overload, refusal and spread.",
    "effects": "Capacity, Moly and Nobody expire at the next return. Capacity and effect duration do not stack. Golden Apple permanently increases maximum Light by 1 per use during this run. Priest purification is once per boarding and forfeits his memory for that boarding.",
    "recycling": "Resolved ordinary characters return to the arrival pool when it empties, using their origin identity. A transformed Listener returns as Listener; a corrupted ordinary soul returns as its original character. Hero offers are separate.",
    "damage": "Fog protection does not prevent Wraith or toll damage. Long Mist delivered normally to Tartarus restores 1 Light; Passenger and Sword do not. Other Longs grant no Light or memory."
  },
  "authority": [
    "TRIAL_RULES_DRAFT.md",
    "IMPLEMENTATION_STATUS.md"
  ],
  "trial": {
    "stage": "All-quest local trial",
    "notice": "Quest prototype: eight quests and five Longs. Scale progression is pending team direction; roster entries with unspecified rules are listed as TBA.",
    "sourceModifiedTime": "2026-10-29T19:37:27.386Z",
    "pending": [
      "Team direction on Scale unlocks and adaptive routes",
      "Drug Dealer, Fool and Killer playable rules",
      "Human playtesting and balance",
      "Final engine and artwork"
    ],
    "approvedRules": "TRIAL_RULES_DRAFT.md",
    "rosterSynced": "2026-10-30"
  },
  "quests": [
    {
      "id": "QUEST-FAMILY",
      "name": "Mother and Child",
      "roles": [
        "SOUL-MOTHER",
        "SOUL-CHILD"
      ],
      "reward": "MEM-PASSAGE",
      "description": "Depart together. Deliver Child to Haven, then Mother to Tartarus."
    },
    {
      "id": "QUEST-SOLDIERS",
      "name": "The two soldiers",
      "roles": [
        "SOUL-RED-SOLDIER",
        "SOUL-BLUE-SOLDIER"
      ],
      "reward": "MEM-SOLDIER-PEACE",
      "description": "Others gain +1 Anger every second shared crossing. Deliver both soldiers."
    },
    {
      "id": "QUEST-LISTENER",
      "name": "A poet awakens",
      "roles": [
        "SOUL-MUSICIAN",
        "SOUL-LISTENER"
      ],
      "reward": null,
      "description": "Keep Bard and Listener together for three completed crossings; Listener becomes Poet."
    },
    {
      "id": "QUEST-MEAL",
      "name": "A shared meal",
      "roles": [
        "SOUL-FARMER",
        "SOUL-COOK"
      ],
      "reward": null,
      "description": "Prepare a meal once per boarding: every other soul on the boat −1 Anger, Longs included; the Cook does not eat and is stressed, +2 Anger. A Farmer who shared the meal gives no memory when he gets off."
    },
    {
      "id": "QUEST-SWORD",
      "name": "The last masterwork",
      "roles": [
        "SOUL-MERCHANT",
        "SOUL-BLACKSMITH"
      ],
      "reward": "MEM-LAST-MASTERWORK",
      "description": "Blacksmith guards Merchant in the story only. Deliver Merchant before Blacksmith to earn the Sword; any other order gives no Sword."
    },
    {
      "id": "QUEST-BOAT",
      "name": "Room for one more",
      "roles": [
        "SOUL-MERCHANT",
        "SOUL-MASON"
      ],
      "reward": "MEM-BOAT-SPACE",
      "description": "Deliver Merchant, then Mason as the last passenger."
    },
    {
      "id": "QUEST-HERACLES",
      "name": "Heracles the traveler and Cerberus",
      "roles": [
        "SOUL-HERACLES"
      ],
      "reward": "MEM-GOLDEN-APPLE",
      "description": "Pay Hades’ toll, reach Heracles’ first wish, then deliver both Heracles and Cerberus."
    },
    {
      "id": "QUEST-ODYSSEUS",
      "name": "Odysseus the traveler and Tiresias",
      "roles": [
        "SOUL-ODYSSEUS"
      ],
      "reward": null,
      "description": "Reach Odysseus’ wish and choose Charybdis or Scylla."
    }
  ],
  "pendingSouls": [
    {
      "id": "SOUL-DRUG-DEALER",
      "name": "Drug Dealer",
      "wish": null,
      "memory": null,
      "ability": null,
      "status": "Rules TBA",
      "description": "Included roster entry. Wish, memory and ability have not been specified."
    },
    {
      "id": "SOUL-FOOL",
      "name": "Fool",
      "wish": null,
      "memory": null,
      "ability": null,
      "status": "Rules TBA",
      "description": "Included roster entry. Wish, memory and ability have not been specified."
    },
    {
      "id": "SOUL-KILLER",
      "name": "Killer",
      "wish": null,
      "memory": null,
      "ability": null,
      "status": "Rules TBA",
      "description": "Included roster entry. Wish, memory and ability have not been specified."
    }
  ],
  "contentSha256": "79f8f126bc74f16aca0f2054669b4c6ea80be857a39067fc77373dd2edaf8e2f"
}
;
