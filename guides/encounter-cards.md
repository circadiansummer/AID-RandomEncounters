# Encounter Cards

Encounter Story Cards are grouped automatically by their Notes Act:

- Act 1: `#RE - Act 1 Encounters`
- Act 2: `#RE - Act 2 Encounters` (and so on)

The encounter's Notes Act controls both the category and gameplay eligibility; the category is display-only. Canonical encounter keys remain `RAND_##`. A manual Act edit updates the category on the next normal maintenance pass.

## Manually adding encounters (v1.1 pre-release)

Create a Story Card with a `RAND_##` key such as `RAND_05`, a custom Title, and a real encounter description in its Entry. RE discovers it without registration; Config's Maximum Encounter Cards limits only automatic creation. If its RAND number duplicates another card, RE retains the first card's key and reassigns each later duplicate to the next unused higher number (e.g. when `RAND_01`–`RAND_04` exist, a new second `RAND_02` becomes `RAND_05`). Keys, default numeric titles, Encounter Number Notes, and any untouched RE default placeholder Entry are synchronized; custom content is preserved, and the player is informed.

**New in v1.1:** Missing Notes metadata is filled automatically on the next normal Context pass or /RE command. Blank Notes receive the canonical template using Global Defaults. Partial Notes preserve creator-supplied valid values and other Notes text; already complete Notes are not reflowed. Entry, Title, and Keys are not changed by initialization.

Initializing Notes does not generate an encounter narrative. Empty or untouched RE-placeholder Entries are **invalid**: automatic rolls skip them, and explicit `/RE start #` commands show a player-facing warning explaining how to edit or populate the card. If an Entry becomes invalid during an Active encounter or pending resolution, RE cancels its own encounter instruction/processing without inventing an outcome. The existing Populate Placeholder Cards toggle generates only untouched default placeholders; a blank manually created Entry must be filled by the creator or restored to the exact default placeholder first. Existing lifecycle status rewrites may normalize freeform Notes after activation.

## Current card metadata

```text
============== ENCOUNTER STATE ==============
- Status: Available
- Encounter Number: 1

============ ENCOUNTER SETTINGS ============
--------- PROGRESSION ---------
- Act: 1
- Importance: Required
---------- BEHAVIOR ----------
- Rarity: Common
- Duration: Default
- No Matter What: Default
```

Encounter Notes use compact spacing: headers sit directly above their fields, with one blank line between Encounter State and Encounter Settings.

## Default titles

New default cards are number-first:

`01 - Encounter Card`

`02 - Encounter Card`

Older default-title formats are not converted automatically.

Custom titles are preserved.

Lifecycle markers are temporarily prefixed to the title while relevant and removed when the card returns to Available.

## Default placeholder Entries

Newly generated blank encounter cards use the canonical Entry:

```text
[Define random encounter ## here.]
```

`Populate Placeholder Cards` can replace only Entries that still exactly match that form. Custom-written encounter text, existing Outcomes, and already-populated cards are not overwritten.

When population supplies a title, RE replaces only the untouched default `## - Encounter Card` title. Custom titles are preserved. Population does not change Act, Importance, Rarity, Duration, Status, keys, or other encounter metadata.

See `configuration.md` for the one-shot population workflow.

## Encounter State

### Status

Functional statuses are:

- `Available` — eligible when its Act is unlocked
- `Active` — currently being developed in the story
- `Awaiting Completion` — meaningfully begun but still incomplete
- `Retired` — awaiting resolution classification or completed successfully

Player-visible markers correspond to lifecycle transitions:

- 📝 Active
- 🔄 Awaiting Completion
- 💾 Returned to Available
- 🗃️ Completed Successfully

Status is the authoritative source of encounter availability. There is no separate runtime used-list.

### Encounter Number

Encounter Number identifies the RAND card and is script-managed.

Older non-functional Triggered Turn / Resolved Turn metadata is removed during maintenance.

## Progression settings

### Act

Act is a positive whole number starting at 1.

Eligibility uses:

```text
Encounter Act <= Current Act
AND Status = Available
```

### Importance

Importance is either `Required` or `Optional`.

Current Act advances only after every Required encounter assigned exactly to that Act completes successfully.

Optional encounters do not block advancement and remain eligible in later Acts while Available.

A Required encounter that returns to Available is still incomplete and continues blocking its Act.

## Behavior settings

### Rarity

Rarity determines weighted selection among eligible encounters.

Public values are Very Rare, Rare, Common, and Very Common.

See `configuration.md` for weights and Advanced Settings behavior.

### Duration

Duration determines the active runtime before resolution.

Duration scales with Encounter Pacing. Awaiting Completion uses 50% of the normal configured runtime Duration.

See `configuration.md` for the built-in duration table.

### No Matter What (v1.1 pre-release)

In encounter Notes under BEHAVIOR, set `No Matter What: Default`, `On`, or `Off`. `Default` inherits the global Config `No Matter What Mode` boolean (which starts `false`). `On` forces the more urgent immediate-introduction instruction for this encounter only; `Off` keeps this encounter on natural pacing even if the global toggle is on. RE preserves this value through lifecycle metadata writes and keeps Retry prompt strength consistent. No Matter What does not change encounter selection, weighting, duration, or completion rules.

## Activation and reminders

When an encounter is selected, the script injects a Random Encounter instruction into Context on the next real story action.

By default, the prompt tells the model to introduce the event naturally. With No Matter What enabled (globally or on an individual card), the AI is instructed to **begin introducing the encounter in the current response** while keeping the established scene coherent. This is not guaranteed model behavior.

While the encounter remains Active, the script reinforces it with an active-encounter reminder on later turns.

Retry/regeneration does not advance the Random Encounter turn or consume active Duration and reinjects the triggering encounter when needed.

## Resolution lifecycle

When an Active encounter reaches its runtime Duration, it is queued for classification.

The internal first-line classifier accepts:

```text
The encounter occurred: <summary>.
The encounter is in progress: <summary of progress and unresolved core parts>.
The encounter did not occur: <explanation>.
```

The three static classifier prefixes are authoritative while a resolution is pending. RE recognizes them case-insensitively even when another script places control material before the key. The following summary is normalized into canonical Outcome text, and the classifier material is removed before the player sees the normal story response.

### Occurred

- card remains Retired
- Outcome is stored
- successful Outcome remains on the encounter card
- Required success may advance Current Act

### In progress

- card becomes Awaiting Completion
- the same encounter re-enters the active slot
- runtime becomes 50% of the normal configured Duration
- repeated reductions never compound
- checks 1–4 may requeue
- the fifth consecutive in-progress check forces the encounter back to Available

### Did not occur

- card returns to Available
- Outcome is stored
- failed Outcome remains on the encounter card

### Manually displaced encounter

If `/RE start` or `/RE start #` replaces an Active encounter, the old encounter is still classified.

If that displaced encounter later classifies as in progress, it is forced to did-not-occur behavior and returns to Available so it cannot reclaim the active slot from the replacement.

## Outcomes

Resolution text is stored in the encounter Entry under:

```text
Outcome:
<classification sentence>
```

A new resolution replaces the prior stored Outcome because the script preserves only the encounter prompt before appending the new result.

`/RE reset #` and `/RE reset all` remove Outcomes.

`Restore Encounter Cards to Defaults` and `Set All Cards to Available` preserve Outcomes.

## Retired centralized History card

The separate History Story Card and its Context injection are no longer part of Random Encounters. Resolutions are stored directly in the `Outcome:` section on their RAND cards. Previous History cards are not migrated or automatically deleted.

### Act & Encounter Map

When `Display Act & Encounter Map: true`, RE maintains a script-managed `Act & Encounter Map` Story Card.

The map:
- begins its Entry with `READ ONLY` immediately followed by the first Act section, with no blank spacer line
- groups every discovered RAND encounter by Act
- identifies the current Act and future locked Acts
- shows each encounter number/title, Required/Optional Importance, and current lifecycle state
- derives queued/pending-resolution state from RE runtime where useful
- is read-only and never becomes a second source of truth
- is removed when the Config toggle is false
- is recreated if deleted while the toggle remains true
- refreshes only when its rendered content changes

Encounter cards remain authoritative for Act, Importance, settings, prompts, Outcomes, and lifecycle metadata.

## Bulk operations

### Restore Encounter Cards to Defaults

Applies current Global Default Act, Importance, Rarity, and Duration to every encounter card.

Preserves:

- Status
- prompt/Outcome
- custom title

An Active encounter retains its already-calculated runtime Duration until that attempt ends.

### Set All Cards to Available

Returns every card to Available and clears encounter runtime lifecycle state.

Preserves:

- Act
- Importance
- Rarity
- Duration
- prompt/Outcome
- custom title
- Current Act

### Reset commands

`/RE reset #`:

- returns one card to Available
- applies all current Global Defaults
- removes its Outcome
- clears that encounter's runtime lifecycle state

`/RE reset all`:

- returns all cards to Available
- applies all current Global Defaults
- removes all Outcomes
- clears all encounter runtime lifecycle state

## Current-schema compatibility

Current Encounter Cards use `Act`, `Importance`, `Rarity`, and `Duration` in Notes. Old field names are no longer recognized or converted. Missing or invalid current values fall back to built-in values when read; the script does not rewrite cards solely to upgrade their layout.
