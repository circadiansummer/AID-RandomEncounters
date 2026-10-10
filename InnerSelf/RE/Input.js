// Inner Self first.
InnerSelf("input");

// Random Encounters second.
const modifier = (text) => {
  text = RandomEncounters("input", text);
  return { text };
};

modifier(text);
