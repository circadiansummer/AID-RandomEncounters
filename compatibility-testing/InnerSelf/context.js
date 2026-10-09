// Inner Self first.
InnerSelf("context");

// Random Encounters second. Preserve Inner Self / Auto-Cards stop ownership.
const modifier = (text) => {
  const shouldStop = typeof stop !== "undefined" ? stop : false;
  if (!shouldStop) text = RandomEncounters("context", text);
  return { text, stop: shouldStop };
};

modifier(text);
