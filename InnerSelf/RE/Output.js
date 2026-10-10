// Inner Self first.
InnerSelf("output");

// Random Encounters second.
const modifier = (text) => {
  text = RandomEncounters("output", text);
  return { text };
};

modifier(text);
