# Compatibility

This document records the v0.18.24 compatibility design and audit for Random Encounters.

Unless explicitly labeled live-tested, compatibility claims here are based on source review plus the RE harness. Live combined-script validation in AI Dungeon is still required before the release candidate is considered cleared.

## Compatibility priorities for the release candidate

1. Inner Self
2. Auto-Cards
3. General script compatibility
4. Story Arc Engine — nice to have

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

## General composition rule

When manually combining scripts in one AI Dungeon hook, use one outer `modifier(text)`. Do not paste several complete files that each declare their own `const modifier`.

Preferred order:

1. let the specialized/owning script process the hook
2. run Random Encounters afterward
3. in Context, skip RE if `stop` is already true
4. always return `{ text, stop }` from Context

RE's standalone Context wrapper now follows the same `stop` semantics.

## Inner Self

### Current source/harness status

**High-priority compatibility hardening implemented. Live combined validation still required.**

No state or Story Card identifier collision was found.

v0.18.21 added three protections for Inner Self-style behavior:

- RE encounter/resolution prompts explicitly preserve a required private control prefix before story prose
- RE resolution capture accepts one leading parenthetical private-control operation before the classifier sentence
- RE status markers are placed after such a prefix, never before it

This matters because Inner Self can require output to begin with a parenthetical brain operation.

RE also now posts `state.message` cooperatively: when another script has already supplied a different toast, RE appends its own message rather than blindly replacing it; on a later RE-only event it replaces its own previous combined snapshot instead of accumulating stale messages.

### Recommended hook composition

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

const modifier = (text) => {
  if (!stop) text = RandomEncounters("context", text);
  return { text, stop };
};

modifier(text);
```

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

### Inner Self live-RC tests still required

- normal Inner Self thought task + newly activated RE encounter
- normal Inner Self thought task + Active RE reminder
- Inner Self thought task + RE resolution classification
- RE command while an NPC would otherwise trigger Inner Self
- simultaneous Inner Self/Auto-Cards toast + RE toast

## Auto-Cards

### Current source/harness status

**Automatic task ownership implemented and 13/13 focused RE harness checks passed. Live combined validation still required.**

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

### Recommended standalone Auto-Cards composition

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
  if (!stop) text = RandomEncounters("context", text);
  return { text, stop };
};

modifier(text);
```

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

### Auto-Cards live-RC tests still required

- one normal story turn with both systems installed
- one automatic card-generation turn
- one memory-compression turn
- a pending RE resolution across an Auto-Cards task
- a queued/Active RE encounter across an Auto-Cards task
- simultaneous Auto-Cards + RE `state.message` events

## General compatibility

### Context stop

RE's standalone Context wrapper now:

```js
if (!stop) text = RandomEncounters("context", text);
return { text, stop };
```

An earlier script that sets `stop = true` therefore owns the turn and RE does nothing.

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

RE only treats canonical RAND keys as encounters and uses dedicated RE keys/types for Config/Advanced/History cards.

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

Recommended order:

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

## Release-candidate compatibility gate

### Blocking

Before the RC moves forward:

- live Inner Self combined tests
- live Auto-Cards combined tests
- one general-composition control test
- verify shared toasts do not silently disappear in the tested combinations

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
