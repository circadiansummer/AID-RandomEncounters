/*
 * Random Encounters
 * Version 0.17.0
 *
 * DEVELOPMENT BUILD
 *
 * New in v0.13.0:
 * - Config and History card type renamed to #RE - Config & History
 * - Global config labels use Set Global ... wording
 * - Minimum Turn values are stored directly on encounter cards
 * - Encounter Pacing scales Minimum Turn only when runtime eligibility is checked
 * - Positive Minimum Turn values always resolve to at least effective Turn 1
 *
 * Preserved:
 * - Numeric Minimum Turn scales with Encounter Pacing
 * - Weighted encounter rarity selection
 * - Pacing-scaled encounter Duration
 * - Resolution capture and per-encounter Outcome storage
 * - Compact encounter history injection
 * - Retry-safe turn detection
 * - Active -> resolution check -> next pacing interval lifecycle
 */

function RandomEncounters(hook, text) {
  "use strict";

  const VERSION = "0.17.0";
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

  const RETIREMENT_PRESETS = {
    "debug": { name: "Debug", fixedTurns: 2 },
    "very short": { name: "Very Short", turns: { "very fast": 4, "fast": 7, "moderate": 7, "slow": 11, "very slow": 14 } },
    "short": { name: "Short", turns: { "very fast": 7, "fast": 11, "moderate": 11, "slow": 18, "very slow": 22 } },
    "default": { name: "Default", turns: { "very fast": 11, "fast": 14, "moderate": 18, "slow": 25, "very slow": 32 } },
    "long": { name: "Long", turns: { "very fast": 14, "fast": 22, "moderate": 25, "slow": 36, "very slow": 47 } },
    "very long": { name: "Very Long", turns: { "very fast": 18, "fast": 29, "moderate": 36, "slow": 50, "very slow": 65 } }
  };

  const WEIGHT_PRESETS = {
    "debug": { name: "Debug", weight: 10000 },
    "very rare": { name: "Very Rare", weight: 1 },
    "rare": { name: "Rare", weight: 2 },
    "common": { name: "Common", weight: 4 },
    "very common": { name: "Very Common", weight: 8 }
  };

  const MINIMUM_TURN_PACING_SCALE = {
    "debug": 0.10,
    "very fast": 0.40,
    "fast": 0.65,
    "moderate": 1.00,
    "slow": 2.00,
    "very slow": 3.00
  };

  const DEFAULTS = {
    enabled: true,
    maximumEncounterCards: 10,
    createMissingEncounterCards: false,
    useAdvancedSettings: false,
    debugLogging: true,
    encounterPacing: "Moderate",
    duration: "Default",
    rarity: "Common",
    minimumTurn: 0
  };

  const CONFIG_TITLE = "Configure Random Encounters";
  const CONFIG_KEY = "random encounter settings";
  const ADVANCED_TITLE = "Advanced RE Settings";
  const ADVANCED_KEY = "advanced random encounter settings";
  const HISTORY_TITLE = "Random Encounter History";
  const HISTORY_KEY = "random encounter history";
  const HISTORY_MAX_ENTRIES = 12;
  const HISTORY_MAX_CHARACTERS = 3000;
  const ENCOUNTER_PREFIX = "RAND_";
  const SETTINGS_HEADER = "============ ENCOUNTER SETTINGS ============";
  const SYSTEM_HEADER = "============== ENCOUNTER STATE ==============";
  const BEHAVIOR_HEADER = "---------- BEHAVIOR ----------";
  const SETTINGS_HISTORY_TYPE = "#RE - Config & History";
  const ENCOUNTER_TYPE = "#RE - Encounters";

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
          !/^Minimum\s+Turn\s*:/i.test(clean);
      })
      .map(function(line) { return line.replace(/^-\s*/, ""); });
  }

  function isValidRetirementLength(value) {
    return !!RETIREMENT_PRESETS[normalize(value)];
  }

  function readRetirementLengthRaw(card) {
    if (!card) return null;
    const match = String(card.description || "").match(/^\s*-?\s*(?:Duration|Retirement\s+Length)\s*:\s*(.+)$/im);
    return match ? match[1].trim() : null;
  }

  function readRetirementLength(card) {
    const supplied = readRetirementLengthRaw(card);
    if (!supplied) return DEFAULTS.duration;
    const preset = RETIREMENT_PRESETS[normalize(supplied)];
    return preset ? preset.name : "Default";
  }

  function retirementPacingKey(encounterPacing) {
    const n = normalize(encounterPacing);
    if (n === "debug") return "very fast";
    if (["very fast", "fast", "moderate", "slow", "very slow"].includes(n)) return n;
    return "moderate";
  }

  function calculateRetirementTurns(retirementLength, encounterPacing, config) {
    const presets = config && config.runtimePresets ? config.runtimePresets.duration : RETIREMENT_PRESETS;
    const preset = presets[normalize(retirementLength)] || presets.default;
    if (preset.fixedTurns !== undefined) return preset.fixedTurns;
    return preset.turns[retirementPacingKey(encounterPacing)];
  }

  function isValidEncounterWeight(value) {
    return !!WEIGHT_PRESETS[normalize(value)];
  }

  function readEncounterWeightRaw(card) {
    if (!card) return null;
    const match = String(card.description || "").match(/^\s*-?\s*(?:Rarity|Encounter\s+Weight)\s*:\s*(.+)$/im);
    return match ? match[1].trim() : null;
  }

  function readEncounterWeight(card) {
    const supplied = readEncounterWeightRaw(card);
    if (!supplied) return DEFAULTS.rarity;
    const preset = WEIGHT_PRESETS[normalize(supplied)];
    return preset ? preset.name : DEFAULTS.rarity;
  }

  function encounterWeightValue(card, config) {
    const presets = config && config.runtimePresets ? config.runtimePresets.rarity : WEIGHT_PRESETS;
    const preset = presets[normalize(readEncounterWeight(card))] || presets.common;
    return preset.weight;
  }

  function readMinimumTurnRaw(card) {
    if (!card) return null;
    const match = String(card.description || "").match(/^\s*-?\s*Minimum\s+Turn\s*:\s*(.+)$/im);
    return match ? match[1].trim() : null;
  }

  function parseMinimumTurn(value) {
    const raw = String(value === undefined || value === null ? "" : value).trim();
    if (!/^\d+$/.test(raw)) return null;
    const parsed = Number(raw);
    if (!Number.isSafeInteger(parsed) || parsed < 0) return null;
    return parsed;
  }

  function readMinimumTurn(card) {
    const raw = readMinimumTurnRaw(card);
    if (raw === null || raw === "") return DEFAULTS.minimumTurn;
    const parsed = parseMinimumTurn(raw);
    return parsed === null ? DEFAULTS.minimumTurn : parsed;
  }

  function minimumTurnPacingScale(encounterPacing) {
    const key = normalize(encounterPacing);
    return MINIMUM_TURN_PACING_SCALE[key] !== undefined
      ? MINIMUM_TURN_PACING_SCALE[key]
      : MINIMUM_TURN_PACING_SCALE.moderate;
  }

  function calculateEffectiveMinimumTurn(baseMinimumTurn, encounterPacing) {
    const base = Number.isSafeInteger(baseMinimumTurn) && baseMinimumTurn >= 0
      ? baseMinimumTurn
      : 0;
    if (base === 0) return 0;
    return Math.max(1, Math.round(base * minimumTurnPacingScale(encounterPacing)));
  }

  function isValidPacingPreset(value) {
    return !!PACING_PRESETS[normalize(value)];
  }

  function getPacingPreset(value) {
    return PACING_PRESETS[normalize(value)] || PACING_PRESETS.slow;
  }

  function parsePositiveInteger(value, fallback, max) {
    const raw = String(value === undefined || value === null ? "" : value).trim();
    if (!/^\d+$/.test(raw)) return fallback;
    const parsed = Number(raw);
    if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
    if (max && parsed > max) return fallback;
    return parsed;
  }

  function buildConfigEntry(settings) {
    return [
      "================ SYSTEM ================",
      "",
      "- Enabled: " + (settings.enabled ? "true" : "false"),
      "- Maximum Encounter Cards: " + settings.maximumEncounterCards,
      "- Create Missing Encounter Cards: " + (settings.createMissingEncounterCards ? "true" : "false"),
      "- Use Advanced Settings: " + (settings.useAdvancedSettings ? "true" : "false"),
      "- Debug Logging: " + (settings.debugLogging ? "true" : "false"),
      "",
      "",
      "============== ENCOUNTERS ==============",
      "",
      "- Encounter Pacing: " + settings.encounterPacing,
      "",
      "",
      "============= GLOBAL DEFAULTS =============",
      "",
      "Changing these values overwrites the same setting on all encounter cards.",
      "",
      "- Rarity: " + settings.defaultRarity,
      "- Duration: " + settings.defaultDuration
    ].join("\n");
  }

  function currentConfigDescription() {
    return [
      "Random Encounter System v" + VERSION,
      "",
      "SYSTEM controls the script itself.",
      "Maximum Encounter Cards sets the highest RAND_## number the script manages.",
      "Create Missing Encounter Cards creates missing cards up to that maximum.",
      "Use Advanced Settings enables values from the Advanced RE Settings Story Card.",
      "",
      "ENCOUNTERS controls encounter pacing.",
      "Encounter Pacing: Very Fast, Fast, Moderate, Slow, Very Slow.",
      "",
      "GLOBAL DEFAULTS overwrite the same setting on all current encounter cards when changed.",
      "Rarity: Very Rare, Rare, Common, Very Common.",
      "Duration: Very Short, Short, Default, Long, Very Long.",
      "",
      "Debug-only pacing, rarity, and duration values remain internal."
    ].join("\n");
  }

  function defaultConfigSettings() {
    return {
      enabled: DEFAULTS.enabled,
      maximumEncounterCards: DEFAULTS.maximumEncounterCards,
      createMissingEncounterCards: DEFAULTS.createMissingEncounterCards,
      useAdvancedSettings: DEFAULTS.useAdvancedSettings,
      debugLogging: DEFAULTS.debugLogging,
      encounterPacing: DEFAULTS.encounterPacing,
      defaultRarity: DEFAULTS.rarity,
      defaultDuration: DEFAULTS.duration
    };
  }

  function migrateLegacyConfigEntry(entry) {
    const raw = parseColonLines(entry);
    if (raw["maximum encounter cards"] !== undefined) return entry;

    const settings = defaultConfigSettings();
    settings.enabled = parseBoolean(raw.enabled, settings.enabled);
    settings.encounterPacing = isValidPacingPreset(raw["encounter pacing"])
      ? PACING_PRESETS[normalize(raw["encounter pacing"])].name
      : settings.encounterPacing;
    settings.createMissingEncounterCards = parseBoolean(
      raw["create placeholder encounter cards"],
      settings.createMissingEncounterCards
    );
    settings.debugLogging = parseBoolean(raw["debug logging"], settings.debugLogging);

    const legacyRarity = raw["set global encounter rarity"] || raw["default encounter rarity"];
    if (legacyRarity && isValidEncounterWeight(legacyRarity)) {
      settings.defaultRarity = WEIGHT_PRESETS[normalize(legacyRarity)].name;
    }

    const legacyDuration = raw["set global retirement length"] || raw["default retirement length"];
    if (legacyDuration && isValidRetirementLength(legacyDuration)) {
      settings.defaultDuration = RETIREMENT_PRESETS[normalize(legacyDuration)].name;
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
    card.description = currentConfigDescription();

    const existingEntry = getCardEntry(card);
    const migrated = migrateLegacyConfigEntry(existingEntry);
    if (migrated !== existingEntry) setCardEntry(card, migrated);

    return card;
  }

  function advancedDescription() {
    return [
      "Advanced Random Encounter Settings",
      "",
      "WARNING",
      "",
      "These values control the internal timing and selection behavior of the Random Encounter System.",
      "",
      "Editing them is optional. Invalid values may cause the system to behave unpredictably.",
      "",
      "Invalid inputs use the original built-in value for that specific setting."
    ].join("\n");
  }

  function buildAdvancedEntry() {
    return [
      "================ PACING ================",
      "",
      "Very Fast",
      "- Minimum Interval: 6",
      "- Maximum Interval: 10",
      "",
      "Fast",
      "- Minimum Interval: 6",
      "- Maximum Interval: 20",
      "",
      "Moderate",
      "- Minimum Interval: 10",
      "- Maximum Interval: 30",
      "",
      "Slow",
      "- Minimum Interval: 30",
      "- Maximum Interval: 50",
      "",
      "Very Slow",
      "- Minimum Interval: 30",
      "- Maximum Interval: 90",
      "",
      "",
      "================ RARITY ================",
      "",
      "Very Rare",
      "- Weight: 1",
      "",
      "Rare",
      "- Weight: 2",
      "",
      "Common",
      "- Weight: 4",
      "",
      "Very Common",
      "- Weight: 8",
      "",
      "",
      "================ DURATION ================",
      "",
      "Values below are based on Moderate pacing; actual duration is adjusted by Encounter Pacing.",
      "",
      "Very Short",
      "- Turns: 7",
      "",
      "Short",
      "- Turns: 11",
      "",
      "Default",
      "- Turns: 18",
      "",
      "Long",
      "- Turns: 25",
      "",
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
    card.description = advancedDescription();
    if (!getCardEntry(card).trim()) setCardEntry(card, buildAdvancedEntry());
    return card;
  }

  function notifyInvalidSetting(label) {
    state.message = "[RE] " + label + " failed, using default values.";
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
    const pacing = JSON.parse(JSON.stringify(PACING_PRESETS));
    const rarity = JSON.parse(JSON.stringify(WEIGHT_PRESETS));
    const duration = JSON.parse(JSON.stringify(RETIREMENT_PRESETS));

    if (!useAdvanced) return { pacing: pacing, rarity: rarity, duration: duration };

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
      const original = WEIGHT_PRESETS[key];
      rarity[key].weight = readAdvancedNumber(advanced.rarity, key, "weight", original.weight, original.name + " Weight");
    });

    ["very short","short","default","long","very long"].forEach(function(key) {
      const originalModerate = RETIREMENT_PRESETS[key].turns.moderate;
      const customModerate = readAdvancedNumber(advanced.duration, key, "turns", originalModerate, RETIREMENT_PRESETS[key].name + " Duration");
      Object.keys(RETIREMENT_PRESETS[key].turns).forEach(function(pacingKey) {
        const builtIn = RETIREMENT_PRESETS[key].turns[pacingKey];
        duration[key].turns[pacingKey] = Math.max(1, Math.round(customModerate * (builtIn / originalModerate)));
      });
    });

    return { pacing: pacing, rarity: rarity, duration: duration };
  }

  function parseConfigEntry(entry) {
    const raw = parseColonLines(entry);
    const settings = defaultConfigSettings();

    settings.enabled = parseBoolean(raw.enabled, settings.enabled);
    settings.maximumEncounterCards = parsePositiveInteger(raw["maximum encounter cards"], settings.maximumEncounterCards, 100);
    settings.createMissingEncounterCards = parseBoolean(raw["create missing encounter cards"], settings.createMissingEncounterCards);
    settings.useAdvancedSettings = parseBoolean(raw["use advanced settings"], settings.useAdvancedSettings);
    settings.debugLogging = parseBoolean(raw["debug logging"], settings.debugLogging);

    const suppliedPacing = raw["encounter pacing"] || settings.encounterPacing;
    settings.encounterPacing = isValidPacingPreset(suppliedPacing)
      ? PACING_PRESETS[normalize(suppliedPacing)].name
      : DEFAULTS.encounterPacing;
    if (!isValidPacingPreset(suppliedPacing)) notifyInvalidSetting("Encounter Pacing");

    const suppliedRarity = raw.rarity || settings.defaultRarity;
    settings.defaultRarity = isValidEncounterWeight(suppliedRarity)
      ? WEIGHT_PRESETS[normalize(suppliedRarity)].name
      : DEFAULTS.rarity;
    if (!isValidEncounterWeight(suppliedRarity)) notifyInvalidSetting("Rarity");

    const suppliedDuration = raw.duration || settings.defaultDuration;
    settings.defaultDuration = isValidRetirementLength(suppliedDuration)
      ? RETIREMENT_PRESETS[normalize(suppliedDuration)].name
      : DEFAULTS.duration;
    if (!isValidRetirementLength(suppliedDuration)) notifyInvalidSetting("Duration");

    const runtime = buildRuntimePresets(settings.useAdvancedSettings);
    const pacingPreset = runtime.pacing[normalize(settings.encounterPacing)] || runtime.pacing.moderate;

    return {
      enabled: settings.enabled,
      maximumEncounterCards: settings.maximumEncounterCards,
      createMissingEncounterCards: settings.createMissingEncounterCards,
      useAdvancedSettings: settings.useAdvancedSettings,
      debugLogging: settings.debugLogging,
      encounterPacing: pacingPreset.name,
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

  function globalDefaultsSnapshot(config) {
    return {
      duration: config.defaultDuration,
      rarity: config.defaultRarity
    };
  }

  function applyGlobalDefaultChanges(config) {
    const s = state.randomEncounters;
    const current = globalDefaultsSnapshot(config);

    if (!s.globalDefaultsSnapshot) {
      s.globalDefaultsSnapshot = current;
      log("Global defaults initialized | Existing encounter custom settings preserved.");
      return;
    }

    const previous = s.globalDefaultsSnapshot;
    const durationChanged = normalize(previous.duration) !== normalize(current.duration);
    const rarityChanged = normalize(previous.rarity) !== normalize(current.rarity);
    if (!durationChanged && !rarityChanged) return;

    let updatedCards = 0;
    getAllEncounterCards(config).forEach(function(record) {
      const card = record.card;
      const metadata = readSystemMetadata(card);
      writeEncounterMetadata(card, {
        status: metadata.status,
        number: record.number,
        triggeredTurn: metadata.triggeredTurn,
        resolvedTurn: metadata.resolvedTurn,
        duration: durationChanged ? current.duration : readRetirementLength(card),
        rarity: rarityChanged ? current.rarity : readEncounterWeight(card),
        minimumTurn: readMinimumTurn(card)
      });
      updatedCards += 1;
    });

    if (durationChanged) log("Global Duration changed -> " + current.duration + " | Updated " + updatedCards + " encounter card(s). Active runtime durations remain locked.");
    if (rarityChanged) log("Global Rarity changed -> " + current.rarity + " | Updated encounter cards.");

    s.globalDefaultsSnapshot = current;
  }

  function historyDescription() {
    return [
      "Random Encounter System",
      "- Status: Script Managed",
      "- Max Entries: " + HISTORY_MAX_ENTRIES,
      "- Character Cap: " + HISTORY_MAX_CHARACTERS
    ].join("\n");
  }

  function ensureHistoryCard() {
    let card = findCardByKey(HISTORY_KEY);
    if (!card) {
      card = createCard({
        type: SETTINGS_HISTORY_TYPE,
        title: HISTORY_TITLE,
        keys: HISTORY_KEY,
        entry: HISTORY_TITLE,
        description: historyDescription()
      });
      return card;
    }
    card.type = SETTINGS_HISTORY_TYPE;
    card.title = HISTORY_TITLE;
    card.description = historyDescription();
    if (!getCardEntry(card).trim()) setCardEntry(card, HISTORY_TITLE);
    return card;
  }

  function parseHistoryEntries(card) {
    if (!card) return [];
    return getCardEntry(card)
      .split(/\r?\n/)
      .map(function(line) { return line.trim(); })
      .filter(function(line) {
        return /^-\s+.+?:\s+.+/.test(line);
      });
  }

  function trimHistoryEntries(entries) {
    let trimmed = entries.slice(-HISTORY_MAX_ENTRIES);
    while (trimmed.length) {
      const candidate = [HISTORY_TITLE].concat(trimmed).join("\n");
      if (candidate.length <= HISTORY_MAX_CHARACTERS) break;
      trimmed.shift();
    }
    return trimmed;
  }

  function appendEncounterHistory(record, resolution) {
    const historyCard = ensureHistoryCard();
    if (!historyCard) {
      log("Encounter history unavailable | Could not create/find history Story Card.");
      return false;
    }

    const encounterCard = getEncounterCard(record.number);
    const encounterTitle = encounterCard
      ? stripEncounterStatusEmoji(encounterCard.title)
      : (record.title || "Random Encounter " + formatEncounterNumber(record.number));

    const line = "- " + encounterTitle + ": " + cleanResolution(resolution);
    const entries = parseHistoryEntries(historyCard);
    entries.push(line);

    const trimmed = trimHistoryEntries(entries);
    setCardEntry(historyCard, [HISTORY_TITLE].concat(trimmed).join("\n"));
    log("Encounter history updated | entries=" + trimmed.length + " | added=" + encounterTitle);
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
      entries.join("\n") +
      "\n[END RANDOM ENCOUNTER HISTORY]";
  }

  function encounterCode(number) {
    return ENCOUNTER_PREFIX + formatEncounterNumber(number);
  }

  function encounterDefaultTitle(number) {
    return "Random Encounter " + formatEncounterNumber(number);
  }

  function stripEncounterStatusEmoji(title) {
    return String(title || "").replace(/^(?:📝|🗃️)\s*/, "").trim();
  }

  function updateEncounterTitleStatus(card, status) {
    if (!card) return;
    const base = stripEncounterStatusEmoji(card.title);
    const n = normalize(status);
    if (n === "active") card.title = "📝 " + base;
    else if (n === "retired") card.title = "🗃️ " + base;
    else card.title = base;
  }

  function readSystemMetadata(card) {
    const sections = splitEncounterNotes(card);
    const raw = parseColonLines(sections.systemLines.join("\n"));
    return {
      status: raw.status || "Available",
      triggeredTurn: raw["triggered turn"] !== undefined ? parseInt(raw["triggered turn"], 10) : null,
      resolvedTurn: raw["resolved turn"] !== undefined ? parseInt(raw["resolved turn"], 10) : null
    };
  }

  function writeEncounterMetadata(card, data) {
    if (!card) return false;

    let duration = data.duration || data.retirementLength || readRetirementLength(card) || DEFAULTS.duration;
    if (!isValidRetirementLength(duration)) duration = DEFAULTS.duration;
    duration = RETIREMENT_PRESETS[normalize(duration)].name;

    let rarity = data.rarity || data.encounterWeight || readEncounterWeight(card) || DEFAULTS.rarity;
    if (!isValidEncounterWeight(rarity)) rarity = DEFAULTS.rarity;
    rarity = WEIGHT_PRESETS[normalize(rarity)].name;

    let minimumTurn = data.minimumTurn;
    if (minimumTurn === undefined || minimumTurn === null) minimumTurn = readMinimumTurn(card);
    if (!Number.isSafeInteger(minimumTurn) || minimumTurn < 0) minimumTurn = DEFAULTS.minimumTurn;

    const extra = getUnknownUserSettings(card);
    const systemLines = [
      SYSTEM_HEADER,
      "",
      "- Status: " + (data.status || "Available"),
      "- Encounter Number: " + data.number
    ];
    if (data.triggeredTurn !== undefined && data.triggeredTurn !== null) systemLines.push("- Triggered Turn: " + data.triggeredTurn);
    if (data.resolvedTurn !== undefined && data.resolvedTurn !== null) systemLines.push("- Resolved Turn: " + data.resolvedTurn);

    const settingsLines = [
      SETTINGS_HEADER,
      "",
      BEHAVIOR_HEADER,
      "",
      "- Rarity: " + rarity,
      "- Duration: " + duration,
      "- Minimum Turn: " + minimumTurn
    ];
    extra.forEach(function(setting) { settingsLines.push("- " + setting); });

    card.description = systemLines.concat(["", ""], settingsLines).join("\n");
    updateEncounterTitleStatus(card, data.status || "Available");
    return true;
  }

  function defaultEncounterDescription(number, config) {
    const duration = config && config.defaultDuration ? config.defaultDuration : DEFAULTS.duration;
    const rarity = config && config.defaultRarity ? config.defaultRarity : DEFAULTS.rarity;

    return [
      SYSTEM_HEADER,
      "",
      "- Status: Available",
      "- Encounter Number: " + number,
      "",
      "",
      SETTINGS_HEADER,
      "",
      BEHAVIOR_HEADER,
      "",
      "- Rarity: " + rarity,
      "- Duration: " + duration,
      "- Minimum Turn: " + DEFAULTS.minimumTurn
    ].join("\n");
  }

  function createEncounterCard(number, config) {
    const code = encounterCode(number);
    const existing = findCardByKey(code);    if (existing) return existing;
    return createCard({
      type: ENCOUNTER_TYPE,
      title: encounterDefaultTitle(number),
      keys: code,
      entry: "[Define random encounter " + formatEncounterNumber(number) + " here.]",
      description: defaultEncounterDescription(number, config)
    });
  }

  function upgradeEncounterCard(card, number) {
    if (!card) return;
    card.type = ENCOUNTER_TYPE;
    const metadata = readSystemMetadata(card);

    const rawRetirement = readRetirementLengthRaw(card);
    let retirementLength = rawRetirement ? readRetirementLength(card) : DEFAULTS.duration;
    if (rawRetirement && !isValidRetirementLength(rawRetirement)) {
      log(encounterCode(number) + " | Invalid Duration \"" + rawRetirement + "\" | Using Default.");
      retirementLength = "Default";
    }

    const rawWeight = readEncounterWeightRaw(card);
    let encounterWeight = rawWeight ? readEncounterWeight(card) : DEFAULTS.rarity;
    if (rawWeight && !isValidEncounterWeight(rawWeight)) {
      log(encounterCode(number) + " | Invalid Rarity \"" + rawWeight + "\" | Using Common.");
      encounterWeight = "Common";
    }

    const rawMinimumTurn = readMinimumTurnRaw(card);
    let minimumTurn = rawMinimumTurn === null ? DEFAULTS.minimumTurn : parseMinimumTurn(rawMinimumTurn);
    if (minimumTurn === null) {
      log(encounterCode(number) + " | Invalid Minimum Turn \"" + rawMinimumTurn + "\" | Using 0.");
      minimumTurn = DEFAULTS.minimumTurn;
    }

    writeEncounterMetadata(card, {
      status: metadata.status,
      number: number,
      triggeredTurn: metadata.triggeredTurn,
      resolvedTurn: metadata.resolvedTurn,
      retirementLength: retirementLength,
      encounterWeight: encounterWeight,
      minimumTurn: minimumTurn
    });
  }

  function ensureEncounterCards(config) {
    for (let number = 1; number <= config.maximumEncounterCards; number++) {
      let card = findCardByKey(encounterCode(number));
      if (!card && config.createMissingEncounterCards) {
        card = createEncounterCard(number, config);
      }
      if (card) upgradeEncounterCard(card, number);
    }
  }

  function getEncounterCard(number) {
    return findCardByKey(encounterCode(number));
  }

  function getAllEncounterCards(config) {
    const records = [];
    const maximum = config && config.maximumEncounterCards ? config.maximumEncounterCards : DEFAULTS.maximumEncounterCards;
    for (let number = 1; number <= maximum; number++) {
      const card = getEncounterCard(number);
      if (card) records.push({ number: number, code: encounterCode(number), card: card });
    }
    return records;
  }

  function readEncounterStatus(card) {
    return readSystemMetadata(card).status;
  }

  function initializeState() {
    if (!state.randomEncounters) {
      state.randomEncounters = {
        version: VERSION,
        turn: 0,
        nextEncounterIn: null,
        pendingEncounter: null,
        activeEncounters: [],
        pendingResolutions: [],
        used: [],
        pendingInputTurn: false,
        historyLength: null,
        actionCountHigh: null,
        lastInjectedEncounter: null,
        pendingPacingChange: null,
        lastInvalidPacingValue: null,
        globalDefaultsSnapshot: null,
        currentTurnMarkers: { activation: [], retirement: [], reready: [] }
      };
    }
    const s = state.randomEncounters;
    if (typeof s.turn !== "number") s.turn = 0;
    if (s.nextEncounterIn === undefined) s.nextEncounterIn = null;
    if (!Array.isArray(s.activeEncounters)) s.activeEncounters = [];
    if (!Array.isArray(s.pendingResolutions)) s.pendingResolutions = [];
    if (!Array.isArray(s.used)) s.used = [];
    if (!s.currentTurnMarkers) s.currentTurnMarkers = { activation: [], retirement: [] };
    s.version = VERSION;
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

  function randomEncounterInterval(config) {
    return randomInteger(config.minTurns, config.maxTurns);
  }

  function getAvailableEncounters(config) {
    const s = state.randomEncounters;
    let blockedByMinimumTurn = 0;

    const available = getAllEncounterCards(config).filter(function(record) {
      if (s.used.includes(record.number)) return false;
      if (normalize(readEncounterStatus(record.card)) !== "available") return false;

      const baseMinimumTurn = readMinimumTurn(record.card);
      const effectiveMinimumTurn = calculateEffectiveMinimumTurn(baseMinimumTurn, config.encounterPacing);
      if (s.turn < effectiveMinimumTurn) {
        blockedByMinimumTurn += 1;
        return false;
      }

      record.baseMinimumTurn = baseMinimumTurn;
      record.effectiveMinimumTurn = effectiveMinimumTurn;
      return true;
    });

    if (blockedByMinimumTurn > 0) {
      log("Turn " + s.turn + " | Minimum Turn gate: " + blockedByMinimumTurn + " encounter(s) not yet eligible.");
    }

    return available;
  }

  function buildWeightedPool(available, config) {
    const presets = config && config.runtimePresets ? config.runtimePresets.rarity : WEIGHT_PRESETS;
    return available.map(function(record) {
      const weightName = readEncounterWeight(record.card);
      const preset = presets[normalize(weightName)] || presets.common;
      return {
        number: record.number,
        code: record.code,
        card: record.card,
        weightName: preset.name,
        weight: preset.weight,
        baseMinimumTurn: record.baseMinimumTurn !== undefined ? record.baseMinimumTurn : readMinimumTurn(record.card),
        effectiveMinimumTurn: record.effectiveMinimumTurn !== undefined ? record.effectiveMinimumTurn : 0
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
      triggeredTurn: encounter.triggeredTurn,
      resolvedTurn: s.turn,
      retirementLength: encounter.retirementLength,
      encounterWeight: encounter.encounterWeight,
      eventText: card ? getEncounterPrompt(card) : "",
      attempts: 0,
      lastAttemptTurn: null
    });
    log("Turn " + s.turn + " | Resolution queued for " + encounter.code);
  }

  function firstPendingResolution() {
    const s = state.randomEncounters;
    return s.pendingResolutions.length ? s.pendingResolutions[0] : null;
  }

  function retireDueEncounters(config) {
    const s = state.randomEncounters;
    const remaining = [];
    let retiredAny = false;

    for (let i = 0; i < s.activeEncounters.length; i++) {
      const encounter = s.activeEncounters[i];
      if (s.turn < encounter.resolveAfterTurn) {
        remaining.push(encounter);
        continue;
      }

      retiredAny = true;
      const card = getEncounterCard(encounter.number);
      if (card) {
        writeEncounterMetadata(card, {
          status: "Retired",
          number: encounter.number,
          triggeredTurn: encounter.triggeredTurn,
          resolvedTurn: s.turn,
          retirementLength: encounter.retirementLength,
          encounterWeight: encounter.encounterWeight
        });
      }
      s.currentTurnMarkers.retirement.push(encounter.number);
      queueResolution(encounter);
      log("Turn " + s.turn + " | Retired " + encounter.code);
    }

    s.activeEncounters = remaining;
    if (retiredAny) {
      s.nextEncounterIn = null;
      log("Turn " + s.turn + " | Encounter attempt ended. Next pacing interval will be rolled.");
    }

    return retiredAny;
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
    s.currentTurnMarkers = { activation: [], retirement: [] };
    s.lastInjectedEncounter = null;

    retireDueEncounters(config);

    if (s.pendingPacingChange) {
      const change = s.pendingPacingChange;
      log("Turn " + s.turn + " | Encounter pacing changed: " + change.from + " -> " + change.to);
      if (s.activeEncounters.length > 0) {
        s.nextEncounterIn = null;
        log("Turn " + s.turn + " | New pacing will apply to the next encounter countdown roll.");
        s.pendingPacingChange = null;
      } else {
        const interval = randomEncounterInterval(config);
        s.nextEncounterIn = interval;
        log("Turn " + s.turn + " | Encounter countdown rerolled: " + interval + " future turn(s).");
        s.pendingPacingChange = null;
        return;
      }
    }

    if (s.activeEncounters.length > 0) {
      s.nextEncounterIn = null;
      s.activeEncounters.forEach(function(active) {
        const remainingTurns = Math.max(0, active.resolveAfterTurn - s.turn);
        log("Turn " + s.turn + " | " + active.code + " active | Resolves in " + remainingTurns + " remaining turn(s).");
      });
      return;
    }

    if (s.pendingEncounter) return;

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

    s.pendingEncounter = {
      number: selected.number,
      code: selected.code,
      selectedTurn: s.turn,
      encounterWeight: selected.weightName,
      encounterWeightValue: selected.weight,
      minimumTurn: selected.baseMinimumTurn,
      effectiveMinimumTurn: selected.effectiveMinimumTurn
    };

    log("Turn " + s.turn + " | Selected " + selected.code + " | Rarity=" + selected.weightName + " | Weight=" + selected.weight + " | Minimum Turn=" + selected.baseMinimumTurn + " | Effective Minimum Turn=" + selected.effectiveMinimumTurn);
  }

  function buildEncounterPrompt(eventText) {
    return "\n\n[RANDOM ENCOUNTER]\n" +
      "A random encounter is becoming relevant to the current story. Begin introducing or setting up the following event when the current scene allows. " +
      "Do not abruptly interrupt ongoing dialogue or actions solely to force the event into this response. " +
      "If there is not yet a natural opening, establish only what fits and allow the encounter to develop over subsequent turns. " +
      "Adapt minor details as needed to fit the current setting and characters, but preserve the core event. " +
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
      "Do not mention random encounters, Story Cards, scripts, triggers, dice, or game mechanics.\n" +
      "[END ACTIVE RANDOM ENCOUNTER]";
  }

  function injectActiveEncounterReminder(contextText) {
    const s = state.randomEncounters;
    if (!s.activeEncounters.length) return contextText;
    for (let i=0;i<s.activeEncounters.length;i++) {
      const active=s.activeEncounters[i];
      if (s.lastInjectedEncounter && s.lastInjectedEncounter.number===active.number && s.lastInjectedEncounter.turn===s.turn) continue;
      const card=getEncounterCard(active.number);
      if (!card) continue;
      const eventText=getEncounterPrompt(card).trim();
      if (!eventText) continue;
      contextText += buildActiveEncounterPrompt(eventText);
    }
    return contextText;
  }

  function injectPendingEncounter(contextText, config) {
    const s = state.randomEncounters;
    const pending = s.pendingEncounter;
    if (!config.enabled || !pending) return contextText;

    const card = getEncounterCard(pending.number);
    if (!card) { s.pendingEncounter = null; return contextText; }

    const eventText = getEncounterPrompt(card).trim();
    if (!eventText) { s.pendingEncounter = null; return contextText; }

    let retirementLength = readRetirementLength(card);
    if (!isValidRetirementLength(retirementLength)) retirementLength = "Default";
    const retirementTurns = calculateRetirementTurns(retirementLength, config.encounterPacing, config);

    let encounterWeight = readEncounterWeight(card);
    if (!isValidEncounterWeight(encounterWeight)) encounterWeight = "Common";

    contextText += buildEncounterPrompt(eventText);

    if (!s.used.includes(pending.number)) s.used.push(pending.number);

    s.activeEncounters.push({
      number: pending.number,
      code: pending.code,
      triggeredTurn: s.turn,
      retirementLength: retirementLength,
      retirementTurns: retirementTurns,
      encounterWeight: encounterWeight,
      resolveAfterTurn: s.turn + retirementTurns,
      status: "active"
    });

    writeEncounterMetadata(card, {
      status: "Active",
      number: pending.number,
      triggeredTurn: s.turn,
      retirementLength: retirementLength,
      encounterWeight: encounterWeight
    });

    s.currentTurnMarkers.activation.push(pending.number);
    s.lastInjectedEncounter = { number: pending.number, code: pending.code, turn: s.turn };
    s.pendingEncounter = null;
    s.nextEncounterIn = null;

    log("Injected " + pending.code + " | Encounter Weight=" + encounterWeight + " | Minimum Turn=" + pending.minimumTurn + " | Effective Minimum Turn=" + pending.effectiveMinimumTurn + " | Duration=" + retirementLength + " | Pacing=" + config.encounterPacing + " | Retires in " + retirementTurns + " remaining turn(s).");

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
      "Classify what actually happened in the story. The first line of your response must be exactly one of these forms:\n" +
      "The encounter occurred: <one short factual past-tense summary of what actually happened>.\n" +
      "The encounter did not occur: <one short factual explanation that the event never actually entered the story>.\n\n" +
      "Use occurred only if the core encounter actually became part of the narrative. Hints, setup, reminders, or script instructions alone do not count. " +
      "Do not invent the encounter merely to classify it as occurred. The classification line must be one line, 25-350 characters, and end with punctuation.\n\n" +
      "After the classification line, insert one blank line and continue the story normally without discussing the classification. " +
      "The first line will be stored internally and removed before the player sees the response.\n" +
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

  function cleanResolution(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function classifyResolutionSentence(sentence) {
    const value=cleanResolution(sentence);
    if (/^The encounter occurred:\s+\S/i.test(value)) return "occurred";
    if (/^The encounter did not occur:\s+\S/i.test(value)) return "did_not_occur";
    return null;
  }

  function isValidResolutionSentence(sentence) {
    const value=cleanResolution(sentence);
    if (!classifyResolutionSentence(value)) return false;
    if (value.length<25 || value.length>350) return false;
    if (/[\r\n]/.test(value)) return false;
    if (/^["'“”‘’]/.test(value)) return false;
    if (!/[.!?]$/.test(value)) return false;
    return true;
  }

  function replaceRetirementMarkerWithReready(number) {
    const markers=state.randomEncounters.currentTurnMarkers;
    markers.retirement=(markers.retirement||[]).filter(function(n){return n!==number;});
    if (!Array.isArray(markers.reready)) markers.reready=[];
    if (!markers.reready.includes(number)) markers.reready.push(number);
  }

  function saveResolution(record,resolution) {
    const s=state.randomEncounters;
    const cleaned=cleanResolution(resolution);
    const classification=classifyResolutionSentence(cleaned);
    if (!classification || !isValidResolutionSentence(cleaned)) return false;
    const card=getEncounterCard(record.number);
    if (!card || !appendEncounterOutcome(card,cleaned)) return false;

    if (classification==="occurred") {
      writeEncounterMetadata(card,{status:"Retired",number:record.number,triggeredTurn:record.triggeredTurn,resolvedTurn:record.resolvedTurn,retirementLength:record.retirementLength,encounterWeight:record.encounterWeight});
      appendEncounterHistory(record,cleaned);
    } else {
      writeEncounterMetadata(card,{status:"Available",number:record.number,retirementLength:record.retirementLength,encounterWeight:record.encounterWeight});
      s.used=s.used.filter(function(number){return number!==record.number;});
      replaceRetirementMarkerWithReready(record.number);
    }
    s.pendingResolutions=s.pendingResolutions.filter(function(item){return item.code!==record.code;});
    log("Resolution captured for "+record.code+": "+cleaned);
    log("Outcome appended to Entry for "+record.code);
    return classification;
  }

  function captureResolutionSentence(outputText) {
    initializeState();
    const record=firstPendingResolution();
    const original=String(outputText||"");
    if (!record) return {text:original,classification:null};
    const match=original.match(/^\s*([^\r\n]+)(?:\r?\n|$)/);
    if (!match) { log("Resolution sentence not captured for "+record.code+" | No first line found | Request remains queued."); return {text:original,classification:null}; }
    const firstLine=cleanResolution(match[1]);
    if (!isValidResolutionSentence(firstLine)) { log("Resolution sentence not captured for "+record.code+" | First line failed validation | Request remains queued."); return {text:original,classification:null}; }
    const classification=saveResolution(record,firstLine);
    if (!classification) { log("Resolution sentence could not be saved for "+record.code+" | Request remains queued."); return {text:original,classification:null}; }
    let cleaned=original.slice(match[0].length);
    cleaned=cleaned.replace(/^\s*\r?\n/,"");
    return {text:cleaned,classification:classification};
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
    if (markers && Array.isArray(markers.retirement) && markers.retirement.length) {
      lines.push("🗃️ (" + markers.retirement.map(formatEncounterNumber).join(", ") + ")");
    }
    if (markers && Array.isArray(markers.reready) && markers.reready.length) {
      lines.push("💾 (" + markers.reready.map(formatEncounterNumber).join(", ") + ")");
    }
    if (!lines.length) return outputText;
    return lines.join("\n") + "\n\n" + outputText;
  }

  function processOutput(outputText) {
    const captured=captureResolutionSentence(outputText);
    let result=captured.text;
    if (captured.classification==="did_not_occur") result=cleanupLeadingNonOccurrenceEcho(result);
    result=applyOutputMarkers(result);
    return result;
  }

  function setConfigEnabled(enabled) {
    const card=ensureConfigCard();
    if (!card) return false;
    let entry=getCardEntry(card);
    if (/^\s*-?\s*Enabled\s*:/im.test(entry)) entry=entry.replace(/^\s*-?\s*Enabled\s*:\s*.*$/im,"- Enabled: "+(enabled?"true":"false"));
    else entry="- Enabled: "+(enabled?"true":"false")+"\n"+entry;
    setCardEntry(card,entry);
    return true;
  }

  function resetEncounter(number,config) {
    const card=getEncounterCard(number);
    if (!card) return false;
    writeEncounterMetadata(card,{status:"Available",number:number,retirementLength:config.defaultDuration,encounterWeight:config.defaultRarity,minimumTurn:readMinimumTurn(card)});
    const s=state.randomEncounters;
    s.used=s.used.filter(function(n){return n!==number;});
    s.activeEncounters=s.activeEncounters.filter(function(x){return x.number!==number;});
    s.pendingResolutions=s.pendingResolutions.filter(function(x){return x.number!==number;});
    if (s.pendingEncounter && s.pendingEncounter.number===number) s.pendingEncounter=null;
    if (s.lastInjectedEncounter && s.lastInjectedEncounter.number===number) s.lastInjectedEncounter=null;
    ["activation","retirement","reready"].forEach(function(k){s.currentTurnMarkers[k]=(s.currentTurnMarkers[k]||[]).filter(function(n){return n!==number;});});
    return true;
  }

  function queueSelectedEncounter(selected) {
    const s=state.randomEncounters;
    s.pendingEncounter={
      number:selected.number,
      code:selected.code,
      selectedTurn:s.turn,
      encounterWeight:selected.weightName,
      encounterWeightValue:selected.weight,
      minimumTurn:selected.baseMinimumTurn,
      effectiveMinimumTurn:selected.effectiveMinimumTurn
    };
    s.nextEncounterIn=null;
  }

  function selectSpecificEncounter(number,config) {
    const s=state.randomEncounters;
    const card=getEncounterCard(number);
    if (!card) return {error:encounterCode(number)+" does not exist."};
    if (s.used.includes(number) || normalize(readEncounterStatus(card))!=="available") {
      return {error:encounterCode(number)+" is not Available."};
    }

    const baseMinimumTurn=readMinimumTurn(card);
    const effectiveMinimumTurn=calculateEffectiveMinimumTurn(baseMinimumTurn,config.encounterPacing);
    if (s.turn<effectiveMinimumTurn) {
      return {error:encounterCode(number)+" is not yet eligible. Effective Minimum Turn: "+effectiveMinimumTurn+"."};
    }

    const weightName=readEncounterWeight(card);
    const rarityPresets=config.runtimePresets ? config.runtimePresets.rarity : WEIGHT_PRESETS;
    const preset=rarityPresets[normalize(weightName)]||rarityPresets.common;
    return {
      selected:{
        number:number,
        code:encounterCode(number),
        card:card,
        weightName:preset.name,
        weight:preset.weight,
        baseMinimumTurn:baseMinimumTurn,
        effectiveMinimumTurn:effectiveMinimumTurn
      }
    };
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
    if (lower==="help") message="Random Encounters commands: /RE on, /RE off, /RE start, /RE start #, /RE end, /RE stop, /RE reset #, /RE reset all";
    else if (lower==="on") { setConfigEnabled(true); message="Random Encounters enabled."; }
    else if (lower==="off") { setConfigEnabled(false); message="Random Encounters disabled."; }
    else if (lower==="start") {
      if (s.activeEncounters.length) message="A random encounter is already active.";
      else if (s.pendingEncounter) message="A random encounter is already queued.";
      else {
        const selected=selectRandomEncounter(config);
        if (!selected) message="No eligible random encounters are available.";
        else {
          queueSelectedEncounter(selected);
          message="Random encounter "+selected.code+" queued for the next story action.";
        }
      }
    } else if (/^start\s+\d+$/.test(lower)) {
      if (s.activeEncounters.length) message="A random encounter is already active.";
      else if (s.pendingEncounter) message="A random encounter is already queued.";
      else {
        const number=parseInt(lower.match(/^start\s+(\d+)$/)[1],10);
        if (number<1 || number>config.maximumEncounterCards) message="Encounter number must be between 1 and "+config.maximumEncounterCards+".";
        else {
          const result=selectSpecificEncounter(number,config);
          if (result.error) message=result.error;
          else {
            queueSelectedEncounter(result.selected);
            message="Random encounter "+result.selected.code+" queued for the next story action.";
          }
        }
      }
    } else if (lower==="end" || lower==="stop") {
      if (!s.activeEncounters.length) message="No random encounter is currently active.";
      else {
        const active=s.activeEncounters.slice(); s.activeEncounters=[];
        active.forEach(function(encounter){
          const card=getEncounterCard(encounter.number);
          if (card) writeEncounterMetadata(card,{status:"Retired",number:encounter.number,triggeredTurn:encounter.triggeredTurn,resolvedTurn:s.turn,retirementLength:encounter.retirementLength,encounterWeight:encounter.encounterWeight});
          s.currentTurnMarkers.retirement.push(encounter.number); queueResolution(encounter);
        }); s.nextEncounterIn=null;
        message="Active random encounter ended; resolution queued.";
      }
    } else if (lower==="reset all") {
      getAllEncounterCards(config).forEach(function(record){resetEncounter(record.number,config);});
      s.used=[]; s.activeEncounters=[]; s.pendingResolutions=[]; s.pendingEncounter=null; s.lastInjectedEncounter=null; s.nextEncounterIn=null; s.currentTurnMarkers={activation:[],retirement:[],reready:[]};
      message="All existing random encounter cards reset to Available.";
    } else {
      const rm=lower.match(/^reset\s+(\d+)$/);
      if (rm) {
        const number=parseInt(rm[1],10);
        if (number<1 || number>config.maximumEncounterCards) message="Encounter number must be between 1 and "+config.maximumEncounterCards+".";
        else if (!resetEncounter(number,config)) message=encounterCode(number)+" does not exist.";
        else message=encounterCode(number)+" reset to Available.";
      } else message="Unknown Random Encounters command. Use /RE help.";
    }
    state.message=message;
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

  function maintenance() {
    initializeState();
    const s = state.randomEncounters;
    const oldConfig = s.config || null;
    const config = loadConfig();
    s.config = config;
    detectConfigChanges(oldConfig, config);
        if (config.useAdvancedSettings) ensureAdvancedCard();
    ensureEncounterCards(config);
    ensureHistoryCard();
    applyGlobalDefaultChanges(config);
    log(
      "Config | enabled=" + config.enabled +
      " | maxCards=" + config.maximumEncounterCards +
      " | createMissing=" + config.createMissingEncounterCards +
      " | advanced=" + config.useAdvancedSettings +
      " | pacing=" + config.encounterPacing +
      " | interval=" + config.minTurns + "-" + config.maxTurns +
      " | defaultDuration=" + config.defaultDuration +
      " | defaultRarity=" + config.defaultRarity
    );
    return config;
  }

  const normalizedHook = normalize(hook);

  if (normalizedHook === "input") {
    const commandResult=handleControlCommand(text);
    if (commandResult!==null) return commandResult;
    markInputTurn();
    return text;
  }

  if (normalizedHook === "context") {
    initializeState();
    if (state.randomEncounters.pendingControlCommand) return injectControlCommandContext(text);
    const config=maintenance();
    const advanced=detectTurnAdvance();
    if (advanced) {
      processNewTurn(config);
      let result=injectPendingEncounter(text,config);
      result=injectActiveEncounterReminder(result);
      result=injectEncounterHistory(result);
      result=injectResolutionRequest(result,true);
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
    if (control!==null) return control;
    return processOutput(text);
  }

  return {
    API: {
      ensureConfigCard: ensureConfigCard,
      loadConfig: loadConfig,
      findCardByKey: findCardByKey,
      getEncounterCard: getEncounterCard,
      getAllEncounterCards: getAllEncounterCards,
      getAvailableEncounters: getAvailableEncounters,
      createEncounterCard: createEncounterCard,
      getEncounterPrompt: getEncounterPrompt,
      appendEncounterOutcome: appendEncounterOutcome,
      readRetirementLength: readRetirementLength,
      calculateRetirementTurns: calculateRetirementTurns,
      readEncounterWeight: readEncounterWeight,
      encounterWeightValue: encounterWeightValue,
      readMinimumTurn: readMinimumTurn,
      calculateEffectiveMinimumTurn: calculateEffectiveMinimumTurn,
      ensureHistoryCard: ensureHistoryCard,
      applyGlobalDefaultChanges: applyGlobalDefaultChanges,
      appendEncounterHistory: appendEncounterHistory,
      injectEncounterHistory: injectEncounterHistory,
      readEncounterStatus: readEncounterStatus,
      writeEncounterMetadata: writeEncounterMetadata,
      updateEncounterTitleStatus: updateEncounterTitleStatus,
      selectRandomEncounter: selectRandomEncounter,
      detectTurnAdvance: detectTurnAdvance
    }
  };
}