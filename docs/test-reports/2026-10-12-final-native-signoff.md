# RE v1.1 — native acceptance and owner signoff package

Date: October 12, 2026. Approved branch: `review/v1.1-integration`, draft PR #3. Starting remote source: `2d033379d23c83808718f994792c1127e37b5a1f`. Local HEAD before this round: `16b256417749e98288f4abef46244579420db448`, whose tree was verified identical to that remote commit. Only the approved v1.1 branch was accessed. Original checkout, unpushed report commit, candidate and previous evidence remain preserved.

## Recommendation

**Ready for owner review of a beta/pre-release candidate; stable release acceptance is NOT complete.** The owner asked whether a limited launch with later patches is reasonable. Core features are largely functional, but the two remaining gates below must be disclosed and accepted explicitly before publication. This report does not approve a merge, tag or release. Issue #1 and draft PR #3 remain open.

1. **Capped/sliding history: NOT OBSERVED / UNVERIFIED natively.** The bounded run reached 56 exposed history entries and RE turn 56; it did not produce a fixed window. The conservative detector still cannot count a Continue solely from actionCount when history is present. A platform window that stops growing could therefore stall Continue-only pacing/duration. Ordinary typed actions are counted separately. Do not label this a confirmed native cap or a passed fixed-window gate.
2. **Plain generation Retry completion: INCONSISTENT.** Queue preservation, frozen settings, attempts and RE turn accounting pass. In one combined adventure plain Retries reached 2/4 → 3/4 → 4/4. In the final-source adventure two plain Retries repeatedly returned already-populated RAND_01/02 despite the Context hook returning a RAND_03/04 request. A separately labeled guided Retry completed 4/4. This does not establish universal plain-Retry completion, nor prove whether model noncompliance or platform prompt reuse caused the mismatch.

A later patch needs explicit installation/update guidance; existing adventures are not automatically migrated or guaranteed to receive GitHub changes. Preserve the current-schema/fresh-adventure policy.

## Offline gate — PASS

Node v24.19.0; dependency-free command `node docs/tests/smoke.cjs` from the approved source root. Initial source passed 347/347. Final source passes **355/355**. Both Libraries and six wrappers parse; canonical/embedded RE source parity passes; `git diff --check` passes. No expectations were weakened. Protected root and merged READMEs remain unchanged.

Eight new assertions cover the two native defects below. Fail-before-fix stacks and original files are preserved locally.

## Confirmed defects fixed this round

### P1 — Continue missed after backtracking and a genuine typed action

Native reproduction on adventure `1nEhoh8gJB3F`: reach turn 56, erase three backed-up generated outputs, submit a new Story action, then Continue. Typed Story: history 55, old high-water 56, turn 56 → 57. Next actual Continue: history 56/high-water 56; turn stayed 57. Expected: turn 58.

Minimum fix in `detectTurnAdvance`: when `pendingInputTurn` identifies a genuine new Input, anchor history length to the **current** branch rather than retaining an abandoned maximum. No new state schema, history rollback system or third-party-library change was introduced.

Fresh retest `pEh5bMKYuBfP` with Active RAND_01: introduction turn 2/18 remaining; after three ordinary Continues turn 5/15; erase three outputs; new typed action turn 6/14 with rebased history; Continue turn 7/13; Retry stayed turn 7/13; reload and Continue reached turn 8/12. PASS. This retest used the 353-check intermediate source; final source retains identical turn logic and adds only the population-header correction below.

### P2 — Inner Self encoding hid a valid first generated RAND record

Native reproduction on `_J866CDVHFwr`: output began with U+200B/U+200D/U+200B before `RAND01`; two complete Scenario sentences were present, but the parser counted only the second record and reported 1/4, leaving RAND_01 queued.

Minimum fix in `parseDedicatedPlaceholderPopulation`: tolerate those invisible characters **at the RAND control-header boundary only**. Joiners inside generated content remain unchanged. The exact marked-output regression fails before the fix and passes afterward, with an emoji-joiner preservation assertion. Final fresh native generation passed the normal-header path; the marked-header correction itself is covered deterministically, and was not naturally emitted again in the final adventure.

## Native results and limits

| Gate | Actual result |
| --- | --- |
| Fresh Config headings, blank Theme, compact spacing, creation toggle reset | PASS; real editable Config captured, five default cards created |
| Creator Config preservation during actual maintenance | PASS; edited Config compared byte-for-byte |
| Real Retry followed by genuine Continue | PASS; turn 2 held on Retry; next Continue turn 3 and duration 18 → 17 |
| Repeated Retry with long history | PASS for observed sequences; history 55/turn 55, Retry count 56 with turn still 55 |
| Earlier generated alternative | PASS for observed sequence; selected text fingerprint appeared in next Context, turn 55 → 56 |
| Erase/reused position | OBSERVED; replacement reused counts and did not add a new RE turn; next position beyond the old maximum advanced |
| Backtracking followed by typed Story and Continue | FAIL before patch; fresh retest PASS after patch as above |
| Capped/sliding scripting history | UNVERIFIED; no genuine fixed window produced; small-context UI attempt did not change reported maxChars |
| Combined partial generation, original review source | PASS: real 2/4 → plain Retry 3/4 → further plain Retries 4/4, attempt 1/RE turn 1 retained |
| Combined final source, DeepSeek | Queue/settings/preservation PASS; real 2/4 → two plain Retries still 2/4 → guided Retry 4/4; label guided completion separately |
| Final-source cumulative count, one-shot reset and creator edits | PASS; 4/4 final receipt, population false, future Very Easy/downtime edits retained |
| Final-source populated-card preservation | PASS; exported RAND_01/02 objects byte-identical before/after retries |
| Final-source ordinary resumption and Context cleanup | PASS; Continue reached RE turn 2; status receipt absent from returned Context |
| Auto-Cards ownership | PASS on earlier integrated source: RE stayed turn 2 across the real external task; Cinema Lantern card eventually created; normal post-task resumption was not separately certified on the final 355-check source |
| Inner Self participation | OBSERVED: Leo Brain operations and real private Context instructions; no wholesale claim for every external task/order |
| Quoted-parser positive/negative cases | PASS offline, including short trailing second sentence; no native model-produced quoted counterexample this round |
| Semantic grammatical completeness | LIMITATION: regex can accept fragments such as `A stranger.`; not claimed fully verified |

Other previously verified v1.1 features (registration, duplicate correction, Acts, first-turn scheduling, warning popups and Kool-Aid Man prompt combinations) were not replayed wholesale; their historical evidence is in [the prior report](2026-10-12-retry-fix-review-handoff.md). These historical results are separate from this round's live gates.

Native models: DeepSeek V3.2 and Shimmer Pro. Private scenarios: `SugyJyQl7myY` (standalone) and `2upfBJizKAaN` (combined). Adventures: `qvYv0hOWv31v`, `1nEhoh8gJB3F`, `kGEz6jW2m9mu`, `pEh5bMKYuBfP`, `_J866CDVHFwr`, `R8rnZeMMlTyW`. Temporary wrappers logged hook metadata and returned Context without changing production logic. They were restored to exact production Context/Output sections and saved at cleanup. Libraries/Input were copied back and compared exactly during installation.

## Evidence and next focused experiments

[Sanitized native metadata](evidence/2026-10-12-final-native-gates.json) records the test phases and source hashes. Full DOM/console captures, exported cards, screenshots, diagnostic wrapper copies, fail-before-fix logs and intermediate originals are retained in the local review workspace and archive. Logs used tail reads after a large export hit a text-length cap; no missing suffix was counted as an absent hook. A pending UI generation was reloaded rather than treated as proof of a 50-entry platform cap.

For capped/sliding history, capture consecutive Context and Output history identities until a real forward action holds history length constant but adds a new completed response. A likely narrow remedy compares a bounded window shift or the prior completed Output's presence in subsequent history, preserving Retry when its input history is unchanged. Do not reinstate actionCount-only advancement. A lower model context limit does not itself prove the scripting array is truncated. The current [AI Dungeon API documentation](https://help.aidungeon.com/scripting) describes a recent-action history array; native entries here exposed text/type/rawText and no stable action ID.

For plain Retry, compare an identical queued batch under plain Retry and ordinary Continue in fresh adventures, inspect the actual submitted model context if available, and record Optimized Context/cache settings. The returned Context logger alone cannot prove the model received that request. Do not renumber unrequested records or overwrite authored entries to fabricate completion. Safe current recovery is Continue; guided Retry is separately observed successful. Only strengthen prompt instructions after the cause is supported by evidence.

## Owner decision checklist

- Review and accept the two focused fixes and preserved evidence.
- Decide whether to authorize a clearly labeled beta with both limitations disclosed, or hold until the unverified history-window gate and plain-Retry behavior are resolved.
- Explicitly approve any merge/release/tag and release-only README updates separately. No publication has occurred. No subscription was changed and no scenario/adventure was deleted.
