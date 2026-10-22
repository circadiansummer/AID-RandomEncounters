# Development test report — zero automatic startup encounter cards
**Date:** 2026-10-21 (America/Chicago)  
**Target:** `develop/no-auto-startup-cards` (unreleased; starts from released `main` v1.12)  
**Scope:** Default startup card creation only — no new options, commands or scene-generation rules.

## Behavioral change

- `DEFAULTS.placeholderCardsToCreate` stays **4**.
- `DEFAULTS.createPlaceholderCards` changes from **true** to **false** in both `Library.js` and `RE-InnerSelf-Merge/Library.js`.
- A new adventure automatically gets the RE **Config** Story Card, not `RAND_01`–`RAND_04`. User-created encounters continue to be recognized.
- Setting `Create Placeholder Cards: true` manually still creates the requested batch, appending after the highest numbered existing `RAND_##`, and resets that flag to false.
- Existing Config cards and creator-authored values are **not silently rewritten** to force the new default. Only newly created Config cards receive the new initial setting.

## Deterministic test procedure and results

**PASS — 418/418 mocked JavaScript regression checks.** Executed the repository's `docs/tests/smoke.cjs` exported `run(files)` using the ChatGPT JavaScript environment with the patched standalone and combined sources, six unchanged script wrappers, and revised smoke harness.

- **12 targeted new checks:** Six per standalone and combined Library, covering one Config only, creation flag false/count four, no creation on later turns, explicit request creating four, toggle resetting, and prevention of further automatic creation.
- **Existing regression scenarios:** Four-card encounters formerly supplied by the script were replaced by **explicit four-card fixture cards** in the harness. The rest of the script's matching, pacing, retries, generation, lifecycle, notes and compatibility checks continued to pass.
- **PASS:** Standalone Library and embedded RE core in combined Library are identical after this edit.
- **PASS:** Both JavaScript Libraries and the adjusted smoke harness parse successfully.
- **Additional targeted check (before the full harness):** Preserved creator-authored `RAND_07`, no automatic addition, and opt-in appended `RAND_08`–`RAND_11` without overwriting it, in both Libraries (18 focused checks at the time).

## Verification boundaries

- **NOT RUN:** `node docs/tests/smoke.cjs` as a local CLI invocation; run this command in Codex/Node on the exact committed branch as a redundant environment check.
- **NOT RUN:** Fresh-adventure live AI Dungeon testing; test both standalone and combined Library/Input/Context/Output scripts in new adventures and confirm in actual Story Cards/UI.
- **NOT RUN:** Hosted deployment, public script update, release/tag changes.
- No edits were made to released `main`, archived v1.0, or historical v1.12 release notes as part of the development candidate.

## Native acceptance checklist

1. Install candidate standalone four-hook script into a **new** AI Dungeon adventure without any pre-seeded RAND cards; act once. Expect **Config** only, with `Create Placeholder Cards: false`.
2. Take one more ordinary story action; confirm no new RAND cards appear.
3. Edit Config to set `Create Placeholder Cards: true`; act once; confirm `RAND_01` through `RAND_04` are created with valid metadata, toggle resets to false.
4. Continue two ordinary turns; confirm no duplicate cards. Repeat after manually adding an authored high-numbered RAND card: new placeholders must append after that number.
5. Repeat in a **separate new adventure** using the combined Inner Self/Auto-Cards scripts. Confirm external-task ownership and script coexistence as well as no default cards.
6. Capture actual Input/Context/Output logs, Config contents, and Story Card list before reporting native PASS. Distinguish a valid empty encounter pool from an encounter selection defect.

**Release decision:** Development code has deterministic validation only; owner approval is required before any promotion of this change to `main`, public release, or AI Dungeon publication.
