'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const raw = fs.readFileSync(path.join(root, 'content.json'));
const data = JSON.parse(raw);
const hash = crypto.createHash('sha256').update(raw).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const write = (name, value) => fs.writeFileSync(path.join(root, name), value);
const byId = items => Object.fromEntries(items.map(item => [item.id, item]));
const souls = byId(data.souls), destinations = byId(data.destinations), memories = byId(data.memories);
for (const soul of data.souls) {
  if (!destinations[soul.wish] || (soul.memory && !memories[soul.memory])) throw new Error('Invalid content reference: ' + soul.id);
}
for (const id of [...data.config.initialShore, ...data.config.initialArrivals]) if (!souls[id]) throw new Error('Invalid roster reference: ' + id);
write('content.js', 'globalThis.FerryData = ' + json({...data, contentSha256: hash}) + ';\n');
write('rules.json', json({version: data.version, contentSha256: hash, trial: data.trial, config: data.config, rules: data.rules, roundSteps: data.roundSteps, returnSteps: data.returnSteps}));
const lines = [
  '# ' + data.title + ' ' + data.version,
  '', data.trial.notice, '',
  'Generated from content.json. SHA-256: `' + hash + '`.', '',
  'These rules describe this HTML quest prototype. The old paper kit is historical and has not been updated for this version.', '',
  '## Setup', '',
  `Start with ${data.config.startLight} Light; maximum ${data.config.maxLight}. Boat capacity ${data.config.seats}. Return healing ${data.config.returnLight}.`, '',
  'Initial shore: ' + data.config.initialShore.map(id => souls[id].name).join(', ') + '.', '',
  'Arrival pool: ' + data.config.initialArrivals.map(id => souls[id].name).join(', ') + '.', '',
  '## Active baseline souls', '',
  '| ID | Name | Seats | Wish | Memory |', '|---|---|---:|---|---|',
  ...data.souls.map(s => `| ${s.id} | ${s.name} | ${s.seats} | ${destinations[s.wish].name} | ${memories[s.memory]?.name || 'None'} |`),
];
for (const [key, value] of Object.entries(data.rules)) lines.push('', '## ' + key, '', value);
lines.push('', '## Memories', '');
for (const memory of data.memories) lines.push('- **' + memory.name + ':** ' + memory.text);
for (const [title, steps] of [['Outward round', data.roundSteps], ['Return', data.returnSteps]]) {
  lines.push('', '## ' + title, '');
  steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`));
}
lines.push('', '## Included roster entries awaiting playable rules', '', ...(data.pendingSouls || []).map(x => '- **' + x.name + ':** ' + x.description));
lines.push('', '## Decisions pending', '', ...data.trial.pending.map(x => '- ' + x), '', 'No balance, enjoyment, final art approval or human playtest is claimed.', '');
write('RULES.md', lines.join('\n'));
fs.mkdirSync(path.join(root, 'verification'), {recursive: true});
write('verification/content-build.json', json({version: data.version, contentSha256: hash, generated: ['content.js', 'rules.json', 'RULES.md']}));
console.log('Built trial content ' + hash);
