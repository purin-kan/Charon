// Checks src/sound-levels.js against the sound files: every file has a level, every level is a real volume.
// Run: node tools/check-sound.mjs
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { SOUND_VOLUME, soundVolume } from '../src/sound-levels.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = readdirSync(path.join(root, 'assets', 'audio')).filter((f) => f.endsWith('.ogg')).map((f) => f.slice(0, -4));

let bad = 0;
function check(name, ok) {
  if (!ok) bad++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}`);
}

check(`every sound file has a level  ${files.join(', ')}`, files.every((id) => id in SOUND_VOLUME));
check('every level is a file', Object.keys(SOUND_VOLUME).every((id) => files.includes(id)));
check('every level is between 0 and 1', Object.values(SOUND_VOLUME).every((v) => v > 0 && v <= 1));
check('the delivery, fog and Wraith cues are turned down (too loud in the Nov 8 play)', ['sfx-delivery-success', 'sfx-fog', 'sfx-wraith'].every((id) => soundVolume(id) < 0.5));
check('a sound with no entry plays at full volume', soundVolume('no-such-sound') === 1);

if (bad) {
  console.log(`\n${bad} sound check(s) failed`);
  process.exit(1);
}
console.log('\nAll sound checks passed');
