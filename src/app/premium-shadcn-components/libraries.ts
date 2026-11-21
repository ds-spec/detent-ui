export const CHECKED = '22 Nov 2026'
export const CHECKED_ISO = '2026-11-22'

export type Library = {
  id: string
  name: string
  url: string
  bestFor: string
  price: string
  sale?: string
  model: 'One-time' | 'Subscription'
  free: string
  components: string
  blocks: string
  templates: string
  code: string
  licence: string
  updates: string
  line: string
  good: string[]
  watch: string[]
  ours?: boolean
}

export const LIBRARIES: Library[] = [
  {
    id: 'shadcnblocks',
    name: 'shadcnblocks',
    url: 'https://www.shadcnblocks.com',
    bestFor: 'The biggest catalog of marketing and app blocks',
    price: 'From $149',
    sale: '$89 with a 40% off code',
    model: 'One-time',
    free: 'Free blocks with an account',
    components: '2,241+',
    blocks: '2,697+',
    templates: '22, on the $299 and $399 plans',
    code: 'shadcn CLI or copy and paste',
    licence: 'Unlimited end products, client work allowed, no reselling',
    updates: 'Lifetime',
    line: 'If you want a section for almost every page a SaaS site has, this is the deepest shelf. You pick a block, install it, and edit it.',
    good: ['By far the most components and blocks here', 'Lifetime updates and client work on every plan'],
    watch: ['The $149 plan has no templates; they start at $299', 'With thousands of options, finding the right one takes time'],
  },
  {
    id: 'shadcnstudio',
    name: 'shadcn studio',
    url: 'https://shadcnstudio.com',
    bestFor: 'Teams that design in Figma first',
    price: 'From $219',
    sale: '$99 on the Basic plan',
    model: 'One-time',
    free: '57 blocks, free components and a theme generator',
    components: '1,000+ across all plans',
    blocks: '1,100+ across all plans',
    templates: '30+ across all plans',
    code: 'shadcn CLI or copy and paste',
    licence: 'One person, unlimited projects and clients, no reselling',
    updates: 'Lifetime',
    line: 'A large library with a matching Figma kit and a theme generator, so designers and developers work from the same parts.',
    good: ['Figma and code stay in step', 'Lifetime updates and client work allowed'],
    watch: ['The Basic plan is marked “Limited”, so the full catalog costs more', 'Big and broad rather than focused on one kind of product'],
  },
  {
    id: 'aceternity',
    name: 'Aceternity UI Pro',
    url: 'https://ui.aceternity.com',
    bestFor: 'Animated, eye-catching landing pages',
    price: '$249 for a year, $299 for life',
    sale: '$169 or $199',
    model: 'One-time',
    free: '100+ components',
    components: 'Not stated for Pro',
    blocks: '200+',
    templates: '15+',
    code: 'shadcn CLI or copy and paste',
    licence: 'Unlimited end products for you or clients, no reselling',
    updates: '1 year, or lifetime on the higher plan',
    line: 'Known for motion-heavy hero sections and backgrounds. It is the library people reach for when a landing page has to look loud on launch day.',
    good: ['A strong free tier to try before you buy', 'Lots of ready animated sections and templates'],
    watch: ['The cheaper plan stops updating after a year', 'Built for landing pages more than the inside of a product'],
  },
  {
    id: 'magicui',
    name: 'Magic UI Pro',
    url: 'https://pro.magicui.design',
    bestFor: 'Polished marketing sections with motion',
    price: '$199',
    model: 'One-time',
    free: 'Magic UI, the free animated library',
    components: 'Not stated',
    blocks: '50+ sections',
    templates: '9+',
    code: 'Downloaded templates you own',
    licence: 'Personal or commercial use, no reselling',
    updates: 'Lifetime, per the homepage',
    line: 'The paid side of Magic UI: full landing page sections and templates built on the same animated components the free library is known for.',
    good: ['One clear price, paid once', 'The free library lets you judge the style first'],
    watch: ['Its licence says updates are at their discretion, though the homepage promises lifetime', 'Focused on marketing pages, not app screens'],
  },
  {
    id: 'tailark',
    name: 'Tailark',
    url: 'https://tailark.com',
    bestFor: 'Clean, restrained marketing blocks',
    price: 'From $249',
    model: 'One-time',
    free: 'Free blocks and snippets',
    components: 'Not stated',
    blocks: '“Hundreds”',
    templates: 'Not stated',
    code: 'Not stated',
    licence: 'No licence page we could find',
    updates: '“Regular updates”',
    line: 'Quiet, well-spaced marketing sections that look calm instead of flashy, for sites that want to feel like a serious product.',
    good: ['A calm default look that is easy to make your own', 'Free blocks to judge the quality first'],
    watch: ['No published counts or licence page, so value is hard to compare', 'Marketing pages only'],
  },
  {
    id: 'shadcnio',
    name: 'shadcn.io',
    url: 'https://www.shadcn.io',
    bestFor: 'A huge block catalog on a subscription',
    price: '$49 a month or $389 a year',
    model: 'Subscription',
    free: 'Components, hooks and examples with an account',
    components: '175',
    blocks: '6,231',
    templates: '14',
    code: '“Code lives in your repo”',
    licence: 'Individual is non-commercial; Team ($99 a month) and up allow it',
    updates: 'While you subscribe, or lifetime from $899',
    line: 'A very large catalog you pay for monthly or yearly. Every plan gets every block and template; the plans differ in licence and seats.',
    good: ['The largest block count we found', 'Every plan includes the whole catalog'],
    watch: ['The $49 Individual plan doesn’t allow commercial use', 'Cancel the subscription and updates stop'],
  },
  {
    id: 'detent',
    name: 'Detent UI',
    url: '/pro',
    bestFor: 'Interactive product pieces, at one low price',
    price: '$99',
    model: 'One-time',
    free: '',
    components: '',
    blocks: '',
    templates: '',
    code: 'shadcn CLI, source in your project',
    licence: 'One person, unlimited projects and client work, no reselling',
    updates: 'Lifetime',
    line: 'Ours. A small set of components that do something when you touch them, whole product screens built from them, and a complete agent app. Every piece runs live on its page, and below.',
    good: ['The lowest one-time price here, with lifetime updates', 'Built for the inside of a product, not only landing pages', 'Installs with the shadcn CLI and takes your theme'],
    watch: ['The smallest catalog in this list', 'A new library, launched in 2026', 'No Figma kit'],
    ours: true,
  },
]
