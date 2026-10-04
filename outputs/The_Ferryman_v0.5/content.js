/* Generated from content.json by tools/build.py. */
window.FerryData = {
  "version": "0.5",
  "title": "The Ferryman: One Night on the River",
  "config": {
    "trips": 4,
    "targetWishes": 8,
    "startLight": 5,
    "maxLight": 6,
    "seats": 4,
    "shoreTarget": 5,
    "handLimit": 3,
    "maxSteps": 3,
    "patience": 5,
    "taintedLimit": 2,
    "pressure": [
      0,
      0,
      1,
      1
    ]
  },
  "destinations": {
    "elysium": {
      "name": "Elysium",
      "color": "#477455",
      "symbol": "LEAF"
    },
    "asphodel": {
      "name": "Asphodel",
      "color": "#486f91",
      "symbol": "WAVE"
    },
    "tartarus": {
      "name": "Tartarus",
      "color": "#a84d3d",
      "symbol": "FIRE"
    },
    "styx": {
      "name": "Styx",
      "color": "#6b5285",
      "symbol": "STAR"
    },
    "haven": {
      "name": "Haven",
      "color": "#957020",
      "symbol": "LAMP"
    },
    "sanctuary": {
      "name": "Sanctuary",
      "color": "#477f7b",
      "symbol": "DAWN"
    }
  },
  "souls": [
    {
      "id": "S01",
      "name": "Mother",
      "seats": 1,
      "wish": "elysium",
      "memory": "M01",
      "tainted": false,
      "patience": 5,
      "art": "mother.png",
      "text": "Quest: deliver Mother and Child together with both wishes met. Earn the Passage token once."
    },
    {
      "id": "S02",
      "name": "Child",
      "seats": 1,
      "wish": "elysium",
      "memory": "M02",
      "tainted": false,
      "patience": 5,
      "art": "child.png",
      "text": "Quest partner: Mother. The pair arrives together; both cards stay visible."
    },
    {
      "id": "S03",
      "name": "Red Soldier",
      "seats": 1,
      "wish": "tartarus",
      "memory": "M03",
      "tainted": false,
      "patience": 5,
      "art": "red-soldier.png",
      "text": "Rivals: while both soldiers are aboard, add 1 fog to each move."
    },
    {
      "id": "S04",
      "name": "Blue Soldier",
      "seats": 1,
      "wish": "asphodel",
      "memory": "M04",
      "tainted": false,
      "patience": 5,
      "art": "blue-soldier.png",
      "text": "Rivals: while both soldiers are aboard, add 1 fog to each move. Count the pair only once."
    },
    {
      "id": "S05",
      "name": "Killer",
      "seats": 1,
      "wish": "tartarus",
      "memory": "M05",
      "tainted": true,
      "patience": 5,
      "art": null,
      "text": "Drain 1 light before fog on every move aboard. Tainted: deliver by boat move 2 or become a Ship Wraith."
    },
    {
      "id": "S06",
      "name": "Fool",
      "seats": 1,
      "wish": "asphodel",
      "memory": "M06",
      "tainted": true,
      "patience": 3,
      "art": null,
      "text": "Waiting deadline: tide +3, not +5. Tainted: deliver by boat move 2 or become a Ship Wraith."
    },
    {
      "id": "S07",
      "name": "Po Din",
      "seats": 1,
      "wish": "elysium",
      "memory": null,
      "tainted": false,
      "patience": 5,
      "art": null,
      "text": "Leaves no memory, even when the wish is met. A matched delivery still counts as a wish."
    },
    {
      "id": "S08",
      "name": "Achilles",
      "seats": 2,
      "wish": "styx",
      "memory": "M08",
      "tainted": false,
      "patience": 5,
      "art": null,
      "text": "Occupies 2 seats. Wishes for Styx. Ordinary destinations accept Achilles without fulfilling that wish."
    },
    {
      "id": "S09",
      "name": "Quiet Soul A",
      "seats": 1,
      "wish": "elysium",
      "memory": "M09",
      "tainted": false,
      "patience": 5,
      "art": null,
      "text": "A simple passenger. Deliver by boat move 3. This is a provisional filler soul."
    },
    {
      "id": "S10",
      "name": "Quiet Soul B",
      "seats": 1,
      "wish": "asphodel",
      "memory": "M10",
      "tainted": false,
      "patience": 5,
      "art": null,
      "text": "A simple passenger. Deliver by boat move 3. This is a provisional filler soul."
    },
    {
      "id": "S11",
      "name": "Quiet Soul C",
      "seats": 1,
      "wish": "tartarus",
      "memory": "M11",
      "tainted": false,
      "patience": 5,
      "art": null,
      "text": "A simple passenger. Deliver by boat move 3. This is a provisional filler soul."
    },
    {
      "id": "S12",
      "name": "Quiet Soul D",
      "seats": 1,
      "wish": "elysium",
      "memory": "M12",
      "tainted": false,
      "patience": 5,
      "art": null,
      "text": "A simple passenger. Deliver by boat move 3. This is a provisional filler soul."
    },
    {
      "id": "S13",
      "name": "Tainted Soul A",
      "seats": 1,
      "wish": "asphodel",
      "memory": "M13",
      "tainted": true,
      "patience": 5,
      "art": null,
      "text": "Tainted: deliver by boat move 2 or become a Ship Wraith. Provisional filler soul."
    },
    {
      "id": "S14",
      "name": "Tainted Soul B",
      "seats": 1,
      "wish": "tartarus",
      "memory": "M14",
      "tainted": true,
      "patience": 5,
      "art": null,
      "text": "Tainted: deliver by boat move 2 or become a Ship Wraith. Provisional filler soul."
    }
  ],
  "memories": [
    {
      "id": "M01",
      "name": "A Mother's Promise",
      "kind": "calm",
      "amount": 2,
      "text": "Add 2 to one waiting soul's deadline."
    },
    {
      "id": "M02",
      "name": "Small Warmth",
      "kind": "light",
      "amount": 1,
      "text": "Restore 1 light, up to 6, before this move."
    },
    {
      "id": "M03",
      "name": "Red Oath",
      "kind": "fog",
      "amount": 2,
      "text": "Prevent 2 fog on this move."
    },
    {
      "id": "M04",
      "name": "Blue Oath",
      "kind": "fog",
      "amount": 2,
      "text": "Prevent 2 fog on this move."
    },
    {
      "id": "M05",
      "name": "Last Confession",
      "kind": "fog",
      "amount": 2,
      "text": "Prevent 2 fog on this move."
    },
    {
      "id": "M06",
      "name": "A Fool's Laughter",
      "kind": "calm",
      "amount": 2,
      "text": "Add 2 to one waiting soul's deadline."
    },
    {
      "id": "M08",
      "name": "The Hero's Oath",
      "kind": "fog",
      "amount": 3,
      "text": "Prevent 3 fog on this move."
    },
    {
      "id": "M09",
      "name": "Road Remembered",
      "kind": "fog",
      "amount": 1,
      "text": "Prevent 1 fog on this move."
    },
    {
      "id": "M10",
      "name": "A Window Lit",
      "kind": "light",
      "amount": 1,
      "text": "Restore 1 light, up to 6, before this move."
    },
    {
      "id": "M11",
      "name": "Unfinished Song",
      "kind": "fog",
      "amount": 1,
      "text": "Prevent 1 fog on this move."
    },
    {
      "id": "M12",
      "name": "A Familiar Path",
      "kind": "fog",
      "amount": 1,
      "text": "Prevent 1 fog on this move."
    },
    {
      "id": "M13",
      "name": "A Quiet Apology",
      "kind": "light",
      "amount": 1,
      "text": "Restore 1 light, up to 6, before this move."
    },
    {
      "id": "M14",
      "name": "Last Footstep",
      "kind": "fog",
      "amount": 1,
      "text": "Prevent 1 fog on this move."
    }
  ],
  "routes": [
    {
      "id": "R01",
      "name": "Fields of Rest",
      "to": "elysium",
      "fog": 1,
      "text": "Deliver any passengers. Only Elysium wishes match."
    },
    {
      "id": "R02",
      "name": "Garden Landing",
      "to": "elysium",
      "fog": 2,
      "text": "Deliver any passengers. Only Elysium wishes match."
    },
    {
      "id": "R03",
      "name": "Reed Channel",
      "to": "asphodel",
      "fog": 1,
      "text": "Deliver any passengers. Only Asphodel wishes match."
    },
    {
      "id": "R04",
      "name": "Grey Meadows",
      "to": "asphodel",
      "fog": 2,
      "text": "Deliver any passengers. Only Asphodel wishes match."
    },
    {
      "id": "R05",
      "name": "Ashen Gate",
      "to": "tartarus",
      "fog": 1,
      "text": "Deliver any passengers. Only Tartarus wishes match."
    },
    {
      "id": "R06",
      "name": "Iron Crossing",
      "to": "tartarus",
      "fog": 2,
      "text": "Deliver any passengers. Only Tartarus wishes match."
    },
    {
      "id": "R07",
      "name": "River of Oaths",
      "to": "styx",
      "fog": 2,
      "text": "Deliver any passengers. Only Achilles' Styx wish matches."
    },
    {
      "id": "R08",
      "name": "Lantern Haven",
      "to": "haven",
      "fog": 0,
      "text": "Deliver nobody. Restore 1 light after fog. All clocks advance; passengers can expire here."
    },
    {
      "id": "R09",
      "name": "Last Sanctuary",
      "to": "sanctuary",
      "fog": 0,
      "text": "All delivered passengers match their wishes. Gain no light or memories here. Retire this route after using it."
    },
    {
      "id": "R10",
      "name": "Deep Reeds",
      "to": "asphodel",
      "fog": 1,
      "text": "Deliver any passengers. Only Asphodel wishes match."
    }
  ],
  "arrivals": [
    {
      "id": "A01",
      "name": "Mother and Child",
      "souls": [
        "S01",
        "S02"
      ]
    },
    {
      "id": "A02",
      "name": "Rival Soldiers",
      "souls": [
        "S03",
        "S04"
      ]
    },
    {
      "id": "A03",
      "name": "Killer",
      "souls": [
        "S05"
      ]
    },
    {
      "id": "A04",
      "name": "Fool",
      "souls": [
        "S06"
      ]
    },
    {
      "id": "A05",
      "name": "Po Din",
      "souls": [
        "S07"
      ]
    },
    {
      "id": "A06",
      "name": "Achilles",
      "souls": [
        "S08"
      ]
    },
    {
      "id": "A07",
      "name": "Quiet Soul A",
      "souls": [
        "S09"
      ]
    },
    {
      "id": "A08",
      "name": "Quiet Soul B",
      "souls": [
        "S10"
      ]
    },
    {
      "id": "A09",
      "name": "Quiet Soul C",
      "souls": [
        "S11"
      ]
    },
    {
      "id": "A10",
      "name": "Quiet Soul D",
      "souls": [
        "S12"
      ]
    },
    {
      "id": "A11",
      "name": "Tainted Soul A",
      "souls": [
        "S13"
      ]
    },
    {
      "id": "A12",
      "name": "Tainted Soul B",
      "souls": [
        "S14"
      ]
    }
  ],
  "events": [
    {
      "id": "E01",
      "name": "Thickening Mist",
      "text": "This trip's first outward move has +1 fog. Return is unaffected."
    },
    {
      "id": "E02",
      "name": "Restless Shore",
      "text": "Before refilling, subtract 1 from every waiting deadline. Immediately turn any now-due soul into a Wraith. New arrivals are unaffected."
    },
    {
      "id": "E03",
      "name": "Narrow Channel",
      "text": "The boat has only 3 seats for this trip."
    },
    {
      "id": "E04",
      "name": "Merciful Current",
      "text": "This trip's first outward move has base fog 0. Other fog and Killer drain still apply."
    }
  ],
  "guide": [
    {
      "title": "YOUR NIGHT",
      "text": "One player. Finish 4 trips with at least 8 fulfilled wishes. Survive the final return. An empty shore and supply after a return ends the night early at the same target. Lose if a move costs more light than you have. Zero survives. Target: 20-30 minutes, untested with humans."
    },
    {
      "title": "SET UP",
      "text": "Start with light 5/6, trip 1, tide 0, no memories or Wraiths. Shuffle Arrivals, Routes and Events separately. Draw Arrivals until at least 5 souls wait; a pair may make 6. Write each deadline: tide +5, or +3 for Fool. Reveal 2 Routes."
    },
    {
      "title": "1 / BOARD",
      "text": "Choose passengers within 4 seats; Achilles takes 2. Board at least one. Passenger cards stay visible. You may change the load before departure. Read the two Routes before deciding."
    },
    {
      "title": "2 / CHOOSE AND PAY",
      "text": "Choose a revealed Route. Optional: spend one memory, once only. Restore its light or change its target deadline first. Fog = route base + pressure + Wraiths + rival pair + Event - memory shield (minimum 0). Pay Killer's 1 light separately, then fog. If you cannot pay, lose. Discard both offered Routes; reshuffle discards when the pile runs out."
    },
    {
      "title": "3 / ADVANCE AND DELIVER",
      "text": "After surviving, advance tide and boat move by 1. Any waiting deadline now reached becomes a Wraith, affecting the next move. At ordinary stops, deliver any passengers. Each matching wish scores 1 and earns that soul's memory; gain only 1 light total per stop with matches. Keep at most 3 memories. Unmatched deliveries give nothing."
    },
    {
      "title": "4 / CHECK THE BOAT",
      "text": "After delivery, tainted passengers still aboard on move 2 become Ship Wraiths. All others still aboard on move 3 do so. Each Wraith adds 1 fog on later moves. Draw 2 new Routes if passengers remain. At 3 boat moves, return is the only next move."
    },
    {
      "title": "5 / RETURN",
      "text": "Return only with an empty boat. Return base fog is 0; pressure and Wraiths still apply. You may spend one memory. Advance tide and resolve due waiting souls; no free recovery. Begin the next trip, refill the shore and reset boat moves. Reveal an Event before refill on trips 2 and 4. Pressure: +0 on trips 1-2; +1 on trips 3-4."
    },
    {
      "title": "SPECIAL STOPS AND QUEST",
      "text": "Haven: no delivery; +1 light after paying, but clocks and Ship Wraiths still apply. Sanctuary: any wishes match; no light or memories, then retire its Route. Mother + Child matched together earn Passage once: before a move, send one waiting soul directly to its wish for 1 score only. Full details and an example follow in the kit."
    }
  ]
};
