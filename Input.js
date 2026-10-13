/*
 * Random Encounters — v1.1
 * AI Dungeon Input Modifier
 */

const modifier = (text) => {
  text = RandomEncounters("input", text);
  return { text };
};

modifier(text);
