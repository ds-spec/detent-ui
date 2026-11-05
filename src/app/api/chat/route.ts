import { convertToModelMessages, jsonSchema, simulateReadableStream, stepCountIs, streamText, tool } from 'ai'
import type { ModelMessage, UIMessage } from 'ai'
import { MockLanguageModelV4 } from 'ai/test'

export const maxDuration = 30

const usage = { inputTokens: { total: 120, noCache: 120, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 80, text: 60, reasoning: 20 } }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

type Chunk = Record<string, unknown>
const say = (kind: 'text' | 'reasoning', id: string, words: string): Chunk[] => [
  { type: `${kind}-start`, id },
  ...words.split(/(?<= )/).map((w) => ({ type: `${kind}-delta`, id, delta: w })),
  { type: `${kind}-end`, id },
]
const call = (id: string, toolName: string, input: unknown): Chunk => ({ type: 'tool-call', toolCallId: `${id}-${Math.random().toString(36).slice(2, 8)}`, toolName, input: JSON.stringify(input) })
const source = (id: string, url: string, title: string): Chunk => ({ type: 'source', sourceType: 'url', id, url, title })

const TRACKING = 'https://www.dhl.com/global-en/home/tracking.html?tracking-id=4471882031'
const POLICY = 'https://help.example.com/refunds'
const REPLY = {
  refunded: 'Hola Lucía, siento mucho lo de tu paquete. DHL lo perdió el 18 de octubre, así que te he devuelto los 86,00 $ a tu tarjeta. Lo verás en 3 a 5 días hábiles.',
  open: 'Hola Lucía, siento mucho lo de tu paquete. DHL lo perdió el 18 de octubre en Madrid. Estamos viendo cómo solucionarlo y te escribo hoy mismo.',
}

const intent = (text: string) =>
  /write|reply|message|spanish|tell her|let her know/i.test(text) ? 'reply' : /why|how come|what happened|where is/i.test(text) ? 'why' : /4471|order|parcel|package|arriv|refund|lost|lucía|lucia/i.test(text) ? 'refund' : 'other'

function next(prompt: ModelMessage[]): { chunks: Chunk[]; reason: 'tool-calls' | 'stop' } {
  const at = prompt.findLastIndex((m) => m.role === 'user')
  const asked = prompt[at]
  const text = typeof asked?.content === 'string' ? asked.content : (asked?.content ?? []).map((c) => (c.type === 'text' ? c.text : '')).join(' ')
  const results = prompt
    .slice(at + 1)
    .flatMap((m) => (m.role === 'tool' ? m.content : []))
    .flatMap((c) => (c.type === 'tool-result' ? [{ name: c.toolName, denied: c.output.type === 'execution-denied' }] : []))
  const heard = (name: string) => results.find((r) => r.name === name)
  const refunded = prompt.some((m) => m.role === 'tool' && m.content.some((c) => c.type === 'tool-result' && c.toolName === 'refund' && c.output.type !== 'execution-denied'))
  const stop = (chunks: Chunk[]) => ({ chunks, reason: 'stop' as const })
  const tools = (chunks: Chunk[]) => ({ chunks, reason: 'tool-calls' as const })

  switch (intent(text)) {
    case 'refund': {
      const refund = heard('refund')
      if (refund?.denied)
        return stop([
          ...say('reasoning', 'r', 'No refund, then. Leave the money where it is and offer what else could help.'),
          source('s1', TRACKING, 'DHL tracking for 4471 8820 31'),
          ...say('text', 't', 'Okay, I haven’t refunded anything. DHL still lists **#4471** as lost in transit [1], so I can open a claim with them instead, or send Lucía a replacement.'),
        ])
      if (refund)
        return stop([
          ...say('reasoning', 'r', 'The refund went through. Say what happened and when she’ll see the money.'),
          source('s1', TRACKING, 'DHL tracking for 4471 8820 31'),
          source('s2', POLICY, 'Refunds and lost parcels'),
          ...say('text', 't', 'DHL marked **#4471** lost in transit on October 18, at its Madrid hub [1]. I’ve refunded the full **$86.00** to her Visa ending 4242; it usually shows in 3 to 5 working days [2].\n\nIf the parcel turns up after all, she can keep it.'),
        ])
      if (heard('lookupOrder'))
        return tools([
          ...say('reasoning', 'r', 'DHL marked it lost six days ago, so a full refund is fair. It moves money, so it waits for your yes.'),
          call('refund', 'refund', { orderId: '4471', amount: 86, card: 'Visa •• 4242' }),
        ])
      return tools([
        ...say('reasoning', 'r', 'Lucía says her parcel never arrived. First, find the order and where DHL last saw it.'),
        call('lookup', 'lookupOrder', { orderId: '4471' }),
      ])
    }
    case 'reply': {
      const reply = heard('sendMessage')
      if (reply?.denied) return stop(say('text', 't', 'Okay, I didn’t send it. Tell me what to change and I’ll write it again.'))
      if (reply)
        return stop(
          say('text', 't', refunded ? 'Sent to Lucía on WhatsApp, in Spanish. It tells her the parcel was lost, that **$86.00** is on its way back to her card, and when to expect it.' : 'Sent to Lucía on WhatsApp, in Spanish. It tells her the parcel was lost and that she’ll hear from you again today, without promising a refund.'),
        )
      return tools([
        ...say('reasoning', 'r', 'She wrote in Spanish, so answer in Spanish: short, warm, and with the dates she needs.'),
        call('reply', 'sendMessage', { to: 'Lucía Romero', channel: 'WhatsApp', text: refunded ? REPLY.refunded : REPLY.open }),
      ])
    }
    case 'why': {
      if (heard('trackParcel'))
        return stop([
          source('s1', TRACKING, 'DHL tracking for 4471 8820 31'),
          ...say('text', 't', 'The last scan was at DHL’s Madrid hub on October 18, the day it was meant to go out for delivery [1]. After 48 hours with no scan, DHL treats a parcel as lost. Nothing on the record says it was damaged or sent back.'),
        ])
      return tools([
        ...say('reasoning', 'r', 'The answer is in the tracking history, so read every scan, not just the last one.'),
        call('track', 'trackParcel', { tracking: '4471 8820 31' }),
      ])
    }
    default:
      return stop([
        ...say('reasoning', 'r', 'This model is scripted, so it can only speak to the one ticket it knows.'),
        ...say('text', 't', 'I’m running on a scripted model here, so I only know one ticket: Lucía’s parcel, order **#4471**. Ask me to sort it out.\n\nIn your app, point `api` at your own route and this is whatever model you choose.'),
      ])
  }
}

const model = new MockLanguageModelV4({
  doStream: async ({ prompt }) => {
    const { chunks, reason } = next(prompt)
    return {
      stream: simulateReadableStream({
        chunks: [{ type: 'stream-start', warnings: [] }, ...chunks, { type: 'finish', usage, finishReason: { unified: reason, raw: undefined } }] as never[],
        initialDelayInMs: 420,
        chunkDelayInMs: 38,
      }),
    }
  },
})

const tools = {
  lookupOrder: tool({
    description: 'Look up an order in Shopify, with where its parcel is.',
    inputSchema: jsonSchema<{ orderId: string }>({ type: 'object', properties: { orderId: { type: 'string' } }, required: ['orderId'] }),
    execute: async ({ orderId }) => {
      await sleep(1100)
      return { orderId, status: 'Lost in transit', carrier: 'DHL', total: 86, customer: 'Lucía Romero' }
    },
  }),
  trackParcel: tool({
    description: 'Read a parcel’s whole tracking history from DHL.',
    inputSchema: jsonSchema<{ tracking: string }>({ type: 'object', properties: { tracking: { type: 'string' } }, required: ['tracking'] }),
    execute: async ({ tracking }) => {
      await sleep(900)
      return { tracking, scans: 6, last: 'Oct 18, Madrid hub' }
    },
  }),
  refund: tool({
    description: 'Refund an order to the card it was paid with, through Stripe.',
    inputSchema: jsonSchema<{ orderId: string; amount: number; card: string }>({ type: 'object', properties: { orderId: { type: 'string' }, amount: { type: 'number' }, card: { type: 'string' } }, required: ['orderId', 'amount'] }),
    needsApproval: true,
    execute: async ({ orderId, amount }) => {
      await sleep(800)
      return { orderId, amount, refunded: true }
    },
  }),
  sendMessage: tool({
    description: 'Send the customer a message on the channel they wrote in.',
    inputSchema: jsonSchema<{ to: string; channel: string; text: string }>({ type: 'object', properties: { to: { type: 'string' }, channel: { type: 'string' }, text: { type: 'string' } }, required: ['to', 'channel', 'text'] }),
    needsApproval: true,
    execute: async ({ to, channel }) => {
      await sleep(700)
      return { to, channel, sent: true }
    },
  }),
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()
  const result = streamText({ model, tools, messages: await convertToModelMessages(messages.slice(-24)), stopWhen: stepCountIs(5) })
  return result.toUIMessageStreamResponse({ sendReasoning: true, sendSources: true })
}
