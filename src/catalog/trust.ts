/**
 * The facts the trust pages are built on, in one place. Plain data, safe for the server.
 * Set the licensor's legal name and the contact address before launch; every page follows.
 */

/** Who grants the licences: the legal name of the person or company that sells Detent. */
export const LICENSOR = process.env.NEXT_PUBLIC_LICENSOR ?? 'Detent'

/** Where people write about a licence, a refund or anything else. */
export const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'hello@detentui.com'

/** How long after buying a refund is anyone's for the asking. */
export const REFUND_DAYS = 14

/** When the licence, refund and terms pages last changed. */
export const UPDATED = '2026-10-24'

export const updated = () => new Date(`${UPDATED}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

/** What shipped, newest first. Each item can link to what it's about. */
export type Release = { date: string; title: string; line: string; items: { label: string; href?: string; pro?: boolean }[] }

export const RELEASES: Release[] = [
  {
    date: '2026-10-24',
    title: 'Eight free components, rebuilt to the Pro bar',
    line: 'Thinking dots that play what each step is doing, a context ring with a redline, a voice meter made of dots, typing that keeps a person’s rhythm, a hover card that glides from one person to the next, a sheet that clicks into detents, and a dialog that reshapes as you fill it. Resizable panels make way for something new: the Detent slider.',
    items: [
      { label: 'Detent slider', href: '/components/slider' },
      { label: 'Thinking indicator', href: '/components/thinking' },
      { label: 'Context ring', href: '/components/context' },
      { label: 'Voice input', href: '/components/voice' },
      { label: 'Typing bubble', href: '/components/typing' },
      { label: 'Hover card', href: '/components/hovercard' },
      { label: 'Sheet', href: '/components/sheet' },
      { label: 'Dialog', href: '/components/dialog' },
    ],
  },
  {
    date: '2026-10-24',
    title: 'An agent workspace, the first app template',
    line: 'A whole agent workspace to start from: sessions, a thread that shows its work, a composer that queues what you ask while it answers, reasoning set on a ramp of dots, and photos that open full size. And a prompt playground block, to compare models side by side.',
    items: [
      { label: 'Agent workspace template', href: '/templates/detent', pro: true },
      { label: 'Prompt playground', href: '/blocks/prompt-playground', pro: true },
    ],
  },
  {
    date: '2026-10-23',
    title: 'Charts, one at a time',
    line: 'The chart kit is now six components you can take on their own, each with its own page, and all of them redrawn as instruments.',
    items: [
      { label: 'Trend chart', href: '/components/trend', pro: true },
      { label: 'Bar chart', href: '/components/bars', pro: true },
      { label: 'Goal rings', href: '/components/rings', pro: true },
      { label: 'Waffle chart', href: '/components/waffle', pro: true },
      { label: 'Gauge', href: '/components/gauge', pro: true },
      { label: 'Stat tiles', href: '/components/stats', pro: true },
    ],
  },
  {
    date: '2026-10-23',
    title: 'Nine of the most asked-for pieces',
    line: 'The components people install a library for, each built to the same bar as the rest. Two of them are free.',
    items: [
      { label: 'Time picker', href: '/components/time', pro: true },
      { label: 'Combobox', href: '/components/combobox', pro: true },
      { label: 'Charts', href: '/components/trend', pro: true },
      { label: 'Code block', href: '/components/codeblock', pro: true },
      { label: 'App sidebar', href: '/components/sidebar', pro: true },
      { label: 'Timeline', href: '/components/timeline', pro: true },
      { label: 'Carousel', href: '/components/carousel', pro: true },
      { label: 'Toasts', href: '/components/toaster' },
      { label: 'Detent slider', href: '/components/slider' },
    ],
  },
  {
    date: '2026-10-23',
    title: 'A free tier that installs for real',
    line: 'Every free component installs with one command from a public registry, bringing its files and the Detent theme without touching yours. A Team plan joins Pro.',
    items: [
      { label: 'Public registry', href: '/#install' },
      { label: 'Agent kit', href: '/#install' },
      { label: 'Team plan', href: '/pro#pricing' },
    ],
  },
  {
    date: '2026-10-23',
    title: 'Premium components',
    line: 'The hard, stateful surfaces that take weeks to get right.',
    items: [
      { label: 'Flow builder', href: '/components/flow', pro: true },
      { label: 'Kanban board', href: '/components/kanban', pro: true },
      { label: 'Activity heatmap', href: '/components/heatmap', pro: true },
      { label: 'Video player', href: '/components/video', pro: true },
      { label: 'Image cropper', href: '/components/cropper', pro: true },
      { label: 'Product tour', href: '/components/tour', pro: true },
      { label: 'Rich composer', href: '/components/composer', pro: true },
    ],
  },
  {
    date: '2026-10-23',
    title: 'Overlays, and a second template',
    line: 'Everything that opens over the page, coming from where you pressed and going back there; and Kiln, an ink-wash landing page for a developer tool.',
    items: [
      { label: 'Dialog', href: '/components/dialog' },
      { label: 'Confirm', href: '/components/confirm' },
      { label: 'Popover', href: '/components/popover' },
      { label: 'Tooltip', href: '/components/tooltip' },
      { label: 'Dropdown menu', href: '/components/dropdown' },
      { label: 'Context menu', href: '/components/context-menu' },
      { label: 'Sheet', href: '/components/sheet' },
      { label: 'Hover card', href: '/components/hovercard' },
      { label: 'Kiln template', href: '/templates/kiln', pro: true },
    ],
  },
  {
    date: '2026-10-22',
    title: 'Agents, and whole screens',
    line: 'The components an AI product is made of, the blocks they make together, and Lumen, the first landing-page template.',
    items: [
      { label: 'Streaming answer', href: '/components/answer', pro: true },
      { label: 'Run trace', href: '/components/trace', pro: true },
      { label: 'Diff review', href: '/components/diff', pro: true },
      { label: 'Approval tray', href: '/components/approval', pro: true },
      { label: 'Prompt box', href: '/components/prompt' },
      { label: 'Agent plan', href: '/components/plan' },
      { label: 'Model picker', href: '/components/models' },
      { label: 'Scrub chart', href: '/components/chart', pro: true },
      { label: 'Date range picker', href: '/components/dates', pro: true },
      { label: 'Blocks', href: '/blocks' },
      { label: 'Lumen template', href: '/templates/lumen', pro: true },
    ],
  },
  {
    date: '2026-10-21',
    title: 'The first pieces',
    line: 'Where it started: a command menu, a data table, a file tree and the inputs around them.',
    items: [
      { label: 'Command menu', href: '/components/command' },
      { label: 'Data table', href: '/components/table', pro: true },
      { label: 'File tree', href: '/components/tree' },
      { label: 'Upload', href: '/components/upload' },
      { label: 'Select', href: '/components/select' },
      { label: 'Voice input', href: '/components/voice' },
      { label: 'Usage meter', href: '/components/usage', pro: true },
      { label: 'Payment methods', href: '/components/payments', pro: true },
    ],
  },
]
