# Random Encounters — Development & Release Documents

These documents preserve release history, implementation details, compatibility evidence, and future plans. The v1.1 source is promoted to `main`, with `develop/v1.1` retained for development history. The historical v1.0 tag/release and `archive/v1.0` branch are preserved. Final v1.1 native ASAP/category UI acceptance remains pending; do not describe it as verified. Production promotion is staged in draft PR #4 pending native acceptance and GitHub tag/release publication. For player and creator instructions, see the [User Guides](../guides/README.md).

## Release

- [Changelog](CHANGELOG.md) — Released features, fixes, and version history.
- [v1.1 Source Release Notes](RELEASE_NOTES_v1.1.md) — current main source, features, verification status and known limitations.
- [v1.0 Release Notes](https://github.com/circadiansummer/AID-RandomEncounters/blob/archive/v1.0/docs/RELEASE_NOTES.md) — historical release, preserved unchanged.
- [v1.1 Draft Release Notes](RELEASE_NOTES_v1.1_DRAFT.md) — original review candidate document, retained as history.
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
