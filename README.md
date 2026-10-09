# AID-RandomEncounters

A customizable random encounter system for AI Dungeon.

**Current testing version:** v0.18.28

The system creates and manages weighted random encounters through Story Cards, supports Acts and progression, tracks encounter lifecycle and Outcomes, preserves successful encounter History, and provides runtime controls without consuming story turns.

## AI Dungeon script layout

Install the script in AI Dungeon using the four standard script sections:

- `src/library.js` — main Random Encounter System logic
- `src/input.js` — Input Modifier
- `src/context.js` — Context Modifier
- `src/output.js` — Output Modifier

> `src/library.js` contains the v0.18.28 development/testing snapshot. v0.18 remains under active validation and should not yet be treated as a finalized release.

## Current feature summary

- **Encounter generation:** clean installs ensure `RAND_01` through `RAND_04` by default; generation is controlled by Maximum Encounter Cards and the one-shot Create Max Encounter Cards toggle.
- **Number-first titles:** generated defaults use `01 - Encounter Card`, `02 - Encounter Card`, etc.; custom titles are preserved.
- **Weighted selection:** eligible encounters are selected by Rarity weight.
- **Pacing and Duration:** Encounter Pacing controls time between encounter opportunities; Duration controls active encounter length and scales with pacing.
- **Acts and progression:** encounters have Act and Required/Optional Importance; Current Act advances after all Required encounters in that Act complete successfully.
- **Resolution lifecycle:** encounters can occur, remain in progress, or fail to occur. In-progress encounters enter Awaiting Completion at 50% Duration and return to Available after five consecutive incomplete checks.
- **Outcomes and History:** every resolved classification is stored in the encounter Entry under `Outcome:`; successful encounters are also stored in capped Random Encounter History and injected into context.
- **Non-destructive Global Defaults:** changing defaults affects new/reset cards only. The one-shot Restore Encounter Cards to Defaults toggle explicitly applies all four defaults to existing cards.
- **Bulk lifecycle reset:** the one-shot Set All Cards to Available toggle reopens every encounter without changing card settings, Outcomes, History, or Current Act.
- **Advanced Settings:** optional editable pacing intervals, Rarity weights, and Duration baselines.
- **Retry safety:** Retry/regeneration does not advance the Random Encounter turn or consume active Duration.
- **Runtime commands:** `/RE` commands can enable/disable, force-start, end, and reset encounters without consuming a story turn.
- **User-facing feedback:** player system messages use the `RE - ` prefix; encounter status markers use 📝, 🔄, 💾, and 🗃️.
- **Compatibility hardening:** RE preserves Context `stop`, cooperates with private parenthetical output prefixes, avoids clobbering existing `state.message` toasts where possible, pauses automatically during Auto-Cards generation/compression and Story Arc Engine generation turns, and exposes a generic one-turn external-task pause hook.
- **Compatibility:** current builds migrate supported legacy card/config/runtime formats into the current schema.

Encounter Story Cards use type `#RE - Encounters`. Configuration and History cards use type `#RE - Config & History`.

## Commands

- `/RE help`
- `/RE on`
- `/RE off`
- `/RE start`
- `/RE start #`
- `/RE end`
- `/RE stop`
- `/RE reset #`
- `/RE reset all`

## Status markers

- 📝 Active
- 🔄 Awaiting Completion
- 💾 Returned to Available
- 🗃️ Completed Successfully

## Documentation

- `docs/configuration.md` — every Config and Advanced setting, one-shot toggles, commands, pacing, Rarity, and Duration
- `docs/encounter-cards.md` — encounter card format, lifecycle, Outcomes, History, progression, and reset behavior
- `docs/architecture.md` — Input/Context/Output flow, runtime state, selection, compatibility, and intentional complexity
- `docs/testing.md` — current validation targets and regression coverage
- `docs/compatibility.md` — cross-script compatibility audit, known risks, and integration recommendations
- `CHANGELOG.md` — version history; older entries describe behavior at that historical version and may be superseded by later entries
- `ROADMAP.md` — unreleased future work only

## Repository policy

Confirmed releases and patches should update source and documentation together. Planned features remain in the Roadmap until explicitly implemented.


### v0.18.28 live validation

v0.18.28 passed fresh-game compatibility testing with Inner Self + Auto-Cards + Random Encounters. The first-use `/RE start` toast no longer merges with the stale Auto-Cards startup message, while normal RE behavior remains intact.
