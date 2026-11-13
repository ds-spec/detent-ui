export type Voice = {
  id: string
  name: string
  handle: string
  role?: string
  text: string
  short?: string
  photo?: string
  href?: string
  key: string
}

export const VOICES: Voice[] = [
  {
    id: 'adeline',
    name: 'Adeline',
    handle: 'AdelineAstraOS',
    role: 'AstraOS, brand design studio',
    photo: '/media/quotes/adelineastraos.jpg',
    key: 'a',
    short: 'We run a brand design studio working with fintech and crypto clients, so the AI components and the marketing pieces are exactly the kind of thing we end up building for them.',
    text: 'Love that the components are live on the homepage. Being able to play with them right away makes a huge difference compared to the usual screenshot galleries. The shadcn install and the MCP setup are a really smart move too.\n\nWe run a brand design studio working with fintech and crypto clients, so the AI components (prompt box, model picker, voice note) and the marketing pieces are exactly the kind of thing we end up building for them. :)',
  },
  {
    id: 'mihir',
    name: 'OPM',
    handle: 'mihirtwt',
    role: 'Design engineer, Amboras (YC)',
    key: 'o',
    photo: '/media/quotes/mihirtwt.jpg',
    text: 'bro really cooked with detentui.com',
    href: 'https://x.com/mihirtwt/status/2118617432248209800',
  },
  {
    id: 'karan',
    name: 'Karan Suthar',
    handle: 'karansuthardev',
    role: 'Builds marketing sites',
    key: 'k',
    photo: '/media/quotes/karansuthardev.jpg',
    text: 'fan of detent, quality work there.',
    href: 'https://x.com/karansuthardev/status/2120189310695776457',
  },
  {
    id: 'terry',
    name: 'Terry Carson',
    handle: 'mrterrycarson',
    role: 'Developer, Chicago',
    key: 't',
    photo: '/media/quotes/mrterrycarson.jpg',
    text: 'This sounds like a fantastic way to elevate a product’s feel. I’m excited to see what people create with this.',
    href: 'https://x.com/mrterrycarson/status/2119542943878951095',
  },
  {
    id: 'ana',
    name: 'Ana Bond',
    handle: 'imanabonda',
    role: 'Designer, ex-Snap',
    key: 'b',
    photo: '/media/quotes/imanabonda.jpg',
    text: 'love it! definitely not a boring onboarding',
    href: 'https://x.com/imanabonda/status/2119772295539363899',
  },
  {
    id: 'joshua',
    name: 'Joshua Martin',
    handle: 'Jbm_dev',
    photo: '/media/quotes/jbm_dev.jpg',
    key: 'j',
    text: 'the site looks great, and the product is clear/well showcased!',
  },
  {
    id: 'alex',
    name: 'Alex Debecker',
    handle: 'alexdebecker',
    role: 'Growth at Laravel Cloud',
    key: 'd',
    photo: '/media/quotes/alexdebecker.jpg',
    text: 'very cool',
    href: 'https://x.com/alexdebecker/status/2119806158131364243',
  },
]

export const FACT = {
  before: 'Over',
  count: '1,000',
  after: 'people bookmarked the Onboarding block on X.',
  href: 'https://x.com/next_gendev/status/2119335361554030899',
}

export const voice = (id: string) => VOICES.find((v) => v.id === id) ?? VOICES[0]

export const source = (v: Voice) => v.href

export const byline = (v: Voice) => v.role ?? `@${v.handle}`
