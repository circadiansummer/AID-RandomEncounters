# Encounter Cards

Encounter cards use Story Card type:

`#RE - Encounters`

## v0.18.9 card metadata

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
- When an Act advances automatically, the player receives a popup such as `RE - Act 1 is complete. Act 2 encounters are now available.`
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


### Reset behavior

`/RE reset all` removes stored Outcome text from every encounter card while preserving each encounter prompt. `/RE reset #` removes stored Outcome text from the selected encounter while preserving its prompt.
