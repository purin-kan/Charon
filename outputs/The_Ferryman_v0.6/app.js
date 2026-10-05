/* The Ferryman v0.6 interface in the v0.4 style: one decision per page, picture cards, popups.
   All rules live in engine.js; this file renders, dispatches actions and deals route offers. */
(() => {
  'use strict';
  const game = globalThis.Ferry, data = game.data, C = data.config;
  const ART = Object.assign({}, globalThis.FerryArt, { 'SOUL-POLONG': 'assets/art/newpolong.jpg' });
  const SOUL = Object.fromEntries(data.souls.map(s => [s.id, s]));
  const DEST = Object.fromEntries(data.destinations.map(d => [d.id, d]));
  const MEM = Object.fromEntries(data.memories.map(m => [m.id, m]));
  const DEST_IDS = data.destinations.map(d => d.id);
  const COLOR = { 'DEST-HAVEN': '#957020', 'DEST-STYX': '#6b5285', 'DEST-ACHERON': '#3f6f7a', 'DEST-ASPHODEL': '#486f91', 'DEST-ELYSIUM': '#477455', 'DEST-TARTARUS': '#a84d3d' };
  const qa = new URLSearchParams(location.search).get('qa');
  // Same storage namespace as the earlier v0.6 interface, so existing saves appear in their slots.
  const NS = 'the-ferryman:v0.6:' + (qa && /^[a-z0-9_-]{1,60}$/i.test(qa) ? 'qa:' + qa + ':' : 'player:');
  const SLOTS = [1, 2, 3], slotKey = n => NS + 'slot-' + n;
  const stage = document.querySelector('#stage'), status = document.querySelector('#status');
  const menu = document.querySelector('#menu'), menuContent = document.querySelector('#menu-content'), popup = document.querySelector('#popup');
  let state = null, slot = 1, slots = {}, broken = {}, selected = new Set(), storageNote = '', popupLocked = false, entered = false;
  try { entered = sessionStorage.getItem('ferryman-v06-entered') === '1'; } catch {}

  function el(tag, text, cls) { const n = document.createElement(tag); if (text !== undefined && text !== null) n.textContent = text; if (cls) n.className = cls; return n; }
  function button(text, fn, cls = '', disabled = false, key = '') { const b = el('button', text, cls); b.type = 'button'; b.disabled = disabled; b.addEventListener('click', fn); if (key) b.dataset.focus = key; return b; }
  function paragraph(parent, text, cls) { const inline = parent.dataset && parent.dataset.inline; const p = el(inline ? 'span' : 'p', text, (inline ? 'line ' : '') + (cls || '')); parent.append(p); return p; }
  function announce(text) { document.querySelector('#announcement').textContent = text; }
  function notice(text, danger = false, parent = stage) { paragraph(parent, text, 'notice' + (danger ? ' danger' : '')); }
  function heading(title, description) { const h = el('h1', title); h.tabIndex = -1; stage.append(h); if (description) paragraph(stage, description, 'intro'); }
  const soulOf = item => SOUL[item.type];
  const placeName = id => id ? DEST[id].name : 'Starting Shore';
  const initials = name => name.split(' ').map(w => w[0]).slice(0, 2).join('');
  const isPolong = item => item.type === 'SOUL-POLONG';
  const polongFog = item => isPolong(item) && item.anger >= C.polongFogThreshold ? C.polongFog : 0;
  const roundsToPolong = () => { const r = Number(BigInt(state.round) % BigInt(C.spawnInterval)); return C.spawnInterval - r; };

  // Khmer-motif line icons.
  const ICONS = {
    boat: '<path d="M2 15h20l-3.5 4.5h-13z"/><path d="M6.5 15V10q5.5-4 11 0v5"/><path d="M12 7.5V4"/>',
    lamp: '<path d="M12 2.5c2.2 2.8 2.2 5 0 7-2.2-2-2.2-4.2 0-7z"/><path d="M5.5 12h13l-2.5 4h-8z"/><path d="M10 16v3.5h4V16M8 20.5h8"/>',
    lotus: '<path d="M12 20c-2.5-2.6-2.5-8.6 0-13 2.5 4.4 2.5 10.4 0 13z"/><path d="M11 19.6C7 19 4 15.5 4 11c3.3.3 5.6 2.2 7 4.6M13 19.6c4-.6 7-4.1 7-8.6-3.3.3-5.6 2.2-7 4.6"/>',
    steps: '<path d="M2.5 20.5h19M5 16.5h14M8 12.5h8"/><path d="M12 12.5V5.5"/><path d="M12 5.5c-2 0-3.5 1-4.5 2.5M12 5.5c2 0 3.5 1 4.5 2.5"/>',
    spirit: '<path d="M7 20.5V11a5 5 0 0 1 10 0v9.5l-2.5-2-2.5 2-2.5-2z"/><path d="M10 11h.01M14 11h.01"/>',
    fog: '<path d="M3 8.5h10.5a2.5 2.5 0 1 0-2.5-2.5"/><path d="M3 13h15a2.5 2.5 0 1 1-2.5 2.5"/><path d="M3 17.5h7"/>',
    wheel: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2"/><path d="M12 3.5V10M12 14v6.5M3.5 12H10M14 12h6.5M6 6l4.6 4.6M13.4 13.4 18 18M18 6l-4.6 4.6M10.6 13.4 6 18"/>',
    flower: '<circle cx="12" cy="12" r="2.2"/><path d="M12 9.8c-1.6-2-1.6-4.6 0-6.8 1.6 2.2 1.6 4.8 0 6.8zM12 14.2c1.6 2 1.6 4.6 0 6.8-1.6-2.2-1.6-4.8 0-6.8zM9.8 12c-2 1.6-4.6 1.6-6.8 0 2.2-1.6 4.8-1.6 6.8 0zM14.2 12c2-1.6 4.6-1.6 6.8 0-2.2 1.6-4.8 1.6-6.8 0z"/>',
    knot: '<circle cx="9" cy="12" r="4.5"/><circle cx="15" cy="12" r="4.5"/>',
    check: '<path d="m4.5 12.5 5 5 10-11"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    bud: '<path d="M12 3.5 16.5 12 12 20.5 7.5 12z"/>'
  };
  function ico(name) { const i = el('span', null, 'ico ico-' + name); i.setAttribute('aria-hidden', 'true'); i.innerHTML = '<svg viewBox="0 0 24 24">' + ICONS[name] + '</svg>'; return i; }
  function tagx(text, cls, icon) { const t = el('span', null, 'tagx' + (cls ? ' ' + cls : '')); if (icon) t.append(ico(icon)); t.append(el('span', text)); return t; }
  function iconLine(parent, pairs, cls = 'hint') { const p = el('p', null, 'icon-line ' + cls); for (const [icon, text] of pairs) { const g = el('span', null, 'icon-pair'); g.append(ico(icon), el('span', text)); p.append(g); } parent.append(p); return p; }

  // The ferryman as a reaper: scythe on the pole, ragged hood with ember eyes, lantern at the bow.
  const BOAT_SVG = '<svg viewBox="0 0 240 130" aria-hidden="true"><defs><radialGradient id="lg"><stop offset="0" stop-color="#fff0c4"/><stop offset=".3" stop-color="#edc47f" stop-opacity=".6"/><stop offset="1" stop-color="#edc47f" stop-opacity="0"/></radialGradient></defs>'
    + '<circle class="lantern-glow" cx="182" cy="52" r="46" fill="url(#lg)"/><line class="pole" x1="86" y1="8" x2="132" y2="122"/>'
    + '<path class="blade" d="M87 10 Q104 -4 131 9 Q121 5.5 110 7 Q98 8.5 89.5 15.5 Z"/>'
    + '<path class="s robe" d="M118 22 Q108.5 29 106.5 41 Q101 47 100 60 L95.5 97 L101.5 91.5 L106 98.5 L111 91 L116.5 99.5 L121.5 91 L127 98.5 L132 91.5 L140.5 97 L136 60 Q135 47 129.5 41 Q127.5 29 118 22 Z"/>'
    + '<path class="hood-void" d="M118 30.5 Q111.5 34 111 43.5 Q111.5 51.5 118 53.5 Q124.5 51.5 125 43.5 Q124.5 34 118 30.5 Z"/>'
    + '<g class="eyes"><circle cx="115" cy="43.5" r="1.3"/><circle cx="121" cy="43.5" r="1.3"/></g><path class="bone" d="M105 60 Q100.5 61.5 99.5 58.5M104.5 63 Q100 65 98.5 62.5"/>'
    + '<line class="pole" x1="176" y1="96" x2="176" y2="36"/><path class="hook" d="M176 38 Q182 34 182 44"/><rect class="lamp" x="177" y="44" width="10" height="14" rx="2"/>'
    + '<path class="s hull" d="M18 88 Q120 108 222 86 L208 104 Q120 124 34 104 Z"/><path class="ripple" d="M10 116 Q40 110 70 116 T130 116 T190 116 T250 116"/></svg>';
  function boat(cls) { const b = el('div', null, 'boat ' + cls); b.innerHTML = BOAT_SVG; return b; }

  // Saves and the automatic route dealer.
  function persist() {
    slots[slot] = state; broken[slot] = false;
    try { localStorage.setItem(slotKey(slot), game.exportSave(state)); localStorage.setItem(NS + 'active', String(slot)); storageNote = ''; }
    catch { storageNote = 'This browser cannot save locally. Export JSON to keep your run.'; }
  }
  try { for (const n of SLOTS) { const raw = localStorage.getItem(slotKey(n)); if (raw) { try { slots[n] = game.importSave(raw); } catch { broken[n] = true; } } } }
  catch { storageNote = 'Local saving is unavailable. Export JSON to keep your run.'; }
  const rand = n => crypto.getRandomValues(new Uint32Array(1))[0] % n;
  // The guideline's facilitator shuffles and hands out the maps; online, the river deals two different destinations per fork.
  function dealRoutes() {
    if (!state || state.phase === 'ended' || state.paused) return;
    const missing = C.foresightForks - state.routes.offers.length; if (missing <= 0) return;
    const offers = []; for (let i = 0; i < missing; i++) { const a = rand(6); let b = rand(5); if (b >= a) b++; offers.push([DEST_IDS[a], DEST_IDS[b]]); }
    state = game.transition(state, { type: 'APPEND_ROUTES', offers });
  }
  function begin(n = slot, seed = crypto.getRandomValues(new Uint32Array(1))[0]) {
    if (slots[n] && !window.confirm('Start a new run in Save ' + n + '? This replaces that save. Export it first if you want to keep it.')) return false;
    slot = n; state = game.create(seed); dealRoutes(); selected = new Set(); persist(); render(); return true;
  }
  function erase(n) {
    if (!window.confirm('Erase Save ' + n + '? This cannot be undone. Export it first if you want to keep it.')) return;
    try { localStorage.removeItem(slotKey(n)); } catch {}
    slots[n] = null; broken[n] = false; render();
  }
  function newLines(before, after) {
    const last = before.log[before.log.length - 1];
    let i = last ? after.log.findIndex(e => e.round === last.round && e.cycle === last.cycle && e.text === last.text) : -1;
    if (i < 0) i = Math.max(-1, after.log.length - 7);
    return after.log.slice(i + 1).map(e => e.text);
  }
  function send(action, after) {
    const before = state; let next;
    try { next = game.transition(state, action); } catch (e) { announce(e.message); showNote('Not possible yet', [e.message]); return; }
    state = next; dealRoutes(); persist(); render();
    const lines = newLines(before, state);
    if (after) after(lines, before);
  }

  function summary() {
    status.replaceChildren();
    if (!state) { status.hidden = true; return; }
    status.hidden = false;
    const at = state.phase === 'boarding' || (state.phase === 'window' && state.window.kind === 'return' && !state.destination) ? 'Starting Shore' : placeName(state.destination);
    for (const [label, value] of [['Light', state.light + ' / ' + C.maxLight], ['Cycle', state.cycle], ['Round', state.round], ['Boat', game.seats(state) + ' / ' + C.seats + ' seats'], ['At', at]]) {
      const item = el('span', label + ' '); item.append(el('strong', String(value))); status.append(item);
    }
  }
  function currentStep() {
    if (state.phase === 'boarding') return 'boarding';
    if (state.phase === 'review') return 'review';
    if (state.phase === 'delivery' || state.phase === 'trim') return 'delivery';
    return memoryPageNow() ? 'memory' : 'route';
  }
  function flow() {
    const cur = currentStep(), nav = el('div', null, 'flow'); nav.setAttribute('aria-label', 'Round steps');
    for (const [key, label] of [['boarding', 'Passengers'], ['memory', 'Memory'], ['route', 'Route'], ['review', 'Review'], ['delivery', 'Delivery']]) {
      const s = el('span', label, key === cur ? 'active' : ''); if (key === cur) s.setAttribute('aria-current', 'step'); nav.append(s);
    }
    stage.append(nav);
  }
  let cardCount = 0;
  function choiceCard(o) {
    const b = el('button', null, 'choice' + (o.pressed ? ' selected' : '') + (o.cls ? ' ' + o.cls : '')); b.type = 'button'; b.disabled = !!o.disabled;
    b.setAttribute('aria-label', o.label); if (o.pressed !== undefined) b.setAttribute('aria-pressed', String(!!o.pressed));
    if (o.focusKey) b.dataset.focus = o.focusKey;
    for (const [k, v] of Object.entries(o.data || {})) b.dataset[k] = v;
    if (o.dest) b.style.setProperty('--dest', o.dest);
    if (o.onPick) b.addEventListener('click', o.onPick);
    if (o.art) { const img = el('img'); img.src = o.art; img.alt = ''; b.append(img); }
    else if (o.sigil) { const s = el('span', o.sigil, 'sigil'); s.setAttribute('aria-hidden', 'true'); b.append(s); }
    if (o.badge && o.pressed) { const bd = el('span', null, 'badge'); bd.append(ico('check'), el('span', o.badge)); b.append(bd); }
    const body = el('span', null, 'card-body'); body.dataset.inline = '1'; body.id = 'choice-' + (++cardCount);
    b.setAttribute('aria-describedby', body.id); b.append(body);
    return { b, body };
  }
  function fact(list, text, cls = '') { const row = el('span', null, 'fact' + (cls ? ' ' + cls : '')), ic = ico('bud'); ic.classList.add('ic'); row.append(ic, el('span', text)); list.append(row); return row; }
  function soulFacts(list, item, where) {
    const s = soulOf(item);
    fact(list, 'Wishes for ' + DEST[s.wish].name, 'wish');
    if (isPolong(item)) fact(list, 'Tainted: cannot be refused. Adds 1 fog to every crossing while its Ship Anger is 2 or 3.', 'clash');
    if (item.type === 'SOUL-MOTHER') fact(list, 'Quest: deliver Child to Haven first, then Mother to Tartarus, to earn Passage.', 'ability');
    if (item.type === 'SOUL-CHILD') fact(list, 'Quest: Child to Haven before Mother reaches Tartarus.', 'ability');
    fact(list, s.memory ? 'Memory: ' + MEM[s.memory].name : 'Leaves no memory');
    if (where === 'shore') { const soon = item.anger + 1 >= C.shoreAngerLimit; fact(list, 'Shore Anger ' + item.anger + ' / ' + C.shoreAngerLimit + (soon ? ': becomes a wraith on the next return' : ''), 'deadline' + (soon ? ' urgent' : '')); }
    if (where === 'boat') { const soon = item.anger + 1 >= C.shipAngerLimit; fact(list, 'Ship Anger ' + item.anger + ' / ' + C.shipAngerLimit + (soon ? ': becomes a wraith after this round' : ''), 'deadline' + (soon ? ' urgent' : '')); }
  }
  function soulCard(item, mode) {
    const s = soulOf(item), chosen = mode === 'boarding' ? state.selected.includes(item.id) : mode === 'delivery' ? selected.has(item.id) : undefined;
    const matching = mode === 'delivery' && s.wish === state.destination;
    const full = mode === 'boarding' && !chosen && game.seats(state) + s.seats > C.seats;
    const label = mode === 'boarding' ? (chosen ? 'Leave ' + s.name + ' ashore' : 'Board ' + s.name) : mode === 'delivery' ? (chosen ? 'Keep aboard: ' : 'Select: ') + s.name : s.name;
    const pick = mode === 'boarding' ? () => send({ type: 'BOARD', id: item.id }) : mode === 'delivery' ? () => { if (chosen) selected.delete(item.id); else selected.add(item.id); render(); } : null;
    const { b, body } = choiceCard({ art: ART[item.type] || null, sigil: ART[item.type] ? null : initials(s.name), label, pressed: chosen, disabled: full || (mode === 'delivery' && !matching), focusKey: item.id, badge: mode === 'delivery' ? 'Disembarks' : 'Aboard', onPick: pick, data: { soul: item.id } });
    paragraph(body, (isPolong(item) ? item.id.replace('POLONG-', 'PoLong #') : s.name) + ' · ' + s.seats + (s.seats === 1 ? ' seat' : ' seats'), 'tag');
    if (isPolong(item)) paragraph(body, 'Tainted', 'tag tainted');
    paragraph(body, s.name, 'title');
    const list = el('span', null, 'facts'); body.append(list);
    soulFacts(list, item, mode === 'boarding' ? 'shore' : 'boat');
    if (mode === 'delivery' && !matching) paragraph(body, 'Not here: wishes for ' + DEST[s.wish].name + '.', 'warning');
    if (full) paragraph(body, 'Needs ' + s.seats + ' free seats.', 'warning');
    return b;
  }
  function routeCard(id, onPick, note) {
    const d = DEST[id];
    const { b, body } = choiceCard({ art: ART[id], dest: COLOR[id], cls: 'route-card', label: (onPick ? 'Travel to ' : 'Route: ') + d.name, onPick, data: onPick ? { route: id } : {} });
    paragraph(body, d.name, 'title'); paragraph(body, 'Base fog ' + d.fog, 'key');
    if (note) paragraph(body, note.text, 'fog-brief' + (note.warn ? ' warning' : ''));
    if (!onPick) b.tabIndex = -1;
    return b;
  }
  function backLink(label, fn) { const row = el('div', null, 'back-row'); row.append(button(label, fn, 'text-button')); stage.append(row); }
  function toolbar(backFn, mainLabel, mainFn, disabled = false, chip = '') {
    const bar = el('div', null, 'toolbar'); if (chip) bar.append(el('span', chip, 'chip'));
    const actions = el('div', null, 'actions'); if (backFn) actions.append(button('Back', backFn));
    actions.append(button(mainLabel, mainFn, 'primary', disabled)); bar.append(actions); stage.append(bar);
  }
  function previewFor(dest) { try { return game.preview(Object.assign(game.clone(state), { phase: 'window' }), dest); } catch { return null; } }
  const memoryPageNow = () => state.phase === 'window' && state.uiStep === 'memory' && !state.window.used && state.hand.length > 0;

  function renderBoarding() {
    heading('Who will you carry?', 'Tap a soul to bring them aboard. Up to ' + C.seats + ' seats; the Soldier takes two. Souls left on the shore gain anger each return, and at ' + C.shoreAngerLimit + ' they become wraiths.');
    const grid = el('div', null, 'grid soul-grid'); state.shore.forEach(item => grid.append(soulCard(item, 'boarding'))); stage.append(grid);
    toolbar(null, 'Set out', () => send({ type: 'DEPART' }), !state.selected.length, game.seats(state) + ' / ' + C.seats + ' seats filled');
    const first = game.offers(state)[0];
    if (first) {
      const offers = el('section', null, 'offers'); offers.append(el('h2', 'The first fork'));
      paragraph(offers, 'The river offers these two destinations on the first round of this cycle.', 'hint');
      const og = el('div', null, 'grid'); for (const id of first) og.append(routeCard(id)); offers.append(og); stage.append(offers);
    }
  }
  function renderMemory() {
    const ret = state.window.kind === 'return';
    heading('What will you remember?', 'Play one memory before this ' + (ret ? 'return' : 'round') + ', or keep them all. Each memory is used once.');
    const grid = el('div', null, 'grid');
    const keep = choiceCard({ label: 'Use no memory', data: { memory: 'none' }, onPick: () => send({ type: 'SET_VIEW', screen: 'route' }) });
    paragraph(keep.body, 'Keep your memories', 'title'); paragraph(keep.body, 'Save every card for a later round.', 'key'); grid.append(keep.b);
    for (const held of state.hand) {
      const m = MEM[held.type], needs = m.kind === 'calm' ? [...state.shore, ...state.boat] : m.kind === 'passage' ? state.boat : null;
      const { b, body } = choiceCard({ art: ART[held.type], label: 'Play ' + m.name + ' ' + held.id, data: { memory: held.id }, disabled: !!needs && !needs.length,
        onPick: () => { if (needs) pickTarget(held, needs); else playMemory(held, null); } });
      paragraph(body, m.name, 'title'); paragraph(body, m.text, 'key');
      paragraph(body, 'From ' + (SOUL[held.source] ? SOUL[held.source].name : 'the family quest'), 'hint');
      if (needs) paragraph(body, needs.length ? 'Next: choose a soul.' : 'No soul to target.', 'hint');
      grid.append(b);
    }
    stage.append(grid);
  }
  function playMemory(held, target) {
    send({ type: 'PLAY_MEMORY', id: held.id, target }, lines => showNote(MEM[held.type].name, lines, ART[held.type]));
  }
  function pickTarget(held, targets) {
    const m = MEM[held.type];
    openPopup({ title: m.kind === 'calm' ? 'Calm a soul' : 'Send a soul by Passage', lines: [m.text], wide: true, build: pop => {
      const grid = el('div', null, 'grid soul-grid');
      for (const item of targets) {
        const s = soulOf(item), aboard = state.boat.some(x => x.id === item.id);
        const { b, body } = choiceCard({ art: ART[item.type] || null, sigil: ART[item.type] ? null : initials(s.name), label: 'Choose ' + s.name, data: { target: item.id }, onPick: () => { closePopup(); playMemory(held, item.id); } });
        paragraph(body, s.name, 'title'); paragraph(body, (aboard ? 'Ship Anger ' : 'Shore Anger ') + item.anger, 'anger'); grid.append(b);
      }
      pop.append(grid); const actions = el('div', null, 'actions'); actions.append(button('Cancel', closePopup, 'text-button')); pop.append(actions);
    } });
  }
  function renderRoute() {
    if (state.window.kind === 'return') {
      heading('Time to return', 'The boat is empty. Return to the Starting Shore: waiting souls gain anger, then you recover ' + C.returnLight + ' Light.');
      const grid = el('div', null, 'grid');
      const { b, body } = choiceCard({ art: ART['MAT-SHORE'], label: 'Return to the Starting Shore', data: { route: 'return' }, onPick: () => send({ type: 'PLAN', action: { type: 'RETURN' } }) });
      paragraph(body, 'Starting Shore', 'title'); paragraph(body, 'No travel fog. Not an outward round.', 'key'); grid.append(b); stage.append(grid);
    } else {
      heading('Where next?', 'Choose one of the two destinations. Fog totals include PoLong and any Fog Shield or Guard in play.');
      const forks = game.offers(state), grid = el('div', null, 'grid');
      for (const id of forks[0] || []) { const p = previewFor(id); grid.append(routeCard(id, () => send({ type: 'PLAN', action: { type: 'CROSS', destination: id } }), p && { text: p.payment + ' Light · ' + (p.lethal ? 'puts out your lantern' : p.remaining + ' Light left'), warn: p.lethal })); }
      stage.append(grid);
      if (forks.length > 1) {
        const ahead = el('section', null, 'offers'); ahead.append(el('h2', 'Foresight: the forks ahead'));
        const g = el('div', null, 'grid'); forks.slice(1).forEach((pair, i) => pair.forEach(id => g.append(routeCard(id, null, { text: 'Fork ' + (i + 2) })))); ahead.append(g); stage.append(ahead);
      }
    }
    if (!state.window.used && state.hand.length) backLink('Back to memories', () => send({ type: 'SET_VIEW', screen: 'memory' }));
  }
  function renderReview() {
    const pending = state.pending;
    heading('One crossing at a time', 'Review your choice. Back lets you change it.');
    const box = el('div', null, 'review');
    if (pending.type === 'CROSS') {
      const p = previewFor(pending.destination); box.append(el('h2', placeName(state.destination) + ' → ' + DEST[pending.destination].name));
      const img = el('img', null, 'result-art'); img.src = ART[pending.destination]; img.alt = ''; box.append(img);
      paragraph(box, p.payment + ' Light · ' + (p.lethal ? 'puts out your lantern' : p.remaining + ' Light left'), 'numbers' + (p.lethal ? ' warning' : ''));
      paragraph(box, 'Base ' + p.base + ' + PoLong ' + p.tainted + ' − Fog Shield ' + p.shield + ' = ' + p.fog + ' fog. Guard prevents ' + Math.min(p.guard, p.fog) + '.', 'hint');
      if (p.spawn) notice('A PoLong boards at the start of this round (round ' + (Number(state.round) + 1) + '). It takes no seat and cannot be refused.', false, box);
      if (p.lethal) notice('This crossing puts out your lantern. The run ends before delivery.', true, box);
      stage.append(box); toolbar(() => send({ type: 'BACK' }), p.lethal ? 'Accept and cross' : 'Confirm crossing', () => send({ type: 'CONFIRM' }, showArrival));
    } else if (pending.type === 'RETURN') {
      box.append(el('h2', 'Return to the Starting Shore'));
      const due = state.shore.filter(x => x.anger + 1 >= C.shoreAngerLimit), cost = Math.max(0, due.length * C.wraithDamage - state.window.guard);
      paragraph(box, due.length ? due.map(x => soulOf(x).name).join(', ') + ' will become ' + (due.length > 1 ? 'wraiths' : 'a wraith') + ': −' + cost + ' Light after Guard.' : 'No waiting soul reaches its limit.', 'numbers' + (cost >= state.light ? ' warning' : ''));
      paragraph(box, 'Then, if your lantern still burns, recover ' + C.returnLight + ' Light (max ' + C.maxLight + ') and new souls arrive.', 'hint');
      if (cost >= state.light) notice('The lantern goes out before you can recover.', true, box);
      stage.append(box); toolbar(() => send({ type: 'BACK' }), 'Confirm return', () => send({ type: 'CONFIRM' }, showReturn));
    }
  }
  function renderDelivery() {
    heading('Who disembarks here?', 'Only souls who wish for ' + DEST[state.destination].name + ' can leave the boat. Each ordinary delivery gives its memory. Everyone still aboard then gains 1 Ship Anger.');
    const grid = el('div', null, 'grid soul-grid'); state.boat.forEach(item => grid.append(soulCard(item, 'delivery'))); stage.append(grid);
    const matches = state.boat.filter(x => soulOf(x).wish === state.destination);
    if (matches.length && selected.size < matches.length) backLink('Select everyone who wishes for ' + DEST[state.destination].name, () => { selected = new Set(matches.map(x => x.id)); render(); });
    const ids = [...selected].filter(id => matches.some(x => x.id === id));
    const doomed = state.boat.filter(x => !ids.includes(x.id) && x.anger + 1 >= C.shipAngerLimit);
    if (doomed.length) notice(doomed.map(x => soulOf(x).name).join(', ') + ' will become ' + (doomed.length > 1 ? 'wraiths' : 'a wraith') + ' after this round if kept aboard: −1 Light each.', true);
    toolbar(null, ids.length ? 'Deliver ' + ids.length + ' soul' + (ids.length === 1 ? '' : 's') : 'Keep everyone aboard', () => { const go = ids; selected = new Set(); send({ type: 'DELIVER', ids: go }, lines => { if (lines.length) showNote('End of the round', lines); }); });
  }
  function renderTrim() {
    heading('Keep up to ' + C.handLimit + ' memories', 'You hold ' + state.hand.length + '. Tap a memory to discard it.');
    const grid = el('div', null, 'grid');
    for (const held of state.hand) { const m = MEM[held.type], { b, body } = choiceCard({ art: ART[held.type], label: 'Discard ' + m.name, data: { discard: held.id }, onPick: () => send({ type: 'DISCARD_MEMORY', id: held.id }) }); paragraph(body, m.name, 'title'); paragraph(body, m.text, 'key'); paragraph(body, 'Tap to discard', 'hint'); grid.append(b); }
    stage.append(grid);
  }
  function renderEnded() {
    const hero = el('div', null, 'ending'); hero.append(boat('docked dark'));
    paragraph(hero, 'Journey’s end · cycle ' + state.cycle + ' · round ' + state.round, 'eyebrow'); stage.append(hero);
    heading('The river remembers', state.ending);
    const stats = el('dl', null, 'end-stats five');
    for (const [n, label, sub] of [[state.completed, 'Cycles survived'], [state.round, 'Rounds travelled'], [state.deliveries, 'Souls delivered'], [state.hand.length, 'Memories held'], [state.quest === 'completed' ? 'Yes' : 'No', 'Family quest', state.quest]]) {
      const tile = el('div', null, 'end-stat'); tile.append(el('dd', String(n)), el('dt', label)); if (sub) tile.append(el('span', sub, 'end-sub')); stats.append(tile);
    }
    stage.append(stats);
    const go = el('div', null, 'end-go'); go.append(button('Start a new run', () => begin(slot), 'primary')); stage.append(go);
  }

  // Trip panel: portraits, anger pips and what comes next.
  function pips(value, max) { const s = el('span', null, 'pips'); s.setAttribute('aria-hidden', 'true'); for (let i = 1; i <= max; i++) s.append(el('i', null, i <= value ? (i === max - 1 && value === max - 1 ? 'new' : 'on') : '')); return s; }
  function mini(item, said, icons, cls = '') {
    const s = soulOf(item), row = el('li', null, 'mini' + (cls ? ' ' + cls : ''));
    if (ART[item.type]) { const img = el('img'); img.src = ART[item.type]; img.alt = ''; row.append(img); } else { const sg = el('span', initials(s.name), 'mini-sigil'); sg.setAttribute('aria-hidden', 'true'); row.append(sg); }
    const t = el('div'); t.append(el('strong', s.name)); const meta = el('span', null, 'meta'); meta.setAttribute('aria-hidden', 'true');
    meta.append(...icons); t.append(meta, el('span', said, 'sr-only')); row.append(t); return row;
  }
  function tripColumn(icon, title, count, empty) {
    const col = el('div', null, 'trip-col'), h = el('h3'), ic = ico(icon); ic.classList.add('icon');
    h.append(ic, el('span', title)); if (count !== null) h.append(el('span', String(count), 'count'));
    col.append(h); const list = el('ul', null, 'minis'); col.append(list); if (empty) paragraph(col, empty, 'trip-empty');
    return { col, list };
  }
  function tactics() {
    const box = el('section', null, 'trip'); box.setAttribute('aria-label', 'This cycle');
    const head = el('div', null, 'trip-head'); head.append(el('h2', 'This cycle'));
    const stops = el('div', null, 'stops'), k = roundsToPolong();
    for (const [t, on] of [['Round ' + state.round, false], [k === 1 ? 'PoLong boards next round' : 'PoLong in ' + k + ' rounds', k === 1], ['Quest: ' + state.quest.replace('-', ' '), state.quest === 'completed']]) stops.append(el('span', t, 'stop' + (on ? ' done' : '')));
    head.append(stops); box.append(head);
    const fog = state.boat.reduce((t, x) => t + polongFog(x), 0);
    iconLine(box, [['fog', 'PoLong fog now +' + fog + '. Ship Anger limit ' + C.shipAngerLimit + ', Shore Anger limit ' + C.shoreAngerLimit + '. Each wraith costs 1 Light.']], 'trip-note');
    const cols = el('div', null, 'trip-cols');
    const onBoat = tripColumn('boat', 'On the boat', game.seats(state) + '/' + C.seats, state.boat.length ? '' : (state.phase === 'boarding' ? 'Choose passengers above.' : 'Empty.'));
    for (const item of state.boat) { const s = soulOf(item), soon = item.anger + 1 >= C.shipAngerLimit; onBoat.list.append(mini(item, s.name + ': Ship Anger ' + item.anger + ' of ' + C.shipAngerLimit + ', wishes for ' + DEST[s.wish].name + '.', [pips(item.anger, C.shipAngerLimit), tagx(DEST[s.wish].name, isPolong(item) ? 'bad tainted' : '', 'lotus')], soon ? 'doomed' : '')); }
    cols.append(onBoat.col);
    const shore = tripColumn('steps', 'Waiting on shore', state.shore.length, state.shore.length ? '' : 'No one is waiting.');
    for (const item of state.shore) { const s = soulOf(item), soon = item.anger + 1 >= C.shoreAngerLimit; shore.list.append(mini(item, s.name + ': Shore Anger ' + item.anger + ' of ' + C.shoreAngerLimit + '.', [pips(item.anger, C.shoreAngerLimit), el('span', 'Anger ' + item.anger + '/' + C.shoreAngerLimit, 'anger-change')], soon ? 'doomed' : '')); }
    cols.append(shore.col);
    const mems = tripColumn('flower', 'Memories', state.hand.length + '/' + C.handLimit, state.hand.length ? '' : 'None yet. Deliver souls to earn them.');
    for (const held of state.hand) { const li = el('li', null, 'mini'); const img = el('img'); img.src = ART[held.type]; img.alt = ''; const t = el('div'); t.append(el('strong', MEM[held.type].name)); const meta = el('span', SOUL[held.source] ? 'From ' + SOUL[held.source].name : 'Quest reward', 'meta'); t.append(meta); li.append(img, t); mems.list.append(li); }
    cols.append(mems.col); box.append(cols);
    const j = el('details', null, 'journal'); j.append(el('summary', 'River journal')); const ol = el('ol');
    for (const x of state.log.slice().reverse()) { const li = el('li'); li.append(el('span', 'Cycle ' + x.cycle + ' · round ' + x.round), document.createTextNode(x.text)); ol.append(li); }
    j.append(ol); box.append(j); stage.append(box);
  }

  // Popups after a move.
  function showArrival(lines) {
    const dest = state.destination, ended = state.phase === 'ended';
    openPopup({ art: ART[dest], eyebrow: ended ? '' : 'You made it across', title: ended ? 'The lantern goes out' : 'Welcome to ' + DEST[dest].name, lines, locked: true, build: closeButton });
  }
  function showReturn(lines) {
    const ended = state.phase === 'ended';
    openPopup({ art: ART['MAT-SHORE'], eyebrow: ended ? '' : 'Cycle ' + state.completed + ' survived', title: ended ? 'The lantern goes out' : 'Welcome back to the Starting Shore', lines, locked: true, build: closeButton });
  }
  function showNote(title, lines, art) { openPopup({ art, title, lines, build: closeButton }); }
  function closeButton(pop) { const actions = el('div', null, 'actions'); actions.append(button('Continue', closePopup, 'primary')); pop.append(actions); }
  function openPopup(o) {
    popup.replaceChildren(); popupLocked = !!o.locked; popup.className = 'popup' + (o.wide ? ' wide' : '');
    if (o.art) { const img = el('img', null, 'popup-art'); img.src = o.art; img.alt = ''; popup.append(img); }
    if (o.eyebrow) paragraph(popup, o.eyebrow, 'eyebrow');
    const h = el('h2', o.title); h.id = 'popup-title'; popup.append(h);
    for (const line of o.lines || []) paragraph(popup, line);
    if (o.build) o.build(popup);
    if (!popup.open) popup.showModal();
  }
  function closePopup() { popupLocked = false; if (popup.open) popup.close(); }

  function renderSplash() {
    const sp = el('div', null, 'splash'), text = el('div', null, 'splash-text');
    paragraph(text, 'The river is calling…', 'eyebrow calling');
    const h = el('h1', null, 'splash-title'); h.tabIndex = -1;
    'Welcome to The Ferryman'.split(' ').forEach((w, i) => { const s = el('span', w + ' '); s.style.animationDelay = (0.4 + i * 0.28) + 's'; h.append(s); });
    text.append(h); paragraph(text, 'One lantern. An endless river.', 'splash-sub');
    const river = el('div', null, 'river'); river.append(boat('arriving'));
    const go = el('div', null, 'splash-go'), enter = button('Enter', () => {
      enter.disabled = true; sp.classList.add('sailing');
      const done = () => { entered = true; try { sessionStorage.setItem('ferryman-v06-entered', '1'); } catch {} render('slot1'); };
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) done(); else setTimeout(done, 1500);
    }, 'primary enter', false, 'enter');
    go.append(enter); sp.append(text, river, go); stage.append(sp);
  }
  function renderTitle() {
    const hero = el('div', null, 'hero'); hero.append(boat('docked')); hero.append(el('h1', 'Welcome to The Ferryman'));
    paragraph(hero, 'You are Charon’s apprentice. Carry souls to the destinations they wish for, spend the memories they leave, and survive every return. The river never ends; how long can your lantern last?', 'intro');
    iconLine(hero, [['boat', C.seats + ' seats'], ['lamp', C.startLight + ' Light'], ['spirit', 'PoLong every ' + C.spawnInterval + ' rounds'], ['wheel', 'Endless cycles']]); stage.append(hero);
    stage.append(el('h2', 'Choose a save', 'slots-title'));
    const grid = el('div', null, 'grid slot-grid');
    for (const n of SLOTS) {
      const s = slots[n], cell = el('div', null, 'slot');
      if (broken[n]) { const { b, body } = choiceCard({ label: 'Save ' + n + ': unreadable', disabled: true }); paragraph(body, 'Save ' + n, 'title'); paragraph(body, 'This save could not be read.', 'warning'); cell.append(b); }
      else if (s) {
        const { b, body } = choiceCard({ art: ART['MAT-SHORE'], label: s.phase === 'ended' ? 'Save ' + n + ': view ended run' : 'Save ' + n + ': continue cycle ' + s.cycle, focusKey: 'slot' + n, onPick: () => { slot = n; state = s; dealRoutes(); selected = new Set(); persist(); render(); } });
        paragraph(body, 'Save ' + n, 'title'); paragraph(body, s.phase === 'ended' ? 'Run ended' : 'Continue', 'key');
        iconLine(body, [['wheel', 'Cycle ' + s.cycle], ['lotus', 'Round ' + s.round]], 'line');
        iconLine(body, [['lamp', 'Light ' + s.light + '/' + C.maxLight], ['flower', s.deliveries + ' delivered']], 'line');
        cell.append(b);
      } else {
        const { b, body } = choiceCard({ label: 'Save ' + n + ': begin a run', focusKey: 'slot' + n, onPick: () => begin(n) }); b.classList.add('empty-slot');
        paragraph(body, 'Save ' + n, 'title'); iconLine(body, [['plus', 'New run']], 'key'); paragraph(body, 'Empty slot. Start fresh at the shore.'); cell.append(b);
      }
      if (s || broken[n]) { const row = el('div', null, 'slot-actions'); if (s) row.append(button('New run', () => begin(n), 'text-button')); row.append(button('Erase', () => erase(n), 'text-button')); cell.append(row); }
      grid.append(cell);
    }
    stage.append(grid);
  }

  const PAGES = { boarding: renderBoarding, review: renderReview, delivery: renderDelivery, trim: renderTrim, ended: renderEnded, window: () => memoryPageNow() ? renderMemory() : renderRoute() };
  function render(focusKey) {
    if (!popupLocked) closePopup();
    stage.replaceChildren(); summary();
    const scene = state && state.destination && state.phase !== 'boarding' ? ART[state.destination] : ART['MAT-SHORE'];
    document.querySelector('.world').style.backgroundImage = 'url("' + scene + '")';
    if (storageNote) notice(storageNote, true);
    document.body.classList.toggle('splash-on', !state && !entered);
    if (!state) { if (entered) renderTitle(); else renderSplash(); }
    else { if (state.phase !== 'ended') flow(); PAGES[state.phase](); if (state.phase !== 'ended') tactics(); }
    const key = focusKey || (!state && !entered ? 'enter' : '');
    const target = key && [...stage.querySelectorAll('[data-focus]')].find(n => n.dataset.focus === key);
    if (target) target.focus(); else { stage.focus(); window.scrollTo(0, 0); }
    announce(state ? state.phase + ' step. Light ' + state.light + '.' : 'Choose a new run or resume.');
  }

  function exportSave() {
    const current = state || slots[slot]; if (!current) return;
    const url = URL.createObjectURL(new Blob([game.exportSave(current)], { type: 'application/json' }));
    const a = el('a'); a.href = url; a.download = 'ferryman-v06-cycle-' + current.cycle + '.json'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  let message;
  function importSave(text) {
    let next; try { next = game.importSave(text); } catch (e) { message.textContent = 'Import rejected: ' + e.message + ' Your current run is unchanged.'; return; }
    if ((state || slots[slot]) && !window.confirm('Replace Save ' + slot + ' with this v0.6 save?')) return;
    state = next; dealRoutes(); selected = new Set(); persist(); menu.close(); render();
  }
  function openMenu() {
    menuContent.replaceChildren();
    paragraph(menuContent, data.rules.objective);
    const r = el('details'); r.open = true; r.append(el('summary', 'Each round')); const ol = el('ol'); data.roundSteps.forEach(t => ol.append(el('li', t))); r.append(ol); menuContent.append(r);
    const t = el('details'); t.append(el('summary', 'Returning to the shore')); const ol2 = el('ol'); data.returnSteps.forEach(x => ol2.append(el('li', x))); t.append(ol2); menuContent.append(t);
    for (const [k, label] of [['boarding', 'Boarding'], ['memories', 'Memories'], ['quest', 'Mother and Child quest']]) { if (!data.rules[k]) continue; const d = el('details'); d.append(el('summary', label)); paragraph(d, data.rules[k]); menuContent.append(d); }
    paragraph(menuContent, 'Online, the river deals each fork from the six destinations at random. At a table, a facilitator hands out the route cards instead.', 'hint');
    const links = el('p');
    for (const [href, label] of [['print/Print_and_Play_v0.6.pdf', 'Print kit (PDF)'], ['print/Player_Guide_v0.6.pdf', 'Player guide (PDF)'], ['RULES.md', 'Full rules']]) { const a = el('a', label); a.href = href; a.target = '_blank'; a.rel = 'noopener'; links.append(a, document.createTextNode(' · ')); }
    menuContent.append(links);
    paragraph(menuContent, storageNote || 'Progress saves automatically in this browser after every move. Export before moving or clearing files.', 'hint');
    const seedLabel = el('label', 'River seed for a new run (optional, 0 to 4294967295)'); seedLabel.htmlFor = 'seed';
    const seed = el('input'); seed.id = 'seed'; seed.type = 'number'; seed.min = '0'; seed.max = '4294967295'; seed.step = '1'; seed.placeholder = 'Random run';
    const row = el('div', null, 'seed-row'); row.append(seed); menuContent.append(seedLabel, row);
    const actions = el('div', null, 'menu-actions');
    actions.append(button('Export JSON', exportSave, '', !(state || slots[slot])),
      button('New run', () => { const raw = seed.value, n = raw === '' ? crypto.getRandomValues(new Uint32Array(1))[0] : Number(raw); if (!Number.isInteger(n) || n < 0 || n > 4294967295) { message.textContent = 'Seed must be a whole number from 0 to 4294967295.'; return; } if (begin(slot, n)) menu.close(); }, '', false, 'new-run'),
      button('Save slots', () => { state = null; menu.close(); render(); }, '', !state));
    menuContent.append(actions);
    const label = el('label', 'Import a v0.6 JSON file'); label.htmlFor = 'import-file';
    const input = el('input'); input.type = 'file'; input.accept = '.json,application/json'; input.id = 'import-file';
    input.addEventListener('change', async () => { const file = input.files[0]; if (!file) return; if (file.size > 5000000) { message.textContent = 'Import rejected: file exceeds 5 MB. Current run unchanged.'; return; } try { importSave(await file.text()); } catch { message.textContent = 'Could not read that file. Current run unchanged.'; } });
    menuContent.append(label, input);
    message = el('p'); message.setAttribute('role', 'status'); menuContent.append(message);
    if (!menu.open) menu.showModal();
  }
  document.querySelector('.brand').addEventListener('click', e => { e.preventDefault(); if (menu.open) menu.close(); state = null; selected = new Set(); entered = false; render(); });
  document.querySelector('#menu-button').addEventListener('click', openMenu);
  document.querySelector('#close-menu').addEventListener('click', () => menu.close());
  menu.addEventListener('close', () => document.querySelector('#menu-button').focus());
  popup.addEventListener('cancel', e => { if (popupLocked) e.preventDefault(); });
  popup.addEventListener('close', () => { if (popupLocked) popup.showModal(); });
  render();
})();
