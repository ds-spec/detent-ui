'use client'

import { useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode, Ref } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, Check, Close } from '@/lab/icons'
import { stackTop, useSize, useStack } from '@/lab/lib/hooks'
import { ease, spring, dur, press } from '@/lab/lib/motion'
import { Button } from '@/lab/ui/Button'
import { Kbd } from '@/lab/ui/Kbd'
import { Morph } from '@/lab/ui/Morph'
import { RollingText } from '@/lab/ui/RollingText'
import { FileGlyph } from '@/lab/ui/FileGlyph'
import { Spinner } from '@/lab/ui/Spinner'

export type DiffLine = ['ctx' | 'add' | 'del', string]
/** A hunk starts at line `o` of the old file and line `n` of the new one. */
export type Hunk = { id: string; scope: string; o: number; n: number; lines: DiffLine[] }
export type Verdict = 'pending' | 'accepted' | 'rejected'
export type DiffView = 'unified' | 'split'
export type DiffHandle = { next(): void; prev(): void; accept(): void; reject(): void; toggleView(): void; apply(): void }

const RH = 20
const HEAD = 32

/**
 * Code changes proposed by an agent, reviewed hunk by hunk.
 *
 * Lines stream in as the agent writes them. Every row is placed from a small layout model
 * (a row index and a side), so switching between unified and split, or accepting a hunk,
 * is one spring from where each line is to where it belongs: removed lines slide across
 * to pair with their replacements, accepted hunks resolve into the final code. Nothing is
 * measured and nothing outside the body ever moves. Changed words inside a line are marked.
 *
 * It reads calm on purpose. The code is set in near-monochrome, so green and red mean only what
 * changed; each hunk sits on one hairline, and the hunk you're on is the only thing in the accent.
 * A verdict reads as a soft pill, as verdicts do across the library, and the header counts the
 * change as a fine ruler: a tick for each line added, then each line removed.
 */
export function DiffReview({
  title,
  file,
  hunks,
  shown,
  size = { w: 720, h: 600 },
  onApply,
  ref,
}: {
  /** What the change is, in the header. */
  title: string
  /** The file's path. */
  file: string
  /** The change, a hunk at a time: where it is, and its lines as context, added or removed. */
  hunks: Hunk[]
  /** Called with each hunk's verdict when a person applies the review. */
  onApply?: (verdicts: Record<string, Verdict>) => void
  /** The review's frame; it never changes while you work. */
  size?: { w: number; h: number }
  /** How many lines the agent has written so far, across all hunks. Leave out when complete. */
  shown?: number
  ref?: Ref<DiffHandle>
}) {
  const total = hunks.reduce((n, h) => n + h.lines.length, 0)
  const written = Math.min(shown ?? total, total)
  const ready = written >= total
  const [view, setView] = useState<DiffView>('unified')
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({})
  const [focus, setFocus] = useState(0)
  const [applied, setApplied] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  // Hunks spring to their height and are stacked by transform, so one growing never moves the rest in the layout.
  const stack = useRef<HTMLDivElement>(null)
  useStack(stack, 10)
  // The review takes the size it's given, or less when its container is narrower. Below 560px
  // there's no room for two columns of code, so it reads unified and the switch steps away.
  const { w: seen } = useSize(root)
  const width = seen || size.w
  const roomy = width >= 560
  const split = view === 'split' && roomy
  // The body's width inside its padding: where a split row's right half starts.
  const body = width - 24

  const verdict = (h: Hunk) => verdicts[h.id] ?? 'pending'
  const pending = hunks.filter((h) => verdict(h) === 'pending')
  const resolved = ready && !pending.length

  // Lines written so far, per hunk: whatever's left after the hunks before it.
  const visible = hunks.map((h, i) => Math.max(0, Math.min(h.lines.length, written - hunks.slice(0, i).reduce((t, x) => t + x.lines.length, 0))))
  const writing = ready ? -1 : visible.findIndex((n, i) => n < hunks[i].lines.length)

  // What the file gains and loses, leaving out anything rejected.
  let adds = 0
  let dels = 0
  hunks.forEach((h, i) => {
    if (verdict(h) === 'rejected') return
    h.lines.slice(0, visible[i]).forEach(([k]) => (k === 'add' ? adds++ : k === 'del' ? dels++ : 0))
  })

  const decide = (v: Verdict) => {
    if (!ready || applied) return
    const h = hunks[focus]
    if (!h || verdict(h) !== 'pending') return
    setVerdicts((m) => ({ ...m, [h.id]: v }))
    // Move on to the next hunk that still needs a look.
    const order = [...hunks.slice(focus + 1), ...hunks.slice(0, focus)]
    const nextUp = order.find((x) => x.id !== h.id && verdict(x) === 'pending')
    if (nextUp) setFocus(hunks.indexOf(nextUp))
  }
  const undo = (i = focus) => !applied && setVerdicts((m) => ({ ...m, [hunks[i].id]: 'pending' }))
  const all = (v: Verdict) => {
    if (!ready || applied) return
    setVerdicts((m) => Object.fromEntries(hunks.map((h) => [h.id, m[h.id] && m[h.id] !== 'pending' ? m[h.id] : v])))
  }
  const apply = () => {
    if (!resolved || applied) return
    setApplied(true)
    onApply?.(Object.fromEntries(hunks.map((h) => [h.id, verdict(h)])))
  }
  const move = (d: number) => setFocus((f) => Math.max(0, Math.min(hunks.length - 1, f + d)))
  const toggleView = () => setView((v) => (v === 'unified' ? 'split' : 'unified'))

  useImperativeHandle(ref, () => ({ next: () => move(1), prev: () => move(-1), accept: () => decide('accepted'), reject: () => decide('rejected'), toggleView, apply }))

  const onKey = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const run: Record<string, () => void> = { j: () => move(1), k: () => move(-1), a: () => decide('accepted'), r: () => decide('rejected'), u: () => undo(), s: toggleView, enter: apply }
    const f = run[e.key.toLowerCase()]
    if (f) {
      e.preventDefault()
      f()
    }
  }

  // Keep the focused hunk in view, inside the body only.
  useEffect(() => {
    const box = scroller.current
    const el = box?.querySelector<HTMLElement>(`[data-hunk="${focus}"]`)
    if (!box || !el || !ready || !stack.current) return
    const at = stack.current.offsetTop + stackTop(el)
    const top = at - 12
    const bottom = at + el.offsetHeight + 12
    if (top < box.scrollTop) box.scrollTo({ top, behavior: 'smooth' })
    else if (bottom > box.scrollTop + box.clientHeight) box.scrollTo({ top: Math.min(top, bottom - box.clientHeight), behavior: 'smooth' })
  }, [focus, ready, view])

  const status = !ready ? 'Writing changes' : applied ? `Applied to ${file.split('/').pop()}` : resolved ? `${hunks.filter((h) => verdict(h) === 'accepted').length} accepted · ${hunks.filter((h) => verdict(h) === 'rejected').length} rejected` : `${pending.length} of ${hunks.length} left to review`

  const kept = hunks.filter((h) => verdict(h) === 'accepted').length

  return (
    <div ref={root} tabIndex={0} onKeyDown={onKey} aria-label={`Review changes to ${file}`} className="@container ring-focus flex flex-col overflow-hidden rounded-card bg-surface shadow-float" style={{ width: size.w, maxWidth: '100%', height: size.h }}>
      <header className="flex h-14 shrink-0 items-center gap-3 pl-4 pr-3 shadow-[inset_0_-1px_0_var(--line)]">
        <FileGlyph name={file} size={30} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-callout font-medium text-ink">{title}</p>
          <p className="flex items-center gap-2.5 font-mono text-caption leading-4 text-ink-3">
            <span className="truncate">
              {file.slice(0, file.lastIndexOf('/') + 1)}
              <span className="text-ink-2">{file.split('/').pop()}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="flex gap-1.5 tabular-nums">
                <span className="flex" style={{ color: SIGN.add }}>
                  +<RollingText text={String(adds)} />
                </span>
                <span className="flex" style={{ color: SIGN.del }}>
                  −<RollingText text={String(dels)} />
                </span>
              </span>
              <Ticks adds={adds} dels={dels} />
            </span>
          </p>
        </div>
        {roomy && <Segmented value={view} onChange={setView} />}
      </header>

      <div ref={scroller} className="relative min-h-0 flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: 'none', maskImage: 'linear-gradient(to bottom, transparent, #000 10px, #000 calc(100% - 10px), transparent)' }}>
        <div ref={stack} className="relative flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {hunks.map(
              (h, i) =>
                visible[i] > 0 && (
                  <HunkView
                    key={h.id}
                    index={i}
                    h={h}
                    shown={visible[i]}
                    verdict={verdict(h)}
                    split={split}
                    body={body}
                    focused={ready && focus === i && !applied}
                    writing={writing === i}
                    canDecide={ready && !applied}
                    onPick={() => {
                      setFocus(i)
                      root.current?.focus({ preventScroll: true })
                    }}
                    onDecide={(v) => {
                      setFocus(i)
                      if (v === 'pending') undo(i)
                      else if (verdict(h) === 'pending') setVerdicts((m) => ({ ...m, [h.id]: v }))
                    }}
                  />
                ),
            )}
            {/* Where the change ends, so the file doesn't just stop. */}
            {ready && (
              <motion.p key="end" className="flex h-8 items-center justify-center gap-2 text-caption text-ink-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.2, ease: ease.out }}>
                <span className="h-px w-6 bg-[var(--line)]" />
                No other changes in {file.split('/').pop()}
                <span className="h-px w-6 bg-[var(--line)]" />
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <footer className="flex h-14 shrink-0 items-center gap-3 pl-4 pr-3 shadow-[inset_0_1px_0_var(--line)]">
        {/* One segment a hunk: green kept, red turned down, grey still to look at, blue where you are. */}
        <span className="flex shrink-0 items-center gap-[3px] @max-[420px]:hidden" aria-hidden>
          {hunks.map((h, i) => {
            const v = verdict(h)
            const here = ready && focus === i && !applied
            return (
              <motion.span
                key={h.id}
                className="block h-[3px] w-4 rounded-full"
                initial={false}
                animate={{
                  backgroundColor: here ? 'var(--accent)' : v === 'accepted' ? 'var(--ok)' : v === 'rejected' ? 'var(--danger)' : i < (writing < 0 ? hunks.length : writing + 1) ? 'color-mix(in oklch, var(--ink) 28%, transparent)' : 'color-mix(in oklch, var(--ink) 10%, transparent)',
                  scaleY: here ? 1.6 : 1,
                }}
                transition={spring.smooth}
              />
            )
          })}
        </span>
        <span className="relative h-5 min-w-0 flex-1">
          <AnimatePresence initial={false}>
            <motion.span key={status} className="absolute inset-0 flex items-center gap-2 truncate text-footnote text-ink-3" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: ease.out }}>
              {!ready && <Spinner size={12} className="text-ink-3" />}
              {applied && <Check size={14} strokeWidth={2.6} className="text-ok" />}
              <Status text={status} />
            </motion.span>
          </AnimatePresence>
        </span>
        <Morph
          view={applied ? 'applied' : resolved ? 'apply' : 'review'}
          justify="end"
          radius={10}
          views={{
            review: (
              <span className="flex gap-1.5">
                <Button size="sm" variant="ghost" disabled={!ready} onClick={() => all('rejected')}>
                  Reject<span className="@max-[420px]:hidden"> all</span>
                </Button>
                <Button size="sm" variant="primary" disabled={!ready} onClick={() => all('accepted')}>
                  Accept<span className="@max-[420px]:hidden"> all</span>
                </Button>
              </span>
            ),
            apply: (
              <Button size="sm" variant="primary" onClick={apply}>
                {kept ? `Apply ${kept} ${kept === 1 ? 'change' : 'changes'}` : 'Discard all'}
                <Kbd onInk>↵</Kbd>
              </Button>
            ),
            applied: (
              <Button size="sm" variant="secondary">
                Open<span className="@max-[420px]:hidden"> {file.split('/').pop()}</span>
                <ArrowUpRight size={13} className="text-ink-3" />
              </Button>
            ),
          }}
        />
      </footer>
    </div>
  )
}

/* ───────────────────────────── Hunks and rows ───────────────────────────── */

type Num = { k: DiffLine[0]; text: string; o: number; n: number; i: number }
type Row = { l: Num; num: number; y: number; side: 'full' | 'left' | 'right'; tone: 'ctx' | 'add' | 'del'; gone: boolean; hl?: [number, number] }
type Fill = { key: string; y: number; side: 'left' | 'right' }

const TOKEN = /\s+|\w+|'[^']*'?|[^\w\s]/g
const lex = (s: string) => s.match(TOKEN) ?? []

/** The words that changed between a removed line and its replacement, as token ranges. Very different lines get no marks. */
function changed(a: string, b: string): [[number, number], [number, number]] | null {
  const x = lex(a)
  const y = lex(b)
  let p = 0
  while (p < x.length && p < y.length && x[p] === y[p]) p++
  let s = 0
  while (s < x.length - p && s < y.length - p && x[x.length - 1 - s] === y[y.length - 1 - s]) s++
  const ink = (t: string[]) => t.join('').replace(/\s/g, '').length || 1
  if (ink(x.slice(p, x.length - s)) / ink(x) > 0.7 || ink(y.slice(p, y.length - s)) / ink(y) > 0.7) return null
  return [
    [p, x.length - s],
    [p, y.length - s],
  ]
}

/** Where every line of a hunk sits, for a given view and verdict. */
function place(lines: Num[], verdict: Verdict, split: boolean, hid: string) {
  const rows: Row[] = []
  const fills: Fill[] = []
  let y = 0
  for (let i = 0; i < lines.length;) {
    const l = lines[i]
    if (verdict !== 'pending' || l.k === 'ctx') {
      // Resolved hunks read as plain code: the lines that lost fade out where they stood.
      const gone = (verdict === 'accepted' && l.k === 'del') || (verdict === 'rejected' && l.k === 'add')
      // A resolved hunk counts lines the way the file it kept does: new numbers if accepted, old if rejected.
      const num = verdict === 'rejected' || (verdict === 'pending' && l.k === 'del') ? l.o : l.n
      rows.push({ l, num, y, side: 'full', tone: verdict === 'pending' ? l.k : 'ctx', gone })
      if (!gone) y++
      i++
      continue
    }
    const start = i
    const out: Num[] = []
    const inn: Num[] = []
    while (i < lines.length && lines[i].k === 'del') out.push(lines[i++])
    while (i < lines.length && lines[i].k === 'add') inn.push(lines[i++])
    const marks = out.map((d, k) => (inn[k] ? changed(d.text, inn[k].text) : null))
    out.forEach((l, k) => rows.push({ l, num: l.o, y: y + k, side: split ? 'left' : 'full', tone: 'del', gone: false, hl: marks[k]?.[0] }))
    inn.forEach((l, k) => rows.push({ l, num: l.n, y: split ? y + k : y + out.length + k, side: split ? 'right' : 'full', tone: 'add', gone: false, hl: marks[k]?.[1] }))
    if (split) {
      for (let k = Math.min(out.length, inn.length); k < Math.max(out.length, inn.length); k++) fills.push({ key: `${hid}-${start}-${k}`, y: y + k, side: out.length < inn.length ? 'left' : 'right' })
      y += Math.max(out.length, inn.length)
    } else y += out.length + inn.length
  }
  return { rows, fills, height: y }
}

function HunkView({
  h,
  index,
  shown,
  verdict,
  split,
  body,
  focused,
  writing,
  canDecide,
  onPick,
  onDecide,
}: {
  h: Hunk
  index: number
  shown: number
  verdict: Verdict
  split: boolean
  body: number
  focused: boolean
  writing: boolean
  canDecide: boolean
  onPick: () => void
  onDecide: (v: Verdict) => void
}) {
  const numbered = useMemo(() => {
    let o = h.o
    let n = h.n
    return h.lines.map(([k, text], i): Num => ({ k, text, i, o: k === 'add' ? 0 : o++, n: k === 'del' ? 0 : n++ }))
  }, [h])
  const { rows, fills, height } = place(numbered.slice(0, shown), verdict, split, h.id)
  const nc = h.lines.filter(([k]) => k !== 'del').length
  const widest = h.lines.reduce((m, [, t]) => Math.max(m, t.length), 0)

  return (
    <motion.section
      data-hunk={index}
      onPointerDown={onPick}
      className="relative shrink-0 overflow-hidden rounded-[12px] transition-shadow duration-200"
      style={{ boxShadow: focused ? '0 0 0 1.5px var(--accent)' : '0 0 0 1px var(--line)' }}
      initial={{ opacity: 0, height: HEAD }}
      animate={{ opacity: 1, height: HEAD + height * RH }}
      transition={{ height: spring.smooth, opacity: { duration: 0.2, ease: ease.out } }}
    >
      <div className="relative z-10 flex items-center gap-2 pl-3 pr-1.5 shadow-[inset_0_-1px_0_var(--line)]" style={{ height: HEAD, background: 'color-mix(in oklch, var(--ink) 2.5%, var(--surface))' }}>
        {/* Where it is: the function it's in, then the lines, in words rather than @@ marks. */}
        <span className="flex min-w-0 items-center gap-1.5 truncate font-mono text-[11.5px] text-ink">
          <span aria-hidden className="italic text-ink-3">
            ƒ
          </span>
          <span className="truncate">{h.scope}</span>
        </span>
        <span className="shrink-0 text-caption text-ink-3 @max-[520px]:hidden">
          Lines {h.n}–{h.n + Math.max(0, nc - 1)}
        </span>
        <span className="flex-1" />
        <Verdicts verdict={verdict} writing={writing} canDecide={canDecide} focused={focused} onDecide={onDecide} />
      </div>

      <div className="relative overflow-x-auto [scrollbar-width:none]" style={{ height: height * RH }}>
        <div className="relative h-full font-mono text-caption" style={{ minWidth: split ? undefined : `calc(${widest}ch + 4.5rem)` }}>
        {rows.map((r) => (
          <RowView key={r.l.i} r={r} split={split} body={body} />
        ))}
        <AnimatePresence>
          {fills.map((f) => (
            <motion.span
              key={f.key}
              className="absolute top-0 h-5 w-1/2"
              style={{ left: f.side === 'right' ? '50%' : 0, y: f.y * RH, background: 'color-mix(in oklch, var(--ink) 3%, transparent)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.25, delay: 0.15, ease: ease.out } }}
              exit={{ opacity: 0, transition: { duration: dur.exit, ease: ease.out } }}
            />
          ))}
        </AnimatePresence>
        <motion.span aria-hidden className="absolute inset-y-0 left-1/2 z-[2] w-px bg-line" initial={false} animate={{ opacity: split ? 1 : 0 }} transition={{ duration: 0.2, ease: ease.out }} />
        </div>
      </div>
    </motion.section>
  )
}

const wash = (c: string, light: number, dark: number) => `light-dark(color-mix(in oklch, var(${c}) ${light}%, transparent), color-mix(in oklch, var(${c}) ${dark}%, transparent))`
const TINT = { ctx: 'transparent', add: wash('--ok', 7, 10), del: wash('--danger', 6.5, 10) }
const MARK = { add: wash('--ok', 22, 30), del: wash('--danger', 19, 28) }
/** The colour of a change as a mark: the line's edge, its sign, and the counts in the header. */
const SIGN = { add: 'color-mix(in oklch, var(--ok) 85%, var(--ink))', del: 'color-mix(in oklch, var(--danger) 85%, var(--ink))' }

function RowView({ r, split, body }: { r: Row; split: boolean; body: number }) {
  const full = r.side === 'full'
  // Across by transform: a removed line sliding over to pair with its replacement moves nothing in the layout.
  const at = { y: r.y * RH, x: r.side === 'right' ? body / 2 : 0, width: full ? '100%' : '50%' }
  const num = r.num
  return (
    <motion.div
      className="absolute left-0 top-0 h-5 font-mono text-caption leading-5 transition-[background-color] duration-500"
      style={{ background: TINT[r.tone], zIndex: r.gone ? 0 : 1, pointerEvents: r.gone ? 'none' : undefined }}
      initial={{ opacity: 0, ...at }}
      animate={{ opacity: r.gone ? 0 : 1, ...at }}
      transition={{ default: spring.smooth, opacity: { duration: r.gone ? 0.14 : 0.3, ease: ease.out } }}
    >
      <motion.div className="absolute inset-y-0 left-0 overflow-hidden" initial={false} animate={{ width: full && split ? '50%' : '100%' }} transition={spring.smooth}>
        <Seg num={full && split && r.l.k === 'ctx' ? r.l.o : num} tone={r.tone} text={r.l.text} hl={r.hl} />
      </motion.div>
      {full && (
        <motion.div className="absolute inset-y-0 left-1/2 w-1/2 overflow-hidden" initial={false} animate={{ opacity: split ? 1 : 0 }} transition={{ duration: 0.2, delay: split ? 0.12 : 0, ease: ease.out }}>
          <Seg num={num} tone={r.tone} text={r.l.text} />
        </motion.div>
      )}
    </motion.div>
  )
}

const KW = new Set(['export', 'const', 'let', 'function', 'return', 'if', 'else', 'await', 'async', 'import', 'from', 'type', 'new', 'true', 'false', 'null'])

function Seg({ num, tone, text, hl }: { num: number; tone: Row['tone']; text: string; hl?: [number, number] }) {
  const toks = lex(text)
  return (
    <div className="relative flex h-full whitespace-pre">
      {/* A changed line is marked at its edge, not by tinting its number. */}
      {tone !== 'ctx' && <span aria-hidden className="absolute inset-y-0 left-0 w-[2px]" style={{ background: SIGN[tone] }} />}
      <span className="tnum w-11 shrink-0 select-none pr-3 text-right" style={{ color: tone === 'ctx' ? 'color-mix(in oklch, var(--ink) 32%, transparent)' : `color-mix(in oklch, ${SIGN[tone]} 70%, var(--ink-3))` }}>
        {num || ''}
      </span>
      <span className="w-4 shrink-0 select-none" style={{ color: tone === 'ctx' ? undefined : SIGN[tone] }}>
        {tone === 'add' ? '+' : tone === 'del' ? '−' : ''}
      </span>
      <span className="min-w-0 overflow-hidden pr-3 text-ink-2">
        {toks.map((t, i) => {
          const on = hl && tone !== 'ctx' && i >= hl[0] && i < hl[1]
          return (
            <span
              key={i}
              className="transition-[background-color] duration-500"
              style={{
                ...syntax(t, toks[i + 1]),
                background: on ? MARK[tone as 'add' | 'del'] : undefined,
                borderRadius: on ? `${i === hl![0] ? 3 : 0}px ${i === hl![1] - 1 ? 3 : 0}px ${i === hl![1] - 1 ? 3 : 0}px ${i === hl![0] ? 3 : 0}px` : undefined,
              }}
            >
              {t}
            </span>
          )
        })}
      </span>
    </div>
  )
}

/**
 * Near-monochrome syntax, so colour is left to the change itself: keywords set a step heavier,
 * values and calls in full ink, names in the body grey, punctuation stepping back.
 */
function syntax(t: string, next?: string) {
  if (/^\s/.test(t)) return undefined
  if (KW.has(t)) return { color: 'var(--ink)', fontWeight: 500 }
  if (/^['\d]/.test(t)) return { color: 'var(--ink)' }
  if (/^\w/.test(t)) return next === '(' ? { color: 'var(--ink)' } : undefined
  return { color: 'color-mix(in oklch, var(--ink) 40%, transparent)' }
}

/* ───────────────────────────── Header ───────────────────────────── */

const TICKS = 22

/**
 * The change as a fine ruler of a fixed length: a green tick for each line added, then a red one
 * for each removed, scaled to fit; the rest stay faint. Its width never changes as the counts roll.
 */
function Ticks({ adds, dels }: { adds: number; dels: number }) {
  const total = adds + dels
  const k = total > TICKS ? TICKS / total : 1
  const a = Math.round(adds * k)
  const d = Math.min(TICKS - a, Math.max(dels ? 1 : 0, Math.round(dels * k)))
  return (
    <span className="flex h-2.5 items-end gap-[2px]" aria-hidden>
      {Array.from({ length: TICKS }, (_, i) => (
        <span key={i} className="block w-[1.5px] rounded-full transition-[background-color,height] duration-300" style={{ height: i < a + d ? 10 : 6, background: i < a ? SIGN.add : i < a + d ? SIGN.del : 'color-mix(in oklch, var(--ink) 14%, transparent)' }} />
      ))}
    </span>
  )
}

/** The footer's line, in two tones: the count in ink, what it means in grey. */
function Status({ text }: { text: string }) {
  const m = text.match(/^(\d+ of \d+|\d+ accepted · \d+ rejected)(.*)$/)
  return m ? (
    <span>
      <span className="text-ink">{m[1]}</span>
      {m[2].replace(/ to review$/, '')}
      {m[2].endsWith(' to review') && <span className="@max-[320px]:hidden"> to review</span>}
    </span>
  ) : (
    <span className="text-ink-2">{text}</span>
  )
}

/* ───────────────────────────── Verdicts ───────────────────────────── */

function Verdicts({ verdict, writing, canDecide, focused, onDecide }: { verdict: Verdict; writing: boolean; canDecide: boolean; focused: boolean; onDecide: (v: Verdict) => void }) {
  const state = writing ? 'writing' : verdict !== 'pending' ? verdict : canDecide ? 'ask' : 'wait'
  return (
    // One fixed slot: the buttons, the stamp and the writing state all live in the same space.
    <span className="relative flex h-6 w-[172px] @max-[420px]:w-[132px] shrink-0 items-center justify-end">
      <AnimatePresence initial={false} mode="popLayout">
        {state === 'writing' && (
          <motion.span key="writing" className="flex items-center gap-1.5 pr-1.5 text-caption text-ink-3" {...fade}>
            <Spinner size={11} />
            Writing
          </motion.span>
        )}
        {state === 'ask' && (
          <motion.span key="ask" className="flex items-center gap-1" {...fade}>
            <Small onClick={() => onDecide('rejected')} hint="R" focused={focused}>
              <Close size={12} />
              Reject
            </Small>
            <Small onClick={() => onDecide('accepted')} hint="A" focused={focused} strong>
              <Check size={12} strokeWidth={2.6} />
              Accept
            </Small>
          </motion.span>
        )}
        {(state === 'accepted' || state === 'rejected') && (
          <motion.span key={state} className="flex items-center gap-1" {...fade}>
            <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => onDecide('pending')} className="ring-focus relative h-6 rounded-[7px] px-1.5 text-caption text-ink-3 transition-colors duration-150 hover:bg-surface-2 hover:text-ink [@media(pointer:coarse)]:after:absolute [@media(pointer:coarse)]:after:-inset-x-1 [@media(pointer:coarse)]:after:-inset-y-2 [@media(pointer:coarse)]:after:content-['']">
              Undo
            </button>
            <Mark ok={state === 'accepted'} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.18, ease: ease.out },
}

/** The verdict as a soft tinted pill, the way verdicts read across the library: green kept, red turned down. */
function Mark({ ok }: { ok: boolean }) {
  const c = ok ? 'var(--ok)' : 'var(--danger)'
  return (
    <motion.span className="chip mr-0.5 rounded-full px-2 text-caption font-medium leading-5" style={{ color: c, ['--chip' as string]: c }} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: ease.out }}>
      {ok ? 'Accepted' : 'Rejected'}
    </motion.span>
  )
}

function Small({ onClick, hint, focused, strong, children }: { onClick: () => void; hint: string; focused: boolean; strong?: boolean; children: ReactNode }) {
  return (
    <motion.button
      type="button"
      whileTap={press}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      className={`ring-focus relative flex h-6 items-center gap-1 rounded-[7px] pl-1.5 pr-1 text-caption font-medium pointer-coarse:pr-1.5 @max-[420px]:pr-1.5 [@media(pointer:coarse)]:after:absolute [@media(pointer:coarse)]:after:-inset-x-1 [@media(pointer:coarse)]:after:-inset-y-2 [@media(pointer:coarse)]:after:content-[''] transition-[background-color,color,box-shadow] duration-150 ${
        strong && focused ? 'bg-ink text-surface hover:opacity-90' : strong ? 'bg-surface text-ink shadow-[0_0_0_1px_var(--line-strong)] hover:bg-surface-2' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
      }`}
    >
      {children}
      {/* The shortcut is always there, only brighter on the hunk you're on, so nothing shifts. */}
      <span
        className={`ml-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] px-1 font-mono pointer-coarse:hidden @max-[420px]:hidden text-[10.5px] leading-none transition-opacity duration-200 ${strong && focused ? 'bg-[color-mix(in_oklch,var(--surface)_18%,transparent)] text-surface' : 'bg-surface-2 text-ink-3'}`}
        style={{ opacity: focused ? 1 : 0.45 }}
      >
        {hint}
      </span>
    </motion.button>
  )
}

/* ───────────────────────────── View switch ───────────────────────────── */

function Segmented({ value, onChange }: { value: DiffView; onChange: (v: DiffView) => void }) {
  const id = useId()
  return (
    <span role="radiogroup" aria-label="Diff layout" className="flex h-8 shrink-0 rounded-[10px] bg-surface-2 p-[3px]">
      {(['unified', 'split'] as const).map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`ring-focus relative flex w-[66px] items-center justify-center rounded-[7px] text-caption font-medium capitalize transition-colors duration-150 ${value === v ? 'text-ink' : 'text-ink-3 hover:text-ink-2'}`}
        >
          {value === v && <motion.span layoutId={id} className="absolute inset-0 rounded-[7px] bg-plate shadow-raised" transition={spring.snappy} />}
          <span className="relative">{v}</span>
        </button>
      ))}
    </span>
  )
}
