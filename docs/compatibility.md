# Compatibility

This document records the v0.18.20 compatibility audit against common AI Dungeon scripting patterns and selected community scripts. It is a static/source review unless a combination is explicitly described as live-tested.

## Compatibility model

Random Encounters is well isolated at the data layer:

- persistent state lives under `state.randomEncounters`
- encounter/config/history Story Cards use dedicated `#RE - ...` types and RE-specific keys
- the Library exposes one top-level entry point: `RandomEncounters(...)`
- runtime commands are namespaced under `/RE`

The main compatibility risks are therefore not naming collisions. They are:

1. hook order
2. preserving the Context `stop` flag
3. multiple scripts writing `state.message`
4. multiple scripts injecting instructions into the same model context
5. another script temporarily using a model turn for non-story generation
6. another script requiring a strict output prefix/format

## General installation rule

AI Dungeon provides one Input, Context, and Output modifier per installed script surface. When manually combining scenario scripts in one hook, keep a single outer `modifier(text)` and call each library system inside it in the intended order.

Do not paste multiple complete hook files containing duplicate `const modifier = ...` declarations into the same tab.

## Current Random Encounters wrapper concern

The current standalone RE Context wrapper returns only:

```js
return { text };
```

Scripts such as Inner Self and Auto-Cards use the Context `stop` flag. A combined Context hook must preserve and return that flag:

```js
return { text, stop };
```

This is a concrete pre-release compatibility improvement candidate.

## Inner Self

### Data/card collision risk: Low

Inner Self uses its own persistent state and brain/config card formats. RE card types, keys, and titles do not overlap the normal Inner Self control/brain-card identifiers.

### Context/output interaction risk: Medium

Inner Self may inject strict task instructions requiring the model output to begin with a parenthetical brain operation before continuing normal story prose.

Normal RE encounter injection can plausibly coexist with that story continuation.

The harder case is an RE resolution turn: RE currently expects its classifier sentence at the beginning of model output, while Inner Self may simultaneously require its own prefix at the beginning of output. Hook order alone does not fully solve two competing "first output" requirements.

Recommended integration direction:

- Context: RE before Inner Self, so Inner Self can retain final control of its strict thought-task format.
- Output: Inner Self before RE, so Inner Self can consume its private task syntax before RE processes visible story/output markers.
- Before claiming full compatibility, RE resolution prompting should be made tolerant of another script-required control prefix or otherwise coordinated with Inner Self task turns.

Status: **partially compatible by structure; resolution-turn coexistence needs an explicit integration test/design.**

## Auto-Cards

### Data/card collision risk: Low

Auto-Cards uses its own state and control-card identifiers. RE cards are not Auto-Cards-owned cards.

### Hook/task risk: Medium

Auto-Cards is intentionally designed to coexist with other modifiers and its Context API propagates `stop`. It can also temporarily repurpose model context/output for card generation or memory compression.

RE should preserve `stop` and should not inject encounter/resolution instructions into an Auto-Cards-owned generation turn.

Auto-Cards also contains defensive logic around `state.message`; RE currently writes `state.message` directly, so simultaneous toast events can still be order-dependent.

Status: **likely compatible for ordinary story turns; internal Auto-Cards generation turns need integration testing.**

## Story Arc Engine (SAE)

### Data/card collision risk: Low

Upstream SAE uses separate state fields and the `Story Arc Settings` / `Current Story Arc` cards. Its commands do not overlap `/RE ...`.

### Model-turn ownership risk: High

SAE periodically uses a turn to generate a numbered story arc rather than normal story prose.

On such a turn, current RE logic can still:

- count the Continue as an RE story turn
- advance a pacing countdown
- consume Active Duration
- inject a pending encounter
- inject an RE resolution classifier request

That can contaminate SAE's arc-generation prompt/output, while SAE output can fail RE's classifier expectations.

A community SAE + Inner Self integration already has to coordinate hook order and explicitly skip Inner Self while SAE owns an arc-generation turn. RE needs equivalent ownership awareness before full SAE compatibility should be claimed.

Status: **not fully compatible out of the box; known coordination work is required.**

## Inner Self + Story Arc Engine integration forks

Existing community integrations demonstrate that combining two AI-owning scripts is not purely additive. They coordinate Context/Output order and suppress one system while another owns a special model turn.

Adding RE to such a bundle should follow the same principle:

- SAE task parsing first on SAE-owned output
- character/private task parsing before RE visible-output processing
- RE suspended on non-story generation turns
- `stop` preserved throughout Context

Status: **requires an explicit three-system integration layer or shared task-ownership convention.**

## MagicCards

MagicCards' own documentation warns that it is not compatible with AutoCards/SmartCards or other automatic Story Card scripts.

RE uses automatic Story Card creation/maintenance, although its cards serve a different purpose and use distinct types. Static inspection suggests RE's cards do not match MagicCards' normal owned-card IDs/types, but that does not override MagicCards' published compatibility warning.

MagicCards also supplies its own hook/modifier framework, so install composition differs from RE's current wrappers.

Status: **unsupported/not claimed compatible unless specifically tested.**

## Living Meters and similarly namespaced narrative scripts

Living Meters is an example of a comparatively low-conflict architecture:

- saved state uses a dedicated `state.RM` namespace
- its main purpose is narrative directive injection rather than temporary model-output ownership
- commands are separately namespaced

The main remaining concerns are ordinary context-budget pressure and simultaneous `state.message` toasts.

Status: **low static risk; suitable candidate for a simple combined regression test.**

## Other script categories

### Usually low risk

- scripts that keep their persistent state under a unique namespace
- scripts that only append ordinary narrative guidance
- scripts with distinct slash-command prefixes
- scripts that only read unrelated Story Cards

### Needs integration testing

- scripts that temporarily replace normal story generation with AI-generated metadata
- scripts that require a strict first-line/first-character output format
- scripts that set Context `stop`
- scripts that broadly rewrite all Story Cards or all card titles
- scripts that replace/strip large context sections
- scripts that write `state.message` on the same turns as RE

## Pre-release compatibility recommendations

Before calling RE generally compatible with other popular scripts:

1. Preserve `stop` in the RE Context wrapper.
2. Define a small external/model-task ownership rule so RE can pause turn progression, encounter injection, and resolution handling during non-story AI tasks.
3. Test RE + upstream Inner Self with a triggered brain task and an RE resolution on the same turn.
4. Test RE + upstream Story Arc Engine across an arc-generation cycle.
5. Test RE + Auto-Cards across card-generation/compression events.
6. Test at least one low-conflict namespaced script such as Living Meters as a control.
7. Decide how RE should behave when another script has already written `state.message` during the same hook.

## Current compatibility conclusion

RE is **well namespaced but not yet universally interoperable**.

Ordinary scripts that add narrative context or maintain separate state should coexist cleanly. The unresolved pre-release concern is scripts that temporarily own the model turn or impose strict output syntax. SAE presents a definite example; Inner Self presents a likely resolution-turn formatting conflict; Auto-Cards warrants a focused integration test.

No compatibility claim should be made for MagicCards while its own documentation advises against combining it with automatic Story Card scripts.
