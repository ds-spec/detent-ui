'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from 'motion/react'
import { ArrowUp, CaretRight, Plus, WarningCircle } from '@phosphor-icons/react'
import { Calendar as CalendarIcon } from '@/lab/icons'
import { IRIS } from '@/lab/lib/iris'

export type CalPerson = { name: string; photo?: string; tint: string; online?: boolean }
export type CalEvent = { id: string; day: number; start: number; dur: number; title: string; with?: string; where?: string }
type Draft = { title: string; day: number; start: number; dur: number; with?: string }

const ease = [0.2, 0.9, 0.25, 1] as const
const NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const KEYS: [RegExp, number][] = [
  [/\bmon(day)?\b/, 0],
  [/\btue(s|sday)?\b/, 1],
  [/\bwed(nesday)?\b/, 2],
  [/\bthu(r|rs|rsday)?\b/, 3],
  [/\bfri(day)?\b/, 4],
  [/\bsat(urday)?\b/, 5],
  [/\bsun(day)?\b/, 6],
]
const FOCUS = 'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]'


const clock = (m: number) => {
  const h = Math.floor(m / 60)
  const mm = m % 60
  const h12 = h % 12 || 12
  return `${h12}${mm ? `:${String(mm).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`
}
const length = (d: number) => (d < 60 ? `${d} min` : d % 60 ? `${Math.floor(d / 60)} h ${d % 60} min` : `${d / 60} h`)

function parse(raw: string, today: number, people: Record<string, CalPerson>): Draft | null {
  const s = ` ${raw.toLowerCase()} `
  let rest = s
  let day = -1
  if (/\btoday\b/.test(s)) {
    day = today
    rest = rest.replace(/\btoday\b/, ' ')
  } else if (/\b(tomorrow|tmrw|tmr)\b/.test(s)) {
    day = Math.min(6, today + 1)
    rest = rest.replace(/\b(tomorrow|tmrw|tmr)\b/, ' ')
  } else {
    for (const [re, d] of KEYS) {
      if (re.test(s)) {
        day = d
        rest = rest.replace(re, ' ')
        break
      }
    }
  }
  let start = -1
  const t = s.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/) ?? s.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\b/)
  if (t && (Number(t[1]) > (t[3] ? 12 : 23) || Number(t[1]) < (t[3] ? 1 : 0) || Number(t[2] ?? 0) > 59)) return null
  if (t) {
    let h = Number(t[1]) % 12
    if (t[3] === 'pm' || (!t[3] && h < 8)) h += 12
    start = h * 60 + Number(t[2] ?? 0)
    rest = rest.replace(t[0], ' ')
  } else if (/\bnoon\b/.test(s)) {
    start = 720
    rest = rest.replace(/\bnoon\b/, ' ')
  } else if (/\bmorning\b/.test(s)) {
    start = 540
    rest = rest.replace(/\b(in the )?morning\b/, ' ')
  } else if (/\bevening\b/.test(s)) {
    start = 1080
    rest = rest.replace(/\b(in the )?evening\b/, ' ')
  }
  let dur = 30
  const d = s.match(/\bfor\s+(\d+)\s*(m|min|mins|minutes|h|hr|hrs|hour|hours)\b/)
  if (d) {
    dur = /^h/.test(d[2]) ? Number(d[1]) * 60 : Number(d[1])
    rest = rest.replace(d[0], ' ')
  }
  const who = Object.keys(people).find((k) => new RegExp(`\\b${k.toLowerCase()}\\b`).test(s))
  rest = rest.replace(/\b(on|at)\b/g, ' ').replace(/\s+/g, ' ').trim()
  if (day < 0 || start < 0 || rest.length < 2) return null
  const title = rest
    .split(' ')
    .map((w) => people[Object.keys(people).find((k) => k.toLowerCase() === w) ?? ''] ? w[0].toUpperCase() + w.slice(1) : w)
    .join(' ')
  return { title: title[0].toUpperCase() + title.slice(1), day, start, dur, with: who }
}

function Avatar({ p }: { p?: CalPerson }) {
  return (
    <span className="relative size-9 shrink-0">
      <span
        className="grid size-full place-items-center overflow-hidden rounded-full text-[13px] font-medium text-white"
        style={{ background: p ? `linear-gradient(150deg, color-mix(in oklab, ${p.tint} 70%, white), ${p.tint})` : 'var(--i-tray)' }}
      >
        {p?.photo ? <img src={p.photo} alt="" draggable={false} className="size-full object-cover" /> : p?.name[0]}
      </span>
      <span aria-hidden className="absolute inset-0 rounded-full shadow-[inset_0_0_0_0.5px_rgb(0_0_0/.12)]" />
      {p?.online !== undefined && <span aria-hidden className={`absolute -bottom-px -right-px size-2.5 rounded-full shadow-[0_0_0_2px_var(--i-sheet)] ${p.online ? 'bg-[#30c45a]' : 'bg-[#e98a7c]'}`} />}
    </span>
  )
}

function Title({ text }: { text: string }) {
  const cut = text.search(/\s(with|for|about)\s/i)
  if (cut < 8) return <>{text}</>
  return (
    <>
      {text.slice(0, cut)}
      <span className="font-normal text-[var(--i-t3)]">{text.slice(cut)}</span>
    </>
  )
}

export function AiCalendar({ month, dates, today, now, people, events: initial, onAdd }: { month: string; dates: number[]; today: number; now: number; people: Record<string, CalPerson>; events: CalEvent[]; onAdd?: (e: CalEvent) => void }) {
  const [events, setEvents] = useState(initial)
  const [picked, setPicked] = useState(today)
  const [text, setText] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [fresh, setFresh] = useState<string | null>(null)
  const [dir, setDir] = useState(0)
  const [typing, setTyping] = useState(false)
  const ids = useRef(0)
  const group = useId()
  const days = useRef<(HTMLButtonElement | null)[]>([])
  const scroller = useRef<HTMLDivElement>(null)

  const draft = useMemo(() => parse(text, today, people), [text, today, people])
  const shown = draft ? draft.day : picked
  const list = useMemo(() => {
    const rows: (CalEvent & { ghost?: boolean })[] = events.filter((e) => e.day === shown)
    if (draft) rows.push({ id: 'ghost', ...draft, ghost: true })
    return rows.sort((a, b) => a.start - b.start)
  }, [events, shown, draft])
  const clash = draft ? events.find((e) => e.day === draft.day && e.start < draft.start + draft.dur && draft.start < e.start + e.dur) : undefined
  const ghostAt = draft ? `${draft.day}-${draft.start}` : ''
  useEffect(() => {
    if (!ghostAt) return
    const t = window.setTimeout(() => {
      const box = scroller.current
      const g = box?.querySelector<HTMLElement>('[data-ghost]')
      if (!box || !g) return
      const top = g.offsetTop - 12
      const bottom = g.offsetTop + g.offsetHeight + 12 - box.clientHeight
      if (box.scrollTop > top) box.scrollTo({ top, behavior: 'smooth' })
      else if (box.scrollTop < bottom) box.scrollTo({ top: bottom, behavior: 'smooth' })
    }, 260)
    return () => window.clearTimeout(t)
  }, [ghostAt])
  const nowAt = shown === today ? list.findIndex((e) => e.start > now) : -2

  const pick = (d: number) => {
    setDir(d > shown ? 1 : -1)
    setPicked(d)
    setFresh(null)
    setOpen(null)
  }

  const commit = () => {
    if (!draft) return
    const e: CalEvent = { id: `new-${++ids.current}`, ...draft }
    setEvents((all) => [...all, e])
    setPicked(draft.day)
    setText('')
    setFresh(e.id)
    onAdd?.(e)
  }

  const nowLine = (
    <motion.li key="now" layout className="flex items-center gap-2 px-3 py-1" transition={{ type: 'spring', bounce: 0, duration: 0.34 }}>
      <span className="size-1.5 rounded-full bg-[var(--accent)]" />
      <span className="h-px flex-1 bg-[color-mix(in_oklab,var(--accent)_55%,transparent)]" />
      <span className="text-[11.5px] font-medium tabular-nums text-[var(--accent)]">Now · {clock(now)}</span>
    </motion.li>
  )

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup id={group}>
        <div style={IRIS} className="w-[400px] h-fit max-w-full self-start rounded-[26px] bg-[var(--i-tray)] p-1.5 shadow-[0_0_0_0.5px_var(--i-edge),0_28px_64px_-28px_var(--i-drop)]">
          <div className="px-2.5 pb-2.5 pt-2">
            <div className="flex h-8 items-center gap-2 px-1">
              <CalendarIcon size={15} strokeWidth={2} className="text-[var(--i-t2)]" />
              <span className="text-[13px] font-medium text-[var(--i-t1)]">{month}</span>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={shown} className="ml-auto text-[12px] text-[var(--i-t3)]" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18, ease }}>
                  {list.filter((e) => !('ghost' in e)).length || 'No'} {list.filter((e) => !('ghost' in e)).length === 1 ? 'event' : 'events'} · {shown === today ? 'Today' : NAMES[shown]}
                </motion.span>
              </AnimatePresence>
            </div>
            <div
              role="tablist"
              aria-label="Days"
              className="mt-1.5 grid grid-cols-7 gap-0.5"
              onKeyDown={(e) => {
                if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
                e.preventDefault()
                const n = Math.max(0, Math.min(6, picked + (e.key === 'ArrowRight' ? 1 : -1)))
                pick(n)
                days.current[n]?.focus()
              }}
            >
              {dates.map((date, i) => {
                const mine = events.filter((e) => e.day === i)
                const on = shown === i
                const isToday = i === today
                return (
                  <button
                    key={i}
                    ref={(el) => {
                      days.current[i] = el
                    }}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    tabIndex={on ? 0 : -1}
                    aria-label={`${NAMES[i]} ${month} ${date}, ${mine.length} ${mine.length === 1 ? 'event' : 'events'}`}
                    onClick={() => pick(i)}
                    className={`relative flex flex-col items-center gap-1 rounded-[14px] pb-2 pt-1.5 transition-transform duration-150 active:scale-[.94] ${FOCUS}`}
                  >
                    {on && <motion.span layoutId="day" className="absolute inset-0 rounded-[14px] bg-[var(--i-sheet)] shadow-[0_0_0_0.5px_var(--i-edge),0_1px_2px_var(--i-drop)]" transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }} />}
                    <span className={`relative text-[11px] font-medium ${isToday ? 'text-[var(--accent)]' : 'text-[var(--i-t3)]'}`}>{NAMES[i].slice(0, 3)}</span>
                    <span className={`relative text-[17px] leading-none tabular-nums ${isToday ? 'font-semibold text-[var(--accent)]' : i < today ? 'text-[var(--i-t3)]' : 'text-[var(--i-t1)]'}`}>{date}</span>
                    <span className="relative flex h-1 items-center gap-[3px]">
                      {mine.length > 0 && <span className={`size-1 rounded-full ${i < today ? 'bg-[var(--i-t3)]' : 'bg-[var(--i-t2)]'}`} />}
                      <AnimatePresence>
                        {draft?.day === i && <motion.span key="g" className="size-1 rounded-full bg-[var(--accent)]" initial={{ scale: 0 }} animate={{ scale: 1.25 }} exit={{ scale: 0 }} transition={{ type: 'spring', bounce: 0.5, duration: 0.35 }} />}
                      </AnimatePresence>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-[20px] bg-[var(--i-sheet)] shadow-[inset_0_1px_0_rgb(255_255_255/.04),0_0_0_0.5px_var(--i-edge),0_1px_2px_var(--i-drop)]">
            <div ref={scroller} className="relative h-[232px] overflow-y-auto overscroll-contain p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <AnimatePresence mode="popLayout" initial={false} custom={dir}>
                <motion.ul
                  key={shown}
                  initial={{ opacity: 0, x: dir * 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir * -14, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.22, ease }}
                  className="flex flex-col"
                >
                  <AnimatePresence initial={false}>
                    {list.flatMap((e, idx) => {
                      const p = e.with ? people[e.with] : undefined
                      const ghost = 'ghost' in e && e.ghost
                      const isOpen = open === e.id
                      const row = (
                        <motion.li
                          key={e.id === 'ghost' ? 'ghost' : e.id}
                          layout
                          data-ghost={ghost || undefined}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
                          transition={{ type: 'spring', bounce: 0, duration: 0.34 }}
                          className={`rounded-[14px] ${ghost ? 'outline-dashed outline-1 -outline-offset-1 outline-[color-mix(in_oklab,var(--accent)_55%,transparent)]' : e.id === fresh ? 'bg-[color-mix(in_oklab,var(--accent)_7%,transparent)]' : ''}`}
                        >
                          <button
                            type="button"
                            disabled={ghost}
                            aria-expanded={isOpen}
                            onClick={() => setOpen(isOpen ? null : e.id)}
                            className={`flex w-full items-center gap-3 rounded-[14px] px-2.5 py-2.5 text-left transition-colors duration-150 ${ghost ? '' : 'hover:bg-[var(--i-hover)]'} ${FOCUS}`}
                          >
                            <Avatar p={p} />
                            <span className="min-w-0 flex-1 leading-tight">
                              <span className="block truncate text-[13.5px] font-medium text-[var(--i-t1)]">
                                <Title text={e.title} />
                              </span>
                              <span className="mt-1 block truncate text-[12px] text-[var(--i-t3)]">
                                {clock(e.start)} · {p ? p.name : 'Just you'} · {length(e.dur)}
                              </span>
                              {ghost && clash && (
                                <span className="mt-1 flex items-center gap-1 text-[12px] text-[#c27a12]">
                                  <WarningCircle aria-hidden size={12} weight="fill" />
                                  Overlaps {clash.title}
                                </span>
                              )}
                            </span>
                            {!ghost && (
                              <motion.span initial={false} animate={{ rotate: isOpen ? 90 : 0 }} transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }} className="grid text-[var(--i-t3)]">
                                <CaretRight aria-hidden size={13} weight="bold" />
                              </motion.span>
                            )}
                          </button>
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24, ease }} className="overflow-hidden">
                                <div className="mx-2.5 mb-2.5 rounded-[12px] bg-[var(--i-tray)] p-1">
                                  <p className="flex h-7 items-center justify-between px-2 text-[12px] text-[var(--i-t2)]">
                                    {clock(e.start)} – {clock(e.start + e.dur)}
                                    <span className="text-[var(--i-t3)]">{length(e.dur)}</span>
                                  </p>
                                  {e.where && <p className="rounded-[9px] bg-[var(--i-sheet)] px-2.5 py-2 text-[12.5px] text-[var(--i-t1)] shadow-[0_0_0_0.5px_var(--i-edge)]">{e.where}</p>}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.li>
                      )
                      return idx === nowAt ? [nowLine, row] : [row]
                    })}
                    {nowAt === -1 && list.length > 0 && nowLine}
                  </AnimatePresence>
                  {list.length === 0 && (
                    <motion.li initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-[216px] flex-col items-center justify-center text-center">
                      <span className="text-[13px] font-medium text-[var(--i-t1)]">Nothing on {shown === today ? 'today' : NAMES[shown]}</span>
                      <span className="mt-1 text-[12px] text-[var(--i-t3)]">Type below to plan something</span>
                    </motion.li>
                  )}
                </motion.ul>
              </AnimatePresence>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              commit()
            }}
            className="flex h-12 items-center gap-2.5 pl-3 pr-1"
          >
            <Plus aria-hidden size={15} className="shrink-0 text-[var(--i-t3)]" />
            <input
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setFresh(null)
              }}
              onFocus={() => setTyping(true)}
              onBlur={() => setTyping(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setText('')
              }}
              placeholder={typing ? 'e.g. Lunch with Ana thursday at 1' : 'Add to your week…'}
              aria-label="Add an event in your own words"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--i-t1)] outline-none placeholder:text-[var(--i-t3)] pointer-coarse:text-[16px]"
            />
            <motion.button
              type="submit"
              disabled={!draft}
              aria-label={draft ? `Add to ${NAMES[draft.day]}` : 'Add'}
              title={draft ? `Add to ${NAMES[draft.day]} (Enter)` : 'Add'}
              initial={false}
              animate={{ opacity: draft ? 1 : 0.28, scale: draft ? 1 : 0.9 }}
              transition={{ duration: 0.16, ease }}
              className={`grid size-8 shrink-0 place-items-center rounded-full bg-[var(--i-ink)] text-[var(--i-ink-on)] ${FOCUS}`}
            >
              <ArrowUp aria-hidden size={14} weight="bold" />
            </motion.button>
          </form>
        </div>
      </LayoutGroup>
    </MotionConfig>
  )
}
