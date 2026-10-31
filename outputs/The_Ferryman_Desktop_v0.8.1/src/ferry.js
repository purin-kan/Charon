// Loads the rules source in rules/ without editing it. Order matters: content.js sets
// globalThis.FerryData, then engine.js (UMD) reads it.
// Dev (npm start) serves engine.js as a plain script: it publishes globalThis.Ferry and has no exports.
// A production Vite build wraps engine.js as CommonJS: it takes its module.exports branch and
// never sets globalThis.Ferry, so fall back to the module export. The source stays in
// rules/ (copied from the v0.7 snapshot) and is edited only for rule changes.
import '../rules/content.js';
import * as engineModule from '../rules/engine.js';

export const Ferry = globalThis.Ferry ?? engineModule.default ?? null;
if (!Ferry || typeof Ferry.create !== 'function') {
  throw new Error('Ferry engine failed to load (check the content.js, engine.js import order).');
}
globalThis.Ferry = Ferry;
export default Ferry;
