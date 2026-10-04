/* The Ferryman v0.5 interface in the v0.4 style: one decision per page, picture cards, popups.
   All rules and calculations belong to engine.js; this file only renders and dispatches actions. */
(() => {
  'use strict';
  const F = window.Ferry, D = F.D, C = F.C;
  const qa = new URLSearchParams(location.search).get('qa') === '1';
  // Save 1 keeps the original v0.5 key so an existing night appears there.
  const BASE = qa ? 'ferryman-v05-qa' : 'ferryman-v05-night', SLOTS = [1,2,3], slotKey = n => n === 1 ? BASE : BASE + '-' + n;
  const SCENES = ['shore','elysium','asphodel','tartarus','haven'];
  const stage = document.querySelector('#stage'), status = document.querySelector('#status');
  const menu = document.querySelector('#menu'), menuContent = document.querySelector('#menu-content'), popup = document.querySelector('#popup');
  let state = null, slot = 1, slots = {}, broken = {}, selected = new Set(), plan = null, storageNote = '', popupLocked = false, entered = false;
  try { entered = sessionStorage.getItem('ferryman-v05-entered') === '1'; } catch {}

  function el(tag, text, cls) { const n = document.createElement(tag); if (text !== undefined && text !== null) n.textContent = text; if (cls) n.className = cls; return n; }
  function button(text, fn, cls = '', disabled = false, key = '') { const b = el('button', text, cls); b.type = 'button'; b.disabled = disabled; b.addEventListener('click', fn); if (key) b.dataset.focus = key; return b; }
  function paragraph(parent, text, cls) { const inline = parent.dataset && parent.dataset.inline; const p = el(inline ? 'span' : 'p', text, (inline ? 'line ' : '') + (cls || '')); parent.append(p); return p; }
  function announce(text) { document.querySelector('#announcement').textContent = text; }
  function notice(text, danger = false, parent = stage) { paragraph(parent, text, 'notice' + (danger ? ' danger' : '')); }
  function heading(title, description) { const h = el('h1', title); h.tabIndex = -1; stage.append(h); if (description) paragraph(stage, description, 'intro'); }
  const place = n => n === 'shore' ? 'Starting Shore' : D.destinations[n].name;
  const scene = n => SCENES.includes(n) ? 'assets/' + n + '.png' : null;
  const memArt = id => 'assets/memory-' + F.MEM[id].kind + '.png';
  const soulText = s => s.text.replace(' This is a provisional filler soul.', '').replace(' Provisional filler soul.', '');
  const initials = name => name.split(' ').map(w => w[0]).slice(0, 2).join('');
  // Anger counts up while a soul waits; at its limit (5, or 3 for the Fool) it becomes a Wraith.
  const anger = id => { const p = F.SOUL[id].patience; return Math.max(0, Math.min(p, p - (state.deadlines[id] - state.tide))); };
  const boatLimit = id => F.SOUL[id].tainted ? C.taintedLimit : C.maxSteps;

  // Line icons drawn from Khmer motifs.
  const ICONS = {
    boat: '<path d="M2 15h20l-3.5 4.5h-13z"/><path d="M6.5 15V10q5.5-4 11 0v5"/><path d="M12 7.5V4"/>',
    lamp: '<path d="M12 2.5c2.2 2.8 2.2 5 0 7-2.2-2-2.2-4.2 0-7z"/><path d="M5.5 12h13l-2.5 4h-8z"/><path d="M10 16v3.5h4V16M8 20.5h8"/>',
    lotus: '<path d="M12 20c-2.5-2.6-2.5-8.6 0-13 2.5 4.4 2.5 10.4 0 13z"/><path d="M11 19.6C7 19 4 15.5 4 11c3.3.3 5.6 2.2 7 4.6M13 19.6c4-.6 7-4.1 7-8.6-3.3.3-5.6 2.2-7 4.6"/>',
    knot: '<circle cx="9" cy="12" r="4.5"/><circle cx="15" cy="12" r="4.5"/>',
    spears: '<path d="M4 20 18 6M20 20 6 6"/><path d="m18 6 1.5-3.5L16 4zM6 6 4.5 2.5 8 4z"/>',
    prasat: '<path d="M12 2.5 13.2 5h-2.4z"/><path d="M9.8 9h4.4l-1-4h-2.4z"/><path d="M8 14h8l-1.8-5H9.8z"/><path d="M5.5 20.5h13L16 14H8z"/><path d="M10.5 20.5v-3h3v3"/>',
    steps: '<path d="M2.5 20.5h19M5 16.5h14M8 12.5h8"/><path d="M12 12.5V5.5"/><path d="M12 5.5c-2 0-3.5 1-4.5 2.5M12 5.5c2 0 3.5 1 4.5 2.5"/>',
    naga: '<path d="M12 3c3.9 0 6.5 2.8 6.5 6.6 0 4.8-3.6 8.6-6.5 11.4-2.9-2.8-6.5-6.6-6.5-11.4C5.5 5.8 8.1 3 12 3z"/><path d="M9.5 10.5h.01M14.5 10.5h.01M12 12.5v4"/>',
    spirit: '<path d="M7 20.5V11a5 5 0 0 1 10 0v9.5l-2.5-2-2.5 2-2.5-2z"/><path d="M10 11h.01M14 11h.01"/>',
    fog: '<path d="M3 8.5h10.5a2.5 2.5 0 1 0-2.5-2.5"/><path d="M3 13h15a2.5 2.5 0 1 1-2.5 2.5"/><path d="M3 17.5h7"/>',
    wheel: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2"/><path d="M12 3.5V10M12 14v6.5M3.5 12H10M14 12h6.5M6 6l4.6 4.6M13.4 13.4 18 18M18 6l-4.6 4.6M10.6 13.4 6 18"/>',
    flower: '<circle cx="12" cy="12" r="2.2"/><path d="M12 9.8c-1.6-2-1.6-4.6 0-6.8 1.6 2.2 1.6 4.8 0 6.8zM12 14.2c1.6 2 1.6 4.6 0 6.8-1.6-2.2-1.6-4.8 0-6.8zM9.8 12c-2 1.6-4.6 1.6-6.8 0 2.2-1.6 4.8-1.6 6.8 0zM14.2 12c2-1.6 4.6-1.6 6.8 0-2.2 1.6-4.8 1.6-6.8 0z"/>',
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

  // Saves: three slots, each holding one night.
  function persist() {
    slots[slot] = state; broken[slot] = false;
    try { localStorage.setItem(slotKey(slot), F.save(state)); storageNote = ''; }
    catch { storageNote = 'This browser cannot save locally. Export JSON to keep your night.'; }
  }
  try {
    for (const n of SLOTS) { const raw = localStorage.getItem(slotKey(n)); if (raw) { try { slots[n] = F.load(raw); } catch { broken[n] = true; } } }
  } catch { storageNote = 'Local saving is unavailable. Export JSON to keep your night.'; }
  function newSeed() { return crypto.getRandomValues(new Uint32Array(1))[0]; }
  function begin(n = slot, seed = newSeed()) {
    if (slots[n] && !window.confirm('Start a new night in Save ' + n + '? This replaces that save. Export it first if you want to keep it.')) return false;
    slot = n; state = F.create(seed); selected = new Set(); plan = null; persist(); render(); return true;
  }
  function erase(n) {
    if (!window.confirm('Erase Save ' + n + '? This cannot be undone. Export it first if you want to keep it.')) return;
    try { localStorage.removeItem(slotKey(n)); } catch {}
    slots[n] = null; broken[n] = false; render();
  }

  // Every rule change goes through the engine; new journal lines become the popup that follows a move.
  function send(action, focusKey) {
    const before = state;
    let next; try { next = F.transition(state, action); } catch (e) { announce(e.message); notice(e.message, true); return; }
    state = next; plan = null; if (action.type !== 'BOARD' && action.type !== 'UNBOARD') selected = new Set();
    persist(); render(focusKey);
    const lines = state.log.slice(before.log.length).map(x => x.text);
    if (action.type === 'CROSS') showArrival(lines);
    else if (action.type === 'PASSAGE' || (action.type === 'DELIVER' && lines.length > 1)) showNote(action.type === 'PASSAGE' ? 'Passage granted' : 'Delivered', lines);
  }

  function summary() {
    status.replaceChildren();
    if (!state) { status.hidden = true; return; }
    status.hidden = false;
    for (const [label, value] of [['Light', state.light + ' / ' + C.maxLight], ['Wishes', state.wishes + ' / ' + C.targetWishes], ['Trip', state.trip + ' / ' + C.trips], ['Boat', F.seats(state) + ' / ' + F.capacity(state) + ' seats'], ['At', place(state.node)]]) {
      const item = el('span', label + ' '); item.append(el('strong', String(value))); status.append(item);
    }
  }
  function flow() {
    const current = state.phase === 'route' ? (plan ? 'memory' : 'route') : state.phase === 'trim' ? 'delivery' : state.phase;
    const nav = el('div', null, 'flow'); nav.setAttribute('aria-label', 'Night steps');
    for (const [key, label] of [['boarding','Passengers'],['route','Route'],['memory','Memory'],['review','Review'],['delivery','Delivery']]) {
      const s = el('span', label, key === current ? 'active' : ''); if (key === current) s.setAttribute('aria-current', 'step'); nav.append(s);
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
    else if (o.blankScene) { const s = el('span', null, 'scene-none'); s.setAttribute('aria-hidden', 'true'); b.append(s); }
    if (o.badge && o.pressed) { const bd = el('span', null, 'badge'); bd.append(ico('check'), el('span', o.badge)); b.append(bd); }
    const body = el('span', null, 'card-body'); body.dataset.inline = '1'; body.id = 'choice-' + (++cardCount);
    b.setAttribute('aria-describedby', body.id); b.append(body);
    return { b, body };
  }
  function fact(list, text, cls = '') { const row = el('span', null, 'fact' + (cls ? ' ' + cls : '')), ic = ico('bud'); ic.classList.add('ic'); row.append(ic, el('span', text)); list.append(row); return row; }
  function counterpart(id) {
    const other = { S01: 'S02', S02: 'S01', S03: 'S04', S04: 'S03' }[id]; if (!other) return '';
    const where = state.boat.includes(other) ? 'aboard' : state.shore.includes(other) ? 'waiting' : state.wraiths.includes(other) ? 'a Wraith' : state.delivered.some(x => x.id === other) ? 'delivered' : 'not yet arrived';
    return F.SOUL[other].name + ': ' + where + '.';
  }
  function soulCard(id, mode) {
    const s = F.SOUL[id], aboard = state.boat.includes(id), delivery = mode === 'delivery', waiting = state.shore.includes(id);
    const chosen = delivery ? selected.has(id) : aboard;
    const full = mode === 'boarding' && !aboard && F.seats(state) + s.seats > F.capacity(state);
    const label = delivery ? (chosen ? 'Keep aboard: ' : 'Select: ') + s.name : mode === 'boarding' ? (aboard ? 'Leave ' + s.name + ' ashore' : 'Board ' + s.name) : s.name;
    const pick = delivery ? () => { if (chosen) selected.delete(id); else selected.add(id); render(id); }
      : mode === 'boarding' ? () => send({ type: aboard ? 'UNBOARD' : 'BOARD', id }, id) : null;
    const { b, body } = choiceCard({ art: s.art ? 'assets/' + s.art : null, sigil: s.art ? null : initials(s.name), label, pressed: mode === 'view' ? undefined : chosen, disabled: full, focusKey: id, badge: delivery ? 'Disembarks' : 'Aboard', onPick: pick });
    paragraph(body, id + ' · ' + s.seats + (s.seats === 1 ? ' seat' : ' seats'), 'tag'); if (s.tainted) paragraph(body, 'Tainted', 'tag tainted');
    paragraph(body, s.name, 'title');
    const list = el('span', null, 'facts'); body.append(list);
    if (delivery) fact(list, F.matches(state, id) ? 'Wish is here: counts as a wish' : 'Wishes for ' + place(s.wish) + ': no reward here', 'wish');
    else fact(list, 'Wishes for ' + place(s.wish), 'wish');
    fact(list, soulText(s), /^(Drain|Rivals|Waiting|Leaves|Occupies)/.test(s.text) ? 'ability' : 'flavor');
    const cp = counterpart(id); if (cp) fact(list, cp, id === 'S03' || id === 'S04' ? 'clash' : '');
    fact(list, s.memory ? 'Memory: ' + F.MEM[s.memory].name : 'Leaves no memory');
    if (waiting) { const a = anger(id), soon = state.deadlines[id] <= state.tide + 1; fact(list, 'Anger ' + a + ' / ' + s.patience + (soon ? ': becomes a Wraith after the next move' : ''), 'deadline' + (soon ? ' urgent' : '')); }
    else if (aboard) { const last = state.step + 1 >= boatLimit(id); fact(list, 'Deliver by boat move ' + boatLimit(id) + (last ? ': last chance' : ''), 'deadline' + (last ? ' urgent' : '')); }
    if (full) paragraph(body, 'Needs ' + s.seats + ' free seats.', 'warning');
    return b;
  }
  function routeInfo(id) { return id === 'return' ? { name: 'Return to Shore', to: 'shore', fog: 0, text: 'Boat must be empty. Survive the return, then begin the next trip.' } : F.ROUTE[id]; }
  function routeCard(id, clickable) {
    const r = routeInfo(id), dest = r.to === 'shore' ? null : D.destinations[r.to];
    let p = null; try { p = F.preview(state, id); } catch {}
    const { b, body } = choiceCard({ art: scene(r.to), blankScene: !scene(r.to), dest: dest ? dest.color : '#678782', cls: 'route-card', label: (clickable ? 'Travel to ' : 'Route: ') + place(r.to) + ' by ' + r.name, data: clickable ? { route: id } : {}, onPick: clickable ? () => chooseRoute(id) : null, disabled: clickable && !p });
    paragraph(body, r.name, 'tag'); paragraph(body, place(r.to), 'title'); paragraph(body, r.text, 'key');
    if (clickable && p) paragraph(body, p.cost + ' light' + (p.drain ? ' (incl. Killer drain)' : '') + ' · ' + (p.lethal ? 'exceeds your light' : Math.max(0, p.remaining) + ' light left'), 'fog-brief' + (p.lethal ? ' warning' : ''));
    else paragraph(body, 'Base fog ' + r.fog, 'fog-brief');
    if (!clickable) b.tabIndex = -1;
    return b;
  }
  function backLink(label, fn) { const row = el('div', null, 'back-row'); row.append(button(label, fn, 'text-button')); stage.append(row); }
  function toolbar(backFn, mainLabel, mainFn, disabled = false, chip = '') {
    const bar = el('div', null, 'toolbar'); if (chip) bar.append(el('span', chip, 'chip'));
    const actions = el('div', null, 'actions'); if (backFn) actions.append(button('Back', backFn));
    actions.append(button(mainLabel, mainFn, 'primary', disabled)); bar.append(actions); stage.append(bar);
  }
  function eventNote() { if (state.event) notice(F.EVENT[state.event].name + ': ' + F.EVENT[state.event].text, false); }

  function renderBoarding() {
    heading('Who will you carry?', 'Tap a soul to bring them aboard. Up to ' + F.capacity(state) + ' seats. You can change your mind until you confirm departure. Waiting souls grow angry with every move; at their limit they become Wraiths.');
    eventNote();
    passageNote();
    const grid = el('div', null, 'grid soul-grid');
    [...state.shore, ...state.boat].sort().forEach(id => grid.append(soulCard(id, 'boarding'))); stage.append(grid);
    toolbar(null, 'Choose a route', () => send({ type: 'DEPART' }), !state.boat.length, F.seats(state) + ' / ' + F.capacity(state) + ' seats filled');
    const offers = el('section', null, 'offers'); offers.append(el('h2', 'Routes this trip'));
    paragraph(offers, 'The river offers these two paths after you depart. Read them before you choose passengers.', 'hint');
    const og = el('div', null, 'grid'); for (const id of state.offers) og.append(routeCard(id, false)); offers.append(og); stage.append(offers);
  }
  function passageNote() {
    if (state.quest !== 'ready' || !state.shore.length) return;
    const box = el('div', null, 'notice'); paragraph(box, 'Passage is ready: send one waiting soul straight to their wish for 1 wish. No light or memory.'); box.append(button('Use Passage', choosePassage, 'text-button')); stage.append(box);
  }
  function choosePassage() {
    openPopup({ title: 'Send a soul by Passage?', lines: ['The soul goes straight to their wish: 1 wish, no light and no memory. This uses the Passage.'], wide: true, build: pop => {
      const grid = el('div', null, 'grid soul-grid');
      for (const id of state.shore) { const s = F.SOUL[id], { b, body } = choiceCard({ art: s.art ? 'assets/' + s.art : null, sigil: s.art ? null : initials(s.name), label: 'Send ' + s.name, data: { passage: id }, onPick: () => { closePopup(); send({ type: 'PASSAGE', id }); } }); paragraph(body, s.name, 'title'); paragraph(body, 'To ' + place(s.wish), 'key'); grid.append(b); }
      pop.append(grid); const actions = el('div', null, 'actions'); actions.append(button('Cancel', closePopup, 'text-button')); pop.append(actions);
    } });
  }
  function chooseRoute(id) {
    if (!state.hand.length) { send({ type: 'PLAN', route: id, memory: null, target: null }); return; }
    plan = { route: id }; render();
  }
  function renderRoute() {
    if (plan) return renderMemory();
    const empty = !state.boat.length;
    heading(empty ? 'Time to return' : 'Where next?', empty ? 'The boat is empty. Return to the Starting Shore. Every move, including the return, makes waiting souls angrier.' : 'Tap a destination. Totals include night pressure, Wraiths and passengers, before a memory.');
    eventNote(); passageNote();
    const grid = el('div', null, 'grid'); for (const id of F.routes(state)) grid.append(routeCard(id, true)); stage.append(grid);
    if (state.node === 'shore' && state.step === 0) backLink('Back to passengers', () => send({ type: 'REBOARD' }));
  }
  function renderMemory() {
    const r = routeInfo(plan.route);
    heading('What will you remember?', 'Tap one card, or keep your memories. Nothing is spent until you confirm the crossing to ' + place(r.to) + '.');
    const grid = el('div', null, 'grid');
    const keep = choiceCard({ label: 'Use no memory', data: { memory: 'none' }, onPick: () => send({ type: 'PLAN', route: plan.route, memory: null, target: null }) });
    paragraph(keep.body, 'Keep your memories', 'title'); paragraph(keep.body, 'Save every card for a later move.', 'key'); brief(keep.body, null); grid.append(keep.b);
    for (const id of state.hand) {
      const m = F.MEM[id], calm = m.kind === 'calm';
      const { b, body } = choiceCard({ art: memArt(id), label: 'Choose ' + m.name + ' ' + id, data: { memory: id }, onPick: () => { if (calm) pickTarget(id); else send({ type: 'PLAN', route: plan.route, memory: id, target: null }); }, disabled: calm && !state.shore.length });
      paragraph(body, m.name, 'title'); paragraph(body, m.text, 'key');
      if (calm) paragraph(body, state.shore.length ? 'Next: choose a waiting soul.' : 'No soul is waiting.', 'hint');
      brief(body, calm ? null : id); grid.append(b);
    }
    stage.append(grid); backLink('Back', () => { plan = null; render(); });
  }
  function brief(parent, memory) {
    let p; try { p = F.preview(state, plan.route, memory); } catch { return; }
    paragraph(parent, p.cost + ' light · ' + (p.lethal ? 'exceeds your light' : Math.max(0, p.remaining) + ' light left'), 'fog-brief' + (p.lethal ? ' warning' : ''));
  }
  function pickTarget(memory) {
    const m = F.MEM[memory];
    openPopup({ title: 'Calm a waiting soul', lines: [m.name + ': ' + m.text], wide: true, build: pop => {
      const grid = el('div', null, 'grid soul-grid');
      for (const id of state.shore) { const s = F.SOUL[id], { b, body } = choiceCard({ art: s.art ? 'assets/' + s.art : null, sigil: s.art ? null : initials(s.name), label: 'Calm ' + s.name, data: { target: id }, onPick: () => { closePopup(); send({ type: 'PLAN', route: plan.route, memory, target: id }); } }); paragraph(body, s.name, 'title'); paragraph(body, 'Anger ' + anger(id) + ' / ' + s.patience, 'anger'); grid.append(b); }
      pop.append(grid); const actions = el('div', null, 'actions'); actions.append(button('Cancel', closePopup, 'text-button')); pop.append(actions);
    } });
  }
  function renderReview() {
    const p = state.pending;
    heading('One crossing at a time', 'Review your choice. Back lets you change it without spending a memory.');
    const box = el('div', null, 'review'); box.append(el('h2', place(state.node) + ' → ' + place(p.to)));
    paragraph(box, p.name, 'hint');
    paragraph(box, p.cost + ' light · ' + (p.lethal ? 'exceeds your light' : Math.max(0, p.remaining) + ' light left'), 'numbers' + (p.lethal ? ' warning' : ''));
    paragraph(box, 'Base ' + p.base + ' + night pressure ' + p.pressure + ' + Wraiths ' + p.wraiths + ' + rivals ' + p.rivals + ' + event ' + p.event + ' − memory ' + p.shield + ' = ' + p.fog + ' fog. Killer drain ' + p.drain + '. Light available ' + p.available + '.', 'hint');
    if (p.memory) { const img = el('img', null, 'result-art'); img.src = memArt(p.memory); img.alt = ''; box.append(img); paragraph(box, 'Memory: ' + F.MEM[p.memory].name + (p.target ? ', calming ' + F.SOUL[p.target].name : '') + '.'); }
    else paragraph(box, 'Memory: none.');
    if (p.waitingDue.length) notice('After this move these waiting souls reach their limit and become Wraiths: ' + p.waitingDue.map(x => F.SOUL[x].name).join(', ') + '.', true, box);
    if (p.lastChance.length) notice('Last delivery chance: ' + p.lastChance.map(x => F.SOUL[x].name).join(', ') + '.' + (p.to === 'haven' ? ' Haven allows no delivery, so they will become Ship Wraiths.' : ''), true, box);
    if (p.lethal) notice('This crossing ends the night before arrival. No delivery or Haven recovery can save it.', true, box);
    stage.append(box);
    toolbar(() => send({ type: 'BACK' }), p.lethal ? 'Accept failure and cross' : 'Confirm crossing', () => send({ type: 'CROSS', acceptFailure: p.lethal }));
  }
  function renderDelivery() {
    heading('Who disembarks here?', 'Tap each soul leaving the boat at ' + place(state.node) + '. ' + (state.node === 'sanctuary' ? 'Every wish matches here, but no light or memories are earned.' : 'Matched wishes earn their memory and 1 light total for this landing. Unmatched delivery earns nothing.'));
    const grid = el('div', null, 'grid soul-grid'); state.boat.forEach(id => grid.append(soulCard(id, 'delivery'))); stage.append(grid);
    const ids = [...selected];
    if (ids.length) { const ul = el('ul', null, 'delivery-preview'); for (const id of ids) { const s = F.SOUL[id], m = F.matches(state, id); ul.append(el('li', s.name + ': ' + (m ? 'wish met' + (s.memory && state.node !== 'sanctuary' ? ' + memory ' + F.MEM[s.memory].name : '') : 'wish differs, no reward') + '.')); } stage.append(ul); }
    const matches = state.boat.filter(id => F.matches(state, id));
    if (matches.length) backLink('Select matching wishes', () => { selected = new Set(matches); render(); });
    toolbar(null, ids.length ? 'Deliver ' + ids.length + ' passenger' + (ids.length === 1 ? '' : 's') : 'Keep everyone aboard', () => send({ type: 'DELIVER', ids }));
    paragraph(stage, 'After confirming, overdue passengers become Ship Wraiths. A delivery cannot be undone.', 'hint center');
  }
  function renderTrim() {
    heading('Keep up to ' + C.handLimit + ' memories', 'You hold ' + state.hand.length + '. Tap a memory to let it go for good before the next move.');
    const grid = el('div', null, 'grid');
    for (const id of state.hand) { const m = F.MEM[id], { b, body } = choiceCard({ art: memArt(id), label: 'Discard ' + m.name, data: { discard: id }, onPick: () => send({ type: 'DISCARD', id }) }); paragraph(body, m.name, 'title'); paragraph(body, m.text, 'key'); paragraph(body, 'Tap to discard', 'hint'); grid.append(b); }
    stage.append(grid);
  }
  function renderEnded() {
    const won = state.ending.won, hero = el('div', null, 'ending'); hero.append(boat(won ? 'docked' : 'docked dark'));
    paragraph(hero, (won ? 'Dawn breaks' : 'Journey’s end') + ' · trip ' + state.trip, 'eyebrow'); stage.append(hero);
    heading(won ? 'A passage well kept' : 'The river remembers', state.ending.reason);
    const stats = el('dl', null, 'end-stats five'), matched = state.delivered.filter(x => x.matched).length;
    for (const [n, label, sub] of [[state.wishes, 'Wishes', 'goal ' + C.targetWishes], [state.delivered.length, 'Souls delivered', matched + ' wishes matched'], [state.completed, 'Trips completed', 'of ' + C.trips], [state.wraiths.length, 'Wraiths'], [state.light, 'Light left']]) {
      const tile = el('div', null, 'end-stat'); tile.append(el('dd', String(n)), el('dt', label)); if (sub) tile.append(el('span', sub, 'end-sub')); stats.append(tile);
    }
    stage.append(stats);
    const cols = el('div', null, 'end-cols'), souls = el('section', null, 'end-panel'); souls.append(el('h2', 'Souls you carried'));
    if (state.delivered.length) { const list = el('ul', null, 'minis'); for (const d of state.delivered) list.append(mini(d.id, F.SOUL[d.id].name + ' delivered to ' + place(d.to) + (d.matched ? ', wish matched.' : '.'), [tagx(place(d.to), '', 'lotus'), ...(d.matched ? [tagx('Wish matched', 'safe', 'check')] : [])])); souls.append(list); }
    else paragraph(souls, 'No soul reached the far shore this night.', 'hint');
    const mems = el('section', null, 'end-panel'); mems.append(el('h2', 'Memories kept'));
    const kept = [...state.hand, ...state.spent];
    if (kept.length) { const g = el('ul', null, 'end-mems'); for (const id of kept) { const li = el('li'); const img = el('img'); img.src = memArt(id); img.alt = ''; li.append(img, el('span', F.MEM[id].name)); g.append(li); } mems.append(g); }
    else paragraph(mems, 'Matched deliveries leave memories. None were earned this night.', 'hint');
    cols.append(souls, mems); stage.append(cols);
    const go = el('div', null, 'end-go'); go.append(button('Start a new night', () => begin(slot), 'primary')); stage.append(go);
  }

  // Trip panel: portraits and icons for the boat, the waiting shore and the Wraiths.
  function pips(value, max, soon) { const s = el('span', null, 'pips'); s.setAttribute('aria-hidden', 'true'); for (let i = 1; i <= max; i++) s.append(el('i', null, i <= value ? (soon && i === value ? 'new' : 'on') : '')); return s; }
  function mini(id, said, icons, cls = '') {
    const s = F.SOUL[id], row = el('li', null, 'mini' + (cls ? ' ' + cls : '')); row.dataset.soul = id;
    if (s.art) { const img = el('img'); img.src = 'assets/' + s.art; img.alt = ''; row.append(img); } else { const sg = el('span', initials(s.name), 'mini-sigil'); sg.setAttribute('aria-hidden', 'true'); row.append(sg); }
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
    const box = el('section', null, 'trip'); box.setAttribute('aria-label', 'Night information');
    const head = el('div', null, 'trip-head'); head.append(el('h2', 'This night'));
    const stops = el('div', null, 'stops');
    for (const t of [['Boat move ' + state.step + ' / ' + C.maxSteps, false], ['Night pressure +' + F.pressure(state), F.pressure(state) > 0], ['Passage ' + (state.quest === 'locked' ? 'locked' : state.quest === 'ready' ? 'ready' : 'used'), state.quest === 'ready']]) stops.append(el('span', t[0], 'stop' + (t[1] ? ' done' : '')));
    head.append(stops); box.append(head);
    iconLine(box, [['fog', 'Trips 1–2 add no pressure; trips 3–4 add 1 fog. Events appear on trips 2 and 4. ' + state.arrivals.length + ' arrival tickets remain.']], 'trip-note');
    const cols = el('div', null, 'trip-cols');
    const onBoat = tripColumn('boat', 'On the boat', F.seats(state) + '/' + F.capacity(state), state.boat.length ? '' : 'Empty.');
    for (const id of state.boat) { const s = F.SOUL[id], last = state.step + 1 >= boatLimit(id); const icons = [tagx(place(s.wish), '', 'lotus'), tagx('By move ' + boatLimit(id), last ? 'bad' : '', 'boat')]; if (s.tainted) icons.push(tagx('Tainted', 'bad tainted')); onBoat.list.append(mini(id, s.name + ': wishes for ' + place(s.wish) + ', deliver by boat move ' + boatLimit(id) + '.', icons, last ? 'doomed' : '')); }
    cols.append(onBoat.col);
    const shore = tripColumn('steps', 'Waiting on shore', state.shore.length, state.shore.length ? '' : 'No one is waiting.');
    for (const id of state.shore) { const s = F.SOUL[id], a = anger(id), soon = state.deadlines[id] <= state.tide + 1; shore.list.append(mini(id, s.name + ': anger ' + a + ' of ' + s.patience + (soon ? ', becomes a Wraith after the next move' : '') + '.', [pips(a, s.patience, soon), el('span', 'Anger ' + a + '/' + s.patience, 'anger-change')], soon ? 'doomed' : '')); }
    cols.append(shore.col);
    const wraiths = tripColumn('spirit', 'Wraiths', state.wraiths.length, state.wraiths.length ? '' : 'None. The fog is calm.');
    for (const id of state.wraiths) wraiths.list.append(mini(id, F.SOUL[id].name + ' is a Wraith and adds 1 fog to every move.', [tagx('+1 fog', 'bad', 'fog')], 'wraith'));
    cols.append(wraiths.col); box.append(cols);
    const hand = el('div', null, 'hand'); hand.append(el('strong', 'Memories ' + state.hand.length + ' / ' + C.handLimit));
    for (const id of state.hand) hand.append(tagx(F.MEM[id].name, '', 'flower')); box.append(hand);
    const j = el('details', null, 'journal'); j.append(el('summary', 'River journal')); const ol = el('ol');
    for (const x of state.log.slice().reverse()) { const li = el('li'); li.append(el('span', 'Trip ' + x.trip + ' · anger ' + x.tide), document.createTextNode(x.text)); ol.append(li); }
    j.append(ol); box.append(j); stage.append(box);
  }

  // Popups after a move: the new scene and what happened.
  function showArrival(lines) {
    const ended = state.phase === 'ended', n = state.node;
    const title = ended ? (state.ending.won ? 'Dawn breaks' : 'The night is over') : n === 'shore' ? 'Welcome back to the Starting Shore' : n === 'haven' ? 'A quiet landing' : 'Welcome to ' + place(n);
    openPopup({ art: scene(ended && !state.ending.won ? 'shore' : n), eyebrow: ended ? '' : 'You made it across', title, lines, locked: true, build: pop => { const actions = el('div', null, 'actions'); actions.append(button('Continue', closePopup, 'primary')); pop.append(actions); } });
  }
  function showNote(title, lines) { openPopup({ title, lines, build: pop => { const actions = el('div', null, 'actions'); actions.append(button('Continue', closePopup, 'primary')); pop.append(actions); } }); }
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
    text.append(h); paragraph(text, 'One night. Four trips. One final dawn.', 'splash-sub');
    const river = el('div', null, 'river'); river.append(boat('arriving'));
    const go = el('div', null, 'splash-go'), enter = button('Enter', () => {
      enter.disabled = true; sp.classList.add('sailing');
      const done = () => { entered = true; try { sessionStorage.setItem('ferryman-v05-entered', '1'); } catch {} render('slot1'); };
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) done(); else setTimeout(done, 1500);
    }, 'primary enter', false, 'enter');
    go.append(enter); sp.append(text, river, go); stage.append(sp);
  }
  function renderTitle() {
    const hero = el('div', null, 'hero'); hero.append(boat('docked')); hero.append(el('h1', 'Welcome to The Ferryman'));
    paragraph(hero, 'You are the ferryman for one night. Carry souls to their wishes, keep the lantern alive and survive the final return at dawn. Fulfil ' + C.targetWishes + ' wishes in ' + C.trips + ' trips.', 'intro');
    iconLine(hero, [['boat', C.seats + ' seats'], ['lamp', 'One lantern'], ['lotus', C.targetWishes + ' wishes'], ['wheel', C.trips + ' trips']]); stage.append(hero);
    stage.append(el('h2', 'Choose a save', 'slots-title'));
    const grid = el('div', null, 'grid slot-grid');
    for (const n of SLOTS) {
      const s = slots[n], cell = el('div', null, 'slot');
      if (broken[n]) { const { b, body } = choiceCard({ label: 'Save ' + n + ': unreadable', disabled: true }); paragraph(body, 'Save ' + n, 'title'); paragraph(body, 'This save could not be read.', 'warning'); cell.append(b); }
      else if (s) {
        const { b, body } = choiceCard({ art: s.phase === 'ended' ? 'assets/wraith.png' : scene(s.node) || 'assets/shore.png', label: s.phase === 'ended' ? 'Save ' + n + ': view ended night' : 'Save ' + n + ': continue trip ' + s.trip, focusKey: 'slot' + n, onPick: () => { slot = n; state = s; selected = new Set(); plan = null; render(); } });
        paragraph(body, 'Save ' + n, 'title'); paragraph(body, s.phase === 'ended' ? (s.ending.won ? 'Dawn reached' : 'Night ended') : 'Continue', 'key');
        iconLine(body, [['wheel', 'Trip ' + s.trip + ' / ' + C.trips], ['lotus', s.wishes + ' / ' + C.targetWishes + ' wishes']], 'line');
        iconLine(body, [['lamp', 'Light ' + s.light + '/' + C.maxLight], ['boat', s.boat.length + ' aboard'], ['flower', s.delivered.length + ' delivered']], 'line');
        cell.append(b);
      } else {
        const { b, body } = choiceCard({ label: 'Save ' + n + ': begin the night', focusKey: 'slot' + n, onPick: () => begin(n) }); b.classList.add('empty-slot');
        paragraph(body, 'Save ' + n, 'title'); iconLine(body, [['plus', 'New night']], 'key'); paragraph(body, 'Empty slot. Start fresh at the shore.'); cell.append(b);
      }
      if (s || broken[n]) { const row = el('div', null, 'slot-actions'); if (s) row.append(button('New night', () => begin(n), 'text-button')); row.append(button('Erase', () => erase(n), 'text-button')); cell.append(row); }
      grid.append(cell);
    }
    stage.append(grid);
  }

  const PAGES = { boarding: renderBoarding, route: renderRoute, review: renderReview, delivery: renderDelivery, trim: renderTrim, ended: renderEnded };
  function render(focusKey) {
    if (!popupLocked) closePopup();
    stage.replaceChildren(); summary();
    document.querySelector('.world').style.backgroundImage = 'url("' + (scene(state ? state.node : 'shore') || 'assets/shore.png') + '")';
    if (storageNote) notice(storageNote, true);
    document.body.classList.toggle('splash-on', !state && !entered);
    if (!state) { if (entered) renderTitle(); else renderSplash(); }
    else { if (state.phase !== 'ended') flow(); PAGES[state.phase](); if (state.phase !== 'ended') tactics(); }
    const key = focusKey || (!state && !entered ? 'enter' : '');
    const target = key && [...stage.querySelectorAll('[data-focus]')].find(n => n.dataset.focus === key);
    if (target) target.focus(); else { stage.focus(); window.scrollTo(0, 0); }
    announce(state ? place(state.node) + '. ' + state.phase + ' step. Light ' + state.light + '.' : 'Choose a new night or resume.');
  }

  function exportSave() {
    const current = state || slots[slot]; if (!current) return;
    const url = URL.createObjectURL(new Blob([F.save(current)], { type: 'application/json' }));
    const a = el('a'); a.href = url; a.download = 'ferryman-v05-' + current.seed + '.json'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  let message;
  function importSave(text) {
    let next; try { next = F.load(text); } catch (e) { message.textContent = 'Import rejected: ' + e.message + ' Your current night is unchanged.'; return; }
    if ((state || slots[slot]) && !window.confirm('Replace Save ' + slot + ' with this v0.5 save?')) return;
    state = next; selected = new Set(); plan = null; persist(); menu.close(); render();
  }
  function openMenu() {
    menuContent.replaceChildren();
    for (const g of D.guide) { menuContent.append(el('h3', g.title)); paragraph(menuContent, g.text); }
    const links = el('p');
    for (const [href, label] of [['print/Player_Guide_v0.5.pdf', 'Player guide (PDF)'], ['print/Print_and_Play_v0.5.pdf', 'Print kit (PDF)'], ['RULES.md', 'Full rules'], ['DESIGN_DECISIONS.md', 'Design changes'], ['VALIDATION.md', 'Checks and limits']]) { const a = el('a', label); a.href = href; a.target = '_blank'; a.rel = 'noopener'; links.append(a, document.createTextNode(' · ')); }
    menuContent.append(links);
    paragraph(menuContent, storageNote || 'Progress saves automatically in this browser after every move. Export before moving or clearing files.', 'hint');
    const seedLabel = el('label', 'River seed for a new night (optional, 0 to 4294967295)'); seedLabel.htmlFor = 'seed';
    const seed = el('input'); seed.id = 'seed'; seed.type = 'number'; seed.min = '0'; seed.max = '4294967295'; seed.step = '1'; seed.placeholder = 'Random night';
    const row = el('div', null, 'seed-row'); row.append(seed); menuContent.append(seedLabel, row);
    const actions = el('div', null, 'menu-actions');
    actions.append(button('Export JSON', exportSave, '', !(state || slots[slot])),
      button('New night', () => { const raw = seed.value; const n = raw === '' ? newSeed() : Number(raw); if (!Number.isInteger(n) || n < 0 || n > 4294967295) { message.textContent = 'Seed must be a whole number from 0 to 4294967295.'; return; } if (begin(slot, n)) menu.close(); }, '', false, 'new-night'),
      button('Save slots', () => { state = null; menu.close(); render(); }, '', !state));
    menuContent.append(actions);
    const label = el('label', 'Import a v0.5 JSON file'); label.htmlFor = 'import-file';
    const input = el('input'); input.type = 'file'; input.accept = '.json,application/json'; input.id = 'import-file';
    input.addEventListener('change', async () => { const file = input.files[0]; if (!file) return; if (file.size > 200000) { message.textContent = 'Import rejected: choose a v0.5 save smaller than 200 KB. Current night unchanged.'; return; } try { importSave(await file.text()); } catch { message.textContent = 'Could not read that file. Current night unchanged.'; } });
    menuContent.append(label, input);
    message = el('p'); message.setAttribute('role', 'status'); menuContent.append(message);
    if (!menu.open) menu.showModal();
  }
  // Home returns to the intro; progress is already saved after every move.
  document.querySelector('.brand').addEventListener('click', e => { e.preventDefault(); if (menu.open) menu.close(); state = null; selected = new Set(); plan = null; entered = false; render(); });
  document.querySelector('#menu-button').addEventListener('click', openMenu);
  document.querySelector('#close-menu').addEventListener('click', () => menu.close());
  menu.addEventListener('close', () => document.querySelector('#menu-button').focus());
  popup.addEventListener('cancel', e => { if (popupLocked) e.preventDefault(); });
  popup.addEventListener('close', () => { if (popupLocked) popup.showModal(); });
  render();
})();
