// Random Encounters v1.12 — combined Inner Self / Auto-Cards adapter
// Inner Self first.
InnerSelf("context");

// Random Encounters uses the same canonical Context adapter as standalone RE.
const modifier = (text) => {
  return RandomEncountersContext(text);
};

modifier(text);
