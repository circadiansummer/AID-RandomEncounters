# Random Encounters v1.13 — Main Source Release Notes

**Promoted to `main`:** October 21, 2026 (America/Chicago), by express owner instruction and acceptance.  
**Previous current source:** v1.12, promoted October 14, 2026.  
**Implementation:** Standalone `Library.js` and embedded Random Encounters core in `RE-InnerSelf-Merge/Library.js`. Thin Input/Context/Output scripts are unchanged.  
**Scope:** One default value changes; the version number is updated from `1.12` to `1.13` in both Library files.

## What changed

On a fresh AI Dungeon adventure, Random Encounters automatically creates only the **Config Story Card**. It **does not** create `RAND_01`–`RAND_04` or any other encounter placeholders merely because the adventure started.

| Config setting | v1.13 initial value | Behavior |
| --- | --- | --- |
| `Placeholder Cards to Create` | `4` | Default size of an explicitly requested new placeholder batch |
| `Create Placeholder Cards` | `false` | **No automatic encounter creation** |
| When the creator sets creation to `true` | One-shot command | On the next eligible action, creates the requested quantity, then resets to `false` |

Other established mechanics, including existing encounter cards, manual RAND entries, Act progression, rarity, pacing, duration, generation, settings parsing, retries, and compatibility suspension, are intentionally unchanged. Existing Config Story Cards retain their creator-authored values; this new initial default applies when Config is first generated.

## Creator instructions

1. Install the current v1.13 `Library.js`, `Input.js`, `Context.js`, and `Output.js` into the appropriate AI Dungeon Scenario script sections (or use the approved combined Inner Self/Auto-Cards scripts).
2. Start a new adventure; the script generates **Config** only. You may write custom `RAND_##` cards independently.
3. To make blank placeholders, edit Config: set `Create Placeholder Cards: true` and leave `Placeholder Cards to Create: 4` (or enter another valid amount).
4. Take an ordinary action. The requested numbered placeholders are added and the one-shot creation flag resets. Edit their Entries directly or use the separate Run Encounter Generation feature if desired.

## Verification and owner acceptance

**PASS:** The updated deterministic JavaScript regression suite completed **418/418 checks** with both v1.13 Libraries, six unchanged script wrappers, startup and opt-in cases, and exact embedded-RE-core parity. Parsing passed.

**Owner-confirmed acceptance:** On October 21, 2026, the owner requested promotion of this exact change to `main` and instructed that it be treated as tested and confirmed. The acceptance is recorded separately from automated evidence.

**No new native logs supplied:** An independent fresh AI Dungeon adventure test was **not** executed in this conversation; no new Input/Context/Output live logs accompany this signoff. Previously confirmed behavior outside this change retains its historical evidence.

See [development deterministic report](test-reports/2026-10-21-no-auto-startup-cards.md), [v1.13 owner acceptance](test-reports/2026-10-21-v113-owner-signoff.md), and [current Config reference](../guides/configuration.md).

## Publication boundaries

This release note documents **the owner-authorized v1.13 source on GitHub `main`**. It does not itself create a GitHub tag/Release, update the publicly listed AI Dungeon script, or claim that existing published Scenarios were automatically replaced. Historical `v1.0` tags/archives and v1.12 release notes are unchanged.
