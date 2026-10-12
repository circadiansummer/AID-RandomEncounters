# Owner decision and applied revisions — October 12, 2026

The complete review below is retained as the historical review. The owner explicitly rejected changes based on the encounter-prerequisite observation: RE should be allowed to conclude and summarize an event that has already occurred. The review's prerequisite recommendations are not adopted requirements or a verified RE defect. No additional eligibility gates, prior-occurrence restrictions, or changes to Christine's return/Erik-focused encounters were applied.

Authorized scenario revisions were subsequently applied and verified: trigger comma-padding normalized; Christine's ASCII surname alias added; author/NPC background labeled separately from Meg's knowledge; core cast facts clarified in Plot Essentials; Author's Note shortened; AI Instructions streamlined with ordinary-narration versus RE-maintenance scope. Encounters 01–13 were broadened across actors, locations, objects, methods and outcomes while retaining their core situations. Encounters 14–20 are unchanged. All RE keys, types, Notes/Acts/Importance/rarity/duration and pin/spoiler/display flags were preserved. Opening unchanged. All 57 exported cards and revised text were verified; all four RE v1.0 script sections remain identical to release commit 0f56d72e46835b6277468a2b310f75db2a9a0dea. Model performance has not been newly tested.

This document is stored on develop/v1.1 only; it does not change the engine, release, or public README.

---

# Meg Giry scenario — AI Dungeon best-practice review

Reviewed October 12, 2026. [Current private scenario](https://play.aidungeon.com/scenario/jQToWqhRW-Oj/the-phantom-of-the-opera-meg-giry). Read-only review: no scenario content, cards, scripts, or model settings changed. Current saved text matched the supplied four sections; a fresh Story Card export matched all 57 original cards, including Notes/settings.

**Assessment:** mostly well structured and reasonably compact. Preserve the current foundation. Prioritize trigger hygiene, secret-disclosure boundaries, and encounter prerequisites; streamline instructions afterward. This is a content/source review, not proof of model obedience or a completed multi-model gameplay test.

## Findings by element

| Element | Assessment | Specific finding |
| --- | --- | --- |
| Opening | Strong | 250 words establish the player, period, immediate mystery and several available avenues. It supplies background without choosing Meg's next action or romantic response. The mirror is a clue rather than a mandatory command. |
| Plot Essentials | Appropriate | Setting, Meg's role, opening situation and world rules belong here. Distinguishing human mechanisms from magic and limiting Meg's knowledge are valuable. Any indispensable cast facts should remain understandable even when a card is absent. |
| AI Instructions | Appropriate, with refinements | Agency, limited viewpoint, independent NPC goals and continuity are explicit. Some constraints repeat across components. The reference to forbidden game/time-travel mechanics can be replaced by a positive description of the intended world. Narrative rules should be scoped to ordinary prose so they do not compete with RE maintenance-format requests. |
| Author's Note | Useful but compressible | 77 words / 635 characters. It is not enormous, but gives more directives than the official short-note recommendation. Repeated mention of the Meg–Erik romance could encourage premature focus on Erik; this is a risk to test, not an observed failure. |
| 37 world cards | Mostly strong | Entries are only 126–345 characters, averaging about 195. They describe identifiable entities and relevant relationships/constraints. Name variations in headings are not inherently defects: the actual Entry must make its subject clear. |
| Triggers | Refine | 35 world cards contain comma-padding spaces. For example, `Christine, Daaé` leaves the second alias with a leading space. That can match after a space yet miss at the beginning of a passage. It does not make every card fail. Normalize incidental padding, while retaining any deliberately chosen word-boundary spaces. Consider common accent/apostrophe variants where useful. |
| 20 RE cards | Valid-looking structure; semantic risks | All retain RAND keys and the intended Notes structure. Act 1 has 7 cards, Act 2 has 7, Act 3 has 6. Required cards are 01, 08 and 15. These gates are a design choice, not evidence of a malfunction. |
| Actual model behavior | Unverified here | No adventure was started or generation requested in this review. Trigger inclusion, context omissions, knowledge leakage, pacing and RE maintenance compliance still need observations on the model/context size you use. |

AI Dungeon documents literal trigger spacing and recommends concise, self-identifying entries. Titles/types/ordinary Notes are not substitutes for model-visible Entry text. Script-managed RE Notes are a separate case: RE reads those settings in code. [Official Story Card guidance](https://help.aidungeon.com/faq/story-cards).

## Prioritized recommendations

1. **Normalize accidental trigger padding.** Example: `Christine,Daaé`; retain spaces within multiword phrases. Not every spelling alias needs to be added, and indiscriminately shortening keys can cause excess activation. Check actual inclusion later through View Context.
2. **Make author knowledge distinguishable from Meg's discoveries.** Erik's identity, Giry's rescue history, hidden passages and the automaton are deliberately supplied to the model. They can support coherent NPC behavior, but a statement that Meg does not know them is a prompt constraint, not an enforceable knowledge partition. Keep a small current discovered-facts record as play progresses. If the scenario is later shared, spoiler covers help readers, not model secrecy. Do not move necessary secret world facts into ordinary Notes expecting the model to read them.
3. **Add narrative prerequisites to encounters where needed.** Card 15 names Erik before Meg may have identified him; card 19 asks for hidden observation/recognition that Meg cannot directly perceive. Card 18 can duplicate Christine's return if independent world progression already brought her back. Card 20 depends on a plausible meeting. Specify observable consequences and appropriate prerequisites, or let incompatible events fail without forcing them. Decide whether Required gates 01/08/15 fit an open-ended investigation or whether some should become Optional.
4. **Reduce duplication and foreground desired behavior.** Preserve agency, consent, period constraints and independent NPC goals. Prefer a clear statement of what ordinary narration should do over repeatedly naming unwanted phenomena. The current rules are a solid starting point; wholesale replacement with a large community instruction pack is not justified by this review. [Official AI Instructions guidance](https://help.aidungeon.com/faq/ai-instructions).
5. **Measure before shrinking further.** Persistent text is approximately 950 tokens using the guidebook's characters/4 estimate: Plot Essentials ~326, AI Instructions ~466, Author's Note ~159. Opening ~389 is additional story context. These are estimates, not tokenizer measurements; active lore, history and RE prompts add more. The 57-card count does not mean 57 Entries are sent every turn. [Context management](https://help.aidungeon.com/how-do-i-manage-context), [prompt assembly and trimming](https://help.aidungeon.com/faq/what-goes-into-the-context-sent-to-the-ai).

The v1.0 source was reviewed at release commit [0f56d72](https://github.com/circadiansummer/AID-RandomEncounters/tree/0f56d72e46835b6277468a2b310f75db2a9a0dea). `getAvailableEncounters` checks card status, population state and Act; it does not check whether Christine already returned or whether Meg learned Erik's identity. `maybeAdvanceAct` requires current-Act Required cards to be retired. Therefore prose about independent NPC progression cannot automatically synchronize those semantic facts with RE's eligibility. This is a content-design limitation to account for, not a proposed script patch. Maximum Encounter Cards controls creation; it is not a reason to discard the 20 imported cards.

## Optional shorter Author's Note — not applied

> Gothic historical mystery in second person, limited to Meg's observations. Use concrete period detail, natural dialogue, restrained atmosphere and occasional humor. Develop mystery through actionable clues and consistent physical consequences. Any Meg–Erik romance is optional, gradual and driven by player choices; vocal influence never establishes consent.

Keep the detailed agency and NPC rules in AI Instructions. The official recommendation is a few focused sentences; it is guidance, not a hard platform limit. [Author's Note guidance](https://help.aidungeon.com/faq/what-is-the-authors-note).

A possible ordinary-narration qualifier, also not applied: “These narrative rules govern ordinary story prose; follow RE's explicit output-format instructions when it requests a separate maintenance task.” Validate this with the actual model rather than assuming it solves all formatting conflicts.

## Recent popular scenario comparison

I opened AI Dungeon Discover with **Popular / Past Month**, then opened each scenario and its public Story Card gallery. Dates/actions below were visible during review. These are public-content observations; hidden AI Instructions, Author's Notes, full openings, private scripts and actual gameplay were not inspected. Three examples from two authors are a small, selected sample, not an experiment establishing causality.

| Scenario | Visible recency / popularity | Public design observation |
| --- | --- | --- |
| [Rejected](https://play.aidungeon.com/scenario/kT-Iul5G2h3J/rejected?published=true) | Created 13 days ago; updated 12 days ago; ~1.6M actions; 9 cards | Character Entries explicitly connect each NPC to the player and central relationship. Some are lengthy and strongly prescribe the player's relational history. Borrow explicit relationships, not the assumption that popularity proves long Entries or prescribed feelings are optimal. |
| [Your Royal Hates you](https://play.aidungeon.com/scenario/3nYC_Tlin5__/your-royal-hates-you?published=true) | Created 23 days ago; updated 16 days ago; ~558k actions; 11 cards | Cards pair personal motives with court roles, rank and access rules. One embeds a private identity disclosure condition. Role/status specificity is useful for the opera; that condition is still a model instruction, not a tested secrecy guarantee. |
| [Sealed Mage](https://play.aidungeon.com/scenario/er9ERDyC6sdp/sealed-mage?published=true) | Created about a month ago; updated 18 days ago; ~513k actions; 10 cards | Public cards identify family roles, incentives and concealed background that explain conflicts. The distinction between backstory and what the player knows needs deliberate handling. Secrets appearing in cards do not establish that the model will reveal them correctly. |

Your entries are already shorter and your player-agency policy more explicit than much of this sample. Do not copy the sample's card count, instruction length, or promised emotional trajectory as a universal rule. Action counts measure engagement, not controlled model reliability.

## Community guidance: useful, but checked against documentation

The [January 2026 Story Card guide](https://www.reddit.com/r/AIDungeon/comments/1qadbzg/story_cards_guide_core_mechanics_trigger_design/) and [September 2026 creator discussion](https://www.reddit.com/r/AIDungeon/comments/1wkzilo/i_am_making_my_own_adventure_i_need_tips_please/) reinforce careful triggers, explicit subjects and compact content. The [story-focused player discussion](https://www.reddit.com/r/AIDungeon/comments/1pa8t0s/making_ai_dungeon_run_smoother_tips_from_a/) favors focused, affirmative instructions.

Do not adopt every comment as a platform rule. Claims that cards trigger only from AI output conflict with official input/output documentation. Universal instruction-precedence hierarchies or token-saving translation tricks are not established for all models. Community recipes should be starting hypotheses, not guarantees.

## Updated working practice and remaining verification

Use persistent components for indispensable facts/rules, concise lore for relevant entities, a short stylistic note, precise triggers, and encounters whose prerequisites respect current story state. Keep author facts distinct from discovered facts. Check the actual assembled prompt before blaming a model for ignoring omitted information. Maintain a stable model/settings baseline when comparing a revision. Official [model guidance](https://help.aidungeon.com/ai-model-differences) is model-specific; this review does not select a universally best model or recommend purchasing more context.

Suggested small QA run in a separate fresh private adventure, with the intended model and unchanged RE v1.0:

- Question an NPC about Christine: check whether Meg's dialogue/feelings remain player-controlled and whether secrets require evidence.
- Examine the mirror: check geography, mundane mechanisms and gradual clue discovery.
- Change location: inspect which lore Entries actually reached Context; avoid unexplained NPC arrivals or forced romance.
- Let time pass: assess plausible offstage consequences without repeating already-resolved encounter premises.
- Exercise a RE encounter and its maintenance/resolution pass: verify adaptable narration and required formatting, with no control-text leakage.

Record model/version, context allowance, omitted cards and a few concrete outputs. Repeat on a second model only if cross-model portability matters. Until then, the architecture is well supported by current guidance; secret handling, encounter-state coherence and model adherence remain hypotheses to verify. No content or script changes were made. Research tab closed; original Discover settings restored; your private scenario left open.
