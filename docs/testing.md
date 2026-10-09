# Testing

## Current v0.16.2 validation status

Confirmed:

- Pacing.
- Retirement scaling.
- Weighted encounter selection.
- Minimum Turn.
- Global configuration propagation.
- Resolution capture.
- Per-card Outcome.
- Encounter History.
- Cooldown.
- Type normalization.
- Retry-safe turn counting.
- Output status markers.
- Placeholder creation.
- Reset behavior.
- Persistent active encounter reminders.
- Non-occurrence classification and restoration path.

New command-path checks for v0.16.2:

1. `/RE start` still queues a weighted-random eligible encounter.
2. `/RE start 7` queues only RAND_07 when it exists, is Available, and passes Minimum Turn.
3. `/RE start 7` refuses RAND_07 when it is not Available or not yet eligible.
4. `/RE reset 7` resets only RAND_07.
5. `/RE reset all` resets all existing encounter cards.
6. `/RE stop` behaves identically to `/RE end` when an encounter is Active.
7. `/RE stop` returns the same no-active message as `/RE end` when nothing is Active.
8. None of the commands consume a story turn.

Still valuable before declaring v0.16 fully closed:

1. Run an encounter that genuinely occurs.
2. Confirm the first resolution line is classified as `The encounter occurred: ...`.
3. Confirm the encounter becomes Retired and receives 🗃️.
4. Confirm it remains Retired.
5. Confirm it is added to Random Encounter History.
6. Run a Retry/regeneration during an Active encounter and verify the persistent reminder remains stable.

## Test hygiene

Use a fresh text adventure for isolated tests unless intentionally continuing the same stateful test.

Do not change validated turn-detection architecture casually. Do/Say/Story/Guide and Continue increment; Retry does not.
