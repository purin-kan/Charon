// Asset preloader driven by file naming only. Nobody edits a manifest: drop a file in
//   assets/art/<id>.png          character sprites, icons
//   assets/backgrounds/<id>.png  destination and shore backgrounds
//   assets/audio/<id>.ogg        BGM and SFX
// and ask for the id. A missing image becomes a dark name plate (theme.js), a missing sound is silence.
// Engine ids find art-pipeline file names (SOUL-MOTHER -> sprite-mother.png, DEST-STYX -> bg-styx.png,
// MEM-MOLY -> memory-moly.png); see src/asset-names.js for the rules and the alias table.
import { figureIdFor, fileIdFor } from './asset-names.js';
import { Ferry } from './ferry.js';
import { SOUND_FADE_MS, fadeProgress, soundVolume } from './sound-levels.js';
import { COLOR, soulPlate } from './theme.js';
import { tune } from './tuning.js';

// Vite resolves these globs at build/dev time; new files are picked up without code changes.
// Art may sit in subfolders (art/souls/, art/memories/, ...): the file name alone is the id,
// so a name must be unique across subfolders (tools/check-art.mjs checks this).
const found = {
  art: import.meta.glob('../assets/art/**/*.png', { eager: true, query: '?url', import: 'default' }),
  backgrounds: import.meta.glob('../assets/backgrounds/**/*.png', { eager: true, query: '?url', import: 'default' }),
  audio: import.meta.glob('../assets/audio/*.ogg', { eager: true, query: '?url', import: 'default' }),
};

// File id (name without extension) -> url, per kind.
const files = Object.fromEntries(
  Object.entries(found).map(([kind, map]) => [
    kind,
    new Map(Object.entries(map).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1).replace(/\.[^.]+$/, ''), url])),
  ]),
);

function urlFor(kind, id) {
  const fileId = fileIdFor(kind, id, new Set(files[kind].keys()));
  return fileId ? files[kind].get(fileId) : null;
}

/** The name on a missing image's plate: the data name of a soul, memory or destination, otherwise the id without its prefix. */
function plateName(id) {
  const { souls, memories, destinations } = Ferry.data;
  const known = [...souls, ...memories, ...destinations].find((x) => x.id === id);
  return known?.name ?? id.replace(/^[A-Za-z]+-(?=.)/, '').replace(/-/g, ' ');
}

/** The id to draw for a soul type: its 2D sprite, or its painted figure when art.useFigures is on and the file is loaded. */
export function soulArtId(scene, type) {
  const figure = figureIdFor(type);
  return tune('art.useFigures') && scene.textures.exists(figure) ? figure : type;
}

/** Every id a scene that draws souls should queue: each soul's sprite and any figure for it. */
export function soulArtIds() {
  return Ferry.data.souls.flatMap((s) => [s.id, figureIdFor(s.id)]);
}

/**
 * Queue files for ids. Call from a scene's preload(). Ids with no file are remembered as missing.
 * @param {Phaser.Scene} scene
 * @param {{art?:string[], backgrounds?:string[], audio?:string[]}} ids
 */
export function queueAssets(scene, ids = {}) {
  for (const kind of ['art', 'backgrounds', 'audio']) {
    for (const id of ids[kind] ?? []) {
      const url = urlFor(kind, id);
      const exists = kind === 'audio' ? scene.cache.audio.exists(id) : scene.textures.exists(id);
      if (!url || exists) continue;
      if (kind === 'audio') scene.load.audio(id, url);
      else scene.load.image(id, url);
    }
  }
}

/**
 * Adds the image for an id at (x, y), fitted inside a size x size square ("contain"). If no such texture was loaded,
 * adds a name plate instead (a Container), so a layout never shifts. plate gives that plate its own size and centre
 * ({ w, h, y }) where a figure's frame differs from the square its image is fitted to.
 */
export function addArt(scene, x, y, id, size = 128, plate = {}) {
  if (scene.textures.exists(id)) {
    const img = scene.add.image(x, y, id);
    img.setScale(size / Math.max(img.width, img.height));
    return img;
  }
  return soulPlate(scene, x, plate.y ?? y, plate.w ?? size, plate.h ?? size, plateName(id));
}

/** Plays a sound if loaded, at its level from sound-levels.js; silently does nothing otherwise. Returns the sound or null. */
export function playSound(scene, id, config) {
  if (!scene.cache.audio.exists(id)) return null;
  const s = scene.sound.add(id, { volume: soundVolume(id), ...config });
  if (!config?.loop) s.once('complete', () => s.destroy()); // or every click would keep its own sound object for ever
  s.play();
  return s;
}

/**
 * Moves a sound to a volume over ms along the curve in sound-levels.js, then calls done. A plain timer,
 * so a fade can outlive the scene that started it.
 */
export function fadeSound(sound, volume, ms, done = () => {}) {
  if (!sound) return;
  clearInterval(sound.fading);
  const from = sound.volume;
  const start = performance.now();
  sound.fading = setInterval(() => {
    const p = ms > 0 ? Math.min(1, (performance.now() - start) / ms) : 1;
    if (!sound.manager) {
      clearInterval(sound.fading);
      return;
    }
    sound.setVolume(from + (volume - from) * fadeProgress(from, volume, p));
    if (p < 1) return;
    clearInterval(sound.fading);
    done();
  }, 30);
}

/**
 * Plays a looping track that carries on where it left off: the sound manager is shared by every scene, so a
 * scene that comes back (CrossingScene every round, TitleScene after a run) resumes the same sound instead of
 * starting it again. Pair with fadeOutLoop on shutdown. `owner` is a scene or the game (both have cache and
 * sound). fromStart plays it again from 0, for the start of a new run. Returns the sound, or null if missing.
 */
export function playLoop(owner, id, config, { fromStart = false } = {}) {
  if (!owner.cache.audio.exists(id)) return null;
  let s = owner.sound.get(id);
  if (!s) {
    s = owner.sound.add(id, { ...config, loop: true });
    s.play();
  } else if (fromStart) {
    s.stop();
    s.play();
  } else if (s.isPaused) s.resume();
  else if (!s.isPlaying) s.play();
  return s;
}

/**
 * playLoop that fades up to volume, from silence for a new or paused track. Cancels a fade-out still running,
 * so a track that comes back mid-fade keeps playing instead of being paused by the old fade.
 */
export function fadeInLoop(owner, id, volume = soundVolume(id), options) {
  const s = playLoop(owner, id, { volume: 0 }, options);
  fadeSound(s, volume, SOUND_FADE_MS.in);
  return s;
}

/** Fades a track from playLoop out, then pauses it so the next fadeInLoop of the same id resumes it. */
export function fadeOutLoop(sound) {
  fadeSound(sound, 0, SOUND_FADE_MS.out, () => {
    if (sound.isPlaying) sound.pause();
  });
}

/**
 * Draws a background id (bg-starting-shore, DEST-STYX) to cover the 1280 x 720 view, with a dark veil so
 * text stays readable. Draws nothing if the file is missing. Returns the image or null.
 */
export function addBackdrop(scene, id, veil = 0.55) {
  if (!scene.textures.exists(id)) return null;
  const { width, height } = scene.scale;
  const img = scene.add.image(width / 2, height / 2, id).setDepth(-10);
  img.setScale(Math.max(width / img.width, height / img.height));
  scene.add.rectangle(width / 2, height / 2, width, height, COLOR.veil, veil).setDepth(-9);
  return img;
}

/** Goya's Wraith transformation frames (art handoff v4), in order. */
export const WRAITH_FRAMES = ['wraith-transform-01', 'wraith-transform-02', 'wraith-transform-03', 'wraith-transform-04', 'wraith-transform-05'];
