// Checks src/sound-levels.js against the sound files: every file has a level, every level is a real volume.
// Run: node tools/check-sound.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { RUN_MUSIC, SOUND_FADE_MS, SOUND_VOLUME, fadeProgress, soundVolume } from '../src/sound-levels.js';

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

// Music changes: the title music fading into the run ambience cut off abruptly (Nov 8 play).
check(`music fades last long enough to overlap  in ${SOUND_FADE_MS.in} ms, out ${SOUND_FADE_MS.out} ms`, SOUND_FADE_MS.in >= 2000 && SOUND_FADE_MS.out >= 2000);
const steps = Array.from({ length: 21 }, (_, i) => i / 20);
for (const [from, to, name] of [[0, 1, 'up'], [0.5, 0, 'down']]) {
  const levels = steps.map((p) => from + (to - from) * fadeProgress(from, to, p));
  check(`a fade ${name} starts and ends on its levels`, Math.abs(levels[0] - from) < 1e-9 && Math.abs(levels[20] - to) < 1e-9);
  check(`a fade ${name} never turns back`, levels.every((v, i) => i === 0 || (to > from ? v >= levels[i - 1] : v <= levels[i - 1])));
}
const down = (p) => 0.5 * (1 - fadeProgress(0.5, 0, p));
check('a fade down settles into silence: the last 5% moves less than 1% of the level, not a drop at the end', down(0.95) - down(1) < 0.5 * 0.01);

// The title music plays through a run, quieter than on the title screen (Nov 8 request).
check(`the title music plays in a run, quieter than on the title  run ${RUN_MUSIC.volume}, title ${soundVolume(RUN_MUSIC.id)}`, files.includes(RUN_MUSIC.id) && RUN_MUSIC.volume > 0 && RUN_MUSIC.volume < soundVolume(RUN_MUSIC.id));
const router = readFileSync(path.join(root, 'src', 'router.js'), 'utf8');
check('the router keeps the title music going at the start of a run and in every scene', (router.match(/fadeInLoop\(this\.game, RUN_MUSIC\.id, RUN_MUSIC\.volume\)/g) ?? []).length >= 2);

if (bad) {
  console.log(`\n${bad} sound check(s) failed`);
  process.exit(1);
}
console.log('\nAll sound checks passed');
