# Art direction proposal (Jaoguya, Nov 6, 2026)

Proposal for the art owner (Kanyakorn-goya). Not an approved decision.

## Problem

* After demoing the desktop build (v0.8.1), the game feels joyful and cute, not like ferrying souls of the dead across a dark river.
* Soul sprites: soft anime chibi style on white, with butterflies and sparkles.
* Backgrounds and routes: bright purple skies, glowing flowers and fireflies. It reads as a fantasy garden, not the underworld.
* It no longer matches our earlier art. The workshop kit (v0.3) and the v0.6 play cards used dark, painted, realistic portraits with fog, low light and muted teal and stone colours.

| | Workshop / v0.6 cards | Current v0.8.1 sprites |
| --- | --- | --- |
| Style | Painted, realistic portrait | Anime chibi |
| Mood | Sombre, misty, quiet | Bright, sweet |
| Background | Dark fog | White or purple with sparkles |
| Light | One warm source (lantern) in the dark | Even, soft glow |

## Proposal

1. Reuse the old art we already have:
   * v0.6 soul cards: Mother, Child, Merchant, Poet, Cook, Mason, Keeper, Soldier.
   * Farmer, Blacksmith and Priest (normal and exhausted), already in that style.
   * v0.6 backgrounds: shore, Styx, Acheron, Asphodel, Elysium, Tartarus, Haven.
   * v0.6 memory cards.
   * Workshop kit art: the 12 soul cards, the wraith and the apprentice.
   * Most are in `outputs/The_Ferryman_Desktop_v0.8.1/assets/source-art/`; the workshop files can be restored with `git checkout faf9ea5 -- outputs/The_Ferryman_Workshop_Kit_v0.3/assets/art`.
2. Generate new art in the same style for everything without it:
   * The Longs family: Burden, Grasp, Hollow, Mist and Veil.
   * The heroic souls: Heracles, Odysseus, Cerberus, Scylla and Tiresias.
   * Every newer soul: Messenger, Bard, Listener, and separate Red and Blue Soldiers.
   * The Wraith transformation frames.
3. Poron, our character: a proper avatar in the same style. The workshop `apprentice.png` (hooded figure with a lantern) could be the base.
4. One style everywhere: souls, Longs, heroes, Poron, routes and every scene background share the same painting style, colours and lighting.

## Style guide (suggestion)

* Painterly and realistic like the v0.6 cards; no chibi or anime.
* Palette: deep teal, slate, mist grey and stone; warm gold only for the lantern and Light.
* Dark scenes with one warm light source and fog at the edges.
* Souls as portrait cards (512 x 768 or larger, like v0.6), plus a cut-out version for the boat if needed.
* Longs: same style but corrupted (darker, distorted, hollow eyes).
* Heroes: same style with slightly more presence, such as a stronger rim light.

## Decisions needed (Kanyakorn-goya)

* Go back to the workshop / v0.6 style?
* Which old pieces can be reused as they are?
* Who makes the new pieces, and by when? The presentation is Nov 8.
* The current v4 handoff art: keep it as a fallback, or remove it?

The game loads art by file name (`sprite-<soul>.png`, `bg-<place>.png`, `memory-<id>.png`), so new files drop in without code changes.
