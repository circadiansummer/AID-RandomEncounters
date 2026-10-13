/*
 * Random Encounters — v1.1
 * AI Dungeon Output Modifier
 */

const modifier = (text) => {
  text = RandomEncounters("output", text);
  return { text };
};

modifier(text);
