// Random Encounters v1.12 — combined Inner Self / Auto-Cards adapter
// Capture Auto-Cards controls before Inner Self transforms their text.
const reAutoCardsControl = /^\s*\/\s*a\s*c(?:\s|$)/i.test(String(text || ""));

// Inner Self first.
InnerSelf("input");

// Random Encounters second.
const modifier = (text) => {
  if (reAutoCardsControl) RandomEncounters("pause", "Auto-Cards control command");
  text = RandomEncounters("input", text);
  return { text };
};

modifier(text);
