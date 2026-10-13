# v1.1 production promotion and v1.0 archive — release handoff

## Latest explicit owner publication instruction

**October 12, 2026:** The owner explicitly instructed: “Archive 1.0 and upgrade 1.1 to main and publish to production.” This authorizes the requested *release operations*, but does not supply fresh AI Dungeon test observations and must not be misrepresented as a passing live test. v1.0 is already archived as its intact historical tagged release. Production PR #4 is mergeable; 389/389 offline checks PASS on the exact consolidated v1.1 source.

**Blocking evidence/tool limits at this handoff:** the native ASAP first-eligible behavior and 📜/🔒 category UI refresh have not been reported on the final candidate; capped/sliding history is unverified; plain Retry after partial population is inconsistent. The connected GitHub connector does not provide tag-creation or Release-publication actions. Therefore production main, v1.1 tag, and public GitHub Release remain unmodified until an authorized release path can finish and report accurately. No live acceptance is invented. The owner request is retained to prevent unnecessary repeated approval requests once gates are addressed.


**Date:** October 12, 2026. **Owner request:** Archive 1.0; promote 1.1 to main; publish production. **Status:** PARTIAL — development consolidated; production not published.

## Verified repository state

- Existing [v1.0 release](https://github.com/circadiansummer/AID-RandomEncounters/releases/tag/v1.0) remains published as the historical archive. Keep its tag, release assets and content unchanged.
- Original [integration PR #3](https://github.com/circadiansummer/AID-RandomEncounters/pull/3) merged into `develop/v1.1` at `d4048a22775af12b3adf14740fdd6a154c0f77b1`.
- Two main-only commits (`a72ff18b` stable v1.0 restoration and `a80db57f` README cleanup) were reconciled with a history-preserving two-parent merge, `9392b9594328eb887ebcf5352d6a8c68b6cfc822`. The v1.1 file tree was deliberately retained to reverse the temporary v1.0 rollback while preserving both main commits as ancestors. No force-push or rewrite of main or v1.0 release.
- [Production PR #4](https://github.com/circadiansummer/AID-RandomEncounters/pull/4) is **draft**, targeting `main` from `develop/v1.1`. The post-reconciliation comparison is ahead-only (no main commits behind), and the PR later reported mergeable. Do not merge until remaining gates.
- Latest source: `Importance: ASAP`, Act category 📜/🔒 suffixes; 389/389 deterministic checks PASS on consolidated branch. All six wrappers parse, canonical/combined Libraries match. Human test script source manifest: [verified exact files](2026-10-12-human-test-source-manifest.md).

## Production gates not yet met

1. **Native final-feature test: NOT RUN / not provided.** Confirm ASAP at first eligible action despite slow pacing, Act lock/unlock category label changes in the actual AI Dungeon editor, and automatic status refresh after Required/ASAP encounter resolution. Record configuration, action type and modifier logs for a failure. Creator metadata preservation is covered offline but can be smoke-tested natively.
2. **Residual beta risk decision:** Sliding/capped history Continue detection remains unobserved; partial placeholder-generation plain Retry sometimes stalls. Disclose them explicitly even if owner elects to release with known limits.
3. **Production documentation:** Upon acceptance, change root `README.md` and `RE-InnerSelf-Merge/README.md` to reference v1.1 as the current public release, make current user links point to main v1.1, promote [draft release notes](../RELEASE_NOTES_v1.1_DRAFT.md), update changelog and version history; preserve historical v1.0 records and bundled MIT notices.
4. **Merge and package:** Rerun `node docs/tests/smoke.cjs` on the exact release commit. Merge PR #4 (no force push), verify `main` points to v1.1 source and README. Create annotated `v1.1` tag targeting the approved main commit and publish a GitHub Release marked latest/stable. Keep v1.0 accessible.
5. **AI Dungeon publication (if desired) is separate:** GitHub main/tag/release do not update installed adventures or publish a script in the AI Dungeon Library. No AI Dungeon publishing action was available/authorized via the existing connection.

## Connector limitation

The connected GitHub tooling used in this review supports branches, file commits, PR merges and review updates but **does not expose a create-tag or publish-release action**. Accordingly **no GitHub v1.1 tag or release has been created**, even though the owner requested publication. The final tag/release steps require GitHub UI, an authorized separate GitHub workflow, or another connection that exposes those actions. Do not mislabel an ordinary development commit or draft PR as a completed production release.

## Important boundaries

The original 355-check native signoff predates the new ASAP scheduling and emoji category features. A 389/389 mocked suite is not native acceptance. Never merge to main or claim stable/public release solely because this development check is green. Existing `v1.0` release and main are unchanged as of this report.
