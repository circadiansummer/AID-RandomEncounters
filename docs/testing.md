# Testing

## Current v0.16 validation status

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
