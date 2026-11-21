export const CHECKED = '21 Nov 2026'
export const CHECKED_ISO = '2026-11-21'

export type Library = {
  id: string
  name: string
  url: string
  bestFor: string
  price: string
  sale?: string
  model: 'One-time' | 'Subscription'
  free: string
  size: string
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
    price: '$149 to $399',
    sale: '$89 to $239 (40% off)',
    model: 'One-time',
    free: 'A free set of blocks',
    size: '2,241 components, 2,866 blocks, 22 templates',
    line: 'If you want a section for almost every page a SaaS site has, this is the deepest shelf. You pick a block, copy it in, and edit it.',
    good: ['By far the most blocks and templates of any library here', 'One payment with lifetime updates, unlimited end products'],
    watch: ['Most blocks are static layouts, so motion and interaction are yours to add', 'With thousands of options, finding the right one takes time'],
  },
  {
    id: 'shadcnstudio',
    name: 'shadcn studio',
    url: 'https://shadcnstudio.com',
    bestFor: 'Teams that design in Figma first',
    price: '$219 to $1,299',
    sale: '$99 to $849',
    model: 'One-time',
    free: 'Free components and a theme editor',
    size: '1,000+ components, 1,100+ blocks, 30+ templates',
    line: 'A large library with a matching Figma kit and a theme generator, so designers and developers work from the same parts.',
    good: ['Figma and code stay in step', 'Commercial use on unlimited projects'],
    watch: ['The tiers are priced well above the others once the sale ends', 'Big and broad rather than focused on one kind of product'],
  },
  {
    id: 'aceternity',
    name: 'Aceternity UI Pro',
    url: 'https://ui.aceternity.com',
    bestFor: 'Animated, eye-catching landing pages',
    price: '$249 (1 year) or $299 (lifetime)',
    sale: '$169 or $199',
    model: 'One-time',
    free: '100+ free components',
    size: '200+ blocks, 15+ templates',
    line: 'Known for motion-heavy hero sections and backgrounds. It is the library people reach for when a landing page has to look loud on launch day.',
    good: ['A strong free tier to try before you buy', 'Lots of ready animated sections and templates'],
    watch: ['Built for landing pages more than the inside of a product', 'Heavy effects need care on slow phones'],
  },
  {
    id: 'magicui',
    name: 'Magic UI Pro',
    url: 'https://pro.magicui.design',
    bestFor: 'Polished marketing sections with motion',
    price: '$199 lifetime',
    model: 'One-time',
    free: 'Magic UI, the free animated library',
    size: '50+ sections, 9+ templates',
    line: 'The paid side of Magic UI: full landing page sections and templates built on the same animated components the free library is known for.',
    good: ['The free library is widely used, so the style is well tested', 'One clear price'],
    watch: ['Smaller than the block libraries', 'Focused on marketing pages, not app screens'],
  },
  {
    id: 'tailark',
    name: 'Tailark',
    url: 'https://tailark.com',
    bestFor: 'Clean, restrained marketing blocks',
    price: '$249 to $499',
    model: 'One-time',
    free: 'A free tier of blocks',
    size: '“Hundreds” of blocks, no exact count published',
    line: 'Quiet, well-spaced marketing sections that look calm instead of flashy, for sites that want to feel like a serious product.',
    good: ['A tasteful default look that is easy to make your own', 'Free blocks to judge the quality first'],
    watch: ['No published count, so it is hard to compare value', 'Marketing pages only'],
  },
  {
    id: 'shadcnio',
    name: 'shadcn.io',
    url: 'https://www.shadcn.io',
    bestFor: 'A huge block catalog on a subscription',
    price: '$49 a month or $389 a year',
    model: 'Subscription',
    free: 'Free components and blocks',
    size: '6,231 blocks, 175 components, 14 templates',
    line: 'A very large catalog you pay for monthly or yearly, with team and organisation plans on top.',
    good: ['The largest block count we found', 'Plans for teams and organisations'],
    watch: ['It is a subscription, so the cost keeps going', 'The Individual plan covers personal and open-source use only'],
  },
  {
    id: 'detent',
    name: 'Detent UI',
    url: '/pro',
    bestFor: 'Interactive product pieces, at one low price',
    price: '$99 lifetime',
    model: 'One-time',
    free: '',
    size: '',
    line: 'Ours. A small set of components that do something when you touch them: a chart you can ask questions, a radar that compares two things at a time, an agent run you can watch step by step. Every piece runs live on its page.',
    good: ['The lowest one-time price here, with every update', 'Interactive pieces for the inside of a product, not only landing pages', 'Installs with the shadcn CLI and takes your theme'],
    watch: ['The smallest catalog in this list', 'A new library, launched in 2026', 'No Figma kit'],
    ours: true,
  },
]
