'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const raw = fs.readFileSync(path.join(root, 'content.json'));
const content = JSON.parse(raw);
const config = content.config;
const projection = {
  version: content.version,
  producer: 'tools/package/project-print-content.js',
  source: 'content.json',
  sourceSha256: crypto.createHash('sha256').update(raw).digest('hex'),
  souls: content.souls.map(soul => ({id: soul.id, name: soul.name, seats: soul.seats, destination: soul.wish, memory: soul.memory})),
  destinations: content.destinations.map(destination => ({id: destination.id, name: destination.name, fog: destination.fog})),
  memories: Object.fromEntries(content.memories.map(memory => [memory.id, memory.text])),
  constants: {initialLight: config.startLight, maxLight: config.maxLight, capacity: config.seats, handLimit: config.handLimit, spawnEvery: config.spawnInterval, shipExpiry: config.shipAngerLimit, shoreExpiry: config.shoreAngerLimit, returnRecovery: config.returnLight},
  initialShore: config.initialShore,
  initialArrivals: config.initialArrivals,
  endless: config.endless,
  ordinaryRecycle: content.rules.recycling.includes('Only when arrivals run out, shuffle resolved ordinary souls.'),
  freshMemoryEveryEligibleDelivery: content.rules.memories.includes('Every eligible delivery creates a fresh source-labeled memory, including repeats.'),
  questOncePerRun: config.questPerRun === 1,
  facilitatorRoutes: content.rules.routes.includes('The facilitator orders, shuffles and hands out two-destination offers using only the six destination IDs.')
};
fs.writeFileSync(path.join(root, 'verification/B_CONTENT_PROJECTION.json'), JSON.stringify(projection, null, 2) + '\n');
console.log(JSON.stringify({sourceSha256: projection.sourceSha256, output: 'verification/B_CONTENT_PROJECTION.json'}));
