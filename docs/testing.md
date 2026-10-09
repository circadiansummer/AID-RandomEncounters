# Testing

## Current v0.18.1 validation targets

### Acts and eligibility

1. Fresh Config contains `Current Act: 1`.
2. Encounter cards contain PROGRESSION with `Act` and `Importance`, plus BEHAVIOR with `Rarity` and `Duration`; Minimum Turn is absent.
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

### Regression

- Rarity/Duration globals and Advanced Settings still work.
- Maximum Encounter Cards remains generation-only.
- Retry does not increment the RE turn.
- Successful occurrences enter History.
- Non-occurrences return to Available.
- `/RE end`, `/RE stop`, `/RE reset #`, and `/RE reset all` remain functional.

## Test hygiene

Use a fresh adventure for Acts tests unless intentionally testing migration.
