// Living Meters + Random Encounters compatibility fixture.
const modifier = (text) => {
  // An RE command is already owned by RE. Skip Living Meters for this Context
  // pass so an /RE command cannot tick resource drift.
  if (state && state.randomEncounters && state.randomEncounters.pendingControlCommand) {
    text = RandomEncounters("context", text);
    return { text, stop };
  }

  // A Living Meters command is halted here. RE must not process that command
  // as a story turn.
  if (state && state.RM && state.RM.pendingStop) {
    [text, stop] = RM.context(text, stop);
    return { text, stop };
  }

  // Normal story generation: RE contributes first, then Living Meters appends
  // its normal context/directive behavior.
  if (!stop) text = RandomEncounters("context", text);
  [text, stop] = RM.context(text, stop);

  return { text, stop };
};

modifier(text);
