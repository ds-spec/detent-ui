import { ENTRIES, entry } from '@/catalog/meta'
import { BLOCKS, propsOf } from '@/catalog/blocks'
import { TEMPLATES, TEMPLATE_COUNT } from '@/catalog/templates'
import { RELEASES, CONTACT } from '@/catalog/trust'
import { FREE_BLOCKS, ON_SALE, PLANS, PRO_COMPONENTS, PRO_BLOCK_COUNT, SITE, installCommand, isProBlock, isProComponent } from '@/catalog/pro'
import { NAME, DESCRIPTION, TAGLINE, FREE_COUNT } from '@/site/seo'
import { abs, envelope, fmtDate, itemList, kvTable, cell, today } from './format'
import { GUIDE, PRO_ENV, PRO_REGISTRY, importOf, mdOf } from '@/catalog/agent'
import { PLACEMENT } from '@/catalog/guide'
import { PRO_SETUP_MD, SETUP_MD, piecePrompt, proSetupPrompt, setupPrompt } from '@/catalog/prompts'
import { apiOf } from '@/catalog/api-of'
import type { Api, PropDoc } from '@/catalog/api'
import { asset } from '@/lib/asset'
import { CHECKED, LIBRARIES } from '@/app/premium-shadcn-components/libraries'

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
    `Install a first component to get started:`,
    '',
    '```bash',
    `npx shadcn add ${SITE}/r/popup`,
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
    '## No refunds',
    '',
    'All Detent Pro sales are final. When you buy, you get the full source code of every Pro component, block and template straight away, and code that’s been delivered can’t be handed back. So once your payment goes through, we don’t issue refunds.',
    '',
    '## What counts as using Pro',
    '',
    'Pro counts as used as soon as its code reaches you, by any of these routes:',
    '',
    '- Installing any Pro component, block or template with the shadcn CLI.',
    '- Getting Pro code through an AI agent, an MCP tool or any other assistant connected to your key.',
    '- Copying code from the site or the docs.',
    '- Downloading a template.',
    '',
    'It’s the same whether you take one component or the whole library.',
    '',
    `That’s why everything is out in the open first. Every Pro piece and both templates run live on detentui.com, and ${FREE_COUNT} components are free to install, so you can see how it looks and works in your own project before you pay. Buying and accessing Pro means you agree to this policy.`,
    '',
    '## Support',
    '',
    `If a component or a template doesn’t work in your project, email ${CONTACT} with what you installed and what you’re seeing, and we’ll help you fix it. When the problem is on our side, the fix ships as an update, so everyone who owns Pro gets it.`,
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

export type ComponentExtra = { api?: Api | null; example?: string | null }

function guideLines(id: string): string {
  const g = GUIDE[id]
  if (!g) return ''
  const alt = g.instead ? (entry(g.instead) ? `[${entry(g.instead)!.name}](${mdOf('components', g.instead)})` : g.instead) : null
  return ['## When to use', '', `- Use it for: ${g.use}`, `- Don't use it for: ${g.avoid}${alt ? ` Use ${alt} instead.` : ''}`].join('\n')
}

function usageLines(id: string, extra: ComponentExtra): string {
  const from = importOf(id)
  const name = extra.api?.component
  if (extra.example)
    return [
      '## Example',
      '',
      'A working example that typechecks against the installed piece. Keep its layout as a starting point and swap the sample data for the project\'s real data. Outer wrappers like `size-full` or a dark background come from the demo stage: give the parent a real size, or drop them.',
      '',
      '```tsx',
      extra.example.trim(),
      '```',
      ...extraPackages(extra.example),
    ].join('\n')
  if (!from || !name) return ''
  const required = (extra.api?.props ?? []).filter((p) => p.required).map((p) => `${p.name}={/* ${p.type} */}`)
  return ['## Usage', '', '```tsx', `import { ${name} } from '${from}'`, '', `<${name}${required.length ? ' ' + required.join(' ') : ''} />`, '```'].join('\n')
}

/* a picture of the piece, so an agent that can see matches the look, not just the API */
const looksLike = (id: string, name: string) => `## Looks like\n\n![${name}](${SITE}/components/${id}/opengraph-image)\n\nThis is the example below, rendered. The live, interactive version is at ${abs(`/components/${id}`)}.`

/* packages the example imports that a piece's install doesn't bring */
const BROUGHT = /^(react|react-dom|next|motion)(\/|$)/
function extraPackages(code: string): string[] {
  const pkgs = [...new Set([...code.matchAll(/from '([^'.@][^']*|@[^/']+\/[^']+)'/g)].map((m) => m[1]).filter((p) => !p.startsWith('@/') && !BROUGHT.test(p)).map((p) => (p.startsWith('@') ? p.split('/').slice(0, 2).join('/') : p.split('/')[0])))]
  return pkgs.length ? ['', `The example also uses ${pkgs.map((p) => `\`${p}\``).join(', ')}, which the install doesn't bring: \`npm i ${pkgs.join(' ')}\`, or swap in what the project already uses (for icons, its own icon set).`] : []
}

function propsLines(extra: ComponentExtra): string {
  const props = extra.api?.props ?? []
  if (!props.length) return ''
  const row = (p: PropDoc) => `| \`${p.name}\`${p.required ? ' (required)' : ''} | \`${cell(p.type)}\` | ${p.default ? `\`${cell(p.default)}\`` : ''} | ${cell(p.note ?? '')} |`
  return ['## Props', '', '| Prop | Type | Default | Description |', '| --- | --- | --- | --- |', ...props.map(row)].join('\n')
}

/* The steps an agent follows to add one piece. Commands are written out in full, with the checks before them. */
const latest = (cmd: string) => cmd.replace('npx shadcn add', 'npx shadcn@latest add')

function agentSteps(kind: 'components' | 'blocks', id: string, name: string, pro: boolean, from: string | null, extra: ComponentExtra = {}, has: { placement: boolean; example: boolean } = { placement: false, example: false }): string {
  const required = (extra.api?.props ?? []).filter((p) => p.required).map((p) => `\`${p.name}\``)
  const where = has.placement ? ', sized and placed as the Placement section says' : kind === 'blocks' ? ', as its own page or a full-width section' : ''
  const start = has.example ? ` Start from the Example below${required.length ? ` (required props: ${required.join(', ')})` : ''}, keep its layout, and swap in the project's real data.` : ` Use the props table on this page and pass the project's real data, not the demo values.`
  const steps = [
    'Check package.json: Detent needs React 19 and Tailwind CSS v4. If either is missing or older, stop and tell the user.',
    'If the project root has no components.json, run `npx shadcn@latest init --defaults --yes` there.',
    ...(pro ? [`This is a Pro piece. If components.json has no "@detent-pro" registry, or .env.local has no ${PRO_ENV}, follow ${PRO_SETUP_MD} first. If the user has no Pro key, don't install it: tell them it needs Detent Pro and what it would add (this page's About), and only offer a free piece from ${abs('/agents.md')} if one genuinely does the same job.`] : []),
    `Install it from the project root: \`${latest(installCommand(id, !pro))}\``,
    'Make sure the root layout (in Next.js, app/layout.tsx) wraps its children once in `<MotionConfig reducedMotion="user">` from motion/react. Add it only if it is not there.',
    `Import ${extra.api?.component ? `\`${extra.api.component}\` ` : ''}${from ? `from \`${from}\` ` : ''}and render it where the user asked${where}.${start}`,
    'If the project has no real data for it yet, put clearly marked placeholders in one content file. Never invent customer quotes, names or numbers and present them as real.',
    'Detent pieces are client components. If you pass them functions (format, onChange, render props), do it from a client component; a server page can only pass plain data, so load the data on the server and hand it to a small client wrapper.',
    'Use the Detent theme tokens (like bg-surface, text-ink, text-ink-3) for anything you draw around it, and className where the piece takes one. Don\'t rewrite its motion or internals.',
    'Run the project\'s typecheck (for example `npx tsc --noEmit`; on a fresh Next.js project run `npx next typegen` first, or it can\'t find types like LayoutProps). If you can run the app, open the page at a desktop and a phone width and check it renders with no console errors.',
    `If AGENTS.md or CLAUDE.md has no Detent section yet, add the block from ${abs('/agents.md')} so later tasks pick the right pieces.`,
    `Tell the user what you added, where, and anything they still need to fill in.`,
  ]
  return [
    '## For agents',
    '',
    `Prompt to give a coding agent: "${piecePrompt(id)}"`,
    '',
    ...steps.map((t, i) => `${i + 1}. ${t}`),
  ].join('\n')
}

function renderComponent(slug: string, extra: ComponentExtra = {}, compact = false): string | null {
  const e = entry(slug)
  if (!e) return null
  const free = !isProComponent(e.id)
  const from = importOf(e.id)

  const body = [
    `## About`,
    '',
    e.line,
    '',
    guideLines(e.id),
    '',
    PLACEMENT[e.id] ? ['## Placement', '', PLACEMENT[e.id]].join('\n') : '',
    '',
    compact ? '' : agentSteps('components', e.id, e.name, !free, from, extra, { placement: !!PLACEMENT[e.id], example: !!extra.example }),
    '',
    e.details.length > 0
      ? ['## Details', '', ...e.details.map((d) => `- ${d}`)].join('\n')
      : '',
    '',
    `## Install`,
    '',
    free ? 'Free, MIT licensed.' : `Part of Detent Pro. The \`@detent-pro\` registry must be in components.json and \`${PRO_ENV}\` set in .env.local first: ${PRO_SETUP_MD}`,
    '',
    '```bash',
    installCommand(e.id, free),
    '```',
    '',
    compact ? '' : `Needs React 19 and Tailwind CSS v4. The source lands in components/detent${from ? `; import it from \`${from}\`` : ''}.`,
    '',
    compact ? '' : looksLike(e.id, e.name),
    '',
    usageLines(e.id, extra),
    '',
    propsLines(extra),
    '',
    e.keys && e.keys.length > 0
      ? ['## Keyboard shortcuts', '', kvTable(e.keys, ['Keys', 'Action'])].join('\n')
      : '',
    '',
    compact ? '' : ['## Motion and accessibility', '', '- Wrap your root layout once in `<MotionConfig reducedMotion="user">` from motion/react; every Detent piece then respects reduced motion.', '- Style it through the Detent theme tokens and `className`, not by editing internals first.', '', `Every Detent piece, with when to use each: ${abs('/llms.txt')} · Agent rules to paste into AGENTS.md: ${abs('/agents.md')}`].join('\n'),
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

/* a block is a whole screen or section; where it goes follows from which */
const BLOCK_PLACE: Record<string, string> = {
  section: 'A full-width section of a landing page, in page order with the others. It brings its own surface, container and padding (about 1180 wide), so put it straight in the page, not inside your own padded container, and add no extra spacing above it. Pass every content prop; anything you leave out falls back to the demo’s sample content.',
  app: 'Its own route, filling the area below the app header (full width, at least the viewport height). Not inside a card or beside other content.',
  flow: 'Its own route, centred, full height, with nothing else on the screen.',
}

/* blocks may carry a recipe (a short worked example); older catalogs don't have the field */
const recipeOf = (b: (typeof BLOCKS)[number]) => (b as typeof b & { recipe?: { label: string; code: string } }).recipe

function renderBlock(slug: string, compact = false): string | null {
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
    ['## Placement', '', BLOCK_PLACE[b.kind] ?? BLOCK_PLACE.section].join('\n'),
    '',
    free ? '## Install' : '## Install (Pro required)',
    '',
    '```bash',
    installCommand(b.id, free),
    '```',
    '',
    compact ? '' : agentSteps('blocks', b.id, b.name, !free, importOf(b.id), { api: { component: b.component, props: [] } }, { placement: true, example: !!recipeOf(b) }),
    '',
    !compact && recipeOf(b) ? ['## Example', '', '```tsx', recipeOf(b)!.code.trim(), '```', ...extraPackages(recipeOf(b)!.code)].join('\n') : '',
    '',
    !compact && propsOf(b).length
      ? ['## Props', '', '| Prop | Type | Default | Description |', '| --- | --- | --- | --- |', ...propsOf(b).map((p) => `| \`${p.name}\` | \`${cell(p.type)}\` | ${p.default ? `\`${cell(p.default)}\`` : ''} | ${cell(p.note ?? '')} |`)].join('\n')
      : '',
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

/* A compact index for AGENTS.md / CLAUDE.md: Vercel's evals found a small always-loaded index beats skills */
function renderAgents(): string {
  const short = (t: string) => t.replace(/\.$/, '')
  const row = (e: (typeof ENTRIES)[number]) => {
    const g = GUIDE[e.id]
    const tier = isProComponent(e.id) ? 'pro' : 'free'
    return `${e.id} | ${tier} | ${g ? short(g.use) : short(e.line)} | ${g ? short(g.avoid) + (g.instead ? ` (use ${g.instead})` : '') : ''}`
  }
  return [
    '<!-- detent:start -->',
    '<!-- Detent agent rules. Keep in AGENTS.md or CLAUDE.md at the project root. Source: ' + abs('/agents.md') + ' -->',
    '',
    '## Detent components',
    '',
    `Detent (${SITE}) is a React component library installed through the shadcn CLI. Its source lives in components/detent and is ours to change.`,
    '',
    `IMPORTANT: prefer retrieval over memory for Detent. Before adding, using or changing a Detent piece, fetch its doc at ${SITE}/components/<id>.md (blocks: ${SITE}/blocks/<id>.md). It has when to use it, the import path, props and an example.`,
    '',
    `- Free install: \`npx shadcn add ${SITE}/r/<id>\``,
    `- Pro install: \`npx shadcn add @detent-pro/<id>\`. Needs the @detent-pro registry in components.json and ${PRO_ENV} in .env.local. Setup: ${PRO_SETUP_MD}`,
    '- Needs React 19 and Tailwind CSS v4. Wrap the root layout once in `<MotionConfig reducedMotion="user">` from motion/react.',
    '- Use the Detent theme tokens (bg-surface, text-ink, text-ink-3) for what you draw around pieces. Don\'t rewrite a piece\'s motion or internals.',
    '- Detent pieces are client components: pass them functions only from a client component.',
    '- Pick by the index below. If the task matches the avoid column, do not use that piece.',
    '- Place each piece as its page\'s Placement section says: the width and height it wants and where it sits. One hero per screen (Halo bands, Slice text and an Announcement pill together make one hero; Thread hero, Glyph art or Agent canvas each are one), 24 to 32px between pieces, and the project\'s own containers and spacing around them. Check the result at a phone width too.',
    '',
    'Index (id | tier | use for | avoid):',
    ...ENTRIES.map(row),
    '',
    `Blocks (whole screens): ${SITE}/blocks.md · Everything: ${SITE}/llms.txt`,
    `Setting up a new project: ${SETUP_MD} · Connecting Pro: ${PRO_SETUP_MD}`,
    '<!-- detent:end -->',
  ].join('\n')
}

function renderSetup(): string {
  const steps = [
    'Check package.json: Detent needs React 19 and Tailwind CSS v4 (Next.js is what it is tested on). If either is missing or older, stop and tell the user what to upgrade.',
    'If the project root has no components.json, run `npx shadcn@latest init --defaults --yes` there.',
    'Open the global stylesheet (in Next.js, app/globals.css). If shadcn init left `--font-sans: var(--font-sans)` (it points at itself, so the app font stops applying), set it to the font variable the root layout defines, for example `var(--font-geist-sans)`. Do the same for `--font-mono`.',
    `Install the Detent theme, which every piece draws with: \`npx shadcn@latest add ${SITE}/r/theme\``,
    'In the root layout (in Next.js, app/layout.tsx), wrap the children once in `<MotionConfig reducedMotion="user">` imported from motion/react, so every piece respects reduced motion. If motion isn\'t in package.json yet, run `npm i motion` first. Skip this if it is already there.',
    'Detent and shadcn go dark from a `.dark` class on <html>. If nothing in the project sets it yet (look for next-themes or a theme script), install next-themes and wrap the root layout\'s children in `<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>`, with `suppressHydrationWarning` on <html>. Skip this if the project already handles its theme.',
    `Fetch ${abs('/agents.md')}. Append its contents to the end of AGENTS.md at the project root (or CLAUDE.md if that is what the project uses). If a block between <!-- detent:start --> and <!-- detent:end --> is already there, replace it instead of adding a second one.`,
    `If the task doesn\'t already say, ask the user if they have Detent Pro. If yes, follow ${PRO_SETUP_MD}.`,
    `If the task names a Detent Pro plan or the pieces, go on to them. Otherwise ask what they want to build first and suggest pieces from the index in AGENTS.md. Add each by fetching its page (${SITE}/components/<id>.md) and following its "For agents" steps.`,
    'Run the project\'s typecheck (for example `npx tsc --noEmit`) and tell the user what changed.',
  ]
  return envelope({
    title: `Set up ${NAME}`,
    summary: 'Steps for a coding agent: prepare a project for Detent, install the theme, add the agent rules, and connect Pro if there is one.',
    path: '/setup',
    body: [
      `Prompt to give a coding agent: "${setupPrompt()}"`,
      '',
      '## Steps',
      '',
      ...steps.map((t, i) => `${i + 1}. ${t}`),
    ].join('\n'),
    related: [{ label: 'Connect Pro', href: PRO_SETUP_MD }, { label: 'Agent rules', href: abs('/agents.md') }, { label: 'Every piece', href: abs('/llms.txt') }],
  })
}

function renderProSetup(): string {
  const steps = [
    `Ask the user if they have a Detent Pro key. If they don't, stop here: don't make up a key or try to install Pro pieces. Tell them which pieces need Pro (${SITE}/pro), and carry on with the free pieces, or the free fallback the task named.`,
    `Ask them to paste the key. They make one at ${SITE}/account after buying Pro (one per machine). Never print the key back, put it in a commit, a log or any file other than .env.local.`,
    `Add \`${PRO_ENV}=<the key>\` to .env.local at the project root, creating the file if needed. Make sure .gitignore covers .env.local (add \`.env*.local\` if nothing does).`,
    `In components.json, add the Detent Pro registry inside "registries", keeping any registries already there:\n\n\`\`\`json\n{\n  ${PRO_REGISTRY.replace(/\n/g, '\n  ')}\n}\n\`\`\``,
    'Check the key works without writing files: `npx shadcn@latest view @detent-pro/theme`. If the CLI says DETENT_PRO_KEY is required, the key is not being read: check the variable name in .env.local and that you ran it from the project root. If it says the key was rejected, ask the user to make a new one at the account page.',
    `Tell the user it is connected, and that ${PRO_ENV} is only needed where \`shadcn add\` runs, never in the app's runtime or client code.`,
  ]
  return envelope({
    title: `Connect ${NAME} Pro`,
    summary: 'Steps for a coding agent: connect a Detent Pro licence key so Pro pieces install by name.',
    path: '/pro-setup',
    body: [
      `Prompt to give a coding agent: "${proSetupPrompt()}"`,
      '',
      '## Steps',
      '',
      ...steps.map((t, i) => `${i + 1}. ${t}`),
    ].join('\n'),
    related: [{ label: 'Set up Detent', href: SETUP_MD }, { label: 'Pro', href: abs('/pro') }],
  })
}

function renderPremium(): string {
  const body = [
    `Seven paid shadcn/ui libraries compared by price, licence, size and what each is best for. Prices checked ${CHECKED}. Written by the maker of Detent UI, which is one of the seven.`,
    '',
    '## Side by side',
    '',
    kvTable(
      LIBRARIES.map((l) => [l.name, `${l.price}, ${l.model.toLowerCase()}${l.sale ? ` (on sale for ${l.sale})` : ''}. Best for: ${l.bestFor}`]),
      ['Library', 'Price and best for'],
    ),
    '',
    ...LIBRARIES.flatMap((l) => [`## ${l.name}`, '', l.line, '', `Good: ${l.good.join('; ')}.`, '', `Watch out: ${l.watch.join('; ')}.`, '', `Link: ${l.url.startsWith('/') ? abs(l.url) : l.url}`, '']),
    `Detent installs with \`npx shadcn add @detent-pro/region\` after connecting a Pro key (${PRO_SETUP_MD}). ${FREE_COUNT} components are free under MIT.`,
  ].join('\n')
  return envelope({
    title: 'Best premium shadcn/ui component libraries (2026), compared',
    summary: `Seven paid shadcn/ui libraries compared by price, licence and size, checked ${CHECKED}.`,
    path: '/premium-shadcn-components',
    body,
    related: [{ label: 'Pro', href: abs('/pro') }, { label: 'Components', href: abs('/components') }],
  })
}


const STATIC_ROUTES: Record<string, { render: () => string | null; desc: string; isStatic: boolean }> = {
  '/':            { render: renderHome,       desc: `${NAME} — premium React components`,              isStatic: true },
  '/pro':         { render: renderPro,        desc: `Pro components, blocks and templates`,              isStatic: true },
  '/premium-shadcn-components': { render: renderPremium, desc: 'Every Pro component, for shadcn/ui', isStatic: true },
  '/components':  { render: renderComponents, desc: `All ${ENTRIES.length} components, by category`,    isStatic: true },
  '/blocks':      { render: renderBlocks,     desc: `All ${BLOCKS.length} whole-screen blocks`,         isStatic: true },
  '/templates':   { render: renderTemplates,  desc: `Every template`,                isStatic: true },
  '/docs':        { render: renderDocs,       desc: 'Get started: install a component, connect Pro, use a coding agent', isStatic: true },
  '/system':      { render: renderSystem,     desc: 'Design tokens, typography and theme',             isStatic: true },
  '/changelog':   { render: renderChangelog,  desc: 'Every update, newest first',                      isStatic: false },
  '/licence':     { render: renderLicence,    desc: 'Licence terms and key conditions',                isStatic: true },
  '/terms':       { render: renderTerms,      desc: 'Terms of service',                                isStatic: true },
  '/refunds':     { render: renderRefunds,    desc: 'Refund policy: all sales are final',      isStatic: true },
  '/setup':       { render: renderSetup,      desc: 'For coding agents: set up a project for Detent in one go', isStatic: true },
  '/pro-setup':   { render: renderProSetup,   desc: 'For coding agents: connect a Detent Pro key', isStatic: true },
  '/agents':      { render: renderAgents,     desc: 'Agent rules for AGENTS.md: when to use each piece, how to install', isStatic: true },
  '/privacy':     { render: renderPrivacy,    desc: 'What we keep, who helps run it, and how to remove it', isStatic: true },
}

/* The per-page markdown, with what only the build data knows: a component's props and its example */
export async function renderMarkdownRich(canonicalPath: string): Promise<{ content: string | null; isStatic: boolean }> {
  const block = canonicalPath.match(/^\/blocks\/([^/]+)$/)
  if (block) return { content: renderBlock(block[1]), isStatic: true }
  const m = canonicalPath.match(/^\/components\/([^/]+)$/)
  if (!m || !entry(m[1])) return renderMarkdown(canonicalPath)
  const [api, example] = await Promise.all([apiOf(m[1]), asset<{ code: string }>(`usage/${m[1]}.json`)])
  return { content: renderComponent(m[1], { api, example: example?.code ?? null }), isStatic: true }
}

export function renderMarkdown(canonicalPath: string): { content: string | null; isStatic: boolean } {
  if (canonicalPath in STATIC_ROUTES) {
    const { render, isStatic } = STATIC_ROUTES[canonicalPath]
    return { content: render(), isStatic }
  }

  const componentMatch = canonicalPath.match(/^\/components\/([^/]+)$/)
  if (componentMatch) {
    return { content: renderComponent(componentMatch[1], {}, true), isStatic: true }
  }

  const blockMatch = canonicalPath.match(/^\/blocks\/([^/]+)$/)
  if (blockMatch) {
    return { content: renderBlock(blockMatch[1], true), isStatic: true }
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
