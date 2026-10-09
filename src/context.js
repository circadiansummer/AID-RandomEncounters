const modifier = (text) => {
  const shouldStop = typeof stop !== "undefined" ? stop : false;
  if (!shouldStop) text = RandomEncounters("context", text);
  return { text, stop: shouldStop };
};

modifier(text);
