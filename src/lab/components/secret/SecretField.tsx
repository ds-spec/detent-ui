'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useReducedMotion } from 'motion/react'
import { Check, Copy } from '../../icons'
import { tap } from '../../lib/feel'
import { spring } from '../../lib/motion'

const SECONDS = 0.72

function Key({ value, lead, tail, shown }: { value: string; lead: number; tail: number; shown: number }) {
  const reduce = useReducedMotion()
  const code = useRef<HTMLElement>(null)
  // A narrow field folds the hidden middle shorter, so the end of the key is never cut off.
  const [skip, setSkip] = useState(0)
  useLayoutEffect(() => {
    const field = code.current?.parentElement
    if (!field) return
    const fit = () => {
      const room = field.clientWidth - 24
      const char = code.current?.firstElementChild?.getBoundingClientRect().width || 7.2
      setSkip(Math.max(0, value.length - Math.floor(room / char)))
    }
    fit()
    const watch = new ResizeObserver(fit)
    watch.observe(field)
    return () => watch.disconnect()
  }, [value])
  return (
    <code ref={code} aria-label={`Key ending ${value.slice(-tail)}`} className="flex min-w-0 font-mono text-[12px] leading-[20px]">
      {[...value].map((ch, i) => {
        if (i >= lead && i < lead + skip) return null
        const open = i < lead || i >= value.length - tail
        const up = open || i < shown
        return (
          <span key={i} aria-hidden className="relative h-5 w-[1ch] shrink-0 overflow-hidden">
            <motion.span className="absolute inset-x-0 top-0 flex flex-col items-center" initial={false} animate={{ y: up ? -20 : 0 }} transition={reduce ? { duration: 0 } : spring.snappy}>
              <span className="h-5 text-ink-3 opacity-50">•</span>
              <span className={`h-5 ${open ? 'text-ink-3' : 'text-ink'}`}>{ch}</span>
            </motion.span>
          </span>
        )
      })}
    </code>
  )
}

/**
 * An API key you read by holding on. Press and the key turns over one character at a time, left to
 * right, for as long as you hold; let go and it folds away at once. There's no "show" state to
 * leave on while someone looks over your shoulder, and copying never needs it revealed.
 */
export function SecretField({
  name,
  scope,
  value,
  used,
  lead = 5,
  tail = 4,
  copiedLabel = 'Copied',
  onCopy,
}: {
  /** What the key is for. */
  name: string
  /** A short note on the right, like its access level. */
  scope?: string
  /** The key. */
  value: string
  /** The quiet line under it, like when it was last used. */
  used?: string
  /** Characters always shown at the start. */
  lead?: number
  /** Characters always shown at the end. */
  tail?: number
  /** The line shown after copying. */
  copiedLabel?: string
  /** Called after the key is copied. */
  onCopy?: () => void
}) {
  const [shown, setShown] = useState(0)
  const [holding, setHolding] = useState(false)
  const [copied, setCopied] = useState(false)
  const reduce = useReducedMotion()
  const run = useRef<ReturnType<typeof animate> | null>(null)
  const timer = useRef(0)
  useEffect(
    () => () => {
      run.current?.stop()
      clearTimeout(timer.current)
    },
    [],
  )

  const hold = () => {
    tap()
    setHolding(true)
    run.current?.stop()
    run.current = animate(0, value.length, { duration: reduce ? 0 : SECONDS, ease: 'linear', onUpdate: (v) => setShown(Math.ceil(v)) })
  }
  const release = () => {
    run.current?.stop()
    setHolding(false)
    setShown(0)
  }
  const copy = () => {
    tap()
    void navigator.clipboard.writeText(value)
    setCopied(true)
    onCopy?.()
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1800)
  }

  const say = copied ? { k: 'copied', t: copiedLabel } : holding ? { k: 'held', t: 'Hides again when you let go' } : { k: 'idle', t: used ?? '' }

  return (
    <div className="w-[380px] max-w-full">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-callout text-ink">{name}</p>
        {scope ? <p className="text-footnote text-ink-3">{scope}</p> : null}
      </div>
      <div className="mt-2.5 flex items-center gap-1">
        <button
          type="button"
          aria-label={`Hold to read the ${name} key`}
          onPointerDown={hold}
          onPointerUp={release}
          onPointerLeave={release}
          onPointerCancel={release}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if ((e.key !== ' ' && e.key !== 'Enter') || e.repeat) return
            e.preventDefault()
            hold()
          }}
          onKeyUp={release}
          onBlur={release}
          className={`ring-focus flex h-10 min-w-0 flex-1 touch-none select-none items-center overflow-hidden rounded-[11px] px-3 transition-[background-color,transform] duration-150 active:scale-[0.97] ${holding ? 'bg-surface-3' : 'bg-surface-2 hover:bg-surface-3'}`}
        >
          <Key value={value} lead={lead} tail={tail} shown={shown} />
        </button>
        <button type="button" onClick={copy} aria-label={copied ? 'Copied' : `Copy the ${name} key`} className="ring-focus grid size-10 shrink-0 place-items-center rounded-[11px] text-ink-3 transition-[color,background-color,transform] duration-150 hover:bg-surface-2 hover:text-ink active:scale-[0.97]">
          {copied ? <Check size={14} strokeWidth={2.6} className="text-[var(--ok)]" /> : <Copy size={14} style={{ ['--icon-cutout' as string]: 'var(--surface)' }} />}
        </button>
      </div>
      <div className="relative mt-2 h-[18px] overflow-hidden text-footnote text-ink-3">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.p key={say.k} className="absolute inset-x-0" initial={reduce ? false : { y: 18 }} animate={{ y: 0 }} exit={reduce ? undefined : { y: -18 }} transition={spring.snappy}>
            {say.t}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}

