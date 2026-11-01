// Sanity check: the rules engine (rules/engine.js) loads under Node and Ferry.create(1) returns a valid state.
import { createRequire } from 'node:module';

const Ferry = createRequire(import.meta.url)('../rules/engine.js');
const s = Ferry.create(1);
if (!s || typeof s.phase !== 'string') {
  console.error('FAIL: Ferry.create(1) returned no phase');
  process.exit(1);
}
Ferry.validate(s);
console.log('OK Ferry.create(1) -> phase =', s.phase, '| shore =', s.shore.length, '| light =', s.light);
