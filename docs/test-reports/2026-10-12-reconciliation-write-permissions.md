# RE v1.1 integration reconciliation — October 12, 2026

## Provenance and outcome

Approved branch: `review/v1.1-integration`, draft PR #3. Starting HEAD: `7fa78606b811b344014260f259e2bd1241adcbb4`. The existing local `develop/v1.1` checkout, its unpushed report commit, original e4d8b29 baseline, 328-check candidate, patch files, evidence and archive remain preserved. A separate archive-based working directory was used for reconciliation; no main-branch source was accessed.

Original PR suite: **PASS 318/318** under Node v24.19.0. Reconciled suite: **PASS 347/347**, including both Library syntax checks, six wrapper syntax checks and canonical/embedded source parity. Run `node docs/tests/smoke.cjs` from this branch.

## Reconciliation

- Retained PR Config layout, blank default Theme, whitespace-safe one-shot reset and quoted-punctuation enhancement.
- Restored all 26 original candidate regression assertions alongside the PR's tests; adjusted only their setup for the approved blank Theme default.
- Restored the exact previously live-tested combined Input wrapper, including its whitespace-tolerant Auto-Cards command intent matcher and placement of the existing pause hook.
- Retry detector and queued-generation logic are behaviorally equivalent for the original covered sequences. The reconstruction adds diagnostic log wording; no new turn-identification scheme was introduced.
- Fixed a confirmed parser index mismatch: sentence matching uses `quoteSafe`, but trailing-text validation used the differently sized `protectedSource`. `A clerk asks, "Coming?" before pointing to the auditorium. Go.` was incorrectly accepted as one sentence. The added regression fails before the one-line correction and passes afterward. Longer uppercase and lowercase additional-sentence negatives also pass. The heuristic still accepts semantic fragments such as `A stranger.`.
- Updated AGENTS with the owner's explicit limited-write permissions. This repository rule records the Basic Scripting workflow principle; it does not imply that other repositories or external copies of the operating guide were edited.

## Live evidence and remaining gates

The previous 328-check local candidate has actual targeted AI Dungeon evidence recorded in the [original report](2026-10-12-retry-fix-review-handoff.md). That evidence is historical and does **not** verify the exact newly reconciled source.

**NOT RUN for this integrated build:** fresh Config UI/default/edit-preservation checks; combined real partial generation → Retry → completion; capped/sliding-history Continue; Erase/backtracking and earlier alternatives. Those remain required live gates. No claim of live model behavior is based on mocks. Issue #1 stays open; no release readiness approval is given.

## Backups and safeguards

All original PR files were copied before editing to `integration-backup-7fa7860/` inside the local integration workspace. Original and expanded-before-fix logs plus final 347-check output are retained beside it. Root README and merged README are unchanged. No merge, tag, public release, subscription change, scenario/adventure deletion or publication occurred.

## Next steps

Install this exact integrated source into fresh private AI Dungeon tests and finish the handoff's remaining native gates. Avoid inventing a new turn detector until real hook metadata demonstrates how Retry differs from fixed-window Continue. Keep the draft open until the owner reviews evidence and authorizes any merge/release.
