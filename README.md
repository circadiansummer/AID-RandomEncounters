# AID-RandomEncounters

A customizable random encounter system for AI Dungeon.

**Current testing version:** v0.17.0

The system manages weighted random encounters through Story Cards, tracks active and completed encounters, records encounter outcomes, supports runtime commands, and preserves encounter history.

## AI Dungeon script layout

Install the script in AI Dungeon using the four standard script sections:

- `src/library.js` — main Random Encounter System logic
- `src/input.js` — Input Modifier
- `src/context.js` — Context Modifier
- `src/output.js` — Output Modifier

> `src/library.js` contains the v0.17.0 development/testing snapshot. v0.17 is under active validation and should not yet be treated as a finalized release.

## Current behavior

v0.17.0 introduces the configuration/usability overhaul: the reorganized Config card, runtime Maximum Encounter Cards, Rarity/Duration terminology, optional Advanced RE Settings, Moderate as the clean-install pacing default, and removal of the separate post-encounter Cooldown layer. Existing command, encounter-context, resolution, history, and Retry-safe turn behavior is retained.

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

- 📝 Activated
- 🔄 Awaiting Completion — reserved for the upcoming in-progress resolution path
- 💾 Returned to Available Pool
- 🗃️ Completed Successfully

## Repository policy

Confirmed releases and patches should update source and documentation together. Planned features remain in the roadmap until explicitly confirmed as released.
