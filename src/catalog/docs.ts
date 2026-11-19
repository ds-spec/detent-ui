// The words a component page carries beyond its demo: one line under the name and worked
// examples. They render as plain HTML, so search engines and agents
// read them; the live example views load only when scrolled to (see examples-live.tsx).
// Start with the pieces people search for; the rest fall back to no extra section.

export type Doc = {
  /** First sentence in ink, the rest in grey, under the name. Says what it is in the words people search. */
  lede: [string, string]
  /** Worked examples. `key` names the live view `${id}:${key}` in the example registry. */
  examples: { key: string; title: string; line: string }[]
  /** 1 for wide pieces like the diff (720 wide); otherwise the view is held to 520. */
  cols?: 1
  /** Scale for pieces drawn large at their natural size (the prompt box), so examples match the demo above. */
  zoom?: number
}

export const DOCS: Record<string, Doc> = {
  radar: {
    lede: ['Compare two things across many qualities in one shape.', 'Each side takes the colour of whoever leads there, and the bigger the petal, the bigger the lead. A sentence above it says who wins what, so it needs no legend.'],
    examples: [
      { key: 'lead', title: 'Who leads where', line: 'The sentence names both and says what each one takes, in their colours, so it needs no legend.' },
      { key: 'pick', title: 'Pick any two from a list', line: 'Hand it every option. A new pick takes the place of the older one, and the shape springs to the new pair.' },
      { key: 'scale', title: 'Your own scale', line: 'Six qualities read out of 10. Point at one and the sentence gives the margin and both readings, written by your format.' },
    ],
  },
  diff: {
    lede: ['Review the code an agent wants to change, one hunk at a time.', 'Lines stream in as the agent writes, verdicts stamp down as you go, and the view slides from unified to split.'],
    cols: 1,
    examples: [
      { key: 'stream', title: 'While the agent writes', line: 'Pass `shown` as the agent streams and lines arrive one at a time. The counts in the header roll up with each one, and the frame never resizes.' },
      { key: 'one', title: 'One small change', line: 'A single hunk, already written. Accept it with A, reject it with R, press S to see it split, and Apply hands you every verdict.' },
    ],
  },
  trace: {
    lede: ['A timeline of an agent run, for the people the agent works for.', 'One bar shows where the time went. Every step reads as a plain sentence on its own track, and a step that’s waiting on you lifts out with Approve inside it.'],
    examples: [
      { key: 'approve', title: 'Held for approval', line: 'A live run paused on a production migration. `onApprove` and `onDeny` put the buttons in the waiting step, `waitingLabel` names who it waits on, and either answer finishes the run.' },
      { key: 'failed', title: 'A run that failed', line: 'A finished run with `status="failed"`. Retries stack on one track as extra `segments`, and the headline names the step it stopped at.' },
      { key: 'steps', title: 'Tokens and spend', line: 'Opens on Steps with `defaultView="steps"`: step names nested by `depth` under a sub-agent, with tokens and cost per step, priced in euros through `currency`.' },
    ],
  },
  'agent-canvas': {
    lede: ['Show your product working inside Claude, ChatGPT or Grok.', 'The agent ticks off its work in the chat, the result writes itself on the canvas next to it, and nothing turns on until someone says yes.'],
    cols: 1,
    // Examples dropped on Nov 19: the canvas needs its full 980 width to read well, so the demo above carries it.
    examples: [],
  },
  histogram: {
    lede: ['See how readings spread out, and how many miss your target.', 'Each dot stands for a fixed number of readings. Drag the target pin and every dot past it turns rose, while the headline says what share misses.'],
    cols: 1,
    examples: [
      { key: 'latency', title: 'Latency against a target', line: 'Response times with a long tail, starting at `initialTarget={800}`. The median, p95 and p99 stand as pins above the dots, and `onTarget` reports each new target as the pin moves.' },
      { key: 'builds', title: 'Build times in minutes', line: 'Any distribution works. Here `unit="min"`, `noun="builds"` and `bins={30}` turn it into a chart of CI runs, where the slow cold-cache builds are the ones past the line.' },
      { key: 'presets', title: 'Targets from your buttons', line: 'Hold a `ref` and call `target(v)` to move the pin from your own controls. `per={15}` fixes how many page loads each dot stands for instead of working it out from the data.' },
    ],
  },
  funnel: {
    lede: ['A conversion funnel you can pull on.', 'The steps are drawn as one smooth shape. Pull any step wider to try a better rate, and the headline tells you how many more customers that’s worth.'],
    cols: 1,
    examples: [
      { key: 'signup', title: 'Signup to paid', line: 'Four steps from visit to paid. The `why` on each stage sits under it in the space people left, and `goal` and `per` write the headline, which says how many more paying teams a month a better step is worth.' },
      { key: 'checkout', title: 'A five step checkout', line: 'Cart to order with `tone="accent"`, one calm colour that deepens towards the goal. `onChange` gets every step’s rate after each pull, the first always 1.' },
      { key: 'onboarding', title: 'A short app funnel', line: 'Three steps, `compact` and `height={190}` for a smaller card, with `rest` replacing the headline until someone pulls a step.' },
    ],
  },
  trend: {
    lede: ['A forecast that shows how sure it is.', 'The past is a line. What comes next is a band of ink that widens and thins as it runs out, so the part you can trust is the part that looks solid.'],
    cols: 1,
    examples: [
      { key: 'revenue', title: 'Revenue six months out', line: 'Eighteen months of MRR and a `low` and `high` for each month ahead. `format` writes dollars in thousands, and `unit` finishes the sentence.' },
      { key: 'capacity', title: 'When the disk fills', line: 'Storage forecast twelve days ahead with `look="plain"` for a flat band, `today="Last scan"` on the seam, and `odds` giving its own words for how sure each day is. `onRead` reports the day you point at.' },
    ],
  },
  chart: {
    lede: ['Pick any day and read the change from there.', 'Click the line and that day becomes the level. Above it prints blue, below it red, and the sentence reads the change again from the new day.'],
    cols: 1,
    examples: [
      { key: 'launch', title: 'Read from launch day', line: 'Daily active users with `start` set to launch day, so the sentence says what the launch kept. Click another day and `onStart` reports it.' },
      { key: 'value', title: 'Order value in euros', line: 'Average order value over a month with `look="plain"` for flat fills. `format` uses Intl to write euros, both for the values and for the change in the sentence.' },
    ],
  },
  models: {
    lede: ['Let people pick a model and how hard it thinks.', 'Effort is a detent you drag and flick. Every model’s time and cost moves with your finger, so you see what thinking harder costs before you choose.'],
    examples: [
      { key: 'two', title: 'Fast or careful', line: 'Two models, one with `reasons: false`. Drag the effort and the careful model’s time and cost move while the quick one stays put, and `onChange` reports `{ model, effort }`.' },
      { key: 'lineup', title: 'Your own effort steps', line: 'A code agent’s five models on three steps of its own, passed as `efforts`: each step multiplies every model’s `time` and `cost`.' },
      { key: 'task', title: 'Set by the task', line: 'The app picks the setting. Choose a task and a new `value` makes the plate glide to its effort and every row’s figures follow.' },
    ],
  },
  prompt: {
    zoom: 0.82,
    lede: ['The box people type to your AI in.', 'A white card on a quiet tray. One dark key speaks, sends or stops, and while it answers the tray slides out and says what it’s doing, in real seconds.'],
    examples: [
      { key: 'support', title: 'A support assistant', line: 'Its own `placeholder`, a `label` above the words, two plain `modes` and `suggestions` you take with Tab. `status` changes while it works, and the tray reads it out.' },
      { key: 'agent', title: 'A code agent', line: 'Ask, Plan and Edit `modes`, a `models` menu, `projects` in the tray and a file in `initialFiles`. While it works the status walks through its steps, and Esc stops it through `onStop`.' },
      { key: 'writer', title: 'A writing assistant', line: 'Return a promise from `onSend` and the box shows it working until the promise settles. Here the draft streams into the thread above as it is written, then the box is ready again.' },
    ],
  },
  rewrite: {
    lede: ['Select a phrase, say how it should read, and watch it change in place.', 'The new wording streams in after the struck-through original, like a tracked change, with the number of words it moved. Tab takes it.'],
    examples: [],
  },
  filter: {
    lede: ['Type what you want to see, and get filters back.', 'Each phrase gets underlined and hangs its filter on a thread. When a word could mean two things it asks you, with a count for each answer.'],
    examples: [],
  },
  scatter: {
    lede: ['Draw a loop around any cluster and see what’s in it.', 'Every point is a dot, sized by weight and coloured by group. The headline tells you how many are inside, their averages and the group most of them belong to.'],
    examples: [],
  },
  bridge: {
    lede: ['Show how one revenue total turns into the next.', 'Drag across the steps and the running total rolls on its digits while each bar fills as you reach it. The sentence names what moved it most.'],
    examples: [],
  },
  askchart: {
    lede: ['Ask a question about your data and get one chart back.', 'The answer is one line over a chart with a single series in colour. A follow-up reshapes the same chart instead of starting a new one.'],
    examples: [],
  },
  dates: {
    lede: ['A date range picker you can type into.', 'Write “since sep 3” or pick a period and the dates show as you go. The calendar is there for exact days, and Apply also gives you the period to compare against.'],
    examples: [],
  },
  upload: {
    lede: ['Drag files over it and the folder tips open.', 'Let go and they fall in as sheets, images with a preview. The list below keeps a fixed height, so adding files never pushes the page down.'],
    examples: [],
  },
  extract: {
    lede: ['Check what a model read from a document before it’s saved.', 'Point at a field and a thread runs to where it was found on the page. The fields it isn’t sure about come first, one at a time.'],
    examples: [],
  },
  rings: {
    lede: ['Progress bars for a month of goals, with the numbers set big.', 'Scrub through the month and bars and digits move together. Push a bar past 100% and it holds under your hand, then breaks through in amber.'],
    examples: [],
  },
  metric: {
    lede: ['A metric card that says why the number moved.', 'The change is written in words instead of a green or red pill, with a reason and the four drivers that counted most. Point at a driver and the number shows what it would be without it.'],
    examples: [],
  },
  forecast: {
    lede: ['See how long your cash lasts, and ask what if.', 'Type a what-if and the forecast bends away from the plan. Switch to Range and the line becomes forty likely futures, and the runway becomes a range.'],
    examples: [],
  },
  voicenote: {
    lede: ['A voice note player where the transcript keeps up with the voice.', 'The waveform’s dots ink in as it plays, the speed steps through 1×, 1.5× and 2×, and each word turns from grey to ink as it’s said.'],
    examples: [],
  },
  halo: {
    lede: ['A soft glow to sit behind your hero.', 'The colour starts over at every curved edge, so one glow reads like glass. The bands follow your pointer a beat apart, and a press melts in the next palette.'],
    examples: [],
  },
  find: {
    lede: ['Find in page that dims everything but the match.', 'The match and its sentence stay lit, one plate glides from match to match, and it starts from where you’re reading, not from the top.'],
    examples: [],
  },
  rewind: {
    lede: ['A textarea you can rewind.', 'Hold ⌘Z and drag, and your writing runs back under your hand, with deleted words coming back in colour. A tap steps back one thought, not one letter.'],
    examples: [],
  },
  popup: {
    lede: ['A select that opens right where you pressed.', 'The current choice stays under your finger, so you slide to the next one and let go. A quick tap keeps it open for people who click.'],
    examples: [],
  },
  phrase: {
    lede: ['Settings written as one sentence.', 'Only the words you can change are dark. Tap one to pick another, drag a number sideways to dial it, and the line under it says what the choice means.'],
    examples: [],
  },
  announce: {
    lede: ['The small pill above a headline that says what’s new.', 'A line of light runs round it once as you reach for it, and the tag rolls from New to what pressing it will do.'],
    examples: [],
  },
  slices: {
    lede: ['A headline that puts itself together from strips.', 'The words fly in as strips from alternating sides and line up into letters. Move over them and they part around the pointer, then heal when it leaves.'],
    examples: [],
  },
  region: {
    lede: ['Pick a server region on a globe that turns with you.', 'Flick through a drum of regions while the Earth turns with it, lit by today’s sunlight. It draws a route from your visitor with the latency beside it.'],
    examples: [],
  },
  threads: {
    lede: ['A hero where every thread runs through your button.', 'Fine threads sweep in from both edges and gather through the call to action. They tighten as you get close, and carry light out along every one when it’s pressed.'],
    examples: [],
  },
  glyph: {
    lede: ['Turn any icon or word into ASCII art.', 'Characters shimmer into the shape, lit from the top left. Change the shape and they re-form, move over it and they light up.'],
    examples: [],
  },
  hello: {
    lede: ['A language picker with the world drawn in its own letters.', 'Pick a language and the globe turns there, and its country lights up in orange, spelling the greeting.'],
    examples: [],
  },
  emoji: {
    lede: ['An emoji picker with no grid.', 'Emoji and symbols sit in one round field you fling around, the ones in the middle grow, and a tap sends one flying into the message at your cursor.'],
    examples: [],
  },
  shift: {
    lede: ['One card for where your visitors come from, read three ways.', 'Switch between List, Bars and Change and every bar, icon and number moves to its new place, so the source you were looking at stays in sight.'],
    examples: [],
  },
  livelist: {
    lede: ['A checklist your whole team writes in at once.', 'New items land in their group with the person’s name, ticked ones settle into Done, and while you’re reading the list waits behind a “2 new” pill.'],
    examples: [],
  },
  mcp: {
    lede: ['The install card for your MCP server.', 'Pick Cursor, Claude Code, Claude, Windsurf or Zed and it writes that editor’s exact config from your server’s `url`, then waits on the copy until it connects.'],
    examples: [],
  },
  buddy: {
    lede: ['A small face for your AI, instead of an orb.', 'Idle eyes follow the pointer and blink. Listening looks down, thinking scans side to side, happy smiles and sleepy droops.'],
    examples: [],
  },
  vault: {
    lede: ['A deposit and withdraw card for web3 apps.', 'Connect, pick a token, and drag the amount until it clicks into 25%, half or max. Then follow it from signing to on-chain, with its own message if it’s declined or fails.'],
    examples: [],
  },
  'support-chat': {
    lede: ['A support bubble that answers with its sources.', 'It shows the articles it read, can run a task like a plan change right in the thread, and hands the chat to a teammate who can see everything above.'],
    examples: [],
  },
  'agent-wallet': {
    lede: ['Spending limits for an AI agent that buys things.', 'A monthly budget that clicks into Light, Normal and Heavy, approval for anything over your limit, and a receipt for every purchase with the agent’s reason.'],
    examples: [],
  },
  week: {
    lede: ['A calendar you add to by typing.', 'Type lunch with Ana thursday at 1 and the week jumps to Thursday, the event drops in as a draft before you press Enter, and a clash gets a warning.'],
    examples: [],
  },
}
