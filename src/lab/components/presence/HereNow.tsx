'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ease, spring, dur } from '../../lib/motion'
import { Orb } from '../../ui/Orb'
import { RollingText } from '../../ui/RollingText'

export type Person = { id: string; name: string; hue: number; status: 'active' | 'idle'; typing?: boolean; note?: string }

const SIZE = 32
const CLOSED = 28
const OPEN = 38

export const tone = (hue: number) => `oklch(0.62 0.13 ${hue})`
export const label = (hue: number) => `oklch(0.53 0.13 ${hue})`

export function HereNow({
  people,
  max = 4,
  following,
  onFollow,
  open: forced,
}: {
  people: Person[]
  max?: number
  following: string | null
  onFollow: (id: string | null) => void
  open?: boolean
}) {
  const [hover, setHover] = useState(false)
  const [tip, setTip] = useState<string | null>(null)
  const open = hover || !!forced
  const root = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(true)

  useEffect(() => {
    if (!hover) return
    const away = (e: PointerEvent) => {
      if (e.pointerType === 'touch' && !root.current?.contains(e.target as Node)) {
        setHover(false)
        setTip(null)
      }
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [hover])
  const shown = people.slice(0, max)
  const extra = people.length - shown.length
  const step = open ? OPEN : CLOSED
  const width = SIZE + (max - 1) * OPEN + OPEN

  return (
    <div
      ref={root}
      className="relative shrink-0"
      style={{ width, height: SIZE }}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={(e) => {
        if (e.pointerType === 'touch') return
        setHover(false)
        setTip(null)
      }}
    >
      <AnimatePresence initial={false}>
        {extra > 0 && (
          <motion.span
            key="more"
            className="absolute top-0 flex items-center justify-center rounded-full bg-surface-2 text-caption font-medium text-ink-2"
            style={{ width: SIZE, height: SIZE, right: 0, boxShadow: '0 0 0 2px var(--surface)' }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={spring.snappy}
          >
            +<RollingText text={String(extra)} />
          </motion.span>
        )}
        {shown.map((p, i) => {
          const k = shown.length - 1 - i + (extra > 0 ? 1 : 0)
          return (
            <motion.button
              key={p.id}
              type="button"
              onPointerDown={(e) => void (wasOpen.current = e.pointerType !== 'touch' || open)}
              onClick={() => {
                setTip(p.id)
                if (wasOpen.current) onFollow(following === p.id ? null : p.id)
                wasOpen.current = true
              }}
              onPointerEnter={() => setTip(p.id)}
              onFocus={() => setTip(p.id)}
              onBlur={() => setTip(null)}
              aria-label={`${following === p.id ? 'Stop following' : 'Follow'} ${p.name}`}
              aria-pressed={following === p.id}
              className="ring-focus absolute top-0 rounded-full pointer-coarse:before:absolute pointer-coarse:before:-inset-1 pointer-coarse:before:content-['']"
              style={{ width: SIZE, height: SIZE, zIndex: shown.length - i }}
              initial={{ opacity: 0, scale: 0.8, right: k * step + 12 }}
              animate={{ opacity: 1, scale: 1, right: k * step }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: dur.exit, ease: ease.out } }}
              transition={{ right: spring.smooth, scale: spring.snappy, opacity: { duration: 0.2, ease: ease.out } }}
            >
              <Face p={p} followed={following === p.id} />
              <AnimatePresence>
                {tip === p.id && open && (
                  <motion.span
                    className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 flex h-7 -translate-x-1/2 items-center whitespace-nowrap rounded-full bg-ink px-3 text-footnote text-surface shadow-float"
                    initial={{ opacity: 0, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: dur.exit, ease: ease.out } }}
                    transition={{ duration: 0.14, ease: ease.out }}
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="opacity-60"> · {following === p.id ? 'Following' : p.typing ? 'Typing' : p.status === 'idle' ? (p.note ?? 'Away') : (p.note ?? 'Viewing')}</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

function Face({ p, followed }: { p: Person; followed: boolean }) {
  const reduce = useReducedMotion()
  return (
    <span className="relative block size-full">
      <span className="block size-full rounded-full transition-[box-shadow,filter] duration-200" style={{ boxShadow: followed ? `0 0 0 2px var(--surface), 0 0 0 3.5px ${tone(p.hue)}` : '0 0 0 2px var(--surface)', filter: p.status === 'idle' ? 'grayscale(1)' : 'none' }}>
        <Orb seed={p.name} hue={p.hue} size={SIZE} />
      </span>
      <AnimatePresence>
        {p.typing && (
          <motion.span
            className="absolute -right-2 -top-2 flex h-4 items-center gap-[3px] rounded-full bg-surface px-1.5 shadow-raised"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={spring.snappy}
          >
            {[0, 1, 2].map((d) => (
              <motion.span
                key={d}
                className="size-[3px] rounded-full bg-ink-2"
                animate={reduce ? { opacity: 0.65 } : { opacity: [0.3, 1, 0.3] }}
                transition={reduce ? { duration: 0 } : { duration: 1, repeat: Infinity, delay: d * 0.16, ease: ease.inOut }}
              />
            ))}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

export function Cursor({ p, x, y, quiet }: { p: Person; x: number; y: number; quiet?: boolean }) {
  return (
    <motion.div
      className="pointer-events-none absolute left-0 top-0 z-10"
      initial={{ x, y, opacity: 0 }}
      animate={{ x, y, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.6, transition: { duration: dur.exit, ease: ease.out } }}
      transition={{ x: { type: 'spring', stiffness: 120, damping: 20 }, y: { type: 'spring', stiffness: 120, damping: 20 }, opacity: { duration: 0.2, ease: ease.out } }}
    >
      <svg width="16" height="18" viewBox="0 0 16 18" className="drop-shadow-[0_1px_1px_rgb(0_0_0/0.25)]">
        <path d="M1.5 1.5v13.2l3.6-3.4 2.4 5.2 2.4-1.1-2.3-5.1h5z" fill={tone(p.hue)} stroke="white" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
      <motion.span
        className="absolute left-3.5 top-[15px] flex h-5 items-center whitespace-nowrap rounded-full px-2 text-caption font-medium text-white shadow-[0_1px_2px_rgb(0_0_0/0.12)]"
        style={{ background: label(p.hue) }}
        initial={false}
        animate={{ opacity: quiet ? 0 : 1, scale: quiet ? 0.8 : 1 }}
        transition={{ duration: 0.2, ease: ease.out }}
      >
        {p.name.split(' ')[0]}
      </motion.span>
    </motion.div>
  )
}
