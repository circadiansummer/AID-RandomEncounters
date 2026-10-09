# Changelog

## [0.18.29] - Pre-release testing

### Act & Encounter Map
- Added `Display Act & Encounter Map: false` under SYSTEM.
- When enabled, RE creates and maintains a read-only `Act & Encounter Map` Story Card grouped by Act with encounter identity, Importance, and current lifecycle state.
- Disabling the toggle removes canonical Act Map cards; re-enabling recreates the current map.
- Map synchronization is derived from encounter cards/runtime state, never becomes a second source of truth, and avoids rewriting unchanged content.
- No new `/RE` command is added for the map.

### Random Encounter History cleanup
- History Entry now uses a read-only structured layout and no longer displays an `Outcome:` label.
- The 12 most recent successful encounters remain in Entry and continue to be the only History injected into Context.
- When the 12-entry or 3000-character recent-history limit is exceeded, oldest items move into an `ARCHIVED HISTORY` section in Notes instead of being discarded.
- Archived History is retained oldest-first and preserved when fixed History Notes documentation is refreshed.
- Legacy one-line History records migrate into the new layout.
- History remains always managed rather than using the disposable-display toggle pattern, because the History card persists recent/context history and archived records rather than merely rendering derived state.

### Default cleanup
- Debug Logging now defaults to `false` on clean installs; existing Config values are preserved during migration.

### Startup fix
- Context wrapper now safely handles AI Dungeon launch paths where `stop` is undefined, treating the missing flag as `false` while preserving an explicitly supplied stop value.
- Inner Self and Living Meters compatibility Context wrappers use the same safe fallback.

### Release preparation
- Focused source-level v0.18.29 checks passed for clean defaults, map lifecycle/refresh behavior, legacy Config/History migration, recent-to-archive History rollover, character-cap rollover, Context exclusion of archived History, compatibility-fixture byte parity, and wrapper syntax.
- Documentation and Story Card Notes are refreshed for the new map/history behavior.
- This source change reopens final fresh-game validation after the v0.18.28 compatibility gate.

Entries describe behavior at the version where they were written. Later entries may supersede older defaults, labels, or lifecycle behavior. Current behavior is documented in README.md and docs/.

## [0.18.28] - Live validated

### Shared toast compatibility
- RE now snapshots the completed `state.message` value at the end of every Output hook, even when RE did not post a message itself.
- A stale Auto-Cards startup/status toast from a completed turn is therefore replaced by a later RE command toast instead of being incorrectly merged with it.
- A toast created by another script during the same Output pass is still treated as concurrent and preserved alongside an RE toast.
- The fix is generic message-ownership tracking; it does not special-case Auto-Cards message text.

### Live validation
- Fresh-game testing with Inner Self + Auto-Cards confirmed the stale startup-toast merge is fixed.
- Auto-Cards compatibility gate passed live for queued encounters, Active Duration suspension, pending-resolution preservation, output pass-through, and phantom-turn prevention.
- Inner Self compatibility gate passed live for Active encounter progression during thought-bearing turns and RE resolution classification/cleanup in the combined environment.
- General compatibility control passed live in the Living Meters fixture: ordinary pacing, Active Duration, manual-end resolution, classifier cleanup, Outcome write, and pacing resume all behaved normally.
- v0.18.28 RC compatibility gate is now cleared; Story Arc Engine remains optional/unverified for live testing.
- `/RE start` displays the RE command response without carrying forward the old Auto-Cards enabled/configuration toast.
- No regression was observed in normal RE command behavior during the validation run.

## [0.18.27] - Testing

### Resolution compatibility
- Resolution capture now treats the three static classifier keys as authoritative whenever an RE resolution is pending: `The encounter occurred:`, `The encounter is in progress:`, and `The encounter did not occur:`.
- Other scripts may prepend control material without preventing recognition of the RE classifier key.
- Classification no longer fails because the summary is too short, missing terminal punctuation, or otherwise fails the old full-sentence validator; RE normalizes the stored Outcome into canonical form instead.
- Empty classifier summaries receive a safe canonical fallback so the pending resolution can still complete instead of leaking into later responses.
- Classifier removal continues to preserve unrelated preceding output and private parenthetical control prefixes.
- This patch directly targets a live Inner Self + Auto-Cards compatibility failure where `The encounter did not occur:` leaked into repeated responses and the Outcome was never written.

## [0.18.26] - Testing

### Resolution compatibility
- Added recognition and cleanup of zero-width/invisible formatting characters around resolution classifiers.
- Prevented invisible formatting prefixes from causing otherwise valid classifier sentences to remain pending.

## [0.18.25] - Testing

### Resolution compatibility
- Resolution capture can locate a valid classifier after preceding output instead of requiring it to be the literal first output sentence.
- Captured classifiers are removed in place while preserving unrelated visible output.

## [0.18.24] - Testing

### Compatibility hardening
- Added automatic Story Arc Engine task detection. When recognizable SAE state indicates an arc-generation/model-owned turn, RE freezes pacing, Active Duration, encounter injection, reminders, History injection, and resolution handling for that model turn.
- SAE-owned Output passes through untouched even if SAE clears its own generation flag before RE's Output hook runs.
- SAE detection requires recognizable SAE identity/state in addition to generation flags to avoid false positives.

## [0.18.23] - Testing

### General script compatibility
- Added a generic one-turn external-model-task pause contract for script integrations: `RandomEncounters("pause", "Script Name")` (aliases: `external task`, `external-task`).
- A compatibility pause consumes the current external task for RE turn-detection high-water purposes without advancing RE pacing or Duration.
- Updated the standalone Context wrapper to preserve and return AI Dungeon's `stop` flag and to skip RE Context processing when an earlier modifier already set `stop = true`.
- Generic pause behavior passed focused harness coverage including output pass-through and phantom-turn prevention.

## [0.18.22] - Testing

### Auto-Cards compatibility
- Added automatic detection of Auto-Cards-owned generation and memory-compression turns from its persisted runtime state.
- Added support for the Inner Self-bundled Auto-Cards event signal.
- During an Auto-Cards-owned model turn, RE freezes its turn counter, pacing countdown, Active Duration, encounter injection, reminders, History injection, and resolution request/capture.
- Auto-Cards output is passed through untouched and pending RE resolutions remain queued for the next normal story turn.
- Auto-Cards compatibility behavior passed 13/13 focused harness checks.

## [0.18.21] - Testing

### Inner Self and shared-script compatibility
- Resolution capture now tolerates one leading private parenthetical control prefix before the RE classifier sentence.
- Encounter and resolution prompts explicitly preserve a pre-existing private control prefix/output format before normal story prose.
- RE lifecycle markers are inserted after a leading private parenthetical control prefix instead of before it, preserving character-zero ownership for scripts such as Inner Self.
- Player-facing RE toasts now preserve an existing third-party `state.message` when possible and replace RE's own prior snapshot on later RE-only messages instead of endlessly appending.
- The standalone Context wrapper now preserves the `stop` value.
- Inner Self-style prefixed classifier/output behavior passed focused harness regression coverage.

## [0.18.20] - Testing

### Documentation and in-adventure reference
- Audited current Story Card Notes and repository documentation against the v0.18.19 implementation.
- Expanded Config Story Card Notes into a complete user-facing reference covering System settings, generation, Acts, bulk lifecycle reset, non-destructive Global Defaults, Restore to Defaults, encounter lifecycle, Rarity weighting, Duration, Outcomes, History, Retry safety, status markers, removed Cooldown/Minimum Turn behavior, runtime commands, and message conventions.
- Expanded Advanced RE Settings Notes to explain pacing intervals, Rarity weights, Duration baselines/scaling, invalid-value fallback, disabled-state preservation, and hidden Debug presets.
- Expanded Random Encounter History Notes to state that History stores successful encounters only, is capped at 12 entries / 3000 characters, is injected into context, and trims older entries automatically.
- Refreshed README as a current feature index rather than a v0.18.0-only summary.
- Removed obsolete shipped v0.17/v0.18 behavior from ROADMAP.md so the roadmap no longer conflicts with current defaults or messaging.
- Expanded current configuration, encounter-card, architecture, and testing docs to cover all active v0.18.20 features.
- Added an explicit Changelog notice that historical entries may be superseded by later versions.

## [0.18.19] - Testing

### Added
- Added `Set All Cards to Available: false` under ENCOUNTERS.
- Setting it to `true` is a one-shot lifecycle reset: every discovered encounter card becomes Available and the toggle then resets itself to `false`.
- The lifecycle reset clears active, queued, pending-resolution, marker, and pacing-countdown runtime state so card Status and runtime state remain consistent.
- Set All Cards to Available preserves each card's Act, Importance, Rarity, Duration, prompt/Outcome content, and custom title.
- Random Encounter History and Current Act are preserved.
- Existing Config cards automatically gain the new toggle without changing their existing values.

## [0.18.18] - Testing

### Changed
- Global Defaults are now non-destructive. Editing Act, Importance, Rarity, or Duration changes the defaults used by new and reset encounter cards but does not alter existing encounter-card settings.
- Added `Restore Encounter Cards to Defaults: false` under GLOBAL DEFAULTS.
- Setting Restore Encounter Cards to Defaults to `true` applies all four current Global Defaults to every discovered encounter card and then automatically resets the toggle to `false`.
- Restore preserves each encounter's lifecycle Status, prompt/Outcome content, and custom title. An already-active encounter keeps its current runtime Duration until that attempt ends.
- Default generated encounter titles are now number-first: `01 - Encounter Card`, `02 - Encounter Card`, etc.
- Existing cards still using the old exact default title pattern `Random Encounter ##` migrate to the number-first format; custom titles are preserved.
- Config Story Card Notes now include a user-facing reference for every `/RE` command and what it does.
- Existing Config cards migrate from the old destructive-default explanation to the new non-destructive behavior and gain the Restore Encounter Cards to Defaults toggle.

## [0.18.17] - Testing

### Internal review and refactor
- Completed a full library review focused on runtime simplicity, dead-code removal, and maintainable AI Dungeon scripting structure.
- Removed unused helpers, unused API exports, non-functional runtime fields, and duplicate bookkeeping.
- Encounter card Status is now the sole source of truth for encounter availability; the redundant runtime `used` list was removed.
- Runtime now stores a single `activeEncounter` instead of an array because the system permits only one active encounter at a time.
- Removed non-functional Triggered Turn / Resolved Turn metadata from encounter cards and runtime resolution records.
- Internal names now use current user-facing terminology such as Duration, Rarity, and Create Max Encounter Cards; legacy names remain only at compatibility/migration boundaries.
- Resolution parsing now validates and classifies the first-line result in one pass.
- Repeated return-to-Available resolution paths now share one lifecycle helper.
- Encounter maintenance avoids rewriting already-current cards and avoids repeated full-card lookups during generation.
- Built-in preset tables are no longer deep-cloned unless Advanced Settings are enabled.
- Newly discovered legacy or incomplete encounter cards use the current Global Defaults for missing Act, Importance, Rarity, and Duration values.
- Source is organized with concise functional section boundaries for easier navigation.

### Behavior cleanup
- The next Encounter Pacing countdown is no longer rolled while a retired encounter is still waiting for its resolution classification. The next countdown begins only after that resolution is settled.
- Legacy in-progress runtime state is normalized automatically into the reviewed schema, including old active-array, used-list, marker, Duration, and Rarity field names.

### Validation
- Static review found no named function definitions without callers.
- Harness regression coverage passed across fresh installation, one-shot generation, Global Defaults, Advanced Settings, Retry safety, Awaiting Completion, five-check cap, manual handoff, Act progression, reset behavior, invalid classifier retry, legacy card migration, and legacy runtime-state migration.
- Harness validation is separate from live AI Dungeon validation; previously live-tested lifecycle behavior remains the authoritative reference.

## [0.18.9] - Testing

### Changed
- All player-facing system messages now use the consistent `RE - ` prefix.
- Player-facing command confirmations, errors, validation warnings, reset notices, and Act progression notices now use consistent sentence case and punctuation.
- Internal debug logs remain diagnostic `[Random Encounters]` console output and are not treated as player-facing system messages.
- Act progression popup wording is now, for example: `RE - Act 1 is complete. Act 2 encounters are now available.`

## [0.18.8] - Testing

### Changed
- Regular Config and Advanced RE Settings cards now use compact spacing matching encounter Notes.
- Section headers sit directly above their content, individual settings/presets no longer have blank spacer lines, and one blank line separates major sections.
- Existing config cards are compacted automatically while preserving edited values.

## [0.18.7] - Testing

### Added
- Automatic Act progression now shows a player popup confirming the completed Act and newly available Act, for example: `RE: Act 1 complete; Act 2 encounters now available.`

## [0.18.6] - Testing

### Changed
- `/RE reset #` now clears the selected encounter card's `Outcome:` section while preserving its prompt.
- Single-card reset still returns the encounter to Available and restores Act, Importance, Rarity, and Duration from current Global Defaults.
- Reset-all and single-card reset now use consistent Outcome cleanup behavior.

## [0.18.5] - Testing

### Changed
- `/RE reset all` now clears every encounter card's `Outcome:` section while preserving the encounter prompt.
- Reset-all still restores Status and all editable encounter settings from the current Global Defaults.
- `/RE reset #` retains its existing single-card behavior and does not clear Outcome.

## [0.18.4] - Testing

### Changed
- Encounter-card Notes now use compact spacing: no blank line between section/subsection headers and their fields, with a single blank line between Encounter State and Encounter Settings.
- Clean-install `Maximum Encounter Cards` default changed from 10 to 4.
- Clean-install `Create Max Encounter Cards` default changed from false to true.
- On first maintenance, the default generation trigger ensures RAND_01 through RAND_04 exist, then resets itself to false as before.

## [0.18.3] - Testing

### Changed
- GLOBAL DEFAULTS now covers every editable encounter setting: `Act`, `Importance`, `Rarity`, and `Duration`.
- Changing any Global Default overwrites that field on all discovered encounter cards.
- Newly generated cards use all four current Global Default values.
- `/RE reset #` and `/RE reset all` restore all four encounter settings from the current Global Defaults.
- Status and Encounter Number remain excluded because they are script-managed state/identity fields.

## [0.18.2] - Testing

### Changed
- `Create Max Encounter Cards` is now a one-shot toggle. After it ensures/generates cards up to `Maximum Encounter Cards`, it resets itself to `false`.
- Newly generated encounters now default to `Importance: Required`.
- Existing encounters explicitly set to `Importance: Optional` remain Optional.
- Encounters missing an Importance field migrate with the new Required default.

## [0.18.1] - Testing

### Changed
- Restored the `---------- BEHAVIOR ----------` subsection under Encounter Settings.
- Rarity and Duration now sit under BEHAVIOR, while Act and Importance remain under PROGRESSION.

## [0.18.0] - Testing

### Added
- Encounter Acts with `Act` and `Importance: Required|Optional`.
- Config `Current Act`, default 1.
- Automatic Act advancement when every Required encounter in the Current Act has completed successfully.
- Third resolution classifier: `The encounter is in progress: ...`.
- 🔄 Awaiting Completion state.
- Awaiting Completion requeues the same encounter at 50% of its normal configured Duration.
- Five consecutive Awaiting Completion checks force the encounter back to Available.

### Changed
- Eligibility is now `Encounter Act <= Current Act` and `Status = Available`.
- Minimum Turn has been removed from encounter cards and runtime eligibility.
- Earlier Optional encounters remain eligible after Act advancement until they complete.
- `/RE start` and `/RE start #` now end an active encounter before queueing the replacement.
- Explicitly ended/replaced encounters cannot reclaim the Active slot through Awaiting Completion.

## [0.17.2] - Testing

### Changed
- Renamed `Create Missing Encounter Cards` to `Create Max Encounter Cards`.
- Restored the numeric field label to `Maximum Encounter Cards`.
- Removed the redundant `---------- BEHAVIOR ----------` subsection from encounter-card notes.
- Existing v0.17 config cards using `Create Missing Encounter Cards` or the temporary `Max Encounter Cards` label migrate to the current labels.

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
