// Asset preloader driven by file naming only. Nobody edits a manifest: drop a file in
//   assets/art/<id>.png          character sprites, icons
//   assets/backgrounds/<id>.png  destination and shore backgrounds
//   assets/audio/<id>.ogg        BGM and SFX
// and ask for the id. A missing image becomes a drawn letter emblem, a missing sound is silence.
// Engine ids find art-pipeline file names (SOUL-MOTHER -> sprite-mother.png, DEST-STYX -> bg-styx.png,
// MEM-MOLY -> memory-moly.png); see src/asset-names.js for the rules and the alias table.
import { fileIdFor } from './asset-names.js';

// Vite resolves these globs at build/dev time; new files are picked up without code changes.
const found = {
  art: import.meta.glob('../assets/art/*.png', { eager: true, query: '?url', import: 'default' }),
  backgrounds: import.meta.glob('../assets/backgrounds/*.png', { eager: true, query: '?url', import: 'default' }),
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

/** Letter shown on an emblem: first letter of the id, ignoring a leading "SOUL-" style prefix. */
export function emblemLetter(id) {
  return (id.replace(/^[A-Za-z]+-(?=.)/, '')[0] ?? '?').toUpperCase();
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
 * Adds the image for an id at (x, y), scaled to fit size x size. If no such texture was loaded,
 * adds a drawn letter emblem instead (a Container with the same footprint), so layout never changes.
 */
export function addArt(scene, x, y, id, size = 128) {
  if (scene.textures.exists(id)) {
    const img = scene.add.image(x, y, id);
    img.setScale(size / Math.max(img.width, img.height));
    return img;
  }
  const box = scene.add.graphics();
  box.fillStyle(0x24323f, 1).fillRoundedRect(-size / 2, -size / 2, size, size, size * 0.12);
  box.lineStyle(3, 0x7fa6c0, 1).strokeRoundedRect(-size / 2, -size / 2, size, size, size * 0.12);
  const letter = scene.add
    .text(0, 0, emblemLetter(id), { fontFamily: "sans-serif", fontSize: Math.round(size * 0.6) + "px", color: "#cfe3f0" })
    .setOrigin(0.5);
  return scene.add.container(x, y, [box, letter]);
}

/** Plays a sound if loaded; silently does nothing otherwise. Returns the sound or null. */
export function playSound(scene, id, config) {
  if (!scene.cache.audio.exists(id)) return null;
  const s = scene.sound.add(id, config);
  s.play();
  return s;
}
