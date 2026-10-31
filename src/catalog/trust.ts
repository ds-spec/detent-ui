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

/** What shipped, newest first. `name` is the short one the changelog's side list shows. Each item can link to what it's about. */
export type Release = { date: string; name: string; title: string; line: string; items: { label: string; href?: string; pro?: boolean }[] }

export const RELEASES: Release[] = [
  {
    date: '2026-10-25',
    name: 'Rapport CRM',
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
    name: 'Tandem dashboard',
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
    name: 'AI SDK and theming',
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
    name: 'Landing sections',
    title: 'A section for the landing page',
    line: 'Integrations, where your stack drifts under a lens of glass and connects where you press it.',
    items: [
      { label: 'Integrations', href: '/blocks/integrations', pro: true },
    ],
  },
  {
    date: '2026-10-24',
    name: 'Free components rebuilt',
    title: 'The free components, rebuilt to the Pro bar',
    line: 'Two new ones: a signature that a pencil writes as you type your name, and a voice note you can read along with. And thinking dots that play each step, and a voice meter made of dots.',
    items: [
      { label: 'Signature', href: '/components/signature' },
      { label: 'Voice note', href: '/components/voicenote' },
      { label: 'Thinking indicator' },
      { label: 'Voice input' },
    ],
  },
  {
    date: '2026-10-24',
    name: 'Agent workspace',
    title: 'An agent workspace, the first app template',
    line: 'A whole agent workspace to start from: sessions, a thread that shows its work, a composer that queues what you ask while it answers, reasoning set on a ramp of dots, and photos that open full size. And a prompt playground block, to compare models side by side.',
    items: [
      { label: 'Agent workspace template', href: '/templates/detent', pro: true },
      { label: 'Prompt playground', pro: true },
    ],
  },
  {
    date: '2026-10-23',
    name: 'Charts, one at a time',
    title: 'Charts, one at a time',
    line: 'The chart kit split into components you can take on their own, each with its own page, and all of them redrawn as instruments.',
    items: [
      { label: 'Goal numerals', href: '/components/rings' },
      { label: 'Tick meter' },
      { label: 'Stat tiles', href: '/components/metric' },
    ],
  },
  {
    date: '2026-10-23',
    name: 'Most asked-for pieces',
    title: 'The most asked-for pieces',
    line: 'The components people install a library for, each built to the same bar as the rest.',
    items: [
      { label: 'Live code block', pro: true },
      { label: 'Ticket history', href: '/components/history' },
      { label: 'Toasts' },
    ],
  },
  {
    date: '2026-10-23',
    name: 'Free tier and registry',
    title: 'A free tier that installs for real',
    line: 'Every free component installs with one command from a public registry, bringing its files and the Detent theme without touching yours. A Team plan joins Pro.',
    items: [
      { label: 'Public registry', href: '/components/prompt' },
      { label: 'Agent kit', href: '/components/scaffold' },
      { label: 'Team plan', href: '/pro#pricing' },
    ],
  },
  {
    date: '2026-10-23',
    name: 'Stateful surfaces',
    title: 'Stateful surfaces',
    line: 'The hard surfaces that take weeks to get right: a flow builder you wire by hand, and a composer that formats as you write.',
    items: [
      { label: 'Flow builder', href: '/components/flow', pro: true },
      { label: 'Rich composer' },
    ],
  },
  {
    date: '2026-10-22',
    name: 'Agents and blocks',
    title: 'Agents, and whole screens',
    line: 'The components an AI product is made of, and the blocks they make together.',
    items: [
      { label: 'Streaming answer', href: '/components/answer', pro: true },
      { label: 'Run trace', href: '/components/trace', pro: true },
      { label: 'Approval tray', href: '/components/approval', pro: true },
      { label: 'Prompt box', href: '/components/prompt' },
      { label: 'Typed date range', href: '/components/dates', pro: true },
      { label: 'Blocks', href: '/blocks/live-features' },
    ],
  },
  {
    date: '2026-10-21',
    name: 'The first pieces',
    title: 'The first pieces',
    line: 'Where it started: a file tree and the inputs around it.',
    items: [
      { label: 'File tree' },
      { label: 'Upload', href: '/components/upload' },
      { label: 'Voice input' },
      { label: 'Spend cap', href: '/components/usage', pro: true },
    ],
  },
]
