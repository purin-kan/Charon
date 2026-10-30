/* The Ferryman v0.7-trial interface in the v0.4 style: one decision per page, picture cards, popups.
   Rules and route draws live in engine.js; this file renders and dispatches actions. */
(() => {
  'use strict';
  const game = globalThis.Ferry, data = game.data, C = data.config;
  const ART = Object.assign({}, globalThis.FerryArt, { 'SOUL-POLONG': 'assets/art/newpolong.jpg' });
  const SOUL = Object.fromEntries(data.souls.map(s => [s.id, s]));
  const DEST = Object.fromEntries(data.destinations.map(d => [d.id, d]));
  const MEM = Object.fromEntries(data.memories.map(m => [m.id, m]));
  const COLOR = { 'DEST-HAVEN': '#957020', 'DEST-STYX': '#6b5285', 'DEST-ACHERON': '#3f6f7a', 'DEST-ASPHODEL': '#486f91', 'DEST-ELYSIUM': '#477455', 'DEST-TARTARUS': '#a84d3d' };
  const qa = new URLSearchParams(location.search).get('qa');
  // Isolated trial namespace. The original v0.6 slots are never read or written.
  const NS = 'the-ferryman:v0.7-trial:' + (qa && /^[a-z0-9_-]{1,60}$/i.test(qa) ? 'qa:' + qa + ':' : 'player:');
  const SLOTS = [1, 2, 3], slotKey = n => NS + 'slot-' + n;
  const stage = document.querySelector('#stage'), status = document.querySelector('#status');
  const menu = document.querySelector('#menu'), menuContent = document.querySelector('#menu-content'), popup = document.querySelector('#popup');
  let state = null, slot = 1, slots = {}, broken = {}, selected = new Set(), storageNote = '';

  function el(tag, text, cls) { const n = document.createElement(tag); if (text !== undefined && text !== null) n.textContent = text; if (cls) n.className = cls; return n; }
  function button(text, fn, cls = '', disabled = false, key = '') { const b = el('button', text, cls); b.type = 'button'; b.disabled = disabled; b.addEventListener('click', fn); if (key) b.dataset.focus = key; return b; }
  function paragraph(parent, text, cls) { const inline = parent.dataset && parent.dataset.inline; const p = el(inline ? 'span' : 'p', text, (inline ? 'line ' : '') + (cls || '')); parent.append(p); return p; }
  function announce(text) { document.querySelector('#announcement').textContent = text; }
  function notice(text, danger = false, parent = stage) { paragraph(parent, text, 'notice' + (danger ? ' danger' : '')); }
  function heading(title, description) { const h = el('h1', title); h.tabIndex = -1; stage.append(h); if (description) paragraph(stage, description, 'intro'); }
  const soulOf = item => SOUL[item.type];
  const placeName = id => id ? DEST[id].name : 'Starting Shore';
  const initials = name => name.split(' ').map(w => w[0]).slice(0, 2).join('');
  const isPolong = game.isTainted;
  const polongFog = game.taintedFog;
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

  function persist() {
    slots[slot]=state;broken[slot]=false;
    try {localStorage.setItem(slotKey(slot),game.exportSave(state));storageNote='';}
    catch {storageNote='Local saving failed. Export JSON to keep this run.';}
  }
  try {for(const n of SLOTS){const raw=localStorage.getItem(slotKey(n));if(raw){try{slots[n]=game.importSave(raw);}catch{broken[n]=true;}}}}
  catch {storageNote='Local saving is unavailable. Use JSON export.';}
  function begin(n=slot,seed=crypto.getRandomValues(new Uint32Array(1))[0]) {
    if(slots[n]&&!confirm('Replace trial Save '+n+'? Export it first to keep it.'))return false;
    slot=n;state=game.create(seed);selected=new Set();persist();render();return true;
  }
  function send(action) {
    try {state=game.transition(state,action);selected=new Set();persist();render();}
    catch(e){showNote('Action unavailable',[e.message]);}
  }
  function closePopup(){if(popup.open)popup.close();}
  function showNote(title,lines){openPopup(title,lines);}
  function openPopup(title,lines,build) {
    popup.replaceChildren();const h=el('h2',title);h.id='popup-title';popup.append(h);
    for(const line of lines)paragraph(popup,line);
    if(build)build(popup);
    const actions=el('div',null,'actions');actions.append(button(build?'Cancel':'Continue',closePopup,'primary'));popup.append(actions);popup.showModal();
  }
  const actorArt=x=>x.type==='SOUL-PRIEST'&&x.exhausted?ART['SOUL-PRIEST-EXHAUSTED']:ART[x.type];
  let cardSerial = 0;
  function choiceCard({label,title,lines=[],art,onPick,disabled=false,pressed,focus}) {
    const b=button('',onPick||(()=>{}),'choice'+(pressed?' selected':''),disabled,focus);
    b.setAttribute('aria-label',label);if(pressed!==undefined)b.setAttribute('aria-pressed',String(pressed));
    if(art){const img=el('img');img.src=art;img.alt='';b.append(img);}
    else{const sg=el('span',initials(title),'sigil');sg.setAttribute('aria-hidden','true');b.append(sg);}
    const body=el('span',null,'card-body');body.dataset.inline='1';body.id='card-details-'+(++cardSerial);b.setAttribute('aria-describedby',body.id);paragraph(body,title,'title');
    for(const line of lines)paragraph(body,line,'key');b.append(body);return b;
  }
  function toolbar(label,fn,disabled=false,back) {
    const bar=el('div',null,'toolbar'),actions=el('div',null,'actions');
    if(back)actions.append(button('Back',back));actions.append(button(label,fn,'primary',disabled));bar.append(actions);stage.append(bar);
  }
  function summary() {
    status.replaceChildren();status.hidden=!state;if(!state)return;
    for(const [label,value] of [['Light',state.light+' / '+game.maxLight(state)],['Cycle',state.cycle],['Round',state.round],['Boat',game.seats(state)+' / '+game.capacity(state)],['At',state.destination?DEST[state.destination].name:'Starting Shore']]){
      const cell=el('span',label+' ');cell.append(el('strong',String(value)));status.append(cell);
    }
  }
  function pickActor(title,targets,fn) {
    openPopup(title,[],box=>{const grid=el('div',null,'grid soul-grid');
      for(const x of targets)grid.append(choiceCard({label:'Choose '+SOUL[x.type].name,title:SOUL[x.type].name,lines:['Anger '+x.anger,DEST[x.wish].name],art:actorArt(x),onPick:()=>{closePopup();fn(x);}}));box.append(grid);});
  }
  function playMemory(held) {
    const targets=game.memoryTargets(state,held.type);
    if(targets)pickActor('Choose a target for '+MEM[held.type].name,targets,x=>send({type:'PLAY_MEMORY',id:held.id,target:x.id}));
    else send({type:'PLAY_MEMORY',id:held.id});
  }
  function memoryCard(held,onPick,label,disabled=false) {
    const m=MEM[held.type],ref=held.sourceRef;
    const from=ref.kind==='quest'?data.quests.find(q=>q.id===ref.definitionId)?.name:SOUL[ref.definitionId]?.name;
    return choiceCard({label:label||'Play '+m.name,title:m.name,lines:[m.text,'From '+from],art:ART[held.type],onPick:onPick||(()=>playMemory(held)),disabled,focus:held.id});
  }
  function actorCard(x,mode) {
    const def=SOUL[x.type],chosen=mode==='boarding'?state.selected.includes(x.id):selected.has(x.id);
    const reason=mode==='delivery'?game.deliveryReason(state,x):mode==='boarding'&&!chosen&&game.seats(state)+game.actorSeats(x)>game.capacity(state)?'Not enough seats.':null;
    const lines=['Wish: '+DEST[x.wish].name,game.actorSeats(x)+' seat(s) · Anger '+x.anger,def.memory&&!(x.type==='SOUL-PRIEST'&&x.exhausted)?'Memory: '+MEM[def.memory].name:'No ordinary memory'];
    if(x.exhausted)lines.push('Exhausted: purification spent; no memory this boarding.');
    if(game.isTainted(x))lines.push('Tainted · '+(x.spread?'spread-created':x.level>=3?'Empowered':'Base')+' · encounter level '+x.level);
    if(def.text)lines.push(def.text);
    if(reason)lines.push(reason);
    return choiceCard({label:(mode==='boarding'?(chosen?'Leave ashore: ':'Board '):mode==='delivery'?(chosen?'Keep aboard: ':'Deliver '):'Passenger: ')+def.name,title:def.name,lines,art:actorArt(x),pressed:mode==='view'?undefined:chosen,disabled:mode==='view'||!!reason,focus:x.id,
      onPick:mode==='boarding'?()=>send({type:'BOARD',id:x.id}):()=>{if(chosen)selected.delete(x.id);else selected.add(x.id);render();}});
  }
  function renderBoarding() {
    heading('Who will you carry?','Choose passengers within capacity. Quest attempts begin when the required characters depart together.');
    notice('Next Polong: '+SOUL[state.nextPolong].name+' · encounter '+(BigInt(state.encounters)+1n)+'. It boards on the next scheduled third outward round unless Moly is active.');
    const offer=state.heroOffer;
    if(offer&&!offer.resolved){
      const box=el('section',null,'review');box.append(el('h2',SOUL[offer.type].name+' asks to board'));
      paragraph(box,offer.type==='SOUL-HERACLES'?'One seat. Choose a shore soul as Hades’ toll and lose 1 Light. The toll grants no memory.':'One seat. Reach his wish to meet Tiresias and choose a route through danger.');
      const row=el('div',null,'menu-actions');row.append(button('Accept '+SOUL[offer.type].name,()=>offer.type==='SOUL-HERACLES'?pickActor('Choose Hades’ toll',state.shore,x=>send({type:'ACCEPT_HERO',target:x.id})):send({type:'ACCEPT_HERO'})),button('Decline this trip',()=>send({type:'DECLINE_HERO'})));box.append(row);stage.append(box);
    }
    const extras=state.hand.filter(m=>MEM[m.type].kind==='capacity');
    if(extras.length){const row=el('div',null,'menu-actions');for(const m of extras)row.append(button('Use Boat Space (+1 seat this trip)',()=>playMemory(m), '', state.effects.capacity));stage.append(row);}
    const grid=el('div',null,'grid soul-grid');for(const x of state.shore)grid.append(actorCard(x,'boarding'));stage.append(grid);
    if(state.boat.length){paragraph(stage,'Already aboard: '+state.boat.map(x=>SOUL[x.type].name+' → '+DEST[x.wish].name).join(', '),'notice');}
    const types=[...state.boat,...state.shore.filter(x=>state.selected.includes(x.id))].map(x=>x.type);
    const clash=['SOUL-MERCHANT','SOUL-BLACKSMITH','SOUL-MASON'].every(id=>types.includes(id));
    if(clash)notice('Merchant cannot depart with both Blacksmith and Mason.',true);
    toolbar('Set out',()=>send({type:'DEPART'}),clash||!(state.selected.length||state.boat.length));
    renderOffers(false);
  }
  function renderPreparation() {
    const returning=state.window.kind==='return';
    heading(returning?'Before you return':'Memories and passenger abilities','Use held memories as needed, then continue. Each copy is consumed; there is no use cap.');
    if(state.hand.length>C.handLimit)notice('Excess rewards cannot be played. Finish this round and choose what to keep.',true);
    if(!returning){
      const actions=el('div',null,'menu-actions');
      for(const q of game.activeQuests(state).filter(q=>q.definitionId==='QUEST-MEAL'))actions.append(button('Prepare the shared meal',()=>send({type:'MEAL',questId:q.id})));
      for(const priest of state.boat.filter(x=>x.type==='SOUL-PRIEST'&&!x.exhausted))actions.append(button('Priest: purify a passenger',()=>pickActor('Reset one passenger’s Anger to zero',state.boat.filter(x=>x.id!==priest.id),x=>send({type:'PURIFY',actorId:priest.id,target:x.id})), '', state.boat.length<2));
      stage.append(actions);
    }
    if(state.hand.length){const grid=el('div',null,'grid');for(const m of state.hand){const targets=game.memoryTargets(state,m.type);grid.append(memoryCard(m,null,null,state.hand.length>C.handLimit||(targets&&targets.length===0)));}stage.append(grid);}else paragraph(stage,'No memories held. Deliver passengers and complete quests to earn them.','intro');
    toolbar(returning?'Review return':'Approach the fork',()=>send(returning?{type:'PLAN',action:{type:'RETURN'}}:{type:'START_CROSSING'}));
  }
  function renderOffers(interactive) {
    const offers=game.routeView(state),section=el('section',null,'offers');section.append(el('h2',interactive?'The current fork':'The first fork'));
    offers.forEach((pair,i)=>{
      if(i)section.append(el('h3','Foresight: fork '+(i+1)));
      const grid=el('div',null,'grid');
      for(const opt of pair){
        const name=opt.hidden?'Concealed route':DEST[opt.destination].name;
        const p=interactive&&i===0?game.preview(state,opt.option):null;
        const lines=opt.hidden?['Po Mued conceals this destination. Confirm to reveal it and pay its fog.']:p?[p.payment+' Light · '+p.remaining+' remaining','Base '+p.base+' + tainted '+p.tainted+' + overload '+p.overload]:['Base fog '+DEST[opt.destination].fog];
        grid.append(choiceCard({label:(interactive&&i===0?'Choose option '+(opt.option+1)+': ':'Route: ')+name,title:name,lines,art:opt.hidden?null:ART[opt.destination],disabled:!(interactive&&i===0),onPick:()=>send({type:'PLAN',action:{type:'CROSS',option:opt.option}})}));
      }section.append(grid);
    });stage.append(section);
  }
  function renderRoute(){heading('Where next?','The round has begun and any scheduled Polong is aboard. Confirm one route to cross.');renderOffers(true);}
  function renderReview() {
    heading('Review your crossing','Back returns to the same fork without rerolling it.');
    const box=el('div',null,'review');
    if(state.pending.type==='CROSS'){
      const p=game.preview({...state,phase:'window'},state.pending.option);
      box.append(el('h2',p.hidden?'Concealed destination':DEST[p.destination].name));
      paragraph(box,p.hidden?'The destination and its fog remain hidden until you confirm. This may put out the lantern.':p.payment+' Light to cross; '+p.remaining+' remains.','numbers');
      if(!p.hidden&&p.lethal)notice('Zero Light ends the run before delivery.',true,box);
    }else{
      const due=state.shore.filter(x=>x.anger+1>=C.shoreAngerLimit),loss=Math.max(0,due.length*C.wraithDamage-state.window.guard);
      box.append(el('h2','Return to the Starting Shore'));paragraph(box,loss+' Light from waiting souls expiring, then +1 Light if alive.','numbers');
      paragraph(box,'Boat Space, Moly and Nobody expire on this return.');
      if(loss>=state.light)notice('The lantern goes out before healing.',true,box);
    }
    stage.append(box);toolbar('Confirm',()=>send({type:'CONFIRM'}),false,()=>send({type:'BACK'}));
  }
  function renderDelivery() {
    heading('Who disembarks at '+DEST[state.destination].name+'?','Choose eligible passengers. Those who remain face pair effects, Anger and Wraith expiry.');
    const grid=el('div',null,'grid soul-grid');for(const x of state.boat)grid.append(actorCard(x,'delivery'));stage.append(grid);
    if(!state.boat.length)paragraph(stage,'The encounter has left the boat empty. Finish resolving this round.','intro');
    const ids=[...selected].filter(id=>state.boat.some(x=>x.id===id&&!game.deliveryReason(state,x)));
    toolbar(ids.length?'Deliver selected passengers':'Keep everyone / finish round',()=>send({type:'DELIVER',ids}));
  }
  function renderChoice() {
    if(state.choice.kind==='odysseus'){
      heading('Tiresias offers two paths','Odysseus has disembarked. Choose how to continue; the random consequence is committed once when selected.');
      const grid=el('div',null,'grid');
      grid.append(choiceCard({label:'Choose Charybdis',title:'Charybdis',lines:['Lose one random held memory, if any.','Receive Moly of Hermes: suppress future Polong arrivals until the next return when played.'],onPick:()=>send({type:'CHOOSE',branch:'charybdis'})}));
      grid.append(choiceCard({label:'Choose Zilla',title:'Zilla',lines:['One random ordinary passenger becomes a Wraith: lose 1 Light. No eligible passenger means no loss.','If alive, receive Nobody: prevent fog until the next return when played.'],onPick:()=>send({type:'CHOOSE',branch:'zilla'})}));stage.append(grid);
    }else{
      heading('Po Luem takes a memory','Choose one held memory to lose. This choice is saved until you resolve it.');
      const grid=el('div',null,'grid');for(const m of state.hand)grid.append(memoryCard(m,()=>send({type:'CHOOSE',id:m.id}),'Lose '+MEM[m.type].name));stage.append(grid);
    }
  }
  function renderTrim(){heading('Keep up to '+C.handLimit+' memories','Choose excess memories to discard. They cannot be used instead.');const grid=el('div',null,'grid');for(const m of state.hand)grid.append(memoryCard(m,()=>send({type:'DISCARD_MEMORY',id:m.id}),'Discard '+MEM[m.type].name));stage.append(grid);}
  function renderEnded(){heading('The river remembers',state.ending);paragraph(stage,state.completed+' cycles survived · '+state.deliveries+' ordinary souls delivered · '+state.quests.filter(q=>q.status==='completed').length+' quests completed','numbers');toolbar('Start a new trial',()=>begin(slot));}
  function journal() {
    const box=el('section',null,'trip');box.append(el('h2','Passengers and quests'));
    const effects=Object.entries(state.effects).filter(([,on])=>on).map(([name])=>name);
    paragraph(box,'Active until return: '+(effects.join(', ')||'none')+'. Maximum Light '+state.maxLight+'.','hint');
    if(state.boat.length){const list=el('ul');for(const x of state.boat)list.append(el('li',SOUL[x.type].name+' · '+DEST[x.wish].name+' · Anger '+x.anger+(x.exhausted?' · Exhausted':'')));box.append(list);}
    const entries=state.quests.slice(-12);
    if(!entries.length)paragraph(box,'Pair the required characters on one departure to start an ordinary quest. Heroes have separate encounters.');
    for(const q of entries){const section=el('div',null,'quest-entry');section.append(el('h3',data.quests.find(d=>d.id===q.definitionId).name+' · '+q.status));paragraph(section,data.quests.find(d=>d.id===q.definitionId).description);paragraph(section,'Stage: '+q.stage+' · shared crossings '+q.sharedRoutes+' · delivered '+q.delivered.length+'/'+q.participants.length+(q.reason?' · '+q.reason:''),'hint');box.append(section);}
    const details=el('details');details.append(el('summary','River journal'));const list=el('ol');for(const entry of state.log.slice().reverse())list.append(el('li','Cycle '+entry.cycle+', round '+entry.round+': '+entry.text));details.append(list);box.append(details);stage.append(box);
  }
  function title() {
    const hero=el('div',null,'hero');hero.append(boat('docked'),el('h1','The Ferryman: quest trial'));paragraph(hero,'Carry souls to their wishes. Face the five Polongs. Follow eight repeatable stories along the river.','intro');stage.append(hero);
    const grid=el('div',null,'grid slot-grid');for(const n of SLOTS){const saved=slots[n];grid.append(choiceCard({label:'Save '+n+(saved?': continue':': new trial'),title:'Save '+n,lines:[saved?'Cycle '+saved.cycle+' · '+saved.light+'/'+saved.maxLight+' Light':broken[n]?'Unreadable trial save. Export/recover it before replacing.':'New local trial'],disabled:!!broken[n],onPick:()=>{if(saved){slot=n;state=saved;selected=new Set();render();}else begin(n);}}));}stage.append(grid);
    const all=el('details');all.append(el('summary','Quest reference'));for(const q of data.quests){all.append(el('h3',q.name));paragraph(all,q.description);}stage.append(all);
    if(data.pendingSouls?.length){
      const pending=el('section',null,'trip');pending.append(el('h2','Included souls awaiting rules'));
      paragraph(pending,'These characters belong to the roster. They become playable once their wishes, memories and abilities are defined.');
      for(const soul of data.pendingSouls){pending.append(el('h3',soul.name));paragraph(pending,soul.description);}
      stage.append(pending);
    }
  }
  function render() {
    closePopup();stage.replaceChildren();summary();notice(data.trial.notice);
    if(storageNote)notice(storageNote,true);
    const art=state?.destination?ART[state.destination]:ART['MAT-SHORE'];document.querySelector('.world').style.backgroundImage=art?'url("'+art+'")':'none';
    if(!state)title();else if(state.paused){heading('Trial paused','Resume to continue from the saved state.');toolbar('Resume',()=>send({type:'RESUME'}));}
    else{({boarding:renderBoarding,window:()=>state.travelPrepared?renderRoute():renderPreparation(),review:renderReview,delivery:renderDelivery,choice:renderChoice,trim:renderTrim,ended:renderEnded})[state.phase]();journal();}
    stage.focus();window.scrollTo(0,0);announce(state?state.phase+'. Light '+state.light+'.':'Choose a trial save.');
  }
  function exportSave(){const current=state||slots[slot];if(!current)return;const url=URL.createObjectURL(new Blob([game.exportSave(current)],{type:'application/json'}));const a=el('a');a.href=url;a.download='ferryman-'+data.version+'-cycle-'+current.cycle+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function openMenu() {
    menuContent.replaceChildren();paragraph(menuContent,data.trial.notice,'notice');
    for(const [key,value] of Object.entries(data.rules)){const details=el('details');details.append(el('summary',key));paragraph(details,value);menuContent.append(details);}
    const links=el('p');for(const [href,label] of [['RULES.md','Trial rules'],['TRIAL_RULES_DRAFT.md','Accepted temporary choices'],['IMPLEMENTATION_STATUS.md','Implementation status']]){const a=el('a',label);a.href=href;a.target='_blank';a.rel='noopener';links.append(a,document.createTextNode(' · '));}menuContent.append(links);
    const label=el('label','Seed for a new trial (optional)');label.htmlFor='seed';const seed=el('input');seed.id='seed';seed.type='number';seed.min=0;seed.max=4294967295;menuContent.append(label,seed);
    const message=el('p');message.setAttribute('role','status');
    const actions=el('div',null,'menu-actions');actions.append(button('New trial',()=>{const n=seed.value===''?crypto.getRandomValues(new Uint32Array(1))[0]:Number(seed.value);if(!Number.isInteger(n)||n<0||n>4294967295){message.textContent='Enter an unsigned 32-bit seed.';return;}if(begin(slot,n))menu.close();}),button('Export JSON',exportSave,'',!(state||slots[slot])),button('Save slots',()=>{state=null;menu.close();render();}),button('Pause trial',()=>{send({type:'STOP'});menu.close();},'',!state||state.phase==='ended'));
    menuContent.append(actions);
    const importLabel=el('label','Import current trial JSON (v0.6 saves stay in the old game)');importLabel.htmlFor='import-file';const input=el('input');input.type='file';input.id='import-file';input.accept='.json,application/json';
    input.addEventListener('change',async()=>{const file=input.files[0];if(!file)return;try{if(file.size>5000000)throw new Error('Save exceeds 5 MB.');const next=game.importSave(await file.text());if((state||slots[slot])&&!confirm('Replace trial Save '+slot+' with this imported run?'))return;state=next;selected=new Set();persist();menu.close();render();}catch(e){message.textContent='Import rejected: '+e.message+' Current trial unchanged.';}});
    menuContent.append(importLabel,input,message);menu.showModal();
  }
  document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();state=null;selected=new Set();render();});
  document.querySelector('#menu-button').addEventListener('click',openMenu);
  document.querySelector('#close-menu').addEventListener('click',()=>menu.close());
  render();
})();
