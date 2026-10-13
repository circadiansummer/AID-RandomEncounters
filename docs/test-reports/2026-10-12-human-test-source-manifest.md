# Random Encounters v1.1 — source manifest for human testing

**Prepared:** October 12, 2026. **Repository:** `circadiansummer/AID-RandomEncounters`. **Target:** draft [PR #3](https://github.com/circadiansummer/AID-RandomEncounters/pull/3), branch `review/v1.1-integration`.

**Immutable v1.1 executable source snapshot:** `008fe3a09237015c78714dd44fe3490ea1208e00`. All eight section files below were fetched directly from this commit and verified. This manifest and other documentation may be committed after the snapshot; that does not change these pinned executable files.

## Exact AI Dungeon script sections

| Install variant | AI Dungeon section | Pin to this file | GitHub blob SHA |
| --- | --- | --- | --- |
| Standalone | Library | [`Library.js`](https://github.com/circadiansummer/AID-RandomEncounters/blob/008fe3a09237015c78714dd44fe3490ea1208e00/Library.js) | `940d09231be1749ac3e1d36d7a784c52abecd4e1` |
| Standalone | Input | [`Input.js`](https://github.com/circadiansummer/AID-RandomEncounters/blob/008fe3a09237015c78714dd44fe3490ea1208e00/Input.js) | `78b1efc7108677ce7d24ebeacaf0ba7d34b2cbff` |
| Standalone | Context | [`Context.js`](https://github.com/circadiansummer/AID-RandomEncounters/blob/008fe3a09237015c78714dd44fe3490ea1208e00/Context.js) | `569ee368822396687774cfd82aa10e9886f90a8d` |
| Standalone | Output | [`Output.js`](https://github.com/circadiansummer/AID-RandomEncounters/blob/008fe3a09237015c78714dd44fe3490ea1208e00/Output.js) | `3515bb47c29c4258b0172b8196b2f0bbcd8f5043` |
| Combined Inner Self/Auto-Cards | Library | [`RE-InnerSelf-Merge/Library.js`](https://github.com/circadiansummer/AID-RandomEncounters/blob/008fe3a09237015c78714dd44fe3490ea1208e00/RE-InnerSelf-Merge/Library.js) | `e87aae792cf5436022365e8fc1fe3898b446877a` |
| Combined Inner Self/Auto-Cards | Input | [`RE-InnerSelf-Merge/Input.js`](https://github.com/circadiansummer/AID-RandomEncounters/blob/008fe3a09237015c78714dd44fe3490ea1208e00/RE-InnerSelf-Merge/Input.js) | `83821055186b24c36f5704e1917e1855028403e2` |
| Combined Inner Self/Auto-Cards | Context | [`RE-InnerSelf-Merge/Context.js`](https://github.com/circadiansummer/AID-RandomEncounters/blob/008fe3a09237015c78714dd44fe3490ea1208e00/RE-InnerSelf-Merge/Context.js) | `dfd3e4baa000ad22b857635b60096876436e07e2` |
| Combined Inner Self/Auto-Cards | Output | [`RE-InnerSelf-Merge/Output.js`](https://github.com/circadiansummer/AID-RandomEncounters/blob/008fe3a09237015c78714dd44fe3490ea1208e00/RE-InnerSelf-Merge/Output.js) | `3929a1c9dd40a8f7257ede372005b6f71de46f20` |

Choose exactly **one** installation variant:

- **Standalone RE:** Copy the four root files (`Library.js`, `Input.js`, `Context.js`, `Output.js`) into their corresponding AI Dungeon script sections.
- **RE + Inner Self + Auto-Cards:** Copy all four files from `RE-InnerSelf-Merge/` into their corresponding sections. The merged Library contains RE plus its included integration code. **Do not mix the root Library with merged Input/Context/Output** or install both variants together.

Start an entirely **new private adventure** for each materially changed live-test configuration. Existing adventures may retain older script installations; a GitHub commit does **not** update installed Adventure/Scenario scripts. Verify the Library comment and runtime VERSION report **1.1 (pre-release)**, then verify Config has no `Display Act & Encounter Map` and new encounter Notes have `Rarity: Common` but **no** `Force ASAP` field.

## Verification status (same source snapshot)

- **PASS — deterministic JavaScript harness:** 376/376 assertions by executing `docs/tests/smoke.cjs` with the repository's nine source/script files; canonical standalone/merged RE code parity PASS; syntax of both Libraries and all six wrappers PASS.
- **NOT RUN — new native human acceptance:** ASAP triggering at earliest eligible turn despite a Slow countdown; Act lock/unlock, multiple ASAP tie order, First Encounter Turn, Active/pending-resolution deferrals; retired Act Map cleanup and creator edits.
- **Earlier native evidence:** The October 12 [final signoff report](2026-10-12-final-native-signoff.md) covers the **previous** 355-check code, not this changed ASAP scheduler. Its capped/sliding-history and plain generation Retry limitations remain open.

See [testing guide](../testing.md) and [creator configuration guide](../../guides/configuration.md). Record any failed action with the exact test config, action type, current turn, RAND Notes/Entry, and Input/Context/Output logs. Do not treat a model's prose choice as proof of a script selection failure.

## Publication boundaries

The branch and PR remain **unreleased**. Do not merge to `develop/v1.1` or `main`, modify either protected root README, create a tag, publish a beta/release, or close issue #1 without separate owner authorization. Approval of human testing is not release approval.
