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
    lede: ['Compare two things across many qualities in one shape.', 'Each side takes the colour of whoever leads there, and the bigger the petal, the bigger the lead. A sentence above it says who wins what, so it needs no legend.'],
    examples: [
      { key: 'lead', title: 'Who leads where', line: 'The sentence names both and says what each one takes, in their colours, so it needs no legend.' },
      { key: 'pick', title: 'Pick any two from a list', line: 'Hand it every option. A new pick takes the place of the older one, and the shape springs to the new pair.' },
      { key: 'scale', title: 'Your own scale', line: 'Six qualities read out of 10. Point at one and the sentence gives the margin and both readings, written by your format.' },
    ],
    faq: [
      ['Why not just use a bar chart?', 'Use bars when there’s one quality, or more than two things. Matchup is for exactly two, compared across several qualities, where the question is who’s ahead where. It looks best in a card up to about 520 wide, close to square.'],
      ['Can I use it from a Next.js server component?', 'RadarCompare is a client component. Load `axes` and `series` on the server and pass them down as plain data. `format` and `onPair` are functions, so pass those from a small client wrapper.'],
    ],
  },
  diff: {
    lede: ['Review the code an agent wants to change, one hunk at a time.', 'Lines stream in as the agent writes, verdicts stamp down as you go, and the view slides from unified to split.'],
    cols: 1,
    examples: [
      { key: 'stream', title: 'While the agent writes', line: 'Pass `shown` as the agent streams and lines arrive one at a time. The counts in the header roll up with each one, and the frame never resizes.' },
      { key: 'one', title: 'One small change', line: 'A single hunk, already written. Accept it with A, reject it with R, press S to see it split, and Apply hands you every verdict.' },
    ],
    faq: [
      ['What do I pass it?', 'The file, a title and the hunks the agent proposed. Each hunk is a list of context, removed and added lines. People accept or reject each one, and `onApply` gets the verdicts, so your agent only applies what was kept.'],
      ['Can someone review a whole diff without the mouse?', 'Yes. J and K move between hunks, A accepts, R rejects, U undoes a verdict and S switches between unified and split. Enter applies once everything is reviewed.'],
    ],
  },
  trace: {
    lede: ['A timeline of an agent run, for the people the agent works for.', 'One bar shows where the time went. Every step reads as a plain sentence on its own track, and a step that’s waiting on you lifts out with Approve inside it.'],
    examples: [
      { key: 'approve', title: 'Held for approval', line: 'A live run paused on a production migration. `onApprove` and `onDeny` put the buttons in the waiting step, `waitingLabel` names who it waits on, and either answer finishes the run.' },
      { key: 'failed', title: 'A run that failed', line: 'A finished run with `status="failed"`. Retries stack on one track as extra `segments`, and the headline names the step it stopped at.' },
      { key: 'steps', title: 'Tokens and spend', line: 'Opens on Steps with `defaultView="steps"`: step names nested by `depth` under a sub-agent, with tokens and cost per step, priced in euros through `currency`.' },
    ],
    faq: [
      ['What does a span look like?', 'Each span is an agent, model or tool step with a `depth` and one or more segments, each with a start, end and status. All steps share one time scale, so the list reads as a waterfall. A retry is just another segment on the same track.'],
      ['Can I load a finished run on the server?', 'Yes. A finished run is plain data, segment times in ms from the start plus `startedAt` and `endedAt`. A live run ticks against `performance.now()`, so give it a `startedAt` on that clock. Pass `onApprove` and `onDeny` from a client wrapper.'],
    ],
  },
  'agent-canvas': {
    lede: ['Show your product working inside Claude, ChatGPT or Grok.', 'The agent ticks off its work in the chat, the result writes itself on the canvas next to it, and nothing turns on until someone says yes.'],
    cols: 1,
    // Examples dropped on Nov 19: the canvas needs its full 980 width to read well, so the demo above carries it.
    examples: [],
    faq: [
      ['How does the yes or no step work?', 'Give AgentCanvas a plan with an `ask` and a `confirm`. The agent writes the result on the canvas and then asks. Yes calls `onEnable` and no calls `onDraft`, each with the plan and the request.'],
      ['Can the plan come from a real model?', 'Yes. `respond` gets the request and the chosen agent and can return a Plan or a promise of one, so it can call your own route that asks Claude, OpenAI or xAI. If it throws, the chat says “Something went wrong. Try asking again.”'],
    ],
  },
  histogram: {
    lede: ['See how readings spread out, and how many miss your target.', 'Each dot stands for a fixed number of readings. Drag the target pin and every dot past it turns rose, while the headline says what share misses.'],
    cols: 1,
    examples: [
      { key: 'latency', title: 'Latency against a target', line: 'Response times with a long tail, starting at `initialTarget={800}`. The median, p95 and p99 stand as pins above the dots, and `onTarget` reports each new target as the pin moves.' },
      { key: 'builds', title: 'Build times in minutes', line: 'Any distribution works. Here `unit="min"`, `noun="builds"` and `bins={30}` turn it into a chart of CI runs, where the slow cold-cache builds are the ones past the line.' },
      { key: 'presets', title: 'Targets from your buttons', line: 'Hold a `ref` and call `target(v)` to move the pin from your own controls. `per={15}` fixes how many page loads each dot stands for instead of working it out from the data.' },
    ],
    faq: [
      ['When is this better than a bar chart?', 'When the question is how values are spread, like response times against an 800ms goal. DotHistogram takes the raw values and bins them, so the shape is also a count. For categories or a time series, a bar or line chart reads better.'],
      ['Does the target pin work with a keyboard?', 'Yes, it’s a slider. Arrow keys move it one column and Shift with an arrow moves it five. It announces the value and the share that misses. With reduced motion on, the dots appear in place instead of dropping in.'],
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
    faq: [
      ['What data does it need?', 'A list of stages, each with a label, a value and an optional `why`. FlowFunnel works out each step’s rate from the one before. When someone drags a step, the headline does the maths in your `goal` and `per` words.'],
      ['How do I read what people changed?', '`onChange` gets an array of rates, one per step, each a share of the step before. A `ref` gives you `set(i, rate)` and `reset()`. From the keyboard, arrows move a step by one point and Esc goes back to the real numbers.'],
    ],
  },
  trend: {
    lede: ['A forecast that shows how sure it is.', 'The past is a line. What comes next is a band of ink that widens and thins as it runs out, so the part you can trust is the part that looks solid.'],
    cols: 1,
    examples: [
      { key: 'revenue', title: 'Revenue six months out', line: 'Eighteen months of MRR and a `low` and `high` for each month ahead. `format` writes dollars in thousands, and `unit` finishes the sentence.' },
      { key: 'capacity', title: 'When the disk fills', line: 'Storage forecast twelve days ahead with `look="plain"` for a flat band, `today="Last scan"` on the seam, and `odds` giving its own words for how sure each day is. `onRead` reports the day you point at.' },
    ],
    faq: [
      ['What do I pass for the forecast?', '`history` is a label and value for each day so far. `forecast` is a label with `low` and `high` for each day ahead. Point along the band and the sentence gives that day’s range and how far to believe it, from Likely to A long shot.'],
      ['Does it work with the App Router?', 'Yes. Load `history` and `forecast` on the server and pass them in as plain data. OutlookChart is a client component, so `format`, `odds` and `onRead` come from a small client wrapper.'],
    ],
  },
  chart: {
    lede: ['Pick any day and read the change from there.', 'Click the line and that day becomes the level. Above it prints blue, below it red, and the sentence reads the change again from the new day.'],
    cols: 1,
    examples: [
      { key: 'launch', title: 'Read from launch day', line: 'Daily active users with `start` set to launch day, so the sentence says what the launch kept. Click another day and `onStart` reports it.' },
      { key: 'value', title: 'Order value in euros', line: 'Average order value over a month with `look="plain"` for flat fills. `format` uses Intl to write euros, both for the values and for the change in the sentence.' },
    ],
    faq: [
      ['How is this different from a normal line chart?', 'It reads one metric against a day you pick, like a launch or a price change. Give BaselineChart `data` and a `start`, and the headline writes something like “Since Sep 6, up $18,000 by Oct 8, or 42.7%”. For many series, use a plain line chart.'],
      ['Does it handle currency and dark mode?', 'Pass `format` and it writes both the values and the change, so a currency formatter gives “up $18,000”. Colours come from the page’s `--ink`, `--line` and `--surface`, and the blue and red get lighter under `dark`.'],
    ],
  },
  models: {
    lede: ['Let people pick a model and how hard it thinks.', 'Effort is a detent you drag and flick. Every model’s time and cost moves with your finger, so you see what thinking harder costs before you choose.'],
    examples: [
      { key: 'two', title: 'Fast or careful', line: 'Two models, one with `reasons: false`. Drag the effort and the careful model’s time and cost move while the quick one stays put, and `onChange` reports `{ model, effort }`.' },
      { key: 'lineup', title: 'Your own effort steps', line: 'A code agent’s five models on three steps of its own, passed as `efforts`: each step multiplies every model’s `time` and `cost`.' },
      { key: 'task', title: 'Set by the task', line: 'The app picks the setting. Choose a task and a new `value` makes the plate glide to its effort and every row’s figures follow.' },
    ],
    faq: [
      ['Where does it go in a chat UI?', 'In the composer’s bottom row, next to send. It opens upward, so leave about 300px above it. If your product only ever uses one model, you don’t need it.'],
      ['What does `value` look like?', 'It’s controlled. Pass `{ model, effort }`, where effort is an index into `efforts`. Up and Down change the model, Left and Right change effort, Enter picks and Esc closes. `muted` turns off the tick.'],
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
    faq: [
      ['Where should it sit?', 'At the bottom of your chat view, centred, between 420 and 640 wide through `width`. It grows upward as people write, so keep the space above it scrollable. `onSend` gets the text, any files, the mode, and the model and project if you pass them.'],
      ['How does it know the answer is done?', 'Return a promise from `onSend`. The box shows it’s working until the promise settles, and if it rejects the words come back. If you’d rather drive it from your own chat state, pass `busy` and `status`. Stop and Esc call `onStop`.'],
    ],
  },
  rewrite: {
    lede: ['Select a phrase, say how it should read, and watch it change in place.', 'The new wording streams in after the struck-through original, like a tracked change, with the number of words it moved. Tab takes it.'],
    examples: [],
    faq: [
      ['How do I connect it to my model?', 'Pass `rewrite`, a function that gets the selected words and the ask and returns a promise of the new wording. `actions` sets the quick asks, Shorter and Friendlier by default. `onChange` gets the whole text after each accepted change.'],
      ['What are the keys?', 'Enter sends the ask. Tab accepts once it has finished streaming. Esc stops it, or puts the original back. A live region tells screen reader users when it’s rewriting and reads out the suggestion.'],
    ],
  },
  filter: {
    lede: ['Type what you want to see, and get filters back.', 'Each phrase gets underlined and hangs its filter on a thread. When a word could mean two things it asks you, with a count for each answer.'],
    examples: [],
    faq: [
      ['What does my `read` function return?', 'Clauses. Each one has the character range it covers, its `field`, its possible readings, and an `ask` if it’s ambiguous. `read` also gets an AbortSignal, so typing again cancels the last call. `count` returns results for a set of filters and `onFilters` reports every change.'],
      ['What happens with an ambiguous word?', 'Its filter shows dashed in amber and the question waits underneath with numbered answers, 1 to 9 on the keyboard. Until someone answers, the count shows a range, worked out by calling `count` once per reading.'],
    ],
  },
  scatter: {
    lede: ['Draw a loop around any cluster and see what’s in it.', 'Every point is a dot, sized by weight and coloured by group. The headline tells you how many are inside, their averages and the group most of them belong to.'],
    examples: [],
    faq: [
      ['What does each point need?', 'An `id`, `x` and `y`, an optional `size` and a `group`. Pass `groups` with a `label` and `hue`, plus `xLabel` and `yLabel`. `onSelect` gets the ids inside the lasso, or null when a double-click clears it.'],
      ['Can I draw the selection from code?', 'Yes. Call `lasso(path)` on a `ref` with a polygon of `[x, y]` pairs in your data’s units. The dots inside light up and `onSelect` fires as if someone drew it. `lasso(null)` clears it.'],
    ],
  },
  bridge: {
    lede: ['Show how one revenue total turns into the next.', 'Drag across the steps and the running total rolls on its digits while each bar fills as you reach it. The sentence names what moved it most.'],
    examples: [],
    faq: [
      ['How do I shape the data?', 'Pass `periods`, each with an `id`, a `label` and its `steps`. A step is a `label` and a `value`. Mark the opening and closing totals with `total: true`, and everything else counts as a change from the running level.'],
      ['Is it usable without a mouse?', 'Yes. The chart is a slider. Left and Right step through the bars, and each step is read out with its label and running total. The periods are a radio group. `muted` turns off the tick.'],
    ],
  },
  askchart: {
    lede: ['Ask a question about your data and get one chart back.', 'The answer is one line over a chart with a single series in colour. A follow-up reshapes the same chart instead of starting a new one.'],
    examples: [],
    faq: [
      ['What goes behind `ask`?', 'Anything that can answer, a model or a text-to-SQL step. It returns a promise with a `headline`, `categories` and `series`, and optionally the chart `kind`, a `format` and the `query` it ran. `onAnswer` reports each question with its answer.'],
      ['How do follow-ups work?', '`ask` gets the history as its second argument, every earlier question and answer up to the one on screen. Questions stay in a trail above the chart. Go back to one and ask from there, and the ones after it drop off.'],
    ],
  },
  dates: {
    lede: ['A date range picker you can type into.', 'Write “since sep 3” or pick a period and the dates show as you go. The calendar is there for exact days, and Apply also gives you the period to compare against.'],
    examples: [],
    faq: [
      ['What can people type?', 'Things like “last 30 days”, “2w”, “last quarter”, “ytd”, “q2 2026”, “march”, “since sep 3” or “mar 3 to mar 20”. It’s parsed in the browser with no model, and no range goes past `today`.'],
      ['What does `onApply` get?', 'The chosen `{ from, to }` range and the one it compares against. That’s the period just before, the same dates last year, or null if comparison is off.'],
    ],
  },
  upload: {
    lede: ['Drag files over it and the folder tips open.', 'Let go and they fall in as sheets, images with a preview. The list below keeps a fixed height, so adding files never pushes the page down.'],
    examples: [],
    faq: [
      ['Does it upload the files itself?', 'No. You get them in `onFiles` and send them wherever you keep files. Until then each bar moves at a pace set by the file’s size.'],
      ['Does `accept` block other file types?', 'No, it’s only the hint under the headline, PNG, JPG, PDF or MP4 by default. Check types yourself in `onFiles`. The drop zone is a button, so Enter or Space opens the file dialog.'],
    ],
  },
  extract: {
    lede: ['Check what a model read from a document before it’s saved.', 'Point at a field and a thread runs to where it was found on the page. The fields it isn’t sure about come first, one at a time.'],
    examples: [],
    faq: [
      ['How do I describe each field?', 'Give it a `state` of `ok`, `check` or `risk`, a `flag` saying why, and `choices` that settle it. Pass the `page` to show with its `width` and `height`. `onChoose` reports each choice, and `onApprove` and `onReject` sit on the two buttons.'],
      ['What format is `box`?', '`[x, y, width, height]` as fractions of the page, the shape extraction services return. So the page can be an image or a PDF render. A value found somewhere else, like an email, takes a `source` instead.'],
    ],
  },
  rings: {
    lede: ['Progress bars for a month of goals, with the numbers set big.', 'Scrub through the month and bars and digits move together. Push a bar past 100% and it holds under your hand, then breaks through in amber.'],
    examples: [],
    faq: [
      ['How do I set up the goals?', 'Each goal has an `id`, a `label`, the `goal` and a `series` of daily totals. Pass `days` in the period and `today` too. The line under each name says if it’s ahead, on pace or how far over.'],
      ['Can people scrub with the keyboard?', 'Yes. Arrow keys step one day, Home goes to the first, and End or Esc come back to today. Days after `today` can’t be reached. `onDayChange` reports the day being read.'],
    ],
  },
  metric: {
    lede: ['A metric card that says why the number moved.', 'The change is written in words instead of a green or red pill, with a reason and the four drivers that counted most. Point at a driver and the number shows what it would be without it.'],
    examples: [],
    faq: [
      ['Does it call a model for the explanation?', 'No. You pass your model’s answer as each metric’s `reason` and it arrives word by word. Give a driver a `phrase` that appears in the reason and those words get underlined and tied to it.'],
      ['What does a metric look like?', 'A `value`, the `previous` one, `vs` for what it’s compared with, the `reason` and `drivers` with an `amount`. It writes lines like “up $12,410 on September” for you.'],
    ],
  },
  forecast: {
    lede: ['See how long your cash lasts, and ask what if.', 'Type a what-if and the forecast bends away from the plan. Switch to Range and the line becomes forty likely futures, and the runway becomes a range.'],
    examples: [],
    faq: [
      ['What data does it need?', '`start` as a year and month, `past` cash for each month so far, and `plan` as the net change for each month ahead. What-ifs live in your `scenarios` list. Holding Adopt calls `onAdopt`, where you fold them into the plan.'],
      ['Can my own model answer the what-ifs?', 'Yes, through `onAsk`. It gets the text, a `status` function and an abort `signal`, and returns a Scenario, a Question when a name is ambiguous, or null for “Try rewording it”.'],
    ],
  },
  voicenote: {
    lede: ['A voice note player where the transcript keeps up with the voice.', 'The waveform’s dots ink in as it plays, the speed steps through 1×, 1.5× and 2×, and each word turns from grey to ink as it’s said.'],
    examples: [],
    faq: [
      ['How do I feed it the transcript?', 'Pass `words`, each a `word` with the second it’s said `at`, and the `duration`. Add `src` to play real audio, or leave it out and it runs on a clock. A `ref` gives you `play`, `pause`, `seek` and `speed`.'],
      ['Does it work with a keyboard and screen reader?', 'Yes. The waveform is a slider, Left and Right skip two seconds, and it reads out the position like “0:12 of 0:40”. Play, speed and the transcript toggle are labelled buttons.'],
    ],
  },
  halo: {
    lede: ['A soft glow to sit behind your hero.', 'The colour starts over at every curved edge, so one glow reads like glass. The bands follow your pointer a beat apart, and a press melts in the next palette.'],
    examples: [],
    faq: [
      ['How do I put my content on it?', 'Wrap your hero in HaloBands and give it a height with `className`. Your content sits in the clear middle. It comes with four palettes, or pass your own `palettes` with `core`, `mid` and `edge` colours.'],
      ['Will it slow the page down?', 'It only animates while it’s on screen, and it moves the light with GPU transforms. With reduced motion on it holds still. Clicks on links and buttons inside it don’t change the palette.'],
    ],
  },
  find: {
    lede: ['Find in page that dims everything but the match.', 'The match and its sentence stay lit, one plate glides from match to match, and it starts from where you’re reading, not from the top.'],
    examples: [],
    faq: [
      ['Does it change my markup?', 'No. It lays a lit copy over your content, so you can wrap anything in LitFind. `open` and `onOpenChange` let your own button open it, which you’ll want on phones.'],
      ['Does it take over ⌘F everywhere?', 'Only while the pointer or focus is inside it. The browser’s find still works on the rest of the page, and `shortcut={false}` turns it off. Enter and Shift+Enter step through matches and Esc closes.'],
    ],
  },
  rewind: {
    lede: ['A textarea you can rewind.', 'Hold ⌘Z and drag, and your writing runs back under your hand, with deleted words coming back in colour. A tap steps back one thought, not one letter.'],
    examples: [],
    faq: [
      ['How does it decide what one step is?', 'Every pause longer than two and a half seconds becomes a notch. Store what `onHistory` gives you and pass it back as `history`, and undo still works after a reload. It takes plain text only.'],
      ['Which keys does it use?', '⌘Z or Ctrl+Z goes back to the last pause and ⇧⌘Z goes forward. Hold it and the mouse and wheel scrub the history. Esc puts the text back. Use it anywhere you’d use a textarea, with `value` and `onChange`.'],
    ],
  },
  popup: {
    lede: ['A select that opens right where you pressed.', 'The current choice stays under your finger, so you slide to the next one and let go. A quick tap keeps it open for people who click.'],
    examples: [],
    faq: [
      ['When should I use a combobox instead?', 'When the list is long. Popup is for about two to eight choices, all shown at once with no scrolling or search.'],
      ['Does it behave like a normal select?', 'Yes. Arrows open it and move, Enter picks, Esc closes, and `name` sends the value with a form. Use `value` and `onChange`, or `defaultValue` if you don’t need to control it.'],
    ],
  },
  phrase: {
    lede: ['Settings written as one sentence.', 'Only the words you can change are dark. Tap one to pick another, drag a number sideways to dial it, and the line under it says what the choice means.'],
    examples: [],
    faq: [
      ['How do I build the sentence?', 'Pass `parts` in order. A part is plain text, a choice with an `id` and `options`, or a number with `min`, `max` and `step`. `onChange` gets every value by id, and `says` writes the line underneath.'],
      ['Can it be used without a mouse?', 'Yes. Enter opens a word’s menu and Esc closes it. Numbers are sliders, the arrows step them, Shift steps by ten, and Home and End jump to the ends.'],
    ],
  },
  announce: {
    lede: ['The small pill above a headline that says what’s new.', 'A line of light runs round it once as you reach for it, and the tag rolls from New to what pressing it will do.'],
    examples: [],
    faq: [
      ['How do I set the words?', 'Your text goes in as children, with an `href`. `tag` is the word in the dark tag and `action` is what it rolls to on hover, New and View by default. Add `dismissible` for a close button.'],
      ['Can I use it with Next.js Link?', 'Yes. Pass `Link` as `linkAs` and navigation stays client side. If you want a dismissal to stick, save it in `onDismiss`.'],
    ],
  },
  slices: {
    lede: ['A headline that puts itself together from strips.', 'The words fly in as strips from alternating sides and line up into letters. Move over them and they part around the pointer, then heal when it leaves.'],
    examples: [],
    faq: [
      ['What can I change?', '`strips` sets how many strips it’s cut into, `fill` takes any CSS background for gradient letters, and `reach` sets how far they part. It plays once, the first time it scrolls into view.'],
      ['Is it readable for screen readers?', 'Yes. The headline is one image labelled with your `text`, so it’s read once, not strip by strip. With reduced motion on, the letters just appear. `interactive={false}` keeps the reveal and drops the hover.'],
    ],
  },
  region: {
    lede: ['Pick a server region on a globe that turns with you.', 'Flick through a drum of regions while the Earth turns with it, lit by today’s sunlight. It draws a route from your visitor with the latency beside it.'],
    examples: [],
    faq: [
      ['What does each region need?', 'A `name`, `code`, `lat` and `lon`, ordered west to east. It opens on the fastest one and says how much slower the others are. Pass your own measured times in ms as `latency`.'],
      ['Will it get in the way of scrolling on phones?', 'Not with `passOver`. A quick swipe scrolls the page, a tap above or below the middle steps the drum, and resting a finger first spins it.'],
    ],
  },
  threads: {
    lede: ['A hero where every thread runs through your button.', 'Fine threads sweep in from both edges and gather through the call to action. They tighten as you get close, and carry light out along every one when it’s pressed.'],
    examples: [],
    faq: [
      ['How do I set it up?', 'Put ThreadHero in a section with a height, since it fills its parent. Pass `title`, `sub` and `action`. `onAction` runs on press and `sentLabel` replaces the button text after. The `title` renders as an `h1`.'],
      ['What if WebGL isn’t there?', 'The threads need WebGL, but the headline and button are plain HTML, so they still work without it. With reduced motion the threads hold still, and nothing draws while it’s off screen.'],
    ],
  },
  glyph: {
    lede: ['Turn any icon or word into ASCII art.', 'Characters shimmer into the shape, lit from the top left. Change the shape and they re-form, move over it and they light up.'],
    examples: [],
    faq: [
      ['What can I pass as the shape?', '`{ path }` with a 24×24 SVG icon path, like one from simple-icons, or `{ text }` for a word. It fills its parent and sizes the characters to fit unless you set `cell`.'],
      ['Does it follow dark mode?', 'Yes. The characters use your text colour and the lit ones use `--accent`. Override them with `ink` and `accent`. `interactive={false}` gives a still version, and `label` lets screen readers hear it as an image.'],
    ],
  },
  hello: {
    lede: ['A language picker with the world drawn in its own letters.', 'Pick a language and the globe turns there, and its country lights up in orange, spelling the greeting.'],
    examples: [],
    faq: [
      ['Which languages come with it?', '37 out of the box. Pass `locales` to use your own, each with a code, native and English name, country, greeting, `lat` and `lon`. `onChange` gets the chosen locale.'],
      ['How does `auto` work with server rendering?', 'The server renders the `initial` locale, `hi-IN` by default. With `auto` on, the browser then switches to the visitor’s language if it’s in the list.'],
    ],
  },
  emoji: {
    lede: ['An emoji picker with no grid.', 'Emoji and symbols sit in one round field you fling around, the ones in the middle grow, and a tap sends one flying into the message at your cursor.'],
    examples: [],
    faq: [
      ['Does it come with a message box?', 'Yes, its own field and Send button. `draft` sets the opening text, `onPick` gets each emoji added, and `onSend` gets the finished message, then the field clears.'],
      ['Can people use it from the keyboard?', 'Yes. Arrows move through the field, Enter or Space adds the one in the middle, and typing a letter jumps to search. In search, Enter adds the first match and Esc clears it.'],
    ],
  },
  shift: {
    lede: ['One card for where your visitors come from, read three ways.', 'Switch between List, Bars and Change and every bar, icon and number moves to its new place, so the source you were looking at stays in sight.'],
    examples: [],
    faq: [
      ['What goes in each row?', 'An `id`, `label`, `value` and `icon`, plus an optional `delta` in percent. Anything past `limit` folds into one extra row. Hover a source and the headline answers for it.'],
      ['Can I control the view from outside?', 'Yes. Pass `view` with `onViewChange` to keep it in your state, or `defaultView` and let the card handle it. Arrow keys move between views and between sources.'],
    ],
  },
  livelist: {
    lede: ['A checklist your whole team writes in at once.', 'New items land in their group with the person’s name, ticked ones settle into Done, and while you’re reading the list waits behind a “2 new” pill.'],
    examples: [],
    faq: [
      ['How do I sync it?', '`onItemsChange` gets the whole list after every add or tick. Send it to your sync layer and pass the new `items` back. Use `defaultItems` instead if the list can keep its own state.'],
      ['Will the page jump when someone adds an item?', 'No. The list scrolls inside a fixed `height`, 340 by default. While someone is pointing at it or typing, new items wait behind the pill until they tap it or look away.'],
    ],
  },
  mcp: {
    lede: ['The install card for your MCP server.', 'Pick Cursor, Claude Code, Claude, Windsurf or Zed and it writes that editor’s exact config from your server’s `url`, then waits on the copy until it connects.'],
    examples: [],
    faq: [
      ['What does it generate?', 'Each editor’s own setup, like a `claude mcp add --transport http` command or a `.cursor/mcp.json` entry. Drive `status` through `waiting` and `connected` from your server, and pass `tools` to show the count.'],
      ['Can it handle a local server with a key?', 'Yes. Pass `pkg` and `envVar` and a Local option shows up, running your package through `npx`. The key shows masked in the config and copies in full. `onCreateKey` lets people make one right there.'],
    ],
  },
  buddy: {
    lede: ['A small face for your AI, instead of an orb.', 'Idle eyes follow the pointer and blink. Listening looks down, thinking scans side to side, happy smiles and sleepy droops.'],
    examples: [],
    faq: [
      ['How do I change its mood?', 'Set `mood` from your app to `idle`, `listening`, `thinking`, `happy` or `sleepy`. `size` sets it in pixels and `tone` picks `ink`, `paper` or `blue`. Use it as an avatar, a launcher or a loading mark.'],
      ['What about screen readers?', 'Pass `label` and it’s announced as an image with that name. Without one it’s hidden as decoration. With reduced motion, the eyes stop following and blinking.'],
    ],
  },
  vault: {
    lede: ['A deposit and withdraw card for web3 apps.', 'Connect, pick a token, and drag the amount until it clicks into 25%, half or max. Then follow it from signing to on-chain, with its own message if it’s declined or fails.'],
    examples: [],
    faq: [
      ['How do I hook it to a wallet?', 'Wire `onSubmit`. It gets `{ mode, token, amount }` and returns `ok`, `declined` or `failed`, or a promise of one. Pass your own `tokens` with prices and balances, plus the `apy` it uses to show what a deposit earns.'],
      ['Why doesn’t max use the whole balance?', 'On deposits, max keeps back the token’s `reserve` for network fees, and says so. The amount slider also works from the keyboard, arrows for one `step` and Page Up and Page Down for bigger jumps.'],
    ],
  },
  'support-chat': {
    lede: ['A support bubble that answers with its sources.', 'It shows the articles it read, can run a task like a plan change right in the thread, and hands the chat to a teammate who can see everything above.'],
    examples: [],
    faq: [
      ['How do I connect it to my AI?', 'Pass an `ask` function. It gets the question and returns a Reply with `text`, and optionally `sources`, `followups`, an `action` card, or `handoff: true` to offer a person. Call your own route from there.'],
      ['What happens after a handoff?', 'The teammate’s replies in the source are placeholders, so connect them to your own inbox. Mount the widget once near the root and it pins itself to the corner set by `side`.'],
    ],
  },
  'agent-wallet': {
    lede: ['Spending limits for an AI agent that buys things.', 'A monthly budget that clicks into Light, Normal and Heavy, approval for anything over your limit, and a receipt for every purchase with the agent’s reason.'],
    examples: [],
    faq: [
      ['What props does it take?', 'Just `agent`, `role` and `card`. People drag a budget between $20 and $600, set the amount that needs approval and allow or block merchants.'],
      ['Where do the purchases come from?', 'They’re sample data in the component’s source, along with the rules and the save step. Once it’s in your project, swap them for your agent’s ledger and your own save call.'],
    ],
  },
  week: {
    lede: ['A calendar you add to by typing.', 'Type lunch with Ana thursday at 1 and the week jumps to Thursday, the event drops in as a draft before you press Enter, and a clash gets a warning.'],
    examples: [],
    faq: [
      ['What does it understand?', 'Days, tomorrow, times like 1pm or at 7, and lengths like for 45m. Enter on a draft calls `onAdd` with the new event. Times it can’t place, like 25pm, give no draft rather than a guess.'],
      ['Does it need an API key?', 'No. It parses in the browser with its own rules, so there’s no network call. Left and Right move between days and Esc clears the box.'],
    ],
  },
}
