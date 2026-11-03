/*
 * Random Encounters — v1.14
 * AI Dungeon Output Modifier
 */

const modifier = (text) => {
  text = RandomEncounters("output", text);
  return { text };
};

modifier(text);
