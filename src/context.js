const modifier = (text) => {
  if (!stop) text = RandomEncounters("context", text);
  return { text, stop };
};

modifier(text);
