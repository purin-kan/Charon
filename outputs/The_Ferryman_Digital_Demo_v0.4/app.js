/* Local, dependency-free interface. All gameplay transitions belong to engine.js. */
(() => {
  'use strict';
  const E = window.Ferryman;
  // Save 1 keeps the original key so earlier v0.4 saves appear there.
  const SLOTS = [1,2,3], slotKey = n => n === 1 ? 'ferryman-v0.4-run' : 'ferryman-v0.4-run-' + n, KNOWLEDGE = 'ferryman-v0.4-discoveries';
  const stage = document.querySelector('#stage'), status = document.querySelector('#status');
  const menu = document.querySelector('#menu'), menuContent = document.querySelector('#menu-content'), popup = document.querySelector('#popup');
  let state = null, saved = null, slot = 1, slots = {}, broken = {}, behind = null, selected = new Set(), storageNote = '', discovered = false, popupLocked = false;
  function el(tag, text, cls) {
    const n = document.createElement(tag);
    if (text !== undefined && text !== null) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  }
  function button(text, fn, cls = '', disabled = false, key = '') {
    const b = el('button', text, cls); b.type = 'button'; b.disabled = disabled;
    b.addEventListener('click', fn); if (key) b.dataset.focus = key; return b;
  }
  function paragraph(parent, text, cls) { const inline = parent.dataset && parent.dataset.inline; const p = el(inline ? 'span' : 'p', text, (inline ? 'line ' : '') + (cls || '')); parent.append(p); return p; }
  function announce(text) { document.querySelector('#announcement').textContent = text; }
  function notice(text, danger = false, parent = stage) { paragraph(parent, text, 'notice' + (danger ? ' danger' : '')); }
  function memoryArt(type) { return 'assets/memory-' + type + '.png'; }
  function art(name) { return 'assets/' + (name === 'wraith' ? 'wraith-r2' : name + '-r2') + '.png'; }
  function image(parent, src) { const img = el('img'); img.src = src; img.alt = ''; parent.append(img); }
  function heading(title, description) {
    const h = el('h1', title); h.tabIndex = -1; stage.append(h);
    if (description) paragraph(stage, description, 'intro');
  }
  function persist(newDiscovery = false) {
    saved = slots[slot] = state; broken[slot] = false;
    try {
      localStorage.setItem(slotKey(slot), E.serialize(state));
      if (newDiscovery && state.events.includes('farewell')) { discovered = true; localStorage.setItem(KNOWLEDGE, 'farewell'); }
      storageNote = '';
    } catch { storageNote = 'This browser cannot save locally. Export JSON to keep your journey.'; }
  }
  try {
    for (const n of SLOTS) {
      const raw = localStorage.getItem(slotKey(n));
      if (raw) { const r = E.deserialize(raw); if (r.ok) slots[n] = r.state; else broken[n] = true; }
    }
    saved = slots[slot] || null;
    discovered = localStorage.getItem(KNOWLEDGE) === 'farewell';
  } catch { storageNote = 'Local saving is unavailable. Export JSON to keep your journey.'; }
  function send(action, focusKey) {
    const r = E.dispatch(state, action);
    if (!r.ok) { announce(r.error); notice(r.error, true); return; }
    const newDiscovery = r.state.events.length > state.events.length;
    behind = r.state.phase === 'result' ? state : null; state = r.state;
    if (state.phase === 'delivery' && action.type === 'CONTINUE') selected = new Set();
    persist(newDiscovery); render(focusKey);
  }
  function useSlot(n) { slot = n; saved = slots[n] || null; }
  function erase(n) {
    if (!window.confirm('Erase Save ' + n + '? This cannot be undone. Export it first if you want to keep it.')) return;
    try { localStorage.removeItem(slotKey(n)); } catch {}
    slots[n] = null; broken[n] = false; if (slot === n) saved = null; render();
  }
  function begin(n = slot) {
    if (slots[n] && !window.confirm('Start a new journey in Save ' + n + '? This replaces that save. Export it first if you want to keep it.')) return;
    useSlot(n);
    state = E.createGame(crypto.getRandomValues(new Uint32Array(1))[0]); behind = null; selected = new Set(); persist(); render();
  }
  function summary() {
    status.replaceChildren();
    if (!state) { status.hidden = true; return; }
    status.hidden = false;
    for (const [label, value] of [['Light', state.light + ' / 6'], ['Boat', E.seats(state) + ' / 4 seats'], ['Cycle', state.cycle], ['At', E.NODES[state.node]]]) {
      const item = el('span', label + ' '); item.append(el('strong', value)); status.append(item);
    }
  }
  function flow() {
    const nav = el('div', null, 'flow'); nav.setAttribute('aria-label', 'Journey steps');
    for (const [key, label] of [['boarding','Passengers'],['route','Route'],['memory','Memory'],['review','Review'],['delivery','Delivery']]) {
      const s = el('span', label, key === state.phase ? 'active' : '');
      if (key === state.phase) s.setAttribute('aria-current','step'); nav.append(s);
    }
    stage.append(nav);
  }
  function breakdown(v, parent) {
    paragraph(parent, 'Base ' + v.base + ' + cycle ' + v.escalation + ' + wraiths ' + v.wraiths + ' + conflict ' + v.conflict + ' − passengers ' + v.passenger + ' − memory ' + v.memory + '. Minimum 0.', 'hint');
  }
  function fog(parent, to, mid = null) {
    const v = E.preview(state, to, mid);
    paragraph(parent, v.damage + ' fog · ' + (v.lethal ? 'exceeds your light' : v.after + ' light left'), 'numbers' + (v.lethal ? ' warning' : ''));
    breakdown(v, parent); return v;
  }
  // Route and memory cards show only the short outcome; the full breakdown stays on the review page.
  function fogBrief(parent, to, mid = null) {
    const v = E.preview(state, to, mid);
    paragraph(parent, v.damage + ' fog · ' + (v.lethal ? 'exceeds your light' : v.after + ' light left'), 'fog-brief' + (v.lethal ? ' warning' : ''));
  }
  function lastDestination(to) {
    return ['elysium','asphodel','tartarus'].includes(to) && ['elysium','asphodel','tartarus'].every(n => n === to || state.visited.includes(n));
  }
  function routeWarning(to, parent = stage) {
    if (lastDestination(to) && state.boat.length) notice('This is the final destination this trip. Everyone still aboard must disembark here, even if their wish is elsewhere.', false, parent);
  }
  function identity(id) { const q = E.soul(state,id); return q.name + ' (' + id + ')'; }
  let cardCount = 0;
  function choiceCard(o) {
    const b = el('button', null, 'choice' + (o.pressed ? ' selected' : '')); b.type = 'button'; b.disabled = !!o.disabled;
    b.setAttribute('aria-label', o.label); if (o.pressed !== undefined) b.setAttribute('aria-pressed', String(!!o.pressed));
    if (o.focusKey) b.dataset.focus = o.focusKey;
    b.addEventListener('click', o.onPick);
    if (o.art) image(b, o.art);
    if (o.badge && o.pressed) { const bd = el('span', null, 'badge'); bd.append(ico('check'), el('span', o.badge)); b.append(bd); }
    const body = el('span', null, 'card-body'); body.dataset.inline = '1'; body.id = 'choice-' + (++cardCount);
    b.setAttribute('aria-describedby', body.id); b.append(body);
    return { b, body };
  }
  // Passenger abilities that prevent fog; the soldiers' +1 fog clash is shown separately.
  const ABILITY = ['S05','S10'];
  function fact(list, text, cls = '') {
    const row = el('span', null, 'fact' + (cls ? ' ' + cls : '')), ic = ico('bud'); ic.classList.add('ic');
    row.append(ic, el('span', text)); list.append(row); return row;
  }
  // Red (S04) and Blue (S06) Soldier from the same group add 1 fog when both are aboard.
  function rivalOf(id) {
    const q = state.souls[id], other = { S04: 'S06', S06: 'S04' }[q.template]; if (!other) return null;
    const rid = Object.keys(state.souls).find(x => state.souls[x].cohort === q.cohort && state.souls[x].template === other);
    return { name: rid ? E.soul(state,rid).name : (other === 'S06' ? 'Blue Soldier' : 'Red Soldier'), clash: !!rid && state.boat.includes(id) && state.boat.includes(rid) };
  }
  // A linked partner may not have reached the shore yet, so name it from its template.
  function partnerName(id) { const pid = E.partner(state,id); return state.souls[pid] ? E.soul(state,pid).name : E.TEMPLATES.find(t => t.id === E.soul(state,id).partner).name; }
  function soulCard(id, mode) {
    const q = E.soul(state,id), aboard = state.boat.includes(id), delivery = mode === 'delivery', chosen = delivery ? selected.has(id) : aboard;
    const full = !delivery && !aboard && E.seats(state) + q.seats > 4;
    const label = delivery ? (chosen ? 'Keep aboard: ' : 'Select: ') + q.name : (aboard ? 'Leave ' + q.name + ' ashore' : 'Board ' + q.name);
    const { b, body } = choiceCard({ art: 'assets/' + q.template + '.png', label, pressed: chosen, disabled: full, focusKey: id, badge: delivery ? 'Disembarks' : 'Aboard',
      onPick: () => { if (delivery) { if (chosen) selected.delete(id); else selected.add(id); render(id); } else send({type:aboard?'UNBOARD':'BOARD',id},id); } });
    paragraph(body, id + ' · ' + q.seats + (q.seats === 1 ? ' seat' : ' seats'), 'tag'); paragraph(body, q.name, 'title');
    const list = el('span', null, 'facts'); body.append(list);
    const match = delivery && E.deliveryPreview(state,[id])[0].match;
    fact(list, match ? 'Wish is here: +1 light' : 'Wishes for ' + E.NODES[q.wish], 'wish');
    const r = rivalOf(id);
    if (r) fact(list, r.clash ? 'Clashing with ' + r.name + ': +1 fog' : 'With ' + r.name + ': +1 fog', 'clash' + (r.clash ? ' live' : ''));
    else if (ABILITY.includes(q.template)) fact(list, q.text, 'ability');
    else if (!q.partner) fact(list, q.text, 'flavor');
    if (q.partner) { fact(list, 'With ' + partnerName(id) + ': Joined Memory. Apart: Faint Memory and extra anger.'); }
    else fact(list, 'Memory: ' + E.MEMORIES[q.memory].name);
    paragraph(body, 'Anger ' + q.anger + ' / 3', 'anger');
    if (full) paragraph(body, 'Needs ' + q.seats + ' free seats.', 'warning');
    return b;
  }
  function pips(before, after) {
    const s = el('span', null, 'pips'); s.setAttribute('aria-hidden', 'true');
    for (let i = 1; i <= 3; i++) s.append(el('i', null, i <= before ? 'on' : i <= after ? 'new' : ''));
    return s;
  }
  // Line icons drawn from Khmer motifs: sampan, oil lamp, lotus, naga hood, prasat tower, dharma wheel.
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
  // A short line of icon + text pairs, used for summaries on the title page and save slots.
  function iconLine(parent, pairs, cls = 'hint') { const p = el('p', null, 'icon-line ' + cls); for (const [icon, text] of pairs) { const g = el('span', null, 'icon-pair'); g.append(ico(icon), el('span', text)); p.append(g); } parent.append(p); return p; }
  // One soul row: portrait, name, icon line. `said` is the full sentence for screen readers.
  function mini(id, said, icons, cls = '') {
    const q = E.soul(state,id), row = el('li', null, 'mini' + (cls ? ' ' + cls : '')); row.dataset.soul = id;
    image(row, 'assets/' + q.template + '.png');
    const t = el('div'); t.append(el('strong', q.name)); const meta = el('span', null, 'meta'); meta.setAttribute('aria-hidden', 'true');
    meta.append(...icons); t.append(meta, el('span', said, 'sr-only')); row.append(t); return row;
  }
  function tripColumn(icon, title, count, empty) {
    const col = el('div', null, 'trip-col'), h = el('h3');
    const ic = ico(icon); ic.classList.add('icon'); h.append(ic, el('span', title)); if (count !== null) h.append(el('span', String(count), 'count'));
    col.append(h); const list = el('ul', null, 'minis'); col.append(list);
    if (empty) paragraph(col, empty, 'trip-empty');
    return { col, list };
  }
  function tactics() {
    const box = el('section', null, 'trip'); box.setAttribute('aria-label', 'Trip information');
    const head = el('div', null, 'trip-head'); head.append(el('h2', 'This trip'));
    const stops = el('div', null, 'stops');
    for (const n of ['elysium','asphodel','tartarus']) { const done = state.visited.includes(n); const st = el('span', null, 'stop' + (done ? ' done' : '')); if (done) st.append(ico('check')); st.append(el('span', E.NODES[n])); stops.append(st); }
    head.append(stops); box.append(head);
    if (state.cycle >= 5) { const v = E.preview(state,'elysium'); iconLine(box, [['fog', 'Crossings away from the shore add 1 fog.' + (v.favored ? ' ' + E.NODES[v.favored] + ' avoids it this trip.' : '')]], 'trip-note'); }
    const cols = el('div', null, 'trip-cols');

    const boat = tripColumn('boat', 'On the boat', E.seats(state) + '/4', state.boat.length ? '' : 'Empty. You can head back to the shore.');
    for (const id of state.boat) {
      const q = E.soul(state,id), pid = q.partner && E.partner(state,id), pname = pid && partnerName(id);
      const icons = [tagx(E.NODES[q.wish], '', 'lotus')];
      if (pname) icons.push(tagx(pname, '', 'knot'));
      const r = rivalOf(id); if (r && r.clash) icons.push(tagx(r.name + ' +1 fog', 'bad', 'spears'));
      boat.list.append(mini(id, q.name + ': wishes for ' + E.NODES[q.wish] + (pname ? ', linked to ' + pname : '') + (r && r.clash ? ', clashing with ' + r.name + ' for +1 fog' : '') + '.', icons, r && r.clash ? 'doomed' : ''));
    }
    if (state.boat.length) iconLine(boat.col, [['prasat', 'Deliver everyone before returning.']], 'trip-note');
    cols.append(boat.col);

    const shore = tripColumn('steps', 'Waiting on shore', state.shore.length, state.shore.length ? '' : 'No one is waiting.');
    for (const id of state.shore) {
      const q = E.soul(state,id), guarded = state.guarded.includes(id) || !!(state.pending && state.pending.target === id);
      const icons = [pips(q.anger, q.anger), el('span', 'Anger ' + q.anger + '/3', 'anger-change')];
      if (guarded) icons.push(tagx('Protected', 'safe', 'naga'));
      shore.list.append(mini(id, q.name + ': anger ' + q.anger + ' of 3' + (guarded ? ', protected' : '') + '.', icons));
    }
    cols.append(shore.col);

    const wraiths = tripColumn('spirit', 'Wraiths', state.wraiths.length, state.wraiths.length ? '' : 'None. The fog is calm.');
    for (const id of state.wraiths) wraiths.list.append(mini(id, E.soul(state,id).name + ' is a wraith and adds 1 fog to every crossing.', [tagx('+1 fog', 'bad', 'fog')], 'wraith'));
    cols.append(wraiths.col);

    box.append(cols); stage.append(box);
  }
  function toolbar(back, mainLabel, mainFn, disabled = false, chip = '') {
    const bar = el('div',null,'toolbar');
    if (chip) bar.append(el('span', chip, 'chip'));
    const actions = el('div',null,'actions');
    if (back) actions.append(button('Back',()=>send({type:'BACK'})));
    actions.append(button(mainLabel,mainFn,'primary',disabled)); bar.append(actions); stage.append(bar);
  }
  function backLink(label) { const row = el('div', null, 'back-row'); row.append(button(label,()=>send({type:'BACK'}),'text-button')); stage.append(row); }
  function renderBoarding() {
    heading('Who will you carry?', 'Tap a soul to bring them aboard. Up to four seats. You can change your mind until you confirm departure. Everyone you take must be delivered before returning.');
    const grid=el('div',null,'grid soul-grid');
    [...state.shore,...state.boat].sort((a,b)=>state.souls[a].cohort-state.souls[b].cohort||a.localeCompare(b)).forEach(id=>grid.append(soulCard(id,'boarding'))); stage.append(grid);
    toolbar(false,'Choose a route',()=>send({type:'READY'}),false,E.seats(state)+' / 4 seats filled');
  }
  function renderRoute() {
    heading('Where next?', 'Tap a destination. You can visit several on one trip. Fog totals include passengers and wraiths, before a memory.');
    const grid=el('div',null,'grid');
    for (const r of E.routes(state)) {
      const { b, body } = choiceCard({ art: art(r.to), label: 'Travel to ' + r.name, disabled: r.disabled, onPick: () => send({type:'ROUTE',to:r.to}) });
      paragraph(body, r.name, 'title');
      if(r.to==='haven')paragraph(body,'After surviving arrival: restore 1 light. No delivery here.','key');
      if(r.to==='shore')paragraph(body,'After surviving return: resolve waiting anger, restore 1 light and refill.','key');
      if(r.disabled)paragraph(body,r.reason,'warning'); else routeWarning(r.to,body);
      fogBrief(body,r.to);
      grid.append(b);
    } stage.append(grid);
    if(state.wraiths.length){
      const d=el('details',null,'tactics');d.append(el('summary','Release a wraith · 2 light each'));
      paragraph(d,'Release is immediate. Each released wraith removes 1 fog from future crossings. Spending down to 0 light is allowed.','hint');
      const wg=el('div',null,'grid soul-grid');
      for(const id of state.wraiths){
        const q=E.soul(state,id), { b, body } = choiceCard({ art: 'assets/' + q.template + '.png', label: 'Release '+identity(id)+' for 2 light', disabled: state.light<2,
          onPick: () => { if(window.confirm('Spend 2 light to release '+identity(id)+'?'))send({type:'RELEASE',id}); } });
        paragraph(body,q.name,'title'); paragraph(body,'Release for 2 light','key'); wg.append(b);
      }
      d.append(wg); if(state.light<2)paragraph(d,'You need at least 2 light.');stage.append(d);
    }
    if(state.node==='shore')backLink('Back to passengers');
  }
  function pickTarget(id, t, targets) {
    openPopup({ title: 'Protect a waiting soul?', lines: [t.name + ' can also shield one waiting soul from normal anger when you return. Separation anger still applies. This is optional.'], wide: true, build: pop => {
      const grid=el('div',null,'grid soul-grid');
      for (const sid of targets) {
        const q=E.soul(state,sid), { b, body } = choiceCard({ art: 'assets/' + q.template + '.png', label: 'Protect ' + identity(sid), onPick: () => { closePopup(); send({type:'MEMORY',id,target:sid}); } });
        paragraph(body,q.name,'title'); paragraph(body,'Anger '+q.anger+' / 3','anger'); grid.append(b);
      }
      const actions=el('div',null,'actions'), skip=button('No one',()=>{closePopup();send({type:'MEMORY',id,target:null});},'primary'); skip.autofocus=true; actions.append(skip,button('Cancel',closePopup,'text-button'));
      pop.append(grid, actions);
    } });
  }
  function renderMemory() {
    heading('What will you remember?', 'Tap one card, or keep your memories. Nothing is spent until you confirm the crossing to '+E.NODES[state.pending.to]+'.');
    routeWarning(state.pending.to);
    const grid=el('div',null,'grid');
    const none=choiceCard({ label: 'Use no memory', onPick: () => send({type:'MEMORY',id:null}) });
    paragraph(none.body,'Keep your memories','title'); paragraph(none.body,'Save every card for a later crossing.','key'); fogBrief(none.body,state.pending.to); grid.append(none.b);
    for(const id of state.hand){
      const m=state.memories[id],t=E.MEMORIES[m.type],targets=t.target?state.shore.filter(x=>!state.guarded.includes(x)):[];
      const { b, body } = choiceCard({ art: memoryArt(m.type), label: 'Choose '+t.name+' '+id, onPick: () => { if (targets.length) pickTarget(id,t,targets); else send({type:'MEMORY',id,target:null}); } });
      paragraph(body,t.name,'title'); paragraph(body,t.text,'key');
      if(targets.length)paragraph(body,'Next: pick a waiting soul to protect (optional).','hint');
      fogBrief(body,state.pending.to,id);
      grid.append(b);
    }stage.append(grid);if(!state.hand.length)notice('Your hand is empty. Every delivered soul leaves a memory.');
    backLink('Back');
  }
  function renderReview() {
    heading('One crossing at a time', 'Review your choice. Back lets you change it without spending a memory.');
    const box=el('div',null,'review');box.append(el('h2',E.NODES[state.node]+' → '+E.NODES[state.pending.to]));
    const v=fog(box,state.pending.to,state.pending.memory),m=state.pending.memory&&state.memories[state.pending.memory];
    if(m){const img=el('img',null,'result-art');img.src=memoryArt(m.type);img.alt='';box.append(img);}
    paragraph(box,'Memory: '+(m?E.MEMORIES[m.type].name+' from '+identity(m.source):'none')+'.');
    if(state.pending.target)paragraph(box,'Protect '+identity(state.pending.target)+' from normal anger on return. Separation anger is unchanged.');
    routeWarning(state.pending.to,box);
    if(v.lethal)notice('This crossing ends the run before arrival. No delivery or recovery can rescue it.',true,box);
    else if(v.after===0)notice('Exactly 0 light survives.',false,box);
    stage.append(box);
    toolbar(true,v.lethal?'Accept failure and cross':'Confirm crossing',()=>send({type:'CROSS',confirm:v.lethal}));
  }
  function renderDelivery() {
    heading('Who disembarks here?', 'Tap each soul leaving the boat at '+E.NODES[state.node]+'. Every delivered soul grants a memory. Each matched wish restores 1 light, up to 6.');
    routeWarning(state.node); const grid=el('div',null,'grid soul-grid');state.boat.forEach(id=>grid.append(soulCard(id,'delivery')));stage.append(grid);
    if(!state.boat.length)notice('Your boat is empty. Continue to prepare the next crossing.');
    const preview=E.deliveryPreview(state,[...selected]);
    if(preview.length){const ul=el('ul',null,'delivery-preview');for(const d of preview)ul.append(el('li',d.name+': '+E.MEMORIES[d.memory].name+(d.match?' + 1 light (cap 6).':'; no light, wish differs.')));stage.append(ul);}
    toolbar(false,selected.size?'Deliver '+selected.size+' passenger'+(selected.size===1?'':'s'):'Keep everyone aboard',()=>send({type:'DELIVER',ids:[...selected]}),lastDestination(state.node)&&selected.size!==state.boat.length);
    if(!state.boat.length)stage.querySelector('.primary').textContent='Prepare next crossing';
  }
  function resultTitle(r) {
    if (r.title.startsWith('Arrival at ') || r.title === 'A quiet landing') return 'Welcome to ' + E.NODES[state.node];
    if (r.title === 'Back at the shore') return 'Welcome back to the ' + E.NODES.shore;
    return r.title;
  }
  function showResult() {
    const r = state.result, title = resultTitle(r);
    openPopup({ art: art(r.image), eyebrow: title === r.title ? '' : 'You made it across', title, lines: r.lines, locked: true, build: pop => {
      const actions=el('div',null,'actions'); actions.append(button('Continue',()=>{closePopup();send({type:'CONTINUE'});},'primary')); pop.append(actions);
    } });
  }
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
  function renderEnded() {
    const hero=el('div',null,'ending');hero.append(boat('docked dark'));paragraph(hero,'Journey’s end · cycle '+state.cycle,'eyebrow');stage.append(hero);
    heading('The river remembers', 'Your lantern went dark on the water. A new journey starts with a fresh shore and no carried resources.');
    const matched=state.delivered.filter(q=>q.match).length,stats=el('dl',null,'end-stats');
    for(const [n,label,sub] of [[state.crossings,'Crossings survived'],[state.delivered.length,'Souls delivered',matched+' wishes matched'],[state.memorySeq,'Memories earned'],[state.completed,'Cycles completed'],[state.formed,'Wraiths formed',state.released+' released']]){
      const tile=el('div',null,'end-stat');tile.append(el('dd',String(n)),el('dt',label));if(sub)tile.append(el('span',sub,'end-sub'));stats.append(tile);
    }stage.append(stats);
    const cols=el('div',null,'end-cols'),souls=el('section',null,'end-panel');souls.append(el('h2','Souls you carried'));
    if(state.delivered.length){const list=el('ul',null,'minis');for(const q of state.delivered)list.append(mini(q.id,identity(q.id)+' delivered to '+E.NODES[q.to]+(q.match?', wish matched.':'.'),[tagx(E.NODES[q.to],'','lotus'),...(q.match?[tagx('Wish matched','safe','check')]:[])]));souls.append(list);}
    else paragraph(souls,'No soul reached the far shore this time.','hint');
    const mems=el('section',null,'end-panel');mems.append(el('h2','Memories earned'));const earned=Object.values(state.memories);
    if(earned.length){const g=el('ul',null,'end-mems');const counts={};for(const m of earned)counts[m.type]=(counts[m.type]||0)+1;for(const type of Object.keys(E.MEMORIES).filter(t=>counts[t])){const li=el('li');image(li,memoryArt(type));li.append(el('span',E.MEMORIES[type].name));if(counts[type]>1)li.append(el('b','\u00d7'+counts[type],'end-count'));g.append(li);}mems.append(g);}
    else paragraph(mems,'Every delivered soul leaves a memory. None were earned this run.','hint');
    cols.append(souls,mems);stage.append(cols);
    const go=el('div',null,'end-go');go.append(button('Start a new run',()=>begin(),'primary'));stage.append(go);
  }
  // Static artwork: a ferryman silhouette poling a boat with a lit lantern.
  const BOAT_SVG='<svg viewBox="0 0 240 130" aria-hidden="true"><defs><radialGradient id="lg"><stop offset="0" stop-color="#fff0c4"/><stop offset=".3" stop-color="#edc47f" stop-opacity=".6"/><stop offset="1" stop-color="#edc47f" stop-opacity="0"/></radialGradient></defs>'
    +'<circle class="lantern-glow" cx="182" cy="52" r="46" fill="url(#lg)"/>'
    // The ferryman as a reaper: scythe blade on the pole, ragged hooded robe, an empty hood with two ember eyes.
    +'<line class="pole" x1="86" y1="8" x2="132" y2="122"/>'
    +'<path class="blade" d="M87 10 Q104 -4 131 9 Q121 5.5 110 7 Q98 8.5 89.5 15.5 Z"/>'
    +'<path class="s robe" d="M118 22 Q108.5 29 106.5 41 Q101 47 100 60 L95.5 97 L101.5 91.5 L106 98.5 L111 91 L116.5 99.5 L121.5 91 L127 98.5 L132 91.5 L140.5 97 L136 60 Q135 47 129.5 41 Q127.5 29 118 22 Z"/>'
    +'<path class="hood-void" d="M118 30.5 Q111.5 34 111 43.5 Q111.5 51.5 118 53.5 Q124.5 51.5 125 43.5 Q124.5 34 118 30.5 Z"/>'
    +'<g class="eyes"><circle cx="115" cy="43.5" r="1.3"/><circle cx="121" cy="43.5" r="1.3"/></g>'
    +'<path class="bone" d="M105 60 Q100.5 61.5 99.5 58.5M104.5 63 Q100 65 98.5 62.5"/>'
    +'<line class="pole" x1="176" y1="96" x2="176" y2="36"/><path class="hook" d="M176 38 Q182 34 182 44"/>'
    +'<rect class="lamp" x="177" y="44" width="10" height="14" rx="2"/>'
    +'<path class="s hull" d="M18 88 Q120 108 222 86 L208 104 Q120 124 34 104 Z"/>'
    +'<path class="ripple" d="M10 116 Q40 110 70 116 T130 116 T190 116 T250 116"/></svg>';
  function boat(cls) { const b = el('div', null, 'boat ' + cls); b.innerHTML = BOAT_SVG; return b; }
  let entered = false; try { entered = sessionStorage.getItem('ferryman-entered') === '1'; } catch {}
  function renderSplash() {
    const sp = el('div', null, 'splash'), text = el('div', null, 'splash-text');
    paragraph(text, 'The river is calling…', 'eyebrow calling');
    const h = el('h1', null, 'splash-title'); h.tabIndex = -1;
    'Welcome to The Ferryman'.split(' ').forEach((w, i) => { const s = el('span', w + ' '); s.style.animationDelay = (0.4 + i * 0.28) + 's'; h.append(s); });
    text.append(h); paragraph(text, 'Carry a soul. Keep a memory.', 'splash-sub');
    const river = el('div', null, 'river'); river.append(boat('arriving'));
    const go = el('div', null, 'splash-go'), enter = button('Enter', () => {
      enter.disabled = true; sp.classList.add('sailing');
      const done = () => { entered = true; try { sessionStorage.setItem('ferryman-entered', '1'); } catch {} render('slot1'); };
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) done(); else setTimeout(done, 1500);
    }, 'primary enter', false, 'enter');
    go.append(enter); sp.append(text, river, go); stage.append(sp);
  }
  function renderTitle() {
    const hero=el('div',null,'hero');hero.append(boat('docked'));hero.append(el('h1','Welcome to The Ferryman'));
    paragraph(hero,'You are an apprentice ferryman. Choose passengers, plan each crossing and keep the lantern alive. The journey continues for as long as you can carry it.','intro');
    iconLine(hero,[['boat','Four seats'],['lamp','One lantern'],['wheel','One decision at a time']]);stage.append(hero);
    const title=el('h2','Choose a save','slots-title');stage.append(title);
    const grid=el('div',null,'grid slot-grid');
    for(const n of SLOTS){
      const s=slots[n],cell=el('div',null,'slot');
      if(broken[n]){const {b,body}=choiceCard({label:'Save '+n+': unreadable',disabled:true,onPick:()=>{}});paragraph(body,'Save '+n,'title');paragraph(body,'This save could not be read.','warning');cell.append(b);}
      else if(s){
        const {b,body}=choiceCard({art:art(s.ended?'wraith':s.node),label:s.ended?'Save '+n+': view ended journey':'Save '+n+': continue cycle '+s.cycle,focusKey:'slot'+n,onPick:()=>{useSlot(n);state=s;behind=null;selected=new Set();render();}});
        paragraph(body,'Save '+n,'title');
        paragraph(body,s.ended?'Journey ended':'Continue',  'key');
        iconLine(body,[['wheel','Cycle '+s.cycle],['lotus',E.NODES[s.node]]],'line');
        iconLine(body,[['lamp','Light '+s.light+'/6'],['boat',s.boat.length+' aboard'],['flower',s.delivered.length+' delivered']],'line');
        cell.append(b);
      }else{
        const {b,body}=choiceCard({label:'Save '+n+': begin the journey',focusKey:'slot'+n,onPick:()=>begin(n)});b.classList.add('empty-slot');
        paragraph(body,'Save '+n,'title');iconLine(body,[['plus','New journey']],'key');paragraph(body,'Empty slot. Start fresh at the shore.');cell.append(b);
      }
      if(s||broken[n]){const row=el('div',null,'slot-actions');if(s)row.append(button('New journey',()=>begin(n),'text-button'));row.append(button('Erase',()=>erase(n),'text-button'));cell.append(row);}
      grid.append(cell);
    }
    stage.append(grid);
  }
  const PAGES = {boarding:renderBoarding,route:renderRoute,memory:renderMemory,review:renderReview,delivery:renderDelivery,ended:renderEnded};
  function render(focusKey) {
    closePopup();
    stage.replaceChildren();stage.inert=false;summary();document.querySelector('.world').style.backgroundImage='url("'+art(state?state.node:'shore')+'")';
    if(storageNote)notice(storageNote,true);
    document.body.classList.toggle('splash-on',!state&&!entered);
    if(!state){if(entered)renderTitle();else renderSplash();}
    else{
      // A result is a popup over the page that produced it; after a reload only the scene shows behind it.
      const real=state, view=state.phase==='result'?behind:state;
      if(view){state=view;try{flow();PAGES[state.phase]();if(['boarding','route','memory','review','delivery'].includes(state.phase))tactics();}finally{state=real;}}
      if(state.phase==='result'){stage.inert=true;showResult();announce(resultTitle(state.result)+'. Light '+state.light+'.');return;}
    }
    const key=focusKey||(!state&&!entered?'enter':'');
    const target=key&&[...stage.querySelectorAll('[data-focus]')].find(n=>n.dataset.focus===key);
    if(target)target.focus();else{stage.focus();window.scrollTo(0,0);}
    announce(state?E.NODES[state.node]+'. '+state.phase+' step. Light '+state.light+'.':'Choose a new journey or resume.');
  }
  function exportSave() {
    const current=state||saved;if(!current)return;
    const url=URL.createObjectURL(new Blob([E.serialize(current)],{type:'application/json'}));
    const a=el('a');a.href=url;a.download='ferryman-v0.4-cycle-'+current.cycle+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function importSave(text) {
    const r=E.deserialize(text);
    if(!r.ok){message.textContent='Import rejected: '+r.error+' Your current run is unchanged.';return;}
    if((state||saved)&&!window.confirm('Replace Save '+slot+' with this v0.4 save?'))return;
    state=r.state;behind=null;selected=new Set();persist(true);menu.close();render();
  }
  let message;
  function openMenu() {
    menuContent.replaceChildren();
    paragraph(menuContent,'Choose passengers → route → optional memory → review → arrival → delivery. At later stops, skip boarding. Return only with an empty boat.');
    paragraph(menuContent,'Fog costs light. Exactly 0 light survives; fog greater than your light ends the run before rewards. Anger rises only on return. At 3, a waiting soul becomes a wraith. Each wraith adds 1 fog.');
    paragraph(menuContent,'Memories cost no light, at most one per crossing. Draw to three after delivery, Haven arrival or return. Normal-anger protection lasts until return and does not prevent separation anger.');
    const links=el('p');for(const [href,label]of[['QUICK_START.md','Quick start'],['RULES.md','Full rules (includes event spoilers)'],['README.md','Launch and save help']]){const a=el('a',label);a.href=href;a.target='_blank';a.rel='noopener';links.append(a,document.createTextNode(' · '));}menuContent.append(links);
    const event=el('details');event.append(el('summary',discovered?'Discovered: Shared Farewell':'Event reference (spoiler)'));paragraph(event,'Shared Farewell: deliver a matching linked pair together at Elysium for 1 extra light, once per run.');menuContent.append(event);
    if(discovered)menuContent.append(button('Clear remembered discovery',()=>{discovered=false;try{localStorage.removeItem(KNOWLEDGE);}catch{}openMenu();},'text-button'));
    paragraph(menuContent,storageNote||'Progress saves automatically in this browser. File opening and different browser addresses may have separate storage. Export before moving or clearing files.','hint');
    const actions=el('div',null,'menu-actions');actions.append(button('Export JSON',exportSave,'',!(state||saved)),button('New run',()=>{begin();if(state)menu.close();}),button('Save slots',()=>{state=null;behind=null;menu.close();render();},'',!state));menuContent.append(actions);
    const label=el('label','Import a v0.4 JSON file');label.htmlFor='import-file';const input=el('input');input.type='file';input.accept='.json,application/json';input.id='import-file';input.addEventListener('change',async()=>{const file=input.files[0];if(!file)return;if(file.size>5000000){message.textContent='Import rejected: file exceeds 5 MB. Current run unchanged.';return;}try{importSave(await file.text());}catch{message.textContent='Could not read that file. Current run unchanged.';}});menuContent.append(label,input);
    const pasteLabel=el('label','Or paste save JSON');pasteLabel.htmlFor='import-json';const area=el('textarea');area.id='import-json';area.rows=4;area.maxLength=5000000;menuContent.append(pasteLabel,area,button('Import pasted JSON',()=>importSave(area.value)));
    message=el('p');message.setAttribute('role','status');menuContent.append(message);
    if(!menu.open)menu.showModal();
  }
  // The brand returns to the intro; progress is already saved after every action.
  document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();if(menu.open)menu.close();state=null;behind=null;selected=new Set();entered=false;render();});
  document.querySelector('#menu-button').addEventListener('click',openMenu);
  document.querySelector('#close-menu').addEventListener('click',()=>menu.close());
  menu.addEventListener('close',()=>document.querySelector('#menu-button').focus());
  popup.addEventListener('cancel',e=>{if(popupLocked)e.preventDefault();});
  popup.addEventListener('close',()=>{if(popupLocked)popup.showModal();});
  render();
})();
