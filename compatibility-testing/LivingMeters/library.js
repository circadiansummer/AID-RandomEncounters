// ============================================================================
// LIVING METERS + RANDOM ENCOUNTERS COMPATIBILITY FIXTURE
// ============================================================================
// Living Meters source: Oratorian/living-meters@c4ebf5dd13a36b1b8de33ae08c39cf84b52f36ca
// Living Meters version: v1.2.2
// Random Encounters version: v0.18.28
//
// TEST FIXTURE ONLY.
// Living Meters is unmodified below. The Random Encounters block is copied
// byte-for-byte from src/library.js.
// ============================================================================

/// <reference no-default-lib="true"/>
/// <reference lib="es2022"/>

// SPDX-License-Identifier: MIT

/* ============================================================================
 * LIVING METERS v1.2.2: a resource framework for AI Dungeon
 *
 * Copyright (c) 2026 Oratorian. MIT licensed; see the LICENSE file.
 * You may bundle this into your own script. Keeping this notice is all that
 * is asked.
 * ----------------------------------------------------------------------------
 * Tracks any set of numeric resources (health, hunger, ammo, fuel, sanity,
 * gold, reputation...), drifts them each turn, reacts to what the story says,
 * and tells the AI how the character should feel and behave.
 *
 * The meters are "living" because they move on their own: each one drifts every
 * turn, reacts to what the story says, and is handed to the AI as behaviour to
 * play rather than a number to recite.
 *
 * THREE LAYERS OF CONFIGURATION
 *   1. RM_CONFIG below                 the scenario creator edits this.
 *   2. RM_PRESETS                      ready-made resource sets to start from.
 *   3. The "Living Meters" story card  the PLAYER edits this in-game; it
 *                                      overrides the creator's numbers.
 *
 * The RM_ prefix is the original working name and is kept deliberately: it is
 * short, it collides with nothing, and renaming it would break nobody's saves
 * for no gain.
 *
 * INSTALL: paste this whole file into the Library tab, then paste the three
 * companion files into Input / Context / Output. See README.md.
 * ==========================================================================*/

// Some globals are not defined in every hook. Establish them before use.
globalThis.stop ??= false;
globalThis.text ??= " ";
globalThis.state ??= {};
globalThis.history ??= [];
globalThis.storyCards ??= [];
globalThis.info ??= {};

/* ============================================================================
 * 1. CREATOR CONFIG — edit this block
 * ==========================================================================*/

const RM_CONFIG = {
  // Start from a preset, then add or override resources below.
  // "survival" | "fantasy" | "scifi" | "noir" | "mechanic" | "none" |

  // If preset is "none", no resources are added by default and the preset section is ignored.
  // You must then define all resources and triggers you want in the "resources" array below.
  // Starting from line 77 and ending on line 261
  preset: "none",

  // Resources defined here are MERGED over the preset, matched by `id`.
  // Give an id that isn't in the preset to add a brand-new resource.
  //
  // TRIGGERS take plain word lists — you never write a regular expression.
  //   "coin"    matches the whole word "coin" only
  //   "loot*"   matches "loot", "looted", "looting", "looter"
  //   "dead body"  phrases are fine
  // Matching is always case-insensitive and always respects word boundaries,
  // so "rest" will not fire on "restaurant". Add the * yourself when you want
  // word endings to count.
  //
  // ==========================================================================
  // DEEP SPACE — a long-haul salvage run gone wrong.
  //
  // Twelve interlocking systems. The design intent is that no single resource
  // kills you; the ship does, because fixing one thing costs another. A burn
  // spends fuel AND adds heat. Running the reactor restores power but bakes
  // the ship and doses the crew. Repairs eat spare parts you cannot replace
  // out here. Note how several triggers share the same words across different
  // resources — that is how one narrative event moves three numbers at once.
  // ==========================================================================
  resources: [

    // ---- Ship -------------------------------------------------------------
    {
      id: "hull", label: "Hull", icon: "🛡️",
      min: 0, max: 100, start: 100, perTurn: 0,
      bands: [
        { upTo: 0, name: "breached", tell: "The hull has failed. The ship is venting to vacuum and is no longer survivable; narrate the decompression and its consequences." },
        { upTo: 25, name: "critical", tell: "The hull is holed in several places. Bulkheads groan, atmosphere hisses out through patches, and any hard manoeuvre risks tearing it wide open." },
        { upTo: 60, name: "damaged", tell: "The hull is buckled and patched. Stress fractures creak whenever the ship accelerates." },
        { upTo: 100, name: "sound", tell: "" },
      ],
      triggers: [
        { on: "output", words: ["hull breach", "micrometeor*", "collision", "ruptur*", "direct hit", "shrapnel", "debris field"], delta: -18 },
        { on: "both", words: ["weld*", "patch the hull", "hull patch", "seal the breach", "repair the hull"], delta: 20 },
      ],
    },
    {
      id: "power", label: "Power", icon: "🔋",
      min: 0, max: 100, start: 88, perTurn: -0.7,
      bands: [
        { upTo: 0, name: "dark", tell: "The ship is dead. No lights, no heat, no life support, no doors. Only emergency chemical lamps and whatever is in the character's hands." },
        { upTo: 18, name: "brownout", tell: "Power is nearly gone. Lights flicker, non-essential systems are offline, and consoles reboot mid-sentence." },
        { upTo: 50, name: "rationed", tell: "Power is being rationed. Whole decks are dark and the character has to choose which systems to bring up." },
        { upTo: 100, name: "nominal", tell: "" },
      ],
      triggers: [
        { on: "both", words: ["reactor", "spin up the core", "power cell", "solar array", "recharg*"], delta: 34 },
        { on: "both", words: ["reroute power", "divert power", "overclock*", "full burn"], delta: -14 },
        { on: "output", words: ["short circuit", "power surge", "grid failure", "blown coupling"], delta: -20 },
      ],
    },
    {
      id: "fuel", label: "Fuel", icon: "⛽",
      min: 0, max: 100, start: 62, perTurn: 0,
      bands: [
        { upTo: 0, name: "dry", tell: "The tanks are dry. The ship cannot manoeuvre and is on a ballistic course it cannot change." },
        { upTo: 15, name: "reserve", tell: "Fuel is down to the reserve. There is enough for one burn, maybe, and nothing after it." },
        { upTo: 100, name: "ok", tell: "" },
      ],
      triggers: [
        { on: "both", words: ["burn", "burns", "burned", "thrust*", "manoeuvr*", "maneuver*", "course correction"], delta: -13 },
        { on: "both", words: ["refuel*", "fuel line", "siphon*", "tanker", "hydrogen scoop"], delta: 30 },
      ],
    },
    {
      id: "heat", label: "Thermal", icon: "🌡️",
      // Inverted: HIGH is bad. Radiators bleed it off slowly on their own.
      // min is 15, not 0 — a crewed ship has an ambient floor it cannot go
      // below, and `min` does not have to be zero.
      min: 15, max: 100, start: 28, perTurn: -0.8,
      bands: [
        { upTo: 35, name: "cool", tell: "" },
        { upTo: 70, name: "warm", tell: "The ship is running hot. Deck plating is uncomfortable to touch and the air tastes of scorched dust." },
        { upTo: 100, name: "overheating", tell: "The ship is overheating badly. Coolant alarms are constant, sweat runs freely, and electronics are failing from thermal stress." },
      ],
      triggers: [
        { on: "both", words: ["reactor", "overclock*", "full burn", "weapons fire"], delta: 13 },
        { on: "both", words: ["radiator*", "vent heat", "coolant", "shut down the core", "power down"], delta: -22 },
        { on: "output", words: ["stellar flare", "close approach", "sunward"], delta: 16 },
      ],
    },

    // ---- Life support -----------------------------------------------------
    {
      id: "o2", label: "Oxygen", icon: "🫁",
      min: 0, max: 100, start: 100, perTurn: -1.3,
      bands: [
        { upTo: 0, name: "anoxic", tell: "There is no breathable air left. The character is suffocating: vision tunnelling, lungs burning, seconds of consciousness remaining." },
        { upTo: 20, name: "critical", tell: "Oxygen is critically low. Every breath is shallow and insufficient; the character is light-headed and their judgement is visibly slipping." },
        { upTo: 45, name: "thin", tell: "The air is thin and stale. The character tires quickly and has a persistent headache." },
        { upTo: 100, name: "breathable", tell: "" },
      ],
      triggers: [
        { on: "both", words: ["scrubber*", "oxygen candle", "o2 tank", "air supply", "recharge the tanks", "algae tank"], delta: 40 },
        { on: "both", words: ["eva", "spacewalk*", "airlock cycle", "suit up"], delta: -12 },
        // Not bare "vent*" or "leak*": those fire on "ventilation hums" and on
        // a coolant leak, neither of which costs anyone their air.
        { on: "output", words: ["hull breach", "ruptur*", "decompress*", "atmosphere leak", "air leak", "blown seal"], delta: -22 },
      ],
    },
    {
      id: "food", label: "Rations", icon: "🍱",
      min: 0, max: 100, start: 74, perTurn: -0.9,
      bands: [
        { upTo: 0, name: "starving", tell: "The rations are gone. The character is starving: cramping, weak, slow to think, and increasingly willing to consider things they would not have considered." },
        { upTo: 22, name: "rationing", tell: "Food is nearly out. The character is on quarter-rations and thinks about it constantly." },
        { upTo: 100, name: "fed", tell: "" },
      ],
      triggers: [
        { on: "both", words: ["ration pack", "eat", "ate", "eating", "meal", "meals", "protein paste", "galley"], delta: 26 },
        { on: "both", words: ["hydroponic*", "food crate", "resupply", "supply cache"], delta: 34 },
      ],
    },
    {
      id: "water", label: "Water", icon: "💧",
      min: 0, max: 100, start: 80, perTurn: -1.1,
      bands: [
        { upTo: 0, name: "dehydrated", tell: "The water is gone. The character is dangerously dehydrated: cracked lips, dark urine, dizziness, failing concentration." },
        { upTo: 25, name: "short", tell: "Water is short. The character's mouth is permanently dry and they are rationing every sip." },
        { upTo: 100, name: "ok", tell: "" },
      ],
      triggers: [
        // "recycler" is deliberately NOT here: it would also match inside
        // "recycler failure" below and cancel the loss out.
        { on: "both", words: ["drink", "drank", "drinking", "water ration", "condensate", "ice haul", "purifier"], delta: 32 },
        { on: "output", words: ["recycler failure", "water loss", "coolant leak"], delta: -18 },
      ],
    },

    // ---- Crew -------------------------------------------------------------
    {
      id: "hp", label: "Condition", icon: "❤️",
      min: 0, max: 100, start: 100, perTurn: 0,
      bands: [
        { upTo: 0, name: "dead", tell: "The character has died. Narrate the death and its consequences; do not let them act again." },
        { upTo: 22, name: "critical", tell: "The character is critically injured — bleeding, shocky, barely able to stand. Without treatment they will not last long." },
        { upTo: 58, name: "injured", tell: "The character is injured and impaired. Movement is slow and painful, and fine work is difficult." },
        { upTo: 100, name: "well", tell: "" },
      ],
      triggers: [
        // "burn*" is deliberately NOT here: an engine burn is a manoeuvre, and
        // it would injure the crew every time they changed course.
        { on: "output", words: ["scald*", "struck", "crush*", "shrapnel", "fracture*", "bleeding", "electrocut*", "frostbite", "concussion"], delta: -17 },
        { on: "both", words: ["medbay", "medkit", "med kit", "stim", "stims", "sutur*", "treat the wound", "autodoc"], delta: 24 },
      ],
    },
    {
      id: "rads", label: "Radiation", icon: "☢️",
      // Inverted and CUMULATIVE: it only ever goes up unless treated.
      min: 0, max: 100, start: 4, perTurn: 0.2,
      bands: [
        { upTo: 20, name: "background", tell: "" },
        { upTo: 45, name: "exposed", tell: "The character has taken a real dose. Nausea comes in waves and their gums bleed when they clench their jaw." },
        { upTo: 75, name: "sick", tell: "Radiation sickness has set in: vomiting, hair loss, bruising under the skin, exhaustion that sleep does not touch." },
        { upTo: 100, name: "lethal", tell: "The character has absorbed a lethal dose. They are visibly dying — describe the failure of their body honestly and without hope of recovery." },
      ],
      triggers: [
        { on: "output", words: ["reactor breach", "radiation", "irradiat*", "hot zone", "solar storm", "unshielded"], delta: 14 },
        { on: "both", words: ["reactor", "core chamber", "eva", "spacewalk*"], delta: 5 },
        { on: "both", words: ["anti-rad", "antirad", "chelation", "iodine", "decontaminat*"], delta: -22 },
      ],
    },
    {
      id: "morale", label: "Morale", icon: "🧠",
      min: 0, max: 100, start: 72, perTurn: -0.45,
      bands: [
        { upTo: 0, name: "broken", tell: "The character has broken. Describe dissociation, fixed stares, and decisions that make no sense to anyone but them." },
        { upTo: 25, name: "fraying", tell: "The character is coming apart. They hear things in the hull noise, talk to people who are not there, and startle badly." },
        { upTo: 55, name: "strained", tell: "The character is worn thin by isolation. They are irritable, superstitious about the ship's sounds, and sleeping badly." },
        { upTo: 100, name: "steady", tell: "" },
      ],
      triggers: [
        { on: "both", words: ["music", "message from home", "recorded message", "sleep", "slept", "shore leave", "hot meal", "coffee"], delta: 16 },
        { on: "output", words: ["alone", "silence", "no response", "corpse", "body bag", "distress call", "nothing on the scope"], delta: -9 },
      ],
    },

    // ---- Cargo and economy -------------------------------------------------
    {
      id: "parts", label: "Spare Parts", icon: "🔩",
      min: 0, max: 60, start: 22, perTurn: 0,
      bands: [
        { upTo: 0, name: "none", tell: "There are no spare parts left. Nothing further can be repaired; anything that breaks from here stays broken." },
        { upTo: 6, name: "scarce", tell: "Spare parts are almost gone. The character is cannibalising non-essential systems to keep essential ones alive." },
        { upTo: 60, name: "stocked", tell: "" },
      ],
      triggers: [
        { on: "both", words: ["weld*", "patch the hull", "seal the breach", "repair the hull", "jury-rig*", "jury rig*", "cannibalis*", "cannibaliz*"], delta: -6 },
        { on: "both", words: ["salvag*", "strip the wreck", "scav*", "parts cache", "component crate"], delta: 14 },
      ],
    },
    {
      id: "credits", label: "Credits", icon: "🪙",
      min: 0, max: 99999, start: 340, perTurn: 0,
      bands: [
        { upTo: 0, name: "broke", tell: "The character has no credits. No station will sell them fuel, air, or docking time." },
        { upTo: 99999, name: "solvent", tell: "" },
      ],
      triggers: [
        { on: "output", words: ["paid", "bought", "purchase*", "docking fee", "bribe*", "toll"], delta: -60 },
        { on: "output", words: ["sold", "salvage claim", "bounty", "contract payment", "reward*"], delta: 120 },
      ],
    },
  ],

  // How the AI is told about the resources.
  //   "context"     — appended to the model context. Accurate and current.
  //                   SILENTLY DOES NOTHING on models with Optimized Context.
  //   "frontMemory" — written to state.memory.frontMemory. Survives Optimized
  //                   Context, but lags one turn behind.
  //   "none"        — track only, never tell the AI.
  inject: "context",

  // Prefix for the injected block. Keep it bracketed and in complete sentences:
  // an unterminated fragment invites the AI to finish it.
  injectLabel: "Ship and crew status",

  // Show a toast to the player when a resource crosses into a new band.
  announceBandChanges: true,

  // What separates rows inside a toast. The client collapses whitespace, so a
  // newline is only a space and a padded block turns into one wrapped
  // paragraph. A visible marker survives that. If you find a break that does
  // work in your client, put it here: "\n\n" and "<br>" are the two worth trying.
  toastSeparator: "   \u00b7   ",

  // Show the full status toast every N turns. 0 disables.
  statusEvery: 0,

  // Maintain a "Living Meters" story card the player can read and edit.
  playerCard: true,
  playerCardTitle: "⚙️ Living Meters",

  // Command prefix. Players type "/status", "/hp +10", etc.
  commandPrefix: "/",

  // Commands need the turn to stop before the AI runs. AI Dungeon has no clean
  // way to do that: halting shows a "the AI is stumped" banner. Set false to
  // let commands fall through to the AI instead (no banner, costs a
  // generation). See README "Why does a command show an error banner?".
  haltOnCommand: true,

  // Ignore a trigger word sitting inside a negated clause, so "you do not
  // eat" no longer feeds the character. A negator only reaches back to the
  // last sentence break. Set false for the old behaviour.
  negationGuard: true,

  // Scan player input as well as AI output for trigger matches.
  scanInput: true,
  scanOutput: true,

  // Multiplies every negative drift. The player can override this in the card.
  // easy 0.5 | normal 1 | hard 1.75
  difficulty: "normal",

  // Print diagnostics to the Console Log panel.
  debug: false,
};

/* ============================================================================
 * 2. PRESETS
 * ==========================================================================*/

const RM_PRESETS = {
  none: [],

  survival: [
    {
      id: "hp", label: "Health", icon: "❤️",
      min: 0, max: 100, start: 100, perTurn: 0,
      bands: [
        { upTo: 0, name: "dead", tell: "The character has died. Narrate the death and its consequences; do not let them act." },
        { upTo: 20, name: "critical", tell: "The character is gravely wounded, bleeding and barely conscious. Every action is a struggle." },
        { upTo: 55, name: "hurt", tell: "The character is injured and moves carefully, favouring the wound." },
        { upTo: 100, name: "well", tell: "" },
      ],
      triggers: [
        { on: "output", words: ["stab*", "slash*", "shot", "bitten", "maul*", "struck", "wound*", "burn*"], delta: -14 },
        { on: "both", words: ["bandage*", "tourniquet", "first aid", "stitch*", "treat the wound"], delta: 18 },
        { on: "both", words: ["sleep", "slept", "sleeping", "rest", "rested", "resting", "make camp", "made camp"], delta: 10 },
      ],
    },
    {
      id: "hunger", label: "Food", icon: "🍖",
      min: 0, max: 100, start: 80, perTurn: -1.5,
      bands: [
        { upTo: 0, name: "starving", tell: "The character is starving. Describe cramping hunger, weakness and poor judgement." },
        { upTo: 25, name: "hungry", tell: "The character is very hungry and distracted by it." },
        { upTo: 100, name: "fed", tell: "" },
      ],
      triggers: [
        { on: "both", words: ["eat", "ate", "eating", "meal", "meals", "devour*", "feast*"], delta: 30 },
        { on: "both", words: ["forage*", "hunt", "hunted", "hunting", "butcher*"], delta: 12 },
      ],
    },
    {
      id: "thirst", label: "Water", icon: "💧",
      min: 0, max: 100, start: 85, perTurn: -2.2,
      bands: [
        { upTo: 0, name: "parched", tell: "The character is dangerously dehydrated: cracked lips, dizziness, tunnel vision." },
        { upTo: 30, name: "thirsty", tell: "The character is thirsty and thinking about water." },
        { upTo: 100, name: "watered", tell: "" },
      ],
      triggers: [
        { on: "both", words: ["drink", "drank", "drinking", "water", "canteen", "waterskin", "spring"], delta: 35 },
      ],
    },
    {
      id: "warmth", label: "Warmth", icon: "🔥",
      min: 0, max: 100, start: 70, perTurn: -1,
      bands: [
        { upTo: 0, name: "freezing", tell: "The character is hypothermic: numb hands, slurred speech, dangerous drowsiness." },
        { upTo: 30, name: "cold", tell: "The character is shivering and stiff with cold." },
        { upTo: 100, name: "warm", tell: "" },
      ],
      triggers: [
        { on: "both", words: ["fire", "campfire", "blanket*", "shelter", "coat", "furs"], delta: 25 },
        { on: "output", words: ["snow", "snowing", "blizzard", "freezing rain", "soaked", "drenched"], delta: -12 },
      ],
    },
  ],

  fantasy: [
    {
      id: "hp", label: "Health", icon: "❤️",
      min: 0, max: 100, start: 100, perTurn: 0,
      bands: [
        { upTo: 0, name: "dead", tell: "The character has fallen. Narrate the death and its consequences." },
        { upTo: 25, name: "critical", tell: "The character is gravely wounded and near collapse." },
        { upTo: 60, name: "hurt", tell: "The character is bloodied and slower than usual." },
        { upTo: 100, name: "well", tell: "" },
      ],
      triggers: [
        { on: "output", words: ["stab*", "slash*", "struck", "claw*", "bitten", "blast*"], delta: -15 },
        { on: "both", words: ["heal*", "potion", "cure", "cured", "mend*", "bandage*"], delta: 25 },
      ],
    },
    {
      id: "mana", label: "Mana", icon: "✨",
      min: 0, max: 50, start: 50, perTurn: 1.5,
      bands: [
        { upTo: 0, name: "empty", tell: "The character is magically spent. Spells fail, fizzle or backfire." },
        { upTo: 12, name: "low", tell: "The character's magic is nearly exhausted; casting is an effort." },
        { upTo: 50, name: "ready", tell: "" },
      ],
      triggers: [
        { on: "both", words: ["cast", "casts", "casting", "spell", "spells", "incant*", "conjure*", "hex", "enchant*"], delta: -10 },
        { on: "both", words: ["meditate*", "rest", "rested", "resting", "attune*", "mana potion"], delta: 20 },
      ],
    },
    {
      id: "coin", label: "Coin", icon: "🪙",
      min: 0, max: 99999, start: 30, perTurn: 0,
      bands: [
        { upTo: 0, name: "broke", tell: "The character has no money at all; merchants and innkeepers turn them away." },
        { upTo: 99999, name: "ok", tell: "" },
      ],
      triggers: [
        { on: "output", words: ["buy", "buys", "bought", "paid", "bribe*", "purchase*"], delta: -8 },
        { on: "output", words: ["loot*", "reward*", "treasure", "sold", "found coins"], delta: 15 },
      ],
    },
  ],

  scifi: [
    {
      id: "hp", label: "Integrity", icon: "❤️",
      min: 0, max: 100, start: 100, perTurn: 0,
      bands: [
        { upTo: 0, name: "dead", tell: "The character has died. Narrate the consequences." },
        { upTo: 25, name: "critical", tell: "The character is critically injured; medical attention is urgent." },
        { upTo: 60, name: "hurt", tell: "The character is injured and impaired." },
        { upTo: 100, name: "well", tell: "" },
      ],
      triggers: [
        { on: "output", words: ["shot", "blast*", "burn*", "decompress*", "struck"], delta: -16 },
        { on: "both", words: ["medkit", "medbay", "stim", "stims", "nanite*", "treated"], delta: 22 },
      ],
    },
    {
      id: "o2", label: "Oxygen", icon: "🫁",
      min: 0, max: 100, start: 100, perTurn: -2,
      bands: [
        { upTo: 0, name: "suffocating", tell: "The character is suffocating: vision tunnelling, lungs burning. They have moments left." },
        { upTo: 25, name: "low", tell: "Oxygen is running out. The character is light-headed and breathing hard." },
        { upTo: 100, name: "ok", tell: "" },
      ],
      triggers: [
        { on: "both", words: ["recharge*", "refill*", "airlock", "oxygen", "o2 tank", "air supply"], delta: 45 },
        { on: "output", words: ["breach*", "leak*", "vacuum", "puncture*", "hull rupture"], delta: -20 },
      ],
    },
    {
      id: "power", label: "Power", icon: "🔋",
      min: 0, max: 100, start: 90, perTurn: -1.2,
      bands: [
        { upTo: 0, name: "dead", tell: "All powered equipment is dead. No lights, no tools, no weapons." },
        { upTo: 20, name: "low", tell: "Power is critically low; equipment is flickering and unreliable." },
        { upTo: 100, name: "ok", tell: "" },
      ],
      triggers: [
        { on: "both", words: ["recharge*", "power cell", "battery", "batteries", "solar", "reactor"], delta: 35 },
      ],
    },
  ],

  noir: [
    {
      id: "hp", label: "Condition", icon: "❤️",
      min: 0, max: 100, start: 100, perTurn: 0,
      bands: [
        { upTo: 0, name: "dead", tell: "The character is dead. Narrate the end." },
        { upTo: 30, name: "bad", tell: "The character is badly hurt and running on adrenaline alone." },
        { upTo: 70, name: "banged up", tell: "The character is bruised and aching." },
        { upTo: 100, name: "fine", tell: "" },
      ],
      triggers: [
        { on: "output", words: ["punch*", "shot", "beaten", "slam*", "kick*"], delta: -12 },
        { on: "both", words: ["patch up", "patched up", "doctor", "whiskey", "sleep", "slept"], delta: 12 },
      ],
    },
    {
      id: "heat", label: "Heat", icon: "🚨",
      min: 0, max: 100, start: 10, perTurn: -1,
      bands: [
        { upTo: 30, name: "clean", tell: "" },
        { upTo: 65, name: "watched", tell: "The character is being watched. Police and rivals take an interest." },
        { upTo: 100, name: "hunted", tell: "The character is actively hunted. Every public place is dangerous." },
      ],
      triggers: [
        { on: "output", words: ["gunshot*", "witness*", "police", "siren*", "arrest*", "dead body", "corpse"], delta: 18 },
        { on: "both", words: ["lay low", "laid low", "hide", "hid", "hiding", "disguise*", "alibi", "bribe*"], delta: -15 },
      ],
    },
    {
      id: "leads", label: "Leads", icon: "🔎",
      min: 0, max: 20, start: 0, perTurn: 0,
      bands: [
        { upTo: 0, name: "cold", tell: "The character has no leads. The trail is cold." },
        { upTo: 20, name: "warm", tell: "" },
      ],
      triggers: [
        { on: "output", words: ["clue", "clues", "testimony", "confess*", "evidence", "new lead", "fresh lead"], delta: 1 },
      ],
    },
  ],
  // ==========================================================================
  // MECHANIC — a machine you have to keep alive.
  //
  // Written for long-haul trucking but it fits any scenario where the vehicle
  // is a character: haulage, a road trip in a dying van, a rally, a convoy.
  //
  // The design intent is that almost nothing here fails on its own. It fails
  // because of what you did two hours ago. Climbing a grade burns diesel AND
  // cooks the coolant. Coming down the far side costs brakes, and standing on
  // the service brakes instead of gearing down costs three times as much.
  // Repairs cost money you only get by delivering, and delivering costs hours
  // you only get back by stopping for the night.
  //
  // Watch how "grade", "brake job" and "shut down" each appear on several
  // resources at once. That is how one narrated moment moves three numbers.
  // ==========================================================================
  mechanic: [
    {
      id: "engine", label: "Engine", icon: "🔧",
      // Wears very slowly with distance even when nothing goes wrong, which is
      // what stops a well-maintained truck from simply sitting at 100 forever.
      min: 0, max: 100, start: 82, perTurn: -0.2,
      bands: [
        { upTo: 0, name: "seized", tell: "The engine is dead. It will not turn over, it will not be coaxed back, and the vehicle is going nowhere without a tow. Treat this as final." },
        { upTo: 25, name: "failing", tell: "The engine is failing. It misfires, loses power on any incline, and something metallic is knocking down there. The character expects it to let go at any moment." },
        { upTo: 60, name: "rough", tell: "The engine runs rough. It smokes on startup, hesitates under load, and the character has learned which noises to ignore and which to worry about." },
        { upTo: 100, name: "sound", tell: "" },
      ],
      triggers: [
        { on: "output", words: ["blown gasket", "head gasket", "threw a rod", "turbo failure", "limp mode", "check engine", "engine light", "knocking", "seiz*"], delta: -22 },
        { on: "both", words: ["overhaul*", "rebuild the engine", "mechanic", "repair shop", "service the truck", "new turbo", "top up the oil", "oil change"], delta: 32 },
        // Abuse it and it remembers. "money shift" is a missed downshift at
        // speed, which is exactly the sort of thing a driver does once.
        { on: "both", words: ["redlin*", "over-rev*", "float the gears", "money shift", "ride the clutch"], delta: -9 },
      ],
    },
    {
      id: "fuel", label: "Diesel", icon: "⛽",
      min: 0, max: 100, start: 55, perTurn: -2.2,
      bands: [
        { upTo: 0, name: "dry", tell: "The tanks are dry. The engine has coughed itself quiet and the vehicle is coasting to the shoulder on momentum alone." },
        { upTo: 12, name: "fumes", tell: "The fuel gauge is below the peg and the low-fuel light has been on long enough that the character has stopped looking at it. Every exit sign matters now." },
        { upTo: 32, name: "low", tell: "Fuel is low. The character is doing arithmetic about the next fuel stop instead of paying attention to the road." },
        { upTo: 100, name: "ok", tell: "" },
      ],
      triggers: [
        { on: "both", words: ["fuel island", "fuel up", "fuel stop", "fill the tanks", "top off the tanks", "refuel*", "diesel pump"], delta: 58 },
        { on: "both", words: ["grade", "climb*", "long pull", "mountain pass", "hammer down", "open her up"], delta: -7 },
        { on: "both", words: ["idle", "idles", "idling", "idled"], delta: -3 },
      ],
    },
    {
      id: "temp", label: "Coolant", icon: "🌡️",
      // Inverted: HIGH is bad. Note the min is 160, not 0 — this is a gauge in
      // degrees, and a running engine has a floor it never drops below. It
      // sheds heat on its own every turn, so heat is a debt, not a wound.
      min: 160, max: 260, start: 190, perTurn: -3,
      bands: [
        { upTo: 205, name: "normal", tell: "" },
        { upTo: 232, name: "hot", tell: "The temperature gauge is well above normal and still climbing. The character keeps glancing at it, and the heater is on full with the windows down to pull heat off the engine." },
        { upTo: 260, name: "overheating", tell: "The engine is overheating badly. Steam, an alarm, the smell of hot coolant. Pushing on from here does permanent damage and the character knows it." },
      ],
      triggers: [
        { on: "both", words: ["grade", "climb*", "long pull", "mountain pass", "heavy load", "overweight", "air conditioning", "towing"], delta: 19 },
        { on: "both", words: ["pull over", "shut down", "shut it down", "let her cool", "let it cool", "coolant", "radiator", "downshift*", "idle down"], delta: -26 },
        { on: "output", words: ["overheat*", "steam", "boiled over", "boiling over", "temperature alarm", "coolant leak"], delta: 21 },
      ],
    },
    {
      id: "tires", label: "Tires", icon: "🛞",
      min: 0, max: 100, start: 70, perTurn: -0.4,
      bands: [
        { upTo: 0, name: "blown", tell: "A tire is gone, running on the casing or the rim. The vehicle pulls hard to one side and cannot be driven any distance like this." },
        { upTo: 20, name: "bald", tell: "The tires are down to the cords. They slip on anything wet and the character takes corners like the road is made of glass." },
        { upTo: 55, name: "worn", tell: "The tires are worn thin and uneven. The character can hear them and does not like the sound." },
        { upTo: 100, name: "good", tell: "" },
      ],
      triggers: [
        { on: "output", words: ["blowout", "blew a tire", "tire blew", "flat tire", "gator", "shredded", "tread separat*"], delta: -38 },
        { on: "both", words: ["new tires", "retread*", "tire shop", "change the tire", "swap the tire", "air up the tires", "check the pressure"], delta: 46 },
        { on: "both", words: ["pothole*", "washboard", "rough road", "construction zone", "gravel", "curb", "curbed"], delta: -7 },
      ],
    },
    {
      id: "brakes", label: "Brakes", icon: "🛑",
      min: 0, max: 100, start: 78, perTurn: -0.3,
      bands: [
        { upTo: 0, name: "gone", tell: "The brakes are gone. The pedal goes to the floor. The character is looking for a runaway ramp, a rising shoulder, anything that will take speed off without stopping the vehicle in pieces." },
        { upTo: 22, name: "fading", tell: "The brakes are nearly gone and they smell like it. They fade after one hard application and the character is downshifting for everything instead." },
        { upTo: 55, name: "worn", tell: "The brakes are soft and pull to one side. The character leaves a lot more room than they used to." },
        { upTo: 100, name: "good", tell: "" },
      ],
      triggers: [
        // The descent itself always costs a little. How it is driven costs the
        // rest: standing on the service brakes is what actually kills them.
        { on: "both", words: ["downgrade", "steep grade", "down the mountain", "descend*"], delta: -8 },
        { on: "both", words: ["hard on the brakes", "brake hard", "braked hard", "panic stop", "stood on the brakes", "rode the brakes"], delta: -16 },
        // The whole point of the preset in one line: doing it the right way
        // does not repair anything, it just costs you less. Both this and the
        // descent fire on the same turn, so a jake-braked grade is -2, not -8.
        //
        // Honest caveat: triggers have no conditions, so narrating an engine
        // brake on flat ground credits you 6 you did not really earn. Keep this
        // delta small for that reason, or delete it if your players game it.
        { on: "both", words: ["jake brake", "engine brake", "compression brake", "low gear", "geared down", "gear down"], delta: 6 },
        { on: "both", words: ["brake job", "new pads", "new shoes", "slack adjuster", "adjust the brakes", "brake shop"], delta: 42 },
      ],
    },
    {
      id: "hos", label: "Drive Time", icon: "⏱️",
      // Legal driving hours left in the day. Half an hour per turn. This is the
      // meter that makes the scenario a job rather than a drive: it is the only
      // one you cannot fix with money, and stopping to fix it costs a night.
      min: 0, max: 11, start: 11, perTurn: -0.5,
      bands: [
        { upTo: 0, name: "out of hours", tell: "The character is out of legal driving hours. Every mile from here is a violation they will have to answer for, and the pressure to find somewhere legal to park is immediate and constant." },
        { upTo: 1, name: "final hour", tell: "Less than an hour of legal drive time is left, and the truck stops fill up long before dark. The character is weighing distance against a place to sleep." },
        { upTo: 3, name: "running short", tell: "Drive time is running short. The character is doing the maths on whether this run makes it before the clock does." },
        { upTo: 11, name: "legal", tell: "" },
      ],
      triggers: [
        { on: "both", words: ["ten hour break", "10 hour break", "shut down for the night", "park for the night", "sleeper berth", "reset the clock", "34 hour"], delta: 11 },
        // Buys you time and nothing else. If you add a DOT-attention meter,
        // put these same words on it with a large positive delta.
        { on: "both", words: ["fudge the log", "run illegal", "yellow log", "off the books"], delta: 3 },
      ],
    },
    {
      id: "alert", label: "Alertness", icon: "☕",
      // Drains fast enough that fatigue arrives on its own, without needing a
      // trigger to cause it: "tired" by about turn 12, "exhausted" by turn 24.
      // This is the one meter that should degrade whether or not anything
      // interesting happens, because that is what a long day in a seat is.
      min: 0, max: 100, start: 80, perTurn: -2.4,
      bands: [
        { upTo: 0, name: "microsleeping", tell: "The character is falling asleep at the wheel. They are losing seconds of road at a time and coming back to a lane they do not remember choosing. Narrate this as the emergency it is." },
        { upTo: 22, name: "exhausted", tell: "The character is dangerously tired. Their reactions are slow, their eyes keep closing, and they are arguing with themselves about stopping." },
        { upTo: 50, name: "tired", tell: "The character is tired. Their attention drifts and they have to work to keep it on the road." },
        { upTo: 100, name: "sharp", tell: "" },
      ],
      triggers: [
        // "rest" is safe as a bare word: matching respects word boundaries, so
        // it will not fire on "restaurant" or "arrest".
        { on: "both", words: ["sleep", "slept", "sleeping", "nap", "napped", "rest", "rested", "sleeper berth", "shut down for the night"], delta: 58 },
        { on: "both", words: ["coffee", "caffeine", "energy drink", "black coffee"], delta: 15 },
        { on: "both", words: ["drove through the night", "drive through the night", "push through", "pushed through", "white line fever", "one more hour"], delta: -19 },
      ],
    },
    {
      id: "cash", label: "Settlement", icon: "💵",
      // Starts at roughly one fill plus one repair. Tight on purpose: the
      // maintenance decisions only matter if you cannot afford all of them.
      min: 0, max: 99999, start: 1400, perTurn: 0,
      bands: [
        { upTo: 0, name: "broke", tell: "The character has no money at all. The fuel card is declined, the shop will not start work, and there is nothing to eat that is not already in the cab." },
        { upTo: 250, name: "tight", tell: "Money is tight enough that the character is choosing between fuel and repairs, and putting off the repair." },
        { upTo: 99999, name: "ok", tell: "" },
      ],
      triggers: [
        { on: "both", words: ["deliver*", "unload*", "drop the trailer", "bill of lading", "got paid", "settlement", "signed for the load"], delta: 2200 },
        { on: "both", words: ["mechanic", "repair shop", "brake job", "new tires", "overhaul*", "towed", "tow truck"], delta: -680 },
        { on: "both", words: ["fuel island", "fuel up", "fill the tanks", "refuel*"], delta: -410 },
        { on: "output", words: ["ticket", "citation", "fined", "out of service", "violation"], delta: -900 },
      ],
    },
  ],
};

/* ============================================================================
 * 3. FRAMEWORK — you should not need to edit below this line.
 * ==========================================================================*/

const RM = (function () {
  const VERSION = 1;
  const SENTINEL = "%RM%";          // story card key that will never trigger
  const BUILD_MARK = "%RM_NEW%";    // temporary title used to find a new card
  const DIFFICULTY = { easy: 0.5, normal: 1, hard: 1.75 };

  // ---- small utilities ----------------------------------------------------

  function isNum(n) {
    return typeof n === "number" && Number.isFinite(n);
  }

  function clamp(v, lo, hi) {
    if (!isNum(v)) return lo;
    return v < lo ? lo : v > hi ? hi : v;
  }

  function round2(v) {
    return Math.round(v * 100) / 100;
  }

  function hash32(s) {
    // FNV-1a. Cheap, good enough to tell "same output as last turn" apart.
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  function dbg() {
    if (!RM_CONFIG.debug) return;
    try {
      log("[Living Meters] " + Array.from(arguments).map((a) =>
        typeof a === "string" ? a : JSON.stringify(a)).join(" "));
    } catch (e) { /* logging must never break a turn */ }
  }

  // ---- trigger compilation -----------------------------------------------

  // Config problems are collected here and reported to the creator rather than
  // silently swallowed — a trigger that never fires is very hard to notice.
  const PROBLEMS = [];

  function escapeRe(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // "loot"  → loot          (whole word only)
  // "loot*" → loot\w*       (word endings count)
  function wordToAlt(w) {
    const raw = String(w).trim();
    if (!raw) return null;
    if (raw.endsWith("*")) {
      const stem = raw.slice(0, -1).trim();
      return stem ? escapeRe(stem) + "\\w*" : null;
    }
    return escapeRe(raw);
  }

  // A trigger word inside a negated clause should not fire. Without this every
  // preset pays out for declining: "you do not eat" fed the character and "you
  // don't drink" watered them, because the pattern only asks whether the
  // word is present anywhere.
  //
  // Bare "no" and "none" are deliberately absent. They negate as often as not,
  // but they also appear in "no choice but to eat", where suppressing would be
  // wrong, and that phrasing is common in the survival prose these presets are
  // written for.
  const NEGATORS = /\bnot\b|n['’]t\b|\bnever\b|\bcannot\b|\brefus\w*|\bdeclin\w*|\bavoid\w*|\bwithout\b|\binstead of\b|\brather than\b|\bunable to\b|\bfail\w* to\b|\bdecid\w* against\b/i;

  // A cap for a very long sentence; the clause bound below usually bites first.
  const NEG_WINDOW = 80;

  function negated(src, at) {
    let clause = src.slice(Math.max(0, at - NEG_WINDOW), at);
    // Keep only what follows the last clause break, so "It was not a good day.
    // You eat." does not suppress the meal, and neither does "you do not eat the
    // berries, then you eat the fish".
    //
    // A comma counts as a break. That mis-reads a negated list, "you do not eat,
    // drink, or rest", where the later items should stay suppressed. It is still
    // the better default: getting a comma wrong means firing, which is exactly
    // what this framework did before the guard existed, while leaving the comma
    // out means silently withholding a payout the player earned. Prefer the
    // error that matches the old behaviour.
    const cut = clause.search(/[.!?;:,\n][^.!?;:,\n]*$/);
    if (cut !== -1) clause = clause.slice(cut + 1);
    return NEGATORS.test(clause);
  }

  // True if the word appears at least once OUTSIDE a negated clause. Every
  // occurrence is examined, so "you do not eat the berries, then you eat the
  // fish" still counts as eating.
  function fires(re, src) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src)) !== null) {
      if (m[0].length === 0) { re.lastIndex++; continue; }
      if (!RM_CONFIG.negationGuard || !negated(src, m.index)) return true;
    }
    return false;
  }

  // Turns a creator's trigger into { on, re, delta }, or records why it can't.
  function compileTrigger(resId, t, index) {
    const where = `${resId} trigger #${index + 1}`;

    if (!t || typeof t !== "object") {
      PROBLEMS.push(`${where}: not an object.`);
      return null;
    }
    if (!isNum(t.delta) || t.delta === 0) {
      PROBLEMS.push(`${where}: needs a non-zero numeric "delta".`);
      return null;
    }

    const on = t.on === "input" || t.on === "output" ? t.on : "both";

    // Escape hatch for authors who genuinely want their own pattern.
    if (t.match !== undefined) {
      if (!(t.match instanceof RegExp)) {
        PROBLEMS.push(
          `${where}: "match" must be a regular expression like /word/i, not a string. ` +
          `Use words: ["word"] instead.`
        );
        return null;
      }
      // Re-flagged with "g" so fires() can walk it. The author's own source
      // and case sensitivity are preserved.
      const gflags = t.match.flags.indexOf("g") === -1 ? t.match.flags + "g" : t.match.flags;
      return {
        on: on, re: new RegExp(t.match.source, gflags),
        delta: t.delta, words: ["(custom pattern)"],
      };
    }

    if (!Array.isArray(t.words) || !t.words.length) {
      PROBLEMS.push(`${where}: needs words: ["some", "word*"].`);
      return null;
    }

    const alts = [];
    for (const w of t.words) {
      const a = wordToAlt(w);
      if (a) alts.push(a);
      else PROBLEMS.push(`${where}: ignored an empty entry in "words".`);
    }
    if (!alts.length) {
      PROBLEMS.push(`${where}: no usable words.`);
      return null;
    }

    // Boundaries on both sides, so "rest" fires on "you rest" but not on
    // "restaurant" or "arrest". \b is not used because it needs a word
    // character to sit against, which breaks entries like "c++" or "o2!".
    // The leading alternative consumes a character, which shifts the reported
    // index back by one; harmless, because the guard reads the clause before it.
    try {
      return {
        on: on,
        // "g" so fires() can walk every occurrence, not only the first.
        re: new RegExp("(?:^|\\W)(?:" + alts.join("|") + ")(?!\\w)", "gi"),
        delta: t.delta,
        words: t.words.slice(),   // kept for introspection and testing
      };
    } catch (err) {
      PROBLEMS.push(`${where}: could not build a pattern from those words.`);
      return null;
    }
  }

  // ---- resource definitions ----------------------------------------------

  // Merge RM_CONFIG.resources over the chosen preset, matched by id.
  function buildDefs() {
    const preset = RM_PRESETS[RM_CONFIG.preset] || RM_PRESETS.none;
    const byId = new Map();

    for (const r of preset) byId.set(r.id, Object.assign({}, r));
    for (const r of RM_CONFIG.resources || []) {
      if (!r || typeof r.id !== "string") continue;
      byId.set(r.id, Object.assign({}, byId.get(r.id) || {}, r));
    }

    const out = [];
    for (const r of byId.values()) {
      if (typeof r.id !== "string") continue;

      const min = isNum(r.min) ? r.min : 0;
      const max = isNum(r.max) ? r.max : 100;
      if (max <= min) PROBLEMS.push(`${r.id}: max (${max}) must be greater than min (${min}).`);

      const triggers = [];
      const rawTriggers = Array.isArray(r.triggers) ? r.triggers : [];
      for (let i = 0; i < rawTriggers.length; i++) {
        const c = compileTrigger(r.id, rawTriggers[i], i);
        if (c) triggers.push(c);
      }

      out.push({
        id: r.id,
        label: typeof r.label === "string" ? r.label : r.id,
        icon: typeof r.icon === "string" ? r.icon : "",
        min: min,
        max: max,
        start: isNum(r.start) ? r.start : max,
        perTurn: isNum(r.perTurn) ? r.perTurn : 0,
        visible: r.visible !== false,
        enabled: r.enabled !== false,
        bands: Array.isArray(r.bands) ? r.bands.slice() : [],
        triggers: triggers,
      });
    }
    return out;
  }

  // Definitions live in the Library, never in state — state is JSON-serialized
  // between turns and would silently drop the regexes.
  let DEFS = null;
  function defs() {
    if (!DEFS) DEFS = buildDefs();
    return DEFS;
  }
  function def(id) {
    return defs().find((d) => d.id === id) || null;
  }

  function bandOf(d, value) {
    // First band whose `upTo` is >= the value wins. Bands are read low→high.
    const sorted = d.bands.slice().sort((a, b) => (a.upTo ?? 0) - (b.upTo ?? 0));
    for (const b of sorted) if (value <= (b.upTo ?? 0)) return b;
    return sorted.length ? sorted[sorted.length - 1] : { name: "", tell: "" };
  }

  // ---- state --------------------------------------------------------------

  function freshState() {
    const res = {};
    for (const d of defs()) res[d.id] = clamp(d.start, d.min, d.max);
    return {
      v: VERSION,
      res: res,
      band: {},        // id -> last announced band name
      turn: 0,         // our own turn counter, not info.actionCount
      hlen: 0,         // history.length at the last counted turn
      outHash: 0,      // hash of the last output we scanned
      msgPrev: "",     // last toast we wrote, for cooperative state.message
      msgOpen: false,  // a flush already happened this generation; add to it
      cardOK: true,    // false once we detect story cards are unavailable
      warned: false,
      pendingStop: false, // a command ran in Input; Context executes the halt
      cfgWarned: false,   // config problems have been shown once
      fired: {},          // trigger keys already counted this turn
      over: {},        // player overrides parsed from the story card
      overWarn: "",    // unknown card keys we have already flagged
    };
  }

  // Validate every field. A script upgrade mid-adventure must not corrupt a run.
  function hydrate() {
    const raw = state.RM;
    if (!raw || typeof raw !== "object" || raw.v !== VERSION) {
      dbg("initialising state");
      return freshState();
    }
    const s = freshState();
    if (raw.res && typeof raw.res === "object") {
      for (const d of defs()) {
        if (isNum(raw.res[d.id])) s.res[d.id] = clamp(raw.res[d.id], d.min, d.max);
      }
    }
    if (raw.band && typeof raw.band === "object") s.band = raw.band;
    if (isNum(raw.turn)) s.turn = raw.turn;
    if (isNum(raw.hlen)) s.hlen = raw.hlen;
    if (isNum(raw.outHash)) s.outHash = raw.outHash;
    if (typeof raw.msgPrev === "string") s.msgPrev = raw.msgPrev;
    if (typeof raw.msgOpen === "boolean") s.msgOpen = raw.msgOpen;
    if (typeof raw.cardOK === "boolean") s.cardOK = raw.cardOK;
    if (typeof raw.warned === "boolean") s.warned = raw.warned;
    if (typeof raw.pendingStop === "boolean") s.pendingStop = raw.pendingStop;
    if (typeof raw.cfgWarned === "boolean") s.cfgWarned = raw.cfgWarned;
    if (raw.fired && typeof raw.fired === "object") s.fired = raw.fired;
    if (raw.over && typeof raw.over === "object") s.over = raw.over;
    if (typeof raw.overWarn === "string") s.overWarn = raw.overWarn;
    return s;
  }

  function persist(s) {
    state.RM = s;
  }

  // ---- player overrides, read from the story card -------------------------

  // The card's NOTES field is never shown to the AI, which makes it the right
  // place for machine-readable settings the player can edit.
  //
  //   difficulty = hard
  //   show = off
  //   hunger.perTurn = -3
  //   thirst.off
  //
  function parseOverrides(src) {
    const over = {};
    if (typeof src !== "string" || !src) return over;

    for (let line of src.split("\n")) {
      line = line.split("#")[0].trim();
      if (!line) continue;

      // "<id>.off" / "<id>.on"
      const toggle = line.match(/^([A-Za-z0-9_]+)\.(off|on)$/i);
      if (toggle) {
        over[toggle[1] + ".enabled"] = toggle[2].toLowerCase() === "on";
        continue;
      }

      const kv = line.match(/^([A-Za-z0-9_.]+)\s*[=:]\s*(.+)$/);
      if (!kv) continue;
      const key = kv[1].trim();
      const rawVal = kv[2].trim();
      const num = Number(rawVal);

      if (/^(on|true|yes)$/i.test(rawVal)) over[key] = true;
      else if (/^(off|false|no)$/i.test(rawVal)) over[key] = false;
      else if (Number.isFinite(num) && rawVal !== "") over[key] = num;
      else over[key] = rawVal;
    }
    return over;
  }

  // Every key the card can actually set. parseOverrides accepts any
  // "key = value" line, so without this a typo, or a creator-only setting like
  // statusEvery, is stored forever and silently ignored. That is how a player
  // ends up convinced the card does nothing.
  const OVER_GLOBALS = ["difficulty", "statusEvery"];
  const OVER_FIELDS = ["min", "max", "start", "perTurn", "visible", "enabled"];

  function isOverrideKey(key) {
    if (OVER_GLOBALS.indexOf(key) !== -1) return true;
    const dot = key.lastIndexOf(".");
    if (dot === -1) return false;
    return defs().some((d) => d.id === key.slice(0, dot))
      && OVER_FIELDS.indexOf(key.slice(dot + 1)) !== -1;
  }

  function checkOverrides(s) {
    const bad = [];
    for (const key of Object.keys(s.over)) {
      if (isOverrideKey(key)) continue;
      bad.push(key);
    }
    // Keyed on the exact set, so fixing the card stops the warning and a new
    // mistake raises a fresh one.
    const sig = bad.join(",");
    if (sig === s.overWarn) return;
    s.overWarn = sig;
    if (!bad.length) return;
    toast(s, "Living Meters card: " + bad.map((k) => '"' + k + '"').join(", ") +
      (bad.length > 1 ? " are not settings." : " is not a setting.") +
      " See the notes at the top of the card.");
  }

  function optNum(s, key, fallback) {
    const v = s.over[key];
    return isNum(v) ? v : fallback;
  }
  function optBool(s, key, fallback) {
    const v = s.over[key];
    return typeof v === "boolean" ? v : fallback;
  }

  // Effective definition for a resource, after player overrides.
  function eff(s, d) {
    return {
      id: d.id,
      label: d.label,
      icon: d.icon,
      min: optNum(s, d.id + ".min", d.min),
      max: optNum(s, d.id + ".max", d.max),
      start: optNum(s, d.id + ".start", d.start),
      perTurn: optNum(s, d.id + ".perTurn", d.perTurn),
      visible: optBool(s, d.id + ".visible", d.visible),
      enabled: optBool(s, d.id + ".enabled", d.enabled),
      bands: d.bands,
      triggers: d.triggers,
    };
  }

  function activeDefs(s) {
    return defs().map((d) => eff(s, d)).filter((d) => d.enabled);
  }

  function difficultyMul(s) {
    const key = String(s.over.difficulty || RM_CONFIG.difficulty || "normal").toLowerCase();
    return DIFFICULTY[key] ?? 1;
  }

  // ---- mutation -----------------------------------------------------------

  function setVal(s, id, value) {
    const d = def(id);
    if (!d) return null;
    const e = eff(s, d);
    const before = s.res[id] ?? e.min;
    s.res[id] = round2(clamp(value, e.min, e.max));
    return { id: id, before: before, after: s.res[id], def: e };
  }

  function addVal(s, id, delta, opts) {
    const d = def(id);
    if (!d || !isNum(delta) || delta === 0) return null;
    const e = eff(s, d);
    let amount = delta;
    // Difficulty scales losses only — a hard run drains faster but does not
    // hand out bigger rewards.
    if (amount < 0 && !(opts && opts.raw)) amount *= difficultyMul(s);
    return setVal(s, id, (s.res[id] ?? e.start ?? e.min) + amount);
  }

  // ---- turn detection -----------------------------------------------------

  // There is no "the turn advanced" API, and info.actionCount is not a clean
  // counter: it increments twice on a Do/Say/Story turn, once on a Continue,
  // and has been observed to decrement on a Retry and to go negative.
  // history.length is the more honest signal until the platform truncates it,
  // so use it first and fall back to actionCount once it plateaus.
  function turnAdvanced(s) {
    const hl = Array.isArray(history) ? history.length : 0;
    const ac = Number.isInteger(info?.actionCount) ? Math.abs(info.actionCount) : 0;

    if (Math.abs(hl - ac) < 2) {
      // history is intact — trust it. A retry re-generates without growing it.
      if (hl > s.hlen) { s.hlen = hl; return true; }
      s.hlen = hl;
      return false;
    }
    // history has been truncated; fall back to the action counter.
    if (ac > s.turn) return true;
    return false;
  }

  // ---- per-turn drift -----------------------------------------------------

  function tick(s) {
    const changes = [];
    for (const e of activeDefs(s)) {
      if (!e.perTurn) continue;
      const r = addVal(s, e.id, e.perTurn);
      if (r && r.before !== r.after) changes.push(r);
    }
    s.turn += 1;
    return changes;
  }

  // ---- triggers -----------------------------------------------------------

  // A trigger fires at most ONCE per turn, even when its word appears in both
  // the player's action and the AI's narration. "You weld the plate" followed
  // by "You weld it down" is one weld, not two. s.fired is reset at the start
  // of the Input hook and cleared again at the end of the Output hook, so it
  // spans exactly one turn and behaves correctly on Continue actions too.
  function scan(s, src, phase) {
    if (typeof src !== "string" || !src) return [];
    if (!s.fired || typeof s.fired !== "object") s.fired = {};
    const changes = [];
    for (const e of activeDefs(s)) {
      for (let i = 0; i < e.triggers.length; i++) {
        const t = e.triggers[i];
        // Patterns are compiled and validated once in buildDefs, so anything
        // reaching here is known-good.
        if (t.on !== "both" && t.on !== phase) continue;
        const key = e.id + "#" + i;
        if (s.fired[key]) continue;
        if (!fires(t.re, src)) continue;
        s.fired[key] = 1;
        const r = addVal(s, e.id, t.delta);
        if (r && r.before !== r.after) changes.push(r);
      }
    }
    return changes;
  }

  // ---- presentation -------------------------------------------------------

  function bar(value, min, max) {
    const span = max - min;
    if (span <= 0) return "";
    const filled = Math.round(((value - min) / span) * 10);
    return "█".repeat(clamp(filled, 0, 10)) + "░".repeat(10 - clamp(filled, 0, 10));
  }

  function statusLine(s) {
    const parts = [];
    for (const e of activeDefs(s)) {
      if (!e.visible) continue;
      const v = s.res[e.id];
      parts.push(`${e.icon}${e.icon ? " " : ""}${e.label} ${Math.round(v)}/${Math.round(e.max)}`);
    }
    return parts.join("  ·  ");
  }

  function statusBlock(s) {
    const rows = [];
    for (const e of activeDefs(s)) {
      if (!e.visible) continue;
      const v = s.res[e.id];
      const b = bandOf(e, v);
      rows.push(
        `${e.icon || "•"} ${e.label.padEnd(10)} ${bar(v, e.min, e.max)} ` +
        `${String(Math.round(v)).padStart(4)}/${Math.round(e.max)}` +
        (b.name ? `  (${b.name})` : "")
      );
    }
    return rows.join("\n");
  }

  // statusBlock is for the story card, which keeps its whitespace. A toast does
  // not, so padEnd there is wasted and the columns never line up. This is the
  // same information laid out to survive being wrapped at any width.
  function statusToast(s) {
    const parts = [];
    for (const e of activeDefs(s)) {
      if (!e.visible) continue;
      const v = s.res[e.id];
      const b = bandOf(e, v);
      // Non-breaking spaces inside a row, ordinary ones only around the
      // separator, so a wrap can land BETWEEN rows and never inside one. That
      // is what stops a short label being stranded from its bar, which is a
      // single unbreakable token. U+00A0 also survives whitespace collapsing,
      // unlike the padding this used to rely on.
      const NB = "\u00a0";
      parts.push([
        e.icon || "\u2022",
        e.label.replace(/ /g, NB),    // NBSP: a wrap must not split it
        bar(v, e.min, e.max),
        `${Math.round(v)}/${Math.round(e.max)}` + (b.name ? `${NB}(${b.name})` : ""),
      ].join(NB));
    }
    return parts.join(RM_CONFIG.toastSeparator || "   \u00b7   ");
  }

  // What the AI is told. Complete sentences only: an unterminated fragment in
  // frontMemory invites the model to finish it.
  function directive(s) {
    const stats = [];
    const tells = [];
    for (const e of activeDefs(s)) {
      const v = s.res[e.id];
      const b = bandOf(e, v);
      if (e.visible) {
        stats.push(`${e.label} ${Math.round(v)}/${Math.round(e.max)}${b.name ? ` (${b.name})` : ""}`);
      }
      if (b.tell) tells.push(b.tell);
    }
    if (!stats.length && !tells.length) return "";

    let out = `[${RM_CONFIG.injectLabel}: ${stats.join(", ")}.`;
    if (tells.length) out += " " + tells.join(" ");
    out += " Reflect this in the narration through behaviour and sensation;" +
           " never state the numbers themselves.]";
    return out;
  }

  // ---- toasts -------------------------------------------------------------

  // Collected during a hook and written once. The Library re-executes on every
  // hook, so this buffer resets by itself each time.
  let TOASTS = [];

  // A toast cannot hold a line break. The client collapses whitespace, so a
  // newline renders as a space and the padded status block became one wrapped
  // paragraph; worse, a bar is a single unbreakable token, so each row's icon
  // and label fitted at the end of the previous visual line while the bar
  // wrapped. Rows are separated by a visible marker instead, which survives
  // wrapping whatever the renderer turns out to be.
  const BREAK = RM_CONFIG.toastSeparator || "   \u00b7   ";

  function toast(s, msg) {
    if (msg && TOASTS.indexOf(msg) === -1) TOASTS.push(msg);
  }

  // state.message is a single slot any script can write. Only overwrite what we
  // put there ourselves, so we never clobber another script's toast.
  function flushToast(s) {
    if (!TOASTS.length) return;
    // Every newline has to become a hard break, including ones inside a single
    // queued message such as the status block or the /help list.
    const msg = TOASTS.join("\n").split("\n").join(BREAK);
    TOASTS = [];
    const current = typeof state.message === "string" ? state.message : "";
    if (current && current !== s.msgPrev) {
      s.msgPrev = current;   // somebody else owns the slot; note it and retry next turn
      return;
    }

    // The Library re-executes per hook, so every hook flushes its own buffer.
    // Within one generation, ADD to what we already wrote rather than replacing
    // it: a card warning raised in Input, a status block queued in Context and a
    // band announcement from Output all belong to the same moment, and whichever
    // flushed first should not disappear.
    let out;
    if (current && s.msgOpen) {
      if (current.indexOf(msg) !== -1) return;   // already on screen
      out = current + BREAK + msg;
    } else {
      // The client suppresses a toast identical to the previous one; perturb it.
      out = current === msg ? msg + " " : msg;
    }
    state.message = out;
    s.msgPrev = out;
    s.msgOpen = true;
  }

  // ---- story card ---------------------------------------------------------

  const CARD_HEADER = [
    "# Living Meters settings. Edit the lines below, then close this card.",
    "# Lines starting with # are ignored. Delete a line to use the default.",
    "#",
    "# Or use the /set command, e.g.  /set statusEvery 5",
    "#",
    "#   difficulty  = easy | normal | hard",
    "#   statusEvery = 5              show the full status every N turns, 0 = off",
    "#   <resource>.perTurn = -2      how much it drifts each turn",
    "#   <resource>.max     = 120     raise or lower the ceiling",
    "#   <resource>.min     = 10      raise or lower the floor",
    "#   <resource>.start   = 60      the value /reset restores",
    "#   <resource>.visible = off     keep tracking it, stop showing it",
    "#   <resource>.off               stop tracking it entirely",
    "#   <resource>.on                track it again",
    "#",
  ].join("\n");

  function findCard() {
    if (!Array.isArray(storyCards)) return null;
    for (const c of storyCards) {
      if (c && c.title === RM_CONFIG.playerCardTitle) return c;
    }
    return null;
  }

  // addStoryCard returns the new LENGTH (the help site says "index" — it is
  // wrong, and has been for years), and cannot set the description field.
  // Creating a card with a sentinel title and then finding it by that title
  // gets us a real object reference to mutate.
  function createCard(s) {
    try {
      addStoryCard(SENTINEL, " ", "Custom", BUILD_MARK, " ");
    } catch (e) {
      s.cardOK = false;
      return null;
    }
    for (const c of storyCards) {
      if (c && c.title === BUILD_MARK) {
        c.title = RM_CONFIG.playerCardTitle;
        c.keys = SENTINEL;
        c.type = "Custom";
        c.entry = " ";
        c.description = CARD_HEADER + "\ndifficulty = " + (RM_CONFIG.difficulty || "normal") + "\n";
        return c;
      }
    }
    // Story card writes silently fail when the Memory Bank feature is off.
    s.cardOK = false;
    return null;
  }

  function syncCard(s) {
    if (!RM_CONFIG.playerCard || !s.cardOK) return;

    let card = findCard();
    if (!card) card = createCard(s);
    if (!card) {
      if (!s.warned) {
        s.warned = true;
        toast(s, "Living Meters: story cards are unavailable. Enable Gameplay > Memory System > Memory Bank.");
      }
      return;
    }

    // The player owns `description`; we only ever read it.
    s.over = parseOverrides(card.description);
    checkOverrides(s);

    // We own `entry`, and it never reaches the AI because `keys` never matches.
    const block = statusBlock(s);
    const next = `Current status (read-only, updates every turn)\n\n${block}\n`;
    if (card.entry !== next) card.entry = next;
  }

  // ---- writing a setting back to the card ---------------------------------

  // syncCard re-parses the card on every hook and replaces s.over, so a command
  // that only wrote state would be erased inside the same turn. The card stays
  // the single source of truth; /set edits it and the player can see the result.
  function writeSetting(src, key, value) {
    const text = typeof src === "string" ? src : "";
    const re = new RegExp("^\\s*" + escapeRe(key) + "\\s*[=:]", "i");
    const out = [];
    let done = false;
    for (const line of text.split("\n")) {
      if (line.trim().startsWith("#") || !re.test(line)) {
        out.push(line);
        continue;
      }
      if (done) continue;                  // collapse an existing duplicate
      out.push(key + " = " + value);
      done = true;
    }
    while (out.length && out[out.length - 1].trim() === "") out.pop();
    if (!done) out.push(key + " = " + value);
    return out.join("\n") + "\n";
  }

  // ---- commands -----------------------------------------------------------

  function stripPrefix(raw) {
    // Player input arrives pre-processed: "\n> You say \"/status\"\n" and so on.
    // In third person the name replaces "You", so match loosely.
    let t = String(raw || "");
    t = t.replace(/^\s*>\s*/, "");
    t = t.replace(/^[^\s]+\s+(?:say|says|said)[,:]?\s*/i, "");
    t = t.replace(/^["'“”]+|["'“”\s]+$/g, "");
    return t.trim();
  }

  function helpText() {
    const p = RM_CONFIG.commandPrefix;
    return [
      `${p}status        show all resources`,
      `${p}<id> +N       add to a resource   (e.g. ${p}hp +10)`,
      `${p}<id> -N       subtract from it`,
      `${p}<id> =N       set it exactly`,
      `${p}set <k> <v>   change a setting  (e.g. ${p}set statusEvery 5)`,
      `${p}set           show what you have changed`,
      `${p}reset         restore starting values`,
      `${p}help          this list`,
    ].join("\n");
  }

  // Returns a message string if the input was a command, else null.
  function handleCommand(s, raw) {
    const p = RM_CONFIG.commandPrefix;
    const t = stripPrefix(raw);
    if (!t.startsWith(p)) return null;

    const body = t.slice(p.length).trim();
    if (!body) return null;
    const parts = body.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    if (cmd === "help") return helpText();
    if (cmd === "status") return statusToast(s) || "No resources are being tracked.";

    if (cmd === "set") {
      const key = parts[1];
      const value = parts.slice(2).join(" ");
      if (!key) {
        const keys = Object.keys(s.over);
        return keys.length
          ? "Your settings:\n" + keys.map((k) => k + " = " + s.over[k]).join("\n")
          : `Nothing changed yet. Try ${p}set statusEvery 5`;
      }
      if (!isOverrideKey(key)) {
        return `"${key}" is not a setting you can change. Try ${p}difficulty, ` +
          `${p}set statusEvery 5, or ${p}set <resource>.perTurn -2. ${p}help lists the rest.`;
      }
      if (!value) return `Usage: ${p}set ${key} <value>`;

      const card = findCard();
      if (!card) {
        return "The settings card is not available. Turn on Gameplay > Memory System > Memory Bank.";
      }
      card.description = writeSetting(card.description, key, value);
      s.over = parseOverrides(card.description);
      s.overWarn = "";                     // a new key may need flagging again
      return `${key} = ${value}`;
    }

    if (cmd === "reset") {
      // eff() rather than the raw definition, so a start set in the card
      // is what /reset restores.
      for (const d of defs()) setVal(s, d.id, eff(s, d).start);
      s.band = {};
      return "Meters reset. " + statusToast(s);
    }

    // "<id> +10" / "<id> -5" / "<id> =80" / "<id>" to query one
    const d = def(cmd);
    if (d) {
      const arg = parts[1];
      if (!arg) {
        const e = eff(s, d);
        return `${e.label}: ${Math.round(s.res[d.id])}/${Math.round(e.max)} (${bandOf(e, s.res[d.id]).name || "-"})`;
      }
      const m = arg.match(/^([+\-=])?(\d+(?:\.\d+)?)$/);
      if (!m) return `Could not read "${arg}". Try ${p}${cmd} +10`;
      const n = Number(m[2]);
      const r = m[1] === "=" ? setVal(s, d.id, n)
              : m[1] === "-" ? addVal(s, d.id, -n, { raw: true })
              : addVal(s, d.id, n, { raw: true });
      if (!r) return "No change.";
      const e = eff(s, d);
      return `${e.label}: ${Math.round(r.before)} → ${Math.round(r.after)}/${Math.round(e.max)}`;
    }

    return `Unknown command "${cmd}". Type ${p}help.`;
  }

  // ---- band-change announcements -----------------------------------------

  function announce(s) {
    if (!RM_CONFIG.announceBandChanges) return;
    const crossed = [];
    for (const e of activeDefs(s)) {
      const b = bandOf(e, s.res[e.id]);
      const name = b.name || "";
      if (s.band[e.id] !== name) {
        if (s.band[e.id] !== undefined && name) {
          crossed.push(`${e.icon || ""}${e.icon ? " " : ""}${e.label}: ${name}`);
        }
        s.band[e.id] = name;
      }
    }
    if (crossed.length) toast(s, crossed.join("   "));
  }

  // ---- config problem reporting ------------------------------------------

  // A misconfigured trigger is invisible otherwise: it simply never fires.
  // Say so, once, rather than letting the creator wonder.
  function reportProblems(s) {
    defs();                       // force compilation so PROBLEMS is populated
    if (!PROBLEMS.length) return;
    for (const p of PROBLEMS) dbg("config:", p);
    if (s.cfgWarned && !RM_CONFIG.debug) return;
    s.cfgWarned = true;
    const shown = PROBLEMS.slice(0, 4);
    toast(s, "Living Meters, check your config:\n• " + shown.join("\n• ") +
      (PROBLEMS.length > shown.length ? `\n• …and ${PROBLEMS.length - shown.length} more` : ""));
  }

  // ---- hook entry points --------------------------------------------------

  function onInput(inText) {
    const s = hydrate();
    let out = typeof inText === "string" ? inText : " ";

    try {
      s.fired = {};              // a new player action begins a new turn
      s.msgOpen = false;         // and a new message, not an addition
      reportProblems(s);
      syncCard(s);

      const reply = handleCommand(s, out);
      if (reply !== null) {
        toast(s, reply);
        if (RM_CONFIG.haltOnCommand) {
          // stop:true from onInput surfaces an error banner to the player; the
          // working halt is executed from the Context hook instead.
          s.pendingStop = true;
        }
        flushToast(s);
        persist(s);
        return out;
      }

      if (RM_CONFIG.scanInput) scan(s, out, "input");
      announce(s);

      if (RM_CONFIG.inject === "frontMemory") {
        state.memory = state.memory || {};
        state.memory.frontMemory = directive(s);
      }
    } catch (err) {
      dbg("onInput error", String(err));
    }

    flushToast(s);
    persist(s);
    return out;
  }

  function onContext(inText, inStop) {
    const s = hydrate();
    let out = typeof inText === "string" ? inText : " ";
    let halt = inStop === true;

    try {
      if (s.pendingStop) {
        s.pendingStop = false;
        halt = true;
        flushToast(s);
        persist(s);
        return [out, halt];
      }

      reportProblems(s);

      // The Context hook is the only one that runs on every generation,
      // including Continue actions, so the turn tick belongs here.
      if (turnAdvanced(s)) {
        tick(s);
        announce(s);
        // Through the overrides, not RM_CONFIG directly, or a player can
        // set this and nothing will ever read it.
        const every = optNum(s, "statusEvery", RM_CONFIG.statusEvery);
        if (every > 0 && s.turn % every === 0) {
          toast(s, statusToast(s));
        }
      }

      syncCard(s);

      if (RM_CONFIG.inject === "context") {
        const block = directive(s);
        if (block) {
          const maxChars = isNum(info?.maxChars) ? info.maxChars : 0;
          const joined = out + "\n" + block;
          // The server truncates whatever we return to info.maxChars, and it
          // trims from the front — so trim ourselves and keep our block.
          out = maxChars > 0 && joined.length > maxChars
            ? joined.slice(joined.length - maxChars)
            : joined;
        }
      } else if (RM_CONFIG.inject === "frontMemory") {
        state.memory = state.memory || {};
        state.memory.frontMemory = directive(s);
      }
    } catch (err) {
      dbg("onContext error", String(err));
    }

    flushToast(s);
    persist(s);
    return [out, halt];
  }

  function onOutput(inText) {
    const s = hydrate();
    let out = typeof inText === "string" ? inText : " ";

    try {
      if (RM_CONFIG.scanOutput && out.trim()) {
        // Retries reuse cached outputs, so the same text can arrive twice.
        // Hashing it stops a retry from applying every trigger a second time.
        const h = hash32(out);
        if (h !== s.outHash) {
          s.outHash = h;
          scan(s, out, "output");
          announce(s);
          syncCard(s);
        }
      }
      s.fired = {};              // the turn is over; release every trigger

    } catch (err) {
      dbg("onOutput error", String(err));
    }

    flushToast(s);
    // Output is the last hook of every generation, including a Continue, which
    // never calls Input. Closing the message here is what keeps the next
    // generation from appending to this one.
    s.msgOpen = false;
    persist(s);
    // Never return an empty string: onOutput throws a player-visible error.
    return out.length ? out : " ";
  }

  // ---- public API (also usable from your own scripts) --------------------

  return {
    input: onInput,
    context: onContext,
    output: onOutput,

    get: (id) => (hydrate().res[id] ?? null),
    set: (id, v) => { const s = hydrate(); const r = setVal(s, id, v); persist(s); return r; },
    add: (id, v) => { const s = hydrate(); const r = addVal(s, id, v, { raw: true }); persist(s); return r; },
    all: () => hydrate().res,
    status: () => statusBlock(hydrate()),
    line: () => statusLine(hydrate()),
    toastLine: () => statusToast(hydrate()),
    directive: () => directive(hydrate()),

    // Effective definitions after player overrides, as plain JSON-safe data.
    // Compiled patterns are omitted; `words` is the author's original list.
    defs: () => {
      const s = hydrate();
      return defs().map((d) => {
        const e = eff(s, d);
        return {
          id: e.id, label: e.label, icon: e.icon,
          min: e.min, max: e.max, start: e.start, perTurn: e.perTurn,
          visible: e.visible, enabled: e.enabled,
          value: s.res[e.id],
          band: bandOf(e, s.res[e.id]).name || "",
          bands: e.bands.map((b) => ({ upTo: b.upTo, name: b.name, tell: b.tell || "" })),
          triggers: e.triggers.map((t) => ({ on: t.on, delta: t.delta, words: t.words })),
        };
      });
    },
    // Queue a toast through RM's own buffer instead of writing state.message
    // yourself. flushToast stays the single writer, so a scenario add-on's
    // message and a band announcement on the same turn are joined rather than
    // one silently losing the slot: assigning state.message directly makes RM
    // yield, and the band is already recorded as announced, so it never
    // returns. Call this before RM.input/RM.context in the same hook.
    toast: (msg) => { toast(null, msg); },

    problems: () => { defs(); return PROBLEMS.slice(); },
  };
})();

// ============================================================================
// RANDOM ENCOUNTERS
// ============================================================================
// The block below must remain byte-for-byte identical to src/library.js.
// ============================================================================
/*
 * Random Encounters
 * Version 0.18.29
 *
 * v0.18 adds Acts/progression, Awaiting Completion, and active-event command handoff.
 */

function RandomEncounters(hook, text) {
  "use strict";

  const VERSION = "0.18.29";
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

  const CONFIG_TITLE = "Configure Random Encounters";
  const CONFIG_KEY = "random encounter settings";
  const ADVANCED_TITLE = "Advanced RE Settings";
  const ADVANCED_KEY = "advanced random encounter settings";
  const HISTORY_TITLE = "Random Encounter History";
  const HISTORY_KEY = "random encounter history";
  const HISTORY_MAX_ENTRIES = 12;
  const HISTORY_MAX_CHARACTERS = 3000;
  const HISTORY_READ_ONLY = "READ ONLY";
  const HISTORY_RECENT_HEADER = "======= RECENT SUCCESSFUL ENCOUNTERS =======";
  const HISTORY_ARCHIVE_HEADER = "========== ARCHIVED HISTORY ==========";
  const ACT_MAP_TITLE = "Act & Encounter Map";
  const ACT_MAP_KEY = "random encounter act map";
  const ACT_MAP_READ_ONLY = "READ ONLY";
  const ENCOUNTER_PREFIX = "RAND_";
  const SETTINGS_HEADER = "============ ENCOUNTER SETTINGS ============";
  const SYSTEM_HEADER = "============== ENCOUNTER STATE ==============";
  const SETTINGS_HISTORY_TYPE = "#RE - Config & History";
  const ENCOUNTER_TYPE = "#RE - Encounters";

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
    return compactConfigSpacing(entry,[
      /^=+\s*ENCOUNTERS\s*=+$/i,
      /^=+\s*GLOBAL DEFAULTS\s*=+$/i
    ]);
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
      "- Use Advanced Settings: " + (settings.useAdvancedSettings ? "true" : "false"),
      "- Debug Logging: " + (settings.debugLogging ? "true" : "false"),
      "- Display Act & Encounter Map: " + (settings.displayActEncounterMap ? "true" : "false"),
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
      "Successful encounters remain Retired and enter Random Encounter History. Other resolved failures return to Available.",
      "Each resolution is stored in the encounter Entry under Outcome. Random Encounter History keeps the " + HISTORY_MAX_ENTRIES + " most recent successful encounters / " + HISTORY_MAX_CHARACTERS + " characters in its read-only Entry for Context injection and moves older successes into an archive in Notes.",
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
    card.description = currentConfigDescription();

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
    card.description = advancedDescription();
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
      "Random Encounter History",
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
    const lines=[HISTORY_READ_ONLY,"",HISTORY_RECENT_HEADER];
    if (records.length) lines.push("",renderHistoryRecords(records));
    else lines.push("","No successful encounters recorded yet.");
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

    const lines=[ACT_MAP_READ_ONLY,"","CURRENT ACT: "+config.currentAct];
    const acts=Object.keys(groups).map(Number).sort(function(a,b){return a-b;});

    if (!acts.length) {
      lines.push("","No encounter cards found.");
      return lines.join("\n");
    }

    acts.forEach(function(act){
      lines.push("",actMapSectionHeader(act,config.currentAct));
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

  function createEncounterCard(number, config) {
    const code = encounterCode(number);
    const existing = findCardByKey(code);
    if (existing) return existing;
    return createCard({
      type: ENCOUNTER_TYPE,
      title: encounterDefaultTitle(number),
      keys: code,
      entry: "[Define random encounter " + formatEncounterNumber(number) + " here.]",
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

    const available = getAllEncounterCards().filter(function(record) {
      if (normalize(readEncounterStatus(record.card)) !== "available") return false;
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
    ensureHistoryCard();
    syncActMap(config);
    log(
      "Config | enabled=" + config.enabled +
      " | maxCards=" + config.maximumEncounterCards +
      " | createMax=" + config.createMaxEncounterCards +
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
