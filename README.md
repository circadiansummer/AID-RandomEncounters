# AID-RandomEncounters

A customizable random encounter system for AI Dungeon.

**Current testing version:** v0.18.9

The system manages weighted random encounters through Story Cards, tracks active and completed encounters, records encounter outcomes, supports runtime commands, and preserves encounter history.

## AI Dungeon script layout

Install the script in AI Dungeon using the four standard script sections:

- `src/library.js` — main Random Encounter System logic
- `src/input.js` — Input Modifier
- `src/context.js` — Context Modifier
- `src/output.js` — Output Modifier

> `src/library.js` contains the v0.18.9 development/testing snapshot. v0.18 is under active validation and should not yet be treated as a finalized release.

## Current behavior

v0.18.0 adds Acts and automatic progression, removes Minimum Turn eligibility, adds the 🔄 Awaiting Completion resolution state with half-duration rechecks and a five-check cap, and allows `/RE start` / `/RE start #` to replace an active encounter.

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
- 🔄 Awaiting Completion — encounter began but remains incomplete
- 💾 Returned to Available Pool
- 🗃️ Completed Successfully

## Repository policy

Confirmed releases and patches should update source and documentation together. Planned features remain in the roadmap until explicitly confirmed as released.
