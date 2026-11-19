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
  rewrite: {
    lede: ['An AI inline rewrite editor for React.', 'Select a phrase, say how it should read, and the new version streams in after the struck-through original like a tracked change, with the word count it moved. Tab takes it.'],
    examples: [],
    faq: [
      ['How do I let people rewrite selected text with AI in React?', 'Give Rewrite the `text` and a `rewrite` function: it receives the selected words and the ask, and returns a promise of the new wording, so it can call your own model route. `actions` sets the quick asks, `Shorter` and `Friendlier` by default, and `onChange` gets the whole text after each accepted change.'],
      ['Is the Rewrite component free?', 'Yes. Rewrite is free under the MIT licence. `npx shadcn@latest add https://detentui.com/r/rewrite` installs it into your project as source you own.'],
      ['Can people accept or undo a rewrite from the keyboard?', 'Yes. Enter sends the ask, Tab accepts the suggestion once it has finished streaming, and Esc stops the request or puts the original words back. A polite live region announces when the assistant is rewriting and reads the suggestion out when it is ready.'],
    ],
  },
  filter: {
    lede: ['A natural language filter input for React.', 'Type what you want to see in plain words: each phrase is underlined and hangs its filter on a thread, and when a word could mean two things it asks, with a count for every answer.'],
    examples: [],
    faq: [
      ['How do I turn a typed question into filters in React?', 'Pass AskFilter a `read` function that takes the text and an AbortSignal and returns clauses: the character range each phrase covers, its `field`, its possible readings, and an `ask` when it’s ambiguous. `count` gives the results for a set of filters, `total` the whole, and `onFilters` reports every change.'],
      ['Is the Ask filter free?', 'It is part of Detent Pro, a one-time payment with every update for life. Once your project has the @detent-pro registry, `npx shadcn@latest add @detent-pro/filter` installs AskFilter as source you own.'],
      ['What happens when the model isn’t sure what a word means?', 'Give that clause an `ask`. Its filter is dashed in amber, the question waits beneath with numbered answers you pick with 1 to 9, and until you answer the count shows a range, worked out by calling `count` once per reading. Typing again aborts the pending `read` through its signal.'],
    ],
  },
  scatter: {
    lede: ['A React scatter plot with lasso selection.', 'Every point a dot, sized by its weight and coloured by its group. Draw a loop round any cluster and the headline says how many are inside, their averages and the group most of them belong to.'],
    examples: [],
    faq: [
      ['How do I select points in a scatter plot by drawing in React?', 'Pass LassoScatter `points` (an `id`, `x`, `y`, optional `size` and a `group`), the `groups` with a `label` and `hue`, and `xLabel` and `yLabel`. People draw a lasso with the pointer, and `onSelect` receives the ids inside it, or null when a double-click clears it.'],
      ['Is the Lasso scatter free?', 'It is part of Detent Pro, a one-time payment with every update for life. Once your project has the @detent-pro registry, `npx shadcn@latest add @detent-pro/scatter` installs LassoScatter as source you own.'],
      ['Can I set the selection from my own code?', 'Yes. Hold a `ref` and call `lasso(path)` with a polygon of `[x, y]` pairs in your data’s own units; the dots inside light and `onSelect` fires as if it were drawn. `lasso(null)` clears it. `formatX`, `formatY` and `noun` decide how the headline writes the averages and the count.'],
    ],
  },
  bridge: {
    lede: ['A React waterfall chart for revenue.', 'One total becomes the next through its changes. Drag across the steps and the running total rolls on its digits while each bar fills as the value reaches it, and the sentence names what moved it most.'],
    examples: [],
    faq: [
      ['How do I build a revenue bridge chart in React?', 'Pass RevenueBridge `periods`, each with an `id`, a `label` and its `steps`. A step is a `label` and a `value`; mark the opening and closing totals with `total: true` and every other step is a change from the running level. `title` names it, `format` writes the numbers, and `onPoint` reports the step being read.'],
      ['Is the Revenue bridge free?', 'It is part of Detent Pro, a one-time payment with every update for life. Once your project has the @detent-pro registry, `npx shadcn@latest add @detent-pro/bridge` installs RevenueBridge as source you own.'],
      ['Can people read it from the keyboard?', 'Yes. The chart is a slider that takes focus: Left and Right step through the bars, Esc lets go, and each step is announced with its label and running total. The periods are a radio group. Pass `muted` to silence the tick it makes as it catches a step.'],
    ],
  },
  askchart: {
    lede: ['An ask-your-data AI chart for React.', 'A question gets one line that answers it over a chart with a single series in colour, and a follow-up reshapes the same chart instead of starting over.'],
    examples: [],
    faq: [
      ['How do I build a chart that answers questions about my data in React?', 'Give AskChart an `ask` function that takes the question and returns a promise of an answer: a `headline`, the `categories`, the `series`, and optionally the `kind` of chart, a `format` and the `query` behind it. Any model or text-to-SQL can sit behind it. `onAnswer` reports each question with its answer.'],
      ['Is the Ask your data chart free?', 'It is part of Detent Pro, a one-time payment with every update for life. Once your project has the @detent-pro registry, `npx shadcn@latest add @detent-pro/askchart` installs AskChart as source you own.'],
      ['How do follow-up questions know what came before?', '`ask` receives the history as its second argument: every earlier question and answer up to the one on screen. Each question stays in a trail above the chart, so going back to one and asking from there drops the questions after it. Pass `initial` to open on an answer already made.'],
    ],
  },
  dates: {
    lede: ['A React date range picker with presets.', 'Type “since sep 3” or take a period and its dates show as you go; the calendar is one step further for exact days, and Apply hands over a comparison with the period before.'],
    examples: [],
    faq: [
      ['How do I add a date range picker with comparison in React?', 'Pass PeriodPicker `today`, an `initial` range of `{ from, to }` dates, and `onApply`. Apply calls it with the chosen range and the range it compares against: the period just before, the same dates last year, or null when comparison is off.'],
      ['Is the Period picker free?', 'It is part of Detent Pro, a one-time payment with every update for life. Once your project has the @detent-pro registry, `npx shadcn@latest add @detent-pro/dates` installs PeriodPicker as source you own.'],
      ['What can people type into it?', 'Phrases like “last 30 days”, “2w”, “last quarter”, “ytd”, “q2 2026”, “march”, “since sep 3” or “mar 3 to mar 20”. The parser in `parse.ts` runs locally with no model, and no range runs past `today`. Enter applies what was typed.'],
    ],
  },
  upload: {
    lede: ['A drag and drop file upload component for React.', 'Files hovering over the zone tip a folder open and dropped files fall in as sheets with their previews. The list below holds a fixed height, so adding files never pushes the page.'],
    examples: [],
    faq: [
      ['How do I get the files people drop into a React upload zone?', 'Render Upload and pass `onFiles`: it receives the File objects from a drop or from the browse dialog, ready to send to your storage. `accept` is the hint written under the headline, `PNG, JPG, PDF or MP4` by default; it doesn’t limit what the picker allows, so check types in `onFiles`.'],
      ['Is the Upload component free?', 'Yes. Upload is free under the MIT licence. `npx shadcn@latest add https://detentui.com/r/upload` installs it into your project as source you own.'],
      ['Does Upload send the files for me?', 'No, it hands them to you: `onFiles` gets the File objects and you send them to your own storage. Each row’s bar is an estimate paced by the file’s size, and images get a real preview from the dropped file. The drop zone is a focusable button, so Enter or Space opens the file dialog.'],
    ],
  },
  extract: {
    lede: ['An AI document extraction review UI for React.', 'Check what a model read from an invoice or form before it’s saved: point at a field and a thread runs to its box on the page, and the fields it isn’t sure of come first, one at a time.'],
    examples: [],
    faq: [
      ['How do I let people review AI-extracted fields before saving in React?', 'Pass ExtractionReview the `page` to show (a node with its `width` and `height`) and the `fields`. Give each one a `state` of `ok`, `check` or `risk`, a `flag` saying why, and `choices` that settle it to ok or hold. `onChoose` reports each choice, and `onApprove` and `onReject` sit on the two buttons.'],
      ['Is the Extraction review free?', 'It is part of Detent Pro, a one-time payment with every update for life. Once your project has the @detent-pro registry, `npx shadcn@latest add @detent-pro/extract` installs ExtractionReview as source you own.'],
      ['What shape do the field boxes need to be in?', 'A field’s `box` is `[x, y, width, height]` as fractions of the page, the shape extraction services return, so the page can be an image, a PDF render or anything you draw. A value found somewhere else, like an email, takes a `source` with where it came from and the line it was found in instead.'],
    ],
  },
  rings: {
    lede: ['React goal progress bars with big percentages.', 'Each goal is a soft bar with its number set large on top. Scrub through the month and bars and digits move as one; push a bar past 100% and it holds under your hand, then breaks through amber.'],
    examples: [],
    faq: [
      ['How do I show progress toward several goals in React?', 'Pass GoalNumerals `goals`, each with an `id`, `label`, `goal` and a `series` of daily totals, plus `days` in the period and `today`. The line under each name says ahead of pace, on pace or how far over. `onDayChange` reports the day being read and `onOver` the goals past their target.'],
      ['Is the Goal numerals component free?', 'Yes. Goal numerals is free under the MIT licence. `npx shadcn@latest add https://detentui.com/r/rings` installs it into your project as source you own.'],
      ['Can people read past days from the keyboard?', 'Yes. The day scrubber is a slider: the arrow keys step a day, Home jumps to the first day, and End or Esc come back to today. Days after `today` are out of reach. `dayLabel` names each day for screen readers, and `muted` silences the click as a bar breaks through.'],
    ],
  },
  metric: {
    lede: ['An AI metric card that explains the number.', 'The change is said in words, not a green or red pill, with a reading of why it moved and the four drivers that counted most. Point at a driver and the number shows what it would be without it.'],
    examples: [],
    faq: [
      ['How do I build a KPI card that explains why a metric changed in React?', 'Pass MetricExplainer `metrics`, each with a `value`, `previous`, `vs` (what it’s compared with), a `reason` and `drivers` with an `amount` and optional `note`. It writes “up $12,410 on September” for you. Use `metric` and `onMetricChange` to control the tabs, or `defaultMetric` to leave them alone.'],
      ['Is the Metric explainer free?', 'Yes. Metric explainer is free under the MIT licence. `npx shadcn@latest add https://detentui.com/r/metric` installs it into your project as source you own.'],
      ['Where does the AI explanation come from?', 'From you: pass your model’s answer as each metric’s `reason`, and it arrives word by word in a space held for three lines. Give a driver a `phrase` that appears in the reason and those words are underlined; pointing at them lights the driver. `highlight` points at one by name from outside.'],
    ],
  },
  forecast: {
    lede: ['A React cash runway forecast with what-ifs.', 'Ask a what-if in plain words and the forecast bends away from the plan. Switch to Range and the line becomes forty likely futures, and the runway a range.'],
    examples: [],
    faq: [
      ['How do I build a cash runway forecast chart in React?', 'Pass CashForecast `start` as a year and month, `past` cash for each month so far and `plan` as the net change for each month ahead. What-ifs live in your `scenarios` list, switched with `onToggle` and dropped with `onRemove`. Holding Adopt calls `onAdopt`, where you fold them into `plan`.'],
      ['Is the Cash forecast free?', 'It is part of Detent Pro, a one-time payment with every update for life. Once your project has the @detent-pro registry, `npx shadcn@latest add @detent-pro/forecast` installs CashForecast as source you own.'],
      ['Can the what-ifs come from my own model?', 'Yes. `onAsk` gets the typed text with a `status` function and an abort `signal`, and resolves with a Scenario, a Question when a name could mean two things, or null to say “Try rewording it”. Stop aborts the signal. `recognise` lights the words your model understands as they are typed.'],
    ],
  },
  voicenote: {
    lede: ['A React voice note player with a transcript.', 'A waveform of dots inks in as it plays, the speed steps 1×, 1.5×, 2× with each press, and the transcript turns from grey to ink word by word with the voice.'],
    examples: [],
    faq: [
      ['How do I play a voice message with a synced transcript in React?', 'Pass VoiceNote `words`, each a `word` and the second it is said `at`, and the note’s `duration`. Add `src` and it plays the real audio; leave it out and it runs on a clock. Without `peaks`, the waveform is worked out from the words’ timing. A `ref` gives `play`, `pause`, `seek` and `speed`.'],
      ['Is the Voice note player free?', 'Yes. Voice note is free under the MIT licence. `npx shadcn@latest add https://detentui.com/r/voicenote` installs it into your project as source you own.'],
      ['Is it accessible to keyboard and screen reader users?', 'Yes. The waveform is a slider: Left and Right skip two seconds, and it reads the position as “0:12 of 0:40”. Play, the speed step and the Transcript toggle are real buttons with labels, and the toggle reports whether the transcript is open. `defaultTranscript` sets how it starts.'],
    ],
  },
  halo: {
    lede: ['A React glow gradient behind your hero.', 'Colour restarts at every curved edge, so one glow reads as glass. The bands drift after the pointer, each a beat behind the last, and a press melts in the next palette while the shapes stay put.'],
    examples: [],
    faq: [
      ['How do I add a glowing gradient behind a hero section in React?', 'Wrap the content in HaloBands and give it a height through `className`; your content sits in the clear middle. It ships four palettes, Glacier, Apricot, Orchid and Tide, or pass `palettes` of your own with `core`, `mid` and `edge` colours. `onPaletteChange` reports each change, and `pressToChange={false}` keeps one.'],
      ['Is the Halo bands effect free?', 'Yes. Halo bands is free under the MIT licence. `npx shadcn@latest add https://detentui.com/r/halo` installs it into your project as source you own.'],
      ['Will the glow slow my landing page down?', 'It only animates while it is on screen, and it moves the light with GPU transforms. With reduced motion on, the glow holds still. Presses on buttons, links and fields inside it pass through without changing the palette.'],
    ],
  },
  find: {
    lede: ['Find in page for React, with highlight.', 'Everything dims except the match and the sentence it sits in, and one plate glides from match to match, starting from where you are reading rather than the top.'],
    examples: [],
    faq: [
      ['How do I add find in page with highlighted matches in React?', 'Wrap the content in LitFind. It never edits your markup: a lit copy sits on top, so it works round any content. `defaultQuery` fills the field, `placeholder` labels it, and `open` with `onOpenChange` let your own button open it, which a phone needs.'],
      ['Is Lit find free?', 'It is part of Detent Pro, a one-time payment with every update for life. Once your project has the @detent-pro registry, `npx shadcn@latest add @detent-pro/find` installs LitFind as source you own.'],
      ['Does it take over ⌘F for the whole page?', 'No. ⌘F or Ctrl+F opens it only while the pointer or focus is inside, so the browser’s own find works everywhere else; `shortcut={false}` turns it off. Enter and Shift+Enter step through matches, the count is a slider for Left and Right, and Esc closes on your sentence.'],
    ],
  },
  rewind: {
    lede: ['A React textarea with undo history you can scrub.', 'Hold ⌘Z and drag, and your writing runs back under your hand, with the words you deleted coming back in colour. A tap steps back one thought, not one letter.'],
    examples: [],
    faq: [
      ['How do I add undo history to a textarea in React?', 'Use Rewind in place of a textarea, with `value` or `defaultValue` and `onChange`. Every pause longer than two and a half seconds becomes a notch on the tape. Store what `onHistory` gives you and pass it back as `history`, and undo survives a reload. It takes plain text only.'],
      ['Is the Rewind textarea free?', 'Yes. Rewind is free under the MIT licence. `npx shadcn@latest add https://detentui.com/r/rewind` installs it into your project as source you own.'],
      ['Can people rewind from the keyboard?', 'Yes. ⌘Z or Ctrl+Z steps back to the last pause, ⇧⌘Z goes forward, and holding it turns the mouse and wheel into a scrubber; Esc puts the text back. The pill is a slider that Left and Right move between pauses. Set `pill={false}` to hide it.'],
    ],
  },
  popup: {
    lede: ['A React popup select that opens at the cursor.', 'The current choice opens right where you pressed, so you slide to the next one and let go. A quick tap keeps it open for people who click.'],
    examples: [],
    faq: [
      ['How do I build a select that opens around the current value in React?', 'Pass Popup `options` as a list of strings, with `value` and `onChange` to control it or `defaultValue` to leave it alone. `label` names it for screen readers. `radius` and `textClass` fit the closed pill to the text or the rounded box it sits in.'],
      ['Is the Popup select free?', 'Yes. Popup is free under the MIT licence. `npx shadcn@latest add https://detentui.com/r/popup` installs it into your project as source you own.'],
      ['When should I use it instead of a combobox?', 'For short lists of about two to eight choices: everything shows at once, with no scrolling or search, so long lists belong in a combobox. It still behaves like a select: arrows open and move, Enter chooses, Esc closes, and `name` submits the value with a form.'],
    ],
  },
  phrase: {
    lede: ['A React settings control that reads as a sentence.', 'Only the words you can change are dark: tap one to pick another, drag a number sideways to dial it, and the line underneath says what the choice means.'],
    examples: [],
    faq: [
      ['How do I build a sentence-style settings form in React?', 'Pass Phrase its `parts` in order: plain strings, a choice with `id` and `options`, or a number with `id`, `label`, `min`, `max` and `step`. `onChange` gets every value by id, and `says` writes the line under the sentence from those values.'],
      ['Is the Phrase control free?', 'Yes. Phrase is free under the MIT licence. `npx shadcn@latest add https://detentui.com/r/phrase` installs it into your project as source you own.'],
      ['Can people change it from the keyboard?', 'Yes. Enter opens a word’s menu, the arrows move through its options and Esc closes it. A number is a slider: the arrows step it, Shift with an arrow steps by ten, and Home and End jump to `min` and `max`.'],
    ],
  },
  announce: {
    lede: ['An animated announcement badge for React.', 'The pill above a headline: a line of light runs round it once as you reach for it, and the tag rolls from New to what pressing it will do.'],
    examples: [],
    faq: [
      ['How do I add a “New” announcement pill above a hero headline in React?', 'Render Announcement with an `href` and your words as children. `tag` sets the word in the dark tag and `action` the word it rolls to on hover or focus, New and View by default. Add `dismissible` for a close button.'],
      ['Is the Announcement pill free?', 'Yes. The Announcement pill is free under the MIT licence. `npx shadcn@latest add https://detentui.com/r/announce` installs it into your project as source you own.'],
      ['Can I use it with the Next.js Link and remember a dismissal?', 'Yes. Pass `Link` through `linkAs` and the pill renders it with your `href`, so navigation stays client side. Announcement is a client component, and `onDismiss` runs when the close button is pressed, so store the choice there from a client wrapper.'],
    ],
  },
  slices: {
    lede: ['An animated text reveal for React headlines.', 'The words are cut into strips that fly in from alternate sides and line up into letters, then part around the pointer and heal when it leaves.'],
    examples: [],
    faq: [
      ['How do I animate a headline into place with strips in React?', 'Render SliceText with your `text` and size it through `className`. `strips` sets how many strips it is cut into, `fill` takes any CSS background for gradient letters, and `reach` sets how far they part under the pointer. It plays once, the first time it comes into view.'],
      ['Is Slice text free?', 'Yes. Slice text is free under the MIT licence. `npx shadcn@latest add https://detentui.com/r/slices` installs it into your project as source you own.'],
      ['Is the text still readable for screen readers and reduced motion?', 'Yes. The whole headline is one image labelled with `text`, so screen readers read the words once instead of every strip. With reduced motion the letters simply appear and stay still. Set `interactive={false}` to keep the reveal but drop the pointer effect.'],
    ],
  },
  region: {
    lede: ['A React server region picker with a globe.', 'A drum of regions you flick while the Earth turns with it, lit by today’s sunlight, drawing a route from your visitor and the latency beside it.'],
    examples: [],
    faq: [
      ['How do I let people pick a server region in React?', 'Pass RegionWheel `regions`, each with a `name`, `code`, `lat` and `lon`, ordered west to east. It opens on the fastest one and says how much slower any other is. `onChange` gets the region it settles on, and `latency` takes your own measured times in ms.'],
      ['Is the Region wheel free?', 'It is part of Detent Pro, a one-time payment with every update for life. Once your project has the @detent-pro registry, `npx shadcn@latest add @detent-pro/region` installs RegionWheel as source you own.'],
      ['Will it trap scrolling on a phone?', 'Not with `passOver`. A wheel or quick swipe then scrolls the page, a tap above or below the middle steps the drum, and resting a finger before dragging spins it. Without your visitor’s `from` position, a rough guess comes from their time zone.'],
    ],
  },
  threads: {
    lede: ['An animated hero background for React.', 'Hairline threads sweep in from both edges and gather through your call to action, tighten as you come near, and carry light out along every one when the button is pressed.'],
    examples: [],
    faq: [
      ['How do I add an animated hero section with a call to action in React?', 'Render ThreadHero inside a section with a height, since it fills its parent. Pass `title`, `sub` and `action` for the headline, line and button. `onAction` runs on press, and `sentLabel` replaces the button text afterwards. The `title` renders as the page’s `h1`.'],
      ['Is the Thread hero free?', 'It is part of Detent Pro, a one-time payment with every update for life. Once your project has the @detent-pro registry, `npx shadcn@latest add @detent-pro/threads` installs ThreadHero as source you own.'],
      ['What happens without WebGL or with reduced motion?', 'The threads are drawn with WebGL, but the headline, line and button are plain HTML, so they still work if WebGL is unavailable. With reduced motion the threads hold still, and nothing is drawn while the hero is off screen.'],
    ],
  },
  glyph: {
    lede: ['A React ASCII art component for icons and words.', 'Any SVG icon or word drawn in shimmering characters, lit from the top left. Change the shape and the characters re-form; move over it and they light up.'],
    examples: [],
    faq: [
      ['How do I turn an SVG icon into ASCII art in React?', 'Pass GlyphArt a `shape`: `{ path }` with a 24×24 icon path, such as one from simple-icons, or `{ text }` for a word. It fills its parent and sizes characters to the space unless you set `cell`. A press sends a ripple through it.'],
      ['Is Glyph art free?', 'It is part of Detent Pro, a one-time payment with every update for life. Once your project has the @detent-pro registry, `npx shadcn@latest add @detent-pro/glyph` installs GlyphArt as source you own.'],
      ['Does it follow dark mode and my brand colour?', 'Yes. The characters take your text colour and the lit ones take `--accent`, so it follows light and dark on its own. Override either with `ink` and `accent`. Set `interactive={false}` for a still, decorative version, and pass `label` so screen readers hear it as an image.'],
    ],
  },
  hello: {
    lede: ['A React language picker with a globe.', 'The world is drawn in the letters each place writes in. Pick a language and the globe turns there while its country lights up in orange, spelling the greeting.'],
    examples: [],
    faq: [
      ['How do I build a language switcher with a globe in React?', 'Render HelloGlobe and read `onChange`, which gets the chosen locale with its `code`. It ships with 37 languages; pass `locales` for your own, each with a code, native and English name, country, greeting, `lat` and `lon`. Search covers language, country, code and greeting.'],
      ['Is the Hello globe free?', 'It is part of Detent Pro, a one-time payment with every update for life. Once your project has the @detent-pro registry, `npx shadcn@latest add @detent-pro/hello` installs HelloGlobe as source you own.'],
      ['How does `auto` work with server rendering in the Next.js App Router?', 'HelloGlobe is a client component. The server renders the `initial` locale, `hi-IN` by default, and with `auto` set the browser then moves to the visitor’s language when it is in the list. Pass `onChange` from a small client wrapper, since a server page can’t pass functions.'],
    ],
  },
  emoji: {
    lede: ['A React emoji picker without the grid.', 'Emoji and symbols laid out as one round field you fling, with the ones in the middle swelling, and a tap sends the emoji flying into the message at your caret.'],
    examples: [],
    faq: [
      ['How do I add an emoji picker to a message box in React?', 'Render EmojiPicker: it brings its own message field and Send button. `draft` sets the opening text, `onPick` gets each emoji or symbol added, and `onSend` gets the finished message when Send is pressed, after which the field clears.'],
      ['Is the Emoji picker free?', 'It is part of Detent Pro, a one-time payment with every update for life. Once your project has the @detent-pro registry, `npx shadcn@latest add @detent-pro/emoji` installs EmojiPicker as source you own.'],
      ['Can people pick emoji from the keyboard?', 'Yes. The arrow keys move through the field, Enter or Space adds the one in the middle, and typing a letter goes straight to search. In search, Enter adds the first match, Down returns to the field and Esc clears the query.'],
    ],
  },
  shift: {
    lede: ['A React traffic sources card with three views.', 'List, Bars and Change read the same breakdown, and every bar, icon and number moves to its new place when you switch, so the source you were looking at stays in sight.'],
    examples: [],
    faq: [
      ['How do I show traffic sources in a React card?', 'Pass Shift a `title` and `items`, each with an `id`, `label`, `value`, an `icon` and an optional `delta` in percent. Sources past `limit` fold into one more row, and `format` decides how numbers read. Hover or focus a source and the headline answers for it.'],
      ['Is the Shift card free?', 'Yes. Shift is free under the MIT licence. `npx shadcn@latest add https://detentui.com/r/shift` installs it into your project as source you own.'],
      ['Can I control which view it shows?', 'Yes. Pass `view` as `list`, `bars` or `change` with `onViewChange` to hold it in your own state, or `defaultView` to let the card keep its own. The view switch is a radio group: the arrow keys move between views, and inside the sources they move from one to the next.'],
    ],
  },
  livelist: {
    lede: ['A React collaborative checklist that updates live.', 'Teammates’ items arrive in their group with their name, ticked ones settle into Done, and while you read the list holds still behind a “2 new” pill.'],
    examples: [],
    faq: [
      ['How do I build a shared checklist in React?', 'Render LiveList with `people`, `groups`, `items` and `me`, the id of the person using it. `onItemsChange` gets the whole list after every add or tick, so you can send it to your sync layer and pass the new `items` back. Use `defaultItems` instead if the list keeps its own state.'],
      ['Is the Live list free?', 'Yes. Live list is free under the MIT licence. `npx shadcn@latest add https://detentui.com/r/livelist` installs LiveList into your project as source you own.'],
      ['Will the page jump when teammates add items?', 'No. The body scrolls inside a fixed `height`, 340 by default, so the card never grows. While someone points at or types in the list, new items wait behind a pill and land when they tap it or look away. It also follows reduced motion.'],
    ],
  },
  mcp: {
    lede: ['An MCP server install component for React.', 'Pick Cursor, Claude Code, Claude, Windsurf or Zed and the card writes that editor’s exact config from your server’s `url`, then waits on the copy until it connects.'],
    examples: [],
    faq: [
      ['How do I add an MCP install page to my site?', 'Render McpInstall with your server’s `name`, `slug`, `url`, `icon` and the `clients` to offer. It builds each editor’s config, like a `claude mcp add --transport http` command or a `.cursor/mcp.json` entry. Drive `status` from your server through `waiting` and `connected`, and pass `tools` to show the count.'],
      ['Is the MCP install card free?', 'It is part of Detent Pro, a one-time payment with every update for life. Once your project has the @detent-pro registry, `npx shadcn@latest add @detent-pro/mcp` installs McpInstall as source you own.'],
      ['Can it offer a local server with an API key?', 'Yes. Pass `pkg` and `envVar` and a Local option appears, running your package through `npx` with the key in that variable. Pass `apiKey`, or `onCreateKey` to let people make one in the card: it shows masked in the config and copies in full. Claude and Windsurf read one global config, so This project greys out for them.'],
    ],
  },
  buddy: {
    lede: ['An AI assistant avatar with moods for React.', 'A small face instead of an orb: idle eyes follow the pointer and blink, listening looks down, thinking scans side to side, happy smiles and sleepy droops.'],
    examples: [],
    faq: [
      ['How do I show an AI assistant’s state in React?', 'Render Buddy and set `mood` from your app: `idle`, `listening`, `thinking`, `happy` or `sleepy`. `size` sets its width and height in pixels, and `tone` picks `ink`, `paper` or `blue`. It works as an avatar beside replies, a launcher or a loading mark.'],
      ['Is the Buddy avatar free?', 'Yes. Buddy is free under the MIT licence. `npx shadcn@latest add https://detentui.com/r/buddy` installs it into your project as source you own.'],
      ['Is it accessible?', 'Pass `label` and Buddy is announced as an image with that name. Leave it out and it is hidden from screen readers as decoration. With reduced motion on, the eyes stop following the pointer, scanning and blinking, while the sleepy lids still lower.'],
    ],
  },
  vault: {
    lede: ['A web3 deposit and withdraw card for React.', 'Connect, pick a token, drag the amount until it clicks into 25%, half or max, then follow it from signing to on-chain, with its own line when it is declined or fails.'],
    examples: [],
    faq: [
      ['How do I build a crypto deposit form in React?', 'Render Vault and wire `onSubmit` to your wallet. It receives `{ mode, token, amount }`, where mode is deposit or withdraw, and returns `ok`, `declined` or `failed`, or a promise of one. Pass your own `tokens` with prices and balances, `walletName`, `wallet` and the `apy` used to show what a deposit earns.'],
      ['Is the Vault card free?', 'Yes. Vault is free under the MIT licence. `npx shadcn@latest add https://detentui.com/r/vault` installs it into your project as source you own.'],
      ['Can people set the amount from the keyboard?', 'Yes. The amount slider takes focus: the arrow keys move it one `step` of the token, Page Up and Page Down take bigger jumps, and Home and End go to the lowest and highest. On deposits, max holds back the token’s `reserve` for network fees and says so.'],
    ],
  },
  'support-chat': {
    lede: ['An AI customer support chat widget for React.', 'The help bubble in the corner answers with the articles it read, can run a task like a plan change in the thread, and hands the chat to a teammate who has read everything above.'],
    examples: [],
    faq: [
      ['How do I connect a support chat widget to my own AI backend?', 'Pass SupportChat an `ask` function. It gets the question and returns a Reply, or a promise of one: `text`, plus optional `sources`, `followups`, an `action` card, or `handoff: true` to offer a person from `team`. Call your own route there, whether it uses the AI SDK or anything else.'],
      ['Is the Support chat free?', 'It is part of Detent Pro, a one-time payment with every update for life. Once your project has the @detent-pro registry, `npx shadcn@latest add @detent-pro/support-chat` installs SupportChat as source you own.'],
      ['Where do I put it in a Next.js app?', 'Mount it once near the root, inside a positioned container; it pins itself to the corner set by `side`. It is a client component, so pass `ask` from a client wrapper. After a handoff, the teammate’s replies in the source are placeholders, so connect them to your own inbox.'],
    ],
  },
  'agent-wallet': {
    lede: ['An AI agent wallet with spend limits for React.', 'A monthly budget that clicks into Light, Normal and Heavy, approval for anything over your limit, and a receipt for every purchase with the agent’s own reason.'],
    examples: [],
    faq: [
      ['How do I let users set an AI agent’s spending limits in React?', 'Render AgentWallet with the agent’s `agent` name, its `role` and its virtual `card`. People drag a budget from $20 to $600, set the amount that needs approval and allow or block merchants. Purchases waiting on them sit in Activity with Approve, Decline and Always allow.'],
      ['Is the Agent wallet free?', 'It is part of Detent Pro, a one-time payment with every update for life. Once your project has the @detent-pro registry, `npx shadcn@latest add @detent-pro/agent-wallet` installs AgentWallet as source you own.'],
      ['Where does the purchase data come from?', 'AgentWallet takes only `agent`, `role` and `card`. The purchases, rules and save step live in the component’s own source as sample data, so once it is in your project, replace them with your agent’s ledger and your save call.'],
    ],
  },
  week: {
    lede: ['An AI calendar for React where you type events in plain words.', 'Type lunch with Ana thursday at 1 and the week jumps to Thursday, the event drops in as a draft before Enter, and a clash gets a heads-up.'],
    examples: [],
    faq: [
      ['How do I add events by typing natural language in React?', 'Render AiCalendar with `month`, the seven `dates`, `today`, `now` in minutes after midnight, `people` and starting `events`. It reads days, tomorrow, times like 1pm or at 7, and lengths like for 45m as people type. Pressing Enter on a draft calls `onAdd` with the new event.'],
      ['Is the AI calendar free?', 'Yes. AI calendar is free under the MIT licence. `npx shadcn@latest add https://detentui.com/r/week` installs AiCalendar into your project as source you own.'],
      ['Does it need an AI model or an API key?', 'No. The words are parsed in the browser by the component’s own rules, so there is no network call and no key. Times it can’t place, like 25pm, give no draft instead of a guess. The days are a tab list: Left and Right move between them, and Esc clears the box.'],
    ],
  },
}
