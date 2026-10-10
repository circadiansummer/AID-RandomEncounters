![Title Card](https://github.com/circadiansummer/AID-RandomEncounters/blob/main/Neon%20Dungeon%20Encounters%20Card%20Game.png?raw=true)

# AID-RandomEncounters

A customizable random encounter system for AI Dungeon.

**Current pre-release testing version:** v0.18.42

The system creates and manages weighted random encounters through Story Cards, supports Acts and progression, tracks encounter lifecycle and Outcomes, stores Outcomes on individual encounter cards, and provides runtime controls without consuming story turns.

## AI Dungeon script layout

Random Encounters has one canonical product build. Files under `compatibility-testing/` are merged test harnesses only, not alternate RE distributions or required compatibility installs.

Install the script in AI Dungeon using the four standard script sections:

- `src/library.js` — main Random Encounter System logic
- `src/input.js` — Input Modifier
- `src/context.js` — Context Modifier
- `src/output.js` — Output Modifier

> v0.18.28 cleared the release-candidate compatibility gate. v0.18.29 completed the final map/history presentation work. v0.18.32 redesigned placeholder population as a dedicated generation turn after the earlier piggyback approach failed live testing; v0.18.36 confirmed the complete player-facing population/retry flow in AI Dungeon, including the request receipt, failed-attempt narrative pass-through, successful generation hijack, success popup, and normal story resumption. v0.18.37 introduced doubled status-line spacing. Inner Self + bundled Auto-Cards testing subsequently confirmed full 4/4 population on generation attempt 11, while Auto-Cards task ownership and normal RE pacing resumption worked. v0.18.38 added a numbered per-attempt popup. v0.18.39 documented potential Inner Self generation delays; v0.18.40 simplifies that Config Notes wording and reduces redundant maintenance writes. v0.18.42 retires the centralized History Story Card and renames the Config category; fresh-game validation is still required.

## Developer smoke tests

Run `node tests/smoke.cjs` from the repository root. This zero-dependency Node test exercises canonical/Inner Self fixture parity, script syntax, Config and Advanced Notes maintenance, generation retries, Auto-Cards deferral, partial generation, success cleanup, and the hijack-line formatting in a mocked AI Dungeon runtime. It supplements but **does not replace** a fresh AI Dungeon adventure for every code change.

The **Config Story Card Notes** use concise `====` section headings and `----` subsection headings to explain each setting, plus the previously requested Inner Self delay warning, encounter lifecycle markers, and `/RE` commands. Longer explanations remain in `docs/configuration.md`.

**Upgrading from v0.18.41 or earlier:** v0.18.42 automatically removes the script-owned History Story Card (identified by `random encounter history`). Its old recent/archive text will be discarded; **copy that card before upgrading if you want to keep those records**. Existing RAND card Outcomes are retained. Unrelated cards named History are not touched.

## Current feature summary

- **Encounter generation:** clean installs ensure `RAND_01` through `RAND_04` by default; generation is controlled by Maximum Encounter Cards and the one-shot Create Max Encounter Cards toggle.
- **Placeholder population:** the one-shot `Populate Placeholder Cards` action dedicates the next eligible model generation to filling untouched placeholder cards with world-relevant, low-stakes, one-sentence encounters. When Inner Self is enabled, generating encounter cards may take more eligible actions; RE keeps retrying until the requested cards are populated. No repeat edit to Config is needed. An `RE - Encounter population in progress.` popup acknowledges the request when queued. Each eligible generation updates it to `RE - Encounter population in progress - Attempt N.`; unfilled cards are retried on later eligible actions without manual edits. Auto-Cards-owned tasks and Retry/regeneration do not increment the attempt count. If the model responds with normal story prose rather than RAND data, that prose stays visible; returned encounter-control data is hidden behind `[RE] Updating Encounter Cards - Hit Continue`, with a double line break before and after. Once all requested cards are filled, the success popup appears and the toggle resets. Custom encounter text, custom titles, and encounter settings are preserved.
- **Number-first titles:** generated defaults use `01 - Encounter Card`, `02 - Encounter Card`, etc.; custom titles are preserved.
- **Weighted selection:** eligible encounters are selected by Rarity weight.
- **Pacing and Duration:** Encounter Pacing controls time between encounter opportunities; Duration controls active encounter length and scales with pacing.
- **Acts and progression:** encounters have Act and Required/Optional Importance; Current Act advances after all Required encounters in that Act complete successfully.
- **Act & Encounter Map:** optional read-only Story Card, controlled by `Display Act & Encounter Map`, groups every encounter by Act and shows its current lifecycle state; disabling the toggle removes the map.
- **Resolution lifecycle:** encounters can occur, remain in progress, or fail to occur. In-progress encounters enter Awaiting Completion at 50% Duration and return to Available after five consecutive incomplete checks.
- **Outcomes:** accepted resolutions are stored under `Outcome:` on the corresponding RAND encounter card. The separate History Story Card and its Context injection are retired.
- **Non-destructive Global Defaults:** changing defaults affects new/reset cards only. The one-shot Restore Encounter Cards to Defaults toggle explicitly applies all four defaults to existing cards.
- **Bulk lifecycle reset:** the one-shot Set All Cards to Available toggle reopens every encounter without changing card settings, Outcomes, or Current Act.
- **Advanced Settings:** optional editable pacing intervals, Rarity weights, and Duration baselines.
- **Retry safety:** Retry/regeneration does not advance the Random Encounter turn or consume active Duration.
- **Runtime commands:** `/RE` commands can enable/disable, force-start, end, and reset encounters without consuming a story turn.
- **User-facing feedback:** player system messages use the `RE - ` prefix; encounter status markers use 📝, 🔄, 💾, and 🗃️.
- **Compatibility hardening:** RE preserves Context `stop`, cooperates with private parenthetical output prefixes, avoids clobbering existing `state.message` toasts where possible, pauses automatically during Auto-Cards generation/compression and Story Arc Engine generation turns, and exposes a generic one-turn external-task pause hook.
- **Compatibility:** current builds migrate supported legacy card/config/runtime formats into the current schema.

Encounter Story Cards use type `#RE - Encounters`. Config, Advanced RE Settings, and Act & Encounter Map use type `#RE - Config`.

## Commands

- `/RE help`
- `/RE on`
- `/RE off`
- `/RE start`
- `/RE start #`
- `/RE end`
- `/RE stop`
- `/RE reset #`
- `/RE reset all`

## Status markers

- 📝 Active
- 🔄 Awaiting Completion
- 💾 Returned to Available
- 🗃️ Completed Successfully

## Documentation

- `docs/configuration.md` — every Config and Advanced setting, one-shot toggles, commands, pacing, Rarity, and Duration
- `docs/encounter-cards.md` — encounter card format, lifecycle, Outcomes, progression, and reset behavior
- `docs/architecture.md` — Input/Context/Output flow, runtime state, selection, compatibility, and intentional complexity
- `docs/testing.md` — current validation targets and regression coverage
- `docs/compatibility.md` — cross-script compatibility audit, known risks, and integration recommendations
- `CHANGELOG.md` — version history; older entries describe behavior at that historical version and may be superseded by later entries
- `ROADMAP.md` — unreleased future work only

## Repository policy

Confirmed releases and patches should update source and documentation together. Planned features remain in the Roadmap until explicitly implemented.


### v0.18.28 live validation

v0.18.28 passed fresh-game compatibility testing with Inner Self + Auto-Cards + Random Encounters, plus a low-conflict Living Meters coexistence control. The RC compatibility gate is cleared; Story Arc Engine live validation remains optional.
