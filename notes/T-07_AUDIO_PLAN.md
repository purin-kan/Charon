# T-07 Audio Asset Strategy (draft)

Owner: VarisPah. Support: bosthanapatw. Due October 31, 2026. Draft for the team: the track list, names and sound direction below are proposals, not team approval. Nothing here has been listened to in the game yet.

Done when (task register): track list written, placeholder menu loop sourced, source and licence of each file recorded.

## 1. File rules

* **Folder:** `outputs/The_Ferryman_Desktop_v0.8.1/assets/audio/`, flat, no subfolders.
* **Format:** `.ogg` (Ogg Vorbis) only. `src/preloader.js` reads `assets/audio/*.ogg` and nothing else, so an `.mp3` or `.wav` dropped there is ignored.
* **Names:** lowercase kebab-case with a type prefix, matching the `sprite-` prefix proposed in T-03:
  * `bgm-` music that loops behind a scene
  * `amb-` ambient loops (water, wind, fog)
  * `sfx-` short one-shot sounds
* **Id = file name without `.ogg`.** `bgm-menu.ogg` is requested as `bgm-menu`. No manifest to edit.
* **Missing file = silence.** `playSound(this, id)` does nothing if the file is not there, so scene owners can add the calls before the audio exists.

Suggested export settings (Audacity: File > Export > Export as OGG): 44.1 kHz, quality 5 or so. Keep loops short (about 30 to 90 seconds) and cut at a point where the end joins the start without a click. Keep SFX under 2 seconds. Keep total audio small; Electron already makes the `.exe` large.

## 2. Track list

Plan scope: the five sound groups named in the project plan (menu BGM, crossing BGM, delivery jingle, wraith SFX, UI clicks) plus fog ambiance from T-28.

| Id | Type | Plays when | Scene (owner) | Loop | Task | Status |
|---|---|---|---|---|---|---|
| `bgm-menu` | Music | Title screen is open | TitleScene (Tinpatpun) | Yes | T-07 placeholder, T-15 final | Not started |
| `amb-crossing` | Ambient | Boat is on the river | CrossingScene (SupaOhm) | Yes | T-15 | Not started |
| `sfx-board` | SFX | A soul is dropped onto a boat seat (`BOARD`) | BoardingScene (SupaOhm) | No | T-15 | Not started |
| `sfx-unboard` | SFX | A soul is dragged back off the boat (also `BOARD`) | BoardingScene (SupaOhm) | No | T-15 | Not started |
| `sfx-ui-click` | SFX | Any button press | All scenes | No | T-15 | Not started |
| `amb-crossing-2` | Ambient | Alternative crossing loop (variant) | CrossingScene (SupaOhm) | Yes | T-28 | Not started |
| `amb-fog` | Ambient | Layered on top when fog is high | CrossingScene (SupaOhm) | Yes | T-28 | Not started |
| `sfx-delivery-success` | SFX (jingle) | A soul's wish matches the destination (`DELIVER`) | DeliveryScene (SupaOhm) | No | T-28 | Not started |
| `sfx-wraith` | SFX | A soul turns into a wraith on return | ReturnScene (Jaoguya) | No | T-28 | Not started |

Open questions for the team:

* What decides which crossing variant plays: random, by destination, or by cycle? Until decided, `amb-crossing-2` is just a spare loop.
* At what fog value does `amb-fog` start? This should read the engine's fog value, not a new rule in scene code.
* Should a failed delivery have its own sound, or stay silent?

## 3. Not in the plan (ideas only, need team OK)

These are not tasks. List them so the group can say yes or no before the Nov 6 freeze. If nobody agrees, they are dropped.

| Id | Plays when |
|---|---|
| `sfx-depart` | Boat leaves the shore (`DEPART`) |
| `sfx-memory-play` | A memory card is played (`PLAY_MEMORY`) |
| `sfx-light-loss` | Light drops during the crossing |
| `sfx-polong` | A Polong appears |
| `sfx-hero` | A hero encounter (Heracles, Odysseus, Cerberus) is offered |
| `bgm-game-over` | Game over screen |

## 4. How scenes use the sounds

Scene owners add the calls; VarisPah only drops files in. Example for the title screen:

```js
preload() {
  queueAssets(this, { audio: ['bgm-menu', 'sfx-ui-click'] });
}
create() {
  this.music = playSound(this, 'bgm-menu', { loop: true, volume: 0.6 });
}
```

Stop looping music when the scene shuts down (`this.music?.stop()` in the `shutdown` handler), or the menu music keeps playing under the next scene.

## 5. Where to get placeholder audio

Check the licence on the page at the moment you download, and record it. Do not commit a file whose licence you cannot name. The repo never assigns an invented licence.

* **Make it yourself:** BeepBox or Bosca Ceoil for short music loops, jsfxr / sfxr for clicks and jingles, Audacity for recorded water or wind. Self-made files are the simplest to record.
* **CC0 packs:** Kenney.nl audio packs (UI and interface sounds) are published as CC0. OpenGameArt.org and Freesound.org can be filtered to CC0.
* **CC-BY:** allowed, but the author must be credited in the credits note (bosthanapatw collects credits for the README).
* **Avoid:** files with no stated licence, "free" YouTube music, ripped game soundtracks, and anything marked non-commercial unless the group agrees.

## 6. Rights record

When the first file lands, create `assets/audio/AUDIO_NOTES.md` (same idea as `assets/source-art/ARTWORK_NOTES.md`) with one row per file:

| Id | Source (URL or "made by") | Author | Licence | Licence link | Downloaded | Changes |
|---|---|---|---|---|---|---|
| `bgm-menu` | | | | | | e.g. trimmed to 45 s, converted to OGG |

## 7. T-07 checklist

- [x] Track list written (section 2)
- [x] Placeholder `bgm-menu.ogg` sourced (RPG - Underworld Theme - Loop, Joseph Collard, CC-BY 4.0)
- [x] Its source and licence recorded in `assets/audio/AUDIO_NOTES.md`; CC-BY credit needed in README and presentation
- [ ] Team OK on the names (or changed to match T-03 when it merges)
- [ ] Tell the scene owners the ids in section 2
