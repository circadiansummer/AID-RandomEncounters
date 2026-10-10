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
  check(source.includes('const VERSION = "0.18.43"'),"Current version");
  check(!source.includes("because the AI may continue the story instead of returning card data"),"Removed Config Notes wording");
  function setup(instrument,stopFlag){
    const env={state:{},storyCards:[],history:[],info:{actionCount:0},console:{log:function(){}}};
    const code=instrument?source.replace("function syncActMap(config) {","function syncActMap(config) { state.mapPasses=(state.mapPasses||0)+1;"):source;
    const add=function(type,keys,entry,title){env.storyCards.push({type:type,keys:keys,entry:entry,title:title,description:""});};
    const remove=function(index){env.storyCards.splice(index,1);};
    env.call=new Function("state","storyCards","history","info","addStoryCard","removeStoryCard","stop","console",code+";return RandomEncounters;")(
      env.state,env.storyCards,env.history,env.info,add,remove,stopFlag===true,env.console);
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
    "========== LIFECYCLE & OUTCOMES ==========",
    "================ COMMANDS ================"
  ].forEach(function(header){
    check(config.description.includes(header),"Config Notes header: "+header);
  });
  check(config.description.length<2400,"Config Notes remain concise");
  check(config.type==="#RE - Config","Config Story Card uses new category");
  check(!a.card("random encounter history"),"No History Story Card created on new adventures");
  check(!config.description.includes("History keeps"),"Config Notes no longer describe retired History");
  const mapCard=a.card("random encounter act map");
  check(!mapCard,"Act Map remains optional by default");

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
  check(advanced.type==="#RE - Config","Advanced Settings card uses new category");

  // Current-schema cards should not be rewritten just to change their layout.
  const current=setup(false);
  current.act("Create current cards.");
  const currentConfig=current.card("random encounter settings");
  currentConfig.entry=currentConfig.entry.replace("- Debug Logging: false","   - Debug Logging: false");
  const untouchedEntry=currentConfig.entry;
  current.act("Continue using custom spacing.");
  check(currentConfig.entry===untouchedEntry,"Current Config Entry spacing preserved without normalization");
  const currentAdvanced=current.card("advanced random encounter settings");
  check(!currentAdvanced,"Advanced card remains optional");
  currentConfig.entry=currentConfig.entry.replace("- Use Advanced Settings: false","- Use Advanced Settings: true");
  current.act("Create advanced card.");
  const editableAdvanced=current.card("advanced random encounter settings");
  editableAdvanced.entry="  "+editableAdvanced.entry;
  const untouchedAdvanced=editableAdvanced.entry;
  current.act("Preserve advanced formatting.");
  check(editableAdvanced.entry===untouchedAdvanced,"Current Advanced Entry formatting preserved without normalization");
  const personalHistory={
    type:"lore",keys:"personal history",title:"History",
    entry:"Personal timeline",description:"User-authored"
  };
  current.storyCards.push(personalHistory);
  current.act("Preserve unrelated cards.");
  check(current.card("personal history")===personalHistory,"Unrelated Story Cards left untouched");
  check(!current.card("random encounter history"),"No History card created in current adventures");

  const resultEnv=setup(false);
  resultEnv.act("Start progression.");
  const resultConfig=resultEnv.card("random encounter settings");
  resultConfig.entry=resultConfig.entry.replace("- Display Act & Encounter Map: false","- Display Act & Encounter Map: true");
  ["RAND_02","RAND_03","RAND_04"].forEach(function(number){
    const card=resultEnv.card(number);
    card.description=card.description.replace("- Importance: Required","- Importance: Optional");
  });
  const first=resultEnv.card("RAND_01");
  first.entry="A meeting unfolds.";
  resultEnv.act("Enable map.");
  check(resultEnv.card("random encounter act map").type==="#RE - Config","Act Map uses new Config category");
  resultEnv.state.randomEncounters.pendingResolutions=[{
    number:1,code:"RAND_01",duration:"Default",rarity:"Common",
    eventText:"A meeting unfolds.",attempts:0,lastAttemptTurn:null,allowContinuation:true
  }];
  const cleaned=resultEnv.call("output","The encounter occurred: The meeting concluded.");
  check(!cleaned.includes("The encounter occurred:"),"Resolution classifier removed from player output");
  check(first.entry.includes("Outcome:\nThe encounter occurred: The meeting concluded."),"Resolution remains in RAND Outcome");
  check(first.description.includes("- Status: Retired"),"Resolved encounter becomes Retired");
  check(!resultEnv.card("random encounter history"),"Successful resolution does not recreate History");
  check(resultEnv.card("random encounter settings").entry.includes("- Current Act: 2"),"Required encounter still advances Act");
  check(resultEnv.card("random encounter act map").entry.includes("Completed Successfully"),"Act Map reflects successful resolution");


  // Final-candidate regression: failed, in-progress, and stopped Context turns.
  const failed=setup(false);
  failed.act("Begin a failure test");
  const failureCard=failed.card("RAND_01");
  failureCard.entry="A courier arrives.";
  failed.state.randomEncounters.pendingResolutions=[{
    number:1,code:"RAND_01",duration:"Default",rarity:"Common",
    eventText:"A courier arrives.",attempts:0,lastAttemptTurn:null,allowContinuation:true
  }];
  failed.call("output","The encounter did not occur: The courier never reached the village.");
  check(failureCard.entry.includes("Outcome:\nThe encounter did not occur:"),"Unsuccessful resolution stored on RAND card");
  check(failureCard.description.includes("- Status: Available"),"Unsuccessful encounter returns to pool");
  check(failed.card("random encounter settings").entry.includes("- Current Act: 1"),"Unsuccessful Required encounter does not advance Act");
  check(!failed.card("random encounter history"),"Failed resolution does not create legacy History");

  const continuation=setup(false);
  continuation.act("Begin continuation test");
  const continuingCard=continuation.card("RAND_01");
  continuingCard.entry="A scout investigates ruins.";
  continuation.state.randomEncounters.pendingResolutions=[{
    number:1,code:"RAND_01",duration:"Default",rarity:"Common",
    eventText:"A scout investigates ruins.",attempts:0,lastAttemptTurn:null,
    inProgressChecks:0,allowContinuation:true
  }];
  continuation.call("output","The encounter is in progress: The scout is still searching.");
  check(continuingCard.description.includes("- Status: Awaiting Completion"),"In-progress enters Awaiting Completion");
  check(continuation.state.randomEncounters.activeEncounter.inProgressChecks===1,"First incomplete check tracked");
  const half=continuation.state.randomEncounters.activeEncounter.resolveAfterTurn-continuation.state.randomEncounters.turn;
  check(half===9,"Awaiting Completion uses half of Moderate Default Duration");
  for(let i=1;i<5;i++){
    continuation.state.randomEncounters.activeEncounter=null;
    continuation.state.randomEncounters.pendingResolutions=[{
      number:1,code:"RAND_01",duration:"Default",rarity:"Common",
      eventText:"A scout investigates ruins.",attempts:0,lastAttemptTurn:null,
      inProgressChecks:i,allowContinuation:true
    }];
    continuation.call("output","The encounter is in progress: The scout is still searching.");
  }
  check(continuingCard.description.includes("- Status: Available"),"Fifth incomplete check restores Available");
  check(continuingCard.entry.includes("incomplete after five consecutive"),"Fifth incomplete check records failure Outcome");

  const stopped=setup(false,true);
  stopped.act("Externally stopped Context");
  check(!stopped.card("random encounter settings"),"stop=true prevents Story Card maintenance");
  check(stopped.state.randomEncounters.turn===0,"stop=true does not advance RE turn");

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
  check(!resumed.includes("[RANDOM ENCOUNTER HISTORY]"),"Retired History is never injected into model Context");
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
