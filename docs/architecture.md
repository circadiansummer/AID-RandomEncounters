# Architecture

This document describes the v0.18.29 runtime structure of the Random Encounter System.

## Design principles

- One canonical product build is maintained. Compatibility folders are test harnesses, not alternate RE distributions.
- Generic compatibility protections belong in the core library whenever RE can implement them without depending on another script's private wrapper behavior.

The library keeps one source of truth wherever practical:

- encounter card `Status` determines lifecycle availability
- runtime stores at most one `activeEncounter`
- `pendingEncounter` represents the one encounter waiting to be injected
- `pendingResolutions` remains a queue because displaced encounters can still require later classification
- Config Story Cards are authoritative for user-editable settings
- Global Defaults are templates for new/reset cards, not a live synchronization layer
- existing encounter settings change globally only through the explicit Restore Encounter Cards to Defaults toggle
- compatibility handling is concentrated at parsing/state-normalization boundaries and generic runtime ownership detection

The library intentionally avoids a larger cache/object framework because the normal Story Card set is small and the extra invalidation complexity would outweigh the savings.

## Story Card model

### Config

Type: `#RE - Config & History`

Key: `random encounter settings`

Contains SYSTEM, ENCOUNTERS, and GLOBAL DEFAULTS settings plus comprehensive user-facing Notes and the runtime command reference.

### Advanced RE Settings

Created/used when `Use Advanced Settings: true`.

Type: `#RE - Config & History`

Key: `advanced random encounter settings`

Exposes public Pacing intervals, Rarity weights, and Moderate Duration baselines.

### Encounter cards

Type: `#RE - Encounters`

Keys: `RAND_##`

Default title: `## - Encounter Card`

Script-managed State contains Status and Encounter Number. Editable settings are Act, Importance, Rarity, and Duration.

### Random Encounter History

Type: `#RE - Config & History`

Key: `random encounter history`

Stores successful encounters only. The Entry is a read-only recent-history view capped at 12 items / 3000 characters and is the only History material injected into Context. When the recent view exceeds either limit, the oldest item moves into an `ARCHIVED HISTORY` section in Notes instead of being discarded.

The History parser migrates the earlier one-line `- title: resolution` representation into the current block layout. Fixed Notes documentation and archived records are rendered separately so documentation refreshes do not erase the archive.

History is not governed by the same display toggle pattern as the Act Map because the History card is persisted functional data, not a disposable derived view. Removing the card would remove the recent/context history and Notes archive.

### Act & Encounter Map

Type: `#RE - Config & History`

Key: `random encounter act map`

Optional derived read-only view controlled by `Display Act & Encounter Map`.

When enabled, the map groups encounters by Act and renders number/title, Importance, and current lifecycle state. Encounter cards plus RE runtime remain authoritative. The map is removed when disabled and recreated if missing while enabled. Synchronization compares rendered content before writing so normal maintenance can safely check the map without rewriting an unchanged Story Card.

## Configuration actions

`Display Act & Encounter Map` is a persistent SYSTEM display preference: false removes the derived map card; true ensures it exists and remains synchronized.

Three other Config toggles are intentionally one-shot operations:

- `Create Max Encounter Cards` — ensure sequential RAND cards through Maximum Encounter Cards, then reset false
- `Restore Encounter Cards to Defaults` — apply all four current Global Defaults to existing cards, then reset false
- `Set All Cards to Available` — reopen all encounters and clear lifecycle runtime state, then reset false

Global Default edits themselves are non-destructive.

## Hook flow

### Input

1. Check for a `/RE` control command.
2. If handled, return the control sentinel and do not count a story turn.
3. Otherwise mark that a real input turn is pending.

### Context

1. Normalize runtime state.
2. If a control command is awaiting acknowledgement, inject only the control acknowledgement instruction.
3. Load/maintain Config, encounter cards, bulk toggles, and History.
4. Detect whether a real story turn advanced.
5. On a new turn:
   - retire the active encounter if its Duration elapsed
   - process pacing changes
   - wait if any resolution is pending
   - otherwise advance or roll the next pacing countdown
   - select and queue an eligible encounter when the countdown reaches zero
6. Inject:
   - a newly queued encounter
   - the active encounter reminder
   - successful encounter History
   - the oldest pending resolution request
7. On Retry/regeneration, do not advance the RE turn; reinject the triggering encounter when required.

When `Enabled: false`, control commands can still be entered, but encounter injection remains paused. A queued encounter waits until Enabled becomes true again.

### Output

1. Suppress the AI response to a handled control command.
2. If a resolution is pending, search output for one of the three static RE classifier keys.
3. Use the matched key as the authoritative classification and normalize the following summary into canonical Outcome text.
4. Apply the lifecycle transition.
5. Remove the internal classifier material from player-visible prose.
6. Add lifecycle markers when applicable.

Static classifier-key recognition is active only while a resolution is pending, so ordinary story prose is not globally scanned or rewritten.

## Selection

Eligibility is:

```text
Status = Available
AND Encounter Act <= Current Act
```

Eligible encounters are weighted by Rarity.

There is no redundant runtime used-list; card Status is authoritative.

## Pacing and Duration

Encounter Pacing determines the random interval before the next encounter opportunity.

Duration determines how long an encounter remains Active. Public Duration values scale by pacing; Debug Duration remains an internal fixed test value.

A new pacing countdown is not rolled while resolution is pending.

Awaiting Completion uses 50% of the normal configured runtime Duration, recalculated from the normal value each time rather than compounding.

## Encounter lifecycle

Functional card statuses:

- `Available`
- `Active`
- `Awaiting Completion`
- `Retired`

Normal flow:

```text
Available -> queued -> Active -> Retired/resolution
```

Resolution outcomes:

- `occurred` — remains Retired, stores Outcome, enters History, may advance Act
- `in progress` — becomes Awaiting Completion and re-enters active slot at 50% Duration
- `did not occur` — returns Available and stores Outcome
- fifth consecutive `in progress` — forced failure back to Available
- manually displaced + `in progress` — forced failure back to Available so it cannot reclaim the active slot

Output markers:

- 📝 Active
- 🔄 Awaiting Completion
- 💾 Returned to Available
- 🗃️ Completed Successfully

## Outcomes and History

Encounter Entries contain the event prompt plus at most one current `Outcome:` section.

Each accepted resolution replaces the previous stored Outcome.

Only successful occurrences enter Random Encounter History.

Reset commands clear Outcomes; Restore Defaults and Set All Cards to Available preserve them.

## Progression

Each encounter has:

- `Act`
- `Importance: Required | Optional`

Current Act is an upper eligibility bound.

It advances when all Required encounters assigned exactly to the current Act have successfully completed. Optional encounters never block progression.

Returned Required encounters remain incomplete.

## Bulk lifecycle reset

`Set All Cards to Available`:

- sets all card Status values to Available
- clears active, queued, pending-resolution, marker, and pacing-countdown runtime state
- preserves card settings, Outcomes, History, Current Act, and custom titles

This is deliberately distinct from `/RE reset all`.

## Global Default behavior

Global Defaults are non-destructive:

- edits affect new cards and future reset behavior
- `/RE reset #` and `/RE reset all` apply current defaults
- Restore Encounter Cards to Defaults explicitly applies all four defaults to all existing cards
- Restore preserves Status, prompt/Outcome, and custom base titles
- an already-active encounter keeps its calculated runtime Duration until that attempt ends

## Advanced Settings

When enabled, the Advanced card overrides public built-in values.

- Pacing: custom min/max intervals
- Rarity: custom relative weights
- Duration: custom Moderate baselines, scaled to other pacing modes using built-in ratios

Invalid individual values fall back only for that field and emit an `RE - ` warning.

Debug-only presets remain internal.

## Commands

Canonical commands:

- `/RE help`
- `/RE on`
- `/RE off`
- `/RE start`
- `/RE start #`
- `/RE end`
- `/RE stop`
- `/RE reset #`
- `/RE reset all`

Commands use the sentinel/acknowledgement path and do not consume a story turn.

`/RE start` uses weighted eligible selection. `/RE start #` targets an existing Available encounter whose Act is unlocked.

Starting while Active first displaces the current encounter and queues its resolution.

## Runtime state

Functional persisted runtime state is limited to:

- `turn`
- `nextEncounterIn`
- `pendingEncounter`
- `activeEncounter`
- `pendingResolutions`
- `pendingInputTurn`
- `historyLength`
- `actionCountHigh`
- `lastInjectedEncounter`
- `pendingPacingChange`
- `messageSnapshot`
- `externalTaskOwner`
- `compatibilityPauseRequest`
- `currentTurnMarkers`
- current parsed `config`

## Cross-script model-turn ownership

RE distinguishes normal story turns from model turns temporarily owned by another script.

Built-in adapters currently recognize:

- Auto-Cards generation/compression
- Inner Self-bundled Auto-Cards task events
- Story Arc Engine arc-generation turns

Integrations can also request a one-turn pause with:

`RandomEncounters("pause", "Script Name")`

During a compatibility pause, RE synchronizes its History/action-count high-water marks but does not advance its own turn, pacing countdown, Active Duration, injection, or resolution lifecycle. Output is passed through untouched.

The Context wrapper also preserves `stop` and skips RE when a prior modifier already owns the turn with `stop = true`.

## Retry safety

Turn detection combines Input marking with History/action-count high-water tracking.

Retry/regeneration does not advance the Random Encounter turn or reduce active Duration.

## Compatibility boundary

Legacy names/forms recognized for migration include:

- Encounter Weight -> Rarity
- Retirement Length -> Duration
- Minimum Turn -> removed
- Create Missing Encounter Cards -> Create Max Encounter Cards
- old default titles `Random Encounter ##` -> `## - Encounter Card`
- old `activeEncounters` array -> single `activeEncounter`
- old `reready` marker -> `returned`
- old runtime Duration/Rarity field names -> current names

Once normalized, the lifecycle uses the current schema.

## Intentional complexity

Three defensive systems remain because they solve known AI Dungeon behavior:

- Retry-safe turn detection
- sentinel command transport
- queued pending resolutions for displaced encounters

These are intentional runtime requirements rather than cleanup candidates.


## Shared player-message ownership

RE stores a completed-output snapshot of `state.message`.

- `postUserMessage()` compares the current message against the last completed snapshot.
- If they match, the existing toast is stale/completed and RE replaces it.
- If they differ, another script has changed the message since that snapshot, so RE preserves the current text and appends its own message.
- At the end of every Output hook, RE refreshes the completed-output snapshot, including control-command suppression and compatibility pass-through paths.

This lets RE cooperate with scripts such as Auto-Cards without hard-coding their message strings.
