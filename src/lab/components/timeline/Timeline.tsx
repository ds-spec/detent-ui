'use client'

import { Fragment, useEffect, useId, useImperativeHandle, useRef, useState } from 'react'
import type { ReactNode, Ref } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowUp, Bubble, Check, ChevronRight, Code, Fork, Ship } from '@/lab/icons'
import { tap } from '@/lab/lib/feel'
import { spring } from '@/lab/lib/motion'

/*
 * What happened, newest first. Events are grouped by day under headers that stay put while you
 * scroll. A run of the same thing by the same person folds into one line, “Jonas pushed 4
 * commits”, that opens in place. Filters narrow it to conversation or to changes, and events
 * fold away rather than vanish.
 *
 * It stays live: new events slide in at the top. If you've scrolled down to read, nothing moves
 * under you; a small “3 new” waits at the top instead, and takes you there.
 */

/** Someone on the timeline: their initials on their hue, or an avatar of your own, 26px round. */
export type Person = { name: string; hue: number; avatar?: ReactNode }
export type Event =
  | { id: string; at: number; who: Person; kind: 'comment'; text: string }
  | { id: string; at: number; who: Person; kind: 'status'; from: string; to: string }
  | { id: string; at: number; who: Person; kind: 'commit'; hash: string; message: string }
  | { id: string; at: number; who: Person; kind: 'review'; verdict: 'approved' | 'changes' }
  | { id: string; at: number; who: Person; kind: 'deploy'; env: string }
export type Filter = 'all' | 'talk' | 'changes'
export type TimelineHandle = { push(e: Event): void; filter(f: Filter): void; open(runId: string | null): void; scroll(y: number): void; catchUp(): void }

const TALK = new Set(['comment', 'review'])
const MIN_RUN = 3

const day = (t: number, now: number) => {
  const d = new Date(t)
  const n = new Date(now)
  const diff = Math.round((new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 864e5)
  return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}
const ago = (t: number, now: number) => {
  const s = Math.max(0, Math.round((now - t) / 1000))
  if (s < 45) return 'now'
  if (s < 3600) return `${Math.round(s / 60)}m`
  if (s < 86400) return `${Math.round(s / 3600)}h`
  return new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
const initials = (n: string) =>
  n
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)

/** Events folded into runs: three or more of the same thing, in a row, by the same person. */
type Item = { kind: 'one'; e: Event } | { kind: 'run'; id: string; events: Event[] }
function fold(events: Event[]): Item[] {
  const out: Item[] = []
  for (let i = 0; i < events.length; ) {
    let j = i + 1
    while (j < events.length && events[j].kind === events[i].kind && events[j].who.name === events[i].who.name && events[i].kind !== 'comment') j++
    if (j - i >= MIN_RUN) out.push({ kind: 'run', id: `run-${events[i].id}`, events: events.slice(i, j) })
    else for (let k = i; k < j; k++) out.push({ kind: 'one', e: events[k] })
    i = j
  }
  return out
}

export function Timeline({ events: initial, now: start, height = 440, ref }: { events: Event[]; /** The time it counts “ago” from; it moves on by itself. */ now?: number; height?: number; ref?: Ref<TimelineHandle> }) {
  const [events, setEvents] = useState(initial)
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<string[]>([])
  const [waiting, setWaiting] = useState<Event[]>([])
  const [now, setNow] = useState(start ?? 0)
  const [fresh, setFresh] = useState<string[]>([])
  const box = useRef<HTMLDivElement>(null)
  const plate = useId()
  const reduce = useReducedMotion()

  // Times stay true: “now” moves on every half minute.
  useEffect(() => {
    const t = setInterval(() => setNow((n) => (start ? n + 30_000 : Date.now())), 30_000)
    return () => clearInterval(t)
  }, [start])

  /** A new event: in at the top if the top is in view; otherwise it waits behind a pill, so nothing moves under the reader. */
  const push = (e: Event) => {
    if ((box.current?.scrollTop ?? 0) > 24) setWaiting((w) => [e, ...w])
    else land([e])
  }
  /** New events in at the top, lit for a moment so the eye finds them. */
  const land = (es: Event[]) => {
    setEvents((all) => [...es, ...all])
    setFresh((f) => [...f, ...es.map((e) => e.id)])
    setTimeout(() => setFresh((f) => f.filter((id) => !es.some((e) => e.id === id))), 2600)
  }
  const catchUp = () => {
    land(waiting)
    setWaiting([])
    box.current?.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  useImperativeHandle(ref, () => ({
    push,
    filter: setFilter,
    open: (id) => setOpen(id ? [id] : []),
    scroll: (y) => box.current?.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }),
    catchUp,
  }))

  const kept = events.filter((e) => filter === 'all' || (filter === 'talk') === TALK.has(e.kind))
  const days: { label: string; items: Item[] }[] = []
  for (const e of kept) {
    const label = day(e.at, now || e.at)
    const last = days[days.length - 1]
    if (last?.label === label) last.items.push({ kind: 'one', e })
    else days.push({ label, items: [{ kind: 'one', e }] })
  }
  days.forEach((d) => (d.items = fold(d.items.map((i) => (i as { e: Event }).e))))
  const counts = { all: events.length, talk: events.filter((e) => TALK.has(e.kind)).length, changes: events.filter((e) => !TALK.has(e.kind)).length }

  return (
    <div className="w-full">
      <div role="radiogroup" aria-label="Show" className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
        {(['all', 'talk', 'changes'] as Filter[]).map((f) => (
          <button key={f} type="button" role="radio" aria-checked={filter === f} onClick={() => (tap(), setFilter(f))} className="ring-focus relative flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-footnote">
            {filter === f && <motion.span layoutId={plate} className="absolute inset-0 rounded-full bg-surface-2" transition={reduce ? { duration: 0 } : spring.move} />}
            <span className={`relative ${filter === f ? 'font-medium text-ink' : 'text-ink-3 hover:text-ink-2'}`}>{f === 'all' ? 'Everything' : f === 'talk' ? 'Conversation' : 'Changes'}</span>
            <span className="relative min-w-[2ch] text-caption tabular-nums text-ink-3">{counts[f]}</span>
          </button>
        ))}
      </div>

      <div className="relative mt-3">
        {/* New events while you read further down: they wait here instead of pushing the page. */}
        <AnimatePresence>
          {waiting.length > 0 && (
            <motion.button
              key="new"
              type="button"
              onClick={() => (tap(), catchUp())}
              className="ring-focus absolute left-1/2 top-2 z-20 flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink pl-2.5 pr-3 text-caption font-medium text-surface shadow-float"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.12 } }}
              transition={spring.snappy}
            >
              <ArrowUp size={13} />
              <span className="tabular-nums">{waiting.length} new</span>
            </motion.button>
          )}
        </AnimatePresence>
        <div ref={box} className="relative overflow-y-auto overscroll-contain pr-1" style={{ height }}>
          {days.map((d) => (
            <section key={d.label} aria-label={d.label}>
              <p className="sticky top-0 z-10 bg-[linear-gradient(var(--surface)_70%,transparent)] pb-2 pt-1 text-caption font-medium text-ink-3">{d.label}</p>
              <ol className="relative">
                <span aria-hidden className="absolute bottom-3 left-[13px] top-3 w-px bg-[var(--line-strong)]" />
                <AnimatePresence initial={false}>
                  {d.items.map((it) => {
                    const id = it.kind === 'one' ? it.e.id : it.id
                    return (
                      <motion.li
                        key={id}
                        className="relative overflow-hidden"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={reduce ? { duration: 0 } : { height: spring.smooth, opacity: { duration: 0.2 } }}
                      >
                        {it.kind === 'one' ? (
                          <Row e={it.e} now={now} fresh={fresh.includes(it.e.id)} />
                        ) : (
                          <Run events={it.events} now={now} open={open.includes(it.id)} onToggle={() => setOpen((o) => (o.includes(it.id) ? o.filter((x) => x !== it.id) : [...o, it.id]))} />
                        )}
                      </motion.li>
                    )
                  })}
                </AnimatePresence>
              </ol>
            </section>
          ))}
          {!kept.length && <p className="pt-10 text-center text-footnote text-ink-3">Nothing here yet.</p>}
        </div>
      </div>
    </div>
  )
}

function Avatar({ p, size = 26 }: { p: Person; size?: number }) {
  if (p.avatar)
    return (
      <span className="relative z-[1] grid shrink-0 place-items-center rounded-full ring-[3px] ring-[var(--surface)]" style={{ width: size, height: size }}>
        {p.avatar}
      </span>
    )
  return (
    <span className="relative z-[1] grid shrink-0 place-items-center rounded-full font-semibold text-white ring-[3px] ring-[var(--surface)]" style={{ width: size, height: size, fontSize: size * 0.38, background: `oklch(0.62 0.12 ${p.hue})` }}>
      {initials(p.name)}
    </span>
  )
}

/** A small mark on the line for events that aren't someone talking. */
function Mark({ children, tone = 'var(--ink-3)' }: { children: ReactNode; tone?: string }) {
  return (
    <span className="relative z-[1] grid size-[26px] shrink-0 place-items-center rounded-full bg-surface-2 ring-[3px] ring-[var(--surface)]" style={{ color: tone }}>
      {children}
    </span>
  )
}

const Chip = ({ children, tone }: { children: ReactNode; tone: string }) => (
  <span className="chip inline-flex h-5 items-center rounded-full px-1.5 text-[11px] font-medium" style={{ ['--chip' as string]: tone, color: tone }}>
    {children}
  </span>
)

function Row({ e, now, fresh }: { e: Event; now: number; fresh: boolean }) {
  const when = (
    <time dateTime={new Date(e.at).toISOString()} title={new Date(e.at).toLocaleString('en-US')} className="ml-auto shrink-0 pl-3 text-caption tabular-nums text-ink-3">
      {ago(e.at, now || e.at)}
    </time>
  )
  const name = <span className="font-medium text-ink">{e.who.name}</span>
  return (
    <div className="relative flex gap-3 py-2">
      {fresh && <motion.span aria-hidden className="absolute inset-y-0 -left-2 -right-1 rounded-[10px] bg-[color-mix(in_oklch,var(--accent)_8%,transparent)]" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 2.4, ease: 'easeOut' }} />}
      {e.kind === 'comment' ? (
        <Avatar p={e.who} />
      ) : e.kind === 'review' ? (
        <Mark tone={e.verdict === 'approved' ? 'var(--ok)' : 'var(--warn-ink)'}>{e.verdict === 'approved' ? <Check size={13} strokeWidth={2.6} /> : <Bubble size={13} />}</Mark>
      ) : e.kind === 'commit' ? (
        <Mark>
          <Code size={13} />
        </Mark>
      ) : e.kind === 'deploy' ? (
        <Mark tone="var(--accent)">
          <Ship size={13} />
        </Mark>
      ) : (
        <Mark>
          <Fork size={13} />
        </Mark>
      )}
      <div className="relative min-w-0 flex-1 pt-[3px]">
        <p className="flex items-baseline text-footnote text-ink-2">
          <span className="min-w-0">
            {e.kind === 'comment' && <>{name} commented</>}
            {e.kind === 'status' && (
              <>
                {name} moved it from <Chip tone="var(--ink-3)">{e.from}</Chip> to <Chip tone="var(--accent)">{e.to}</Chip>
              </>
            )}
            {e.kind === 'commit' && (
              <>
                {name} pushed <span className="font-mono text-[12px] text-ink-3">{e.hash}</span> {e.message}
              </>
            )}
            {e.kind === 'review' && <>{name} {e.verdict === 'approved' ? 'approved these changes' : 'asked for changes'}</>}
            {e.kind === 'deploy' && (
              <>
                {name} deployed to <Chip tone="var(--accent)">{e.env}</Chip>
              </>
            )}
          </span>
          {when}
        </p>
        {e.kind === 'comment' && <p className="mt-1.5 rounded-[12px] bg-surface-2 px-3 py-2 text-footnote text-ink">{e.text}</p>}
      </div>
    </div>
  )
}

function Run({ events, now, open, onToggle }: { events: Event[]; now: number; open: boolean; onToggle: () => void }) {
  const reduce = useReducedMotion()
  const first = events[0]
  const what = first.kind === 'commit' ? `pushed ${events.length} commits` : first.kind === 'deploy' ? `deployed ${events.length} times` : first.kind === 'status' ? `changed the status ${events.length} times` : `left ${events.length} reviews`
  return (
    <div className="py-1">
      <button type="button" aria-expanded={open} onClick={() => (tap(), onToggle())} className="ring-focus group/run flex w-full items-center gap-3 rounded-[10px] py-1 text-left">
        <Mark>
          <Code size={13} />
        </Mark>
        <span className="flex min-w-0 flex-1 items-center gap-1.5 text-footnote text-ink-2">
          <span className="font-medium text-ink">{first.who.name}</span> {what}
          <motion.span className="text-ink-3" animate={{ rotate: open ? 90 : 0 }} transition={reduce ? { duration: 0 } : spring.snappy}>
            <ChevronRight size={13} />
          </motion.span>
        </span>
        <span className="shrink-0 text-caption tabular-nums text-ink-3">{ago(first.at, now || first.at)}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul key="run" className="overflow-hidden pl-[38px]" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={reduce ? { duration: 0 } : spring.smooth}>
            {events.map((e) => (
              <li key={e.id} className="flex items-baseline gap-2 py-1 text-footnote text-ink-2">
                {e.kind === 'commit' ? (
                  <Fragment>
                    <span className="font-mono text-[12px] text-ink-3">{e.hash}</span>
                    <span className="min-w-0 flex-1 truncate">{e.message}</span>
                  </Fragment>
                ) : (
                  <span className="flex-1">{e.kind}</span>
                )}
                <span className="shrink-0 text-caption tabular-nums text-ink-3">{ago(e.at, now || e.at)}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

