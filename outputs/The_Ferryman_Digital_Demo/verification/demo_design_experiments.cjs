const fs=require('node:fs');const path=require('node:path');const E=require('../engine.js');
const byId=Object.fromEntries(E.SOULS.map(s=>[s.id,s]));
const reference=[
 {soulIds:['S01','S02','S05'],routeId:'AS01'},
 {soulIds:['S03','S04','S06'],routeId:'TA01',memoryType:'R05',targetId:'S08'},
 {soulIds:['S07','S08','S09'],routeId:'TA01',memoryType:'R02'},
 {soulIds:['S10','S11','S12'],routeId:'TA01',memoryType:'R04'},
 {soulIds:[],routeId:'AS01'},
 {soulIds:[],routeId:'AS01',memoryType:'R01'}
];
function fixedPlan(routeOverride=null){return state=>{
 const item=reference[state.crossing-1]; const mem=item.memoryType?state.hand.find(m=>m.type===item.memoryType):null;
 if(item.memoryType&&!mem)throw new Error('Reference memory unavailable');
 return {routeId:routeOverride||item.routeId,soulIds:item.soulIds,memoryKey:mem?.key||null,targetId:item.targetId||null};
};}
function compare(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){if(a[i]!==b[i])return a[i]>b[i]?1:-1;}return 0;}
// Deliberately myopic: chooses today's printed rewards, not future wraith/queue effects.
// Memory selection then protects the immediate resource total and refusal count.
function greedy(policy,routeId){return state=>{
 const loads=[]; for(let mask=0;mask<(1<<state.shore.length);mask++){
  const ids=state.shore.filter((_,i)=>mask&(1<<i)).map(x=>x.id); const souls=ids.map(id=>byId[id]);
  if(souls.reduce((n,s)=>n+s.seats,0)>4)continue;
  const fares=souls.reduce((n,s)=>n+s.fare,0),standing=souls.reduce((n,s)=>n+s.standing,0);
  const linked=souls.filter(s=>s.partner&&ids.includes(s.partner)).length/2;
  const score=policy==='fares'?[fares,ids.length,standing]:[standing,linked,ids.length];
  loads.push({ids,score,key:ids.join(',')});
 }
 loads.sort((a,b)=>compare(b.score,a.score)||a.key.localeCompare(b.key));
 const ids=loads[0].ids,waiting=state.shore.filter(s=>!ids.includes(s.id)); const options=[];
 for(const mem of [null,...state.hand]){
  const targets=mem&&['R03','R05'].includes(mem.type)&&waiting.length?waiting.map(s=>s.id):[null];
  for(const targetId of targets){
   const selection={soulIds:ids,routeId,memoryKey:mem?.key||null,targetId};const p=E.preview(state,selection);if(!p.valid)continue;
   const predictedWraiths=p.waiting.filter(s=>s.becomesWraith).length,refusals=p.waiting.reduce((n,s)=>n+s.after,0);
   options.push({selection,score:[p.wouldFail?0:1,p.projectedStanding,-predictedWraiths,-refusals,mem?-1:0],key:(mem?.key||'')+(targetId||'')});
  }
 }
 options.sort((a,b)=>compare(b.score,a.score)||a.key.localeCompare(b.key));
 if(!options.length)return {soulIds:ids,routeId,memoryKey:null,targetId:null};
 return options[0].selection;
};}
function experiment(id,label,policy,selector){
 let s=E.createGame();const steps=[];let blocked=null;
 while(s.status==='playing'){
  const c=selector(s),p=E.preview(s,c);
  const row={crossing:s.crossing,before:{obols:s.obols,standing:s.standing,shore:s.shore,supply:s.supply,hand:s.hand,wraiths:s.wraiths},selection:c,preview:p};
  if(!p.valid){row.blocked=p.errors;steps.push(row);blocked=p.errors;break;}
  const r=E.resolve(s,c);s=r.state;
  row.after={status:s.status,lossReason:s.lossReason,obols:s.obols,standing:s.standing,delivered:s.history.length,wraiths:s.wraiths,shore:s.shore};
  steps.push(row);
 }
 return {id,label,policy,status:blocked?'policy_blocked':s.status,lossReason:s.lossReason,blocked,steps,
 summary:{attemptedCrossings:steps.length,resolvedCrossings:steps.filter(x=>x.after).length,delivered:s.history.length,wraiths:s.wraiths.length,obols:s.obols,standing:s.standing,emptyCrossings:steps.filter(x=>x.after&&x.selection.soulIds.length===0).map(x=>x.crossing),allSoulsDeliveredAfter:steps.find(x=>x.after?.delivered===12)?.crossing||null,unusedNewMemorySources:s.queue.map(m=>m.sourceId)},final:s};
}
const runs=[
 experiment('reference','Pair-preserving mixed routes','Exact recorded winning plan. Asphodel on 1/5/6; Tartarus on 2/3/4.',fixedPlan()),
 experiment('same_asphodel','Same passengers and memories, Asphodel only','Change only route to Asphodel; preserve every selection and target of reference.',fixedPlan('AS01')),
 experiment('same_tartarus','Same passengers and memories, Tartarus only','Change only route to Tartarus, including empty crossings; preserve reference selections.',fixedPlan('TA01')),
 experiment('same_elysium','Same passengers and memories, Elysium only','Change only route to Elysium; stop when route unaffordable instead of silently changing policy.',fixedPlan('EL01')),
 experiment('fares_asphodel','Early fares, Asphodel','Maximize current printed fares, then passenger count, then Standing yield, then ascending IDs. Choose valid memory/target to avoid current failure, maximize immediate Standing, minimize new wraiths/refusals, then prefer no card.',greedy('fares','AS01')),
 experiment('fares_tartarus','Early fares, Tartarus','Same fare-first load and memory policy, fixed Tartarus.',greedy('fares','TA01')),
 experiment('compassion_asphodel','Standing and pairs first, Asphodel','Maximize current printed Standing, then jointly boarded pairs, then passenger count, then ascending IDs. Same immediate memory chooser as fare policy. Not a moral score.',greedy('compassion','AS01'))
];
// Two focused branch comparisons make the design interpretation reproducible.
let fareBranch=E.createGame();
for(const row of runs.find(r=>r.id==='fares_tartarus').steps.slice(0,2))fareBranch=E.resolve(fareBranch,row.selection).state;
const thirdChoice=runs.find(r=>r.id==='fares_tartarus').steps[2].selection;
const routeProbe={label:'Same fare-first crossing-3 boat, before failed Tartarus departure',before:{obols:fareBranch.obols,standing:fareBranch.standing,wraiths:fareBranch.wraiths},passengers:thirdChoice.soulIds,
 options:E.ROUTES.map(route=>({routeId:route.id,preview:E.preview(fareBranch,{...thirdChoice,routeId:route.id})}))};
let faintBranch=E.resolve(E.createGame(),runs.find(r=>r.id==='fares_tartarus').steps[0].selection).state;
const secondChoice=runs.find(r=>r.id==='fares_tartarus').steps[1].selection;
const faintChoice={...secondChoice,memoryKey:faintBranch.hand.find(m=>m.type==='R06').key};
const without=E.resolve(faintBranch,secondChoice).state,withFaint=E.resolve(faintBranch,faintChoice).state;
const stripLog=s=>{const x=E.clone(s);delete x.log;return x;};
const faintProbe={label:'Same fare-first crossing-2 departure, without memory vs Child Faint Memory',withoutSelection:secondChoice,withSelection:faintChoice,
 without:E.preview(faintBranch,secondChoice),with:E.preview(faintBranch,faintChoice),sameResultingStateApartFromLog:JSON.stringify(stripLog(without))===JSON.stringify(stripLog(withFaint))};
const economyProof={elysiumOnly:{startingObols:2,maximumSoulFares:E.SOULS.reduce((n,s)=>n+s.fare,0),mandatoryQuotas:6,mandatoryTolls:6,maximumService:0,minimumShortfall:4,note:'An Elysium-only six-crossing run cannot win under base rules even if all fares arrive: at most 8 income versus 12 mandatory expenditure.'}};
const data={kind:'Seven deterministic desk experiments and two focused branch probes using unchanged base engine. No human playtest, random sampling or balance proof.',engine:'../engine.js',sourceVersion:'0.2',runs,probes:{routeProbe,faintProbe},economyProof};
fs.writeFileSync(path.join(__dirname,'demo_design_experiments.json'),JSON.stringify(data,null,2));
console.log(JSON.stringify(runs.map(r=>({id:r.id,status:r.status,lossReason:r.lossReason,...r.summary,steps:r.steps.map(s=>({crossing:s.crossing,selection:s.selection,pressure:s.preview.pressure,obols:s.after?.obols,standing:s.after?.standing,delivered:s.after?.delivered,wraiths:s.after?.wraiths.length,blocked:s.blocked}))})),null,2));
