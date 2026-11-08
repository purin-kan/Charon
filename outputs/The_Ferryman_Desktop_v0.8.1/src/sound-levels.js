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

/** The volume a sound plays at: its entry above, or full volume for a sound not listed. */
export const soundVolume = (id) => SOUND_VOLUME[id] ?? 1;
