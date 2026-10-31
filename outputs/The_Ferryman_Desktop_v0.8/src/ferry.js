// Loads the v0.7 rules source WITHOUT editing it. Order matters: content.js sets
// globalThis.FerryData, then engine.js (UMD) reads it and publishes globalThis.Ferry.
// The source stays in ../The_Ferryman_v0.7/ and is never copied or edited.
import '../../The_Ferryman_v0.7/content.js';
import '../../The_Ferryman_v0.7/engine.js';

export const Ferry = globalThis.Ferry;
if (!Ferry) throw new Error('Ferry engine failed to load (check the content.js, engine.js import order).');
export default Ferry;
