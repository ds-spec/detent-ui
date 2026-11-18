/* Clean usage for the pieces whose site demo is a scripted autoplay: the same data the demo shows, wired the way an
   app wires it, with nothing that drives the demo. Imports point where an install puts each piece. */
export const AGENT_EXAMPLES: Record<string, string> = {
  diff: `'use client'

import { DiffReview } from '@/components/detent/components/diff/DiffReview'
import type { Hunk, Verdict } from '@/components/detent/components/diff/DiffReview'

// The change your agent proposed, a hunk at a time. Each line is ['ctx' | 'add' | 'del', text].
const hunks: Hunk[] = [
  {
    id: 'limits',
    scope: 'LIMITS',
    o: 12,
    n: 12,
    lines: [
      ['ctx', 'export const LIMITS = {'],
      ['del', '  approvalOver: 1000,'],
      ['add', '  approvalOver: 500,'],
      ['ctx', '}'],
    ],
  },
]

export function ReviewChange() {
  const apply = (verdicts: Record<string, Verdict>) => {
    // Apply the hunks marked 'accepted', drop the 'rejected' ones.
    console.log(verdicts)
  }
  return <DiffReview title="Apply the Q3 refund rules" file="src/billing/refunds.ts" hunks={hunks} onApply={apply} />
}
`,

  rewrite: `'use client'

import { Rewrite } from '@/components/detent/components/rewrite/Rewrite'

const policy =
  'If an order arrives damaged, customers can ask for a refund within 30 days. In most cases we will be able to process the refund once the item has been returned to our warehouse and checked by the team, which usually takes about two weeks.'

export function PolicyEditor() {
  // Called with the words someone selected and how they asked them to read. Call your model here.
  const rewrite = async (selected: string, ask: string) => {
    const res = await fetch('/api/rewrite', { method: 'POST', body: JSON.stringify({ selected, ask }) })
    return (await res.json()).text as string
  }
  return <Rewrite text={policy} rewrite={rewrite} actions={['Shorter', 'Friendlier']} assistant="Assistant" onChange={(text) => console.log(text)} />
}
`,

  prompt: `'use client'

import { PromptBox } from '@/components/detent/components/prompt/PromptBox'
import type { Message } from '@/components/detent/components/prompt/PromptBox'

export function Composer() {
  // Return a promise: the box shows it is working until it settles.
  const send = async (message: Message) => {
    await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ text: message.text, model: message.model }) })
  }
  return (
    <PromptBox
      placeholder="Ask anything"
      model="Claude Sonnet 4.5"
      suggestions={['Summarize the board update', 'What changed since Q2?']}
      onSend={send}
      onStop={() => console.log('stop')}
    />
  )
}
`,

  models: `'use client'

import { useState } from 'react'
import { ModelPicker } from '@/components/detent/components/models/ModelPicker'
import type { Model, ModelValue } from '@/components/detent/components/models/ModelPicker'

// time is seconds per answer, cost is dollars per answer, at the middle effort
const models: Model[] = [
  { id: 'flash', name: 'Flash', blurb: 'For simple asks', time: 1.4, cost: 0.002, reasons: false },
  { id: 'pro', name: 'Pro', blurb: 'The everyday default', time: 4, cost: 0.012 },
  { id: 'max', name: 'Max', blurb: 'For hard problems', time: 11, cost: 0.06 },
]

export function ChooseModel() {
  const [value, setValue] = useState<ModelValue>({ model: 'pro', effort: 1 })
  // Sits in the composer's bottom row, beside the send button.
  return <ModelPicker models={models} value={value} onChange={setValue} />
}
`,

  filter: `'use client'

import { AskFilter } from '@/components/detent/components/filter/AskFilter'
import type { Clause, Filter } from '@/components/detent/components/filter/AskFilter'

type Request = { service: string; browser: string; ms: number }

export function RequestFilter({ rows }: { rows: Request[] }) {
  // Your model reads the words into clauses: which words (at), which field, and the readings to choose from.
  const read = async (text: string, signal: AbortSignal): Promise<Clause[]> => {
    const res = await fetch('/api/filters', { method: 'POST', body: JSON.stringify({ text }), signal })
    return res.json()
  }
  const keep = (filters: Filter[]) => (r: Request) =>
    filters.every((f) => (f.field === 'browser' ? r.browser === f.value : f.field === 'service' ? r.service === f.value : true))
  return (
    <AskFilter
      label="Requests"
      read={read}
      count={(filters) => rows.filter(keep(filters)).length}
      total={rows.length}
      unit="requests"
      suggestions={['slow checkout requests from Safari since the deploy']}
      onFilters={(filters) => console.log(filters)}
    />
  )
}
`,

  dates: `'use client'

import { PeriodPicker } from '@/components/detent/components/dates/PeriodPicker'
import { add } from '@/components/detent/components/dates/parse'

export function ReportPeriod() {
  const today = new Date()
  return (
    <PeriodPicker
      today={today}
      initial={{ from: add(today, -6), to: today }}
      onApply={(range, compare) => console.log(range, compare)}
    />
  )
}
`,

  upload: `'use client'

import { Upload } from '@/components/detent/components/upload/Upload'

export function Attachments() {
  // Start the real upload here, with your storage.
  const send = (files: File[]) => files.forEach((file) => console.log(file.name, file.size))
  return <Upload accept="PNG, JPG, PDF or MP4" onFiles={send} />
}
`,

  extract: `'use client'

import { ExtractionReview } from '@/components/detent/components/extract/ExtractionReview'
import type { Field } from '@/components/detent/components/extract/ExtractionReview'

// What the model read. box is where it sits on the page: [left, top, width, height], as fractions of the page.
const fields: Field[] = [
  { id: 'vendor', label: 'Vendor', value: 'Northwind Supply Co.', box: [0.08, 0.06, 0.37, 0.035] },
  { id: 'total', label: 'Total', value: '$2,417.04', box: [0.73, 0.7, 0.19, 0.033] },
  {
    id: 'bank',
    label: 'Bank account',
    value: 'GB29 NWBK … 4471',
    box: [0.39, 0.88, 0.34, 0.023],
    state: 'risk',
    flag: 'Bank account changed',
    note: 'The last three were paid to …9012.',
    choices: [
      { label: 'Hold and call Northwind', primary: true, to: 'hold' },
      { label: 'New details are right', to: 'ok' },
    ],
  },
]

export function InvoiceReview({ imageUrl }: { imageUrl: string }) {
  return (
    <ExtractionReview
      label="Invoice · from billing@northwind.co"
      title={['Northwind, $2,417.04', 'due Nov 13.']}
      page={{ node: <img src={imageUrl} alt="The invoice" className="size-full object-contain" />, width: 340, height: 440 }}
      fields={fields}
      onApprove={() => console.log('save')}
      onReject={() => console.log('reject')}
    />
  )
}
`,

  voicenote: `'use client'

import { VoiceNote } from '@/components/detent/components/voicenote/VoiceNote'
import type { SpokenWord } from '@/components/detent/components/voicenote/VoiceNote'

// Each word with the second it is said, from your speech-to-text.
const words: SpokenWord[] = [
  { word: 'Your', at: 0.25 },
  { word: 'refund', at: 0.6 },
  { word: 'went', at: 1.05 },
  { word: 'out', at: 1.35 },
  { word: 'this', at: 1.65 },
  { word: 'morning.', at: 1.95 },
]

export function ReplyNote({ audioUrl }: { audioUrl: string }) {
  return <VoiceNote src={audioUrl} words={words} duration={3} />
}
`,
  rewind: `'use client'

import { useState } from 'react'
import { Rewind } from '@/components/detent/components/rewind/Rewind'
import type { RewindHistory } from '@/components/detent/components/rewind/Rewind'

export function NoteEditor({ saved }: { saved?: RewindHistory }) {
  const [text, setText] = useState('')
  // Store the tape with the note (for example as JSON) so rewinding survives a reload.
  const save = (history: RewindHistory) => console.log(history)
  return (
    <div className="w-full max-w-[640px] text-[20px] font-medium leading-[1.4]">
      <Rewind value={text} onChange={setText} history={saved} onHistory={save} rows={6} maxHeight={330} placeholder="Write a note" label="Note" />
    </div>
  )
}
`,

  livelist: `'use client'

import { useState } from 'react'
import { LiveList } from '@/components/detent/components/livelist/LiveList'
import type { LiveGroup, LiveItem, LivePerson } from '@/components/detent/components/livelist/LiveList'

// hue is 0 to 360: each person's and group's colour
const people: LivePerson[] = [
  { id: 'you', name: 'You', hue: 250 },
  { id: 'maya', name: 'Maya Chen', hue: 150 },
]
const groups: LiveGroup[] = [
  { id: 'build', label: 'Build', hue: 240 },
  { id: 'launch', label: 'Launch', hue: 50 },
]

export function LaunchList({ initial }: { initial: LiveItem[] }) {
  // Keep the items in your realtime store (Liveblocks, a websocket, a database) and pass every change through it.
  const [items, setItems] = useState(initial)
  return <LiveList title="Launch week" people={people} groups={groups} me="you" items={items} onItemsChange={setItems} height={360} />
}
`,

  mcp: `'use client'

import { useState } from 'react'
import { McpInstall } from '@/components/detent/components/mcp/McpInstall'
import type { McpClient, McpStatus } from '@/components/detent/components/mcp/McpInstall'

// Use each editor's real logo as the icon (simple-icons has most of them).
const clients: McpClient[] = [
  { id: 'cursor', label: 'Cursor', icon: <span>C</span> },
  { id: 'claude-code', label: 'Claude Code', tint: '#D97757', icon: <span>✳</span> },
  { id: 'windsurf', label: 'Windsurf', tint: '#14b8a6', icon: <span>W</span> },
]

export function ConnectPage() {
  // Drive status from your server: 'waiting' after a copy, 'connected' once the editor first calls in.
  const [status, setStatus] = useState<McpStatus>('idle')
  return (
    <div className="w-[460px] max-w-full">
      <McpInstall
        name="Northwind"
        slug="northwind"
        url="https://mcp.northwind.dev/mcp"
        description="Your Northwind projects, deploys and logs"
        icon={<img src="/logo.svg" alt="" />}
        clients={clients}
        tools={10}
        status={status}
        onCopy={() => setStatus('waiting')}
      />
    </div>
  )
}
`,

  trace: `'use client'

import { RunTrace } from '@/components/detent/components/trace/RunTrace'
import type { RunStatus, Span } from '@/components/detent/components/trace/RunTrace'

// Times are performance.now() values in ms. say is the plain sentence people read; name is for engineers.
const started = 0
const spans: Span[] = [
  { id: 'plan', name: 'plan', kind: 'model', depth: 0, say: 'Planned the refund', segments: [{ start: 0, end: 900, status: 'ok' }] },
  { id: 'lookup', name: 'lookupOrder', kind: 'tool', depth: 1, say: 'Found order #4821', segments: [{ start: 900, end: 1400, status: 'ok' }] },
  { id: 'refund', name: 'refund', kind: 'tool', depth: 1, say: 'Refund $86.40 to the Visa ending 4021', segments: [{ start: 1400, status: 'waiting' }] },
]

export function AgentRun({ status = 'waiting' }: { status?: RunStatus }) {
  return (
    <RunTrace
      title="Refund order #4821"
      runId="run_8f2a"
      spans={spans}
      startedAt={started}
      status={status}
      onApprove={(id) => console.log('approve', id)}
      onDeny={(id) => console.log('deny', id)}
    />
  )
}
`,

  find: `'use client'

import { LitFind } from '@/components/detent/components/find/LitFind'

export function Article({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  // Wrap the readable part of the page. ⌘F inside it opens the find.
  return (
    <div className="mx-auto max-w-[560px]">
      <LitFind shortcut placeholder="Find in article">
        <h1 className="mb-6 text-[32px] font-semibold tracking-[-.03em]">{title}</h1>
        {paragraphs.map((p, i) => (
          <p key={i} className="mb-5 text-[18px] leading-[1.55]">
            {p}
          </p>
        ))}
      </LitFind>
    </div>
  )
}
`,
}
