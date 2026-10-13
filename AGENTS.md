# Codex Test Instructions — Random Encounters v1.1

This file is the test-runner entry point for Codex on the **consolidated `develop/v1.1` branch** of `circadiansummer/AID-RandomEncounters`. It lives at the repository root so Codex encounters it automatically. **Start testing without asking for another test plan.** Approved development work may be implemented, tested, committed and pushed within the explicitly approved development branch. PR #3 has merged into `develop/v1.1`; production PR #4 targets `main` and remains a draft pending the documented release gates. This does not authorize a public release.

Read `docs/test-reports/2026-10-12-final-native-signoff.md`, `docs/test-reports/2026-10-12-integration-review-handoff.md`, and `docs/test-reports/2026-10-12-v11-promotion-handoff.md` before further testing. This branch reconstructs changes from an uncommitted local candidate; compare it to the original local patches first. Confirm the live history-window and combined generation Retry gates before giving release-readiness advice. Do not silently publish.

## Scope and safeguards

- **Test the checked-out `develop/v1.1` code, not `main` or a release tag.** Before testing, report the branch name, HEAD SHA, and working-tree status. If on a different branch, switch to `develop/v1.1` if safe; otherwise report the blocker rather than changing unrelated files.
- **Read these sources before evaluating behavior:** `docs/testing.md` (including its v1.1 section), `docs/ROADMAP.md`, `guides/configuration.md`, `guides/encounter-cards.md`, `docs/CHANGELOG.md`, and `docs/tests/smoke.cjs`. The current source and tests take precedence if a historical changelog entry describes older behavior.
- The `main` branch and public v1.0 release are **frozen**. Never merge, tag, create a release, force-push, edit either root README (`README.md` or `RE-InnerSelf-Merge/README.md`), or change GitHub release metadata. Do not perform migrations for old AI Dungeon adventures; v1.1 targets fresh/current-schema adventures.
- **Limited development writes are authorized.** For the current v1.1 assignment, reconcile verified fixes and regressions on `develop/v1.1` and update draft production PR #4. Confirmed bug fixes, regression tests, development documentation and changelog updates may be committed and pushed. Preserve original files/evidence, run automated regressions and canonical/combined parity before committing, and use fresh private adventures for changed live behavior. Never discard uncommitted work, overwrite another branch, force-push, merge, or add unrelated features/major redesigns without explicit owner approval. Public releases, tags, release-only READMEs and release metadata require separate owner approval. No subscription modification, scenario/adventure deletion or scenario/adventure/script publication is authorized. Development commits to this approved draft PR are explicitly authorized and are distinct from public script release.
- Do not require or expose credentials. If AI Dungeon access, authenticated browser automation, or permission is missing, mark **LIVE TEST BLOCKED/NOT RUN** and state what is needed. Never claim a mocked test proves a live AI Dungeon UI or model behavior.
- Preserve genre neutrality: tests must not assume encounters require danger, combat, conflict, bleak consequences, or a specific narrative structure.

## 1. Run the built-in tests first

The project has a **dependency-free Node.js regression harness**. There is no required `npm install`, package build, or external test framework for this suite.

From the repository root:

```sh
git branch --show-current
git rev-parse HEAD
git status --short
node --version
node docs/tests/smoke.cjs
```

The current integrated v1.1 source snapshot at `63e51803a88d755a1dfe1c17572cf4bb6f84280d` passed **389/389 deterministic checks** when the checked-in smoke harness was executed in the ChatGPT JavaScript environment. Earlier Codex native signoff used a previous **355/355 Node** candidate, and the preserved local candidate reported **328/328**. These represent distinct builds; do not conflate offline and native evidence, or use any count as a hard-coded expectation. Read `docs/test-reports/2026-10-12-human-test-source-manifest.md` for exact source file links before a new human test. Report the test count actually printed by the currently checked-out code. If the harness exits nonzero or fails a check, preserve the **first failing test name and stack trace**. Do not change expected assertions just to restore a green result.

The harness uses mocked AI Dungeon APIs to exercise `Library.js` and checks the bundled RE code inside `RE-InnerSelf-Merge/Library.js`. The production wrappers are `Input.js`, `Context.js`, `Output.js`, and the corresponding three files under `RE-InnerSelf-Merge/`. Check these wrappers are present and syntactically valid, and that the combined Library embeds the current standalone RE implementation. Source parity is an explicit regression gate.

## 2. Deterministic feature audit

Confirm the relevant cases exist in the automated test suite and examine source behavior. If any coverage is missing, record the gap and a proposed reproducible test; do not claim an untested behavior is verified.

| Area | Required deterministic behavior |
| --- | --- |
| Config initialization | Default four `RAND_01`–`RAND_04` cards; new v1.1 fields; creator edits preserved; global defaults affect new/reset cards as documented. |
| Manual RAND Notes | Recognize creator-added `RAND_##` cards, including numbers above the creation maximum; fill missing Notes using defaults; do not destroy custom title, Entry, Keys, or valid existing Notes. |
| Duplicate RAND keys | Keep first occurrence; give later duplicates the **next unused greater** `RAND_##`; synchronize numeric Notes, matching untouched default title/Entry, and show a player message; preserve custom content and secondary keys. |
| Act categories | `#RE - Act X Encounters  📜` for unlocked Acts, `#RE - Act X Encounters  🔒` for future Acts; category updates with creator edits, resets and Current Act progression (including during Output). Notes and Config are authoritative. |
| First Encounter Turn | `0` normal pacing, fixed positive turn, or inclusive `N-M` first-turn range; invalid values fall back; manual starts, unavailable cards, external-owned turns, and placeholder population do not improperly consume the first automatic opportunity. |
| Invalid encounter cards | Empty, whitespace-only, and untouched placeholder Entries cannot be selected or injected by RE. Invalid manual `/RE start #` gives a warning; queued/Active/resolution invalidation cancels cleanly without fabricating outcomes. |
| No Matter What Mode | **Only two effective values: true or false, default false, in both Config and RAND Notes.** `Default` is **invalid**, not an inheritance option; invalid values normalize to false. Readable aliases such as `On/Off` or `Enabled/Disabled` may be accepted, but written Notes are canonical `true/false` with **exactly one** field. The force-in-current-response instruction is enabled by **global true OR card true**. Card false does not veto global true. Enabled mode explicitly demands the core event **begin immediately**, even if it causes an absurd genre/tone/setting mismatch or interrupts the ongoing scene; it must not be merely foreshadowed, softened, or justified. Characters react naturally and the resolution remains open. Normal mode retains scene-sensitive introduction and setting adaptation. Both modes preserve private control syntax and hide internal script mechanics. All four boolean combinations, both prompt branches, Notes preservation, and Retry are regression requirements. |
| Generated encounters | `Encounter Difficulty`: Very Easy, Easy (default), Normal, Hard, Very Hard. `Encounter Theme`: None (default), or a single-line creator cue up to **5 words/60 characters**. The AI-facing difficulty is framed as `for a game set to 'hard' difficulty` (substitute selection); instructions reference **current and known locations** and avoid imposing genre, conflict, mood, narrative outcome, or story structure. Difficulty/theme are frozen per requested batch across retries. |
| Generation protocol | Requested `RAND_##` blocks contain short titles and **exactly one complete sentence** for each Scenario; parsing never overwrites authored entries. Partial/malformed responses retry without counting incomplete cards. |
| Generation progress | Hijacked result: `[RE] Updating Encounter Cards (X of Y) - Hit Continue`. **X = cumulatively populated cards; Y = original requested batch total**; neither number is hard-coded to four. On partial completion, e.g. `1 of 4`; final completion, `4 of 4`. The status string now includes one newline before and one afterward to avoid stacked receipt spacing; confirm the final display in AI Dungeon. The prior two-newline format belongs to earlier builds. Remove both current and historical status text from later model Context. Attempt/completion popups are separate from the hijacked output. |
| Lifecycle & compatibility | Selection, rarity, duration, outcome/retirement, /RE commands, Retry turn accounting, Inner Self / Auto-Cards ownership pauses, and canonical/combined source parity do not regress. |

**Critical distinction:** Script Context can **instruct** an AI to introduce an encounter immediately; the script cannot **guarantee** that model-produced fiction obeys it. Check prompt injection separately from model compliance.

## 3. Targeted live AI Dungeon acceptance, only if access is available

These are **not** satisfied by the offline Node harness. Use a **new adventure for each major test group and after every production code change**. Install all four v1.1 `Library/Input/Context/Output` scripts in their corresponding AI Dungeon sections. Turn on `Debug Logging: true`; where possible, capture the actual **Input Modifier, Context Modifier, and Output Modifier** logs, plus Config/Story Card Notes and visible popups. Avoid unnecessary replays of already-verified deterministic checks.

Do not use a real user adventure or alter someone else's Story Cards. Use test scenarios and disposable test data, with user-authorized access only.

### A — Story Card registration and organization

1. Initialize a new adventure; use `First Encounter Turn: 30` to prevent ordinary rolls while checking maintenance.
2. Manually add a card: title `The Second Courier`, key `RAND_02`, Entry `A nervous courier arrives carrying a sealed letter for you.`, empty Notes.
3. Perform an ordinary action. The existing `RAND_02` should retain its key; the new card should become `RAND_05`, preserving its authored title/Entry.
4. Verify its missing Notes are initialized, including **`No Matter What Mode: false`**, and its category is `#RE - Act 1 Encounters  📜`.
5. Change Notes `Act: 2`, act again, and verify `#RE - Act 2 Encounters  🔒`. Record whether the actual AI Dungeon editor and the player popup reflect the update.

### B — Placeholder and first automatic encounter

1. In a fresh adventure, leave `RAND_01` as its generated placeholder and issue `/RE start 1`. Expect a player-visible invalid-card warning, not a prompt injecting the placeholder.
2. Give `RAND_01` a real one-sentence Entry. Set `First Encounter Turn: 3`. Keep other cards untouched placeholders.
3. Act until the scheduled first opportunity. Confirm no earlier automatic encounter and correct behavior at RE turn 3. Count **RE story turns**, not Retry or command turns.
4. If feasible, invalidate a queued/Active Entry and confirm cancellation without invented completion.

### C — AI-generated encounter cards and progress

1. In a fresh adventure, use the default untouched placeholders. Set:
   ```text
   - Encounter Difficulty: Hard
   - Encounter Theme: night at the movies
   - Populate Placeholder Cards: true
   - Debug Logging: true
   ```
2. Trigger generation through an ordinary action. Examine the **actual Context Modifier text** for the chosen **game difficulty**, the theme, **current and known locations**, requested RAND block format, and exactly-one-sentence rule. These settings should guide content without forcing action, conflict, or any genre.
3. Check updated Story Cards: titles and one-sentence Entries, preservation of authored cards, accurate success/partial-generation counts. Partial results, if seen, use `[RE] Updating Encounter Cards (X of Y) - Hit Continue`; the final result also uses this exact pattern.
4. Press Continue after a hijacked result. Verify normal story resumption without the status contaminating later model Context. Distinguish a model failing to produce valid RAND blocks from a parser/script defect. Do not fabricate a partial response to claim live partial-generation coverage.
5. Confirm `Populate Placeholder Cards` resets to false after successful completion. Do not interpret the progress numerator as only the **current-turn** updates: it is cumulative for the batch.

### D — No Matter What Mode

Use a valid authored encounter and `/RE start 1` (followed by a normal action when required). Compare all combinations:

| Global `No Matter What Mode` | Card `No Matter What Mode` | Expected injected prompt |
| --- | --- | --- |
| false | false | Normal, context-sensitive introduction |
| false | true | Strong current-response introduction |
| true | false | Strong current-response introduction |
| true | true | Strong current-response introduction |

Verify the **Context Modifier prompt** first. In a calm scene, try a benign, deliberately mismatched event and check whether the AI starts it now instead of foreshadowing, softening, or delaying it. Then separately assess actual AI model compliance and character reactions. Confirm the card field remains a single `true` or `false` line through activation/resolution, and Retry uses the originally injected prompt strength. `Default` is **not** a valid option.

### E — Combined scripts, if testable

Use the maintained `RE-InnerSelf-Merge/` scripts in another fresh adventure with Inner Self and Auto-Cards available. Verify that other scripts' active generation tasks suspend RE ownership as designed, that status lines and player messages are not garbled, and that normal storytelling resumes. Inner Self has highest compatibility priority; Auto-Cards second. If an external dependency is unavailable, report it as blocked rather than claiming failure.

## 4. Reporting requirements

Produce a concise **Codex v1.1 Test Report** as your response (upload the handoff to GitHub at the end of each test round, as instructed by the owner). Include:

1. **Environment:** exact branch/SHA, clean/dirty checkout, Node version, commands executed.
2. **Automated results:** actual pass count, first failing assertion and stack trace if any; syntax/source-parity assessment.
3. **Coverage matrix:** the deterministic areas above, each labeled `PASS`, `FAIL`, `NOT RUN`, or `BLOCKED`. Do not label a behavior PASS merely because the test exists: confirm execution or source evidence.
4. **Live matrix:** A–E each labeled `PASS`, `FAIL`, `NOT RUN`, or `BLOCKED`; name the AI model and adventure/test configuration when relevant, and distinguish real AI-generated output from simulated/mock output.
5. **Defects:** severity, exact reproduction, expected versus actual, relevant file/function, and minimum necessary fix suggestion. Preserve sanitized Input/Context/Output logs where useful.
6. **Release readiness:** state explicitly whether automated regressions passed and whether **live acceptance is still pending**. A green Node harness alone **does not approve** v1.1 for public release.

If the environment cannot access AI Dungeon, **run all offline checks anyway** and return useful findings instead of waiting for credentials or asking the user to repeat this plan. Do not schedule background work. Commit verified approved development work and the test handoff to the review branch; keep public releases and protected READMEs unchanged.

## Reference materials

- `docs/tests/smoke.cjs` — runnable, mocked deterministic tests.
- `docs/testing.md` — detailed test history and current live-acceptance requirements.
- `docs/ROADMAP.md` — v1.1 agreed scope and release safeguards.
- `guides/configuration.md` — canonical Config labels, defaults, and generation workflow.
- `guides/encounter-cards.md` — canonical RAND Notes, categories, and lifecycle.
- `docs/CHANGELOG.md` — chronological development history (older entries are historical, not current requirements).
