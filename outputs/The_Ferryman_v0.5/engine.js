/* v0.5 provisional rules. No DOM, network, dependencies or hidden extra rules. */
(function(root,factory){
  const data=typeof module==='object'&&module.exports?require('./content.json'):root.FerryData;
  const api=factory(data);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.Ferry=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(D){
'use strict';
const C=D.config, byId=xs=>Object.fromEntries(xs.map(x=>[x.id,x]));
const SOUL=byId(D.souls), MEM=byId(D.memories), ROUTE=byId(D.routes), ARRIVAL=byId(D.arrivals), EVENT=byId(D.events);
const clone=x=>JSON.parse(JSON.stringify(x));
const need=(ok,message)=>{if(!ok)throw new Error(message);};
const unique=a=>Array.isArray(a)&&new Set(a).size===a.length;
function random(s){s.rng=(s.rng+0x6D2B79F5)>>>0;let t=s.rng;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;}
function shuffle(s,a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random(s)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function log(s,text){s.log.push({tide:s.tide,trip:s.trip,text});}
function gain(s,n){s.light=Math.min(C.maxLight,s.light+n);}
function capacity(s){return s.event==='E03'?3:C.seats;}
function seats(s){return s.boat.reduce((n,id)=>n+SOUL[id].seats,0);}
function pressure(s){return C.pressure[s.trip-1];}
function expireWaiting(s){for(const id of s.shore.slice()){if(s.deadlines[id]<=s.tide){s.shore=s.shore.filter(x=>x!==id);s.wraiths.push(id);log(s,SOUL[id].name+' reached the waiting deadline and became a Wraith.');}}}
function refill(s){while(s.shore.length<C.shoreTarget&&s.arrivals.length){const a=ARRIVAL[s.arrivals.shift()];s.arrived.push(a.id);for(const id of a.souls){s.shore.push(id);s.deadlines[id]=s.tide+SOUL[id].patience;}log(s,'Arrival: '+a.name+'.');}}
function discardOffers(s,chosen=null){for(const id of s.offers){if(id==='R09'&&chosen==='R09')s.retiredRoutes.push(id);else s.routeDiscard.push(id);}s.offers=[];}
function offer(s){need(!s.offers.length,'Resolve the current route offer first.');while(s.offers.length<2){if(!s.routeDeck.length){s.routeDeck=shuffle(s,s.routeDiscard);s.routeDiscard=[];}need(s.routeDeck.length,'No routes remain.');s.offers.push(s.routeDeck.shift());}}
function startTrip(s){s.phase='boarding';s.step=0;s.node='shore';s.event=null;s.lastMove=null;s.pending=null;
  if(s.trip===2||s.trip===4){s.event=s.events.shift();s.seenEvents.push(s.event);log(s,'Event: '+EVENT[s.event].name+'. '+EVENT[s.event].text);if(s.event==='E02'){for(const id of s.shore)s.deadlines[id]--;expireWaiting(s);}}
  refill(s);if(!s.shore.length&&!s.arrivals.length){end(s,s.wishes>=C.targetWishes,'The shore is empty after a survived return. '+s.wishes+' of '+C.targetWishes+' wishes fulfilled.');return;}offer(s);
}
function create(seed=1){need(Number.isInteger(seed)&&seed>=0&&seed<=4294967295,'Seed must be an unsigned integer.');
  const s={version:D.version,seed,rng:seed,phase:'boarding',trip:1,step:0,tide:0,light:C.startLight,wishes:0,completed:0,node:'shore',shore:[],boat:[],deadlines:{},wraiths:[],delivered:[],hand:[],spent:[],arrived:[],arrivals:[],routeDeck:[],routeDiscard:[],offers:[],retiredRoutes:[],events:[],seenEvents:[],event:null,quest:'locked',pending:null,lastMove:null,ending:null,log:[]};
  s.arrivals=shuffle(s,D.arrivals.map(x=>x.id));s.routeDeck=shuffle(s,D.routes.map(x=>x.id));s.events=shuffle(s,D.events.map(x=>x.id));startTrip(s);return s;
}
function routes(s){if(s.phase==='boarding')return s.offers.slice();if(s.phase!=='route')return[];if(!s.boat.length)return['return'];return s.offers.slice();}
function preview(s,route,memory=null,target=null){need(routes(s).includes(route),'Choose an available route.');need(!memory||s.hand.includes(memory),'Choose a memory in your hand.');
  const m=memory?MEM[memory]:null;if(m&&m.kind==='calm')need(s.shore.includes(target),'Choose a waiting soul for this memory.');else need(!target,'This memory has no target.');
  const r=route==='return'?{id:'return',to:'shore',fog:0,name:'Return to Shore'}:ROUTE[route];
  const first=route!=='return'&&s.step===0;
  const base=first&&s.event==='E04'?0:r.fog;
  const event=first&&s.event==='E01'?1:0;
  const rivals=s.boat.includes('S03')&&s.boat.includes('S04')?1:0;
  const shield=m&&m.kind==='fog'?m.amount:0;
  const fog=Math.max(0,base+pressure(s)+s.wraiths.length+rivals+event-shield);
  const drain=s.boat.includes('S05')?1:0;
  const available=Math.min(C.maxLight,s.light+(m&&m.kind==='light'?m.amount:0));
  const deadlines={...s.deadlines};if(m&&m.kind==='calm')deadlines[target]+=m.amount;
  return {route,to:r.to,name:r.name,memory,target,base,pressure:pressure(s),wraiths:s.wraiths.length,rivals,event,shield,drain,fog,cost:fog+drain,available,remaining:available-fog-drain,lethal:fog+drain>available,
    waitingDue:s.shore.filter(id=>deadlines[id]<=s.tide+1),
    lastChance:s.boat.filter(id=>s.step+1>=(SOUL[id].tainted?C.taintedLimit:C.maxSteps))};
}
function end(s,won,reason){s.phase='ended';s.ending={won,reason};log(s,reason);}
function advance(s){s.tide++;expireWaiting(s);}
function afterArrival(s){for(const id of s.boat.slice()){const limit=SOUL[id].tainted?C.taintedLimit:C.maxSteps;if(s.step>=limit){s.boat=s.boat.filter(x=>x!==id);s.wraiths.push(id);log(s,SOUL[id].name+' became a Ship Wraith after the last delivery chance.');}}
  if(s.hand.length>C.handLimit){s.phase='trim';return;}s.phase='route';if(s.boat.length)offer(s);
}
function matches(s,id){return s.node==='sanctuary'||SOUL[id].wish===s.node;}
function transition(state,action){const s=clone(state);need(action&&typeof action.type==='string','Choose an action.');need(s.phase!=='ended','This night has ended.');
  switch(action.type){
    case'BOARD':need(s.phase==='boarding'&&s.shore.includes(action.id),'Choose a waiting soul at the shore.');need(seats(s)+SOUL[action.id].seats<=capacity(s),'There are not enough seats.');s.shore=s.shore.filter(x=>x!==action.id);s.boat.push(action.id);break;
    case'UNBOARD':need(s.phase==='boarding'&&s.boat.includes(action.id),'Choose an aboard soul before departure.');s.boat=s.boat.filter(x=>x!==action.id);s.shore.push(action.id);s.shore.sort();break;
    case'DEPART':need(s.phase==='boarding'&&s.boat.length>0,'Board at least one passenger.');s.phase='route';break;
    case'REBOARD':need(s.phase==='route'&&s.node==='shore'&&s.step===0,'Boarding is closed after the first move.');s.phase='boarding';break;
    case'PLAN':need(s.phase==='route','Choose a move at the route step.');s.pending=preview(s,action.route,action.memory||null,action.target||null);s.phase='review';break;
    case'BACK':need(s.phase==='review','No move to revise.');s.pending=null;s.phase='route';break;
    case'CROSS':{
      need(s.phase==='review'&&s.pending,'Review a move first.');const p=s.pending;need(!p.lethal||action.acceptFailure===true,'Confirm the known losing move.');
      if(p.memory){s.hand=s.hand.filter(x=>x!==p.memory);s.spent.push(p.memory);const m=MEM[p.memory];if(m.kind==='light')gain(s,m.amount);if(m.kind==='calm')s.deadlines[p.target]+=m.amount;}
      s.pending=null;s.lastMove=p;
      if(p.lethal){end(s,false,'The lantern cannot pay this crossing: '+p.drain+' drain + '+p.fog+' fog, with '+s.light+' light.');break;}
      s.light-=p.cost;log(s,p.name+': paid '+p.drain+' drain + '+p.fog+' fog.');advance(s);
      if(p.route==='return'){
        s.completed++;s.node='shore';log(s,'Trip '+s.trip+' complete.');
        if(s.trip===C.trips){end(s,s.wishes>=C.targetWishes,s.wishes>=C.targetWishes?'Dawn: '+s.wishes+' wishes fulfilled and the final return survived.':'Dawn: '+s.wishes+' of '+C.targetWishes+' wishes fulfilled.');}
        else{s.trip++;startTrip(s);}break;
      }
      discardOffers(s,p.route);s.node=p.to;s.step++;
      if(s.node==='haven'){gain(s,1);log(s,'Haven restored 1 light, up to the cap. No delivery.');afterArrival(s);}else{s.phase='delivery';}break;
    }
    case'DELIVER':{
      need(s.phase==='delivery','Deliver at a destination.');const ids=action.ids;need(unique(ids)&&ids.every(id=>s.boat.includes(id)),'Select distinct passengers aboard.');
      const matched=ids.filter(id=>matches(s,id));
      for(const id of ids){s.boat=s.boat.filter(x=>x!==id);const match=matched.includes(id);s.delivered.push({id,to:s.node,matched:match,via:'boat'});if(match){s.wishes++;if(s.node!=='sanctuary'&&SOUL[id].memory)s.hand.push(SOUL[id].memory);}}
      if(matched.length&&s.node!=='sanctuary')gain(s,1);
      if(matched.includes('S01')&&matched.includes('S02')&&s.quest==='locked'){s.quest='ready';log(s,'Mother and Child reunited. Passage is ready.');}
      log(s,ids.length?'Delivered '+ids.map(id=>SOUL[id].name).join(', ')+'. '+matched.length+' wish(es) matched.':'No passengers delivered.');afterArrival(s);break;
    }
    case'DISCARD':need(s.phase==='trim'&&s.hand.includes(action.id),'Choose a memory to discard.');s.hand=s.hand.filter(x=>x!==action.id);s.spent.push(action.id);if(s.hand.length<=C.handLimit){s.phase='route';if(s.boat.length)offer(s);}break;
    case'PASSAGE':need((s.phase==='boarding'||s.phase==='route')&&s.quest==='ready'&&s.shore.includes(action.id),'Passage needs a waiting soul before a move.');s.shore=s.shore.filter(x=>x!==action.id);s.delivered.push({id:action.id,to:SOUL[action.id].wish,matched:true,via:'quest'});s.wishes++;s.quest='used';log(s,'Passage sent '+SOUL[action.id].name+' directly to their wish. No light or memory gained.');if(s.phase==='boarding'&&!s.shore.length&&!s.boat.length&&!s.arrivals.length&&s.completed>0)end(s,s.wishes>=C.targetWishes,'The last waiting soul crossed by Passage after a survived return. '+s.wishes+' of '+C.targetWishes+' wishes fulfilled.');break;
    case'CONCEDE':end(s,false,'The ferryman ended the night early.');break;
    default:throw new Error('Unknown action.');
  }
  return s;
}
function validate(s){
  need(s&&s.version===D.version,'This save is not a v0.5 night.');
  for(const key of ['seed','rng','trip','step','tide','light','wishes','completed'])need(Number.isInteger(s[key]),'Invalid '+key+'.');
  need(s.seed>=0&&s.seed<=4294967295&&s.rng>=0&&s.rng<=4294967295,'Invalid seed.');
  need(s.trip>=1&&s.trip<=C.trips&&s.step>=0&&s.step<=3&&s.tide>=0&&s.tide<=16&&s.light>=0&&s.light<=6&&s.wishes>=0&&s.wishes<=14&&s.completed>=0&&s.completed<=4,'Invalid counter range.');
  need(['boarding','route','review','delivery','trim','ended'].includes(s.phase),'Invalid phase.');
  need(['shore',...Object.keys(D.destinations)].includes(s.node),'Invalid stop.');
  for(const key of ['shore','boat','wraiths','hand','spent','arrived','arrivals','routeDeck','routeDiscard','offers','retiredRoutes','events','seenEvents'])need(unique(s[key]),'Invalid '+key+' list.');
  need(Array.isArray(s.delivered)&&Array.isArray(s.log)&&s.log.length<500,'Invalid record.');
  need(s.deadlines&&typeof s.deadlines==='object'&&!Array.isArray(s.deadlines),'Invalid deadlines.');
  need(s.log.every(x=>x&&typeof x.text==='string'&&x.text.length<1000&&Number.isInteger(x.tide)&&Number.isInteger(x.trip)),'Invalid log.');
  need(s.delivered.every(x=>x&&SOUL[x.id]&&Object.keys(D.destinations).includes(x.to)&&typeof x.matched==='boolean'&&['boat','quest'].includes(x.via)),'Invalid delivery.');
  const zones=[...s.shore,...s.boat,...s.wraiths,...s.delivered.map(x=>x.id)];need(unique(zones)&&zones.every(x=>SOUL[x]),'Soul appears in multiple zones.');
  need(unique([...s.arrived,...s.arrivals])&&[...s.arrived,...s.arrivals].length===D.arrivals.length&&[...s.arrived,...s.arrivals].every(x=>ARRIVAL[x]),'Invalid arrival supply.');
  const arrivedSouls=s.arrived.flatMap(id=>ARRIVAL[id].souls).sort();need(JSON.stringify(arrivedSouls)===JSON.stringify(zones.slice().sort()),'Arrival and soul zones disagree.');
  need([...s.shore,...s.boat].every(id=>Number.isInteger(s.deadlines[id])&&s.deadlines[id]>=0&&s.deadlines[id]<=40),'Invalid waiting deadline.');
  need(s.shore.every(id=>s.deadlines[id]>s.tide),'An expired soul is still waiting.');
  need(unique([...s.hand,...s.spent])&&[...s.hand,...s.spent].every(x=>MEM[x]),'Invalid memories.');
  const earned=s.delivered.filter(x=>x.matched&&x.to!=='sanctuary'&&x.via==='boat').map(x=>SOUL[x.id].memory).filter(Boolean).sort();need(JSON.stringify(earned)===JSON.stringify([...s.hand,...s.spent].sort()),'Memory rewards disagree.');
  need(s.wishes===s.delivered.filter(x=>x.matched).length,'Wish count disagrees.');
  const rs=[...s.routeDeck,...s.routeDiscard,...s.offers,...s.retiredRoutes];need(unique(rs)&&rs.length===D.routes.length&&rs.every(x=>ROUTE[x])&&s.retiredRoutes.every(x=>x==='R09'),'Invalid route supply.');
  need(unique([...s.events,...s.seenEvents])&&[...s.events,...s.seenEvents].length===D.events.length&&[...s.events,...s.seenEvents].every(x=>EVENT[x]),'Invalid events.');
  need(s.event===null||s.seenEvents.includes(s.event),'Invalid active event.');need(['locked','ready','used'].includes(s.quest),'Invalid quest.');
  need(seats(s)<=capacity(s),'Boat exceeds capacity.');
  need(s.phase==='trim'?s.hand.length>C.handLimit:s.hand.length<=C.handLimit,'Invalid hand size.');
  if(s.phase==='boarding')need(s.node==='shore'&&s.step===0&&s.offers.length===2,'Invalid boarding state.');
  if(s.phase==='delivery')need(s.node!=='shore'&&s.node!=='haven'&&s.boat.length>0&&s.offers.length===0,'Invalid delivery state.');
  if(s.phase==='review'){need(s.pending,'Missing crossing plan.');const t=clone(s);t.phase='route';const p=preview(t,s.pending.route,s.pending.memory,s.pending.target);need(JSON.stringify(p)===JSON.stringify(s.pending),'Crossing preview was altered.');}else need(s.pending===null,'Unexpected crossing plan.');
  need((s.phase==='ended')===(s.ending!==null),'Invalid ending state.');
  if(s.ending)need(typeof s.ending.won==='boolean'&&typeof s.ending.reason==='string','Invalid ending.');
  return true;
}
function save(s){validate(s);return JSON.stringify(s,null,2);}
function load(text){need(typeof text==='string'&&text.length<=200000,'Save is too large.');const s=JSON.parse(text);validate(s);return s;}
return {D,C,SOUL,MEM,ROUTE,EVENT,create,transition,preview,routes,capacity,seats,pressure,matches,validate,save,load};
});
