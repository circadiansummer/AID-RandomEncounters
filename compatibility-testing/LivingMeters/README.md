# Living Meters compatibility fixture

This folder is an isolated live-test build for Random Encounters with [Living Meters](https://github.com/Oratorian/living-meters).

## Pinned sources

- Living Meters: v1.2.2, commit `c4ebf5dd13a36b1b8de33ae08c39cf84b52f36ca`
- Random Encounters: v0.18.28
- `library.js` contains the upstream Living Meters library unchanged, followed by the exact current contents of `src/library.js`.

## Parity rule

The Random Encounters block at the end of `library.js` must remain byte-for-byte identical to the canonical `src/library.js` whenever this fixture is considered validated or release-ready.

Living Meters itself is not patched inside this fixture. Compatibility-specific behavior belongs in the Input/Context/Output wrappers.

## Wrapper order

### Input

1. Random Encounters
2. Living Meters

RE runs first because Living Meters owns a generic slash-command parser; otherwise `/RE ...` commands can be treated as unknown Living Meters commands.

If Living Meters claims an action as one of its own commands, the wrapper clears RE's pending-input marker so the command cannot become a delayed phantom RE turn.

### Context

- RE command pending: RE owns the pass and Living Meters is skipped, preventing meter drift on an RE command.
- Living Meters command pending: Living Meters owns the pass, sets `stop`, and RE is skipped.
- Normal story turn: RE runs first, then Living Meters.

### Output

RE runs first, then Living Meters. This lets RE remove a resolution classifier before Living Meters scans the story output for resource trigger words.

## Live-test targets

Use a completely fresh AI Dungeon game for the first test of this fixture.

1. Both scripts initialize without errors and create/maintain their own Story Cards.
2. Several ordinary turns advance both systems once per story turn.
3. `/RE start` is handled by RE and does not trigger a Living Meters unknown-command halt.
4. A Living Meters command such as `/status` does not advance RE or create a delayed phantom RE turn.
5. A forced RE encounter becomes Active and counts down normally while Living Meters continues updating.
6. RE resolution succeeds and the classifier is removed before Living Meters scans the resulting visible output.
7. Living Meters still updates normally after the RE resolution.
8. Shared `state.message` behavior is observed for simultaneous notifications; neither script should silently corrupt the other's state.
9. One final normal turn after commands/resolution confirms there is no delayed or double turn.

This fixture is a low-conflict/general-composition control. It should not add Living Meters-specific behavior to the canonical RE library.
