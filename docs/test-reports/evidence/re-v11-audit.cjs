const fs=require('node:fs');
const root=require('node:path').resolve(__dirname,'../../..');
const source=fs.readFileSync(root+'/Library.js','utf8');
function setup(){
 const e={state:{},storyCards:[],history:[],info:{actionCount:0}};
 e.call=new Function('state','storyCards','history','info','addStoryCard','removeStoryCard','console',source+';return RandomEncounters;')(e.state,e.storyCards,e.history,e.info,(type,keys,entry,title)=>e.storyCards.push({type,keys,entry,title,description:''}),i=>e.storyCards.splice(i,1),{log(){}});
 e.card=k=>e.storyCards.find(c=>c.keys===k);
 e.act=t=>{e.info.actionCount++;e.history.push({type:'continue',text:t});e.call('input',t);return e.call('context',t);};
 e.call('context','Initialize');return e;
}
for(const [name,data] of [
 ['fragment','RAND_01\nTitle: Visit\nScenario: A visitor carrying\nEND RAND_01'],
 ['lowercase second sentence','RAND_01\nTitle: Visit\nScenario: A visitor arrives. another visitor departs.\nEND RAND_01'],
 ['missing title','RAND_01\nScenario: A visitor arrives.\nEND RAND_01'],
 ['missing END','RAND_01\nTitle: Visit\nScenario: A visitor arrives.'],
 ['long sentence','RAND_01\nTitle: Visit\nScenario: A visitor '+('quietly '.repeat(230))+'arrives.\nEND RAND_01']
]){
 const e=setup();const c=e.card('random encounter settings');c.entry=c.entry.replace('Populate Placeholder Cards: false','Populate Placeholder Cards: true');e.act('Generate');const out=e.call('output',data);
 console.log(JSON.stringify({name,entry:e.card('RAND_01').entry,length:e.card('RAND_01').entry.length,output:out,completed:e.state.randomEncounters.placeholderPopulation?.completedCount}));
}
const e=setup();e.card('RAND_01').entry='An authored visit occurs.';const c=e.card('random encounter settings');c.entry=c.entry.replace('Populate Placeholder Cards: false','Populate Placeholder Cards: true').replace('First Encounter Turn: 0','First Encounter Turn: 1');e.act('Generate');const out=e.call('output',[2,3,4].map(n=>`RAND_0${n}\nTitle: Visit\nScenario: A visitor arrives.\nEND RAND_0${n}`).join('\n'));console.log(JSON.stringify({name:'three-card batch',output:out,authored:e.card('RAND_01').entry,turn:e.state.randomEncounters.turn}));e.act('Resume');console.log(JSON.stringify({name:'first opportunity after population',turn:e.state.randomEncounters.turn,active:e.state.randomEncounters.activeEncounter?.number}));
const retry=setup();const rc=retry.card('random encounter settings');rc.entry=rc.entry.replace('Populate Placeholder Cards: false','Populate Placeholder Cards: true').replace('Encounter Difficulty: Easy','Encounter Difficulty: Hard').replace('Encounter Theme: None','Encounter Theme: night at the movies');
const initial=retry.act('Generate themed batch');const repeated=retry.call('context','Retry same model action');
console.log(JSON.stringify({name:'same-action generation retry',initialHard:initial.includes("'hard' difficulty"),initialTheme:initial.includes('night at the movies'),retryEasy:repeated.includes("'easy' difficulty"),retryTheme:repeated.includes('night at the movies'),snapshot:retry.state.randomEncounters.placeholderPopulation,turn:retry.state.randomEncounters.turn}));
