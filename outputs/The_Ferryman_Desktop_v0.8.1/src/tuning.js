// Presentation tuning (T-13): animation timings, easing, snap sizes and river paths that the
// developer tuning panel adjusts and saves to assets/tuning.json. The rules engine never reads
// these values, and gameplay balance stays in rules/content.json.
//
// In a scene:   import { tune } from '../tuning.js';
//               this.tweens.add({ ..., duration: tune('boarding.snapMs'), ease: tune('boarding.snapEase') });
// Read the value when you use it (not once at load), so changes from the panel apply at once.
// A scene can register its own values with defineTuning({ 'myscene.thingMs': { ... } }).
import savedFile from '../assets/tuning.json';

/** Phaser ease names offered by the panel. */
export const EASES = [
  'Linear', 'Sine.In', 'Sine.Out', 'Sine.InOut', 'Quad.In', 'Quad.Out', 'Quad.InOut',
  'Cubic.In', 'Cubic.Out', 'Cubic.InOut', 'Quart.In', 'Quart.Out', 'Quart.InOut',
  'Expo.In', 'Expo.Out', 'Expo.InOut', 'Back.In', 'Back.Out', 'Back.InOut', 'Bounce.Out', 'Elastic.Out',
];

const specs = new Map(); // key -> { key, group, label, type, default, min, max, step, help }
const values = new Map();
const listeners = new Set();
const warned = new Set();
let saved = savedFile;

const copy = (v) => (v && typeof v === 'object' ? structuredClone(v) : v);

function valid(spec, v) {
  switch (spec.type) {
    case 'number': return typeof v === 'number' && Number.isFinite(v);
    case 'ease': return typeof v === 'string';
    case 'bool': return typeof v === 'boolean';
    case 'points': return Array.isArray(v) && v.length >= 2 && v.every((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite));
    default: return false;
  }
}

/**
 * Registers tunable values with their defaults. A value saved in assets/tuning.json wins over the
 * default if it has the right type. Types: number (min, max, step), ease, bool, points ([[x, y], ...]
 * in game coordinates, 1280 x 720).
 */
export function defineTuning(entries) {
  for (const [key, spec] of Object.entries(entries)) {
    const full = { key, group: key.split('.')[0], label: key.split('.').slice(1).join('.'), ...spec };
    specs.set(key, full);
    if (values.has(key)) continue;
    const fromFile = saved[key];
    if (fromFile !== undefined && !valid(full, fromFile)) console.warn(`[ferry] tuning.json: ignoring bad value for "${key}"`);
    values.set(key, copy(fromFile !== undefined && valid(full, fromFile) ? fromFile : full.default));
  }
}

/** Current value for a key. An unknown key warns once and returns undefined. */
export function tune(key) {
  if (!specs.has(key)) {
    if (!warned.has(key)) { warned.add(key); console.warn(`[ferry] tuning: unknown key "${key}" (register it with defineTuning)`); }
    return undefined;
  }
  return copy(values.get(key));
}

export function setTune(key, value) {
  const spec = specs.get(key);
  if (!spec || !valid(spec, value)) return false;
  values.set(key, copy(value));
  for (const fn of listeners) fn(key, copy(value));
  return true;
}

export const resetTune = (key) => setTune(key, specs.get(key)?.default);
export const savedTune = (key) => (key in saved ? copy(saved[key]) : copy(specs.get(key)?.default));

/** Calls fn(key, value) after every change; returns a function that stops listening. */
export function onTune(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const tuningSpecs = () => [...specs.values()];

/** Everything the panel writes to assets/tuning.json, sorted by key. */
export function tuningData() {
  return Object.fromEntries([...values.keys()].sort().map((k) => [k, copy(values.get(k))]));
}

/** After a save, the file on disk is the new baseline for "changed" markers. */
export function markSaved(data) { saved = structuredClone(data); }

// Writing tuning.json from the panel must not reload the running game.
if (import.meta.hot) import.meta.hot.accept('../assets/tuning.json', () => {});

// Values named in the project plan. Defaults match the constants in the scene code where one exists
// (BoardingScene on the T-12 branch), so adopting tune() changes nothing until someone tunes it.
defineTuning({
  'scenes.fadeMs': { type: 'number', default: 300, min: 0, max: 2000, step: 10, help: 'Fade between scenes' },
  'boarding.snapMs': { type: 'number', default: 160, min: 0, max: 1000, step: 10, help: 'Soul glides to its spot' },
  'boarding.snapEase': { type: 'ease', default: 'Cubic.Out' },
  'boarding.dropPadding': { type: 'number', default: 0, min: -40, max: 80, step: 2, help: 'Extra pixels around each seat drop zone (snap radius)' },
  'boarding.exitMs': { type: 'number', default: 600, min: 0, max: 3000, step: 20, help: 'Boat leaves the shore' },
  'boarding.exitEase': { type: 'ease', default: 'Cubic.In' },
  'boarding.exitDistance': { type: 'number', default: 900, min: 0, max: 1600, step: 10 },
  'boarding.messageMs': { type: 'number', default: 2000, min: 500, max: 6000, step: 100, help: 'How long a refusal message stays' },
  'crossing.travelMs': { type: 'number', default: 2500, min: 200, max: 10000, step: 50, help: 'Boat crossing duration' },
  'crossing.travelEase': { type: 'ease', default: 'Sine.InOut' },
  'crossing.riverPath': { type: 'points', default: [[160, 520], [460, 470], [800, 540], [1120, 480]], help: 'Boat path from shore to destination' },
  'crossing.fogFadeMs': { type: 'number', default: 800, min: 0, max: 4000, step: 50 },
  'crossing.lightLossMs': { type: 'number', default: 500, min: 0, max: 3000, step: 50, help: 'Light loss animation' },
  'delivery.departMs': { type: 'number', default: 700, min: 0, max: 3000, step: 50, help: 'Soul leaves the boat' },
  'delivery.departEase': { type: 'ease', default: 'Quad.In' },
  'wraith.transformMs': { type: 'number', default: 900, min: 0, max: 4000, step: 50, help: 'Soul turns into a wraith' },
  'wraith.shakeMs': { type: 'number', default: 250, min: 0, max: 1500, step: 10, help: 'Screen shake on wraith damage' },
  'wraith.shakeIntensity': { type: 'number', default: 0.01, min: 0, max: 0.05, step: 0.001 },
});
