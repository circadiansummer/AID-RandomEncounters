# Codex RE v1.1 test report and review handoff — October 12, 2026

**Final local candidate: 328/328 checks pass. Three focused fixes have targeted live evidence. Source changes remain local and uncommitted for manual review; no scenario, adventure, script, tag or release was published.**

## Environment and backups

- Only `circadiansummer/AID-RandomEncounters` `develop/v1.1` was fetched/read; `main` was not accessed.
- Existing checkout: `develop/v1.1`, HEAD `5b0b9014531f002889e8c7c1010cdf9bde10f465`, initially clean with one old unpushed report commit. HEAD and tracked files are preserved.
- Tested remote source baseline: `e4d8b295807e6c0316267b23b104c3c04505517b`, newer than the supplied `3f94f269`, including Force ASAP and Kool-Aid Man Mode. Subsequent GitHub writes from this round are documentation only.
- `baseline/` preserves the complete original branch snapshot; `candidate/` holds proposed changes. `change-manifest.json` records before/after SHA-256 hashes for six changed files. Exact patches, intermediate backups, console logs, exported cards and screenshots are included.
- Node v24.19.0; executable `/Users/alissa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`.
- Read AGENTS.md, testing, roadmap, configuration, encounter-card guide, changelog, smoke harness and prior live evidence. Canonical code now calls the feature **Kool-Aid Man Mode**; older instructions still say No Matter What Mode and contain stale test counts.
- No subscription changes or scenario/adventure deletions. Only private disposable test data was changed. Temporary Context loggers were removed; the temporarily blanked warning-test card was restored and verified.

## Reproducible offline results

From this review directory, set `RE_NODE` to the executable above:

```sh
"$RE_NODE" baseline/docs/tests/smoke.cjs
"$RE_NODE" candidate/docs/tests/smoke.cjs
```

| Check | Actual result |
| --- | --- |
| Original branch suite | PASS 302/302 |
| Final candidate suite | PASS 328/328 |
| Libraries and all six wrappers syntax | PASS |
| Exact standalone / merged RE block parity | PASS |
| New Retry assertions against old Library | FAIL as intended: counter-only Retry spends a turn |
| New combined-control assertions against old Input wrapper | FAIL as intended: rejected AC command spends a turn |
| New queued-generation assertions against earlier timer candidate | FAIL as intended: partial generation Retry becomes story Context |

No existing expectations were weakened. The 26 added checks cover 10 turn/Retry assertions, six exact combined-adapter assertions, and ten queued-generation/snapshot/progress assertions. `offline-final.log` and `executed-checks.json` record the final run; before-fix stack traces are preserved. Intermediate 311/318/327 counts in earlier logs describe intermediate candidates, not final status.

[Sanitized native metadata evidence](evidence/2026-10-12-v11-native-metadata.json) preserves actual hook timestamps/counter logs, frozen batch fields, card-preservation results and warning observations without publishing the proposed script code.

## 1. Retry accounting — issue #1

Fresh original adventure `aO3-3vNiCCv3`; fresh patched adventure `OJpBENxbjt5b`; Shimmer Pro, Debug true, First Encounter Turn 30, valid RAND_01, Moderate/default Duration. Sequence: initialize, `/RE start 1`, Continue to introduce, Retry, then actual Continue; patched run also includes repeated Retry.

| Action | History length/high | actionCount/high | RE result |
| --- | --- | --- | --- |
| Original introduction | 4 / 1 | 4 / 0 | Turn 2; 18 remaining |
| Original Retry | 4 / 4 | 5 / 4 | **Turn 3; 17 remaining — defect** |
| Original Continue | 5 / 4 | 5 / 5 | Turn 4; 16 remaining |
| Patched Retry 1 | 4 / 4 | 5 / 4 | Remains turn 2 |
| Patched Retry 2 | 4 / 4 | 5 / 5 | Remains turn 2 |
| Patched Continue | 5 / 4 | 5 / 5 | **Turn 3; 17 remaining — one decrement** |

`pendingInput` was false for these actions. Counter values are RE's existing Math.abs-normalized diagnostics; raw counter sign was not separately captured. Counter-only growth was observed on Retry while the subsequent Continue grew history without increasing that normalized count.

The focused detector fix keeps Input/history-growth counting, suppresses count-only growth when native history is available, and retains the original fallback without history. No new state schema or structural rewrite. Later combined live checks also protected Retry of a typed Story response: history 9/high 9, actionCount 10/high 8, no advance from turn 4.

Evidence: `live-*.txt`, `patched-*.txt`, `combined-active-retry.txt`, `combined-control-typed-retry.txt`. All four originally installed scripts were copied back from the editor and exactly matched the snapshot.

**Limits:** capped/sliding history, Erase/backtracking/alternative selection and absent-history live behavior remain unverified. History high-water handling is not a complete rollback system. In particular, a fixed-length history window could make legitimate Continue look unchanged; do not approve broad release behavior without investigating that case. Issue #1 stays open while the accepted GitHub source still lacks these local changes.

## 2. Generator retest and queued-Retry interaction

Hard / `night at the movies`, four untouched placeholders, separate fresh adventures:

- Shimmer Pro twice returned prose despite correct dedicated instructions: 0/4, all cards remained queued and RE turn stayed 0. This is observed model noncompliance, not a parser failure.
- DeepSeek produced a real partial batch **2/4**, then **4/4** on Continue. Saved cards have titles and complete single-sentence Entries; completed/total is cumulative. Population toggles false and ordinary story resumes afterward.
- Adjacent real 2/4 and 4/4 receipts show one blank line between them (`generator-spacing-proof.png`). The first receipt after prose has less top padding; universal above/below spacing is not claimed.
- All four global/card mode combinations were captured as actual returned Context: false/false is natural; the other three are immediate. DeepSeek immediately introduced a deliberately mismatched roller-skating purple elephant in the card-only enabled case and repeated its forced prompt on Retry. Other samples do not establish universal model compliance.

**Interaction found during further testing:** the timer fix made a real Retry of a handled partial batch correctly detect no new turn, but its queued generation branch then fell through to ordinary story Context. In adventure `e3QEWnkZi9z9`, the request still held Hard/theme, completed 2/4 and remaining 3/4, yet the Retry Context contained no data task or Hard instruction. This was discovered on the local timer candidate, not asserted as a new failure of the unchanged remote source.

The additional narrow fix re-requests an already-attempted queued batch on Retry with its stored settings and remaining numbers. It preserves attempt count and RE turn, refreshes cumulative popup progress and uses existing metadata. A never-attempted queued batch still waits for a forward action.

**Final fresh live confirmation, adventure `sd-DjhgpF2hg`, DeepSeek:**

1. Initial generation returned a genuine 2/4 partial batch, attempt 1, RE turn 0.
2. Deliberately edited adventure Config to Very Easy / `downtime` for future batches.
3. Clicked real Retry. Actual Context still used **Hard / `night at the movies`**, requested only RAND_03/04, remained **attempt 1**, and refreshed progress to **2 of 4**.
4. Retry completed **4 of 4**. Export comparison proves already-generated RAND_01/02 were unchanged byte-for-byte. Creator's deliberate Config edits were retained; population became false.
5. Next Continue resumed ordinary story at RE turn 1; captured Context contained no generation receipt.

Evidence: `generation-native-retry-before-fix.txt`, `generation-final-*.txt`, extracted Context/state JSON, before/after card exports, and `generation-final-retry-proof.png`. Specific malformed-title/unfinished-sentence cases remain mocked coverage; no fake output was used to claim live coverage.

## 3. Combined scripts and rejected Auto-Cards controls

Fresh adventure `Czk2AsvVVYgV`, DeepSeek, exact merged source copied back and verified:

- Native Inner Self Brain card for Leo stores three actual brain operations; private prefixes do not leak into ordinary narration.
- Auto-Cards enabled and successfully generated Lobby Projector. RE explicitly logged Auto-Cards ownership and paused. Continue resumed ordinary pacing from turn 3 to 4.
- With an encounter active, successful Velvet Curtains generation paused RE. Following Continue advanced turn 6 to 7 and remaining duration 17 to 16 once.
- **New edge failure:** rejected `/ac Lobby Clock` returned invalid/unavailable and empty story output, but spent RE turn 5→6 and duration 18→17 because there was no active workpiece for the existing detector to recognize.

The combined Input fix captures AC command intent before upstream text rewriting and calls the already-existing RE pause hook. Third-party implementations and standalone wrappers remain untouched. Tests execute the exact adapter with a stub that rewrites text; this is separated from actual native evidence.

Fresh post-wrapper-change adventure, URL in `combined-control-adventure-url.txt`, Shimmer Pro: start + Continue gave turn 2/18 remaining; rejected `/ac redo Missing Test Card` logged a control-command pause; next Continue gave turn 3/17; typed Story gave turn 4/16; its real Retry stayed on turn 4.

Evidence: `combined-*.txt` and normalized console logs. Combined smoke preceded the final standalone queued-generation refinement; final merged parity passes, but that new partial-generation Retry path was not rerun with active Inner Self/Auto-Cards ownership. Exhaustive third-party tasks and load ordering are not claimed.

## Coverage and remaining work

| Area | Result |
| --- | --- |
| Config/creator preservation, manual Notes, duplicates, Acts, first-turn scheduling, invalid guards, lifecycle/commands, Force ASAP | PASS executed deterministic checks; prior accepted live rounds retained, not wholesale repeated |
| Native Retry timer + subsequent Continue + typed response Retry | PASS targeted local fix evidence |
| Native partial generation, cumulative counts, settings snapshots, real Retry, resumption | PASS targeted local fix evidence |
| Mode OR combinations and Notes single-field retention | PASS actual Context + final native export; model compliance observed separately for a sample |
| Short and long invalid warnings | **PASS live**; synchronized completion wait captured `/RE start 0` and full RAND_04 invalid-card toast |
| Combined native brain operations, AC pause/resumption, timer and rejected controls | PASS tested sequences; final combined generation-Retry interaction NOT RUN |
| Capped/sliding history, Erase/backtracking/earlier alternatives, absent-history live fallback | NOT RUN; require investigation before broad release confidence |
| Arbitrary model compliance / every malformed-generation shape | NOT VERIFIED by mocked tests |

The earlier long-warning captures missed popup timing. Final synchronized capture succeeded (`warning-synchronized-long.txt/.png`); no warning code change was needed. The temporarily blanked card's Entry was restored and read back exactly.

Additional parser audit (`parser-edge-audit.json`): `A stranger.` is accepted despite being a noun fragment; `A clerk asks, "Coming?" before pointing to the auditorium.` is rejected despite being a valid sentence. Decimal currency and Dr. abbreviations pass; lowercase second sentences are rejected. These are heuristic quality/coverage limitations, not repaired by a broad grammar rewrite. Prioritize quoted-punctuation coverage and document semantic-completeness limits.

## Manual review / next steps

1. Review six candidate files and their patches: standalone Library, merged Library, combined Input, smoke tests, testing documentation and changelog. Original copies and hashes are preserved. Protected READMEs, third-party code, tracked checkout and HEAD are unchanged; no file was deleted.
2. Reconcile the older checkout's unpushed report commit safely before applying anything to current develop/v1.1. Do not reset it away. Source patches remain local under the ban on publishing scripts.
3. Re-run the final 328-check suite/parity after any accepted edits. Investigate fixed-length/truncated history and the parser edge cases. Check the final queued-generation Retry path in a combined adventure if that integration is needed for acceptance.
4. Keep issue #1 open until reviewed code is accepted into the permitted development workflow. Local live success does not change the remote script source or approve a release.

**Release readiness: not approved.** Automated checks and targeted live gates made substantial progress; remaining boundaries and manual review are explicit. Only the documentation handoff and issue status/evidence were uploaded to GitHub.
