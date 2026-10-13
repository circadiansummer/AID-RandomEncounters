# Random Encounters v1.1 — source manifest for human testing

**Prepared:** October 12, 2026. **Repository:** `circadiansummer/AID-RandomEncounters`. **Target:** draft [PR #3](https://github.com/circadiansummer/AID-RandomEncounters/pull/3), branch `review/v1.1-integration`.

**Immutable v1.1 executable source snapshot:** `63e51803a88d755a1dfe1c17572cf4bb6f84280d`. All eight section files below were fetched directly from this commit and verified. This manifest and other documentation may be committed after the snapshot; that does not change these pinned executable files.

## Exact AI Dungeon script sections

| Install variant | AI Dungeon section | Pin to this file | GitHub blob SHA |
| --- | --- | --- | --- |
| Standalone | Library | [`Library.js`](https://github.com/circadiansummer/AID-RandomEncounters/blob/63e51803a88d755a1dfe1c17572cf4bb6f84280d/Library.js) | `72fe75b3da503a9bf7e96b8de8b74e8dc6a2957e` |
| Standalone | Input | [`Input.js`](https://github.com/circadiansummer/AID-RandomEncounters/blob/63e51803a88d755a1dfe1c17572cf4bb6f84280d/Input.js) | `78b1efc7108677ce7d24ebeacaf0ba7d34b2cbff` |
| Standalone | Context | [`Context.js`](https://github.com/circadiansummer/AID-RandomEncounters/blob/63e51803a88d755a1dfe1c17572cf4bb6f84280d/Context.js) | `569ee368822396687774cfd82aa10e9886f90a8d` |
| Standalone | Output | [`Output.js`](https://github.com/circadiansummer/AID-RandomEncounters/blob/63e51803a88d755a1dfe1c17572cf4bb6f84280d/Output.js) | `3515bb47c29c4258b0172b8196b2f0bbcd8f5043` |
| Combined Inner Self/Auto-Cards | Library | [`RE-InnerSelf-Merge/Library.js`](https://github.com/circadiansummer/AID-RandomEncounters/blob/63e51803a88d755a1dfe1c17572cf4bb6f84280d/RE-InnerSelf-Merge/Library.js) | `62f5e1f405ead6b063b74b0193b633d225222573` |
| Combined Inner Self/Auto-Cards | Input | [`RE-InnerSelf-Merge/Input.js`](https://github.com/circadiansummer/AID-RandomEncounters/blob/63e51803a88d755a1dfe1c17572cf4bb6f84280d/RE-InnerSelf-Merge/Input.js) | `83821055186b24c36f5704e1917e1855028403e2` |
| Combined Inner Self/Auto-Cards | Context | [`RE-InnerSelf-Merge/Context.js`](https://github.com/circadiansummer/AID-RandomEncounters/blob/63e51803a88d755a1dfe1c17572cf4bb6f84280d/RE-InnerSelf-Merge/Context.js) | `dfd3e4baa000ad22b857635b60096876436e07e2` |
| Combined Inner Self/Auto-Cards | Output | [`RE-InnerSelf-Merge/Output.js`](https://github.com/circadiansummer/AID-RandomEncounters/blob/63e51803a88d755a1dfe1c17572cf4bb6f84280d/RE-InnerSelf-Merge/Output.js) | `3929a1c9dd40a8f7257ede372005b6f71de46f20` |

Choose exactly **one** installation variant:

- **Standalone RE:** Copy the four root files (`Library.js`, `Input.js`, `Context.js`, `Output.js`) into their corresponding AI Dungeon script sections.
- **RE + Inner Self + Auto-Cards:** Copy all four files from `RE-InnerSelf-Merge/` into their corresponding sections. The merged Library contains RE plus its included integration code. **Do not mix the root Library with merged Input/Context/Output** or install both variants together.

Start an entirely **new private adventure** for each materially changed live-test configuration. Existing adventures may retain older script installations; a GitHub commit does **not** update installed Adventure/Scenario scripts. Verify the Library reports **1.1 (pre-release)**, Config omits `Display Act & Encounter Map`, and new encounter Notes contain `Importance: Required` and `Rarity: Common` (but neither `Rarity: ASAP` nor `Force ASAP`). For ASAP tests, edit **Importance**, not Rarity. Category names should show `  📜` or `  🔒` and change as Acts unlock.

## Verification status (same source snapshot)

- **PASS — deterministic JavaScript harness:** 389/389 assertions by executing `docs/tests/smoke.cjs` with the repository's nine source/script files; canonical standalone/merged RE code parity PASS; syntax of both Libraries and all six wrappers PASS.
- **NOT RUN — new native human acceptance:** `Importance: ASAP` triggering at earliest eligible turn despite Slow pacing; Act lock/unlock, multiple ASAP tie order, First Encounter Turn, Active/pending-resolution deferrals; visibly updating category `  🔒` to `  📜`; retired Act Map cleanup and creator edits.
- **Earlier native evidence:** The October 12 [final signoff report](2026-10-12-final-native-signoff.md) covers the **previous** 355-check code, not this changed ASAP scheduler. Its capped/sliding-history and plain generation Retry limitations remain open.

See [testing guide](../testing.md) and [creator configuration guide](../../guides/configuration.md). Record any failed action with the exact test config, action type, current turn, RAND Notes/Entry, and Input/Context/Output logs. Do not treat a model's prose choice as proof of a script selection failure.

## Publication boundaries

The branch and PR remain **unreleased**. Do not merge to `develop/v1.1` or `main`, modify either protected root README, create a tag, publish a beta/release, or close issue #1 without separate owner authorization. Approval of human testing is not release approval.
