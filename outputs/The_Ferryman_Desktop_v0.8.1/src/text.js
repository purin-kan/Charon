// Scene text (T-27): every button, help and ending line lives in src/data/scene-text.json.
// Scenes call t('boarding.heading') or t('delivery.heading', { place: 'Styx' }) instead of
// writing strings in code. Names of souls, destinations, memories and quests stay in the rules
// data (Ferry.data), so this file never copies game rules. No Phaser import, so Node tools can test it.
import TEXT from './data/scene-text.json';

const warned = new Set();

/** The raw entry at a dotted key, or undefined. */
export function lookup(key, table = TEXT) {
  return key.split('.').reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), table);
}

/**
 * Text for a key with {name} slots filled from values. A missing key or value never throws:
 * the key (or the {slot}) is shown as is, and a missing key is warned about once.
 */
export function t(key, values = {}, table = TEXT) {
  const raw = lookup(key, table);
  if (typeof raw !== 'string') {
    if (!warned.has(key)) {
      warned.add(key);
      console.warn(`[ferry] scene text: no entry for "${key}"`);
    }
    return key;
  }
  return raw.replace(/\{(\w+)\}/g, (slot, name) => (values[name] ?? slot).toString());
}

/** Help screen sections: headings from scene-text.json, bodies from the rules data (content.json `rules`). */
export function helpSections(data, table = TEXT) {
  return Object.entries(data.rules ?? {}).map(([id, body]) => ({
    id,
    heading: lookup(`help.sections.${id}`, table) ?? id,
    body,
  }));
}

/** The {slot} names used in one string, for checks. */
export function slotsIn(text) {
  return [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
}

export { TEXT };
