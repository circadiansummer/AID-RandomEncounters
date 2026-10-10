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

## v1.1 release scope — agreed plan

The **v1.1 release** will cover these four feature additions, with release status distinguished from planning:

1. **First Encounter Turn — already implemented in the v1.1 pre-release.** Choose `0` (existing pacing), a fixed positive turn, or an inclusive positive turn range for the *first automatic* encounter. Subsequent encounters use the existing pacing/lifecycle. See `docs/CHANGELOG.md` and `guides/configuration.md` for actual behavior; targeted live AI Dungeon verification remains pending.
2. **Act-Specific Encounter Story Card Categories — planned, not implemented.** Categorize RAND cards by their Notes Act value instead of one shared encounter category.
3. **No Matter What Mode — planned, not implemented.** An optional forceful *AI instruction* that tells the model to begin the selected encounter in the immediate story response instead of waiting for a natural opening.
4. **Invalid / Placeholder Encounter Protection — planned, not implemented.** Reject unfinished RAND cards with blank Entries or RE's default placeholder text, keep them out of model context, and notify the player how to fix or generate them.

These four features are the agreed v1.1 scope. Other wishlist items remain outside v1.1 unless explicitly approved later. No migration or legacy-format conversion is required for script updates. Do not document either pending feature as shipped or alter published v1.0 notes before implementation and validation.

### Act-Specific Encounter Story Card Categories

**Status: Included in the v1.1 release plan; implementation pending.** This is a creator-facing organization enhancement, not a change to gameplay eligibility.

Replace the shared `#RE - Encounters` Story Card category with a per-Act category derived from each RAND card's existing `- Act: #` value in Notes:

- Act 1 → `#RE - Act 1 Encounters`
- Act 2 → `#RE - Act 2 Encounters`
- Act 3 → `#RE - Act 3 Encounters` (and so on for positive Act values)

**Recommended behavior:**

- The encounter's **Notes Act field remains authoritative**. On creation, set the card type from its configured/default Act; when an author edits `- Act: #` manually, update only the card's type on the next normal maintenance pass, without rewriting the author's Notes, Entry, title, or keys.
- All automatic and manual Act changes (such as restoring Global Defaults, resetting a card, or creating missing cards) must keep the category in sync.
- Preserve `RAND_##` identity and existing Status, Rarity, Duration, Outcome, Required/Optional gating, pacing, and Act advancement behavior. The type is for user-facing organization, **not** a second source of truth or an eligibility check.
- Do not create separate placeholder category cards. AI Dungeon can group encounter Story Cards using each card's `type` value; a category is populated only when an encounter is assigned to that Act.

**Before implementing, verify:** AI Dungeon's handling of dynamic card type/category values; whether routine maintenance can update the type without disturbing creator edits; and how invalid/missing `Act` Notes map to the default Act. No legacy `#RE - Encounters` category conversion is needed.

The v1.1 implementation and live UI validation remain outstanding. This is **planned, not shipped**.

### No Matter What Mode

**Status: Included in the v1.1 release plan; implementation pending.**

Introduce an opt-in alternative to the existing encounter-injection guidance. Ordinary/default injection still allows the selected encounter to enter the narrative naturally when the current scene permits; **No Matter What** instructs the AI to start introducing the selected encounter **in the current generated response**, rather than deferring it to subsequent turns. The feature changes narration instructions, not when encounters are selected.

**Proposed behavior and safeguards:**

- **Off by default.** Leave existing encounter narration unchanged unless the creator explicitly enables the mode. Decide the exact configuration placement (global Config setting versus per-encounter override) before implementation; do not assume both are required.
- For the selected encounter, direct the AI to begin the core event immediately, integrating it into the current location, cast, ongoing conversation, and continuity rather than abruptly overwriting established story facts.
- Retain encounter identity, Rarity, Duration, Status, Outcomes, Act gating, selection timing, resolution handling, and Retry-safe reinjection. Maintain compatibility with required private control prefixes and other scripts' formatting constraints.
- Ensure active-encounter reminders are coherent with an event that has been introduced under the harder mode; avoid re-triggering or restarting the event in subsequent turns.
- Describe the behavior accurately: this is a **stronger prompt**, not a deterministic guarantee that the AI will obey. Do not auto-retry or suppress the user's response merely because the model ignores the instruction.
- Test default versus opted-in narration in a real AI Dungeon adventure, and run existing scripted regressions, including Inner Self/Auto-Cards compatibility.

No script code or Config/Story Card layout is changed simply by recording this scope.

### Invalid / Placeholder Encounter Protection

**Status: Included in the v1.1 release plan; implementation pending.** This is a guard against sending unfinished Encounter Story Card Entries to the model or changing an encounter's lifecycle based on placeholder prose.

**Definition:** An encounter is invalid when its narrative Entry is empty/whitespace or consists solely of RE's own default placeholder text (for example, `[Define random encounter 02 here.]`), after accounting for trivial whitespace. Do **not** treat meaningful creator-written encounter descriptions as placeholders. Recognize RE-generated placeholders, not arbitrary bracketed user prose.

**Expected behavior:**

- **Automatic selection:** Exclude invalid cards from the eligible encounter pool, independently of whether `Populate Placeholder Cards` is running. Valid encounter selection, weights, pacing, Act gating, and Rarity remain unchanged.
- **Manual selection:** If a player explicitly requests an invalid RAND card, reject it and display a player-facing message, not an AI narration: `RE - RAND_02 is invalid: no encounter description. Add encounter details to its Story Card, or enable Populate Placeholder Cards in Config to generate default placeholders.`
- **Final context protection:** Recheck at the point of pending encounter injection, active-reminder injection, resolution preparation, and retry reinjection. Never put default placeholder prose into the model prompt, even if a card becomes invalid after selection or activation.
- **Lifecycle:** Invalid cards should remain or return to Available without fake activation, retirement, outcome, resolution request, or falsely completing the first automatic encounter. A selected but invalid encounter must not block further eligible selection; reset or resume scheduling coherently. If a previously Active card becomes blank or placeholder-only, clear or resolve its stale runtime tracking without fabricating an event outcome; specify the precise cancellation handling when implementing.
- **Notifications:** Use the existing RE user-message/popup mechanism. Avoid warning spam during ordinary idle turns; notify on failed explicit activation or another meaningful failed attempt (and possibly once when no usable encounters remain). Do not consume an AI turn or force a Retry just to display the warning.
- **Generation guidance:** `Populate Placeholder Cards` currently targets *untouched RE default placeholders*. A fully blank Entry may need to be filled manually or restored to the default placeholder before that Config operation can generate it; avoid promising automatic generation for an arbitrary empty Entry.
- **Tests:** Include blank, exact placeholder, whitespace-only, creator-written brackets, manual start, automatic pool selection, first automatic turn, edited-after-selection and edited-while-active cards, Retry, and Inner Self/Auto-Cards compatibility. Validate that the warning reaches the player and the model never receives placeholder text.

This is a v1.1 **planned** feature only. Do not alter public v1.0 scripts, main README, or published release notes while implementing or testing it.

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
