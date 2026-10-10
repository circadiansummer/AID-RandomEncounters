![Random Encounters cover art](https://github.com/circadiansummer/AID-RandomEncounters/blob/main/Neon%20Dungeon%20Encounters%20Card%20Game.png?raw=true)

# Random Encounters

🎲⚔️🃏 **Flexible, RPG-like random events for AI Dungeon — with rarity weights, pacing controls, and Act-based progression.**

---

For days when you don't want to leave *everything* up to the AI, there's **Random Encounters**!

Create a pool of custom events for the script to select and introduce throughout an AI Dungeon adventure. For scenario creators, it's a way to handcraft moments players can experience while leaving the rest of the story open to the AI.

> **Fantasy RPG:** Bandit ambushes, a friendly roadside merchant, a dragon flying overhead, or a magical mishap.
>
> **Slice of life:** A rumor about the player or an NPC, two rivals unexpectedly crossing paths, an inconvenient social event, or a long-lost childhood friend reappearing.

## How it works

Each **Encounter Card** describes an event that *could* happen. After a configurable number of story turns, Random Encounters selects an eligible card and asks the AI to work that event into the adventure.

If the event unfolds successfully, its conclusion is saved under **Outcome** on that card, and the encounter is marked complete. If it doesn't occur, the card returns to the available pool for another chance. Events still unfolding can be checked again later.

After the encounter resolves, Random Encounters resumes its hidden pacing countdown toward the next opportunity.

## Features & customization

### Act progression — control when events become available

Organize Encounter Cards into numbered **Acts**. Act 1 encounters are available at the start; later Acts become accessible as you progress.

- **Required** encounters must complete successfully to advance from the current Act.
- **Optional** encounters do not block progress and remain eligible in later Acts while they're still Available.
- Previously unlocked encounters can also remain in the pool until completed.

Use Acts to build from small quests to higher-stakes situations, reserve a boss fight for a later Act, or create loose sequences of connected story beats. Turn **Display Act & Encounter Map** on in Config to see a read-only overview of the Acts and each encounter's status.

### Rarity, pacing & duration — adjust the rhythm

Each encounter can have its own **Rarity** (Very Common, Common, Rare, or Very Rare) to influence how likely it is to be selected, and **Duration** to adjust how long it stays active before the script checks the outcome.

**Encounter Pacing** controls how frequently new opportunities arise, from Very Fast to Very Slow. Enable **Advanced RE Settings** if you want to edit the underlying intervals, rarity weights, and duration values.

### Populate Placeholder Cards — let the AI suggest events

Need ideas for your adventure? Random Encounters can fill untouched placeholder cards with short, setting-appropriate, low-stakes events. Each generated scenario is kept to **one sentence**; cards you've already customized are not overwritten.

To populate a new set of cards:

1. In **Config**, set **Maximum Encounter Cards** to the number you want.
2. Set **Create Max Encounter Cards** to `true`, then take an in-game action to create any missing cards. (A new adventure starts with four by default.)
3. Set **Populate Placeholder Cards** to `true` and take another in-game action.
4. Follow the on-screen prompts. The script retries unfinished cards automatically and resets the setting when they're all filled.

## Getting started

Install the four files from the [`src` folder](https://github.com/circadiansummer/AID-RandomEncounters/tree/main/src) into their matching AI Dungeon scripting tabs: **Library**, **Input**, **Context**, and **Output**.

For best results, start a new adventure with the current script version; older Story Card layouts are not automatically upgraded. Open the `RAND_##` Encounter Cards, and replace the placeholder text in their **Entry** fields with your own events. Adjust **Act**, **Importance**, **Rarity**, and **Duration** in each card's settings, and use the **Config** card to control overall pacing.

You can also use the in-game commands `/RE help`, `/RE start`, `/RE start #`, `/RE end`, `/RE reset #`, and `/RE reset all` to manage encounters manually.

## Compatibility

**Tested with Inner Self and Auto-Cards.** A combined scripting setup is available in the [Inner Self compatibility folder](https://github.com/circadiansummer/AID-RandomEncounters/tree/main/compatibility-testing/InnerSelf), including merged Library, Input, Context, and Output files.

*With Inner Self or Auto-Cards active, actions such as Populate Placeholder Cards may take additional turns. You can temporarily disable those scripts before populating cards, or leave them enabled and let Random Encounters retry; one combined test completed on its eleventh attempt.*

For more detail, see the [configuration guide](https://github.com/circadiansummer/AID-RandomEncounters/blob/main/docs/configuration.md), [encounter-card guide](https://github.com/circadiansummer/AID-RandomEncounters/blob/main/docs/encounter-cards.md), and [Changelog](https://github.com/circadiansummer/AID-RandomEncounters/blob/main/CHANGELOG.md).
