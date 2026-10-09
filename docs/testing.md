# Testing

## Current v0.17.1 validation targets

Core v0.16 behavior carried forward:

- Targeted `/RE start #` is confirmed.
- Weighted random start and normal Active lifecycle remain expected to work.
- Persistent active reminders, resolution capture, History, reset behavior, and Retry-safe turn counting remain regression targets.

### v0.17 configuration checks

1. Fresh adventure creates the new Config layout with Moderate pacing and Maximum Encounter Cards 10.
2. Existing v0.16 Config migrates to the new layout without losing Enabled, Pacing, Rarity, or Duration equivalents.
3. Existing encounter cards migrate to Encounter State + Encounter Settings with Rarity before Duration.
4. Maximum Encounter Cards controls only missing-card generation.
5. Create Missing Encounter Cards creates missing sequential cards only up to the configured maximum.
6. Existing cards above Maximum Encounter Cards remain discoverable, selectable, resettable, and affected by global defaults.
7. Changing global Rarity overwrites Rarity on all discovered encounter cards.
8. Changing global Duration overwrites Duration on all discovered encounter cards while Active runtime duration remains locked.
9. Cooldown is absent; after an encounter attempt ends, the next pacing interval is rolled directly.

### Advanced Settings checks

1. `Use Advanced Settings: false` does not require or read the Advanced card.
2. Switching it to true creates/preserves `Advanced RE Settings`.
3. Custom Pacing intervals affect the next pacing roll.
4. Custom Rarity weights affect weighted selection.
5. Custom Moderate Duration values alter runtime duration using the internal pacing adjustment.
6. Invalid individual values fall back only for that field and show the player-facing `[RE] ... failed, using default values.` message.
7. Switching Advanced Settings back off preserves the card but returns runtime behavior to built-in values.

### Compatibility check

Minimum Turn remains active in v0.17 and should continue to gate eligibility exactly as before. It is no longer a global Config default.

## Test hygiene

Use a fresh text adventure for isolated tests unless intentionally testing migration.

Do/Say/Story/Guide and Continue increment the RE turn. Retry does not.
