# Codex RE v1.1 test report and morning handoff — October 12, 2026

**Status: focused Retry fix validated locally and in a fresh AI Dungeon adventure; manual source review and release approval remain pending. No production script was committed, pushed, tagged, or published.**

## Environment and preservation

- Repository: `circadiansummer/AID-RandomEncounters`, only `develop/v1.1` fetched/read. No access to `main`.
- Existing checkout: `develop/v1.1`, HEAD `5b0b9014531f002889e8c7c1010cdf9bde10f465`, initially clean, with one old unpushed report commit. It was preserved rather than reset or rebased.
- Current remote branch tested: `e4d8b295807e6c0316267b23b104c3c04505517b`, newer than the supplied `3f94f269`. This includes the later Force ASAP / Kool-Aid Man Mode changes.
- Exact remote snapshot is in `baseline/`; proposed changes are in `candidate/`. Both directories are untracked inside the v1.1 checkout. Tracked working-tree files and HEAD are unchanged.
- Node: v24.19.0, bundled executable `/Users/alissa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`.
- Read AGENTS.md, testing guide, roadmap, configuration, encounter-card guide, changelog, smoke harness, and earlier live evidence. Current code and canonical configuration guide use **Kool-Aid Man Mode**; older AGENTS/test prose still says No Matter What Mode.
- No subscription changes; no scenarios/adventures deleted; no scenario/adventure/script published. One private test scenario and disposable private test adventures were used.

## Reproducible automated results

From this review directory, set `RE_NODE` to the Node executable above, then run:

```sh
"$RE_NODE" baseline/docs/tests/smoke.cjs
"$RE_NODE" candidate/docs/tests/smoke.cjs
```

| Gate | Actual result |
| --- | --- |
| Current branch baseline suite | PASS 302/302 |
| Candidate suite | PASS 311/311 |
| Library and all six wrappers syntax | PASS in both suite runs |
| Exact standalone / merged RE source parity | PASS in both suite runs |
| New platform-trace tests against original Library | FAIL, as intended: `Platform counter-only Retry preserves turn at actionCount 5` |

The original failing assertion and stack are preserved in `regression-before-patch.log`. Original passing output is `offline-baseline.log`; candidate passing output is `offline-candidate.log`; every executed candidate check name is in `executed-checks.json`. Existing expectations were not weakened. An intermediate candidate bundling error caused by JavaScript replacement-string dollar expansion was corrected before any candidate was installed; final parity/syntax passed.

## Issue #1: confirmed cause and focused fix

Fresh baseline adventure: `aO3-3vNiCCv3`. Fresh patched adventure: `OJpBENxbjt5b`. Private scenario: `hw53-X5FRmBq`. Model: Shimmer Pro. Debug true, First Encounter Turn 30, RAND_01 valid, Moderate pacing/default duration.

Sequence: initialize; `/RE start 1`; Continue to introduce; Retry; then genuine Continue. Patched run adds a second Retry before Continue.

| Run/action | pending Input | History length/high | actionCount/high | RE outcome |
| --- | --- | --- | --- | --- |
| Baseline introduction | false | 4 / 1 | 4 / 0 | Turn 2, 18 remaining |
| Baseline Retry | false | 4 / 4 | 5 / 4 | **Turn 3, 17 remaining — defect** |
| Baseline Continue | false | 5 / 4 | 5 / 5 | Turn 4, 16 remaining |
| Patched introduction | false | 4 / 1 | 4 / 0 | Turn 2, 18 remaining |
| Patched Retry 1 | false | 4 / 4 | 5 / 4 | Re-inject turn 2; no advance |
| Patched Retry 2 | false | 4 / 4 | 5 / 5 | Re-inject turn 2; no advance |
| Patched Continue | false | 5 / 4 | 5 / 5 | **Turn 3, 17 remaining — exactly one decrement** |

Native Retry increments actionCount on the first replacement while history length stays unchanged; the following Continue grows history while actionCount can stay unchanged. Thus actionCount growth alone is not a valid forward-turn signal when native history is available.

Candidate `detectTurnAdvance()` retains Input and history-growth paths. With a native history array and neither signal, it refreshes action-count bookkeeping and returns no advance. The original action-count fallback remains when history is unavailable. No new state schema, feature, version number, or structural rewrite was added. Both Libraries contain the same fix. Nine new assertions cover repeated increasing-counter Retry, unchanged turn/duration, subsequent Continue, and typed Input advancing once.

Evidence: `live-before-retry.txt`, `live-after-retry.txt`, `live-after-continue.txt`, and `patched-*.txt`. All four installed baseline scripts were copied back from the editor and exactly matched the repository snapshot; `installed-baseline-scripts.json` preserves them.

**Limits:** no claim for capped/sliding histories, Erase/backtracking, earlier alternatives, or live operation without history. Those were not tested. Existing high-water handling already lacks a reliable history-truncation model; the minimal fix does not solve that broader problem. Keep issue #1 open until the candidate is reviewed/applied; a validated local candidate does not change the GitHub source.

## Generator live retest

Separate fresh adventure, URL in `generator-adventure-url.txt`. Hard; theme `night at the movies`; population true; four placeholders. Candidate Library with a temporary read-only Context logging wrapper; production candidate wrapper unchanged. This logs actual returned Context and RE runtime state rather than simulating model output.

- Shimmer Pro attempts 1–2 returned ordinary prose despite correct dedicated instructions: 0/4; all records stayed queued; RE turn remained 0.
- Switched to available DeepSeek without changing subscription. Attempt 3 returned two valid records: **2/4**, remaining RAND_03/04. Attempt 4 generated the remaining two: **4/4 cumulative**.
- All four saved cards have short titles and one complete sentence. Saved Config retains Hard/theme and resets Populate Placeholder Cards false.
- Actual retry Context retains Hard/theme, current/known locations, exact RAND format and one-sentence rule. Normal story resumes on the following Continue; captured resumed Context contains no progress receipts; RE turn advances to 1 only then.
- Adjacent real `(2 of 4)` and `(4 of 4)` receipts have one blank line between them in the screenshot. The first receipt follows prose without an extra blank line, so universal padding above and below prose is not established.
- No fabricated output was used for live partial-generation evidence. Naturally incomplete batch output left unreturned cards queued. Specific malformed-title/unfinished-sentence branches remain mocked coverage, not live proven.
- Same-action Retry while a generation request is still in `generating` remains offline verified; live queued retry/resumption is verified. Do not conflate them.

Evidence: `generator-attempts1-2.txt`, `generator-attempt3.txt`, `generator-complete.txt`, `generator-resumption-context.txt`, `generated-live-cards.json`, `generator-spacing-proof.png`.

## Remaining acceptance: mode and warnings

Fresh mode adventure URL is in `mode-adventure-url.txt`, model DeepSeek. Existing card registration/Act/duplicate/combined sessions were not needlessly repeated.

| Global/card mode | Actual native Context | Result |
| --- | --- | --- |
| false/false | Natural-opening prompt; forced false | PASS |
| false/true | Immediate current-response prompt; forced true | PASS |
| true/false | Immediate current-response prompt; forced true | PASS |
| true/true | Immediate current-response prompt; forced true | PASS after resetting RAND_02 to Available |

The first true/true attempt was invalid for that comparison because RAND_02 was not Available; it generated a resolution prompt. It is preserved as an unsuccessful test setup, not counted as a passing mode case. The corrected run is `mode-true-true-retest.txt`.

Card-only true immediately introduced a deliberately mismatched roller-skating purple elephant with cotton candy in the quiet cinema, and real Retry repeated the forced prompt at the same turn with 18 remaining. This is observed model compliance for that sample, not a universal guarantee. Global-only repeated an already-introduced event and did not establish fresh core-event compliance; prompt correctness and model compliance are separate.

Exported final Notes (`mode-live-final-cards.json`) contain exactly one canonical mode line per RAND card; RAND_02 remains true, RAND_01 false. Native Context collection succeeded using diagnostic logging even though the platform's Inspect dialog was empty.

- **Short warning popup PASS:** `/RE start 0` visibly showed `RE - Encounter number must be 1 or greater.` (`number-warning-ui.txt`). A valid queue notification was also visibly observed.
- **Long invalid-card popup UNVERIFIED:** `/RE start 3` and `/RE start 4` store the correct invalid-card message and inject control Context rather than the invalid event, but the long warning was not captured visibly. The attempted locator wait expired; this alone does not prove a script defect or a length limit. Retest popup timing/display with a human observer.

## Deterministic coverage and additional audit

Executed suite passes configuration/creator preservation, manual Notes, duplicate keys, Act categories, first-turn scheduling, invalid-card guards, four boolean mode combinations, generation snapshots/progress/parser fixtures, lifecycle/commands, external task pauses, Force ASAP and source parity. Those are script-side results. Previous A/E live results are historical and were not repeated against this candidate; combined live compatibility after the detector fix remains pending.

Additional reproducible parser samples (`parser-edge-audit.json`):

- `A stranger.` is accepted although it is a noun fragment — completeness false positive.
- `A clerk asks, "Coming?" before pointing to the auditorium.` is rejected although it is a valid complete sentence — quoted punctuation false negative.
- Decimal currency and `Dr. Vale arrives.` are accepted; a lowercase second sentence is correctly rejected.

No broad grammar-parser change was made. Prioritize a focused quoted-dialogue boundary test and explicitly document the heuristic nature of grammatical-completeness checks rather than promising semantic validation with regex.

## Morning review and next steps

1. Review `retry-library.patch`, `retry-merged.patch`, `retry-tests.patch`, and candidate documentation diffs. `change-manifest.json` lists original/candidate hashes for all five changed files. Full original copies remain in `baseline/`. No file was deleted.
2. Decide whether to apply the local candidate to the current develop/v1.1 source. Existing checkout divergence must be reconciled deliberately; do not reset away its unpushed report commit. Protected READMEs are untouched.
3. Rerun 311-check suite/parity after applying. Run a fresh combined compatibility smoke and a bounded-history/truncation check before broad release confidence. Keep already-completed live checks separate from future criteria.
4. Observe the long invalid-card warning popup. Retest same-action generation Retry if the platform provides a reliable way to exercise it.
5. Address/document parser edge cases separately. Reconcile outdated test counts and old No Matter What labels in development instructions.
6. Keep issue #1 open while the source candidate is uncommitted. Close only after accepted branch code contains the reviewed fix. No merge, tag, release, or public script publication is approved.

The review directory contains original and candidate files, exact diffs, hash manifest, test output, exported cards, raw native log snapshots, extracted Context/state, test URLs, and screenshots. Temporary diagnostic wrappers are testing artifacts only, not proposed production changes.
