/* The Ferryman v0.4. Pure rules engine. See RULES.md for approved changes and retained rules. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;else root.Ferryman=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='0.4', MAX_LIGHT=6;
const NODES={shore:'Starting Shore',elysium:'Elysium',asphodel:'Asphodel',tartarus:'Tartarus',haven:'Haven'};
const FOG={shore:0,elysium:0,asphodel:1,tartarus:2,haven:0};
const DEST=['elysium','asphodel','tartarus'];
const TEMPLATES=[
 ['Mother',2,'elysium','S02','joint','Keep the child close.'],
 ['Child',1,'elysium','S01','joint','The child looks back for their mother.'],
 ['Merchant',1,'tartarus',null,'R02','The ledger closes. There is no fare to count.'],
 ['Red Soldier',2,'tartarus',null,'R04','With the Blue Soldier from the same group: +1 fog.'],
 ['Poet',1,'asphodel',null,'R03','With at least two other passengers: prevent 1 fog.'],
 ['Blue Soldier',1,'asphodel',null,'R04','With the Red Soldier from the same group: +1 fog.'],
 ['Cook',1,'asphodel',null,'R03','The cook remembers a table with room for one more.'],
 ['Mason',2,'elysium',null,'R02','Stone-dusted hands rest against the gunwale.'],
 ['Messenger',1,'asphodel',null,'R01','A letter waits for a destination.'],
 ['Keeper',2,'tartarus',null,'R01','When travelling alone: prevent 1 fog.'],
 ['Musician',1,'elysium','S12','joint','Deliver with the Listener to earn Joined memories.'],
 ['Listener',1,'elysium','S11','joint','Deliver with the Musician to earn Joined memories.']
].map((r,i)=>Object.freeze({id:'S'+String(i+1).padStart(2,'0'),name:r[0],seats:r[1],wish:r[2],partner:r[3],memory:r[4],text:r[5]}));
const MEMORIES={
 R01:{name:'Steadiness',protection:2,text:'Prevent 2 fog on this crossing.'},
 R02:{name:'Vigil',protection:1,text:'Prevent 1 fog, or 3 if a two-seat passenger is aboard.'},
 R03:{name:'Recollection',protection:1,target:true,text:'Prevent 1 fog. You may also protect one waiting soul from normal anger on your return.'},
 R04:{name:'Accord',protection:1,text:'Prevent 1 fog and cancel soldier conflicts on this crossing.'},
 R05:{name:'Joined Memory',protection:2,target:true,text:'Prevent 2 fog. You may also protect one waiting soul from normal anger on your return.'},
 R06:{name:'Faint Memory',protection:1,text:'Prevent 1 fog on this crossing.'}
};
Object.values(MEMORIES).forEach(Object.freeze);Object.freeze(MEMORIES);Object.freeze(TEMPLATES);Object.freeze(NODES);
const copy=x=>JSON.parse(JSON.stringify(x));
const has=(a,x)=>a.includes(x);
const requireRule=(condition,message)=>{if(!condition)throw new Error(message);};
function template(s,id){return TEMPLATES.find(t=>t.id===s.souls[id].template);}
function soul(s,id){const q=s.souls[id];return {...q,...template(s,id),id:q.id};}
function partner(s,id){const q=s.souls[id],t=template(s,id);return t.partner?'C'+String(q.cohort).padStart(2,'0')+'-'+t.partner:null;}
function seats(s){return s.boat.reduce((n,id)=>n+template(s,id).seats,0);}
function refill(s){while(s.shore.length<5){const i=s.supply++,cohort=Math.floor(i/12)+1,t=TEMPLATES[i%12],id='C'+String(cohort).padStart(2,'0')+'-'+t.id;s.souls[id]={id,template:t.id,cohort,anger:0};s.shore.push(id);}}
function rand(s){s.rng=(s.rng+0x6D2B79F5)>>>0;let t=s.rng;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;}
function draw(s){while(s.hand.length<3){if(!s.deck.length){if(!s.discard.length)break;s.deck=s.discard.splice(0);for(let i=s.deck.length-1;i>0;i--){const j=Math.floor(rand(s)*(i+1));[s.deck[i],s.deck[j]]=[s.deck[j],s.deck[i]];}}s.hand.push(s.deck.shift());}}
function gain(s,n){const before=s.light;s.light=Math.min(MAX_LIGHT,s.light+n);return s.light-before;}
function createGame(seed=1){
 requireRule(Number.isInteger(seed)&&seed>=0&&seed<=4294967295,'Seed must be an unsigned integer.');
 const s={version:VERSION,seed,rng:seed,phase:'boarding',node:'shore',cycle:1,completed:0,light:2,supply:0,souls:{},shore:[],boat:[],wraiths:[],visited:[],waiting:[],separated:[],guarded:[],memories:{},hand:[],deck:[],discard:[],memorySeq:0,pending:null,result:null,events:[],delivered:[],crossings:0,released:0,formed:0,ended:false};
 refill(s);return s;
}
function routes(s){
 const candidates=s.node==='shore'?DEST:[...DEST.filter(n=>n!==s.node),'haven','shore'].filter(n=>n!==s.node);
 return candidates.map(to=>{
  let reason='';
  if(to!=='shore'&&has(s.visited,to))reason='Already visited on this trip.';
  if(to==='shore'&&s.boat.length)reason='Deliver every passenger before returning.';
  if(to==='haven'&&s.boat.length&&DEST.every(n=>has(s.visited,n)))reason='No destinations remain for these passengers.';
  return{to,name:NODES[to],disabled:!!reason,reason};
 });
}
function forecast(s){
 return s.waiting.filter(id=>has(s.shore,id)).map(id=>{const normal=has(s.guarded,id)?0:1,extra=has(s.separated,id)?1:0;return{id,name:template(s,id).name,before:s.souls[id].anger,after:s.souls[id].anger+normal+extra,normal,extra};});
}
function preview(s,to,memoryId=null){
 requireRule(Object.hasOwn(NODES,to),'Unknown destination.');
 const card=memoryId?s.memories[memoryId]:null;
 const m=card?MEMORIES[card.type]:null;
 const favored=s.cycle>=6?DEST[(s.cycle-6)%3]:null;
 const escalation=to!=='shore'&&s.cycle>=5&&to!==favored?1:0;
 let conflict=0,passenger=0;
 for(const id of s.boat){const t=template(s,id),q=s.souls[id];
  if(t.id==='S04'&&s.boat.some(x=>s.souls[x].cohort===q.cohort&&template(s,x).id==='S06'))conflict++;
  if(t.id==='S05'&&s.boat.length>=3)passenger++;
  if(t.id==='S10'&&s.boat.length===1)passenger++;
 }
 if(card&&card.type==='R04')conflict=0;
 const memory=m?(card.type==='R02'&&s.boat.some(id=>template(s,id).seats===2)?3:m.protection):0;
 const damage=Math.max(0,FOG[to]+escalation+s.wraiths.length+conflict-passenger-memory);
 return{base:FOG[to],escalation,wraiths:s.wraiths.length,conflict,passenger,memory,damage,after:s.light-damage,lethal:damage>s.light,favored};
}
function memoryType(s,id,selected){const t=template(s,id);return t.memory==='joint'?(has(selected,partner(s,id))?'R05':'R06'):t.memory;}
function deliveryPreview(s,ids){
 return ids.map(id=>({id,name:template(s,id).name,match:template(s,id).wish===s.node,memory:memoryType(s,id,ids)}));
}
function setResult(s,title,lines,next,image=s.node){s.result={title,lines,next,image};s.phase='result';}
function act(s,a){
 requireRule(a&&typeof a==='object'&&typeof a.type==='string','Choose an action.');
 requireRule(!s.ended||a.type==='CONTINUE','This run has ended.');
 const phase=s.phase;
 switch(a.type){
 case 'BOARD':
  requireRule(phase==='boarding'&&has(s.shore,a.id),'Choose a waiting soul.');
  requireRule(seats(s)+template(s,a.id).seats<=4,'The boat has only four seats.');
  s.shore=s.shore.filter(x=>x!==a.id);s.boat.push(a.id);break;
 case 'UNBOARD':
  requireRule(phase==='boarding'&&has(s.boat,a.id),'Choose an aboard soul.');
  s.boat=s.boat.filter(x=>x!==a.id);s.shore.push(a.id);s.shore.sort();break;
 case 'READY':
  requireRule(phase==='boarding','Finish choosing passengers first.');s.phase='route';break;
 case 'ROUTE':
  requireRule(phase==='route','Choose a route at the route step.');
  {const r=routes(s).find(r=>r.to===a.to);requireRule(r&&!r.disabled,r?r.reason:'That route is unavailable.');
   s.pending={to:a.to,memory:null,target:null};s.phase='memory';}break;
 case 'MEMORY':
  requireRule(phase==='memory','Choose a memory at the memory step.');
  requireRule(a.id===null||has(s.hand,a.id),'That memory is not in your hand.');
  if(a.target!==null&&a.target!==undefined){
   requireRule(a.id&&MEMORIES[s.memories[a.id].type].target,'This memory has no target.');
   requireRule(has(s.shore,a.target)&&!has(s.guarded,a.target),'Choose an unprotected waiting soul.');
  }
  s.pending.memory=a.id;s.pending.target=a.target||null;s.phase='review';break;
 case 'BACK':
  if(phase==='route'&&s.node==='shore')s.phase='boarding';
  else if(phase==='memory'){s.pending=null;s.phase='route';}
  else if(phase==='review'){s.pending.memory=null;s.pending.target=null;s.phase='memory';}
  else throw new Error('There is no previous decision here.');break;
 case 'RELEASE':
  requireRule(phase==='route','Release a wraith before choosing a route.');
  requireRule(has(s.wraiths,a.id),'Choose an active wraith.');
  requireRule(s.light>=2,'Releasing a wraith needs 2 light.');
  s.light-=2;s.wraiths=s.wraiths.filter(x=>x!==a.id);s.released++;
  setResult(s,'A soul finds peace',[template(s,a.id).name+' is released.','You spent 2 light. Future crossings have one less wraith in the fog.'],'route','wraith');break;
 case 'CROSS':{
  requireRule(phase==='review'&&s.pending,'Review the crossing first.');
  const p=s.pending,r=routes(s).find(r=>r.to===p.to);requireRule(r&&!r.disabled,'This route is no longer available.');
  const v=preview(s,p.to,p.memory);
  requireRule(!v.lethal||a.confirm===true,'The fog exceeds your light. Confirm to end this run.');
  if(s.node==='shore'){
   s.waiting=s.shore.slice();s.separated=s.shore.filter(id=>has(s.boat,partner(s,id)));
  }
  if(p.memory){s.hand=s.hand.filter(x=>x!==p.memory);s.discard.push(p.memory);if(p.target&&!has(s.guarded,p.target))s.guarded.push(p.target);}
  s.pending=null;
  if(v.lethal){s.ended=true;setResult(s,'The lantern cannot hold the fog',[v.damage+' fog exceeded your '+s.light+' light.','The journey ends before arrival.'],'ended',s.node);break;}
  s.light-=v.damage;s.crossings++;s.node=p.to;
  const lines=['The crossing cost '+v.damage+' light. You have '+s.light+' left.'];
  if(p.to==='shore'){
   const changes=forecast(s);for(const f of changes){s.souls[f.id].anger=f.after;if(f.after>=3){s.wraiths.push(f.id);s.formed++;s.shore=s.shore.filter(x=>x!==f.id);lines.push(f.name+' became a wraith.');}else lines.push(f.name+': anger '+f.before+' → '+f.after+(f.extra?' (separated partner).':'.'));}
   s.completed++;s.cycle++;s.visited=[];s.waiting=[];s.separated=[];s.guarded=[];
   const restored=gain(s,1);refill(s);draw(s);
   lines.push('Restored '+restored+' light. New souls join the waiting shore.');
   if(s.cycle===5)lines.push('From this trip onward, non-return crossings add 1 fog.');
   if(s.cycle>=6)lines.push('This trip, '+NODES[DEST[(s.cycle-6)%3]]+' avoids the extra cycle fog.');
   setResult(s,'Back at the shore',lines,'boarding');
  }else{
   s.visited.push(p.to);
   if(p.to==='haven'){lines.push('The haven restored '+gain(s,1)+' light.');draw(s);setResult(s,'A quiet landing',lines,'route');}
   else setResult(s,'Arrival at '+NODES[p.to],lines,'delivery');
  }break;
 }
 case 'DELIVER':{
  requireRule(phase==='delivery','Choose who disembarks after arriving.');
  requireRule(Array.isArray(a.ids)&&new Set(a.ids).size===a.ids.length&&a.ids.every(id=>has(s.boat,id)),'Choose passengers currently aboard.');
  requireRule(!DEST.every(n=>has(s.visited,n))||a.ids.length===s.boat.length,'This is the last destination this trip. Deliver everyone before leaving.');
  const selected=a.ids.slice().sort(),items=deliveryPreview(s,selected),lines=[];
  for(const d of items){
   s.boat=s.boat.filter(id=>id!==d.id);s.delivered.push({id:d.id,to:s.node,match:d.match});
   const mid='M'+(++s.memorySeq);s.memories[mid]={id:mid,type:d.memory,source:d.id,destination:s.node};s.deck.push(mid);
   const light=d.match?gain(s,1):0;
   lines.push(d.name+' leaves you '+MEMORIES[d.memory].name+'. '+(d.match?'Wish fulfilled: '+light+' light restored.':'Their wish was different; no light restored.'));
  }
  if(s.node==='elysium'&&!has(s.events,'farewell')&&selected.some(id=>has(selected,partner(s,id)))){
   s.events.push('farewell');lines.push('Shared Farewell: a linked pair arrived together at Elysium. '+gain(s,1)+' extra light restored. This event happens once per run.');
  }
  if(!selected.length)lines.push('Everyone stays aboard for the next destination.');
  draw(s);setResult(s,selected.length?'A memory stays with you':'The journey continues',lines,'route');break;
 }
 case 'CONTINUE':
  requireRule(phase==='result'&&s.result,'There is no result to continue from.');
  s.phase=s.result.next;s.result=null;break;
 default:throw new Error('Unknown action.');
 }
}
function dispatch(state,action){
 try{const s=copy(state);act(s,action);return{ok:true,state:s,error:null};}
 catch(e){return{ok:false,state,error:e.message};}
}
function validate(s){
 const int=(x,min,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
 requireRule(s&&typeof s==='object'&&!Array.isArray(s)&&s.version===VERSION,'This save is not a v0.4 run.');
 const expected=Object.keys(createGame()).sort().join('|');
 requireRule(Object.keys(s).sort().join('|')===expected,'Save fields do not match v0.4.');
 requireRule(['boarding','route','memory','review','result','delivery','ended'].includes(s.phase)&&Object.hasOwn(NODES,s.node),'Unknown phase or stop.');
 requireRule(int(s.light,0,6)&&int(s.cycle,1)&&int(s.completed,0)&&s.cycle===s.completed+1&&int(s.seed,0,4294967295)&&int(s.rng,0,4294967295),'Invalid light or trip count.');
 requireRule(typeof s.ended==='boolean'&&int(s.supply,5)&&int(s.memorySeq,0)&&int(s.crossings,0)&&int(s.released,0)&&int(s.formed,0),'Invalid run counters.');
 for(const k of ['souls','memories'])requireRule(s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k]),'Invalid collection.');
 for(const k of ['shore','boat','wraiths','visited','waiting','separated','guarded','hand','deck','discard','events','delivered'])requireRule(Array.isArray(s[k]),'Missing '+k+'.');
 const soulIds=Object.keys(s.souls);
 requireRule(soulIds.length===s.supply,'Soul supply does not match.');
 for(let i=0;i<s.supply;i++){const cohort=Math.floor(i/12)+1,t=TEMPLATES[i%12],id='C'+String(cohort).padStart(2,'0')+'-'+t.id,q=s.souls[id];requireRule(q&&q.id===id&&q.template===t.id&&q.cohort===cohort&&int(q.anger,0,4),'Invalid soul identity or anger.');}
 for(const k of ['shore','boat','wraiths','waiting','separated','guarded'])requireRule(new Set(s[k]).size===s[k].length&&s[k].every(id=>Object.hasOwn(s.souls,id)),'Invalid '+k+'.');
 requireRule(s.delivered.every(d=>d&&Object.hasOwn(s.souls,d.id)&&DEST.includes(d.to)&&typeof d.match==='boolean'&&d.match===(template(s,d.id).wish===d.to)),'Invalid delivery record.');
 const active=[...s.shore,...s.boat,...s.wraiths,...s.delivered.map(d=>d.id)];
 requireRule(new Set(active).size===active.length&&seats(s)<=4,'A soul is duplicated or the boat is over capacity.');
 requireRule(s.shore.every(id=>s.souls[id].anger<3)&&s.boat.every(id=>s.souls[id].anger<3)&&s.wraiths.every(id=>s.souls[id].anger>=3),'Invalid anger status.');
 requireRule(s.separated.every(id=>has(s.waiting,id))&&s.guarded.every(id=>has(s.shore,id)),'Invalid protection or separation marker.');
 requireRule(s.formed===s.wraiths.length+s.released&&active.length+s.released===s.supply,'Invalid wraith totals.');
 requireRule(s.visited.every(x=>DEST.includes(x)||x==='haven')&&new Set(s.visited).size===s.visited.length,'Invalid visited stops.');
 requireRule(s.node==='shore'?s.visited.length===0:has(s.visited,s.node),'Location does not match visited stops.');
 requireRule(s.events.length<=1&&s.events.every(e=>e==='farewell'),'Unknown event.');
 requireRule(s.memorySeq===s.delivered.length&&Object.keys(s.memories).length===s.memorySeq,'Invalid memory count.');
 const piles=[...s.hand,...s.deck,...s.discard];
 requireRule(s.hand.length<=3&&piles.length===s.memorySeq&&new Set(piles).size===piles.length,'Invalid memory piles.');
 for(const id of piles){const m=s.memories[id];requireRule(m&&m.id===id&&Object.hasOwn(MEMORIES,m.type)&&s.delivered.some(d=>d.id===m.source&&d.to===m.destination),'Invalid memory source.');}
 if(s.phase==='boarding')requireRule(s.node==='shore'&&!s.ended,'Boarding is shore-only.');
 if(s.phase==='delivery')requireRule(DEST.includes(s.node)&&!s.ended,'Invalid delivery phase.');
 requireRule(s.ended?(s.phase==='ended'||(s.phase==='result'&&s.result&&s.result.next==='ended')):s.phase!=='ended','Invalid ending.');
 if(s.phase==='memory'||s.phase==='review'){
  const p=s.pending;requireRule(p&&routes(s).some(r=>r.to===p.to&&!r.disabled),'Invalid planned route.');
  requireRule(p.memory===null||has(s.hand,p.memory),'Invalid planned memory.');
  requireRule(p.target===null||(p.memory&&MEMORIES[s.memories[p.memory].type].target&&has(s.shore,p.target)&&!has(s.guarded,p.target)),'Invalid memory target.');
 }else requireRule(s.pending===null,'Unexpected planned route.');
 if(s.phase==='result'){const r=s.result;requireRule(r&&typeof r.title==='string'&&r.title.length<200&&Array.isArray(r.lines)&&r.lines.every(l=>typeof l==='string'&&l.length<1000)&&['boarding','route','delivery','ended'].includes(r.next)&&(Object.hasOwn(NODES,r.image)||r.image==='wraith'),'Invalid result screen.');
  requireRule(r.next!=='boarding'||s.node==='shore','Invalid next boarding step.');
  requireRule(r.next!=='delivery'||DEST.includes(s.node),'Invalid next delivery step.');
 }else requireRule(s.result===null,'Unexpected result.');
 return true;
}
function deserialize(text){try{const s=JSON.parse(text);validate(s);return{ok:true,state:s,error:null};}catch(e){return{ok:false,state:null,error:e.message};}}
return Object.freeze({version:VERSION,NODES,TEMPLATES,MEMORIES,createGame,dispatch,preview,routes,soul,partner,seats,forecast,deliveryPreview,validate,serialize:s=>JSON.stringify(s),deserialize});
});

