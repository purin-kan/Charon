'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const g=require('../engine.js'),root=path.resolve(__dirname,'..'),records=[];
const def=id=>g.data.souls.find(x=>x.id===id),mid=kind=>g.data.memories.find(x=>x.kind===kind)?.id;
const act=(s,type,fields={})=>g.transition(s,{type,...fields});
const find=(s,type)=>s.boat.find(x=>x.type===type)||s.shore.find(x=>x.type===type);
const copy=g.clone,rt=s=>assert.deepEqual(g.importSave(g.exportSave(s)),s);
function check(name,run){try{records.push({name,status:'PASS',...(run()||{})});}catch(e){records.push({name,status:'FAIL',error:e.stack});}}
function actor(s,type,origin=def(type).ordinary?type:null){const x={id:'ACTOR-'+s.nextActor,type,origin,wish:def(type).wish,anger:0,boardingId:null,bornRound:s.round,level:0,spread:false,exhausted:false};s.nextActor=String(BigInt(s.nextActor)+1n);return x;}
function shore(types,seed=17){const s=g.create(seed);s.shore=types.map(type=>actor(s,type));s.arrivals=g.data.souls.filter(x=>x.ordinary&&!types.includes(x.id)).map(x=>x.id);s.discard=[];s.maxLight=30;s.light=30;g.validate(s);return s;}
function boat(types){let s=shore(types);for(const x of s.shore)s=act(s,'BOARD',{id:x.id});s=act(s,'DEPART');s.effects.moly=true;return s;}
function route(s,dest){s=copy(s);s.routes.offers[0]=[dest,dest==='DEST-HAVEN'?'DEST-STYX':'DEST-HAVEN'];return s;}
function cross(s,dest){if(!s.travelPrepared)s=act(s,'START_CROSSING');s=route(s,dest);return act(s,'CROSS',{option:0});}
function step(s,dest,types=[]){s=cross(s,dest);return act(s,'DELIVER',{ids:types.map(type=>find(s,type).id)});}
function polong(s,type,level=1,anger=0){const x=actor(s,type,null);x.level=level;x.anger=anger;x.boardingId=String(BigInt(s.nextBoarding)-1n);s.boat.push(x);return x;}
function memory(s,type,character){
  let ref;
  if(character){const x=find(s,character);ref={kind:'character',definitionId:character,instanceId:x.id};}
  else{
    const defs={'MEM-PASSAGE':'QUEST-FAMILY','MEM-LAST-MASTERWORK':'QUEST-SWORD','MEM-SOLDIER-PEACE':'QUEST-SOLDIERS','MEM-BOAT-SPACE':'QUEST-BOAT','MEM-GOLDEN-APPLE':'QUEST-HERACLES','MEM-MOLY':'QUEST-ODYSSEUS','MEM-NOBODY':'QUEST-ODYSSEUS'};
    const definition=g.data.quests.find(q=>q.id===defs[type]);
    const participants=definition.roles.map(role=>actor(s,role).id);
    if(definition.id==='QUEST-HERACLES')participants.push(actor(s,'CHAR-CERBERUS').id);
    const q={id:'QUEST-'+s.nextQuest,definitionId:defs[type],participants,status:'completed',stage:'completed',sharedRoutes:0,delivered:participants.slice(),rewardClaimed:true,rewardType:type,reason:null,cycle:s.cycle,data:{}};
    s.nextQuest=String(BigInt(s.nextQuest)+1n);s.quests.push(q);ref={kind:'quest',definitionId:q.definitionId,instanceId:q.id};
  }
  const m={id:'MEMORY-'+s.nextMemory,type,sourceRef:ref};s.nextMemory=String(BigInt(s.nextMemory)+1n);s.hand.push(m);return m.id;
}
const quest=(s,id)=>s.quests.find(q=>q.definitionId===id&&q.status==='active')||s.quests.find(q=>q.definitionId===id);

check('Included roster, explicit TBA entries, six destinations without Heaven and all quest definitions',()=>{
 const s=g.create(42);assert.equal(g.data.destinations.length,6);assert.ok(!g.data.destinations.some(d=>d.id==='DEST-HEAVEN'));
 assert.ok(g.data.souls.every(x=>g.data.destinations.some(d=>d.id===x.wish)));assert.equal(def('SOUL-PRIEST').wish,'DEST-HAVEN');assert.equal(def('SOUL-CHILD').wish,'DEST-HAVEN');
 assert.equal(g.data.souls.filter(x=>x.name==='Bard').length,1);assert.equal(def('SOUL-MUSICIAN').memory,'MEM-CALM');assert.ok(g.data.souls.filter(x=>x.ordinary).every(x=>x.personalName));
 assert.equal(g.data.quests.length,8);assert.equal(g.data.souls.filter(x=>x.ordinary).length,15);
 for(const id of ['SOUL-SOLDIER','SOUL-DRUG-DEALER','SOUL-FOOL','SOUL-KILLER','SOUL-TAGRID','SOUL-POZEUS'])assert.ok(!g.data.souls.some(x=>x.id===id));
 assert.ok(g.data.souls.some(x=>x.id==='SOUL-PO-NAK'));
 assert.deepEqual(g.data.pendingSouls.map(x=>x.id),['SOUL-DRUG-DEALER','SOUL-FOOL','SOUL-KILLER']);
 assert.ok(g.data.pendingSouls.every(x=>x.wish===null&&x.memory===null&&x.ability===null));rt(s);
});
check('Family binds same departure, respects Haven/order, grants distinct rewards',()=>{
 let s=boat(['SOUL-MOTHER','SOUL-CHILD']);const ids=s.boat.map(x=>x.id);
 s=step(s,'DEST-HAVEN',['SOUL-CHILD']);assert.equal(quest(s,'QUEST-FAMILY').stage,'child-delivered');
 s=step(s,'DEST-TARTARUS',['SOUL-MOTHER']);assert.equal(quest(s,'QUEST-FAMILY').status,'completed');
 assert.deepEqual(s.hand.map(m=>m.type),['MEM-PASSAGE','MEM-LIGHT']);assert.deepEqual(quest(s,'QUEST-FAMILY').participants,ids);rt(s);
 let reversed=boat(['SOUL-MOTHER','SOUL-CHILD']);reversed=step(reversed,'DEST-TARTARUS',['SOUL-MOTHER']);assert.equal(quest(reversed,'QUEST-FAMILY').status,'failed');
 assert.ok(!boat(['SOUL-CHILD']).quests.some(q=>q.definitionId==='QUEST-FAMILY'));
});
check('Fresh returned character instances start a new quest without reusing rewards',()=>{
 let s=boat(['SOUL-MOTHER','SOUL-CHILD']);s=step(s,'DEST-HAVEN',['SOUL-CHILD']);s=step(s,'DEST-TARTARUS',['SOUL-MOTHER']);const old=quest(s,'QUEST-FAMILY');s=act(s,'RETURN');
 // Fixture advances these resolved roster origins to the next arrival, preserving conservation.
 for(const type of ['SOUL-MOTHER','SOUL-CHILD']){s.shore=s.shore.filter(x=>x.origin!==type);s.arrivals=s.arrivals.filter(id=>id!==type);s.discard=s.discard.filter(id=>id!==type);s.shore.push(actor(s,type));}
 for(const type of ['SOUL-MOTHER','SOUL-CHILD'])s=act(s,'BOARD',{id:find(s,type).id});s=act(s,'DEPART');
 const fresh=s.quests.find(q=>q.definitionId==='QUEST-FAMILY'&&q.status==='active');assert.notEqual(fresh.id,old.id);assert.ok(fresh.participants.every(id=>!old.participants.includes(id)));assert.equal(old.rewardClaimed,true);rt(s);
});
check('Soldier penalty every second retained shared crossing, separate pair reward',()=>{
 let s=boat(['SOUL-RED-SOLDIER','SOUL-BLUE-SOLDIER','SOUL-COOK']);
 s=step(s,'DEST-HAVEN');assert.equal(find(s,'SOUL-COOK').anger,1);
 s=step(s,'DEST-HAVEN');assert.equal(find(s,'SOUL-COOK').anger,3);assert.equal(find(s,'SOUL-RED-SOLDIER').anger,2);
 s=step(s,'DEST-STYX',['SOUL-RED-SOLDIER','SOUL-BLUE-SOLDIER']);assert.equal(quest(s,'QUEST-SOLDIERS').status,'completed');assert.equal(s.hand.filter(m=>m.type==='MEM-ALL-FOG').length,2);assert.ok(s.hand.some(m=>m.type==='MEM-SOLDIER-PEACE'));
});
check('Listener transforms on third shared crossing, keeps origin and coexists with Poet',()=>{
 let s=boat(['SOUL-MUSICIAN','SOUL-LISTENER','SOUL-POET']);const listener=find(s,'SOUL-LISTENER').id;
 s=step(s,'DEST-HAVEN');s=step(s,'DEST-HAVEN');assert.ok(find(s,'SOUL-LISTENER'));
 s=step(s,'DEST-HAVEN');assert.equal(s.boat.filter(x=>x.type==='SOUL-POET').length,2);const x=s.boat.find(x=>x.id===listener);assert.equal(x.origin,'SOUL-LISTENER');assert.equal(x.anger,3);assert.equal(quest(s,'QUEST-LISTENER').status,'completed');rt(s);
});
check('Meal is once per shared boarding, includes Cook reduction and can expire Cook',()=>{
 let s=boat(['SOUL-FARMER','SOUL-COOK']);find(s,'SOUL-COOK').anger=2;find(s,'SOUL-FARMER').anger=2;
 const q=quest(s,'QUEST-MEAL');s=act(s,'MEAL',{questId:q.id});assert.equal(find(s,'SOUL-COOK').anger,3);assert.equal(find(s,'SOUL-FARMER').anger,1);assert.throws(()=>act(s,'MEAL',{questId:q.id}));
 let lethal=boat(['SOUL-FARMER','SOUL-COOK']);find(lethal,'SOUL-COOK').anger=3;const before=lethal.light;lethal=act(lethal,'MEAL',{questId:quest(lethal,'QUEST-MEAL').id});assert.ok(!find(lethal,'SOUL-COOK'));assert.equal(lethal.light,before-1);rt(lethal);
});
check('Merchant protection is story only; Sword only when Merchant is delivered before Blacksmith',()=>{
 let s=boat(['SOUL-MERCHANT','SOUL-BLACKSMITH']);s=step(s,'DEST-HAVEN');assert.equal(find(s,'SOUL-MERCHANT').anger,1);assert.equal(find(s,'SOUL-BLACKSMITH').anger,1);
 assert.equal(g.deliveryReason({...s,destination:'DEST-ACHERON'},find(s,'SOUL-BLACKSMITH')),null);
 s=step(s,'DEST-STYX',['SOUL-MERCHANT']);s=step(s,'DEST-ACHERON',['SOUL-BLACKSMITH']);assert.equal(quest(s,'QUEST-SWORD').status,'completed');assert.equal(s.hand.filter(m=>m.type==='MEM-LAST-MASTERWORK').length,1);rt(s);
 let reversed=boat(['SOUL-MERCHANT','SOUL-BLACKSMITH']);reversed=step(reversed,'DEST-ACHERON',['SOUL-BLACKSMITH']);assert.equal(quest(reversed,'QUEST-SWORD').status,'failed');
 reversed=step(reversed,'DEST-STYX',['SOUL-MERCHANT']);assert.ok(!reversed.hand.some(m=>m.type==='MEM-LAST-MASTERWORK'));
 let clash=shore(['SOUL-MERCHANT','SOUL-BLACKSMITH','SOUL-MASON']);for(const x of clash.shore)clash=act(clash,'BOARD',{id:x.id});assert.throws(()=>act(clash,'DEPART'),/both/);
});
check('Mason leaves last including Polongs; capacity can be used before boarding and expires',()=>{
 let s=boat(['SOUL-MERCHANT','SOUL-MASON']);const p=polong(s,'SOUL-POLONG');
 s=step(s,'DEST-STYX',['SOUL-MERCHANT']);assert.match(g.deliveryReason({...s,destination:'DEST-ACHERON'},find(s,'SOUL-MASON')),/last/);
 s=step(s,'DEST-TARTARUS',['SOUL-POLONG']);s=step(s,'DEST-ACHERON',['SOUL-MASON']);assert.equal(quest(s,'QUEST-BOAT').status,'completed');
 s=act(s,'RETURN');const m=s.hand.find(m=>m.type==='MEM-BOAT-SPACE');s=act(s,'PLAY_MEMORY',{id:m.id});assert.equal(g.capacity(s),5);assert.equal(s.phase,'boarding');
 for(const x of s.shore)s=act(s,'BOARD',{id:x.id});assert.equal(g.seats(s),5);s=act(s,'DEPART');
 // Empty-boat return fixture only verifies the effect boundary, not survival balance.
 s.discard.push(...s.boat.map(x=>x.origin));s.boat=[];s.window.kind='return';for(const q of s.quests)if(q.status==='active'){q.status='failed';q.reason='fixture resolved participants';}s=act(s,'RETURN');assert.equal(g.capacity(s),4);
});
check('Priest +1 memory or purification trade-off, once per boarding and save/reload',()=>{
 let s=boat(['SOUL-PRIEST','SOUL-COOK']);const priest=find(s,'SOUL-PRIEST'),cook=find(s,'SOUL-COOK');cook.anger=3;
 s=act(s,'PURIFY',{actorId:priest.id,target:cook.id});assert.equal(find(s,'SOUL-COOK').anger,0);assert.equal(find(s,'SOUL-PRIEST').exhausted,true);rt(s);assert.throws(()=>act(s,'PURIFY',{actorId:priest.id,target:cook.id}));
 s=step(s,'DEST-HAVEN',['SOUL-PRIEST']);assert.ok(!s.hand.some(m=>m.type==='MEM-LAST-PRAYER'));
 let normal=boat(['SOUL-PRIEST']);normal=step(normal,'DEST-HAVEN',['SOUL-PRIEST']);normal.light=3;normal=act(normal,'PLAY_MEMORY',{id:normal.hand[0].id});assert.equal(normal.light,4);
});
check('Heracles toll, Cerberus encounter, shared second-stage wish and Golden Apple stacking',()=>{
 let s=shore(['SOUL-MOTHER','SOUL-CHILD','SOUL-MERCHANT','SOUL-COOK','SOUL-MASON']);s.heroOffer={type:'SOUL-HERACLES',resolved:false};
 const toll=s.shore[0].id;s=act(s,'ACCEPT_HERO',{target:toll});assert.equal(s.light,29);assert.ok(s.discard.includes('SOUL-MOTHER'));
 for(const x of s.shore.slice(0,3))s=act(s,'BOARD',{id:x.id});s=act(s,'DEPART');s.effects.moly=true;
 const first=find(s,'SOUL-HERACLES').wish;s=cross(s,first);assert.ok(find(s,'CHAR-CERBERUS'));assert.equal(s.boat.filter(x=>x.origin).length,1);
 assert.match(g.deliveryReason(s,find(s,'SOUL-HERACLES'),'passage'),/later/);s=act(s,'DELIVER',{ids:[]});
 const wish=find(s,'SOUL-HERACLES').wish;assert.equal(find(s,'CHAR-CERBERUS').wish,wish);s=step(s,wish,['SOUL-HERACLES','CHAR-CERBERUS']);
 assert.equal(quest(s,'QUEST-HERACLES').status,'completed');const apple=s.hand.find(m=>m.type==='MEM-GOLDEN-APPLE');const old=s.maxLight;s=act(s,'PLAY_MEMORY',{id:apple.id});assert.equal(s.maxLight,old+1);assert.equal(s.light,s.maxLight);
 memory(s,'MEM-GOLDEN-APPLE');s=act(s,'PLAY_MEMORY',{id:s.hand.at(-1).id});assert.equal(s.maxLight,old+2);rt(s);
});
check('Odysseus branches commit once, preserve pending choice on load, handle empty hand/boat',()=>{
 function encounter(types=[]){let s=shore(types);s.heroOffer={type:'SOUL-ODYSSEUS',resolved:false};s=act(s,'ACCEPT_HERO');for(const x of s.shore)s=act(s,'BOARD',{id:x.id});s=act(s,'DEPART');s.effects.moly=true;return cross(s,find(s,'SOUL-ODYSSEUS').wish);}
 let s=encounter();assert.equal(s.phase,'choice');rt(s);s=act(s,'CHOOSE',{branch:'charybdis'});assert.ok(s.hand.some(m=>m.type==='MEM-MOLY'));assert.throws(()=>act(s,'CHOOSE',{branch:'charybdis'}));
 let z=encounter(['SOUL-COOK']);const before=z.light,rng=z.rng;const again=act(g.importSave(g.exportSave(z)),'CHOOSE',{branch:'zilla'});z=act(z,'CHOOSE',{branch:'zilla'});assert.deepEqual(z,again);assert.equal(z.light,before-1);assert.ok(z.discard.includes('SOUL-COOK'));assert.ok(z.hand.some(m=>m.type==='MEM-NOBODY'));
 let empty=encounter();const light=empty.light;empty=act(empty,'CHOOSE',{branch:'zilla'});assert.equal(empty.light,light);assert.ok(empty.hand.some(m=>m.type==='MEM-NOBODY'));
});
check('Sword removal has no expiry damage, spread, memory or fare reward',()=>{
 let s=boat(['SOUL-COOK']);const p=polong(s,'SOUL-POLONG',5,3);const id=memory(s,'MEM-LAST-MASTERWORK');const before=s.light;
 s=act(s,'PLAY_MEMORY',{id,target:p.id});assert.equal(s.light,before);assert.equal(s.boat.length,1);assert.equal(s.hand.length,0);assert.equal(s.boat[0].type,'SOUL-COOK');
});
check('Unlimited memories, overflow cannot be spent, full fog does not block Wraiths',()=>{
 let s=boat(['SOUL-MOTHER','SOUL-COOK']);s.light=5;const a=memory(s,'MEM-LIGHT','SOUL-MOTHER'),b=memory(s,'MEM-LIGHT','SOUL-MOTHER');
 s=act(s,'PLAY_MEMORY',{id:a});s=act(s,'PLAY_MEMORY',{id:b});assert.equal(s.window.uses,2);assert.equal(s.light,7);
 for(let i=0;i<4;i++)memory(s,'MEM-LIGHT','SOUL-MOTHER');assert.throws(()=>act(s,'PLAY_MEMORY',{id:s.hand[0].id}),/Excess/);rt(s);
 let fog=boat(['SOUL-RED-SOLDIER']);const id=memory(fog,'MEM-ALL-FOG','SOUL-RED-SOLDIER');find(fog,'SOUL-RED-SOLDIER').anger=3;fog=act(fog,'PLAY_MEMORY',{id});const before=fog.light;fog=step(fog,'DEST-TARTARUS');assert.equal(fog.light,before-1);
});
check('Moly suppresses scheduled arrivals without increasing level; Nobody blocks fog only',()=>{
 let s=boat(['SOUL-COOK']);s.effects.moly=false;s.round='2';const m=memory(s,'MEM-MOLY');s=act(s,'PLAY_MEMORY',{id:m});s=act(s,'START_CROSSING');assert.equal(s.encounters,'0');assert.equal(s.boat.length,1);
 s=act(route(s,'DEST-HAVEN'),'CROSS',{option:0});s=act(s,'DELIVER',{ids:[]});const n=memory(s,'MEM-NOBODY');s=act(s,'PLAY_MEMORY',{id:n});s=act(s,'START_CROSSING');assert.equal(g.preview(route(s,'DEST-TARTARUS'),0).payment,0);
});
check('Polong encounter levels, next variant and forced Po Nak overload',()=>{
 let s=boat(['SOUL-MOTHER','SOUL-CHILD','SOUL-MERCHANT','SOUL-COOK']);s.effects.moly=false;s.round='8';s.encounters='2';s.nextPolong='SOUL-PO-NAK';s=act(s,'START_CROSSING');const p=find(s,'SOUL-PO-NAK');assert.equal(p.level,3);assert.equal(p.anger,1);assert.equal(g.actorSeats(p),2);assert.equal(g.seats(s),6);assert.equal(g.preview(route(s,'DEST-HAVEN'),0).overload,1);rt(s);
});
check('Po Mued concealment hides route/cost through review, Foresight overrides it',()=>{
 let s=boat(['SOUL-MERCHANT']);polong(s,'SOUL-PO-MUED',3);s=act(s,'START_CROSSING');assert.ok(g.routeView(s)[0].every(x=>x.hidden&&x.destination===null));const rng=s.rng;
 assert.deepEqual(g.preview(s,0),{hidden:true,option:0});const reviewed=act(s,'PLAN',{action:{type:'CROSS',option:0}});rt(reviewed);const back=act(reviewed,'BACK');assert.equal(back.rng,rng);assert.deepEqual(back.routes,s.routes);
 let visible=boat(['SOUL-MERCHANT']);polong(visible,'SOUL-PO-MUED',3);const id=memory(visible,'MEM-FORESIGHT','SOUL-MERCHANT');visible=act(visible,'PLAY_MEMORY',{id});visible=act(visible,'START_CROSSING');assert.equal(g.routeView(visible).length,3);assert.ok(g.routeView(visible).flat().every(x=>!x.hidden));
});
check('Po Due timing and Haven guarantee preserve already visible offers',()=>{
 let s=boat(['SOUL-COOK']);const due=polong(s,'SOUL-PO-DUE',3,1);s.routes.offers=[['DEST-STYX','DEST-ACHERON'],['DEST-ASPHODEL','DEST-TARTARUS'],['DEST-ASPHODEL','DEST-ELYSIUM']];
 assert.match(g.deliveryReason(s,due,'passage'),/Anger 2/);s=act(s,'START_CROSSING');assert.deepEqual(s.routes.offers[0],['DEST-STYX','DEST-ACHERON']);assert.ok(s.routes.offers[1].includes('DEST-HAVEN'));
 s=act(s,'CROSS',{option:0});s=act(s,'DELIVER',{ids:[]});assert.equal(find(s,'SOUL-PO-DUE').anger,2);const before=s.light;s=step(s,'DEST-HAVEN',['SOUL-PO-DUE']);assert.equal(s.light,before-1);
});
check('Po Luem skips boarding round then creates a saved discard choice; empowered loss is deterministic',()=>{
 let s=boat(['SOUL-MOTHER']);const thief=polong(s,'SOUL-PO-LUEM',1,0);memory(s,'MEM-LIGHT','SOUL-MOTHER');s=step(s,'DEST-HAVEN');assert.equal(s.phase,'choice');rt(s);const id=s.hand[0].id;s=act(s,'CHOOSE',{id});assert.equal(s.hand.length,0);assert.equal(s.phase,'window');
 let spawned=boat(['SOUL-MOTHER']);spawned.effects.moly=false;spawned.round='2';spawned.nextPolong='SOUL-PO-LUEM';memory(spawned,'MEM-LIGHT','SOUL-MOTHER');spawned=step(spawned,'DEST-HAVEN');assert.equal(spawned.phase,'window');assert.equal(spawned.hand.length,1);
 let empowered=boat(['SOUL-MOTHER']);polong(empowered,'SOUL-PO-LUEM',3);memory(empowered,'MEM-LIGHT','SOUL-MOTHER');const twin=copy(empowered);assert.deepEqual(step(empowered,'DEST-HAVEN'),step(twin,'DEST-HAVEN'));
});
check('Level-five spread conserves origin, spares family and fails participant quests',()=>{
 let s=boat(['SOUL-MOTHER','SOUL-CHILD','SOUL-COOK','SOUL-FARMER']);polong(s,'SOUL-POLONG',5,3);s=step(s,'DEST-HAVEN');const spread=s.boat.find(x=>x.spread);assert.ok(spread);assert.ok(['SOUL-COOK','SOUL-FARMER'].includes(spread.origin));assert.equal(spread.type,'SOUL-POLONG');assert.equal(spread.anger,0);assert.equal(quest(s,'QUEST-MEAL').status,'failed');assert.ok(find(s,'SOUL-MOTHER'));assert.ok(find(s,'SOUL-CHILD'));rt(s);
});
check('Only original normally delivered Po Long pays Light; fatal damage stops rewards',()=>{
 let s=boat(['SOUL-COOK']);polong(s,'SOUL-POLONG',1);const before=s.light;s=step(s,'DEST-TARTARUS',['SOUL-POLONG']);assert.equal(s.light,before-2);
 let fatal=boat(['SOUL-MERCHANT']);fatal.light=1;fatal=cross(fatal,'DEST-STYX');assert.equal(fatal.phase,'ended');assert.equal(fatal.hand.length,0);rt(fatal);
});
check('Save validation rejects old versions, broken origins, duplicated IDs and wrong pending choices',()=>{
 const base=g.create();for(const edit of [s=>s.version='0.6',s=>s.shore[0].origin='SOUL-KILLER',s=>s.shore[0].id=s.shore[1].id,s=>s.routes.offers[0][0]='UNKNOWN',s=>s.choice={kind:'odysseus',questId:'missing'},s=>s.effects.moly='yes']){const bad=copy(base);edit(bad);assert.throws(()=>g.importSave(JSON.stringify(bad)));}rt(base);
});
check('128 seeded all-system runs: deterministic replay, immutable transitions and every-state save round trips',()=>{
 let transitions=0,choices=0;
 for(let seed=0;seed<128;seed++){
  let s=g.create(seed),twin=g.create(seed);
  for(let n=0;n<250&&s.phase!=='ended';n++){
   let a;
   if(s.phase==='boarding'){
    if(s.heroOffer&&!s.heroOffer.resolved&&seed%2===0)a={type:'ACCEPT_HERO',target:s.shore[0]?.id};
    else if(g.seats(s)<g.capacity(s)&&s.shore.some(x=>!s.selected.includes(x.id))){const candidate=s.shore.find(x=>!s.selected.includes(x.id)&&!(['SOUL-MASON','SOUL-BLACKSMITH'].includes(x.type)&&s.selected.some(id=>s.shore.find(y=>y.id===id)?.type===(x.type==='SOUL-MASON'?'SOUL-BLACKSMITH':'SOUL-MASON'))));a=candidate?{type:'BOARD',id:candidate.id}:{type:'DEPART'};}
    else a={type:'DEPART'};
   }else if(s.phase==='choice'){a=s.choice.kind==='odysseus'?{type:'CHOOSE',branch:seed%2?'zilla':'charybdis'}:{type:'CHOOSE',id:s.hand[0].id};choices++;}
   else if(s.phase==='trim')a={type:'DISCARD_MEMORY',id:s.hand[0].id};
   else if(s.phase==='delivery')a={type:'DELIVER',ids:s.boat.filter(x=>!g.deliveryReason(s,x)).map(x=>x.id)};
   else if(s.window.kind==='return')a={type:'RETURN'};
   else if(!s.travelPrepared){
    const m=s.hand.length<=3?s.hand.find(m=>{const ts=g.memoryTargets(s,m.type);return !ts||ts.length;}):null;
    if(m){const ts=g.memoryTargets(s,m.type);a={type:'PLAY_MEMORY',id:m.id,target:ts?.[0].id};}
    else a={type:'START_CROSSING'};
   }else {const views=g.routeView(s)[0];const preferred=views.find(v=>v.destination&&s.boat.some(x=>x.wish===v.destination));a={type:'CROSS',option:preferred?.option??0};}
   const original=g.exportSave(s);s=g.transition(s,a);assert.equal(g.exportSave(twin),original);twin=g.transition(g.importSave(g.exportSave(twin)),a);assert.deepEqual(s,twin);rt(s);transitions++;
  }
 }
 return {runs:128,transitions,choices,humanPlaytest:false};
});
const hashes=Object.fromEntries(['engine.js','content.json','tests/quest-check.js'].map(name=>[name,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex')]));
const receipt={version:g.data.version,passed:records.filter(x=>x.status==='PASS').length,failed:records.filter(x=>x.status==='FAIL').length,hashes,records,limitation:'Agent automated scenarios and seeded runs. Not human playtesting or balance evidence.'};
fs.writeFileSync(path.join(root,'verification/quest-results.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));if(receipt.failed)process.exitCode=1;
