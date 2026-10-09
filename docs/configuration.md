# Configuration

## v0.18.9 testing layout

```text
================ SYSTEM ================
- Enabled: true
- Maximum Encounter Cards: 4
- Create Max Encounter Cards: true
- Use Advanced Settings: false
- Debug Logging: true

============== ENCOUNTERS ==============
- Encounter Pacing: Moderate
- Current Act: 1

============= GLOBAL DEFAULTS =============
Changing these values overwrites the same setting on all encounter cards.
- Act: 1
- Importance: Required
- Rarity: Common
- Duration: Default
```

### Config card spacing

Both the regular Config card and Advanced RE Settings card use compact spacing: no blank lines between headers, preset labels, and their settings; one blank line separates major sections. Existing cards are normalized to this layout without changing their values.

### Global Defaults

Every editable encounter-setting field has a matching Global Default:

- `Act` — positive whole number.
- `Importance` — `Required` or `Optional`.
- `Rarity` — Very Rare, Rare, Common, or Very Common.
- `Duration` — Very Short, Short, Default, Long, or Very Long.

Changing one of these values overwrites that same field on every discovered encounter card. Status and Encounter Number are not included because they are managed by the script rather than encounter configuration.

### Maximum Encounter Cards

Controls how many sequential RAND cards the script will ensure exist when `Create Max Encounter Cards: true`. The toggle is one-shot: after generation/verification completes, the script resets it to `false`.

For example, the clean-install `Maximum Encounter Cards: 4` makes the generator ensure `RAND_01` through `RAND_04` exist. Existing encounter cards above that number are still discovered and fully managed by the script.

This setting does **not** limit weighted selection, targeted start/reset commands, reset-all, global defaults, or normal lifecycle handling.

Default: `4`.

Clean-install `Create Max Encounter Cards` defaults to `true`, so a fresh adventure creates/ensures RAND_01 through RAND_04 on its first maintenance pass and then resets the toggle to `false`.

### Encounter Pacing

Public presets:

| Preset | Interval |
| --- | --- |
| Very Fast | 6–10 |
| Fast | 6–20 |
| Moderate | 10–30 |
| Slow | 30–50 |
| Very Slow | 30–90 |

Hidden testing preset: `Debug: 2–2`.

Moderate is the v0.17 clean-install default.

### Rarity

| Rarity | Numeric weight |
| --- | ---: |
| Very Rare | 1 |
| Rare | 2 |
| Common | 4 |
| Very Common | 8 |

Hidden testing rarity: `Debug: 10000`.

### Duration

Moderate baselines exposed by Advanced Settings:

| Duration | Moderate turns |
| --- | ---: |
| Very Short | 7 |
| Short | 11 |
| Default | 18 |
| Long | 25 |
| Very Long | 36 |

Other pacing adjustments remain internal. Hidden Debug Duration remains fixed at 2.

### Advanced RE Settings

When `Use Advanced Settings: true`, the system ensures an editable Story Card titled `Advanced RE Settings` and reads public Pacing, Rarity, and Duration values from it.

Debug-only values are not exposed.

Invalid individual advanced values fall back only for that field to its built-in value and produce a player-facing message such as:

`RE - Fast maximum interval is invalid; using the default value.`

Disabling Advanced Settings preserves the card and its customizations but ignores them.

### Player-facing system messages

Player-facing system messages use the `RE - ` prefix and sentence-case wording. This includes command confirmations/errors, validation warnings, reset notices, and Act progression notices. Internal debug logs continue to use `[Random Encounters]` in the scripting console.

### Current Act

Current Act defaults to `1`. Encounter cards are eligible when their Act is less than or equal to Current Act and their Status is Available.

The system advances Current Act after all Required encounters assigned to the current Act have completed successfully. Optional encounters never block progression.

### Cooldown

The separate post-encounter Cooldown layer has been removed. Once an encounter attempt ends, the system rolls the next Encounter Pacing interval.
