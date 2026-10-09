# Roadmap

This file is reserved for unreleased future work.

Implemented behavior belongs in `CHANGELOG.md` and the current documentation under `docs/`. New ideas should remain here only while they are still planned, experimental, or awaiting a release-timing decision.

## Release-candidate compatibility priorities

Compatibility is a release-candidate gate, in this order:

1. **Inner Self** — highest priority.
2. **Auto-Cards** — second priority.
3. **General script compatibility** — preserve common AI Dungeon composition semantics and provide a generic external-task pause contract.
4. **Story Arc Engine** — nice to have rather than a release blocker if the integration requires disproportionate complexity.

v0.18.21-v0.18.28 added source/harness-level hardening and live validation across the first three categories. The v0.18.28 release-candidate compatibility gate is cleared. Story Arc Engine remains optional and is not a release blocker.

## Release-candidate boundary

**v0.18 feature scope is frozen.** Release preparation from this point is limited to regression verification, documentation/version cleanup, packaging, and release notes. New feature work is deferred until after v0.18 ships.

Encounter Groups and broad Advanced Eligibility Conditions remain deferred because they risk adding significant configuration complexity and, in their most ambitious form, would require the system to determine which situational group/condition is appropriate from story context.

## Candidate before or after release

### Encounter Chaining / Prerequisites

Status: strong post-release feature candidate. Deferred from v0.18 by the release-candidate feature freeze.

Potential scope includes prerequisite-style relationships and more general encounter-to-encounter follow-up behavior. This should go beyond a simple `Requires Encounter #` gate and support useful sequencing without turning the encounter system into a full graph editor.

This is a leading candidate for the first substantial post-release feature.


### Act Overview / Act Manager

Future usability feature for inspecting and optionally editing encounter progression without opening every individual encounter card.

Potential command/UI behavior:

- Add a command such as `/RE acts` to display the current Act structure and encounter status.
- Optionally create or refresh a script-managed Story Card that summarizes encounters grouped by Act.
- Show each encounter using its title or number, Importance, and current lifecycle state.
- Example layout:

```text
Act 1
- Ride With Us (#1) — Required — Completed
- High Score (#2) — Optional — Available

Act 2
- The Billboard (#3) — Required — Active
```

The stronger version would make the Story Card editable so changing an encounter's listed Act updates the associated encounter card's `Act` setting. If implemented, the parser should be deliberately narrow and preserve encounter cards as the canonical source of truth rather than creating a second independent progression database.

Before implementation, decide:

- whether `/RE acts` only displays information or also creates/refreshes the Story Card
- whether editing supports Act assignment only or also Importance
- whether entries should identify encounters primarily by title, RAND number, or both
- how manual edits are validated when encounter titles contain punctuation or duplicate names
- whether completed/retired encounters remain editable through the overview

## Post-release wishlist

### First Encounter Roll Turn

Post-release pacing control. Add a numeric setting that schedules the **first automatic encounter roll** for a specific RE story turn, then returns to normal Encounter Pacing for every subsequent roll.

Intended behavior:

- user enters a positive whole-number turn
- no automatic encounter roll occurs before that turn
- on the configured turn, RE performs the first normal weighted eligible encounter roll
- after that first roll opportunity, the existing Encounter Pacing logic determines all future intervals
- this does **not** reintroduce per-card Minimum Turn; it controls only the campaign's first automatic roll
- manual `/RE start` behavior should remain separate from this automatic pacing control

Before implementation, settle edge cases such as the default/disabled value and what happens if no encounter is eligible on the scheduled first-roll turn.

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
