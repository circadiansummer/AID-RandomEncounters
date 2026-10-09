# Encounter Cards

Encounter Story Cards use type:

`#RE - Encounters`

Their canonical keys are `RAND_##`.

## v0.18.24 card metadata

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
```

Encounter Notes use compact spacing: headers sit directly above their fields, with one blank line between Encounter State and Encounter Settings.

## Default titles

New default cards are number-first:

`01 - Encounter Card`

`02 - Encounter Card`

The script automatically migrates the old exact default-title pattern `Random Encounter ##` to the number-first format.

Custom titles are preserved.

Lifecycle markers are temporarily prefixed to the title while relevant and removed when the card returns to Available.

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

## Activation and reminders

When an encounter is selected, the script injects a Random Encounter instruction into Context on the next real story action.

The prompt tells the model to introduce or set up the event naturally rather than abruptly interrupting the current scene.

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

The classifier line must be one line, 25–350 characters, and end with punctuation. It is removed before the player sees the normal story response.

### Occurred

- card remains Retired
- Outcome is stored
- success is added to Random Encounter History
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
- it is not added to History

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

## Random Encounter History

Only successfully occurred encounters enter History.

The History Story Card:

- uses type `#RE - Config & History`
- stores at most 12 entries
- has a 3000-character cap
- trims older entries automatically when limits are exceeded
- is injected into Context when it contains entries

Failed, returned, and still-in-progress encounters do not enter History.

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
- History
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

## Compatibility

Legacy card fields supported by migration include:

- Encounter Weight -> Rarity
- Retirement Length -> Duration
- Minimum Turn -> removed

Missing current fields on legacy/incomplete cards are filled from current Global Defaults where appropriate.
