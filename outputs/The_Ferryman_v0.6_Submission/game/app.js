(function() {
  'use strict';
  const game = globalThis.Ferry;
  const data = game.data;
  const art = globalThis.FerryArt;
  const souls = Object.fromEntries(data.souls.map(soul => [soul.id, soul]));
  const destinations = Object.fromEntries(data.destinations.map(item => [item.id, item]));
  const memories = Object.fromEntries(data.memories.map(item => [item.id, item]));
  const query = new URLSearchParams(location.search);
  const testSuffix = query.get('qa');
  const namespace = 'the-ferryman:v0.6:' + (testSuffix && /^[a-z0-9_-]{1,60}$/i.test(testSuffix) ? 'qa:' + testSuffix + ':' : 'player:');
  const stage = document.querySelector('#stage');
  const status = document.querySelector('#status');
  const dialog = document.querySelector('#dialog');
  let state = null;
  let slot = 1;
  let screen = 'memory';
  let deliverySelection = [];
  const escape = value => String(value).replace(/[&<>"']/g, letter => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[letter]));
  const button = (label, action, value = '', css = '') => `<button class="${css}" data-action="${action}" data-value="${escape(value)}">${escape(label)}</button>`;
  const picture = id => art[id] ? `<img src="${escape(art[id])}" alt="${escape((souls[id] || destinations[id] || memories[id])?.name || 'River shore')}" loading="lazy">` : '<div class="art-pending">Artwork integration pending</div>';
  function read(key) {
    try { return localStorage.getItem(namespace + key); }
    catch { return null; }
  }
  function persist() {
    try {
      localStorage.setItem(namespace + 'slot-' + slot, game.exportSave(state));
      localStorage.setItem(namespace + 'active', String(slot));
      document.querySelector('#save-warning').hidden = true;
    } catch (error) {
      const warning = document.querySelector('#save-warning');
      warning.textContent = 'Autosave unavailable. Export your save before closing this page. ' + error.message;
      warning.hidden = false;
    }
  }
  function showError(error, inDialog = false) {
    const output = inDialog ? dialog.querySelector('.dialog-error') : document.querySelector('#error');
    output.textContent = error.message || String(error);
    output.hidden = false;
  }
  function apply(action) {
    state = game.transition(state, action);
    deliverySelection = [];
    screen = state.uiStep;
    persist();
    render();
  }
  function modal(title, html) {
    dialog.innerHTML = `<div class="dialog-top"><h2 id="dialog-title">${escape(title)}</h2><button data-action="close">Close</button></div>${html}<p class="dialog-error" role="alert"></p>`;
    if (!dialog.open) dialog.showModal();
  }
  function confirmReplacement(title, text, confirm) {
    modal(title, `<p>${escape(text)}</p><div class="toolbar">${button('Cancel', 'close')}<button id="accept-replacement" class="primary">Confirm replacement</button></div>`);
    dialog.querySelector('#accept-replacement').onclick = () => { dialog.close(); confirm(); };
  }
  function newRun(number) {
    const start = () => { slot = number; state = game.create(crypto.getRandomValues(new Uint32Array(1))[0]); screen = 'memory'; persist(); render(); };
    if (read('slot-' + number)) confirmReplacement('Replace slot ' + number + '?', 'This replaces only this v0.6 slot. Export it first if you want to keep this run.', start);
    else start();
  }
  function load(number) {
    const saved = read('slot-' + number);
    if (!saved) throw new Error('This slot is empty.');
    const loaded = game.importSave(saved);
    slot = number;
    state = loaded;
    screen = state.uiStep;
    persist();
    render();
  }
  function soulCard(soul, action = null) {
    const definition = souls[soul.type];
    const selected = state.selected.includes(soul.id);
    return `<article class="card${selected ? ' selected' : ''}">${picture(soul.type)}<div class="card-body"><h3>${escape(definition.name)}</h3><p class="key">${definition.seats} seat${definition.seats === 1 ? '' : 's'} · ${escape(destinations[definition.wish].name)}</p><p>${escape(definition.text)}</p><p class="anger">${state.shore.includes(soul) ? 'Shore' : 'Ship'} Anger ${soul.anger} / ${state.shore.includes(soul) ? data.config.shoreAngerLimit : data.config.shipAngerLimit}</p><small>${escape(soul.id)}</small>${action === 'board' ? button(selected ? 'Unselect ' + definition.name : 'Board ' + definition.name, 'board', soul.id, selected ? 'primary' : '') : ''}${action === 'delivery' ? `<label class="delivery-label"><input type="checkbox" data-deliver="${escape(soul.id)}" ${deliverySelection.includes(soul.id) ? 'checked' : ''}>Deliver ${escape(definition.name)}</label>` : ''}</div></article>`;
  }
  function revealed() {
    const visible = game.offers(state);
    if (!visible.length) return '<div class="notice">Facilitator input needed. Add a two-destination offer to continue.</div>';
    return `<div class="reveals"><strong>Revealed route offers</strong>${visible.map((pair, index) => `<p>${index ? 'Ahead ' + index : 'Current'}: ${pair.map(id => escape(destinations[id].name)).join(' / ')}</p>`).join('')}<p class="hint">Further prepared offers remain concealed. The next cycle uses a new facilitator queue.</p></div>`;
  }
  function memoryCard(memory, discard = false) {
    const definition = memories[memory.type];
    return `<article class="card">${picture(memory.type)}<div class="card-body"><h3>${escape(definition.name)}</h3><p>${escape(definition.text)}</p><small>From ${escape(souls[memory.source]?.name || 'Family quest')} · ${escape(memory.id)}</small>${button(discard ? 'Discard ' + definition.name : 'Choose ' + definition.name, discard ? 'discard' : 'memory', memory.id)}</div></article>`;
  }
  function routeLedger() {
    const history = state.routes.history || [];
    const unavailable = state.routes.historyStart || state.routes.used;
    return `<details class="route-ledger"><summary>Revealed offers this cycle</summary>${BigInt(unavailable) > 0n ? '<p class="hint">This older save predates the route ledger. Earlier consumed offers were not stored; newly revealed offers remain recorded.</p>' : ''}${history.map((entry, index) => `<p>Crossing ${escape((BigInt(unavailable) + BigInt(index) + 1n).toString())}: ${entry.offer.map(id => escape(destinations[id].name)).join(' / ')}. Chosen: ${escape(destinations[entry.chosen].name)}.</p>`).join('')}${game.offers(state).map((pair, index) => `<p>${index ? 'Ahead ' + index : 'Current'}: ${pair.map(id => escape(destinations[id].name)).join(' / ')}</p>`).join('')}${!history.length && !game.offers(state).length ? '<p>No route offers recorded in this cycle.</p>' : ''}</details>`;
  }
  function render() {
    document.querySelector('#error').hidden = true;
    document.querySelector('#facilitator').disabled = !state || state.phase === 'ended' || state.paused;
    status.innerHTML = state ? `<span>Light <strong>${state.light} / ${data.config.maxLight}</strong></span><span>Cycle <strong>${escape(state.cycle)}</strong></span><span>Outward rounds <strong>${escape(state.round)}</strong></span><span>Seats <strong>${game.seats(state)} / ${data.config.seats}</strong></span><span>Memories <strong>${state.hand.length} / ${data.config.handLimit}</strong></span><span>Quest <strong>${escape(state.quest.replaceAll('-', ' '))}</strong></span><div class="boatline">Aboard: ${state.boat.length ? state.boat.map(soul => escape(souls[soul.type].name) + ' (' + soul.anger + ')').join(' · ') : 'empty'} · Next PoLong: round ${escape((BigInt(state.round) / 3n * 3n + 3n).toString())} · Slot ${slot}</div>` : '';
    if (!state) {
      stage.innerHTML = `<section class="hero"><svg class="lantern" viewBox="0 0 80 100" aria-hidden="true"><path d="M30 20V12a10 10 0 0 1 20 0v8M18 28h44l-5 55H23zM23 22h34M20 90h40M33 35v40M47 35v40" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="40" cy="57" r="8" fill="currentColor"/></svg><p class="eyebrow">One lantern. An endless river.</p><h1>The Ferryman</h1><p class="subtitle">Keep their passage. Keep your light.</p><p class="intro">Carry souls to their destinations, spend the memories they leave, and survive the return. The facilitator prepares the route choices. Every new cycle is another chance to endure.</p><p class="hint">v0.6 · No fixed victory target · Stop and save whenever the workshop ends</p><div class="slots">${[1, 2, 3].map(number => { let description = 'Empty slot'; try { const saved = read('slot-' + number); if (saved) { const run = game.importSave(saved); description = `Cycle ${run.cycle} · Light ${run.light} · ${run.paused ? 'Session stopped' : run.phase}`; } } catch { description = 'Unreadable save. Export raw slot data from Guide & saves before replacing.'; } return `<article><h2>Slot ${number}</h2><p>${escape(description)}</p>${read('slot-' + number) ? button('Resume slot ' + number, 'load', number) : ''}${button('New run in slot ' + number, 'new', number, 'primary')}</article>`; }).join('')}</div></section>`;
      return;
    }
    let body = '';
    if (state.paused) body = `<section class="review"><p class="eyebrow">Session recorded</p><h1>Stopped and saved</h1><p>This voluntary stop is not a victory. Resume the same run or export it for another session.</p>${statistics()}<div class="toolbar">${button('Resume this session', 'resume', '', 'primary')}${button('Export save', 'export')}</div></section>`;
    else if (state.phase === 'ended') body = `<section class="review"><p class="eyebrow">The river falls quiet</p><h1>The lantern went out</h1><p>${escape(state.ending)}</p>${statistics()}<div class="toolbar">${button('Export run record', 'export')}${button('New run', 'new', slot, 'primary')}</div></section>`;
    else if (state.phase === 'boarding') body = `<p class="eyebrow">01 · At the shore</p><h1>Choose who comes aboard</h1><p class="intro">${escape(data.rules.boarding)}</p>${revealed()}<div class="grid soul-grid">${state.shore.map(soul => soulCard(soul, 'board')).join('')}</div><div class="toolbar">${button('Depart with selected souls', 'depart', '', 'primary')}</div><p class="hint">Boarding choices can be reversed here. Shore Anger resets to zero Ship Anger on departure.</p>`;
    else if (state.phase === 'review') body = review();
    else if (state.phase === 'delivery') {
      const matches = state.boat.filter(soul => souls[soul.type].wish === state.destination);
      body = `<p class="eyebrow">04 · Arrival</p><h1>${escape(destinations[state.destination].name)}</h1><p class="intro">Choose any matching passengers to deliver, or retain them. Afterwards every passenger left aboard gains one Ship Anger. At four, each expires for one Light.</p><div class="grid soul-grid">${state.boat.map(soul => soulCard(soul, matches.includes(soul) ? 'delivery' : null)).join('')}</div><div class="toolbar">${button('Resolve selected deliveries', 'deliver', '', 'primary')}</div><p class="hint">No selection means retain all. This can cause expiry. Ordinary deliveries do not heal.</p>`;
    } else if (state.phase === 'trim') body = `<p class="eyebrow">Choose the memories to carry</p><h1>Keep up to three</h1><p class="intro">${state.hand.length} memories received or held. Discard ${state.hand.length - data.config.handLimit} more. Each copy is separate; keep an earlier or a newly earned copy as you prefer.</p><div class="grid">${state.hand.map(memory => memoryCard(memory, true)).join('')}</div>`;
    else if (state.phase === 'window') {
      const returning = state.window.kind === 'return';
      if (!state.window.used && screen === 'memory') body = `<p class="eyebrow">02 · Before ${returning ? 'the return' : 'the crossing'}</p><h1>A memory for the journey?</h1><p class="intro">One memory may be played in this window. Unused cards stay in your hand.</p>${!returning ? revealed() : ''}${state.hand.length ? `<div class="grid">${state.hand.map(memory => memoryCard(memory)).join('')}</div>` : '<p class="empty">No memories held. Eligible deliveries grant a fresh memory each time.</p>'}<div class="toolbar">${button('Continue without a memory', 'skip', '', 'primary')}</div>`;
      else if (returning) body = `<p class="eyebrow">05 · Empty boat</p><h1>Return to the shore</h1><p class="intro">${escape(data.returnSteps[1])}</p><p>Then restore ${data.config.returnLight} Light, capped at ${data.config.maxLight}, and refill the shore.</p>${state.window.used ? '<div class="notice">The memory allowance is already used for this return.</div>' : ''}<div class="grid soul-grid">${state.shore.map(soul => soulCard(soul)).join('')}</div><div class="toolbar">${!state.window.used ? button('Back to memories', 'memory-back') : ''}${button('Review return', 'return-plan', '', 'primary')}</div>`;
      else body = `<p class="eyebrow">03 · Choose your crossing</p><h1>Where will the river lead?</h1><p class="intro">${state.window.used ? 'Your memory has resolved. Choose a destination.' : 'Choose one of the current destinations, or go back to choose a memory.'}</p>${revealed()}<div class="grid">${(game.offers(state)[0] || []).map(id => { const forecast = game.preview(state, id); return `<article class="card">${picture(id)}<div class="card-body"><h3>${escape(destinations[id].name)}</h3><p class="key">Pay ${forecast.payment} Light</p><p>Base ${forecast.base} + PoLong ${forecast.tainted} − Fog Shield ${forecast.shield}. Guard prevents up to ${forecast.guard}.</p>${forecast.lethal ? '<p class="damage">Zero Light: this crossing ends the run before delivery.</p>' : `<p>Light after crossing: ${forecast.remaining}</p>`}${forecast.spawn ? '<p>A new PoLong boards before travel at anger 0.</p>' : ''}${button('Review ' + destinations[id].name, 'route-plan', id)}</div></article>`; }).join('')}</div><div class="toolbar">${!state.window.used ? button('Back to memories', 'memory-back') : ''}${button('Add facilitator offers', 'routes')}</div>`;
    }
    stage.innerHTML = body + routeLedger() + (state.paused ? '' : `<details><summary>Boat, waiting souls & recent record</summary><p class="hint">Anger is shown after each name. Arrival supply ${state.arrivals.length}; resolved ordinary discard ${state.discard.length}. Memory hand ${state.hand.map(memory => escape(memories[memory.type].name)).join(', ') || 'empty'}.</p><p>Waiting: ${state.shore.map(soul => escape(souls[soul.type].name) + ' (' + soul.anger + ')').join(', ') || 'none'}.</p><ol class="log">${state.log.slice(-16).map(entry => `<li>Round ${escape(entry.round)}: ${escape(entry.text)}</li>`).join('')}</ol></details>`);
    const heading = stage.querySelector('h1');
    if (heading) { heading.tabIndex = -1; heading.focus({preventScroll: true}); }
  }
  function statistics() {
    return `<div class="stats"><span><strong>${escape(state.completed)}</strong>cycles survived</span><span><strong>${escape(state.round)}</strong>outward rounds</span><span><strong>${escape(state.deliveries)}</strong>ordinary deliveries</span></div>`;
  }
  function review() {
    const pending = state.pending;
    let detail;
    if (pending.type === 'CROSS') {
      const forecast = game.preview({...state, phase: 'window'}, pending.destination);
      detail = `<h1>Cross to ${escape(destinations[pending.destination].name)}?</h1><p>Fog ${forecast.fog}; Guard prevents up to ${forecast.guard}. Pay ${forecast.payment} Light, leaving ${forecast.remaining}.</p>${forecast.lethal ? '<p class="notice danger">This will extinguish the lantern before any delivery or reward.</p>' : ''}<p>${forecast.spawn ? 'A scheduled PoLong will board before travel. ' : ''}Deliver matching passengers after surviving the crossing. Then remaining passengers gain anger.</p>`;
    } else if (pending.type === 'PLAY_MEMORY') {
      const memory = state.hand.find(item => item.id === pending.id);
      detail = `<h1>Play ${escape(memories[memory.type].name)}?</h1><p>${escape(memories[memory.type].text)}</p>${pending.target ? `<p>Target: ${escape(souls[[...state.shore, ...state.boat].find(soul => soul.id === pending.target).type].name)} (${escape(pending.target)})</p>` : ''}<p>Confirm consumes this copy and this window's memory allowance.</p>`;
    } else {
      const due = state.shore.filter(soul => soul.anger + 1 >= data.config.shoreAngerLimit).length;
      const cost = Math.max(0, due - state.window.guard);
      detail = `<h1>Resolve the return?</h1><p>${due} waiting soul${due === 1 ? '' : 's'} will expire. Expected damage ${cost} after Guard. ${cost >= state.light ? 'The lantern will go out before healing.' : 'Then restore two Light, capped at six.'}</p><p>No outward round or PoLong spawn occurs. The next cycle begins with a fresh facilitator queue.</p>`;
    }
    return `<section class="review"><p class="eyebrow">Review before confirming</p>${detail}<div class="toolbar">${button('Back', 'back')}${button('Confirm action', 'confirm', '', 'primary')}</div></section>`;
  }
  function chooseMemory(id) {
    const held = state.hand.find(memory => memory.id === id);
    const definition = memories[held.type];
    if (['calm', 'passage'].includes(definition.kind)) {
      const targets = definition.kind === 'calm' ? [...state.shore, ...state.boat] : state.boat;
      if (!targets.length) throw new Error('This memory needs an active target.');
      modal('Choose a target', `<p>${escape(definition.text)}</p><label for="memory-target">Target soul</label><select id="memory-target">${targets.map(soul => `<option value="${escape(soul.id)}">${escape(souls[soul.type].name)} · ${state.shore.includes(soul) ? 'shore' : 'boat'} · anger ${soul.anger} · ${escape(soul.id)}</option>`).join('')}</select>${button('Review memory', 'target-memory', id, 'primary')}`);
    } else apply({type: 'PLAN', action: {type: 'PLAY_MEMORY', id}});
  }
  function showRoutes() {
    if (!state) throw new Error('Start or resume a run first.');
    modal('Facilitator route input', `<p>Prepare pairs while the player looks away. Future offers stay out of the player view until progress or Foresight reveals them.</p><p class="hint">This local shared screen is not an access-control boundary. Save JSON contains concealed offers for faithful reload.</p><details><summary>Destination IDs</summary><ul>${data.destinations.map(item => `<li><code>${escape(item.id)}</code>: ${escape(item.name)}, fog ${item.fog}</li>`).join('')}</ul></details><label for="route-input">Route queue JSON: an array of two-ID pairs</label><textarea id="route-input" rows="7" placeholder='[["DEST-STYX","DEST-HAVEN"]]'></textarea><label for="route-file">Or read a local route JSON file</label><input id="route-file" type="file" accept="application/json,.json"><div class="toolbar">${button('Append offers', 'append-routes', '', 'primary')}${button('Replace concealed offers', 'replace-routes')}</div><p class="hint">Currently ${state.routes.offers.length} offers pending, ${state.routes.revealed} revealed. Replace preserves all revealed offers. Each new cycle starts an empty queue; unused offers from the prior cycle are cleared.</p>${button('Insert sample into editor', 'sample-routes')}<p class="hint">The sample is only an editable example, never the official ordering method. Insert does not apply it.</p>`);
    dialog.querySelector('#route-file').onchange = async event => {
      try { const file = event.target.files[0]; if (file.size > 5000000) throw new Error('Route file must be under 5 MB.'); dialog.querySelector('#route-input').value = await file.text(); } catch (error) { showError(error, true); }
    };
  }
  function guide() {
    modal('Guide & saves', `<p>${escape(data.rules.objective)}</p><details open><summary>Round sequence</summary><ol>${data.roundSteps.map(step => `<li>${escape(step)}</li>`).join('')}</ol></details><details><summary>Return sequence</summary><ol>${data.returnSteps.map(step => `<li>${escape(step)}</li>`).join('')}</ol></details>${Object.entries(data.rules).filter(([key]) => key !== 'objective').map(([key, text]) => `<details><summary>${escape(key[0].toUpperCase() + key.slice(1))}</summary><p>${escape(text)}</p></details>`).join('')}<details><summary>All memory effects</summary>${data.memories.map(memory => `<p><strong>${escape(memory.name)}</strong>: ${escape(memory.text)}</p>`).join('')}</details><div class="toolbar">${state ? button('Export save', 'export') + button('Stop and save session', 'stop') : ''}${button('Show save import', 'import-form')}${button('Export raw slot data', 'raw-export')}</div><p class="hint">Autosave uses three v0.6 slots only. Older versions keep their own saves. JSON imports are checked before a replacement confirmation. Export regularly, especially when playing from a file URL.</p>`);
  }
  function exportText(text, filename) {
    const address = URL.createObjectURL(new Blob([text], {type: 'application/json'}));
    const link = document.createElement('a');
    link.href = address; link.download = filename;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(address), 1000);
  }
  function importForm() {
    modal('Import a v0.6 save', `<label for="save-input">Paste save JSON</label><textarea id="save-input" rows="9"></textarea><label for="save-file">Or choose a saved JSON file</label><input id="save-file" type="file" accept="application/json,.json"><label for="save-slot">Destination slot</label><select id="save-slot">${[1, 2, 3].map(number => `<option value="${number}" ${number === slot ? 'selected' : ''}>Slot ${number}</option>`).join('')}</select>${button('Validate and import', 'import-save', '', 'primary')}`);
    dialog.querySelector('#save-file').onchange = async event => {
      try { const file = event.target.files[0]; if (file.size > 5000000) throw new Error('Save must be under 5 MB.'); dialog.querySelector('#save-input').value = await file.text(); } catch (error) { showError(error, true); }
    };
  }
  function handle(action, value) {
    if (action === 'close') dialog.close();
    else if (action === 'new') newRun(Number(value));
    else if (action === 'load') load(Number(value));
    else if (action === 'board') apply({type: 'BOARD', id: value});
    else if (action === 'depart') apply({type: 'DEPART'});
    else if (action === 'skip') apply({type: 'SET_VIEW', screen: 'route'});
    else if (action === 'memory-back') apply({type: 'SET_VIEW', screen: 'memory'});
    else if (action === 'route-plan') apply({type: 'PLAN', action: {type: 'CROSS', destination: value}});
    else if (action === 'return-plan') apply({type: 'PLAN', action: {type: 'RETURN'}});
    else if (action === 'memory') chooseMemory(value);
    else if (action === 'target-memory') { const target = dialog.querySelector('#memory-target').value; apply({type: 'PLAN', action: {type: 'PLAY_MEMORY', id: value, target}}); dialog.close(); }
    else if (action === 'back') apply({type: 'BACK'});
    else if (action === 'confirm') apply({type: 'CONFIRM'});
    else if (action === 'deliver') apply({type: 'DELIVER', ids: deliverySelection});
    else if (action === 'discard') apply({type: 'DISCARD_MEMORY', id: value});
    else if (action === 'resume') apply({type: 'RESUME'});
    else if (action === 'stop') { apply({type: 'STOP'}); dialog.close(); }
    else if (action === 'routes') showRoutes();
    else if (action === 'append-routes' || action === 'replace-routes') {
      const parsed = JSON.parse(dialog.querySelector('#route-input').value);
      const offers = Array.isArray(parsed) ? parsed : parsed.offers;
      apply({type: action === 'append-routes' ? 'APPEND_ROUTES' : 'REPLACE_HIDDEN_ROUTES', offers});
      dialog.close();
    } else if (action === 'sample-routes') dialog.querySelector('#route-input').value = JSON.stringify([['DEST-STYX','DEST-ACHERON'], ['DEST-ASPHODEL','DEST-ELYSIUM'], ['DEST-TARTARUS','DEST-HAVEN']], null, 2);
    else if (action === 'export') exportText(game.exportSave(state), 'The_Ferryman_v0.6_slot-' + slot + '.json');
    else if (action === 'raw-export') exportText(JSON.stringify({version: '0.6', slots: [1, 2, 3].map(number => ({slot: number, raw: read('slot-' + number)}))}, null, 2), 'The_Ferryman_v0.6_raw-slots.json');
    else if (action === 'import-form') importForm();
    else if (action === 'import-save') {
      const imported = game.importSave(dialog.querySelector('#save-input').value);
      const number = Number(dialog.querySelector('#save-slot').value);
      const accept = () => { state = imported; slot = number; screen = state.uiStep; persist(); render(); dialog.close(); };
      if (read('slot-' + number)) confirmReplacement('Replace slot ' + number + '?', 'The imported save is valid. Confirm replacing this v0.6 slot.', accept);
      else accept();
    }
  }
  document.addEventListener('click', event => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    try { handle(target.dataset.action, target.dataset.value); } catch (error) { showError(error, dialog.open); }
  });
  document.addEventListener('change', event => {
    if (event.target.matches('[data-deliver]')) {
      const id = event.target.dataset.deliver;
      deliverySelection = event.target.checked ? [...deliverySelection, id] : deliverySelection.filter(item => item !== id);
    }
  });
  document.querySelector('#home').onclick = () => { state = null; render(); };
  document.querySelector('#guide').onclick = guide;
  document.querySelector('#facilitator').onclick = () => { try { showRoutes(); } catch (error) { showError(error); } };
  globalThis.FerryUI = Object.freeze({snapshot: () => state ? game.clone(state) : null, storageNamespace: namespace});
  const active = Number(read('active'));
  if ([1, 2, 3].includes(active) && read('slot-' + active)) {
    try { load(active); } catch (error) { render(); showError(error); }
  } else render();
})();
