/*
 * Random Encounters
 * Version 0.16.0
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
 * - Pacing-scaled Retirement Length
 * - Resolution capture and per-encounter Outcome storage
 * - Compact encounter history injection
 * - Retry-safe turn detection
 * - Active -> retirement -> cooldown -> next countdown lifecycle
 */

function RandomEncounters(hook, text) {
  "use strict";

  const VERSION = "0.16.0";
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
    encounterPacing: "Debug",
    retirementLength: "Default",
    encounterWeight: "Common",
    effectiveMinimumTurn: 2,
    minimumTurn: 0,
    cooldownTurns: 3,
    createPlaceholderEncounterCards: false,
    debugLogging: true,
    encounterCount: 20
  };

  const CONFIG_TITLE = "Configure Random Encounters";
  const CONFIG_KEY = "random encounter settings";
  const HISTORY_TITLE = "Random Encounter History";
  const HISTORY_KEY = "random encounter history";
  const HISTORY_MAX_ENTRIES = 12;
  const HISTORY_MAX_CHARACTERS = 3000;
  const ENCOUNTER_PREFIX = "RAND_";
  const SETTINGS_HEADER = "Random Encounter Settings";
  const SYSTEM_HEADER = "Random Encounter System";
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
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const n = normalize(line);
      if (n === normalize(SETTINGS_HEADER)) { section = "settings"; continue; }
      if (n === normalize(SYSTEM_HEADER)) { section = "system"; continue; }
      if (section === "settings") settingsLines.push(line);
      else if (section === "system") systemLines.push(line);
    }
    return { settingsLines, systemLines };
  }

  function getUnknownUserSettings(card) {
    return splitEncounterNotes(card).settingsLines
      .map(function(line) { return line.trim(); })
      .filter(function(line) {
        if (!line) return false;
        const clean = line.replace(/^-\s*/, "");
        return !/^Retirement\s+Length\s*:/i.test(clean) && !/^Encounter\s+Weight\s*:/i.test(clean) && !/^Minimum\s+Turn\s*:/i.test(clean);
      })
      .map(function(line) { return line.replace(/^-\s*/, ""); });
  }

  function isValidRetirementLength(value) {
    return !!RETIREMENT_PRESETS[normalize(value)];
  }

  function readRetirementLengthRaw(card) {
    if (!card) return null;
    const match = String(card.description || "").match(/^\s*-?\s*Retirement\s+Length\s*:\s*(.+)$/im);
    return match ? match[1].trim() : null;
  }

  function readRetirementLength(card) {
    const supplied = readRetirementLengthRaw(card);
    if (!supplied) return DEFAULTS.retirementLength;
    const preset = RETIREMENT_PRESETS[normalize(supplied)];
    return preset ? preset.name : "Default";
  }

  function retirementPacingKey(encounterPacing) {
    const n = normalize(encounterPacing);
    if (n === "debug") return "very fast";
    if (["very fast", "fast", "moderate", "slow", "very slow"].includes(n)) return n;
    return "moderate";
  }

  function calculateRetirementTurns(retirementLength, encounterPacing) {
    const preset = RETIREMENT_PRESETS[normalize(retirementLength)] || RETIREMENT_PRESETS.default;
    if (preset.fixedTurns !== undefined) return preset.fixedTurns;
    return preset.turns[retirementPacingKey(encounterPacing)];
  }

  function isValidEncounterWeight(value) {
    return !!WEIGHT_PRESETS[normalize(value)];
  }

  function readEncounterWeightRaw(card) {
    if (!card) return null;
    const match = String(card.description || "").match(/^\s*-?\s*Encounter\s+Weight\s*:\s*(.+)$/im);
    return match ? match[1].trim() : null;
  }

  function readEncounterWeight(card) {
    const supplied = readEncounterWeightRaw(card);
    if (!supplied) return DEFAULTS.encounterWeight;
    const preset = WEIGHT_PRESETS[normalize(supplied)];
    return preset ? preset.name : DEFAULTS.encounterWeight;
  }

  function encounterWeightValue(card) {
    const preset = WEIGHT_PRESETS[normalize(readEncounterWeight(card))] || WEIGHT_PRESETS.common;
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

  function buildConfigEntry(settings) {
    return [
      "Edit the values below to configure random encounters.",
      "- Enabled: " + (settings.enabled ? "true" : "false"),
      "- Encounter Pacing: " + settings.encounterPacing,
      "- Create Placeholder Encounter Cards: " + (settings.createPlaceholderEncounterCards ? "true" : "false"),
      "- Debug Logging: " + (settings.debugLogging ? "true" : "false"),
      "Global Defaults - Changes Override Current Encounter Settings",
      "- Set Global Retirement Length: " + settings.defaultRetirementLength,
      "- Set Global Effective Minimum Turn: " + settings.defaultEffectiveMinimumTurn,
      "- Set Global Encounter Rarity: " + settings.defaultEncounterRarity,
      "- Set Global Cooldown Turn: " + settings.defaultCooldownTurn
    ].join("\n");
  }

  function currentConfigDescription() {
    return [
      "Random Encounter System v" + VERSION,
      "",
      "Top-level controls configure the encounter system.",
      "Global Defaults are change-driven overrides: after the first load, editing a Set Global value updates all current encounter Story Cards where applicable.",
      "Existing per-card custom settings are preserved on first load.",
      "",
      "Enabled: true / false.",
      "Encounter Pacing: Very Fast, Fast, Moderate, Slow, Very Slow.",
      "Create Placeholder Encounter Cards: creates missing RAND_01 through RAND_20 cards when true.",
      "Debug Logging: writes Random Encounter diagnostics to the console when true.",
      "",
      "Set Global Retirement Length: Very Short, Short, Default, Long, Very Long.",
      "Changing it overwrites Retirement Length on all encounter Story Cards. Active encounters keep their already-locked runtime retirement duration.",
      "",
      "Set Global Effective Minimum Turn: non-negative whole number.",
      "Changing it writes that same numeric Minimum Turn value directly to all encounter Story Cards.",
      "At runtime, Encounter Pacing scales the stored Minimum Turn for eligibility: Very Fast 40%, Fast 65%, Moderate 100%, Slow 200%, Very Slow 300%. Debug uses 10%.",
      "A stored Minimum Turn of 0 remains immediately eligible. Any positive Minimum Turn always resolves to at least effective Turn 1.",
      "",
      "Set Global Encounter Rarity: Very Rare, Rare, Common, Very Common.",
      "Changing it overwrites Encounter Weight on all encounter Story Cards.",
      "",
      "Set Global Cooldown Turn: non-negative whole number.",
      "This controls the cooldown applied when an encounter retires. Existing cooldowns already in progress are not recalculated.",
      "",
      "Encounter History keeps the 12 most recent resolved outcomes, capped at 3000 characters, and uses encounter Story Card titles in its Entry."
    ].join("\n");
  }

  function defaultConfigSettings() {
    return {
      enabled: DEFAULTS.enabled,
      encounterPacing: DEFAULTS.encounterPacing,
      createPlaceholderEncounterCards: DEFAULTS.createPlaceholderEncounterCards,
      debugLogging: DEFAULTS.debugLogging,
      defaultRetirementLength: DEFAULTS.retirementLength,
      defaultEffectiveMinimumTurn: DEFAULTS.effectiveMinimumTurn,
      defaultEncounterRarity: DEFAULTS.encounterWeight,
      defaultCooldownTurn: DEFAULTS.cooldownTurns
    };
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
    if (/^- Default (?:Retirement Length|Effective Minimum Turn|Encounter Rarity|Cooldown Turn):/m.test(existingEntry)) {
      const migrated = existingEntry
        .replace(/^- Default Retirement Length:/m, "- Set Global Retirement Length:")
        .replace(/^- Default Effective Minimum Turn:/m, "- Set Global Effective Minimum Turn:")
        .replace(/^- Default Encounter Rarity:/m, "- Set Global Encounter Rarity:")
        .replace(/^- Default Cooldown Turn:/m, "- Set Global Cooldown Turn:");
      setCardEntry(card, migrated);
    }

    return card;
  }

  function parseConfigEntry(entry) {
    const raw = parseColonLines(entry);

    const suppliedPacing = raw["encounter pacing"] || DEFAULTS.encounterPacing;
    const pacingValid = isValidPacingPreset(suppliedPacing);
    const preset = getPacingPreset(suppliedPacing);

    const suppliedRetirement = raw["set global retirement length"] || raw["default retirement length"] || DEFAULTS.retirementLength;
    const retirementValid = isValidRetirementLength(suppliedRetirement);
    const retirementPreset = retirementValid
      ? RETIREMENT_PRESETS[normalize(suppliedRetirement)].name
      : DEFAULTS.retirementLength;

    const suppliedRarity = raw["set global encounter rarity"] || raw["default encounter rarity"] || DEFAULTS.encounterWeight;
    const rarityValid = isValidEncounterWeight(suppliedRarity);
    const rarityPreset = rarityValid
      ? WEIGHT_PRESETS[normalize(suppliedRarity)].name
      : DEFAULTS.encounterWeight;

    const rawEffectiveMinimum = raw["set global effective minimum turn"] !== undefined
      ? raw["set global effective minimum turn"]
      : raw["default effective minimum turn"];
    const parsedEffectiveMinimum = rawEffectiveMinimum === undefined
      ? DEFAULTS.effectiveMinimumTurn
      : parseMinimumTurn(rawEffectiveMinimum);
    const effectiveMinimumValid = parsedEffectiveMinimum !== null;

    const rawCooldown = raw["set global cooldown turn"] !== undefined
      ? raw["set global cooldown turn"]
      : raw["default cooldown turn"];
    const parsedCooldown = rawCooldown === undefined
      ? DEFAULTS.cooldownTurns
      : parseMinimumTurn(rawCooldown);
    const cooldownValid = parsedCooldown !== null;

    return {
      enabled: parseBoolean(raw.enabled, DEFAULTS.enabled),
      encounterPacing: preset.name,
      minTurns: preset.minTurns,
      maxTurns: preset.maxTurns,
      invalidPacingValue: pacingValid ? null : suppliedPacing,
      createPlaceholderEncounterCards: parseBoolean(
        raw["create placeholder encounter cards"],
        DEFAULTS.createPlaceholderEncounterCards
      ),
      debugLogging: parseBoolean(raw["debug logging"], DEFAULTS.debugLogging),
      defaultRetirementLength: retirementPreset,
      invalidDefaultRetirementLength: retirementValid ? null : suppliedRetirement,
      defaultEffectiveMinimumTurn: effectiveMinimumValid
        ? parsedEffectiveMinimum
        : DEFAULTS.effectiveMinimumTurn,
      invalidDefaultEffectiveMinimumTurn: effectiveMinimumValid ? null : rawEffectiveMinimum,
      defaultEncounterRarity: rarityPreset,
      invalidDefaultEncounterRarity: rarityValid ? null : suppliedRarity,
      defaultCooldownTurn: cooldownValid ? parsedCooldown : DEFAULTS.cooldownTurns,
      invalidDefaultCooldownTurn: cooldownValid ? null : rawCooldown,
      cooldownTurns: cooldownValid ? parsedCooldown : DEFAULTS.cooldownTurns
    };
  }

  function correctInvalidConfigCard(card, config) {
    if (!card) return;
    let changed = false;

    if (config.invalidPacingValue) {
      const slow = PACING_PRESETS.slow;
      log("Invalid Encounter Pacing \"" + config.invalidPacingValue + "\" | Using Slow and correcting config Story Card.");
      config.encounterPacing = slow.name;
      config.minTurns = slow.minTurns;
      config.maxTurns = slow.maxTurns;
      changed = true;
    }

    if (config.invalidDefaultRetirementLength) {
      log("Invalid Set Global Retirement Length \"" + config.invalidDefaultRetirementLength + "\" | Using Default.");
      config.defaultRetirementLength = DEFAULTS.retirementLength;
      changed = true;
    }

    if (config.invalidDefaultEffectiveMinimumTurn !== null && config.invalidDefaultEffectiveMinimumTurn !== undefined) {
      log("Invalid Set Global Effective Minimum Turn \"" + config.invalidDefaultEffectiveMinimumTurn + "\" | Using " + DEFAULTS.effectiveMinimumTurn + ".");
      config.defaultEffectiveMinimumTurn = DEFAULTS.effectiveMinimumTurn;
      changed = true;
    }

    if (config.invalidDefaultEncounterRarity) {
      log("Invalid Set Global Encounter Rarity \"" + config.invalidDefaultEncounterRarity + "\" | Using Common.");
      config.defaultEncounterRarity = DEFAULTS.encounterWeight;
      changed = true;
    }

    if (config.invalidDefaultCooldownTurn !== null && config.invalidDefaultCooldownTurn !== undefined) {
      log("Invalid Set Global Cooldown Turn \"" + config.invalidDefaultCooldownTurn + "\" | Using " + DEFAULTS.cooldownTurns + ".");
      config.defaultCooldownTurn = DEFAULTS.cooldownTurns;
      config.cooldownTurns = DEFAULTS.cooldownTurns;
      changed = true;
    }

    if (changed) {
      setCardEntry(card, buildConfigEntry(config));
    }
  }

  function loadConfig() {
    const card = ensureConfigCard();
    if (!card) {
      const preset = PACING_PRESETS.debug;
      const fallback = defaultConfigSettings();
      return {
        enabled: fallback.enabled,
        encounterPacing: preset.name,
        minTurns: preset.minTurns,
        maxTurns: preset.maxTurns,
        invalidPacingValue: null,
        createPlaceholderEncounterCards: fallback.createPlaceholderEncounterCards,
        debugLogging: fallback.debugLogging,
        defaultRetirementLength: fallback.defaultRetirementLength,
        invalidDefaultRetirementLength: null,
        defaultEffectiveMinimumTurn: fallback.defaultEffectiveMinimumTurn,
        invalidDefaultEffectiveMinimumTurn: null,
        defaultEncounterRarity: fallback.defaultEncounterRarity,
        invalidDefaultEncounterRarity: null,
        defaultCooldownTurn: fallback.defaultCooldownTurn,
        invalidDefaultCooldownTurn: null,
        cooldownTurns: fallback.defaultCooldownTurn
      };
    }

    const config = parseConfigEntry(getCardEntry(card));
    correctInvalidConfigCard(card, config);
    return config;
  }

  function globalDefaultsSnapshot(config) {
    return {
      retirementLength: config.defaultRetirementLength,
      effectiveMinimumTurn: config.defaultEffectiveMinimumTurn,
      encounterRarity: config.defaultEncounterRarity,
      cooldownTurn: config.defaultCooldownTurn
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
    const retirementChanged = normalize(previous.retirementLength) !== normalize(current.retirementLength);
    const minimumChanged = previous.effectiveMinimumTurn !== current.effectiveMinimumTurn;
    const rarityChanged = normalize(previous.encounterRarity) !== normalize(current.encounterRarity);
    const cooldownChanged = previous.cooldownTurn !== current.cooldownTurn;

    if (!retirementChanged && !minimumChanged && !rarityChanged && !cooldownChanged) {
      return;
    }


    let updatedCards = 0;
    getAllEncounterCards().forEach(function(record) {
      const card = record.card;
      const metadata = readSystemMetadata(card);
      const values = {
        status: metadata.status,
        number: record.number,
        triggeredTurn: metadata.triggeredTurn,
        resolvedTurn: metadata.resolvedTurn,
        retirementLength: retirementChanged
          ? current.retirementLength
          : readRetirementLength(card),
        encounterWeight: rarityChanged
          ? current.encounterRarity
          : readEncounterWeight(card),
        minimumTurn: minimumChanged
          ? current.effectiveMinimumTurn
          : readMinimumTurn(card)
      };

      if (retirementChanged || minimumChanged || rarityChanged) {
        writeEncounterMetadata(card, values);
        updatedCards += 1;
      }
    });

    if (retirementChanged) {
      log("Global Retirement Length changed -> " + current.retirementLength + " | Updated " + updatedCards + " encounter card(s). Active runtime retirement durations remain locked.");
    }
    if (minimumChanged) {
      log("Global Minimum Turn changed -> " + current.effectiveMinimumTurn + " | Stored Minimum Turn=" + current.effectiveMinimumTurn + " | Runtime pacing scale=" + minimumTurnPacingScale(config.encounterPacing) + ".");
    }
    if (rarityChanged) {
      log("Global Encounter Rarity changed -> " + current.encounterRarity + " | Updated encounter cards.");
    }
    if (cooldownChanged) {
      log("Global Cooldown Turn changed -> " + current.cooldownTurn + ". New retirements will use the new cooldown.");
    }

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

    let retirementLength = data.retirementLength || readRetirementLength(card) || DEFAULTS.retirementLength;
    if (!isValidRetirementLength(retirementLength)) retirementLength = "Default";
    retirementLength = RETIREMENT_PRESETS[normalize(retirementLength)].name;

    let encounterWeight = data.encounterWeight || readEncounterWeight(card) || DEFAULTS.encounterWeight;
    if (!isValidEncounterWeight(encounterWeight)) encounterWeight = DEFAULTS.encounterWeight;
    encounterWeight = WEIGHT_PRESETS[normalize(encounterWeight)].name;

    let minimumTurn = data.minimumTurn;
    if (minimumTurn === undefined || minimumTurn === null) minimumTurn = readMinimumTurn(card);
    if (!Number.isSafeInteger(minimumTurn) || minimumTurn < 0) minimumTurn = DEFAULTS.minimumTurn;

    const extra = getUnknownUserSettings(card);
    const settingsLines = [
      SETTINGS_HEADER,
      "- Retirement Length: " + retirementLength,
      "- Encounter Weight: " + encounterWeight,
      "- Minimum Turn: " + minimumTurn
    ];
    extra.forEach(function(setting) { settingsLines.push("- " + setting); });

    const systemLines = [
      SYSTEM_HEADER,
      "- Status: " + (data.status || "Available"),
      "- Encounter Number: " + data.number
    ];
    if (data.triggeredTurn !== undefined && data.triggeredTurn !== null) systemLines.push("- Triggered Turn: " + data.triggeredTurn);
    if (data.resolvedTurn !== undefined && data.resolvedTurn !== null) systemLines.push("- Resolved Turn: " + data.resolvedTurn);

    card.description = settingsLines.concat([""], systemLines).join("\n");
    updateEncounterTitleStatus(card, data.status || "Available");
    return true;
  }

  function defaultEncounterDescription(number, config) {
    const retirementLength = config && config.defaultRetirementLength
      ? config.defaultRetirementLength
      : DEFAULTS.retirementLength;
    const encounterWeight = config && config.defaultEncounterRarity
      ? config.defaultEncounterRarity
      : DEFAULTS.encounterWeight;
    const minimumTurn = config && Number.isSafeInteger(config.defaultEffectiveMinimumTurn)
      ? config.defaultEffectiveMinimumTurn
      : DEFAULTS.effectiveMinimumTurn;

    return [
      SETTINGS_HEADER,
      "- Retirement Length: " + retirementLength,
      "- Encounter Weight: " + encounterWeight,
      "- Minimum Turn: " + minimumTurn,
      "",
      SYSTEM_HEADER,
      "- Status: Available",
      "- Encounter Number: " + number
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
    let retirementLength = rawRetirement ? readRetirementLength(card) : DEFAULTS.retirementLength;
    if (rawRetirement && !isValidRetirementLength(rawRetirement)) {
      log(encounterCode(number) + " | Invalid Retirement Length \"" + rawRetirement + "\" | Using Default.");
      retirementLength = "Default";
    }

    const rawWeight = readEncounterWeightRaw(card);
    let encounterWeight = rawWeight ? readEncounterWeight(card) : DEFAULTS.encounterWeight;
    if (rawWeight && !isValidEncounterWeight(rawWeight)) {
      log(encounterCode(number) + " | Invalid Encounter Weight \"" + rawWeight + "\" | Using Common.");
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
    for (let number = 1; number <= DEFAULTS.encounterCount; number++) {
      let card = findCardByKey(encounterCode(number));
      if (!card && config.createPlaceholderEncounterCards) {
        card = createEncounterCard(number, config);
      }
      if (card) upgradeEncounterCard(card, number);
    }
  }

  function getEncounterCard(number) {
    return findCardByKey(encounterCode(number));
  }

  function getAllEncounterCards() {
    const records = [];
    for (let number = 1; number <= DEFAULTS.encounterCount; number++) {
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
        cooldownRemaining: 0,
        cooldownStartedThisTurn: false,
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
    if (typeof s.cooldownRemaining !== "number") s.cooldownRemaining = 0;
    if (s.cooldownStartedThisTurn === undefined) s.cooldownStartedThisTurn = false;
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

    const available = getAllEncounterCards().filter(function(record) {
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

  function buildWeightedPool(available) {
    return available.map(function(record) {
      const weightName = readEncounterWeight(record.card);
      const preset = WEIGHT_PRESETS[normalize(weightName)] || WEIGHT_PRESETS.common;
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

    const pool = buildWeightedPool(available);
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
      s.cooldownRemaining = config.cooldownTurns;
      s.cooldownStartedThisTurn = true;
      s.nextEncounterIn = null;
      log("Turn " + s.turn + " | On cooldown for " + s.cooldownRemaining + " remaining turn(s).");
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

  function reportInvalidPacing(config) {
    const s = state.randomEncounters;
    if (!config.invalidPacingValue) { s.lastInvalidPacingValue = null; return; }
    if (s.lastInvalidPacingValue === config.invalidPacingValue) return;
    log("Invalid Encounter Pacing \"" + config.invalidPacingValue + "\" | Using Slow and correcting config Story Card.");
    s.lastInvalidPacingValue = config.invalidPacingValue;
  }

  function processNewTurn(config) {
    const s = state.randomEncounters;
    if (!config.enabled) { log("System disabled."); return; }

    s.turn += 1;
    s.currentTurnMarkers = { activation: [], retirement: [] };
    s.lastInjectedEncounter = null;
    s.cooldownStartedThisTurn = false;

    retireDueEncounters(config);

    if (s.pendingPacingChange) {
      const change = s.pendingPacingChange;
      log("Turn " + s.turn + " | Encounter pacing changed: " + change.from + " -> " + change.to);
      if (s.activeEncounters.length > 0 || s.cooldownRemaining > 0) {
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
        log("Turn " + s.turn + " | " + active.code + " active | Retires in " + remainingTurns + " remaining turn(s).");
      });
      return;
    }

    if (s.cooldownRemaining > 0) {
      if (s.cooldownStartedThisTurn) return;
      s.cooldownRemaining -= 1;
      if (s.cooldownRemaining > 0) {
        log("Turn " + s.turn + " | Cooldown: " + s.cooldownRemaining + " remaining turn(s).");
        return;
      }
      s.cooldownRemaining = 0;
      log("Turn " + s.turn + " | Cooldown complete.");
      const interval = randomEncounterInterval(config);
      s.nextEncounterIn = interval;
      log("Turn " + s.turn + " | Next encounter countdown rolled: " + interval + " future turn(s).");
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

    log("Turn " + s.turn + " | Selected " + selected.code + " | Encounter Weight=" + selected.weightName + " | Weight=" + selected.weight + " | Minimum Turn=" + selected.baseMinimumTurn + " | Effective Minimum Turn=" + selected.effectiveMinimumTurn);
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
    const retirementTurns = calculateRetirementTurns(retirementLength, config.encounterPacing);

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

    log("Injected " + pending.code + " | Encounter Weight=" + encounterWeight + " | Minimum Turn=" + pending.minimumTurn + " | Effective Minimum Turn=" + pending.effectiveMinimumTurn + " | Retirement Length=" + retirementLength + " | Pacing=" + config.encounterPacing + " | Retires in " + retirementTurns + " remaining turn(s).");

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
    writeEncounterMetadata(card,{status:"Available",number:number,retirementLength:config.defaultRetirementLength,encounterWeight:config.defaultEncounterRarity,minimumTurn:config.defaultEffectiveMinimumTurn});
    const s=state.randomEncounters;
    s.used=s.used.filter(function(n){return n!==number;});
    s.activeEncounters=s.activeEncounters.filter(function(x){return x.number!==number;});
    s.pendingResolutions=s.pendingResolutions.filter(function(x){return x.number!==number;});
    if (s.pendingEncounter && s.pendingEncounter.number===number) s.pendingEncounter=null;
    if (s.lastInjectedEncounter && s.lastInjectedEncounter.number===number) s.lastInjectedEncounter=null;
    ["activation","retirement","reready"].forEach(function(k){s.currentTurnMarkers[k]=(s.currentTurnMarkers[k]||[]).filter(function(n){return n!==number;});});
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
    if (lower==="help") message="Random Encounters commands: /RE on, /RE off, /RE start, /RE end, /RE reset#, /RE resetall";
    else if (lower==="on") { setConfigEnabled(true); message="Random Encounters enabled."; }
    else if (lower==="off") { setConfigEnabled(false); message="Random Encounters disabled."; }
    else if (lower==="start") {
      if (s.activeEncounters.length) message="A random encounter is already active.";
      else {
        const selected=selectRandomEncounter(config);
        if (!selected) message="No eligible random encounters are available.";
        else {
          s.pendingEncounter={number:selected.number,code:selected.code,selectedTurn:s.turn,encounterWeight:selected.weightName,encounterWeightValue:selected.weight,minimumTurn:selected.baseMinimumTurn,effectiveMinimumTurn:selected.effectiveMinimumTurn};
          s.cooldownRemaining=0; s.nextEncounterIn=null;
          message="Random encounter "+selected.code+" queued for the next story action.";
        }
      }
    } else if (lower==="end") {
      if (!s.activeEncounters.length) message="No random encounter is currently active.";
      else {
        const active=s.activeEncounters.slice(); s.activeEncounters=[];
        active.forEach(function(encounter){
          const card=getEncounterCard(encounter.number);
          if (card) writeEncounterMetadata(card,{status:"Retired",number:encounter.number,triggeredTurn:encounter.triggeredTurn,resolvedTurn:s.turn,retirementLength:encounter.retirementLength,encounterWeight:encounter.encounterWeight});
          s.currentTurnMarkers.retirement.push(encounter.number); queueResolution(encounter);
        });
        s.cooldownRemaining=config.cooldownTurns; s.cooldownStartedThisTurn=true; s.nextEncounterIn=null;
        message="Active random encounter ended; resolution queued.";
      }
    } else if (lower==="resetall") {
      getAllEncounterCards().forEach(function(record){resetEncounter(record.number,config);});
      s.used=[]; s.activeEncounters=[]; s.pendingResolutions=[]; s.pendingEncounter=null; s.lastInjectedEncounter=null; s.cooldownRemaining=0; s.nextEncounterIn=null; s.currentTurnMarkers={activation:[],retirement:[],reready:[]};
      message="All existing random encounter cards reset to Available.";
    } else {
      const rm=lower.match(/^reset\s*#?(\d+)$/)||lower.match(/^reset(\d+)$/);
      if (rm) {
        const number=parseInt(rm[1],10);
        if (number<1 || number>DEFAULTS.encounterCount) message="Encounter number must be between 1 and "+DEFAULTS.encounterCount+".";
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
    reportInvalidPacing(config);
    ensureEncounterCards(config);
    ensureHistoryCard();
    applyGlobalDefaultChanges(config);
    log(
      "Config | enabled=" + config.enabled +
      " | pacing=" + config.encounterPacing +
      " | interval=" + config.minTurns + "-" + config.maxTurns +
      " | cooldown=" + config.cooldownTurns +
      " | defaultRetirement=" + config.defaultRetirementLength +
      " | defaultEffectiveMinimum=" + config.defaultEffectiveMinimumTurn +
      " | defaultRarity=" + config.defaultEncounterRarity
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