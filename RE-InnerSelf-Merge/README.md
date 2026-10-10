# RE-InnerSelf-Merge — Inner Self + Random Encounters

The maintained combined four-tab AI Dungeon harness lives in [`RE-InnerSelf-Merge/`](https://github.com/circadiansummer/AID-RandomEncounters/tree/main/RE-InnerSelf-Merge).

Copy these four files together into the matching AI Dungeon script tabs:

- [Library.js](https://github.com/circadiansummer/AID-RandomEncounters/blob/main/RE-InnerSelf-Merge/Library.js)
- [Input.js](https://github.com/circadiansummer/AID-RandomEncounters/blob/main/RE-InnerSelf-Merge/Input.js)
- [Context.js](https://github.com/circadiansummer/AID-RandomEncounters/blob/main/RE-InnerSelf-Merge/Context.js)
- [Output.js](https://github.com/circadiansummer/AID-RandomEncounters/blob/main/RE-InnerSelf-Merge/Output.js)

This is an **Inner Self with bundled Auto-Cards integration harness**, not a separate Random Encounters product version. Its RE implementation matches the [standalone Random Encounters Library](https://github.com/circadiansummer/AID-RandomEncounters/blob/main/Library.js).

Use **either** the root standalone scripts **or** this combined set. Never paste two complete Input/Context/Output modifier wrappers into one script tab.

While Inner Self or Auto-Cards has an outstanding model task, Random Encounters may defer a placeholder-generation attempt until the model becomes available. Delays alone are not failures. See the [compatibility guide](https://github.com/circadiansummer/AID-RandomEncounters/blob/main/docs/compatibility.md) for tested behavior and limitations.

## Third-party attribution and licensing

This combined harness includes source code from [Inner Self](https://github.com/LewdLeah/Inner-Self) and [Auto-Cards](https://github.com/LewdLeah/Auto-Cards), both created by **LewdLeah** and distributed under the MIT License. Their original notices are reproduced without modification:

- [Inner Self MIT license](LICENSE-Inner-Self.txt) — Copyright (c) 2026 LewdLeah
- [Auto-Cards MIT license](LICENSE-Auto-Cards.txt) — Copyright (c) 2025 LewdLeah

The full notices are also included as comments at the top of this folder's `Library.js`, so they accompany the bundled source when it is pasted into AI Dungeon. These third-party notices do not determine the licensing of the separately maintained Random Encounters implementation.
