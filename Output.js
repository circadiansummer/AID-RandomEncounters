/*
 * Random Encounters — v1.12
 * AI Dungeon Output Modifier
 */

const modifier = (text) => {
  text = RandomEncounters("output", text);
  return { text };
};

modifier(text);
