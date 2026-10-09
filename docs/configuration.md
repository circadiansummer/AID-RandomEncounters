# Configuration

## v0.18.19 testing layout

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
- Set All Cards to Available: false

============= GLOBAL DEFAULTS =============
Defaults apply to new or reset encounter cards. Existing cards change only when Restore Encounter Cards to Defaults is true.
- Act: 1
- Importance: Required
- Rarity: Common
- Duration: Default
- Restore Encounter Cards to Defaults: false
```

### Config card spacing

Both the regular Config card and Advanced RE Settings card use compact spacing: no blank lines between headers, preset labels, and their settings; one blank line separates major sections. Existing cards are normalized to this layout without changing their values.

### Global Defaults

Every editable encounter-setting field has a matching Global Default:

- `Act` — positive whole number.
- `Importance` — `Required` or `Optional`.
- `Rarity` — Very Rare, Rare, Common, or Very Common.
- `Duration` — Very Short, Short, Default, Long, or Very Long.

Changing one of these values only changes the default used by newly generated encounter cards and by reset commands. Existing encounter-card settings are left untouched.

Set `Restore Encounter Cards to Defaults: true` to apply all four current defaults to every discovered encounter card. This is a one-shot action: after the update completes, the script resets the toggle to `false`.

Restore changes Act, Importance, Rarity, and Duration only. It preserves lifecycle Status, prompt/Outcome content, and custom titles. If an encounter is already active, its current runtime Duration remains locked for that attempt; the restored Duration applies to future activations.

Status and Encounter Number are not Global Defaults because they are managed by the script rather than encounter configuration.

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

### Runtime commands

The Config Story Card Notes include the in-adventure command reference:

- `/RE help` — show the command list.
- `/RE on` — enable random encounters.
- `/RE off` — disable random encounters.
- `/RE start` — queue a weighted eligible encounter; if one is active, end it first.
- `/RE start #` — queue a specific eligible encounter; if one is active, end it first.
- `/RE end` or `/RE stop` — end the active encounter and queue its resolution.
- `/RE reset #` — reset one encounter to Available, apply current Global Defaults, and clear its Outcome.
- `/RE reset all` — reset all encounters to Available, apply current Global Defaults, and clear Outcomes.

Control commands do not consume a story turn.

### Player-facing system messages

Player-facing system messages use the `RE - ` prefix and sentence-case wording. This includes command confirmations/errors, validation warnings, reset notices, and Act progression notices. Internal debug logs continue to use `[Random Encounters]` in the scripting console.

### Set All Cards to Available

`Set All Cards to Available: true` performs a one-shot lifecycle reset across every discovered encounter card, then automatically returns the toggle to `false`.

It:

- sets every encounter card's Status to Available
- clears any active encounter, queued encounter, pending resolutions, current-turn markers, and pending pacing countdown
- preserves each encounter card's Act, Importance, Rarity, and Duration
- preserves prompt and Outcome content
- preserves custom titles, removing only lifecycle status markers such as 📝, 🔄, or 🗃️
- preserves Random Encounter History
- preserves Current Act

This differs from `/RE reset all`: reset-all also applies the current Global Defaults and clears Outcomes, while Set All Cards to Available changes lifecycle state only.

### Current Act

Current Act defaults to `1`. Encounter cards are eligible when their Act is less than or equal to Current Act and their Status is Available.

The system advances Current Act after all Required encounters assigned to the current Act have completed successfully. Optional encounters never block progression.

### Cooldown

The separate post-encounter Cooldown layer has been removed. After an encounter attempt receives its resolution classification, the system rolls the next Encounter Pacing interval. A new countdown is not rolled while resolution is still pending.
