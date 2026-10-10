/*
 * Random Encounters
 * Version 0.18.40
 *
 * v0.18 adds Acts/progression, Awaiting Completion, and active-event command handoff.
 */

function RandomEncounters(hook, text) {
  "use strict";

  const VERSION = "0.18.40";
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
  const HISTORY_TITLE = "History";
  const HISTORY_KEY = "random encounter history";
  const HISTORY_MAX_ENTRIES = 12;
  const HISTORY_MAX_CHARACTERS = 3000;
  const HISTORY_READ_ONLY = "READ ONLY";
  const HISTORY_RECENT_HEADER = "======= SUCCESSFUL ENCOUNTERS - READ ONLY =======";
  const HISTORY_ARCHIVE_HEADER = "========== ARCHIVED HISTORY ==========";
  const ACT_MAP_TITLE = "Act & Encounter Map";
  const ACT_MAP_KEY = "random encounter act map";
  const ACT_MAP_READ_ONLY = "READ ONLY";
  const ENCOUNTER_PREFIX = "RAND_";
  const SETTINGS_HEADER = "============ ENCOUNTER SETTINGS ============";
  const SYSTEM_HEADER = "============== ENCOUNTER STATE ==============";
  const SETTINGS_HISTORY_TYPE = "#RE - Config & History";
  const ENCOUNTER_TYPE = "#RE - Encounters";
  const PLACEHOLDER_POPULATION_INSTRUCTION = "Generate low-stakes, dynamic encounters appropriate to the established setting, genre, technology level, supernatural rules, current locations, factions, characters, and conflicts. Do not introduce setting-breaking concepts.";
  const POPULATION_PROGRESS_TEXT = "\n\n[RE] Updating Encounter Cards - Hit Continue\n\n";

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
      if (n.indexOf("encounter settings") !== -1 || n === "random encounter settings") { section = "settings"; return; }
      if (n.indexOf("encounter state") !== -1 || n === "random encounter system") { section = "system"; return; }
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
        return !/^(?:Duration|Retirement\s+Length)\s*:/i.test(clean) &&
          !/^(?:Rarity|Encounter\s+Weight)\s*:/i.test(clean) &&
          !/^Minimum\s+Turn\s*:/i.test(clean) &&
          !/^Act\s*:/i.test(clean) &&
          !/^Importance\s*:/i.test(clean);
      })
      .map(function(line) { return line.replace(/^-\s*/, ""); });
  }

  function isValidDuration(value) {
    return !!DURATION_PRESETS[normalize(value)];
  }

  function readDurationRaw(card) {
    if (!card) return null;
    const match = String(card.description || "").match(/^\s*-?\s*(?:Duration|Retirement\s+Length)\s*:\s*(.+)$/im);
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
    const match = String(card.description || "").match(/^\s*-?\s*(?:Rarity|Encounter\s+Weight)\s*:\s*(.+)$/im);
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

  function compactConfigSpacing(entry, headers) {
    const lines=String(entry||"").split(/\r?\n/).map(function(line){return line.trimEnd();});
    const output=[];
    lines.forEach(function(line){
      if (!line.trim()) return;
      const isHeader=headers.some(function(pattern){return pattern.test(line.trim());});
      if (isHeader && output.length && output[output.length-1]!=="") output.push("");
      output.push(line);
    });
    return output.join("\n").trim();
  }

  function compactRegularConfigEntry(entry) {
    const compacted=compactConfigSpacing(entry,[
      /^=+\s*ENCOUNTERS\s*=+$/i,
      /^=+\s*GLOBAL DEFAULTS\s*=+$/i
    ]);
    const lines=compacted.split(/\r?\n/);

    function moveSettingAfter(labelPattern,anchorPattern) {
      const settingIndex=lines.findIndex(function(line){return labelPattern.test(line);});
      const anchorIndex=lines.findIndex(function(line){return anchorPattern.test(line);});
      if (settingIndex===-1 || anchorIndex===-1 || settingIndex===anchorIndex+1) return;
      const settingLine=lines.splice(settingIndex,1)[0];
      const newAnchorIndex=lines.findIndex(function(line){return anchorPattern.test(line);});
      lines.splice(newAnchorIndex+1,0,settingLine);
    }

    moveSettingAfter(
      /^\s*-?\s*Create Max Encounter Cards\s*:/i,
      /^\s*-?\s*Maximum Encounter Cards\s*:/i
    );
    moveSettingAfter(
      /^\s*-?\s*Populate Placeholder Cards\s*:/i,
      /^\s*-?\s*Create Max Encounter Cards\s*:/i
    );
    moveSettingAfter(
      /^\s*-?\s*Display Act & Encounter Map\s*:/i,
      /^\s*-?\s*Populate Placeholder Cards\s*:/i
    );

    return lines.join("\n");
  }

  function compactAdvancedConfigEntry(entry) {
    return compactConfigSpacing(entry,[
      /^=+\s*RARITY\s*=+$/i,
      /^=+\s*DURATION\s*=+$/i
    ]);
  }

  function buildConfigEntry(settings) {
    return [
      "================ SYSTEM ================",
      "- Enabled: " + (settings.enabled ? "true" : "false"),
      "- Maximum Encounter Cards: " + settings.maximumEncounterCards,
      "- Create Max Encounter Cards: " + (settings.createMaxEncounterCards ? "true" : "false"),
      "- Populate Placeholder Cards: " + (settings.populatePlaceholderCards ? "true" : "false"),
      "- Display Act & Encounter Map: " + (settings.displayActEncounterMap ? "true" : "false"),
      "- Use Advanced Settings: " + (settings.useAdvancedSettings ? "true" : "false"),
      "- Debug Logging: " + (settings.debugLogging ? "true" : "false"),
      "",
      "============== ENCOUNTERS ==============",
      "- Encounter Pacing: " + settings.encounterPacing,
      "- Current Act: " + settings.currentAct,
      "- Set All Cards to Available: " + (settings.setAllCardsToAvailable ? "true" : "false"),
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
      "SYSTEM",
      "Enabled turns encounter injection and automatic random encounters on or off. Control commands remain available; an encounter queued while disabled will not inject until Enabled is true again.",
      "Maximum Encounter Cards is the highest sequential RAND_## card ensured when Create Max Encounter Cards is true.",
      "Create Max Encounter Cards is one-shot: it creates/ensures cards through Maximum Encounter Cards, then resets to false.",
      "Populate Placeholder Cards is one-shot: it queues untouched default placeholder Entries, shows an in-progress receipt popup when accepted, and updates that popup with an Attempt number on each eligible generation. Failed attempts retry on later eligible actions; Auto-Cards-owned turns and Retry/regeneration do not increment the count. Ordinary story prose remains visible on failed attempts; returned encounter data is hidden behind a Continue message. The toggle resets only after completion. Existing custom encounter text is never overwritten.",
      "When Inner Self is enabled, generating new encounter cards may take longer. RE automatically retries on later eligible actions and shows numbered Attempt popups; no need to edit the Config card again.",
      "Generated encounter scenarios are limited to exactly one sentence.",
      "Population instruction: " + PLACEHOLDER_POPULATION_INSTRUCTION,
      "Use Advanced Settings enables the editable Advanced RE Settings Story Card.",
      "Debug Logging controls [Random Encounters] scripting-console logs.",
      "Display Act & Encounter Map creates and maintains a read-only Act & Encounter Map Story Card when true; false removes that derived card.",
      "",
      "ENCOUNTERS",
      "Encounter Pacing controls the number of story turns between encounter opportunities.",
      "Current Act is an upper eligibility bound: Available encounters with Act <= Current Act may be selected.",
      "Current Act advances after every Required encounter in that Act completes successfully; Optional encounters never block advancement.",
      "Set All Cards to Available is one-shot: it makes every encounter Available and clears encounter runtime state without changing settings, Outcomes, History, or Current Act, then resets to false.",
      "",
      "GLOBAL DEFAULTS",
      "Act, Importance, Rarity, and Duration are templates for newly generated cards and /RE reset commands.",
      "Changing a Global Default does not modify existing encounter cards.",
      "Restore Encounter Cards to Defaults is one-shot: it applies all four current defaults to every encounter card while preserving Status, prompt/Outcome content, and custom titles, then resets to false.",
      "",
      "ENCOUNTER LIFECYCLE",
      "Default cards are titled ## - Encounter Card and keyed RAND_##.",
      "Eligible encounters must be Available and have Act <= Current Act. Rarity controls weighted selection.",
      "Duration controls how long an Active encounter remains active before resolution; pacing adjusts normal Duration values.",
      "Resolution classifications are occurred, in progress, or did not occur.",
      "In-progress encounters become Awaiting Completion and requeue at 50% of normal Duration; the fifth consecutive in-progress check returns the encounter to Available.",
      "Successful encounters remain Retired and enter History. Other resolved failures return to Available.",
      "Each resolution is stored in the encounter Entry under Outcome. History keeps the " + HISTORY_MAX_ENTRIES + " most recent successful encounters / " + HISTORY_MAX_CHARACTERS + " characters in its read-only Entry for Context injection and moves older successes into an archive in Notes.",
      "Status markers: 📝 Active, 🔄 Awaiting Completion, 💾 Returned to Available, 🗃️ Completed Successfully.",
      "Retry/regeneration does not advance the Random Encounter turn or consume Active Duration.",
      "There is no separate Cooldown or Minimum Turn system.",
      "",
      "COMMANDS",
      "/RE help - Show the command list.",
      "/RE on - Enable random encounters.",
      "/RE off - Disable random encounters.",
      "/RE start - Queue a weighted eligible encounter; if one is active, end it first.",
      "/RE start # - Queue a specific eligible encounter; if one is active, end it first.",
      "/RE end or /RE stop - End the active encounter and queue its resolution.",
      "/RE reset # - Reset one encounter to Available, apply current Global Defaults, and clear its Outcome.",
      "/RE reset all - Reset all encounters to Available, apply current Global Defaults, and clear Outcomes.",
      "Control commands do not consume a story turn.",
      "",
      "Player-facing system messages use the RE - prefix. Debug-only pacing, rarity, and duration values remain internal."
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
      currentAct: DEFAULTS.currentAct,
      defaultAct: DEFAULTS.act,
      defaultImportance: DEFAULTS.importance,
      defaultRarity: DEFAULTS.rarity,
      defaultDuration: DEFAULTS.duration
    };
  }

  function migrateLegacyConfigEntry(entry) {
    const raw = parseColonLines(entry);

    if (raw["maximum encounter cards"] !== undefined || raw["max encounter cards"] !== undefined) {
      let migrated=String(entry)
        .replace(/^\s*-?\s*Max Encounter Cards\s*:\s*/im,"- Maximum Encounter Cards: ")
        .replace(/^\s*-?\s*Create Missing Encounter Cards\s*:\s*/im,"- Create Max Encounter Cards: ")
        .replace(
          /^\s*Changing these values overwrites the same setting on all encounter cards\.\s*$/im,
          "Defaults apply to new or reset encounter cards. Existing cards change only when Restore Encounter Cards to Defaults is true."
        );

      if (!/^\s*-?\s*Current Act\s*:/im.test(migrated)) {
        migrated=migrated.replace(/(^\s*-?\s*Encounter Pacing\s*:\s*.*$)/im,"$1\n- Current Act: 1");
      }

      let parsedMigrated=parseColonLines(migrated);
      if (parsedMigrated["populate placeholder cards"]===undefined) {
        if (/^\s*-?\s*Create Max Encounter Cards\s*:/im.test(migrated)) {
          migrated=migrated.replace(
            /(^\s*-?\s*Create Max Encounter Cards\s*:\s*.*$)/im,
            "$1\n- Populate Placeholder Cards: false"
          );
        } else {
          migrated=migrated.replace(
            /(^\s*-?\s*Maximum Encounter Cards\s*:\s*.*$)/im,
            "$1\n- Populate Placeholder Cards: false"
          );
        }
        parsedMigrated=parseColonLines(migrated);
      }
      if (parsedMigrated["set all cards to available"]===undefined) {
        migrated=migrated.replace(
          /(^\s*-?\s*Current Act\s*:\s*.*$)/im,
          "$1\n- Set All Cards to Available: false"
        );
        parsedMigrated=parseColonLines(migrated);
      }
      if (parsedMigrated["display act & encounter map"]===undefined) {
        if (/^\s*-?\s*Debug Logging\s*:/im.test(migrated)) {
          migrated=migrated.replace(
            /(^\s*-?\s*Debug Logging\s*:\s*.*$)/im,
            "$1\n- Display Act & Encounter Map: false"
          );
        } else {
          migrated=migrated.replace(
            /(^\s*=+\s*ENCOUNTERS\s*=+\s*$)/im,
            "- Display Act & Encounter Map: false\n\n$1"
          );
        }
        parsedMigrated=parseColonLines(migrated);
      }
      if (parsedMigrated.act===undefined) {
        migrated=migrated.replace(
          /(^\s*Defaults apply to new or reset encounter cards\. Existing cards change only when Restore Encounter Cards to Defaults is true\.\s*$)/im,
          "$1\n- Act: 1\n- Importance: Required"
        );
      } else if (parsedMigrated.importance===undefined) {
        migrated=migrated.replace(/(^\s*-?\s*Act\s*:\s*.*$)/im,"$1\n- Importance: Required");
      }

      parsedMigrated=parseColonLines(migrated);
      if (parsedMigrated["restore encounter cards to defaults"]===undefined) {
        if (/^\s*-?\s*Duration\s*:/im.test(migrated)) {
          migrated=migrated.replace(
            /(^\s*-?\s*Duration\s*:\s*.*$)/im,
            "$1\n- Restore Encounter Cards to Defaults: false"
          );
        } else {
          migrated += "\n- Restore Encounter Cards to Defaults: false";
        }
      }
      return migrated;
    }

    const settings = defaultConfigSettings();
    settings.enabled = parseBoolean(raw.enabled, settings.enabled);
    settings.encounterPacing = isValidPacingPreset(raw["encounter pacing"])
      ? PACING_PRESETS[normalize(raw["encounter pacing"])].name
      : settings.encounterPacing;
    settings.createMaxEncounterCards = parseBoolean(
      raw["create placeholder encounter cards"],
      settings.createMaxEncounterCards
    );
    settings.debugLogging = parseBoolean(raw["debug logging"], settings.debugLogging);

    const legacyRarity = raw["set global encounter rarity"] || raw["default encounter rarity"];
    if (legacyRarity && isValidRarity(legacyRarity)) {
      settings.defaultRarity = RARITY_PRESETS[normalize(legacyRarity)].name;
    }

    const legacyDuration = raw["set global retirement length"] || raw["default retirement length"];
    if (legacyDuration && isValidDuration(legacyDuration)) {
      settings.defaultDuration = DURATION_PRESETS[normalize(legacyDuration)].name;
    }

    return buildConfigEntry(settings);
  }

  function ensureConfigCard() {
    let card = findCardByKey(CONFIG_KEY);
    if (!card) {
      card = createCard({
        type: SETTINGS_HISTORY_TYPE,
        title: CONFIG_TITLE,
        keys: CONFIG_KEY,
        entry: buildConfigEntry(defaultConfigSettings()),
        description: currentConfigDescription()
      });
      return card;
    }

    card.type = SETTINGS_HISTORY_TYPE;
    card.title = CONFIG_TITLE;
    const configNotes=currentConfigDescription();
    if (String(card.description||"")!==configNotes) card.description=configNotes;

    const existingEntry = getCardEntry(card);
    const migrated = migrateLegacyConfigEntry(existingEntry);
    const compacted = compactRegularConfigEntry(migrated);
    if (compacted !== existingEntry) setCardEntry(card, compacted);

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
        type: SETTINGS_HISTORY_TYPE,
        title: ADVANCED_TITLE,
        keys: ADVANCED_KEY,
        entry: buildAdvancedEntry(),
        description: advancedDescription()
      });
      return card;
    }
    card.type = SETTINGS_HISTORY_TYPE;
    card.title = ADVANCED_TITLE;
    const advancedNotes=advancedDescription();
    if (String(card.description||"")!==advancedNotes) card.description=advancedNotes;
    const existingEntry=getCardEntry(card);
    if (!existingEntry.trim()) setCardEntry(card,buildAdvancedEntry());
    else {
      const compacted=compactAdvancedConfigEntry(existingEntry);
      if (compacted!==existingEntry) setCardEntry(card,compacted);
    }
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

  function parseConfigEntry(entry) {
    const raw = parseColonLines(entry);
    const settings = defaultConfigSettings();

    settings.enabled = parseBoolean(raw.enabled, settings.enabled);
    settings.maximumEncounterCards = parsePositiveInteger(raw["maximum encounter cards"] || raw["max encounter cards"], settings.maximumEncounterCards, 100);
    settings.createMaxEncounterCards = parseBoolean(raw["create max encounter cards"] !== undefined ? raw["create max encounter cards"] : raw["create missing encounter cards"], settings.createMaxEncounterCards);
    settings.populatePlaceholderCards = parseBoolean(raw["populate placeholder cards"], settings.populatePlaceholderCards);
    settings.restoreEncounterCardsToDefaults = parseBoolean(raw["restore encounter cards to defaults"], settings.restoreEncounterCardsToDefaults);
    settings.setAllCardsToAvailable = parseBoolean(raw["set all cards to available"], settings.setAllCardsToAvailable);
    settings.useAdvancedSettings = parseBoolean(raw["use advanced settings"], settings.useAdvancedSettings);
    settings.debugLogging = parseBoolean(raw["debug logging"], settings.debugLogging);
    settings.displayActEncounterMap = parseBoolean(raw["display act & encounter map"], settings.displayActEncounterMap);
    settings.currentAct = parsePositiveInteger(raw["current act"], settings.currentAct, 999);
    settings.defaultAct = parsePositiveInteger(raw.act, settings.defaultAct, 999);
    settings.defaultImportance = parseImportance(raw.importance, settings.defaultImportance);

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
    return parseConfigEntry(getCardEntry(card));
  }


  // ---------- Encounter history ----------

  function historyNotesIntro() {
    return [
      "History",
      "- Status: Script Managed",
      "- Entry: Read Only",
      "- Successful Encounters Only: true",
      "- Recent Entries: " + HISTORY_MAX_ENTRIES,
      "- Recent Character Cap: " + HISTORY_MAX_CHARACTERS,
      "- Recent History Injected Into Context: true",
      "- Archived History Injected Into Context: false",
      "",
      "The Entry contains the most recent successful encounters. Older successful encounters are archived below and are not injected into model Context.",
      "This card is maintained automatically by Random Encounters."
    ].join("\n");
  }

  function cleanHistoryTitle(value) {
    return String(value || "").replace(/^[-•]\s*/, "").replace(/:\s*$/, "").trim();
  }

  function parseHistoryRecords(text) {
    const lines=String(text||"").split(/\r?\n/);
    const records=[];

    for (let i=0;i<lines.length;i++) {
      const line=lines[i].trim();
      if (!line || line===HISTORY_READ_ONLY || /^=+.*=+$/.test(line)) continue;

      const classifierIndex=line.toLowerCase().indexOf("the encounter occurred:");
      if (classifierIndex>0) {
        const title=cleanHistoryTitle(line.slice(0,classifierIndex));
        const resolution=cleanResolution(line.slice(classifierIndex));
        if (title && resolution) records.push({title:title,resolution:resolution});
        continue;
      }

      const next=i+1<lines.length ? lines[i+1].trim() : "";
      if (line && /^The encounter occurred:/i.test(next)) {
        records.push({title:cleanHistoryTitle(line),resolution:cleanResolution(next)});
        i+=1;
      }
    }

    return records;
  }

  function parseArchivedHistoryEntries(card) {
    if (!card) return [];
    const description=String(card.description||"");
    const index=description.indexOf(HISTORY_ARCHIVE_HEADER);
    if (index===-1) return [];
    return parseHistoryRecords(description.slice(index+HISTORY_ARCHIVE_HEADER.length));
  }

  function parseHistoryEntries(card) {
    if (!card) return [];
    return parseHistoryRecords(getCardEntry(card));
  }

  function renderHistoryRecords(records) {
    return records.map(function(record){
      return record.title + "\n" + record.resolution;
    }).join("\n\n");
  }

  function renderHistoryEntry(records) {
    const lines=[HISTORY_RECENT_HEADER];
    if (records.length) lines.push(renderHistoryRecords(records));
    else lines.push("No successful encounters recorded yet.");
    return lines.join("\n");
  }

  function historyDescription(archivedRecords) {
    const intro=historyNotesIntro();
    if (!archivedRecords || !archivedRecords.length) return intro;
    return intro+"\n\n"+HISTORY_ARCHIVE_HEADER+"\n\n"+renderHistoryRecords(archivedRecords);
  }

  function partitionHistoryEntries(recentRecords, archivedRecords) {
    const recent=(recentRecords||[]).slice();
    const archived=(archivedRecords||[]).slice();

    while (
      recent.length>HISTORY_MAX_ENTRIES ||
      (recent.length && renderHistoryEntry(recent).length>HISTORY_MAX_CHARACTERS)
    ) {
      archived.push(recent.shift());
    }

    return {recent:recent,archived:archived};
  }

  function writeHistoryCard(card,recentRecords,archivedRecords) {
    if (!card) return false;
    const partitioned=partitionHistoryEntries(recentRecords,archivedRecords);
    const desiredEntry=renderHistoryEntry(partitioned.recent);
    const desiredDescription=historyDescription(partitioned.archived);

    card.type=SETTINGS_HISTORY_TYPE;
    card.title=HISTORY_TITLE;
    card.keys=HISTORY_KEY;
    if (getCardEntry(card)!==desiredEntry) setCardEntry(card,desiredEntry);
    if (String(card.description||"")!==desiredDescription) card.description=desiredDescription;
    return partitioned;
  }

  function ensureHistoryCard() {
    let card = findCardByKey(HISTORY_KEY);
    if (!card) {
      card = createCard({
        type: SETTINGS_HISTORY_TYPE,
        title: HISTORY_TITLE,
        keys: HISTORY_KEY,
        entry: renderHistoryEntry([]),
        description: historyDescription([])
      });
      return card;
    }

    const recent=parseHistoryEntries(card);
    const archived=parseArchivedHistoryEntries(card);
    writeHistoryCard(card,recent,archived);
    return card;
  }

  function displayEncounterTitle(number,title) {
    const base=stripEncounterStatusEmoji(title)||("Encounter Card");
    const prefix=formatEncounterNumber(number);
    const escaped=prefix.replace(/[.*+?^$\{\}()|[\]\\]/g,"\\$&");
    if (new RegExp("^"+escaped+"\\s*[-–—:]").test(base)) return base;
    return prefix+" - "+base;
  }

  function appendEncounterHistory(record, resolution) {
    const historyCard = ensureHistoryCard();
    if (!historyCard) {
      log("Encounter history unavailable | Could not create/find history Story Card.");
      return false;
    }

    const encounterCard = getEncounterCard(record.number);
    const baseTitle = encounterCard
      ? stripEncounterStatusEmoji(encounterCard.title)
      : (record.title || "Encounter Card");
    const title=displayEncounterTitle(record.number,baseTitle);
    const recent=parseHistoryEntries(historyCard);
    const archived=parseArchivedHistoryEntries(historyCard);

    recent.push({
      title:title,
      resolution:cleanResolution(resolution)
    });

    const partitioned=writeHistoryCard(historyCard,recent,archived);
    log(
      "Encounter history updated | recent=" + partitioned.recent.length +
      " | archived=" + partitioned.archived.length +
      " | added=" + title
    );
    return true;
  }

  function injectEncounterHistory(contextText) {
    const card = ensureHistoryCard();
    if (!card) return contextText;

    const entries = parseHistoryEntries(card);
    if (!entries.length) return contextText;

    log("Encounter history injected | entries=" + entries.length);
    return contextText +
      "\n\n[RANDOM ENCOUNTER HISTORY]\n" +
      renderHistoryRecords(entries) +
      "\n[END RANDOM ENCOUNTER HISTORY]";
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
        type:SETTINGS_HISTORY_TYPE,
        title:ACT_MAP_TITLE,
        keys:ACT_MAP_KEY,
        entry:desiredEntry,
        description:desiredDescription
      });
      if (card) log("Act & Encounter Map created.");
      return card;
    }

    card.type=SETTINGS_HISTORY_TYPE;
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

  function migrateDefaultEncounterTitle(card,number) {
    if (!card) return;
    const title=String(card.title||"");
    const base=stripEncounterStatusEmoji(title);
    if (!/^Random Encounter\s+\d+$/i.test(base)) return;
    const marker=(title.match(/^(?:📝|🔄|🗃️)/)||[])[0];
    card.title=(marker ? marker+" " : "")+encounterDefaultTitle(number);
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
      "- Duration: " + duration
    ];
    extra.forEach(function(setting) { settingsLines.push("- " + setting); });

    card.description = systemLines.concat([""], settingsLines).join("\n");
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
      "- Duration: " + duration
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
      type: ENCOUNTER_TYPE,
      title: encounterDefaultTitle(number),
      keys: code,
      entry: encounterPlaceholderText(number),
      description: defaultEncounterDescription(number, config)
    });
  }

  function upgradeEncounterCard(card,number,config) {
    if (!card) return;
    card.type=ENCOUNTER_TYPE;
    const metadata=readSystemMetadata(card);
    const description=String(card.description||"");

    const fallbackDuration=config && config.defaultDuration ? config.defaultDuration : DEFAULTS.duration;
    const fallbackRarity=config && config.defaultRarity ? config.defaultRarity : DEFAULTS.rarity;
    const fallbackAct=config && config.defaultAct ? config.defaultAct : DEFAULTS.act;
    const fallbackImportance=config && config.defaultImportance ? config.defaultImportance : DEFAULTS.importance;

    const rawDuration=readDurationRaw(card);
    let duration=rawDuration && isValidDuration(rawDuration) ? readDuration(card) : fallbackDuration;
    if (rawDuration && !isValidDuration(rawDuration)) {
      log(encounterCode(number) + " | Invalid Duration \"" + rawDuration + "\" | Using " + fallbackDuration + ".");
    }

    const rawRarity=readRarityRaw(card);
    let rarity=rawRarity && isValidRarity(rawRarity) ? readRarity(card) : fallbackRarity;
    if (rawRarity && !isValidRarity(rawRarity)) {
      log(encounterCode(number) + " | Invalid Rarity \"" + rawRarity + "\" | Using " + fallbackRarity + ".");
    }

    const hasAct=/^\s*-?\s*Act\s*:/im.test(description);
    const hasImportance=/^\s*-?\s*Importance\s*:/im.test(description);

    writeEncounterMetadata(card,{
      status:metadata.status,
      number:number,
      duration:duration,
      rarity:rarity,
      act:hasAct ? readEncounterAct(card) : fallbackAct,
      importance:hasImportance ? readEncounterImportance(card) : fallbackImportance
    });
  }

  function getEncounterCard(number) {
    return findCardByKey(encounterCode(number));
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

  function needsEncounterUpgrade(card, number) {
    if (!card || card.type !== ENCOUNTER_TYPE) return true;
    const description=String(card.description||"");
    const numberMatch=description.match(/^\s*-?\s*Encounter Number\s*:\s*(\d+)\s*$/im);
    if (!numberMatch || parseInt(numberMatch[1],10)!==number) return true;
    if (!/^\s*-?\s*Status\s*:/im.test(description)) return true;
    if (!/^\s*-?\s*Act\s*:/im.test(description)) return true;
    if (!/^\s*-?\s*Importance\s*:/im.test(description)) return true;
    if (!/^\s*-?\s*Rarity\s*:/im.test(description)) return true;
    if (!/^\s*-?\s*Duration\s*:/im.test(description)) return true;
    if (/^\s*-?\s*(?:Encounter Weight|Retirement Length|Minimum Turn)\s*:/im.test(description)) return true;
    return false;
  }

  function resetCreateMaxEncounterCardsToggle(config) {
    const card=ensureConfigCard();
    if (!card) return false;
    let entry=getCardEntry(card);
    if (/^\s*-?\s*Create Max Encounter Cards\s*:/im.test(entry)) {
      entry=entry.replace(/^\s*-?\s*Create Max Encounter Cards\s*:\s*.*$/im,"- Create Max Encounter Cards: false");
    } else if (/^\s*-?\s*Create Missing Encounter Cards\s*:/im.test(entry)) {
      entry=entry.replace(/^\s*-?\s*Create Missing Encounter Cards\s*:\s*.*$/im,"- Create Max Encounter Cards: false");
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
      attempts:0
    };
    postUserMessage("Encounter population in progress.");
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
      migrateDefaultEncounterTitle(record.card,record.number);
      if (needsEncounterUpgrade(record.card,record.number)) {
        upgradeEncounterCard(record.card,record.number,config);
      }
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
    if (s.activeEncounter===undefined) {
      s.activeEncounter=Array.isArray(s.activeEncounters) && s.activeEncounters.length ? s.activeEncounters[0] : null;
    }
    delete s.activeEncounters;
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
    delete s.used;
    delete s.globalDefaultsSnapshot;

    if (s.activeEncounter) {
      const encounter=s.activeEncounter;
      if (encounter.duration===undefined && encounter.retirementLength!==undefined) encounter.duration=encounter.retirementLength;
      if (encounter.rarity===undefined && encounter.encounterWeight!==undefined) encounter.rarity=encounter.encounterWeight;
      delete encounter.retirementLength;
      delete encounter.retirementTurns;
      delete encounter.encounterWeight;
      delete encounter.triggeredTurn;
      delete encounter.status;
    }

    s.pendingResolutions.forEach(function(record){
      if (record.duration===undefined && record.retirementLength!==undefined) record.duration=record.retirementLength;
      if (record.rarity===undefined && record.encounterWeight!==undefined) record.rarity=record.encounterWeight;
      delete record.retirementLength;
      delete record.encounterWeight;
      delete record.triggeredTurn;
      delete record.resolvedTurn;
    });

    if (s.pendingEncounter) {
      s.pendingEncounter={number:s.pendingEncounter.number,code:s.pendingEncounter.code};
    }

    if (!s.currentTurnMarkers) {
      s.currentTurnMarkers={activation:[],awaiting:[],returned:[],retirement:[]};
    } else {
      if (!Array.isArray(s.currentTurnMarkers.returned)) {
        s.currentTurnMarkers.returned=Array.isArray(s.currentTurnMarkers.reready) ? s.currentTurnMarkers.reready : [];
      }
      delete s.currentTurnMarkers.reready;
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
      s.actionCountHigh = actionCount;
      return true;
    }

    return false;
  }

  // ---------- Selection and lifecycle ----------

  function randomEncounterInterval(config) {
    return randomInteger(config.minTurns, config.maxTurns);
  }

  function getAvailableEncounters(config) {
    const s = state.randomEncounters;
    let blockedByAct = 0;

    let blockedByPopulation = 0;
    const available = getAllEncounterCards().filter(function(record) {
      if (normalize(readEncounterStatus(record.card)) !== "available") return false;
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
      if (s.activeEncounter || s.pendingEncounter || s.pendingResolutions.length) {
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

    queueSelectedEncounter(selected);
    log("Turn " + s.turn + " | Selected " + selected.code + " | Rarity=" + selected.rarity + " | Weight=" + selected.weight + " | Act=" + selected.act + " | Current Act=" + config.currentAct);
  }

  // ---------- Context injection and resolution ----------

  function buildEncounterPrompt(eventText) {
    return "\n\n[RANDOM ENCOUNTER]\n" +
      "A random encounter is becoming relevant to the current story. Begin introducing or setting up the following event when the current scene allows. " +
      "Do not abruptly interrupt ongoing dialogue or actions solely to force the event into this response. " +
      "If there is not yet a natural opening, establish only what fits and allow the encounter to develop over subsequent turns. " +
      "Adapt minor details as needed to fit the current setting and characters, but preserve the core event. " +
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
    if (!card) return contextText;
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

    contextText += buildEncounterPrompt(eventText);

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
    s.lastInjectedEncounter = { number: pending.number, code: pending.code, turn: s.turn };
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
    if (!card) return contextText;
    const eventText = getEncounterPrompt(card).trim();
    if (!eventText) return contextText;
    log("Re-injected " + previous.code + " for retry of Turn " + s.turn + ".");
    return contextText + buildEncounterPrompt(eventText);
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
      appendEncounterHistory(record,cleaned);
      removePendingResolution(record.code);
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
      .replace(/(^|\n)\s*\[RE\]\s*(?:Generating New Encounters|Updating Encounter Cards) - Hit Continue\s*(?=\n|$)/gi,"$1")
      .replace(/\n{3,}/g,"\n\n");
  }

  function buildDedicatedPlaceholderPopulationContext(contextText,numbers) {
    const requested=(numbers||[]).map(formatEncounterNumber);
    const blocks=requested.map(function(number){
      return "RAND_"+number+"\nTitle: <short title>\nScenario: <exactly one sentence>\nEND RAND_"+number;
    }).join("\n\n");

    return stripPopulationProgressFromContext(contextText).trimEnd() +
      "\n\n[RE DEDICATED ENCOUNTER GENERATION]\n" +
      "This is a data-generation task, not a story-continuation task. Do not continue, narrate, or roleplay the current scene.\n" +
      PLACEHOLDER_POPULATION_INSTRUCTION + "\n" +
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
    postUserMessage("Encounter population in progress - Attempt "+request.attempts+".");
    log("Placeholder population generation started | attempt="+request.attempts+" | cards="+request.numbers.map(formatEncounterNumber).join(",")+" | RE turn suspended.");
    return buildDedicatedPlaceholderPopulationContext(contextText,request.numbers);
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
    let source=String(value||"")
      .replace(/\r/g," ")
      .replace(/\n+/g," ")
      .replace(/\s+/g," ")
      .trim();
    if (!source) return "";

    const protectedDots=[];
    source=source.replace(/\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|Mt|vs|etc)\./gi,function(match){
      protectedDots.push(match);
      return "__RE_ABBR_"+(protectedDots.length-1)+"__";
    });

    const sentenceMatch=source.match(/^.*?[.!?](?=\s+(?:[\"'“‘(]*[A-Z0-9])|\s*$)/);
    let sentence=sentenceMatch ? sentenceMatch[0].trim() : source;
    sentence=sentence.replace(/__RE_ABBR_(\d+)__/g,function(_,index){
      return protectedDots[parseInt(index,10)]||"";
    }).trim();

    if (sentence && !/[.!?][\"'”’)]?$/.test(sentence)) sentence += ".";
    return sentence.slice(0,1600);
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
      if (!scenario) continue;
      records.push({
        number:number,
        title:cleanGeneratedEncounterTitle(titleMatch ? titleMatch[1] : "",number),
        scenario:scenario
      });
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
      return populated>0 || looksLikePopulationData ? POPULATION_PROGRESS_TEXT : outputText;
    }

    resetPopulatePlaceholderCardsToggle(s.config||null);
    s.placeholderPopulation=null;
    postUserMessage("New encounters generated.");
    log(
      "Placeholder population generation completed | requested="+expected+
      " | populated="+populated+" | toggle reset to false | RE turn remained suspended."
    );
    return POPULATION_PROGRESS_TEXT;
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

  function queueSelectedEncounter(selected) {
    const s=state.randomEncounters;
    s.pendingEncounter={number:selected.number,code:selected.code};
    s.nextEncounterIn=null;
  }

  function selectSpecificEncounter(number,config) {
    const s=state.randomEncounters;
    const card=getEncounterCard(number);
    if (!card) return {error:encounterCode(number)+" does not exist."};
    if (normalize(readEncounterStatus(card))!=="available") {
      return {error:encounterCode(number)+" is not available."};
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

  function handleControlCommand(rawText) {
    const match=String(rawText||"").trim().match(/^\/RE(?:\s+(.+))?$/i);
    if (!match) return null;
    initializeState();
    const s=state.randomEncounters;
    const arg=String(match[1]||"help").trim();
    const lower=normalize(arg);
    const config=maintenance();
    let message="";
    if (lower==="help") message="Commands: /RE on, /RE off, /RE start, /RE start #, /RE end, /RE stop, /RE reset #, /RE reset all.";
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
    ensureEncounterCards(config);
    restoreEncounterCardsToDefaults(config);
    setAllCardsToAvailable(config);
    preparePlaceholderPopulation(config);
    ensureHistoryCard();
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
      return buildDedicatedPlaceholderPopulationContext(text,populationRequest.numbers);
    }
    if (populationRequest && populationRequest.phase==="queued") {
      const populationTurn=detectTurnAdvance();
      if (populationTurn) {
        return beginDedicatedPlaceholderPopulation(text);
      }
    }

    const advanced=detectTurnAdvance();
    if (advanced) {
      processNewTurn(config);
      let result=injectPendingEncounter(text,config);
      result=injectActiveEncounterReminder(result);
      result=injectEncounterHistory(result);
      result=injectResolutionRequest(result,true);
      syncActMap(config);
      return result;
    }
    log("No turn advance detected | Retry/regeneration.");
    let result=injectRetryEncounter(text);
    result=injectActiveEncounterReminder(result);
    result=injectEncounterHistory(result);
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
