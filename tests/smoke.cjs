// Random Encounters dependency-free regression: node tests/smoke.cjs
// Mocked AI Dungeon hooks supplement (not replace) a fresh live adventure.
"use strict";
function run(files) {
  const source=files["src/library.js"], merged=files["compatibility-testing/InnerSelf/library.js"];
  const passed=[];
  function check(ok,name){if(!ok)throw Error("FAIL: "+name);passed.push(name);}
  new Function(source);new Function(merged);
  check(true,"Libraries parse");
  check(merged.includes(source.slice(source.indexOf("function RandomEncounters(hook, text)")).trimEnd()),"Canonical and Inner Self parity");
  check(source.includes('const VERSION = "0.18.41"'),"Current version");
  check(!source.includes("because the AI may continue the story instead of returning card data"),"Removed Config Notes wording");
  function setup(instrument){
    const env={state:{},storyCards:[],history:[],info:{actionCount:0},console:{log:function(){}}};
    const code=instrument?source.replace("function syncActMap(config) {","function syncActMap(config) { state.mapPasses=(state.mapPasses||0)+1;"):source;
    const add=function(type,keys,entry,title){env.storyCards.push({type:type,keys:keys,entry:entry,title:title,description:""});};
    const remove=function(index){env.storyCards.splice(index,1);};
    env.call=new Function("state","storyCards","history","info","addStoryCard","removeStoryCard","stop","console",code+";return RandomEncounters;")(
      env.state,env.storyCards,env.history,env.info,add,remove,false,env.console);
    env.act=function(t,ctx){env.info.actionCount++;env.history.push({type:"continue",text:t});env.call("input",t);return env.call("context",ctx||("Recent Story:\n"+t));};
    env.card=function(key){return env.storyCards.find(function(c){return c.keys===key;});};
    return env;
  }
  const a=setup(false);a.act("Begin");
  const config=a.card("random encounter settings");
  check(!!config&&!!a.card("RAND_04"),"Default cards created");
  check(config.description.includes("When Inner Self is enabled, generating new encounter cards may take longer."),"Actual Config Notes updated");
  [
    "================ SYSTEM ================",
    "---------- GENERATION ----------",
    "---------- DISPLAY & TOOLS ----------",
    "============== ENCOUNTERS ==============",
    "---------- PACING ----------",
    "--------- PROGRESSION ---------",
    "============= GLOBAL DEFAULTS =============",
    "========== LIFECYCLE & HISTORY ==========",
    "================ COMMANDS ================"
  ].forEach(function(header){
    check(config.description.includes(header),"Config Notes header: "+header);
  });
  check(config.description.length<2400,"Config Notes remain concise");
  [
    "Create Max Encounter Cards:",
    "Populate Placeholder Cards:",
    "Set All Cards to Available:",
    "Restore Encounter Cards to Defaults:",
    "/RE start [#]:",
    "/RE reset # or /RE reset all:",
    "one-sentence",
    "Numbered Attempt popups",
    "Act: Default Act for new/reset cards.",
    "Importance: Required or Optional",
    "Rarity: Weighted selection chance.",
    "Duration: Active turns before resolution"
  ].forEach(function(required){
    check(config.description.includes(required),"Required instruction retained: "+required);
  });
  let writes=0;const i=a.storyCards.indexOf(config);
  a.storyCards[i]=new Proxy(config,{set:function(c,k,v){if(k==="description")writes++;c[k]=v;return true;}});
  a.act("Continue");
  check(writes===0,"Unchanged Config Notes do not rewrite");
  config.entry=config.entry.replace("- Use Advanced Settings: false","- Use Advanced Settings: true");
  a.act("Open advanced settings");
  const advanced=a.storyCards.find(function(c){return c.title==="Advanced RE Settings";});
  check(!!advanced,"Advanced settings card exists");
  let advancedWrites=0;const j=a.storyCards.indexOf(advanced);
  a.storyCards[j]=new Proxy(advanced,{set:function(c,k,v){if(k==="description")advancedWrites++;c[k]=v;return true;}});
  a.act("Continue");
  check(advancedWrites===0,"Unchanged advanced Notes do not rewrite");

  const b=setup(true);b.act("Begin");const normalMapPasses=b.state.mapPasses;
  const cfg=b.card("random encounter settings");
  cfg.entry=cfg.entry.replace("- Populate Placeholder Cards: false","- Populate Placeholder Cards: true");
  b.act("Populate cards");
  check(b.state.mapPasses===normalMapPasses+1,"Population start does not double-sync map");
  check(b.state.randomEncounters.placeholderPopulation.attempts===1,"Population attempt 1");
  check(b.state.message==="RE - Encounter population in progress - Attempt 1.","Attempt popup");
  b.call("context","Recent Story:\nPopulate cards");
  check(b.state.randomEncounters.placeholderPopulation.attempts===1,"Same-attempt Context does not increment");
  check(b.call("output","The sea rises.")==="The sea rises.","Story output passes through on failure");
  check(b.state.randomEncounters.placeholderPopulation.phase==="queued","Failure retries");
  b.state.InnerSelf={AC:{event:true}};
  b.act("Auto-Cards task");
  check(b.state.randomEncounters.placeholderPopulation.attempts===1,"Auto-Cards does not increment attempt");
  check(b.call("output","External output")==="External output","Auto-Cards output untouched");
  b.state.InnerSelf.AC.event=false;b.act("Return to population");
  check(b.state.randomEncounters.placeholderPopulation.attempts===2,"Deferred population resumes at attempt 2");
  const status="\n\n[RE] Updating Encounter Cards - Hit Continue\n\n";
  const partial=b.call("output","RAND_01\nTitle: Bell\nScenario: A bell rings.\nEND RAND_01");
  check(partial===status,"Double-spaced hijack preserved");
  check(b.state.randomEncounters.placeholderPopulation.numbers.join(",")==="2,3,4","Partial generation protects completed cards");
  b.act("Complete population");
  check(b.state.randomEncounters.placeholderPopulation.attempts===3,"Attempt counter increases for remaining cards");
  const final=b.call("output","RAND_02\nTitle: Crow\nScenario: A crow calls.\nEND RAND_02\n\nRAND_03\nTitle: Rope\nScenario: A rope snaps.\nEND RAND_03\n\nRAND_04\nTitle: Lantern\nScenario: A lantern breaks.");
  check(final===status&&b.state.randomEncounters.placeholderPopulation===null,"Generation completes");
  check(cfg.entry.includes("- Populate Placeholder Cards: false")&&b.state.message==="RE - New encounters generated.","Success popup and Config reset");
  check(b.card("RAND_01").entry==="A bell rings."&&b.card("RAND_04").entry==="A lantern breaks.","Generated entries persist");
  const resumed=b.act("Continue","Recent Story:\n\n[RE] Updating Encounter Cards - Hit Continue\n\n");
  check(!resumed.includes("[RE] Updating Encounter Cards - Hit Continue"),"Status absent from resumed Context");
  return passed;
}
if(typeof module!=="undefined"&&module&&module.exports){
 module.exports=run;
 if(require.main===module){
   const fs=require("node:fs"),path=require("node:path"),root=path.resolve(__dirname,".."),files={};
   ["src/library.js","compatibility-testing/InnerSelf/library.js"].forEach(function(name){
     files[name]=fs.readFileSync(path.join(root,name),"utf8");
   });
   const passed=run(files);
   process.stdout.write("PASS "+passed.length+"/"+passed.length+" smoke checks\n");
 }
}
