const BLOCK = `import { AgentChat } from '@/components/detent/blocks/chat/AgentChat'

export default function Support() {
  return <AgentChat api="/api/chat" />
}`

const ROUTE = `import { convertToModelMessages, stepCountIs, streamText, tool } from 'ai'
import { z } from 'zod'
import { findOrder, refundOrder } from '@/lib/store'

export async function POST(req: Request) {
  const { messages } = await req.json()
  const result = streamText({
    model: 'openai/gpt-5', // any model the AI SDK supports
    messages: await convertToModelMessages(messages),
    tools: {
      lookupOrder: tool({
        inputSchema: z.object({ orderId: z.string() }),
        execute: findOrder,
      }),
      refund: tool({
        inputSchema: z.object({ orderId: z.string(), amount: z.number() }),
        needsApproval: true, // waits on the approval card
        execute: refundOrder,
      }),
    },
    stopWhen: stepCountIs(5),
  })
  return result.toUIMessageStreamResponse({ sendReasoning: true, sendSources: true })
}`

const HOOK = `'use client'

import { useChat } from '@ai-sdk/react'
import { lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai'
import { useDetentChat } from '@/components/detent/ai/ai-sdk'
import { ApprovalTray } from '@/components/detent/components/approval/ApprovalTray'
import { StreamingAnswer } from '@/components/detent/components/answer/StreamingAnswer'
import { RunTrace } from '@/components/detent/components/trace/RunTrace'

export function Assistant() {
  const chat = useChat({ sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses })
  const { turns, trace, approvals } = useDetentChat(chat, {
    tools: {
      lookupOrder: { running: (i) => \`Looking up order #\${i.orderId}\` },
      refund: { via: 'Stripe', risk: 'high', confirm: (i) => \`Refund $\${i.amount}\` },
    },
  })
  return (
    <>
      {turns.map((t) => <StreamingAnswer key={t.key} {...t.props} />)}
      {trace && <RunTrace {...trace} />}
      <ApprovalTray {...approvals} />
    </>
  )
}`

export const AI_FILES = [
  { name: 'app/support/page.tsx', note: 'The whole screen: the Agent chat block, pointed at your route.', code: BLOCK },
  { name: 'app/api/chat/route.ts', note: 'A plain AI SDK route. Tools that need a person say so with needsApproval.', code: ROUTE },
  { name: 'Your own layout', note: 'Or lay the pieces out yourself: useDetentChat turns useChat into their props.', code: HOOK },
]
