'use client'

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, Ref } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowUp, Check, Orbit, Refresh } from '@/lab/icons'
import { tap } from '@/lab/lib/feel'
import { Kbd } from '@/lab/ui/Kbd'
import { Glow, aiText, useTone } from '@/lab/ui/Intelligence'
import { Sweep } from '@/lab/ui/Outcome'
import { ease, dur, spring, press } from '@/lab/lib/motion'

type Phase = 'idle' | 'selected' | 'working' | 'review'
/** For demos and tests: select, type an ask, run it and decide, without a pointer or focus. */
export type RewriteHandle = { select(start: number, end: number): void; ask(text: string): void; run(action?: string): void; accept(): void; reject(): void }

const PACE = 34
const BAR_W = 420

const count = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

/**
 * Select a phrase and have it written differently, right where it is. A bar docks under the
 * selection: say what you want in your own words, or pick a quick ask. While the assistant
 * works, the bar wears the Intelligence edge and the words you chose shimmer in place; then its
 * version streams in after them, the original struck through and the new words in the accent,
 * the way a tracked change reads, with how much shorter or longer it came out. Tab takes it: the
 * old words fold away and the new ones settle into the paragraph with a sweep of green. Escape
 * puts everything back as it was.
 *
 * The bar sits below the change, never on the words you're deciding about, and the paragraph is
 * the only thing that reflows.
 */
export function Rewrite({
  text: initial,
  rewrite,
  actions = ['Shorter', 'Friendlier'],
  assistant = 'Detent',
  onChange,
  ref,
}: {
  /** The paragraph to edit. */
  text: string
  /** Writes the new version of the selected words, from a quick ask or your own words. Resolve with the replacement. */
  rewrite: (selected: string, ask: string) => Promise<string>
  /** The quick asks the bar offers beside the field. */
  actions?: string[]
  /** What the assistant is called while it works. */
  assistant?: string
  /** Called with the whole paragraph after a change is accepted. */
  onChange?: (text: string) => void
  ref?: Ref<RewriteHandle>
}) {
  const [text, setText] = useState(initial)
  const [range, setRange] = useState<[number, number] | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [ask, setAsk] = useState('')
  const [asked, setAsked] = useState('')
  const [next, setNext] = useState('')
  const [shown, setShown] = useState(0)
  const [landed, setLanded] = useState<{ at: number; from: number; to: number } | null>(null)
  const [bar, setBar] = useState({ x: 0, y: 0, w: BAR_W })
  const para = useRef<HTMLParagraphElement>(null)
  const mark = useRef<HTMLSpanElement>(null)
  const field = useRef<HTMLInputElement>(null)
  const byHand = useRef(false)
  const runId = useRef(0)
  const reduce = useReducedMotion()
  const tone = useTone(phase === 'working', 'inline-edit')

  const before = range ? text.slice(0, range[0]) : text
  const picked = range ? text.slice(range[0], range[1]) : ''
  const after = range ? text.slice(range[1]) : ''
  const words = next.split(' ')
  const streaming = phase === 'review' && shown < words.length
  const delta = count(next) - count(picked)

  // The bar docks under the change, starting where it starts, kept inside the paragraph's width;
  // in a paragraph narrower than the bar, it takes the paragraph's width.
  useLayoutEffect(() => {
    const m = mark.current
    const p = para.current
    if (!m || !p) return
    const w = Math.min(BAR_W, p.offsetWidth)
    setBar({ x: Math.min(Math.max(0, m.offsetLeft - 12), Math.max(0, p.offsetWidth - w)), y: m.offsetTop + m.offsetHeight + 10, w })
  }, [range, phase, text, shown])

  // A selection made by hand puts the cursor in the field, ready to say what you want.
  useEffect(() => {
    if (phase === 'selected' && byHand.current) field.current?.focus({ preventScroll: true })
  }, [phase])

  const select = (start: number, end: number, hand = false) => {
    if (phase === 'working' || phase === 'review') return
    const s = Math.max(0, Math.min(start, end))
    const e = Math.min(text.length, Math.max(start, end))
    if (e - s < 2) return clear()
    byHand.current = hand
    setRange([s, e])
    setAsk('')
    setPhase('selected')
  }
  const clear = () => {
    runId.current++
    setRange(null)
    setPhase('idle')
    setNext('')
    setAsk('')
  }
  const run = async (how = ask) => {
    if (!range || !how.trim()) return
    tap()
    const me = ++runId.current
    setAsked(how.trim())
    setPhase('working')
    setNext('')
    setShown(0)
    const out = await rewrite(picked, how.trim())
    if (runId.current !== me) return
    setNext(out)
    setPhase('review')
  }
  // The suggestion streams in a word at a time.
  useEffect(() => {
    if (phase !== 'review' || shown >= words.length) return
    const t = setTimeout(() => setShown((n) => n + 1), reduce ? 0 : PACE)
    return () => clearTimeout(t)
  }, [phase, shown, words.length, reduce])

  const accept = () => {
    if (phase !== 'review' || !range || streaming) return
    tap()
    const updated = before + next + after
    setText(updated)
    setLanded({ at: Date.now(), from: range[0], to: range[0] + next.length })
    setRange(null)
    setPhase('idle')
    setAsk('')
    onChange?.(updated)
  }
  const reject = () => {
    if (phase === 'idle') return
    tap()
    clear()
  }

  const latest = useRef({ select, run, accept, reject })
  useLayoutEffect(() => {
    latest.current = { select, run, accept, reject }
  })
  useImperativeHandle(
    ref,
    () => ({
      select: (s, e) => latest.current.select(s, e),
      ask: (t) => setAsk(t),
      run: (a) => latest.current.run(a),
      accept: () => latest.current.accept(),
      reject: () => latest.current.reject(),
    }),
    [],
  )

  // A selection made by hand: read it as offsets into the paragraph's text.
  const onUp = () => {
    const sel = window.getSelection()
    const p = para.current
    if (!sel || !p || sel.rangeCount === 0 || phase === 'working' || phase === 'review') return
    const r = sel.getRangeAt(0)
    if (!p.contains(r.startContainer) || !p.contains(r.endContainer)) return
    const pre = document.createRange()
    pre.selectNodeContents(p)
    pre.setEnd(r.startContainer, r.startOffset)
    const start = pre.toString().length
    select(start, start + r.toString().length, true)
    sel.removeAllRanges()
  }

  // Keys: Tab accepts, Escape steps back, wherever focus is inside.
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Tab' && phase === 'review') {
      e.preventDefault()
      accept()
    } else if (e.key === 'Escape' && phase !== 'idle') {
      e.preventDefault()
      reject()
    }
  }

  // The words that just landed hold the eye for a moment, then become part of the paragraph.
  useEffect(() => {
    if (!landed) return
    const t = setTimeout(() => setLanded(null), 1800)
    return () => clearTimeout(t)
  }, [landed])
  const fresh = landed && phase === 'idle' ? landed : null
  const doing = asked.length > 28 ? 'Rewriting it your way' : `Making it ${asked.toLowerCase()}`

  return (
    <div className="relative" onKeyDown={onKey}>
      <p ref={para} onPointerUp={onUp} className="relative text-body leading-[27px] text-ink-2 selection:bg-[color-mix(in_oklch,var(--accent)_22%,transparent)]">
        {fresh ? (
          <>
            {text.slice(0, fresh.from)}
            <span className="relative rounded-[3px] text-ink transition-colors duration-700">
              {text.slice(fresh.from, fresh.to)}
              <Sweep k={fresh.at} />
            </span>
            {text.slice(fresh.to)}
          </>
        ) : range ? (
          <>
            {before}
            {/* The change: the words you chose, and once there's a suggestion, the new ones after them. */}
            <span ref={mark}>
              <span
                className={`rounded-[3px] transition-[color,background-color] duration-200 ${
                  phase === 'review'
                    ? 'bg-[color-mix(in_oklch,var(--danger)_7%,transparent)] text-ink-3 line-through decoration-[color-mix(in_oklch,var(--danger)_70%,transparent)] decoration-[1.5px]'
                    : phase === 'working'
                      ? 'sheen'
                      : 'bg-[color-mix(in_oklch,var(--accent)_16%,transparent)] text-ink'
                }`}
              >
                {picked}
              </span>
              {phase === 'review' && (
                <span className="rounded-[3px] bg-[color-mix(in_oklch,var(--accent)_12%,transparent)] text-[var(--accent-ink,var(--accent))]">
                  {' '}
                  {words.map((w, i) => (
                    <span key={i} className={i < shown ? (reduce ? '' : 'word-in') : 'invisible'}>
                      {i > 0 && ' '}
                      {w}
                    </span>
                  ))}
                </span>
              )}
            </span>
            {after}
          </>
        ) : (
          text
        )}
      </p>

      {/* The bar, docked under the change: what you want, then the assistant at work, then the decision. */}
      <AnimatePresence>
        {range && (
          <motion.div
            key="bar"
            role="toolbar"
            aria-label={`Edit with ${assistant}`}
            className="absolute z-10"
            style={{ left: bar.x, top: bar.y, width: bar.w, transformOrigin: '0% 0%' }}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: dur.exit, ease: ease.out } }}
            transition={spring.snappy}
          >
            <Glow on={phase === 'working'} layer="halo" radius={14} tone={tone} />
            <div className="relative flex h-11 items-center gap-1 rounded-[14px] bg-surface p-1 shadow-modal">
              <AnimatePresence initial={false} mode="popLayout">
                {phase === 'selected' && (
                  <motion.form
                    key="ask"
                    className="flex min-w-0 flex-1 items-center gap-1"
                    onSubmit={(e) => {
                      e.preventDefault()
                      run()
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: dur.exit, ease: ease.out } }} transition={{ duration: dur.enter, ease: ease.out }}
                  >
                    <span className="grid size-8 shrink-0 place-items-center text-[var(--accent-ink,var(--accent))]">
                      <Orbit size={16} />
                    </span>
                    <input
                      ref={field}
                      value={ask}
                      onChange={(e) => setAsk(e.target.value)}
                      placeholder={`Ask ${assistant} to change it`}
                      aria-label={`Ask ${assistant} to change the selection`}
                      className="h-8 min-w-0 flex-1 bg-transparent text-footnote text-ink outline-none placeholder:text-ink-3"
                    />
                    {ask.trim() ? (
                      <motion.button whileTap={press} type="submit" aria-label="Rewrite" className="ring-focus grid size-8 shrink-0 place-items-center rounded-[10px] bg-ink text-surface">
                        <ArrowUp size={14} strokeWidth={2.4} />
                      </motion.button>
                    ) : (
                      actions.map((a) => (
                        <motion.button whileTap={press} key={a} type="button" onClick={() => run(a)} className="ring-focus h-8 shrink-0 rounded-[10px] bg-surface-2 px-2.5 text-footnote font-medium text-ink-2 transition-colors hover:text-ink">
                          {a}
                        </motion.button>
                      ))
                    )}
                  </motion.form>
                )}
                {phase === 'working' && (
                  <motion.span key="work" className="flex flex-1 items-center gap-2 px-2 text-footnote" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: dur.exit, ease: ease.out } }} transition={{ duration: dur.enter, ease: ease.out }}>
                    <span className="grid size-6 place-items-center text-[var(--accent-ink,var(--accent))]">
                      <Orbit size={16} className="motion-safe:animate-spin [animation-duration:2.4s]" />
                    </span>
                    <span className={`min-w-0 flex-1 truncate ${aiText(tone)}`}>{doing}</span>
                    <motion.button whileTap={press} type="button" onClick={reject} className="ring-focus flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-footnote font-medium text-ink-3 hover:bg-surface-2 hover:text-ink">
                      Stop <Kbd>Esc</Kbd>
                    </motion.button>
                  </motion.span>
                )}
                {phase === 'review' && (
                  <motion.span key="decide" className="flex flex-1 items-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: dur.exit, ease: ease.out } }} transition={{ duration: dur.enter, ease: ease.out }}>
                    {/* How much the change moved, so you can judge it at a glance. */}
                    <span className={`tnum min-w-0 flex-1 truncate px-2 text-caption ${streaming ? 'opacity-0' : ''} transition-opacity duration-300 ${delta < 0 ? 'text-[color-mix(in_oklch,var(--ok)_80%,var(--ink))]' : 'text-ink-3'}`}>
                      {delta === 0 ? 'Same length' : `${delta < 0 ? '−' : '+'}${Math.abs(delta)} words`}
                    </span>
                    <motion.button whileTap={press} type="button" aria-label="Try again" title="Try again" onClick={() => run(asked)} className="ring-focus grid size-8 place-items-center rounded-[10px] text-ink-3 hover:bg-surface-2 hover:text-ink">
                      <Refresh size={14} />
                    </motion.button>
                    <motion.button whileTap={press} type="button" onClick={reject} className="ring-focus flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-footnote font-medium text-ink-2 hover:bg-surface-2 hover:text-ink">
                      Undo <span className="contents @max-[420px]:hidden pointer-coarse:hidden"><Kbd>Esc</Kbd></span>
                    </motion.button>
                    <motion.button whileTap={press} type="button" onClick={accept} disabled={streaming} className="ring-focus flex h-8 items-center gap-1.5 rounded-[10px] bg-ink px-3 text-footnote font-medium text-surface transition-opacity disabled:opacity-50">
                      <Check size={13} strokeWidth={2.6} /> Accept <span className="contents @max-[420px]:hidden pointer-coarse:hidden"><Kbd onInk>Tab</Kbd></span>
                    </motion.button>
                  </motion.span>
                )}
              </AnimatePresence>
              <Glow on={phase === 'working'} layer="ring" radius={14} tone={tone} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="sr-only" aria-live="polite">
        {phase === 'working' ? `${assistant} is rewriting the selection` : phase === 'review' && !streaming ? `Suggestion ready: ${next}. Press Tab to accept or Escape to undo.` : ''}
      </p>
    </div>
  )
}
