'use client'

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, Ref } from 'react'
import { AnimatePresence, motion, useAnimationFrame, useMotionValue, useTransform } from 'motion/react'
import type { MotionValue, PanInfo } from 'motion/react'
import { ArrowUp, Check, Close, Mic } from '../../icons'
import { useSize } from '../../lib/hooks'
import { ease, press, spring } from '../../lib/motion'

export type VoiceState = 'idle' | 'listening'
export type VoiceHandle = { send(): void }

const W = 440
const BAR = 36
const COLS = 30
const ROWS = 5
const CANCEL_AT = -72

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
  state: VoiceState
  level: MotionValue<number>
  text: string
  interim: string
  onTextChange: (t: string) => void
  onStart: () => void
  onStop: () => void
  onCancel: () => void
  onSend: (t: string) => void
  autoStop?: number
  placeholder?: string
  ref?: Ref<VoiceHandle>
}) {
  const listening = state === 'listening'
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

  useEffect(() => {
    if (!listening) return
    const t0 = performance.now()
    const tick = () => setElapsed(Math.floor((performance.now() - t0) / 1000))
    const first = setTimeout(tick)
    const t = setInterval(tick, 250)
    if (root.current?.contains(document.activeElement)) done.current?.focus({ preventScroll: true })
    return () => {
      clearTimeout(first)
      clearInterval(t)
    }
  }, [listening])

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

  const slot = text.trim() ? BAR + 6 : 0
  const committed = words(text)
  const heard = words(interim)

  return (
    <div ref={frame} className="relative w-[440px] max-w-full">
      <div ref={root} onKeyDown={onKey} className="relative w-full overflow-hidden rounded-[20px] bg-surface shadow-float">
        <div
          ref={box}
          className="relative h-[108px] overflow-y-auto px-4 pt-3.5 text-callout leading-6"
          style={{ scrollbarWidth: 'none', maskImage: 'linear-gradient(to bottom, transparent, #000 14px)' }}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div key={sent} className="relative min-h-full" exit={{ opacity: 0, y: -14, transition: { duration: 0.28, ease: ease.out } }}>
              {listening ? (
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

          <motion.div
            className="absolute top-1/2 z-10 -translate-y-1/2 overflow-hidden"
            initial={false}
            animate={{
              clipPath: listening ? `inset(0px 0px 0px 0px round ${BAR / 2}px)` : `inset(0px ${slot}px 0px ${w - 20 - BAR - slot}px round ${BAR / 2}px)`,
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
                    className="ring-focus flex size-7 pointer-coarse:size-9 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors duration-150 hover:bg-surface-3 hover:text-ink"
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
                          <Meter level={level} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <span className="tnum flex w-[52px] shrink-0 items-center gap-1.5 text-footnote text-ink-2">
                    <LiveMic level={level} />
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
                  className="ring-focus absolute top-0 flex size-9 items-center justify-center rounded-full bg-surface-2 text-ink transition-colors duration-150 hover:bg-surface-3"
                  {...swap}
                  animate={{ ...(swap.animate as object), right: slot }}
                  style={{ right: slot }}
                >
                  <Mic size={17} />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

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
    </div>
  )
}

const swap = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, delay: 0.06, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
}

const words = (s: string) => s.split(/\s+/).filter(Boolean)

function Meter({ level }: { level: MotionValue<number> }) {
  const dots = useRef<(HTMLSpanElement | null)[]>([])
  const history = useRef<number[]>(Array(COLS).fill(0))
  const smooth = useRef(0)
  const clock = useRef(0)
  useAnimationFrame((_, delta) => {
    smooth.current += (level.get() - smooth.current) * Math.min(1, delta / 60)
    clock.current += delta
    if (clock.current < 70) return
    clock.current = 0
    history.current.push(smooth.current)
    history.current.shift()
    history.current.forEach((v, c) => {
      const reach = v < 0.06 ? -1 : v < 0.3 ? 0 : v < 0.6 ? 1 : 2
      for (let r = 0; r < ROWS; r++) {
        const el = dots.current[r * COLS + c]
        if (el) el.style.opacity = Math.abs(r - 2) <= reach ? '1' : Math.abs(r - 2) === 0 ? '0.32' : '0.12'
      }
    })
  })
  return (
    <span className="absolute inset-0 grid content-center items-center justify-between gap-y-[2.5px]" style={{ gridTemplateColumns: `repeat(${COLS}, 3px)`, maskImage: 'linear-gradient(to right, transparent, #000 28%)' }}>
      {Array.from({ length: ROWS * COLS }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            dots.current[i] = el
          }}
          className="size-[3px] rounded-full bg-ink transition-opacity duration-100"
          style={{ opacity: Math.floor(i / COLS) === 2 ? 0.32 : 0.12 }}
        />
      ))}
    </span>
  )
}

function LiveMic({ level }: { level: MotionValue<number> }) {
  const fill = useRef<SVGRectElement>(null)
  const smooth = useRef(0)
  useAnimationFrame((_, delta) => {
    smooth.current += (Math.min(1, level.get() * 1.3) - smooth.current) * Math.min(1, delta / 50)
    const h = 1.5 + smooth.current * 7.5
    fill.current?.setAttribute('y', String(11 - h))
    fill.current?.setAttribute('height', String(h))
  })
  return (
    <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" className="shrink-0">
      <defs>
        <clipPath id="live-mic-capsule">
          <rect x="5" y="1.5" width="6" height="9.5" rx="3" />
        </clipPath>
      </defs>
      <rect ref={fill} x="5" y="9.5" width="6" height="1.5" fill="var(--accent)" clipPath="url(#live-mic-capsule)" />
      <rect x="5" y="1.5" width="6" height="9.5" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.75 7.75a5.25 5.25 0 0 0 10.5 0M8 13v1.75" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function Ring({ progress }: { progress: MotionValue<number> }) {
  const op = useTransform(progress, [0, 0.03], [0, 1])
  return (
    <motion.svg width="36" height="36" viewBox="0 0 36 36" className="pointer-events-none absolute -rotate-90" style={{ opacity: op }}>
      <motion.circle cx="18" cy="18" r="16.5" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" style={{ pathLength: progress }} />
    </motion.svg>
  )
}
