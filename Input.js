/*
 * Random Encounters — v1.14
 * AI Dungeon Input Modifier
 */

const modifier = (text) => {
  text = RandomEncounters("input", text);
  return { text };
};

modifier(text);
