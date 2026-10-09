# Configuration

## v0.17.2 testing layout

```text
================ SYSTEM ================

- Enabled: true
- Maximum Encounter Cards: 10
- Create Max Encounter Cards: false
- Use Advanced Settings: false
- Debug Logging: true


============== ENCOUNTERS ==============

- Encounter Pacing: Moderate


============= GLOBAL DEFAULTS =============

Changing these values overwrites the same setting on all encounter cards.

- Rarity: Common
- Duration: Default
```

### Maximum Encounter Cards

Controls how many sequential RAND cards the script will ensure exist when `Create Max Encounter Cards: true`.

For example, `Maximum Encounter Cards: 10` makes the generator ensure `RAND_01` through `RAND_10` exist. Existing encounter cards above that number are still discovered and fully managed by the script.

This setting does **not** limit weighted selection, targeted start/reset commands, reset-all, global defaults, or normal lifecycle handling.

Default: `10`.

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

`[RE] Fast Maximum Interval failed, using default values.`

Disabling Advanced Settings preserves the card and its customizations but ignores them.

### Minimum Turn

Minimum Turn remains functional on encounter cards during v0.17 for compatibility with the existing eligibility system. It is not exposed as a global default in the v0.17 Config layout.

### Cooldown

The separate post-encounter Cooldown layer has been removed. Once an encounter attempt ends, the system rolls the next Encounter Pacing interval.
