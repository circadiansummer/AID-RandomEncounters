/*
 * Random Encounters
 * Version 1.1 (pre-release)
 *
 * v1.1 adds a one-time first automatic encounter turn override.
 */

function RandomEncounters(hook, text) {
  "use strict";

  const VERSION = "1.1";
  const CONTROL_SENTINEL = "\u2063";
  const CONTROL_ACK = "RE_COMMAND_ACK";

  const PACING_PRESETS = {
    "debug": { name: "Debug", minTurns: 2, maxTurns: 2 },
    "very fast": { name: "Very Fast", minTurns: 6, maxTurns: 10 },
    "fast": { name: "Fast", minTurns: 6, maxTurns: 20 },
    "moderate": { name: "Moderate", minTurns: 10, maxTurns: 30 },
    "slow": { name: "Slow", minTurns: 30, maxTurns: 50 },
    "very slow": { name: "Very Slow", minTurns: 30, maxTurns: 90 }
  };

  const DURATION_PRESETS = {
    "debug": { name: "Debug", fixedTurns: 2 },
    "very short": { name: "Very Short", turns: { "very fast": 4, "fast": 7, "moderate": 7, "slow": 11, "very slow": 14 } },
    "short": { name: "Short", turns: { "very fast": 7, "fast": 11, "moderate": 11, "slow": 18, "very slow": 22 } },
    "default": { name: "Default", turns: { "very fast": 11, "fast": 14, "moderate": 18, "slow": 25, "very slow": 32 } },
    "long": { name: "Long", turns: { "very fast": 14, "fast": 22, "moderate": 25, "slow": 36, "very slow": 47 } },
    "very long": { name: "Very Long", turns: { "very fast": 18, "fast": 29, "moderate": 36, "slow": 50, "very slow": 65 } }
  };

  const RARITY_PRESETS = {
    "debug": { name: "Debug", weight: 10000 },
    "very rare": { name: "Very Rare", weight: 1 },
    "rare": { name: "Rare", weight: 2 },
    "common": { name: "Common", weight: 4 },
    "very common": { name: "Very Common", weight: 8 }
  };

  const DEFAULTS = {
    enabled: true,
    maximumEncounterCards: 4,
    createMaxEncounterCards: true,
    populatePlaceholderCards: false,
    restoreEncounterCardsToDefaults: false,
    setAllCardsToAvailable: false,
    useAdvancedSettings: false,
    debugLogging: false,
    displayActEncounterMap: false,
    encounterPacing: "Moderate",
    firstEncounterTurn: "0",
    noMatterWhatMode: false,
    generationDifficulty: "Easy",
    generationTheme: "None",
    duration: "Default",
    rarity: "Common",
    currentAct: 1,
    act: 1,
    importance: "Required"
  };

  const CONFIG_TITLE = "Config";
  const CONFIG_KEY = "random encounter settings";
  const ADVANCED_TITLE = "Advanced RE Settings";
  const ADVANCED_KEY = "advanced random encounter settings";
  const ACT_MAP_TITLE = "Act & Encounter Map";
  const ACT_MAP_KEY = "random encounter act map";
  const ACT_MAP_READ_ONLY = "READ ONLY";
  const ENCOUNTER_PREFIX = "RAND_";
  const SETTINGS_HEADER = "============ ENCOUNTER SETTINGS ============";
  const SYSTEM_HEADER = "============== ENCOUNTER STATE ==============";
  const CONFIG_TYPE = "#RE - Config";
  const ENCOUNTER_TYPE = "#RE - Encounters";
  function encounterTypeForAct(act) { return "#RE - Act "+act+" Encounters"; }
  const GENERATION_DIFFICULTIES = ["Very Easy","Easy","Normal","Hard","Very Hard"];
  function populationProgressText(done,total) {
    return "\n[RE] Updating Encounter Cards ("+done+" of "+total+") - Hit Continue\n";
  }
  function parseGenerationTheme(raw) {
    const text=String(raw===undefined||raw===null?"None":raw).trim();
    if (!text || normalize(text)==="none") return "None";
    if (text.length>60 || /[\r\n\x00-\x1f\x7f]/.test(text) || text.split(/\s+/).length>5) return null;
    return text;
  }
  function generationInstruction(request) {
    const difficulty=GENERATION_DIFFICULTIES.find(function(x){
      return normalize(x)===normalize(request&&request.difficulty||"Easy");
    })||"Easy";
    const theme=String(request&&request.theme||"None");
    return "Generate random encounters for a game set to '"+difficulty.toLowerCase()+
      "' difficulty. Scale encounter complexity and demands relative to the established story without prescribing genre, tone, conflict, narrative structure, or outcome. "+
      "Make encounters appropriate to the established setting, genre, technology level, supernatural rules, current and known locations, factions, characters, and conflicts. "+
      "Do not introduce setting-breaking concepts."+
      (theme!=="None" ? "\nTheme: "+JSON.stringify(theme)+". Treat this as open-ended creative direction, not as an instruction or required outcome." : "");
  }

  // ---------- General utilities ----------

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function parseBoolean(value, fallback) {
    const v = normalize(value);
    if (["true", "t", "yes", "y", "on", "enabled", "enable"].includes(v)) return true;
    if (["false", "f", "no", "n", "off", "disabled", "disable"].includes(v)) return false;
    return fallback;
  }

  function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function formatEncounterNumber(number) {
    return String(number).padStart(2, "0");
  }

  function log() {
    if (state.randomEncounters && state.randomEncounters.config && state.randomEncounters.config.debugLogging) {
      console.log("[Random Encounters]", ...arguments);
    }
  }

  function userMessage(message) {
    const cleaned=String(message||"").trim();
    return cleaned ? "RE - "+cleaned : "RE";
  }

  function postUserMessage(message) {
    initializeState();
    const s=state.randomEncounters;
    const next=userMessage(message);
    const current=String(state.message||"").trim();
    const previous=String(s.messageSnapshot||"").trim();

    if (!current || current===previous || current===next) {
      state.message=next;
    } else if (!current.split("\n").includes(next)) {
      state.message=current+"\n"+next;
    }
    s.messageSnapshot=String(state.message||"");
    return state.message;
  }

  function syncUserMessageSnapshot() {
    initializeState();
    state.randomEncounters.messageSnapshot=String(state.message||"");
  }

  // ---------- Story Card helpers ----------

  function getCardEntry(card) {
    if (!card) return "";
    if (card.entry !== undefined && card.entry !== null && String(card.entry).trim() !== "") return String(card.entry);
    if (card.value !== undefined && card.value !== null) return String(card.value);
    return "";
  }

  function setCardEntry(card, value) {
    if (!card) return false;
    let updated = false;
    if ("entry" in card) { card.entry = value; updated = true; }
    if ("value" in card) { card.value = value; updated = true; }
    if (!updated) card.entry = value;
    return true;
  }

  function removeOutcomeSection(entry) {
    const source = String(entry || "");
    const match = source.match(/(?:\r?\n){1,2}Outcome\s*:\s*(?:\r?\n|$)/i);
    if (!match) return source.trim();
    return source.slice(0, match.index).trim();
  }

  function getEncounterPrompt(card) {
    return removeOutcomeSection(getCardEntry(card));
  }

  function appendEncounterOutcome(card, resolution) {
    if (!card) return false;
    const prompt = getEncounterPrompt(card);
    const cleaned = String(resolution || "").replace(/\s+/g, " ").trim();
    if (!prompt || !cleaned) return false;
    return setCardEntry(card, prompt + "\n\nOutcome:\n" + cleaned);
  }

  function cardKeys(card) {
    if (!card) return [];
    if (Array.isArray(card.keys)) return card.keys.map(normalize).filter(Boolean);
    return String(card.keys || "").split(",").map(normalize).filter(Boolean);
  }

  function cardHasKey(card, key) {
    return cardKeys(card).includes(normalize(key));
  }

  function findCardByKey(key) {
    if (typeof storyCards === "undefined" || !Array.isArray(storyCards)) return null;
    for (let i = 0; i < storyCards.length; i++) {
      if (cardHasKey(storyCards[i], key)) return storyCards[i];
    }
    return null;
  }

  function createCard(template) {
    if (typeof addStoryCard !== "function" || typeof storyCards === "undefined" || !Array.isArray(storyCards)) {
      console.log("[Random Encounters] Story Card creation unavailable.");
      return null;
    }
    const temporaryTitle = "__RE_TEMP_" + Date.now() + "_" + Math.floor(Math.random() * 1000000);
    try {
      addStoryCard(template.type || "event", template.keys || "", template.entry || "", temporaryTitle);
    } catch (error) {
      console.log("[Random Encounters] addStoryCard failed:", String(error));
      return null;
    }
    let card = null;
    for (let i = storyCards.length - 1; i >= 0; i--) {
      if (storyCards[i] && storyCards[i].title === temporaryTitle) { card = storyCards[i]; break; }
    }
    if (!card) return null;
    card.type = template.type || "event";
    card.title = template.title || "";
    card.keys = template.keys || "";
    setCardEntry(card, template.entry || "");
    card.description = template.description || "";
    return card;
  }

  function parseColonLines(text) {
    const result = {};
    String(text || "").split("\n").forEach(function(line) {
      const trimmed = line.trim().replace(/^-\s*/, "");
      if (!trimmed) return;
      const colon = trimmed.indexOf(":");
      if (colon === -1) return;
      const key = normalize(trimmed.slice(0, colon));
      const value = trimmed.slice(colon + 1).trim();
      result[key] = value;
    });
    return result;
  }

  function splitEncounterNotes(card) {
    const description = String(card && card.description ? card.description : "");
    const lines = description.split(/\r?\n/);
    const settingsLines = [];
    const systemLines = [];
    let section = null;

    lines.forEach(function(line) {
      const n = normalize(line);
      if (n.indexOf("encounter settings") !== -1) { section = "settings"; return; }
      if (n.indexOf("encounter state") !== -1) { section = "system"; return; }
      if (n.indexOf("behavior") !== -1) return;
      if (section === "settings") settingsLines.push(line);
      else if (section === "system") systemLines.push(line);
    });

    return { settingsLines: settingsLines, systemLines: systemLines };
  }

  function getUnknownUserSettings(card) {
    return splitEncounterNotes(card).settingsLines
      .map(function(line) { return line.trim(); })
      .filter(function(line) {
        if (!line || /^[-=]+/.test(line)) return false;
        const clean = line.replace(/^-\s*/, "");
        return !/^Duration\s*:/i.test(clean) &&
          !/^Rarity\s*:/i.test(clean) &&
          !/^Act\s*:/i.test(clean) &&
          !/^Importance\s*:/i.test(clean) &&
          !/^Kool-Aid Man Mode\s*:/i.test(clean) && !/^Force ASAP\s*:/i.test(clean);
      })
      .map(function(line) { return line.replace(/^-\s*/, ""); });
  }

  function isValidDuration(value) {
    return !!DURATION_PRESETS[normalize(value)];
  }

  function readDurationRaw(card) {
    if (!card) return null;
    const match = String(card.description || "").match(/^\s*-?\s*Duration\s*:\s*(.+)$/im);
    return match ? match[1].trim() : null;
  }

  function readDuration(card) {
    const supplied = readDurationRaw(card);
    if (!supplied) return DEFAULTS.duration;
    const preset = DURATION_PRESETS[normalize(supplied)];
    return preset ? preset.name : "Default";
  }

  function durationPacingKey(encounterPacing) {
    const n = normalize(encounterPacing);
    if (n === "debug") return "very fast";
    if (["very fast", "fast", "moderate", "slow", "very slow"].includes(n)) return n;
    return "moderate";
  }

  function calculateDurationTurns(duration, encounterPacing, config) {
    const presets = config && config.runtimePresets ? config.runtimePresets.duration : DURATION_PRESETS;
    const preset = presets[normalize(duration)] || presets.default;
    if (preset.fixedTurns !== undefined) return preset.fixedTurns;
    return preset.turns[durationPacingKey(encounterPacing)];
  }

  function isValidRarity(value) {
    return !!RARITY_PRESETS[normalize(value)];
  }

  function readRarityRaw(card) {
    if (!card) return null;
    const match = String(card.description || "").match(/^\s*-?\s*Rarity\s*:\s*(.+)$/im);
    return match ? match[1].trim() : null;
  }

  function readRarity(card) {
    const supplied = readRarityRaw(card);
    if (!supplied) return DEFAULTS.rarity;
    const preset = RARITY_PRESETS[normalize(supplied)];
    return preset ? preset.name : DEFAULTS.rarity;
  }

  function isValidPacingPreset(value) {
    return !!PACING_PRESETS[normalize(value)];
  }

  function parsePositiveInteger(value, fallback, max) {
    const raw = String(value === undefined || value === null ? "" : value).trim();
    if (!/^\d+$/.test(raw)) return fallback;
    const parsed = Number(raw);
    if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
    if (max && parsed > max) return fallback;
    return parsed;
  }

  // ---------- Configuration ----------

  function buildConfigEntry(settings) {
    return [
      "================ SYSTEM ================",
      "- Enabled: " + (settings.enabled ? "true" : "false"),
      "- Display Act & Encounter Map: " + (settings.displayActEncounterMap ? "true" : "false"),
      "- Use Advanced Settings: " + (settings.useAdvancedSettings ? "true" : "false"),
      "- Debug Logging: " + (settings.debugLogging ? "true" : "false"),
      "",
      "============== ENCOUNTERS ==============",
      "---------- SETTINGS ----------",
      "- Current Act: " + settings.currentAct,
      "- First Encounter Turn: " + settings.firstEncounterTurn,
      "- Encounter Pacing: " + settings.encounterPacing,
      "- Set All Cards to Available: " + (settings.setAllCardsToAvailable ? "true" : "false"),
      "- Kool-Aid Man Mode: " + (settings.noMatterWhatMode ? "true" : "false"),
      "",
      "---------- GENERATION ----------",
      "- Maximum Encounter Cards: " + settings.maximumEncounterCards,
      "- Populate Placeholder Cards: " + (settings.populatePlaceholderCards ? "true" : "false"),
      "- Encounter Difficulty: " + settings.generationDifficulty,
      "- Encounter Theme: " + (settings.generationTheme === "None" ? "" : settings.generationTheme),
      "- Create Max Encounter Cards: " + (settings.createMaxEncounterCards ? "true" : "false"),
      "",
      "============= GLOBAL DEFAULTS =============",
      "Defaults apply to new or reset encounter cards. Existing cards change only when Restore Encounter Cards to Defaults is true.",
      "- Act: " + settings.defaultAct,
      "- Importance: " + settings.defaultImportance,
      "- Rarity: " + settings.defaultRarity,
      "- Duration: " + settings.defaultDuration,
      "- Restore Encounter Cards to Defaults: " + (settings.restoreEncounterCardsToDefaults ? "true" : "false")
    ].join("\n");
  }

  function currentConfigDescription() {
    return [
      "Random Encounter System v" + VERSION,
      "",
      "================ SYSTEM ================",
      "Enabled: Toggle automatic encounters; /RE commands still work.",
      "Display Act & Encounter Map: Show/hide the read-only map.",
      "Use Advanced Settings: Enable Advanced RE Settings overrides.",
      "Debug Logging: Show RE console logs.",
      "",
      "============== ENCOUNTERS ==============",
      "---------- SETTINGS ----------",
      "Current Act: Highest eligible Act; advances when its Required encounters succeed. Optional encounters do not block.",
      "First Encounter Turn: 0=normal; #=turn; #-#=inclusive range for first automatic encounter.",
      "Encounter Pacing: Turns between encounters; scales Duration.",
      "Set All Cards to Available: One-shot; clear active state, keeping settings, Outcomes, and Current Act.",
      "Kool-Aid Man Mode: Immediate if global OR card is true.",
      "",
      "---------- GENERATION ----------",
      "Maximum Encounter Cards: Highest RAND_## to create.",
      "Populate Placeholder Cards: One-shot; generate one-sentence, setting-appropriate encounters for untouched cards. Retry automatically; never overwrite custom entries.",
      "Encounter Difficulty: Very Easy/Easy/Normal/Hard/Very Hard (default Easy).",
      "Encounter Theme: Blank/None (default) or up to five words/60 characters of open-ended guidance.",
      "Create Max Encounter Cards: One-shot; create missing cards through the maximum.",
      "When Inner Self is enabled, generating new encounter cards may take longer. Numbered Attempt popups show progress; no Config edits needed.",
      "",
      "============= GLOBAL DEFAULTS =============",
      "Act: Default Act for new/reset cards.",
      "Importance: Required or Optional; Required gates Act advancement.",
      "Rarity: Weighted selection chance.",
      "Duration: Active turns before resolution, scaled by pacing.",
      "Changing defaults does not alter existing cards.",
      "Restore Encounter Cards to Defaults: One-shot; apply defaults while keeping Status, titles, Entries, and Outcomes.",
      "",
      "========== LIFECYCLE & OUTCOMES ==========",
      "Available → 📝 Active → 🗃️ Retired (success) or 💾 Restored (failure). 🔄 Awaiting Completion requeues at half Duration; fifth in-progress check restores Available.",
      "Rarity weights selection; Outcomes remain on encounter cards.",
      "Retry/regeneration does not advance RE turns or Active Duration.",
      "",
      "================ COMMANDS ================",
      "/RE help, /RE on, /RE off: Help or toggle automatic encounters.",
      "/RE status: Show the current encounter state without advancing turns.",
      "/RE start [#]: Queue a random/specific encounter; replaces an Active one.",
      "/RE end or /RE stop: Resolve the Active encounter.",
      "/RE reset # or /RE reset all: Restore availability/defaults; clear Outcomes.",
      "Commands do not consume story turns."
    ].join("\n");
  }

  function defaultConfigSettings() {
    return {
      enabled: DEFAULTS.enabled,
      maximumEncounterCards: DEFAULTS.maximumEncounterCards,
      createMaxEncounterCards: DEFAULTS.createMaxEncounterCards,
      populatePlaceholderCards: DEFAULTS.populatePlaceholderCards,
      restoreEncounterCardsToDefaults: DEFAULTS.restoreEncounterCardsToDefaults,
      setAllCardsToAvailable: DEFAULTS.setAllCardsToAvailable,
      useAdvancedSettings: DEFAULTS.useAdvancedSettings,
      debugLogging: DEFAULTS.debugLogging,
      displayActEncounterMap: DEFAULTS.displayActEncounterMap,
      encounterPacing: DEFAULTS.encounterPacing,
      firstEncounterTurn: DEFAULTS.firstEncounterTurn,
      noMatterWhatMode: DEFAULTS.noMatterWhatMode,
      generationDifficulty: DEFAULTS.generationDifficulty,
      generationTheme: DEFAULTS.generationTheme,
      currentAct: DEFAULTS.currentAct,
      defaultAct: DEFAULTS.act,
      defaultImportance: DEFAULTS.importance,
      defaultRarity: DEFAULTS.rarity,
      defaultDuration: DEFAULTS.duration
    };
  }

  function ensureConfigCard() {
    let card = findCardByKey(CONFIG_KEY);
    if (!card) {
      card = createCard({
        type: CONFIG_TYPE,
        title: CONFIG_TITLE,
        keys: CONFIG_KEY,
        entry: buildConfigEntry(defaultConfigSettings()),
        description: currentConfigDescription()
      });
      return card;
    }

    card.type = CONFIG_TYPE;
    card.title = CONFIG_TITLE;
    const configNotes=currentConfigDescription();
    if (String(card.description||"")!==configNotes) card.description=configNotes;

    return card;
  }

  function advancedDescription() {
    return [
      "Advanced Random Encounter Settings",
      "",
      "These values override the public built-in Pacing, Rarity, and Duration presets when Use Advanced Settings is true.",
      "",
      "PACING",
      "Minimum Interval and Maximum Interval define the story-turn range used when rolling the next encounter opportunity.",
      "",
      "RARITY",
      "Weight controls weighted selection. Higher values make that Rarity more likely relative to other eligible encounters.",
      "",
      "DURATION",
      "Turns are the Moderate-pacing baseline. Other pacing modes scale from that baseline; values always resolve to at least 1 turn.",
      "",
      "Invalid individual values fall back only for that field to its built-in value and produce an RE - warning.",
      "Disabling Advanced Settings preserves this card and its edits but ignores them.",
      "Debug-only test presets remain internal and are not exposed here."
    ].join("\n");
  }

  function buildAdvancedEntry() {
    return [
      "================ PACING ================",
      "Very Fast",
      "- Minimum Interval: 6",
      "- Maximum Interval: 10",
      "Fast",
      "- Minimum Interval: 6",
      "- Maximum Interval: 20",
      "Moderate",
      "- Minimum Interval: 10",
      "- Maximum Interval: 30",
      "Slow",
      "- Minimum Interval: 30",
      "- Maximum Interval: 50",
      "Very Slow",
      "- Minimum Interval: 30",
      "- Maximum Interval: 90",
      "",
      "================ RARITY ================",
      "Very Rare",
      "- Weight: 1",
      "Rare",
      "- Weight: 2",
      "Common",
      "- Weight: 4",
      "Very Common",
      "- Weight: 8",
      "",
      "================ DURATION ================",
      "Values below are based on Moderate pacing; actual duration is adjusted by Encounter Pacing.",
      "Very Short",
      "- Turns: 7",
      "Short",
      "- Turns: 11",
      "Default",
      "- Turns: 18",
      "Long",
      "- Turns: 25",
      "Very Long",
      "- Turns: 36"
    ].join("\n");
  }

  function ensureAdvancedCard() {
    let card = findCardByKey(ADVANCED_KEY);
    if (!card) {
      card = createCard({
        type: CONFIG_TYPE,
        title: ADVANCED_TITLE,
        keys: ADVANCED_KEY,
        entry: buildAdvancedEntry(),
        description: advancedDescription()
      });
      return card;
    }
    card.type = CONFIG_TYPE;
    card.title = ADVANCED_TITLE;
    const advancedNotes=advancedDescription();
    if (String(card.description||"")!==advancedNotes) card.description=advancedNotes;
    if (!getCardEntry(card).trim()) setCardEntry(card,buildAdvancedEntry());
    return card;
  }

  function notifyInvalidSetting(label) {
    const normalizedLabel=String(label||"setting").trim().toLowerCase();
    const sentenceLabel=normalizedLabel.charAt(0).toUpperCase()+normalizedLabel.slice(1);
    postUserMessage(sentenceLabel+" is invalid; using the default value.");
  }

  function parseAdvancedEntry(entry) {
    const lines = String(entry || "").split(/\r?\n/);
    const result = {
      pacing: {},
      rarity: {},
      duration: {}
    };
    let section = "";
    let preset = "";

    lines.forEach(function(line) {
      const t = line.trim();
      if (!t) return;
      if (/^=+\s*PACING\s*=+$/i.test(t)) { section = "pacing"; preset = ""; return; }
      if (/^=+\s*RARITY\s*=+$/i.test(t)) { section = "rarity"; preset = ""; return; }
      if (/^=+\s*DURATION\s*=+$/i.test(t)) { section = "duration"; preset = ""; return; }
      if (/^Values below/i.test(t)) return;
      if (!/^[-]/.test(t)) { preset = normalize(t); return; }
      const m = t.replace(/^[-]\s*/, "").match(/^([^:]+):\s*(.+)$/);
      if (!m || !section || !preset) return;
      const key = normalize(m[1]);
      const value = m[2].trim();
      if (!result[section][preset]) result[section][preset] = {};
      result[section][preset][key] = value;
    });

    return result;
  }

  function readAdvancedNumber(map, preset, field, fallback, label) {
    const raw = map[preset] && map[preset][field];
    if (raw === undefined) return fallback;
    if (!/^\d+$/.test(String(raw).trim())) {
      notifyInvalidSetting(label);
      return fallback;
    }
    const n = Number(raw);
    if (!Number.isSafeInteger(n) || n < 1) {
      notifyInvalidSetting(label);
      return fallback;
    }
    return n;
  }

  function buildRuntimePresets(useAdvanced) {
    if (!useAdvanced) {
      return { pacing: PACING_PRESETS, rarity: RARITY_PRESETS, duration: DURATION_PRESETS };
    }

    const pacing = JSON.parse(JSON.stringify(PACING_PRESETS));
    const rarity = JSON.parse(JSON.stringify(RARITY_PRESETS));
    const duration = JSON.parse(JSON.stringify(DURATION_PRESETS));
    const card = ensureAdvancedCard();
    if (!card) return { pacing: pacing, rarity: rarity, duration: duration };
    const advanced = parseAdvancedEntry(getCardEntry(card));

    ["very fast","fast","moderate","slow","very slow"].forEach(function(key) {
      const original = PACING_PRESETS[key];
      const label = original.name;
      pacing[key].minTurns = readAdvancedNumber(advanced.pacing, key, "minimum interval", original.minTurns, label + " Minimum Interval");
      pacing[key].maxTurns = readAdvancedNumber(advanced.pacing, key, "maximum interval", original.maxTurns, label + " Maximum Interval");
      if (pacing[key].maxTurns < pacing[key].minTurns) {
        notifyInvalidSetting(label + " Interval");
        pacing[key].minTurns = original.minTurns;
        pacing[key].maxTurns = original.maxTurns;
      }
    });

    ["very rare","rare","common","very common"].forEach(function(key) {
      const original = RARITY_PRESETS[key];
      rarity[key].weight = readAdvancedNumber(advanced.rarity, key, "weight", original.weight, original.name + " Weight");
    });

    ["very short","short","default","long","very long"].forEach(function(key) {
      const originalModerate = DURATION_PRESETS[key].turns.moderate;
      const customModerate = readAdvancedNumber(advanced.duration, key, "turns", originalModerate, DURATION_PRESETS[key].name + " Duration");
      Object.keys(DURATION_PRESETS[key].turns).forEach(function(pacingKey) {
        const builtIn = DURATION_PRESETS[key].turns[pacingKey];
        duration[key].turns[pacingKey] = Math.max(1, Math.round(customModerate * (builtIn / originalModerate)));
      });
    });

    return { pacing: pacing, rarity: rarity, duration: duration };
  }

  function parseImportance(value, fallback) {
    const v=normalize(value);
    if (v==="required") return "Required";
    if (v==="optional") return "Optional";
    return fallback;
  }

  function parseFirstEncounterTurn(value) {
    const raw=String(value===undefined || value===null ? "0" : value).trim();
    if (/^\d+$/.test(raw)) {
      const n=Number(raw);
      return Number.isSafeInteger(n) ? {min:n,max:n} : null;
    }
    const match=raw.match(/^(\d+)\s*-\s*(\d+)$/);
    if (!match) return null;
    const min=Number(match[1]),max=Number(match[2]);
    return Number.isSafeInteger(min) && Number.isSafeInteger(max) && min>0 && min<=max
      ? {min:min,max:max} : null;
  }

  function parseConfigEntry(entry) {
    const raw = parseColonLines(entry);
    const settings = defaultConfigSettings();

    settings.enabled = parseBoolean(raw.enabled, settings.enabled);
    settings.noMatterWhatMode = parseBoolean(raw["kool-aid man mode"], settings.noMatterWhatMode);
    const chosenDifficulty=raw["encounter difficulty"]||settings.generationDifficulty;
    const validDifficulty=GENERATION_DIFFICULTIES.find(function(x){return normalize(x)===normalize(chosenDifficulty);});
    if (!validDifficulty) notifyInvalidSetting("Encounter Difficulty");
    settings.generationDifficulty=validDifficulty||DEFAULTS.generationDifficulty;
    const rawTheme=raw["encounter theme"]===undefined?settings.generationTheme:raw["encounter theme"];
    const theme=parseGenerationTheme(rawTheme);
    if (theme===null) notifyInvalidSetting("Encounter Theme");
    settings.generationTheme=theme===null?DEFAULTS.generationTheme:theme;
    settings.maximumEncounterCards = parsePositiveInteger(raw["maximum encounter cards"], settings.maximumEncounterCards, 100);
    settings.createMaxEncounterCards = parseBoolean(raw["create max encounter cards"], settings.createMaxEncounterCards);
    settings.populatePlaceholderCards = parseBoolean(raw["populate placeholder cards"], settings.populatePlaceholderCards);
    settings.restoreEncounterCardsToDefaults = parseBoolean(raw["restore encounter cards to defaults"], settings.restoreEncounterCardsToDefaults);
    settings.setAllCardsToAvailable = parseBoolean(raw["set all cards to available"], settings.setAllCardsToAvailable);
    settings.useAdvancedSettings = parseBoolean(raw["use advanced settings"], settings.useAdvancedSettings);
    settings.debugLogging = parseBoolean(raw["debug logging"], settings.debugLogging);
    settings.displayActEncounterMap = parseBoolean(raw["display act & encounter map"], settings.displayActEncounterMap);
    settings.currentAct = parsePositiveInteger(raw["current act"], settings.currentAct, 999);
    settings.defaultAct = parsePositiveInteger(raw.act, settings.defaultAct, 999);
    settings.defaultImportance = parseImportance(raw.importance, settings.defaultImportance);
    const firstEncounterTurn=parseFirstEncounterTurn(raw["first encounter turn"]);
    if (!firstEncounterTurn) notifyInvalidSetting("First Encounter Turn");

    const suppliedPacing = raw["encounter pacing"] || settings.encounterPacing;
    settings.encounterPacing = isValidPacingPreset(suppliedPacing)
      ? PACING_PRESETS[normalize(suppliedPacing)].name
      : DEFAULTS.encounterPacing;
    if (!isValidPacingPreset(suppliedPacing)) notifyInvalidSetting("Encounter Pacing");

    const suppliedRarity = raw.rarity || settings.defaultRarity;
    settings.defaultRarity = isValidRarity(suppliedRarity)
      ? RARITY_PRESETS[normalize(suppliedRarity)].name
      : DEFAULTS.rarity;
    if (!isValidRarity(suppliedRarity)) notifyInvalidSetting("Rarity");

    const suppliedDuration = raw.duration || settings.defaultDuration;
    settings.defaultDuration = isValidDuration(suppliedDuration)
      ? DURATION_PRESETS[normalize(suppliedDuration)].name
      : DEFAULTS.duration;
    if (!isValidDuration(suppliedDuration)) notifyInvalidSetting("Duration");

    const runtime = buildRuntimePresets(settings.useAdvancedSettings);
    const pacingPreset = runtime.pacing[normalize(settings.encounterPacing)] || runtime.pacing.moderate;

    return {
      enabled: settings.enabled,
      maximumEncounterCards: settings.maximumEncounterCards,
      createMaxEncounterCards: settings.createMaxEncounterCards,
      populatePlaceholderCards: settings.populatePlaceholderCards,
      restoreEncounterCardsToDefaults: settings.restoreEncounterCardsToDefaults,
      setAllCardsToAvailable: settings.setAllCardsToAvailable,
      useAdvancedSettings: settings.useAdvancedSettings,
      debugLogging: settings.debugLogging,
      displayActEncounterMap: settings.displayActEncounterMap,
      encounterPacing: pacingPreset.name,
      firstEncounterTurn: firstEncounterTurn || {min:0,max:0},
      noMatterWhatMode: settings.noMatterWhatMode,
      generationDifficulty: settings.generationDifficulty,
      generationTheme: settings.generationTheme,
      currentAct: settings.currentAct,
      defaultAct: settings.defaultAct,
      defaultImportance: settings.defaultImportance,
      minTurns: pacingPreset.minTurns,
      maxTurns: pacingPreset.maxTurns,
      defaultRarity: settings.defaultRarity,
      defaultDuration: settings.defaultDuration,
      runtimePresets: runtime
    };
  }

  function loadConfig() {
    const card = ensureConfigCard();
    if (!card) return parseConfigEntry(buildConfigEntry(defaultConfigSettings()));
    let entry=getCardEntry(card);
    const migration=entry.replace(/No Matter What Mode(?=\s*:)/gi,"Kool-Aid Man Mode");
    if(migration!==entry){entry=migration;setCardEntry(card,entry);}
    const modeLine=entry.match(/^\s*-?\s*Kool-Aid Man Mode\s*:\s*(.*)$/im);
    if(modeLine && parseBoolean(modeLine[1],null)===null) {
      // Invalid choices (including "Default") must not remain visible as a mode.
      entry=entry.replace(/^\s*-?\s*Kool-Aid Man Mode\s*:\s*.*$/im,"- Kool-Aid Man Mode: false");
      setCardEntry(card,entry);
      notifyInvalidSetting("Kool-Aid Man Mode");
    }
    return parseConfigEntry(entry);
  }


  // ---------- Act map presentation ----------

  function displayEncounterTitle(number,title) {
    const base=stripEncounterStatusEmoji(title)||("Encounter Card");
    const prefix=formatEncounterNumber(number);
    const escaped=prefix.replace(/[.*+?^$\{\}()|[\]\\]/g,"\\$&");
    if (new RegExp("^"+escaped+"\\s*[-–—:]").test(base)) return base;
    return prefix+" - "+base;
  }

  // ---------- Act & Encounter Map ----------

  function actMapDescription() {
    return [
      "Act & Encounter Map",
      "- Status: Script Managed",
      "- Entry: Read Only",
      "- Controlled By: Display Act & Encounter Map",
      "",
      "This card is generated from encounter cards and Random Encounters runtime state.",
      "Encounter cards remain the source of truth. Manual edits to this map are replaced on the next refresh."
    ].join("\n");
  }

  function removeActMapCards() {
    if (typeof storyCards==="undefined" || !Array.isArray(storyCards)) return 0;
    let removed=0;
    for (let i=storyCards.length-1;i>=0;i--) {
      if (!cardHasKey(storyCards[i],ACT_MAP_KEY)) continue;
      try {
        if (typeof removeStoryCard==="function") removeStoryCard(i);
        else storyCards.splice(i,1);
        removed+=1;
      } catch (error) {
        console.log("[Random Encounters] removeStoryCard failed:",String(error));
      }
    }
    return removed;
  }

  function actMapLifecycle(record) {
    const s=state.randomEncounters||{};
    if (s.pendingEncounter && s.pendingEncounter.number===record.number) return "Queued";
    if (s.activeEncounter && s.activeEncounter.number===record.number) {
      return normalize(readEncounterStatus(record.card))==="awaiting completion"
        ? "Awaiting Completion"
        : "Active";
    }
    if (Array.isArray(s.pendingResolutions) && s.pendingResolutions.some(function(item){
      return item.number===record.number;
    })) return "Resolution Pending";

    const status=normalize(readEncounterStatus(record.card));
    if (status==="retired") return "Completed Successfully";
    if (status==="awaiting completion") return "Awaiting Completion";
    if (status==="active") return "Active";
    return "Available";
  }

  function actMapMarker(status) {
    if (status==="Active") return "📝";
    if (status==="Awaiting Completion") return "🔄";
    if (status==="Completed Successfully") return "🗃️";
    return "•";
  }

  function actMapSectionHeader(act,currentAct) {
    if (act===currentAct) return "========= ACT "+act+" — CURRENT =========";
    if (act>currentAct) return "========== ACT "+act+" — LOCKED ==========";
    return "============ ACT "+act+" ============";
  }

  function renderActMap(config) {
    const records=getAllEncounterCards();
    const groups={};
    records.forEach(function(record){
      const act=readEncounterAct(record.card);
      if (!groups[act]) groups[act]=[];
      groups[act].push(record);
    });

    const lines=[ACT_MAP_READ_ONLY];
    const acts=Object.keys(groups).map(Number).sort(function(a,b){return a-b;});

    if (!acts.length) {
      lines.push("No encounter cards found.");
      return lines.join("\n");
    }

    acts.forEach(function(act,index){
      if (index===0) lines.push(actMapSectionHeader(act,config.currentAct));
      else lines.push("",actMapSectionHeader(act,config.currentAct));
      groups[act].forEach(function(record){
        const status=actMapLifecycle(record);
        const title=displayEncounterTitle(record.number,record.card.title);
        lines.push(
          actMapMarker(status)+" "+title,
          readEncounterImportance(record.card)+" | "+status,
          ""
        );
      });
      if (lines[lines.length-1]==="") lines.pop();
    });

    return lines.join("\n");
  }

  function syncActMap(config) {
    if (!config || !config.displayActEncounterMap) {
      const removed=removeActMapCards();
      if (removed) log("Act & Encounter Map removed | cards="+removed);
      return null;
    }

    if (typeof storyCards==="undefined" || !Array.isArray(storyCards)) return null;

    const matches=[];
    storyCards.forEach(function(card,index){
      if (cardHasKey(card,ACT_MAP_KEY)) matches.push({card:card,index:index});
    });

    let card=matches.length ? matches[0].card : null;
    for (let i=matches.length-1;i>=1;i--) {
      try {
        if (typeof removeStoryCard==="function") removeStoryCard(matches[i].index);
        else storyCards.splice(matches[i].index,1);
      } catch (error) {
        console.log("[Random Encounters] duplicate Act Map removal failed:",String(error));
      }
    }

    const desiredEntry=renderActMap(config);
    const desiredDescription=actMapDescription();

    if (!card) {
      card=createCard({
        type:CONFIG_TYPE,
        title:ACT_MAP_TITLE,
        keys:ACT_MAP_KEY,
        entry:desiredEntry,
        description:desiredDescription
      });
      if (card) log("Act & Encounter Map created.");
      return card;
    }

    card.type=CONFIG_TYPE;
    card.title=ACT_MAP_TITLE;
    card.keys=ACT_MAP_KEY;
    if (getCardEntry(card)!==desiredEntry) {
      setCardEntry(card,desiredEntry);
      log("Act & Encounter Map refreshed.");
    }
    if (String(card.description||"")!==desiredDescription) card.description=desiredDescription;
    return card;
  }

  // ---------- Encounter cards ----------

  function encounterCode(number) {
    return ENCOUNTER_PREFIX + formatEncounterNumber(number);
  }

  function encounterDefaultTitle(number) {
    return formatEncounterNumber(number) + " - Encounter Card";
  }

  function stripEncounterStatusEmoji(title) {
    return String(title || "").replace(/^(?:📝|🔄|🗃️)\s*/, "").trim();
  }

  function updateEncounterTitleStatus(card, status) {
    if (!card) return;
    const base = stripEncounterStatusEmoji(card.title);
    const n = normalize(status);
    if (n === "active") card.title = "📝 " + base;
    else if (n === "awaiting completion") card.title = "🔄 " + base;
    else if (n === "retired") card.title = "🗃️ " + base;
    else card.title = base;
  }

  function readEncounterAct(card) {
    const match=String(card && card.description || "").match(/^\s*-?\s*Act\s*:\s*(\d+)\s*$/im);
    if (!match) return 1;
    const value=parseInt(match[1],10);
    return Number.isSafeInteger(value) && value>=1 ? value : 1;
  }

  function readEncounterImportance(card) {
    const match=String(card && card.description || "").match(/^\s*-?\s*Importance\s*:\s*(Required|Optional)\s*$/im);
    return match ? match[1] : "Required";
  }

  function readSystemMetadata(card) {
    const sections=splitEncounterNotes(card);
    const raw=parseColonLines(sections.systemLines.join("\n"));
    return {status:raw.status||"Available"};
  }

  function writeEncounterMetadata(card, data) {
    if (!card) return false;

    let duration = data.duration || readDuration(card) || DEFAULTS.duration;
    if (!isValidDuration(duration)) duration = DEFAULTS.duration;
    duration = DURATION_PRESETS[normalize(duration)].name;

    let rarity = data.rarity || readRarity(card) || DEFAULTS.rarity;
    if (!isValidRarity(rarity)) rarity = DEFAULTS.rarity;
    rarity = RARITY_PRESETS[normalize(rarity)].name;

    const act = Number.isSafeInteger(data.act) && data.act >= 1 ? data.act : readEncounterAct(card);
    const importanceRaw = data.importance || readEncounterImportance(card);
    const importance = normalize(importanceRaw)==="required" ? "Required" : "Optional";

    const mode=readNoMatterWhatMode(card);
    const forceASAP=readForceASAP(card);
    const extra = getUnknownUserSettings(card);
    const systemLines = [
      SYSTEM_HEADER,
      "- Status: " + (data.status || "Available"),
      "- Encounter Number: " + data.number
    ];

    const settingsLines = [
      SETTINGS_HEADER,
      "--------- PROGRESSION ---------",
      "- Act: " + act,
      "- Importance: " + importance,
      "---------- BEHAVIOR ----------",
      "- Rarity: " + rarity,
      "- Duration: " + duration,
      "- Kool-Aid Man Mode: " + (mode ? "true" : "false"),
       "- Force ASAP: " + (forceASAP ? "true" : "false")
    ];
    extra.forEach(function(setting) { settingsLines.push("- " + setting); });

    card.description = systemLines.concat([""], settingsLines).join("\n");
    syncEncounterCategory(card);
    updateEncounterTitleStatus(card, data.status || "Available");
    return true;
  }

  function defaultEncounterDescription(number, config) {
    const duration = config && config.defaultDuration ? config.defaultDuration : DEFAULTS.duration;
    const rarity = config && config.defaultRarity ? config.defaultRarity : DEFAULTS.rarity;
    const act = config && config.defaultAct ? config.defaultAct : DEFAULTS.act;
    const importance = config && config.defaultImportance ? config.defaultImportance : DEFAULTS.importance;

    return [
      SYSTEM_HEADER,
      "- Status: Available",
      "- Encounter Number: " + number,
      "",
      SETTINGS_HEADER,
      "--------- PROGRESSION ---------",
      "- Act: " + act,
      "- Importance: " + importance,
      "---------- BEHAVIOR ----------",
      "- Rarity: " + rarity,
      "- Duration: " + duration,
      "- Kool-Aid Man Mode: false",
       "- Force ASAP: false"
    ].join("\n");
  }

  function encounterPlaceholderText(number) {
    return "[Define random encounter " + formatEncounterNumber(number) + " here.]";
  }

  function isDefaultPlaceholderCard(card,number) {
    if (!card) return false;
    return String(getCardEntry(card)||"").trim()===encounterPlaceholderText(number);
  }

  function createEncounterCard(number, config) {
    const code = encounterCode(number);
    const existing = findCardByKey(code);
    if (existing) return existing;
    return createCard({
      type: encounterTypeForAct(config.defaultAct),
      title: encounterDefaultTitle(number),
      keys: code,
      entry: encounterPlaceholderText(number),
      description: defaultEncounterDescription(number, config)
    });
  }

  function getEncounterCard(number) {
    return findCardByKey(encounterCode(number));
  }

  function repairDuplicateEncounterKeys() {
    if (typeof storyCards==="undefined" || !Array.isArray(storyCards)) return 0;
    const occupied=new Set(),seen=new Set();
    const numberFromKey=function(key) {
      const match=normalize(key).match(/^rand_(\d+)$/);
      const n=match?Number(match[1]):0;
      return Number.isSafeInteger(n)&&n>=1?n:0;
    };
    storyCards.forEach(function(card){
      cardKeys(card).forEach(function(key){
        const n=numberFromKey(key);
        if(n) occupied.add(n);
      });
    });
    let updates=0;
    storyCards.forEach(function(card){
      const oldKey=cardKeys(card).find(function(k){return numberFromKey(k)>0;});
      if (!oldKey) return;
      const number=numberFromKey(oldKey);
      if(!seen.has(number)){seen.add(number);return;}
      let next=number+1;
      while(occupied.has(next)) next++;
      if(!Number.isSafeInteger(next))return;
      occupied.add(next);seen.add(next);
      // A renamed default placeholder must stay a recognizable placeholder.
      if(isDefaultPlaceholderCard(card,number))setCardEntry(card,encounterPlaceholderText(next));
      const nextKey=encounterCode(next);
      let updated=false;
      const updateKey=function(value){
        if (!updated && normalize(value)===oldKey) {
          updated=true;
          return String(value).replace(/\S+/,nextKey);
        }
        return value;
      };
      card.keys=Array.isArray(card.keys)?card.keys.map(updateKey):
        String(card.keys||"").split(",").map(updateKey).join(",");
      const before=String(card.description||"");
      if(/^\s*-?\s*Encounter Number\s*:/im.test(before)) {
        card.description=before.replace(/^(\s*-?\s*Encounter Number\s*:\s*)\d+/im,"$1"+next);
      }
      if(card.title===encounterDefaultTitle(number))card.title=encounterDefaultTitle(next);
      updates++;
      postUserMessage("Duplicate "+encounterCode(number)+" reassigned to "+nextKey+".");
      log("Duplicate RAND key corrected | "+encounterCode(number)+" -> "+nextKey);
    });
    return updates;
  }

  function getAllEncounterCards() {
    const byNumber = {};
    if (typeof storyCards === "undefined" || !Array.isArray(storyCards)) return [];

    storyCards.forEach(function(card) {
      const keys = cardKeys(card);
      for (let i = 0; i < keys.length; i++) {
        const match = keys[i].match(/^rand_(\d+)$/i);
        if (!match) continue;
        const number = parseInt(match[1], 10);
        if (!Number.isSafeInteger(number) || number < 1) continue;
        if (!byNumber[number]) {
          byNumber[number] = { number: number, code: encounterCode(number), card: card };
        }
        break;
      }
    });

    return Object.keys(byNumber)
      .map(function(key) { return byNumber[key]; })
      .sort(function(a, b) { return a.number - b.number; });
  }

  function resetCreateMaxEncounterCardsToggle(config) {
    const card=ensureConfigCard();
    if (!card) return false;
    let entry=getCardEntry(card);
    if (/^\s*-?\s*Create Max Encounter Cards\s*:/im.test(entry)) {
      entry=entry.replace(/^[ \t]*-?[ \t]*Create Max Encounter Cards[ \t]*:[ \t]*.*$/im,"- Create Max Encounter Cards: false");
    } else {
      return false;
    }
    setCardEntry(card,entry);
    config.createMaxEncounterCards=false;
    if (state.randomEncounters && state.randomEncounters.config) {
      state.randomEncounters.config.createMaxEncounterCards=false;
    }
    return true;
  }

  function resetPopulatePlaceholderCardsToggle(config) {
    const card=ensureConfigCard();
    if (!card) return false;
    let entry=getCardEntry(card);
    if (!/^\s*-?\s*Populate Placeholder Cards\s*:/im.test(entry)) return false;
    entry=entry.replace(
      /^\s*-?\s*Populate Placeholder Cards\s*:\s*.*$/im,
      "- Populate Placeholder Cards: false"
    );
    setCardEntry(card,entry);
    if (config) config.populatePlaceholderCards=false;
    if (state.randomEncounters && state.randomEncounters.config) {
      state.randomEncounters.config.populatePlaceholderCards=false;
    }
    return true;
  }

  // Automatically fill missing Notes when creators add a Story Card with a RAND_## key.
  function initializeEncounterMetadata(card,number,config) {
    if (!card) return false;
    const raw=String(card.description||"");
    const before=raw.replace(/No Matter What Mode(?=\s*:)/gi,"Kool-Aid Man Mode");
    if(raw!==before)card.description=before;
    if (!before.trim()) {
      card.description=defaultEncounterDescription(number,config);
      return true;
    }
    let lines=before.split(/\r?\n/);
    const value=function(label) {
      const match=before.match(new RegExp("^\\s*-?\\s*"+label+"\\s*:\\s*(.*)$","im"));
      return match ? match[1].trim() : "";
    };
    const suppliedAct=Number(value("Act"));
    const act=Number.isSafeInteger(suppliedAct)&&suppliedAct>=1?suppliedAct:config.defaultAct;
    const providedImportance=value("Importance");
    const importance=/^(Required|Optional)$/i.test(providedImportance)
      ? (/^Required$/i.test(providedImportance)?"Required":"Optional") : config.defaultImportance;
    const suppliedRarity=value("Rarity");
    const rarity=isValidRarity(suppliedRarity)?RARITY_PRESETS[normalize(suppliedRarity)].name:config.defaultRarity;
    const suppliedDuration=value("Duration");
    const duration=isValidDuration(suppliedDuration)?DURATION_PRESETS[normalize(suppliedDuration)].name:config.defaultDuration;
    const suppliedStatus=value("Status");
    const status=/^(Available|Active|Retired|Awaiting Completion)$/i.test(suppliedStatus)?suppliedStatus:"Available";
    const mode=parseBoolean(value("Kool-Aid Man Mode"),false) ? "true" : "false";
    const head=function(name){return lines.findIndex(function(line){return normalize(line).indexOf(name)!==-1;});};
    let stateAt=head("encounter state"),settingsAt=head("encounter settings");
    if (stateAt<0&&settingsAt<0) {
      lines=[SYSTEM_HEADER,"- Status: "+status,"- Encounter Number: "+number,"",
        SETTINGS_HEADER,"--------- PROGRESSION ---------",
        "- Act: "+act,"- Importance: "+importance,
        "---------- BEHAVIOR ----------","- Rarity: "+rarity,"- Duration: "+duration,
        "- Kool-Aid Man Mode: "+mode,""].concat(lines);
    } else {
      if (stateAt<0) {
        lines=[SYSTEM_HEADER,"- Status: "+status,"- Encounter Number: "+number,""].concat(lines);
      } else {
        const end=settingsAt>stateAt?settingsAt:lines.length;
        const region=lines.slice(stateAt+1,end).join("\n");
        const missing=[];
        if (!/^\s*-?\s*Status\s*:/im.test(region)) missing.push("- Status: "+status);
        if (!/^\s*-?\s*Encounter Number\s*:/im.test(region)) missing.push("- Encounter Number: "+number);
        if (missing.length) lines.splice(stateAt+1,0,...missing);
      }
      settingsAt=head("encounter settings");
      if (settingsAt<0) {
        if (lines.length && lines[lines.length-1].trim()) lines.push("");
        lines.push(SETTINGS_HEADER,"--------- PROGRESSION ---------",
          "- Act: "+act,"- Importance: "+importance,
          "---------- BEHAVIOR ----------","- Rarity: "+rarity,"- Duration: "+duration,
          "- Kool-Aid Man Mode: "+mode);
      } else {
        const region=lines.slice(settingsAt+1).join("\n"),progress=[],behavior=[];
        if (!/^\s*-?\s*Act\s*:/im.test(region)) progress.push("- Act: "+act);
        if (!/^\s*-?\s*Importance\s*:/im.test(region)) progress.push("- Importance: "+importance);
        if (!/^\s*-?\s*Rarity\s*:/im.test(region)) behavior.push("- Rarity: "+rarity);
        if (!/^\s*-?\s*Duration\s*:/im.test(region)) behavior.push("- Duration: "+duration);
        if (!/^\s*-?\s*Kool-Aid Man Mode\s*:/im.test(region)) behavior.push("- Kool-Aid Man Mode: "+mode);
        const progressAt=lines.findIndex(function(line,i){return i>settingsAt&&normalize(line).indexOf("progression")!==-1;});
        if (progress.length) lines.splice(progressAt>=0?progressAt+1:settingsAt+1,0,...progress);
        const behaviorAt=lines.findIndex(function(line,i){return i>settingsAt&&normalize(line).indexOf("behavior")!==-1;});
        if (behavior.length) lines.splice(behaviorAt>=0?behaviorAt+1:lines.length,0,...behavior);
      }
    }
    // Enforce a single explicit boolean: Default and malformed values are not valid modes.
    let modeFound=false;
    lines=lines.filter(function(line){
      if (!/^\s*-?\s*Kool-Aid Man Mode\s*:/i.test(line)) return true;
      if (modeFound) return false;
      modeFound=true;
      return true;
    }).map(function(line){
      if (!/^\s*-?\s*Kool-Aid Man Mode\s*:/i.test(line)) return line;
      const supplied=line.slice(line.indexOf(":")+1).trim();
      return "- Kool-Aid Man Mode: "+(parseBoolean(supplied,false)?"true":"false");
    });
    const forceLines=lines.filter(function(line){return /^\s*-?\s*Force ASAP\s*:/i.test(line);});
    const priority=forceLines.length?parseBoolean(forceLines[0].split(":").slice(1).join(":").trim(),false):false;
    lines=lines.filter(function(line){return !/^\s*-?\s*Force ASAP\s*:/i.test(line);});
    const at=lines.findIndex(function(line){return /^\s*-?\s*Kool-Aid Man Mode\s*:/i.test(line);});
    if(at>=0)lines.splice(at+1,0,"- Force ASAP: "+(priority?"true":"false"));
    else lines.push("- Force ASAP: "+(priority?"true":"false"));
    const after=lines.join("\n");
    if (after===before) return false;
    card.description=after;
    return true;
  }

  function initializeDiscoveredEncounterCards(config) {
    let count=0;
    getAllEncounterCards().forEach(function(record){
      if(initializeEncounterMetadata(record.card,record.number,config)) count++;
    });
    if(count) log("Encounter Notes initialized | cards="+count+".");
    return count;
  }

  function syncEncounterCategory(card) {
    if (!card) return false;
    const category=encounterTypeForAct(readEncounterAct(card));
    if (card.type===category) return false;
    card.type=category;
    return true;
  }

  function syncEncounterCategories() {
    let count=0;
    getAllEncounterCards().forEach(function(record){
      if (syncEncounterCategory(record.card)) count++;
    });
    if (count) log("Act categories synchronized | "+count+" card(s).");
  }

  function getDefaultPlaceholderRecords() {
    return getAllEncounterCards().filter(function(record){
      return isDefaultPlaceholderCard(record.card,record.number);
    });
  }

  function preparePlaceholderPopulation(config) {
    const s=state.randomEncounters;
    if (!config.populatePlaceholderCards) {
      if (s.placeholderPopulation && s.placeholderPopulation.phase!=="generating") {
        s.placeholderPopulation=null;
      }
      return false;
    }

    if (s.placeholderPopulation) return true;

    const records=getDefaultPlaceholderRecords();
    if (!records.length) {
      resetPopulatePlaceholderCardsToggle(config);
      postUserMessage("No untouched placeholder encounter cards found.");
      log("Populate Placeholder Cards fired | no untouched placeholders found | toggle reset to false.");
      return false;
    }

    s.placeholderPopulation={
      numbers:records.map(function(record){return record.number;}),
      phase:"queued",
      requestedActionCount:null,
      attempts:0,
      totalCount:records.length,
      completedCount:0,
      difficulty:config.generationDifficulty,
      theme:config.generationTheme
    };
    postUserMessage("Encounter population in progress - 0 of "+records.length+".");
    log("Populate Placeholder Cards queued | cards="+s.placeholderPopulation.numbers.map(formatEncounterNumber).join(",")+".");
    return true;
  }

  function resetRestoreEncounterCardsToggle(config) {
    const card=ensureConfigCard();
    if (!card) return false;
    let entry=getCardEntry(card);
    if (!/^\s*-?\s*Restore Encounter Cards to Defaults\s*:/im.test(entry)) return false;
    entry=entry.replace(
      /^\s*-?\s*Restore Encounter Cards to Defaults\s*:\s*.*$/im,
      "- Restore Encounter Cards to Defaults: false"
    );
    setCardEntry(card,entry);
    config.restoreEncounterCardsToDefaults=false;
    if (state.randomEncounters && state.randomEncounters.config) {
      state.randomEncounters.config.restoreEncounterCardsToDefaults=false;
    }
    return true;
  }

  function restoreEncounterCardsToDefaults(config) {
    if (!config.restoreEncounterCardsToDefaults) return false;

    const records=getAllEncounterCards();
    records.forEach(function(record){
      const metadata=readSystemMetadata(record.card);
      writeEncounterMetadata(record.card,{
        status:metadata.status,
        number:record.number,
        act:config.defaultAct,
        importance:config.defaultImportance,
        rarity:config.defaultRarity,
        duration:config.defaultDuration
      });
    });

    resetRestoreEncounterCardsToggle(config);
    postUserMessage("Encounter cards restored to global defaults.");
    log(
      "Restore Encounter Cards to Defaults fired | updated=" + records.length +
      " | Act=" + config.defaultAct +
      " | Importance=" + config.defaultImportance +
      " | Rarity=" + config.defaultRarity +
      " | Duration=" + config.defaultDuration +
      " | toggle reset to false. Active runtime durations remain locked."
    );
    return true;
  }

  function resetSetAllCardsToAvailableToggle(config) {
    const card=ensureConfigCard();
    if (!card) return false;
    let entry=getCardEntry(card);
    if (!/^\s*-?\s*Set All Cards to Available\s*:/im.test(entry)) return false;
    entry=entry.replace(
      /^\s*-?\s*Set All Cards to Available\s*:\s*.*$/im,
      "- Set All Cards to Available: false"
    );
    setCardEntry(card,entry);
    config.setAllCardsToAvailable=false;
    if (state.randomEncounters && state.randomEncounters.config) {
      state.randomEncounters.config.setAllCardsToAvailable=false;
    }
    return true;
  }

  function setAllCardsToAvailable(config) {
    if (!config.setAllCardsToAvailable) return false;

    const records=getAllEncounterCards();
    records.forEach(function(record){
      writeEncounterMetadata(record.card,{
        status:"Available",
        number:record.number,
        act:readEncounterAct(record.card),
        importance:readEncounterImportance(record.card),
        rarity:readRarity(record.card),
        duration:readDuration(record.card)
      });
    });

    clearAllEncounterRuntime();
    resetSetAllCardsToAvailableToggle(config);
    postUserMessage("All encounter cards set to available.");
    log(
      "Set All Cards to Available fired | updated=" + records.length +
      " | runtime encounter state cleared | toggle reset to false."
    );
    return true;
  }

  function ensureEncounterCards(config) {
    const records=getAllEncounterCards();
    const existingNumbers={};

    records.forEach(function(record) {
      existingNumbers[record.number]=true;
    });

    if (!config.createMaxEncounterCards) return;

    let created=0;
    for (let number=1;number<=config.maximumEncounterCards;number++) {
      if (existingNumbers[number]) continue;
      const card=createEncounterCard(number,config);
      if (!card) continue;
      existingNumbers[number]=true;
      created+=1;
    }

    resetCreateMaxEncounterCardsToggle(config);
    log("Create Max Encounter Cards fired | maximum=" + config.maximumEncounterCards + " | created=" + created + " | toggle reset to false.");
  }

  function readEncounterStatus(card) {
    return readSystemMetadata(card).status;
  }

  // ---------- Runtime state and turn detection ----------

  function initializeState() {
    if (!state.randomEncounters) {
      state.randomEncounters={
        turn:0,
        nextEncounterIn:null,
        firstAutomaticEncounterDone:false,
        firstEncounterTarget:null,
        pendingEncounter:null,
        activeEncounter:null,
        pendingResolutions:[],
        pendingInputTurn:false,
        historyLength:null,
        actionCountHigh:null,
        lastInjectedEncounter:null,
        pendingPacingChange:null,
        messageSnapshot:"",
        externalTaskOwner:null,
        compatibilityPauseRequest:null,
        placeholderPopulation:null,
        currentTurnMarkers:{activation:[],awaiting:[],returned:[],retirement:[]}
      };
    }

    const s=state.randomEncounters;
    if (typeof s.turn!=="number") s.turn=0;
    if (s.nextEncounterIn===undefined) s.nextEncounterIn=null;
    if (typeof s.firstAutomaticEncounterDone!=="boolean") s.firstAutomaticEncounterDone=false;
    if (!Number.isSafeInteger(s.firstEncounterTarget) || s.firstEncounterTarget<1) s.firstEncounterTarget=null;
    if (s.activeEncounter===undefined) s.activeEncounter=null;
    if (!Array.isArray(s.pendingResolutions)) s.pendingResolutions=[];
    if (typeof s.messageSnapshot!=="string") s.messageSnapshot="";
    if (s.externalTaskOwner!==null && typeof s.externalTaskOwner!=="string") s.externalTaskOwner=null;
    if (s.compatibilityPauseRequest!==null && typeof s.compatibilityPauseRequest!=="string") s.compatibilityPauseRequest=null;
    if (s.placeholderPopulation!==null && (typeof s.placeholderPopulation!=="object" || !Array.isArray(s.placeholderPopulation.numbers))) {
      s.placeholderPopulation=null;
    }
    if (s.placeholderPopulation) {
      s.placeholderPopulation.numbers=s.placeholderPopulation.numbers
        .map(function(number){return parseInt(number,10);})
        .filter(function(number,index,array){
          return Number.isSafeInteger(number) && number>=1 && array.indexOf(number)===index;
        });
      if (s.placeholderPopulation.phase!=="queued" && s.placeholderPopulation.phase!=="generating") {
        s.placeholderPopulation.phase="queued";
      }
      if (!Number.isSafeInteger(s.placeholderPopulation.requestedActionCount)) {
        s.placeholderPopulation.requestedActionCount=null;
      }
      if (!Number.isSafeInteger(s.placeholderPopulation.attempts) || s.placeholderPopulation.attempts<0) {
        s.placeholderPopulation.attempts=0;
      }
      if (!s.placeholderPopulation.numbers.length) s.placeholderPopulation=null;
    }
    if (!s.currentTurnMarkers) {
      s.currentTurnMarkers={activation:[],awaiting:[],returned:[],retirement:[]};
    } else {
      ["activation","awaiting","returned","retirement"].forEach(function(key){
        if (!Array.isArray(s.currentTurnMarkers[key])) s.currentTurnMarkers[key]=[];
      });
    }
  }

  function detectExternalModelTaskOwner() {
    const s=state && state.randomEncounters;
    if (s && typeof s.compatibilityPauseRequest==="string" && s.compatibilityPauseRequest.trim()) {
      const owner=s.compatibilityPauseRequest.trim();
      s.compatibilityPauseRequest=null;
      return owner;
    }

    const innerSelf=state && state.InnerSelf;
    if (
      innerSelf && typeof innerSelf==="object" &&
      innerSelf.AC && typeof innerSelf.AC==="object" &&
      innerSelf.AC.event===true
    ) return "Auto-Cards";

    const autoCards=state && state.AutoCards;
    if (autoCards && typeof autoCards==="object") {
      const generation=autoCards.generation;
      const compression=autoCards.compression;
      const workpiece=generation && generation.workpiece;
      if (workpiece && typeof workpiece==="object" && Object.keys(workpiece).length>0) return "Auto-Cards";
      if (compression && String(compression.titleKey||"").trim()) return "Auto-Cards";
    }

    if (
      state &&
      state.storyArc!==undefined &&
      state.turnNum_SAE!==undefined &&
      (state.saveOutput===true || state.unlockFeedAIPrompt===true)
    ) return "Story Arc Engine";

    return null;
  }

  function synchronizeTurnHighWater() {
    const s=state.randomEncounters;
    const historyLength=currentHistoryLength();
    const actionCount=currentActionCount();
    s.pendingInputTurn=false;
    if (s.historyLength===null || s.historyLength===undefined || historyLength>s.historyLength) s.historyLength=historyLength;
    if (s.actionCountHigh===null || s.actionCountHigh===undefined || actionCount>s.actionCountHigh) s.actionCountHigh=actionCount;
  }

  function suspendForExternalModelTask(owner) {
    const s=state.randomEncounters;
    s.externalTaskOwner=owner;
    synchronizeTurnHighWater();
    log("Compatibility pause | "+owner+" owns this model turn. RE pacing, Duration, injection, and resolution are suspended.");
  }

  function markInputTurn() {
    initializeState();
    state.randomEncounters.pendingInputTurn = true;
  }

  function currentHistoryLength() {
    if (typeof history === "undefined" || !Array.isArray(history)) return 0;
    return history.length;
  }

  function currentActionCount() {
    if (typeof info === "undefined" || typeof info.actionCount !== "number") return 0;
    return Math.abs(info.actionCount);
  }

  function detectTurnAdvance() {
    const s = state.randomEncounters;
    const historyLength = currentHistoryLength();
    const actionCount = currentActionCount();
    log("Turn detector | pendingInput="+!!s.pendingInputTurn+
      " | historyLength="+historyLength+" (high="+s.historyLength+")"+
      " | actionCount="+actionCount+" (high="+s.actionCountHigh+")"+
      " | latestHistoryType="+(historyLength && history[historyLength-1] ? String(history[historyLength-1].type||"unknown") : "none"));

    if (s.pendingInputTurn) {
      s.pendingInputTurn = false;
      s.historyLength = Math.max(s.historyLength || 0, historyLength);
      if (s.actionCountHigh === null || s.actionCountHigh === undefined || actionCount > s.actionCountHigh) s.actionCountHigh = actionCount;
      return true;
    }

    if (s.historyLength === null || s.historyLength === undefined) {
      s.historyLength = historyLength;
      s.actionCountHigh = actionCount;
      return false;
    }

    if (historyLength > s.historyLength) {
      s.historyLength = historyLength;
      if (s.actionCountHigh === null || s.actionCountHigh === undefined || actionCount > s.actionCountHigh) s.actionCountHigh = actionCount;
      return true;
    }

    if (s.actionCountHigh !== null && s.actionCountHigh !== undefined && actionCount > s.actionCountHigh) {
      // Native Retry may increment actionCount without adding history.
      // Count-only growth is ambiguous when native history is available.
      s.actionCountHigh = actionCount;
      if (typeof history === "undefined" || !Array.isArray(history)) return true;
      log("Turn detector | actionCount-only growth suppressed (possible Retry).");
      return false;
    }

    return false;
  }

  // ---------- Selection and lifecycle ----------

  function randomEncounterInterval(config) {
    return randomInteger(config.minTurns, config.maxTurns);
  }

  function invalidEncounterEntry(card,number) {
    const text=getEncounterPrompt(card).trim().replace(/\s+/g," ");
    if (!text) return true;
    return normalize(text)===normalize(encounterPlaceholderText(number));
  }

  function warnInvalidEncounter(number) {
    postUserMessage(encounterCode(number)+" is invalid: no encounter description. Add encounter information to its Story Card, or use Populate Placeholder Cards in Config for an untouched default placeholder.");
  }

  function cancelInvalidEncounter(number,notify) {
    const s=state.randomEncounters;
    if(notify)warnInvalidEncounter(number);
    if(s.pendingEncounter && s.pendingEncounter.number===number)s.pendingEncounter=null;
    if(s.lastInjectedEncounter && s.lastInjectedEncounter.number===number)s.lastInjectedEncounter=null;
    const hadActive=!!(s.activeEncounter && s.activeEncounter.number===number);
    const hadResolution=s.pendingResolutions.some(function(item){return item.number===number;});
    if(hadActive)s.activeEncounter=null;
    if(hadActive||hadResolution){
      const card=getEncounterCard(number);
      if(card)writeEncounterMetadata(card,{status:"Available",number:number});
    }
    s.pendingResolutions=s.pendingResolutions.filter(function(item){return item.number!==number;});
    s.nextEncounterIn=null;
  }

  function getAvailableEncounters(config) {
    const s = state.randomEncounters;
    let blockedByAct = 0;

    let blockedByPopulation = 0;
    let blockedByInvalid = 0;
    const available = getAllEncounterCards().filter(function(record) {
      if (normalize(readEncounterStatus(record.card)) !== "available") return false;
      if(invalidEncounterEntry(record.card,record.number)){blockedByInvalid++;return false;}
      if (s.placeholderPopulation && isDefaultPlaceholderCard(record.card,record.number)) {
        blockedByPopulation += 1;
        return false;
      }
      const act=readEncounterAct(record.card);
      if (act>config.currentAct) {
        blockedByAct += 1;
        return false;
      }
      record.act=act;
      return true;
    });

    if (blockedByAct > 0) {
      log("Turn " + s.turn + " | Act gate: " + blockedByAct + " encounter(s) above Current Act " + config.currentAct + ".");
    }
    if (blockedByInvalid>0)log("Turn "+s.turn+" | Invalid encounter cards excluded: "+blockedByInvalid+".");
    if (blockedByPopulation > 0) {
      log("Turn " + s.turn + " | Placeholder population gate: " + blockedByPopulation + " untouched placeholder encounter(s) temporarily excluded.");
    }
    return available;
  }

  function buildWeightedPool(available, config) {
    const presets = config && config.runtimePresets ? config.runtimePresets.rarity : RARITY_PRESETS;
    return available.map(function(record) {
      const rarity = readRarity(record.card);
      const preset = presets[normalize(rarity)] || presets.common;
      return {
        number: record.number,
        code: record.code,
        rarity: preset.name,
        weight: preset.weight,
        act: record.act !== undefined ? record.act : readEncounterAct(record.card)
      };
    });
  }

  function selectRandomEncounter(config) {
    const available = getAvailableEncounters(config);
    if (!available.length) return null;
    const prioritized=available.filter(function(rec){return readForceASAP(rec.card);})
      .sort(function(a,b){return (a.act-b.act)||(a.number-b.number);});
    if(prioritized.length){
      const selection=buildWeightedPool([prioritized[0]],config)[0];
      log("Force ASAP picked "+selection.code+" at eligible roll.");
      return selection;
    }
    const pool = buildWeightedPool(available, config);
    const totalWeight = pool.reduce(function(sum, record) { return sum + record.weight; }, 0);

    log("Turn " + state.randomEncounters.turn + " | Weighted selection pool: " + pool.length + " encounter(s) | Total weight=" + totalWeight);

    let roll = Math.random() * totalWeight;
    for (let i = 0; i < pool.length; i++) {
      roll -= pool[i].weight;
      if (roll < 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  function queueResolution(encounter) {
    const s = state.randomEncounters;
    if (s.pendingResolutions.some(function(record) { return record.code === encounter.code; })) return;
    const card = getEncounterCard(encounter.number);
    if(!card||invalidEncounterEntry(card,encounter.number)){cancelInvalidEncounter(encounter.number,true);return;}
    s.pendingResolutions.push({
      number: encounter.number,
      code: encounter.code,
      duration: encounter.duration,
      rarity: encounter.rarity,
      eventText: card ? getEncounterPrompt(card) : "",
      attempts: 0,
      lastAttemptTurn: null,
      inProgressChecks: encounter.inProgressChecks || 0,
      allowContinuation: encounter.allowContinuation !== false
    });
    log("Turn " + s.turn + " | Resolution queued for " + encounter.code);
  }

  function firstPendingResolution() {
    const s = state.randomEncounters;
    return s.pendingResolutions.length ? s.pendingResolutions[0] : null;
  }

  function retireDueEncounter() {
    const s=state.randomEncounters;
    const encounter=s.activeEncounter;
    if (!encounter || s.turn<encounter.resolveAfterTurn) return false;

    const card=getEncounterCard(encounter.number);
    if(!card||invalidEncounterEntry(card,encounter.number)){cancelInvalidEncounter(encounter.number,true);return false;}
    if (card) {
      writeEncounterMetadata(card,{
        status:"Retired",
        number:encounter.number,
        duration:encounter.duration,
        rarity:encounter.rarity
      });
    }

    s.currentTurnMarkers.retirement.push(encounter.number);
    encounter.allowContinuation=true;
    queueResolution(encounter);
    s.activeEncounter=null;
    s.nextEncounterIn=null;
    log("Turn " + s.turn + " | Retired " + encounter.code);
    log("Turn " + s.turn + " | Encounter attempt ended. Next pacing interval will be rolled.");
    return true;
  }

  function detectConfigChanges(oldConfig, newConfig) {
    const s = state.randomEncounters;
    if (!oldConfig) return;
    const before=oldConfig.firstEncounterTurn || {min:0,max:0};
    const after=newConfig.firstEncounterTurn || {min:0,max:0};
    if (!s.firstAutomaticEncounterDone && (before.min!==after.min || before.max!==after.max)) {
      s.firstEncounterTarget=null;
      s.nextEncounterIn=null;
      log("First Encounter Turn changed; pending first automatic schedule reset.");
    }
    if (normalize(oldConfig.encounterPacing) !== normalize(newConfig.encounterPacing)) {
      s.pendingPacingChange = { from: oldConfig.encounterPacing, to: newConfig.encounterPacing };
    }
  }

  function processNewTurn(config) {
    const s = state.randomEncounters;
    if (!config.enabled) { log("System disabled."); return; }

    s.turn += 1;
    s.currentTurnMarkers = { activation: [], awaiting: [], returned: [], retirement: [] };
    s.lastInjectedEncounter = null;

    retireDueEncounter();

    if (s.pendingPacingChange) {
      const change=s.pendingPacingChange;
      s.pendingPacingChange=null;
      s.nextEncounterIn=null;
      log("Turn " + s.turn + " | Encounter pacing changed: " + change.from + " -> " + change.to);
      if (!s.firstAutomaticEncounterDone && config.firstEncounterTurn.min>0) {
        log("Turn " + s.turn + " | Initial pacing deferred to First Encounter Turn.");
      } else if (s.activeEncounter || s.pendingEncounter || s.pendingResolutions.length) {
        log("Turn " + s.turn + " | New pacing will apply to the next encounter countdown roll.");
      } else {
        const interval=randomEncounterInterval(config);
        s.nextEncounterIn=interval;
        log("Turn " + s.turn + " | Encounter countdown rerolled: " + interval + " future turn(s).");
        return;
      }
    }

    if (s.activeEncounter) {
      s.nextEncounterIn=null;
      const remainingTurns=Math.max(0,s.activeEncounter.resolveAfterTurn-s.turn);
      log("Turn " + s.turn + " | " + s.activeEncounter.code + " active | Resolves in " + remainingTurns + " remaining turn(s).");
      return;
    }

    if (s.pendingEncounter) return;

    if (s.pendingResolutions.length > 0) {
      s.nextEncounterIn=null;
      log("Turn " + s.turn + " | Waiting for encounter resolution before rolling the next countdown.");
      return;
    }

    if (!s.firstAutomaticEncounterDone && config.firstEncounterTurn.min>0) {
      if (s.firstEncounterTarget===null) {
        s.firstEncounterTarget=randomInteger(config.firstEncounterTurn.min,config.firstEncounterTurn.max);
        log("Turn " + s.turn + " | First automatic encounter target: RE turn " + s.firstEncounterTarget);
      }
      s.nextEncounterIn=Math.max(0,s.firstEncounterTarget-s.turn);
      if (s.nextEncounterIn>0) {
        log("Turn " + s.turn + " | First automatic encounter in " + s.nextEncounterIn + " future turn(s).");
        return;
      }
      const selected=selectRandomEncounter(config);
      if (!selected) {
        log("Turn " + s.turn + " | First turn reached, awaiting an eligible encounter.");
        return;
      }
      queueSelectedEncounter(selected,true);
      log("Turn " + s.turn + " | First automatic encounter " + selected.code + " selected.");
      return;
    }

    if (s.nextEncounterIn === null || s.nextEncounterIn === undefined) {
      s.nextEncounterIn = randomEncounterInterval(config);
      log("Turn " + s.turn + " | First encounter countdown rolled: " + s.nextEncounterIn + " future turn(s).");
      return;
    }

    s.nextEncounterIn -= 1;
    if (s.nextEncounterIn > 0) {
      log("Turn " + s.turn + " | Next encounter in " + s.nextEncounterIn + " future turn(s).");
      return;
    }

    const selected = selectRandomEncounter(config);
    if (!selected) {
      s.nextEncounterIn = null;
      log("Turn " + s.turn + " | No available encounters remain.");
      return;
    }

    queueSelectedEncounter(selected,true);
    log("Turn " + s.turn + " | Selected " + selected.code + " | Rarity=" + selected.rarity + " | Weight=" + selected.weight + " | Act=" + selected.act + " | Current Act=" + config.currentAct);
  }

  // ---------- Context injection and resolution ----------

  function readForceASAP(card) {
    const m=String(card&&card.description||"").match(/^\s*-?\s*Force ASAP\s*:\s*(.+?)\s*$/im);
    return m?parseBoolean(m[1],false):false;
  }
  function clearForceASAP(card) {
    if(!card||!readForceASAP(card))return false;
    card.description=String(card.description||"").replace(/^\s*-?\s*Force ASAP\s*:\s*.*$/im,"- Force ASAP: false");
    return true;
  }
  function readNoMatterWhatMode(card) {
    const match=String(card&&card.description||"").match(/^\s*-?\s*Kool-Aid Man Mode\s*:\s*(.+?)\s*$/im);
    return match ? parseBoolean(match[1],false) : false;
  }

  function noMatterWhatFor(card,config) {
    // Both global and per-card settings are independent binary switches.
    // An enabled global switch cannot be negated by a disabled card switch.
    return !!(config&&config.noMatterWhatMode) || readNoMatterWhatMode(card);
  }

  function buildEncounterPrompt(eventText,force) {
    return "\n\n[RANDOM ENCOUNTER]\n" +
      (force
        ? "Introduce the core encounter immediately, IN THIS RESPONSE. Make it happen NOW, directly interrupting the current situation if necessary. Do not wait for a natural opening, foreshadow its arrival, or soften the encounter to make it fit the story. " +
          "The encounter may be unexpected, absurd, disruptive, or completely at odds with the current setting, genre, tone, or circumstances. Embrace the mismatch rather than explaining it away. " +
          "Let the characters react naturally to whatever suddenly happens, even if the event itself makes absolutely no sense. " +
          "Preserve the encounter's core premise and previously established story facts, but do not require an explanation for why the event is happening. The encounter must begin now; how it develops or resolves remains open. "
        : "A random encounter is becoming relevant to the current story. Begin introducing or setting up the following event when the current scene allows. Do not abruptly interrupt ongoing dialogue or actions solely to force the event into this response. If there is not yet a natural opening, establish only what fits and allow the encounter to develop over subsequent turns. " +
          "Adapt minor details as needed to fit the current setting and characters, but preserve the core event. ") +
      "If another instruction requires a private control prefix or output format before story prose, preserve that control syntax and apply this encounter within the story continuation that follows. " +
      "Do not mention random encounters, Story Cards, scripts, triggers, dice, or game mechanics.\n\n" +
      eventText + "\n[END RANDOM ENCOUNTER]";
  }

  function buildActiveEncounterPrompt(eventText) {
    return "\n\n[ACTIVE RANDOM ENCOUNTER]\n" +
      "The following encounter is currently active:\n\n" + eventText + "\n\n" +
      "Continue developing this encounter naturally when the current scene allows. " +
      "If the encounter has already been introduced in the story, treat it as ongoing and preserve established details. " +
      "If it has not yet been introduced, introduce or set it up when a natural opening appears. " +
      "Do not abruptly interrupt ongoing dialogue or actions solely to force the encounter forward. " +
      "Adapt minor details as needed to fit established story continuity, but preserve the core encounter. " +
      "If another instruction requires a private control prefix or output format before story prose, preserve that control syntax and continue this encounter in the story prose that follows. " +
      "Do not mention random encounters, Story Cards, scripts, triggers, dice, or game mechanics.\n" +
      "[END ACTIVE RANDOM ENCOUNTER]";
  }

  function injectActiveEncounterReminder(contextText) {
    const s=state.randomEncounters;
    const active=s.activeEncounter;
    if (!active) return contextText;
    if (s.lastInjectedEncounter && s.lastInjectedEncounter.number===active.number && s.lastInjectedEncounter.turn===s.turn) return contextText;

    const card=getEncounterCard(active.number);
    if(!card||invalidEncounterEntry(card,active.number)){cancelInvalidEncounter(active.number,true);return contextText;}
    const eventText=getEncounterPrompt(card).trim();
    if (!eventText) return contextText;
    return contextText+buildActiveEncounterPrompt(eventText);
  }

  function injectPendingEncounter(contextText, config) {
    const s = state.randomEncounters;
    const pending = s.pendingEncounter;
    if (!config.enabled || !pending) return contextText;

    const card = getEncounterCard(pending.number);
    if (!card) { s.pendingEncounter = null; return contextText; }
    if(invalidEncounterEntry(card,pending.number)){cancelInvalidEncounter(pending.number,true);return contextText;}
    if (s.placeholderPopulation && isDefaultPlaceholderCard(card,pending.number)) {
      log("Turn " + s.turn + " | " + pending.code + " injection deferred until placeholder population completes.");
      return contextText;
    }

    const eventText = getEncounterPrompt(card).trim();
    if (!eventText) { s.pendingEncounter = null; return contextText; }

    let duration = readDuration(card);
    if (!isValidDuration(duration)) duration = "Default";
    const durationTurns = calculateDurationTurns(duration, config.encounterPacing, config);

    let rarity = readRarity(card);
    if (!isValidRarity(rarity)) rarity = "Common";

    const forced=noMatterWhatFor(card,config);
    contextText += buildEncounterPrompt(eventText,forced);

    s.activeEncounter={
      number:pending.number,
      code:pending.code,
      duration:duration,
      rarity:rarity,
      resolveAfterTurn:s.turn+durationTurns,
      inProgressChecks:0,
      allowContinuation:true
    };

    writeEncounterMetadata(card, {
      status: "Active",
      number: pending.number,
      duration: duration,
      rarity: rarity
    });

    s.currentTurnMarkers.activation.push(pending.number);
    s.lastInjectedEncounter = { number: pending.number, code: pending.code, turn: s.turn, forced: forced };
    if (pending.firstAutomatic) s.firstAutomaticEncounterDone=true;
    s.pendingEncounter = null;
    s.nextEncounterIn = null;

    log("Injected " + pending.code + " | Rarity=" + rarity + " | Act=" + readEncounterAct(card) + " | Duration=" + duration + " | Pacing=" + config.encounterPacing + " | Resolves in " + durationTurns + " remaining turn(s).");

    return contextText;
  }

  function injectRetryEncounter(contextText) {
    const s = state.randomEncounters;
    const previous = s.lastInjectedEncounter;
    if (!previous || previous.turn !== s.turn) return contextText;
    const card = getEncounterCard(previous.number);
    if(!card||invalidEncounterEntry(card,previous.number)){cancelInvalidEncounter(previous.number,true);return contextText;}
    const eventText = getEncounterPrompt(card).trim();
    if (!eventText) return contextText;
    log("Re-injected " + previous.code + " for retry of Turn " + s.turn + ".");
    return contextText + buildEncounterPrompt(eventText,!!previous.forced);
  }

  function buildResolutionPrompt(record) {
    const eventText = record.eventText || "(Encounter prompt unavailable.)";
    return "\n\n[RANDOM ENCOUNTER RESOLUTION]\n" +
      "A random encounter attempt has reached its resolution check.\n\n" +
      "Original encounter:\n" + eventText + "\n\n" +
      "Classify what actually happened in the story. Before normal story prose, output exactly one classification sentence in one of these forms:\n" +
      "The encounter occurred: <one short factual past-tense summary of what actually happened>.\n" +
      "The encounter is in progress: <one short factual summary of what has happened so far and what remains unresolved>.\n" +
      "The encounter did not occur: <one short factual explanation that the event never actually entered the story>.\n\n" +
      "Use occurred only if the core encounter completed. Use is in progress if the encounter meaningfully began but one or more core parts remain unresolved. " +
      "Use did not occur only if the encounter never meaningfully entered the narrative. Hints, reminders, or script instructions alone do not count. " +
      "Do not invent the encounter merely to classify it. The classification sentence must be one line, 25-350 characters, and end with punctuation. " +
      "If another instruction requires a private parenthetical control prefix before story prose, preserve that prefix first and put the classification sentence immediately after it; the classification is still the first story content.\n\n" +
      "After the classification sentence, insert one blank line and continue the story normally without discussing the classification. " +
      "The classification will be stored internally and removed before the player sees the response.\n" +
      "[END RANDOM ENCOUNTER RESOLUTION]";
  }

  function injectResolutionRequest(contextText, isNewTurn) {
    const s = state.randomEncounters;
    const record = firstPendingResolution();
    if (!record) return contextText;
    const resolvedCard=getEncounterCard(record.number);
    if(!resolvedCard||invalidEncounterEntry(resolvedCard,record.number)){cancelInvalidEncounter(record.number,true);return contextText;}
    if (isNewTurn && record.lastAttemptTurn !== s.turn) {
      record.attempts += 1;
      record.lastAttemptTurn = s.turn;
      log("Turn " + s.turn + " | Resolution sentence attempt " + record.attempts + " for " + record.code);
    }
    return contextText + buildResolutionPrompt(record);
  }

  function stripInvisibleFormat(value) {
    return String(value || "").replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g,"");
  }

  function cleanResolution(value) {
    return stripInvisibleFormat(value).replace(/\s+/g, " ").trim();
  }

  function canonicalResolution(classification, summary) {
    const prefixes={
      occurred:"The encounter occurred:",
      in_progress:"The encounter is in progress:",
      did_not_occur:"The encounter did not occur:"
    };
    const fallbacks={
      occurred:"The encounter was classified as completed.",
      in_progress:"The encounter was classified as still in progress.",
      did_not_occur:"The encounter was classified as not occurring."
    };
    let cleaned=cleanResolution(summary);
    if (!cleaned) cleaned=fallbacks[classification];
    const maxSummary=Math.max(1,350-prefixes[classification].length-1);
    if (cleaned.length>maxSummary) {
      cleaned=cleaned.slice(0,maxSummary).replace(/\s+\S*$/,"").trim();
    }
    if (!/[.!?]$/.test(cleaned)) cleaned+=".";
    return prefixes[classification]+" "+cleaned;
  }

  function replaceRetirementMarker(number,target) {
    const markers=state.randomEncounters.currentTurnMarkers;
    markers.retirement=(markers.retirement||[]).filter(function(n){return n!==number;});
    if (!Array.isArray(markers[target])) markers[target]=[];
    if (!markers[target].includes(number)) markers[target].push(number);
  }

  function setCurrentAct(value) {
    const card=ensureConfigCard();
    if (!card) return false;
    let entry=getCardEntry(card);
    if (/^\s*-?\s*Current Act\s*:/im.test(entry)) {
      entry=entry.replace(/^\s*-?\s*Current Act\s*:\s*.*$/im,"- Current Act: "+value);
    } else {
      entry=entry.replace(/(^\s*-?\s*Encounter Pacing\s*:\s*.*$)/im,"$1\n- Current Act: "+value);
    }
    setCardEntry(card,entry);
    if (state.randomEncounters.config) state.randomEncounters.config.currentAct=value;
    return true;
  }

  function maybeAdvanceAct(config) {
    const current=config.currentAct;
    const required=getAllEncounterCards().filter(function(record){
      return readEncounterAct(record.card)===current && normalize(readEncounterImportance(record.card))==="required";
    });
    if (!required.length) return false;
    const complete=required.every(function(record){
      return normalize(readEncounterStatus(record.card))==="retired";
    });
    if (!complete) return false;
    const next=current+1;
    setCurrentAct(next);
    postUserMessage("Act "+current+" is complete. Act "+next+" encounters are now available.");
    log("Act progression | Act "+current+" complete -> Current Act "+next);
    return true;
  }

  function continuationTurns(card, config) {
    const normal=calculateDurationTurns(readDuration(card),config.encounterPacing,config);
    return Math.max(1,Math.round(normal*0.5));
  }

  function removePendingResolution(code) {
    const s=state.randomEncounters;
    s.pendingResolutions=s.pendingResolutions.filter(function(item){return item.code!==code;});
  }

  function returnEncounterToAvailable(card,record,duration,rarity) {
    writeEncounterMetadata(card,{
      status:"Available",
      number:record.number,
      duration:duration,
      rarity:rarity,
      act:readEncounterAct(card),
      importance:readEncounterImportance(card)
    });
    replaceRetirementMarker(record.number,"returned");
    removePendingResolution(record.code);
  }

  function saveResolution(record,cleaned,classification) {
    const s=state.randomEncounters;
    const card=getEncounterCard(record.number);
    if (!card) return false;

    if (classification==="in_progress" && record.allowContinuation!==false) {
      const checks=(record.inProgressChecks||0)+1;
      if (checks>=5) {
        const failure="The encounter did not occur: The encounter remained incomplete after five consecutive Awaiting Completion checks.";
        if (!appendEncounterOutcome(card,failure)) return false;
        returnEncounterToAvailable(card,record,readDuration(card),readRarity(card));
        log("Awaiting Completion limit reached for "+record.code+" | Returned to Available Pool.");
        return "did_not_occur";
      }

      if (!appendEncounterOutcome(card,cleaned)) return false;
      const config=s.config||loadConfig();
      const turns=continuationTurns(card,config);
      const duration=readDuration(card);
      const rarity=readRarity(card);

      writeEncounterMetadata(card,{
        status:"Awaiting Completion",number:record.number,
        duration:duration,rarity:rarity,
        act:readEncounterAct(card),importance:readEncounterImportance(card)
      });
      updateEncounterTitleStatus(card,"Awaiting Completion");
      s.activeEncounter={
        number:record.number,
        code:record.code,
        duration:duration,
        rarity:rarity,
        resolveAfterTurn:s.turn+turns,
        inProgressChecks:checks,
        allowContinuation:true
      };
      replaceRetirementMarker(record.number,"awaiting");
      removePendingResolution(record.code);
      s.nextEncounterIn=null;
      log("Resolution captured for "+record.code+": "+cleaned);
      clearForceASAP(card);
      log(record.code+" Awaiting Completion | check="+checks+"/5 | requeued for "+turns+" turn(s).");
      return "in_progress";
    }

    if (classification==="in_progress" && record.allowContinuation===false) {
      const forced="The encounter did not occur: The encounter was manually ended before its core event completed.";
      if (!appendEncounterOutcome(card,forced)) return false;
      returnEncounterToAvailable(card,record,readDuration(card),readRarity(card));
      log("In-progress classification for manually ended "+record.code+" | Returned to Available Pool.");
      return "did_not_occur";
    }

    if (!appendEncounterOutcome(card,cleaned)) return false;

    if (classification==="occurred") {
      writeEncounterMetadata(card,{
        status:"Retired",number:record.number,
        duration:record.duration,rarity:record.rarity,
        act:readEncounterAct(card),importance:readEncounterImportance(card)
      });
      removePendingResolution(record.code);
      clearForceASAP(card);
      maybeAdvanceAct(s.config||loadConfig());
    } else {
      returnEncounterToAvailable(card,record,record.duration,record.rarity);
    }
    log("Resolution captured for "+record.code+": "+cleaned);
    log("Outcome appended to Entry for "+record.code);
    return classification;
  }

  function captureResolutionSentence(outputText) {
    initializeState();
    const record=firstPendingResolution();
    const original=String(outputText||"");
    if (!record) return {text:original,classification:null};
    const card=getEncounterCard(record.number);
    if(!card||invalidEncounterEntry(card,record.number)){
      cancelInvalidEncounter(record.number,true);
      return {text:original,classification:null};
    }

    const control=original.match(/^(\s*\([^()\r\n]{1,1000}\)\s*)/);
    const prefix=control ? control[1] : "";
    const body=control ? original.slice(control[0].length) : original;

    // A pending resolution gives these three static keys special meaning.
    // Match the key anywhere in output so other scripts may prepend their own
    // control material without preventing RE from recognizing the result.
    const classifierPattern=/The encounter (occurred|is in progress|did not occur):/ig;
    const match=classifierPattern.exec(body);
    if (!match) {
      log("Resolution sentence not captured for "+record.code+" | No classifier key found in output | Request remains queued.");
      return {text:original,classification:null};
    }

    const key=normalize(match[1]);
    const classification=key==="occurred" ? "occurred" :
      key==="is in progress" ? "in_progress" : "did_not_occur";

    const summaryStart=match.index+match[0].length;
    const tail=body.slice(summaryStart);
    const newlineOffset=tail.search(/\r?\n/);
    const summaryEnd=newlineOffset===-1 ? body.length : summaryStart+newlineOffset;
    const summary=body.slice(summaryStart,summaryEnd);
    const canonical=canonicalResolution(classification,summary);

    const saved=saveResolution(record,canonical,classification);
    if (!saved) {
      log("Resolution sentence could not be saved for "+record.code+" | Request remains queued.");
      return {text:original,classification:null};
    }

    let leading=body.slice(0,match.index);
    if (/^[\s\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]*$/.test(leading)) {
      leading=leading.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g,"");
    }
    let cleaned=leading+body.slice(summaryEnd);
    cleaned=cleaned
      .replace(/[ \t]+\r?\n/g,"\n")
      .replace(/\r?\n[ \t]+/g,"\n")
      .replace(/\n{3,}/g,"\n\n")
      .replace(/[ \t]{2,}/g," ")
      .trim();

    if (prefix) cleaned=prefix+cleaned;
    log("Resolution classifier removed from output for "+record.code+" | keyOffset="+match.index);
    return {text:cleaned,classification:saved};
  }

  function cleanupLeadingNonOccurrenceEcho(outputText) {
    return String(outputText||"").replace(/^\s*(?:The encounter has not yet occurred|The encounter has not occurred|The encounter never occurred|The encounter did not occur|The encounter has yet to occur|The encounter hasn't occurred|The encounter hasn't happened yet|The encounter has not happened yet)\.\s*/i,"");
  }

  function applyOutputMarkers(outputText) {
    const s = state.randomEncounters;
    const markers = s.currentTurnMarkers;
    const lines = [];
    if (markers && Array.isArray(markers.activation) && markers.activation.length) {
      lines.push("📝 (" + markers.activation.map(formatEncounterNumber).join(", ") + ")");
    }
    if (markers && Array.isArray(markers.awaiting) && markers.awaiting.length) {
      lines.push("🔄 (" + markers.awaiting.map(formatEncounterNumber).join(", ") + ")");
    }
    if (markers && Array.isArray(markers.returned) && markers.returned.length) {
      lines.push("💾 (" + markers.returned.map(formatEncounterNumber).join(", ") + ")");
    }
    if (markers && Array.isArray(markers.retirement) && markers.retirement.length) {
      lines.push("🗃️ (" + markers.retirement.map(formatEncounterNumber).join(", ") + ")");
    }
    if (!lines.length) return outputText;
    const source=String(outputText||"");
    const control=source.match(/^(\s*\([^()\r\n]{1,1000}\)\s*)/);
    if (!control) return lines.join("\n") + "\n\n" + source;
    return control[1] + lines.join("\n") + "\n\n" + source.slice(control[0].length);
  }

  function stripPopulationProgressFromContext(contextText) {
    return String(contextText||"")
      .replace(/(^|\n)\s*\[RE\]\s*(?:Generating New Encounters|Updating Encounter Cards)(?:\s*\(\d+ of \d+\))? - Hit Continue(?: - \d+ of \d+)?\s*(?=\n|$)/gi,"$1")
      .replace(/\n{3,}/g,"\n\n");
  }

  function buildDedicatedPlaceholderPopulationContext(contextText,numbers,request) {
    const requested=(numbers||[]).map(formatEncounterNumber);
    const blocks=requested.map(function(number){
      return "RAND_"+number+"\nTitle: <short title>\nScenario: <exactly one sentence>\nEND RAND_"+number;
    }).join("\n\n");

    return stripPopulationProgressFromContext(contextText).trimEnd() +
      "\n\n[RE DEDICATED ENCOUNTER GENERATION]\n" +
      "This is a data-generation task, not a story-continuation task. Do not continue, narrate, or roleplay the current scene.\n" +
      generationInstruction(request) + "\n" +
      "Generate one encounter for each requested RAND card. Each Scenario must be exactly one complete sentence. Keep titles short.\n" +
      "Return only the requested RAND blocks in the exact format shown below. Do not add commentary, markdown fences, explanations, or story prose.\n" +
      "Requested cards: " + requested.map(function(number){return "RAND_"+number;}).join(", ") + "\n\n" +
      blocks + "\n" +
      "[END RE DEDICATED ENCOUNTER GENERATION]";
  }

  function beginDedicatedPlaceholderPopulation(contextText) {
    const s=state.randomEncounters;
    const request=s.placeholderPopulation;
    if (!request || !Array.isArray(request.numbers) || !request.numbers.length) return contextText;
    request.phase="generating";
    request.requestedActionCount=currentActionCount();
    request.attempts=(Number.isSafeInteger(request.attempts) && request.attempts>=0 ? request.attempts : 0)+1;
    postUserMessage("Encounter population in progress - Attempt "+request.attempts+" - "+request.completedCount+" of "+request.totalCount+".");
    log("Placeholder population generation started | attempt="+request.attempts+" | cards="+request.numbers.map(formatEncounterNumber).join(",")+" | RE turn suspended.");
    return buildDedicatedPlaceholderPopulationContext(contextText,request.numbers,request);
  }

  function cleanGeneratedEncounterTitle(value,number) {
    let title=String(value||"").replace(/\s+/g," ").trim();
    if (!title) return "";
    const prefix=formatEncounterNumber(number).replace(/[.*+?^$\{\}()|[\]\\]/g,"\\$&");
    title=title.replace(new RegExp("^"+prefix+"\\s*[-–—:]\\s*","i"),"");
    title=title.replace(/^[\"']+|[\"']+$/g,"").trim();
    return title.slice(0,120);
  }

  function enforceSingleSentence(value) {
    const source=String(value||"")
      .replace(/\r/g," ").replace(/\n+/g," ").replace(/\s+/g," ").trim();
    // Invalid or overlong output stays queued; do not invent terminal punctuation
    // or save a scenario truncated in the middle of its final sentence.
    if (!source || source.length>1600) return "";

    const protectedDots=[];
    const protectedSource=source.replace(/\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|Mt|vs|etc|No)\./gi,function(match){
      protectedDots.push(match);
      return "__RE_ABBR_"+(protectedDots.length-1)+"__";
    });
    // An embedded quoted question can be followed by lowercase narration.
    // Uppercase next sentences are not masked by this narrow allowance.
    const quotedDots=[];
    const quoteSafe=protectedSource.replace(/(["“])([^"”]*?[.!?])(["”])(?=\s+[a-z])/g,function(match,open,inner,close){
      quotedDots.push(inner.slice(-1));
      return open+inner.slice(0,-1)+"__RE_QUOTE_"+(quotedDots.length-1)+"__"+close;
    });
    const sentenceMatch=quoteSafe.match(/^.*?[.!?](?:["'”’)]*)?(?=\s|$)/);
    // Refuse additional sentences, including ones beginning with lowercase text.
    if (!sentenceMatch || protectedSource.slice(sentenceMatch[0].length).trim()) return "";
    const sentence=sentenceMatch[0].replace(/__RE_ABBR_(\d+)__/g,function(_,index){
      return protectedDots[parseInt(index,10)]||"";
    }).replace(/__RE_QUOTE_(\d+)__/g,function(_,index){
      return quotedDots[parseInt(index,10)]||"";
    }).trim();
    // Basic fragment checks; grammatical completeness cannot be proved by regex.
    if (/\b(?:a|an|the|and|or|but|because|while|with|without|for|from|to|of|by|at|in|on|into|over|under|through|toward|that|which|who|whose|if|unless|carrying|holding|wearing|seeking|offering|bringing|finding|requesting|including|using)\s*[.!?](?:["'”’)]*)?$/i.test(sentence)) return "";
    return sentence;
  }

  function parseDedicatedPlaceholderPopulation(outputText) {
    const source=String(outputText||"").replace(/\r/g,"");
    const records=[];
    const blockPattern=/(?:^|\n)\s*(?:[-*#>]+\s*)?RAND[_\s-]?(\d+)\s*:?\s*\n([\s\S]*?)(?=\n\s*(?:[-*#>]+\s*)?(?:END\s+RAND[_\s-]?\d+\s*(?:\n|$)|RAND[_\s-]?\d+\s*:?\s*\n)|$)/gi;
    let match;

    while ((match=blockPattern.exec(source))!==null) {
      const number=parseInt(match[1],10);
      if (!Number.isSafeInteger(number) || number<1) continue;
      const body=match[2];
      const titleMatch=body.match(/^\s*(?:[-*#>]+\s*)?(?:\*\*)?Title\s*:\s*(?:\*\*)?\s*(.+)$/im);
      const scenarioMatch=body.match(/^\s*(?:[-*#>]+\s*)?(?:\*\*)?Scenario\s*:\s*(?:\*\*)?\s*([\s\S]*)$/im);
      const scenario=enforceSingleSentence(scenarioMatch ? scenarioMatch[1].replace(/\n\s*END\s+RAND[_\s-]?\d+[\s\S]*$/i,"") : "");
      const title=cleanGeneratedEncounterTitle(titleMatch ? titleMatch[1] : "",number);
      if (!title || !scenario) continue;
      records.push({number:number,title:title,scenario:scenario});
    }

    return records;
  }

  function processDedicatedPlaceholderPopulationOutput(outputText) {
    const s=state.randomEncounters;
    const request=s.placeholderPopulation;
    if (!request || request.phase!=="generating") return null;

    const requested={};
    request.numbers.forEach(function(number){requested[number]=true;});

    log("Placeholder population raw output | "+String(outputText||"").slice(0,2000));

    let populated=0;
    const seen={};
    parseDedicatedPlaceholderPopulation(outputText).forEach(function(record){
      if (!requested[record.number] || seen[record.number]) return;
      seen[record.number]=true;

      const card=getEncounterCard(record.number);
      if (!card || !isDefaultPlaceholderCard(card,record.number)) return;

      setCardEntry(card,record.scenario);
      if (
        record.title &&
        stripEncounterStatusEmoji(card.title)===encounterDefaultTitle(record.number)
      ) {
        const marker=(String(card.title||"").match(/^(?:📝|🔄|🗃️)/)||[])[0];
        card.title=(marker ? marker+" " : "")+formatEncounterNumber(record.number)+" - "+record.title;
      }
      populated+=1;
    });

    const expected=request.numbers.length;
    request.completedCount+=populated;
    const remaining=request.numbers.filter(function(number){
      const card=getEncounterCard(number);
      return card && isDefaultPlaceholderCard(card,number);
    });

    if (remaining.length) {
      // A failed generation is not a player-visible status turn: preserve
      // ordinary story prose while retaining the request for the next action.
      // When the model returned partial or malformed RAND control text, hide
      // that internal material behind the usual generation status instead.
      request.numbers=remaining;
      request.phase="queued";
      request.requestedActionCount=null;
      log(
        "Placeholder population attempt incomplete | requested="+expected+
        " | populated="+populated+" | remaining="+remaining.map(formatEncounterNumber).join(",")+
        " | retry queued | RE turn remained suspended."
      );
      const looksLikePopulationData=/(?:^|\n)\s*(?:[-*#>]+\s*)?(?:RAND[_\s-]?\d+|END\s+RAND[_\s-]?\d+|Title\s*:|Scenario\s*:)/i.test(String(outputText||""));
      return populated>0 || looksLikePopulationData ? populationProgressText(request.completedCount,request.totalCount) : outputText;
    }

    resetPopulatePlaceholderCardsToggle(s.config||null);
    s.placeholderPopulation=null;
    postUserMessage("New encounters generated - "+request.completedCount+" of "+request.totalCount+".");
    log(
      "Placeholder population generation completed | requested="+expected+
      " | populated="+populated+" | toggle reset to false | RE turn remained suspended."
    );
    return populationProgressText(request.completedCount,request.totalCount);
  }


  function processOutput(outputText) {
    const captured=captureResolutionSentence(outputText);
    let result=captured.text;
    if (captured.classification==="did_not_occur") result=cleanupLeadingNonOccurrenceEcho(result);
    result=applyOutputMarkers(result);
    return result;
  }

  // ---------- Commands and resets ----------

  function setConfigEnabled(enabled) {
    const card=ensureConfigCard();
    if (!card) return false;
    let entry=getCardEntry(card);
    if (/^\s*-?\s*Enabled\s*:/im.test(entry)) entry=entry.replace(/^\s*-?\s*Enabled\s*:\s*.*$/im,"- Enabled: "+(enabled?"true":"false"));
    else entry="- Enabled: "+(enabled?"true":"false")+"\n"+entry;
    setCardEntry(card,entry);
    return true;
  }

  function resetEncounterCard(card,number,config) {
    if (!card) return false;
    writeEncounterMetadata(card,{
      status:"Available",
      number:number,
      duration:config.defaultDuration,
      rarity:config.defaultRarity,
      act:config.defaultAct,
      importance:config.defaultImportance
    });
    setCardEntry(card,removeOutcomeSection(getCardEntry(card)));
    return true;
  }

  function clearEncounterRuntime(number) {
    const s=state.randomEncounters;
    if (s.activeEncounter && s.activeEncounter.number===number) s.activeEncounter=null;
    s.pendingResolutions=s.pendingResolutions.filter(function(x){return x.number!==number;});
    if (s.pendingEncounter && s.pendingEncounter.number===number) s.pendingEncounter=null;
    if (s.lastInjectedEncounter && s.lastInjectedEncounter.number===number) s.lastInjectedEncounter=null;
    ["activation","awaiting","returned","retirement"].forEach(function(key){
      s.currentTurnMarkers[key]=(s.currentTurnMarkers[key]||[]).filter(function(n){return n!==number;});
    });
  }

  function resetEncounter(number,config) {
    const card=getEncounterCard(number);
    if (!resetEncounterCard(card,number,config)) return false;
    clearEncounterRuntime(number);
    return true;
  }

  function clearAllEncounterRuntime() {
    const s=state.randomEncounters;
    s.activeEncounter=null;
    s.pendingResolutions=[];
    s.pendingEncounter=null;
    s.lastInjectedEncounter=null;
    s.nextEncounterIn=null;
    s.currentTurnMarkers={activation:[],awaiting:[],returned:[],retirement:[]};
  }

  function queueSelectedEncounter(selected,isAutomatic) {
    const s=state.randomEncounters;
    s.pendingEncounter={number:selected.number,code:selected.code,firstAutomatic:!!isAutomatic && !s.firstAutomaticEncounterDone};
    s.nextEncounterIn=null;
  }

  function selectSpecificEncounter(number,config) {
    const s=state.randomEncounters;
    const card=getEncounterCard(number);
    if (!card) return {error:encounterCode(number)+" does not exist."};
    if (normalize(readEncounterStatus(card))!=="available") {
      return {error:encounterCode(number)+" is not available."};
    }
    if (invalidEncounterEntry(card,number)) {
      return {error:encounterCode(number)+" is invalid: no encounter description. Add encounter information to its Story Card, or use Populate Placeholder Cards in Config for an untouched default placeholder."};
    }
    if (s.placeholderPopulation && isDefaultPlaceholderCard(card,number)) {
      return {error:encounterCode(number)+" is waiting for placeholder population."};
    }

    const act=readEncounterAct(card);
    if (act>config.currentAct) {
      return {error:encounterCode(number)+" is not yet eligible. Encounter act: "+act+"; current act: "+config.currentAct+"."};
    }

    const rarity=readRarity(card);
    const rarityPresets=config.runtimePresets ? config.runtimePresets.rarity : RARITY_PRESETS;
    const preset=rarityPresets[normalize(rarity)]||rarityPresets.common;
    return {
      selected:{
        number:number,
        code:encounterCode(number),
        rarity:preset.name,
        weight:preset.weight,
        act:act
      }
    };
  }

  function endActiveForCommand() {
    const s=state.randomEncounters;
    const encounter=s.activeEncounter;
    if (!encounter) return false;

    const currentCard=getEncounterCard(encounter.number);
    if(!currentCard||invalidEncounterEntry(currentCard,encounter.number)){
      cancelInvalidEncounter(encounter.number,true);
      return false;
    }
    s.activeEncounter=null;
    encounter.allowContinuation=false;
    const card=getEncounterCard(encounter.number);
    if (card) {
      writeEncounterMetadata(card,{
        status:"Retired",
        number:encounter.number,
        duration:encounter.duration,
        rarity:encounter.rarity,
        act:readEncounterAct(card),
        importance:readEncounterImportance(card)
      });
    }
    s.currentTurnMarkers.retirement.push(encounter.number);
    queueResolution(encounter);
    s.nextEncounterIn=null;
    return true;
  }

  // A read-only view of already-tracked encounter state. Do not call maintenance,
  // choose an encounter, or update pacing from a status command.
  function currentEncounterStatusMessage() {
    const runtime=state.randomEncounters || {};
    const configCard=findCardByKey(CONFIG_KEY);
    const configuredEnabled=configCard
      ? parseBoolean(parseColonLines(getCardEntry(configCard)).enabled, DEFAULTS.enabled)
      : (runtime.config ? runtime.config.enabled !== false : DEFAULTS.enabled);

    if (!configuredEnabled) return "Random encounters are disabled.";

    const population=runtime.placeholderPopulation;
    if (population && Array.isArray(population.numbers) && population.numbers.length) {
      const remaining=population.numbers.length;
      const attempts=Number.isSafeInteger(population.attempts) ? population.attempts : 0;
      return "Generating encounter cards. "+remaining+" remaining ("+
        (attempts>0 ? "Attempt "+attempts : "awaiting first attempt")+").";
    }

    const resolving=Array.isArray(runtime.pendingResolutions) && runtime.pendingResolutions.length
      ? runtime.pendingResolutions[0] : null;
    if (resolving) {
      return "Resolving "+(resolving.code||encounterCode(resolving.number))+". Awaiting outcome.";
    }

    const active=runtime.activeEncounter;
    if (active) {
      const code=active.code||encounterCode(active.number);
      const remaining=Math.max(0,Math.trunc((Number(active.resolveAfterTurn)||0)-(Number(runtime.turn)||0)));
      const card=getEncounterCard(active.number);
      if (card && normalize(readEncounterStatus(card))==="awaiting completion") {
        const count=Math.max(0,Math.trunc(Number(active.inProgressChecks)||0));
        return code+" awaiting completion. Next check in "+remaining+
          " turns ("+Math.min(count,5)+"/5).";
      }
      return code+" active. Resolves in "+remaining+" turns.";
    }

    if (runtime.pendingEncounter) {
      const queued=runtime.pendingEncounter;
      return (queued.code||encounterCode(queued.number))+" queued for the next story action.";
    }

    if (Number.isSafeInteger(runtime.nextEncounterIn) && runtime.nextEncounterIn>0) {
      return "Next encounter in "+runtime.nextEncounterIn+" turns.";
    }
    return "Encounter countdown starts on the next story turn.";
  }

  function showEncounterStatusCommand(arg) {
    const runtime=state.randomEncounters;
    postUserMessage(currentEncounterStatusMessage());
    runtime.pendingControlCommand=arg;
    runtime.pendingInputTurn=false;
    return CONTROL_SENTINEL;
  }

  function handleControlCommand(rawText) {
    const match=String(rawText||"").trim().match(/^\/RE(?:\s+(.+))?$/i);
    if (!match) return null;
    initializeState();
    const s=state.randomEncounters;
    const arg=String(match[1]||"help").trim();
    const lower=normalize(arg);
    if (lower==="status") return showEncounterStatusCommand(arg);
    const config=maintenance();
    let message="";
    if (lower==="help") message="Commands: /RE status, /RE on, /RE off, /RE start, /RE start #, /RE end, /RE stop, /RE reset #, /RE reset all.";
    else if (lower==="on") { setConfigEnabled(true); message="Random encounters enabled."; }
    else if (lower==="off") { setConfigEnabled(false); message="Random encounters disabled."; }
    else if (lower==="start") {
      if (s.pendingEncounter) message="A random encounter is already queued.";
      else {
        const hadActive=!!s.activeEncounter;
        if (hadActive) endActiveForCommand();
        const selected=selectRandomEncounter(config);
        if (!selected) message=hadActive ? "Active encounter ended. No eligible replacement encounter is available." : "No eligible random encounters are available.";
        else {
          queueSelectedEncounter(selected);
          message=(hadActive ? "Active encounter ended. " : "")+"Random encounter "+selected.code+" queued for the next story action.";
        }
      }
    } else if (/^start\s+\d+$/.test(lower)) {
      if (s.pendingEncounter) message="A random encounter is already queued.";
      else {
        const number=parseInt(lower.match(/^start\s+(\d+)$/)[1],10);
        if (number<1) message="Encounter number must be 1 or greater.";
        else {
          const hadActive=!!s.activeEncounter;
          if (hadActive) endActiveForCommand();
          const result=selectSpecificEncounter(number,config);
          if (result.error) message=(hadActive ? "Active encounter ended. " : "")+result.error;
          else {
            queueSelectedEncounter(result.selected);
            message=(hadActive ? "Active encounter ended. " : "")+"Random encounter "+result.selected.code+" queued for the next story action.";
          }
        }
      }
    } else if (lower==="end" || lower==="stop") {
      if (!s.activeEncounter) message="No random encounter is currently active.";
      else {
        endActiveForCommand();
        message="Active random encounter ended. Resolution queued.";
      }
    } else if (lower==="reset all") {
      getAllEncounterCards().forEach(function(record){
        resetEncounterCard(record.card,record.number,config);
      });
      clearAllEncounterRuntime();
      message="All existing random encounter cards were reset to available, and outcomes were cleared.";
    } else {
      const rm=lower.match(/^reset\s+(\d+)$/);
      if (rm) {
        const number=parseInt(rm[1],10);
        if (number<1) message="Encounter number must be 1 or greater.";
        else if (!resetEncounter(number,config)) message=encounterCode(number)+" does not exist.";
        else message=encounterCode(number)+" was reset to available, and its outcome was cleared.";
      } else message="Unknown random encounter command. Use /RE help.";
    }
    syncActMap(s.config||config);
    postUserMessage(message);
    s.pendingControlCommand=arg;
    s.pendingInputTurn=false;
    return CONTROL_SENTINEL;
  }

  function injectControlCommandContext(contextText) {
    const s=state.randomEncounters;
    if (!s.pendingControlCommand) return contextText;
    return String(contextText||"").replace(new RegExp(CONTROL_SENTINEL,"g"),"")+"\n\n[RE CONTROL COMMAND]\nA Random Encounter System control command was handled by the script. Respond exactly with "+CONTROL_ACK+". Do not continue the story.\n[END RE CONTROL COMMAND]";
  }

  function suppressControlCommandOutput(outputText) {
    const s=state.randomEncounters;
    if (!s.pendingControlCommand) return null;
    s.pendingControlCommand=null;
    return CONTROL_SENTINEL;
  }

  // ---------- Hook routing ----------

  function maintenance() {
    initializeState();
    const s = state.randomEncounters;
    const oldConfig = s.config || null;
    const config = loadConfig();
    s.config = config;
    detectConfigChanges(oldConfig,config);
    repairDuplicateEncounterKeys();
    ensureEncounterCards(config);
    initializeDiscoveredEncounterCards(config);
    restoreEncounterCardsToDefaults(config);
    setAllCardsToAvailable(config);
    syncEncounterCategories();
    preparePlaceholderPopulation(config);
    syncActMap(config);
    log(
      "Config | enabled=" + config.enabled +
      " | maxCards=" + config.maximumEncounterCards +
      " | createMax=" + config.createMaxEncounterCards +
      " | populatePlaceholders=" + config.populatePlaceholderCards +
      " | restoreDefaults=" + config.restoreEncounterCardsToDefaults +
      " | setAllAvailable=" + config.setAllCardsToAvailable +
      " | displayMap=" + config.displayActEncounterMap +
      " | advanced=" + config.useAdvancedSettings +
      " | pacing=" + config.encounterPacing +
      " | firstEncounterTurn=" + config.firstEncounterTurn.min + "-" + config.firstEncounterTurn.max +
      " | currentAct=" + config.currentAct +
      " | interval=" + config.minTurns + "-" + config.maxTurns +
      " | defaultAct=" + config.defaultAct +
      " | defaultImportance=" + config.defaultImportance +
      " | defaultDuration=" + config.defaultDuration +
      " | defaultRarity=" + config.defaultRarity
    );
    return config;
  }

  const normalizedHook = normalize(hook);

  if (normalizedHook === "pause" || normalizedHook === "external task" || normalizedHook === "external-task") {
    initializeState();
    const owner=String(text||"External script").trim()||"External script";
    state.randomEncounters.compatibilityPauseRequest=owner;
    log("Compatibility pause requested by "+owner+".");
    return text;
  }

  if (normalizedHook === "input") {
    const commandResult=handleControlCommand(text);
    if (commandResult!==null) return commandResult;
    markInputTurn();
    return text;
  }

  if (normalizedHook === "context") {
    initializeState();
    text=stripPopulationProgressFromContext(text);

    const contextStop = typeof stop !== "undefined" ? !!stop : false;
    if (contextStop) {
      synchronizeTurnHighWater();
      log("Compatibility pause | Context stop=true; RE processing skipped.");
      return text;
    }

    if (state.randomEncounters.pendingControlCommand) return injectControlCommandContext(text);
    const config=maintenance();
    const externalOwner=detectExternalModelTaskOwner();
    if (externalOwner) {
      suspendForExternalModelTask(externalOwner);
      return text;
    }
    if (state.randomEncounters.externalTaskOwner) {
      log("Compatibility pause ended | "+state.randomEncounters.externalTaskOwner+".");
      state.randomEncounters.externalTaskOwner=null;
    }

    const populationRequest=state.randomEncounters.placeholderPopulation;
    if (populationRequest && populationRequest.phase==="generating") {
      log("Placeholder population generation re-requested without advancing RE turn.");
      return buildDedicatedPlaceholderPopulationContext(text,populationRequest.numbers,populationRequest);
    }
    if (populationRequest && populationRequest.phase==="queued") {
      const populationTurn=detectTurnAdvance();
      if (populationTurn) {
        return beginDedicatedPlaceholderPopulation(text);
      }
      if (populationRequest.attempts>0) {
        // Retry an already-attempted incomplete batch: only remaining cards,
        // original difficulty/theme, no additional attempt or RE story turn.
        populationRequest.phase="generating";
        populationRequest.requestedActionCount=currentActionCount();
        postUserMessage("Encounter population in progress - Attempt "+populationRequest.attempts+
          " - "+populationRequest.completedCount+" of "+populationRequest.totalCount+".");
        log("Placeholder population Retry | attempt="+populationRequest.attempts+
          " | remaining="+populationRequest.numbers.map(formatEncounterNumber).join(",")+
          " | RE turn unchanged.");
        return buildDedicatedPlaceholderPopulationContext(text,populationRequest.numbers,populationRequest);
      }
    }

    const advanced=detectTurnAdvance();
    if (advanced) {
      processNewTurn(config);
      let result=injectPendingEncounter(text,config);
      result=injectActiveEncounterReminder(result);
      result=injectResolutionRequest(result,true);
      syncActMap(config);
      return result;
    }
    log("No turn advance detected | Retry/regeneration.");
    let result=injectRetryEncounter(text);
    result=injectActiveEncounterReminder(result);
    result=injectResolutionRequest(result,false);
    return result;
  }

  if (normalizedHook === "output") {
    initializeState();
    const control=suppressControlCommandOutput(text);
    if (control!==null) {
      syncUserMessageSnapshot();
      return control;
    }
    if (state.randomEncounters.externalTaskOwner) {
      log("Compatibility output pass-through | "+state.randomEncounters.externalTaskOwner+" owns this model turn.");
      state.randomEncounters.externalTaskOwner=null;
      syncUserMessageSnapshot();
      return text;
    }
    const populationResult=processDedicatedPlaceholderPopulationOutput(text);
    if (populationResult!==null) {
      if (state.randomEncounters.config) syncActMap(state.randomEncounters.config);
      syncUserMessageSnapshot();
      return populationResult;
    }
    const result=processOutput(text);
    if (state.randomEncounters.config) syncActMap(state.randomEncounters.config);
    syncUserMessageSnapshot();
    return result;
  }

  return text;
}

function RandomEncountersContext(text) {
  "use strict";

  const shouldStop = typeof stop !== "undefined" ? !!stop : false;
  const result = RandomEncounters("context", text);

  return { text: result, stop: shouldStop };
}
