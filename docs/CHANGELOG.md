# Changelog

## [1.13] — Main-branch source promotion (October 21, 2026)

- Fresh adventures now create the **Config** Story Card without automatically adding four `RAND_##` encounter placeholders. `Create Placeholder Cards` defaults to `false`; `Placeholder Cards to Create` retains its default **4**.
- Explicitly setting `Create Placeholder Cards: true` still adds the selected number of cards after the highest existing RAND number, preserves creator-authored cards, and resets the one-shot setting.
- The standalone and Inner Self/Auto-Cards combined Libraries remain byte-equivalent for the embedded RE core. Existing v1.12 regression scenarios now use explicit four-card fixtures; new tests cover fresh startup for both Library variants.
- Development verification: **418/418 deterministic mocked checks passed** against v1.13, including Library parsing and combined/standalone parity. The owner expressly accepted the change and authorized `main` promotion on October 21, 2026. New live AI Dungeon logs were **not** supplied; no separate GitHub tag/Release or AI Dungeon Library publication occurred. See the [original development test report](test-reports/2026-10-21-no-auto-startup-cards.md) and [owner signoff](test-reports/2026-10-21-v113-owner-signoff.md).

## [1.12] — Release source (October 14, 2026)

- **Renamed creator-facing setting:** `Kool-Aid Man Mode` is now **`Bypass Situational Awareness`** in Config, RAND card Notes, instructions and current documentation. The global/card OR semantics and stronger immediate encounter prompt are unchanged. Existing settings with the earlier `Kool-Aid Man Mode` or `No Matter What Mode` labels are recognized and upgraded, preserving true/false values.
- **Redesigned Config → GENERATION:** `Placeholder Cards to Create`, `Create Placeholder Cards`, separator, `Encounter Difficulty`, `Encounter Theme`, `Run Encounter Generation`. Creation now adds exactly the requested number of **new** blank cards after the highest existing RAND number, rather than filling through a target total. Existing authored cards remain untouched.
- **Regression evidence:** 406/406 deterministic assertions PASS against the release candidate, including canonical/combined Library parity and wrapper syntax. Owner reports previously tested features confirmed. No new independent live AI Dungeon test logs for the renamed field were supplied.
- **Known limits:** Continue accounting on a genuinely capped/sliding history window remains unverified; plain Retry after partial AI placeholder generation is inconsistent. AI model compliance with immediate-introduction instructions cannot be guaranteed.
- This entry documents v1.12 source promotion, not automatically the creation of a GitHub Release/tag or publication to AI Dungeon. Historical v1.1 and v1.0 releases must remain intact.

## October 14, 2026 — v1.1 generation controls (development branch; NOT RELEASED)

- Creator-requested Config GENERATION layout: `Placeholder Cards to Create`, `Create Placeholder Cards`, a 35-hyphen separator, `Encounter Difficulty`, `Encounter Theme`, and `Run Encounter Generation`. Original control labels are renamed only in the generation section when present; the conventional older v1.1 block is reordered while preserving its numeric and boolean values.
- `Placeholder Cards to Create: N` now means **append N new placeholder cards**, numbered consecutively after the highest existing RAND number. It no longer means create missing card numbers up to N or target an overall total. Existing authored cards remain untouched.
- Creating placeholders does not request AI-written text; `Run Encounter Generation` retains the separate one-shot operation that populates untouched placeholders.
- **Offline:** 402/402 deterministic regression assertions PASS against the feature branch (including standalone/combined RE Library parity and wrapper syntax). **Native AI Dungeon acceptance: NOT RUN** for this change. No merge to `main`, tag, GitHub Release, or AI Dungeon publication is implied.

## October 13, 2026 — v1.1 ASAP live confirmation (documentation only)

- Owner confirmed native AI Dungeon `Importance: ASAP` first-eligible encounter scheduling works despite Slow pacing. Record **PASS (user-reported live)** for this focused check; configuration/log details and separate edge-case results were not provided. See [ASAP acceptance record](test-reports/2026-10-13-v11-asap-scheduling-acceptance.md).
- Together with the previously owner-confirmed 📜/🔒 Act-category UI, both targeted final-feature acceptance checks have user-reported native passes. Capped/sliding history and inconsistent partial-generation Retry remain separate limitations. **No executable code changed**, no new regression suite execution is claimed, and no formal `v1.1` tag/Release was published by this documentation commit.

## October 12, 2026 — v1.1 Act category UI native confirmation (documentation only)

- Owner reported that the updated UI worked in AI Dungeon after the v1.1 source promotion to `main`. Mark the changed Act-category 📜/🔒 presentation **PASS (user-reported live)**, with no per-step logs provided. See the [native acceptance record](test-reports/2026-10-12-v11-act-category-ui-acceptance.md).
- `Importance: ASAP` earliest-eligible scheduling remains **NOT REPORTED** for native acceptance; capped/sliding history and partial generation Retry limitations remain unresolved. No executable code changed and no new test harness execution is claimed.

## [1.1] — Production source promotion (October 12, 2026)

- Owner-authorized promotion of the consolidated v1.1 source to `main`; prior `v1.0` tag/GitHub Release preserved and `archive/v1.0` points at its original commit.
- Features: Act categories with 📜/🔒 status, `Importance: ASAP`, First Encounter Turn, Kool-Aid Man Mode, creator-friendly RAND cards, and improved one-sentence AI-assisted placeholder population.
- Verification disclosure: previously reported **389/389 offline assertions PASS** (not rerun on this promotion); new ASAP/category UI native checks **NOT RUN**. Capped/sliding history **UNVERIFIED** and plain Retry after partial population **INCONSISTENT**. This entry reports the `main` source promotion, **not** the creation of a GitHub v1.1 tag/release or publication in AI Dungeon.
- [v1.1 source notes](RELEASE_NOTES_v1.1.md) provide the complete feature summary, installation caveats and historical v1.0 archive links.

## October 12, 2026 — Available Act category icon (unreleased v1.1)

Replaced the available/unlocked Act category suffix `🔓` with `📜`, retaining `🔒` for locked Acts and the established two-space separator. Eligibility and encounter behavior are unchanged. Updated standalone/combined Library code, regression expectations, guides, human-test source manifest, and draft-PR notes. **389/389 offline regression assertions pass**; native AI Dungeon category rendering remains to be tested.


## October 12, 2026 — ASAP under Importance and Act lock icons (v1.1 review)

- Moved the ASAP scheduling choice to `Importance: ASAP`, meaning Required for Act progression plus trigger at the first eligible story opportunity without waiting for ordinary pacing. Rarity returns to four standard weighted values and remains independent.
- Migrates the earlier pre-release `Rarity: ASAP` into `Importance: ASAP` with Rarity reset to Global Default; older `Force ASAP: true` also promotes Importance to ASAP while preserving valid ordinary Rarity. `false` is removed.
- Act-specific Story Card categories now end in two spaces plus 📜 (Act ≤ Current Act) or 🔒 (future locked Act), and refresh after creator edits and automatic Act advancement during Output.
- **389/389 offline checks pass**, including ASAP Required progression, migration, category lock/unlock/relock, Output-time advancement, standalone/Inner Self source parity, and wrapper syntax. Native AI Dungeon editor and ASAP timing must still be verified. No public release.


## October 12, 2026 — Rarity ASAP replaces Force ASAP (v1.1 development)

- Consolidated the per-card priority toggle into the new `Rarity: ASAP` setting. Ordinary Rarity presets still use their previous weighted rolls; ASAP schedules an encounter on the earliest eligible story action, skipping the usual pacing countdown.
- Respects Act eligibility, empty/placeholder protection, Active/queued/resolving work, external generation ownership, and explicit First Encounter Turn scheduling. Multiple eligible ASAP cards use lowest Act then RAND number; an unsuccessful card returned to Available remains ASAP.
- Migrates pre-release `Force ASAP: true` to `Rarity: ASAP` and removes the old switch (false removes without changing Rarity). ASAP Rarity is preserved across encounter lifecycle writes and not given an Advanced Settings weight.
- Automated regression coverage includes ASAP first-eligible timing, pacing bypass, Act and First Encounter Turn gates, lifecycle and migration, plus standalone/merged Library parity. **376/376 checks passing**. Targeted live AI Dungeon behavior for this changed scheduler still requires verification; no public release.


## October 12, 2026 — Retired optional Act & Encounter Map (unreleased v1.1)

- Removed the obsolete `Display Act & Encounter Map` setting from new Config Entries and Notes, retiring the derived map in favor of Act-specific Story Card categories.
- Existing legacy toggle lines are narrowly removed during Config maintenance; only cards using the reserved script Map key are deleted. Other creator edits and unrelated Story Cards remain intact.
- This intentionally drops the single-card locked/current Act and lifecycle overview. Actual eligibility, progression, encounter selection and resolution are unchanged.
- Automated integration suite: **364/364** checks passed, including canonical/merged Library parity and wrappers. No public release.


## October 12, 2026 — Encounter Notes presentation (v1.1 review)

Moved `Force ASAP` before `Kool-Aid Man Mode` in newly created encounter Notes, manual Notes initialization and lifecycle-generated Notes. This reorders the display only; values, priority rules and creator content are unchanged. No setting rename or release is included.


## October 12, 2026 — native acceptance and signoff review

Fixed confirmed history-anchor failure after Erase plus typed Input, and Inner Self invisible-prefix rejection at generated RAND headers. Added eight regressions; 355/355 Node checks, syntax and canonical/combined parity pass. Native successes and remaining capped-history/plain-Retry limits are recorded in the [owner signoff package](test-reports/2026-10-12-final-native-signoff.md). Beta review candidate only; stable acceptance and public release are not approved.


## October 12, 2026 — approved integration reconciliation

Restored original candidate coverage and proven combined Input adapter; corrected quoted-parser trailing-text index mismatch. Node regression: 347/347 PASS, syntax and source parity PASS. Exact integrated live gates remain pending. See [reconciliation handoff](test-reports/2026-10-12-reconciliation-write-permissions.md). No public release or version change.


## [1.1] - Pre-release testing (not yet published)

### Integrated review candidate (October 12, unpublished)

- Built a new review branch combining the finalized Config layout with source-reconstructed versions of the reported Retry duration, rejected Auto-Cards command, and partial-generation Retry fixes. The original 328-check local candidate was **not** directly imported and must be compared before acceptance.
- Added a narrow parser improvement allowing terminal punctuation inside a quoted question followed by lowercase narration; grammatical/semantic completeness remains heuristic.
- The integration suite passes **318/318 automated assertions**, including Library parity, wrapper syntax, and new focused cases; prior local 328/328 and live results remain separate evidence. Capped/sliding history, Erase/backtracking and final combined live generation Retry remain open; issue #1 stays open.


### Config Story Card layout (development; pending fresh-adventure visual check)

- Moved the editable Config controls under SYSTEM, ENCOUNTERS → SETTINGS / GENERATION, and GLOBAL DEFAULTS. Both subheadings follow established dashed formatting.
- Displayed default Encounter Theme as blank (still None internally), and narrowed the one-shot Create Max reset match to avoid consuming adjacent formatting. The final approved layout places Kool-Aid Man Mode immediately after Set All Cards to Available, and Create Max Encounter Cards immediately after Encounter Theme. Did not alter any actual field defaults, parsing semantics, or existing edited Config Entries.
- Updated Config Notes, creator guide and exact-layout tests while maintaining standalone/merged Library parity. This isolated branch intentionally does not include the uncommitted October 12 local 328-check candidate.


### Force ASAP and Kool-Aid Man Mode (development; requires live validation)

- Prioritized eligible per-card Force ASAP on next random roll without bypassing pacing or Act gates; flag remains true through Active and clears on occurred/in_progress resolution, not did_not_occur.
- Renamed creator-facing No Matter What Mode to Kool-Aid Man Mode; preserved old pre-release labels through migration.
- Updated standalone/merged source, documentation, and regression tests.

### October 11 corrective development patch (not yet live validated)

- Passed the batch settings snapshot back into dedicated generation Context on same-action Retry, retaining the selected difficulty and theme.
- Rejected generated records without a Title, complete single-sentence Scenario or terminal punctuation, including lowercase second sentences, overly long output, and recognizable cut-off fragments. Rejected records stay queued; accepted scenarios are not truncated or artificially punctuated.
- Reduced each generation progress receipt's newline padding from two on each side to one on each side; in-game group spacing still needs visual confirmation.
- Added debug-only turn detector counters/history-type logs for the confirmed live Retry timer regression. **The Retry turn-count defect is not fixed or verified.**
- Kept the standalone/Inner Self merged Libraries synchronized and expanded the smoke suite to **294/294 passing assertions**. The original Codex report is historical evidence from tested commit `e74b3f0`.



### Chaotic No Matter What Mode introduction (implemented; awaiting live acceptance)

- Replaced the enabled-mode prompt with a demand to **begin the encounter now, in the current response**, interrupting the current situation without waiting or foreshadowing.
- Enabled-mode encounters may be absurd or narratively mismatched to the current setting, genre, tone, or circumstances, without needing to explain the mismatch. Character reactions should be natural, prior story facts preserved, and outcome open-ended.
- The instruction to adapt minor details to the established setting now applies **only to normal mode**. Both modes continue respecting external scripts' private control prefixes and avoiding disclosure of internal mechanics.
- Preserved global/card boolean OR activation and Retry behavior; synchronized standalone and combined Libraries. **287/287** deterministic regression checks pass (14 additional prompt tests). Live AI Dungeon compliance has not yet been verified.


### Strict No Matter What Mode values and Notes consistency (implemented; awaiting live acceptance)

- Confirmed `Default` is **not a valid value** for No Matter What Mode in either Config or RAND Story Card Notes. Manually entered `Default` and other unrecognized values normalize to `false`; valid boolean synonyms (including On/Off and Enabled/Disabled) remain supported.
- Notes maintenance now writes exactly one `No Matter What Mode: true | false` line and removes duplicates during discovery or lifecycle updates, including on creator-authored freeform Notes; unrelated author Notes are retained.
- Maintained independent global/card OR behavior and the immutable immediate-introduction instruction on Retry. Standalone and Inner Self/Auto-Cards Library parity verified, with **273/273 deterministic regression tests passing** (9 new strict-value checks). Live AI Dungeon validation remains pending.


### Independent boolean No Matter What Mode (implemented; awaiting live acceptance)

- Standardized the global Config and each RAND card's Notes field as `No Matter What Mode: true | false`, with `false` as the initial value for both. Removed the per-card `Default` third state. Author-supplied `On`/`Off` and `Enabled`/`Disabled` still parse as booleans; lifecycle Notes rewrites normalize the field to `true` or `false`.
- Effective immediate-introduction mode is **global true OR card true**. A card's false value no longer overrides global true. If both are false, the normal, scene-sensitive prompt applies.
- Manual RAND card Notes initialization now includes the disabled No Matter What Mode field when missing, while preserving an author-enabled setting. Activation/resolution Notes writes and Retry preserve independent settings and prompt intensity.
- Standalone and Inner Self/Auto-Cards Libraries remain in sync; **264/264** deterministic smoke checks pass. Targeted live AI Dungeon acceptance remains pending.


### Hijacked generation progress formatting (implemented; awaiting live acceptance)

- Changed the player-visible generated-output replacement to `[RE] Updating Encounter Cards (X of Y) - Hit Continue`, with X the number of completed cards and Y the original request total. Both partial and completed generation turns use the format, including `1 of 4` and `4 of 4`.
- Preserved the two leading and trailing newlines, cleanup of the new message before the next model Context, and cleanup of earlier unnumbered and trailing-count messages. Attempt and completion popups are unchanged.
- The standalone and Inner Self merged Library remain synchronized; **256/256** automated smoke checks pass, including two additional legacy-status cleanup tests. Live AI Dungeon acceptance remains pending.


### Generation difficulty, theme, and completed-card progress (implemented; awaiting live acceptance)

- Added Config `Encounter Difficulty: Easy` with five case-insensitive presets: Very Easy, Easy, Normal, Hard, Very Hard. Generation context now says `Generate random encounters for a game set to 'hard' difficulty` (using the selected level), and scales complexity/demands in relation to the established story without imposing stakes, genre, tone, conflict, structure, or an outcome.
- Added optional Config `Encounter Theme: None`. Creators can supply up to **five words and 60 characters** of open-ended creative guidance. Themes are quoted as data and do not override established setting logic or the one-sentence RAND formatting requirement. Invalid difficulty/theme values fall back independently to Easy/None.
- Changed the setting/location wording to **current and known locations**. Difficulty and theme are fixed for each queued population batch, including all retries, even if Config is later edited.
- Replaced static generation progress with **completed of originally requested** card counts. Initial and Attempt popups include `0 of 4`; partial hijacked turns can show `1 of 4`; completed hijacked turns show `4 of 4`. The status text remains removed from subsequent model context, and ordinary non-RAND story prose still passes through on failed attempts.
- Maintained standalone/Inner Self Library parity; **254/254 automated checks passed** (244 previous + 10 new). No targeted AI Dungeon live acceptance yet; public v1.0 remains unchanged.


### v1.1 safeguards, organization, and narration controls (implemented; awaiting live acceptance)

- **Invalid/placeholder protection:** Excluded blank, whitespace-only, and untouched RE placeholder encounter Entries from automatic weighted selection. Manual `/RE start #` reports an invalid card with editing/Config generation guidance. Pending injection, Active reminders, Retry, retirement, resolution injection and output checks cancel invalid events without passing placeholder encounter instructions to the model, fabricating outcomes, or prematurely consuming First Encounter Turn.
- **Duplicate RAND renumbering:** Preserved the first card for each `RAND_##` number, automatically reassigned later duplicates to the next unused larger key number, updated matching Notes encounter numbers, untouched default titles, and RE default placeholder Entries; retained custom Entries/titles and other keys, and displayed a player-facing notice.
- **Act categories:** Dynamically categorized RAND Story Cards as `#RE - Act X Encounters` from their existing Notes Act, on creation, manual edits/maintenance, reset, and defaults restoration. No gameplay eligibility change.
- **No Matter What Mode:** Added global Config and per-card Notes `No Matter What Mode: true | false`, both defaulting to `false`. Either global or per-card `true` requests immediate integration in the current response; a card `false` cannot disable global `true`. The boolean is retained during lifecycle writes, and Retry preserves prompt intensity. This is an AI instruction, not a guarantee of model compliance.
- **Development regression:** Canonical standalone and bundled Inner Self/Auto-Cards Libraries are synchronized; the automated suite now passes **244/244 checks** (208 previous + 36 additional checks), including corrected fully written encounter fixtures. **Live AI Dungeon testing is pending.**

### Manual RAND Card Notes Initialization (v1.1 pre-release)

- Manually created Story Cards with valid RAND_## keys now receive missing encounter Notes metadata on normal Context maintenance or /RE commands, including cards above Maximum Encounter Cards. Blank Notes inherit Global Defaults; partial Notes retain valid supplied values and author text during initialization.
- Complete Notes are not rewritten by metadata initialization. Titles, Entries, and Keys remain intact; card categories are synchronized separately from the authoritative Act field. The standalone and combined Inner Self Libraries remain synchronized.
- This addition extended earlier automated smoke checks from 197 to **208 checks**. The later v1.1 development pass expanded them to 244 (see above); live AI Dungeon acceptance remains pending.

### Bundled third-party notices

- Added the original MIT copyright and permission notices for LewdLeah's Inner Self (2026) and Auto-Cards (2025) to `RE-InnerSelf-Merge/` and to the combined Library's leading comments. Updated the merge README attribution; no executable behavior or version change.

### First Encounter Turn

- Added an editable `First Encounter Turn` to the Config Story Card's ENCOUNTERS section. `0` retains v1.0 behavior; `#` schedules an absolute first automatic encounter turn; `#-#` randomly selects one inclusive target exactly once.
- The target uses counted RE story turns beginning at turn 1. Pending manual encounters, unresolved results, placeholder generation, and external model-task ownership defer the first automatic roll when necessary; ineligible encounter pools wait rather than consuming that first opportunity.
- Manual `/RE start` remains independent. Once the first automatic encounter is successfully selected, all later encounters return to existing pacing, Duration, Act eligibility, and resolution logic.
- Valid setting edits before the first encounter reschedule the target; edits after the first successful automatic roll do not restart it. Invalid ranges and values produce an `RE -` warning and revert to the normal `0` behavior.
- Synchronized the canonical and RE-InnerSelf-Merge Libraries. Expanded deterministic tests from **156 to 197 passing checks** covering default, fixed and ranged turns, schedule edits, pacing changes, manual commands, unavailable cards, disabled turns, third-party task pauses, and invalid inputs.
- **Status: v1.1 pre-release; live AI Dungeon testing not yet reported.** The published v1.0 release and its separate release notes remain historical and unchanged.


## [1.0] - 2026-10-10

### Repository layout polish (post-release)

- Flattened the combined Inner Self/Random Encounters harness into `RE-InnerSelf-Merge/` (four script files and its README; no `RE/` subfolder).
- Moved the smoke test to `docs/tests/smoke.cjs` and preserved its ability to load scripts from the repository root.
- Relocated artwork to `docs/assets/`, updated user-facing links and guide navigation, and retained all existing example cardsets.
- No script behavior or v1.0 version change; regression tests remain the release check.

### First stable release

#### Post-release repository documentation organization

- Created `guides/` for the current user-facing configuration and encounter-card instructions, including a compact guide index.
- Kept development and release material—Changelog, Roadmap, Release Notes, architecture, compatibility audit, and test history—inside `docs/`, with a separate development-document index.
- Updated links in the README, release notes, and roadmap. No scripting behavior, runtime state, version, or test requirements changed.

- Finalized Random Encounters v1.0 with pacing, rarity, duration, Act-based gating, per-card Outcomes, one-sentence placeholder generation, and the read-only `/RE status` command.
- **Live acceptance:** the user confirmed satisfactory player-facing encounter narration/resolution and previously confirmed `/RE status` in AI Dungeon. Earlier standalone and Inner Self + bundled Auto-Cards compatibility evidence remains applicable.
- Reorganized the repository root into exactly `README.md`, `Input.js`, `Context.js`, `Library.js`, and `Output.js`. Moved documentation to `docs/`, artwork to `assets/`, and the combined integration files to `RE-InnerSelf-Merge/`; deleted obsolete parent folders.
- Promoted the unchanged v0.18.44 gameplay implementation to version 1.0 in both Libraries and updated the regression suite to the new locations. **156/156 automated checks passed.**
- Older Story Card formats are not migrated. Story Arc Engine and new encounter gating/chaining features remain outside the initial release.


## [0.18.44] - Pre-release testing

### Read-only /RE status

- Added `/RE status` as a player-facing popup, available without Debug Logging. It reports the next encounter countdown; queued/active/Awaiting Completion RAND number with remaining turns and check count; resolution pending; pending placeholder generation and numbered attempts; disabled state; or countdown not yet initialized. No "no eligible encounters" message or encounter title.
- Uses the existing `RE - ` popup and command-suppression path but **bypasses `maintenance()`** to avoid advancing turns, consuming one-shot toggles, changing cards, or rerolling pacing.
- Updated `/RE help`, Config Notes, README and command documentation. Synchronized the canonical Library with the embedded RE code in the Inner Self harness.
- Expanded `docs/tests/smoke.cjs` from **95 to 148 passing mocked/source checks**, including exact status text/priority, no progression or Story Card changes, and script-command output suppression.
- **Live validation confirmed 2026-10-10:** the user tested `/RE status` in AI Dungeon and reported that it works. The popup is now accepted as live-tested; no repeat status-command test is required. This does not independently validate unrelated model or population UI behavior. All deterministic status states remain covered by the mocked suite.


## [0.18.43] - Pre-release testing

### AutoGenderedWords-inspired README redesign

- Reorganized the end-user README around the instructional layout of `AID-AutoGenderedWords`: overview and short version, illustrative example, clearly stated setup expectations, numbered four-tab installation, creator instructions, feature explanations, commands, compatibility, troubleshooting, and quick reference.
- Preserved Random Encounters' introductory voice and fantasy RPG/slice-of-life examples. Added concrete Entry/Encounter Settings examples and clarified AI narration vs. scripted guarantees.
- Kept current v0.18.43 behavior and limitations accurate, including per-card Outcomes (no new History card), current-schema-only support, one-sentence placeholder population with retries, and qualified Inner Self/Auto-Cards compatibility.
- **README/documentation-only change:** source code, script version, maintained compatibility harness, and the 95 previously passing deterministic regression checks remain unchanged; no additional live AI Dungeon test is required for Markdown-only edits.

### Streamlined final validation

- Extended the dependency-free mocked-runtime suite from 76 to **95 passing checks**, covering Create Max, the optional Act Map's on/off lifecycle, explicit Global Defaults restoration, bulk availability reset, and manual help/start/end commands.
- Classified these and previously covered deterministic behaviors as **code-validated**, without requiring separate AI Dungeon reenactments.
- Reduced `docs/testing.md` to **one short fresh-adventure live smoke** for actual AI Dungeon wiring/rendering, model-driven encounter narration/resolution, and an optional one-card population UI spot-check. Earlier standalone and Inner Self + Auto-Cards live evidence is reused; the full combined 4-card population run and obsolete migration tests are not repeated.
- No runtime script changes, no version bump, and no v1.0 release claim. Live platform/model behavior remains distinct from mocked-runtime validation.

### Remove obsolete legacy migrations

- Removed automatic upgrades for older Config labels and layout, old encounter titles and Notes schemas, old runtime-state field names, and retired History Story Card cleanup. Old layouts are no longer detected or rewritten, and existing old History cards are not deleted.
- Removed per-turn Config/Advanced Entry spacing normalization and legacy aliases such as `Max Encounter Cards`, `Create Missing Encounter Cards`, `Retirement Length`, `Encounter Weight`, and `Minimum Turn`.
- Kept current-schema Config values, custom card content/settings, runtime-state validation, Retry safety, active encounter resolution, Act progression, generated-card retries, and cross-script ownership handling.
- Removed approximately 12.5 KB of obsolete source and synchronized the canonical Library with the Inner Self compatibility fixture. No change to the intended current-feature rules.
- Replaced legacy migration smoke tests with checks that current Config/Advanced layouts and unrelated Story Cards remain untouched. **76/76 mocked regression checks passed**; fresh AI Dungeon live validation remains pending.
- Updated documentation and the final test plan for a fresh-adventure/current-schema-only support policy. Earlier release notes remain historical records, not support promises for old versions.


## [0.18.42] - Pre-release testing

### Final candidate: end-user README and consolidated verification

- Rewrote README for players/creators following the intended user-facing description, with fantasy and slice-of-life examples, an approachable encounter-flow explanation, Act progression, rarity/pacing/Duration, placeholder generation setup, installation and available commands, and the existing Inner Self/Auto-Cards compatibility caveat.
- Removed developer audit notes, version-by-version troubleshooting, duplicated feature inventories, and other end-user-irrelevant detail from README. Preserved the v0.18.42 legacy History deletion warning and kept technical guides in `docs/`.
- Consolidated all outstanding live validation into one **v0.18.42 final release-candidate checklist** in `docs/testing.md`, covering fresh installs, population UI/retry, resolution and Act transitions, legacy History migration, and Inner Self + bundled Auto-Cards integration. Historical testing checkpoints remain archived below it rather than acting as separate current test gates.
- Expanded the zero-dependency mocked regression suite from 64 to **75 passing checks**, adding unsuccessful encounter resolution, five-check Awaiting Completion, and externally stopped Context passes.
- No runtime algorithm or user-facing Config change in this final documentation/testing preparation; **v0.18.42 remains the current pre-release testing candidate**. Fresh AI Dungeon verification is still pending; do not claim final live sign-off or publish v1.0 solely on simulated checks.


### History Story Card retirement and Config category rename
- Retired the centralized `History` Story Card, including its creation, maintenance, archive rendering/parsing, History-only writes on successful resolutions, and automatic recent-History injection into model Context. Encounter Outcomes remain stored directly on their respective RAND card Entries.
- On the first maintenance pass in an upgraded adventure, remove only old script-owned cards with the exact key `random encounter history` and then mark that migration complete. Other cards titled History are left intact. **Back up legacy History before upgrading if its recent/archive content matters; automatic retirement deletes that centralized data.**
- Renamed the shared Config category from `#RE - Config & History` to `#RE - Config` for Config, Advanced RE Settings, and Act & Encounter Map. Existing user-edited Config Entries and other card content are preserved through key-based migration.
- Removed retired History references from current Config Notes and current documentation. Action-history length tracking for turn detection is unrelated and remains in place.
- No intentional change to encounter choice, pacing, Active Duration, resolution classification, Act advancement, Outcome saving, Auto-Cards/Inner Self pause handling, or optional map behavior.
- Expanded `docs/tests/smoke.cjs` with v0.18.42 migration, category, Outcome, Act, and map assertions. 64/64 mocked/source checks passed prior to documentation finalization; fresh AI Dungeon verification remains required.


## [0.18.41] - Pre-release testing

### Compact, formatted Config Story Card Notes
- Restored the established `====` major-section dividers and `----` subsection dividers in the Config Story Card **Notes**, matching the visual formatting used in editable Config/encounter cards.
- Reduced the Notes from approximately 4,356 to 2,385 characters, focusing on brief descriptions of each Config setting and a compact lifecycle/commands reference.
- Preserved specifically requested guidance: one-shot actions, setting-appropriate single-sentence population without overwriting edited encounters, Inner Self slower-population notice and numbered Attempt popups (without the removed explanation), non-destructive Global Defaults and restoration, progression with Required/Optional encounters, History/status markers, and `/RE` commands.
- The editable **Config Entry**, script runtime, generation/retry handling, and Advanced Settings have not been changed.
- Updated the canonical Library and byte-identical RE block in the Inner Self harness. Expanded `docs/tests/smoke.cjs` to check formatting, concision, and required details; 43 mocked/source checks passed.
- Fresh AI Dungeon adventure required before marking this pre-release update live-validated.


## [0.18.40] - Pre-release testing

### Maintenance cleanup and regression tooling
- Removed the clause about why the model might continue storytelling from the Inner Self warning in the **Config Story Card Notes**, retaining the concise notice that card population may take longer and automatically retries without another Config edit.
- Skip redundant Config and Advanced Settings Notes assignments when their script-managed descriptions have not changed. Config normalization and Story Card settings remain in place.
- Removed an unnecessary duplicate Act Map synchronization when entering dedicated placeholder population; maintenance already synchronized it, and that branch makes no intervening lifecycle change.
- Added `docs/tests/smoke.cjs`: a dependency-free Node regression suite runnable with `node docs/tests/smoke.cjs`. It uses mocked AI Dungeon hooks to test source/fixture parity, Notes idempotence, map synchronization, automatic population retry and partial/full completion, Auto-Cards ownership, and status cleanup.
- No changes to generator instructions, population pacing, encounters, card metadata, user-facing popups, or compatibility task detection. Previous live v0.18.39 outcomes are retained; new code requires a fresh-adventure check.


## [0.18.39] - Pre-release testing

### Inner Self generation-delay guidance
- Added a plain-language explanation to the **Config** Story Card's **Notes** (SYSTEM section): encounter-card population may take longer with Inner Self enabled because the model can continue normal narration instead of producing RAND data; RE automatically retries on later eligible actions, shows numbered Attempt progress, and does not require the player to re-enable the toggle.
- Updated README, configuration guidance, compatibility/testing records, and the embedded Inner Self test harness. The population algorithm, status text, and popup semantics did not change.
- **New combined-script live result (2026-10-10):** a fresh Inner Self + bundled Auto-Cards test produced four valid encounter cards (RAND_01–04) on **generation attempt 11**, after ten unsuccessful attempts. Auto-Cards owned two intermediary model passes for Kyle and RE deferred correctly. Output recorded `requested=4 | populated=4 | toggle reset to false`; the next Context logged `populatePlaceholders=false` and RE Turn 4's countdown. This establishes end-to-end combined population success for the observed case, superseding earlier incomplete run excerpts.
- Remaining unobserved UI details must not be silently classified as passed; the new Notes wording still requires fresh-adventure live verification.
- JavaScript syntax and canonical/harness source parity checks required for this documentation-only behavior update.


## [0.18.38] - Pre-release testing

### Visible population attempt counter
- A new population request still receives the initial `RE - Encounter population in progress.` receipt popup.
- Each eligible RE-owned placeholder generation increments a persistent per-request `attempts` counter and updates the popup to `RE - Encounter population in progress - Attempt N.`; numbering starts at 1.
- Retries continue to target only unfinished canonical placeholders. External model-task deferrals, Context stop, and re-requested Context passes within one generating attempt do not increment the counter.
- Existing successful RAND data, one-sentence enforcement, story-prose pass-through, double-newline hijack status, success popup, and end-of-request toggle reset remain unchanged.
- Legacy in-flight population state without an attempts field starts from zero when migrated.
- Focused source test covered initial receipt, three sequential attempt labels, unchanged count on failed Output and externally deferred work, partial-success preservation, and success cleanup; standalone source syntax and Inner Self harness parity checked.
- Further combined Inner Self + bundled Auto-Cards live logs showed three successful RAND cards (01–03) in one partial attempt after earlier repeated no-RAND generations. RAND_04 remained pending and its next attempt again returned story prose; **full completion remains unverified**. This supersedes the earlier observation of zero successful RAND output in that particular ongoing test, not the unresolved compatibility gate.
- Live AI Dungeon verification is required for the new attempt-counter popup; the v0.18.37 double-newline display remains unconfirmed.


### Additional combined-environment retry observation — 2026-10-10 08:05

- Three further requests for only RAND_04 returned normal narrative prose; each preserved RAND_04 as pending and suspended RE progression. Total demonstrated population remains 3/4 in this compatibility run.
- The log's generation-start format lacked v0.18.38's `attempt=N` field, so this is not evidence that the new numbered popup has been live-tested; it likely comes from the existing older-code adventure.
- No source changes were made on the basis of this observation. The combined population compatibility gate remains open.

## [0.18.37] - Pre-release testing

### Double-line-break status formatting and compatibility review
- Changed the dedicated encounter-population hijack text to contain exactly two newline characters before and after `[RE] Updating Encounter Cards - Hit Continue` (the message text itself is unchanged).
- Retained cleanup compatibility for both the historical `Generating New Encounters` and current `Updating Encounter Cards` wording, with surrounding whitespace removed from subsequent model Context.
- No changes to request receipt, quiet automatic retry, population parsing, success popup, or encounter lifecycle.
- User confirmed all four player-facing v0.18.36 behaviors occurred: one-time receipt popup, ordinary narrative pass-through on the failed attempt, successful generation hijack plus completion popup, and normal story resumption on Continue.
- v0.18.36 core standalone population/retry behavior is live validated; v0.18.37's doubled spacing has not yet been live validated.
- Compatibility follow-up: run targeted fresh-game population smoke tests with Inner Self and bundled/standalone Auto-Cards before release, especially retry, output ownership, pending tasks, and subsequent story resumption. Previous v0.18.28 compatibility validation remains historical regression evidence; Story Arc Engine remains optional.
- Canonical source and Inner Self harness synchronized; standalone syntax and status cleanup checked.


### Combined compatibility live checkpoint — 2026-10-10

- Fresh Inner Self + bundled Auto-Cards test **did not pass** the new placeholder-population gate: nine successive RE-owned generations returned normal story prose, with `populated=0` and RAND_01–RAND_04 still queued throughout the provided logs.
- The RE retry/pending-state and turn-suspension paths behaved as designed. Two Auto-Cards-owned passes were correctly deferred, allowing the `Clara` Story Card to be generated.
- The repeated non-RAND output suggests an instruction-ownership/priority issue in the combined model Context, but the exact source is not confirmed without a final-Context snapshot.
- Preserve the earlier standalone population and v0.18.28 compatibility passes as separate validated cases; this combined population failure leaves the v0.18.37 compatibility release gate open.
- No source code changes were made for this test result.

## [0.18.36] - Pre-release testing

### Encounter population status wording
- Changed the player-visible hijack line to `[RE] Updating Encounter Cards - Hit Continue` while retaining the preceding newline.
- Context cleanup recognizes both the previous and the new status wording so stale generation-status text cannot contaminate later story prompts.
- The one-time receipt popup, quiet retry behavior, population parsing, success popup, and encounter lifecycle are unchanged.
- Canonical Library and Inner Self compatibility harness remain synchronized; fresh AI Dungeon live verification is required.

### Live retry checkpoint — 2026-10-10
- In a fresh-game AI Dungeon run, the population request queued RAND_01–RAND_04, but the first dedicated generation produced ordinary scene narration and no RAND blocks; logs confirmed `populated=0`, all four targets remained queued, and RE turn progression was suspended.
- The next recorded eligible Context pass automatically retried RAND_01–RAND_04 without a new population request. The model returned four valid, one-sentence scenarios, and RE logged `requested=4`, `populated=4`, toggle reset to `false`, and RE turn still suspended.
- This confirms the retry-and-completion path in live logs; user-visible receipt popup, ordinary prose pass-through, updated hijack line formatting, Story Card contents, and post-success story continuation have not all been independently confirmed for v0.18.36.



## [0.18.35] - Pre-release testing

### Population request receipt and quiet retries
- Retained the original dedicated generation status line, including its leading newline, for attempts that return encounter-control material.
- Moved the `RE - Encounter population in progress.` popup to the initial request queue, so the player receives an immediate one-time acknowledgment instead of a failure notification.
- If an attempt ignores the structured request and produces ordinary story prose, pass that prose through unmodified, retain the outstanding placeholders, and silently retry on each subsequent eligible action/turn.
- Partial or malformed RAND control output remains hidden behind the generation-status line; valid generated cards are retained while missing cards are retried.
- After all requested placeholders are populated, reset the toggle and post the existing `RE - New encounters generated.` popup.
- The retry occurs on later AI Dungeon model turns, not in an asynchronous background process. RE's turn progression remains suspended during dedicated generation attempts.
- Focused source regression validated the one-time receipt, prose pass-through, partial/malformed handling, retry bookkeeping, completion popup, and toggle reset. Fresh AI Dungeon live validation required.


## [0.18.34] - Pre-release testing

### Retry incomplete placeholder population
- If the model ignores dedicated generation instructions or supplies only some RAND blocks, keep remaining untouched placeholder cards queued for the next eligible model turn instead of marking population failed.
- Preserve successfully populated cards and retry only the missing cards; do not overwrite existing custom encounters, titles, or metadata.
- Show `RE - Encounter population in progress.` as a player-facing popup while any cards remain; keep the existing generation-status text for hijacked generations.
- Reset the one-shot population toggle and show the existing successful completion popup only when every targeted card has been populated.
- Each attempt suspends the RE encounter turn; retries require subsequent eligible AI Dungeon generations, not asynchronous background calls. Context stop and recognized external model tasks continue to defer work.
- v0.18.33 live logs showed an ignored generation request (0/4), motivating this recovery behavior. Fresh AI Dungeon live validation is required.


## [0.18.33] - Pre-release testing

### Population status formatting and live-test confirmation
- Prefix the dedicated placeholder-generation status text with a newline so `[RE] Generating New Encounters - Hit Continue` starts on a separate line.
- Live AI Dungeon logs confirmed v0.18.32 queued and successfully populated all three selected placeholders, with exactly one sentence per encounter; user confirmed the intended visible status text and success popup appeared.
- The generation line-break behavior, normal-story resumption, and resulting Story Card contents still require fresh-adventure confirmation for v0.18.33.
- The canonical script and Inner Self compatibility harness remain synchronized.


## [0.18.32] - Pre-release testing

### Dedicated placeholder generation
- Abandoned the v0.18.30-v0.18.31 piggyback population design after two live tests showed that the model could ignore the hidden payload request and that stronger formatting instructions degraded visible story prose.
- `Populate Placeholder Cards` now owns one dedicated model generation instead of sharing a normal story continuation.
- The dedicated generation uses the established adventure Context for grounding but instructs the model not to continue or roleplay the current scene.
- The model is asked to return only RAND blocks with a short Title and a Scenario.
- Every generated Scenario must be exactly one sentence; the parser also enforces a single-sentence final Entry if the model returns more.
- The hidden generation output is replaced player-side with `[RE] Generating New Encounters - Hit Continue`.
- On full success, RE posts the normal popup `RE - New encounters generated.`; partial and failure paths post corresponding status popups without hijacking another turn.
- The dedicated generation does not advance RE pacing, Active Duration, encounter selection, or resolution lifecycle.
- The generation-status line is removed from later Context so it does not pollute resumed story prose.
- Custom encounter Entries, Outcomes, titles, and encounter metadata remain protected; generated titles replace only untouched default titles.
- Untouched placeholders remain protected from automatic or targeted selection while generation is queued/in progress.
- Context stop and recognized external model-task ownership defer the dedicated generation to a later eligible turn.
- Debug Logging now records a capped copy of the hidden generation output to simplify live diagnosis.
- Focused source tests pass for dedicated-turn suspension, next-Continue resumption, one-sentence enforcement, custom-content/title/metadata preservation, full/partial/failure paths, status-line cleanup, markdown-tolerant parsing, external-task deferral, and standalone hook syntax.
- Final v0.18.32 repository consistency pass confirmed standalone hook syntax, dedicated-turn suspension, one-sentence enforcement, story-status cleanup, custom-content preservation, external-task deferral, and exact Inner Self byte parity.
- Fresh AI Dungeon live validation is required.

## [0.18.31] - Pre-release testing

### Placeholder population live-failure fix
- The first v0.18.30 live population attempt reached the handled failure path. Logs showed the request was queued and injected for RAND_01, RAND_03, and RAND_04, but Output contained no population payload: `payloadFound=false`, `payloadComplete=false`, `populated=0`.
- Population output is now requested before story prose instead of after it. If another script requires a private control prefix, that prefix remains first and the population block follows immediately before narrative prose.
- The population instruction now explicitly marks the structured population task as mandatory for that response.
- Output parsing now preserves trailing story prose while recovering valid `RE_CARD` blocks when the outer `RE_POPULATE` wrapper is missing or incomplete.
- Repaired the generated-title sanitizer discovered during this debugging pass.
- Focused regression tests pass for complete wrapper, private-prefix output, missing outer wrapper, missing closing wrapper, story-prose preservation, title generation, and standalone hook syntax.
- Fresh AI Dungeon live validation is required.

## [0.18.30] - Pre-release testing

### Populate Placeholder Cards
- Added `Populate Placeholder Cards: false` under SYSTEM immediately after `Create Max Encounter Cards`.
- The setting is one-shot. When enabled, RE targets only untouched canonical Entries of the form `[Define random encounter ## here.]`.
- Population uses the next real story generation and the exact content instruction: “Generate low-stakes, dynamic encounters appropriate to the established setting, genre, technology level, supernatural rules, current locations, factions, characters, and conflicts. Do not introduce setting-breaking concepts.”
- RE asks the model to append a machine-readable population block after normal story prose, strips that block from visible Output, and writes valid generated scenarios into the requested placeholder cards.
- Generated titles replace only untouched default `## - Encounter Card` titles; custom titles are preserved.
- Act, Importance, Rarity, Duration, Status, keys, and other encounter metadata are not changed by population.
- Custom encounter Entries, cards with Outcomes, and already-populated cards are never requested or overwritten.
- While population is pending, untouched placeholders are temporarily excluded from weighted selection, targeted `/RE start #` refuses them, and an already-queued placeholder waits until population completes.
- Successful, partial, missing-payload, malformed-wrapper, and no-eligible-card paths all reset the one-shot toggle safely and provide an `RE - ` status message.
- Population waits through Retry/regeneration, Context `stop = true`, and recognized external model-task ownership rather than consuming those passes.
- Population Output is processed before normal encounter resolution capture, allowing resolution classification and placeholder population to succeed in the same model response.

### Validation
- Focused source harness passed for clean Config order/migration, exact prompt wording, world-context piggyback injection, custom-card preservation, custom-title preservation, metadata preservation, full and partial population, missing/malformed payload handling, no-eligible behavior, Retry/stop/external-task waiting, targeted-start protection, hidden payload cleanup, and combined resolution + population processing.
- Canonical source syntax passes and the maintained Inner Self harness has been refreshed to exact canonical RE byte parity.
- Final repository consistency pass confirmed standalone hook syntax, exact Config order, malformed-wrapper recovery, placeholder selection protection, exact Inner Self byte parity, and roadmap cleanup.
- Fresh AI Dungeon live validation is required before release.

## [0.18.29] - Pre-release testing

### Act & Encounter Map
- Added `Display Act & Encounter Map: false` under SYSTEM.
- When enabled, RE creates and maintains a read-only `Act & Encounter Map` Story Card grouped by Act with encounter identity, Importance, and current lifecycle state.
- Disabling the toggle removes canonical Act Map cards; re-enabling recreates the current map.
- Map synchronization is derived from encounter cards/runtime state, never becomes a second source of truth, and avoids rewriting unchanged content.
- No new `/RE` command is added for the map.

### History cleanup
- History Entry now uses a read-only structured layout and no longer displays an `Outcome:` label.
- The 12 most recent successful encounters remain in Entry and continue to be the only History injected into Context.
- When the 12-entry or 3000-character recent-history limit is exceeded, oldest items move into an `ARCHIVED HISTORY` section in Notes instead of being discarded.
- Archived History is retained oldest-first and preserved when fixed History Notes documentation is refreshed.
- Legacy one-line History records migrate into the new layout.
- History remains always managed rather than using the disposable-display toggle pattern, because the History card persists recent/context history and archived records rather than merely rendering derived state.

### Default cleanup
- Debug Logging now defaults to `false` on clean installs; existing Config values are preserved during migration.

### Startup and compatibility architecture
- Added canonical library adapter `RandomEncountersContext(text)` so the RE Context file remains identical across standalone and multi-script environments.
- The adapter safely handles an absent external `stop` binding, preserves a defined stop value in the returned modifier object, and lets the core library skip RE Context processing when `stop = true`.
- A stopped Context pass synchronizes RE turn-detection high-water state so it cannot become a delayed phantom RE turn.
- Compatibility fixtures are explicitly test harnesses rather than alternate Random Encounters builds. Generic coexistence fixes belong in the canonical RE library whenever practical.
- Focused Context-adapter regression passed for absent stop, stop=false, stop=true, and phantom-turn prevention.

### Presentation cleanup
- Renamed the Config card to `Config`.
- Renamed `Random Encounter History` to `History`.
- History now uses `======= SUCCESSFUL ENCOUNTERS - READ ONLY =======` as its first Entry line instead of a separate READ ONLY line.
- Removed the redundant `CURRENT ACT: #` line from Act & Encounter Map; the current Act remains identified in the Act section heading.
- Removed the blank spacer after READ ONLY on the Act & Encounter Map.
- Moved `Display Act & Encounter Map` directly below `Create Max Encounter Cards` in SYSTEM order, including normalization of existing Config cards.
- All previously defined v0.18.29 live test conditions passed before this presentation-only cleanup.
- Focused rendering verification passed for final card titles, Config order, History header, Act Map first lines, removal of the redundant Current Act line, standalone syntax, and Inner Self byte parity.

### Release preparation
- Focused source-level v0.18.29 checks passed for clean defaults, map lifecycle/refresh behavior, legacy Config/History migration, recent-to-archive History rollover, character-cap rollover, Context exclusion of archived History, compatibility-fixture byte parity, and wrapper syntax.
- Documentation and Story Card Notes are refreshed for the new map/history behavior.
- This source change reopens final fresh-game validation after the v0.18.28 compatibility gate.

Entries describe behavior at the version where they were written. Later entries may supersede older defaults, labels, or lifecycle behavior. Current behavior is documented in README.md and docs/.

## [0.18.28] - Live validated

### Shared toast compatibility
- RE now snapshots the completed `state.message` value at the end of every Output hook, even when RE did not post a message itself.
- A stale Auto-Cards startup/status toast from a completed turn is therefore replaced by a later RE command toast instead of being incorrectly merged with it.
- A toast created by another script during the same Output pass is still treated as concurrent and preserved alongside an RE toast.
- The fix is generic message-ownership tracking; it does not special-case Auto-Cards message text.

### Live validation
- Fresh-game testing with Inner Self + Auto-Cards confirmed the stale startup-toast merge is fixed.
- Auto-Cards compatibility gate passed live for queued encounters, Active Duration suspension, pending-resolution preservation, output pass-through, and phantom-turn prevention.
- Inner Self compatibility gate passed live for Active encounter progression during thought-bearing turns and RE resolution classification/cleanup in the combined environment.
- General compatibility control passed live in the Living Meters fixture: ordinary pacing, Active Duration, manual-end resolution, classifier cleanup, Outcome write, and pacing resume all behaved normally.
- v0.18.28 RC compatibility gate is now cleared; Story Arc Engine remains optional/unverified for live testing.
- `/RE start` displays the RE command response without carrying forward the old Auto-Cards enabled/configuration toast.
- No regression was observed in normal RE command behavior during the validation run.

## [0.18.27] - Testing

### Resolution compatibility
- Resolution capture now treats the three static classifier keys as authoritative whenever an RE resolution is pending: `The encounter occurred:`, `The encounter is in progress:`, and `The encounter did not occur:`.
- Other scripts may prepend control material without preventing recognition of the RE classifier key.
- Classification no longer fails because the summary is too short, missing terminal punctuation, or otherwise fails the old full-sentence validator; RE normalizes the stored Outcome into canonical form instead.
- Empty classifier summaries receive a safe canonical fallback so the pending resolution can still complete instead of leaking into later responses.
- Classifier removal continues to preserve unrelated preceding output and private parenthetical control prefixes.
- This patch directly targets a live Inner Self + Auto-Cards compatibility failure where `The encounter did not occur:` leaked into repeated responses and the Outcome was never written.

## [0.18.26] - Testing

### Resolution compatibility
- Added recognition and cleanup of zero-width/invisible formatting characters around resolution classifiers.
- Prevented invisible formatting prefixes from causing otherwise valid classifier sentences to remain pending.

## [0.18.25] - Testing

### Resolution compatibility
- Resolution capture can locate a valid classifier after preceding output instead of requiring it to be the literal first output sentence.
- Captured classifiers are removed in place while preserving unrelated visible output.

## [0.18.24] - Testing

### Compatibility hardening
- Added automatic Story Arc Engine task detection. When recognizable SAE state indicates an arc-generation/model-owned turn, RE freezes pacing, Active Duration, encounter injection, reminders, History injection, and resolution handling for that model turn.
- SAE-owned Output passes through untouched even if SAE clears its own generation flag before RE's Output hook runs.
- SAE detection requires recognizable SAE identity/state in addition to generation flags to avoid false positives.

## [0.18.23] - Testing

### General script compatibility
- Added a generic one-turn external-model-task pause contract for script integrations: `RandomEncounters("pause", "Script Name")` (aliases: `external task`, `external-task`).
- A compatibility pause consumes the current external task for RE turn-detection high-water purposes without advancing RE pacing or Duration.
- Updated the standalone Context wrapper to preserve and return AI Dungeon's `stop` flag and to skip RE Context processing when an earlier modifier already set `stop = true`.
- Generic pause behavior passed focused harness coverage including output pass-through and phantom-turn prevention.

## [0.18.22] - Testing

### Auto-Cards compatibility
- Added automatic detection of Auto-Cards-owned generation and memory-compression turns from its persisted runtime state.
- Added support for the Inner Self-bundled Auto-Cards event signal.
- During an Auto-Cards-owned model turn, RE freezes its turn counter, pacing countdown, Active Duration, encounter injection, reminders, History injection, and resolution request/capture.
- Auto-Cards output is passed through untouched and pending RE resolutions remain queued for the next normal story turn.
- Auto-Cards compatibility behavior passed 13/13 focused harness checks.

## [0.18.21] - Testing

### Inner Self and shared-script compatibility
- Resolution capture now tolerates one leading private parenthetical control prefix before the RE classifier sentence.
- Encounter and resolution prompts explicitly preserve a pre-existing private control prefix/output format before normal story prose.
- RE lifecycle markers are inserted after a leading private parenthetical control prefix instead of before it, preserving character-zero ownership for scripts such as Inner Self.
- Player-facing RE toasts now preserve an existing third-party `state.message` when possible and replace RE's own prior snapshot on later RE-only messages instead of endlessly appending.
- The standalone Context wrapper now preserves the `stop` value.
- Inner Self-style prefixed classifier/output behavior passed focused harness regression coverage.

## [0.18.20] - Testing

### Documentation and in-adventure reference
- Audited current Story Card Notes and repository documentation against the v0.18.19 implementation.
- Expanded Config Story Card Notes into a complete user-facing reference covering System settings, generation, Acts, bulk lifecycle reset, non-destructive Global Defaults, Restore to Defaults, encounter lifecycle, Rarity weighting, Duration, Outcomes, History, Retry safety, status markers, removed Cooldown/Minimum Turn behavior, runtime commands, and message conventions.
- Expanded Advanced RE Settings Notes to explain pacing intervals, Rarity weights, Duration baselines/scaling, invalid-value fallback, disabled-state preservation, and hidden Debug presets.
- Expanded Random Encounter History Notes to state that History stores successful encounters only, is capped at 12 entries / 3000 characters, is injected into context, and trims older entries automatically.
- Refreshed README as a current feature index rather than a v0.18.0-only summary.
- Removed obsolete shipped v0.17/v0.18 behavior from ROADMAP.md so the roadmap no longer conflicts with current defaults or messaging.
- Expanded current configuration, encounter-card, architecture, and testing docs to cover all active v0.18.20 features.
- Added an explicit Changelog notice that historical entries may be superseded by later versions.

## [0.18.19] - Testing

### Added
- Added `Set All Cards to Available: false` under ENCOUNTERS.
- Setting it to `true` is a one-shot lifecycle reset: every discovered encounter card becomes Available and the toggle then resets itself to `false`.
- The lifecycle reset clears active, queued, pending-resolution, marker, and pacing-countdown runtime state so card Status and runtime state remain consistent.
- Set All Cards to Available preserves each card's Act, Importance, Rarity, Duration, prompt/Outcome content, and custom title.
- Random Encounter History and Current Act are preserved.
- Existing Config cards automatically gain the new toggle without changing their existing values.

## [0.18.18] - Testing

### Changed
- Global Defaults are now non-destructive. Editing Act, Importance, Rarity, or Duration changes the defaults used by new and reset encounter cards but does not alter existing encounter-card settings.
- Added `Restore Encounter Cards to Defaults: false` under GLOBAL DEFAULTS.
- Setting Restore Encounter Cards to Defaults to `true` applies all four current Global Defaults to every discovered encounter card and then automatically resets the toggle to `false`.
- Restore preserves each encounter's lifecycle Status, prompt/Outcome content, and custom title. An already-active encounter keeps its current runtime Duration until that attempt ends.
- Default generated encounter titles are now number-first: `01 - Encounter Card`, `02 - Encounter Card`, etc.
- Existing cards still using the old exact default title pattern `Random Encounter ##` migrate to the number-first format; custom titles are preserved.
- Config Story Card Notes now include a user-facing reference for every `/RE` command and what it does.
- Existing Config cards migrate from the old destructive-default explanation to the new non-destructive behavior and gain the Restore Encounter Cards to Defaults toggle.

## [0.18.17] - Testing

### Internal review and refactor
- Completed a full library review focused on runtime simplicity, dead-code removal, and maintainable AI Dungeon scripting structure.
- Removed unused helpers, unused API exports, non-functional runtime fields, and duplicate bookkeeping.
- Encounter card Status is now the sole source of truth for encounter availability; the redundant runtime `used` list was removed.
- Runtime now stores a single `activeEncounter` instead of an array because the system permits only one active encounter at a time.
- Removed non-functional Triggered Turn / Resolved Turn metadata from encounter cards and runtime resolution records.
- Internal names now use current user-facing terminology such as Duration, Rarity, and Create Max Encounter Cards; legacy names remain only at compatibility/migration boundaries.
- Resolution parsing now validates and classifies the first-line result in one pass.
- Repeated return-to-Available resolution paths now share one lifecycle helper.
- Encounter maintenance avoids rewriting already-current cards and avoids repeated full-card lookups during generation.
- Built-in preset tables are no longer deep-cloned unless Advanced Settings are enabled.
- Newly discovered legacy or incomplete encounter cards use the current Global Defaults for missing Act, Importance, Rarity, and Duration values.
- Source is organized with concise functional section boundaries for easier navigation.

### Behavior cleanup
- The next Encounter Pacing countdown is no longer rolled while a retired encounter is still waiting for its resolution classification. The next countdown begins only after that resolution is settled.
- Legacy in-progress runtime state is normalized automatically into the reviewed schema, including old active-array, used-list, marker, Duration, and Rarity field names.

### Validation
- Static review found no named function definitions without callers.
- Harness regression coverage passed across fresh installation, one-shot generation, Global Defaults, Advanced Settings, Retry safety, Awaiting Completion, five-check cap, manual handoff, Act progression, reset behavior, invalid classifier retry, legacy card migration, and legacy runtime-state migration.
- Harness validation is separate from live AI Dungeon validation; previously live-tested lifecycle behavior remains the authoritative reference.

## [0.18.9] - Testing

### Changed
- All player-facing system messages now use the consistent `RE - ` prefix.
- Player-facing command confirmations, errors, validation warnings, reset notices, and Act progression notices now use consistent sentence case and punctuation.
- Internal debug logs remain diagnostic `[Random Encounters]` console output and are not treated as player-facing system messages.
- Act progression popup wording is now, for example: `RE - Act 1 is complete. Act 2 encounters are now available.`

## [0.18.8] - Testing

### Changed
- Regular Config and Advanced RE Settings cards now use compact spacing matching encounter Notes.
- Section headers sit directly above their content, individual settings/presets no longer have blank spacer lines, and one blank line separates major sections.
- Existing config cards are compacted automatically while preserving edited values.

## [0.18.7] - Testing

### Added
- Automatic Act progression now shows a player popup confirming the completed Act and newly available Act, for example: `RE: Act 1 complete; Act 2 encounters now available.`

## [0.18.6] - Testing

### Changed
- `/RE reset #` now clears the selected encounter card's `Outcome:` section while preserving its prompt.
- Single-card reset still returns the encounter to Available and restores Act, Importance, Rarity, and Duration from current Global Defaults.
- Reset-all and single-card reset now use consistent Outcome cleanup behavior.

## [0.18.5] - Testing

### Changed
- `/RE reset all` now clears every encounter card's `Outcome:` section while preserving the encounter prompt.
- Reset-all still restores Status and all editable encounter settings from the current Global Defaults.
- `/RE reset #` retains its existing single-card behavior and does not clear Outcome.

## [0.18.4] - Testing

### Changed
- Encounter-card Notes now use compact spacing: no blank line between section/subsection headers and their fields, with a single blank line between Encounter State and Encounter Settings.
- Clean-install `Maximum Encounter Cards` default changed from 10 to 4.
- Clean-install `Create Max Encounter Cards` default changed from false to true.
- On first maintenance, the default generation trigger ensures RAND_01 through RAND_04 exist, then resets itself to false as before.

## [0.18.3] - Testing

### Changed
- GLOBAL DEFAULTS now covers every editable encounter setting: `Act`, `Importance`, `Rarity`, and `Duration`.
- Changing any Global Default overwrites that field on all discovered encounter cards.
- Newly generated cards use all four current Global Default values.
- `/RE reset #` and `/RE reset all` restore all four encounter settings from the current Global Defaults.
- Status and Encounter Number remain excluded because they are script-managed state/identity fields.

## [0.18.2] - Testing

### Changed
- `Create Max Encounter Cards` is now a one-shot toggle. After it ensures/generates cards up to `Maximum Encounter Cards`, it resets itself to `false`.
- Newly generated encounters now default to `Importance: Required`.
- Existing encounters explicitly set to `Importance: Optional` remain Optional.
- Encounters missing an Importance field migrate with the new Required default.

## [0.18.1] - Testing

### Changed
- Restored the `---------- BEHAVIOR ----------` subsection under Encounter Settings.
- Rarity and Duration now sit under BEHAVIOR, while Act and Importance remain under PROGRESSION.

## [0.18.0] - Testing

### Added
- Encounter Acts with `Act` and `Importance: Required|Optional`.
- Config `Current Act`, default 1.
- Automatic Act advancement when every Required encounter in the Current Act has completed successfully.
- Third resolution classifier: `The encounter is in progress: ...`.
- 🔄 Awaiting Completion state.
- Awaiting Completion requeues the same encounter at 50% of its normal configured Duration.
- Five consecutive Awaiting Completion checks force the encounter back to Available.

### Changed
- Eligibility is now `Encounter Act <= Current Act` and `Status = Available`.
- Minimum Turn has been removed from encounter cards and runtime eligibility.
- Earlier Optional encounters remain eligible after Act advancement until they complete.
- `/RE start` and `/RE start #` now end an active encounter before queueing the replacement.
- Explicitly ended/replaced encounters cannot reclaim the Active slot through Awaiting Completion.

## [0.17.2] - Testing

### Changed
- Renamed `Create Missing Encounter Cards` to `Create Max Encounter Cards`.
- Restored the numeric field label to `Maximum Encounter Cards`.
- Removed the redundant `---------- BEHAVIOR ----------` subsection from encounter-card notes.
- Existing v0.17 config cards using `Create Missing Encounter Cards` or the temporary `Max Encounter Cards` label migrate to the current labels.

## [0.17.1] - Testing

### Changed
- `Maximum Encounter Cards` now controls only the number of missing RAND cards generated when `Create Missing Encounter Cards: true`.
- Existing RAND cards are always discovered and managed regardless of encounter number.
- Existing cards above the generation target remain eligible for weighted selection, global Rarity/Duration updates, `/RE start #`, `/RE reset #`, and `/RE reset all`.

## [0.17.0] - Testing

### Added
- Reorganized Config card with SYSTEM, ENCOUNTERS, and GLOBAL DEFAULTS sections.
- Runtime `Maximum Encounter Cards` setting, default 10.
- `Create Missing Encounter Cards`.
- `Use Advanced Settings`.
- Editable `Advanced RE Settings` Story Card.
- Player-facing fallback warning for invalid advanced/custom values.

### Changed
- Clean-install Encounter Pacing default is now Moderate.
- User-facing Encounter Weight terminology is now Rarity.
- User-facing Retirement Length terminology is now Duration.
- Encounter cards now place Encounter State above Encounter Settings.
- Rarity is listed before Duration.
- Legacy v0.16 config and encounter-card fields migrate into the v0.17 layout.
- Missing-card creation honors Maximum Encounter Cards; existing encounter cards are managed regardless of number.

### Removed
- Separate post-encounter Cooldown. Pacing alone now controls spacing between encounter opportunities.

### Preserved for compatibility
- Minimum Turn remains functional during v0.17. It is no longer a global Config default and is expected to be revisited when Acts are implemented in v0.18.
- Debug-only pacing/rarity/duration values remain hidden from the Advanced RE Settings card.

## [0.16.2] - Testing

### Added
- `/RE stop` as an exact alias of `/RE end`.

### Behavior
- Both commands immediately end the current Active encounter, queue its resolution check, start the normal cooldown, and do not consume a story turn.
- If no encounter is Active, both return the same no-active-encounter message.

## [0.16.1] - Testing

### Added
- Targeted encounter activation with `/RE start #`.
- Plain `/RE start` remains the weighted-random force-start command.

### Changed
- Canonical targeted reset syntax is now `/RE reset #`.
- Canonical reset-all syntax is now `/RE reset all`.
- `/RE help` now displays the spaced command forms.

### Testing notes
- Targeted start requires the encounter card to exist, be Available, and satisfy its current effective Minimum Turn.
- Targeted start bypasses pacing countdown and weighted selection, and queues the chosen encounter for the next real story action.
- A targeted start is refused while another encounter is Active or already queued.

## [0.16.0] - Confirmed

### Added
- Strict resolution classification using:
  - `The encounter occurred: <summary>.`
  - `The encounter did not occur: <explanation>.`
- Automatic restoration when an encounter never actually enters the narrative.
- 💾 output marker for restored encounters.
- Cleanup of duplicate leading non-occurrence prose.
- Persistent active encounter reminders across turns.

### Changed
- Successful encounters remain Retired and are added to Random Encounter History.
- Encounters classified as not occurring return to Available.
- Restored encounters are removed from the used set and do not enter History.
- Failed attempts retain their Outcome on the encounter card.
- Active reminders now conditionally handle encounters that have or have not yet entered the story.

### Confirmed architecture retained
- Weighted encounter selection.
- Pacing presets, including hidden Debug pacing for testing.
- Retirement Length presets and pacing scaling.
- Minimum Turn behavior.
- Cooldown lifecycle.
- Retry-safe turn counting.
- Runtime commands: `/RE help`, `/RE on`, `/RE off`, `/RE start`, `/RE end`, `/RE reset#`, `/RE resetall`.
- Random Encounter History.
- Placeholder encounter creation.
- Story Card type normalization.

## [0.15.0] - Confirmed

### Added
- Persistent active-encounter Context reinforcement.
- Full activation prompt on the trigger turn.
- Conditional active reminder on subsequent active turns.
- Retry-safe reinjection behavior.

## [0.14.x] - Confirmed

### Added
- Runtime control commands.
- `/RE help`.

### Fixed
- AI Dungeon command transport failures caused by returning `{ text, stop }`.
- Command handling now uses a sentinel/control-response path without consuming a story turn.

## [0.13.0] - Confirmed

### Changed
- Config/History Story Card type standardized to `#RE - Config & History`.
- Encounter Story Card type standardized to `#RE - Encounters`.
- Minimum Turn simplified to store the user-facing numeric value directly.
- Positive scaled Minimum Turn values clamp to at least effective Turn 1.
- Stored Minimum Turn `0` is immediately eligible.

## [0.12.0] - Confirmed

Validated core system behavior including pacing, retirement scaling, weighted rarity, Minimum Turn, global propagation, resolution capture, History, cooldown, Retry-safe turns, status markers, placeholder creation, and reset behavior.

## Unreleased

See `docs/ROADMAP.md`. Unreleased design decisions are not treated as shipped features.
