// Living Meters + Random Encounters compatibility fixture.
const modifier = (text) => {
  let shouldStop = typeof stop !== "undefined" ? stop : false;

  // An RE command is already owned by RE. Skip Living Meters for this Context
  // pass so an /RE command cannot tick resource drift.
  if (state && state.randomEncounters && state.randomEncounters.pendingControlCommand) {
    text = RandomEncounters("context", text);
    return { text, stop: shouldStop };
  }

  // A Living Meters command is halted here. RE must not process that command
  // as a story turn.
  if (state && state.RM && state.RM.pendingStop) {
    [text, shouldStop] = RM.context(text, shouldStop);
    return { text, stop: shouldStop };
  }

  // Normal story generation: RE contributes first, then Living Meters appends
  // its normal context/directive behavior.
  if (!shouldStop) text = RandomEncounters("context", text);
  [text, shouldStop] = RM.context(text, shouldStop);

  return { text, stop: shouldStop };
};

modifier(text);
