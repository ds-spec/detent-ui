export type Step = { title: string; line: string; code?: string; file?: string }

const page = (name: string, file: string, wrap = 'h-dvh') => `'use client'

import dynamic from 'next/dynamic'

// It measures itself as it paints, so it renders in the browser.
const ${name} = dynamic(() => import('@/components/detent/templates/${file}').then((m) => m.${name}), { ssr: false })

export default function Page() {
  return (
    <div className="${wrap}">
      <${name} />
    </div>
  )
}
`

const model = (was: string) => `import { anthropic } from '@ai-sdk/anthropic'

// in streamText({ … }):
model: anthropic('claude-sonnet-5-5'), // was ${was}`

export const START: Record<string, Step[]> = {
  detent: [
    { title: 'Install it', line: 'The workspace lands as pages in app/chat (a new chat, each session at its own address, and Automations) with its agent’s AI route at app/api/detent. The workspace itself goes in components/detent/templates/detent. First time? Set up the Pro registry once, as on the Pro page under Set up once.', code: 'npx shadcn add @detent-pro/template-detent' },
    { title: 'Open it', line: 'Run your app and go to /chat. Every session has its own URL, so links, refresh and the back button work. Ask it anything: the agent searches, reads and answers with sources, and asks before it runs a command. It answers from a script until you give it a model, so it runs with no key.' },
    { title: 'Give it a real model', line: 'Swap the script for any AI SDK model and add its key to .env.local. Point its three tools at your own search, files and sandbox; a tool with needsApproval waits for a yes in the thread.', file: 'components/detent/templates/detent/ai/route.ts', code: model('scripted') },
    { title: 'Put in your sessions', line: 'The layout reads the sessions down the side on the server. Swap the body for your database, and store each session’s turns with it to bring old ones back.', file: 'components/detent/templates/detent/db.ts', code: 'export async function getSessions(): Promise<Session[]> {\n  return db.select().from(sessions) // was the demo’s\n}' },
    { title: 'Make it your product', line: 'Your name for its models and your team’s workspace come from one file; the mark in the rail is Mark.tsx. Colours and type come from your shadcn theme.', file: 'components/detent/templates/detent/config.ts', code: "export const BRAND = {\n  name: 'Acme',\n  workspace: 'Acme',\n  workspaces: ['Acme', 'Personal'],\n}" },
  ],
  dusk: [
    { title: 'Install it', line: 'The landing page lands in components/detent/templates/dusk, with its privacy policy, terms, 404, share image and icon beside it. It needs React 19, the Next.js App Router and Tailwind v4. First time? Set up the Pro registry once, as on the Pro page under Set up once.', code: 'npx shadcn add @detent-pro/template-dusk' },
    { title: 'Open it', line: 'Render it as your home page and run your app. The bar and the footer are fixed and the closing follows the window’s scroll, so give it the whole page, not a box inside one.', file: 'app/page.tsx', code: "import { DuskPage } from '@/components/detent/templates/dusk/DuskPage'\nexport { homeMetadata as metadata } from '@/components/detent/templates/dusk/meta'\n\nexport default function Page() {\n  return <DuskPage />\n}" },
    { title: 'Make it yours', line: 'Every word, quote, price, log line and link is in one file, and every one is a placeholder. Colours and the sky are tokens in theme.ts; the README lists everything to replace before launch.', file: 'components/detent/templates/dusk/content.ts', code: "export const PRODUCT = 'Acme'\n\nexport const HERO = {\n  title: ['Your headline', 'on two lines'],\n  // …\n}" },
    { title: 'Add the legal pages and the 404', line: 'Privacy and terms are pages of their own with the same bar and footer; the footer already links to /privacy and /terms. Their text is a placeholder in LEGAL in content.ts: have a lawyer replace it.', file: 'app/privacy/page.tsx', code: "import { DuskPrivacy } from '@/components/detent/templates/dusk/Legal'\nexport { privacyMetadata as metadata } from '@/components/detent/templates/dusk/meta'\n\nexport default function Page() {\n  return <DuskPrivacy />\n}\n\n// app/terms/page.tsx: DuskTerms and termsMetadata\n// app/not-found.tsx: DuskNotFound and notFoundMetadata" },
    { title: 'Set the metadata and the share image', line: 'Put your address, title and X handle in META in content.ts. The layout shares the metadata with every page, and the share image is drawn from your product name and headline. Copy icon.svg into public/.', file: 'app/layout.tsx', code: "export { metadata } from '@/components/detent/templates/dusk/meta'\n\n// app/opengraph-image.tsx\nexport { default, size, contentType, alt } from '@/components/detent/templates/dusk/og'" },
  ],
}
