'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check } from '../../icons'
import { tap } from '../../lib/feel'
import { GRAIN } from '../../lib/grain'
import { RollingText } from '../../ui/RollingText'
import { Spinner } from '../../ui/Spinner'

export type ChecklistStep = {
  id: string
  title: string
  /** One line on what this step does. */
  line: string
  /** The label on its button. */
  action: string
  /** A rough time, like "2 min". */
  takes?: string
  /** Something real to show while it's open: the record to add, who's invited, the account. */
  preview?: ReactNode
  /** The step's own colour: any CSS background. */
  tint?: string
  /** Does the work. The step stays busy until it resolves. */
  onAction?: () => void | Promise<void>
}

const TINTS = [
  'radial-gradient(110% 150% at 0% 0%, #bcd6ff, transparent 70%), radial-gradient(110% 150% at 100% 100%, #e3d3ff, transparent 70%), #eef1fb',
  'radial-gradient(110% 150% at 100% 0%, #ffcfe2, transparent 70%), radial-gradient(110% 150% at 0% 100%, #e6c9ff, transparent 70%), #f9eef7',
  'radial-gradient(110% 150% at 0% 100%, #ffc98c, transparent 72%), radial-gradient(110% 150% at 100% 0%, #ffe3a8, transparent 70%), #fdf0db',
  'radial-gradient(110% 150% at 0% 0%, #aeeed5, transparent 72%), radial-gradient(110% 150% at 100% 100%, #bfe8ff, transparent 70%), #e7f7ef',
]

/**
 * Everything between signing up and going live, on one card. Only the step you're on is open, in
 * its own colour, showing the real thing it's about and the one button that does it. Finish it and
 * the next opens by itself, so the list always says where you are.
 */
export function Checklist({
  steps,
  done: initial = [],
  then = 'Then you’re live.',
  finished = 'You’re live.',
  finishedLine,
  finishedAction,
  onFinish,
}: {
  /** The steps, in order. */
  steps: ChecklistStep[]
  /** Ids already finished. */
  done?: string[]
  /** The grey line under the count. */
  then?: string
  /** The headline once every step is done. */
  finished?: string
  /** The grey line under it. */
  finishedLine?: string
  /** A last button, shown once everything's done. */
  finishedAction?: ReactNode
  /** Called when the last step finishes. */
  onFinish?: () => void
}) {
  const [done, setDone] = useState(initial)
  const [open, setOpen] = useState(() => steps.find((s) => !initial.includes(s.id))?.id ?? '')
  const [busy, setBusy] = useState(false)
  const alive = useRef(true)
  const reduce = useReducedMotion()
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  const left = steps.length - done.length

  const finish = async (step: ChecklistStep) => {
    if (busy) return
    tap()
    setBusy(true)
    await step.onAction?.()
    if (!alive.current) return
    const next = [...done, step.id]
    setDone(next)
    setBusy(false)
    setOpen(steps.find((s) => !next.includes(s.id))?.id ?? '')
    if (next.length === steps.length) onFinish?.()
  }

  return (
    <section aria-label="Setup checklist" className="relative w-[420px] max-w-full overflow-hidden rounded-[26px] bg-surface p-3 shadow-[0_0_0_1px_var(--line),0_34px_64px_-30px_rgb(50_20_60/0.45)]">
      <motion.span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[150px]" style={{ background: `radial-gradient(90% 120% at 20% 0%, #aeeed5, transparent 70%), radial-gradient(90% 120% at 90% 0%, #bfe8ff, transparent 70%)` }} initial={false} animate={{ opacity: left ? 0 : 0.7 }} transition={{ duration: 0.6 }} />
      <div className="relative px-2.5 pb-3 pt-2.5">
        <h3 className="text-[25px] leading-[1.14] tracking-[-0.035em] text-ink" aria-live="polite">
          {left ? (
            <span className="flex gap-[0.24em]">
              <RollingText text={String(left)} proportional />
              <span>{left === 1 ? 'thing left.' : 'things left.'}</span>
            </span>
          ) : (
            finished
          )}
          <span className="block text-ink-3">{left ? then : finishedLine}</span>
        </h3>
        <div aria-hidden className="mt-3.5 grid gap-1" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
          {steps.map((s) => (
            <span key={s.id} className="relative h-[5px] overflow-hidden rounded-full bg-surface-3">
              <motion.span className="absolute inset-0 origin-left rounded-full bg-ink" initial={false} animate={{ scaleX: done.includes(s.id) ? 1 : 0 }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 28 }} />
            </span>
          ))}
        </div>
      </div>

      <ol className="relative">
        {steps.map((s, i) => {
          const ok = done.includes(s.id)
          const on = open === s.id
          return (
            <li key={s.id} className="relative overflow-hidden rounded-[16px]">
              <AnimatePresence initial={false}>
                {on ? (
                  <motion.span aria-hidden className="absolute inset-0" style={{ background: s.tint ?? TINTS[i % TINTS.length] }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                    <span className="absolute inset-0 opacity-[0.3] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
                  </motion.span>
                ) : null}
              </AnimatePresence>
              <button
                type="button"
                disabled={ok}
                aria-expanded={on}
                onClick={() => {
                  tap()
                  setOpen(s.id)
                }}
                className={`ring-focus relative flex h-12 w-full items-center gap-3 rounded-[16px] px-3 text-left text-[15px] tracking-[-0.01em] transition-colors duration-150 ${on ? 'text-black' : ok ? 'text-ink-3' : 'text-ink hover:bg-surface-2'}`}
              >
                <span className={`grid size-[22px] shrink-0 place-items-center rounded-full transition-colors duration-200 ${ok ? 'bg-ink text-surface' : on ? 'shadow-[inset_0_0_0_1.5px_rgb(0_0_0/0.35)]' : 'shadow-[inset_0_0_0_1.5px_var(--line-strong)]'}`}>{ok ? <Check size={12} strokeWidth={3} /> : null}</span>
                <span className="min-w-0 flex-1 truncate">{s.title}</span>
                {s.takes && !ok ? <span className={`shrink-0 text-[13px] ${on ? 'text-black/50' : 'text-ink-3'}`}>{s.takes}</span> : null}
              </button>
              <AnimatePresence initial={false}>
                {on ? (
                  <motion.div className="relative overflow-hidden" initial={reduce ? false : { height: 0 }} animate={{ height: 'auto' }} exit={reduce ? undefined : { height: 0 }} transition={{ type: 'spring', stiffness: 440, damping: 38 }}>
                    <div className="pb-3 pl-[46px] pr-3">
                      <p className="text-[13.5px] leading-[19px] text-black/65">{s.line}</p>
                      <div className="mt-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1 text-black">{s.preview}</div>
                        <button type="button" onClick={() => void finish(s)} disabled={busy} className="ring-focus flex h-9 min-w-[104px] shrink-0 items-center justify-center rounded-[11px] bg-black px-3.5 text-[13px] font-medium text-white transition-transform duration-150 active:scale-[0.96]">
                          {busy ? <Spinner size={13} /> : s.action}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </li>
          )
        })}
      </ol>
      {!left && finishedAction ? <div className="relative px-2.5 pb-1.5 pt-2">{finishedAction}</div> : null}
    </section>
  )
}
