# Configuration

## v0.18.30 layout

```text
================ SYSTEM ================
- Enabled: true
- Maximum Encounter Cards: 4
- Create Max Encounter Cards: true
- Populate Placeholder Cards: false
- Display Act & Encounter Map: false
- Use Advanced Settings: false
- Debug Logging: false

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

Both the regular Config card and Advanced RE Settings card use compact spacing. Existing cards are normalized to the current layout without intentionally overwriting valid edited values.

## System settings

### Enabled

`Enabled: true|false` controls encounter injection and automatic encounter pacing/selection. `/RE on` and `/RE off` change this value directly.

Control commands remain available while disabled, but a queued encounter will not inject until `Enabled` becomes `true` again.

### Maximum Encounter Cards

`Maximum Encounter Cards` is the highest sequential RAND number the script will ensure exists when `Create Max Encounter Cards: true`.

The default is `4`, so a clean install ensures `RAND_01` through `RAND_04`.

This value is generation-only. Existing cards above the maximum remain discovered and managed by weighted selection, commands, resets, progression, and bulk operations.

### Create Max Encounter Cards

`Create Max Encounter Cards: true` is a one-shot generation action.

The script:

1. ensures every sequential card from `RAND_01` through `RAND_<Maximum>` exists
2. creates any missing cards using the current Global Defaults
3. resets the toggle to `false`

Clean installs begin with this toggle set to `true`.

### Populate Placeholder Cards

`Populate Placeholder Cards: true` is a one-shot usability action for untouched generated cards.

It targets only encounter Entries that still exactly match the canonical placeholder form:

```text
[Define random encounter ## here.]
```

On the next real story generation, RE asks the model to continue the story normally and also generate one scenario for each eligible placeholder using this exact content instruction:

> Generate low-stakes, dynamic encounters appropriate to the established setting, genre, technology level, supernatural rules, current locations, factions, characters, and conflicts. Do not introduce setting-breaking concepts.

The generated data is appended in a machine-readable block, removed from player-visible Output, and then applied to the requested cards.

Population:
- never overwrites custom encounter Entry text
- never overwrites an existing Outcome
- preserves Act, Importance, Rarity, Duration, Status, keys, and other encounter metadata
- replaces a card title only when that title is still the untouched default `## - Encounter Card`
- preserves custom titles
- can partially succeed; invalid or missing returned cards remain untouched
- resets the toggle to `false` after success, partial success, or a handled failure
- immediately resets without using a model generation when no untouched placeholders exist
- waits through Retry/regeneration, stopped Context passes, and recognized external model-task turns

While a population request is pending, untouched placeholders are temporarily protected from random selection or targeted `/RE start #` activation so default instructional text cannot become an encounter.

### Use Advanced Settings

When `Use Advanced Settings: true`, the system ensures an editable Story Card titled `Advanced RE Settings` and uses its public Pacing, Rarity, and Duration values.

Disabling Advanced Settings preserves the card and its edits but ignores them.

### Debug Logging

`Debug Logging: true|false` controls diagnostic `[Random Encounters]` console messages. Clean installs default to `false`; enable it when troubleshooting or validating script behavior.

It does not control player-facing `RE - ` messages.

### Display Act & Encounter Map

`Display Act & Encounter Map: true|false` controls the script-managed `Act & Encounter Map` Story Card.

- Default: `false`
- `true`: create the map if missing and keep it synchronized with current encounter/Act state
- `false`: remove every Story Card using the canonical Act Map key
- the map Entry begins with `READ ONLY` immediately followed by the first Act section, with no blank spacer or separate `CURRENT ACT: #` line
- the map groups encounters by Act and shows encounter number/title, Importance, and current lifecycle state
- future Acts are labeled locked; the current Act is labeled current
- the map is derived from encounter cards/runtime state and is never a source of truth
- manual edits to the map are overwritten the next time RE refreshes it
- refreshes are piggybacked on normal RE maintenance/lifecycle work and only write when rendered content actually changes

This display preference belongs under SYSTEM because it controls a script-managed reference surface rather than encounter behavior.

## Encounter settings

### Encounter Pacing

Encounter Pacing controls how many future story turns pass between encounter opportunities.

| Preset | Interval |
| --- | --- |
| Very Fast | 6–10 |
| Fast | 6–20 |
| Moderate | 10–30 |
| Slow | 30–50 |
| Very Slow | 30–90 |

Hidden testing preset: `Debug: 2–2`.

A new pacing countdown is not rolled while an encounter is still waiting for resolution classification.

### Current Act

Current Act defaults to `1` and is an upper eligibility bound.

An encounter can be selected when:

```text
Status = Available
AND Encounter Act <= Current Act
```

Current Act advances after all Required encounters assigned exactly to the current Act have completed successfully. Optional encounters never block progression.

Earlier Optional encounters remain eligible after later Acts unlock if they are still Available.

Automatic advancement shows a player-facing confirmation such as:

`RE - Act 1 is complete. Act 2 encounters are now available.`

### Set All Cards to Available

`Set All Cards to Available: true` is a one-shot lifecycle reset.

It:

- sets every discovered encounter card to Available
- clears any active encounter
- clears a queued encounter
- clears pending resolution requests
- clears current-turn lifecycle markers
- clears the pending pacing countdown
- preserves Act, Importance, Rarity, and Duration on every card
- preserves prompts and existing Outcomes
- preserves custom titles, removing only lifecycle status markers
- preserves History, including archived History Notes
- preserves Current Act
- resets itself to `false`

This differs from `/RE reset all`: reset-all also applies the current Global Defaults and deletes Outcomes.

## Global Defaults

The four Global Defaults are:

- `Act` — positive whole number
- `Importance` — Required or Optional
- `Rarity` — Very Rare, Rare, Common, or Very Common
- `Duration` — Very Short, Short, Default, Long, or Very Long

Global Defaults are intentionally non-destructive.

Changing a default:

- changes the template used by newly generated encounter cards
- changes what `/RE reset #` and `/RE reset all` restore
- does **not** modify existing encounter-card settings by itself

Status and Encounter Number are script-managed and are not Global Defaults.

### Restore Encounter Cards to Defaults

`Restore Encounter Cards to Defaults: true` explicitly applies all four current Global Defaults to every discovered encounter card, then resets itself to `false`.

Restore preserves:

- lifecycle Status
- prompt text
- existing Outcome text
- custom titles

If an encounter is already Active, its currently calculated runtime Duration remains locked for that attempt. The restored card Duration applies on future activations.

## Rarity and weighted selection

Rarity controls weighted selection among currently eligible encounters.

| Rarity | Weight |
| --- | ---: |
| Very Rare | 1 |
| Rare | 2 |
| Common | 4 |
| Very Common | 8 |

Hidden testing rarity: `Debug: 10000`.

Weights are relative. A larger weight makes that Rarity more likely to be selected than eligible encounters with lower weights.

## Duration

Duration controls how long an encounter remains Active before a resolution check.

Built-in turns by pacing:

| Duration | Very Fast | Fast | Moderate | Slow | Very Slow |
| --- | ---: | ---: | ---: | ---: | ---: |
| Very Short | 4 | 7 | 7 | 11 | 14 |
| Short | 7 | 11 | 11 | 18 | 22 |
| Default | 11 | 14 | 18 | 25 | 32 |
| Long | 14 | 22 | 25 | 36 | 47 |
| Very Long | 18 | 29 | 36 | 50 | 65 |

Hidden Debug Duration is fixed at 2 turns.

Awaiting Completion requeues at 50% of the encounter's normal configured runtime Duration, rounded to the nearest whole turn with a minimum of 1. The reduction never compounds.

## Advanced RE Settings

The Advanced card exposes:

- Pacing Minimum Interval / Maximum Interval values
- Rarity weights
- Moderate-pacing Duration baselines

Custom Duration baselines are scaled to other pacing modes using the same relative built-in ratios.

Invalid individual Advanced values fall back only for that field to the built-in value and produce a player-facing warning such as:

`RE - Fast maximum interval is invalid; using the default value.`

Debug-only test values are not exposed in the Advanced card.

## Runtime commands

The Config Story Card Notes include this command reference:

- `/RE help` — show the command list
- `/RE on` — enable automatic random encounters
- `/RE off` — disable automatic random encounters
- `/RE start` — queue a weighted eligible encounter; if one is Active, end it first
- `/RE start #` — queue a specific eligible encounter; if one is Active, end it first
- `/RE end` or `/RE stop` — end the Active encounter and queue its resolution
- `/RE reset #` — reset one encounter to Available, apply current Global Defaults, and clear its Outcome
- `/RE reset all` — reset all encounters to Available, apply current Global Defaults, and clear Outcomes

Control commands do not consume a story turn.

Targeted start requires the requested card to exist, be Available, and have `Act <= Current Act`.

## Player-facing messages

Player-facing system messages use the `RE - ` prefix and sentence case.

This includes command confirmations/errors, invalid-setting warnings, bulk-toggle confirmations, reset notices, and Act progression notices.

Internal diagnostics retain the `[Random Encounters]` console prefix.

## Removed legacy systems

The current runtime has:

- no separate post-encounter Cooldown
- no Minimum Turn eligibility field

Legacy card/config/runtime forms supported by migration are normalized into the current schema.
