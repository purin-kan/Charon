(function(root, factory) {
  const data = typeof module === 'object' && module.exports ? require('./content.json') : root.FerryData;
  const api = factory(data);
  if (typeof module === 'object' && module.exports) module.exports = api; else root.Ferry = api;
})(globalThis, function(data) {
  'use strict';
  const C = data.config, index = a => Object.fromEntries(a.map(x => [x.id, x]));
  const SOUL = index(data.souls), MEM = index(data.memories), DEST = index(data.destinations), QUEST = index(data.quests);
  const ordinary = data.souls.filter(x => x.ordinary).map(x => x.id);
  const heroes = ['SOUL-HERACLES', 'SOUL-ODYSSEUS'];
  const tier1 = ['SOUL-POLONG','SOUL-PO-LUEM','SOUL-PO-NAK'], tier2 = [...tier1,'SOUL-PO-MUED','SOUL-PO-DUE'];
  const clone = x => JSON.parse(JSON.stringify(x));
  const need = (ok, text) => { if (!ok) throw new Error(text); };
  const decimal = n => typeof n === 'string' && /^(0|[1-9][0-9]*)$/.test(n) && n.length <= 1000;
  const inc = n => String(BigInt(n) + 1n);
  const unique = xs => Array.isArray(xs) && new Set(xs).size === xs.length;
  const int = (n, low = 0, high = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(n) && n >= low && n <= high;
  const isTainted = x => !!SOUL[x.type]?.tainted;
  const wish = x => x.wish;
  const maxLight = s => s.maxLight;
  const capacity = s => C.seats + (s.effects.capacity ? 1 : 0);
  const actorSeats = x => x.type === 'SOUL-PO-NAK' ? (x.level >= 3 ? 2 : 1) : SOUL[x.type].seats;
  const passengers = s => s.phase === 'boarding' ? [...s.boat, ...s.shore.filter(x => s.selected.includes(x.id))] : s.boat;
  const seats = s => passengers(s).reduce((n,x) => n + actorSeats(x), 0);
  const eligibleDestinations = () => Object.keys(DEST);
  const activeQuests = s => s.quests.filter(q => q.status === 'active');
  const participant = (s,q,type) => s.boat.find(x => q.participants.includes(x.id) && x.type === type);
  const named = x => SOUL[x.type].name;
  function record(s,text) { s.log.push({round:s.round,cycle:s.cycle,text}); if (s.log.length > 80) s.log.shift(); }
  function draw(s,n) { need(int(n,1),'No eligible random choices.'); s.rng = (Math.imul(s.rng,1664525)+1013904223)>>>0; return Math.floor(s.rng/4294967296*n); }
  function shuffle(s,xs) { const a=xs.slice(); for(let i=a.length-1;i>0;i--){const j=draw(s,i+1);[a[i],a[j]]=[a[j],a[i]];} return a; }
  function fresh(s,type,origin = SOUL[type].ordinary ? type : null) {
    const x={id:'ACTOR-'+s.nextActor,type,origin,wish:SOUL[type].wish,anger:0,boardingId:null,bornRound:s.round,level:0,spread:false,exhausted:false};
    s.nextActor=inc(s.nextActor); return x;
  }
  const windowState = kind => ({kind,uses:0,guard:0,shield:0,allFog:false});
  function deal(s) {
    const ids=eligibleDestinations(s);
    while(s.routes.offers.length<C.foresightForks){
      const a=draw(s,ids.length);let b=draw(s,ids.length-1);if(b>=a)b++;
      s.routes.offers.push([ids[a],ids[b]]); s.routes.masks.push(draw(s,2));
    }
    // Preserve all already-visible offers. A newly boarded Po Due can only alter an unseen fork.
    if(s.boat.some(x=>x.type==='SOUL-PO-DUE') && !s.routes.offers.slice(0,2).some(pair=>pair.includes('DEST-HAVEN'))){
      const firstUnseen=Math.max(1,s.routes.foresight);
      if(firstUnseen<s.routes.offers.length&&!s.routes.offers[firstUnseen].includes('DEST-HAVEN')) s.routes.offers[firstUnseen][draw(s,2)]='DEST-HAVEN';
    }
  }
  function drawPolong(s) { const types=BigInt(s.encounters)>=2n?tier2:tier1; return types[draw(s,types.length)]; }
  function offerHero(s) {
    const choices=heroes.filter(type=>!s.boat.some(x=>x.type===type) && (type!=='SOUL-HERACLES'||s.shore.length>3));
    s.heroOffer=choices.length?{type:choices[draw(s,choices.length)],resolved:false}:null;
  }
  function create(seed=1) {
    need(int(seed,0,4294967295),'Seed must be an unsigned 32-bit integer.');
    const s={format:'the-ferryman-save',version:data.version,schemaVersion:data.schemaVersion,seed,rng:seed,
      phase:'boarding',paused:false,light:C.startLight,maxLight:C.maxLight,round:'0',cycle:'1',completed:'0',deliveries:'0',
      nextActor:'1',nextBoarding:'1',nextMemory:'1',nextQuest:'1',encounters:'0',shore:[],boat:[],arrivals:[],discard:[],selected:[],hand:[],quests:[],
      effects:{capacity:false,moly:false,nobody:false},window:windowState('outward'),travelPrepared:false,
      routes:{offers:[],masks:[],foresight:0,history:[]},nextPolong:null,heroOffer:null,destination:null,
      pending:null,choice:null,theftQueue:[],trimNext:null,ending:null,log:[]};
    s.shore=C.initialShore.map(type=>fresh(s,type));s.arrivals=shuffle(s,C.initialArrivals);s.nextPolong=drawPolong(s);deal(s);offerHero(s);
    record(s,'All-quest trial begins. Heaven is a separate destination.');validate(s);return s;
  }
  function end(s,why) {s.phase='ended';s.ending=why;s.pending=null;s.choice=null;s.trimNext=null;s.theftQueue=[];record(s,why);}
  function damage(s,n,why) {
    const prevented=Math.min(n,s.window.guard);s.window.guard-=prevented;
    const paid=Math.min(s.light,n-prevented);s.light-=paid;record(s,`${why}: ${paid} Light lost${prevented?' (Guard absorbed '+prevented+')':''}.`);
    if(!s.light)end(s,'The lantern went out: '+why+'.');
  }
  function fail(s,q,reason) {if(q.status!=='active')return;q.status='failed';q.reason=reason;record(s,QUEST[q.definitionId].name+': failed ('+reason+').');}
  function remove(s,x,reason) {
    s.shore=s.shore.filter(a=>a.id!==x.id);s.boat=s.boat.filter(a=>a.id!==x.id);s.selected=s.selected.filter(id=>id!==x.id);
    if(x.origin)s.discard.push(x.origin);
    if(reason!=='delivery') for(const q of activeQuests(s))if(q.participants.includes(x.id))fail(s,q,reason);
    record(s,named(x)+' leaves: '+reason+'.');
  }
  function grant(s,type,kind,definitionId,instanceId) {
    const m={id:'MEMORY-'+s.nextMemory,type,sourceRef:{kind,definitionId,instanceId}};s.nextMemory=inc(s.nextMemory);s.hand.push(m);
    record(s,'Received '+MEM[type].name+'.');
  }
  function complete(s,q,reward=QUEST[q.definitionId].reward) {
    need(q.status==='active'&&!q.rewardClaimed,'Quest already resolved.');q.status='completed';q.stage='completed';
    if(reward){grant(s,reward,'quest',q.definitionId,q.id);q.rewardClaimed=true;q.rewardType=reward;}
    record(s,QUEST[q.definitionId].name+': complete.');
  }
  function newQuest(s,definitionId,actors) {
    const q={id:'QUEST-'+s.nextQuest,definitionId,participants:actors.map(x=>x.id),status:'active',stage:'active',sharedRoutes:0,delivered:[],rewardClaimed:false,rewardType:null,reason:null,cycle:s.cycle,data:{}};
    s.nextQuest=inc(s.nextQuest);s.quests.push(q);record(s,QUEST[definitionId].name+': started.');return q;
  }
  function startPairs(s) {
    for(const def of data.quests.filter(q=>q.roles.length===2)){
      const actors=def.roles.map(type=>s.boat.find(x=>x.type===type));
      if(actors.every(Boolean))newQuest(s,def.id,actors);
    }
  }
  function protectedMerchant(s,x) {return x.type==='SOUL-MERCHANT'&&activeQuests(s).some(q=>q.definitionId==='QUEST-SWORD'&&q.participants.includes(x.id)&&participant(s,q,'SOUL-BLACKSMITH'));}
  function anger(s,x,n) {if(n>0&&protectedMerchant(s,x)){record(s,'Blacksmith protects Merchant from '+n+' Anger.');return;}x.anger=Math.max(0,x.anger+n);}
  function expire(s) {
    for(const x of s.boat.slice()){
      if(x.anger<C.shipAngerLimit)continue;
      const spread=isTainted(x)&&x.level>=5&&!x.spread;
      damage(s,isTainted(x)&&x.level>=4?2:C.wraithDamage,named(x)+' becomes a Wraith');remove(s,x,'expiry');
      if(s.phase==='ended')return;
      if(spread){const eligible=s.boat.filter(a=>a.origin&&!isTainted(a)&&!['SOUL-MOTHER','SOUL-CHILD'].includes(a.type));
        if(eligible.length){const target=eligible[draw(s,eligible.length)];for(const q of activeQuests(s))if(q.participants.includes(target.id))fail(s,q,'participant corrupted');
          target.type='SOUL-POLONG';target.wish='DEST-TARTARUS';target.anger=0;target.level=1;target.spread=true;target.bornRound=s.round;record(s,'Corruption turns '+SOUL[target.origin].name+' into a base Po Long.');}}
    }
  }
  function taintedFog(x) {return x.type==='SOUL-POLONG'&&x.anger>=(x.level>=3?1:2)?1:0;}
  function fog(s,destination) {
    const escalation=destination==='DEST-HAVEN'?0:BigInt(s.cycle)>=12n?2:BigInt(s.cycle)>=6n?1:0;
    const base=DEST[destination].fog+escalation,tainted=s.boat.reduce((n,x)=>n+taintedFog(x),0),overload=seats(s)>capacity(s)?1:0;
    const total=s.effects.nobody||s.window.allFog?0:Math.max(0,base+tainted+overload-s.window.shield);
    const payment=Math.max(0,total-s.window.guard);
    return {destination,base,tainted,overload,shield:s.window.shield,guard:s.window.guard,fog:total,payment,remaining:Math.max(0,s.light-payment),lethal:payment>=s.light};
  }
  function routeView(s) {
    const count=Math.max(1,s.routes.foresight),shadows=s.boat.filter(x=>x.type==='SOUL-PO-MUED');
    return s.routes.offers.slice(0,count).map((pair,i)=>pair.map((id,option)=>{
      const hidden=i>=s.routes.foresight&&shadows.some(x=>x.level>=3||s.routes.masks[i]===option);
      return {option,destination:hidden?null:id,hidden};
    }));
  }
  function preview(s,option) {
    need(s.phase==='window'&&s.travelPrepared&&s.window.kind==='outward'&&int(option,0,1),'Choose an offered route after approaching the fork.');
    return routeView(s)[0][option].hidden?{hidden:true,option}: {...fog(s,s.routes.offers[0][option]),hidden:false,option};
  }
  function startCrossing(s) {
    need(s.phase==='window'&&s.window.kind==='outward'&&!s.travelPrepared&&s.boat.length,'Approach the fork once, after using memories.');
    s.round=inc(s.round);s.travelPrepared=true;
    if(BigInt(s.round)%BigInt(C.spawnInterval)===0n){
      if(s.effects.moly)record(s,'Moly prevents this scheduled Polong arrival.');
      else{s.encounters=inc(s.encounters);const x=fresh(s,s.nextPolong,null);x.level=Number(BigInt(s.encounters)>5n?5n:BigInt(s.encounters));x.anger=x.level>=2?1:0;x.boardingId=String(BigInt(s.nextBoarding)-1n);s.boat.push(x);record(s,named(x)+' boards at level '+s.encounters+'.');s.nextPolong=drawPolong(s);}
    }
    deal(s);
  }
  function randomWish(s) {const ids=eligibleDestinations(s).filter(id=>id!=='DEST-HEAVEN');return ids[draw(s,ids.length)];}
  function acceptHero(s,target) {
    need(s.phase==='boarding'&&s.heroOffer&&!s.heroOffer.resolved,'No hero offer is available.');
    const type=s.heroOffer.type;
    const toll=type==='SOUL-HERACLES'?s.shore.find(x=>x.id===target):null;
    if(type==='SOUL-HERACLES')need(s.shore.length>3&&toll,'Heracles needs more than three shore souls and a selected shore toll.');
    need(seats(s)-(toll&&s.selected.includes(toll.id)?actorSeats(toll):0)+1<=capacity(s),'Leave a seat for the hero.');
    s.heroOffer.resolved=true;
    if(toll){damage(s,1,'Hades’ toll');remove(s,toll,'sacrifice');if(s.phase==='ended')return;}
    const hero=fresh(s,type,null);hero.wish=randomWish(s);s.boat.push(hero);newQuest(s,type==='SOUL-HERACLES'?'QUEST-HERACLES':'QUEST-ODYSSEUS',[hero]);
    record(s,named(hero)+' wishes for '+DEST[hero.wish].name+'.');
  }
  function heroicArrival(s) {
    for(const q of activeQuests(s)){
      if(q.definitionId==='QUEST-HERACLES'&&q.stage==='active'){
        const hero=participant(s,q,'SOUL-HERACLES');if(!hero||hero.wish!==s.destination)continue;
        const cerberus=fresh(s,'CHAR-CERBERUS',null);cerberus.boardingId=hero.boardingId;s.boat.push(cerberus);q.participants.push(cerberus.id);
        const frightened=shuffle(s,s.boat.filter(x=>x.origin&&!isTainted(x))).slice(0,2);
        for(const x of frightened)remove(s,x,'frightened by Cerberus');
        hero.wish=randomWish(s);cerberus.wish=randomWish(s);q.stage='cerberus';q.data.battleRound=s.round;
        record(s,'Cerberus boards. New wishes: Heracles → '+DEST[hero.wish].name+', Cerberus → '+DEST[cerberus.wish].name+'.');
      }
      if(q.definitionId==='QUEST-ODYSSEUS'&&q.stage==='active'){
        const hero=participant(s,q,'SOUL-ODYSSEUS');if(!hero||hero.wish!==s.destination)continue;
        remove(s,hero,'delivery');q.delivered.push(hero.id);q.stage='tiresias';s.choice={kind:'odysseus',questId:q.id};s.phase='choice';record(s,'Tiresias offers Charybdis or Zilla.');return;
      }
    }
  }
  function crossing(s,option) {
    preview(s,option);const pair=s.routes.offers[0],destination=pair[option];s.destination=destination;
    const calculation=fog(s,destination);s.routes.history.push({offer:pair.slice(),chosen:destination});s.routes.offers.shift();s.routes.masks.shift();s.routes.foresight=Math.max(0,s.routes.foresight-1);
    damage(s,calculation.fog,'crossing to '+DEST[destination].name);
    if(s.phase==='ended')return;s.phase='delivery';deal(s);heroicArrival(s);
  }
  function deliveryReason(s,x,via='normal') {
    if(!s.boat.some(a=>a.id===x.id))return 'Not aboard.';
    if(via==='normal'&&x.wish!==s.destination)return 'Wishes for '+DEST[x.wish].name+'.';
    if(x.type==='SOUL-PO-DUE'&&x.anger<2)return 'Po Due will not leave below Anger 2.';
    for(const q of activeQuests(s).filter(q=>q.participants.includes(x.id))){
      if(q.definitionId==='QUEST-SWORD'&&x.type==='SOUL-BLACKSMITH'){
        if(q.stage!=='merchant-delivered')return 'Deliver Merchant first.';
        if(via==='normal'&&q.data.merchantRound===s.round)return 'Blacksmith leaves on a later crossing, or by Passenger.';
      }
      if(q.definitionId==='QUEST-BOAT'&&x.type==='SOUL-MASON'&&(q.stage!=='merchant-delivered'||s.boat.length!==1))return 'Deliver Merchant first. Mason must be the last passenger.';
      if(q.definitionId==='QUEST-HERACLES'&&(q.stage!=='cerberus'||q.data.battleRound===s.round))return 'Complete the Cerberus encounter, then deliver on a later arrival.';
      if(q.definitionId==='QUEST-ODYSSEUS')return 'Odysseus disembarks through his Tiresias encounter.';
    }
    return null;
  }
  function deliveredQuests(s,x) {
    for(const q of activeQuests(s).filter(q=>q.participants.includes(x.id))){
      q.delivered.push(x.id);
      if(q.definitionId==='QUEST-FAMILY'){
        if(x.type==='SOUL-CHILD')q.stage='child-delivered';
        else if(q.stage==='child-delivered')complete(s,q);else fail(s,q,'Mother delivered before Child');
      }else if(q.definitionId==='QUEST-SOLDIERS'&&q.delivered.length===2)complete(s,q);
      else if(['QUEST-SWORD','QUEST-BOAT'].includes(q.definitionId)){
        if(x.type==='SOUL-MERCHANT'){q.stage='merchant-delivered';q.data.merchantRound=s.round;}else complete(s,q);
      }else if(q.definitionId==='QUEST-HERACLES'&&q.delivered.length===2)complete(s,q);
      else if(['QUEST-LISTENER','QUEST-MEAL'].includes(q.definitionId))fail(s,q,'participant delivered before interaction');
    }
  }
  function deliver(s,x,via='normal') {
    need(!deliveryReason(s,x,via),deliveryReason(s,x,via));
    if(x.type==='SOUL-PO-DUE'&&x.level>=3){damage(s,1,'Po Due delivery');if(s.phase==='ended')return;}
    deliveredQuests(s,x);
    if(x.origin&&!isTainted(x))s.deliveries=inc(s.deliveries);
    const memory=SOUL[x.type].memory;
    if(memory&&!(x.type==='SOUL-PRIEST'&&x.exhausted))grant(s,memory,'character',x.type,x.id);
    if(x.type==='SOUL-POLONG'&&!x.spread&&via==='normal'&&s.destination==='DEST-TARTARUS'){s.light=Math.min(s.maxLight,s.light+1);record(s,'Po Long pays the fare: +1 Light.');}
    remove(s,x,'delivery');record(s,named(x)+' reached '+DEST[x.wish].name+'.');
  }
  function nextWindow(s) {s.phase='window';s.travelPrepared=false;s.window=windowState(s.boat.length?'outward':'return');s.trimNext=null;s.theftQueue=[];deal(s);}
  function finishRound(s) {if(s.hand.length>C.handLimit){s.phase='trim';s.trimNext='new-window';}else nextWindow(s);}
  function thefts(s) {
    while(s.theftQueue.length){const id=s.theftQueue.shift(),x=s.boat.find(a=>a.id===id);if(!x||!s.hand.length)continue;
      if(x.level>=3){const i=draw(s,s.hand.length);record(s,named(x)+' takes '+MEM[s.hand[i].type].name+'.');s.hand.splice(i,1);}
      else{s.phase='choice';s.choice={kind:'memory-loss',actorId:x.id};return;}}
    finishRound(s);
  }
  function resolveDelivery(s,ids) {
    need(s.phase==='delivery'&&unique(ids),'Choose unique passengers.');
    for(const id of ids){const x=s.boat.find(x=>x.id===id);need(x,'Passenger is not aboard.');deliver(s,x);if(s.phase==='ended')return;}
    for(const q of activeQuests(s)){
      const def=QUEST[q.definitionId];if(def.roles.length!==2||!def.roles.every(type=>participant(s,q,type)))continue;
      q.sharedRoutes++;
      if(q.definitionId==='QUEST-SOLDIERS'&&q.sharedRoutes%2===0)for(const x of s.boat)if(!q.participants.includes(x.id))anger(s,x,1);
      if(q.definitionId==='QUEST-LISTENER'&&q.sharedRoutes>=3){const x=participant(s,q,'SOUL-LISTENER');x.type='SOUL-POET';x.wish='DEST-ELYSIUM';complete(s,q);record(s,'Listener becomes Poet, preserving current Anger.');}
    }
    const chance=Math.min(.5,Number((BigInt(s.round)-1n)/3n>3n?3n:(BigInt(s.round)-1n)/3n)/6);
    for(const x of s.boat){const doubled=isTainted(x)&&x.type!=='SOUL-PO-DUE'&&chance>0&&draw(s,1000000)<chance*1000000;anger(s,x,doubled?2:1);}
    expire(s);if(s.phase==='ended')return;
    s.theftQueue=s.boat.filter(x=>x.type==='SOUL-PO-LUEM'&&BigInt(x.bornRound)<BigInt(s.round)).map(x=>x.id);thefts(s);
  }
  function resolveChoice(s,action) {
    need(s.phase==='choice'&&s.choice,'No pending choice.');
    if(s.choice.kind==='memory-loss'){
      const m=s.hand.find(x=>x.id===action.id);need(m,'Choose a held memory to lose.');s.hand=s.hand.filter(x=>x.id!==m.id);record(s,'Po Luem takes '+MEM[m.type].name+'.');s.choice=null;thefts(s);return;
    }
    need(['charybdis','zilla'].includes(action.branch),'Choose Charybdis or Zilla.');
    const q=s.quests.find(q=>q.id===s.choice.questId);s.choice=null;s.phase='delivery';
    if(action.branch==='charybdis'){
      if(s.hand.length){const i=draw(s,s.hand.length);record(s,'Charybdis takes '+MEM[s.hand[i].type].name+'.');s.hand.splice(i,1);}else record(s,'Charybdis finds no memory to take.');
      complete(s,q,'MEM-MOLY');
    }else{
      const candidates=s.boat.filter(x=>x.origin&&!isTainted(x));
      if(candidates.length){const x=candidates[draw(s,candidates.length)];damage(s,1,'Zilla turns '+named(x)+' into a Wraith');remove(s,x,'Zilla Wraith');}else record(s,'Zilla finds no ordinary passenger.');
      if(s.phase!=='ended')complete(s,q,'MEM-NOBODY');
    }
  }
  function memoryTargets(s,type) {
    const kind=MEM[type]?.kind;
    if(kind==='calm')return [...s.shore,...s.boat];
    if(kind==='passage')return s.boat.filter(x=>!deliveryReason(s,x,'passage'));
    if(kind==='sword')return s.boat.filter(isTainted);
    return null;
  }
  function memoryReady(s,id,target) {
    need((s.phase==='window'&&!s.travelPrepared)||s.phase==='boarding','Use memories before approaching a fork or returning.');
    need(s.hand.length<=C.handLimit,'Excess rewards cannot be played before hand trimming.');
    const held=s.hand.find(m=>m.id===id);need(held,'Choose a held memory.');
    need(s.phase!=='boarding'||MEM[held.type].kind==='capacity','Only Boat Space is used during boarding.');
    const targets=memoryTargets(s,held.type);
    need(targets?targets.some(x=>x.id===target):target==null,'Choose an eligible memory target.');return held;
  }
  function playMemory(s,id,target) {
    const held=memoryReady(s,id,target),m=MEM[held.type];s.hand=s.hand.filter(x=>x.id!==id);s.window.uses++;
    record(s,'Played '+m.name+'.');
    if(m.kind==='light')s.light=Math.min(s.maxLight,s.light+m.amount);
    if(m.kind==='guard')s.window.guard=1;
    if(m.kind==='fog')s.window.shield+=m.amount;
    if(m.kind==='all-fog')s.window.allFog=true;
    if(m.kind==='foresight')s.routes.foresight=C.foresightForks;
    if(m.kind==='calm'){const x=[...s.shore,...s.boat].find(x=>x.id===target);x.anger=Math.max(0,x.anger-m.amount);}
    if(m.kind==='apple'){s.maxLight++;s.light=s.maxLight;}
    if(['capacity','moly','nobody'].includes(m.kind))s.effects[m.kind]=true;
    if(m.kind==='sword')remove(s,s.boat.find(x=>x.id===target),'Sword');
    if(m.kind==='passage')deliver(s,s.boat.find(x=>x.id===target),'passage');
    if(s.phase==='ended')return;
    if(s.phase!=='boarding'&&!s.boat.length){s.window.kind='return';if(s.hand.length>C.handLimit){s.phase='trim';s.trimNext='same-window';}}
  }
  function meal(s,questId) {
    need(s.phase==='window'&&!s.travelPrepared&&s.window.kind==='outward','Prepare meals before travel.');
    const q=activeQuests(s).find(q=>q.id===questId&&q.definitionId==='QUEST-MEAL');need(q&&participant(s,q,'SOUL-FARMER')&&participant(s,q,'SOUL-COOK'),'No unused shared meal is available.');
    for(const x of s.boat)x.anger=Math.max(0,x.anger-1);participant(s,q,'SOUL-COOK').anger+=2;complete(s,q);record(s,'Everyone eats; Cook gains two stress Anger.');expire(s);
    if(s.phase!=='ended'&&!s.boat.length)s.window.kind='return';
  }
  function purify(s,actorId,target) {
    need(s.phase==='window'&&!s.travelPrepared&&s.window.kind==='outward','Purify before travel.');
    const priest=s.boat.find(x=>x.id===actorId&&x.type==='SOUL-PRIEST'&&!x.exhausted),x=s.boat.find(x=>x.id===target&&x.id!==actorId);
    need(priest&&x,'Choose an unexhausted Priest and another boat passenger.');x.anger=0;priest.exhausted=true;record(s,'Priest purifies '+named(x)+' and forfeits his memory for this boarding.');
  }
  function returnShore(s) {
    need(s.phase==='window'&&s.window.kind==='return'&&!s.boat.length,'Return with an empty boat.');
    for(const x of s.shore)x.anger++;
    for(const x of s.shore.slice())if(x.anger>=C.shoreAngerLimit){damage(s,C.wraithDamage,named(x)+' shore expiry');remove(s,x,'shore expiry');if(s.phase==='ended')return;}
    s.light=Math.min(s.maxLight,s.light+C.returnLight);s.completed=inc(s.completed);s.cycle=inc(s.cycle);
    s.effects={capacity:false,moly:false,nobody:false};
    while(s.shore.length<C.shoreTarget){if(!s.arrivals.length){s.arrivals=shuffle(s,s.discard);s.discard=[];}if(!s.arrivals.length)break;s.shore.push(fresh(s,s.arrivals.shift()));}
    for(const q of activeQuests(s))fail(s,q,'trip ended before completion');
    s.routes={offers:[],masks:[],foresight:0,history:[]};s.destination=null;s.window=windowState('outward');s.travelPrepared=false;s.phase='boarding';deal(s);offerHero(s);record(s,'Return survived: +1 Light. Cycle '+s.cycle+'.');
  }
  function transition(input,a) {
    validate(input);need(a&&typeof a.type==='string','Choose an action.');const s=clone(input);
    if(a.type==='STOP'){need(s.phase!=='ended','Run ended.');s.paused=true;return s;}
    if(a.type==='RESUME'){s.paused=false;return s;}
    need(!s.paused&&s.phase!=='ended','Resume an active run first.');
    if(a.type==='BOARD'){
      need(s.phase==='boarding'&&s.shore.some(x=>x.id===a.id),'Choose a waiting soul.');
      if(s.selected.includes(a.id))s.selected=s.selected.filter(id=>id!==a.id);
      else{const x=s.shore.find(x=>x.id===a.id);need(seats(s)+actorSeats(x)<=capacity(s),'Not enough seats.');s.selected.push(a.id);}
    }else if(a.type==='ACCEPT_HERO')acceptHero(s,a.target);
    else if(a.type==='DECLINE_HERO'){need(s.phase==='boarding'&&s.heroOffer&&!s.heroOffer.resolved,'No hero offer.');s.heroOffer.resolved=true;}
    else if(a.type==='DEPART'){
      need(s.phase==='boarding'&&(s.selected.length||s.boat.length),'Select passengers before departure.');
      const all=passengers(s);need(!['SOUL-MERCHANT','SOUL-BLACKSMITH','SOUL-MASON'].every(type=>all.some(x=>x.type===type)),'Merchant cannot depart with both Blacksmith and Mason.');
      s.boat=all.map(x=>({...x,anger:0,boardingId:s.nextBoarding,exhausted:false}));s.nextBoarding=inc(s.nextBoarding);s.shore=s.shore.filter(x=>!s.selected.includes(x.id));s.selected=[];
      if(s.heroOffer)s.heroOffer.resolved=true;s.phase='window';startPairs(s);
    }else if(a.type==='START_CROSSING')startCrossing(s);
    else if(a.type==='PLAY_MEMORY')playMemory(s,a.id,a.target);
    else if(a.type==='MEAL')meal(s,a.questId);
    else if(a.type==='PURIFY')purify(s,a.actorId,a.target);
    else if(a.type==='PLAN'){
      need(s.phase==='window','Review a route or return from its window.');
      if(a.action?.type==='CROSS')preview(s,a.action.option);else need(a.action?.type==='RETURN'&&s.window.kind==='return','Invalid review.');
      s.pending=clone(a.action);s.phase='review';
    }else if(a.type==='BACK'){need(s.phase==='review','No review to cancel.');s.pending=null;s.phase='window';}
    else if(a.type==='CONFIRM'){need(s.phase==='review','No review to confirm.');const pending=s.pending;s.pending=null;s.phase='window';return transition(s,pending);}
    else if(a.type==='CROSS')crossing(s,a.option);
    else if(a.type==='DELIVER')resolveDelivery(s,a.ids);
    else if(a.type==='CHOOSE')resolveChoice(s,a);
    else if(a.type==='RETURN')returnShore(s);
    else if(a.type==='DISCARD_MEMORY'){
      need(s.phase==='trim'&&s.hand.some(x=>x.id===a.id),'Choose an excess held memory.');s.hand=s.hand.filter(x=>x.id!==a.id);
      if(s.hand.length<=C.handLimit){if(s.trimNext==='same-window'){s.phase='window';s.trimNext=null;}else nextWindow(s);}
    }else throw new Error('Unknown action.');
    validate(s);return s;
  }
  function validate(s) {
    need(s&&s.format==='the-ferryman-save'&&s.version===data.version&&s.schemaVersion===data.schemaVersion,'This is not a current all-quest trial save. Older games keep their own saves.');
    need(['boarding','window','review','delivery','choice','trim','ended'].includes(s.phase),'Invalid phase.');
    need(typeof s.paused==='boolean'&&typeof s.travelPrepared==='boolean'&&int(s.seed,0,4294967295)&&int(s.rng,0,4294967295),'Invalid run flags or random state.');
    need(int(s.maxLight,C.maxLight)&&int(s.light,0,s.maxLight)&&(s.phase==='ended')===(s.light===0),'Invalid Light.');
    for(const k of ['round','cycle','completed','deliveries','nextActor','nextBoarding','nextMemory','nextQuest','encounters'])need(decimal(s[k]),'Invalid counter '+k);
    need(BigInt(s.cycle)===BigInt(s.completed)+1n&&['nextActor','nextBoarding','nextMemory','nextQuest'].every(k=>BigInt(s[k])>0n),'Invalid counter relationship.');
    for(const k of ['shore','boat','arrivals','discard','selected','hand','quests','theftQueue'])need(Array.isArray(s[k]),'Invalid '+k);
    need(s.effects&&['capacity','moly','nobody'].every(k=>typeof s.effects[k]==='boolean'),'Invalid effects.');
    need(s.window&&['outward','return'].includes(s.window.kind)&&int(s.window.uses)&&int(s.window.guard,0,1)&&int(s.window.shield)&&typeof s.window.allFog==='boolean','Invalid memory window.');
    const actors=[...s.shore,...s.boat],ids=actors.map(x=>x?.id),origins=[...s.arrivals,...s.discard];
    const validId=(id,prefix,counter)=>typeof id==='string'&&id.startsWith(prefix)&&decimal(id.slice(prefix.length))&&BigInt(id.slice(prefix.length))>0n&&BigInt(id.slice(prefix.length))<BigInt(counter);
    need(unique(ids),'Duplicate actor identity.');
    for(const x of actors){
      need(x&&SOUL[x.type]&&validId(x.id,'ACTOR-',s.nextActor)&&DEST[x.wish]&&int(x.anger,0,s.phase==='ended'?100:C.shipAngerLimit-1)&&decimal(x.bornRound)&&BigInt(x.bornRound)<=BigInt(s.round),'Invalid actor.');
      need(typeof x.exhausted==='boolean'&&typeof x.spread==='boolean'&&int(x.level,0,5),'Invalid actor traits.');
      need(x.origin===null||ordinary.includes(x.origin),'Invalid actor origin.');
      if(x.origin)origins.push(x.origin);
      need(x.origin ? x.type===x.origin||(x.origin==='SOUL-LISTENER'&&x.type==='SOUL-POET')||(x.spread&&x.type==='SOUL-POLONG') : isTainted(x)||SOUL[x.type].hero,'Invalid transformation or origin.');
      need(isTainted(x)?x.level>=1:x.level===0,'Invalid tainted level.');
      if(s.shore.includes(x))need(x.origin===x.type&&x.boardingId===null&&(s.phase==='ended'||x.anger<C.shoreAngerLimit),'Invalid shore actor.');
      else need(s.phase==='boarding'?SOUL[x.type].hero&&x.boardingId===null:decimal(x.boardingId)&&BigInt(x.boardingId)>0n&&BigInt(x.boardingId)<BigInt(s.nextBoarding),'Invalid boarding identity.');
    }
    need(unique(origins)&&origins.length===ordinary.length&&ordinary.every(id=>origins.includes(id)),'Ordinary origin conservation failed.');
    need(unique(s.selected)&&s.selected.every(id=>s.shore.some(x=>x.id===id))&&(s.phase==='boarding'||s.selected.length===0),'Invalid boarding selection.');
    need(s.phase!=='boarding'||seats(s)<=capacity(s),'Voluntary boarding exceeds capacity.');
    need(s.heroOffer===null||(heroes.includes(s.heroOffer.type)&&typeof s.heroOffer.resolved==='boolean'),'Invalid hero offer.');
    need(tier2.includes(s.nextPolong),'Invalid next Polong.');
    need(s.routes&&Array.isArray(s.routes.offers)&&s.routes.offers.length>=(s.phase==='ended'?2:C.foresightForks)&&s.routes.offers.length<=10000&&Array.isArray(s.routes.masks)&&s.routes.masks.length===s.routes.offers.length&&int(s.routes.foresight,0,C.foresightForks),'Invalid route queue.');
    for(const pair of s.routes.offers)need(Array.isArray(pair)&&pair.length===2&&unique(pair)&&pair.every(id=>DEST[id]),'Invalid destination pair.');
    need(s.routes.masks.every(n=>int(n,0,1))&&Array.isArray(s.routes.history)&&s.routes.history.every(h=>h&&Array.isArray(h.offer)&&h.offer.length===2&&unique(h.offer)&&h.offer.every(id=>DEST[id])&&h.offer.includes(h.chosen)),'Invalid route masks/history.');
    need(s.destination===null||!!DEST[s.destination],'Invalid destination.');
    need(unique(s.quests.map(q=>q?.id)),'Duplicate quest instance.');
    for(const q of s.quests){
      need(q&&validId(q.id,'QUEST-',s.nextQuest)&&QUEST[q.definitionId]&&['active','completed','failed'].includes(q.status)&&typeof q.stage==='string'&&unique(q.participants)&&q.participants.every(id=>validId(id,'ACTOR-',s.nextActor))&&unique(q.delivered)&&q.delivered.every(id=>q.participants.includes(id))&&int(q.sharedRoutes)&&typeof q.rewardClaimed==='boolean'&&q.data&&typeof q.data==='object','Invalid quest instance.');
      need(q.rewardClaimed?(q.status==='completed'&&!!MEM[q.rewardType]):q.rewardType===null,'Invalid quest reward claim.');
      if(q.status==='active')need(q.participants.every(id=>q.delivered.includes(id)||s.boat.some(x=>x.id===id)),'Active quest participant is missing.');
    }
    need(unique(s.hand.map(m=>m?.id))&&s.hand.length<=10000,'Invalid hand.');
    for(const m of s.hand){
      need(m&&MEM[m.type]&&validId(m.id,'MEMORY-',s.nextMemory)&&m.sourceRef,'Invalid memory.');
      const ref=m.sourceRef;
      if(ref.kind==='quest'){const q=s.quests.find(q=>q.id===ref.instanceId);need(q&&q.definitionId===ref.definitionId&&q.rewardClaimed&&q.rewardType===m.type,'Invalid quest reward provenance.');}
      else need(ref.kind==='character'&&SOUL[ref.definitionId]?.memory===m.type&&validId(ref.instanceId,'ACTOR-',s.nextActor),'Invalid character reward provenance.');
    }
    need(s.phase==='review'?s.pending&&['CROSS','RETURN'].includes(s.pending.type):s.pending===null,'Invalid pending review.');
    if(s.phase==='window'||s.phase==='review')need(s.window.kind==='return'?!s.boat.length&&!s.travelPrepared:s.boat.length>0,'Invalid window passenger state.');
    if(s.phase==='boarding')need(!s.travelPrepared&&s.window.kind==='outward','Invalid shore window.');
    if(s.phase==='delivery'||s.phase==='choice')need(s.travelPrepared&&s.window.kind==='outward'&&!!DEST[s.destination],'Invalid arrival phase.');
    if(s.phase==='review'){
      if(s.pending.type==='CROSS')preview({...s,phase:'window'},s.pending.option);else need(s.window.kind==='return'&&!s.boat.length,'Invalid reviewed return.');
    }
    need(s.phase==='choice'?s.choice&&['odysseus','memory-loss'].includes(s.choice.kind):s.choice===null,'Invalid pending choice.');
    if(s.choice?.kind==='odysseus')need(s.quests.some(q=>q.id===s.choice.questId&&q.definitionId==='QUEST-ODYSSEUS'&&q.status==='active'&&q.stage==='tiresias'),'Invalid hero choice.');
    if(s.choice?.kind==='memory-loss')need(s.boat.some(x=>x.id===s.choice.actorId&&x.type==='SOUL-PO-LUEM')&&s.hand.length,'Invalid theft choice.');
    need(s.theftQueue.every(id=>s.boat.some(x=>x.id===id&&x.type==='SOUL-PO-LUEM')),'Invalid theft queue.');
    need(s.phase==='trim'?s.hand.length>C.handLimit&&['new-window','same-window'].includes(s.trimNext):s.trimNext===null,'Invalid overflow state.');
    need(s.phase==='ended'?typeof s.ending==='string':s.ending===null,'Invalid ending.');
    need(Array.isArray(s.log)&&s.log.length<=80&&s.log.every(x=>decimal(x.round)&&decimal(x.cycle)&&typeof x.text==='string'&&x.text.length<=2000),'Invalid log.');
    return true;
  }
  function importSave(text){need(typeof text==='string'&&text.length<=5000000,'Save must be text under 5 MB.');const s=JSON.parse(text);validate(s);return clone(s);}
  function exportSave(s){validate(s);return JSON.stringify(s,null,2);}
  return {data,create,transition,validate,importSave,exportSave,clone,seats,actorSeats,maxLight,capacity,isTainted,taintedFog,wish,eligibleDestinations,routeView,preview,deliveryReason,memoryTargets,activeQuests};
});
