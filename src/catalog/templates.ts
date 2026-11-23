export type Part = { anchor: string; name: string; line: string; uses: string[] }

export type Template = {
  id: string
  form?: 'app'
  name: string
  kind: string
  pitch: string
  suits: string
  window: string
  line: string
  parts: Part[]
  details: string[]
}

const ALL: Template[] = [
  {
    id: 'dusk',
    name: 'Dusk',
    kind: 'Security agent',
    pitch: 'The landing page for an AI agent: hero, how it works, customers, pricing and questions, with the product working in every section.',
    suits: 'a backend and security agent',
    window: 'dusk.dev',
    line: 'The landing page for an agent that guards what AI writes: one dusk sky lights the hero, the night falls as you reach the end, and the product works in every section, finding, fixing and waiting for a yes.',
    parts: [
      { anchor: 'top', name: 'Hero', line: 'The whole hero is an evening sky: the headline under a glass pill with a light running round its edge, one bright dock, the teams on the horizon, and the product window, revealed by its own border drawing in as the page loads.', uses: ['Living sky', 'Border reveal', 'Live app window'] },
      { anchor: 'promises', name: 'Promises', line: 'Three promises in an open row, each told as a flow: what was asked or found, the steps on one wire, and the card it lands on, which lights once as the wire reaches it.', uses: ['Flows'] },
      { anchor: 'product', name: 'How it works', line: 'One investigation window with its evidence, then a fix tested on a shadow branch and a change that waits for a person.', uses: ['Investigation', 'Fix pill'] },
      { anchor: 'security', name: 'What it watches', line: 'Four tabs in a bezel: policies, secrets, migrations and deploys, each with the run that caught it and the code it wrote.', uses: ['Tabbed product', 'Run log'] },
      { anchor: 'customers', name: 'Customers', line: 'Five teams in a row: the open card spreads out over a live silk shader in its own colour, with the quote, the person and what Dusk did for them.', uses: ['Testimonials', 'Silk shader'] },
      { anchor: 'pricing', name: 'Pricing', line: 'Three plans in an open row ruled by hairlines, the one most teams pick lit from its top edge.', uses: ['Pricing'] },
      { anchor: 'faq', name: 'Questions', line: 'The heading holds still on the left while tall rows of questions run down the right, the first one open.', uses: ['FAQ'] },
      { anchor: 'start', name: 'Call to action', line: 'One row to close: the line on the left, the two buttons on the right, then the link bar.', uses: ['Call to action'] },
      { anchor: 'footer', name: 'Footer', line: 'The page lifts off a still footer with the wordmark standing in the night sky, then slides back over it.', uses: ['Sheet over footer'] },
    ],
    details: [
      'One light runs through the page: a dusk sky behind the hero, the same blue lighting the flows, the stories and the plan most teams pick, and night by the closing and the footer.',
      'Colour means something. Red is exposed, amber is waiting for a yes, green is fixed, blue is Dusk reading. Everything else is ink and grey.',
      'The product is in every section: a finding in the hero, an investigation, a fix on a shadow branch, the run behind each tab, and the night it reads at the end.',
      'The page closes on one quiet row, then lifts off a still footer as a sheet, which slides back over it once you stop.',
      'The privacy policy, the terms and the 404 are built from the same parts, so the whole site reads as one: the same bar, hairlines, headings and footer.',
      'Dark by default with a light theme one click away, and every word, quote, price and log line lives in one content file.',
    ],
  },
  {
    id: 'detent',
    form: 'app',
    name: 'Detent',
    kind: 'Agent workspace',
    pitch: 'The app for an AI assistant: users chat with the agent, watch every step it takes, and approve before it acts.',
    suits: 'an agent that works across your tools',
    window: 'app.detentui.com',
    line: 'The app for an AI agent that works across your tools: sessions down the side, a thread that shows its work as it goes, and a composer that takes photos, files, tools and skills, queues what you ask while it answers, and sets how hard it thinks on a ramp of dots.',
    parts: [
      { anchor: 'sessions', name: 'Sessions', line: 'Pinned, renamed, archived with an undo, filtered by project; a clock on any with a question waiting.', uses: ['Gliding highlight', 'Inline rename'] },
      { anchor: 'thread', name: 'Thread', line: 'The plan ticking off as it works, the diff written line by line and the tests printing as they run, a pause before any command it isn’t trusted with, then charts, terminals, the PR and sources in the answer.', uses: ['Streaming answer', 'Approvals', 'Live steps'] },
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
      'It works the way an agent should be watched: its plan ticking off, the code it writes and the commands it runs printing live, a plan to approve first when you ask for one, and a pause before any command you haven’t trusted.',
      'It works on a phone: sessions become a drawer with the whole app at its foot, review covers the chat, and photos open full width.',
      'The demo plays itself until you touch it, then hands the app to you; a question it was halfway through typing is finished and left for you to send.',
      'Its sessions, turns, sources and models are plain data, ready to be swapped for your own and for what your model streams back.',
    ],
  },
]

export const PARKED: string[] = []

export const TEMPLATES: Template[] = ALL.filter((t) => !PARKED.includes(t.id))
export const TEMPLATE_COUNT = `${TEMPLATES.length} template${TEMPLATES.length === 1 ? '' : 's'}`

export const SOON: { name: string; kind: string; line: string }[] = [
  { name: 'Voice assistant', kind: 'Voice', line: 'For a voice-first product: captions that hold their place, and a call you can try.' },
]

export const template = (id: string) => TEMPLATES.find((t) => t.id === id)
