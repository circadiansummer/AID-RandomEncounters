# Roadmap

This file tracks unimplemented future work and the agreed scope for the in-progress v1.1 release. First Encounter Turn is already implemented in the v1.1 pre-release; see the Changelog.

Implemented behavior belongs in `docs/CHANGELOG.md` and current user-facing instructions under `guides/` (technical development records remain in `docs/`). New ideas should remain here only while they are still planned, experimental, or awaiting a release-timing decision.

**Update policy:** AI Dungeon script updates do not require migrating existing adventures. Implement new features against the current Story Card layout for newly started adventures; do not add legacy Story Card conversion or existing-adventure migration as release requirements.

**Root README release-only policy:** Treat `README.md` at the repository root, especially on `main`, as frozen between full version releases. Do not change it for pre-release features, development branch announcements, tests, acknowledgments-only housekeeping, or routine documentation updates. Put ongoing plans, testing, and progress in the appropriate `docs/` or `guides/` files on the development branch instead. Update the root README only when the user explicitly approves a full version release. Never add a development-branch status paragraph to the public README.

## Release-candidate compatibility priorities

Compatibility is a release-candidate gate, in this order:

1. **Inner Self** — highest priority.
2. **Auto-Cards** — second priority.
3. **General script compatibility** — preserve common AI Dungeon composition semantics and provide a generic external-task pause contract.
4. **Story Arc Engine** — nice to have rather than a release blocker if the integration requires disproportionate complexity.

v0.18.21-v0.18.28 added source/harness-level hardening and live validation across the first three categories. The v0.18.28 release-candidate compatibility gate is cleared. Story Arc Engine remains optional and is not a release blocker.

## v1.0 release boundary

Version 1.0 was finalized on October 10, 2026, following confirmed live testing and automated checks. The features below are planned or exploratory post-release work, not shipped parts of v1.0.

Encounter Groups and broad Advanced Eligibility Conditions remain deferred because they risk adding significant configuration complexity and, in their most ambitious form, would require the system to determine which situational group/condition is appropriate from story context.

## v1.1 release scope — integration review and final acceptance pending

**Status (October 12):** All agreed v1.1 features are implemented in development. The saved local candidate reports **328/328 checks and targeted live testing**, but its changes remain uncommitted in the preserved local checkout. The separate `review/v1.1-integration` branch reconstructs these fixes alongside the finalized Config layout and passed **318/318 offline checks**. Source comparison and specific live edge tests remain required; the historical October 11 `develop/v1.1` run passed 294/294. The October 11 live audit observed successes in card management, population, and combined-script integration, but exposed a still-unresolved **Retry turn-counting defect** and blocked prompt-inspection checks. **v1.1 is not approved for public release.** Public `main` and both root READMEs remain frozen.

### Agreed feature list

1. **First Encounter Turn — implemented.** Configure `0`, a fixed absolute RE turn, or an inclusive one-time range. Only successful valid first automatic encounter injection completes that first schedule.
2. **Manual RAND Card Notes Initialization — implemented.** Newly added valid `RAND_##` keys register automatically, with missing Notes initialized from Global Defaults; existing valid settings and custom Entry/Title/Keys are retained.
3. **Invalid / Placeholder Encounter Protection — implemented.** Empty and RE-default-placeholder Entries are excluded from automatic selection; explicit invalid start requests receive an `RE -` warning; pending, Active, Retry, and resolution paths cancel invalid entries without sending encounter instructions to the model or inventing outcomes. Only RE-controlled prompt injection is guarded; AI Dungeon's independent native Story Card activation is outside this script's control.
4. **Duplicate RAND Key Renumbering — implemented.** During ordinary maintenance, the first card bearing a valid encounter number keeps its key. Later cards using the same number are renumbered to the **next unused greater RAND number**, without overwriting other cards or creator Entry/custom titles; matching default titles, Encounter Number Notes, and untouched RE placeholder Entries update with the key. The player receives a one-time warning for each correction.
5. **Act-Specific Encounter Categories — implemented.** Card type follows its Notes Act: `#RE - Act 1 Encounters`, `#RE - Act 2 Encounters`, etc. Types synchronize on creation, manual Act edits, reset, and Restore Defaults. Type is organizational only; Notes Act remains authoritative for eligibility.
6. **No Matter What Mode with independent global/card switches — implemented.** Global Config and every RAND card's Notes use `No Matter What Mode: true | false`, default `false`. The stronger immediate-introduction instruction activates if **either** switch is true; setting a card to false cannot negate a true global switch. `Default` is not a valid choice and is normalized to `false` if manually entered; other invalid values also normalize to `false`. Notes maintenance preserves only one canonical field. A card's boolean value survives Notes initialization and lifecycle metadata updates, and Retry preserves the original prompt strength. Enabled No Matter What Mode now explicitly demands immediate, potentially absurd interruption even when the encounter mismatches the existing setting, genre, or tone; normal mode retains natural integration. Other scripts' private prefixes, story facts, and open-ended outcomes remain protected. This is an AI instruction, not a guarantee.
7. **Encounter Difficulty, Theme & Progress — implemented.** Config adds `Encounter Difficulty` (Very Easy/Easy/Normal/Hard/Very Hard; default Easy) and open-ended `Encounter Theme` (None or up to five words/60 characters). The model-facing prompt describes the selected *game difficulty* without imposing genre, tone, conflict, plot structure, or outcome; it now references **current and known locations**. Difficulty/theme are snapshotted at the start of generation, so retries use the original values. Generation popups and hijacked status text end in the number of successfully populated cards out of the original requested batch, e.g. `[RE] Updating Encounter Cards (1 of 4) - Hit Continue` and `[RE] Updating Encounter Cards (4 of 4) - Hit Continue`. The one-sentence RAND protocol remains intact.

### Remaining work — targeted live AI Dungeon acceptance

- Confirm dynamic Story Card type/category updates appear correctly in the AI Dungeon editor and do not harm creator edits.
- Confirm duplicate-key renumbering persists correctly in Story Cards and warning popups reach the player.
- Confirm invalid/manual/automatic placeholder handling in live play; no unwanted visible control turn, stray random encounter injection, or repetitive warnings.
- Compare normal scene-sensitive introduction against No Matter What Mode's immediate, deliberately disruptive introduction with a suitable model. Verify all four global/card boolean combinations (`false/false`, `false/true`, `true/false`, `true/true`) plus Retry; try a benign encounter interrupting an otherwise calm scene despite genre mismatch. Model compliance cannot be guaranteed by script code alone.
- Verify manual card Notes initialization and First Encounter Turn in a fresh development adventure; run an Inner Self/Auto-Cards smoke test if platform integration behavior differs from the mocked checks.
- Test one real placeholder-generation batch with `Encounter Difficulty: Hard` and `Encounter Theme: night at the movies`; confirm model-facing phrasing, one-sentence RAND output, completed/total progress count, and return to normal story. This check replaces redundant tests of the older generator.
- Only after user-confirmed live acceptance: publish the full v1.1 update and update release-only README/documentation. No update or migration of previously started adventures is required.

### Development order completed

1. Invalid / Placeholder protection
2. Duplicate-key detection and automatic next-free-key reassignment
3. Act-specific type/category synchronization
4. Global and per-encounter No Matter What Mode controls
5. Genre-neutral encounter difficulty/theme, current and known locations, and numbered generation progress
6. Standalone + Inner Self merged Library parity and regression tests

**Not in v1.1:** `/RE validate`, an expanded Encounter Pool Summary, Encounter Chaining, Mutual Exclusion, Encounter Groups, Advanced Eligibility Conditions, or Act Lock.

## Post-v1.1 candidates

### Encounter Chaining / Prerequisites

Status: strong post-release feature candidate. Deferred from v0.18 by the release-candidate feature freeze.

Potential scope includes prerequisite-style relationships and more general encounter-to-encounter follow-up behavior. This should go beyond a simple `Requires Encounter #` gate and support useful sequencing without turning the encounter system into a full graph editor.

This remains a leading substantial candidate **after v1.1**.



## Post-release wishlist

### Mutual Exclusion

Useful advanced behavior for branching encounter sets, but should be designed conservatively so ordinary encounter setup remains simple. Prefer an optional field or lightweight group identifier over a required relationship-management UI.

### Encounter Groups

Defer until after release. The main unresolved design question is whether groups are manually selected/configured or whether the AI is expected to infer which group is appropriate to the current situation. Avoid adding automatic situational inference until there is a reliable, understandable design.

### Advanced Eligibility Conditions

Defer until after release. This overlaps with Encounter Groups and has the same concern: arbitrary story-state inference can become fragile and confusing. If revisited, prefer explicit script-managed conditions over freeform AI interpretation.

### Act Lock

Post-release candidate. Add an encounter-level toggle that chooses between:

- current behavior: the encounter remains eligible in later Acts while Available because `Encounter Act <= Current Act`
- Act-locked behavior: the encounter is eligible only while `Encounter Act == Current Act`

The first concrete use case is allowing an Act 1 encounter to be restricted to Act 1 instead of carrying forward indefinitely.

## Not currently planned

Reusable successful encounters remain a conditional future idea rather than a committed feature. The current reset and bulk-availability tools cover many reuse needs already; automatic recurrence should be added only if concrete scenario designs require it.
