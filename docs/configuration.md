# Configuration

## Current v0.16 terminology

The current released script still uses the v0.16 configuration names. The friendlier Rarity/Duration terminology is planned for v0.17.

### Encounter Pacing

Public presets:

| Preset | Interval |
| --- | --- |
| Very Fast | 6–10 |
| Fast | 6–20 |
| Moderate | 10–30 |
| Slow | 30–50 |
| Very Slow | 30–90 |

Hidden testing preset:

`Debug: 2–2`

### Encounter Weight

| Weight | Numeric weight |
| --- | ---: |
| Very Rare | 1 |
| Rare | 2 |
| Common | 4 |
| Very Common | 8 |

Hidden testing weight:

`Debug: 10000`

### Retirement Length

The current system scales active encounter duration by pacing.

| Retirement | Very Fast | Fast | Moderate | Slow | Very Slow |
| --- | ---: | ---: | ---: | ---: | ---: |
| Very Short | 4 | 7 | 7 | 11 | 14 |
| Short | 7 | 11 | 11 | 18 | 22 |
| Default | 11 | 14 | 18 | 25 | 32 |
| Long | 14 | 22 | 25 | 36 | 47 |
| Very Long | 18 | 29 | 36 | 50 | 65 |

Hidden Retirement `Debug` is fixed at 2.

### Minimum Turn

Encounter cards store the user-facing numeric Minimum Turn directly. Runtime pacing scaling is applied when eligibility is checked.

### Cooldown

v0.16 maintains a separate cooldown after an encounter attempt ends. Removal is planned for v0.17; it remains part of the released v0.16 behavior.
