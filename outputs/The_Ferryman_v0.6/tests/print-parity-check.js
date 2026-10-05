'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const game = require('../engine.js');
const data = require('../content.json');
const root = path.resolve(__dirname, '..');
const desk = require('../verification/print/desk-walkthroughs.json');
const records = [];
const act = (state, type, extra = {}) => game.transition(state, {type, ...extra});
const soul = name => 'SOUL-' + name;
const destination = name => 'DEST-' + name;
function setup(names, round = '0', offers = [['HAVEN', 'STYX']]) {
  let state = game.create(42);
  state.round = round;
  state.nextPolong = (BigInt(round) / 3n + 1n).toString();
  state.shore = names.map(name => ({id:soul(name), type:soul(name), anger:0}));
  state.arrivals = data.souls.filter(item => item.ordinary && !names.includes(item.id.slice(5))).map(item => item.id);
  for (const name of names) state = act(state, 'BOARD', {id:soul(name)});
  state = act(state, 'APPEND_ROUTES', {offers:offers.map(pair => pair.map(destination))});
  return act(state, 'DEPART');
}
function give(state, type, source) {
  const id = 'MEMORY-' + state.nextMemory;
  state.nextMemory = (BigInt(state.nextMemory) + 1n).toString();
  state.hand.push({id, type:'MEM-' + type, source:source === 'QUEST-FAMILY' ? source : soul(source)});
  return id;
}
function travel(state, place, names = []) {
  return act(act(state, 'CROSS', {destination:destination(place)}), 'DELIVER', {ids:names.map(soul)});
}
function check(id, run) {
  const printed = desk.cases.find(item => item.id === id);
  try { run(); records.push({id, name:printed ? printed.name : 'Printed round-six worked example', status:'PASS'}); }
  catch (error) { records.push({id, status:'FAIL', error:error.stack}); }
}
check('DESK-01', () => {
  const state = game.create();
  assert.deepEqual(state.shore.map(item => item.id), data.config.initialShore);
  assert.deepEqual(state.arrivals.slice().sort(), data.config.initialArrivals.slice().sort());
  assert.deepEqual([state.light,state.round,state.completed,state.quest,state.hand.length], [6,'0','0','available',0]);
});
check('DESK-02', () => {
  let state = game.create();
  for (const name of ['MOTHER','CHILD','MERCHANT','MASON']) state = act(state,'BOARD',{id:soul(name)});
  state = act(state,'APPEND_ROUTES',{offers:[['DEST-HAVEN','DEST-STYX']]});
  state = travel(act(state,'DEPART'),'HAVEN',['CHILD']);
  assert.deepEqual([state.round,state.quest,state.hand.length,state.light], ['1','child-delivered',0,6]);
  assert.ok(state.boat.every(item => item.anger === 1));
  assert.deepEqual(state.shore.map(item => item.id), [soul('COOK')]);
});
check('DESK-03', () => {
  let state = setup(['MOTHER','CHILD','MERCHANT','MASON'],'2');
  state = act(state,'CROSS',{destination:destination('HAVEN')});
  assert.equal(game.seats(state),4);
  assert.equal(state.boat.at(-1).anger,0);
  assert.equal(state.light,6);
  state = act(state,'DELIVER',{ids:[]});
  assert.equal(state.boat.at(-1).anger,1);
});
check('DESK-04', () => {
  let state = setup(['MERCHANT'],'0',[['HAVEN','STYX'],['ASPHODEL','ACHERON'],['ELYSIUM','TARTARUS']]);
  state = act(state,'PLAY_MEMORY',{id:give(state,'FORESIGHT','MERCHANT')});
  assert.equal(game.offers(state).length,3);
  state = travel(state,'HAVEN');
  assert.deepEqual(state.routes.history[0], {offer:['DEST-HAVEN','DEST-STYX'],chosen:'DEST-HAVEN'});
  assert.equal(game.offers(state).length,2);
  assert.deepEqual(game.importSave(game.exportSave(state)),state);
});
check('DESK-05', () => {
  const state = setup(['MERCHANT'],'0',[['HAVEN','STYX'],['ASPHODEL','ACHERON']]);
  const id = give(state,'FORESIGHT','MERCHANT');
  const before = game.exportSave(state);
  assert.throws(() => act(state,'PLAY_MEMORY',{id}), /Facilitator/);
  assert.equal(game.exportSave(state),before);
});
check('DESK-06', () => {
  const state = travel(setup(['MERCHANT','SOLDIER']),'STYX',['MERCHANT']);
  assert.deepEqual(state.boat.map(item => [item.id,item.anger]), [[soul('SOLDIER'),1]]);
  assert.equal(state.hand[0].source,soul('MERCHANT'));
  assert.equal(state.light,5);
});
check('DESK-07', () => {
  let state = travel(setup(['CHILD']),'HAVEN',['CHILD']);
  const ids = data.souls.filter(item => item.ordinary).map(item => item.id);
  state.shore = ids.slice(0,2).map(id => ({id,type:id,anger:0}));
  state.arrivals = ids.slice(2,3);
  state.discard = ids.slice(3);
  state = act(state,'RETURN');
  assert.equal(state.shore.length,5);
  assert.equal(state.arrivals.length,3);
  assert.equal(state.discard.length,0);
  assert.equal(state.shore.filter(item => item.anger === 0).length,3);
});
check('DESK-08', () => {
  let state = setup(['MERCHANT']);
  for (let copy=0;copy<3;copy++) give(state,'FORESIGHT','MERCHANT');
  const oldIds = state.hand.map(item => item.id);
  state = travel(state,'STYX',['MERCHANT']);
  assert.equal(state.hand.length,4);
  assert.ok(oldIds.every(id => state.hand.some(item => item.id === id)));
  state = act(state,'DISCARD_MEMORY',{id:state.hand[1].id});
  assert.equal(state.hand.length,3);
});
check('DESK-09', () => {
  let state = setup(['MERCHANT','SOLDIER']);
  for (let copy=0;copy<3;copy++) give(state,'LIGHT','MOTHER');
  state = travel(state,'STYX',['MERCHANT','SOLDIER']);
  assert.equal(state.hand.length,5);
  assert.deepEqual(state.hand.slice(-2).map(item => item.source),[soul('MERCHANT'),soul('SOLDIER')]);
  while (state.phase === 'trim') state = act(state,'DISCARD_MEMORY',{id:state.hand[0].id});
  assert.equal(state.hand.length,3);
});
check('DESK-10', () => {
  let state = setup(['CHILD'],'6');
  state.boat.push({id:'POLONG-1',type:soul('POLONG'),anger:2},{id:'POLONG-2',type:soul('POLONG'),anger:3});
  state = act(state,'PLAY_MEMORY',{id:give(state,'CALM','COOK'),target:'POLONG-1'});
  assert.equal(game.preview(state,destination('HAVEN')).payment,1);
  state = travel(state,'HAVEN',['CHILD']);
  assert.deepEqual(state.boat.map(item => [item.id,item.anger]),[['POLONG-1',2]]);
  assert.equal(state.light,4);
});
check('DESK-11', () => {
  let state = setup(['MOTHER','CHILD','MERCHANT']);
  state.light=2;
  state.boat.forEach(item => { item.anger=3; });
  state = act(state,'PLAY_MEMORY',{id:give(state,'GUARD','SOLDIER')});
  state = travel(state,'HAVEN');
  assert.equal(state.phase,'ended');
  assert.equal(state.light,0);
});
check('DESK-12', () => {
  let state = travel(setup(['CHILD']),'HAVEN',['CHILD']);
  state = act(state,'RETURN');
  const mother = state.shore.find(item => item.id === soul('MOTHER'));
  if (!mother) {
    state.arrivals = state.arrivals.filter(id => id !== soul('MOTHER'));
    state.discard = state.discard.filter(id => id !== soul('MOTHER'));
    state.shore.push({id:soul('MOTHER'),type:soul('MOTHER'),anger:0});
  }
  state = act(state,'BOARD',{id:soul('MOTHER')});
  state = act(state,'APPEND_ROUTES',{offers:[['DEST-TARTARUS','DEST-HAVEN']]});
  state = travel(act(state,'DEPART'),'TARTARUS',['MOTHER']);
  assert.equal(state.quest,'completed');
  assert.deepEqual(state.hand.map(item => item.type),['MEM-LIGHT','MEM-PASSAGE']);
});
check('DESK-13', () => {
  const motherFirst = travel(setup(['MOTHER'],'0',[['TARTARUS','HAVEN']]),'TARTARUS',['MOTHER']);
  assert.equal(motherFirst.quest,'failed');
  for (const prior of ['available','child-delivered']) {
    let state = setup(['CHILD']);
    state.quest=prior; state.boat[0].anger=3;
    state=travel(state,'HAVEN');
    assert.equal(state.quest,prior === 'available' ? 'failed' : 'child-delivered');
  }
});
check('DESK-14', () => {
  let state = setup(['POET'],'2');
  state.quest='completed';
  state = act(state,'PLAY_MEMORY',{id:give(state,'PASSAGE','QUEST-FAMILY'),target:soul('POET')});
  assert.deepEqual([state.round,state.nextPolong,state.window.kind,state.window.used],['2','1','return',true]);
  assert.equal(state.hand[0].type,'MEM-FORESIGHT');
  assert.throws(() => act(state,'PLAY_MEMORY',{id:state.hand[0].id}),/already used/);
});
check('DESK-15', () => {
  let state = setup(['CHILD'],'3');
  state.quest='completed';
  state.boat.push({id:'POLONG-1',type:soul('POLONG'),anger:2});
  state = act(state,'PLAY_MEMORY',{id:give(state,'PASSAGE','QUEST-FAMILY'),target:'POLONG-1'});
  assert.deepEqual([state.round,state.deliveries,state.hand.length,state.boat[0].anger],['3','0',0,0]);
});
check('DESK-16', () => {
  let state = travel(setup(['CHILD']),'HAVEN',['CHILD']);
  const id=state.arrivals.shift(); state.shore.push({id,type:id,anger:1}); state.light=1;
  assert.equal(act(state,'RETURN').phase,'ended');
  state = act(state,'PLAY_MEMORY',{id:give(state,'GUARD','SOLDIER')});
  assert.equal(act(state,'RETURN').light,3);
});
check('DESK-17', () => {
  let state = travel(setup(['CHILD'],'1'),'HAVEN',['CHILD']);
  state = act(state,'RETURN');
  assert.equal(state.round,'2');
  state = act(state,'BOARD',{id:state.shore[0].id});
  state = act(state,'APPEND_ROUTES',{offers:[['DEST-HAVEN','DEST-STYX']]});
  state = act(act(state,'DEPART'),'CROSS',{destination:'DEST-HAVEN'});
  assert.equal(state.round,'3');
  assert.equal(state.boat.at(-1).type,soul('POLONG'));
});
check('DESK-18', () => {
  const stopped=act(setup(['CHILD']),'STOP');
  assert.equal(stopped.paused,true);
  const fresh=game.create();
  assert.deepEqual([fresh.light,fresh.round,fresh.completed,fresh.quest,fresh.hand.length,fresh.boat.length],[6,'0','0','available',0,0]);
});
check('PRINT-ROUND-SIX', () => {
  let state=setup(['KEEPER','SOLDIER'],'5',[['ASPHODEL','HAVEN']]);
  state.light=4; state.boat.forEach(item => { item.anger=3; });
  state=act(state,'PLAY_MEMORY',{id:give(state,'FOG','MASON')});
  state=travel(state,'ASPHODEL',['KEEPER']);
  assert.equal(state.light,2);
  assert.deepEqual(state.boat.map(item => [item.type,item.anger]),[[soul('POLONG'),1]]);
  assert.equal(state.hand[0].source,soul('KEEPER'));
});
const hashes=Object.fromEntries(['engine.js','content.json','tests/print-parity-check.js','verification/print/desk-walkthroughs.json'].map(relative => [relative,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,relative))).digest('hex')]));
const failed=records.filter(item => item.status !== 'PASS').length;
const result={status:failed ? 'FAIL' : 'PASS',checkedAt:new Date().toISOString(),passed:records.length-failed,failed,scope:'Agent synthetic engine reproduction of A desk scenarios and printed round-six example. Not human playtesting.',records,hashes};
if (!process.env.FERRY_CHECK_NO_WRITE) fs.writeFileSync(path.join(root,'verification/integration/print-parity-results.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
process.exitCode=failed ? 1 : 0;
