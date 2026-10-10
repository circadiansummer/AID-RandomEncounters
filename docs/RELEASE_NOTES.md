# Random Encounters v1.0 — Release Notes

**Release date:** October 10, 2026  
**Platform:** AI Dungeon  
**Release:** First stable version

## Overview

Random Encounters adds creator-authored or AI-suggested events to AI Dungeon adventures with configurable pacing, rarity, duration and Act progression. Events are incorporated into the AI-generated story as opportunities arise, and their results are saved on each encounter's Story Card.

## Features

- Weighted rarity, configurable pacing and per-encounter Duration
- Acts with Required/Optional progression gating and an optional Act & Encounter Map
- One-sentence AI generation of untouched placeholder cards, with automatic retry
- Per-card Outcome recording; success retires an encounter, unsuccessful encounters can return to the pool
- Advanced RE Settings and one-shot card creation/reset controls
- Manual `/RE` commands, including the live-verified read-only `/RE status` popup
- Standalone four-part script files at the repository root; combined Inner Self/Auto-Cards harness in `InnerSelf/RE/`

## Validation

- The user confirmed the actual AI Dungeon encounter narration and resolution are satisfactory, and separately confirmed the `/RE status` popup works.
- Earlier live standalone tests verified placeholder generation and story continuation. The Inner Self/Auto-Cards test confirmed eventual full four-card population and correct deferral during third-party model turns.
- Final automated checks: **156/156 passed**, including all six standalone/combined modifier wrappers and byte-for-byte RE Library parity.

## Installation

For a standard adventure, use the root [Library.js](https://github.com/circadiansummer/AID-RandomEncounters/blob/main/Library.js), [Input.js](https://github.com/circadiansummer/AID-RandomEncounters/blob/main/Input.js), [Context.js](https://github.com/circadiansummer/AID-RandomEncounters/blob/main/Context.js) and [Output.js](https://github.com/circadiansummer/AID-RandomEncounters/blob/main/Output.js). Start a **new adventure**; older encounter/configuration formats are not migrated automatically.

For combined Inner Self + Auto-Cards use, install the four matching files from [InnerSelf/RE](https://github.com/circadiansummer/AID-RandomEncounters/tree/main/InnerSelf/RE), not both sets.

## Scope

No gameplay algorithm changes were introduced solely for the v1.0 promotion or file relocation. Model narration depends on the active AI model and scene context. Story Arc Engine integration and encounter chaining/groups are not part of the v1.0 support contract.

See [README](https://github.com/circadiansummer/AID-RandomEncounters/blob/main/README.md), [Guides](https://github.com/circadiansummer/AID-RandomEncounters/tree/main/guides), [Configuration](https://github.com/circadiansummer/AID-RandomEncounters/blob/main/guides/configuration.md), [Changelog](https://github.com/circadiansummer/AID-RandomEncounters/blob/main/docs/CHANGELOG.md) and [Roadmap](https://github.com/circadiansummer/AID-RandomEncounters/blob/main/docs/ROADMAP.md).
