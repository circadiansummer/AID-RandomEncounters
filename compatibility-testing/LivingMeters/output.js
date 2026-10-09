// Living Meters + Random Encounters compatibility fixture.
const modifier = (text) => {
  // RE processes/removes any pending encounter classifier before Living Meters
  // scans the story output for resource triggers.
  text = RandomEncounters("output", text);
  text = RM.output(text);

  return { text };
};

modifier(text);
