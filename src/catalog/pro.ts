/**
 * What's in Detent Pro, what it costs, and where to buy it. Plain data, safe for the server.
 * Change a price, a plan's list or a checkout link here and every page follows.
 */
import { BLOCK_IDS } from './block-ids'
import { UNLISTED } from './unlisted'

/** The free components that are Pro: the big stateful surfaces that take weeks to get right. */
const PRO_CODE = [
  'answer',
  'ask',
  'askchart',
  'bridge',
  'funnel',
  'radar',
  'donut',
  'scatter',
  'histogram',
  'trace',
  'approval',
  'filter',
  'dates',
  'extract',
  'kanban',
  'forecast',
  'video',
  'tour',
  'combobox',
  'lens',
  'codeblock',
  'sidebar',
  'region',
  'find',
  'reveal',
  'threads',
  'dotlight',
]

/** The Pro components in the catalog. Unlisted ones stay Pro, so their source stays locked. */
export const PRO_COMPONENTS = PRO_CODE.filter((id) => !UNLISTED.has(id))

export const isProComponent = (id: string) => PRO_CODE.includes(id)

/** The blocks anyone can install: sections every library gives away, so the free tier has whole screens to try. The rest are what the licence buys. */
export const FREE_BLOCKS: string[] = ['faq', 'testimonials', 'sign-in', 'cta', 'integrations']

export const isProBlock = (id: string) => (BLOCK_IDS as readonly string[]).includes(id) && !FREE_BLOCKS.includes(id)

export const PRO_BLOCK_COUNT = BLOCK_IDS.length - FREE_BLOCKS.length

/** Anything whose source is Pro: a Pro component, a Pro block, any template. */
export const isLockedSource = (slug: string, blocks: string[]) => isProComponent(slug) || (blocks.includes(slug) && !FREE_BLOCKS.includes(slug)) || slug.startsWith('template-')

/** Sets anyone can install in one go. */
export const KITS: Record<string, { name: string; line: string; items: string[] }> = {
  'agent-kit': {
    name: 'Agent kit',
    line: 'The free components for an agent product: the scaffold it builds in, the prompt box, and the diff you review.',
    items: ['scaffold', 'prompt', 'diff'],
  },
}

import { SITE } from './site'

export { SITE, installCommand } from './site'

/**
 * Sends a buyer back to their account once they've paid. A Dodo payment link only redirects when it
 * carries `redirect_url`; Dodo then adds `payment_id`, `status` and `email` to it. Added here rather
 * than in the env, so test and live links, on any domain, all come home.
 */
const comeBack = (link: string) => {
  if (!/^https?:\/\//.test(link)) return link
  const url = new URL(link)
  if (!url.searchParams.has('redirect_url')) url.searchParams.set('redirect_url', `${SITE}/account?bought=1`)
  return url.toString()
}

/**
 * Where each plan is bought: the store's checkout links. Dodo reports each order to /api/dodo.
 */
export const CHECKOUT = {
  pro: comeBack(process.env.NEXT_PUBLIC_CHECKOUT_PRO ?? '#checkout'),
  all: comeBack(process.env.NEXT_PUBLIC_CHECKOUT_ALL ?? '#checkout'),
}

export type Plan = {
  id: 'pro' | 'all'
  name: string
  price: number
  /** Who it covers, said after the price. */
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
    price: 99,
    seats: 'one person',
    line: 'Everything you build the product with.',
    cta: 'Get Pro',
    href: CHECKOUT.pro,
    features: [`${PRO_COMPONENTS.length} Pro components`, `${PRO_BLOCK_COUNT} blocks: whole screens, already working`, 'Installs with the shadcn CLI', 'Source in your project, yours to change', 'Every update, for life', 'Unlimited projects'],
  },
  {
    id: 'all',
    name: 'Pro + Templates',
    price: 129,
    seats: 'one person',
    line: 'Everything in Pro, and a whole app to start from.',
    cta: 'Get everything',
    href: CHECKOUT.all,
    best: true,
    features: ['Everything in Pro', 'The Detent app template', 'Every new template as it ships', 'Real routes, data and AI wired in', 'Every update, for life', 'Unlimited projects'],
  },
]

/** One payment, said once, the same way everywhere. */
export const TERMS = 'One payment · Every update for life · Unlimited projects'
