import type { Metadata } from 'next'
import Link from 'next/link'
import { BLOCKS } from '@/catalog/blocks'
import { asset } from '@/lib/asset'
import { entry } from '@/catalog/meta'
import { PLANS, isProComponent } from '@/catalog/pro'
import { Files } from '@/site/ai/Files'
import { Live } from '@/site/ai/Live'
import type { RailGroup } from '@/site/exhibit/Rail'
import { page } from '@/site/seo'
import { LinkShell } from '@/site/shell/Shell'

export const metadata: Metadata = page({
  title: 'Works with the AI SDK',
  description: 'Hand Detent what useChat gives you: reasoning, tool calls, approvals and sources each land in the piece built for them, timed as they stream. Try it live.',
  path: '/ai-sdk',
  image: '/opengraph-image',
})

const [pro] = PLANS

/** The list down the side: this page's sections, then the parts the chat is made of. */
const PARTS = ['trace', 'activity', 'models']
const RAIL: RailGroup[] = [
  {
    id: 'guide',
    name: 'On this page',
    items: [
      { id: 'overview', name: 'Overview' },
      { id: 'try', name: 'Try it live' },
      { id: 'map', name: 'What goes where' },
      { id: 'code', name: 'The code' },
    ],
  },
  {
    id: 'parts',
    name: 'Built from',
    items: [
      { id: 'agent-chat', name: BLOCKS.find((b) => b.id === 'agent-chat')?.name ?? 'Agent chat', pro: true },
      ...PARTS.map((id) => ({ id, name: entry(id)?.name ?? id, pro: isProComponent(id) })),
    ],
  },
]
const LINKS: Record<string, string> = {
  overview: '#overview',
  try: '#try',
  map: '#map',
  code: '#code',
  'agent-chat': '/blocks/agent-chat',
  ...Object.fromEntries(PARTS.map((id) => [id, `/components/${id}`])),
}

/** What each part of a UIMessage becomes. */
const MAP: { parts: string[]; becomes: string; line: string }[] = [
  { parts: ['reasoning'], becomes: 'The live thought', line: 'One sentence at a time while it thinks, never a word at a time, then “Thought for 4s” with the steps folded under it.' },
  { parts: ['tool-*', 'dynamic-tool'], becomes: 'Steps and spans', line: 'Each call is a step under the thought and a row in the run’s waterfall, timed from when it starts to when its output comes back.' },
  { parts: ['approval-requested'], becomes: 'The approval card', line: 'The prompt box steps aside for it. Enter and Escape answer through addToolApprovalResponse; money takes a second press that names the amount.' },
  { parts: ['source-url', 'source-document'], becomes: 'Citations', line: 'Every [n] in the reply points at its source, and the source cards sit under the answer.' },
  { parts: ['text'], becomes: 'The reply', line: 'Streamed into a fixed width, so a line never re-wraps as words arrive.' },
  { parts: ['step-start'], becomes: 'Model calls', line: 'Each step the model takes is its own row in the waterfall, with the tools it asked for hanging under it.' },
]

/**
 * The AI SDK, end to end: the Agent chat block live on a real route, then what each part of a
 * message becomes, then the code it takes. The demo is the argument; everything under it says how.
 */
export default async function AiSdk() {
  const shown = (await asset<{ name: string; note: string; code: string; html: string }[]>('ai-files.json')) ?? []

  return (
    <LinkShell label="AI SDK" groups={RAIL} links={LINKS} current="overview" trail={['AI SDK']}>
      <main className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-8">
        <section id="overview" className="grid scroll-mt-24 gap-8 pt-16 sm:pt-24 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end lg:gap-16">
          <div>
            <p className="rise text-footnote text-ink-3">AI SDK</p>
            <h1 className="mt-3 text-[clamp(36px,4.8vw,60px)] font-normal leading-[1.04] tracking-[-0.05em] text-ink">
              <span className="focus-in inline-block">Bring your useChat.</span>
              <span className="focus-in block text-quiet" style={{ animationDelay: '120ms' }}>
                We’ll draw the rest.
              </span>
            </h1>
          </div>
          <div className="rise" style={{ animationDelay: '240ms' }}>
            <p className="text-lead text-ink-3">Reasoning, tool calls, approvals and sources each land in the component built for them, timed as they stream. The window below runs on a real AI SDK route: ask it something, or approve the refund.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/pro#pricing" className="ring-focus flex h-11 items-center rounded-full bg-ink px-6 text-callout font-medium text-surface transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]">
                {pro.cta} · ${pro.price}
              </Link>
              <Link href="#code" className="ring-focus flex h-11 items-center rounded-full bg-surface-2 px-6 text-callout font-medium text-ink transition-colors duration-150 hover:bg-card">
                See the code
              </Link>
            </div>
          </div>
        </section>

        <div id="try" className="rise mt-12 scroll-mt-24 sm:mt-16" style={{ animationDelay: '320ms' }}>
          <Live keep />
          <p className="mt-4 px-2 text-footnote text-ink-3">
            A real <span className="font-mono text-ink-2">streamText</span> route with a scripted model in place of a paid one, so it’s free to try. It knows one ticket; swap in your model and it knows yours.
          </p>
        </div>

        <section aria-labelledby="map" className="mt-28 grid scroll-mt-24 gap-x-16 gap-y-10 lg:grid-cols-[320px_minmax(0,1fr)]">
          <h2 id="map" className="scroll-mt-24 text-[clamp(28px,3vw,36px)] font-normal leading-[1.1] tracking-[-0.04em] text-ink">
            What goes where.
            <span className="block text-quiet">Every part has a place.</span>
          </h2>
          <dl>
            {MAP.map((m) => (
              <div key={m.becomes} className="grid gap-2 py-5 shadow-[inset_0_1px_0_var(--line)] sm:grid-cols-[240px_minmax(0,1fr)] sm:gap-8">
                <dt className="flex flex-wrap content-start gap-1.5">
                  {m.parts.map((p) => (
                    <code key={p} className="rounded-[7px] bg-surface-2 px-2 py-0.5 font-mono text-caption leading-5 text-ink-2">
                      {p}
                    </code>
                  ))}
                </dt>
                <dd>
                  <p className="text-callout font-medium text-ink">{m.becomes}</p>
                  <p className="mt-1 max-w-[560px] text-callout text-ink-3">{m.line}</p>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="code" aria-labelledby="code-title" className="mt-28 grid scroll-mt-24 gap-x-16 gap-y-10 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div>
            <h2 id="code-title" className="text-[clamp(28px,3vw,36px)] font-normal leading-[1.1] tracking-[-0.04em] text-ink">
              Two files.
              <span className="block text-quiet">One is the AI SDK’s.</span>
            </h2>
            <p className="mt-5 max-w-[300px] text-callout text-ink-3">The messages carry no times, so the hook notes when each part arrives and when it settles. That’s what gives the waterfall its real durations.</p>
          </div>
          <Files files={shown} />
        </section>

        <section className="mt-28 flex flex-col items-start gap-6 rounded-[28px] bg-surface-2 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <p className="text-title text-ink">Agent chat is in {pro.name}.</p>
            <p className="mt-1 max-w-[520px] text-callout text-ink-3">With the adapter, the answer, the run waterfall and the approval card it’s made from, and every other block.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href="/blocks/agent-chat" className="ring-focus flex h-11 items-center rounded-full bg-surface px-6 text-callout font-medium text-ink shadow-border transition-[background-color,transform] duration-150 hover:bg-card active:scale-[0.97]">
              Open the block
            </Link>
            <Link href="/pro#pricing" className="ring-focus flex h-11 items-center rounded-full bg-ink px-6 text-callout font-medium text-surface transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]">
              {pro.cta} · ${pro.price}
            </Link>
          </div>
        </section>
      </main>
    </LinkShell>
  )
}
