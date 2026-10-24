/**
 * Templates: whole landing pages for a kind of product, built from the landing kit and the Pro
 * blocks, and whole apps. Plain data, safe for the server; the views are looked up in
 * src/pro/templates/registry, via `@pro`.
 */

/** One stretch of a template's page. `anchor` is its id on the page, so a viewer can take you there. */
export type Part = { anchor: string; name: string; line: string; uses: string[] }

export type Template = {
  id: string
  /** An app fills its window and plays its own demo; without this it's a landing page that scrolls. */
  form?: 'app'
  /** The made-up product the page is for. */
  name: string
  /** What kind of product it suits. */
  kind: string
  /** The same, as it reads in a sentence: "For an AI support agent." */
  suits: string
  /** The address in the browser bar. */
  window: string
  /** One sentence: what it is. The first clause doubles as the subtitle. */
  line: string
  /** Its sections, top to bottom; for an app, its parts. */
  parts: Part[]
  /** What makes it, for the detail page. */
  details: string[]
}

export const TEMPLATES: Template[] = [
  {
    id: 'lumen',
    name: 'Lumen',
    kind: 'AI support agent',
    suits: 'an AI support agent',
    window: 'lumen.ai',
    line: 'The landing page for an AI product that acts for you. The product works in the hero, every claim is shown live, and the story is about asking before it acts.',
    parts: [
      { anchor: 'top', name: 'Hero', line: 'A headline whose last word acts itself out, over a ticket answered live with its sources.', uses: ['Acting word', 'Living orb', 'Live conversation'] },
      { anchor: 'channels', name: 'Channels', line: 'Every channel round the assistant, each answered in turn.', uses: ['Rings', 'Living orb'] },
      { anchor: 'features', name: 'Features', line: 'Five live tiles: resolving, languages, hand-offs, metrics and tone.', uses: ['Feature bento'] },
      { anchor: 'approvals', name: 'Approvals', line: 'A wire from ticket to customer that waits on a person’s yes.', uses: ['Wire diagram'] },
      { anchor: 'insights', name: 'Insights', line: 'What it noticed, floating over the real dashboard.', uses: ['Agent analytics'] },
      { anchor: 'results', name: 'Results', line: 'Four numbers, each with the customer it changed for.', uses: ['Type cuts'] },
      { anchor: 'customers', name: 'Customers', line: 'A quote that writes itself in, over a wall of short ones.', uses: ['Testimonials'] },
      { anchor: 'pricing', name: 'Pricing', line: 'Usage pricing with a slider that prices every plan.', uses: ['Usage pricing'] },
      { anchor: 'faq', name: 'Questions', line: 'Search as you type, topics, and a person to ask.', uses: ['FAQ'] },
      { anchor: 'start', name: 'Call to action', line: 'An email to start with, beside the queue it clears.', uses: ['Call to action'] },
      { anchor: 'footer', name: 'Footer', line: 'Where to go, the small print, a live count and the theme.', uses: ['Landing kit'] },
    ],
    details: [
      'It argues in order: what it is, everywhere it works, what it does, how it asks before it acts, what it notices, what it changed, then price, questions and a way in.',
      'Every claim is shown, not told. The hero answers a real ticket, the channels light up one by one, and the approval waits on a yes before anything is sent.',
      'Live parts start when they scroll into view and hold their place when they leave, with their animations paused, so a long page stays light.',
      'Motion ends. The headline goes round its words once, the rings turn a few times, and each diagram plays its story, then rests. Point at the headline for more.',
      'Every word lives in one content file. Change the product, its copy and its demo data there, and the sections follow.',
      'Not one layout shift from top to bottom, at any width, in light and dark.',
    ],
  },
  {
    id: 'kiln',
    name: 'Kiln',
    kind: 'Developer tool',
    suits: 'a developer tool',
    window: 'kiln.dev',
    line: 'The landing page for a coding agent, painted in ink: mountains washed onto paper in code, a red sun, and kilns on the hills that fire while the agent works. The page goes from first light to dusk, and the product stands in every scene.',
    parts: [
      { anchor: 'top', name: 'Hero', line: 'Ink mountains at first light with the product standing in them. The kiln on the far hill fires with the run in the window, and the hills drift as you scroll.', uses: ['Ink landscape', 'Live app window'] },
      { anchor: 'proof', name: 'Proof', line: 'Customers set in type and three numbers as rounded dot-matrix readouts.', uses: ['Doto', 'Count'] },
      { anchor: 'run', name: 'How a run goes', line: 'A handscroll: the section holds and scrolling unrolls one ink landscape sideways through four scenes, a red sun crossing the sky and the branch filling in below.', uses: ['Scroll set piece', 'Split terminal'] },
      { anchor: 'parallel', name: 'Parallel runs', line: 'Ten kilns on a hill under the moon, one over each run, firing and cooling as you scroll.', uses: ['Scroll set piece', 'Ink landscape'] },
      { anchor: 'try', name: 'Try one', line: 'Type an issue or pick one: it travels into a kiln between the two cards and comes out the other side as a pull request.', uses: ['Live preview', 'Ink landscape'] },
      { anchor: 'features', name: 'Bento', line: 'Six live pieces of the product, and a typo Kiln fixes in front of you.', uses: ['Bento'] },
      { anchor: 'sandbox', name: 'Security', line: 'The sandbox and a wall drawn as one dry-brush stroke: requests to allowed hosts pass through gaps, blocked ones spatter red, and every host keeps count.', uses: ['Live diagram'] },
      { anchor: 'pricing', name: 'Pricing', line: 'Dot-matrix prices, and the plan most teams pick with a small night of its own that fires on hover.', uses: ['Count', 'Ink landscape'] },
      { anchor: 'faq', name: 'Questions', line: 'Search as you type, topics, and someone to ask.', uses: ['FAQ'] },
      { anchor: 'start', name: 'Call to action', line: 'The hills at dusk and a terminal you can use; every command stokes the kiln, and the install command lands.', uses: ['Interactive terminal', 'Ink landscape'] },
      { anchor: 'footer', name: 'Footer', line: 'Where to go, the status, today’s count and the version.', uses: ['Landing kit'] },
    ],
    details: [
      'One medium runs through the page: an ink landscape painted in code, each ridge thickest at its crest and thinning into mist, with a dry brush’s grain through it and a red sun over it. Each ridge is its own canvas, painted once per size and theme and only when it’s near the screen; only the smoke and a kiln’s glow are drawn again, while on screen.',
      'The kilns answer the product. The one behind the hero fires while the agent works in the window and cools once the pull request merges; ten more fire and cool as you scroll through the parallel runs; one takes your issue in and gives a pull request back; the last flares each time you run a command.',
      'How a run goes is a handscroll: the section holds while you scroll and one continuous landscape unrolls sideways through the four scenes, with the day passing over it. On a phone the scenes stack as plates.',
      'The page itself is white paper and neutral greys; the colour comes from the paintings and one oxblood. In a dark theme it’s the same hills at night, under the moon.',
      'Headlines are tight Geist, numbers are Doto, labels are in brackets, and buttons show the key that presses them.',
      'Every word and every demo’s data lives in one content file, and the whole page is free of layout shift at every width, in light and dark.',
    ],
  },
  {
    id: 'detent',
    form: 'app',
    name: 'Detent',
    kind: 'Agent workspace',
    suits: 'an agent that works across your tools',
    window: 'app.detentui.com',
    line: 'The app for an AI agent that works across your tools: sessions down the side, a thread that shows its work as it goes, and a composer that takes photos, files, tools and skills, queues what you ask while it answers, and sets how hard it thinks on a ramp of dots.',
    parts: [
      { anchor: 'sessions', name: 'Sessions', line: 'Pinned, renamed, archived with an undo, filtered by project; a clock on any with a question waiting.', uses: ['Gliding highlight', 'Inline rename'] },
      { anchor: 'thread', name: 'Thread', line: 'Each step as it runs, a plan to approve, a pause before any command it isn’t trusted with, and charts, terminals and sources in the answer.', uses: ['Streaming answer', 'Approvals'] },
      { anchor: 'composer', name: 'Composer', line: '@ for tools, / for skills, photos pasted or dropped, dictation, and Plan first.', uses: ['Rich composer'] },
      { anchor: 'queue', name: 'Up next', line: 'What you ask while it answers waits in order: send one now, take it back to edit, or drop it. Stopping holds the rest until you resume.', uses: ['Queue'] },
      { anchor: 'models', name: 'Model and reasoning', line: 'Each model with its mark and what it’s for, and reasoning on a ramp of dots that lights up to the playhead.', uses: ['Dot ramp'] },
      { anchor: 'photos', name: 'Photos', line: 'Photos sit in the thread at their own shape, and open full size out of their tile.', uses: ['Photo viewer'] },
      { anchor: 'review', name: 'Review', line: 'The change it made, file by file, beside the chat and ready to merge.', uses: ['Diff review'] },
      { anchor: 'search', name: 'Search', line: '⌘K across every session, or ask about what you typed instead.', uses: ['Search'] },
      { anchor: 'settings', name: 'Settings', line: 'Theme with three dark styles, what it knows about you, models, connected apps and their scopes, and your data.', uses: ['Settings'] },
      { anchor: 'automations', name: 'Automations', line: 'Sessions that start themselves, on a schedule or when something happens.', uses: ['Automations'] },
    ],
    details: [
      'One accent, used as a mark: blue for where you are, what has focus, and how hard it thinks. Everything else is ink and grey, in light, and in a near-black dark with Graphite and Dusk beside it.',
      'Nothing moves on its own. Buttons that rest while it answers keep their room, photos are sized before they paint, and panels glide open rather than jump: not one layout shift.',
      'It works the way an agent should be watched: each step as it runs, a plan first when you ask for one, and a pause before any command you haven’t trusted.',
      'It works on a phone: sessions become a drawer with the whole app at its foot, review covers the chat, and photos open full width.',
      'The demo plays itself until you touch it, then hands the app to you; a question it was halfway through typing is finished and left for you to send.',
      'Its sessions, turns, sources and models are plain data, ready to be swapped for your own and for what your model streams back.',
    ],
  },
  {
    id: 'tandem',
    form: 'app',
    name: 'Tandem',
    kind: 'SaaS dashboard',
    suits: 'a subscription business that wants to see its numbers',
    window: 'tandem.app',
    line: 'The dashboard for a subscription business: one ruler runs every number through the month, an assistant answers with the events behind them, and revenue, customers, invoices and settings share the same hand.',
    parts: [
      { anchor: 'overview', name: 'Overview', line: 'Drag the ruler and the whole page shows that day; events catch it with a click. Revenue as a month of dots, one bar lit with its value, people and a calendar.', uses: ['Timeline ruler', 'Dot month', 'Ask Tandem'] },
      { anchor: 'revenue', name: 'Revenue', line: 'Five numbers with a year in ticks, the month’s movement as a waterfall with its driver lit, revenue by plan, and retention as a field of dots.', uses: ['Waterfall', 'Cohort dots'] },
      { anchor: 'customers', name: 'Customers', line: 'Found as you type, filtered by plan and state, sorted by what matters; seats as a ruler, health as five dots.', uses: ['Data table', 'Tick bars'] },
      { anchor: 'customer', name: 'A customer', line: 'Their numbers, twelve weeks of use in dots, what happened and who’s who, and Tandem’s read on what to do next.', uses: ['Activity timeline'] },
      { anchor: 'invoices', name: 'Invoices', line: 'Failed payments first, with a retry that settles the row as paid and rolls the totals.', uses: ['Retry', 'Rolling numbers'] },
      { anchor: 'assistant', name: 'Ask Tandem', line: 'A question from any page lands here; the answer reads, streams in, and shows its breakdown and the series behind it.', uses: ['Streaming answer'] },
      { anchor: 'settings', name: 'Settings', line: 'The workspace, a team you can invite to, API keys to reveal and copy, and what Tandem tells you about.', uses: ['Settings'] },
      { anchor: 'signin', name: 'Sign in', line: 'Google, GitHub or a link by email, beside the product’s own ink hills.', uses: ['Ink landscape'] },
    ],
    details: [
      'One accent, blue, for where you are and the one thing that matters on each chart. Everything else is ink and grey, in light and in true black.',
      'Data is drawn, not plotted: months in dots, goals and seats as rulers of ticks, forecasts hatched, one bar lit with its value called out.',
      'Every number is “as of” a day you choose on the ruler, so you can stand on the day something shipped and see what followed.',
      'Ask Tandem answers from the page’s own data and events, and a day in an answer moves the ruler there. Its answers are plain data, ready for your model.',
      'Nothing jumps: rows are placed, answers hold their space before their words land, and every panel morphs rather than pops.',
    ],
  },
]

/** Templates on the way, named on the gallery. */
export const SOON: { name: string; kind: string; line: string }[] = [
  { name: 'Voice assistant', kind: 'Voice AI', line: 'For a voice-first product: a living orb, captions that hold their place, and a call you can try.' },
]

export const template = (id: string) => TEMPLATES.find((t) => t.id === id)
