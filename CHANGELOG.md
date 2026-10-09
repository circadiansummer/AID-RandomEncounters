# Changelog

All entries below distinguish confirmed behavior from planned work.

## [0.16.0] - Confirmed

### Added
- Strict resolution classification using:
  - `The encounter occurred: <summary>.`
  - `The encounter did not occur: <explanation>.`
- Automatic restoration when an encounter never actually enters the narrative.
- 💾 output marker for restored encounters.
- Cleanup of duplicate leading non-occurrence prose.
- Persistent active encounter reminders across turns.

### Changed
- Successful encounters remain Retired and are added to Random Encounter History.
- Encounters classified as not occurring return to Available.
- Restored encounters are removed from the used set and do not enter History.
- Failed attempts retain their Outcome on the encounter card.
- Active reminders now conditionally handle encounters that have or have not yet entered the story.

### Confirmed architecture retained
- Weighted encounter selection.
- Pacing presets, including hidden Debug pacing for testing.
- Retirement Length presets and pacing scaling.
- Minimum Turn behavior.
- Cooldown lifecycle.
- Retry-safe turn counting.
- Runtime commands: `/RE help`, `/RE on`, `/RE off`, `/RE start`, `/RE end`, `/RE reset#`, `/RE resetall`.
- Random Encounter History.
- Placeholder encounter creation.
- Story Card type normalization.

## [0.15.0] - Confirmed

### Added
- Persistent active-encounter Context reinforcement.
- Full activation prompt on the trigger turn.
- Conditional active reminder on subsequent active turns.
- Retry-safe reinjection behavior.

## [0.14.x] - Confirmed

### Added
- Runtime control commands.
- `/RE help`.

### Fixed
- AI Dungeon command transport failures caused by returning `{ text, stop }`.
- Command handling now uses a sentinel/control-response path without consuming a story turn.

## [0.13.0] - Confirmed

### Changed
- Config/History Story Card type standardized to `#RE - Config & History`.
- Encounter Story Card type standardized to `#RE - Encounters`.
- Minimum Turn simplified to store the user-facing numeric value directly.
- Positive scaled Minimum Turn values clamp to at least effective Turn 1.
- Stored Minimum Turn `0` is immediately eligible.

## [0.12.0] - Confirmed

Validated core system behavior including pacing, retirement scaling, weighted rarity, Minimum Turn, global propagation, resolution capture, History, cooldown, Retry-safe turns, status markers, placeholder creation, and reset behavior.

## Unreleased

See `ROADMAP.md`. Unreleased design decisions are not treated as shipped features.
