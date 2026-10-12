// Capture Auto-Cards command intent before its input modifier may rewrite text.
const reAutoCardsControl = /^\s*\/ac(?:\s|$)/i.test(String(text||""));

// Inner Self first.
InnerSelf("input");

// Rejected /ac commands also pause RE; they cannot consume encounter duration.
if (reAutoCardsControl) RandomEncounters("pause", "Auto-Cards control command");

// Random Encounters second.
const modifier = (text) => {
  text = RandomEncounters("input", text);
  return { text };
};

modifier(text);
