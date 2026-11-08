// How loud each sound plays (0 to 1), so the files sit together instead of each playing at its own recorded level.
// No Phaser and no Vite here, so tools/check-sound.mjs can read it in plain Node.
//
// Measured with ffmpeg on Nov 8 (integrated loudness; the short clicks are too short for LUFS, so peak and mean dB):
//   amb-crossing          -44.2 LUFS, peak -18.7 dB   the run's background loop, already very quiet, stays at 1
//   bgm-menu              -16.1 LUFS, peak  -1.1 dB   title music, played at 0.5 by TitleScene (about -22 LUFS)
//   sfx-delivery-success  -18.8 LUFS, peak  -8.0 dB   about 25 LU over the ambience at full volume: the loudest cue
//   sfx-fog               -21.0 LUFS, peak  -8.8 dB
//   sfx-wraith            -22.9 LUFS, peak  -9.5 dB
//   sfx-ui-click          peak -7.5 dB, mean -32.5 dB (0.10 s)
//   sfx-board             peak -9.8 dB, mean -33.8 dB (0.23 s)
//   sfx-unboard           peak -10.9 dB, mean -28.1 dB (0.37 s)
// The three longer cues are brought to about -30 LUFS, under the title music and still clear over the ambience.
// The short clicks and footsteps are brought to a peak of about -15 to -16 dB, so a click is a tick, not a pop.
export const SOUND_VOLUME = {
  'amb-crossing': 1,
  'bgm-menu': 0.5,
  'sfx-delivery-success': 0.28, // -18.8 LUFS - 11 dB = about -30 LUFS
  'sfx-fog': 0.35, // -21.0 LUFS - 9 dB = about -30 LUFS
  'sfx-wraith': 0.45, // -22.9 LUFS - 7 dB = about -30 LUFS
  'sfx-ui-click': 0.45, // peak -7.5 dB - 7 dB = about -14.5 dB
  'sfx-board': 0.55, // peak -9.8 dB - 5 dB = about -15 dB
  'sfx-unboard': 0.55, // peak -10.9 dB - 5 dB = about -16 dB
};

// How long the looping tracks fade, in ms. Separate from the screen motion timings (theme.js MS), so reduced motion
// never turns a music change into a cut. The title music (about -22 LUFS as played) hands over to the much quieter
// run ambience (-44 LUFS), so both fades are long enough to overlap and settle.
export const SOUND_FADE_MS = { in: 3000, out: 3000 };

/**
 * Fade curve: how far (0 to 1) a fade from `from` to `to` has gone at progress p (0 to 1). A fade up follows sin
 * (rises quickly, lands gently). A fade down follows 1 - (1 - p)^2: the level is (1 - p)^2 of where it started, so
 * most of the drop happens early and it settles into silence with no drop at the end (a straight line in volume,
 * as before, sounds like it falls away in the last moment, like a cut).
 */
export const fadeProgress = (from, to, p) => (to >= from ? Math.sin((p * Math.PI) / 2) : 1 - (1 - p) ** 2);

// The title music keeps playing through a run, quietly under the ambience and the cues: 0.08 is about -38 LUFS
// (-16.1 LUFS - 22 dB), well under the cues at about -30 (0.15 was still too loud, Nov 8). The title screen brings it back up to 0.5.
export const RUN_MUSIC = { id: 'bgm-menu', volume: 0.08 };

/** The volume a sound plays at: its entry above, or full volume for a sound not listed. */
export const soundVolume = (id) => SOUND_VOLUME[id] ?? 1;
