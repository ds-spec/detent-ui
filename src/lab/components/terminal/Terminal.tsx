'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, Copy } from '../../icons'
import { ease, spring } from '../../lib/motion'

type Tone = 'plain' | 'muted' | 'ok' | 'accent' | 'error'

export type Step =
  | { type: 'cmd'; text: string }
  | { type: 'out'; text: ReactNode; tone?: Tone; wait?: number; run?: () => void }
  /** A spinner that resolves into a check with how long it took. */
  | { type: 'task'; text: string; ms: number; start?: () => void; run?: () => void }
  | { type: 'pause'; ms: number }

type Line = { id: number; kind: 'cmd' | 'out' | 'task'; text: ReactNode; typed?: number; tone?: Tone; done?: boolean; took?: number }

const LINE = 20
const PAD = 14
const SPIN = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const TONE: Record<Tone, string> = { plain: 'text-ink', muted: 'text-ink-3', ok: 'text-ok', accent: 'text-accent', error: 'text-danger' }

const sleep = (ms: number, signal: { live: boolean }) => new Promise<void>((r, x) => setTimeout(() => (signal.live ? r() : x(new Error('stopped'))), ms))

/** Human typing: quick within words, a beat after spaces and punctuation, never perfectly even. */
const keyDelay = (c: string) => (c === ' ' ? 90 : /[-/.@]/.test(c) ? 70 : 28) + Math.random() * 46

/**
 * A terminal that plays a script. Commands are typed with a human rhythm, tasks spin on a
 * braille spinner and resolve into a check with their timing, and output streams in. It keeps
 * a fixed number of rows and scrolls like a real terminal, so it never changes size.
 * Steps can run a callback as they land, to drive other parts of the page.
 */
export function Terminal({
  steps,
  rows = 4,
  prompt = '$',
  loop = true,
  restartAfter = 3200,
  onRestart,
}: {
  steps: Step[]
  rows?: number
  prompt?: string
  loop?: boolean
  restartAfter?: number
  onRestart?: () => void
}) {
  const [lines, setLines] = useState<Line[]>([])
  const [typing, setTyping] = useState(false)
  // A prompt waits only before the first command and after the last step, never mid-run.
  const [idle, setIdle] = useState(true)
  const [frame, setFrame] = useState(0)
  const [fading, setFading] = useState(false)
  const reduce = useReducedMotion()
  const seq = useRef(0)
  const stepsRef = useRef(steps)
  stepsRef.current = steps
  const restartRef = useRef(onRestart)
  restartRef.current = onRestart

  // Spinner frames tick only while something is spinning.
  const spinning = lines.some((l) => l.kind === 'task' && !l.done)
  useEffect(() => {
    if (!spinning) return
    const t = setInterval(() => setFrame((f) => (f + 1) % SPIN.length), 80)
    return () => clearInterval(t)
  }, [spinning])

  useEffect(() => {
    const signal = { live: true }
    const patch = (id: number, p: Partial<Line>) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...p } : l)))

    const play = async () => {
      for (;;) {
        for (const step of stepsRef.current) {
          const id = ++seq.current
          if (step.type === 'pause') await sleep(step.ms, signal)
          else if (step.type === 'cmd') {
            setIdle(false)
            setLines((ls) => [...ls, { id, kind: 'cmd', text: step.text, typed: reduce ? step.text.length : 0 }])
            setTyping(true)
            if (!reduce) {
              await sleep(260, signal)
              for (let i = 1; i <= step.text.length; i++) {
                await sleep(keyDelay(step.text[i - 1]), signal)
                patch(id, { typed: i })
              }
            }
            await sleep(320, signal)
            setTyping(false)
          } else if (step.type === 'task') {
            setLines((ls) => [...ls, { id, kind: 'task', text: step.text }])
            step.start?.()
            const start = performance.now()
            await sleep(step.ms, signal)
            patch(id, { done: true, took: Math.round(performance.now() - start) })
            step.run?.()
            await sleep(120, signal)
          } else {
            await sleep(step.wait ?? 140, signal)
            setLines((ls) => [...ls, { id, kind: 'out', text: step.text, tone: step.tone }])
            step.run?.()
          }
        }
        setIdle(true)
        if (!loop) return
        await sleep(restartAfter, signal)
        setFading(true)
        await sleep(360, signal)
        setLines([])
        setFading(false)
        restartRef.current?.()
        await sleep(500, signal)
      }
    }
    play().catch(() => {})
    return () => {
      signal.live = false
    }
  }, [loop, restartAfter, reduce])

  // Older lines slide up and out of a soft top edge, the way a terminal scrolls.
  const shift = Math.max(0, lines.length + (idle ? 1 : 0) - rows) * LINE

  return (
    <div className="relative overflow-hidden font-mono text-footnote leading-5" style={{ height: rows * LINE + PAD * 2 }} aria-live="polite">
      <motion.div
        className="absolute inset-x-0 top-0"
        style={{ padding: PAD, maskImage: shift ? `linear-gradient(to bottom, transparent ${PAD}px, black ${PAD + LINE}px)` : undefined }}
        animate={{ y: -shift, opacity: fading ? 0 : 1 }}
        transition={{ y: spring.smooth, opacity: { duration: 0.3, ease: ease.out } }}
      >
        <AnimatePresence initial={false}>
          {lines.map((l) => (
            <motion.div
              key={l.id}
              className="flex h-5 items-center gap-2.5 whitespace-pre"
              initial={l.kind === 'cmd' ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: ease.out }}
            >
              {l.kind === 'cmd' ? (
                <>
                  <span className="text-ink-3">{prompt}</span>
                  <span className="text-ink">
                    {typing && l.typed !== undefined && l.id === lines[lines.length - 1]?.id && <Caret at={l.typed} />}
                    {String(l.text).slice(0, l.typed)}
                  </span>
                </>
              ) : l.kind === 'task' ? (
                <>
                  <span className={`w-[1ch] ${l.done ? 'text-ok' : 'text-ink-3'}`}>{l.done ? '✓' : SPIN[frame]}</span>
                  <span className={l.done ? 'text-ink' : 'text-ink-2'}>{l.text}</span>
                  <AnimatePresence>
                    {l.done && (
                      <motion.span className="text-ink-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                        {l.took}ms
                      </motion.span>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <span className={TONE[l.tone ?? 'muted']}>{l.text}</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {/* The idle prompt, waiting for the next command. */}
        {idle && (
          <div className="flex h-5 items-center gap-2.5">
            <span className="text-ink-3">{prompt}</span>
            <Caret />
          </div>
        )}
      </motion.div>
    </div>
  )
}

/**
 * The block caret, as tall as the prompt's glyphs and centred on them. Typing, it sits at the start
 * of the line taking no room and is carried to the end of what's typed by transform (one ch a
 * character, the type is monospace), so it moves on screen without moving in the layout.
 */
function Caret({ at }: { at?: number }) {
  return (
    <span
      aria-hidden
      className={`ml-px inline-block h-[13px] w-[7px] bg-ink/80 motion-safe:animate-[caret_1.05s_infinite] ${at === undefined ? '-translate-y-[0.5px]' : '-mr-2'}`}
      style={at === undefined ? undefined : { translate: `${at}ch 2px` }}
    />
  )
}

/**
 * A command to copy, the way docs should offer it. Copying sweeps a selection across the
 * command so you see exactly what you took, and the icon turns into a check.
 */
export function CopyCommand({ command, prompt = '$' }: { command: string; prompt?: string }) {
  const [copied, setCopied] = useState(0)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command)
    } catch {
      /* Clipboard blocked: the sweep still shows what to copy by hand. */
    }
    setCopied((n) => n + 1)
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(0), 1600)
  }
  return (
    <div className="inline-flex h-10 items-center gap-2.5 rounded-full bg-surface pl-4 pr-1 font-mono text-footnote shadow-float">
      <span className="text-ink-3">{prompt}</span>
      <span className="relative text-ink">
        <AnimatePresence>
          {copied > 0 && (
            <motion.span
              key={copied}
              aria-hidden
              className="absolute -inset-x-1 -inset-y-0.5 origin-left rounded-[4px]"
              style={{ background: 'color-mix(in oklch, var(--accent) 28%, transparent)' }}
              initial={{ scaleX: 0, opacity: 1 }}
              animate={{ scaleX: 1, opacity: 1, transition: { duration: 0.26, ease: ease.out } }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
            />
          )}
        </AnimatePresence>
        <span className="relative">{command}</span>
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy command'}
        className="ring-focus relative flex size-8 items-center justify-center rounded-full text-ink-3 transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={copied ? 'check' : 'copy'}
            className={`flex ${copied ? 'text-ok' : ''}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.18, ease: ease.out }}
          >
            {copied ? <Check size={15} strokeWidth={2.6} /> : <Copy size={15} style={{ ['--icon-cutout' as string]: 'var(--surface)' }} />}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  )
}
