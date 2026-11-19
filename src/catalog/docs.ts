// The words a component page carries beyond its demo: one line under the name, worked
// examples and a few questions. They render as plain HTML, so search engines and agents
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
  /** Questions, answered with this piece's own facts so no two pages read alike. */
  faq: [string, string][]
}

export const DOCS: Record<string, Doc> = {
  radar: {
    lede: ['A radar chart for two things.', 'Compared in a sentence and drawn as one shape: each side wears the colour of whoever leads there, and the bigger the petal, the bigger the lead.'],
    examples: [
      { key: 'lead', title: 'Who leads where', line: 'The sentence names both and says what each one takes, in their colours, so it needs no legend.' },
      { key: 'pick', title: 'Pick any two from a list', line: 'Hand it every option. A new pick takes the place of the older one, and the shape springs to the new pair.' },
      { key: 'scale', title: 'Your own scale', line: 'Six qualities read out of 10. Point at one and the sentence gives the margin and both readings, written by your format.' },
    ],
    faq: [
      ['When should I use a radar chart instead of a bar chart?', 'When two things are compared across several qualities at once and the question is who leads where. Matchup is built for exactly two; with more than two, or a single quality, a bar chart reads faster. Give it a card up to about 520 wide, square-ish.'],
      ['Is the Matchup radar chart free?', 'It is part of Detent Pro, a one-time payment with every update for life. Once your project has the @detent-pro registry, `npx shadcn@latest add @detent-pro/radar` installs RadarCompare as source you own.'],
      ['Does it work with the Next.js App Router?', 'Yes. RadarCompare is a client component. Load axes and series on the server and pass them as plain data; pass format and onPair from a small client wrapper, since a server page can’t pass functions.'],
    ],
  },
  diff: {
    lede: ['An AI code diff review for React.', 'Code an agent wants to change, reviewed hunk by hunk: lines stream in, verdicts stamp down, and unified slides into split.'],
    cols: 1,
    examples: [
      { key: 'stream', title: 'While the agent writes', line: 'Pass `shown` as the agent streams and lines arrive one at a time. The counts in the header roll up with each one, and the frame never resizes.' },
      { key: 'one', title: 'One small change', line: 'A single hunk, already written. Accept it with A, reject it with R, press S to see it split, and Apply hands you every verdict.' },
    ],
    faq: [
      ['How do I show an AI agent’s code changes for review in React?', 'Pass DiffReview the file, a title and the hunks the agent proposed: each hunk is a list of context, removed and added lines. People accept or reject each hunk, and onApply gets the verdicts so your agent applies only what was kept.'],
      ['Is the diff review component free?', 'Yes. Diff review is free under the MIT licence. `npx shadcn@latest add https://detentui.com/r/diff` installs it into your project as source you own.'],
      ['Can people review it from the keyboard?', 'Yes. J and K move between hunks, A accepts, R rejects, U undoes a verdict, S switches unified and split, and Enter applies once everything is reviewed.'],
    ],
  },
  trace: {
    lede: ['An LLM trace viewer for agent runs.', 'One bar shows where the time went, every step reads as a plain sentence on its own waterfall track, and a step waiting on you lifts out with Approve in it.'],
    examples: [
      { key: 'approve', title: 'Held for approval', line: 'A live run paused on a production migration. `onApprove` and `onDeny` put the buttons in the waiting step, `waitingLabel` names who it waits on, and either answer finishes the run.' },
      { key: 'failed', title: 'A run that failed', line: 'A finished run with `status="failed"`. Retries stack on one track as extra `segments`, and the headline names the step it stopped at.' },
      { key: 'steps', title: 'Tokens and spend', line: 'Opens on Steps with `defaultView="steps"`: step names nested by `depth` under a sub-agent, with tokens and cost per step, priced in euros through `currency`.' },
    ],
    faq: [
      ['How do I show an agent run timeline in React?', 'Pass RunTrace the run’s spans. Each span is an agent, model or tool step with a depth and one or more segments (start, end, status), and every step gets a track on one shared time scale, so the list reads as a waterfall. Retries are extra segments on the same track. It is built for the people an agent works for, not for generic logs or request tracing.'],
      ['Is the Run waterfall free?', 'It is part of Detent Pro, a one-time payment with every update for life. Once your project has the @detent-pro registry, `npx shadcn@latest add @detent-pro/trace` installs RunTrace as source you own.'],
      ['Can I render a finished run from a server page?', 'Yes. RunTrace is a client component, but a finished run is plain data: spans with segment times in ms from the run’s start, plus startedAt and endedAt, so a server page can load it and pass it in. A live run ticks against performance.now(), so give it a startedAt on that clock, and pass onApprove and onDeny from a small client wrapper, since a server page can’t pass functions.'],
    ],
  },
  'agent-canvas': {
    lede: ['An AI agent chat with a canvas.', 'Your product working inside Claude, ChatGPT or Grok: the agent checks off its work in the chat, the result writes itself on the canvas beside it, and nothing turns on until someone says yes.'],
    cols: 1,
    // Examples dropped on Nov 19: the canvas needs its full 980 width to read well, so the demo above carries it.
    examples: [],
    faq: [
      ['How do I show a human-in-the-loop approval UI in an AI agent chat?', 'Give AgentCanvas a plan with an `ask` and a `confirm` pair. The agent writes the result on the canvas, then asks before anything turns on: the yes button calls `onEnable` and the no button calls `onDraft`, each with the plan and the request. It is meant to show your product working inside an agent; for a real chat wired to your own model, use a prompt input with the AI SDK.'],
      ['Is the Agent canvas free?', 'It is part of Detent Pro, a one-time payment with every update for life. Once your project has the @detent-pro registry, `npx shadcn@latest add @detent-pro/agent-canvas` installs AgentCanvas as source you own.'],
      ['Can the plan come from a real model call?', 'Yes. `respond` gets the request text and the selected agent and can return a Plan or a Promise of one, so it can call your own route that asks Claude, OpenAI or xAI. If it throws, the chat says “Something went wrong. Try asking again.” AgentCanvas is a client component, so pass `respond` and the callbacks from a client wrapper.'],
    ],
  },
  histogram: {
    lede: ['A React histogram chart with a target.', 'Each dot in a column stands for a fixed number of readings. Drag the target pin and every dot past it turns rose, while the headline says what share misses it.'],
    cols: 1,
    examples: [
      { key: 'latency', title: 'Latency against a target', line: 'Response times with a long tail, starting at `initialTarget={800}`. The median, p95 and p99 stand as pins above the dots, and `onTarget` reports each new target as the pin moves.' },
      { key: 'builds', title: 'Build times in minutes', line: 'Any distribution works. Here `unit="min"`, `noun="builds"` and `bins={30}` turn it into a chart of CI runs, where the slow cold-cache builds are the ones past the line.' },
      { key: 'presets', title: 'Targets from your buttons', line: 'Hold a `ref` and call `target(v)` to move the pin from your own controls. `per={15}` fixes how many page loads each dot stands for instead of working it out from the data.' },
    ],
    faq: [
      ['When should I use a histogram instead of a bar chart?', 'Use a histogram when the question is how a set of readings is spread out and how many miss a target, like response times against an 800ms goal. DotHistogram takes the raw values, bins them and stacks dots, so the shape of the distribution is also a count. For category counts or a time series, a bar or line chart reads better. Give it a dashboard card 480 to 640 wide.'],
      ['Is the Dot histogram free?', 'It is part of Detent Pro, a one-time payment with every update for life. Once your project has the @detent-pro registry, `npx shadcn@latest add @detent-pro/histogram` installs DotHistogram as source you own.'],
      ['Can people set the target from the keyboard?', 'Yes. The target pin is a slider that takes focus. The arrow keys move it one column, and holding Shift moves it five. It announces the value and the share that misses it. With reduced motion turned on, the dots appear in place instead of dropping in.'],
    ],
  },
  funnel: {
    lede: ['A React funnel chart you can pull.', 'The conversion funnel is drawn as one smooth shape. Pull any step wider to try a better rate, and the headline says how many more customers that is worth.'],
    cols: 1,
    examples: [
      { key: 'signup', title: 'Signup to paid', line: 'Four steps from visit to paid. The `why` on each stage sits under it in the space people left, and `goal` and `per` write the headline: how many more paying teams a month a better step is worth.' },
      { key: 'checkout', title: 'A five step checkout', line: 'Cart to order with `tone="accent"`, one calm colour that deepens towards the goal. `onChange` gets every step’s rate after each pull, the first always 1.' },
      { key: 'onboarding', title: 'A short app funnel', line: 'Three steps, `compact` and `height={190}` for a smaller card, with `rest` replacing the headline until someone pulls a step.' },
    ],
    faq: [
      ['How do I build a conversion funnel chart in React?', 'Pass FlowFunnel a list of stages, each with a label, a value and an optional why. It works out each step’s rate from the one before and draws the funnel as one shape. People can drag a step to try a better rate, and the headline does the sum in your `goal` and `per` words. Give it a wide card, 560 to 720.'],
      ['Is the Flow funnel free?', 'It is part of Detent Pro, a one-time payment with every update for life. Once your project has the @detent-pro registry, `npx shadcn@latest add @detent-pro/funnel` installs FlowFunnel as source you own.'],
      ['Can people use it from the keyboard, and how do I read their changes?', 'Each step after the first is a slider. The arrow keys change it by one point, and Esc goes back to the real numbers, as does the Reset button. `onChange` receives an array of rates, one per step, each the share of the step before. A `ref` exposes `set(i, rate)` and `reset()`. With reduced motion on, moves jump to place instead of springing.'],
    ],
  },
  trend: {
    lede: ['A React forecast chart with a confidence band.', 'What happened is a line and what might happen is a band of ink that widens and thins as it runs out, so the part you can trust is the part that looks solid.'],
    cols: 1,
    examples: [
      { key: 'revenue', title: 'Revenue six months out', line: 'Eighteen months of MRR and a `low` and `high` for each month ahead. `format` writes dollars in thousands, and `unit` finishes the sentence.' },
      { key: 'capacity', title: 'When the disk fills', line: 'Storage forecast twelve days ahead with `look="plain"` for a flat band, `today="Last scan"` on the seam, and `odds` giving its own words for how sure each day is. `onRead` reports the day you point at.' },
    ],
    faq: [
      ['How do I show a forecast with its uncertainty in React?', 'Pass OutlookChart `history` (a label and value for each day so far) and `forecast` (a label, `low` and `high` for each day ahead). It draws the past as a line and the forecast as a band that widens and fades, so it works as an uncertainty chart without a legend. Point along the band and the sentence gives the range for that day and how far to believe it: Likely, Possible or A long shot.'],
      ['Is the Outlook chart free?', 'Yes. The Outlook chart is free under the MIT licence. `npx shadcn@latest add https://detentui.com/r/trend` installs OutlookChart into your project as source you own.'],
      ['Does it work with the Next.js App Router?', 'Yes. OutlookChart is a client component. Load `history` and `forecast` on the server and pass them as plain data. Pass `format`, `odds` and `onRead` from a small client wrapper, since a server page can’t pass functions.'],
    ],
  },
  chart: {
    lede: ['A React line chart with a movable baseline.', 'Click any day and it becomes the level: above it prints blue, below it red, and the headline sentence reads the change from there.'],
    cols: 1,
    examples: [
      { key: 'launch', title: 'Read from launch day', line: 'Daily active users with `start` set to launch day, so the sentence says what the launch kept. Click another day and `onStart` reports it.' },
      { key: 'value', title: 'Order value in euros', line: 'Average order value over a month with `look="plain"` for flat fills. `format` uses Intl to write euros, both for the values and for the change in the sentence.' },
    ],
    faq: [
      ['When should I use a line chart with a baseline instead of a plain shadcn line chart?', 'When one metric is read against a day the reader picks, like a launch or a price change. BaselineChart takes `data` (a label and value per day) and `start`, and the headline reads the change from that day, for example “Since Sep 6, up $18,000 by Oct 8, or 42.7%”. For many series or a grid of sparklines, use a plain line chart instead.'],
      ['Is the Baseline chart free?', 'Yes. The Baseline chart is free under the MIT licence. `npx shadcn@latest add https://detentui.com/r/chart` installs BaselineChart into your project as source you own.'],
      ['How do I format the numbers, and does it follow dark mode?', 'Pass `format`: it writes both the values and the change in the sentence, so a currency formatter gives “up $18,000”. The line, axis and dots use the page’s `--ink`, `--line` and `--surface` colours, and the blue and red switch to lighter shades under the `dark` variant.'],
    ],
  },
  models: {
    lede: ['An AI model picker with reasoning effort.', 'Effort is a detent you drag and flick, and every model’s time and cost runs with your finger, so you see what thinking harder costs before you choose.'],
    examples: [
      { key: 'two', title: 'Fast or careful', line: 'Two models, one with `reasons: false`. Drag the effort and the careful model’s time and cost move while the quick one stays put, and `onChange` reports `{ model, effort }`.' },
      { key: 'lineup', title: 'Your own effort steps', line: 'A code agent’s five models on three steps of its own, passed as `efforts`: each step multiplies every model’s `time` and `cost`.' },
      { key: 'task', title: 'Set by the task', line: 'The app picks the setting. Choose a task and a new `value` makes the plate glide to its effort and every row’s figures follow.' },
    ],
    faq: [
      ['When should I use an AI model picker with reasoning effort?', 'When people choose which model answers and how much effort it spends, and time and cost should be visible before they run it. It sits in a composer’s bottom row beside the send button and opens upward, so leave about 300px above it. A product with one fixed model doesn’t need it.'],
      ['Is the Model & effort picker free?', 'Yes. Model & effort is free under the MIT licence. `npx shadcn@latest add https://detentui.com/r/models` installs ModelPicker into your project as source you own.'],
      ['Can people use it from the keyboard?', 'Yes. Up and Down move through the models, Left and Right change effort, Enter chooses and Esc closes. The value is controlled: pass `value` as `{ model, effort }` with effort as an index into `efforts`, and pass `muted` to silence the tick.'],
    ],
  },
  prompt: {
    zoom: 0.82,
    lede: ['An AI prompt input box for React.', 'A white card on a quiet tray: one dark key speaks, sends or stops, and while it answers the tray slides out and says what it’s doing, in real seconds.'],
    examples: [
      { key: 'support', title: 'A support assistant', line: 'Its own `placeholder`, a `label` above the words, two plain `modes` and `suggestions` you take with Tab. `status` changes while it works, and the tray reads it out.' },
      { key: 'agent', title: 'A code agent', line: 'Ask, Plan and Edit `modes`, a `models` menu, `projects` in the tray and a file in `initialFiles`. While it works the status walks through its steps, and Esc stops it through `onStop`.' },
      { key: 'writer', title: 'A writing assistant', line: 'Return a promise from `onSend` and the box shows it working until the promise settles. Here the draft streams into the thread above as it is written, then the box is ready again.' },
    ],
    faq: [
      ['How do I add an AI prompt input box to a chat in React?', 'Render PromptBox at the bottom of your chat view, centred, 420 to 640 wide through `width`. It grows upward as people write, so leave the space above it scrollable. `onSend` receives the message: its text, attached files, mode, and the model and project when you pass them.'],
      ['Is the Prompt box free?', 'Yes. Prompt box is free under the MIT licence. `npx shadcn@latest add https://detentui.com/r/prompt` installs PromptBox, and PromptStarters beside it, into your project as source you own.'],
      ['How does the chat input know when the answer is done?', 'Return a promise from `onSend` and the box shows it is working until the promise settles. If it rejects, the words come back and the tray says so. To drive it from your own chat state instead, pass `busy`, and pass `status` for the words in the tray. Stop and Esc call `onStop`.'],
    ],
  },
}
