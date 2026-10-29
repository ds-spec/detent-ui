/**
 * Making a template yours, step by step: what a buyer does after paying, in order, with the exact
 * file and the exact lines. A template isn't a component you configure with props, it's an app you
 * take over, so this is its documentation. Each step is a title, a line, and code when there is some.
 */

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
  rapport: [
    { title: 'Install it', line: 'Rapport lands in components/detent/templates/rapport, with every piece it’s built from and the packages it needs.', code: 'npx shadcn add @detent-pro/template-rapport' },
    { title: 'Give it a page', line: 'It fills whatever holds it, so give it the whole screen.', file: 'app/page.tsx', code: page('RapportApp', 'rapport/App') },
    { title: 'Turn on Ask Rapport', line: 'One line puts its AI SDK route where the app calls it. It answers from a script until you give it a model, so it runs with no key.', file: 'app/api/rapport/route.ts', code: "export { POST } from '@/components/detent/templates/rapport/ai/route'\n" },
    { title: 'Give it a real model', line: 'Swap the script for any AI SDK model: here, npm i @ai-sdk/anthropic and ANTHROPIC_API_KEY in .env.local. The tools stay as they are, and approvals still wait for a person.', file: 'components/detent/templates/rapport/ai/route.ts', code: model('scripted(deals, probs, policy)') },
    { title: 'Put in your data', line: 'Deals, people, companies, tasks and the inbox are plain arrays in rapport/data.ts. Read yours from your database in the same shape, and the tools in ai/tools.ts answer from them.' },
    { title: 'Make it your product', line: 'Colours and type come from your shadcn theme already. The name is written into the screens, so search the rapport folder for “Rapport” and put yours.' },
  ],
  tandem: [
    { title: 'Install it', line: 'Tandem lands as real pages in app/dashboard: the overview, revenue, customers and each customer, invoices, Ask Tandem, agents, settings and sign-in, with a loading and an error state, and its AI route at app/api/tandem. The app they share goes in components/detent/templates/tandem.', code: 'npx shadcn add @detent-pro/template-tandem' },
    { title: 'Open it', line: 'Run your app and go to /dashboard. Every page has its own URL, so links, refresh and the back button work. It runs on demo data and a scripted model, so it needs no key yet.' },
    { title: 'Make it your product', line: 'The name and domain are written into every screen from one file: the sidebar, sign-in, the assistant, its models, settings and emails. Colours and type come from your shadcn theme.', file: 'components/detent/templates/tandem/config.ts', code: "export const BRAND = {\n  name: 'Acme',\n  domain: 'acme.com',\n}" },
    { title: 'Put in your data', line: 'The layout reads your accounts and reports on the server and hands them to every page. Swap each function’s body for your database; the charts read the series in data.ts the same way.', file: 'components/detent/templates/tandem/db.ts', code: 'export async function getAccounts(): Promise<Account[]> {\n  return db.select().from(accounts) // was the demo data\n}' },
    { title: 'Give it a real model', line: 'Swap the script for any AI SDK model and add its key to .env.local. Settings sends the model someone picks with every request, so you can choose by it. Each agent’s instructions are in ai/agents.ts; in production a cron calls the route with that agent’s id.', file: 'components/detent/templates/tandem/ai/route.ts', code: model('scripted(job?.id, day)') },
    { title: 'Add your sign-in', line: 'The sign-in page is at /dashboard/sign-in. Call your auth in its handler (Auth.js, Clerk, Better Auth), and keep /dashboard behind it in your proxy.ts.', file: 'app/dashboard/sign-in/page.tsx' },
  ],
  detent: [
    { title: 'Install it', line: 'The workspace lands in components/detent/templates/detent, with every piece it’s built from.', code: 'npx shadcn add @detent-pro/template-detent' },
    { title: 'Give it a page', line: 'It fills whatever holds it. Name your product with product, and pass autoplay={false} to stop the demo from playing.', file: 'app/page.tsx', code: page('Workspace', 'detent/Workspace') },
    { title: 'Put in your sessions', line: 'The sidebar’s sessions, the sources answers cite and the turns of a session are plain data in detent/data.ts. Answers are markdown-lite: paragraphs, **bold**, `code`, and [n] for a citation.' },
    { title: 'Connect your agent', line: 'The workspace is the front end. Where it plays a turn from data.ts, append what your agent streams instead: the thread draws the same text, citations and tool steps.' },
  ],
}
