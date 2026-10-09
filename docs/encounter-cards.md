# Encounter Cards

Encounter cards use Story Card type:

`#RE - Encounters`

## v0.18.3 card metadata

```text
============== ENCOUNTER STATE ==============

- Status: Available
- Encounter Number: 1


============ ENCOUNTER SETTINGS ============

--------- PROGRESSION ---------

- Act: 1
- Importance: Required

---------- BEHAVIOR ----------

- Rarity: Common
- Duration: Default
```

All four editable fields have matching entries in Config GLOBAL DEFAULTS. Changing a Global Default overwrites that field on all discovered encounter cards.

### Progression

- `Act` starts at 1.
- `Importance` is either `Required` or `Optional`; new or migrated encounters default to `Required` when no explicit value is present.
- An encounter is eligible when `Act <= Current Act` and Status is Available.
- All Required encounters in the Current Act must complete successfully before Current Act advances.
- Optional encounters never block progression and remain eligible after later Acts unlock if they have not completed.

### Resolution states

- 📝 Activated — selected and active.
- 🔄 Awaiting Completion — meaningfully begun but incomplete; requeued at 50% of normal Duration.
- 💾 Returned to Available Pool — did not occur, was manually displaced before completion, or hit five consecutive Awaiting Completion checks.
- 🗃️ Completed Successfully — occurred successfully and retired.

Resolution forms:

```text
The encounter occurred: <summary>.
The encounter is in progress: <summary of progress and unresolved core parts>.
The encounter did not occur: <explanation>.
```

Only successful occurrences are added to Random Encounter History.
