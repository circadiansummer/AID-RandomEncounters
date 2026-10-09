# Testing

## Current v0.18.24 validation targets

### Acts and eligibility

1. Fresh Config contains `Current Act: 1`.
2. Encounter cards contain PROGRESSION with `Act` and `Importance`, plus BEHAVIOR with `Rarity` and `Duration`; Minimum Turn is absent; default Importance is Required.
3. With Current Act 1, Act 2+ encounters are ineligible.
4. Earlier Optional encounters remain eligible after Current Act advances.
5. A successful Required encounter counts toward Act completion.
6. Current Act advances only when all Required encounters in that Act have completed successfully.
7. Optional encounters do not block advancement.
8. A Returned-to-Available Required encounter continues blocking advancement.

### Awaiting Completion

1. Natural resolution can classify `The encounter is in progress: ...`.
2. The temporary 🗃️ marker is replaced by 🔄.
3. The same encounter becomes Awaiting Completion and stays out of the general selection pool.
4. Requeue Duration is 50% of the normal configured runtime Duration.
5. Repeated requeues use the same 50% duration rather than compounding.
6. Checks 1–4 requeue; check 5 returns the encounter to Available with 💾.
7. Success or failure clears the consecutive in-progress lifecycle.

### Command handoff

1. `/RE start` while Active ends the current attempt and queues a weighted eligible replacement.
2. `/RE start #` while Active ends the current attempt and queues the targeted eligible replacement.
3. The displaced encounter receives normal resolution handling.
4. A displaced/manual-ended encounter cannot use Awaiting Completion to replace the newly queued encounter.
5. Commands still do not consume a story turn.

### Global Defaults

1. Config exposes `Act`, `Importance`, `Rarity`, and `Duration` under GLOBAL DEFAULTS.
2. Editing any Global Default does not change existing encounter-card settings.
3. Newly generated cards use the current values of all four Global Defaults.
4. Reset commands restore all four encounter settings from current Global Defaults.
5. `Restore Encounter Cards to Defaults: true` applies all four current defaults to every discovered encounter card.
6. The Restore toggle automatically resets itself to `false` after firing.
7. Restore preserves lifecycle Status, prompt/Outcome content, and custom titles.
8. An active encounter's current runtime Duration remains locked when Restore fires.
9. Status and Encounter Number are not treated as Global Defaults.

### Encounter title conventions

1. New generated cards use number-first default titles such as `01 - Encounter Card`.
2. Exact legacy defaults such as `Random Encounter 01` migrate to the number-first format.
3. Custom titles remain unchanged.

### Generation toggle

1. Fresh Config defaults to `Maximum Encounter Cards: 4` and `Create Max Encounter Cards: true`.
2. First maintenance ensures/generates RAND_01 through RAND_04 and then automatically resets `Create Max Encounter Cards` to `false`.
3. Newly generated cards default to `Importance: Required`.
4. Existing explicit Optional cards remain Optional.

### Set All Cards to Available

1. Fresh Config contains `Set All Cards to Available: false`.
2. Setting it to `true` makes every discovered encounter card Available.
3. Act, Importance, Rarity, Duration, prompt/Outcome content, and custom titles are preserved.
4. Active, queued, pending-resolution, marker, and pacing-countdown runtime state are cleared.
5. Random Encounter History and Current Act are preserved.
6. The toggle automatically resets to `false`.
7. Existing Config cards gain the toggle without losing existing values.
8. The player-facing confirmation uses the standard `RE - ` prefix.

### Player-facing message formatting

1. Player-facing system messages begin with `RE - `.
2. Command confirmations, errors, validation warnings, reset notices, and Act progression notices use sentence case.
3. Internal console logs retain the `[Random Encounters]` diagnostic prefix and are not converted into player popups.

### Config card formatting

1. Regular Config uses compact spacing with one blank line only between SYSTEM, ENCOUNTERS, and GLOBAL DEFAULTS.
2. Advanced RE Settings uses compact spacing with one blank line only between PACING, RARITY, and DURATION.
3. Existing edited values survive automatic formatting normalization.

### Notes formatting

1. Encounter Notes use compact spacing with no blank line between headers/subheaders and their fields.
2. Exactly one blank line separates Encounter State from Encounter Settings.
3. Maintenance rewrites older encounter-card Notes into the compact layout without losing field values.

### Reset-all Outcome cleanup

1. Add `Outcome:` sections to multiple encounter Entries.
2. Run `/RE reset all`.
3. Every encounter returns to Available and restores current Global Default settings.
4. Each `Outcome:` section is removed while the original encounter prompt remains intact.
5. `/RE reset #` also removes the selected card's Outcome while preserving its prompt.

### Review regression coverage

The v0.18.17 internal review was exercised with harness tests rather than treated as a separate live AI Dungeon test round. Coverage included:

- fresh installation and one-shot card generation
- non-destructive Global Default changes and explicit Restore-to-Defaults propagation
- Advanced Settings parsing
- Retry-safe turn handling
- natural Awaiting Completion and its 50% continuation duration
- five consecutive Awaiting Completion checks
- manual active-event handoff
- automatic Act progression and popup formatting
- single-card and reset-all Outcome cleanup
- invalid classifier retry behavior
- legacy encounter-card migration
- legacy in-progress runtime-state migration
- suppression of unnecessary pacing rolls while a resolution is pending

These harness checks supplement rather than replace live AI Dungeon validation.

### Cross-script compatibility

Source/harness coverage completed in v0.18.21-v0.18.24:

1. Context wrapper preserves `stop` and skips RE when `stop = true`.
2. Inner Self-style leading parenthetical output prefixes remain at character zero; RE classifiers behind them are captured and removed correctly.
3. RE status markers are inserted after a private parenthetical prefix.
4. Existing third-party `state.message` content is preserved when RE posts on the same turn.
5. Standalone Auto-Cards generation and compression freeze RE pacing, Duration, injection, and resolution.
6. Inner Self-bundled Auto-Cards task events trigger the same pause.
7. Suspended task actions synchronize high-water state and do not become delayed phantom RE turns.
8. Pending RE resolution survives an Auto-Cards-owned model turn untouched.
9. Generic `RandomEncounters("pause", "Script Name")` task ownership freezes one model turn and passes Output through.
10. Recognizable SAE generation state triggers the same suspension without false-positive matching of unrelated `saveOutput` fields.

Focused harness results:
- Inner Self/prefix + shared-message pass: 15 behavioral assertions passed; one original byte-for-byte assertion was corrected because the expected RE lifecycle marker was intentionally added after the prefix.
- Auto-Cards pass: 13/13.
- General compatibility pass: 12/12.
- SAE pass: 8/8.

Live AI Dungeon release-candidate validation still required:
- Inner Self combination
- Auto-Cards combination
- one low-conflict/general composition control
- simultaneous toast behavior in those live combinations

Live SAE validation is nice to have rather than RC-blocking.

### Documentation and Story Card Notes

1. Config Notes explain every SYSTEM, ENCOUNTERS, and GLOBAL DEFAULT setting.
2. Config Notes explain one-shot Create Max, Restore Defaults, and Set All Available behavior.
3. Config Notes explain eligibility, weighted Rarity, Duration, Acts, resolution classifications, Awaiting Completion, five-check failure, Outcomes, History, Retry safety, markers, removed Cooldown/Minimum Turn, commands, and message prefixes.
4. Advanced Notes explain custom Pacing intervals, Rarity weights, Duration baselines/scaling, invalid-value fallback, and hidden Debug presets.
5. History Notes explain success-only storage, 12-entry cap, 3000-character cap, automatic trimming, and Context injection.
6. README provides a complete current-feature index and points to detailed docs.
7. ROADMAP contains unreleased work only and does not restate superseded shipped behavior.
8. Historical Changelog entries are explicitly identified as version-specific and potentially superseded.

### Regression

- Non-destructive Global Defaults, explicit Restore-to-Defaults, and Advanced Settings still work.
- Maximum Encounter Cards remains generation-only.
- Retry does not increment the RE turn.
- Successful occurrences enter History.
- Non-occurrences return to Available.
- `/RE end`, `/RE stop`, `/RE reset #`, and `/RE reset all` remain functional.

## Test hygiene

Use a fresh adventure for Acts tests unless intentionally testing migration.
