# Encounter Cards

Encounter cards use Story Card type:

`#RE - Encounters`

## v0.17 card metadata

```text
============== ENCOUNTER STATE ==============

- Status: Available
- Encounter Number: 1


============ ENCOUNTER SETTINGS ============

---------- BEHAVIOR ----------

- Rarity: Common
- Duration: Default
- Minimum Turn: 0
```

Rarity and Duration are the v0.17 user-facing names for the former Encounter Weight and Retirement Length fields.

Minimum Turn remains temporarily present for compatibility with the existing eligibility system.

States and output markers:

- 📝 Activated — the encounter has been selected and is active.
- 🔄 Awaiting Completion — reserved for the planned in-progress resolution/requeue path.
- 💾 Returned to Available Pool — the encounter did not complete and becomes Available again.
- 🗃️ Completed Successfully — the encounter occurred successfully and is retired.

Encounter Entries should contain only encounter content. The Library supplies activation and persistence instructions.

## Outcome behavior

Successful occurrence:

```text
Outcome:
The encounter occurred: <summary>.
```

Non-occurrence:

```text
Outcome:
The encounter did not occur: <explanation>.
```

Only successful occurrences are added to Random Encounter History.
