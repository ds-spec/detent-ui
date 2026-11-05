'use client'

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, Ref } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Mic, Play } from '../../icons'
import { clamp, feedback, notched, useDetent } from '../../lib/detent'
import { tap } from '../../lib/feel'
import { ease, spring, dur } from '../../lib/motion'

export type Note = { id: string; seconds: number; bars: number[] }
export type HoldHandle = { hold(): void; slide(dx: number): void; release(): void }

const BARS = 26
const HINT = 112
const GIVE = 28
const CATCH = 16
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export function HoldToTalk({
  onNote,
  onCancel,
  placeholder = 'Message',
  cancelAt = 120,
  ref,
}: {
  onNote?: (n: Note) => void
  onCancel?: () => void
  placeholder?: string
  cancelAt?: number
  ref?: Ref<HoldHandle>
}) {
  const [state, setState] = useState<'idle' | 'holding' | 'binning'>('idle')
  const [seconds, setSeconds] = useState(0)
  const [level, setLevel] = useState<number[]>(() => Array(BARS).fill(0.08))
  const [loud, setLoud] = useState(0)
  const [notes, setNotes] = useState<Note[]>([])
  const [short, setShort] = useState(0)
  const [shut, setShut] = useState(false)
  const start = useRef(0)
  const from = useRef(0)
  const trace = useRef<number[]>([])
  const reduce = useReducedMotion()

  const [armed, setArmed] = useState(false)
  const stage = useRef(state)
  const wasArmed = useRef(false)
  const bar = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLSpanElement>(null)
  const bin = useRef<SVGSVGElement>(null)
  const time = useRef<HTMLSpanElement>(null)
  const wave = useRef<HTMLSpanElement>(null)
  const hint = useRef<HTMLSpanElement>(null)
  const knobbed = useRef<HTMLSpanElement>(null)
  const waveAt = useRef(-HINT)

  const paint = (x: number) => {
    const live = stage.current === 'holding'
    const to = notched(x, [-cancelAt], CATCH, 0.7)
    const progress = clamp(-to / cancelAt, 0, 1)
    const on = progress >= 1
    if (live && on !== wasArmed.current) {
      wasArmed.current = on
      setArmed(on)
      feedback.tick(true)
      tap()
    }
    if (bar.current) bar.current.style.background = live ? `color-mix(in oklch, var(--danger) ${(progress * 11).toFixed(1)}%, var(--surface))` : 'var(--surface)'
    if (dot.current) {
      dot.current.style.opacity = String(live ? Math.max(0, 1 - progress * 2.5) : 0)
      dot.current.style.scale = String(1 - progress)
    }
    const shown = stage.current === 'binning' ? 1 : progress
    if (bin.current) {
      bin.current.style.opacity = String(Math.min(1, shown * 1.6))
      bin.current.style.transform = `scale(${0.55 + shown * 0.45})`
    }
    if (time.current) time.current.style.opacity = String(1 - progress * 0.6)
    if (knobbed.current) knobbed.current.style.transform = `translate3d(${to.toFixed(2)}px,0,0)`
    if (stage.current !== 'binning') {
      waveAt.current = to - HINT * Math.max(0, 1 - progress * 1.4)
      if (wave.current) {
        wave.current.style.transform = `translate3d(${waveAt.current.toFixed(2)}px,0,0)`
        wave.current.style.opacity = String(1 - progress * 0.75)
      }
    }
    if (hint.current) {
      hint.current.style.opacity = String(live ? Math.max(0, 1 - progress * 3.5) : 0)
      hint.current.style.translate = `${to.toFixed(2)}px -50%`
    }
  }
  const dial = useDetent({
    value: 0,
    min: -cancelAt,
    max: 0,
    reach: GIVE,
    spring: { w: 22, z: 1 },
    muted: true,
    onFrame: (x) => paint(x),
  })
  useLayoutEffect(() => {
    stage.current = state
    paint(dial.get())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, cancelAt])

  useEffect(() => {
    if (state !== 'holding') return
    const t = window.setInterval(() => {
      setSeconds((performance.now() - start.current) / 1000)
      const v = Math.max(0.12, Math.min(1, 0.2 + Math.random() * 0.8 * (0.6 + 0.4 * Math.sin(performance.now() / 260))))
      trace.current.push(v)
      setLevel((l) => [...l.slice(1), v])
      setLoud(v)
    }, 80)
    return () => clearInterval(t)
  }, [state])

  const begin = () => {
    start.current = performance.now()
    trace.current = []
    wasArmed.current = false
    setArmed(false)
    setSeconds(0)
    dial.grab(0, { feel: false })
    setLevel(Array(BARS).fill(0.08))
    setState('holding')
  }
  const end = (cancel: boolean) => {
    if (state !== 'holding') return
    const s = (performance.now() - start.current) / 1000
    dial.release({ flick: false, home: 0 })
    wasArmed.current = false
    setArmed(false)
    if (cancel) {
      setState('binning')
      onCancel?.()
      window.setTimeout(() => setShut(true), 440)
      window.setTimeout(() => {
        setState('idle')
        setShut(false)
      }, 1000)
      return
    }
    setState('idle')
    if (s < 0.5) return setShort((n) => n + 1)
    const step = Math.max(1, Math.floor(trace.current.length / 22))
    const note = { id: `${Date.now()}`, seconds: s, bars: trace.current.filter((_, i) => i % step === 0).slice(0, 22) }
    setNotes((n) => [...n.slice(-1), note])
    onNote?.(note)
  }

  const latest = useRef({ begin, end, armed })
  useLayoutEffect(() => {
    latest.current = { begin, end, armed }
  })
  useImperativeHandle(ref, () => ({ hold: () => latest.current.begin(), slide: (x) => dial.grab(x, { feel: false }), release: () => latest.current.end(latest.current.armed) }), [dial])

  const down = (e: PointerEvent) => {
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
    }
    tap()
    from.current = e.clientX
    begin()
  }
  const keys = (e: KeyboardEvent, up: boolean) => {
    if (e.key === ' ') {
      e.preventDefault()
      if (!up && !e.repeat && state === 'idle') {
        tap()
        begin()
      } else if (up) end(false)
    } else if (e.key === 'Escape' && state === 'holding') {
      e.preventDefault()
      end(true)
    }
  }

  const live = state === 'holding'

  return (
    <div className="flex w-[380px] max-w-full flex-col max-[420px]:overflow-x-clip">
      <div className="flex h-[124px] flex-col items-end justify-end gap-2 pb-3">
        <AnimatePresence initial={false} mode="popLayout">
          {notes.map((n) => (
            <motion.div
              key={n.id}
              layout="position"
              className="flex h-11 items-center gap-2.5 rounded-[22px] rounded-br-[8px] bg-[var(--accent)] pl-1.5 pr-3.5 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]"
              initial={{ opacity: 0, y: 18, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: dur.exit, ease: ease.out } }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              style={{ transformOrigin: '100% 100%' }}
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-white/20">
                <Play size={12} />
              </span>
              <span className="flex h-5 items-center gap-[2px]" aria-hidden>
                {n.bars.map((v, i) => (
                  <span key={i} className="w-[2.5px] rounded-full bg-white/85" style={{ height: 3 + v * 15 }} />
                ))}
              </span>
              <span className="tnum text-footnote text-white/80">{clock(n.seconds)}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div
        ref={bar}
        className="relative h-[52px] rounded-full shadow-float transition-[background-color] duration-150"
        style={{ background: 'var(--surface)' }}
      >
        <span className="sr-only" aria-live="polite">
          {live ? (armed ? 'Let go to delete the recording' : 'Recording. Let go to send, or slide left to cancel') : ''}
        </span>

        <span className={`pointer-events-none absolute inset-y-0 left-5 flex items-center text-body text-ink-3 transition-opacity duration-200 ${state === 'idle' ? '' : 'opacity-0'}`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={short} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18, ease: ease.out }}>
              {short ? 'Hold a little longer to record' : placeholder}
            </motion.span>
          </AnimatePresence>
        </span>

        <div className={`pointer-events-none absolute inset-y-0 left-3 right-[62px] flex items-center gap-2.5 transition-opacity duration-200 ${state === 'idle' ? 'opacity-0' : ''}`}>
          <span className="relative flex size-8 shrink-0 items-center justify-center">
            <span ref={dot} className="absolute size-2.5 rounded-full bg-danger motion-safe:animate-pulse" style={{ opacity: 0 }} />
            <Bin ref={bin} open={(live && armed) || (state === 'binning' && !shut)} hot={armed || state === 'binning'} />
          </span>
          <span ref={time} className="tnum w-9 shrink-0 text-callout font-medium text-ink">
            {clock(seconds)}
          </span>
          <span className="relative h-7 min-w-0 flex-1" style={{ clipPath: state === 'binning' ? 'none' : 'inset(0)' }}>
            <span ref={wave} className="absolute inset-0 block">
            <motion.span
              className="absolute inset-0 flex items-center justify-end gap-[2.5px] overflow-hidden"
              animate={state === 'binning' ? { x: -96 - waveAt.current, scale: 0.15, opacity: 0 } : { x: 0, scale: 1, opacity: 1 }}
              transition={state === 'binning' ? { duration: reduce ? 0 : 0.42, ease: ease.inOut } : { duration: 0 }}
              style={{ transformOrigin: '0% 50%' }}
            >
              {level.map((v, i) => (
                <span key={i} className="h-[25px] w-[3px] shrink-0 rounded-full transition-[scale] duration-75" style={{ scale: `1 ${(3 + v * 22) / 25}`, background: armed ? 'var(--danger)' : 'var(--ink-2)', opacity: 0.35 + (i / BARS) * 0.65 }} />
              ))}
            </motion.span>
            </span>
          </span>
        </div>

        <span
          ref={hint}
          className="pointer-events-none absolute right-[66px] top-1/2 flex justify-end whitespace-nowrap text-footnote text-ink-3"
          style={{ width: HINT, opacity: 0 }}
        >
          <span className={reduce ? '' : 'sheen'}>‹ Slide to cancel</span>
        </span>

        <span ref={knobbed} className="absolute right-1.5 top-1.5 size-10 will-change-transform">
        <motion.button
          type="button"
          aria-label="Hold to record a voice note"
          aria-pressed={live}
          onPointerDown={down}
          onPointerMove={(e) => live && dial.drag(e.clientX - from.current)}
          onPointerUp={() => end(armed)}
          onPointerCancel={() => end(true)}
          onKeyDown={(e) => keys(e, false)}
          onKeyUp={(e) => keys(e, true)}
          onContextMenu={(e) => e.preventDefault()}
          className="ring-focus relative flex size-10 select-none items-center justify-center rounded-full"
          style={{ touchAction: 'none' }}
          animate={{ scale: live ? 1.35 : 1 }}
          transition={spring.snappy}
        >
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{ background: armed ? 'var(--danger)' : 'var(--ink)' }}
            animate={{ scale: live ? 1 + loud * 0.32 : 1, opacity: live ? 0.16 : 0 }}
            transition={{ duration: 0.12, ease: ease.out }}
          />
          <span className={`relative flex size-10 items-center justify-center rounded-full text-surface shadow-[inset_0_1px_0_rgb(255_255_255/0.16)] transition-colors duration-150 ${armed ? 'bg-danger' : 'bg-ink'}`}>
            <Mic size={16} />
          </span>
        </motion.button>
        </span>
      </div>
      <p className="mt-3 h-4 text-center text-caption text-ink-3">Hold the mic, or hold Space</p>
    </div>
  )
}

function Bin({ open, hot, ref }: { open: boolean; hot: boolean; ref: Ref<SVGSVGElement> }) {
  return (
    <svg
      ref={ref}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`absolute transition-colors duration-150 ${hot ? 'text-danger' : 'text-ink-2'}`}
      style={{ opacity: 0 }}
    >
      <motion.g style={{ originX: '4px', originY: '7px' }} animate={{ rotate: open ? -28 : 0, y: open ? -1.5 : 0 }} transition={{ type: 'spring', stiffness: 520, damping: open ? 22 : 14 }}>
        <path d="M4 7h16M9.5 7V5.2c0-.7.5-1.2 1.2-1.2h2.6c.7 0 1.2.5 1.2 1.2V7" />
      </motion.g>
      <path d="M6 9.5l.9 9.2c.1 1 .9 1.8 1.9 1.8h6.4c1 0 1.8-.8 1.9-1.8l.9-9.2M10.2 12.5v4.5M13.8 12.5v4.5" />
    </svg>
  )
}
