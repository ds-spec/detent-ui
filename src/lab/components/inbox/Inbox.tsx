'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'motion/react'
import type { LegacyAnimationControls as AnimationControls } from 'motion/react'
import { Check, Close } from '../../icons'
import { ease, press, spring } from '../../lib/motion'
import { RollingText } from '../../ui/RollingText'
import { Button } from '../../ui/Button'
import { Avatar as Face } from '../../ui/Avatar'

export type InboxItem = {
  id: string
  /** A person (soft initials in their colour) or an app (pass an icon and a tile background). */
  from: { name: string; hue?: number; tint?: string; icon?: ReactNode }
  /** Wrap names and objects in <b> to lift them out of the sentence. */
  text: ReactNode
  meta: string
  at: number
  unread: boolean
  live?: { progress: number; status: string; done?: boolean; doneText?: ReactNode }
  invite?: { state?: 'accepted' | 'declined'; joined?: string }
}

const LIST_H = 312
const fold = { type: 'spring', bounce: 0, duration: 0.34 } as const

/*
 * The time the rows are measured against, ticking every 20 seconds. It's read through an external
 * store, not during render: a server prerender sees no time at all (every row says "Just now"),
 * and the browser reads the real time once it has the page. Frameworks that prerender (Next.js
 * among them) flag a clock read while rendering.
 */
const TICK = 20_000
const tick = (onChange: () => void) => {
  const t = setInterval(onChange, TICK)
  return () => clearInterval(t)
}
const clock = () => Math.floor(Date.now() / TICK) * TICK
const noClock = () => 0

const ago = (t: number, now: number) => {
  if (!now) return 'Just now'
  const s = (now - t) / 1000
  if (s < 45) return 'Just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`
}

/**
 * A notification bell with an inbox. When something new arrives the bell rings (the clapper
 * swings a beat behind the body) and the count rolls. The inbox grows out of the bell and
 * floats over the page. Rows mark themselves read on click, invites answer in place, and
 * live work shows its progress right in the row.
 */
export function Inbox({
  items,
  onRead,
  onReadAll,
  onDismiss,
  onInvite,
  align = 'end',
  defaultOpen = false,
}: {
  /** The notifications, newest first. */
  items: InboxItem[]
  /** Called with an item's id when it's opened or marked read. */
  onRead: (id: string) => void
  /** Called when a person marks everything read. */
  onReadAll: () => void
  /** Called with an item's id when it's swiped or closed away. */
  onDismiss: (id: string) => void
  /** Called with an invite's id and whether it was accepted. */
  onInvite?: (id: string, accept: boolean) => void
  /** Which edge of the bell the inbox lines up with. */
  align?: 'start' | 'center' | 'end'
  /** Start with the inbox open. */
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [tab, setTab] = useState<'all' | 'unread'>('all')
  const [sweep, setSweep] = useState(false)
  const now = useSyncExternalStore(tick, clock, noClock)
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const bell = useAnimationControls()
  const clapper = useAnimationControls()
  const reduce = useReducedMotion()

  const unread = items.filter((i) => i.unread).length
  const shown = tab === 'unread' ? items.filter((i) => i.unread) : items

  // Ring when a new unread item lands on top.
  const top = items[0]?.id
  const lastTop = useRef(top)
  useEffect(() => {
    if (top && top !== lastTop.current && items[0].unread && !reduce) {
      bell.start({ rotate: [0, 15, -12, 8, -5, 2, 0], transition: { duration: 0.75, ease: 'easeOut' } })
      clapper.start({ x: [0, -2.4, 2.2, -1.4, 0.8, 0], transition: { duration: 0.75, delay: 0.06, ease: 'easeOut' } })
    }
    lastTop.current = top
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [top])

  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      const t = e.target as Element
      if (trigger.current?.contains(t) || panel.current?.contains(t) || t.closest?.('[data-inbox-keep]')) return
      setOpen(false)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      setOpen(false)
      trigger.current?.focus()
    }
    document.addEventListener('pointerdown', away)
    window.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', away)
      window.removeEventListener('keydown', key)
    }
  }, [open])

  const readAll = () => {
    setSweep(true)
    onReadAll()
    window.setTimeout(() => setSweep(false), 600)
  }

  const place = align === 'end' ? 'right-0' : align === 'start' ? 'left-0' : 'left-1/2 -translate-x-1/2'
  const origin = align === 'end' ? 'calc(100% - 20px) 0' : align === 'start' ? '20px 0' : '50% 0'

  return (
    <div className="relative">
      <motion.button
        ref={trigger}
        type="button"
        whileTap={press}
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`ring-focus relative flex size-10 items-center justify-center rounded-full bg-surface transition-[color,box-shadow] duration-200 hover:text-ink ${open ? 'text-ink' : 'text-ink-2'}`}
        style={{ boxShadow: open ? 'var(--elev-field), var(--elev-raised)' : 'var(--elev-raised)' }}
      >
        <RingingBell body={bell} clapper={clapper} />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-caption font-semibold leading-none text-surface"
              style={{ boxShadow: '0 0 0 2px var(--bg)' }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', bounce: 0.35, duration: 0.4 }}
            >
              <RollingText text={String(unread)} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panel}
            role="dialog"
            aria-label="Notifications"
            className={`glass absolute top-[calc(100%+10px)] z-30 w-[min(380px,calc(100vw-24px))] rounded-card bg-surface p-2 ${place}`}
            style={{ boxShadow: 'var(--elev-modal)', transformOrigin: origin }}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.16, ease: ease.out } }}
            exit={{ opacity: 0, transition: { duration: 0.12, ease: ease.out } }}
          >
            <div className="flex h-10 items-center justify-between pl-3 pr-1">
              <span className="text-callout font-semibold">Notifications</span>
              <Button variant="ghost" size="sm" disabled={!unread} onClick={readAll}>
                <Check size={13} strokeWidth={2.6} />
                Mark all read
              </Button>
            </div>

            <Tabs tab={tab} setTab={setTab} unread={unread} />

            <div className="relative" style={{ height: LIST_H }}>
              <ul className="h-full overflow-y-auto overscroll-contain [scrollbar-width:none]" style={{ maskImage: 'linear-gradient(to bottom, black calc(100% - 28px), transparent)' }}>
                <AnimatePresence initial={false}>
                  {shown.map((n, i) => (
                    <Row key={n.id} n={n} now={now} sweepDelay={sweep ? i * 0.04 : 0} onRead={onRead} onDismiss={onDismiss} onInvite={onInvite} />
                  ))}
                </AnimatePresence>
              </ul>
              <AnimatePresence>
                {shown.length === 0 && (
                  <motion.div
                    className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: 0.18, duration: 0.28 } }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  >
                    <span className="flex size-11 items-center justify-center rounded-full bg-surface-2 text-ink-2">
                      <Check size={20} strokeWidth={2.4} />
                    </span>
                    <p className="mt-3 text-callout font-medium">You’re all caught up</p>
                    <p className="mt-0.5 text-footnote text-ink-3">{tab === 'unread' ? 'Nothing unread right now.' : 'New notifications will land here.'}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ───────────────────────────── Parts ───────────────────────────── */

/** Our bell, drawn so the body and the solid clapper can move separately. */
function RingingBell({ body, clapper }: { body: AnimationControls; clapper: AnimationControls }) {
  return (
    <motion.svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      animate={body}
      style={{ originX: 0.5, originY: 0.12 }}
    >
      <path d="M6 15.5V11a6 6 0 1 1 12 0v4.5l1.5 2H4.5z" />
      <motion.path d="M9.6 19.5a2.6 2.6 0 0 0 4.8 0z" fill="currentColor" animate={clapper} />
    </motion.svg>
  )
}

function Tabs({ tab, setTab, unread }: { tab: 'all' | 'unread'; setTab: (t: 'all' | 'unread') => void; unread: number }) {
  return (
    <div role="tablist" className="relative mx-1 mb-1 grid h-8 grid-cols-2 rounded-[10px] bg-surface-2 p-[3px]">
      <motion.span
        aria-hidden
        className="absolute inset-y-[3px] left-[3px] w-[calc(50%-3px)] rounded-[8px] bg-plate shadow-raised"
        style={{ boxShadow: 'var(--elev-raised)' }}
        initial={false}
        animate={{ x: tab === 'unread' ? '100%' : '0%' }}
        transition={spring.snappy}
      />
      {(['all', 'unread'] as const).map((t) => (
        <button
          key={t}
          type="button"
          role="tab"
          aria-selected={tab === t}
          onClick={() => setTab(t)}
          className={`ring-focus relative flex items-center justify-center gap-1.5 rounded-[8px] text-footnote font-medium transition-colors duration-150 ${tab === t ? 'text-ink' : 'text-ink-3 hover:text-ink-2'}`}
        >
          {t === 'all' ? 'All' : 'Unread'}
          {t === 'unread' && (
            <span className="tnum flex h-5 min-w-5 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--ink)_7%,transparent)] px-1.5 text-caption leading-none">
              <RollingText text={String(unread)} />
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

function Row({
  n,
  now,
  sweepDelay,
  onRead,
  onDismiss,
  onInvite,
}: {
  n: InboxItem
  now: number
  sweepDelay: number
  onRead: (id: string) => void
  onDismiss: (id: string) => void
  onInvite?: (id: string, accept: boolean) => void
}) {
  const done = n.live?.done
  return (
    <motion.li
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0, transition: { ...fold, opacity: { duration: 0.14 } } }}
      transition={{ ...fold, opacity: { duration: 0.24 } }}
      className="overflow-hidden"
    >
      <div
        onClick={() => n.unread && onRead(n.id)}
        className={`group/row relative flex gap-3 rounded-row py-2.5 pl-2.5 pr-9 transition-colors duration-150 hover:bg-surface-2 ${n.unread ? 'cursor-pointer' : ''}`}
      >
        <Avatar from={n.from} done={done} />

        <div className="min-w-0 flex-1">
          <div className="relative">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.p
                key={done ? 'done' : 'text'}
                className="text-footnote leading-5 text-ink-2 [&_b]:font-medium [&_b]:text-ink"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: ease.out }}
              >
                {done && n.live?.doneText ? n.live.doneText : n.text}
              </motion.p>
            </AnimatePresence>
          </div>
          <p className="mt-0.5 text-caption text-ink-3">
            {ago(n.at, now)} · {n.meta}
          </p>

          <AnimatePresence initial={false}>
            {n.live && !done && (
              <motion.div initial={false} exit={{ height: 0, opacity: 0, transition: { ...fold, delay: 0.3, opacity: { duration: 0.15, delay: 0.3 } } }} className="overflow-hidden">
                <div className="pt-2">
                  <div className="flex items-center justify-between text-caption text-ink-3">
                    <span>{n.live.status}</span>
                    <RollingText text={`${Math.round(n.live.progress * 100)}%`} />
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-line">
                    <motion.div className="h-full rounded-full bg-ink" initial={false} animate={{ width: `${n.live.progress * 100}%` }} transition={spring.release} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {n.invite && <Invite id={n.id} invite={n.invite} onInvite={onInvite} />}
        </div>

        {/* One fixed slot: the unread dot, swapped for an action on hover or focus. */}
        <span className="absolute right-2 top-2.5 size-6">
          <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-150 group-hover/row:opacity-0 group-focus-within/row:opacity-0 pointer-coarse:opacity-0">
            <AnimatePresence custom={sweepDelay}>
              {n.unread && (
                <motion.span
                  className="size-2 rounded-full"
                  style={{ background: 'var(--accent)' }}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  variants={{ out: (d: number) => ({ opacity: 0, scale: 0.4, transition: { duration: 0.2, ease: ease.out, delay: d } }) }}
                  exit="out"
                />
              )}
            </AnimatePresence>
          </span>
          <button
            type="button"
            aria-label={n.unread ? 'Mark as read' : 'Dismiss'}
            onClick={(e) => {
              e.stopPropagation()
              if (n.unread) onRead(n.id)
              else onDismiss(n.id)
            }}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-surface text-ink-2 opacity-0 outline-none transition-[opacity,color] duration-150 before:absolute before:-inset-2.5 before:content-[''] hover:text-ink focus-visible:opacity-100 group-hover/row:opacity-100 pointer-coarse:opacity-100"
            style={{ boxShadow: 'var(--elev-raised)' }}
          >
            {n.unread ? <Check size={13} strokeWidth={2.6} /> : <Close size={12} strokeWidth={2.6} />}
          </button>
        </span>
      </div>
    </motion.li>
  )
}

function Avatar({ from, done }: { from: InboxItem['from']; done?: boolean }) {
  return (
    <span className="relative size-9 shrink-0">
      {from.icon ? (
        <span className="flex size-full items-center justify-center rounded-[11px] text-white" style={{ background: from.tint, boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.2), inset 0 0 0 0.5px rgb(0 0 0 / 0.06)' }}>
          {from.icon}
        </span>
      ) : (
        <Face name={from.name} hue={from.hue ?? 250} size={36} />
      )}
      <AnimatePresence>
        {done && (
          <motion.span
            className="absolute -bottom-1 -right-1 flex size-[17px] items-center justify-center rounded-full bg-ok text-white"
            style={{ boxShadow: '0 0 0 2px var(--surface)' }}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.5, duration: 0.5, delay: 0.1 }}
          >
            <Check size={10} strokeWidth={3.2} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

/** Accept or decline right in the row. The answer replaces the buttons in the same space. */
function Invite({ id, invite, onInvite }: {
  id: string
  invite: NonNullable<InboxItem['invite']>
  onInvite?: (id: string, accept: boolean) => void
}) {
  return (
    <div className="relative mt-2 h-8" onClick={(e) => e.stopPropagation()}>
      <AnimatePresence initial={false} mode="popLayout">
        {!invite.state ? (
          <motion.div key="ask" className="flex gap-1.5" exit={{ opacity: 0, transition: { duration: 0.12 } }}>
            <Button size="sm" onClick={() => onInvite?.(id, false)}>
              Decline
            </Button>
            <Button variant="primary" size="sm" onClick={() => onInvite?.(id, true)}>
              Accept
            </Button>
          </motion.div>
        ) : (
          <motion.p
            key={invite.state}
            className="flex h-8 items-center gap-1.5 text-footnote font-medium text-ink-2"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: ease.out, delay: 0.06 }}
          >
            {invite.state === 'accepted' ? (
              <>
                <span className="flex size-4 items-center justify-center rounded-full bg-ok text-white">
                  <Check size={10} strokeWidth={3.2} />
                </span>
                {invite.joined ?? 'Joined'}
              </>
            ) : (
              <span className="text-ink-3">Declined</span>
            )}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
