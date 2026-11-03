# Development handoff — Popup History and /RE now, soon, later

**Repository:** `circadiansummer/AID-RandomEncounters`
**Branch:** `develop/popup-history-command-encounters`
**Base:** v1.13 `main` at `13d54519e9e7a2623c6ba11e15526f669b290c97`
**State:** Implemented and offline-tested. No merge, release tag, AI Dungeon Library publication or native acceptance claimed.

## Scope

- A script-owned unpinned `Popup History` Story Card with internal key `re_popup_history_internal` under `#RE - Config`, created on startup alongside Config. The Entry shows the latest RE popup with owner-approved spacing; Notes store all attempted messages newest first with 24-hour UTC date/time.
- `/RE now [text]`: creates a Current Act ASAP + Bypass card, ends an Active encounter via established resolution, and queues the new card. Popup: `RE - Encounter ## Created; Continue to Activate ASAP`.
- `/RE soon [text]`: creates a Current Act ASAP card with Bypass false, preserves an Active encounter, and schedules the new card at the next free encounter opportunity using a FIFO command-priority queue. Popup: `RE - Encounter ## Added & Queued`.
- `/RE later [text]`: creates a Current Act Optional card with Bypass false, preserving an Active encounter and entering the ordinary eligible weighted pool. Popup: `RE - Encounter ## Added to Pool`.
- The command Entries are copied directly from player-supplied text (surrounding whitespace trimmed); multiline Entries work. All use configured Global Default Rarity/Duration; keys append beyond the highest RAND number.
- The standalone `Library.js` and combined `RE-InnerSelf-Merge/Library.js` retain exact RE source parity and preserve the bundled third-party code.

## Test evidence

- Original pre-feature v1.13 main: **418/418** deterministic checks passed.
- With Popup History and unchanged feature behavior: **418/418** regression checks passed, with startup-creation expectations corrected and status-command encounter-state checks separated from the intentionally updated notification card.
- With commands and new regression cases: **438/438** deterministic checks passed in the JavaScript test environment, including script syntax, two-library parity, now/soon/later effects, multiline Entries, Active displacement, queue ordering, duplicate command replay, UTC formatting, newest-first history, and command notifications.
- This is deterministic simulation, **not** a native AI Dungeon acceptance result. Live tests are **NOT RUN**.

## Owner acceptance steps

1. Start a fresh disposable adventure with the development scripts; verify Config and Popup History are the only automatically created Story Cards.
2. Execute each `/RE` quick-create command; inspect exact Entry, Notes, popup History, metadata and category.
3. Test `/RE now` while an event is Active, confirm its resolution and the new encounter's next-action activation.
4. Test `/RE soon` during an Active event and after a competing ASAP event exists, confirming it does not interrupt and receives the next eligible activation.
5. Test `/RE later` during an Active event and verify ordinary selection.
6. Test Continue, Retry, and combined Inner Self / Auto-Cards behavior; inspect Input/Context/Output logs and any control-text leakage.
7. Inspect a long Popup History for Notes persistence and confirm it is unpinned/not injected into AI Context.

## Known limitations

- Popup History records **message attempts**, not browser delivery confirmations.
- Storage/performance limits of unbounded Story Card Notes have not been measured in native AI Dungeon.
- RE cannot guarantee an AI model will narrate a Bypass encounter on demand.
- Disabled RE, unresolved classifications, and external script generation can defer activation; `/RE now` uses the existing manual displacement/resolution pathway.
- Request/action-count-based duplicate processing defense does not prove every native Retry edge case.

**Release safeguard:** Root README and `main` remain frozen until separate, explicit release approval. Do not rewrite historical tags or test evidence.
