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
    date: '2026-10-25',
    title: 'Rapport, a CRM with AI built in',
    line: 'A whole CRM where the AI does the busywork. Rapport opens on a morning brief written from the day’s calls and email, drafts the replies waiting in the inbox, and keeps the tasks. Deals move across a board, along the quarter or down a list, and every change, yours or Rapport’s, can be undone. Companies, people, reports and settings are all there, with ⌘K to reach any of them. Ask Rapport runs on the AI SDK, and Settings decide what it may do without asking.',
    items: [
      { label: 'Rapport template', href: '/templates/rapport', pro: true },
      { label: 'Ask Rapport' },
      { label: 'Inbox with drafted replies' },
      { label: 'Reports' },
    ],
  },
  {
    date: '2026-10-25',
    title: 'Tandem, a SaaS dashboard with AI built in',
    line: 'A dashboard for a subscription business, where the AI is part of the product. Ask Tandem runs on the AI SDK and answers from the dashboard’s own data through tools, drawing what it found under the answer. Three agents work in the background: they chase failed payments, watch for churn and write the weekly report, and anything that moves money waits for a yes. Settings choose their model, cap what they spend and decide what they may do without asking.',
    items: [
      { label: 'Tandem template', href: '/templates/tandem', pro: true },
      { label: 'Ask Tandem' },
      { label: 'Background agents' },
      { label: 'AI settings' },
    ],
  },
  {
    date: '2026-10-25',
    title: 'Works with the AI SDK, and with your theme',
    line: 'Hand useDetentChat what useChat gives you and it hands back the streaming answer, the run’s waterfall and the approval card, timed as the parts arrive. The Agent chat block puts them in one window, live on a real route you can try. And every free component now takes on your shadcn theme: your primary becomes its accent, and .dark turns it dark.',
    items: [
      { label: 'AI SDK', href: '/ai-sdk' },
      { label: 'Agent chat', href: '/blocks/agent-chat', pro: true },
      { label: 'Follows your shadcn theme' },
    ],
  },
  {
    date: '2026-10-25',
    title: 'Two sections for the landing page',
    line: 'Integrations, where your stack drifts under a lens of glass and connects where you press it. And a feature story told as one ticket on a clock you can scrub, each feature arriving at the second it happens.',
    items: [
      { label: 'Integrations', href: '/blocks/integrations', pro: true },
      { label: 'Feature story', href: '/blocks/feature-story', pro: true },
    ],
  },
  {
    date: '2026-10-24',
    title: 'The free components, rebuilt to the Pro bar',
    line: 'Two new ones: a signature that a pencil writes as you type your name, and a voice note you can read along with. A set of buttons for every job. And thinking dots that play each step, a context ring with a redline, a voice meter made of dots, typing that keeps a person’s rhythm, a hover card that glides from one person to the next, and a dialog that reshapes as you fill it. Resizable panels and the sheet are retired.',
    items: [
      { label: 'Signature', href: '/components/signature' },
      { label: 'Voice note', href: '/components/voicenote' },
      { label: 'Buttons' },
      { label: 'Thinking indicator', href: '/components/thinking' },
      { label: 'Context ring', href: '/components/context' },
      { label: 'Voice input', href: '/components/voice' },
      { label: 'Typing bubble', href: '/components/typing' },
      { label: 'Hover card' },
      { label: 'Dialog' },
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
      { label: 'Goal bars', href: '/components/bars', pro: true },
      { label: 'Goal rings', href: '/components/rings', pro: true },
      { label: 'Share grid', href: '/components/waffle', pro: true },
      { label: 'Tick gauge', href: '/components/gauge', pro: true },
      { label: 'Stat tiles', href: '/components/stats', pro: true },
    ],
  },
  {
    date: '2026-10-23',
    title: 'Nine of the most asked-for pieces',
    line: 'The components people install a library for, each built to the same bar as the rest. Two of them are free.',
    items: [
      { label: 'Typed time range', href: '/components/time', pro: true },
      { label: 'Combobox' },
      { label: 'Charts', href: '/components/trend', pro: true },
      { label: 'Live code block', href: '/components/codeblock', pro: true },
      { label: 'App sidebar' },
      { label: 'Issue timeline', href: '/components/timeline', pro: true },
      { label: 'Carousel' },
      { label: 'Toasts' },
      { label: 'Resizable panels' },
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
      { label: 'Year grid', href: '/components/heatmap', pro: true },
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
      { label: 'Dialog' },
      { label: 'Confirm' },
      { label: 'Popover' },
      { label: 'Tooltip' },
      { label: 'Dropdown menu' },
      { label: 'Context menu' },
      { label: 'Sheet' },
      { label: 'Hover card' },
      { label: 'Kiln template', pro: true },
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
      { label: 'Plan editor' },
      { label: 'Model & effort', href: '/components/models' },
      { label: 'Scrub chart', href: '/components/chart', pro: true },
      { label: 'Typed date range', href: '/components/dates', pro: true },
      { label: 'Blocks', href: '/blocks' },
      { label: 'Lumen template', pro: true },
    ],
  },
  {
    date: '2026-10-21',
    title: 'The first pieces',
    line: 'Where it started: a command menu, a data table, a file tree and the inputs around them.',
    items: [
      { label: 'Command menu' },
      { label: 'Data table', href: '/components/table', pro: true },
      { label: 'File tree', href: '/components/tree' },
      { label: 'Upload', href: '/components/upload' },
      { label: 'Select' },
      { label: 'Voice input', href: '/components/voice' },
      { label: 'Spend cap', href: '/components/usage', pro: true },
      { label: 'Payment methods', href: '/components/payments', pro: true },
    ],
  },
]
