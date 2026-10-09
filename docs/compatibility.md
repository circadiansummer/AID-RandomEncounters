# Compatibility

This document records the v0.18.29 compatibility design and audit for Random Encounters.

Compatibility claims distinguish source/harness coverage from live AI Dungeon validation. The v0.18.28 release-candidate compatibility gate is cleared by live Inner Self, Auto-Cards, and general-coexistence testing; Story Arc Engine remains optional/unverified live.

## Compatibility priorities for the release candidate

1. Inner Self
2. Auto-Cards
3. General script compatibility
4. Story Arc Engine — nice to have

### Load-order principle

Compatibility must not assume the player can choose script load or execution order. Recommended ordering is guidance only unless AI Dungeon guarantees that ordering mechanism.

For each integration where order could matter:
- test both plausible orders when practical
- prefer RE-side behavior that is safe in either order
- classify an integration as order-sensitive if only one ordering is reliable
- do not present a hand-authored merged wrapper as proof that arbitrary end-user installs will behave identically

## Compatibility model

Random Encounters is isolated at the data layer:

- persistent state lives under `state.randomEncounters`
- RE Story Cards use dedicated `#RE - ...` types and RE-specific keys
- the Library exposes one top-level function: `RandomEncounters(...)`
- runtime commands are namespaced under `/RE`

The remaining compatibility problems are about shared AI Dungeon surfaces:

- modifier order
- Context `stop`
- multiple scripts writing `state.message`
- multiple scripts injecting instructions into the same model turn
- temporary non-story AI tasks
- strict output prefixes/formats

## Canonical-build compatibility rule

Random Encounters has one canonical product build: `src/library.js` plus the normal standalone Input/Context/Output wrappers.

Files under `compatibility-testing/` are merged test harnesses used to reproduce multi-script environments. They are not alternate RE builds and should never be required for ordinary end users.

AI Dungeon provides one Input, Context, and Output modifier surface per Scenario. When creators combine scripts, they must compose the participating script calls inside one outer `modifier(text)`; they should not paste multiple complete modifiers into the same tab.

The compatibility target is therefore:

1. keep the canonical RE library safe around popular scripts without requiring RE-specific forks
2. concentrate generic coexistence behavior inside RE itself whenever RE can detect the condition reliably
3. keep RE's standalone wrappers minimal and free of dependencies on variables RE does not use
4. use target-specific wrapper logic only in test fixtures or when an external script's public API explicitly requires composition behavior RE cannot infer internally
5. document genuinely unavoidable order-sensitive conflicts instead of presenting a special compatibility build as the solution

The standalone RE Context wrapper is always the same one-line delegation to `RandomEncountersContext(text)`. The canonical library safely detects whether a Context `stop` flag exists, preserves its value in the returned modifier object, and skips RE Context processing when that flag is true.

## Inner Self

### Current source/harness status

**High-priority compatibility hardening implemented and live combined validation passed.**

No state or Story Card identifier collision was found.

v0.18.21 added three protections for Inner Self-style behavior:

- RE encounter/resolution prompts explicitly preserve a required private control prefix before story prose
- RE resolution capture accepts one leading parenthetical private-control operation before the classifier sentence
- RE status markers are placed after such a prefix, never before it

This matters because Inner Self can require output to begin with a parenthetical brain operation.

RE also now posts `state.message` cooperatively: when another script has already supplied a different toast, RE appends its own message rather than blindly replacing it; on a later RE-only event it replaces its own previous combined snapshot instead of accumulating stale messages.

### Example combined hook composition

Input:

```js
InnerSelf("input");

const modifier = (text) => {
  text = RandomEncounters("input", text);
  return { text };
};

modifier(text);
```

Context:

```js
InnerSelf("context");

const modifier = (text) => RandomEncountersContext(text);

modifier(text);
```

Inner Self remains responsible for establishing its own `stop` value. The unchanged canonical RE adapter detects and preserves that value inside the library.

Output:

```js
InnerSelf("output");

const modifier = (text) => {
  text = RandomEncounters("output", text);
  return { text };
};

modifier(text);
```

This lets Inner Self establish/consume its private thought protocol first, while RE operates on the resulting story-facing content.

**v0.18.28 live result: PASS.** Fresh-game testing with Inner Self + Auto-Cards confirmed that stale startup toasts are no longer merged into the first RE command popup while same-turn cooperation remains available.

v0.18.28 updates shared-toast ownership tracking. RE snapshots the completed `state.message` value at the end of Output so a toast left over from a prior completed turn is treated as stale on the next RE message, while a toast created by another script during the same Output pass is still preserved.

v0.18.27 changes resolution recognition so a pending RE resolution is keyed by the three fixed classifier phrases rather than by strict full-sentence placement/format validation. This is intended to tolerate Inner Self formatting/control material while still limiting special parsing to turns where RE already has a pending resolution.

**v0.18.28 Inner Self live result: PASS.** Fresh-game combined testing confirmed Active encounter progression during Inner Self thought-bearing turns and successful RE resolution classification/cleanup in the combined environment. The tested in-progress resolution moved correctly into Awaiting Completion.

### Inner Self live validation status

Completed live:
- Inner Self thought-bearing turns while RE is Active
- RE resolution classification in the combined Inner Self environment
- shared-toast behavior with bundled Auto-Cards

Still useful as focused edge-case checks, but no longer blocking the main Inner Self gate:
- RE command while an NPC would otherwise trigger Inner Self
- deliberately synchronized Inner Self/Auto-Cards + RE toast event

## Auto-Cards

### Current source/harness status

**Automatic task ownership implemented; 13/13 focused RE harness checks and live combined validation passed.**

RE recognizes two Auto-Cards task forms:

- standalone Auto-Cards: non-empty generation workpiece or active compression title
- Inner Self-bundled Auto-Cards: `state.InnerSelf.AC.event === true`

During an Auto-Cards-owned model turn, RE:

- does not increment its turn
- does not advance pacing
- does not consume Active Duration
- does not inject a queued encounter
- does not inject Active reminders
- does not inject History
- does not inject a pending resolution request
- does not capture Auto-Cards output as an RE classifier
- synchronizes its turn-detection high-water marks so the same action is not counted later

Pending RE work simply waits for the next normal story turn.

### Example combined Auto-Cards composition

Input:

```js
const modifier = (text) => {
  text = AutoCards("input", text);
  text = RandomEncounters("input", text);
  return { text };
};

modifier(text);
```

Context:

```js
const modifier = (text) => {
  [text, stop] = AutoCards("context", text, stop);
  return RandomEncountersContext(text);
};

modifier(text);
```

Auto-Cards owns its `stop` decision; the same canonical RE adapter preserves it and suppresses RE processing when stopped.

Output:

```js
const modifier = (text) => {
  text = AutoCards("output", text);
  text = RandomEncounters("output", text);
  return { text };
};

modifier(text);
```

When Auto-Cards is enabled through Inner Self, use the Inner Self composition above; Inner Self coordinates its bundled Auto-Cards calls internally.

**v0.18.28 Auto-Cards live result: PASS.** Fresh-game combined testing confirmed queued, Active, and pending-resolution RE states all survive Auto-Cards-owned generation turns without premature injection, Duration loss, classifier capture, or phantom RE turns. Manual-ended in-progress resolution also correctly returned the encounter to Available.

### Auto-Cards live validation status

Completed live:
- normal story turns with both systems installed
- forced Auto-Cards card-generation turns
- pending RE resolution across an Auto-Cards task
- queued and Active RE encounters across Auto-Cards tasks
- shared-toast behavior from v0.18.28

Still useful but not yet separately exercised live:
- memory-compression ownership path

## General compatibility

### Context stop

The canonical RE Context file never contains compatibility-specific `stop` logic:

```js
const modifier = (text) => RandomEncountersContext(text);

modifier(text);
```

`RandomEncountersContext()` lives in the canonical library. It safely treats an absent `stop` binding as `false`, preserves an existing stop value in the modifier return object, and lets the core Context path skip RE processing when `stop === true`.

This keeps one RE Context wrapper across standalone and multi-script environments. Scripts that expose a shared stop flag do not require an alternate RE Context file.

Where practical, RE also detects non-story model work from shared runtime state so common integrations do not depend solely on wrapper order.

### Generic one-turn external task contract

A script/integration can explicitly tell RE that the current model turn belongs to another worker:

```js
RandomEncounters("pause", "My Script");
text = RandomEncounters("context", text);
```

Aliases `external task` and `external-task` are also accepted.

The request is one-shot. RE consumes the current action for its own high-water bookkeeping but does not advance its turn/pacing/Duration or inject/capture anything. The following normal story turn proceeds normally.

This is the preferred integration mechanism for future scripts that temporarily use the model for metadata, summaries, planning, or other non-story work but do not expose a known state signature.

### Shared state.message

RE tracks the last toast value it wrote.

If another script has already changed `state.message`, RE preserves that value and appends its own `RE - ...` line. If the current value is still exactly RE's prior snapshot, the next RE message replaces it.

This cannot guarantee perfect behavior with a script that intentionally overwrites `state.message` after RE runs, but RE no longer blindly destroys a pre-existing message.

### Private output prefixes

RE currently cooperates with one leading parenthetical private-control prefix of up to 1000 characters.

That covers the strict prefix style used by Inner Self. Scripts using a different strict prefix scheme should either process Output before RE or use an explicit integration adapter.

### Story Card ownership

RE only treats canonical RAND keys as encounters and uses dedicated RE keys/types for Config/Advanced/History/Act Map cards.

Derived reference cards are also narrowly owned:
- `random encounter history` stores recent successful history plus its Notes archive
- `random encounter act map` is created/removed only according to the Config display toggle

RE does not treat either derived card as encounter state.

Scripts that rewrite every Story Card regardless of type/key remain inherently unsafe to combine without testing.

## Story Arc Engine

### Current source/harness status

**Nice-to-have adapter implemented; 8/8 focused harness checks passed. Live combined validation remains optional for RC unless SAE support is advertised.**

RE recognizes an SAE-owned model turn only when recognizable SAE identity/state exists and SAE is actively feeding/saving an arc:

- `state.storyArc` exists
- `state.turnNum_SAE` exists
- and either `state.saveOutput === true` or `state.unlockFeedAIPrompt === true`

RE then uses the same external-task suspension behavior as Auto-Cards.

The owner marker persists through RE Output, so even if SAE clears `saveOutput` while parsing the generated arc, RE still passes that output through untouched.

Example combined order:

```js
// Input
text = onInput_SAE(text);
text = RandomEncounters("input", text);

// Context
text = onContext_SAE(text);
if (!stop) text = RandomEncounters("context", text);

// Output
text = onOutput_SAE(text);
text = RandomEncounters("output", text);
```

SAE uses `/stop`; RE uses `/RE stop`, so command names do not collide.

## MagicCards

**Unsupported/unverified.**

MagicCards' own documentation warns against combining it with AutoCards/SmartCards/other automatic Story Card scripts. Static inspection does not show an obvious RAND-card ownership collision, but RE should not claim MagicCards compatibility contrary to that warning without dedicated testing.

MagicCards also supplies its own modifier framework, so composition is not equivalent to the simpler examples above.

## Low-conflict scripts

Scripts are generally low risk when they:

- namespace their persistent state
- use distinct commands
- append ordinary narrative guidance
- do not temporarily replace story generation
- do not impose a strict output protocol
- do not broadly rewrite unrelated Story Cards

Living Meters is an example of this architecture: it uses its own state namespace and primarily injects narrative directives. It remains a useful control candidate for live general-compatibility testing.

### Living Meters fixture status

**Fixture prepared; general coexistence live validation passed.**

The isolated fixture lives in `compatibility-testing/LivingMeters/` and pins Living Meters v1.2.2 from commit `c4ebf5dd13a36b1b8de33ae08c39cf84b52f36ca`.

The fixture preserves both library implementations exactly:
- Living Meters block matches its pinned upstream `library.js`
- Random Encounters block matches `src/library.js` byte-for-byte

Only the Input/Context/Output wrappers contain compatibility-specific composition logic. The current root fixture provides a deterministic baseline, but that wrapper order is not sufficient by itself to establish general compatibility. Opposite-order behavior must also be exercised where practical.

**v0.18.28 general coexistence control: PASS.** Fresh-game testing confirmed normal RE pacing, forced encounter activation, one-per-turn Active Duration, manual-end resolution, classifier capture/removal, Outcome write, and clean pacing resume while installed in the Living Meters compatibility fixture.

The Living Meters-specific broad slash-command ordering caveat remains documented as an external-script/order-sensitive command-parser limitation rather than an RE release blocker.

## Release-candidate compatibility gate

### Blocking

**v0.18.28 RC compatibility gate: PASS.**

Completed:
- Inner Self live combined testing
- Auto-Cards live combined testing
- general-composition control testing with Living Meters
- cooperative/shared `state.message` behavior exercised in live compatibility testing

### Nice to have

- live Story Arc Engine generation-cycle test

### Already covered by source/harness

- dedicated RE state/card/command namespaces
- Context `stop` preservation
- Inner Self-style private prefix handling
- cooperative `state.message` behavior
- standalone/bundled Auto-Cards task suspension
- generic external-task suspension
- SAE task suspension
- phantom-turn prevention after suspended tasks
