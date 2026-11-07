# The Ferryman: 2D concept

A concept of how the final game could look as a 2D side-view game. Open `index.html` in Chrome or Edge (double-click works; no install or server needed). Fonts load from Google Fonts when online and fall back to Georgia offline.

## What it shows

- **Boarding as a scene.** Souls stand on the shore. Click one and it walks down the pier, hops into the boat and takes a bench. Click it again and it walks back to its spot. The Soldier takes two benches; if there is no gap, the others slide along.
- **Crossing.** Two signs mark each fork. Pick one, then row. The shore scrolls away, the boat crosses open water, fog rolls in and lantern flames go out for each point of Light lost. Every third round a PoLong rises from the water and climbs aboard.
- **Arriving.** The destination painting becomes the backdrop. Souls who wish to rest there glow. Click them to stand them up, then let them off: they walk ashore and rise in a beam of light, and their memory flies into your hand.
- **Anger and wraiths.** Pips over each head show anger. Souls who reach the limit turn red, rise and vanish, costing Light.
- **Rowing home.** The empty boat returns, waiting souls grow angry, the lantern recovers and new souls walk in from the left.
- **Memories.** Cards at the top right. Calm and Passage ask for a target soul. Passage lifts the soul straight out of the boat.
- Hover a soul to see its painted portrait, wish, seats, reward and anger.

## What is and is not new

- `asset-map.js` is an unchanged copy from `../The_Ferryman_v0.6/`. `engine.js` and `content.js` are v0.6 copies with one rule change the user asked for on October 30, 2026: a memory is still limited to one per outward round or return, but it can now be played at any point (while boarding, at a fork, at a dock, or on the way home, including the return after Passage). Passage and Fog Shield cannot be played at a dock. Every other rule and value is as in v0.6, so this copy no longer matches the v0.6 game or paper rules on memory timing.
- `index.html`, `game2d.css` and `game2d.js` are new. They only stage what the engine decides.
- Backdrops, portraits and memory art load from `../The_Ferryman_v0.6/assets/art/`, so keep both folders side by side.
- The walking souls, boat, ferryman and pier are simple vector placeholders drawn for this concept. They are not approved final art. A final version would replace them with sprite sheets (walk, sit, disembark, wraith) drawn in the style of the existing paintings.
- Saves use their own key (`the-ferryman:2d-concept:save`) and never touch v0.6 saves.

## Verification

Agent checks only, in headless Chrome 155 on Windows at 1600x900. A scripted walkthrough covered title, souls walking in, boarding walk and hop, tooltip, route signs, sailing, fog loss, arrival, choosing and disembarking. An automated policy played two full nights to zero Light: 11 crossings, 4 memories, 8 deliveries, PoLong boardings, a return trip and the family quest completing. No page errors were logged. Real phones, touch input, other browsers and human play are NOT_RUN. Portrait phone screens show the stage small with letterboxing; landscape is recommended.
