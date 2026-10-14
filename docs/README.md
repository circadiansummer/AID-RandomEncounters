# Random Encounters — Development & Release Documents

These documents preserve release history, implementation details, compatibility evidence, and future plans. The current production target is **v1.12 on `main`**, with v1.1 and v1.0 preserved as historical GitHub releases. The current v1.12 changes include additive placeholder creation, renamed generation controls and **Bypass Situational Awareness** (the earlier Kool-Aid Man Mode). The owner confirmed previously tested features; the v1.12 regression suite passed 406/406, while capped-history behavior remains unverified and plain Retry after partial generation remains inconsistent. GitHub tag/Release publication and AI Dungeon Library distribution are separate steps. For player and creator instructions, see the [User Guides](../guides/README.md).

## Release

- [Changelog](CHANGELOG.md) — Released features, fixes, and version history.
- [v1.12 Release Notes](RELEASE_NOTES_v1.12.md) — current main source, new Config layout, terminology, verification and known limitations.
- [v1.1 Source Release Notes](RELEASE_NOTES_v1.1.md) — historical production source notes.
- [v1.0 Release Notes](https://github.com/circadiansummer/AID-RandomEncounters/blob/archive/v1.0/docs/RELEASE_NOTES.md) — historical release, preserved unchanged.
- [v1.0 Pinned Archive Installer](archive-v1.0.md) — frozen v1.0 Library/Input/Context/Output links (the original release description links to current `main`).
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
