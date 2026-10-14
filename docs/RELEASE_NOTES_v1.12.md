# Random Encounters v1.12 — Release Notes

**Release date:** October 14, 2026 (source promotion authorized by owner).  
**Source:** [`main`](https://github.com/circadiansummer/AID-RandomEncounters/tree/main) after the approved release merge.  
**Compatibility:** New adventures using current-schema Config and Encounter Story Cards; standalone and combined Inner Self/Auto-Cards four-tab script sets are separate choices.

## What's new

### Bypass Situational Awareness

The creator-facing **Kool-Aid Man Mode** setting is renamed **`Bypass Situational Awareness`** everywhere in the current Config, Encounter Story Card Notes and usage guides. It still uses `true` or `false`, default `false`, and enables a stronger AI instruction to **begin a selected encounter now**, even when that abruptly interrupts a scene or does not fit the current mood or setting. The setting works independently at Config and individual-card level: **either `true` enables the behavior**. It does not change encounter pacing, eligibility, Rarity, Duration, or guarantee model compliance.

Older cards or Config entries using `Kool-Aid Man Mode` or the earlier `No Matter What Mode` remain recognized and are renamed while preserving their true/false values. A third `Default` value is not supported.

### More intuitive placeholder creation and generation

Config → ENCOUNTERS → GENERATION now uses:

```text
---------- GENERATION ----------
- Placeholder Cards to Create: 10
- Create Placeholder Cards: false
-----------------------------------
- Encounter Difficulty: Easy
- Encounter Theme:
- Run Encounter Generation: false
```

The displayed `10` is an example creator value; **new adventures default to 4**.

- **Placeholder Cards to Create:** Number of **additional** blank encounter cards to add in the next creation request. It is **not** an overall maximum or target total.
- **Create Placeholder Cards:** One-shot operation that appends exactly the requested number (1–100) after the highest existing `RAND_##`, preserving authored cards. It returns to `false`.
- **Encounter Difficulty / Encounter Theme:** Existing generation guidance is unchanged.
- **Run Encounter Generation:** Separate one-shot AI-assisted population of untouched default placeholders; custom Entries and Outcomes are protected.

Example: given `RAND_01` through `RAND_04`, setting the count to `10` and enabling `Create Placeholder Cards` adds **`RAND_05`–`RAND_14`**, resulting in 14 encounter cards. A later request adds its own additional count.

Current v1.1 Configs using `Maximum Encounter Cards`, `Create Max Encounter Cards` and `Populate Placeholder Cards` are narrowly upgraded to the new names. The standard old five-line layout is reordered while preserving existing creator values; unrelated creator fields are not restructured. Note that a previously pending creation toggle uses the new additive behavior after upgrading.

## Verification and known limitations

- **PASS — deterministic:** 406/406 regression assertions on the v1.12 candidate, including standalone and Inner Self/Auto-Cards bundled RE core parity, creation batches, migration, boolean mode behavior and wrapper parsing.
- **Owner signoff:** The owner confirmed all previously tested features and requested v1.12 publication on October 14, 2026. Earlier targeted native ASAP and Act-category UI acceptances remain recorded.
- **Native proof boundary:** No fresh AI Dungeon modifier trace was supplied for the renamed field on this exact build; regression passes do not substitute for new live evidence.
- **Still unverified:** Continue accounting after AI Dungeon supplies a genuinely capped/sliding history window.
- **Known inconsistent behavior:** Plain Retry after incomplete AI placeholder generation may not complete that batch without an additional guided attempt.
- **Model dependence:** Even with Bypass Situational Awareness enabled, the AI can sometimes decline or soften an abrupt introduction.

## Installation

Use **either** all four [standalone files](https://github.com/circadiansummer/AID-RandomEncounters/tree/main) or all four [RE-InnerSelf-Merge files](https://github.com/circadiansummer/AID-RandomEncounters/tree/main/RE-InnerSelf-Merge). Do not mix standalone and combined sections. Code promoted in GitHub does **not** automatically replace scripts installed in an existing AI Dungeon adventure or publish an updated AI Dungeon Library listing.

Previous releases **[v1.1](https://github.com/circadiansummer/AID-RandomEncounters/releases/tag/v1.1)** and **[v1.0](https://github.com/circadiansummer/AID-RandomEncounters/releases/tag/v1.0)** remain historical archives. Publishing a GitHub `v1.12` tag/Release is a **separate action** from merging the v1.12 code into `main`; neither operation by itself publishes an AI Dungeon Library update.
