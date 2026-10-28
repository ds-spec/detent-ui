/**
 * What's in Detent Pro, what it costs, and where to buy it. Plain data, safe for the server.
 * Change a price, a plan's list or a checkout link here and every page follows.
 */
import { BLOCKS } from '@/catalog/blocks'
import { UNLISTED } from '@/catalog/meta'

/** The free components that are Pro: the big stateful surfaces that take weeks to get right. */
const PRO_CODE = [
  'answer',
  'diff',
  'trace',
  'approval',
  'rewrite',
  'table',
  'chart',
  'usage',
  'dates',
  'payments',
  'flow',
  'kanban',
  'heatmap',
  'video',
  'cropper',
  'tour',
  'composer',
  'time',
  'combobox',
  'trend',
  'bars',
  'rings',
  'waffle',
  'gauge',
  'stats',
  'codeblock',
  'sidebar',
  'timeline',
  'carousel',
]

/** The Pro components in the catalog. Unlisted ones stay Pro, so their source stays locked. */
export const PRO_COMPONENTS = PRO_CODE.filter((id) => !UNLISTED.has(id))

export const isProComponent = (id: string) => PRO_CODE.includes(id)

/** Every block is Pro: whole screens are what the licence buys. The free tier is components. */
export const PRO_BLOCK_COUNT = BLOCKS.length

/** Anything whose source is Pro: a Pro component, any block, any template. */
export const isLockedSource = (slug: string, blocks: string[]) => isProComponent(slug) || blocks.includes(slug) || slug.startsWith('template-')

/** Sets anyone can install in one go. */
export const KITS: Record<string, { name: string; line: string; items: string[] }> = {
  'agent-kit': {
    name: 'Agent kit',
    line: 'The free components for an agent product: the prompt box, the agents’ activity, the model picker, the file tree, the scaffold and the small pieces around them.',
    items: ['scaffold', 'prompt', 'tree', 'activity', 'models', 'versions', 'context', 'run', 'thinking', 'typing', 'toasts'],
  },
}

/**
 * Where the site lives, for install commands that work with no setup. Set NEXT_PUBLIC_SITE_URL
 * to the real domain before launch; in development it's the local server.
 */
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:5300' : 'https://detentui.com')).replace(/\/$/, '')

/** The command that installs something: from the public registry when it's free, the private one when it's Pro. */
export const installCommand = (id: string, free: boolean) => (free ? `npx shadcn add ${SITE}/r/${id}` : `npx shadcn add @detent-pro/${id}`)

/**
 * Where each plan is bought. Set these to your store's checkout links (Lemon Squeezy, Polar,
 * Gumroad, Stripe Payment Links, anything that hands over a licence key) before launch.
 */
export const CHECKOUT = {
  pro: process.env.NEXT_PUBLIC_CHECKOUT_PRO ?? '#checkout',
  all: process.env.NEXT_PUBLIC_CHECKOUT_ALL ?? '#checkout',
  team: process.env.NEXT_PUBLIC_CHECKOUT_TEAM ?? '#checkout',
}

export type Plan = {
  id: 'pro' | 'all' | 'team'
  name: string
  price: number
  /** Who it covers, said after the price: one person, or a team of up to five. */
  seats: string
  /** Who it's for, in a line. */
  line: string
  cta: string
  href: string
  features: string[]
  /** The plan to show first and loudest. */
  best?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'pro',
    name: 'Pro',
    price: 149,
    seats: 'one person',
    line: 'Everything you build the product with.',
    cta: 'Get Pro',
    href: CHECKOUT.pro,
    features: [`${PRO_COMPONENTS.length} Pro components`, `${PRO_BLOCK_COUNT} blocks: whole screens, already working`, 'Installs with the shadcn CLI', 'Source in your project, yours to change', 'Every update, for life', 'Unlimited projects'],
  },
  {
    id: 'all',
    name: 'Pro + Templates',
    price: 249,
    seats: 'one person',
    line: 'For the product and the page that sells it.',
    cta: 'Get everything',
    href: CHECKOUT.all,
    best: true,
    features: ['Everything in Pro', 'Every template, pages and apps', 'New templates as they ship', 'Sections and content in plain files', 'Every update, for life', 'Unlimited projects'],
  },
  {
    id: 'team',
    name: 'Team',
    price: 599,
    seats: 'up to five people',
    line: 'Everything, for everyone building it with you.',
    cta: 'Get Team',
    href: CHECKOUT.team,
    features: ['Everything in Pro + Templates', 'A licence key for each person, up to five', 'One more key for CI and shared repos', 'Company invoices, with VAT handled', 'Every update, for life', 'Unlimited projects'],
  },
]

/** One payment, said once, the same way everywhere. */
export const TERMS = 'One payment · Every update for life · Unlimited projects'
