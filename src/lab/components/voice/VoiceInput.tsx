'use client'

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, Ref } from 'react'
import { AnimatePresence, motion, useAnimationFrame, useMotionValue, useTransform } from 'motion/react'
import type { MotionValue, PanInfo } from 'motion/react'
import { ArrowUp, Check, Close, Mic } from '../../icons'
import { useSize } from '../../lib/hooks'
import { ease, press, spring } from '../../lib/motion'
import { Glow, aiInk, useTone } from '../../ui/Intelligence'
import type { Tone } from '../../ui/Intelligence'

export type VoiceState = 'idle' | 'listening'
export type VoiceHandle = { send(): void }

/** The field's width when there's room; a narrower container gets all it has. */
const W = 440
const BAR = 36
const BARS = 46
const CANCEL_AT = -72

/**
 * A message field you can talk to.
 *
 * Tap the mic and it stretches into a live waveform the width of the bar; hold it instead
 * and it records only while held. Words arrive grey as they're heard and firm up to full ink
 * once recognition commits them. Stop talking and a ring fills around the check; finish it
 * yourself with Enter, or slide the bar left (or press Escape) to throw the take away. The
 * text keeps its place throughout: the field and the bar never change size.
 */
export function VoiceInput({
  state,
  level,
  text,
  interim,
  onTextChange,
  onStart,
  onStop,
  onCancel,
  onSend,
  autoStop = 1600,
  placeholder = 'Message Copilot, or tap the mic',
  ref,
}: {
  /** Listening or not. */
  state: VoiceState
  /** Loudness, 0 to 1, from the microphone (or anything else). */
  level: MotionValue<number>
  /** The committed text: anything typed plus words recognition is sure of. */
  text: string
  /** Words heard but not yet committed. */
  interim: string
  /** Called as the text changes, by typing or by speech. */
  onTextChange: (t: string) => void
  /** Called when a person starts listening. Start recognition here. */
  onStart: () => void
  /** Called when listening should stop, by a press or by quiet. */
  onStop: () => void
  /** Called when a person throws the recording away. */
  onCancel: () => void
  /** Called with the text a person sends. */
  onSend: (t: string) => void
  /** Stop on its own after this much quiet. */
  autoStop?: number
  /** Shown while the field is empty. */
  placeholder?: string
  ref?: Ref<VoiceHandle>
}) {
  const listening = state === 'listening'
  // The spectrum the first time it listens; after that the same motion in ink.
  const tone = useTone(listening, 'voice')
  const [sent, setSent] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [armed, setArmed] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const { w: fw } = useSize(frame)
  const w = fw || W
  const area = useRef<HTMLTextAreaElement>(null)
  const done = useRef<HTMLButtonElement>(null)
  const mic = useRef<HTMLButtonElement>(null)
  const held = useRef<number | null>(null)
  const drag = useMotionValue(0)

  // The clock, from the moment listening starts.
  useEffect(() => {
    if (!listening) return
    const t0 = performance.now()
    setElapsed(0)
    const t = setInterval(() => setElapsed(Math.floor((performance.now() - t0) / 1000)), 250)
    // Follow focus into the bar only if it was already in the field; a demo starting it never steals focus.
    if (root.current?.contains(document.activeElement)) done.current?.focus({ preventScroll: true })
    return () => clearInterval(t)
  }, [listening])

  // Quiet fills the ring around the check; a sound empties it again.
  const quiet = useMotionValue(0)
  const since = useRef(0)
  useAnimationFrame((_, delta) => {
    if (!listening) {
      since.current = 0
      if (quiet.get()) quiet.set(0)
      return
    }
    since.current = level.get() < 0.08 ? since.current + delta : 0
    const grace = 500
    const p = Math.max(0, Math.min(1, (since.current - grace) / autoStop))
    quiet.set(p)
    if (p >= 1) {
      since.current = 0
      onStop()
    }
  })

  // The newest words stay in view.
  useLayoutEffect(() => {
    const el = box.current
    if (el) el.scrollTop = el.scrollHeight
  }, [text, interim])

  const send = () => {
    const t = text.trim()
    if (!t) return
    setSent((n) => n + 1)
    onSend(t)
  }

  useImperativeHandle(ref, () => ({ send }))

  const onKey = (e: KeyboardEvent) => {
    if (!listening) return
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
      mic.current?.focus({ preventScroll: true })
    } else if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement && e.target !== done.current)) {
      e.preventDefault()
      onStop()
      area.current?.focus({ preventScroll: true })
    }
  }

  // A tap toggles; a hold records only while held.
  const down = (e: PointerEvent) => {
    if (e.button !== 0 || listening) return
    held.current = performance.now()
    onStart()
    window.addEventListener(
      'pointerup',
      () => {
        if (held.current !== null && performance.now() - held.current > 380) onStop()
        held.current = null
      },
      { once: true },
    )
  }

  const onDrag = (_: unknown, info: PanInfo) => setArmed(info.offset.x < CANCEL_AT)
  const onDragEnd = (_: unknown, info: PanInfo) => {
    setArmed(false)
    if (info.offset.x < CANCEL_AT) onCancel()
  }

  const committed = words(text)
  const heard = words(interim)

  return (
    // While it listens, the field wears Intelligence: a halo behind, light round the edge.
    <div ref={frame} className="relative w-[440px] max-w-full">
      <Glow on={listening} layer="halo" radius={20} tone={tone} />
      <div ref={root} onKeyDown={onKey} className="relative w-full overflow-hidden rounded-[20px] bg-surface shadow-float">
        <div
          ref={box}
          className="relative h-[108px] overflow-y-auto px-4 pt-3.5 text-callout leading-6"
          style={{ scrollbarWidth: 'none', maskImage: 'linear-gradient(to bottom, transparent, #000 14px)' }}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div key={sent} className="relative min-h-full" exit={{ opacity: 0, y: -14, transition: { duration: 0.28, ease: ease.out } }}>
              {listening ? (
                // While listening the text is read-only; each word keeps its slot, so committing only changes its colour.
                <p className="whitespace-pre-wrap pb-3">
                  {[...committed, ...heard].map((w, i) => (
                    <span key={i} className={`heard-in transition-colors duration-500 ${i < committed.length ? 'text-ink' : 'text-ink-3'}`}>
                      {w}{' '}
                    </span>
                  ))}
                  <span aria-hidden className="inline-block h-[17px] w-[2px] translate-y-[3px] rounded-full bg-accent motion-safe:animate-[caret_1.05s_infinite]" />
                </p>
              ) : (
                <textarea
                  ref={area}
                  value={text}
                  onChange={(e) => onTextChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      send()
                    }
                  }}
                  placeholder={placeholder}
                  rows={4}
                  className="block h-[92px] w-full resize-none bg-transparent text-ink outline-none placeholder:text-ink-3"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative flex h-14 items-center gap-2 pl-4 pr-2.5">
          <AnimatePresence initial={false}>
            {!listening && (
              <motion.span
                key="hint"
                className="flex-1 truncate text-caption text-ink-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.15 } }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
              >
                Tap to dictate, hold to talk
              </motion.span>
            )}
          </AnimatePresence>
          <span className="flex-1" />

          {/* The mic and the bar are one surface: it grows leftwards from the mic's own spot. The bar is
              always full width and a clip reveals it, so growing never moves anything on the page. */}
          <motion.div
            className="absolute top-1/2 z-10 -translate-y-1/2 overflow-hidden"
            initial={false}
            animate={{
              clipPath: listening ? `inset(0px 0px 0px 0px round ${BAR / 2}px)` : `inset(0px ${BAR + 6}px 0px ${w - 20 - 2 * BAR - 6}px round ${BAR / 2}px)`,
              backgroundColor: listening ? (armed ? 'color-mix(in oklch, var(--danger) 14%, var(--surface))' : 'var(--surface-2)') : 'rgba(0,0,0,0)',
            }}
            transition={{ clipPath: spring.smooth, backgroundColor: { duration: 0.2 } }}
            style={{ width: w - 20, right: 10, height: BAR, x: drag }}
            drag={listening ? 'x' : false}
            dragConstraints={{ left: -140, right: 0 }}
            dragElastic={{ left: 0.25, right: 0 }}
            dragSnapToOrigin
            onDrag={onDrag}
            onDragEnd={onDragEnd}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {listening ? (
                <motion.div key="live" className="absolute inset-0 flex items-center gap-2 pl-1 pr-1" {...swap}>
                  <button
                    type="button"
                    onClick={onCancel}
                    aria-label="Discard"
                    className="ring-focus flex size-7 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors duration-150 hover:bg-surface-3 hover:text-ink"
                  >
                    <Close size={13} />
                  </button>
                  <div className="relative h-full min-w-0 flex-1">
                    <AnimatePresence initial={false} mode="popLayout">
                      {armed ? (
                        <motion.span key="armed" className="absolute inset-0 flex items-center gap-1.5 text-footnote font-medium text-danger" {...swap}>
                          Release to discard
                        </motion.span>
                      ) : (
                        <motion.div key="wave" className="absolute inset-0" {...swap}>
                          <Wave level={level} tone={tone} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <span className="tnum flex w-11 shrink-0 items-center gap-1.5 font-mono text-caption text-ink-2">
                    <span className="size-1.5 rounded-full bg-danger motion-safe:animate-pulse" />
                    {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
                  </span>
                  <button ref={done} type="button" onClick={onStop} aria-label="Finish" className="ring-focus relative flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-surface">
                    <Check size={13} strokeWidth={2.8} />
                    <Ring progress={quiet} />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="mic"
                  ref={mic}
                  type="button"
                  aria-label="Dictate"
                  whileTap={press}
                  onPointerDown={down}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onStart()
                    }
                  }}
                  className="ring-focus absolute top-0 flex size-9 items-center justify-center rounded-full text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
                  style={{ right: BAR + 6 }}
                  {...swap}
                >
                  <Mic size={17} />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Send waits in its own slot and only appears with something to send. */}
          <AnimatePresence>
            {!listening && text.trim() && (
              <motion.button
                type="button"
                onClick={send}
                aria-label="Send"
                whileTap={press}
                className="ring-focus absolute right-2.5 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-surface"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.12 } }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <ArrowUp size={16} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Glow on={listening} layer="ring" radius={20} tone={tone} />
    </div>
  )
}

const swap = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, delay: 0.06, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
}

const words = (s: string) => s.split(/\s+/).filter(Boolean)

/**
 * The waveform scrolls from right to left: the newest sound enters at the right edge and
 * older sound drifts away and fades. Bars are written straight to the DOM each frame.
 */
function Wave({ level, tone }: { level: MotionValue<number>; tone: Tone }) {
  const bars = useRef<(HTMLSpanElement | null)[]>([])
  const history = useRef<number[]>(Array(BARS).fill(0))
  const smooth = useRef(0)
  const clock = useRef(0)
  useAnimationFrame((_, delta) => {
    smooth.current += (level.get() - smooth.current) * Math.min(1, delta / 60)
    clock.current += delta
    if (clock.current < 55) return
    clock.current = 0
    history.current.push(smooth.current)
    history.current.shift()
    history.current.forEach((v, i) => {
      const el = bars.current[i]
      if (el) el.style.height = `${3 + Math.min(1, v) * 20}px`
    })
  })
  return (
    <span className="absolute inset-0 flex items-center justify-between" style={{ maskImage: 'linear-gradient(to right, transparent, #000 30%)' }}>
      {Array.from({ length: BARS }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            bars.current[i] = el
          }}
          className="w-[2.5px] rounded-full"
          style={{ height: 3, background: tone === 'loud' ? aiInk(i / (BARS - 1)) : 'var(--ink-2)' }}
        />
      ))}
    </span>
  )
}

/** A thin ring around the check that fills while it's quiet. */
function Ring({ progress }: { progress: MotionValue<number> }) {
  const op = useTransform(progress, [0, 0.03], [0, 1])
  return (
    <motion.svg width="36" height="36" viewBox="0 0 36 36" className="pointer-events-none absolute -rotate-90" style={{ opacity: op }}>
      <motion.circle cx="18" cy="18" r="16.5" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" style={{ pathLength: progress }} />
    </motion.svg>
  )
}
