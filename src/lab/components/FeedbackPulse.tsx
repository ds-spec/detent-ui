'use client'

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode, Ref } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check } from '../icons'
import { ease, press, dur, spring } from '../lib/motion'
import { Morph } from '../ui/Morph'
import { Button } from '../ui/Button'

type Phase = 'idle' | 'open' | 'sent'
/** For demos and tests: point at a score, pick it, tick reasons and send, without touching focus. */
export type PulseHandle = { hover(n: number): void; rate(n: number): void; toggle(reason: string): void; send(): void }
type Tier = 'low' | 'mid' | 'high'

const LABELS = ['Not helpful', 'Slightly helpful', 'Somewhat helpful', 'Helpful', 'Very helpful']
const ASK: Record<Tier, string> = { low: 'What went wrong?', mid: 'What would make it better?', high: 'What worked for you?' }
const CHIPS: Record<Tier, string[]> = {
  low: ['Confusing', 'Missing information', 'Example didn’t work', 'Out of date'],
  mid: ['Too long', 'Needs an example', 'Hard to find'],
  high: ['Clear', 'Great examples', 'Saved me time', 'Well written'],
}
const tierOf = (s: number): Tier => (s <= 2 ? 'low' : s === 3 ? 'mid' : 'high')

const PILL_H = 44

/**
 * Feedback that starts as a five-dot meter. Pick a score and it opens into a card whose
 * follow-up depends on that score; sending folds it back down. The pill reserves its own
 * footprint and the card grows upward over the page, so nothing around it moves.
 */
export function FeedbackPulse({
  question = 'Was this helpful?',
  labels = LABELS,
  reasons: offered = CHIPS,
  onSend,
  ref,
}: {
  /** What's asked before anyone rates. */
  question?: string
  /** What each of the five scores is called, lowest first. */
  labels?: string[]
  /** The reasons offered after a low (1–2), middling (3) or high (4–5) score. */
  reasons?: Record<'low' | 'mid' | 'high', string[]>
  /** Called with the score, the reasons picked and the note, once it's sent. */
  onSend?: (v: { score: number; reasons: string[]; note: string }) => void
  ref?: Ref<PulseHandle>
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [score, setScore] = useState(0)
  const [hover, setHover] = useState(0)
  const [reasons, setReasons] = useState<string[]>([])
  const [note, setNote] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const tier = tierOf(score)

  const reset = () => {
    setPhase('idle')
    setScore(0)
    setHover(0)
    setReasons([])
    setNote('')
  }

  useEffect(() => {
    if (phase !== 'open') return
    const down = (e: PointerEvent) => !root.current?.contains(e.target as Node) && reset()
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      reset()
    }
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', down)
      document.removeEventListener('keydown', key)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'sent') return
    const t = setTimeout(reset, 2600)
    return () => clearTimeout(t)
  }, [phase])

  const rate = (s: number) => {
    if (tierOf(s) !== tier) setReasons([])
    setScore(s)
    setPhase('open')
  }
  const send = () => {
    onSend?.({ score, reasons, note })
    setPhase('sent')
  }

  const latest = useRef({ rate, send })
  useLayoutEffect(() => {
    latest.current = { rate, send }
  })
  useImperativeHandle(ref, () => ({
    hover: setHover,
    rate: (n) => {
      setHover(0)
      latest.current.rate(n)
    },
    toggle: (c) => setReasons((r) => (r.includes(c) ? r.filter((x) => x !== c) : [...r, c])),
    send: () => latest.current.send(),
  }))

  const views = {
    idle: (
      <div className="flex w-[272px] items-center justify-between pl-5 pr-2.5 pointer-coarse:w-[328px]" style={{ height: PILL_H }} onPointerLeave={() => setHover(0)}>
        <Swap k={hover ? `h${hover}` : 'q'} className="w-[132px] text-callout">
          {hover ? <span className="text-ink">{labels[hover - 1]}</span> : <span className="text-ink-2">{question}</span>}
        </Swap>
        <Meter value={hover} labels={labels} onHover={setHover} onPick={rate} />
      </div>
    ),
    open: (
      <div className="@container w-[372px] max-w-[calc(100cqw-16px)] p-[18px]">
        <div className="flex h-7 items-center justify-between">
          <Swap k={`s${score}`} className="w-[190px] text-headline pointer-coarse:w-[166px]">
            {labels[Math.max(0, score - 1)]}
          </Swap>
          <Meter value={hover || score} labels={labels} onHover={setHover} onPick={rate} />
        </div>
        <Swap k={tier} className="mt-4 text-callout text-ink-2">
          {ASK[tier]}
        </Swap>
        {/* Fixed-height chip area: switching tiers never changes the card's size. */}
        <div className="relative mt-2.5 h-[76px] pointer-coarse:h-[80px] @max-[330px]:h-[120px] @max-[260px]:h-[162px]">
          <AnimatePresence initial={false}>
            <motion.div
              key={tier}
              className="absolute inset-0 flex flex-wrap content-start gap-1.5"
              initial="hidden"
              animate="shown"
              exit="gone"
              variants={{ shown: { transition: { staggerChildren: 0.03 } } }}
            >
              {offered[tier].map((c) => (
                <ReasonChip key={c} label={c} on={reasons.includes(c)} onToggle={() => setReasons((r) => (r.includes(c) ? r.filter((x) => x !== c) : [...r, c]))} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Anything else? (optional)"
          className="mt-2 h-10 w-full rounded-control bg-surface-2 px-3.5 text-callout text-ink outline-none transition-[background-color,box-shadow] duration-200 placeholder:text-ink-3 focus:bg-surface focus:shadow-field"
        />
        <div className="mt-3 flex items-center justify-end gap-1.5">
          <Button variant="ghost" onClick={reset}>
            Cancel
          </Button>
          <Button variant="primary" onClick={send}>
            Send
          </Button>
        </div>
      </div>
    ),
    sent: (
      <div className="flex w-[272px] items-center justify-between pl-3 pr-2.5 pointer-coarse:w-[328px]" style={{ height: PILL_H }}>
        <span className="flex items-center gap-2.5 text-callout">
          <motion.span
            initial={{ scale: 0.4 }}
            animate={{ scale: 1 }}
            transition={{ ...spring.pop, delay: 0.08 }}
            className="flex size-[26px] items-center justify-center rounded-full bg-ok text-white"
          >
            <Check size={15} strokeWidth={2.6} />
          </motion.span>
          Thanks, noted
        </span>
        <Meter value={score} labels={labels} quiet />
      </div>
    ),
  }

  return (
    <div ref={root} className="relative w-[272px] pointer-coarse:w-[328px]" style={{ height: PILL_H }}>
      {/* Hung from the pill's bottom-centre by translate, so the card grows up and out without its top-left ever moving. */}
      <div className="absolute left-1/2 top-full z-10 -translate-x-1/2 -translate-y-full">
        <Morph
          view={phase}
          views={views}
          anchor="bottom"
          radius={{ idle: PILL_H / 2, open: 22, sent: PILL_H / 2 }}
          className="bg-surface"
          style={{ boxShadow: phase === 'open' ? 'var(--elev-float)' : 'var(--elev-raised)', transition: 'box-shadow 300ms cubic-bezier(0.2,0.9,0.25,1)' }}
        />
      </div>
    </div>
  )
}

function ReasonChip({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <motion.button
      variants={{ hidden: { opacity: 0, y: 4 }, shown: { opacity: 1, y: 0 }, gone: { opacity: 0, transition: { duration: dur.exit, ease: ease.out } } }}
      transition={{ duration: 0.24, ease: ease.out }}
      whileTap={press}
      aria-pressed={on}
      onClick={onToggle}
      className={`ring-focus relative flex h-8 items-center rounded-full px-3.5 pointer-coarse:h-9 text-footnote font-medium transition-colors duration-200 ${
        on ? 'bg-ink text-surface' : 'bg-surface-2 text-ink hover:bg-[color-mix(in_oklch,var(--surface-2)_82%,var(--ink)_6%)]'
      }`}
    >
      {/* The tick sits in its own reserved slot, so selecting never changes the chip's width. */}
      <span className="relative mr-1 flex w-3.5 items-center justify-center">
        <AnimatePresence initial={false}>
          {on ? (
            <motion.span
              key="on"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={spring.pop}
              className="absolute"
            >
              <Check size={14} strokeWidth={2.6} />
            </motion.span>
          ) : (
            <motion.span
              key="off"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.35 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute size-[5px] rounded-full bg-current" transition={{ duration: dur.enter, ease: ease.out }}
            />
          )}
        </AnimatePresence>
      </span>
      {label}
    </motion.button>
  )
}

/** Five dots that fill from the left. */
function Meter({ value, labels, onHover, onPick, quiet }: { value: number; labels: string[]; onHover?: (v: number) => void; onPick?: (v: number) => void; quiet?: boolean }) {
  return (
    <div role={quiet ? undefined : 'radiogroup'} aria-label="Rating" className="flex items-center">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= value
        const dot = (
          <span className="relative block size-[10px]">
            <span className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 0 0 1.5px var(--line-strong)' }} />
            <motion.span
              className="absolute inset-0 rounded-full bg-ink"
              initial={false}
              animate={{ scale: on ? 1 : 0.8, opacity: on ? (quiet ? 0.4 : 1) : 0 }}
              transition={{ ...spring.pop, delay: on ? (n - 1) * 0.03 : (5 - n) * 0.015 }}
            />
          </span>
        )
        return quiet ? (
          <span key={n} className="flex size-[22px] items-center justify-center">
            {dot}
          </span>
        ) : (
          <button
            key={n}
            role="radio"
            aria-checked={on && n === value}
            aria-label={labels[n - 1]}
            onPointerEnter={(e) => e.pointerType !== 'touch' && onHover?.(n)}
            onFocus={() => onHover?.(n)}
            onBlur={() => onHover?.(0)}
            onClick={() => onPick?.(n)}
            className="ring-focus flex size-[24px] items-center justify-center rounded-full pointer-coarse:size-8"
          >
            {dot}
          </button>
        )
      })}
    </div>
  )
}

/** Text that crossfades in place. Width is fixed by the caller, so it never reflows. */
function Swap({ k, className, children }: { k: string; className: string; children: ReactNode }) {
  return (
    <span className={`relative block h-[1.4em] overflow-hidden ${className}`}>
      <AnimatePresence initial={false}>
        <motion.span
          key={k}
          className="absolute inset-0 truncate whitespace-nowrap leading-[1.4em]"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: ease.out }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
