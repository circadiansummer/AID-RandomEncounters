# Random Encounters — Development & Release Documents

These documents preserve release history, implementation details, compatibility evidence, and future plans. The integrated v1.1 candidate is consolidated on `develop/v1.1` but remains unreleased; v1.0 remains the latest stable release. Production promotion is staged in draft PR #4 pending native acceptance and GitHub tag/release publication. For player and creator instructions, see the [User Guides](../guides/README.md).

## Release

- [Changelog](CHANGELOG.md) — Released features, fixes, and version history.
- [Release Notes](RELEASE_NOTES.md) — v1.0 historical release.
- [v1.1 Draft Release Notes](RELEASE_NOTES_v1.1_DRAFT.md) — candidate features and known limits (not yet published).
- [v1.1 Promotion Handoff](test-reports/2026-10-12-v11-promotion-handoff.md) — source, branch reconciliation, and remaining production gates.
- [Roadmap](ROADMAP.md) — Potential features and other work deferred beyond the initial release.

## Engineering

- [Architecture](architecture.md) — Internal design and state management.
- [Compatibility](compatibility.md) — Inner Self, Auto-Cards, and integration audit.
- [Testing](testing.md) — Automated verification, live acceptance, and historical test records.
- [Regression suite](tests/smoke.cjs) — Dependency-free Node smoke tests (`node docs/tests/smoke.cjs` from the repository root).

For the current standalone script, see the [repository README](../README.md).

## Assets

- [Random Encounters cover](assets/Neon%20Dungeon%20Encounters%20Card%20Game.png) — Artwork for the scenario and repository.
