# Living Meters compatibility fixture

This folder is an isolated live-test build for Random Encounters with [Living Meters](https://github.com/Oratorian/living-meters).

## Pinned sources

- Living Meters: v1.2.2, commit `c4ebf5dd13a36b1b8de33ae08c39cf84b52f36ca`
- Random Encounters: v0.18.29
- `library.js` contains the upstream Living Meters library unchanged, followed by the exact current contents of `src/library.js`.

## Parity rule

The Random Encounters block at the end of `library.js` must remain byte-for-byte identical to the canonical `src/library.js` whenever this fixture is considered validated or release-ready.

Living Meters itself is not patched inside this fixture. Compatibility-specific behavior belongs in the Input/Context/Output wrappers.

## Deterministic baseline wrapper order

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

### Known order-sensitive risk

Static source review identifies a specific command-order hazard: Living Meters treats generic slash-prefixed input as its command surface. If Living Meters processes Input before RE, an `/RE ...` action can be recorded by Living Meters as an unknown command and scheduled for its Context halt before RE gets a chance to own the command.

The deterministic root fixture avoids that condition by running RE first in Input, but this is only a baseline test adapter. It must not be cited as proof that arbitrary installation/load order is safe.

Ordinary story-turn coexistence should still be tested in both plausible orders where practical. Command behavior should be considered potentially **order-sensitive** unless testing or a generic RE-side solution proves otherwise.

## Load-order validation

The root wrapper files use a deliberate order so the baseline test is reproducible. That order is **not** itself the compatibility claim.

Before Living Meters is considered generally compatible, exercise the same behaviors with the opposite plausible execution order where the platform permits it. In particular, verify:

- `/RE ...` commands are not swallowed by Living Meters' generic slash-command parser
- Living Meters commands do not become delayed RE turns
- Context `stop` ownership is respected whichever script reaches Context first
- RE resolution parsing and Living Meters output scanning do not corrupt one another
- shared `state.message` behavior remains safe

If one direction cannot be made safe without requiring the player to control ordering, record Living Meters as **order-sensitive** instead of broadly compatible.

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


## Live result

**v0.18.28 general coexistence control: PASS.**

Fresh-game testing verified the RE side of ordinary coexistence through initialization, normal pacing, `/RE start`, Active countdown, `/RE end`, resolution capture/cleanup, Outcome write, and final pacing resume.

This pass does not remove the documented slash-command order sensitivity inherent in Living Meters' broad command parser. That issue remains a separate non-blocking compatibility caveat rather than part of the general-control success criteria.


## v0.18.29 fixture parity

The embedded Random Encounters block is refreshed to the exact v0.18.29 canonical `src/library.js`. The v0.18.28 general-coexistence live pass remains historical evidence; final v0.18.29 validation should use a fresh adventure because canonical RE source changed.
