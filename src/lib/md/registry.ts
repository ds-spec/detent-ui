import { ENTRIES, entry } from '@/catalog/meta'
import { BLOCKS } from '@/catalog/blocks'
import { TEMPLATES, TEMPLATE_COUNT } from '@/catalog/templates'
import { RELEASES, CONTACT } from '@/catalog/trust'
import { FREE_BLOCKS, ON_SALE, PLANS, PRO_COMPONENTS, PRO_BLOCK_COUNT, SITE, installCommand, isProBlock, isProComponent } from '@/catalog/pro'
import { NAME, DESCRIPTION, TAGLINE, FREE_COUNT } from '@/site/seo'
import { abs, envelope, fmtDate, itemList, kvTable, today } from './format'

export type MarkdownRoute = {
  path: string
  desc: string
  inFull: boolean
  isStatic: boolean
}

export type Renderer = () => string | null

function renderHome(): string {
  const body = [
    `## What is ${NAME}?`,
    '',
    DESCRIPTION,
    '',
    `## Components (${ENTRIES.length} total, ${FREE_COUNT} free)`,
    '',
    `${NAME} ships ${ENTRIES.length} premium React components: agents, data, inputs and marketing. ${FREE_COUNT} are free under MIT. The rest are Pro.`,
    '',
    `Install the free agent kit to get started:`,
    '',
    '```bash',
    `npx shadcn add ${SITE}/r/agent-kit`,
    '```',
    '',
    `## Plans`,
    '',
    kvTable(
      ON_SALE.map((p) => [`${p.name} — $${p.price}`, p.line]),
      ['Plan', 'Description'],
    ),
    '',
    `## Key sections`,
    '',
    itemList([
      { label: 'Components', href: abs('/components'), desc: `${ENTRIES.length} premium React components` },
      { label: 'Pro', href: abs('/pro'), desc: `${PRO_COMPONENTS.length} Pro components, ${PRO_BLOCK_COUNT} blocks and ${TEMPLATE_COUNT}` },
      { label: 'Blocks', href: abs('/blocks'), desc: 'Whole screens built from Detent components' },
      { label: 'Templates', href: abs('/templates'), desc: 'Landing pages and full apps' },
      { label: 'Changelog', href: abs('/changelog'), desc: 'Every update, newest first' },
    ]),
  ].join('\n')

  return envelope({
    title: `${NAME} — ${TAGLINE}`,
    summary: DESCRIPTION,
    path: '/',
    updatedAt: RELEASES[0]?.date ?? today(),
    body,
    related: [
      { label: 'Pro', href: abs('/pro') },
      { label: 'Changelog', href: abs('/changelog') },
    ],
  })
}

function renderPro(): string {
  const body = [
    `## What's in Pro`,
    '',
    `Pro gives you ${PRO_COMPONENTS.length} advanced React components, ${PRO_BLOCK_COUNT} whole-screen blocks, and ${TEMPLATE_COUNT}. One payment, every update for life, unlimited projects.`,
    '',
    `## Plans`,
    '',
    kvTable(
      ON_SALE.map((p) => [`${p.name} — $${p.price}`, `${p.line} ${p.seats}`]),
      ['Plan', 'Details'],
    ),
    '',
    `## FAQ`,
    '',
    `**Is it a subscription?** No. You pay once and keep everything, including every update that ships after you buy.`,
    '',
    '',
    `**Will it match my design?** Installed with shadcn, Detent reads your theme: your primary becomes its accent, and \`.dark\` turns it dark.`,
    '',
    `**How do I install Pro?** \`npx shadcn add @detent-pro/<component-id>\` — set up your key once, then install any piece.`,
    '',
    `## Pro components (${PRO_COMPONENTS.length})`,
    '',
    itemList(PRO_COMPONENTS.map((id) => {
      const e = entry(id)
      return { label: e ? e.name : id, href: abs(`/components/${id}`), desc: e?.line }
    })),
  ].join('\n')

  return envelope({
    title: `${NAME} Pro`,
    summary: `${PRO_COMPONENTS.length} React components, ${PRO_BLOCK_COUNT} whole screens and ${TEMPLATE_COUNT}. One payment, every update for life.`,
    path: '/pro',
    body,
    related: [
      { label: 'Components', href: abs('/components') },
      { label: 'Blocks', href: abs('/blocks') },
      { label: 'Templates', href: abs('/templates') },
    ],
  })
}

function renderComponents(): string {
  const byCategory = ENTRIES.reduce<Record<string, typeof ENTRIES>>((acc, e) => {
    ;(acc[e.category] ??= []).push(e)
    return acc
  }, {})

  const body = Object.entries(byCategory)
    .map(([cat, entries]) => {
      const header = `## ${cat.charAt(0).toUpperCase() + cat.slice(1)} components`
      const list = itemList(
        entries.map((e) => ({ label: e.name, href: abs(`/components/${e.id}`), desc: e.line })),
      )
      return [header, '', list].join('\n')
    })
    .join('\n\n')

  return envelope({
    title: `${NAME} component library`,
    summary: `${ENTRIES.length} premium React components: agents, data, inputs and more. ${FREE_COUNT} free under MIT.`,
    path: '/components',
    body,
    related: [{ label: 'Blocks', href: abs('/blocks') }, { label: 'Templates', href: abs('/templates') }],
  })
}

function renderBlocks(): string {
  const body = [
    `## All blocks (${BLOCKS.length})`,
    '',
    itemList(BLOCKS.map((b) => ({ label: b.name, href: abs(`/blocks/${b.id}`), desc: b.line }))),
    '',
    `Free: ${BLOCKS.filter((b) => FREE_BLOCKS.includes(b.id)).map((b) => b.name).join(', ')}, from the public registry. Every other block is Pro: install it from the private registry after setting up a licence key.`,
  ].join('\n')

  return envelope({
    title: `${NAME} Blocks — whole screens`,
    summary: `${BLOCKS.length} whole-screen React blocks built from Detent components. ${FREE_BLOCKS.length} are free; the rest need a Pro licence.`,
    path: '/blocks',
    body,
    related: [{ label: 'Pro', href: abs('/pro') }, { label: 'Templates', href: abs('/templates') }],
  })
}

function renderTemplates(): string {
  const body = [
    `## All templates (${TEMPLATES.length})`,
    '',
    itemList(
      TEMPLATES.map((t) => ({
        label: t.name,
        href: abs(`/templates/${t.id}`),
        desc: `${t.form === 'app' ? 'App' : 'Landing page'} · ${t.kind} — ${t.line}`,
      })),
    ),
  ].join('\n')

  return envelope({
    title: `${NAME} Templates`,
    summary: `${TEMPLATE_COUNT}, with Pro.`,
    path: '/templates',
    body,
    related: [{ label: 'Pro', href: abs('/pro') }, { label: 'Blocks', href: abs('/blocks') }],
  })
}

function renderAiSdk(): string {
  const body = [
    `## What is the ${NAME} AI SDK integration?`,
    '',
    `${NAME} ships \`useDetentChat\`, a hook that wraps the Vercel AI SDK's \`useChat\`. It returns ready-to-use props for the streaming answer, the agent run waterfall, the approval card, and source citations — timed to arrive as each part of the response comes in.`,
    '',
    `## Components in this section`,
    '',
    itemList([
      { label: 'Answer', href: abs('/components/answer'), desc: 'Streaming answer with sources and citations' },
      { label: 'Trace', href: abs('/components/trace'), desc: 'Agent run waterfall: steps, tools, timing' },
      { label: 'Approval', href: abs('/components/approval'), desc: 'Human-in-the-loop approval card' },
    ]),
    '',
    `## How it works`,
    '',
    '```tsx',
    "import { useDetentChat } from '@/components/detent/use-detent-chat'",
    '',
    "const { answerProps, traceProps, approvalProps } = useDetentChat({ api: '/api/chat' })",
    '```',
    '',
    'The hook reads the AI SDK stream parts and maps each type to the right component props. No manual parsing needed.',
  ].join('\n')

  return envelope({
    title: `${NAME} and the AI SDK`,
    summary: `How ${NAME} integrates with the Vercel AI SDK's useChat: streaming answers, agent run waterfalls, and approval cards, all timed to the parts as they arrive.`,
    path: '/ai-sdk',
    body,
    related: [
      { label: 'Answer component', href: abs('/components/answer') },
      { label: 'Pro', href: abs('/pro') },
    ],
  })
}

function renderSystem(): string {
  const body = [
    `## Design tokens`,
    '',
    `${NAME} ships a set of CSS custom properties (design tokens) that map to your shadcn theme. Your \`--primary\` becomes ${NAME}'s accent, \`--background\` and \`--foreground\` are inherited, and \`.dark\` on the HTML element enables the dark variant automatically.`,
    '',
    `## Typography`,
    '',
    'Detent uses Geist and Geist Mono from Google Fonts. All font sizes are set with the Tailwind v4 type scale.',
    '',
    `## Install`,
    '',
    '```bash',
    `npx shadcn add ${SITE}/r/theme.json`,
    '```',
  ].join('\n')

  return envelope({
    title: `${NAME} design system`,
    summary: `The tokens, typography and theme that ${NAME} uses. Install with shadcn and it inherits your existing colours and fonts.`,
    path: '/system',
    body,
    related: [{ label: 'Components', href: abs('/components') }],
  })
}

function renderChangelog(): string {
  const body = RELEASES.map((r) => {
    const items = r.items.map((it) => {
      const label = it.pro ? `${it.label} *(Pro)*` : it.label
      return it.href ? `- [${label}](${abs(it.href)})` : `- ${label}`
    })
    return [`### ${r.title}`, `*${fmtDate(r.date)}*`, '', r.line, '', ...items].join('\n')
  }).join('\n\n')

  return envelope({
    title: `${NAME} Changelog`,
    summary: 'Every update shipped in Detent, newest first.',
    path: '/changelog',
    updatedAt: RELEASES[0]?.date,
    body,
  })
}

function renderLicence(): string {
  const body = [
    '## Summary',
    '',
    'The Detent licence lets you use the components in any number of personal or commercial projects. You may not resell or redistribute the components themselves.',
    '',
    '## Key terms',
    '',
    kvTable([
      ['Licensor', 'Detent'],
      ['Licence type', 'Commercial, per-seat'],
      ['Projects', 'Unlimited'],
      ['Redistribution', 'Not permitted'],
      ['Updates', 'All future updates included'],
    ]),
    '',
    `Contact: ${CONTACT}`,
  ].join('\n')

  return envelope({
    title: `${NAME} licence`,
    summary: 'The terms under which you may use Detent components in your projects.',
    path: '/licence',
    body,
    related: [{ label: 'Terms', href: abs('/terms') }, { label: 'Refunds', href: abs('/refunds') }],
  })
}

function renderTerms(): string {
  const body = [
    '## Summary',
    '',
    'These are the general terms of service for using Detent. By purchasing a licence you agree to these terms.',
    '',
    `Contact: ${CONTACT}`,
  ].join('\n')

  return envelope({
    title: `${NAME} — Terms of Service`,
    summary: 'The terms of service for purchasing and using a Detent licence.',
    path: '/terms',
    body,
    related: [{ label: 'Licence', href: abs('/licence') }, { label: 'Refunds', href: abs('/refunds') }],
  })
}

function renderRefunds(): string {
  const body = [
    '## Refund policy',
    '',
    'You may request a full refund within 14 days of purchase, no questions asked. After 14 days, refunds are at our discretion.',
    '',
    `Contact: ${CONTACT}`,
  ].join('\n')

  return envelope({
    title: `${NAME} — Refund Policy`,
    summary: 'The refund policy for Detent Pro purchases.',
    path: '/refunds',
    body,
    related: [{ label: 'Terms', href: abs('/terms') }, { label: 'Licence', href: abs('/licence') }],
  })
}

function renderDocs(): string {
  const first = ENTRIES.find((e) => e.id === 'popup' && !isProComponent(e.id)) ?? ENTRIES.find((e) => !isProComponent(e.id))!
  const free = ENTRIES.filter((e) => !isProComponent(e.id)).length
  const body = [
    `${NAME} installs with the shadcn CLI, so every piece lands in your project as source you own. ${free} components are free under MIT; the rest come with Pro.`,
    '',
    '## With your coding agent',
    '',
    'Paste this into Cursor, Claude Code or any agent. It reads the library and installs for you.',
    '',
    '```text',
    `Read ${SITE}/llms.txt to learn the Detent component library. Then install the ${first.name} component into this project with the shadcn CLI, using the exact command listed there, and use it on the home page. If the project has no components.json yet, run shadcn init first.`,
    '```',
    '',
    '## Install a component',
    '',
    '### 1. Set up shadcn',
    '',
    'Skip this if your project already has a components.json. You need React and Tailwind CSS v4; Next.js is what we test on.',
    '',
    '```bash',
    'npx shadcn@latest init',
    '```',
    '',
    `### 2. Add ${first.name}`,
    '',
    'Its source lands in components/detent, ready to change. The first install also brings the Detent theme, and anything a piece needs, like motion, comes with it.',
    '',
    '```bash',
    installCommand(first.id, true),
    '```',
    '',
    '### 3. Respect reduced motion',
    '',
    'Wrap your app once in `<MotionConfig reducedMotion="user">` from motion/react, in app/layout.tsx. Everything Detent animates then calms down for people who have asked their device for less motion.',
    '',
    '## Install Pro',
    '',
    `Pro installs the same way, from a private registry that knows your key. Pro is $${PLANS[0].price}, once, with every update for life: ${abs('/pro')}`,
    '',
    '### 1. Make a key',
    '',
    `After you buy, make one on your account page (${abs('/account')}). One per machine, and one for CI.`,
    '',
    '### 2. Add the registry to components.json',
    '',
    '```json',
    '{',
    '  "registries": {',
    '    "@detent-pro": {',
    `      "url": "${SITE}/r/pro/{name}.json",`,
    '      "headers": { "Authorization": "Bearer ${DETENT_PRO_KEY}" }',
    '    }',
    '  }',
    '}',
    '```',
    '',
    '### 3. Add your key to .env.local',
    '',
    '```bash',
    'DETENT_PRO_KEY=dtnt_your-key',
    '```',
    '',
    '### 4. Install anything',
    '',
    '```bash',
    installCommand('glyph', false),
    '```',
    '',
    '## If something goes wrong',
    '',
    itemList([
      { label: 'pnpm stops with ERR_PNPM_IGNORED_BUILDS', desc: 'pnpm is holding back Next.js build scripts in a new project. Run pnpm approve-builds, then install again.' },
      { label: 'A Pro install answers 401 or 403', desc: 'Check DETENT_PRO_KEY is in .env.local, the registry block is in components.json, and the key is still listed on your account page.' },
      { label: 'Colours or type look unstyled', desc: 'The theme stylesheet is not loaded. The first install imports it into your global CSS; if you moved that file, import it again.' },
      { label: 'A coding agent installs the wrong thing', desc: `Point it at ${SITE}/llms.txt first. It lists every component with its exact install command.` },
    ]),
    '',
    `Still stuck? Write to ${CONTACT}.`,
  ].join('\n')

  return envelope({
    title: `Get started — ${NAME}`,
    summary: 'Install your first Detent component with the shadcn CLI, set up reduced motion, and connect Pro. Or hand it all to your coding agent.',
    path: '/docs',
    body,
    related: [
      { label: 'Components', href: abs('/components') },
      { label: 'Blocks', href: abs('/blocks') },
      { label: 'Design system', href: abs('/system') },
      { label: 'Pro', href: abs('/pro') },
    ],
  })
}

function renderPrivacy(): string {
  const body = [
    'You can browse Detent and install every free component without an account. We only keep what we need to sign you in, deliver what you bought and answer you when you write.',
    '',
    '## What we keep',
    '',
    '- Your email address, when you create an account. If you sign in with GitHub, your name and avatar from GitHub too.',
    '- Sign-in records: your session, and how you last signed in.',
    '- Your purchases: which plan, when, the payment reference from Dodo Payments, and whether it was refunded. We never see or store your card details.',
    '- Your licence keys, and checks of a key when it installs Pro components.',
    '- What you send us by email, so we can reply.',
    '',
    '## What we don’t do',
    '',
    '- No advertising, and no ad cookies. Google Analytics’ advertising features are off.',
    '- We don’t sell or rent your data to anyone.',
    '- Live demos run in your browser or against a scripted demo. We don’t keep what you type into them.',
    '',
    '## How we count visits',
    '',
    'Google Analytics shows us which pages people visit, which components and blocks they open, copy and install, what they search for, and when they start a purchase. Cloudflare Web Analytics also counts visits, without cookies.',
    '',
    'Google Analytics sets its own cookies to tell visits apart, and Google receives your IP address and browser details under its own privacy policy. You can block it with any content blocker and the site works the same.',
    '',
    '## Who helps us run it',
    '',
    '- Dodo Payments: payment, as merchant of record.',
    '- Cloudflare: hosting, request logs and aggregate visit counts.',
    '- Google Analytics: visit counts and what people open, copy and buy.',
    '- Turso: the database for accounts, purchases and keys.',
    '- Resend: sign-in and purchase emails.',
    '- GitHub: only if you choose to sign in with it.',
    '',
    '## Cookies, retention and your choices',
    '',
    'Our own cookies keep you signed in; Google Analytics sets its own as described above. Your account stays until you ask us to delete it; purchase records are kept as long as tax rules require. Request logs are kept only briefly by our host.',
    '',
    `Write to ${CONTACT} from the address on your account for a copy of what we hold, a correction, or deletion. We answer within 30 days. Deleting your account also stops your licence keys from working.`,
  ].join('\n')

  return envelope({
    title: `${NAME} — Privacy`,
    summary: 'What Detent keeps about you, why, who helps run it, and how to have it removed. No ads, nothing sold.',
    path: '/privacy',
    body,
    related: [{ label: 'Terms', href: abs('/terms') }, { label: 'Refunds', href: abs('/refunds') }],
  })
}

function renderComponent(slug: string): string | null {
  const e = entry(slug)
  if (!e) return null

  const body = [
    `## About`,
    '',
    e.line,
    '',
    e.details.length > 0
      ? ['## Details', '', ...e.details.map((d) => `- ${d}`)].join('\n')
      : '',
    '',
    e.keys && e.keys.length > 0
      ? ['## Keyboard shortcuts', '', kvTable(e.keys, ['Keys', 'Action'])].join('\n')
      : '',
    '',
    `## Install`,
    '',
    '```bash',
    `npx shadcn add ${SITE}/r/${e.id}`,
    '```',
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')

  return envelope({
    title: `${e.name} — ${NAME}`,
    summary: e.line,
    path: `/components/${e.id}`,
    body,
    related: [
      { label: 'All components', href: abs('/components') },
      { label: 'Pro', href: abs('/pro') },
    ],
  })
}

function renderBlock(slug: string): string | null {
  const b = BLOCKS.find((b) => b.id === slug)
  if (!b) return null
  const free = !isProBlock(b.id)

  const body = [
    `## About`,
    '',
    b.line,
    '',
    `## Details`,
    '',
    ...b.details.map((d) => `- ${d}`),
    '',
    b.keys && b.keys.length > 0
      ? ['## Keyboard shortcuts', '', kvTable(b.keys, ['Keys', 'Action'])].join('\n')
      : '',
    '',
    free ? '## Install' : '## Install (Pro required)',
    '',
    '```bash',
    installCommand(b.id, free),
    '```',
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')

  return envelope({
    title: `${b.name} — ${NAME}`,
    summary: b.line,
    path: `/blocks/${b.id}`,
    body,
    related: [
      { label: 'All blocks', href: abs('/blocks') },
      { label: 'Pro', href: abs('/pro') },
    ],
  })
}

function renderTemplate(slug: string): string | null {
  const t = TEMPLATES.find((t) => t.id === slug)
  if (!t) return null

  const body = [
    `## About`,
    '',
    t.line,
    '',
    `**Type:** ${t.form === 'app' ? 'Full app' : 'Landing page'}`,
    `**Suits:** ${t.suits}`,
    '',
    `## Sections`,
    '',
    itemList(t.parts.map((p) => ({ label: p.name, desc: p.line }))),
    '',
    `## Install (Pro required)`,
    '',
    '```bash',
    `npx shadcn add @detent-pro/template-${t.id}`,
    '```',
  ].join('\n')

  return envelope({
    title: `${t.name} — ${NAME} Template`,
    summary: t.line,
    path: `/templates/${t.id}`,
    body,
    related: [
      { label: 'All templates', href: abs('/templates') },
      { label: 'Pro', href: abs('/pro') },
    ],
  })
}

const STATIC_ROUTES: Record<string, { render: () => string | null; desc: string; isStatic: boolean }> = {
  '/':            { render: renderHome,       desc: `${NAME} — premium React components`,              isStatic: true },
  '/pro':         { render: renderPro,        desc: `Pro components, blocks and templates`,              isStatic: true },
  '/components':  { render: renderComponents, desc: `All ${ENTRIES.length} components, by category`,    isStatic: true },
  '/blocks':      { render: renderBlocks,     desc: `All ${BLOCKS.length} whole-screen blocks`,         isStatic: true },
  '/templates':   { render: renderTemplates,  desc: `Every template`,                isStatic: true },
  '/docs':        { render: renderDocs,       desc: 'Get started: install a component, connect Pro, use a coding agent', isStatic: true },
  '/system':      { render: renderSystem,     desc: 'Design tokens, typography and theme',             isStatic: true },
  '/changelog':   { render: renderChangelog,  desc: 'Every update, newest first',                      isStatic: false },
  '/licence':     { render: renderLicence,    desc: 'Licence terms and key conditions',                isStatic: true },
  '/terms':       { render: renderTerms,      desc: 'Terms of service',                                isStatic: true },
  '/refunds':     { render: renderRefunds,    desc: 'Refund policy: 14 days, no questions asked',      isStatic: true },
  '/privacy':     { render: renderPrivacy,    desc: 'What we keep, who helps run it, and how to remove it', isStatic: true },
}

export function renderMarkdown(canonicalPath: string): { content: string | null; isStatic: boolean } {
  if (canonicalPath in STATIC_ROUTES) {
    const { render, isStatic } = STATIC_ROUTES[canonicalPath]
    return { content: render(), isStatic }
  }

  const componentMatch = canonicalPath.match(/^\/components\/([^/]+)$/)
  if (componentMatch) {
    return { content: renderComponent(componentMatch[1]), isStatic: true }
  }

  const blockMatch = canonicalPath.match(/^\/blocks\/([^/]+)$/)
  if (blockMatch) {
    return { content: renderBlock(blockMatch[1]), isStatic: true }
  }

  const templateMatch = canonicalPath.match(/^\/templates\/([^/]+)$/)
  if (templateMatch) {
    return { content: renderTemplate(templateMatch[1]), isStatic: true }
  }

  return { content: null, isStatic: false }
}

export function listMarkdownRoutes(): MarkdownRoute[] {
  const routes: MarkdownRoute[] = []

  const staticOrder = ['/', '/pro', '/docs', '/components', '/blocks', '/templates', '/system', '/changelog', '/licence', '/terms', '/refunds', '/privacy']
  for (const path of staticOrder) {
    const r = STATIC_ROUTES[path]
    if (r) routes.push({ path, desc: r.desc, inFull: true, isStatic: r.isStatic })
  }

  const FREE_LIMIT = 30
  const freeEntries = ENTRIES.filter((e) => !e.id.startsWith('_'))
  freeEntries.forEach((e, i) => {
    routes.push({
      path: `/components/${e.id}`,
      desc: e.line,
      inFull: i < FREE_LIMIT,
      isStatic: true,
    })
  })

  const BLOCK_LIMIT = 20
  BLOCKS.forEach((b, i) => {
    routes.push({
      path: `/blocks/${b.id}`,
      desc: b.line,
      inFull: i < BLOCK_LIMIT,
      isStatic: true,
    })
  })

  TEMPLATES.forEach((t) => {
    routes.push({
      path: `/templates/${t.id}`,
      desc: t.line,
      inFull: true,
      isStatic: true,
    })
  })

  return routes
}

export const SKIPPED_ROUTES: Record<string, string> = {
  '/preview': 'Unlisted preview pages — noindex, not for crawlers',
  '/preview-fit': 'Unlisted preview pages — noindex, not for crawlers',
  '/api': 'API routes — machine endpoints, not content pages',
  '/r': 'shadcn registry — JSON endpoints, not content pages',
  '/account': 'Sign-in and keys — private, noindex',
}

export function assertAllRoutesCovered(publicRoutes: string[]): string[] {
  const covered = new Set([...Object.keys(STATIC_ROUTES)])
  const skipped = new Set(Object.keys(SKIPPED_ROUTES))
  const missing: string[] = []
  for (const route of publicRoutes) {
    const isExact = covered.has(route)
    const isDynamic =
      route.startsWith('/components/') ||
      route.startsWith('/blocks/') ||
      route.startsWith('/templates/')
    const isSkipped = [...skipped].some((s) => route.startsWith(s))
    if (!isExact && !isDynamic && !isSkipped) missing.push(route)
  }
  return missing
}
