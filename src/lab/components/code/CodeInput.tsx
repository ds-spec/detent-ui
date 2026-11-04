'use client'

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { Ref } from 'react'
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'motion/react'
import { Check } from '../../icons'
import { useSize } from '../../lib/hooks'
import { ease, spring } from '../../lib/motion'
import { RollingText } from '../../ui/RollingText'
import { Bloom, DrawnCheck, Sweep } from '../../ui/Outcome'

const CELL = 52
const H = 60
const GAP = 8
const SPLIT = 18

type Status = 'idle' | 'checking' | 'error' | 'done'
export type CodeHandle = { type(code: string): void }

export function CodeInput({
  length = 6,
  onVerify,
  onVerified,
  resendAfter = 30,
  onResend,
  ref,
}: {
  length?: number
  onVerify: (code: string) => Promise<boolean> | boolean
  onVerified?: () => void
  resendAfter?: number
  onResend?: () => void
  ref?: Ref<CodeHandle>
}) {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [focused, setFocused] = useState(false)
  const [pasteFrom, setPasteFrom] = useState(-1)
  const [clearing, setClearing] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const row = useAnimationControls()
  const [driven, setDriven] = useState(false)
  const drivenRef = useRef(false)
  const reduce = useReducedMotion()
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const half = length % 2 === 0 ? length / 2 : -1
  const box = useRef<HTMLDivElement>(null)
  const { w: room } = useSize(box)
  const gaps = (length - 1) * GAP + (half > 0 ? SPLIT - GAP : 0)
  const cell = room ? Math.max(32, Math.min(CELL, (room - gaps) / length)) : CELL
  const x = (i: number) => i * (cell + GAP) + (half > 0 && i >= half ? SPLIT - GAP : 0)
  const width = x(length - 1) + cell
  const fused = width / length

  const verify = async (code: string) => {
    setStatus('checking')
    const ok = await onVerify(code)
    if (!alive.current) return
    if (ok) {
      setStatus('done')
      onVerified?.()
      return
    }
    setStatus('error')
    if (!reduce) row.start({ x: [0, -7, 6, -4, 3, 0], transition: { duration: 0.36, ease: ease.out } })
    window.setTimeout(() => {
      if (!alive.current) return
      setClearing(true)
      setValue('')
      if (!drivenRef.current) input.current?.focus()
      window.setTimeout(() => setClearing(false), 60 * length + 300)
    }, 650)
  }

  const change = (raw: string) => {
    if (status === 'checking' || status === 'done') return
    const next = raw.replace(/\D/g, '').slice(0, length)
    if (status === 'error' && next.length > value.length) setStatus('idle')
    setPasteFrom(next.length - value.length > 1 ? value.length : -1)
    setValue(next)
    if (next.length === length) verify(next)
  }

  const latest = useRef(change)
  useLayoutEffect(() => {
    latest.current = change
  })
  useImperativeHandle(ref, () => ({
    type: (code) => {
      drivenRef.current = true
      setDriven(true)
      latest.current(code)
    },
  }))

  const active = Math.min(value.length, length - 1)
  const showRing = (focused || driven) && (status === 'idle' || status === 'error') && value.length < length
  const done = status === 'done'

  return (
    <div ref={box} style={{ width: length * CELL + gaps, maxWidth: '100%' }}>
      <motion.div animate={row} className="relative" style={{ height: H }}>
        <motion.div
          className="absolute inset-0 overflow-hidden rounded-row"
          initial={false}
          animate={{ opacity: done ? 1 : 0 }}
          transition={{ duration: 0.25, delay: done ? 0.12 : 0, ease: ease.out }}
          style={{ background: 'color-mix(in oklch, var(--ok) 11%, var(--surface))', boxShadow: '0 0 0 1px color-mix(in oklch, var(--ok) 22%, transparent)' }}
        >
          <Sweep k={done ? 'verified' : null} delay={0.42} />
        </motion.div>
        <Bloom k={done ? 'verified' : null} radius="var(--radius-row)" delay={0.36} />

        {Array.from({ length }, (_, i) => {
          const ch = value[i]
          const first = i === 0
          const last = i === length - 1
          const r = (on: boolean) => (on ? 14 : done ? 0 : 14)
          return (
            <motion.div
              key={i}
              className="absolute top-0 flex items-center justify-center overflow-hidden bg-surface"
              initial={false}
              animate={{
                left: done ? i * fused : x(i),
                width: done ? fused : cell,
                borderTopLeftRadius: r(first),
                borderBottomLeftRadius: r(first),
                borderTopRightRadius: r(last),
                borderBottomRightRadius: r(last),
                opacity: done ? 0 : 1,
                boxShadow:
                  status === 'error'
                    ? '0 0 0 1.5px color-mix(in oklch, var(--danger) 60%, transparent), 0 1px 2px rgb(0 0 0 / 0.05)'
                    : done
                      ? '0 0 0 0px transparent, 0 0 0 0 transparent'
                      : 'var(--elev-raised)',
              }}
              transition={{ ...spring.smooth, opacity: { duration: 0.2, delay: done ? 0.22 : 0, ease: ease.out }, boxShadow: { duration: 0.2, ease: ease.out } }}
              style={{ height: H }}
            >
              <AnimatePresence initial={false} custom={clearing ? (length - 1 - i) * 0.05 : 0}>
                {ch && (
                  <motion.span
                    key={`${i}${ch}`}
                    className={`tnum text-large ${status === 'error' ? 'text-danger' : 'text-ink'}`}
                    variants={{
                      in: { opacity: 0, y: 10 },
                      show: (s: number) => ({ opacity: 1, y: 0, transition: { duration: 0.22, ease: ease.out, delay: s } }),
                      out: (d: number) => ({ opacity: 0, y: -10, transition: { duration: 0.18, ease: ease.out, delay: d } }),
                    }}
                    custom={pasteFrom >= 0 && i >= pasteFrom ? (i - pasteFrom) * 0.045 : 0}
                    initial="in"
                    animate="show"
                    exit="out"
                  >
                    <motion.span
                      className="block"
                      animate={status === 'checking' && !reduce ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                      transition={status === 'checking' ? { duration: 0.9, repeat: Infinity, delay: i * 0.09, ease: ease.inOut } : { duration: 0.15, ease: ease.out }}
                    >
                      {ch}
                    </motion.span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}

        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-0 flex items-center justify-center rounded-row"
          style={{
            width: cell,
            height: H,
            boxShadow: `0 0 0 1.5px color-mix(in oklch, var(${status === 'error' ? '--danger' : '--accent'}) 65%, transparent), 0 0 0 5px color-mix(in oklch, var(${status === 'error' ? '--danger' : '--accent'}) 14%, transparent)`,
          }}
          initial={false}
          animate={{ x: x(active), opacity: showRing ? 1 : 0 }}
          transition={{ x: spring.snappy, opacity: { duration: 0.15, ease: ease.out } }}
        >
          <span className="h-6 w-[2px] rounded-full bg-ink motion-safe:animate-[caret_1.05s_infinite]" />
        </motion.div>

        <AnimatePresence>
          {done && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center gap-2 text-callout font-semibold text-[color-mix(in_oklch,var(--ok),var(--ink)_30%)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.3, duration: 0.26, ease: ease.out } }}
            >
              <motion.span
                className="flex size-[22px] items-center justify-center rounded-full bg-ok text-white"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1, transition: { ...spring.pop, delay: 0.32 } }}
              >
                <DrawnCheck size={13} delay={0.5} />
              </motion.span>
              Verified
            </motion.div>
          )}
        </AnimatePresence>

        <input
          ref={input}
          value={value}
          onChange={(e) => change(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSelect={(e) => {
            const el = e.currentTarget
            if (el.selectionStart !== el.value.length) el.setSelectionRange(el.value.length, el.value.length)
          }}
          disabled={status === 'checking' || done}
          autoComplete="one-time-code"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={length}
          aria-label={`${length}-digit code`}
          aria-invalid={status === 'error'}
          className="absolute inset-0 z-10 w-full cursor-text bg-transparent text-transparent caret-transparent opacity-0 outline-none disabled:cursor-default"
          style={{ fontSize: 16 }}
        />
      </motion.div>

      <Footer status={status} resendAfter={resendAfter} onResend={onResend} />
    </div>
  )
}

function Footer({ status, resendAfter, onResend }: {
  status: Status
  resendAfter: number
  onResend?: () => void
}) {
  const [left, setLeft] = useState(resendAfter)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (left <= 0) return
    const t = window.setTimeout(() => setLeft((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [left])

  const resend = () => {
    onResend?.()
    setSent(true)
    window.setTimeout(() => {
      setSent(false)
      setLeft(resendAfter)
    }, 1800)
  }

  const key = status === 'error' ? 'error' : status === 'checking' ? 'checking' : status === 'done' ? 'done' : sent ? 'sent' : left > 0 ? 'wait' : 'resend'

  return (
    <div className="relative mt-4 h-6 text-footnote" aria-live="polite">
      <AnimatePresence initial={false}>
        <motion.div
          key={key}
          className="absolute inset-0 flex items-center gap-1.5 whitespace-nowrap"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2, ease: ease.out }}
        >
          {key === 'error' && <span className="text-danger">That code didn’t work. Try again.</span>}
          {key === 'checking' && <span className="sheen">Checking your code</span>}
          {key === 'done' && <span className="text-ink-2">You’re in.</span>}
          {key === 'sent' && (
            <span className="flex items-center gap-1.5 text-ink-2">
              <Check size={14} strokeWidth={2.6} className="text-ok" />
              New code sent
            </span>
          )}
          {key === 'wait' && (
            <span className="flex items-center gap-1 text-ink-3">
              Didn’t get it? Resend in <RollingText text={`0:${String(left).padStart(2, '0')}`} />
            </span>
          )}
          {key === 'resend' && (
            <span className="text-ink-3">
              Didn’t get it?{' '}
              <button
                type="button"
                onClick={resend}
                className="ring-focus rounded-[4px] font-medium text-ink underline decoration-line-strong underline-offset-[3px] transition-colors hover:decoration-ink"
              >
                Send a new code
              </button>
            </span>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
