# Encounter Cards

Encounter cards use Story Card type:

`#RE - Encounters`

## v0.16 card metadata

```text
Random Encounter Settings
- Retirement Length: Default
- Encounter Weight: Common
- Minimum Turn: 2

Random Encounter System
- Status: Available
- Encounter Number: 1
```

States:

- Available — selectable; no title icon.
- Active — title prefixed with 📝.
- Retired — title prefixed with 🗃️ after a successful occurrence.
- Restored — not a persistent card state; 💾 is shown when a failed/non-occurring encounter returns to Available.

Encounter Entries should contain only encounter content. The Library supplies activation and persistence instructions.

## Outcome behavior

After resolution, the script appends or replaces an `Outcome:` section in the encounter Entry.

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
