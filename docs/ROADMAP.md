# Roadmap

This file is reserved for unimplemented future work. First Encounter Turn moved into the implemented v1.1 pre-release candidate; see the Changelog.

Implemented behavior belongs in `docs/CHANGELOG.md` and current user-facing instructions under `guides/` (technical development records remain in `docs/`). New ideas should remain here only while they are still planned, experimental, or awaiting a release-timing decision.

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

## Candidate before or after release

### Encounter Chaining / Prerequisites

Status: strong post-release feature candidate. Deferred from v0.18 by the release-candidate feature freeze.

Potential scope includes prerequisite-style relationships and more general encounter-to-encounter follow-up behavior. This should go beyond a simple `Requires Encounter #` gate and support useful sequencing without turning the encounter system into a full graph editor.

This is a leading candidate for the first substantial post-release feature.



## Post-release wishlist

### Act-Specific Encounter Story Card Categories

**Status: Proposed for a future version; not implemented or committed to v1.1.** This is a creator-facing organization enhancement, not a change to gameplay eligibility.

Replace the shared `#RE - Encounters` Story Card category with a per-Act category derived from each RAND card's existing `- Act: #` value in Notes:

- Act 1 → `#RE - Act 1 Encounters`
- Act 2 → `#RE - Act 2 Encounters`
- Act 3 → `#RE - Act 3 Encounters` (and so on for positive Act values)

**Recommended behavior:**

- The encounter's **Notes Act field remains authoritative**. On creation, set the card type from its configured/default Act; when an author edits `- Act: #` manually, update only the card's type on the next normal maintenance pass, without rewriting the author's Notes, Entry, title, or keys.
- All automatic and manual Act changes (such as restoring Global Defaults, resetting a card, or creating missing cards) must keep the category in sync.
- Preserve `RAND_##` identity and existing Status, Rarity, Duration, Outcome, Required/Optional gating, pacing, and Act advancement behavior. The type is for user-facing organization, **not** a second source of truth or an eligibility check.
- Do not create separate placeholder category cards. AI Dungeon can group encounter Story Cards using each card's `type` value; a category is populated only when an encounter is assigned to that Act.

**Before implementing, verify:** AI Dungeon's handling of dynamic card type/category values; whether routine maintenance can update the type without disturbing creator edits; whether old `#RE - Encounters` types migrate safely in existing adventures or whether a fresh adventure is required; and how invalid/missing `Act` Notes map to the default Act.

The exact release target, migration policy, and live UI validation remain open. This entry records a design idea only; it is **not a shipped feature**.

### Mutual Exclusion

Useful advanced behavior for branching encounter sets, but should be designed conservatively so ordinary encounter setup remains simple. Prefer an optional field or lightweight group identifier over a required relationship-management UI.

### Encounter Groups

Defer until after release. The main unresolved design question is whether groups are manually selected/configured or whether the AI is expected to infer which group is appropriate to the current situation. Avoid adding automatic situational inference until there is a reliable, understandable design.

### Advanced Eligibility Conditions

Defer until after release. This overlaps with Encounter Groups and has the same concern: arbitrary story-state inference can become fragile and confusing. If revisited, prefer explicit script-managed conditions over freeform AI interpretation.

### No Matter What Mode

Post-launch candidate. Provide an optional harder encounter-injection mode that tells the model to begin the encounter immediately while adapting it to current continuity and preserving its core event.

### Act Lock

Post-release candidate. Add an encounter-level toggle that chooses between:

- current behavior: the encounter remains eligible in later Acts while Available because `Encounter Act <= Current Act`
- Act-locked behavior: the encounter is eligible only while `Encounter Act == Current Act`

The first concrete use case is allowing an Act 1 encounter to be restricted to Act 1 instead of carrying forward indefinitely.

## Not currently planned

Reusable successful encounters remain a conditional future idea rather than a committed feature. The current reset and bulk-availability tools cover many reuse needs already; automatic recurrence should be added only if concrete scenario designs require it.
