# Roadmap

This file records confirmed design decisions for future versions. Nothing here should be treated as released until moved into `CHANGELOG.md`.

## v0.17 — Configuration and usability

Status: implemented in the v0.17.0 testing build; validation in progress.

Implemented scope:

- Reorganize the Config card into `SYSTEM`, `ENCOUNTERS`, and `GLOBAL DEFAULTS`.
- Add runtime setting `Maximum Encounter Cards: 10`.
  - Controls only how many sequential missing encounter cards are generated when `Create Max Encounter Cards` is enabled.
  - Existing encounter cards remain discovered and managed regardless of encounter number.
- Rename `Create Placeholder Encounter Cards` to `Create Max Encounter Cards`.
- Add `Use Advanced Settings: false`.
- Add an editable Story Card titled `Advanced RE Settings`.
- Rename user-facing `Encounter Weight` to `Rarity`.
- Rename user-facing `Retirement Length` to `Duration`.
- Rename encounter-card `Script State` section to `Encounter State`.
- Rename user-facing `Re-readied` terminology to `Restored`.
- Default production Encounter Pacing to `Moderate`.
- Advanced settings expose public Pacing, Rarity, and Duration values.
- Debug-only values remain hidden from the Advanced RE Settings card.
- Duration exposes the Moderate baseline only; other pacing adjustments remain internal.
- Invalid advanced inputs fall back only for the failed field to that field's original built-in value.
- Invalid custom input produces a player-facing popup such as:
  - `[RE] Fast Maximum Interval failed, using default values.`
- Global Defaults explainer becomes:
  - `Changing these values overwrites the same setting on all encounter cards.`
- Remove the redundant post-encounter Cooldown layer so Pacing alone controls spacing between encounter opportunities.

### Planned Config layout

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

## v0.18 — Acts and progression

Preserve these design decisions until the v0.18 implementation discussion:

- Every encounter has an `Act` number starting at 1.
- `Current Act` is an upper bound, not an exact-match filter.
- If Current Act is 4, Available encounters from Acts 1–4 remain eligible.
- Earlier optional encounters do not disappear when the story advances.
- Every encounter has `Importance: Required` or `Importance: Optional`.
- Act advancement occurs when all Required encounters whose Act equals Current Act have successfully occurred.
- Optional encounters never block Act advancement.
- A Restored/💾 Required encounter is still incomplete and continues blocking advancement.
- No `Act Delay` setting.
- `Act` and `Importance` belong under an encounter-card `PROGRESSION` subsection.
- `Current Act` belongs under the Config card's `ENCOUNTERS` section.
- Starting a new encounter with `/RE start` or `/RE start #` while another encounter is Active will first end the current encounter attempt, queue its resolution handling, then queue the newly requested encounter.
- Add a third resolution classification: `The encounter is in progress: <summary>.`
- An in-progress result keeps the same encounter in the lifecycle and immediately requeues it at 50% of its normal configured Duration.
- The 50% requeue duration is always calculated from the encounter's normal configured Duration; it never compounds across repeated requeues.
- After five consecutive in-progress resolution checks during the same activation attempt, the encounter fails and is returned to the Available pool.
- The in-progress counter resets when the encounter succeeds, fails, is reset, or begins a new activation attempt.
- Use the player-facing marker `🔄 Awaiting Completion` for the in-progress/requeued state.
- Status/marker vocabulary remains:
  - `📝 Activated`
  - `🔄 Awaiting Completion`
  - `💾 Returned to Available Pool`
  - `🗃️ Completed Successfully`

Conceptual eligibility:

```text
Encounter Act <= Current Act
AND Status = Available
```

Conceptual progression:

```text
Advance Act when all Required encounters whose Act = Current Act
have successfully occurred.
```


### Additional v0.18 runtime behavior

- `/RE start` and `/RE start #` may be used while an encounter is Active.
- Using either start command during an Active encounter first ends the current encounter and queues its normal resolution check, then queues the newly requested encounter for the next real story action.
- Plain `/RE start` still selects from the eligible weighted pool; `/RE start #` still targets the requested eligible encounter.
- The command itself still does not consume a story turn.

### Awaiting Completion resolution state

Add a third resolution classification:

```text
The encounter is in progress: <one short factual summary of what has happened so far and what remains unresolved>.
```

Behavior:

- Use this state when the encounter has meaningfully begun but has not completed its core event.
- The same encounter is immediately requeued and remains logically Active.
- Requeued runtime Duration is 50% of that encounter card's normal configured Duration.
- The 50% reduction never compounds; repeated requeues always recalculate from the normal configured Duration.
- After five consecutive in-progress resolution checks for the same activation attempt, the encounter fails and is returned to Available.
- The in-progress counter resets when the encounter succeeds, fails normally, is manually reset, or begins a fresh activation attempt.
- Output marker: `🔄 Awaiting Completion`.

Status/output terminology remains:

```text
📝 Activated
🔄 Awaiting Completion
💾 Returned to Available Pool
🗃️ Completed Successfully
```
