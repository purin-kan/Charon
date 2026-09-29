/* Explicitly constructed, validated save fixtures for browser boundary checks. */
const E=require('../engine.js');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.resolve(__dirname,'../../../work/v04/fixtures');fs.mkdirSync(dir,{recursive:true});
const id=(n,c=1)=>'C'+String(c).padStart(2,'0')+'-S'+String(n).padStart(2,'0');
function fixture(boat,shore,wraiths=[]){
 const s=E.createGame(41);s.souls={};s.boat=boat;s.shore=shore;s.wraiths=wraiths;s.formed=wraiths.length;s.supply=24;s.phase='route';s.light=4;
 for(let c=1;c<=2;c++)for(const t of E.TEMPLATES){const key=id(Number(t.id.slice(1)),c);s.souls[key]={id:key,template:t.id,cohort:c,anger:wraiths.includes(key)?3:0};if([...boat,...shore,...wraiths].includes(key))continue;
 s.delivered.push({id:key,to:'elysium',match:t.wish==='elysium'});const mid='M'+(++s.memorySeq);s.memories[mid]={id:mid,type:t.memory==='joint'?'R06':t.memory,source:key,destination:'elysium'};s.deck.push(mid);}
 const types=['R04','R02','R03'];for(const type of types){const mid=s.deck.find(mid=>s.memories[mid].type===type);s.deck=s.deck.filter(x=>x!==mid);s.hand.push(mid);}E.validate(s);return s;
}
const cases={
 soldiers:fixture([id(4,2),id(6,2)],[id(1,2),id(2,2),id(3,2)]),
 keeper:fixture([id(10,2)],[id(1,2),id(2,2),id(3,2),id(4,2)]),
 poet:fixture([id(5,2),id(2,2),id(3,2)],[id(1,2),id(4,2)]),
 release:fixture([],[id(1,2),id(2,2),id(3,2),id(4,2),id(5,2)],[id(6,2)]),
 final:fixture([id(3,2)],[id(1,2),id(2,2),id(4,2),id(5,2)]),
 failure:E.createGame(41)
};
cases.release.light=2;
cases.final.node='asphodel';cases.final.visited=['elysium','asphodel'];cases.final.waiting=cases.final.shore.slice();
cases.failure.light=0;
let literal=E.createGame(41);
for(const action of [{type:'READY'},{type:'ROUTE',to:'elysium'},{type:'MEMORY',id:null},{type:'CROSS'}])literal=E.dispatch(literal,action).state;
literal.result.title='<img src=x onerror="window.importExecuted=true">';
cases.literal=literal;
for(const [name,s]of Object.entries(cases)){E.validate(s);fs.writeFileSync(path.join(dir,name+'.json'),E.serialize(s));}
console.log('Wrote '+Object.keys(cases).length+' constructed, validated browser fixtures to '+dir);
