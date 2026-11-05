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
}
