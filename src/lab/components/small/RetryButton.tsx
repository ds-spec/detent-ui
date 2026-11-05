'use client'

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { Ref } from 'react'
import { AnimatePresence, animate, motion, useMotionValue } from 'motion/react'
import { Check, Clock, Refresh } from '../../icons'
import { tap } from '../../lib/feel'
import { ease, press } from '../../lib/motion'
import { Morph } from '../../ui/Morph'
import { RollingText } from '../../ui/RollingText'
import { Spinner } from '../../ui/Spinner'

type State = 'waiting' | 'trying' | 'ok'
export type RetryHandle = { now(): void; reset(): void }

export function RetryButton({ attempt, base = 5, title = 'Rate limited', detail = 'Too many requests to Detent Pro', ref }: {
  attempt: (n: number) => Promise<boolean>
  base?: number
  title?: string
  detail?: string
  ref?: Ref<RetryHandle>
}) {
  const [state, setState] = useState<State>('waiting')
  const [tries, setTries] = useState(0)
  const [left, setLeft] = useState(base)
  const ring = useMotionValue(1)
  const wait = base * 2 ** tries
  const latest = useRef({ go: () => {} })

  useEffect(() => {
    if (state !== 'waiting') return
    ring.set(1)
    const a = animate(ring, 0, { duration: wait, ease: 'linear' })
    const started = performance.now()
    const t = window.setInterval(() => {
      const rest = Math.max(0, wait - Math.floor((performance.now() - started) / 1000))
      setLeft(rest)
      if (rest === 0) {
        clearInterval(t)
        latest.current.go()
      }
    }, 200)
    return () => {
      a.stop()
      clearInterval(t)
    }
  }, [state, wait, ring])

  const go = async () => {
    if (state !== 'waiting') return
    setState('trying')
    const ok = await attempt(tries + 1)
    if (ok) setState('ok')
    else {
      setLeft(base * 2 ** (tries + 1))
      setTries((n) => n + 1)
      setState('waiting')
    }
  }

  useLayoutEffect(() => {
    latest.current = { go }
  })
  useImperativeHandle(ref, () => ({
    now: () => latest.current.go(),
    reset: () => {
      setLeft(base)
      setTries(0)
      setState('waiting')
    },
  }), [base])

  const views = {
    waiting: (
      <span className="flex h-10 items-center gap-2 pl-2 pr-4 text-callout font-medium">
        <span className="relative flex size-6 items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 20 20" className="absolute -rotate-90" aria-hidden>
            <circle cx="10" cy="10" r="8.5" fill="none" stroke="var(--line-strong)" strokeWidth="1.75" />
            <motion.circle cx="10" cy="10" r="8.5" fill="none" stroke="var(--warn)" strokeWidth="1.75" strokeLinecap="round" style={{ pathLength: ring }} />
          </svg>
          <Refresh size={12} />
        </span>
        <span className="flex items-center">
          Retry in&nbsp;
          <span className="tnum flex">
            <RollingText text={String(left)} />
          </span>
          s
        </span>
      </span>
    ),
    trying: (
      <span className="flex h-10 items-center gap-2 pl-3.5 pr-4 text-callout font-medium">
        <Spinner size={14} />
        Retrying
      </span>
    ),
    ok: (
      <span className="flex h-10 items-center gap-1.5 pl-3.5 pr-4 text-callout font-medium">
        <Check size={14} strokeWidth={2.6} />
        Back online
      </span>
    ),
  }

  return (
    <div className="flex w-[380px] max-w-full items-center gap-3 rounded-[24px] bg-surface p-3 shadow-float" role="status">
      <span
        className="relative flex size-10 shrink-0 items-center justify-center rounded-[12px] transition-colors duration-300"
        style={{ background: state === 'ok' ? 'color-mix(in oklch, var(--ok) 14%, transparent)' : 'color-mix(in oklch, var(--warn) 16%, transparent)', color: state === 'ok' ? 'var(--ok)' : 'var(--warn-ink)' }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span key={state === 'ok' ? 'ok' : 'wait'} className="flex" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ type: 'spring', stiffness: 520, damping: 26 }}>
            {state === 'ok' ? <Check size={18} strokeWidth={2.6} /> : <Clock size={18} />}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="relative h-10 min-w-0 flex-1">
        <AnimatePresence initial={false}>
          <motion.span
            key={state === 'ok' ? 'ok' : 'limited'}
            className="absolute inset-0 flex flex-col justify-center"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: ease.out }}
          >
            <span className="truncate text-headline text-ink">{state === 'ok' ? 'Connected' : title}</span>
            <span className="tnum truncate text-footnote text-ink-3">{state === 'ok' ? `Got through on try ${tries + 1}` : tries ? `${detail} · try ${tries + 1}` : detail}</span>
          </motion.span>
        </AnimatePresence>
      </span>
      <motion.button
        type="button"
        data-invite
        aria-label={state === 'waiting' ? `Retry now (it will retry by itself in ${left} seconds)` : state === 'trying' ? 'Retrying' : 'Connected'}
        whileTap={state === 'waiting' ? press : undefined}
        disabled={state !== 'waiting'}
        onPointerDown={() => state === 'waiting' && tap()}
        onClick={go}
        className="sink ring-focus rounded-full"
      >
        <Morph
          view={state}
          views={views}
          radius={20}
          anchor="center"
          justify="end"
          className={`transition-colors duration-300 ${state === 'ok' ? 'bg-[color-mix(in_oklch,var(--ok)_13%,var(--surface))] text-ok' : 'bg-surface-2 text-ink'}`}
        />
      </motion.button>
    </div>
  )
}
