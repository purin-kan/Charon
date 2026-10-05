'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'content.json')));
const reused = JSON.parse(fs.readFileSync(path.join(root, 'assets/REUSED_PROVENANCE.json'))).files;
const manifestPath = path.join(root, 'art/ASSET_MANIFEST.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath)) : null;
const final = manifest ? (manifest.assets ? manifest.assets.flatMap(record => record.component_ids.map(componentId => ({...record, componentId}))) : manifest.files) : [];
if (!Array.isArray(final)) throw new Error('Unsupported artwork manifest schema.');
const mapping = {};
for (const record of [...reused, ...final.filter(item => item.role !== 'browser'), ...final.filter(item => item.role === 'browser')]) {
  const target = path.resolve(root, record.path);
  if (!target.startsWith(root + path.sep) || !fs.statSync(target).isFile()) throw new Error('Invalid art path: ' + record.path);
  const hash = crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
  if (hash !== record.sha256) throw new Error('Art hash mismatch: ' + record.path);
  mapping[record.componentId] = record.path;
}
const missing = [...data.souls, ...data.destinations, ...data.memories].filter(item => !mapping[item.id]).map(item => item.id);
fs.writeFileSync(path.join(root, 'asset-map.js'), 'globalThis.FerryArt = ' + JSON.stringify(mapping, null, 2) + ';\n');
fs.writeFileSync(path.join(root, 'verification/art-integration.json'), JSON.stringify({status: missing.length || !final.length ? 'WAITING_FOR_A' : 'PASS', missing, finalManifestPresent: !!final.length, mapped: Object.keys(mapping), note: 'Reused bytes checked; final art and print ownership stays with A.'}, null, 2) + '\n');
console.log(JSON.stringify({mapped: Object.keys(mapping).length, missing}));
