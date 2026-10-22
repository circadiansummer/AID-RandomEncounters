# Extended Encounter Theme — deterministic development report

**Date:** October 22, 2026 (America/Chicago)  
**Target:** `develop/extended-encounter-theme` based on `main` v1.13 (`13d54519e9e7a2623c6ba11e15526f669b290c97`).  
**Scope:** Only the optional Encounter Theme input constraint; leave generation flow, difficulty, card creation, and RE metadata unchanged.

## Root cause and change

The v1.13 `parseGenerationTheme(raw)` rejects a theme when **either** `text.length > 60` or the whitespace-delimited word count exceeds **5**. Rejection triggers `notifyInvalidSetting("Encounter Theme")` and a fallback to `None`, dropping useful guidance.

The development change removes the word-count test and expands the single-line size cap to **2000 JavaScript string code units**. The existing control-character/newline check is preserved. A valid theme is passed through the established `generationInstruction()` quoting and captured in the placeholder generation request for retries.

The Config Story Card Notes and configuration guide describe the revised limit; standalone and Inner Self/Auto-Cards combined RE Libraries have the same embedded core implementation.

## Deterministic test evidence

**PASS: 422 / 422 checks** through the `docs/tests/smoke.cjs` exported `run(files)` against the patched Libraries and six unchanged Input/Context/Output wrappers, executed in the ChatGPT JavaScript test environment.

- Existing v1.13 418 checks continue to pass.
- Added 4 positive assertions: test example exceeds both previous thresholds, full longer text appears verbatim in the prompt, theme is retained in the batch snapshot, and exactly 2000-character input remains intact without truncation.
- Updated the prior invalid-value test to use **2001** characters (the old test rejected a harmless six-word theme); it still verifies independent fallback to `None` without changing a separate invalid difficulty's result.
- Libraries and six wrappers parse; standalone RE function matches the RE core embedded in the combined Library.

## Verification boundaries

**NOT RUN:** Native AI Dungeon fresh-adventure generation with long theme, platform-specific Story Card UI rendering, true generator model compliance, Node CLI execution of the test script, and any public GitHub/AI Dungeon release.

## Focused fresh-adventure acceptance procedure

1. Install the four candidate RE script sections in a **new adventure** (standalone); add or explicitly create at least one placeholder.
2. Edit Config to a **single-line theme with 10–50 words**, well above 60 characters (e.g. a detailed event-design direction). Set `Run Encounter Generation: true`.
3. Trigger generation; verify the theme appears intact in relevant context/debug logs, the attempted encounters are genre-appropriate and one-sentence, and the batch retains its original theme if retried after editing Config.
4. Confirm blank/`None` still omits theme instructions. Test 2000 characters and 2001 characters if practical; 2001 should notify invalid fallback, not silently truncate.
5. Repeat with a separate new adventure using the combined Inner Self/Auto-Cards Library.
6. Record model, relevant modified Context, actual Story Card outputs, and PASS/FAIL/NOT RUN separately; do not infer native behavior from mocked tests alone.

## Release boundary

This is **an unpromoted development change**, not a new RE public/main version. Historical v1.13 release notes and pinned archives are unchanged. Owner approval is required to promote, tag, or publish it.
