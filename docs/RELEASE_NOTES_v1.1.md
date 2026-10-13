# Random Encounters v1.1 — Production Source Notes

**Status:** v1.1 source promoted to [`main`](https://github.com/circadiansummer/AID-RandomEncounters/tree/main) October 12, 2026 by owner instruction ([PR #4](https://github.com/circadiansummer/AID-RandomEncounters/pull/4)). This is **not** evidence of the outstanding native tests, nor proof that a `v1.1` tag or formal GitHub Release has been published. Development history remains on [`develop/v1.1`](https://github.com/circadiansummer/AID-RandomEncounters/tree/develop/v1.1).

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

- **Offline:** 389/389 deterministic checks were previously reported as passing on the consolidated v1.1 executable source, including canonical/combined Library parity and six wrapper syntax checks. A fresh execution on the final source promotion commit was not available through this connector.
- **Native AI Dungeon Act-category UI — PASS (owner reported, October 12):** The owner confirmed that the updated UI worked in AI Dungeon. The report supports the changed 📜/🔒 UI behavior as a whole but does not provide separate action-by-action evidence for each manual/automatic category refresh path. See [UI acceptance record](test-reports/2026-10-12-v11-act-category-ui-acceptance.md).
- **Native ASAP scheduling — NOT RUN/NOT REPORTED:** First-eligible `Importance: ASAP` scheduling remains without final-source live acceptance. UI acceptance does not test the scheduler.
- **Capped/sliding history — UNVERIFIED:** A native test did not observe a bounded history window through 56 exposed entries; Continue counting on an eventual capped history has not been proven.
- **Plain Retry for partial AI population — INCONSISTENT:** Native tests showed that plain Retry does not always complete an unfinished batch, although a guided Retry succeeded. Do not promise universal completion from plain Retry.

**Archival and publication boundary:** [v1.0](https://github.com/circadiansummer/AID-RandomEncounters/releases/tag/v1.0) remains an intact historical tagged GitHub Release, also retained on [`archive/v1.0`](https://github.com/circadiansummer/AID-RandomEncounters/tree/archive/v1.0). At the time of this source promotion the integration cannot create a `v1.1` tag or GitHub Release. A `main` branch update alone does not publish the script to AI Dungeon or update scripts already installed in existing adventures. Treat this build as **partially native accepted (Act-category UI confirmed; ASAP scheduling pending)**, not as fully verified stable behavior.
