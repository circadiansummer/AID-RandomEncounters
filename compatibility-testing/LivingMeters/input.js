// Living Meters + Random Encounters compatibility fixture.
//
// RE runs first so /RE commands are consumed before Living Meters' generic
// slash-command parser can treat them as unknown RM commands.
const modifier = (text) => {
  text = RandomEncounters("input", text);
  text = RM.input(text);

  // Living Meters halts its own slash commands in Context. RE has already seen
  // the Input hook by then, so clear only RE's pending-input marker when RM has
  // claimed this action as a command. This prevents a command-only action from
  // becoming a delayed phantom RE turn.
  if (state && state.RM && state.RM.pendingStop && state.randomEncounters) {
    state.randomEncounters.pendingInputTurn = false;
  }

  return { text };
};

modifier(text);
