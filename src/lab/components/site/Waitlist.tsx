'use client'

import { tap } from '../../lib/feel'
import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { Ref } from 'react'
import { AnimatePresence, animate, motion, useAnimationControls } from 'motion/react'
import { ease, press, spring } from '../../lib/motion'
import { RollingText } from '../../ui/RollingText'
import { Spinner } from '../../ui/Spinner'
import { ArrowRight } from '../../icons'
import { Avatar } from '../../ui/Avatar'

type State = 'idle' | 'loading' | 'done'
export type WaitlistHandle = { type(email: string): void; submit(): void; reset(): void }

const PEOPLE = [
  { name: 'Maya Chen', hue: 25 },
  { name: 'Jonas Weber', hue: 250 },
  { name: 'Aiko Tanaka', hue: 150 },
]

export function Waitlist({
  joined = 1283,
  onJoin,
  placeholder = 'you@company.com',
  action = 'Join waitlist',
  done = 'We’ll email you the moment your invite is ready.',
  ref,
}: {
  joined?: number
  onJoin?: (email: string) => Promise<void> | void
  placeholder?: string
  action?: string
  done?: string
  ref?: Ref<WaitlistHandle>
}) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState(false)
  const [focused, setFocused] = useState(false)
  const [spot, setSpot] = useState(joined - 36)
  const shake = useAnimationControls()
  const input = useRef<HTMLInputElement>(null)
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
  const quiet = useRef(false)

  useEffect(() => {
    if (state !== 'done') return
    const ctl = animate(joined - 36, joined + 1, { duration: 1.1, ease: ease.out, onUpdate: (v) => setSpot(Math.round(v)) })
    return () => ctl.stop()
  }, [state, joined])

  const submit = async () => {
    if (state !== 'idle') return
    if (!valid) {
      setError(true)
      shake.start({ x: [0, -6, 5, -3, 2, 0], transition: { duration: 0.38, ease: 'easeOut' } })
      if (!quiet.current) input.current?.focus()
      return
    }
    setState('loading')
    await Promise.all([onJoin?.(email), new Promise((r) => setTimeout(r, 900))])
    setState('done')
  }

  const latest = useRef(submit)
  useLayoutEffect(() => {
    latest.current = submit
  })
  useImperativeHandle(ref, () => ({
    type: (e) => {
      quiet.current = true
      setEmail(e)
      setError(false)
    },
    submit: () => {
      quiet.current = true
      latest.current()
    },
    reset: () => {
      setEmail('')
      setError(false)
      setState('idle')
      setSpot(joined - 36)
    },
  }))

  return (
    <div className="@container w-[420px] max-w-full">
      <motion.div animate={shake}>
        <motion.form
          layout
          transition={spring.smooth}
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className="relative flex h-[52px] items-center overflow-hidden bg-surface p-1.5"
          style={{
            borderRadius: 26,
            boxShadow: error ? 'var(--elev-field-error), var(--elev-raised)' : focused || (quiet.current && email && state === 'idle') ? 'var(--elev-field), var(--elev-float)' : 'var(--elev-float)',
            transition: 'box-shadow 200ms',
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {state !== 'done' ? (
              <motion.div key="form" className="flex flex-1 items-center" exit={{ opacity: 0, filter: 'blur(4px)', transition: { duration: 0.15 } }}>
                <input
                  ref={input}
                  type="email"
                  value={email}
                  disabled={state === 'loading'}
                  aria-label="Email address"
                  aria-invalid={error}
                  placeholder={placeholder}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(false)
                  }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  className="h-10 min-w-0 flex-1 bg-transparent px-3.5 text-callout text-ink outline-none placeholder:text-ink-3 disabled:opacity-60"
                />
                <motion.button
                  layout
                  dir="rtl"
                  type="submit"
                  whileTap={state === 'idle' ? press : undefined}
                  transition={spring.smooth}
                  aria-label={state === 'loading' ? 'Joining' : action}
                  onPointerDown={() => state === 'idle' && tap()}
                  className="sink ring-focus flex h-10 shrink-0 items-center justify-center gap-1.5 overflow-hidden bg-ink text-callout font-medium text-surface transition-colors duration-150 hover:bg-[color-mix(in_oklch,var(--ink),var(--surface)_14%)]"
                  style={{ borderRadius: 20, width: state === 'loading' ? 40 : 'auto', paddingInline: state === 'loading' ? 0 : 16 }}
                >
                  {state !== 'loading' && (
                    <span dir="ltr" className="flex items-center gap-1.5 whitespace-nowrap">
                      {action}
                      <ArrowRight size={15} className={valid ? 'translate-x-0.5 transition-transform' : 'transition-transform'} />
                    </span>
                  )}
                  <AnimatePresence initial={false}>
                    {state === 'loading' && (
                      <motion.span key="spin" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                        <Spinner />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="done"
                className="flex flex-1 items-center gap-3 pl-1.5 pr-4"
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)', transition: { duration: 0.3, delay: 0.08 } }}
              >
                <div className="flex -space-x-2">
                  {PEOPLE.map((p, i) => (
                    <motion.span
                      key={p.name}
                      initial={{ x: 10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ ...spring.snappy, delay: 0.1 + i * 0.04 }}
                      className="rounded-full @max-[300px]:hidden"
                      style={{ boxShadow: '0 0 0 2px var(--surface)' }}
                    >
                      <Avatar name={p.name} hue={p.hue} size={32} />
                    </motion.span>
                  ))}
                  <motion.span
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', bounce: 0.45, duration: 0.55, delay: 0.32 }}
                    className="flex size-8 items-center justify-center rounded-full bg-ink text-caption font-semibold text-surface"
                    style={{ boxShadow: '0 0 0 2px var(--surface)' }}
                    title={email}
                  >
                    {email[0]?.toUpperCase()}
                  </motion.span>
                </div>
                <span className="whitespace-nowrap text-callout text-ink-2">
                  You’re{' '}
                  <span className="font-semibold text-ink">
                    <RollingText text={`#${spot.toLocaleString('en-US')}`} />
                  </span>{' '}
                  on the list
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>
      </motion.div>

      <div className="relative h-7 @max-[340px]:h-12">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={state === 'done' ? 'done' : error ? 'error' : 'hint'}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 3 }}
            transition={{ duration: 0.2, ease: ease.out }}
            className={`px-4 pt-2.5 text-footnote ${error ? 'text-danger' : 'text-ink-3'}`}
          >
            {state === 'done'
              ? done
              : error
                ? 'That email doesn’t look quite right.'
                : `Join ${joined.toLocaleString('en-US')} people waiting for early access.`}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
