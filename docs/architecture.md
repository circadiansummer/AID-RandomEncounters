# Architecture

This document describes the reviewed v0.18.19 runtime structure of the Random Encounter System.

## Design principles

The library keeps one source of truth wherever practical:

- Encounter card `Status` determines lifecycle availability.
- Runtime stores at most one `activeEncounter`.
- `pendingEncounter` represents the one encounter waiting to be injected.
- `pendingResolutions` is a queue because manually displaced encounters can still require later classification.
- Config Story Cards are authoritative for user-editable settings.
- Global Defaults are templates for new/reset encounter cards rather than a live synchronization layer.
- Existing encounter settings change globally only through the explicit one-shot Restore Encounter Cards to Defaults toggle.
- Compatibility handling is kept at parsing and state-normalization boundaries rather than spread through the lifecycle.

The library intentionally avoids a larger framework, cache, or object model because the normal Story Card set is small and those layers would add more invalidation and maintenance complexity than they save.

## Hook flow

### Input

1. Check for a `/RE` control command.
2. If a command is handled, return the control sentinel and do not count a story turn.
3. Otherwise mark that a real input turn is pending.

### Context

1. Normalize runtime state.
2. If a control command is awaiting acknowledgement, inject the command-control instruction only.
3. Load and maintain Config, encounter cards, History, and Global Defaults.
4. Detect whether a real story turn advanced.
5. On a new turn:
   - retire an active encounter if its Duration has elapsed
   - process pacing changes
   - wait if an encounter resolution is pending
   - otherwise advance or roll the next pacing countdown
   - select and queue an eligible encounter when the countdown reaches zero
6. Inject, in order:
   - a newly queued encounter
   - the active-encounter reminder
   - encounter History
   - the oldest pending resolution request
7. On Retry/regeneration, do not advance the RE turn and reinject the triggering encounter when needed.

### Output

1. Suppress the AI response to a handled control command.
2. If a resolution is pending, parse and validate the first classifier line.
3. Apply the resulting lifecycle transition.
4. Remove the internal classifier line from player-visible prose.
5. Add visible encounter status markers when applicable.

## Encounter lifecycle

The functional card statuses are:

- `Available` — eligible when its Act is unlocked.
- `Active` — currently being developed in the story.
- `Awaiting Completion` — began but remains unresolved; requeued at 50% of normal Duration.
- `Retired` — awaiting classification or completed successfully.

A natural active encounter that reaches its Duration is temporarily retired and queued for resolution. No new pacing countdown is rolled until that classification is settled.

Resolution outcomes:

- `occurred` — stays Retired, enters History, and may advance the Act.
- `in progress` — returns to the active slot as Awaiting Completion unless it was manually displaced.
- `did not occur` — returns to Available.
- fifth consecutive `in progress` result — forced back to Available.
- manually displaced + `in progress` — treated as not occurring so it cannot reclaim the active slot.

## Selection

Eligibility is:

```text
Status = Available
AND Encounter Act <= Current Act
```

Eligible encounters are weighted by Rarity.

There is no separate runtime `used` list. Status is the availability source of truth.

## Bulk lifecycle reset

`Set All Cards to Available` is a one-shot lifecycle operation rather than a settings reset. It makes all encounter cards Available and clears active, queued, pending-resolution, marker, and pacing-countdown runtime state. It intentionally leaves encounter configuration, Outcomes, History, and Current Act unchanged.

This keeps the card Status source of truth synchronized with runtime state while providing a safe way to reopen all encounters without erasing their individual setup.

## Global Default behavior

Global Defaults are intentionally non-destructive:

- editing Act, Importance, Rarity, or Duration changes the defaults only
- new encounter cards use the current defaults
- `/RE reset #` and `/RE reset all` apply the current defaults
- `Restore Encounter Cards to Defaults: true` explicitly applies all four defaults to every existing encounter card and then resets itself to false
- Restore leaves lifecycle Status, prompt/Outcome content, and custom titles intact
- an active encounter keeps its already-calculated runtime Duration until that attempt ends

This keeps custom encounter behavior isolated unless the user explicitly requests a bulk restore.

## Progression

Each encounter has:

- `Act`
- `Importance: Required | Optional`

Current Act advances after every Required encounter assigned to that Act has completed successfully. Optional encounters never block advancement.

Earlier Optional encounters remain eligible after later Acts unlock if they are still Available.

## Runtime state

The reviewed runtime state is limited to data that affects behavior:

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
- `currentTurnMarkers`
- current parsed `config`

## Compatibility boundary

Legacy names are still recognized only where needed to upgrade older cards or in-progress saved state. Examples include:

- `Encounter Weight` -> Rarity
- `Retirement Length` -> Duration
- `Minimum Turn` -> removed
- `Create Missing Encounter Cards` -> Create Max Encounter Cards
- old `activeEncounters` array -> single `activeEncounter`
- old `reready` marker -> `returned`
- old runtime Duration/Rarity field names -> current names

Once normalized, the main lifecycle uses the current schema.

## Complexity intentionally retained

Three areas are deliberately more defensive because they solve known AI Dungeon behavior:

- Turn detection uses Input plus History/action-count high-water tracking so Retry does not create false turns.
- Control commands use the sentinel/acknowledgement path because direct stop-style command transport previously failed.
- Pending resolutions remain a queue because multiple manually displaced attempts can legitimately await classification.

These are treated as necessary runtime complexity rather than cleanup candidates.
