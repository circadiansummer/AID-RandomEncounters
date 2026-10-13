// Random Encounters dependency-free regression: node docs/tests/smoke.cjs
// Mocked AI Dungeon hooks supplement (not replace) a fresh live adventure.
"use strict";
function run(files) {
  const source=files["Library.js"], merged=files["RE-InnerSelf-Merge/Library.js"];
  const passed=[];
  function check(ok,name){if(!ok)throw Error("FAIL: "+name);passed.push(name);}
  new Function(source);new Function(merged);
  check(true,"Libraries parse");
  ["Input.js","Context.js","Output.js","RE-InnerSelf-Merge/Input.js","RE-InnerSelf-Merge/Context.js","RE-InnerSelf-Merge/Output.js"].forEach(function(name){
    check(typeof files[name]==="string" && files[name].length>0 && (()=>{new Function(files[name]);return true;})(),"Relocated wrapper parses: "+name);
  });
  check(files["Library.js"].includes('const VERSION = "1.1"'),"Standalone v1.1 Library version");
  check(files["RE-InnerSelf-Merge/Library.js"].includes('const VERSION = "1.1"'),"Merged v1.1 Library version");
  check(merged.includes(source.slice(source.indexOf("function RandomEncounters(hook, text)")).trimEnd()),"Canonical and Inner Self parity");
  check(source.includes('const VERSION = "1.1"'),"Current version");
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
    "============== ENCOUNTERS ==============",
    "---------- SETTINGS ----------",
    "---------- GENERATION ----------",
    "============= GLOBAL DEFAULTS =============",
    "========== LIFECYCLE & OUTCOMES ==========",
    "================ COMMANDS ================"
  ].forEach(function(header){
    check(config.description.includes(header),"Config Notes header: "+header);
  });
  check(config.description.length<2700,"Config Notes remain readable");
  const expectedNewConfig=["================ SYSTEM ================","- Enabled: true","- Use Advanced Settings: false","- Debug Logging: false","","============== ENCOUNTERS ==============","---------- SETTINGS ----------","- Current Act: 1","- First Encounter Turn: 0","- Encounter Pacing: Moderate","- Set All Cards to Available: false","- Kool-Aid Man Mode: false","","---------- GENERATION ----------","- Maximum Encounter Cards: 4","- Populate Placeholder Cards: false","- Encounter Difficulty: Easy","- Encounter Theme: ","- Create Max Encounter Cards: false","","============= GLOBAL DEFAULTS =============","Defaults apply to new or reset encounter cards. Existing cards change only when Restore Encounter Cards to Defaults is true.","- Act: 1","- Importance: Required","- Rarity: Common","- Duration: Default","- Restore Encounter Cards to Defaults: false"];
  const NL=String.fromCharCode(10);
  check(config.entry===expectedNewConfig.join(NL),"Fresh Config Entry matches approved layout");
  check(config.entry.includes("---------- SETTINGS ----------"+NL+"- Current Act:"),"Settings dashed header");
  check(config.entry.includes("---------- GENERATION ----------"+NL+"- Maximum Encounter Cards:"),"Generation dashed header");
  check(config.entry.includes("- Encounter Theme: "+NL+"- Create Max Encounter Cards: false"),"No extra gap before Create Max toggle");
  check(config.entry.includes("- Set All Cards to Available: false"+NL+"- Kool-Aid Man Mode: false"),"No extra gap before Kool-Aid Man Mode");
  check(config.description.includes("Encounter Theme: Blank/None (default)"),"Notes document blank theme");
  check(!config.description.includes("---------- PACING ----------")&&!config.description.includes("--------- PROGRESSION ---------"),"Notes grouping matches Config");
  check(config.type==="#RE - Config","Config Story Card uses new category");
  check(!a.card("random encounter history"),"No History Story Card created on new adventures");
  check(!config.description.includes("History keeps"),"Config Notes no longer describe retired History");
  const mapCard=a.card("random encounter act map");
  check(!mapCard,"Retired Act Map is not generated");
  check(!config.entry.includes("Display Act & Encounter Map"),"New Config omits the retired map toggle");
  check(!config.description.includes("Display Act & Encounter Map"),"New Config Notes omit map toggle");

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
    "Importance: Required / Optional / ASAP",
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
  ["RAND_02","RAND_03","RAND_04"].forEach(function(number){
    const card=resultEnv.card(number);
    card.description=card.description.replace("- Importance: Required","- Importance: Optional");
  });
  const first=resultEnv.card("RAND_01");
  first.entry="A meeting unfolds.";
  resultEnv.act("Enable map.");
  check(!resultEnv.card("random encounter act map"),"No derived Map produced in progression");
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
  check(!resultEnv.card("random encounter act map")&&first.type==="#RE - Act 1 Encounters  📜","Act categories preserved after resolution");


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
  check(b.state.message==="RE - Encounter population in progress - Attempt 1 - 0 of 4.","Attempt popup");
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
  const partialStatus="\n[RE] Updating Encounter Cards (1 of 4) - Hit Continue\n";
  const finalStatus="\n[RE] Updating Encounter Cards (4 of 4) - Hit Continue\n";
  const partial=b.call("output","RAND_01\nTitle: Bell\nScenario: A bell rings.\nEND RAND_01");
  check(partial===partialStatus,"Partial hijack shows 1 of 4");
  check(b.state.randomEncounters.placeholderPopulation.numbers.join(",")==="2,3,4","Partial generation protects completed cards");
  b.act("Complete population");
  check(b.state.randomEncounters.placeholderPopulation.attempts===3,"Attempt counter increases for remaining cards");
  const final=b.call("output","RAND_02\nTitle: Crow\nScenario: A crow calls.\nEND RAND_02\n\nRAND_03\nTitle: Rope\nScenario: A rope snaps.\nEND RAND_03\n\nRAND_04\nTitle: Lantern\nScenario: A lantern breaks.");
  check(final===finalStatus&&b.state.randomEncounters.placeholderPopulation===null,"Generation completes with 4 of 4");
  check(cfg.entry.includes("- Populate Placeholder Cards: false")&&b.state.message==="RE - New encounters generated - 4 of 4.","Success popup and Config reset");
  check(b.card("RAND_01").entry==="A bell rings."&&b.card("RAND_04").entry==="A lantern breaks.","Generated entries persist");
  const resumed=b.act("Continue","Recent Story:\n\n[RE] Updating Encounter Cards (4 of 4) - Hit Continue\n\n");
  check(!resumed.includes("[RE] Updating Encounter Cards (4 of 4) - Hit Continue"),"Counted status absent from resumed Context");
  check(!resumed.includes("[RANDOM ENCOUNTER HISTORY]"),"Retired History is never injected into model Context");
  const legacyStatus=b.act("Legacy status cleanup","Recent Story:\n\n[RE] Updating Encounter Cards - Hit Continue - 2 of 4\n\n");
  check(!legacyStatus.includes("Updating Encounter Cards - Hit Continue - 2 of 4"),
    "Old progress format remains stripped from resumed Context");
  const unnumberedStatus=b.act("Old status cleanup","Recent Story:\n\n[RE] Updating Encounter Cards - Hit Continue\n\n");
  check(!unnumberedStatus.includes("[RE] Updating Encounter Cards - Hit Continue"),
    "Old unnumbered progress format remains stripped from resumed Context");

  // Additional deterministic checks: these do not need a live AI Dungeon turn.
  const options=setup(false);
  options.act("Initialize options");
  const optionConfig=options.card("random encounter settings");
  optionConfig.entry=optionConfig.entry.replace("- Maximum Encounter Cards: 4","- Maximum Encounter Cards: 5")
    .replace("- Create Max Encounter Cards: false","- Create Max Encounter Cards: true");
  const customEvent=options.card("RAND_01");
  customEvent.entry="A custom event.\n\nOutcome:\nThe encounter occurred: The event finished.";
  customEvent.title="01 - Special Encounter";
  options.act("Create and map cards");
  check(!!options.card("RAND_05"),"Create Max adds RAND_05");
  check(optionConfig.entry.includes("- Create Max Encounter Cards: false"),"Create Max toggle resets automatically");
  check(customEvent.title==="01 - Special Encounter"&&customEvent.entry.includes("The event finished."),"Create Max protects custom entries and titles");
  const oldMap={type:"#RE - Config",keys:"random encounter act map",title:"Act & Encounter Map",entry:"READ ONLY",description:"Derived"};
  const creatorMap={type:"lore",keys:"author map",title:"Personal Map",entry:"Private notes",description:"Preserve"};
  options.storyCards.push(oldMap,creatorMap);
  optionConfig.entry=optionConfig.entry.replace("- Use Advanced Settings: false",
    "- Display Act & Encounter Map: true"+String.fromCharCode(10)+"- Use Advanced Settings: false");
  const afterMigration=optionConfig.entry.replace("- Display Act & Encounter Map: true"+String.fromCharCode(10),"");
  options.act("Sunset legacy Map");
  check(!options.card("random encounter act map"),"Legacy script-managed Map removed");
  check(optionConfig.entry===afterMigration,"Only legacy Config field is removed");
  check(options.card("author map")===creatorMap,"Unrelated author map preserved");
  options.act("Confirm Map cannot return");
  check(!options.card("random encounter act map"),"Retired Map cannot regenerate");
  optionConfig.entry=optionConfig.entry.replace("- Act: 1","- Act: 2")
    .replace("- Importance: Required","- Importance: Optional")
    .replace("- Rarity: Common","- Rarity: Rare")
    .replace("- Duration: Default","- Duration: Short")
    .replace("- Restore Encounter Cards to Defaults: false","- Restore Encounter Cards to Defaults: true");
  options.act("Apply explicit defaults");
  check(customEvent.description.includes("- Act: 2")&&customEvent.description.includes("- Importance: Optional"),"Explicit Restore Defaults changes progression settings");
  check(customEvent.description.includes("- Rarity: Rare")&&customEvent.description.includes("- Duration: Short"),"Explicit Restore Defaults changes behavior settings");
  check(customEvent.entry.includes("The event finished.")&&customEvent.title==="01 - Special Encounter","Restore Defaults preserves title and Outcome");
  check(optionConfig.entry.includes("- Restore Encounter Cards to Defaults: false"),"Restore Defaults toggle resets");
  customEvent.description=customEvent.description.replace("- Status: Available","- Status: Retired");
  optionConfig.entry=optionConfig.entry.replace("- Set All Cards to Available: false","- Set All Cards to Available: true");
  options.act("Reset lifecycle");
  check(customEvent.description.includes("- Status: Available"),"Bulk lifecycle reset restores Available");
  check(customEvent.entry.includes("The event finished.")&&customEvent.description.includes("- Rarity: Rare"),"Bulk lifecycle reset preserves Outcome and settings");
  check(optionConfig.entry.includes("- Set All Cards to Available: false"),"Bulk lifecycle reset toggle resets");

  const commands=setup(false);
  commands.act("Initialize commands");
  commands.card("RAND_01").entry="A messenger arrives.";
  const commandTurn=commands.state.randomEncounters.turn;
  const commandInput=commands.call("input","/RE help");
  commands.call("context","Help command context");
  commands.call("output","Help command response");
  check(commands.state.randomEncounters.turn===commandTurn,"RE help command does not consume an RE turn");
  check(String(commandInput).includes("RE")||String(commands.state.message).includes("Commands:"),"RE help is acknowledged");
  commands.call("input","/RE start 1");
  commands.call("context","Start command context");
  commands.call("output","Start command response");
  check(commands.state.randomEncounters.turn===commandTurn,"RE start command does not consume an RE turn");
  check(commands.state.randomEncounters.pendingEncounter?.number===1,"RE start targets RAND_01");
  commands.act("Encounter activation");
  check(commands.state.randomEncounters.activeEncounter?.number===1,"Queued command encounter activates next real story turn");
  commands.call("input","/RE end");
  commands.call("context","End command context");
  commands.call("output","End command response");
  check(commands.state.randomEncounters.pendingResolutions.some(function(r){return r.number===1;}),"RE end queues an encounter resolution");


  // /RE status: all approved popup states and non-destructive command behavior.
  const statusEnv=setup(false);
  statusEnv.act("Initialize status environment.");
  const statusConfig=statusEnv.card("random encounter settings");
  const statusRuntime=statusEnv.state.randomEncounters;
  function assertStatus(expected,description) {
    statusEnv.state.message="";
    statusRuntime.messageSnapshot="";
    const before=JSON.stringify({
      cards:statusEnv.storyCards,
      turn:statusRuntime.turn,
      nextEncounterIn:statusRuntime.nextEncounterIn,
      pendingEncounter:statusRuntime.pendingEncounter,
      activeEncounter:statusRuntime.activeEncounter,
      pendingResolutions:statusRuntime.pendingResolutions,
      placeholderPopulation:statusRuntime.placeholderPopulation
    });
    const input=statusEnv.call("input","/re status");
    check(input!="/re status","Status is handled by command input");
    check(statusEnv.state.message==="RE - "+expected,description);
    const context=statusEnv.call("context","Current narrative.");
    check(context.includes("[RE CONTROL COMMAND]"),"Status command requests no story narration");
    check(statusEnv.call("output","Unwanted story output")!=="Unwanted story output","Status command hides response text");
    const after=JSON.stringify({
      cards:statusEnv.storyCards,
      turn:statusRuntime.turn,
      nextEncounterIn:statusRuntime.nextEncounterIn,
      pendingEncounter:statusRuntime.pendingEncounter,
      activeEncounter:statusRuntime.activeEncounter,
      pendingResolutions:statusRuntime.pendingResolutions,
      placeholderPopulation:statusRuntime.placeholderPopulation
    });
    check(before===after,"Status leaves Story Cards, pacing and encounter lifecycle unchanged");
  }
  statusRuntime.nextEncounterIn=null;
  assertStatus("Encounter countdown starts on the next story turn.","Status when countdown is not initialized");
  statusRuntime.nextEncounterIn=12;
  assertStatus("Next encounter in 12 turns.","Status reports the existing countdown");
  statusRuntime.pendingEncounter={number:2,code:"RAND_02"};
  assertStatus("RAND_02 queued for the next story action.","Status reports queued RAND number");
  statusRuntime.pendingEncounter=null;
  statusRuntime.activeEncounter={
    number:2,code:"RAND_02",
    resolveAfterTurn:statusRuntime.turn+15,inProgressChecks:0
  };
  assertStatus("RAND_02 active. Resolves in 15 turns.","Status reports active Duration");
  const awaiting=statusEnv.card("RAND_02");
  awaiting.description=awaiting.description.replace("- Status: Available","- Status: Awaiting Completion");
  statusRuntime.activeEncounter.resolveAfterTurn=statusRuntime.turn+9;
  statusRuntime.activeEncounter.inProgressChecks=2;
  assertStatus("RAND_02 awaiting completion. Next check in 9 turns (2/5).","Status reports incomplete check count");
  statusRuntime.pendingResolutions=[{number:2,code:"RAND_02"}];
  assertStatus("Resolving RAND_02. Awaiting outcome.","Resolution takes precedence over active encounter");
  statusRuntime.placeholderPopulation={numbers:[3,4],phase:"queued",attempts:4,requestedActionCount:null};
  assertStatus("Generating encounter cards. 2 remaining (Attempt 4).","Population takes precedence over resolution");
  statusRuntime.placeholderPopulation.attempts=0;
  assertStatus("Generating encounter cards. 2 remaining (awaiting first attempt).","Unstarted population does not claim Attempt 0");
  statusConfig.entry=statusConfig.entry.replace("- Enabled: true","- Enabled: false");
  assertStatus("Random encounters are disabled.","Disabled takes precedence over active generation");
  statusConfig.entry=statusConfig.entry.replace("- Enabled: false","- Enabled: true");
  statusRuntime.placeholderPopulation=null;
  statusRuntime.pendingResolutions=[];
  statusRuntime.activeEncounter=null;
  statusRuntime.nextEncounterIn=null;
  statusConfig.entry=statusConfig.entry.replace("- Maximum Encounter Cards: 4","- Maximum Encounter Cards: 5")
    .replace("- Create Max Encounter Cards: false","- Create Max Encounter Cards: true");
  assertStatus("Encounter countdown starts on the next story turn.","Status does not initialize countdown or trigger maintenance");
  check(!statusEnv.card("RAND_05"),"Status never triggers a pending one-shot card creation");
  check(statusConfig.entry.includes("- Create Max Encounter Cards: true"),"Status does not reset a pending one-shot toggle");
  const commandHelp=setup(false);commandHelp.act("Read command list");
  commandHelp.call("input","/RE help");
  check(commandHelp.state.message.includes("/RE status"),"Help includes status command");


  // v1.1 First Encounter Turn regression checks: absolute turn positions,
  // inclusive range, retry, separation from manual start, and default pacing.
  function firstConfigured(value,pacing) {
    const env=setup(false);
    env.call("context","Prepare configuration without advancing a turn.");
    const card=env.card("random encounter settings");
    ["RAND_01","RAND_02","RAND_03","RAND_04"].forEach(function(key){env.card(key).entry="An encounter begins for "+key+".";});
    card.entry=card.entry.replace("- First Encounter Turn: 0","- First Encounter Turn: "+value);
    if(pacing)card.entry=card.entry.replace("- Encounter Pacing: Moderate","- Encounter Pacing: "+pacing);
    return env;
  }
  const platformRetry=firstConfigured("30");
  platformRetry.act("Initial response");
  platformRetry.call("output","Initial generated prose.");
  platformRetry.call("input","/RE start 1");
  platformRetry.call("context","Control command");platformRetry.call("output","RE_COMMAND_ACK");
  platformRetry.history.push({type:"continue",text:""});platformRetry.info.actionCount=4;
  platformRetry.call("context","Introduce the encounter.");platformRetry.call("output","An encounter begins.");
  const beforeRetry=platformRetry.state.randomEncounters.turn;
  const deadline=platformRetry.state.randomEncounters.activeEncounter.resolveAfterTurn;
  for(let count=5;count<=7;count++){
    platformRetry.info.actionCount=count;
    platformRetry.call("context","Regenerate the same historical position.");platformRetry.call("output","Replacement encounter prose.");
    check(platformRetry.state.randomEncounters.turn===beforeRetry,"Platform counter-only Retry preserves turn at actionCount "+count);
    check(platformRetry.state.randomEncounters.activeEncounter.resolveAfterTurn-platformRetry.state.randomEncounters.turn===deadline-beforeRetry,"Platform Retry preserves remaining duration at actionCount "+count);
  }
  platformRetry.history.push({type:"continue",text:""});platformRetry.info.actionCount++;
  platformRetry.call("context","A genuine Continue.");platformRetry.call("output","Later prose.");
  check(platformRetry.state.randomEncounters.turn===beforeRetry+1,"Real Continue after counter-only retries advances exactly once");
  check(platformRetry.state.randomEncounters.activeEncounter.resolveAfterTurn-platformRetry.state.randomEncounters.turn===deadline-beforeRetry-1,"Real Continue decreases remaining duration exactly once");
  platformRetry.act("An ordinary typed action after Retry.");
  check(platformRetry.state.randomEncounters.turn===beforeRetry+2,"Typed Input after Retry advances exactly once");
  platformRetry.history[platformRetry.history.length-1].type="story";
  platformRetry.info.actionCount++;
  platformRetry.call("context","Retry the typed Story response");platformRetry.call("output","Alternate prose.");
  check(platformRetry.state.randomEncounters.turn===beforeRetry+2,"Counter-only Retry of typed Story response preserves turn");


  // Exercise the exact combined Input adapter, including Inner Self text rewriting.
  const adapter=setup(false);adapter.act("Initialize combined adapter");
  adapter.card("random encounter settings").entry=adapter.card("random encounter settings").entry.replace("- First Encounter Turn: 0","- First Encounter Turn: 30");
  adapter.card("RAND_01").entry="A clerk offers two tickets.";
  adapter.call("input","/RE start 1");adapter.call("context","Control");adapter.call("output","RE_COMMAND_ACK");
  adapter.act("Introduce tickets");adapter.call("output","Two tickets are offered.");
  const adapterTurn=adapter.state.randomEncounters.turn;
  const adapterDeadline=adapter.state.randomEncounters.activeEncounter.resolveAfterTurn;
  let transformed=0;
  const adapterHook=new Function("text","observe","RandomEncounters",'function InnerSelf(){observe();text="Upstream-transformed control text";}\n'+files["RE-InnerSelf-Merge/Input.js"]+";return text;");
  adapterHook("/ac Lobby Clock / Describe it",function(){transformed++;},adapter.call);
  adapter.history.push({type:"story",text:"/AC {Lobby Clock} -> invalid or unavailable"});adapter.info.actionCount++;
  const acControlContext=adapter.call("context","No narrative; rejected Auto-Cards command.");adapter.call("output","");
  check(transformed===1,"Combined Input still invokes Inner Self exactly once");
  check(adapter.state.randomEncounters.turn===adapterTurn,"Rejected Auto-Cards command does not consume RE turn");
  check(adapter.state.randomEncounters.activeEncounter.resolveAfterTurn-adapter.state.randomEncounters.turn===adapterDeadline-adapterTurn,"Rejected Auto-Cards command preserves Active duration");
  check(!acControlContext.includes("[ACTIVE RANDOM ENCOUNTER]"),"Auto-Cards control command has no RE prompt injection");
  adapter.history.push({type:"continue",text:""});adapter.info.actionCount++;
  adapter.call("context","Real Continue after AC command");adapter.call("output","Later prose.");
  check(adapter.state.randomEncounters.turn===adapterTurn+1,"Continue after rejected AC command advances exactly once");
  adapterHook("You cross the lobby.",function(){},adapter.call);
  adapter.call("context","Normal combined Input");adapter.call("output","Ordinary story.");
  check(adapter.state.randomEncounters.turn===adapterTurn+2,"Ordinary combined Input remains counted");

  // Native regression: backtrack three outputs, type a new Story, then Continue.
  const rewind=firstConfigured("30");
  rewind.card("RAND_01").entry="A clerk offers a pair of tickets.";
  rewind.call("input","/RE start 1");rewind.call("context","Control");rewind.call("output","RE_COMMAND_ACK");
  rewind.act("Introduce tickets");rewind.call("output","Tickets are offered.");
  for(let n=0;n<4;n++)rewind.act("Forward before rewind "+n);
  rewind.history.splice(-3);rewind.info.actionCount=rewind.history.length;
  const beforeRewindInput=rewind.state.randomEncounters.turn;
  const rewindDeadline=rewind.state.randomEncounters.activeEncounter.resolveAfterTurn;
  rewind.act("A new typed Story after backtracking");rewind.call("output","New branch prose.");
  check(rewind.state.randomEncounters.turn===beforeRewindInput+1,"Typed action after backtracking advances once");
  check(rewind.state.randomEncounters.activeEncounter.resolveAfterTurn-rewind.state.randomEncounters.turn===rewindDeadline-beforeRewindInput-1,"Typed action after backtracking spends one duration turn");
  rewind.history.push({type:"continue",text:"New branch prose."});rewind.info.actionCount++;
  rewind.call("context","Genuine Continue on new branch");rewind.call("output","Following prose.");
  check(rewind.state.randomEncounters.turn===beforeRewindInput+2,"Continue after backtracked typed action advances once");
  check(rewind.state.randomEncounters.activeEncounter.resolveAfterTurn-rewind.state.randomEncounters.turn===rewindDeadline-beforeRewindInput-2,"Backtracked typed action and Continue each spend one duration turn");
  rewind.info.actionCount++;rewind.call("context","Retry that Continue");rewind.call("output","Alternative prose.");
  check(rewind.state.randomEncounters.turn===beforeRewindInput+2,"Retry on resumed history branch preserves turn");
  check(rewind.state.randomEncounters.activeEncounter.resolveAfterTurn===rewindDeadline,"History anchor rebase does not rewrite Active deadline");

  const zero=firstConfigured("0","Debug");
  check(zero.card("random encounter settings").description.includes("First Encounter Turn: 0=normal; #=turn; #-#=inclusive range"),"Config Notes document three first-turn formats");
  check(zero.card("random encounter settings").entry.includes("- First Encounter Turn: 0"),"New config exposes default First Encounter Turn 0");
  zero.act("RE Turn 1");
  check(zero.state.randomEncounters.nextEncounterIn===2,"Zero retains original first Debug interval");
  zero.act("RE Turn 2");
  check(zero.state.randomEncounters.nextEncounterIn===1,"Zero uses existing decrement behavior");
  zero.act("RE Turn 3");
  check(!!zero.state.randomEncounters.activeEncounter,"Zero retains original first selection timing");
  check(zero.state.randomEncounters.firstAutomaticEncounterDone===true,"Default automatic selection records first completion");

  const fixed=firstConfigured("5","Debug");
  for(let turn=1;turn<5;turn++){
    fixed.act("Fixed target "+turn);
    check(fixed.state.randomEncounters.activeEncounter===null,"Fixed encounter stays inactive before turn "+turn);
    check(fixed.state.randomEncounters.nextEncounterIn===5-turn,"Fixed countdown accurate at turn "+turn);
  }
  fixed.act("Fixed target 5");
  check(fixed.state.randomEncounters.activeEncounter!==null,"Fixed first encounter selected on exact RE turn 5");
  check(fixed.state.randomEncounters.firstAutomaticEncounterDone===true,"Fixed first encounter marked consumed");
  fixed.call("input","/RE end");fixed.call("context","Command");fixed.call("output","Ignored");
  fixed.act("Resolve the first event");
  fixed.call("output","The encounter did not occur: The chance passed.");
  check(fixed.state.randomEncounters.pendingResolutions.length===0,"First fixed encounter resolution completes");
  fixed.act("Normal pacing after first fixed event");
  check(fixed.state.randomEncounters.nextEncounterIn===2,"Subsequent countdown uses Debug pacing instead of First Encounter Turn");

  const firstTurn=firstConfigured("1","Debug");
  firstTurn.act("First turn");
  check(firstTurn.state.randomEncounters.turn===1&&firstTurn.state.randomEncounters.activeEncounter!==null,"Value 1 starts first auto encounter on RE turn 1");

  const ranged=firstConfigured("3 - 5","Debug");
  ranged.act("Range initial");
  const target=ranged.state.randomEncounters.firstEncounterTarget;
  check(Number.isSafeInteger(target)&&target>=3&&target<=5,"Range first target is random within inclusive bounds");
  check(ranged.state.randomEncounters.nextEncounterIn===target-1,"Range countdown reports rolled target");
  while(ranged.state.randomEncounters.turn<target-1) {
    ranged.act("Continue toward range target");
  }
  check(ranged.state.randomEncounters.firstEncounterTarget===target,"Range remains fixed after initial draw");
  ranged.act("Range target arrives");
  check(ranged.state.randomEncounters.turn===target&&ranged.state.randomEncounters.activeEncounter!==null,"Range fires on its selected RE turn");
  check(ranged.state.randomEncounters.firstAutomaticEncounterDone===true,"Range consumes its scheduled first automatic roll");

  const changed=firstConfigured("8","Debug");
  changed.act("Countdown target eight");
  changed.card("random encounter settings").entry=changed.card("random encounter settings").entry.replace("First Encounter Turn: 8","First Encounter Turn: 4");
  changed.act("Target edited");
  check(changed.state.randomEncounters.firstEncounterTarget===4&&changed.state.randomEncounters.nextEncounterIn===2,"Before first encounter, changing target reschedules without delay");
  changed.act("Turn three");changed.act("Turn four");
  check(changed.state.randomEncounters.activeEncounter!==null,"Edited first target triggers on requested turn");

  const pacing=firstConfigured("6","Debug");
  pacing.act("Initialize first target six");
  pacing.card("random encounter settings").entry=pacing.card("random encounter settings").entry.replace("Encounter Pacing: Debug","Encounter Pacing: Fast");
  pacing.act("Change pacing");
  check(pacing.state.randomEncounters.firstEncounterTarget===6&&pacing.state.randomEncounters.nextEncounterIn===4,"Mid-run pacing change preserves first-turn deadline");
  for(let turn=3;turn<=6;turn++)pacing.act("Continue toward first target");
  check(pacing.state.randomEncounters.turn===6&&pacing.state.randomEncounters.activeEncounter!==null,"First encounter still arrives on time after pacing change");

  const empty=firstConfigured("1","Debug");
  ["RAND_01","RAND_02","RAND_03","RAND_04"].forEach(function(k){
    const card=empty.card(k);card.description=card.description.replace("- Act: 1","- Act: 2");
  });
  empty.act("No eligible cards");
  check(empty.state.randomEncounters.firstAutomaticEncounterDone===false&&empty.state.randomEncounters.activeEncounter===null,"No eligible cards do not consume the first deadline");
  empty.card("random encounter settings").entry=empty.card("random encounter settings").entry.replace("- Current Act: 1","- Current Act: 2");
  empty.act("Cards unlock");
  check(empty.state.randomEncounters.firstAutomaticEncounterDone===true&&empty.state.randomEncounters.activeEncounter!==null,"First encounter fires once a card becomes eligible");

  const manual=firstConfigured("4","Debug");
  manual.call("input","/RE start 1");manual.call("context","Manual command");manual.call("output","Suppressed");
  manual.act("Manual encounter on first turn");
  check(manual.state.randomEncounters.activeEncounter?.number===1&&manual.state.randomEncounters.firstAutomaticEncounterDone===false,"Manual start does not consume first automatic schedule");
  manual.call("input","/RE end");manual.call("context","Manual end");manual.call("output","Suppressed");
  manual.act("Manual resolution");
  manual.call("output","The encounter did not occur: The courier departed.");
  manual.act("Approach first automatic turn");
  check(manual.state.randomEncounters.firstAutomaticEncounterDone===false,"Manual end and resolution do not use the scheduled first roll");
  manual.act("Auto turn four");
  check(manual.state.randomEncounters.firstAutomaticEncounterDone===true,"First automatic schedule remains active after manual events");

  const disabled=firstConfigured("3","Debug");
  disabled.card("random encounter settings").entry=disabled.card("random encounter settings").entry.replace("- Enabled: true","- Enabled: false");
  disabled.act("Disabled action");
  check(disabled.state.randomEncounters.turn===0,"Disabled system does not count an RE turn");
  disabled.card("random encounter settings").entry=disabled.card("random encounter settings").entry.replace("- Enabled: false","- Enabled: true");
  disabled.act("Enabled turn one");
  check(disabled.state.randomEncounters.turn===1&&disabled.state.randomEncounters.nextEncounterIn===2,"First override uses counted RE turns only");

  const invalid=firstConfigured("7-3","Debug");
  invalid.act("Descending range");
  check(invalid.state.randomEncounters.config.firstEncounterTurn.min===0&&invalid.state.randomEncounters.nextEncounterIn===2,"Descending range falls back to default pacing");
  check(invalid.state.message.includes("First encounter turn is invalid; using the default value."),"Invalid first-turn setting produces player warning");
  const zeroRange=firstConfigured("0-9","Debug");zeroRange.act("Zero based range");
  check(zeroRange.state.randomEncounters.config.firstEncounterTurn.min===0,"Zero-based range is invalid");
  const alphabet=firstConfigured("later","Debug");alphabet.act("Alphabetic range");
  check(alphabet.state.randomEncounters.config.firstEncounterTurn.min===0,"Non-numeric first-turn setting is invalid");

  const external=firstConfigured("2","Debug");
  external.state.AutoCards={generation:{workpiece:{title:"Outside task"}}};
  external.act("External model owns this turn");
  check(external.state.randomEncounters.turn===0,"Auto-Cards owned generation does not spend first-turn countdown");
  external.call("output","External output");external.state.AutoCards.generation.workpiece={};
  external.act("Actual RE turn one");external.act("Actual RE turn two");
  check(external.state.randomEncounters.activeEncounter!==null,"First target fires after external model task releases turn");

  // v1.1: a hand-authored RAND key initializes missing Notes.
  const metaEnv=setup(false);
  metaEnv.act("Create defaults");
  const metaCfg=metaEnv.card("random encounter settings");
  metaCfg.entry=metaCfg.entry.replace("- Act: 1","- Act: 3")
    .replace("- Importance: Required","- Importance: Optional")
    .replace("- Rarity: Common","- Rarity: Rare")
    .replace("- Duration: Default","- Duration: Short");
  const metaBlank={type:"user category",keys:"RAND_05",title:"05 - Visitor",
    entry:"A visitor approaches the town.",description:""};
  metaEnv.storyCards.push(metaBlank);
  const metaPartial={type:"user category",keys:"RAND_06",title:"06 - Letter",
    entry:"A secret letter arrives.",description:
    "============== ENCOUNTER STATE ==============\n- Status: Available\n\n"+
    "============ ENCOUNTER SETTINGS ============\n--------- PROGRESSION ---------\n- Act: 2\n- Importance: Required\n- Custom: Preserve\n"+
    "---------- BEHAVIOR ----------\n- Rarity: Very Common\nCreator note stays."};
  metaEnv.storyCards.push(metaPartial);
  const metaLoose={type:"lore",keys:"RAND_07",title:"07 - Notes",
    entry:"The bell rings.",description:"Creator prose\n- Act: 4\n- Importance: Optional\n- Rarity: Very Rare\n- Duration: Long"};
  metaEnv.storyCards.push(metaLoose);
  const metaComplete={type:"#RE - Encounters",keys:"RAND_08",title:"08 - Finished",
    entry:"The gates close.",description:
    "============== ENCOUNTER STATE ==============\n- Status: Available\n- Encounter Number: 8\n\n"+
    "============ ENCOUNTER SETTINGS ============\n--------- PROGRESSION ---------\n- Act: 5\n- Importance: Optional\n"+
    "---------- BEHAVIOR ----------\n- Rarity: Rare\n- Duration: Short\n- Creator Extra: Retain"};
  metaEnv.storyCards.push(metaComplete);
  const metaUnrelated={type:"lore",keys:"LORE_09",title:"World Note",entry:"Lore",description:"Keep my Notes"};
  metaEnv.storyCards.push(metaUnrelated);
  metaEnv.act("Discover authored cards");
  check(metaEnv.storyCards.filter(function(x){return x.keys==="RAND_05";}).length===1,"Manual RAND key discovered without duplicate");
  check(metaBlank.description.includes("- Encounter Number: 5")&&metaBlank.description.includes("- Status: Available"),
    "Blank manually authored Notes receive state metadata");
  check(metaBlank.description.includes("- Kool-Aid Man Mode: false"),
    "Blank manually authored Notes receive disabled per-card Kool-Aid Man Mode");
  check(metaBlank.description.includes("- Act: 3")&&metaBlank.description.includes("- Importance: Optional")&&
    metaBlank.description.includes("- Rarity: Rare")&&metaBlank.description.includes("- Duration: Short"),
    "Blank Notes receive configured Global Defaults");
  check(metaBlank.title==="05 - Visitor"&&metaBlank.entry==="A visitor approaches the town."&&metaBlank.keys==="RAND_05",
    "Manual title Entry and key are preserved");
  check(metaPartial.description.includes("- Encounter Number: 6")&&metaPartial.description.includes("- Duration: Short")&&
    metaPartial.description.includes("- Kool-Aid Man Mode: false"),
    "Partial Notes gain missing number and duration");
  check(metaPartial.description.includes("- Act: 2")&&metaPartial.description.includes("- Importance: Required")&&
    metaPartial.description.includes("- Rarity: Very Common")&&metaPartial.description.includes("- Custom: Preserve")&&
    metaPartial.description.includes("Creator note stays."),
    "Partial Notes preserve creator settings and prose");
  check(metaLoose.description.includes("- Encounter Number: 7")&&metaLoose.description.includes("- Kool-Aid Man Mode: false")&&metaLoose.description.includes("- Act: 4")&&
    metaLoose.description.includes("- Importance: Optional")&&metaLoose.description.includes("- Rarity: Very Rare")&&
    metaLoose.description.includes("- Duration: Long")&&metaLoose.description.includes("Creator prose"),
    "Unstructured Notes preserve existing valid fields and comments");
  check(metaComplete.description.includes("- Creator Extra: Retain")&&metaComplete.title==="08 - Finished",
    "Already complete Notes preserve creator text");
  check(metaUnrelated.description==="Keep my Notes","Non-RAND card Notes ignored");
  const manualOn={type:"custom",keys:"RAND_09",title:"09 - Author-set mode",
    entry:"A quiet gathering begins.",description:"- Kool-Aid Man Mode: true\n- Act: 1"};
  metaEnv.storyCards.push(manualOn);
  metaEnv.act("Discover author-enabled Kool-Aid Man Mode");
  check(manualOn.description.includes("- Kool-Aid Man Mode: true") &&
    !manualOn.description.includes("Kool-Aid Man Mode: false"),
    "Manual authored Kool-Aid Man Mode true remains true after Notes initialization");
  
  const metaSaved=[metaBlank.description,metaPartial.description,metaLoose.description,metaComplete.description];
  let metaWrites=0;
  const metaAt=metaEnv.storyCards.indexOf(metaComplete);
  metaEnv.storyCards[metaAt]=new Proxy(metaComplete,{set:function(obj,key,value){if(key==="description")metaWrites++;obj[key]=value;return true;}});
  metaEnv.act("No metadata rewrites");
  check(metaWrites===0&&[metaBlank.description,metaPartial.description,metaLoose.description,metaComplete.description]
    .every(function(x,i){return x===metaSaved[i];}),"Initialized Notes remain unchanged next turn");
  metaCfg.entry=metaCfg.entry.replace("- Current Act: 1","- Current Act: 3");
  metaEnv.call("input","/RE start 5");
  check(metaEnv.state.randomEncounters.pendingEncounter?.number===5,
    "Manual RAND_05 is eligible for /RE start");
  // v1.1: duplicate RAND keys are reassigned in discovery order.
  const keyEnv=setup(false);keyEnv.act("Create existing RAND cards");
  const preserved=keyEnv.card("RAND_02");
  const added1={type:"custom",keys:"RAND_02",title:"Duplicate Custom Title",entry:"A mysterious door opens.",description:""};
  const added2={type:"custom",keys:"RAND_02",title:"02 - Encounter Card",entry:"A special merchant appears.",description:
    "============== ENCOUNTER STATE ==============\n- Status: Available\n- Encounter Number: 2\n\n"+
    "============ ENCOUNTER SETTINGS ============\n--------- PROGRESSION ---------\n- Act: 3\n- Importance: Optional\n---------- BEHAVIOR ----------\n- Rarity: Rare\n- Duration: Short"};
  keyEnv.storyCards.push(added1,added2);
  keyEnv.call("context","Discover two duplicate encounter keys");
  check(preserved.keys==="RAND_02","Original RAND key remains unchanged after duplicate repair");
  check(added1.keys==="RAND_05"&&added2.keys==="RAND_06","Duplicate keys take sequential next available numbers");
  check(added1.description.includes("- Encounter Number: 5")&&
    added2.description.includes("- Encounter Number: 6"),"Duplicate encounter Notes numbers follow reassigned keys");
  check(added1.title==="Duplicate Custom Title"&&added1.entry==="A mysterious door opens."&&
    added2.title==="06 - Encounter Card"&&added2.entry==="A special merchant appears.",
    "Duplicate repair preserves custom content and renumbers only default titles");
  check(added2.description.includes("- Act: 3")&&added2.type==="#RE - Act 3 Encounters  🔒",
    "Duplicate repair preserves Act and synchronizes category");
  check(String(keyEnv.state.message||"").includes("Duplicate RAND_02 reassigned"),
    "Duplicate repair notifies the player");
  const keysSaved=[added1.keys,added2.keys];
  keyEnv.call("context","Re-run maintenance without duplicating");
  check(added1.keys===keysSaved[0]&&added2.keys===keysSaved[1],"Duplicate repair is idempotent");
  const keyArray={type:"event",keys:["RAND_03","important hint"],title:"Array Keys",entry:"A forgotten bell tolls.",description:""};
  keyEnv.storyCards.push(keyArray);
  keyEnv.call("context","Repair array-based RAND key");
  check(keyArray.keys[0]==="RAND_07"&&keyArray.keys[1]==="important hint",
    "Duplicate repair supports key arrays and preserves secondary keys");

  const clonePlaceholder={type:"custom",keys:"RAND_01",title:"Cloned Placeholder",
    entry:"[Define random encounter 01 here.]",description:""};
  keyEnv.storyCards.push(clonePlaceholder);
  keyEnv.call("context","Repair duplicate placeholder key");
  check(clonePlaceholder.keys==="RAND_08"&&clonePlaceholder.entry==="[Define random encounter 08 here.]",
    "Renumbered default placeholder remains recognizable by the invalid-entry guard");
  // v1.1: categories track the Notes Act and do not rewrite creator fields.
  const cats=setup(false);cats.act("Create cards");
  const cat=cats.card("RAND_01");
  check(cat.type==="#RE - Act 1 Encounters  📜","New encounter card uses Act 1 category");
  cat.entry="A streetlight blinks three times.";
  cat.description=cat.description.replace("- Act: 1","- Act: 4");
  const catNotes=cat.description;
  cats.call("context","Synchronize edited Act");
  check(cat.type==="#RE - Act 4 Encounters  🔒"&&cat.description===catNotes,
    "Manual Act edit changes category without rewriting Notes");
  cats.call("input","/RE reset 1");cats.call("context","Reset RAND_01");
  check(cat.type==="#RE - Act 1 Encounters  📜","Reset synchronizes category with Global Defaults");
  // v1.1: Kool-Aid Man Mode uses independent global/card boolean OR behavior.
  function runModeTest(globalMode,perCardMode) {
    const env=setup(false);
    env.act("Initialize encounter cards");
    const cfg=env.card("random encounter settings");
    cfg.entry=cfg.entry.replace("- Kool-Aid Man Mode: false","- Kool-Aid Man Mode: "+(globalMode?"true":"false"));
    const card=env.card("RAND_01");
    card.entry="The lighthouse beacon turns red.";
    card.description=card.description.replace("- Kool-Aid Man Mode: false","- Kool-Aid Man Mode: "+perCardMode);
    env.call("input","/RE start 1");
    env.call("context","Run manual start");
    env.call("output","Control reply");
    const output=env.act("Continue with the lighthouse scene");
    return {env,card,output};
  }
  const forceGlobal=runModeTest(true,"false");
  check(forceGlobal.output.includes("IN THIS RESPONSE"),"Global No Matter What forces introduction");
  check(forceGlobal.env.state.randomEncounters.lastInjectedEncounter.forced===true,
    "Forced introduction state recorded for retries");
  const forcedRetry=forceGlobal.env.call("context","Retry unchanged turn");
  check(forcedRetry.includes("IN THIS RESPONSE"),"Retry repeats original stronger instruction");
  const forceGlobalCardOff=runModeTest(true,"false");
  check(forceGlobalCardOff.output.includes("IN THIS RESPONSE"),
    "Global Kool-Aid Man Mode true forces introduction when card is false");
  check(forceGlobalCardOff.card.description.includes("- Kool-Aid Man Mode: false"),
    "Card false stays false when global true forces introduction");
  const forceCardOnly=runModeTest(false,"true");
  check(forceCardOnly.output.includes("IN THIS RESPONSE"),
    "Per-card Kool-Aid Man Mode true forces introduction when global false");
  check(forceCardOnly.card.description.includes("- Kool-Aid Man Mode: true"),
    "Per-card Kool-Aid Man Mode true survives activation and metadata writes");
  const forceBoth=runModeTest(true,"true");
  check(forceBoth.output.includes("IN THIS RESPONSE"),
    "Kool-Aid Man Mode true globally and individually still forces introduction");
  const forceNeither=runModeTest(false,"false");
  check(!forceNeither.output.includes("IN THIS RESPONSE")&&
    forceNeither.output.includes("when the current scene allows"),
    "Both Kool-Aid Man Mode switches false retain ordinary introduction");
  const cardOnlyRetry=forceCardOnly.env.call("context","Retry a card-only forced turn");
  check(cardOnlyRetry.includes("IN THIS RESPONSE"),
    "Card-only Kool-Aid Man Mode true persists through Retry");
  const offRetry=forceNeither.env.call("context","Retry a non-forced turn");
  check(!offRetry.includes("IN THIS RESPONSE")&&offRetry.includes("when the current scene allows"),
    "Global and card false maintain relaxed introduction on Retry");
  const onOffAlias=runModeTest(true,"Off");
  check(onOffAlias.output.includes("IN THIS RESPONSE")&&
    onOffAlias.card.description.includes("- Kool-Aid Man Mode: false"),
    "Creator-friendly On/Off values normalize to true/false on metadata writes");
  const onAlias=runModeTest(false,"On");
  check(onAlias.output.includes("IN THIS RESPONSE")&&
    onAlias.card.description.includes("- Kool-Aid Man Mode: true"),
    "Per-card On is accepted as true on metadata writes");

  // v1.1: Kool-Aid Man Mode must embrace deliberately mismatched interruptions.
  const chaoticPrompt=forceGlobal.output;
  [
    "Introduce the core encounter immediately, IN THIS RESPONSE.",
    "Make it happen NOW, directly interrupting the current situation if necessary.",
    "Do not wait for a natural opening, foreshadow its arrival, or soften the encounter to make it fit the story.",
    "The encounter may be unexpected, absurd, disruptive",
    "completely at odds with the current setting, genre, tone, or circumstances.",
    "Embrace the mismatch rather than explaining it away.",
    "Let the characters react naturally",
    "do not require an explanation for why the event is happening.",
    "how it develops or resolves remains open."
  ].forEach(function(instruction){
    check(chaoticPrompt.includes(instruction),"Kool-Aid Man Mode chaos instruction: "+instruction);
  });
  check(!chaoticPrompt.includes("Adapt minor details as needed to fit the current setting"),
    "Kool-Aid Man Mode does not inherit the normal-mode compatibility instruction");
  check(chaoticPrompt.includes("If another instruction requires a private control prefix") &&
    chaoticPrompt.includes("Do not mention random encounters, Story Cards, scripts, triggers, dice, or game mechanics."),
    "Kool-Aid Man Mode preserves script control prefix and hidden mechanics safeguards");
  check(forceNeither.output.includes("when the current scene allows") &&
    forceNeither.output.includes("Adapt minor details as needed to fit the current setting and characters") &&
    !forceNeither.output.includes("Embrace the mismatch rather than explaining it away."),
    "Normal encounter mode remains continuity-sensitive and excludes chaos instruction");
  check(forcedRetry.includes("Make it happen NOW") &&
    cardOnlyRetry.includes("Make it happen NOW") &&
    !offRetry.includes("Make it happen NOW"),
    "Retry keeps chosen chaotic or natural instruction intensity");
  const whimsical=runModeTest(false,"true");
  check(whimsical.output.includes("The lighthouse beacon turns red.") &&
    whimsical.output.includes("The encounter must begin now; how it develops or resolves remains open."),
    "Chaotic injection preserves the core authored encounter and open-ended outcome");

  // v1.1: default placeholders never become random encounters or model instructions.
  const invalidPool=setup(false);
  invalidPool.call("context","Initialize invalid pool");
  invalidPool.card("random encounter settings").entry=invalidPool.card("random encounter settings").entry
    .replace("- First Encounter Turn: 0","- First Encounter Turn: 1");
  const emptyTurn=invalidPool.act("All encounter cards are placeholders");
  check(!emptyTurn.includes("[RANDOM ENCOUNTER]")&&invalidPool.state.randomEncounters.activeEncounter===null,
    "Untouched placeholders are excluded from automatic injection");
  check(invalidPool.state.randomEncounters.firstAutomaticEncounterDone===false,
    "Invalid pool does not consume the first automatic encounter target");
  invalidPool.card("RAND_02").entry="A lost dog wanders into the street.";
  const validTurn=invalidPool.act("Continue after adding a valid encounter");
  check(validTurn.includes("A lost dog wanders into the street.")&&
    !validTurn.includes("[Define random encounter")&&
    invalidPool.state.randomEncounters.activeEncounter?.number===2,
    "Automatic selection chooses the only populated card and excludes placeholders");
  check(invalidPool.state.randomEncounters.firstAutomaticEncounterDone===true,
    "First automatic target completes only on actual valid injection");

  const invalidManual=setup(false);invalidManual.act("Initialize the config");
  invalidManual.call("input","/RE start 1");
  check(String(invalidManual.state.message||"").includes("RAND_01 is invalid"),
    "Manual activation reports invalid default placeholder");
  check(invalidManual.state.randomEncounters.pendingEncounter===null,
    "Manual invalid selection does not queue an encounter");
  invalidManual.card("RAND_01").entry="  ";
  invalidManual.call("input","/RE start 1");
  check(invalidManual.state.randomEncounters.pendingEncounter===null,
    "Whitespace-only Entry is rejected");
  invalidManual.card("RAND_01").entry="[A real, authored encounter appears in the shadows.]";
  invalidManual.call("input","/RE start 1");
  check(invalidManual.state.randomEncounters.pendingEncounter?.number===1,
    "Creator-authored bracketed prose is accepted as a valid encounter");

  const invalidPending=setup(false);invalidPending.act("Initialize encounter cards");
  invalidPending.card("RAND_02").entry="A small robot knocks at the door.";
  invalidPending.call("input","/RE start 2");
  invalidPending.call("context","Start control turn");invalidPending.call("output","Control output");
  invalidPending.card("RAND_02").entry="[Define random encounter 02 here.]";
  const blockedPending=invalidPending.act("A pending encounter was replaced with a placeholder");
  check(!blockedPending.includes("[RANDOM ENCOUNTER]")&&
    !blockedPending.includes("[Define random encounter")&&
    invalidPending.state.randomEncounters.pendingEncounter===null&&
    invalidPending.state.randomEncounters.activeEncounter===null,
    "Last-moment pending placeholder cannot reach model");
  check(String(invalidPending.state.message||"").includes("RAND_02 is invalid"),
    "Invalidated pending activation displays player warning");

  const invalidActive=setup(false);invalidActive.act("Initialize active test");
  invalidActive.card("RAND_01").entry="The mayor announces a curfew.";
  invalidActive.call("input","/RE start 1");
  invalidActive.call("context","Start active test");invalidActive.call("output","Control output");
  invalidActive.act("Begin curfew");
  check(invalidActive.state.randomEncounters.activeEncounter?.number===1,
    "Populated encounter enters Active before it is edited");
  invalidActive.card("RAND_01").entry="";
  const blockedActive=invalidActive.act("Continue after blanking active card");
  check(!blockedActive.includes("[ACTIVE RANDOM ENCOUNTER]")&&
    invalidActive.state.randomEncounters.activeEncounter===null&&
    invalidActive.state.randomEncounters.pendingResolutions.length===0,
    "Active encounter blanked mid-run cancels without resolution prompt");
  check(invalidActive.card("RAND_01").description.includes("- Status: Available"),
    "Invalidated Active card returns to Available");

  const invalidRetry=setup(false);invalidRetry.act("Initialize retry test");
  invalidRetry.card("RAND_01").entry="A meteor flashes overhead.";
  invalidRetry.call("input","/RE start 1");
  invalidRetry.call("context","Start retry test");invalidRetry.call("output","Control output");
  invalidRetry.act("Meteor appears");
  invalidRetry.card("RAND_01").entry="[Define random encounter 01 here.]";
  const blockedRetry=invalidRetry.call("context","Retry after card invalidation");
  check(!blockedRetry.includes("[RANDOM ENCOUNTER]")&&
    invalidRetry.state.randomEncounters.activeEncounter===null,
    "Retry guard blocks placeholder and cancels invalid Active state");

  const invalidResolution=setup(false);invalidResolution.act("Initialize resolution test");
  invalidResolution.card("RAND_01").entry="A wagon overturns.";
  invalidResolution.call("input","/RE start 1");
  invalidResolution.call("context","Start resolution test");invalidResolution.call("output","Control output");
  invalidResolution.act("The wagon arrives");
  invalidResolution.call("input","/RE end");
  invalidResolution.call("context","End encounter");
  invalidResolution.call("output","Control reply");
  check(invalidResolution.state.randomEncounters.pendingResolutions.length===1,
    "Valid manual end queues a normal resolution");
  invalidResolution.card("RAND_01").entry="[Define random encounter 01 here.]";
  const blockedResolution=invalidResolution.act("Resolution canceled after author blanks event");
  check(!blockedResolution.includes("[RANDOM ENCOUNTER RESOLUTION]")&&
    invalidResolution.state.randomEncounters.pendingResolutions.length===0,
    "Resolution cannot inject an event that became a placeholder");
  check(invalidResolution.card("RAND_01").description.includes("- Status: Available"),
    "Canceled resolution returns card to Available");
  // v1.1 generator difficulty/theme and completed-card progress checks.
  const genDefault=setup(false);
  genDefault.act("Create initial cards");
  const genCfg=genDefault.card("random encounter settings");
  check(genCfg.entry.includes("- Encounter Difficulty: Easy")&&genCfg.entry.includes("- Encounter Theme: "),
    "Generator defaults to Easy and no theme");
  genCfg.entry=genCfg.entry.replace("- Populate Placeholder Cards: false","- Populate Placeholder Cards: true");
  const genInitial=genDefault.act("Generate placeholders");
  check(genInitial.includes("for a game set to 'easy' difficulty") &&
    genInitial.includes("current and known locations") &&
    !genInitial.includes("low-stakes"),
    "Default generation is explicitly Easy, genre-neutral, and includes known locations");
  check(genDefault.state.randomEncounters.placeholderPopulation.totalCount===4 &&
    genDefault.state.randomEncounters.placeholderPopulation.completedCount===0,
    "Progress starts at 0 of total batch");
  const genThemed=setup(false);
  genThemed.act("Initialize genre-neutral generation");
  const themedCfg=genThemed.card("random encounter settings");
  themedCfg.entry=themedCfg.entry.replace("- Encounter Difficulty: Easy","- Encounter Difficulty: Hard")
    .replace("- Encounter Theme: ","- Encounter Theme: night at the movies")
    .replace("- Populate Placeholder Cards: false","- Populate Placeholder Cards: true");
  const genPrompt=genThemed.act("Begin themed generation");
  check(genPrompt.includes("Generate random encounters for a game set to 'hard' difficulty.") &&
    genPrompt.includes('Theme: "night at the movies"'),
    "Hard difficulty phrasing and freeform theme are injected");
  check(genPrompt.includes("without prescribing genre, tone, conflict, narrative structure, or outcome"),
    "Difficulty guidance remains narratively open-ended");
  const sameGenerationRetry=genThemed.call("context","Retry pending generation");
  check(sameGenerationRetry.includes("for a game set to 'hard' difficulty") &&
    sameGenerationRetry.includes('Theme: "night at the movies"'),
    "Same-action generation Retry uses original settings");
  genThemed.call("output","Unformatted prose, not RAND data.");
  themedCfg.entry=themedCfg.entry.replace("- Encounter Difficulty: Hard","- Encounter Difficulty: Very Easy")
    .replace("- Encounter Theme: night at the movies","- Encounter Theme: springtime in the countryside");
  const genRetry=genThemed.act("Retry batch generation");
  check(genRetry.includes("for a game set to 'hard' difficulty")&&genRetry.includes('Theme: "night at the movies"')&&
    !genRetry.includes("for a game set to 'very easy' difficulty"),"Generator retries preserve snapshot values");
  const genMalformedProgress=genThemed.call("output","RAND_01\nTitle: Broken\nScenario: \nEND RAND_01");
  check(genMalformedProgress==="\n[RE] Updating Encounter Cards (0 of 4) - Hit Continue\n",
    "Unparseable RAND text hijack uses 0 of 4");
  const coldPopulation=setup(false);coldPopulation.call("context","Initialize without a forward action");
  coldPopulation.card("random encounter settings").entry=coldPopulation.card("random encounter settings").entry.replace("- Populate Placeholder Cards: false","- Populate Placeholder Cards: true");
  const coldContext=coldPopulation.call("context","Repeat unchanged Context before first eligible action");
  check(!coldContext.includes("[RE DEDICATED ENCOUNTER GENERATION]")&&coldPopulation.state.randomEncounters.placeholderPopulation.attempts===0,"Never-attempted batch stays queued without a forward action");
  coldPopulation.act("First eligible generation action");
  check(coldPopulation.state.randomEncounters.placeholderPopulation.attempts===1,"First eligible action still starts cold generation batch once");
  const queuedRetry=setup(false);queuedRetry.act("Initialize queued retry");
  const queuedCfg=queuedRetry.card("random encounter settings");
  queuedCfg.entry=queuedCfg.entry.replace("- Populate Placeholder Cards: false","- Populate Placeholder Cards: true").replace("- Encounter Difficulty: Easy","- Encounter Difficulty: Hard").replace("- Encounter Theme: ","- Encounter Theme: night at the movies");
  queuedRetry.act("Generate a batch");
  queuedRetry.call("output","RAND_01\nTitle: Ticket\nScenario: A clerk hands you a ticket.\nEND RAND_01");
  const queueAttempt=queuedRetry.state.randomEncounters.placeholderPopulation.attempts;
  const queuedTurn=queuedRetry.state.randomEncounters.turn;
  queuedCfg.entry=queuedCfg.entry.replace("- Encounter Difficulty: Hard","- Encounter Difficulty: Very Easy").replace("- Encounter Theme: night at the movies","- Encounter Theme: downtime");
  queuedRetry.info.actionCount++;
  const nativeQueueRetry=queuedRetry.call("context","Native Retry of partial receipt");
  check(nativeQueueRetry.includes("[RE DEDICATED ENCOUNTER GENERATION]"),"Queued partial generation Retry remains a data task");
  check(nativeQueueRetry.includes("for a game set to 'hard' difficulty")&&nativeQueueRetry.includes('Theme: "night at the movies"'),"Queued generation Retry retains original settings after Config edits");
  check(queuedRetry.state.randomEncounters.placeholderPopulation.phase==="generating"&&queuedRetry.state.randomEncounters.placeholderPopulation.attempts===queueAttempt,"Queued generation Retry preserves attempt number");
  check(queuedRetry.state.randomEncounters.turn===queuedTurn,"Queued generation Retry does not spend RE turn");
  check(queuedRetry.state.message.includes("Attempt "+queueAttempt+" - 1 of 4")&&queuedRetry.state.randomEncounters.placeholderPopulation.requestedActionCount===queuedRetry.info.actionCount,"Queued generation Retry refreshes cumulative progress without a new attempt");
  check(queuedRetry.state.randomEncounters.placeholderPopulation.completedCount===1&&!nativeQueueRetry.includes("Requested cards: RAND_01,"),"Queued generation Retry preserves progress and requests only remaining cards");
  const retryCompletion=queuedRetry.call("output",[2,3,4].map(n=>"RAND_0"+n+"\nTitle: Ticket "+n+"\nScenario: A clerk hands you ticket "+n+".\nEND RAND_0"+n).join("\n\n"));
  check(retryCompletion==="\n[RE] Updating Encounter Cards (4 of 4) - Hit Continue\n"&&queuedRetry.state.randomEncounters.placeholderPopulation===null,"Queued generation Retry completes original cumulative batch");
  queuedRetry.history.push({type:"continue",text:""});queuedRetry.info.actionCount++;
  const afterBatch=queuedRetry.call("context","Continue after completed Retry batch");
  check(!afterBatch.includes("[RE DEDICATED ENCOUNTER GENERATION]")&&queuedRetry.state.randomEncounters.turn===queuedTurn+1,"Continue after generation Retry completion resumes ordinary pacing once");
  const genGentle=setup(false);genGentle.act("Start gentle scene");
  const gentleCfg=genGentle.card("random encounter settings");
  gentleCfg.entry=gentleCfg.entry.replace("- Encounter Difficulty: Easy","- Encounter Difficulty: Very Easy")
    .replace("- Encounter Theme: ","- Encounter Theme: quiet walk at sunset")
    .replace("- Populate Placeholder Cards: false","- Populate Placeholder Cards: true");
  const gentleContext=genGentle.act("Generate calm theme");
  check(gentleContext.includes("for a game set to 'very easy' difficulty") &&
    gentleContext.includes('Theme: "quiet walk at sunset"'),"Very Easy supports wholesome themes");
  const genBad=setup(false);genBad.act("Start invalid setting test");
  const badCfg=genBad.card("random encounter settings");
  badCfg.entry=badCfg.entry.replace("- Encounter Difficulty: Easy","- Encounter Difficulty: Impossible")
    .replace("- Encounter Theme: ","- Encounter Theme: this theme is longer than five whole words")
    .replace("- Populate Placeholder Cards: false","- Populate Placeholder Cards: true");
  const badCtx=genBad.act("Generate with fallbacks");
  check(badCtx.includes("for a game set to 'easy' difficulty")&&!badCtx.includes("\nTheme: "),
    "Invalid fields independently fall back to Easy and None");
  check(genBad.state.randomEncounters.placeholderPopulation.difficulty==="Easy" &&
    genBad.state.randomEncounters.placeholderPopulation.theme==="None",
    "Invalid fields are snapshotted as independent defaults");
  // Strictly binary Kool-Aid Man Mode, including malformed and manually edited values.
  function modeLines(card) {
    return String(card.description||"").split("\n").filter(function(line){
      return /^\s*-?\s*Kool-Aid Man Mode\s*:/i.test(line);
    });
  }
  const onlyBinary=setup(false); onlyBinary.act("Initialize strict mode Notes");
  const booleanCard=onlyBinary.card("RAND_01");
  check(modeLines(booleanCard).length===1 && modeLines(booleanCard)[0]==="- Kool-Aid Man Mode: false",
    "New encounter starts with exactly one false Kool-Aid Man Mode value");
  booleanCard.description=booleanCard.description.replace("- Kool-Aid Man Mode: false","- Kool-Aid Man Mode: Default");
  onlyBinary.act("Normalize invalid card Default");
  check(modeLines(booleanCard).length===1 && modeLines(booleanCard)[0]==="- Kool-Aid Man Mode: false",
    "Default is invalid for card Kool-Aid Man Mode and normalizes to false");
  booleanCard.description=booleanCard.description.replace("- Kool-Aid Man Mode: false","- Kool-Aid Man Mode: enabled");
  onlyBinary.act("Normalize enabled card mode");
  check(modeLines(booleanCard).length===1 && modeLines(booleanCard)[0]==="- Kool-Aid Man Mode: true",
    "Enabled is recognized and canonicalized to true");
  booleanCard.entry="A friend brings a gift.";
  onlyBinary.call("input","/RE start 1");
  onlyBinary.call("context","Start gift encounter");
  onlyBinary.call("output","Acknowledged");
  const modePrompt=onlyBinary.act("Introduce friend");
  check(modePrompt.includes("IN THIS RESPONSE") && modeLines(booleanCard).length===1 &&
    modeLines(booleanCard)[0]==="- Kool-Aid Man Mode: true",
    "Activation preserves one enabled field and the stronger instruction");
  booleanCard.description+="\n- Kool-Aid Man Mode: false";
  onlyBinary.act("Deduplicate manually duplicated mode field");
  check(modeLines(booleanCard).length===1 && modeLines(booleanCard)[0]==="- Kool-Aid Man Mode: true",
    "Mode field deduplicates on Notes maintenance without disabling existing true");
  const freeBool=setup(false);freeBool.act("Start freeform Notes test");
  const looseBool={type:"custom",keys:"RAND_11",title:"11 - Friendly visit",
    entry:"The town gathers for dinner.",description:"Creator introduction.\n- Kool-Aid Man Mode: On"};
  freeBool.storyCards.push(looseBool);
  freeBool.act("Initialize author-created card");
  check(modeLines(looseBool).length===1&&modeLines(looseBool)[0]==="- Kool-Aid Man Mode: true" &&
    looseBool.description.includes("Creator introduction."),
    "Freeform authored On is preserved as one true field with creator text");
  const invalidCard=setup(false);invalidCard.act("Initialize invalid notes test");
  const invalidModeCard=invalidCard.card("RAND_01");
  invalidModeCard.description=invalidModeCard.description.replace("- Kool-Aid Man Mode: false","- Kool-Aid Man Mode: unrecognized");
  invalidCard.act("Normalize unrecognized card mode");
  check(modeLines(invalidModeCard).length===1&&modeLines(invalidModeCard)[0]==="- Kool-Aid Man Mode: false",
    "Unrecognized per-card mode cannot remain in Notes");
  const invalidConfig=setup(false);invalidConfig.act("Initialize invalid global mode");
  const strictConfig=invalidConfig.card("random encounter settings");
  strictConfig.entry=strictConfig.entry.replace("- Kool-Aid Man Mode: false","- Kool-Aid Man Mode: Default");
  invalidConfig.act("Reject invalid global Default");
  check(strictConfig.entry.includes("- Kool-Aid Man Mode: false") &&
    !strictConfig.entry.includes("- Kool-Aid Man Mode: Default") &&
    invalidConfig.state.randomEncounters.config.noMatterWhatMode===false,
    "Default is not valid in global Config and is reset to false");
  strictConfig.entry=strictConfig.entry.replace("- Kool-Aid Man Mode: false","- Kool-Aid Man Mode: On");
  invalidConfig.act("Accept global On");
  check(invalidConfig.state.randomEncounters.config.noMatterWhatMode===true,
    "Global On remains a valid binary synonym");
  // Regressions for actual generation defects recorded in the v1.1 audit.
  const malformedCases=[
    ["missing title","RAND_01\nScenario: A visitor arrives.\nEND RAND_01"],
    ["unfinished","RAND_01\nTitle: Visitor\nScenario: A visitor carrying\nEND RAND_01"],
    ["dangling","RAND_01\nTitle: Visitor\nScenario: A visitor carrying.\nEND RAND_01"],
    ["two sentences","RAND_01\nTitle: Visitor\nScenario: A visitor arrives. another visitor departs.\nEND RAND_01"],
    ["oversize","RAND_01\nTitle: Visitor\nScenario: A visitor "+("quietly ".repeat(230))+"arrives.\nEND RAND_01"]
  ];
  malformedCases.forEach(function(pair) {
    const e=setup(false);e.act("Initialize");
    const cfg=e.card("random encounter settings");
    cfg.entry=cfg.entry.replace("- Populate Placeholder Cards: false","- Populate Placeholder Cards: true");
    e.act("Request generation");e.call("output",pair[1]);
    check(e.state.randomEncounters.placeholderPopulation.completedCount===0 &&
      e.card("RAND_01").entry.includes("[Define random encounter"),
      "Invalid generation stays queued: "+pair[0]);
  });
  const abbr=setup(false);abbr.act("Initialize");
  const abbrCfg=abbr.card("random encounter settings");
  abbrCfg.entry=abbrCfg.entry.replace("- Populate Placeholder Cards: false","- Populate Placeholder Cards: true");
  abbr.act("Generate");abbr.call("output","RAND_01\nTitle: Call\nScenario: Dr. Vale arrives.\nEND RAND_01");
  check(abbr.card("RAND_01").entry==="Dr. Vale arrives.","Abbreviations preserved");
  // Importance ASAP combines Required progression and earliest-eligible scheduling.
  {
    const order=setup(false);order.act("Initialize card ordering");
    const card=order.card("RAND_01");
    check(card.description.includes("- Importance: Required")&&card.description.includes("- Rarity: Common")&&
      !card.description.includes("Force ASAP"),"New cards keep normal Rarity and default Required Importance");
    const prevEntry=card.entry,prevTitle=card.title,prevKeys=card.keys;
    card.description=card.description.replace("- Importance: Required","- Importance: ASAP");
    order.act("Maintain ASAP Importance");
    check(card.description.includes("- Importance: ASAP")&&card.description.includes("- Rarity: Common"),
      "ASAP Importance survives maintenance while Rarity stays Common");
    check(card.entry===prevEntry&&card.title===prevTitle&&card.keys===prevKeys,"ASAP preserves creator fields");
    const stable=card.description;order.act("Idempotent maintenance");
    check(card.description===stable,"ASAP Importance idempotent");

    const previousRarity=setup(false);previousRarity.act("Initialize former ASAP Rarity");
    const prior=previousRarity.card("RAND_01");
    prior.description=prior.description.replace("- Importance: Required","- Importance: Optional")
      .replace("- Rarity: Common","- Rarity: ASAP");
    previousRarity.act("Migrate former ASAP Rarity");
    check(prior.description.includes("- Importance: ASAP")&&prior.description.includes("- Rarity: Common"),
      "Rarity ASAP migrates into Required ASAP Importance, with ordinary Rarity reset");

    const legacy=setup(false);legacy.act("Initialize former priority switch");
    const lc=legacy.card("RAND_01");
    lc.description=lc.description.replace("- Importance: Required","- Importance: Optional")
      .replace("- Rarity: Common","- Rarity: Rare")
      .replace("- Kool-Aid Man Mode: false","- Force ASAP: true"+String.fromCharCode(10)+"- Kool-Aid Man Mode: true");
    legacy.act("Migrate legacy Force ASAP true");
    check(lc.description.includes("- Importance: ASAP")&&lc.description.includes("- Rarity: Rare")&&
      lc.description.includes("- Kool-Aid Man Mode: true")&&!lc.description.includes("Force ASAP"),
      "Legacy priority true becomes ASAP Importance, retains ordinary Rarity and removes flag");
    const saved=lc.description;legacy.act("Idempotent legacy migration");
    check(lc.description===saved,"Legacy migration remains stable");
    const off=setup(false);off.act("Old false toggle");
    const oc=off.card("RAND_01");
    oc.description=oc.description.replace("- Kool-Aid Man Mode: false",
      "- Force ASAP: false"+String.fromCharCode(10)+"- Kool-Aid Man Mode: false");
    off.act("Migrate obsolete false");
    check(oc.description.includes("- Importance: Required")&&oc.description.includes("- Rarity: Common")&&
      !oc.description.includes("Force ASAP"),"Legacy false removed without changes to Importance or Rarity");
  }
  const forced=setup(false);forced.act("Start priority test");
  forced.card("RAND_01").entry="The candle flickers.";
  forced.card("RAND_02").entry="The door opens.";
  forced.card("RAND_02").description=forced.card("RAND_02").description.replace("- Importance: Required","- Importance: ASAP");
  forced.call("input","/RE start");
  check(forced.state.randomEncounters.pendingEncounter?.number===2&&forced.card("RAND_02").description.includes("- Rarity: Common"),"Manual random start prioritizes ASAP Importance");
  forced.call("context","Command");forced.call("output","Command reply");
  forced.act("Start encounter");
  check(forced.state.randomEncounters.activeEncounter?.number===2&&forced.card("RAND_02").description.includes("- Importance: ASAP"),"ASAP Importance persists Active");
  const gated=setup(false);gated.act("Initialize Act priority");
  gated.card("RAND_01").entry="A lamp shifts.";gated.card("RAND_02").entry="The mirror opens.";
  gated.card("RAND_02").description=gated.card("RAND_02").description.replace("- Act: 1","- Act: 2").replace("- Importance: Required","- Importance: ASAP");
  gated.call("input","/RE start");
  check(gated.state.randomEncounters.pendingEncounter?.number===1,"ASAP respects Act gating");
  const instant=setup(false);instant.act("Start pacing test");
  instant.card("RAND_01").entry="A bell tolls.";
  instant.card("RAND_01").description=instant.card("RAND_01").description.replace("- Importance: Required","- Importance: ASAP");
  const naturalWait=instant.state.randomEncounters.nextEncounterIn;
  instant.act("ASAP card becomes eligible during countdown");
  check(naturalWait>0&&instant.state.randomEncounters.activeEncounter?.number===1,"ASAP Importance bypasses pacing countdown");
  const actUnlock=setup(false);actUnlock.act("Initialize act unlock");
  const next=actUnlock.card("RAND_02");next.entry="The special visitor arrives.";
  next.description=next.description.replace("- Act: 1","- Act: 2").replace("- Importance: Required","- Importance: ASAP");
  actUnlock.act("Act 2 still locked");
  check(!actUnlock.state.randomEncounters.activeEncounter,"ASAP waits for its Act to unlock");
  check(next.type==="#RE - Act 2 Encounters  🔒","Future act has locked category");
  const actCfg=actUnlock.card("random encounter settings");
  actCfg.entry=actCfg.entry.replace("- Current Act: 1","- Current Act: 2");
  actUnlock.act("Act 2 becomes eligible");
  check(actUnlock.state.randomEncounters.activeEncounter?.number===2,"ASAP triggers on Act unlock");
  check(next.type==="#RE - Act 2 Encounters  📜","Available Act category displays scroll icon");
  const scheduled=firstConfigured("5","Debug");
  scheduled.card("RAND_01").description=scheduled.card("RAND_01").description.replace("- Importance: Required","- Importance: ASAP");
  for(let i=1;i<=4;i++){scheduled.act("Before first target "+i);
    check(!scheduled.state.randomEncounters.activeEncounter,"ASAP observes First Encounter Turn "+i);}
  scheduled.act("Scheduled eligible encounter");
  check(scheduled.state.randomEncounters.activeEncounter?.number===1,"ASAP triggers when scheduled first turn arrives");
  const tie=setup(false);tie.act("Initialize tied ASAP pool");
  ["RAND_01","RAND_02"].forEach(function(key){
    const c=tie.card(key);c.entry="An event occurs.";
    c.description=c.description.replace("- Importance: Required","- Importance: ASAP");
  });
  tie.act("Select lowest RAND");
  check(tie.state.randomEncounters.activeEncounter?.number===1,"Multiple ASAP encounters sorted by Act and RAND");
  tie.act("Wait during active");
  check(tie.state.randomEncounters.activeEncounter?.number===1,"Active encounters are not displaced");
  const migrated=setup(false);migrated.act("Initialize old label");
  migrated.card("random encounter settings").entry=migrated.card("random encounter settings").entry.replace("Kool-Aid Man Mode: false","No Matter What Mode: true");
  migrated.card("RAND_01").description=migrated.card("RAND_01").description.replace("Kool-Aid Man Mode: false","No Matter What Mode: true");
  migrated.act("Migrate to new label");
  check(migrated.card("random encounter settings").entry.includes("Kool-Aid Man Mode: true")&&migrated.card("RAND_01").description.includes("Kool-Aid Man Mode: true"),"Old label migrates preserving true");
  // ASAP Importance is Required, while Rarity remains independently weighted.
  function asapResolution(phrase) {
    const e=setup(false);e.act("Initialize ASAP resolution");
    const c=e.card("RAND_01");c.entry="A distant violinist plays.";
    c.description=c.description.replace("- Importance: Required","- Importance: ASAP")
      .replace("- Rarity: Common","- Rarity: Rare");
    ["RAND_02","RAND_03","RAND_04"].forEach(function(key){
      const other=e.card(key);other.description=other.description.replace("- Importance: Required","- Importance: Optional");
    });
    // Keep an Act 2 card visible to verify immediate category unlock on resolution.
    e.card("RAND_02").description=e.card("RAND_02").description.replace("- Act: 1","- Act: 2");
    e.act("Organize locked Act 2 card");
    check(e.card("RAND_02").type==="#RE - Act 2 Encounters  🔒",
      "Before ASAP Required completion, next Act remains locked");
    e.state.randomEncounters.pendingResolutions=[{number:1,code:"RAND_01",duration:"Default",rarity:"Rare",
      eventText:c.entry,attempts:0,lastAttemptTurn:null,allowContinuation:true}];
    e.call("output",phrase);return {e,c};
  }
  const occurs=asapResolution("The encounter occurred: The distant song was heard.");
  check(occurs.c.description.includes("- Importance: ASAP")&&occurs.c.description.includes("- Rarity: Rare")&&
    occurs.c.description.includes("- Status: Retired"),"Success retains ASAP Importance and independent Rare Rarity");
  check(occurs.e.card("random encounter settings").entry.includes("- Current Act: 2"),
    "Completed ASAP encounter satisfies Required progression and unlocks next Act");
  check(occurs.e.card("RAND_02").type==="#RE - Act 2 Encounters  📜",
    "Required ASAP success unlocks Act category immediately during Output");
  const ongoing=asapResolution("The encounter is in progress: The strange song began and the search continues.");
  check(ongoing.c.description.includes("- Importance: ASAP")&&ongoing.c.description.includes("- Status: Awaiting Completion"),
    "Unfinished ASAP remains Required and Awaiting Completion");
  check(ongoing.e.card("random encounter settings").entry.includes("- Current Act: 1"),
    "Unfinished ASAP blocks Act progression");
  const absent=asapResolution("The encounter did not occur: Nobody heard the violinist.");
  check(absent.c.description.includes("- Importance: ASAP")&&absent.c.description.includes("- Status: Available"),
    "Failed ASAP retains ASAP and returns to Available");
  absent.e.act("Retry on next eligible turn");
  check(absent.e.state.randomEncounters.activeEncounter?.number===1,"Failed ASAP becomes immediately eligible again");
  const bad=setup(false);bad.act("Initialize invalid ASAP");
  const badCard=bad.card("RAND_01");badCard.entry="";
  badCard.description=badCard.description.replace("- Importance: Required","- Importance: ASAP");
  bad.act("Reject empty ASAP");
  check(badCard.description.includes("- Importance: ASAP")&&!bad.state.randomEncounters.activeEncounter,
    "Invalid ASAP retains Importance and is skipped");

  const locks=setup(false);locks.act("Initialize category locks");
  const lockCard=locks.card("RAND_01");
  lockCard.description=lockCard.description.replace("- Act: 1","- Act: 3");
  locks.act("Lock Act 3");
  check(lockCard.type==="#RE - Act 3 Encounters  🔒","Act 3 locked category updates after Notes edit");
  locks.card("random encounter settings").entry=locks.card("random encounter settings").entry.replace("- Current Act: 1","- Current Act: 3");
  locks.act("Unlock Act 3");
  check(lockCard.type==="#RE - Act 3 Encounters  📜","Act 3 available category uses scroll when Current Act permits it");
  locks.card("random encounter settings").entry=locks.card("random encounter settings").entry.replace("- Current Act: 3","- Current Act: 1");
  locks.act("Relock Act 3");
  check(lockCard.type==="#RE - Act 3 Encounters  🔒","Act 3 locks again when Current Act is reduced");

  const def=setup(false);def.act("Create defaults");
  const dc=def.card("random encounter settings");
  dc.entry=dc.entry.replace("- Importance: Required","- Importance: ASAP");
  dc.entry=dc.entry.replace("- Create Max Encounter Cards: false","- Create Max Encounter Cards: true")
    .replace("- Maximum Encounter Cards: 4","- Maximum Encounter Cards: 5");
  def.act("Create new card with ASAP default");
  check(def.card("RAND_05").description.includes("- Importance: ASAP")&&
    def.card("RAND_05").description.includes("- Rarity: Common"),
    "Global Default Importance ASAP applies to newly created cards");

  {
  // Reproduces native Retry's count-only growth with unchanged history.
  const nativeRetry=setup(false);nativeRetry.act("Initialize Retry simulation");
  const reTurn=nativeRetry.state.randomEncounters.turn;
  nativeRetry.info.actionCount+=1;
  nativeRetry.call("context","Retry identical history");
  check(nativeRetry.state.randomEncounters.turn===reTurn,"Count-only Retry does not spend RE turn");
  nativeRetry.history.push({type:"continue",text:"Actually continued"});
  nativeRetry.call("context","Forward Continue");
  check(nativeRetry.state.randomEncounters.turn===reTurn+1,"Continue after Retry counts once");

  // Combined wrapper captures /ac intent independently of rejected workpieces.
  const captured=[];
  const adapter=new Function("text","InnerSelf","RandomEncounters",files["RE-InnerSelf-Merge/Input.js"]);
  adapter("/ac redo Missing Test Card",function(h){captured.push("IS:"+h);},
    function(h,t){captured.push("RE:"+h+":"+t);return t;});
  check(captured[0]==="IS:input"&&captured.includes("RE:pause:Auto-Cards control command")&&
    captured.some(function(v){return v.indexOf("RE:input:")===0;}),
    "Combined adapter pauses rejected Auto-Cards command");
  const standard=[];
  adapter("I check my coat.",function(h){standard.push("IS:"+h);},
    function(h,t){standard.push("RE:"+h);return t;});
  check(!standard.includes("RE:pause"),"Ordinary input is not paused by Auto-Cards adapter");

  // A partial generation must remain a data task on Retry with its batch snapshot.
  const batch=setup(false);batch.act("Initialize batch");
  const batchCfg=batch.card("random encounter settings");
  batchCfg.entry=batchCfg.entry.replace("- Encounter Difficulty: Easy","- Encounter Difficulty: Hard")
    .replace("- Encounter Theme: ","- Encounter Theme: night at the movies")
    .replace("- Populate Placeholder Cards: false","- Populate Placeholder Cards: true");
  const opened=batch.act("Generate placeholders");
  check(opened.includes("for a game set to 'hard' difficulty"),"Original generation uses Hard setting");
  const partialText="RAND_01\nTitle: Arrival\nScenario: A stranger enters the cinema.\nEND RAND_01\n\n"+
    "RAND_02\nTitle: Snack\nScenario: An attendant offers popcorn.\nEND RAND_02";
  const firstReceipt=batch.call("output",partialText);
  check(firstReceipt.includes("(2 of 4)")&&batch.state.randomEncounters.placeholderPopulation.phase==="queued"&&
    batch.state.randomEncounters.placeholderPopulation.attempts===1,
    "Partial generation retains two queued cards on attempt one");
  const saved1=batch.card("RAND_01").entry,saved2=batch.card("RAND_02").entry;
  batchCfg.entry=batchCfg.entry.replace("- Encounter Difficulty: Hard","- Encounter Difficulty: Very Easy")
    .replace("- Encounter Theme: night at the movies","- Encounter Theme: downtime");
  const before=batch.state.randomEncounters.turn;
  batch.info.actionCount+=1;
  const retryTask=batch.call("context","Retry incomplete batch");
  check(batch.state.randomEncounters.turn===before&&
    batch.state.randomEncounters.placeholderPopulation.attempts===1&&
    retryTask.includes("for a game set to 'hard' difficulty")&&
    retryTask.includes('Theme: "night at the movies"')&&
    retryTask.includes("Requested cards: RAND_03, RAND_04"),
    "Partial Retry repeats remaining cards using frozen batch, no extra turn or attempt");
  const rest="RAND_03\nTitle: Ticket\nScenario: A patron drops a ticket.\nEND RAND_03\n\n"+
    "RAND_04\nTitle: Projector\nScenario: A projector flickers behind the screen.\nEND RAND_04";
  const lastReceipt=batch.call("output",rest);
  check(lastReceipt.includes("(4 of 4)")&&batch.state.randomEncounters.placeholderPopulation===null&&
    batch.card("RAND_01").entry===saved1&&batch.card("RAND_02").entry===saved2,
    "Partial Retry completes batch without overwriting earlier cards");
  check(batchCfg.entry.includes("- Encounter Difficulty: Very Easy")&&
    batchCfg.entry.includes("- Encounter Theme: downtime")&&
    batchCfg.entry.includes("- Populate Placeholder Cards: false"),
    "Batch completion retains creator Config edits and resets toggle");

  // Quoted question marks within one enclosing sentence are valid.
  const quoted=setup(false);quoted.act("Start quoted parser check");
  const qcfg=quoted.card("random encounter settings");
  qcfg.entry=qcfg.entry.replace("- Populate Placeholder Cards: false","- Populate Placeholder Cards: true");
  quoted.act("Start quoted generation");
  quoted.call("output","RAND_01\nTitle: A Question\nScenario: A clerk asks, \"Coming?\" before pointing to the auditorium.\nEND RAND_01");
  check(quoted.card("RAND_01").entry==='A clerk asks, "Coming?" before pointing to the auditorium.',
    "Embedded quoted punctuation is valid within a single-sentence encounter");
  check(quoted.state.randomEncounters.placeholderPopulation.completedCount===1,
    "Valid quoted sentence counts as one generated encounter");
  }
  for (const invalid of ['A clerk asks, "Coming?" before pointing to the auditorium. Go.', 'A clerk asks, "Coming?" before pointing to the auditorium. Another patron waves.', 'A clerk asks, "Coming?" before pointing to the auditorium. another patron waves.']) {
    const multi=setup(false);multi.act("Initialize quoted multi-sentence test");
    multi.card("random encounter settings").entry=multi.card("random encounter settings").entry.replace("- Populate Placeholder Cards: false","- Populate Placeholder Cards: true");
    multi.act("Generate quoted negatives");
    multi.call("output","RAND_01\nTitle: Two Sentences\nScenario: "+invalid+"\nEND RAND_01");
    check(multi.state.randomEncounters.placeholderPopulation.completedCount===0,"Quoted sentence rejects trailing prose: "+invalid);
  }
  const markedBatch=setup(false);markedBatch.act("Initialize Inner Self prefix regression");
  markedBatch.card("random encounter settings").entry=markedBatch.card("random encounter settings").entry.replace("- Populate Placeholder Cards: false","- Populate Placeholder Cards: true");
  markedBatch.act("Generate marked RAND data");
  const markedEntry="A firefighter wearing a 👩‍🚒 badge offers you directions.";
  markedBatch.call("output","\n\n\u200B\u200D\u200BRAND01\nTitle: Directions\nScenario: "+markedEntry+"\nEND RAND01\n\nRAND02\nTitle: Ticket\nScenario: A clerk offers you a ticket.\nEND RAND02");
  check(markedBatch.state.randomEncounters.placeholderPopulation.completedCount===2,"Inner Self invisible prefix does not hide first RAND record");
  check(markedBatch.card("RAND_01").entry===markedEntry,"Population parser preserves joiners inside generated Entry");
  return passed;
}
if(typeof module!=="undefined"&&module&&module.exports){
 module.exports=run;
 if(require.main===module){
   const fs=require("node:fs"),path=require("node:path"),root=path.resolve(__dirname,"../.."),files={};
   ["Library.js","RE-InnerSelf-Merge/Library.js","Input.js","Context.js","Output.js","RE-InnerSelf-Merge/Input.js","RE-InnerSelf-Merge/Context.js","RE-InnerSelf-Merge/Output.js"].forEach(function(name){
     files[name]=fs.readFileSync(path.join(root,name),"utf8");
   });
   const passed=run(files);
   process.stdout.write("PASS "+passed.length+"/"+passed.length+" smoke checks\n");
 }
}
