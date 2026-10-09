const modifier = (text) => {
  text = RandomEncounters("context", text);
  return { text, stop };
};

modifier(text);
