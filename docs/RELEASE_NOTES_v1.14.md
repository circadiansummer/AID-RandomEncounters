# Random Encounters v1.14 — GitHub Production Source Release Notes

**Approved:** November 3, 2026 (America/Chicago). **Previous main source:** v1.13. **Target:** GitHub `main`; no GitHub tag/Release or AI Dungeon Library publication requested.

## New functionality

- **Popup History:** A script-owned, unpinned `Popup History` Story Card appears under `#RE - Config` on new adventures. The Entry displays the latest attempted RE notification in the format below; Notes retain full newest-first timestamped history. The script does not intentionally inject that Notes archive into model Context.

```text
======== Latest Popup Info ========
- RE - Random encounters enabled. (11/03/2026 at 10:28:00 UTC)

(See 'Notes' Below for full Popup History)
```

Before the first notification, the Entry shows `- No popup messages recorded yet.` without a fabricated timestamp. Notifications are recorded when attempted; browser delivery is not confirmed by the archive.

- **Quick commands:** `/RE now [text]` creates a current-Act ASAP encounter with per-card Bypass Situational Awareness enabled, displaces any Active encounter through normal resolution, and queues the new event for the next eligible story action. `/RE soon [text]` creates an ASAP encounter without per-card Bypass, preserves the current Active encounter and queues the new one behind it. `/RE later [text]` creates an Optional encounter for normal weighted selection. Creator-supplied Entries are preserved, including newlines; Global Default Rarity/Duration apply.
- **Startup remains opt-in for RAND cards:** Fresh adventures create Config plus Popup History; they do **not** create RAND placeholders until requested. `Placeholder Cards to Create` remains 4 by default, with `Create Placeholder Cards: false` initially.
- **Compatibility updated:** `RE-InnerSelf-Merge/Library.js` embeds the exact v1.14 standalone Random Encounters function body. The standalone and bundled Input/Context/Output wrappers carry v1.14 identification while keeping their established logic and third-party sources intact.

## Validation and outstanding checks

**Offline:** 439/439 deterministic checks PASS, including both Libraries, wrapper parsing, source parity, memo-style Entry and quick-command effects. The owner reports their tested v1.14 development features worked in AI Dungeon. The final Popup History Entry formatting amendment was added *after* that owner report and is **not yet native-verified**. A fresh adventure should check the exact visible Entry, initial empty state, timestamp and preservation of newest-first Notes, including with the bundled scripts when feasible.

**Publication boundary:** This release note describes a source update to GitHub `main`, not a GitHub Release/tag or automatically updated AI Dungeon Library item. No historical release or archived branch was modified. Existing warnings about Retry, AI compliance and capped/sliding history remain applicable. See [v1.14 acceptance record](test-reports/2026-11-03-v114-acceptance.md) and [testing guide](testing.md).
