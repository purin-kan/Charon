// Which asset file belongs to an id. No Phaser or Vite imports, so tools/check-art.mjs can test it.
//
// Scenes ask for assets by engine id (SOUL-MOTHER, DEST-STYX, MEM-BOAT-SPACE) or by a file id
// (sprite-boat-horizontal, bg-starting-shore). The file is found in this order:
//   1. a file named exactly after the id            assets/art/SOUL-MOTHER.png
//   2. an alias from ALIASES below                  for names that do not follow the pattern
//   3. the art-pipeline name (T-03 and the art handoff):
//        SOUL-<X> and CHAR-<X>  ->  art/sprite-<x>.png        SOUL-RED-SOLDIER -> sprite-red-soldier
//        MEM-<X>                ->  art/memory-<x>.png        MEM-BOAT-SPACE   -> memory-boat-space
//        DEST-<X>               ->  backgrounds/bg-<x>.png    DEST-STYX        -> bg-styx
// The texture is still stored under the id the scene asked for, so addArt(scene, x, y, 'SOUL-MOTHER')
// draws sprite-mother.png. With no file at all, addArt draws the letter emblem as before.

/**
 * Engine id -> file id, only where the pattern above does not give the right name.
 * The five Polong variants are drawn as sprite-long-mist, -hollow, -burden, -veil and -grasp, but which
 * Long is which SOUL-PO-* is not decided yet (issue 11). Until it is, they show letter emblems.
 * Add a line here once the team decides, e.g. 'SOUL-PO-LUEM': 'sprite-long-mist'.
 */
export const ALIASES = {
  art: {},
  backgrounds: {},
  audio: {},
};

const PATTERNS = {
  art: [
    [/^(?:SOUL|CHAR)-(.+)$/, 'sprite-'],
    [/^MEM-(.+)$/, 'memory-'],
  ],
  backgrounds: [[/^DEST-(.+)$/, 'bg-']],
  audio: [],
};

/** The art-pipeline file id for an engine id, or null if no pattern applies. */
export function patternName(kind, id) {
  for (const [re, prefix] of PATTERNS[kind] ?? []) {
    const m = re.exec(id);
    if (m) return prefix + m[1].toLowerCase();
  }
  return null;
}

/**
 * The file id to load for an id, given the file ids that exist for that kind. Returns null if none exists.
 * @param {'art'|'backgrounds'|'audio'} kind
 * @param {string} id
 * @param {Set<string>|string[]} available file ids (file names without the extension)
 */
export function fileIdFor(kind, id, available) {
  const has = available instanceof Set ? (x) => available.has(x) : (x) => available.includes(x);
  for (const candidate of [id, ALIASES[kind]?.[id], patternName(kind, id)]) {
    if (candidate && has(candidate)) return candidate;
  }
  return null;
}
