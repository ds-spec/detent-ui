import { BLOCK_IDS } from './block-ids'
import { UNLISTED } from './unlisted'

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
  'glyph',
  'hello',
  'agent-canvas',
  'emoji',
  'mcp',
  'dotlight',
]

export const PRO_COMPONENTS = PRO_CODE.filter((id) => !UNLISTED.has(id))

export const isProComponent = (id: string) => PRO_CODE.includes(id)

export const FREE_BLOCKS: string[] = ['faq', 'testimonials', 'sign-in', 'cta', 'integrations']

export const isProBlock = (id: string) => (BLOCK_IDS as readonly string[]).includes(id) && !FREE_BLOCKS.includes(id)

export const PRO_BLOCK_COUNT = BLOCK_IDS.length - FREE_BLOCKS.length

export const isLockedSource = (slug: string, blocks: string[]) => isProComponent(slug) || (blocks.includes(slug) && !FREE_BLOCKS.includes(slug)) || slug.startsWith('template-')

export const KITS: Record<string, { name: string; line: string; items: string[] }> = {
  'agent-kit': {
    name: 'Agent kit',
    line: 'The free components for an agent product: the scaffold it builds in, the prompt box, and the diff you review.',
    items: ['scaffold', 'prompt', 'diff'],
  },
}

import { SITE } from './site'

export { SITE, installCommand } from './site'

const comeBack = (link: string) => {
  if (!/^https?:\/\//.test(link)) return link
  const url = new URL(link)
  if (!url.searchParams.has('redirect_url')) url.searchParams.set('redirect_url', `${SITE}/account?bought=1`)
  return url.toString()
}

export const CHECKOUT = {
  pro: comeBack(process.env.NEXT_PUBLIC_CHECKOUT_PRO ?? '#checkout'),
  all: comeBack(process.env.NEXT_PUBLIC_CHECKOUT_ALL ?? '#checkout'),
}

export function checkoutFor(plan: keyof typeof CHECKOUT, account: { id: string; email: string } | null) {
  const link = CHECKOUT[plan]
  if (!/^https?:\/\//.test(link)) return null
  const url = new URL(link)
  if (!account) return url.toString()
  url.searchParams.set('email', account.email)
  url.searchParams.set('disableEmail', 'true')
  url.searchParams.set('metadata_detent_user', account.id)
  return url.toString()
}

export type Plan = {
  id: 'pro' | 'all'
  name: string
  price: number
  seats: string
  line: string
  cta: string
  href: string
  features: string[]
  best?: boolean
  retired?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    seats: 'one person',
    line: 'Everything you build the product with.',
    cta: 'Get Pro',
    href: '/checkout/pro',
    features: [`${PRO_COMPONENTS.length} Pro components`, `${PRO_BLOCK_COUNT} blocks: whole screens, already working`, 'The Detent app template', 'Installs with the shadcn CLI', 'Source in your project, yours to change', 'Every update, for life', 'Unlimited projects'],
  },
  {
    id: 'all',
    name: 'Pro + Templates',
    price: 129,
    seats: 'one person',
    line: 'Everything in Pro, and a whole app to start from.',
    cta: 'Get everything',
    href: '/checkout/all',
    retired: true,
    features: ['Everything in Pro', 'The Detent app template', 'More shipping fast, and only good ones', 'Real routes, data and AI wired in', 'Every update, for life', 'Unlimited projects'],
  },
]

export const ON_SALE = PLANS.filter((p) => !p.retired)

export const TERMS = 'One payment · Every update for life · Unlimited projects'
