# Random Encounters v1.1 — Draft Release Notes (NOT PUBLISHED)

**Status:** Unreleased production candidate. Created October 12, 2026. Authoritative development branch: [`develop/v1.1`](https://github.com/circadiansummer/AID-RandomEncounters/tree/develop/v1.1). Proposed promotion: [draft PR #4](https://github.com/circadiansummer/AID-RandomEncounters/pull/4).

## New features

- **Act-aware organization:** Encounter Story Cards organize into `#RE - Act X Encounters  📜` for currently eligible Acts and `#RE - Act X Encounters  🔒` for future Acts. The category suffix updates when `Current Act` changes, including after successful required encounter resolution. The old optional generated Act & Encounter Map was retired.
- **Importance: ASAP:** Alongside `Required` and `Optional`, `ASAP` marks an encounter as Required for Act advancement and schedules it on the first eligible real story turn, bypassing the ordinary pacing countdown. It still respects Act gating, first-encounter scheduling, ongoing encounters, unresolved outcomes, and invalid-card exclusion. Rarity remains an independent four-level weighted control.
- **First Encounter Turn:** Choose `0` for normal pacing, a fixed numbered RE turn, or an inclusive positive range (such as `5-10`) for the first automatic encounter; later rolls return to normal pacing.
- **Kool-Aid Man Mode:** A global or individual-card toggle instructs the AI to begin a selected encounter immediately, even if it disrupts the scene or tone. It affects model instructions, not encounter selection or eligibility.
- **Creator-friendly encounter cards:** Missing metadata on manually added `RAND_##` cards is initialized from global defaults without overwriting custom Entries or titles. Duplicate RAND identifiers are repaired by reassignment. Blank and untouched placeholder entries are excluded from selection.
- **AI-assisted placeholder creation:** Difficulty and optional theme guide one-sentence generated encounter Entries. Numbered progress reports partial completion, and successfully populated Entries remain protected on retries. Combined Inner Self/Auto-Cards integration is retained.

## Compatibility and state

- Script entry points remain the four AI Dungeon sections: Library, Input, Context, Output. Standalone and combined Inner Self/Auto-Cards versions are separate installation choices and must not be mixed.
- This version targets **fresh/current-schema adventures**; repository updates do not automatically replace scripts in existing AI Dungeon adventures.
- The per-card `Force ASAP` toggle and temporary pre-release `Rarity: ASAP` value are retired in favor of `Importance: ASAP`.
- Completed and unsuccessful encounter Outcomes remain stored on their RAND cards; normal Retry must not consume a new RE story turn.

## Verification and known limitations

- **Offline:** 389/389 deterministic checks pass on the consolidated v1.1 source, including canonical/combined Library parity and six wrapper syntax checks.
- **Native AI Dungeon acceptance — NOT YET RECORDED:** First-eligible ASAP scheduling, category display 📜/🔒, and unlock refresh still require confirmation on the final source.
- **Capped/sliding history — UNVERIFIED:** A native test did not observe a bounded history window through 56 exposed entries; Continue counting on an eventual capped history has not been proven.
- **Plain Retry for partial AI population — INCONSISTENT:** Native tests showed that plain Retry does not always complete an unfinished batch, although a guided Retry succeeded. Do not promise universal completion from plain Retry.

**Publication:** These are *draft* notes. Publish to GitHub only after the documented acceptance/owner risk decision and actual production branch merge. Retain [v1.0](https://github.com/circadiansummer/AID-RandomEncounters/releases/tag/v1.0) as a historical, installable release. A GitHub release does not itself publish the script in AI Dungeon or update already-installed adventures.
