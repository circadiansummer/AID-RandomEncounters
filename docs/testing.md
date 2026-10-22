# Testing

## October 21, 2026 — v1.13 owner acceptance and main promotion

The owner expressly accepted the new default and requested it become the new main version. **418/418 deterministic checks PASS** against v1.13 standalone and combined Libraries, with explicit opt-in card creation, no auto-created encounter cards, and preserved authored cards. This is **owner acceptance**, not independently collected fresh AI Dungeon logs. See [v1.13 signoff](test-reports/2026-10-21-v113-owner-signoff.md), the [development test report](test-reports/2026-10-21-no-auto-startup-cards.md), and [release notes](RELEASE_NOTES_v1.13.md). Historical v1.12 tests below remain tied to the original version.

## October 14, 2026 — v1.12 release regression and owner signoff

**Release branch:** `feature/v1.1-generation-controls` prepared as v1.12. **Offline PASS:** 406/406 deterministic checks, including direct additive creation (3 then 2 more; 10 more after four), generation separation, former Config field conversion, immediate-introduction mode OR semantics, the legacy `Kool-Aid Man Mode` and `No Matter What Mode` aliases, and exact standalone/combined RE core parity. All eight Library/Input/Context/Output script sections parse.

**Owner-reported acceptance:** Owner stated on October 14, 2026 that all tested features are confirmed and authorized v1.12 to go live. The earlier Act-category UI and ASAP native passes are separately recorded. **Not claimed:** New native test or modifier logs specifically proving the renamed field on this commit.

**Known limitations carried forward:** genuinely capped/sliding history Continue accounting not verified; plain Retry following partial AI placeholder generation inconsistent. The release operation must preserve both v1.1 and v1.0 historical tags/releases. README is updated only as part of this owner-authorized version release.

## October 14, 2026 — v1.1 new generation controls (development; needs native acceptance)

**Scope:** `feature/v1.1-generation-controls`, not released to `main`. **Offline:** 402/402 mock/runtime assertions PASS, including standalone/combined Library exact RE core parity and six wrapper syntax checks. This is not an AI Dungeon native result.

**Targeted fresh-adventure live checklist:**

1. Install one complete new candidate variant (standalone OR combined) and start a **new adventure**. Confirm Config section order and exact labels, including the separator and `- Encounter Theme:` with no trailing blank after the colon on fresh install.
2. Let initial creation run: the fresh Config starts at `Placeholder Cards to Create: 4` and `Create Placeholder Cards: true`, creating four new default placeholders then resetting its toggle.
3. Change count to `10` and `Create Placeholder Cards` to `true`, submit an ordinary turn; confirm **10 additional** cards, numbered RAND_05–RAND_14, and existing cards unchanged. Confirm the toggle resets to false and the creation alone does not generate AI encounter descriptions.
4. Set `Run Encounter Generation: true`, submit an eligible action and inspect generated one-sentence content and progress. Confirm custom Entries and Outcomes are not overwritten. Note that ordinary Retry after partial model population has a documented native inconsistency.
5. For an existing v1.1 Config using the three former generation field labels, confirm only those labels are migrated, the original number is retained, and unrelated creator edits remain intact. If migrating an active creation toggle, note that the new additive semantics apply.
6. Test one run with the combined Inner Self/Auto-Cards set to check control ordering and progress presentation.

**Historical acceptance** for ASAP and Act-category UI remains valid for earlier v1.1 source; it does not verify these newly changed controls.

## October 13, 2026 — v1.1 Importance ASAP owner acceptance

**PASS (owner-reported live AI Dungeon):** In response to the targeted check that `Importance: ASAP` triggers at the earliest eligible story opportunity despite Slow Encounter Pacing, the owner confirmed “It works.” This closes the specific native scheduling test outstanding after the v1.1 `main` promotion. Configuration screenshots, turn-by-turn logs, model, and separate ASAP gating/priority edge-case runs were not supplied. See [owner-reported ASAP acceptance](test-reports/2026-10-13-v11-asap-scheduling-acceptance.md).

The earlier **PASS (owner-reported)** for 📜/🔒 Act-category UI remains valid. **UNVERIFIED:** capped/sliding history Continue accounting. **INCONSISTENT:** plain Retry after partial AI placeholder generation. Previous 389/389 deterministic assertions remain historical, not newly rerun; no script code changed.

## October 12, 2026 — v1.1 Act category UI owner acceptance

**PASS (owner-reported live AI Dungeon):** After the v1.1 source was promoted to `main`, the owner reported “tested ui changes and it workedd.” The updated Act-category UI is accepted as working for that reported run. Exact game/model, actions and screenshots were not provided; individual manual versus automatic refresh paths were not independently enumerated. See the [acceptance record](test-reports/2026-10-12-v11-act-category-ui-acceptance.md).

**STILL NOT REPORTED:** Native first-eligible `Importance: ASAP` scheduling; the UI confirmation does not demonstrate this runtime scheduling behavior. Historical unresolved capped/sliding history and partial placeholder-generation plain Retry limitations remain in effect. No code or regression assertions changed for this documentation update.

## October 12, 2026 — Importance ASAP and dynamic Act-category icons (new candidate; live check pending)

The current v1.1 candidate uses `Importance: ASAP`, not `Rarity: ASAP`. ASAP counts as Required for Act completion and receives first-eligible scheduling without bypassing Act/First Encounter Turn/Active-resolution gates; regular Rarity weights remain independent. Existing pre-release `Rarity: ASAP` or `Force ASAP: true` migrates to Importance ASAP during maintenance. Act Story Card categories end in `  📜` when the Act is unlocked and `  🔒` when still locked. They refresh after creator edits or immediately upon successful Required/ASAP Act progression in Output.

**Latest source snapshot:** `63e51803a88d755a1dfe1c17572cf4bb6f84280d` with **389/389 deterministic checks** PASS, canonical and combined source parity PASS, and six wrapper syntax checks PASS. The prior 376-check `Rarity: ASAP` candidate is superseded (its section remains below as history). **Not natively validated:** actual AI Dungeon category presentation/refresh and first-eligible ASAP behavior. Existing capped/sliding history and generation plain-Retry caveats remain open. No beta/public release approved.


## Human test installation source (October 12, 2026)

Use only the eight script-section files listed in [the v1.1 human test source manifest](test-reports/2026-10-12-human-test-source-manifest.md). They are pinned to source commit `63e51803a88d755a1dfe1c17572cf4bb6f84280d` on the `review/v1.1-integration` draft-PR branch; do not mix the standalone Library with the combined Inner Self adapters or install the public v1.0/`main` files. The source snapshot passed **389/389 deterministic harness checks** including exact source parity and six wrapper syntax checks. **This verifies offline behavior only.** Real AI Dungeon `Importance: ASAP` scheduling, lock/unlock category display and legacy Act Map retirement need focused fresh-adventure human acceptance before beta approval. The native 355-check report predates the ASAP change and does not cover it.


## October 12, 2026 — Rarity ASAP scheduling (new code; live acceptance required)

`Rarity: ASAP` replaces the separate `Force ASAP` switch. At the first eligible real story action, an ASAP encounter skips the normal pacing countdown but does not replace Active encounters, queued encounters, pending resolutions, or externally owned generation; First Encounter Turn still gates the initial automatic event. Multiple eligible ASAP cards use lowest Act then RAND number. Rarity ASAP remains attached through successful, in-progress and did-not-occur resolutions. Legacy pre-release `Force ASAP: true` migrates to ASAP; false is removed.

**Deterministic integration check:** 376/376 passed on `review/v1.1-integration` with exact standalone/merged RE parity and six wrapper syntax checks. These cover pacing bypass, First Encounter Turn, Act eligibility, multi-ASAP ordering, preservation, migration, and fail/no-event cases. **Not yet AI Dungeon live-tested on this changed scheduler.** A focused fresh-adventure gate should confirm one ASAP card firing despite an ordinary countdown, a card unlocked by an Act change, deferral while Active/pending resolution, and no priority setting leaks or duplicate Notes lines. Do not re-run unaffected earlier v1.1 acceptance.

**Prior beta signoff remains historical:** the October 12 355-check native signoff predates this behavior change. The separate unresolved capped/sliding history and plain Retry limitations still apply. No stable release, public `main` merge or tag is authorized.


## October 12, 2026 — native acceptance and signoff review

Fixed confirmed history-anchor failure after Erase plus typed Input, and Inner Self invisible-prefix rejection at generated RAND headers. Added eight regressions; 355/355 Node checks, syntax and canonical/combined parity pass. Native successes and remaining capped-history/plain-Retry limits are recorded in the [owner signoff package](test-reports/2026-10-12-final-native-signoff.md). Beta review candidate only; stable acceptance and public release are not approved.


## October 12, 2026 — approved integration reconciliation

Restored original candidate coverage and proven combined Input adapter; corrected quoted-parser trailing-text index mismatch. Node regression: 347/347 PASS, syntax and source parity PASS. Exact integrated live gates remain pending. See [reconciliation handoff](test-reports/2026-10-12-reconciliation-write-permissions.md). No public release or version change.


## v1.1 integrated review candidate (October 12) — not released

**Target branch:** `review/v1.1-integration` (see `docs/test-reports/2026-10-12-integration-review-handoff.md`).

This is a **source-reconstructed integration**, not the untouched local 328-check candidate from October 12. It combines the corrected Config layout with targeted changes described by the preserved native test handoff: Retry turn accounting, rejected Auto-Cards control pauses, partial-generated-card Retry, and narrow quoted-punctuation parsing.

**Automated checks:** 318/318 passed on this integration implementation (including merged Library parity, wrapper syntax, Config layout, and focused regression coverage). The original local candidate's 328/328 and native test results are separate evidence, **not** verification of this new branch. On Codex's checkout, rerun the suite and report the actual count.

**Codex acceptance gate:** Compare preserved local `candidate/` patches and `change-manifest.json` against this branch. Test bounded/sliding history, Erase/rewind/alternatives (especially a real Continue with unchanged history length), combined Inner Self + Auto-Cards partial-generation Retry, and the corrected Config layout in separate fresh adventures. Check that non-/ac story actions are unaffected and that valid quote punctuation is retained. Do not use AI model compliance as evidence for deterministic runtime behavior; document semantic fragment limitations separately.

**Release safeguards:** Issue #1 remains open, and public `main`, v1.0 and protected root READMEs are unchanged. No release is authorized. If fixed-length history causes missing genuine turns, fix that safely and repeat the relevant fresh-adventure test before requesting release approval.


## v1.1 — implemented development build, partial live acceptance; corrective patch pending live retest

**Config layout branch (October 12):** New Config Entries use ENCOUNTERS → SETTINGS / GENERATION and blank default Theme; Create Max toggle preserves the separation line. Existing author-edited cards are not reformatted. Layout is covered by offline assertions but the fresh-adventure visual is not verified. The 328-check local Retry candidate remains separate and uncommitted.


**Development status:** All seven scoped feature groups are implemented on `develop/v1.1` but not published as a release. The public v1.0 tag and `main` scripts remain unchanged. No pre-existing adventure migration is required.

**Deterministic regression — PASS: 294/294 checks (post-report corrective patch).** `node docs/tests/smoke.cjs` validates the canonical standalone Library and the exact RE code in the Inner Self/Auto-Cards merged Library. New cases cover:

- First Encounter Turn defaults/fixed/range, preserved pacing, manual starts, and external task ownership
- Manually registered RAND cards with blank/partial/freeform/complete Notes, idempotency, and Global Defaults
- Automatic reassignment of duplicate RAND keys (including key arrays), metadata and titles, preserving the original key and creator text
- Per-Act Story Card type synchronization on creation, manual Act edit, and reset
- Global and per-card `No Matter What Mode: true | false`, all four OR combinations, Notes initialization/preservation, recognized boolean aliases, invalid-value handling, deduplication, and Retry intensity. New prompt assertions cover immediate interruption, accepted absurd mismatches, natural reactions, open-ended outcomes, hidden control syntax, and unchanged normal-mode integration.
- Invalid/placeholder automatic pool exclusion, warnings on manual activation, final pending/Active/Retry guards, and canceled resolution
- Genre-neutral five-level generator difficulty (Easy default), up-to-five-word/60-character theme (None default), batch-snapshot retries, location phrasing, partial/completed `[RE] Updating Encounter Cards (X of Y) - Hit Continue` hijack messages, old-format cleanup, and invalid-setting fallbacks

These checks are mock/script-side, not proof that AI Dungeon's editor renders dynamic type groups correctly or that its models obey immediate encounter instructions.

**Targeted live acceptance — partially completed October 11, 2026.** See [the Codex report](test-reports/2026-10-11-v1.1.md): A and E passed; B and C passed observed subchecks with remaining checks blocked/not run; D exposed a live Retry turn-counting defect. After the corrective patch, the changed generator/receipt behavior needs targeted live retesting. **The Retry accounting defect remains unresolved.** Turn-detector debug logging now reports pending Input, history length/high-water, action count/high-water, and most recent history type to support a focused reproduction.

**Outstanding targeted live acceptance; use fresh v1.1 AI Dungeon adventures:**

1. Author an encounter with `RAND_05`, custom Title and Entry, empty Notes; perform an action, check Notes initialization and Act 1 category. Change Act to 2 and check grouping changes without altering Entry or Title.
2. Add two cards sharing `RAND_06` while leaving the first unchanged; check the later card is assigned the next free higher number, that its Notes and optional default title agree, and that a player-facing popup reports the change.
3. Set `First Encounter Turn: 3` with one eligible, valid encounter and confirm it begins at RE turn 3, not before. Test an all-placeholder pool to confirm no automatic selection or first-turn consumption.
4. Try `/RE start #` on a blank or untouched placeholder encounter; confirm a player-facing invalid message and no RE encounter instruction sent to model. Edit an already queued/Active event to blank and verify it returns to Available without false completion.
5. Compare global and per-card `No Matter What Mode: true | false`: `false/false` retains scene-sensitive introduction, while `false/true`, `true/false`, and `true/true` demand immediate interruption, even with a narratively mismatched event. Check the injected Context separately from the model's storytelling. In a fresh calm/wholesome adventure, test a benign, deliberately unrelated event: it should begin in the current response without being foreshadowed, softened, delayed, or explained away merely for continuity. Characters may react naturally and outcome remains open. Confirm default false, Notes preservation, invalid `Default` handling, no duplicates, and Retry intensity; do not confuse model noncompliance with an incorrect scripted prompt.
6. In a fresh adventure, enable placeholder generation with Hard difficulty and `night at the movies` theme; confirm the model-facing text mentions game difficulty, the theme, current and known locations, and retains the required one-sentence RAND protocol. Confirm the progress message uses `(completed of total)` before `- Hit Continue` and normal story resumes after Continue. A failed or partial attempt should not inflate the completed count.
7. Confirm normal scenario flow with Inner Self and Auto-Cards where practical; inspect no unexpected user-facing generation turn, command prefix corruption, or lifecycle regression.

**Acceptance policy:** User confirms live behavior before full v1.1 publication. Preserve the protected README and public `main` until a full release is explicitly approved.

---

## v1.0 — final release validation

**Test policy:** Request an AI Dungeon live test **only** when the result depends on real platform behavior, actual model compliance, or cross-script ordering that cannot be reliably established by the current-source and mocked-runtime tests. Confirm deterministic code behavior using the automated suite, without making the player redo the same test in an adventure. Do not treat every prior version's test plan as a new release gate.

**Released build:** v1.0; current-schema/fresh-adventure installs only. Legacy migration is deliberately unsupported. A new runtime feature or fix would require a distinct version and targeted retest; test-documentation-only changes do not.

### Confirmed without additional live testing

The dependency-free `node docs/tests/smoke.cjs` suite currently passes **156/156 checks** using the exact canonical v1.0 Library and the maintained Inner Self compatibility fixture. These validations are sufficient for release-candidate sign-off of the *deterministic script-controlled behavior* listed below. Do not require AI Dungeon re-enactments solely to confirm them.

| Deterministic behavior | Evidence | New live test? |
| --- | --- | --- |
| Library/fixture JavaScript syntax and exact embedded RE source parity | Source and runtime checks | **No** |
| Config/Advanced/Encounter Notes and card categories; no new centralized History card | Mock Story Card/runtime assertions | **No** |
| Current-schema entries remain user-editable without legacy formatting rewrite | Mock existing-card assertions | **No** |
| Four starting cards; Maximum Encounter Cards and Create Max one-shot reset; custom titles/entries preserved | Mock lifecycle checks | **No** |
| Act Map enabled/disabled card lifecycle, metadata, rendering state, and refreshed completion state | Mock lifecycle checks | **No** |
| Restore Defaults and Set All Available one-shots, applied metadata, preservation of Outcomes and titles | Mock lifecycle checks | **No** |
| Manual command parsing, turn preservation, targeted selection, activation, and end-resolution queuing | Mock Input/Context/Output hooks | **No** |
| `/RE status` exact text across all runtime cases, precedence, no card updates, and control-turn preservation | Mocked regression assertions; **user-confirmed popup works in AI Dungeon on 2026-10-10** | **No — tested live** |
| Successful/failed resolution parsing, per-card Outcome, Retired/Available state, Required Act advancement | Mock Output/lifecycle hooks | **No** |
| Awaiting Completion half-Duration and five-check fallback | Mock forced resolution sequence | **No** |
| Population receipt/progress, attempt counts, partial and complete RAND parsing, toggle cleanup, status string, and story-prose pass-through | Mock Input/Context/Output hooks | **No** for scripted logic; **yes** for actual UI presentation/model compliance |
| Stopped Context and Auto-Cards-owned model-task deferral without spending RE turns | Mock Context/Output hooks | **No** for scripted logic; prior live evidence covers the real combined integration below |

**Previous live evidence that need not be repeated:** standalone population and subsequent story resumption were validated in v0.18.36, and complete 4/4 generation with Inner Self + bundled Auto-Cards task deferral was observed on attempt 11 in a later v0.18.39 test. The generation, pause, and wrapper design were not intentionally changed in v0.18.40–v0.18.44; v0.18.44 adds only the read-only status command. Accordingly, the full multiple-attempt combined compatibility run is **not** a repeat release requirement. This does not imply every UI or arbitrary script load order has been validated.

### Final live acceptance — complete

**Confirmed on 2026-10-10:** the user tested `/RE status` in AI Dungeon and reported that it works. Treat its popup as **live-verified**; do not request a repeat of that test. Other platform/model checks below remain separate only if not already demonstrated by the user’s current live session.

1. **Platform wiring and status popup — PASS (user-confirmed, 2026-10-10).** `/RE status` works in AI Dungeon. The code-side countdown, priority, and no-mutation guarantees are already covered by mocked tests. No extra screenshots, logs, or re-runs are required for this accepted feature.
2. **Actual story-model handling — PASS (user-confirmed, 2026-10-10).** The encounter was introduced and resolved naturally in AI Dungeon without leaking internal control text. No repeat is needed.
3. **Optional visual polish (non-blocking).** Leave just **one** default placeholder unedited, toggle `Populate Placeholder Cards: true`, and advance an eligible action. Inspect the in-game receipt/numbered Attempt popup, and (on successful generation) the `[RE] Updating Encounter Cards - Hit Continue` presentation. We already know the exact source string and data parser behavior; this checks **only** how AI Dungeon and the model present them. If the model keeps writing prose, record the observation rather than repeatedly grinding through a dozen turns solely to re-prove retry logic.

**Release criteria satisfied:** the user confirmed `/RE status` and natural model-facing encounter behavior. Earlier successful standalone and combined placeholder generation tests remain applicable. Exact popup cosmetics during optional population are not a release blocker.

**Do not request:** a second legacy migration adventure, five Awaiting Completion cycles, all `/RE` commands, bulk resets, repeated Act progression tests, a second four-card population run, or an additional complete Inner Self/Auto-Cards session unless the short live smoke reveals a concrete incompatibility.

**Evidence:** the user's 2026-10-10 live confirmation is sufficient for `/RE status`. For any remaining issues, request only relevant failing modifier logs or an affected screenshot; no full session transcript is required.

### If anything fails

Reproduce the individual failure with a focused deterministic test first. Change code only when evidence shows a bug; bump the pre-release patch version, sync the Inner Self harness, update Changelog and relevant docs, rerun the suite, and request **only** the minimal live check for the specific platform-dependent fix. Do not restart the full gate.

---

## Archived testing checkpoints

The following sections record previous version-specific test plans and outcomes for historical reference; the consolidated plan above is the current release gate.


### v0.18.42 History retirement and Config category — new adventure and upgrade checks

**Data warning:** the legacy `random encounter history` Story Card is removed when v0.18.42 maintenance first runs; copy its Entry and archived Notes *before installing v0.18.42* if those records should be kept. RAND cards' `Outcome:` fields are unaffected.

**Fresh adventure with v0.18.42:**

1. Create a **new AI Dungeon adventure** with current Library/Input/Context/Output or synchronized Inner Self harness.
2. Open the Story Cards and verify there is **no History card**; Config has type `#RE - Config`, RAND cards have `#RE - Encounters`.
3. Enable Advanced Settings and Display Act & Encounter Map; verify both cards have type `#RE - Config`. Confirm prior editable settings still work.
4. Open Config → Notes and confirm the heading now says `LIFECYCLE & OUTCOMES` and there is no History archive or History injection guidance.
5. Start an eligible encounter using `/RE start 1`, advance to activation, then use `/RE end` to queue classification. Confirm `The encounter occurred:` is accepted and stored under the RAND card's `Outcome:`.
6. Verify Retired status, Act progression when all Required encounters in the current Act have completed, and the Act Map update. Confirm no History card is recreated.
7. Test a failed or in-progress resolution to ensure restoring/Awaiting Completion behavior remains unchanged. Continue one ordinary story turn; confirm no `[RANDOM ENCOUNTER HISTORY]` block is injected.
8. If practical, do one combined Inner Self + Auto-Cards attempt to check compatibility ownership remains intact.

**Legacy adventure migration (use a disposable copy):**

1. In an older adventure, note or back up the `History` card's Entry and Notes. Also preserve a RAND card with an existing `Outcome:`.
2. Apply v0.18.42. Trigger a normal eligible Context pass; verify only the `random encounter history` card disappears.
3. Verify Config, Advanced Settings, and Act Map types change to `#RE - Config` without changing their editable Entries; the previous RAND `Outcome:` remains.
4. If an unrelated card is titled `History` but uses another key, confirm it remains untouched.

**Automated regression:** run `node docs/tests/smoke.cjs` from repository root. The mocked test checks legacy migration, output classification, Act advancement, map refresh, generation retries, and canonical/harness parity. It is not a substitute for live validation.


### v0.18.41 compact Config Notes validation

1. Start a **new AI Dungeon adventure** with v0.18.41 (or its synchronized Inner Self harness).
2. Open **Config → Notes** and confirm major `====` headings and subhead `----` dividers are present for SYSTEM / ENCOUNTERS / GLOBAL DEFAULTS / LIFECYCLE & HISTORY / COMMANDS.
3. Confirm concise descriptions for all editable Config Entry fields and the explicitly requested items: Inner Self delay warning (without the rejected causal explanation), one-shot toggles, single-sentence setting-appropriate population, preservation of custom entries and existing defaults, progression, status markers, History, and `/RE` commands.
4. Check the editable Config Entry fields remain unchanged, and use a quick Continue to confirm runtime behavior.
5. Run `node docs/tests/smoke.cjs` locally to reproduce **43** mocked/source checks. These checks cover Notes and existing population behavior but do not replace the new adventure.


### v0.18.40 cleanup and smoke regression

- **Automated source checks:** run `node docs/tests/smoke.cjs` from repository root (Node 18+; no dependency install required). Tests exercise JS syntax, canonical/Inner Self source parity, actual generated Config Notes, no redundant Notes writes, one Act Map synchronization at population start, failed narrative pass-through, retry/attempt counts, Auto-Cards pause/output ownership, partial/full RAND population, success popup, and status cleanup.
- **Fresh AI Dungeon adventure:** verify the abbreviated Inner Self warning appears in Config Notes, Config and Advanced Settings still migrate/display correctly, population resumes after Auto-Cards work, and an enabled Act Map updates on normal encounter state transitions.
- The smoke suite is a simulated environment, not a live combined-model compatibility validation. Retain v0.18.39's 4/4 Inner Self + Auto-Cards live result as prior-version evidence. Do not declare v0.18.40 live validated until tested.


### v0.18.39 combined population success and Notes guidance — 2026-10-10

- **PASS in provided AI Dungeon logs:** Inner Self + bundled Auto-Cards combined run: ten failed eligible population attempts followed by **attempt 11** returning RAND_01 `Found Cache`, RAND_02 `Tide Surge`, RAND_03 `Marsh Movement`, RAND_04 `Puncture Point` (four single-sentence scenarios).
- **PASS in logs:** generation completed with `requested=4 | populated=4 | toggle reset to false | RE turn remained suspended`. The next Context reported `populatePlaceholders=false` and normal RE `Turn 4 | Next encounter in 16 future turn(s)`.
- **PASS in logs:** Auto-Cards briefly owned two model passes to generate the Kyle card. RE deferred and preserved its pending population job, then resumed.
- This supersedes earlier *incomplete excerpts* of a different combined test with RAND_04 pending. It establishes that the generation feature **can complete with Inner Self enabled**, sometimes after many eligible actions; it is not a guaranteed attempt count or maximum.
- v0.18.39 changes only Config Notes and documentation to warn users about longer generation times with Inner Self enabled; test in a **fresh adventure** that the updated Config Notes warning appears under SYSTEM without changing settings.
- **Still separate:** exact player-facing double-newline rendering, numbered popup display, and third-party ordering variants should only be marked live passed if directly observed, not inferred from console logs.


### Continuing combined Inner Self + Auto-Cards population — RAND_04 pending (2026-10-10 08:05)

- Three additional dedicated RE attempts targeted **only RAND_04**. Each output continued the family-dinner scene and contained no valid RAND block; each logged `requested=1 | populated=0 | remaining=04 | retry queued | RE turn remained suspended`.
- Earlier partial population of RAND_01–03 remains the most recent observed success. **All four cards have not been confirmed populated.**
- These logs use the prior `Placeholder population generation started | cards=04` format rather than v0.18.38's `... started | attempt=N | cards=04`; this suggests the adventure still runs an older Library. The precise version cannot be established from these lines alone.
- This continuation does **not** validate the numbered attempt popup or double-newline hijack formatting, because none of these attempts produced encounter data.
- Compatibility gate remains open; do not count further retries as new successful functionality.

### v0.18.38 numbered population progress — fresh-game validation

1. Enable `Populate Placeholder Cards` in a new AI Dungeon adventure, then check the initial `RE - Encounter population in progress.` receipt popup.
2. On each eligible RE-owned generation confirm `RE - Encounter population in progress - Attempt 1.`, then `Attempt 2.`, and so forth.
3. Confirm the attempt count increases even when the model generates story prose instead of RAND blocks; normal prose is still visible on these failed attempts.
4. Confirm Context stop, Auto-Cards-owned model turns, and Retry/regeneration do **not** increase the counter or consume RE pacing.
5. For partial generation, verify completed RAND cards stay intact; the next Attempt N requests only untouched targets.
6. On full completion, confirm the usual `RE - New encounters generated.` popup replaces the in-progress status, and the toggle returns to false.
7. Confirm generated-output hijack has exactly two newline characters before/after `[RE] Updating Encounter Cards - Hit Continue` and that normal storytelling resumes next Continue.
8. Verify old runtime requests missing an `attempts` field upgrade safely.

### Continued v0.18.37 combined compatibility test — partial generation observed (2026-10-10)

- The earlier excerpt with nine failed RE-owned generations was a **snapshot**, not the final outcome. Further eligible attempts eventually produced three valid encounter records: RAND_01 `Lingering Lead`, RAND_02 `Family Portraits`, and RAND_03 `Kitchen Confession`; RE logged `requested=4 | populated=3 | remaining=04`.
- The next RE-owned request correctly targeted only `RAND_04`, but its output was ordinary scene prose and RE logged `populated=0 | remaining=04`. The pasted logs end there; **there is no observed 4/4 completion**.
- Combined-environment population is therefore **partially demonstrated, not fully passed**. Persistent retries, partial-write protection, and Auto-Cards ownership were demonstrated, but total request completion and UI feedback still require validation.
- The v0.18.37 spacing and v0.18.38 numbered popup have not yet been visually confirmed in this combined setup.

### v0.18.37 combined Inner Self + bundled Auto-Cards live test — FAILED (2026-10-10)

- A new AI Dungeon compatibility run queued RAND_01–RAND_04 for dedicated population.
- **9 RE-owned generation attempts** were logged; each returned ordinary family-dinner scene prose with **0 valid RAND blocks**, logged `populated=0`, and kept all four targets queued. No generation-completion event appears in the submitted logs.
- **Auto-Cards ownership worked:** the model generated the `Clara` Story Card; RE recorded two compatibility-paused Context passes and two Output pass-throughs without attempting to consume Auto-Cards-owned output. Population resumed afterward.
- **RE lifecycle suspension worked:** each failed population attempt logged RE turn suspension and retained pending targets.
- Some raw prose contained zero-width characters consistent with Inner Self's control/output encoding. The logs contain no final model Context snapshot, so an Inner Self prompt conflict is a plausible cause, not proven.
- **Gate result at this earlier checkpoint:** population-generation compliance with Inner Self + Auto-Cards was **NOT PASSED**; later logs document 3/4 partial success, but full completion is still unconfirmed. The previous v0.18.28 baseline compatibility results and v0.18.36 standalone population pass remain historical positives but cannot clear this new gate.
- **Next diagnostic:** inspect the full final Context delivered to the model on an RE-owned attempt and compare it against the standalone pass, especially competing Inner Self story/brain instructions. Do not change the parser or claim a fix without evidence.
- No script change was made based on these logs. The v0.18.37 double-line-break display was not exercised successfully and remains unconfirmed.

### v0.18.37 status formatting and compatibility regression

- **v0.18.36 live confirmed (user report):** one-time request-received popup, narrative prose shown during an ignored generation without a repeat popup, successful RAND generation shown as `[RE] Updating Encounter Cards - Hit Continue` with the completion popup, and ordinary story resumption on Continue. Debug logs separately confirmed failed 0/4 attempt and successful 4/4 retry, no toggle reactivation, and RE turn suspension.
- **v0.18.37 fresh adventure:** verify the hijack message now has **two** newline characters before and **two** after, and is removed cleanly from next Context. Verify no narrative/popup regression.
- **Fresh Inner Self + bundled Auto-Cards compatibility gate:** request receipt is not lost/duplicated; RE respects private output-control prefixes; a failed attempt preserves narrative with appropriate third-party processing; successful RAND output does not corrupt Inner Self thought handling; pending Auto-Cards generation remains deferred rather than competing; no phantom RE pacing/Duration changes; and a subsequent Continue resumes normal story.
- **Standalone Auto-Cards where practical:** verify a generation/compression task owns its own turn while the RE request waits, then populates and returns control without consuming Auto-Cards output.
- **Optional:** external pause/stop variants and Story Arc Engine; do not label these live passed until tested.


### v0.18.36 live retry checkpoint — 2026-10-10

**Confirmed from AI Dungeon debug logs:** request queued for RAND_01–RAND_04; first attempt returned normal story prose with `populated=0`, preserved all four targets, and suspended the RE turn; next eligible Context pass retried automatically; second attempt returned four parseable one-sentence RAND records; Output reported `requested=4 | populated=4 | toggle reset to false | RE turn remained suspended`.

**Later user confirmation:** all four requested player-facing checks passed in v0.18.36 (the request receipt, normal prose on failure, updated hijack/success popup, and Continue story resumption). Direct Story Card entry/title inspection was not independently reported. Partial-result/malformed-result and external-task deferral checks remain open.

### v0.18.37 population regression checklist (new adventure required)

1. Turn `Populate Placeholder Cards` on and trigger an eligible Context pass; confirm a one-time `RE - Encounter population in progress.` popup appears when the request is queued.
2. If a model response ignores the RAND request and continues the story, confirm normal narrative prose is visible with no generation status line or repeated popup.
3. Verify the toggle remains `true` and a subsequent eligible action/Continue automatically reissues the request without further Story Card editing.
4. When valid RAND blocks are returned, confirm the generation result is hidden behind `[RE] Updating Encounter Cards - Hit Continue` with two newline characters before and two afterward.
5. For partial or malformed RAND output, confirm internal RAND data never leaks to the player, populated cards persist, and only missing cards remain queued.
6. On complete population, confirm `RE - New encounters generated.` appears, the toggle resets to `false`, and the next Continue resumes normal story prose.
7. Verify external-task Context stops defer retry attempts, custom encounter data is never overwritten, and RE pacing/Duration remain suspended on dedicated attempts.
8. No AI Dungeon model generations run asynchronously: each retry requires a later eligible action/turn. Retry/regeneration of an existing action is not a new story turn.

### Dedicated generation live-test checkpoint

- **v0.18.32 observed:** RAND_01, RAND_02, and RAND_04 queued and populated successfully in a live AI Dungeon test; all three generated encounters contained one sentence. The user confirmed the intended `[RE] Generating New Encounters - Hit Continue` visible text and `RE - New encounters generated.` popup.
- **v0.18.34 to test in a new adventure:** the status line starts on a new line, the populated Story Cards contain expected titles/entries, and pressing Continue resumes normal narrative without replaying the generation status. Do not mark these checks passed until observed.


## Current v0.18.40 validation targets

### Acts and eligibility

1. Fresh Config contains `Current Act: 1`.
2. Encounter cards contain PROGRESSION with `Act` and `Importance`, plus BEHAVIOR with `Rarity` and `Duration`; Minimum Turn is absent; default Importance is Required.
3. With Current Act 1, Act 2+ encounters are ineligible.
4. Earlier Optional encounters remain eligible after Current Act advances.
5. A successful Required encounter counts toward Act completion.
6. Current Act advances only when all Required encounters in that Act have completed successfully.
7. Optional encounters do not block advancement.
8. A Returned-to-Available Required encounter continues blocking advancement.

### Awaiting Completion

1. Natural resolution can classify `The encounter is in progress: ...`.
2. The temporary 🗃️ marker is replaced by 🔄.
3. The same encounter becomes Awaiting Completion and stays out of the general selection pool.
4. Requeue Duration is 50% of the normal configured runtime Duration.
5. Repeated requeues use the same 50% duration rather than compounding.
6. Checks 1–4 requeue; check 5 returns the encounter to Available with 💾.
7. Success or failure clears the consecutive in-progress lifecycle.

### Command handoff

1. `/RE start` while Active ends the current attempt and queues a weighted eligible replacement.
2. `/RE start #` while Active ends the current attempt and queues the targeted eligible replacement.
3. The displaced encounter receives normal resolution handling.
4. A displaced/manual-ended encounter cannot use Awaiting Completion to replace the newly queued encounter.
5. Commands still do not consume a story turn.

### Global Defaults

1. Config exposes `Act`, `Importance`, `Rarity`, and `Duration` under GLOBAL DEFAULTS.
2. Editing any Global Default does not change existing encounter-card settings.
3. Newly generated cards use the current values of all four Global Defaults.
4. Reset commands restore all four encounter settings from current Global Defaults.
5. `Restore Encounter Cards to Defaults: true` applies all four current defaults to every discovered encounter card.
6. The Restore toggle automatically resets itself to `false` after firing.
7. Restore preserves lifecycle Status, prompt/Outcome content, and custom titles.
8. An active encounter's current runtime Duration remains locked when Restore fires.
9. Status and Encounter Number are not treated as Global Defaults.

### Encounter title conventions

1. New generated cards use number-first default titles such as `01 - Encounter Card`.
2. Exact legacy defaults such as `Random Encounter 01` migrate to the number-first format.
3. Custom titles remain unchanged.

### Generation toggle

1. Fresh Config defaults to `Maximum Encounter Cards: 4` and `Create Max Encounter Cards: true`.
2. First maintenance ensures/generates RAND_01 through RAND_04 and then automatically resets `Create Max Encounter Cards` to `false`.
3. Newly generated cards default to `Importance: Required`.
4. Existing explicit Optional cards remain Optional.

### Populate Placeholder Cards

1. Fresh Config contains `Populate Placeholder Cards: false` immediately after `Create Max Encounter Cards`.
2. Existing Config cards gain/retain the setting without losing edited values and normalize to Maximum -> Create Max -> Populate -> Display Map order.
3. Setting it to `true` targets only exact canonical Entries matching `[Define random encounter ## here.]`.
4. Custom Entries, cards with Outcomes, and already-populated cards are not requested or overwritten.
5. The next eligible real input starts a dedicated generation Context containing the exact approved low-stakes/world-relevance instruction.
6. The dedicated Context explicitly forbids story continuation and requires one Title plus one exactly-one-sentence Scenario for every requested RAND card.
7. The dedicated generation does not increment the RE turn, decrement pacing, decrement Active Duration, select/inject an encounter, or process a pending resolution.
8. Valid or malformed RAND control output is hidden and replaced with `[RE] Updating Encounter Cards - Hit Continue`.
9. An initial request posts the one-time in-progress receipt; full success posts `RE - New encounters generated.` as a normal popup on the same completed generation.
10. Following successful generation, the next Continue resumes ordinary story processing and advances RE normally exactly once.
11. The generation-status line is removed from later Context and is not shown to the story model.
12. Generated scenarios are exactly one sentence even if the model returns multiple sentences.
13. Generated titles replace only untouched default `## - Encounter Card` titles; custom titles remain unchanged.
14. Act, Importance, Rarity, Duration, Status, keys, and encounter metadata remain unchanged.
15. Partial success populates valid returned cards, leaves missing/invalid cards queued, and hides RAND control output behind the usual generation line.
16. A response containing normal story prose but no RAND cards is passed through unchanged, retains the queued request, and causes no additional popup; the next eligible action retries.
17. The toggle resets only after all targeted cards have been populated, or immediately when no untouched placeholders exist.
18. Context `stop = true` and recognized external model-task ownership defer the dedicated generation to a later eligible input.
19. Untouched placeholders are protected from random selection and targeted `/RE start #` while population is queued/generating.
20. Debug Logging records a capped copy of the hidden generation output for diagnosis.

### Set All Cards to Available

1. Fresh Config contains `Set All Cards to Available: false`.
2. Setting it to `true` makes every discovered encounter card Available.
3. Act, Importance, Rarity, Duration, prompt/Outcome content, and custom titles are preserved.
4. Active, queued, pending-resolution, marker, and pacing-countdown runtime state are cleared.
5. History and Current Act are preserved.
6. The toggle automatically resets to `false`.
7. Existing Config cards gain the toggle without losing existing values.
8. The player-facing confirmation uses the standard `RE - ` prefix.

### Player-facing message formatting

1. Player-facing system messages begin with `RE - `.
2. Command confirmations, errors, validation warnings, reset notices, and Act progression notices use sentence case.
3. Internal console logs retain the `[Random Encounters]` diagnostic prefix and are not converted into player popups.

### Config card formatting

1. Regular Config uses compact spacing with one blank line only between SYSTEM, ENCOUNTERS, and GLOBAL DEFAULTS.
2. Advanced RE Settings uses compact spacing with one blank line only between PACING, RARITY, and DURATION.
3. Existing edited values survive automatic formatting normalization.

### Notes formatting

1. Encounter Notes use compact spacing with no blank line between headers/subheaders and their fields.
2. Exactly one blank line separates Encounter State from Encounter Settings.
3. Maintenance rewrites older encounter-card Notes into the compact layout without losing field values.

### Reset-all Outcome cleanup

1. Add `Outcome:` sections to multiple encounter Entries.
2. Run `/RE reset all`.
3. Every encounter returns to Available and restores current Global Default settings.
4. Each `Outcome:` section is removed while the original encounter prompt remains intact.
5. `/RE reset #` also removes the selected card's Outcome while preserving its prompt.

### Review regression coverage

The v0.18.17 internal review was exercised with harness tests rather than treated as a separate live AI Dungeon test round. Coverage included:

- fresh installation and one-shot card generation
- non-destructive Global Default changes and explicit Restore-to-Defaults propagation
- Advanced Settings parsing
- Retry-safe turn handling
- natural Awaiting Completion and its 50% continuation duration
- five consecutive Awaiting Completion checks
- manual active-event handoff
- automatic Act progression and popup formatting
- single-card and reset-all Outcome cleanup
- invalid classifier retry behavior
- legacy encounter-card migration
- legacy in-progress runtime-state migration
- suppression of unnecessary pacing rolls while a resolution is pending

These harness checks supplement rather than replace live AI Dungeon validation.

### Shared-toast regression

**v0.18.28 shared-toast result: PASS (fresh-game live test with Inner Self + Auto-Cards).**

Use a fresh game with Inner Self + Auto-Cards + RE.

1. Allow Auto-Cards to post its initial enabled/configuration toast.
2. On a later action, use `/RE start`.
3. Confirm the popup contains the RE command response without the stale Auto-Cards startup message being merged into it.
4. Confirm a genuinely same-turn Auto-Cards + RE toast pair is still preserved together.
5. Confirm later RE-only messages replace RE's previous completed contribution rather than accumulating old lines.

### Static classifier-key regression

For any pending resolution, all three static keys must resolve even when the summary is not in the old canonical sentence shape:

- `The encounter occurred:`
- `The encounter is in progress:`
- `The encounter did not occur:`

Required regression cases:

1. Canonical classifier sentence.
2. Classifier preceded by an Inner Self/private control prefix.
3. Classifier preceded by zero-width formatting.
4. Lower/upper-case variation of the static key.
5. Summary without terminal punctuation.
6. Empty summary followed by normal story prose.
7. Preceding unrelated visible prose is preserved while the classifier line is removed.
8. Accepted classification writes a canonical Outcome and removes the pending resolution so the classifier is not requested again.

### Inner Self live compatibility

**v0.18.28 Inner Self live result: PASS.**

Fresh-game combined testing confirmed:

- normal Inner Self thought-bearing story turns advance an Active RE encounter exactly once per story turn
- Active Duration is neither skipped nor double-counted while Inner Self contributes thoughts
- RE resolution requests still execute under the combined Inner Self environment
- static classifier recognition succeeds and the classifier is removed from visible output
- an in-progress result correctly enters Awaiting Completion and requeues at 50% Duration

### Auto-Cards live compatibility

**v0.18.28 Auto-Cards live result: PASS.**

Fresh-game testing with Inner Self + bundled Auto-Cards confirmed:

- queued RE encounters survive an Auto-Cards-owned generation turn without injecting early
- Active encounter Duration does not decrement during an Auto-Cards-owned generation turn
- pending RE resolutions survive an Auto-Cards-owned generation turn untouched
- Auto-Cards output is passed through and is not captured as an RE classifier
- the following normal story action resumes RE exactly once with no phantom turn
- a manually ended encounter classified as in progress is returned to Available rather than reclaiming the active slot

### Cross-script compatibility

Source/harness coverage completed in v0.18.21-v0.18.24:

1. Context wrapper preserves `stop` and skips RE when `stop = true`.
2. Inner Self-style leading parenthetical output prefixes remain at character zero; RE classifiers behind them are captured and removed correctly.
3. RE status markers are inserted after a private parenthetical prefix.
4. Existing third-party `state.message` content is preserved when RE posts on the same turn.
5. Standalone Auto-Cards generation and compression freeze RE pacing, Duration, injection, and resolution.
6. Inner Self-bundled Auto-Cards task events trigger the same pause.
7. Suspended task actions synchronize high-water state and do not become delayed phantom RE turns.
8. Pending RE resolution survives an Auto-Cards-owned model turn untouched.
9. Generic `RandomEncounters("pause", "Script Name")` task ownership freezes one model turn and passes Output through.
10. Recognizable SAE generation state triggers the same suspension without false-positive matching of unrelated `saveOutput` fields.

Focused harness results:
- Inner Self/prefix + shared-message pass: 15 behavioral assertions passed; one original byte-for-byte assertion was corrected because the expected RE lifecycle marker was intentionally added after the prefix.
- Auto-Cards pass: 13/13.
- General compatibility pass: 12/12.
- SAE pass: 8/8.

Live AI Dungeon release-candidate validation completed:
- Inner Self combination: PASS
- Auto-Cards combination: PASS
- low-conflict/general composition control with Living Meters: PASS
- shared-toast behavior in live compatibility testing: PASS

The v0.18.28 RC compatibility gate is cleared. Live SAE validation remains nice to have rather than RC-blocking.

### Documentation and Story Card Notes

1. Config Notes explain every SYSTEM, ENCOUNTERS, and GLOBAL DEFAULT setting.
2. Config Notes explain one-shot Create Max, Restore Defaults, and Set All Available behavior.
3. Config Notes explain eligibility, weighted Rarity, Duration, Acts, resolution classifications, Awaiting Completion, five-check failure, Outcomes, History, Retry safety, markers, removed Cooldown/Minimum Turn, commands, and message prefixes.
4. Advanced Notes explain custom Pacing intervals, Rarity weights, Duration baselines/scaling, invalid-value fallback, and hidden Debug presets.
5. History Notes explain success-only storage, 12-entry cap, 3000-character cap, automatic trimming, and Context injection.
6. README provides a complete current-feature index and points to detailed docs.
7. ROADMAP contains unreleased work only and does not restate superseded shipped behavior.
8. Historical Changelog entries are explicitly identified as version-specific and potentially superseded.

### Regression

- Non-destructive Global Defaults, explicit Restore-to-Defaults, and Advanced Settings still work.
- Maximum Encounter Cards remains generation-only.
- Retry does not increment the RE turn.
- Successful occurrences enter History.
- Non-occurrences return to Available.
- `/RE end`, `/RE stop`, `/RE reset #`, and `/RE reset all` remain functional.

## Test hygiene

Use a fresh adventure for Acts tests unless intentionally testing migration.


## General compatibility control

**v0.18.28 general coexistence control: PASS.**

Fresh-game Living Meters control testing confirmed the RE side of ordinary multi-script coexistence:

- initial RE pacing advanced exactly once per normal story turn
- `/RE start` queued an encounter without consuming a story turn
- the queued encounter injected on the following normal story action
- Active Duration decremented exactly once per subsequent story turn
- `/RE end` queued resolution without consuming a story turn
- the next normal story turn performed exactly one resolution attempt
- the classifier was captured and stripped
- Outcome was appended
- the following story turn resumed pacing with a fresh interval and no delayed or double turn

Living Meters used no RE-specific compatibility code in the canonical RE library. That harness was retired before final v0.18.29 testing; its v0.18.28 result remains historical evidence only. The known broad slash-command parser ordering hazard remains documented separately and is not treated as a blocker for RE's general compatibility gate.


### Act & Encounter Map and History presentation

**Full v0.18.29 standalone live conditions: PASS before final presentation cleanup.**

The final cleanup changes only Story Card titles/order/spacing and map/history display text. A short fresh-adventure visual smoke is required because canonical source changed after the full pass.

Final pre-release validation for v0.18.29 must use a completely fresh AI Dungeon adventure because canonical source changed after the v0.18.28 compatibility gate.

Required checks:

1. Clean install places `Debug Logging: false` and `Display Act & Encounter Map: false` under SYSTEM and does not create the map.
2. Changing the toggle to true creates exactly one `Act & Encounter Map` card whose Entry begins with `READ ONLY` immediately followed by the first Act section, with no separate `CURRENT ACT: #` line.
3. The map groups encounters by Act, marks the current/future Act relationship correctly, and shows encounter title/number, Importance, and lifecycle state.
4. Queueing/activating, retiring/resolving, Awaiting Completion, returning to Available, reset operations, card generation, and Act advancement update the map without requiring a special command.
5. Manual edits to encounter title/Act/Importance are reflected after normal RE maintenance.
6. Changing the toggle to false removes all canonical map cards; turning it back on recreates one current map.
7. History recent-section header includes `READ ONLY` and uses the new block layout with no `Outcome:` labels.
8. Existing legacy one-line History content migrates without losing successes.
9. The 13th recent successful History item moves the oldest item into `ARCHIVED HISTORY` in Notes; the recent Entry remains capped at 12.
10. The 3000-character Entry cap also archives oldest items rather than deleting them.
11. Archived History remains in Notes across later History documentation refreshes and is not injected into Context.
12. A normal encounter cycle after all display/history operations still preserves pacing, Duration, resolution, History injection, and Act progression behavior.


### v0.18.29 focused harness status

**Source-level focused checks: PASS. Live AI Dungeon validation still required.**

Covered in the focused harness:
- clean-install defaults: Debug Logging false, Act Map false, four generated encounter cards, History read-only layout
- Act Map create/remove/recreate behavior
- duplicate canonical Act Map cleanup when disabled
- map lifecycle rendering for Queued, Active, Resolution Pending, Completed Successfully, and Awaiting Completion
- map refresh after manual encounter title, Act, and Importance edits
- legacy Config migration adds the new map toggle while preserving an existing Debug Logging value
- legacy one-line History migration preserves successful records, including titles containing colons
- 13th-history rollover moves the oldest success into Notes
- 3000-character recent-entry cap archives oldest records rather than deleting them
- archived History is excluded from Context injection while recent History remains injected
- History display contains no `Outcome:` label
- canonical source and the maintained Inner Self harness RE block are byte-for-byte identical
- standalone and Inner Self Input/Context/Output combinations pass syntax checks

These checks do not replace the required fresh-adventure v0.18.29 live round.


### Library-level Context adapter regression

**Library-level Context adapter focused harness: PASS. Live fresh-adventure validation still required.**

The canonical Context wrapper delegates all stop handling to `RandomEncountersContext(text)` in the library.

Required checks:
1. The same `Context.js` is used for standalone RE and compatibility testing.
2. A fresh standalone adventure starts successfully when no global `stop` binding exists.
3. An absent stop is treated as false and RE Context processing runs normally.
4. A defined `stop = false` is preserved and RE Context processing runs normally.
5. A defined `stop = true` is preserved, consumes no RE story turn, and suppresses RE pacing, Duration, injection, History, and resolution processing for that Context pass.
6. A stopped pass does not become a delayed phantom RE turn later.
7. No compatibility claim depends on distributing a special RE Context file.
8. Final live validation must use a new fresh adventure after this library change.


### v0.18.30 placeholder population focused harness status

**Source-level focused checks: PASS. Fresh AI Dungeon live validation still required.**

Covered:
- canonical source syntax
- clean Config placement and v0.18.29 Config migration
- exact approved generation instruction
- current-context piggyback generation
- custom Entry/title preservation
- encounter metadata preservation
- full and partial population
- missing payload and malformed/missing outer wrapper handling
- no-eligible-card behavior
- Retry, Context-stop, and external-task deferral
- targeted-start protection and placeholder selection gating
- hidden payload cleanup
- combined encounter resolution + placeholder population in one Output pass
- maintained Inner Self library parity


### Final v0.18.30 repository consistency pass

**PASS.**

Confirmed:
- standalone Library/Input/Context/Output syntax
- Config SYSTEM order: Maximum -> Create Max -> Populate -> Display Map
- exact approved low-stakes/world-relevance instruction in Context
- missing outer population wrapper fallback strips machine data and still applies valid requested cards
- weighted `/RE start` cannot select untouched placeholders while population is pending
- maintained Inner Self RE block is byte-for-byte identical to canonical `Library.js`
- Populate Placeholder Cards has been removed from ROADMAP because it is now implemented in v0.18.30


### v0.18.31 live population retry

The first v0.18.30 live population attempt reached the handled failure path. Logs confirmed that the population request was queued and injected for RAND_01, RAND_03, and RAND_04, but Output contained no population payload: `payloadFound=false`, `payloadComplete=false`, `populated=0`. The cards remained unchanged and the one-shot toggle reset safely.

This isolates the live failure to model instruction compliance rather than Config detection, placeholder targeting, or Output parsing.

v0.18.31 changes the generation contract so the machine-readable population block is emitted before story prose, after any required private control prefix. This avoids relying on the model to remember or retain a structured appendix after its narrative continuation.

The Output parser is also hardened so valid RE_CARD blocks remain recoverable and removable when the outer RE_POPULATE wrapper is missing or incomplete.

Focused regression status: PASS for:
- canonical syntax and all standalone hook combinations
- prefix-first complete wrapper
- private control prefix followed by population block
- missing outer wrapper
- missing closing wrapper
- generated title sanitization
- visible story preservation after machine-data removal

Fresh AI Dungeon validation is required.


### v0.18.32 dedicated population focused harness status

**Source-level focused checks: PASS. Fresh AI Dungeon live validation still required.**

Covered:
- canonical Library/Input/Context/Output syntax
- clean Config placement
- dedicated non-story generation Context
- exact approved world-relevance instruction
- one-sentence prompt requirement and parser enforcement
- custom Entry, Outcome boundary, custom-title, and metadata preservation
- full, partial, failure, and no-placeholder paths
- visible generation replacement and completion popup
- generation-status removal from resumed Context
- RE turn/pacing suspension during population and normal advancement on the next Continue
- Active encounter Duration suspension
- external model-task deferral
- markdown-tolerant RAND parsing
- capped debug logging of hidden model output


### Final v0.18.32 repository consistency pass

**PASS.**

Confirmed:
- canonical Library/Input/Context/Output syntax
- Config SYSTEM order: Maximum -> Create Max -> Populate -> Display Map
- dedicated non-story population Context with the exact approved world-relevance instruction
- exactly-one-sentence requirement in both prompt and parser enforcement
- full population with markdown-tolerant RAND parsing
- custom Entry and custom-title preservation
- hidden generation replacement with `[RE] Updating Encounter Cards - Hit Continue`
- completion popup `RE - New encounters generated.`
- generation-status removal from resumed Context
- dedicated generation does not advance the RE turn
- Active encounter resolve-after turn remains unchanged during population
- recognized external model-task ownership defers RE population
- maintained Inner Self RE block is byte-for-byte identical to canonical `Library.js`

Older v0.18.30-v0.18.31 sections below are retained as historical evidence of the abandoned piggyback design and are not current implementation guidance.
