// Loads the v0.7 rules source WITHOUT editing it. Order matters: content.js sets
// globalThis.FerryData, then engine.js (UMD) reads it.
// Dev (npm start) serves engine.js as a plain script: it publishes globalThis.Ferry and has no exports.
// A production Vite build wraps engine.js as CommonJS: it takes its module.exports branch and
// never sets globalThis.Ferry, so fall back to the module export. The source stays in
// ../The_Ferryman_v0.7/ and is never copied or edited.
import '../../The_Ferryman_v0.7/content.js';
import * as engineModule from '../../The_Ferryman_v0.7/engine.js';

export const Ferry = globalThis.Ferry ?? engineModule.default ?? null;
if (!Ferry || typeof Ferry.create !== 'function') {
  throw new Error('Ferry engine failed to load (check the content.js, engine.js import order).');
}
globalThis.Ferry = Ferry;
export default Ferry;
