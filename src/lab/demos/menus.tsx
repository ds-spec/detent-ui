'use client'

import { useEffect, useRef, useState } from 'react'
import { Select } from '../components/select/Select'
import type { Option, SelectHandle } from '../components/select/Select'
import { InlineRename } from '../components/rename/InlineRename'
import type { RenameHandle } from '../components/rename/InlineRename'
import { Avatar } from '../ui/Avatar'
import { FileGlyph } from '../ui/FileGlyph'
import { useBench } from './bench'

/* ───────────────────────────── Select ───────────────────────────── */

function StatusIcon({ kind }: { kind: 'backlog' | 'todo' | 'doing' | 'review' | 'done' }) {
  const c = { backlog: 'var(--ink-3)', todo: 'var(--ink-3)', doing: 'var(--warn)', review: '#7c66ff', done: 'var(--ok)' }[kind]
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      {kind === 'done' ? (
        <>
          <circle cx="7" cy="7" r="6.5" fill={c} />
          <path d="m4.4 7.2 1.8 1.8 3.4-3.6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <circle cx="7" cy="7" r="5.75" stroke={c} strokeWidth="1.5" strokeDasharray={kind === 'backlog' ? '2.2 2' : undefined} />
          {kind === 'doing' && <path d="M7 3.5a3.5 3.5 0 0 1 0 7z" fill={c} />}
          {kind === 'review' && <path d="M7 3.5a3.5 3.5 0 1 1-3.5 3.5H7z" fill={c} />}
        </>
      )}
    </svg>
  )
}

function Bars({ level }: { level: 0 | 1 | 2 | 3 }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={1.5 + i * 4} y={9 - i * 3} width="3" height={3.5 + i * 3} rx="1" fill="currentColor" opacity={i < level ? 1 : 0.25} />
      ))}
    </svg>
  )
}


const STATUS: Option[] = [
  { value: 'backlog', label: 'Backlog', icon: <StatusIcon kind="backlog" /> },
  { value: 'todo', label: 'Todo', icon: <StatusIcon kind="todo" /> },
  { value: 'doing', label: 'In progress', icon: <StatusIcon kind="doing" /> },
  { value: 'review', label: 'In review', icon: <StatusIcon kind="review" /> },
  { value: 'done', label: 'Done', icon: <StatusIcon kind="done" /> },
]
const PRIORITY: Option[] = [
  { value: 'none', label: 'No priority', icon: <Bars level={0} /> },
  { value: 'low', label: 'Low', icon: <Bars level={1} />, hint: '3' },
  { value: 'medium', label: 'Medium', icon: <Bars level={2} />, hint: '2' },
  { value: 'high', label: 'High', icon: <Bars level={3} />, hint: '1' },
]
const PEOPLE: Option[] = [
  { value: 'maya', label: 'Maya Chen', icon: <Avatar name="Maya Chen" hue={25} size={18} /> },
  { value: 'jonas', label: 'Jonas Weber', icon: <Avatar name="Jonas Weber" hue={250} size={18} /> },
  { value: 'aiko', label: 'Aiko Tanaka', icon: <Avatar name="Aiko Tanaka" hue={150} size={18} /> },
  { value: 'sam', label: 'Sam Ortiz', icon: <Avatar name="Sam Ortiz" hue={70} size={18} />, disabled: true, hint: 'Away' },
]

/** Triages the issue on its own: moves it to review, raises the priority, assigns it. Hovering pauses; touching hands it over. */
export function SelectDemo() {
  const b = useBench()
  const [status, setStatus] = useState('doing')
  const [priority, setPriority] = useState('medium')
  const [owner, setOwner] = useState<string | null>(null)
  const s1 = useRef<SelectHandle>(null)
  const s2 = useRef<SelectHandle>(null)
  const s3 = useRef<SelectHandle>(null)
  const held = useRef(false)
  const touched = useRef(false)

  useEffect(() => {
    let live = true
    const tick = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await tick(100)
    }
    const walk = async (h: SelectHandle | null, from: number, to: number) => {
      h?.open()
      await beat(700)
      for (let i = from; i !== to; i += to > from ? 1 : -1) {
        h?.point(i + (to > from ? 1 : -1))
        await beat(260)
      }
      await beat(380)
      h?.choose(to)
    }
    const play = async () => {
      for (;;) {
        await beat(1600)
        await walk(s1.current, 2, 3)
        await beat(1300)
        await walk(s2.current, 2, 3)
        await beat(1300)
        await walk(s3.current, 0, 1)
        await beat(3000)
        setStatus('doing')
        setPriority('medium')
        setOwner(null)
        await beat(500)
      }
    }
    play().catch(() => {})
    return () => {
      live = false
    }
  }, [])

  return (
    <div className="w-[360px] rounded-[22px] bg-surface p-5 shadow-float" onPointerEnter={() => (held.current = true)} onPointerLeave={() => (held.current = false)} onPointerDownCapture={() => (touched.current = true)} onKeyDownCapture={() => (touched.current = true)}>
      <p className="tnum text-footnote text-ink-3">NW-142</p>
      <h3 className="mt-1 text-headline text-ink">Tighten the onboarding empty states</h3>
      <div className="mt-5 grid grid-cols-[84px_1fr] items-center gap-y-2.5">
        <span className="text-footnote text-ink-3">Status</span>
        <div>
          <Select ref={s1} label={b.get('label', 'Status')} value={status} onChange={b.on('onChange', setStatus)} options={STATUS} />
        </div>
        <span className="text-footnote text-ink-3">Priority</span>
        <div>
          <Select ref={s2} label="Priority" value={priority} onChange={b.on('onChange', setPriority)} options={PRIORITY} />
        </div>
        <span className="text-footnote text-ink-3">Assignee</span>
        <div>
          <Select ref={s3} label="Assignee" value={owner} onChange={b.on('onChange', setOwner)} options={PEOPLE} placeholder={b.get('placeholder', 'Unassigned')} />
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────────── Inline rename ───────────────────────────── */

const TITLE = 'Q3 board update'
const DOCS = [
  { id: 'a', name: 'Board deck.pdf', meta: '1.1 MB · Edited 2h ago' },
  { id: 'b', name: 'Roadmap.fig', meta: '6.2 MB · Edited yesterday' },
  { id: 'c', name: 'hero-shot.png', meta: '2.4 MB · Edited Monday', preview: 'linear-gradient(180deg, #c7d3e6 0%, #e9ddcc 54%, #8e9c7c 55%, #6a7a5c 100%)' },
]
const save = () => new Promise((r) => setTimeout(r, 700))

/** Renames on its own: a file (the extension stays put), a name that's refused and fixed, then the title. Hovering pauses; touching hands it over. */
export function RenameDemo() {
  const b = useBench()
  const [title, setTitle] = useState(TITLE)
  const [files, setFiles] = useState(DOCS)
  const head = useRef<RenameHandle>(null)
  const rows = useRef<Record<string, RenameHandle | null>>({})
  const held = useRef(false)
  const touched = useRef(false)

  useEffect(() => {
    let live = true
    const tick = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await tick(100)
    }
    const write = async (h: RenameHandle | null | undefined, text: string) => {
      for (let i = 1; i <= text.length; i++) {
        h?.type(text.slice(0, i))
        await beat(text[i - 1] === ' ' ? 80 : 45 + Math.random() * 50)
      }
    }
    const play = async () => {
      for (;;) {
        await beat(1500)
        rows.current.b?.edit()
        await beat(1100)
        await write(rows.current.b, 'Q4 roadmap')
        await beat(450)
        rows.current.b?.commit()
        await beat(2200)
        rows.current.c?.edit()
        await beat(900)
        await write(rows.current.c, 'Q3/cover')
        await beat(400)
        rows.current.c?.commit()
        await beat(1700)
        await write(rows.current.c, 'Q3 cover')
        await beat(400)
        rows.current.c?.commit()
        await beat(2200)
        head.current?.edit()
        await beat(900)
        await write(head.current, 'Q3 board update, final')
        await beat(450)
        head.current?.commit()
        await beat(3000)
        setTitle(TITLE)
        setFiles(DOCS)
        await beat(600)
      }
    }
    play().catch(() => {})
    return () => {
      live = false
    }
  }, [])

  return (
    <div className="w-[400px]" onPointerEnter={() => (held.current = true)} onPointerLeave={() => (held.current = false)} onPointerDownCapture={() => (touched.current = true)} onKeyDownCapture={() => (touched.current = true)}>
      <p className="text-footnote text-ink-3">Northwind / Docs</p>
      <h2 className="mt-1.5 text-large text-ink">
        <InlineRename ref={head} label={b.get('label', 'Title')} value={title} activate={b.get('activate', 'click')} onRename={b.on('onRename', (v: string) => save().then(() => setTitle(v)))} />
      </h2>

      <div className="mt-6 rounded-[22px] bg-surface p-1.5 shadow-float">
        {files.map((f, i) => (
          <div key={f.id} className="flex h-[60px] items-center gap-3 px-3" style={{ boxShadow: i ? 'inset 0 1px 0 var(--line)' : undefined }}>
            <FileGlyph name={f.name} preview={f.preview} size={34} />
            <div className="min-w-0 flex-1">
              <div className="flex text-callout font-medium leading-5 text-ink">
                <InlineRename
                  ref={(h) => {
                    rows.current[f.id] = h
                  }}
                  label="File name"
                  value={f.name}
                  keepExtension
                  activate="double-click"
                  validate={(next) =>
                    next.includes('/') ? 'Names can’t contain “/”' : files.some((x) => x.id !== f.id && x.name.toLowerCase() === next.toLowerCase()) ? 'There’s already a file with that name' : null
                  }
                  onRename={b.on('onRename', (next: string) => save().then(() => setFiles((l) => l.map((x) => (x.id === f.id ? { ...x, name: next } : x)))))}
                />
              </div>
              <p className="text-footnote text-ink-3">{f.meta}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
