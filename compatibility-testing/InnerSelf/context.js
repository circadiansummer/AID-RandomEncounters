// Inner Self first.
InnerSelf("context");

// Random Encounters second. Preserve Inner Self / Auto-Cards stop ownership.
const modifier = (text) => {
  if (!stop) text = RandomEncounters("context", text);
  return { text, stop };
};

modifier(text);
