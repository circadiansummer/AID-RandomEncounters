# Compatibility Test Harnesses

Compatibility fixtures are intentionally isolated merged test harnesses. They are not alternate Random Encounters builds and are not intended for end-user installation.

## Directory layout

Each external script or compatibility target gets its own folder:

```text
compatibility-testing/
  InnerSelf/
    library.js
    input.js
    context.js
    output.js
  LivingMeters/
    README.md
    library.js
    input.js
    context.js
    output.js
  <Next Target>/
    library.js
    input.js
    context.js
    output.js
```

Current isolated targets include Inner Self and Living Meters. Future targets should follow the same structure; Story Arc Engine (SAE) is the next likely example.

## Product-build rule

`src/library.js` is the only Random Encounters product library. Compatibility work should improve the canonical library whenever the behavior can be handled generically. A fixture-specific wrapper is acceptable only to reproduce another script's public hook API or an unavoidable composition constraint; it must not become a separate RE distribution.

## Source-of-truth and parity rules

- `src/library.js` is the canonical standalone Random Encounters library.
- A compatibility folder may contain a merged `library.js` with the external script plus Random Encounters.
- The Random Encounters block inside a confirmed compatibility build must be byte-for-byte identical to `src/library.js`.
- Target-specific code outside the RE block may differ as required by the external script.
- Compatibility Input/Context/Output wrappers may differ from `src/` only where invoking the external script or reproducing its ownership/order rules requires it. Context adapters in fixtures should call the same canonical `RandomEncountersContext(text)` helper whenever possible rather than reimplementing RE stop logic.
- External scripts used for compatibility testing should remain unmodified unless the test explicitly concerns a documented integration API supplied by that script.

## Development workflow

1. Create a new `compatibility-testing/<Target>/` folder before beginning compatibility work against a new script.
2. Keep experimental compatibility changes isolated in that target folder until the behavior is understood.
3. When an RE-side fix is accepted for the product, apply it to `src/library.js`.
4. Refresh the RE block in the active compatibility fixture from `src/library.js`.
5. Synchronize other maintained compatibility fixtures when appropriate.
6. Verify exact RE-block parity before marking a version live validated or release-ready.
7. Any code change requires a fresh AI Dungeon game for live validation.

## Release requirement

Before a full Random Encounters release, verify that every maintained compatibility fixture contains the same Random Encounters block as `src/library.js`. This keeps the standalone code and compatibility-accessible copies equivalent for users and prevents fixes from existing only inside a test bundle.

A compatibility fixture may intentionally be ahead of `src/library.js` only while an unconfirmed experiment is in progress. That divergence must be temporary and should not be described as released or validated behavior.


## Load-order policy

Do not assume end users can control which installed script is evaluated first.

- A preferred composition order may be documented when it improves behavior.
- A compatibility claim should not rely on that preferred order unless the platform guarantees it.
- Where practical, test both `RE -> target` and `target -> RE` execution order.
- If only one order is safe, label the integration **order-sensitive** and document the limitation rather than calling it generally compatible.
- Do not patch a third-party script merely to make one ordering pass.
- Keep fixes in RE generic where possible; target-specific adapters belong in isolated compatibility fixtures unless they are intentionally promoted into canonical RE behavior.


## v0.18.29 refresh

The Inner Self and Living Meters fixture libraries embed the exact canonical v0.18.29 Random Encounters block. Because canonical RE source changed after the v0.18.28 compatibility gate, final pre-release testing must start in fresh AI Dungeon adventures. Prior live compatibility passes remain regression evidence rather than a substitute for the final v0.18.29 smoke round.
