import { BLOCK_IDS } from './block-ids'
import { UNLISTED } from './unlisted'
import { TEMPLATES } from './templates'

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
  'agent-wallet',
  'support-chat',
  'dotlight',
]

export const PRO_COMPONENTS = PRO_CODE.filter((id) => !UNLISTED.has(id))

export const isProComponent = (id: string) => PRO_CODE.includes(id)

export const FREE_BLOCKS: string[] = ['faq', 'testimonials', 'sign-in', 'cta', 'integrations']

export const isProBlock = (id: string) => (BLOCK_IDS as readonly string[]).includes(id) && !FREE_BLOCKS.includes(id)

export const PRO_BLOCK_COUNT = BLOCK_IDS.length - FREE_BLOCKS.length

export type ProScreens = { id: string; name: string; line: string; starter: string; repo: string }

export const PRO_SCREENS: ProScreens[] = [
  {
    id: 'agent-screens',
    name: 'Agent workspace screens',
    line: 'Seven more screens for the Detent Agent Starter: the agent queue, a day of runs with their traces, usage against the budget, billing as one timeline, setting up an agent, a model playground and the knowledge it reads. Copy them into components/workspace and replace screens.tsx.',
    starter: 'Detent Agent Starter',
    repo: 'https://github.com/ds-spec/detent-agent-starter',
  },
]

export const isProScreens = (id: string) => PRO_SCREENS.some((s) => s.id === id)

export const isLockedSource = (slug: string, blocks: string[]) => isProComponent(slug) || (blocks.includes(slug) && !FREE_BLOCKS.includes(slug)) || slug.startsWith('template-') || isProScreens(slug)

import { SITE } from './site'

export { SITE, installCommand } from './site'

const comeBack = (link: string) => {
  if (!/^https?:\/\//.test(link)) return link
  const url = new URL(link)
  if (!url.searchParams.has('redirect_url')) url.searchParams.set('redirect_url', `${SITE}/account?bought=1`)
  if (!url.searchParams.has('showDiscounts')) url.searchParams.set('showDiscounts', 'false')
  return url.toString()
}

export const INDIA_PRODUCT = 'pdt_0NsYWZkMeS8m4L1Jhhwqn'

export const CHECKOUT = {
  pro: comeBack(process.env.NEXT_PUBLIC_CHECKOUT_PRO ?? '#checkout'),
  india: comeBack(`https://checkout.dodopayments.com/buy/${INDIA_PRODUCT}?quantity=1`),
  all: comeBack(process.env.NEXT_PUBLIC_CHECKOUT_ALL ?? '#checkout'),
}

/** `meta` lands on the Dodo payment as metadata (Dodo reads every `metadata_*` query param). */
/* A guest gives their email before checkout (BuyGate), so it's locked here like a signed-in buyer's: the
   payment lands on the address they'll sign in with. */
export function checkoutFor(plan: keyof typeof CHECKOUT, account: { id: string; email: string } | null, meta: Record<string, string> = {}, guestEmail?: string) {
  const link = plan === 'pro' && meta.country === 'IN' ? CHECKOUT.india : CHECKOUT[plan]
  if (!/^https?:\/\//.test(link)) return null
  const url = new URL(link)
  for (const [key, value] of Object.entries(meta)) url.searchParams.set(`metadata_${key}`, value)
  if (!account) {
    if (guestEmail) {
      url.searchParams.set('email', guestEmail)
      url.searchParams.set('disableEmail', 'true')
    }
    return url.toString()
  }
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
    features: [`${PRO_COMPONENTS.length} Pro components`, `${PRO_BLOCK_COUNT} blocks: whole screens, already working`, `Every template: ${TEMPLATES.map((t) => t.name).join(' and ')}`, 'Installs with the shadcn CLI', 'Source in your project, yours to change', 'Every update, for life', 'Unlimited projects'],
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
