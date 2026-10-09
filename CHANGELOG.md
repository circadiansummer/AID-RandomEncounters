# Changelog

All entries below distinguish confirmed behavior from planned work.

## [0.17.1] - Testing

### Changed
- `Maximum Encounter Cards` now controls only the number of missing RAND cards generated when `Create Missing Encounter Cards: true`.
- Existing RAND cards are always discovered and managed regardless of encounter number.
- Existing cards above the generation target remain eligible for weighted selection, global Rarity/Duration updates, `/RE start #`, `/RE reset #`, and `/RE reset all`.

## [0.17.0] - Testing

### Added
- Reorganized Config card with SYSTEM, ENCOUNTERS, and GLOBAL DEFAULTS sections.
- Runtime `Maximum Encounter Cards` setting, default 10.
- `Create Missing Encounter Cards`.
- `Use Advanced Settings`.
- Editable `Advanced RE Settings` Story Card.
- Player-facing fallback warning for invalid advanced/custom values.

### Changed
- Clean-install Encounter Pacing default is now Moderate.
- User-facing Encounter Weight terminology is now Rarity.
- User-facing Retirement Length terminology is now Duration.
- Encounter cards now place Encounter State above Encounter Settings.
- Rarity is listed before Duration.
- Legacy v0.16 config and encounter-card fields migrate into the v0.17 layout.
- Missing-card creation honors Maximum Encounter Cards; existing encounter cards are managed regardless of number.

### Removed
- Separate post-encounter Cooldown. Pacing alone now controls spacing between encounter opportunities.

### Preserved for compatibility
- Minimum Turn remains functional during v0.17. It is no longer a global Config default and is expected to be revisited when Acts are implemented in v0.18.
- Debug-only pacing/rarity/duration values remain hidden from the Advanced RE Settings card.

## [0.16.2] - Testing

### Added
- `/RE stop` as an exact alias of `/RE end`.

### Behavior
- Both commands immediately end the current Active encounter, queue its resolution check, start the normal cooldown, and do not consume a story turn.
- If no encounter is Active, both return the same no-active-encounter message.

## [0.16.1] - Testing

### Added
- Targeted encounter activation with `/RE start #`.
- Plain `/RE start` remains the weighted-random force-start command.

### Changed
- Canonical targeted reset syntax is now `/RE reset #`.
- Canonical reset-all syntax is now `/RE reset all`.
- `/RE help` now displays the spaced command forms.

### Testing notes
- Targeted start requires the encounter card to exist, be Available, and satisfy its current effective Minimum Turn.
- Targeted start bypasses pacing countdown and weighted selection, and queues the chosen encounter for the next real story action.
- A targeted start is refused while another encounter is Active or already queued.

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
