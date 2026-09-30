/* Independent rule regression checks against workbook v0.2 sections 6-10.
   Run: node verification/demo-tests.cjs
   Focused fixtures isolate a rule and do not claim to be observed playtests. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const E = require('../engine.js');
let passed = 0; const failures = [];
function test(name, fn) { try { fn(); passed++; } catch (e) { failures.push({name, message:e.message}); } }
function seed(ids, overrides={}) {
  return Object.assign(E.createGame(), {shore:ids.map(id=>({id,refusals:0})), supply:[], queue:[], hand:[], discard:[], wraiths:[], history:[], log:[], obols:8, standing:10},overrides);
}
function choice(ids=[], routeId='AS01', memoryKey=null, targetId=null) { return {routeId,soulIds:ids,memoryKey,targetId}; }
function memory(type='R01', key='test-memory', sourceId='S09') { return {key,type,sourceId}; }
function allMemories(s) { return [...s.hand,...s.queue,...s.discard]; }
function invalid(s,c) { assert.equal(E.preview(s,c).valid,false); assert.throws(()=>E.resolve(s,c)); }
function run(s,c) { const p=E.preview(s,c); assert.equal(p.valid,true,JSON.stringify(p.errors)); return E.resolve(s,c).state; }

test('setup matches ordered paper setup',()=>{
  const s=E.createGame(); assert.equal(s.version,'0.2'); assert.equal(s.crossing,1); assert.equal(s.status,'playing');
  assert.equal(s.obols,2); assert.equal(s.standing,3);
  assert.deepEqual(s.shore,[1,2,3,4,5].map(n=>({id:`S0${n}`,refusals:0})));
  assert.deepEqual(s.supply,['S06','S07','S08','S09','S10','S11','S12']);
  for(const zone of ['queue','hand','discard','wraiths','history']) assert.deepEqual(s[zone],[]);
});
test('opening worked example computes seats, protection and no pressure',()=>{
  const p=E.preview(E.createGame(),choice(['S01','S02','S05']));
  assert.equal(p.valid,true); assert.equal(p.seats,4); assert.equal(p.toll,0); assert.equal(p.protection,1);
  assert.equal(p.pressure,0); assert.equal(p.projectedStanding,6); assert.equal(p.projectedObols,2);
});
test('opening example resolves joint cards, refusal, supply and deterministic Recall',()=>{
  const s=run(E.createGame(),choice(['S01','S02','S05']));
  assert.equal(s.crossing,2); assert.equal(s.obols,2); assert.equal(s.standing,6);
  assert.deepEqual(s.shore,[{id:'S03',refusals:1},{id:'S04',refusals:1},{id:'S06',refusals:0},{id:'S07',refusals:0},{id:'S08',refusals:0}]);
  assert.deepEqual(s.hand.map(m=>[m.sourceId,m.type]),[['S01','R05'],['S02','R05']]);
  assert.deepEqual(s.queue.map(m=>[m.sourceId,m.type]),[['S05','R03']]); assert.equal(s.history.length,3);
});
test('preview and resolve never mutate input',()=>{
  const s=E.createGame(),before=JSON.stringify(s),c=choice(['S01','S02','S05']); E.preview(s,c); assert.equal(JSON.stringify(s),before);
  E.resolve(s,c); assert.equal(JSON.stringify(s),before);
});
test('reject duplicate, unavailable, unknown and overcapacity passengers',()=>{
  const s=E.createGame(); for(const ids of [['S03','S03'],['S12'],['unknown'],['S01','S04','S05']]) invalid(s,choice(ids));
  invalid(s,choice([], 'unknown'));
});
test('fare cannot prepay Elysium toll',()=>invalid(seed(['S03'],{obols:0}),choice(['S03'],'EL01')));
test('arrival Standing cannot prepay memory',()=>invalid(seed(['S05'],{standing:0,hand:[memory()]}),choice(['S05'],'EL01','test-memory')));
test('memory must exist in current hand',()=>invalid(seed(['S03']),choice(['S03'],'AS01','not-in-hand')));
test('Steadiness protects two and Faint Memory protects one',()=>{
  for(const [type,value] of [['R01',2],['R06',1]]){
    const s=seed(['S03'],{hand:[memory(type)]}),p=E.preview(s,choice(['S03'],'TA01','test-memory'));
    assert.equal(p.memoryCost,1); assert.equal(p.protection,value); assert.equal(p.pressure,2-value);
  }
});
test('Vigil tests printed two-seat cost and still costs Standing when it has no effect',()=>{
  for(const [id,value] of [['S01',3],['S03',0]]){
    const p=E.preview(seed([id],{hand:[memory('R02')]}),choice([id],'TA01','test-memory'));
    assert.equal(p.protection,value); assert.equal(p.memoryCost,1);
  }
});
test('soldier conflict is once per boat and Accord cancels it plus adds protection',()=>{
  const s=seed(['S04','S06'],{hand:[memory('R04')]});
  let p=E.preview(s,choice(['S04','S06'])); assert.equal(p.conflictPressure,1); assert.equal(p.pressure,2);
  p=E.preview(s,choice(['S04','S06'],'AS01','test-memory')); assert.equal(p.conflictPressure,0); assert.equal(p.protection,1); assert.equal(p.pressure,0);
});
test('Poet counts other people, not occupied seats',()=>{
  let s=seed(['S01','S05','S03']); assert.equal(E.preview(s,choice(['S01','S05'])).protection,0);
  assert.equal(E.preview(s,choice(['S01','S05','S03'])).protection,1);
});
test('Keeper protects only when sole passenger',()=>{
  const s=seed(['S10','S03']); assert.equal(E.preview(s,choice(['S10'])).protection,1);
  assert.equal(E.preview(s,choice(['S10','S03'])).protection,0);
});
test('targeted memories require a waiting soul and reject boarded or wraith targets',()=>{
  for(const type of ['R03','R05']){
    const s=seed(['S01','S03'],{hand:[memory(type)],wraiths:[{id:'S08',since:0}]});
    for(const target of [null,'S03','S08']) invalid(s,choice(['S03'],'AS01','test-memory',target));
    assert.equal(E.preview(s,choice(['S03'],'AS01','test-memory','S01')).valid,true);
  }
});
test('targeted memories remain playable with no waiting soul',()=>{
  for(const type of ['R03','R05']) assert.equal(E.preview(seed(['S03'],{hand:[memory(type)]}),choice(['S03'],'AS01','test-memory')).valid,true);
});
test('Recollection prevents normal refusal and Joined Memory additionally grants two protection',()=>{
  for(const [type,protection] of [['R03',0],['R05',2]]){
    const s=seed(['S03','S07'],{hand:[memory(type)]}),c=choice(['S03'],'AS01','test-memory','S07');
    assert.equal(E.preview(s,c).protection,protection); assert.equal(run(s,c).shore.find(x=>x.id==='S07').refusals,0);
  }
});
test('linked solo and joint acquisitions create one labelled card per soul',()=>{
  for(const ids of [['S01'],['S01','S02'],['S11'],['S11','S12']]){
    const s=run(seed(ids),choice(ids));
    assert.deepEqual(allMemories(s).map(m=>[m.sourceId,m.type]),ids.map(id=>[id,ids.length===1?'R06':'R05']));
    assert.equal(new Set(allMemories(s).map(m=>m.key)).size,ids.length);
  }
});
test('later partner arrival does not upgrade a previously acquired solo memory',()=>{
  let s=run(seed(['S01','S02']),choice(['S01'])); assert.equal(s.shore[0].refusals,2);
  s=run(s,choice(['S02'])); const cards=allMemories(s);
  assert.equal(cards.find(m=>m.sourceId==='S01').type,'R06'); assert.equal(cards.find(m=>m.sourceId==='S02').type,'R06');
});
test('normal decay prevention does not cancel separation refusal',()=>{
  for(const type of ['R03','R05']){
    const s=seed(['S01','S02'],{hand:[memory(type)],shore:[{id:'S01',refusals:1},{id:'S02',refusals:0}]});
    const r=run(s,choice(['S02'],'AS01','test-memory','S01')); assert.equal(r.shore[0].refusals,2); assert.equal(r.wraiths.length,0);
  }
});
test('separation can create a wraith, which affects only the following crossing',()=>{
  const s=seed(['S01','S02'],{shore:[{id:'S01',refusals:1},{id:'S02',refusals:0}]});
  const c=choice(['S02']); assert.equal(E.preview(s,c).wraithPressure,0);
  const r=run(s,c); assert.equal(r.wraiths.length,1); assert.equal(r.wraiths[0].id,'S01'); assert.equal(r.shore.length,0);
  assert.equal(E.preview(r,choice()).wraithPressure,1); invalid(r,choice(['S01']));
});
test('partner still in supply has no separation refusal when it later enters shore',()=>{
  const s=run(seed(['S01','S03'],{supply:['S02']}),choice(['S01']));
  assert.equal(s.shore.find(x=>x.id==='S03').refusals,1); assert.equal(s.shore.find(x=>x.id==='S02').refusals,0);
});
test('new memories enter source-ID order irrespective of selection order',()=>{
  const s=run(seed(['S03','S05','S07']),choice(['S07','S05','S03']));
  assert.deepEqual([...s.hand,...s.queue].map(m=>m.sourceId),['S03','S05','S07']);
});
test('Cleanup discards played card first, then hand left-to-right; Recall never shuffles',()=>{
  const first=memory('R06','first','S01'),second=memory('R01','second','S09');
  const s=run(seed([],{hand:[first,second]}),choice([],'AS01','second'));
  assert.deepEqual(s.hand.map(m=>m.key),['second','first']); assert.equal(s.discard.length,0);
});
test('existing queue and new arrival are recalled before discarded hand',()=>{
  const first=memory('R06','first','S01'),second=memory('R01','second','S09'),queued=memory('R03','queued','S05');
  const s=run(seed(['S03'],{queue:[queued],hand:[first,second]}),choice(['S03'],'AS01','second'));
  assert.deepEqual(s.hand.map(m=>m.sourceId),['S05','S03']); assert.deepEqual(s.discard.map(m=>m.key),['second','first']);
});
test('newly acquired memory does not protect the crossing that acquired it',()=>{
  const s=seed(['S09'],{standing:1}); assert.equal(E.preview(s,choice(['S09'],'TA01')).wouldFail,'pressure');
  const r=run(s,choice(['S09'],'TA01')); assert.equal(r.status,'lost'); assert.equal(allMemories(r).length,0);
});
test('empty boat still pays toll/pressure and never earns Tartarus service',()=>{
  const s=seed([]); let p=E.preview(s,choice([],'EL01')); assert.equal(p.toll,1); assert.equal(p.projectedObols,7);
  p=E.preview(s,choice([],'TA01')); assert.equal(p.pressure,2); assert.equal(p.service,0); assert.equal(p.projectedObols,8);
});
test('Standing equal to pressure survives at zero before arrival',()=>{
  const p=E.preview(seed(['S03'],{standing:2}),choice(['S03'],'TA01')); assert.equal(p.standingAfterCross,0); assert.equal(p.wouldFail,null);
  const r=run(seed(['S03'],{standing:2}),choice(['S03'],'TA01')); assert.equal(r.standing,0); assert.equal(r.history.length,1);
});
test('pressure failure occurs before arrival, quota and decay but after Load costs',()=>{
  const s=seed(['S03','S07'],{crossing:3,standing:1,obols:2,wraiths:[{id:'S08',since:1},{id:'S04',since:1}],shore:[{id:'S03',refusals:0},{id:'S07',refusals:2}]});
  const r=run(s,choice(['S03'],'EL01')); assert.equal(r.status,'lost'); assert.equal(r.lossReason,'pressure');
  assert.equal(r.obols,1); assert.equal(r.history.length,0); assert.equal(allMemories(r).length,0);
  assert.equal(r.shore.find(x=>x.id==='S07').refusals,2); assert.equal(r.wraiths.length,2);
});
test('arrival fare may pay current quota',()=>{
  const s=seed(['S03'],{crossing:3,obols:2}); const r=run(s,choice(['S03']));
  assert.equal(r.status,'playing'); assert.equal(r.crossing,4); assert.equal(r.obols,0); assert.equal(r.history.length,1);
});
test('quota failure follows arrival and prevents decay',()=>{
  const s=seed(['S03','S07'],{crossing:3,obols:1,shore:[{id:'S03',refusals:0},{id:'S07',refusals:2}]});
  const r=run(s,choice(['S03'])); assert.equal(r.status,'lost'); assert.equal(r.lossReason,'quota'); assert.equal(r.obols,2);
  assert.equal(r.history.length,1); assert.equal(allMemories(r).length,1); assert.equal(r.shore.find(x=>x.id==='S07').refusals,2); assert.equal(r.wraiths.length,0);
});
test('sixth crossing wins only after paying quota',()=>{
  const r=run(seed(['S03'],{crossing:6,obols:2}),choice(['S03'])); assert.equal(r.status,'won'); assert.equal(r.obols,0);
  invalid(r,choice());
});
test('exhausted supply and empty shore continue mandatory crossings',()=>{
  let s=seed([],{crossing:2,obols:6,standing:10});
  for(let i=2;i<=6;i++) { assert.equal(s.crossing,i); s=run(s,choice()); }
  assert.equal(s.status,'won'); assert.equal(s.obols,0); assert.equal(s.standing,5); assert.equal(s.history.length,0);
});

const report={source:'The_Ferryman_Design_Workbook.md v0.2, sections 6-10',passed,failed:failures.length,failures};
fs.writeFileSync(path.join(__dirname,'demo-test-results.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(failures.length) process.exitCode=1;
