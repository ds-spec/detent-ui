'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ease, spring } from '../../lib/motion'
import { Orb } from '../../ui/Orb'
import { RollingText } from '../../ui/RollingText'

export type Person = { id: string; name: string; hue: number; status: 'active' | 'idle'; typing?: boolean; note?: string }

const SIZE = 32
/** Closed, faces overlap by a sliver: enough to read as a group, never enough to hide a face. */
const CLOSED = 28
const OPEN = 38

export const tone = (hue: number) => `oklch(0.62 0.13 ${hue})`
/** The same colour, deep enough for white text on it. */
export const label = (hue: number) => `oklch(0.53 0.13 ${hue})`

/**
 * Who's here, at a glance.
 *
 * Avatars overlap until you point at them, then fan out to their names; the stack only
 * ever grows into space it already has, so nothing beside it moves. People joining slide in
 * from the left, people leaving shrink away and the rest close the gap, and the overflow
 * count rolls. A typing badge says who is writing, and idle people fade back. Click someone
 * to follow them: their colour rings the avatar, and the view goes where they go.
 */
export function HereNow({
  people,
  max = 4,
  following,
  onFollow,
  open: forced,
}: {
  /** Who's here, each with a colour, a status and what they're doing. */
  people: Person[]
  /** How many faces show before the rest become a count. */
  max?: number
  /** The id of the person being followed, or null. */
  following: string | null
  /** Called with a person's id to follow them, or null to stop. */
  onFollow: (id: string | null) => void
  /** Hold the stack open, e.g. while a demo shows it off. */
  open?: boolean
}) {
  const [hover, setHover] = useState(false)
  const [tip, setTip] = useState<string | null>(null)
  const open = hover || !!forced
  const shown = people.slice(0, max)
  const extra = people.length - shown.length
  const step = open ? OPEN : CLOSED
  // Room for everyone fanned out plus the overflow chip, reserved up front.
  const width = SIZE + (max - 1) * OPEN + OPEN

  return (
    <div
      className="relative shrink-0"
      style={{ width, height: SIZE }}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => {
        setHover(false)
        setTip(null)
      }}
    >
      {/* Laid out from the right edge, so the stack fans leftwards into its reserved space. */}
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
              onClick={() => onFollow(following === p.id ? null : p.id)}
              onPointerEnter={() => setTip(p.id)}
              onFocus={() => setTip(p.id)}
              onBlur={() => setTip(null)}
              aria-label={`${following === p.id ? 'Stop following' : 'Follow'} ${p.name}`}
              aria-pressed={following === p.id}
              className="ring-focus absolute top-0 rounded-full"
              style={{ width: SIZE, height: SIZE, zIndex: shown.length - i }}
              initial={{ opacity: 0, scale: 0.5, right: k * step + 12 }}
              animate={{ opacity: 1, scale: 1, right: k * step }}
              exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.18, ease: ease.exit } }}
              transition={{ right: spring.smooth, scale: spring.snappy, opacity: { duration: 0.2 } }}
            >
              <Face p={p} followed={following === p.id} />
              <AnimatePresence>
                {tip === p.id && open && (
                  <motion.span
                    className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 flex h-7 -translate-x-1/2 items-center whitespace-nowrap rounded-full bg-ink px-3 text-footnote text-surface shadow-float"
                    initial={{ opacity: 0, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.08 } }}
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
  return (
    <span className="relative block size-full">
      {/* A ring of the page between faces; following adds one of their colour. Idle people lose their colour rather than their shape. */}
      <span className="block size-full rounded-full transition-[box-shadow,filter] duration-200" style={{ boxShadow: followed ? `0 0 0 2px var(--surface), 0 0 0 3.5px ${tone(p.hue)}` : '0 0 0 2px var(--surface)', filter: p.status === 'idle' ? 'grayscale(1)' : 'none' }}>
        <Orb seed={p.name} hue={p.hue} size={SIZE} />
      </span>
      <AnimatePresence>
        {p.typing && (
          <motion.span
            className="absolute -right-2 -top-2 flex h-4 items-center gap-[3px] rounded-full bg-surface px-1.5 shadow-raised"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={spring.snappy}
          >
            {[0, 1, 2].map((d) => (
              <motion.span
                key={d}
                className="size-[3px] rounded-full bg-ink-2"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: d * 0.16, ease: 'easeInOut' }}
              />
            ))}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

/** Someone else's pointer: it glides to where they point, with their name trailing it. */
export function Cursor({ p, x, y, quiet }: { p: Person; x: number; y: number; quiet?: boolean }) {
  return (
    <motion.div
      className="pointer-events-none absolute left-0 top-0 z-10"
      initial={{ x, y, opacity: 0 }}
      animate={{ x, y, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.15 } }}
      transition={{ x: { type: 'spring', stiffness: 120, damping: 20 }, y: { type: 'spring', stiffness: 120, damping: 20 }, opacity: { duration: 0.2 } }}
    >
      <svg width="16" height="18" viewBox="0 0 16 18" className="drop-shadow-[0_1px_1px_rgb(0_0_0/0.25)]">
        <path d="M1.5 1.5v13.2l3.6-3.4 2.4 5.2 2.4-1.1-2.3-5.1h5z" fill={tone(p.hue)} stroke="white" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
      <motion.span
        className="absolute left-3.5 top-[15px] flex h-5 items-center whitespace-nowrap rounded-full px-2 text-caption font-medium text-white shadow-[0_1px_2px_rgb(0_0_0/0.12)]"
        style={{ background: label(p.hue) }}
        initial={false}
        animate={{ opacity: quiet ? 0 : 1, scale: quiet ? 0.8 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {p.name.split(' ')[0]}
      </motion.span>
    </motion.div>
  )
}
