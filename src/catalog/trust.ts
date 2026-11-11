export const LICENSOR = process.env.NEXT_PUBLIC_LICENSOR ?? 'Detent'

export const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'hello@detentui.com'

export const REFUND_DAYS = 14

export const TRIAL_INSTALLS = 5

export const EARLY_TRIAL = { installs: 10, before: Date.parse('2026-11-12T00:00:00+05:30') }

export const trialFor = (since: number) => (since < EARLY_TRIAL.before ? EARLY_TRIAL.installs : TRIAL_INSTALLS)

export const UPDATED = '2026-11-02'

export const REFUND_RULE_UPDATED = '2026-11-11'

export const updated = (on = UPDATED) => new Date(`${on}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

export type Release = { date: string; name: string; title: string; line: string; items: { label: string; href?: string; pro?: boolean }[] }

export const RELEASES: Release[] = [
  {
    date: '2026-10-25',
    name: 'AI SDK and theming',
    title: 'Works with the AI SDK, and with your theme',
    line: 'Hand useDetentChat what useChat gives you and it hands back the streaming answer, the run’s waterfall and the approval card, timed as the parts arrive. The Agent chat block puts them in one window, live on a real route you can try. And every free component now takes on your shadcn theme: your primary becomes its accent, and .dark turns it dark.',
    items: [
      { label: 'AI SDK' },
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
      { label: 'Integrations', href: '/blocks/integrations' },
    ],
  },
  {
    date: '2026-10-24',
    name: 'Free components rebuilt',
    title: 'The free components, rebuilt to the Pro bar',
    line: 'A new one: a voice note you can read along with, each word lighting as it’s spoken.',
    items: [
      { label: 'Voice note', href: '/components/voicenote' },
    ],
  },
  {
    date: '2026-10-24',
    name: 'Agent workspace',
    title: 'An agent workspace, the first app template',
    line: 'A whole agent workspace to start from: sessions, a thread that shows its work, a composer that queues what you ask while it answers, reasoning set on a ramp of dots, and photos that open full size.',
    items: [
      { label: 'Agent workspace template', href: '/templates/detent', pro: true },
    ],
  },
  {
    date: '2026-10-23',
    name: 'Charts, one at a time',
    title: 'Charts, one at a time',
    line: 'The chart kit split into components you can take on their own, each with its own page, and all of them redrawn as instruments.',
    items: [
      { label: 'Goal numerals', href: '/components/rings' },
      { label: 'Stat tiles', href: '/components/metric' },
    ],
  },
  {
    date: '2026-10-23',
    name: 'Free tier and registry',
    title: 'A free tier that installs for real',
    line: 'Every free component installs with one command from a public registry, bringing its files and the Detent theme without touching yours.',
    items: [
      { label: 'Public registry', href: '/components/prompt' },
      { label: 'Agent kit', href: '/components/prompt' },
    ],
  },
  {
    date: '2026-10-22',
    name: 'Agents and blocks',
    title: 'Agents, and whole screens',
    line: 'The components an AI product is made of, and the blocks they make together.',
    items: [
      { label: 'Run trace', href: '/components/trace', pro: true },
      { label: 'Prompt box', href: '/components/prompt' },
      { label: 'Typed date range', href: '/components/dates', pro: true },
      { label: 'Blocks', href: '/blocks/live-features' },
    ],
  },
  {
    date: '2026-10-21',
    name: 'The first pieces',
    title: 'The first pieces',
    line: 'Where it started: the inputs a product is built on.',
    items: [
      { label: 'Upload', href: '/components/upload' },
    ],
  },
]
