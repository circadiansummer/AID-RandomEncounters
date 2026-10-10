# Architecture

This document describes the current v1.1 pre-release runtime structure of the Random Encounter System.

## Design principles

- One canonical product build is maintained. Compatibility folders are test harnesses, not alternate RE distributions.
- Generic compatibility protections belong in the core library whenever RE can implement them without depending on another script's private wrapper behavior.

The library keeps one source of truth wherever practical:

- encounter card `Status` determines lifecycle availability
- runtime stores at most one `activeEncounter`
- `pendingEncounter` represents the one encounter waiting to be injected
- `pendingResolutions` remains a queue because displaced encounters can still require later classification
- `placeholderPopulation` tracks one pending one-shot request to populate untouched default encounter cards
- Config Story Cards are authoritative for user-editable settings
- Global Defaults are templates for new/reset cards, not a live synchronization layer
- existing encounter settings change globally only through the explicit Restore Encounter Cards to Defaults toggle
- compatibility handling is concentrated at parsing/state-normalization boundaries and generic runtime ownership detection

The library intentionally avoids a larger cache/object framework because the normal Story Card set is small and the extra invalidation complexity would outweigh the savings.

## Story Card model

### Config

Type: `#RE - Config`

Key: `random encounter settings`

Titled `Config`; contains SYSTEM, ENCOUNTERS, and GLOBAL DEFAULTS settings plus comprehensive user-facing Notes and the runtime command reference.

### Advanced RE Settings

Created/used when `Use Advanced Settings: true`.

Type: `#RE - Config`

Key: `advanced random encounter settings`

Exposes public Pacing intervals, Rarity weights, and Moderate Duration baselines.

### Encounter cards

Type: `#RE - Encounters`

Keys: `RAND_##`

Default title: `## - Encounter Card`

Script-managed State contains Status and Encounter Number. Editable settings are Act, Importance, Rarity, and Duration.

### Retired History card

The centralized History card is no longer used, created, maintained, or injected into model Context. Outcomes live directly on RAND card Entries. Old History cards are not scanned for or deleted automatically; older adventures are not migrated to the current script layout.

### Act & Encounter Map

Type: `#RE - Config`

Key: `random encounter act map`

Optional derived read-only view controlled by `Display Act & Encounter Map`.

When enabled, the map groups encounters by Act and renders number/title, Importance, and current lifecycle state. Encounter cards plus RE runtime remain authoritative. The map is removed when disabled and recreated if missing while enabled. Synchronization compares rendered content before writing so normal maintenance can safely check the map without rewriting an unchanged Story Card.

## Configuration actions

`Display Act & Encounter Map` is a persistent SYSTEM display preference: false removes the derived map card; true ensures it exists and remains synchronized.

Four other Config toggles are intentionally one-shot operations:

- `Create Max Encounter Cards` — ensure sequential RAND cards through Maximum Encounter Cards, then reset false
- `Populate Placeholder Cards` — acknowledge the request immediately, retry unfilled placeholder Entries on subsequent eligible turns, then reset false only after completion
- `Restore Encounter Cards to Defaults` — apply all four current Global Defaults to existing cards, then reset false
- `Set All Cards to Available` — reopen all encounters and clear lifecycle runtime state, then reset false

Global Default edits themselves are non-destructive.

## Routine maintenance efficiency

Config and Advanced Settings Notes remain script-managed, but are assigned only when their generated contents change. The population-start branch reuses the Act Map synchronization already performed by maintenance; a normal turn still re-synchronizes the map after lifecycle changes. The canonical Library remains the only product implementation; the Inner Self fixture contains an exact embedded copy.

## Placeholder population flow

`Populate Placeholder Cards` is implemented in the canonical library as a pending one-shot request with automatic retry.

1. Maintenance detects the toggle, records only untouched canonical placeholder numbers, initializes a persistent per-request attempt counter to zero, and posts the initial `RE - Encounter population in progress.` receipt popup.
2. Stopped Context passes, recognized external model-task turns, and command-controlled turns do not consume the request.
3. On the next eligible real input, RE increments the attempt counter and posts `RE - Encounter population in progress - Attempt N.`, suspends its normal encounter turn processing, and appends a dedicated non-story generation instruction to the existing world Context. Recognized external-task deferrals, stopped Context, and repeated Context calls within one in-progress generation do not increment the counter.
4. Output parses requested RAND blocks and writes only untouched cards, preserving customized data and enforcing one Scenario sentence.
5. When the model ignores the instruction and returns ordinary narrative prose, RE passes it through unchanged. Missing cards remain queued, and a later eligible action retries automatically with an updated numbered popup. With Inner Self enabled, this may require many eligible actions; the Config Notes explain the delay and that no manual toggle change is needed.
6. Partial or malformed RAND control output is hidden behind `[RE] Updating Encounter Cards - Hit Continue`, with two newline characters before and after the status. Successfully populated cards remain saved; only unfilled target numbers are retried.
7. Once all requested placeholders are complete, RE resets the one-shot toggle and posts `RE - New encounters generated.`. Normal story processing resumes on the next Continue.
8. Generation attempts do not advance RE pacing, Active Duration, encounter selection, or resolution lifecycle. These are turn-triggered model generations, **not** asynchronous background requests.

While a request is queued or generating, untouched placeholders are excluded from automatic weighted selection. Targeted `/RE start #` also refuses them, and a placeholder already queued waits until population finishes.

## Hook adapter

`RandomEncountersContext(text)` is the canonical Context adapter. The Context file delegates to it directly and contains no compatibility-specific branching. The adapter safely reads an optional external `stop` binding and returns the modifier object. The core Context route treats `stop = true` as an externally owned/stopped pass, synchronizes turn-detection high-water state, and performs no RE pacing, Duration, injection or resolution work.

## Hook flow

### Input

1. Check for a `/RE` control command.
2. If handled, return the control sentinel and do not count a story turn.
3. Otherwise mark that a real input turn is pending.

### Context

1. Normalize runtime state.
2. If a control command is awaiting acknowledgement, inject only the control acknowledgement instruction.
3. Load/maintain Config, encounter cards, and bulk toggles.
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

Before the first successful **automatic** encounter roll, `First Encounter Turn` optionally overrides only that initial countdown. The parser accepts `0` (original behavior), a positive integer (absolute RE story turn), or an inclusive ascending `min-max` range. The range is rolled once, with the chosen `firstEncounterTarget` persisted and used to compute `nextEncounterIn = max(0, firstEncounterTarget - turn)`. When the target has arrived, weighted eligible selection is attempted; if unavailable/blocked, it is retried on the next eligible RE story turn. On successful selection, `firstAutomaticEncounterDone` becomes true and the existing pacing algorithm takes over.

Manual command activation does not set this flag. Config changes reschedule only before the first automatic selection; pacing changes do not overwrite an outstanding first-turn override. An externally owned task, an Active event, pending resolution, disabled setting, and Retry do not consume the first-turn deadline.

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

- `occurred` — remains Retired, stores Outcome on the RAND card, may advance Act
- `in progress` — becomes Awaiting Completion and re-enters active slot at 50% Duration
- `did not occur` — returns Available and stores Outcome
- fifth consecutive `in progress` — forced failure back to Available
- manually displaced + `in progress` — forced failure back to Available so it cannot reclaim the active slot

Output markers:

- 📝 Active
- 🔄 Awaiting Completion
- 💾 Returned to Available
- 🗃️ Completed Successfully

## Outcomes

Encounter Entries contain the event prompt plus at most one current `Outcome:` section.

Each accepted resolution replaces the previous stored Outcome.

There is no separate History Story Card or encounter-history Context injection.

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
- preserves card settings, Outcomes, Current Act, and custom titles

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
- `/RE status`
- `/RE on`
- `/RE off`
- `/RE start`
- `/RE start #`
- `/RE end`
- `/RE stop`
- `/RE reset #`
- `/RE reset all`

Commands use the sentinel/acknowledgement path and do not consume a story turn.

`/RE status` takes an early command path before `maintenance()`. It reads Enabled directly from the current Config Entry and uses existing `state.randomEncounters` countdown/queue/active/resolution/population fields; the only writes are the player popup and existing control-command acknowledgement fields. It neither creates cards nor advances turns, rerolls countdowns, or changes one-shot settings. State priority: disabled → population → pending resolution → active/Awaiting Completion → queued → next countdown → uninitialized.

`/RE start` uses weighted eligible selection. `/RE start #` targets an existing Available encounter whose Act is unlocked.

Starting while Active first displaces the current encounter and queues its resolution.

## Runtime state

Functional persisted runtime state is limited to:

- `turn`
- `nextEncounterIn`
- `firstEncounterTarget`
- `firstAutomaticEncounterDone`
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

During a compatibility pause, RE synchronizes its action-history/action-count high-water marks but does not advance its own turn, pacing countdown, Active Duration, injection, or resolution lifecycle. Output is passed through untouched.

The Context wrapper also preserves `stop` and skips RE when a prior modifier already owns the turn with `stop = true`.

## Retry safety

Turn detection combines Input marking with action-history length and action-count high-water tracking; it does not depend on the retired History Story Card.

Retry/regeneration does not advance the Random Encounter turn or reduce active Duration.

## Current-schema boundary

Legacy Config, card, title, and runtime-state formats are not recognized or upgraded. Only the current fields are read; unknown fields on valid current encounter cards remain preserved during ordinary lifecycle writes. The standalone History card is retired but not scanned for, rewritten, or deleted.

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
