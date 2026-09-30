/* Local, dependency-free interface. All gameplay transitions belong to engine.js. */
(() => {
  'use strict';
  const E = window.Ferryman;
  const SAVE = 'ferryman-v0.4-run', KNOWLEDGE = 'ferryman-v0.4-discoveries';
  const stage = document.querySelector('#stage'), status = document.querySelector('#status');
  const menu = document.querySelector('#menu'), menuContent = document.querySelector('#menu-content'), popup = document.querySelector('#popup');
  let state = null, saved = null, behind = null, selected = new Set(), storageNote = '', discovered = false, popupLocked = false;
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
  function art(name) { return 'assets/' + (name === 'wraith' ? 'wraith-r2' : name + '-r2') + '.png'; }
  function image(parent, src) { const img = el('img'); img.src = src; img.alt = ''; parent.append(img); }
  function heading(title, description) {
    const h = el('h1', title); h.tabIndex = -1; stage.append(h);
    if (description) paragraph(stage, description, 'intro');
  }
  function persist(newDiscovery = false) {
    saved = state;
    try {
      localStorage.setItem(SAVE, E.serialize(state));
      if (newDiscovery && state.events.includes('farewell')) { discovered = true; localStorage.setItem(KNOWLEDGE, 'farewell'); }
      storageNote = '';
    } catch { storageNote = 'This browser cannot save locally. Export JSON to keep your journey.'; }
  }
  try {
    const raw = localStorage.getItem(SAVE);
    if (raw) { const r = E.deserialize(raw); if (r.ok) saved = r.state; else storageNote = 'The local save could not be loaded. Import a valid v0.4 save or start a new run.'; }
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
  function begin() {
    if ((state || saved) && !window.confirm('Start a new run? This replaces your current local save. Export it first if you want to keep it.')) return;
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
    if (o.badge && o.pressed) b.append(el('span', '✓ ' + o.badge, 'badge'));
    const body = el('span', null, 'card-body'); body.dataset.inline = '1'; body.id = 'choice-' + (++cardCount);
    b.setAttribute('aria-describedby', body.id); b.append(body);
    return { b, body };
  }
  function soulCard(id, mode) {
    const q = E.soul(state,id), aboard = state.boat.includes(id), delivery = mode === 'delivery', chosen = delivery ? selected.has(id) : aboard;
    const full = !delivery && !aboard && E.seats(state) + q.seats > 4;
    const label = delivery ? (chosen ? 'Keep aboard: ' : 'Select: ') + q.name : (aboard ? 'Leave ' + q.name + ' ashore' : 'Board ' + q.name);
    const { b, body } = choiceCard({ art: 'assets/' + q.template + '.png', label, pressed: chosen, disabled: full, focusKey: id, badge: delivery ? 'Disembarks' : 'Aboard',
      onPick: () => { if (delivery) { if (chosen) selected.delete(id); else selected.add(id); render(id); } else send({type:aboard?'UNBOARD':'BOARD',id},id); } });
    paragraph(body, id + ' · ' + q.seats + (q.seats === 1 ? ' seat' : ' seats'), 'tag'); paragraph(body, q.name, 'title');
    const match = delivery && E.deliveryPreview(state,[id])[0].match;
    paragraph(body, match ? '★ Wish is here: +1 light' : 'Wishes for ' + E.NODES[q.wish], 'key');
    paragraph(body, q.text);
    if (q.partner) paragraph(body, 'Linked to ' + E.partner(state,id) + '. Together: Joined Memory. Apart: Faint Memory; a partner left waiting gains extra anger.', 'hint');
    else paragraph(body, 'Memory: ' + E.MEMORIES[q.memory].name, 'hint');
    paragraph(body, 'Anger ' + q.anger + ' / 3', 'anger');
    if (full) paragraph(body, 'Needs ' + q.seats + ' free seats.', 'warning');
    return b;
  }
  function tactics() {
    const details = el('details', null, 'tactics');
    details.open = true; details.append(el('summary','Trip information · boat, waiting shore and wraiths'));
    paragraph(details, 'Visited: ' + (state.visited.map(n=>E.NODES[n]).join(', ') || 'none') + '. Return needs an empty boat.', 'hint');
    if (state.cycle >= 5) {
      const v=E.preview(state,'elysium'); paragraph(details,'Non-return crossings add 1 cycle fog.' + (v.favored ? ' This cycle, ' + E.NODES[v.favored] + ' avoids it.' : ''),'hint');
    }
    paragraph(details, 'Aboard: ' + (state.boat.map(identity).join(', ') || 'empty') + '.', 'hint');
    if (state.phase !== 'boarding' && state.phase !== 'delivery') for (const id of state.boat) {
      const q=E.soul(state,id); paragraph(details,q.name + ': ' + q.seats + ' seats; wishes for ' + E.NODES[q.wish] + '. ' + q.text + (q.partner ? ' Partner: '+E.partner(state,id)+'. Deliver together for Joined Memory.' : ''),'hint');
    }
    paragraph(details,'If you return with the current protection:', 'hint');
    const list = el('ul');
    for (const f of E.forecast(state)) list.append(el('li',identity(f.id) + ': anger ' + f.before + ' → ' + f.after + (f.after >= 3 ? ', becomes a wraith' : '') + '. Normal +' + f.normal + ', separation +' + f.extra + '.'));
    if (!list.children.length) list.append(el('li','No souls left waiting.')); details.append(list);
    paragraph(details, 'Active wraiths (' + state.wraiths.length + '): ' + (state.wraiths.map(identity).join(', ') || 'none') + '. Each adds 1 fog.', 'hint');
    stage.append(details);
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
      paragraph(body, r.name, 'title'); fog(body,r.to);
      if(r.to==='haven')paragraph(body,'After surviving arrival: restore 1 light. No delivery here.','key');
      if(r.to==='shore')paragraph(body,'After surviving return: resolve waiting anger, restore 1 light and refill.','key');
      if(r.disabled)paragraph(body,r.reason,'warning'); else routeWarning(r.to,body);
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
    paragraph(none.body,'Keep your memories','title'); paragraph(none.body,'Save every card for a later crossing.','key'); fog(none.body,state.pending.to); grid.append(none.b);
    for(const id of state.hand){
      const m=state.memories[id],t=E.MEMORIES[m.type],targets=t.target?state.shore.filter(x=>!state.guarded.includes(x)):[];
      const { b, body } = choiceCard({ label: 'Choose '+t.name+' '+id, onPick: () => { if (targets.length) pickTarget(id,t,targets); else send({type:'MEMORY',id,target:null}); } });
      paragraph(body,t.name,'title'); paragraph(body,t.text,'key'); paragraph(body,'From '+identity(m.source)+' at '+E.NODES[m.destination]+'.','hint'); fog(body,state.pending.to,id);
      if(targets.length)paragraph(body,'Next: pick a waiting soul to protect (optional).','hint');
      grid.append(b);
    }stage.append(grid);if(!state.hand.length)notice('Your hand is empty. Every delivered soul leaves a memory.');
    backLink('Back');
  }
  function renderReview() {
    heading('One crossing at a time', 'Review your choice. Back lets you change it without spending a memory.');
    const box=el('div',null,'review');box.append(el('h2',E.NODES[state.node]+' → '+E.NODES[state.pending.to]));
    const v=fog(box,state.pending.to,state.pending.memory),m=state.pending.memory&&state.memories[state.pending.memory];
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
    heading('The river remembers', 'Your run has ended. A new journey starts with a fresh shore and no carried resources.');
    const box=el('div',null,'review');for(const text of [state.completed+' cycles completed',state.delivered.length+' souls delivered',state.memorySeq+' memories earned',state.formed+' wraiths formed; '+state.released+' released',state.crossings+' crossings survived'])paragraph(box,text);
    const d=el('details');d.append(el('summary','Delivered souls'));for(const q of state.delivered)paragraph(d,identity(q.id)+' → '+E.NODES[q.to]+(q.match?' (wish matched)':''));box.append(d);stage.append(box);toolbar(false,'Start a new run',begin);
  }
  const PAGES = {boarding:renderBoarding,route:renderRoute,memory:renderMemory,review:renderReview,delivery:renderDelivery,ended:renderEnded};
  function render(focusKey) {
    closePopup();
    stage.replaceChildren();stage.inert=false;summary();document.querySelector('.world').style.backgroundImage='url("'+art(state?state.node:'shore')+'")';
    if(storageNote)notice(storageNote,true);
    if(!state){const hero=el('div',null,'hero');paragraph(hero,'THE FERRYMAN · v0.4','eyebrow');hero.append(el('h1','Carry a soul. Keep a memory.'));paragraph(hero,'You are an apprentice ferryman. Choose passengers, plan each crossing and keep the lantern alive. The journey continues for as long as you can carry it.','intro');
      if(saved)hero.append(button('Resume cycle '+saved.cycle,()=>{state=saved;behind=null;selected=new Set();render();},'primary'));
      hero.append(button(saved?'Start a new run':'Begin the journey',begin,saved?'quiet':'primary'));paragraph(hero,'Four seats. One lantern. One decision at a time.','hint');stage.append(hero);
    }else{
      // A result is a popup over the page that produced it; after a reload only the scene shows behind it.
      const real=state, view=state.phase==='result'?behind:state;
      if(view){state=view;try{flow();PAGES[state.phase]();if(['boarding','route','memory','review','delivery'].includes(state.phase))tactics();}finally{state=real;}}
      if(state.phase==='result'){stage.inert=true;showResult();announce(resultTitle(state.result)+'. Light '+state.light+'.');return;}
    }
    const target=focusKey&&[...stage.querySelectorAll('[data-focus]')].find(n=>n.dataset.focus===focusKey);
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
    if((state||saved)&&!window.confirm('Replace the current run with this v0.4 save?'))return;
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
    const actions=el('div',null,'menu-actions');actions.append(button('Export JSON',exportSave,'',!(state||saved)),button('New run',()=>{begin();if(state)menu.close();}));menuContent.append(actions);
    const label=el('label','Import a v0.4 JSON file');label.htmlFor='import-file';const input=el('input');input.type='file';input.accept='.json,application/json';input.id='import-file';input.addEventListener('change',async()=>{const file=input.files[0];if(!file)return;if(file.size>5000000){message.textContent='Import rejected: file exceeds 5 MB. Current run unchanged.';return;}try{importSave(await file.text());}catch{message.textContent='Could not read that file. Current run unchanged.';}});menuContent.append(label,input);
    const pasteLabel=el('label','Or paste save JSON');pasteLabel.htmlFor='import-json';const area=el('textarea');area.id='import-json';area.rows=4;area.maxLength=5000000;menuContent.append(pasteLabel,area,button('Import pasted JSON',()=>importSave(area.value)));
    message=el('p');message.setAttribute('role','status');menuContent.append(message);
    if(!menu.open)menu.showModal();
  }
  document.querySelector('#menu-button').addEventListener('click',openMenu);
  document.querySelector('#close-menu').addEventListener('click',()=>menu.close());
  menu.addEventListener('close',()=>document.querySelector('#menu-button').focus());
  popup.addEventListener('cancel',e=>{if(popupLocked)e.preventDefault();});
  popup.addEventListener('close',()=>{if(popupLocked)popup.showModal();});
  render();
})();
