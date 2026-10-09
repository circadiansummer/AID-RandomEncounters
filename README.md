# AID-RandomEncounters

A customizable random encounter system for AI Dungeon.

**Current testing version:** v0.16.2

The system manages weighted random encounters through Story Cards, tracks active and completed encounters, records encounter outcomes, supports runtime commands, and preserves encounter history.

## AI Dungeon script layout

Install the script in AI Dungeon using the four standard script sections:

- `src/library.js` — main Random Encounter System logic
- `src/input.js` — Input Modifier
- `src/context.js` — Context Modifier
- `src/output.js` — Output Modifier

> `src/library.js` contains the v0.16.2 development/testing snapshot. v0.16 remains under validation and should not yet be treated as a finalized release.

## Current behavior

v0.16.2 includes targeted encounter-start commands alongside persistent active-encounter context, strict occurred/non-occurrence resolution classification, automatic restoration of encounters that never entered the narrative, encounter history, weighted selection, pacing, retirement timing, cooldown, reset/control commands, and Retry-safe turn counting.

Encounter Story Cards use type:

`#RE - Encounters`

Configuration and History cards use type:

`#RE - Config & History`

See `CHANGELOG.md` for confirmed release history and `ROADMAP.md` for planned work that has not yet shipped.

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
- 🗃️ Retired
- 💾 Restored — the encounter did not occur and was returned to Available

## Repository policy

Confirmed releases and patches should update source and documentation together. Planned features remain in the roadmap until explicitly confirmed as released.
