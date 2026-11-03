// Random Encounters v1.14 — combined Inner Self / Auto-Cards adapter
// Inner Self first.
InnerSelf("output");

// Random Encounters second.
const modifier = (text) => {
  text = RandomEncounters("output", text);
  return { text };
};

modifier(text);
