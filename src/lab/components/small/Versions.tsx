'use client'

import { useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode, Ref } from 'react'
import { AnimatePresence, animate, motion, useMotionValue } from 'motion/react'
import { ArrowLeft, ArrowRight, Refresh } from '../../icons'
import { tap } from '../../lib/feel'
import { ease, press } from '../../lib/motion'
import { RollingText } from '../../ui/RollingText'

/** For demos and tests: step and regenerate without touching focus. */
export type VersionsHandle = { prev(): void; next(): void; regenerate(): void }

/**
 * A reply and its versions. Regenerate spins once, a quiet shimmer keeps the reply's place,
 * and the new version slides in while the count rolls on. The arrows step back through
 * earlier versions, each arriving from the side you stepped toward. The reply's box springs to
 * each version's height, so nothing outside it moves, and the controls ride that height by
 * transform rather than being pushed. ← → step, R regenerates.
 */
export function Versions({ initial, generate, ref }: {
  /** The versions so far, oldest first. The newest is shown. */
  initial: string[]
  /** Makes version n. Resolve with its text; the shimmer holds the reply's place until then. */
  generate: (n: number) => Promise<string>
  ref?: Ref<VersionsHandle>
}) {
  const [list, setList] = useState(initial)
  const [at, setAt] = useState(initial.length - 1)
  const [dir, setDir] = useState(1)
  const [busy, setBusy] = useState(false)
  const [spins, setSpins] = useState(0)

  const go = (d: number) => {
    const n = at + d
    if (busy || n < 0 || n >= list.length) return
    setDir(d)
    setAt(n)
  }
  const regenerate = async () => {
    if (busy) return
    const n = list.length
    setSpins((s) => s + 1)
    setBusy(true)
    setDir(1)
    const text = await generate(n)
    setList((l) => [...l, text])
    setAt(n)
    setBusy(false)
  }
  const latest = useRef({ go, regenerate })
  useLayoutEffect(() => {
    latest.current = { go, regenerate }
  })
  useImperativeHandle(ref, () => ({ prev: () => latest.current.go(-1), next: () => latest.current.go(1), regenerate: () => latest.current.regenerate() }), [])

  // The box follows the text's height on a spring.
  const inner = useRef<HTMLDivElement>(null)
  const h = useMotionValue(0)
  useLayoutEffect(() => {
    const el = inner.current
    if (!el) return
    let first = true
    const ro = new ResizeObserver(() => {
      if (first) h.set(el.offsetHeight)
      else animate(h, el.offsetHeight, { type: 'spring', stiffness: 380, damping: 36 })
      first = false
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [h])

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') go(-1)
    else if (e.key === 'ArrowRight') go(1)
    else if (e.key.toLowerCase() === 'r') regenerate()
    else return
    e.preventDefault()
  }

  return (
    <div tabIndex={0} onKeyDown={onKey} aria-label="Reply, with versions" className="ring-focus relative w-[360px] max-w-full rounded-[24px] bg-surface p-5 shadow-float">
      <motion.div className="relative overflow-hidden" style={{ height: h }}>
        <div ref={inner}>
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.div
              key={busy ? 'busy' : at}
              custom={dir}
              variants={{
                in: (d: number) => ({ opacity: 0, x: d * 20 }),
                at: { opacity: 1, x: 0 },
                out: (d: number) => ({ opacity: 0, x: d * -20 }),
              }}
              initial="in"
              animate="at"
              exit="out"
              transition={{ duration: 0.32, ease: ease.out }}
              aria-live="polite"
            >
              {busy ? (
                // Three placeholder lines on the reply's own line height, so the box hardly moves.
                <div aria-label="Writing a new version">
                  {[92, 100, 64].map((w, i) => (
                    <span key={i} className="flex h-[23px] items-center">
                      <span className="sheen-bar block h-3 rounded-full" style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }} />
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-body text-ink">{list[at]}</p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* The controls' room in the card. They sit at the top and are carried down by the reply's height. */}
      <div className="h-14" />
      <motion.div className="absolute inset-x-5 top-5 mt-4 flex items-center gap-0.5" style={{ y: h }}>
        <Icon label="Previous version" disabled={busy || at === 0} onClick={() => go(-1)}>
          <ArrowLeft size={14} />
        </Icon>
        <span className="tnum flex min-w-[52px] justify-center text-callout text-ink-2">
          <RollingText text={String(at + 1)} />
          <span className="px-1">/</span>
          <RollingText text={String(list.length + (busy ? 1 : 0))} />
        </span>
        <Icon label="Next version" disabled={busy || at === list.length - 1} onClick={() => go(1)}>
          <ArrowRight size={14} />
        </Icon>
        <span className="flex-1" />
        <motion.button
          type="button"
          data-invite
          whileTap={press}
          disabled={busy}
          onPointerDown={() => !busy && tap()}
          onClick={regenerate}
          className="sink ring-focus flex h-10 items-center gap-2 rounded-full bg-surface-2 pl-3.5 pr-4 text-callout font-medium text-ink transition-colors duration-150 hover:bg-surface-3 disabled:opacity-60"
        >
          <motion.span className="flex" animate={{ rotate: spins * 360 }} transition={{ type: 'spring', stiffness: 170, damping: 19 }}>
            <Refresh size={14} />
          </motion.span>
          Regenerate
        </motion.button>
      </motion.div>
    </div>
  )
}

function Icon({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      disabled={disabled}
      whileTap={disabled ? undefined : press}
      onPointerDown={() => !disabled && tap()}
      onClick={onClick}
      className="sink ring-focus flex size-9 items-center justify-center rounded-full text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink disabled:opacity-35 disabled:hover:bg-transparent"
    >
      {children}
    </motion.button>
  )
}
