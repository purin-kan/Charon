(function () {
  'use strict';
  const E = window.FerrymanEngine;
  const $ = id => document.getElementById(id);
  if (!E) { $('storage-note').hidden = false; $('storage-note').textContent = 'The rules file could not load. Keep index.html, engine.js, app.js and styles.css in the same folder.'; return; }
  const SOUL = Object.fromEntries(E.SOULS.map(s => [s.id,s]));
  const MEMORY = Object.fromEntries(E.RESIDUES.map(r => [r.id,r]));
  const ROUTE = Object.fromEntries(E.ROUTES.map(r => [r.id,r]));
  const ASSET = {EL01:'elysium',AS01:'asphodel',TA01:'tartarus'};
  const KEY = 'the-ferryman-digital-paper-v1';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const names = ids => ids.length ? ids.map(id => SOUL[id].name).join(', ') : 'Empty boat';
  const blankSelection = () => ({routeId:'AS01',soulIds:[],memoryKey:null,targetId:null});
  const freshSession = () => ({schema:'ferryman-demo-1',rulesVersion:'0.2',startedAt:new Date().toISOString(),turnStartedAt:Date.now(),decisions:[],notes:'',selection:blankSelection()});
  let state = E.createGame();
  let session = freshSession();
  let selection = session.selection;
  let committing = false;
  let storageOK = true;
  let initialNotice = '';
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved.schema !== 'ferryman-demo-1' || saved.rulesVersion !== '0.2' || !Array.isArray(saved.decisions) || saved.decisions.length > 6) throw new Error('Incompatible save');
      let restored = E.createGame();
      for (const decision of saved.decisions) restored = E.resolve(restored, decision.selection).state;
      state = restored;
      session = {...freshSession(),...saved,notes:typeof saved.notes === 'string' ? saved.notes : ''};
      selection = {...blankSelection(),...saved.selection};
      selection.soulIds = Array.isArray(selection.soulIds) ? selection.soulIds.filter(id => state.shore.some(s => s.id === id)) : [];
      if (!ROUTE[selection.routeId]) selection.routeId = 'AS01';
      if (!state.hand.some(m => m.key === selection.memoryKey)) selection.memoryKey = null;
      initialNotice = 'Your last run on this browser has been restored. Use New run to start from the opening shore.';
    }
  } catch (err) {
    state = E.createGame(); session = freshSession(); selection = session.selection;
    initialNotice = 'A saved run could not be restored. A fresh run is ready. Export logs to keep a portable copy.';
  }

  function announce(message) { $('announcement').textContent = message; }
  function showNotice(message) { $('storage-note').hidden = false; $('storage-note').textContent = message; }
  function save() {
    session.selection = {...selection,soulIds:[...selection.soulIds]};
    try {
      localStorage.setItem(KEY, JSON.stringify(session));
      storageOK = true;
      $('save-status').textContent = 'Saved in this browser. Export the play log to keep or share a copy.';
    } catch (err) {
      storageOK = false;
      $('save-status').textContent = 'Browser saving is unavailable. Export your play log before closing.';
      showNotice('The demo works, but this browser is blocking local saving. Export your play log before closing the tab.');
    }
  }
  function cleanTarget() {
    const memory = state.hand.find(m => m.key === selection.memoryKey);
    const eligible = memory && ['R03','R05'].includes(memory.type);
    if (!eligible || !state.shore.some(s => s.id === selection.targetId && !selection.soulIds.includes(s.id))) selection.targetId = null;
  }
  function row(label,value,style='') { return `<div class="preview-row ${style}"><span>${label}</span><strong>${value}</strong></div>`; }
  function memoryName(m) { return `${MEMORY[m.type].name} / ${SOUL[m.sourceId].name} (${m.sourceId})`; }
  function referenceMarkup() {
    $('soul-reference').innerHTML = E.SOULS.map(s => `<details class="journal-item"><summary><span>${s.id} / ${esc(s.name)}</span><span>${s.seats} seats · ${s.fare} fare · ${s.standing} arrival Standing</span></summary><p>“${esc(s.flavor)}”</p><p><strong>Aboard and relationship rule:</strong> ${esc(s.effect)}</p><p><strong>Memory on arrival:</strong> ${esc(s.residue)}. ${s.partner ? 'Joint memory requires both partners to arrive on the same crossing. Later delivery never upgrades an earlier solo memory.' : ''}</p></details>`).join('');
    $('residue-reference').innerHTML = E.RESIDUES.map(m => `<p><strong>${m.id} / ${esc(m.name)}:</strong> ${esc(m.effect)}</p>`).join('');
  }
  function statusMarkup() {
    const finished = state.status !== 'playing';
    const passed = new Set(state.log.filter(r => !['pressure','quota'].includes(r.outcome)).map(r => r.crossing));
    $('status-bar').innerHTML = `<div class="stat"><span class="stat-label">CROSSING</span><span class="stat-value">${state.crossing} <small>/ 6</small></span><span class="stat-hint">${finished ? (state.status==='won'?'Trial complete':'Run ended'):'Shore ready. Plan your departure.'}</span></div><div class="stat"><span class="stat-label">OBOLS</span><span class="stat-value">${state.obols}</span><span class="stat-hint">Fares, tolls and quotas</span></div><div class="stat"><span class="stat-label">STANDING</span><span class="stat-value">${state.standing}</span><span class="stat-hint">River pressure and memories</span></div><div class="stat"><span class="stat-label">THE SIX CROSSINGS</span><div class="quota-track">${Array.from({length:6},(_,i)=>`<span class="crossing-dot ${[3,6].includes(i+1)?'quota':''} ${passed.has(i+1)?'done':''} ${i+1===state.crossing?'current':''}" title="Crossing ${i+1}${[3,6].includes(i+1)?': pay 3 obols after arrival':''}">${i+1}</span>`).join('')}</div><span class="stat-hint">Pay 3 obols after crossings 3 and 6</span></div>`;
    $('terminal').hidden = !finished;
    if (finished) {
      $('terminal').className = state.status === 'lost' ? 'lost' : '';
      const cause = state.lossReason === 'pressure' ? 'River pressure exceeded Standing. The last crossing ended before arrival, so its rewards and refusal changes did not happen.' : 'The 3-obol quota could not be paid. Arrival rewards were collected, but no further refusal changes or cleanup occurred.';
      $('terminal').innerHTML = `<p class="eyebrow">${state.status==='won'?'SIX CROSSINGS COMPLETED':'A VALID PLAYTEST OUTCOME'}</p><h2>${state.status==='won'?'The ferry has finished its duty.':'This run has ended.'}</h2><p>${state.status==='won'?`Both quotas paid. ${state.history.length} souls delivered; ${state.wraiths.length} became wraiths.`:cause} Record what influenced your choices, export the log, then start another run.</p>`;
    }
  }
  function shoreMarkup() {
    const locked = state.status !== 'playing';
    $('shore-count').textContent = `${state.shore.length} waiting · ${state.supply.length} still to arrive`;
    $('soul-cards').innerHTML = state.shore.map(item => {
      const s = SOUL[item.id], chosen = selection.soulIds.includes(s.id);
      const effect = s.partner ? `Linked to <strong>${esc(SOUL[s.partner].name)}</strong>. Together: R05. Apart: R06 and extra refusal for a waiting partner.` : esc(s.effect);
      return `<button id="soul-${s.id}" class="soul-card ${chosen?'selected':''}" data-soul="${s.id}" aria-pressed="${chosen}" aria-label="${chosen?'Unboard':'Board'} ${esc(s.name)}. ${s.seats} seats, ${s.fare} fare, ${s.standing} Standing, ${item.refusals} refusals. ${esc(s.effect)} Memory: ${esc(s.residue)}." ${locked?'disabled':''}><span class="card-id"><span>${s.id}</span><span class="boarding">${chosen?'ABOARD':'SELECT TO BOARD'}</span></span><span class="soul-name">${esc(s.name)}</span><span class="soul-quote">“${esc(s.flavor)}”</span><span class="soul-stats"><span><strong>${s.seats}</strong><small>SEATS</small></span><span><strong>${s.fare}</strong><small>FARE</small></span><span><strong>${s.standing}</strong><small>STANDING</small></span></span><span class="soul-effect">${effect}</span><span class="soul-bottom"><span>MEMORY ${esc(s.partner?'R05 / R06':s.residue)}</span><span class="refusal-track" aria-label="${item.refusals} of 3 refusals">${[0,1,2].map(i=>`<span aria-hidden="true" class="refusal-pip ${i<item.refusals?'filled':''} ${i===2?'last':''}"></span>`).join('')}<span>${item.refusals}/3</span></span></span></button>`;
    }).join('') || '<div class="empty-state"><strong>The shore is empty.</strong>' + (locked ? 'This run has ended. Review the crossing journal or start a new run.' : 'The remaining crossings, river pressure and quotas still apply. An empty departure is legal.') + '</div>';
    $('wraiths').innerHTML = state.wraiths.length ? `<div class="waiting-alert"><strong>${state.wraiths.length} active wraith${state.wraiths.length===1?'':'s'} · +${state.wraiths.length} pressure</strong><br>${state.wraiths.map(w=>esc(SOUL[w.id].name)).join(', ')}. They cannot board and persist for this trial.</div>` : '';
  }
  function memoriesMarkup() {
    const emptyHandText = state.status !== 'playing' ? 'The run has ended. Cards already discarded remain visible in Memory order.' : state.crossing === 1 ? 'Each soul you deliver leaves a memory for later crossings. The first crossing begins without any.' : 'No memories were available to recall this crossing. You can depart without playing one.';
    $('memory-cards').innerHTML = state.hand.map(m => `<button id="choose-${m.key}" class="memory-card ${m.key===selection.memoryKey?'selected':''}" data-memory="${m.key}" aria-pressed="${m.key===selection.memoryKey}" ${state.status!=='playing'?'disabled':''}><span class="card-id">${m.type} · ${m.key===selection.memoryKey?'SELECTED / CLICK TO CLEAR':'OPTIONAL / COST 1 STANDING'}</span><span class="memory-title">${esc(MEMORY[m.type].name)}</span><span class="memory-source">From ${esc(SOUL[m.sourceId].name)} · ${m.sourceId}</span><span class="memory-effect">${esc(MEMORY[m.type].effect)}</span></button>`).join('') || '<div class="empty-state"><strong>No memories in hand.</strong>' + emptyHandText + '</div>';
    const memory = state.hand.find(m=>m.key===selection.memoryKey);
    const waiting = state.shore.filter(s=>!selection.soulIds.includes(s.id));
    const needsTarget = memory && ['R03','R05'].includes(memory.type);
    $('target-control').innerHTML = needsTarget && state.status==='playing' ? waiting.length ? `<div class="target-box"><label for="memory-target">Protect a waiting soul from its normal refusal</label><select id="memory-target"><option value="">Choose a waiting soul...</option>${waiting.map(s=>`<option value="${s.id}" ${selection.targetId===s.id?'selected':''}>${esc(SOUL[s.id].name)} (${s.refusals}/3 refusals)</option>`).join('')}</select><p>Extra refusal from separating partners still applies.</p></div>` : '<div class="target-box"><p>No soul is staying ashore. This memory remains playable; its refusal protection has no target.</p></div>' : '';
    $('memory-summary').textContent = `Memory order · ${state.queue.length} in queue · ${state.discard.length} in discard`;
    const order = (items,empty)=>items.length?`<ol>${items.map(m=>`<li>${esc(memoryName(m))}</li>`).join('')}</ol>`:`<span class="subtle">${empty}</span>`;
    $('memory-order').innerHTML = `<div><h3>DRAW QUEUE / NEXT FIRST</h3>${order(state.queue,'Empty')}</div><div><h3>DISCARD / OLDEST FIRST</h3>${order(state.discard,'Empty')}</div>`;
  }
  function routesMarkup() {
    $('route-cards').innerHTML = E.ROUTES.map(r=>`<button id="route-${r.id}" class="route-card ${selection.routeId===r.id?'selected':''}" data-route="${r.id}" aria-pressed="${selection.routeId===r.id}" aria-label="${esc(r.name)}. Toll ${r.toll}, pressure ${r.pressure}. ${r.id==='TA01'?'One service obol if at least one soul arrives.':'Collect printed soul rewards.'}" ${state.status!=='playing'?'disabled':''}><img src="assets/${ASSET[r.id]}.png" alt="" loading="lazy"><span class="route-body"><span class="route-name">${esc(r.name)}</span><span class="route-theme">${esc(r.theme.toUpperCase())}</span><span class="route-stats"><span>${r.toll} TOLL</span><span>${r.pressure} PRESSURE</span></span><span class="route-bonus">${r.id==='TA01'?'+1 service obol if at least one soul arrives.':'Collect each delivered soul’s printed rewards.'}</span><span class="route-selected">${selection.routeId===r.id?'SELECTED ROUTE':'CHOOSE ROUTE'}</span></span></button>`).join('');
  }
  function previewMarkup() {
    if (state.status !== 'playing') {
      $('preview').innerHTML = `<div class="preview-body"><p class="manifest">${state.status==='won'?'Trial complete':'Run ended on crossing '+state.crossing}</p>${row('Souls delivered',state.history.length)}${row('Wraiths',state.wraiths.length)}${row('Obols remaining',state.obols)}${row('Standing remaining',state.standing)}<hr class="preview-separator"><p class="subtle">Use the journal below to discuss the run. Early failure is useful evidence too.</p><button class="primary" data-action="export">Export this play log</button><button class="quiet" data-action="reset">Start a new run</button></div>`;
      return;
    }
    const p = E.preview(state, selection);
    const failed = p.valid && p.wouldFail;
    const waiting = p.waiting.length ? `<ul class="decay-list">${p.waiting.map(w=>`<li><span>${esc(SOUL[w.id].name)}${w.separation?' <small>(+1 separation)</small>':''}${w.prevented?' <small>(protected)</small>':''}</span><strong class="${w.becomesWraith?'result-failure':''}">${w.before} → ${w.after}${w.becomesWraith?' / wraith':''}</strong></li>`).join('')}</ul>` : '<p class="subtle">No one remains waiting.</p>';
    let message = '';
    if (!p.valid) message = `<div class="warning"><strong>Before you can depart</strong><ul class="invalid-list">${p.errors.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></div>`;
    else if (p.wouldFail==='pressure') message = `<div class="warning"><strong>This departure ends the run.</strong>Pressure ${p.pressure} exceeds ${p.standingAfterLoad} Standing after costs. No arrival rewards or refusal changes will happen.</div>`;
    else if (p.wouldFail==='quota') message = `<div class="warning"><strong>This departure ends at the quota.</strong>You will have ${p.projectedObols} obols after arrival; 3 are required. Decay will not happen.</div>`;
    else if (!p.passengerIds.length) message = '<p class="subtle">Empty departure: legal. Costs, pressure, quotas and refusals still apply.</p>';
    const projection = p.valid ? `${row('Obols after crossing',`${state.obols} → ${p.projectedObols}`)}${row('Standing after crossing',`${state.standing} → ${p.projectedStanding}`)}` : '<p class="subtle">Complete a legal choice to see the final resources.</p>';
    $('preview').innerHTML = `<div class="preview-body"><div class="boat-capacity"><span>${p.seats} / 4 SEATS</span><span class="seat-dots" aria-hidden="true">${[0,1,2,3].map(i=>`<span class="seat-dot ${i<p.seats?'used':''} ${p.seats>4?'over':''}"></span>`).join('')}</span></div><p class="manifest">${esc(names(p.passengerIds))}</p><p class="preview-label">PAY BEFORE DEPARTURE</p>${row('Route toll',`${p.toll} obol${p.toll===1?'':'s'}`)}${row('Memory cost',`${p.memoryCost} Standing`)}<p class="preview-label">RIVER PRESSURE</p>${row(esc(ROUTE[selection.routeId].name),p.routePressure)}${row('Active wraiths',`+${p.wraithPressure}`)}${row('Aboard conflict',`+${p.conflictPressure}`)}${row(`Protection${p.protectionSources.length?'<br><small>'+p.protectionSources.map(s=>esc(s.label)).join(', ')+'</small>':''}`,`−${p.protection}`,'good')}${row('Total pressure',p.pressure,'total')}${row('Standing after departure costs',p.valid?p.standingAfterLoad:'Not ready')}<p class="preview-label">${p.wouldFail==='pressure'&&p.valid?'ARRIVAL WILL NOT BE REACHED':'ON SUCCESSFUL ARRIVAL'}</p>${row('Fares + service',`+${p.fares+p.service} obols`)}${row('Standing earned',`+${p.standingYield}`)}${row('Memories acquired',`${p.newMemories.length}`)}${p.newMemories.length?`<p class="subtle">${p.newMemories.map(m=>`${esc(SOUL[m.sourceId].name)}: ${esc(m.type)}`).join(' · ')}</p>`:''}${p.quotaDue?row('Quota after arrival','−3 obols','danger'):''}<hr class="preview-separator">${projection}<p class="preview-label">${failed?'DECAY NOT REACHED':'WAITING SOULS AFTER DECAY'}</p>${failed?'<p class="subtle">The run ends before refusals are updated.</p>':waiting}${message}<button id="depart-btn" class="primary ${failed?'danger':''}" ${!p.valid?'disabled':''}>${failed?'Depart and end this run':'Confirm departure'}</button><p class="confirm-note">Choices lock at departure. No reactive plays.</p></div>`;
  }
  function stepsMarkup(result) { return `<ol class="phase-list">${result.steps.map(s=>`<li><strong>${esc(s.phase)}</strong>${esc(s.text)}</li>`).join('')}</ol>`; }
  function journalMarkup() {
    $('journal').innerHTML = state.log.length ? [...state.log].reverse().map(r=>`<details class="journal-item"><summary><span>Crossing ${r.crossing} · ${esc(ROUTE[r.routeId].name)}</span><span>${['pressure','quota'].includes(r.outcome)?'RUN ENDED':r.outcome==='won'?'COMPLETE':r.passengerIds.length+' DELIVERED'}</span></summary><p>${esc(names(r.passengerIds))}<br>Memory: ${r.memory?esc(memoryName(r.memory)):'None'}${r.targetId?' / target '+esc(SOUL[r.targetId].name):''}</p><p>Obols ${r.before.obols} → ${r.after.obols} · Standing ${r.before.standing} → ${r.after.standing}</p>${stepsMarkup(r)}</details>`).join('') : '<div class="empty-state"><strong>Your first departure is still ahead.</strong>Each completed action will appear here, including any failure. Use the notes to record what the numbers cannot explain.</div>';
    $('history').innerHTML = `<div class="history-list">${state.history.map(h=>`<span class="history-chip">${esc(SOUL[h.soulId].name)} → ${esc(ROUTE[h.routeId].name)} · crossing ${h.crossing} · ${esc(h.residueType)}</span>`).join('') || '<span class="subtle">No deliveries yet.</span>'}</div><p><strong>Remaining supply, in order:</strong> ${state.supply.length?state.supply.map(id=>`${id} ${esc(SOUL[id].name)}`).join(' → '):'Exhausted. No new souls will arrive.'}</p>`;
  }
  function render() {
    const focusId = document.activeElement?.id;
    const openJournals = [...document.querySelectorAll('#journal details')].map((d,i)=>d.open?i:-1).filter(i=>i>=0);
    cleanTarget();statusMarkup();shoreMarkup();memoriesMarkup();routesMarkup();previewMarkup();journalMarkup();
    openJournals.forEach(i=>{const d=$('journal').children[i];if(d)d.open=true;});
    if (focusId && $(focusId)) $(focusId).focus({preventScroll:true});
  }
  function showResult(result) {
    const failed = ['pressure','quota'].includes(result.outcome);
    $('result-content').innerHTML = `<h2 id="result-title">${failed?'The crossing ends here.':result.outcome==='won'?'Six crossings. Duty fulfilled.':'The far bank.'}</h2><p>${esc(names(result.passengerIds))} · ${esc(ROUTE[result.routeId].name)}</p><div class="result-stats"><div class="result-stat">OBOLS<strong>${result.before.obols} → ${result.after.obols}</strong></div><div class="result-stat">STANDING<strong>${result.before.standing} → ${result.after.standing}</strong></div></div>${failed?'<p class="result-failure">'+(result.outcome==='pressure'?'Pressure exceeded available Standing. No arrival rewards were collected.':'Arrival succeeded, but the 3-obol quota could not be paid.')+'</p>':''}${result.newMemories.length?`<p><strong>New memories:</strong> ${result.newMemories.map(m=>esc(memoryName(m))).join('; ')}.</p>`:''}${stepsMarkup(result)}`;
    $('result-continue').textContent = state.status==='playing'?`Plan crossing ${state.crossing}`:'Review the run';
    $('result-dialog').showModal();
    $('result-continue').focus();
  }
  function depart() {
    if (committing || state.status!=='playing' || $('result-dialog').open) return;
    const p = E.preview(state,selection);
    if (!p.valid) { announce(p.errors.join(' '));return; }
    committing=true;
    try {
      const decision = E.clone(selection);
      const {state:next,result} = E.resolve(state,decision);
      session.decisions.push({selection:decision,at:new Date().toISOString(),planningWallSeconds:Math.max(0,Math.round((Date.now()-session.turnStartedAt)/1000))});
      session.turnStartedAt=Date.now();state=next;selection=blankSelection();save();render();showResult(result);
      announce(`Crossing ${result.crossing} resolved. ${state.obols} obols, ${state.standing} Standing. ${state.status==='playing'?'Next shore is ready.':'The run has ended.'}`);
    } catch(err) {showNotice('The crossing could not resolve: '+err.message);announce(err.message);}
    finally{committing=false;}
  }
  function exportLog() {
    const payload={title:'The Ferryman digital paper trial',format:'ferryman-play-log-1',rulesVersion:'0.2',exportedAt:new Date().toISOString(),startedAt:session.startedAt,timingNote:'Planning wall time includes pauses, closed tabs and time reading results. This is not active decision time.',decisions:session.decisions,notes:session.notes,currentSelection:selection,finalState:state};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Ferryman_Play_Log_${new Date().toISOString().replace(/[:.]/g,'-')}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);announce('The play log has been exported.');
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button||button.disabled)return;
    if(button.dataset.close){$(button.dataset.close).close();return;}
    if(button.dataset.soul && state.status==='playing'){
      const id=button.dataset.soul;selection.soulIds=selection.soulIds.includes(id)?selection.soulIds.filter(s=>s!==id):[...selection.soulIds,id];cleanTarget();save();render();
      const p=E.preview(state,selection);announce(`${p.seats} of 4 seats selected.${p.seats>4?' Remove a passenger before departure.':''}`);return;
    }
    if(button.dataset.memory && state.status==='playing'){selection.memoryKey=selection.memoryKey===button.dataset.memory?null:button.dataset.memory;selection.targetId=null;save();render();return;}
    if(button.dataset.route && state.status==='playing'){selection.routeId=button.dataset.route;save();render();announce(`${ROUTE[selection.routeId].name} selected.`);return;}
    if(button.id==='depart-btn'){depart();return;}
    if(button.id==='help-btn'){$('help-dialog').showModal();return;}
    if(['export-btn','export-reset'].includes(button.id)||button.dataset.action==='export'){exportLog();return;}
    if(button.id==='reset-btn'||button.dataset.action==='reset'){$('reset-dialog').showModal();return;}
    if(button.id==='confirm-reset'){
      state=E.createGame();session=freshSession();selection=session.selection;$('notes').value='';$('reset-dialog').close();save();render();$('storage-note').hidden=storageOK;
      $('shore').scrollIntoView({behavior:'auto',block:'start'});announce('New run ready. Two obols, three Standing, opening five souls.');
    }
  });
  document.addEventListener('change',event=>{if(event.target.id==='memory-target'){selection.targetId=event.target.value||null;save();previewMarkup();}});
  $('notes').addEventListener('input',()=>{session.notes=$('notes').value;save();});
  $('notes').value=session.notes;
  referenceMarkup();render();if(initialNotice)showNotice(initialNotice);save();
})();


