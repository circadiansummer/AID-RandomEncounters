# Random Encounters v1.1 — Codex final review and acceptance handoff
Date: October 12, 2026

## Source truth and baseline

- Review branch: `review/v1.1-integration` — target this exact branch, not default `main`.
- Its parent is `feature/v1.1-config-layout` at `3dce3f3983aa6589ad99d57869bec7f184d32562`.
- This branch **reconstructs equivalent implementation from the written report**; it did NOT import the original Mac-local uncommitted candidate. Its source must be compared against the original preserved candidate before sign-off.
- Original local Codex report: [October 12 review handoff](2026-10-12-retry-fix-review-handoff.md); original report says **328/328** and targeted native successes. This integration branch passed **318/318** in a JavaScript harness with the repo smoke suite. Neither count replaces an exact fresh Codex checkout run.
- [Retry issue #1](https://github.com/circadiansummer/AID-RandomEncounters/issues/1) remains OPEN.

## What changed on the integration review branch

1. **Retry timing:** suppress actionCount-only RE turn advancement when native history is available. Input/history-growth counting and no-history fallback remain. Not proven under fixed-size/sliding history, history rewind, alternatives or Erase.
2. **Rejected Auto-Cards /ac commands:** combined Input wrapper captures command intent before Inner Self's modifier and calls the existing RE pause hook, even when the command is rejected without a workpiece. No changes to third-party bundled library.
3. **Partial-generation Retry:** re-request only remaining RAND cards as a dedicated data-generation task with frozen batch difficulty/theme, no new RE turn or generation attempt, preserving generated cards and creator edits.
4. **Parser:** accept inner quoted question punctuation followed by lowercase narration before a final terminator. The single-sentence heuristic still cannot reliably reject semantic fragments such as `A stranger.`.
5. **Config:** SYSTEM, ENCOUNTERS → SETTINGS and GENERATION, GLOBAL DEFAULTS; no unwanted gaps around Kool-Aid Man Mode or Create Max; blank default Theme; no rewrite of existing author-edited Config Entries.

## Codex final-test sequence — do not replay unaffected historical acceptance

1. **Review provenance:** preserve existing checkout, any unpushed report commits, `baseline/`, `candidate/`, `change-manifest.json`, patches, and evidence. Compare local candidate fixes and 26 added assertions against review branch; prefer the proven local implementation for any meaningful discrepancies. Report differences, do not silently claim equivalence.
2. **Source/suite gate:** fresh checkout `review/v1.1-integration`, record full HEAD/clean working tree, execute `node docs/tests/smoke.cjs`, parse both Libraries and all six wrappers, verify exact standalone/embedded RE parity. Record actual count and failures.
3. **History-window gate (potential blocker):** determine real AI Dungeon behavior when history length stays constant during Continue; include capped/sliding history, Retry, Erase/backtracking and earlier output alternatives. A fixed-length history window can cause this conservative detector to miss a real Continue. Keep issue #1 open until reliable distinction and verified fix (if needed). Use new adventures for modified code.
4. **Combined-generation gate:** in one fresh Inner Self+Auto-Cards setup generate a real partial 2/4 batch with Hard/`night at the movies`; Retry without another story action, confirm remaining RAND_03/04 re-requested, attempt and RE turn unchanged, previously populated cards unchanged, 4/4 completion, task ownership respected and normal Continue resumes.
5. **Config visual gate:** separate fresh adventure; verify final Config group headings, no extra blank lines before Kool-Aid Man Mode / Create Max, empty Theme, one-shot reset, and creator edits preserved after Context maintenance.
6. **Parser gate:** exercise quoted punctuation and multi-sentence negatives, no grammatical completeness guarantees; record any model-produced counterexample.
7. **Report results:** PASS / FAIL / BLOCKED / NOT RUN. Keep individual bugs and evidence traceable. Update test documents/issues once evidence is confirmed, but do not merge, tag, change public README or publish until explicit user authorization.

## Release decision gate

Only recommend a 1.1 release when source equivalence/implementation review is completed, the integrated deterministic suite passes, live history/turn accounting is reliable, combined Retry test passes, Config layout is seen in AI Dungeon, and the user explicitly accepts results. Public v1.0 remains unchanged until then.
