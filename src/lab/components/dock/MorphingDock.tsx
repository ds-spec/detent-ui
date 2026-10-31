'use client'

import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { ReactNode, Ref } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Kbd } from '@/lab/ui/Kbd'

export type DockTool = {
  id: string
  /** What the tool is called, for screen readers and the panel's name. */
  label: string
  icon: ReactNode
  /** What the dock becomes when this tool is open. */
  panel: ReactNode
  /** The panel's height in px, not counting the dock row. */
  height: number
  /** A count on the tool, like unread notes. It clears when you pass 0. */
  badge?: number
  /** A single key that opens the tool from anywhere on the page, like "/" or "s". */
  shortcut?: string
}
/** For demos and tests: open a tool, or close the dock, without a pointer. */
export type DockHandle = { open(id: string | null): void }

const ROW = 52
const MORPH = { type: 'spring', stiffness: 380, damping: 34, mass: 0.9 } as const

/**
 * A small floating toolbar at the foot of a page that becomes whatever its tools open. Press a
 * tool and the pill itself grows upward into that tool's panel while the page behind recedes;
 * press another and the panel reshapes into the next one without closing. The tools stay as the
 * panel's last row, a plate under the open one, so the way out is always where the way in was.
 *
 * One surface throughout: nothing pops over the dock, it stretches. Panels are laid out at their
 * full width from the start, so nothing inside reflows while the surface grows. Escape, a press
 * outside, or the open tool again shrinks it back into the pill. Closed, the tool under the pointer
 * names itself in a small pill above the dock; tools can carry a count and a one-key shortcut.
 */
export function MorphingDock({
  tools,
  children,
  width = 360,
  recede = true,
  onChange,
  ref,
}: {
  /** The tools, left to right, each with the panel it opens. */
  tools: DockTool[]
  /** The page the dock floats over. It recedes while a panel is open. The dock fills its parent and lays the page in absolutely, so give the parent a height. */
  children?: ReactNode
  /** Every panel's width in px. */
  width?: number
  /** Blur and set back the page while a panel is open. */
  recede?: boolean
  /** Called with the open tool's id, or null when the dock closes. */
  onChange?: (id: string | null) => void
  ref?: Ref<DockHandle>
}) {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const surface = useRef<HTMLDivElement>(null)
  const tool = tools.find((t) => t.id === open) ?? null
  const dockWidth = tools.length * 48 + 12
  const w = tool ? width : dockWidth
  const h = tool ? tool.height + ROW : ROW

  const set = (id: string | null) => {
    setOpen(id)
    onChange?.(id)
  }
  useImperativeHandle(ref, () => ({ open: set }))

  // Each tool's shortcut opens it from anywhere, unless someone is typing.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const el = e.target instanceof Element ? e.target : null
      if (e.metaKey || e.ctrlKey || e.altKey || el?.closest('input, textarea, select, [contenteditable="true"]')) return
      const t = tools.find((x) => x.shortcut && x.shortcut.toLowerCase() === e.key.toLowerCase())
      if (!t) return
      e.preventDefault()
      set(open === t.id ? null : t.id)
    }
    addEventListener('keydown', key)
    return () => removeEventListener('keydown', key)
  })

  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => e.key === 'Escape' && set(null)
    const away = (e: PointerEvent) => !surface.current?.contains(e.target as Node) && set(null)
    addEventListener('keydown', key)
    addEventListener('pointerdown', away)
    return () => {
      removeEventListener('keydown', key)
      removeEventListener('pointerdown', away)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <div className="relative size-full overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={tool && recede ? { scale: 0.97, opacity: 0.6, filter: 'blur(8px)' } : { scale: 1, opacity: 1, filter: 'blur(0px)' }}
        transition={reduce ? { duration: 0 } : { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
        inert={!!tool}
      >
        {children}
      </motion.div>

      <div className="pointer-events-none absolute inset-x-0 bottom-7 flex justify-center">
        {/* Closed, the tool under the pointer names itself in a small pill above the dock, gliding from tool to tool. */}
        <AnimatePresence>
          {!tool && hover && (
            <motion.div
              key="label"
              className="absolute bottom-[64px] flex justify-center"
              style={{ left: '50%', width: 0 }}
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96, transition: { duration: 0.12 } }}
              transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <motion.span
                className="flex h-8 items-center gap-2 whitespace-nowrap rounded-full bg-surface pl-3 pr-1.5 text-[12.5px] text-ink shadow-[0_0_0_1px_var(--line),0_8px_24px_-8px_rgb(0_0_0/0.18)]"
                initial={false}
                animate={{ x: (tools.findIndex((t) => t.id === hover) - (tools.length - 1) / 2) * 48 }}
                transition={reduce ? { duration: 0 } : MORPH}
              >
                {tools.find((t) => t.id === hover)?.label}
                {tools.find((t) => t.id === hover)?.shortcut ? <Kbd>{tools.find((t) => t.id === hover)!.shortcut!.toUpperCase()}</Kbd> : <span className="w-1.5" />}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          ref={surface}
          role={tool ? 'dialog' : 'toolbar'}
          aria-label={tool ? tool.label : 'Tools'}
          className="pointer-events-auto relative overflow-hidden bg-surface shadow-[0_0_0_1px_var(--line),0_2px_4px_rgb(0_0_0/0.04),0_18px_48px_-12px_rgb(0_0_0/0.22)]"
          initial={false}
          animate={{ width: w, height: h, borderRadius: tool ? 22 : 26 }}
          transition={reduce ? { duration: 0 } : MORPH}
        >
          <div className="absolute top-0" style={{ width, height: h - ROW, left: '50%', marginLeft: -width / 2 }}>
            <AnimatePresence mode="popLayout" initial={false}>
              {tool && (
                <motion.div
                  key={tool.id}
                  className="absolute inset-0"
                  initial={reduce ? false : { opacity: 0, y: 10, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -6, filter: 'blur(4px)', transition: { duration: 0.12 } }}
                  transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1], delay: 0.05 }}
                >
                  {tool.panel}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.span aria-hidden className="absolute inset-x-3 h-px bg-line" style={{ bottom: ROW }} initial={false} animate={{ opacity: tool ? 1 : 0 }} transition={{ duration: 0.2 }} />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 px-1.5" style={{ height: ROW }}>
            {tools.map((t) => {
              const on = open === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-label={t.label}
                  aria-expanded={on}
                  onClick={() => set(on ? null : t.id)}
                  onPointerEnter={(e) => e.pointerType !== 'touch' && setHover(t.id)}
                  onPointerLeave={(e) => e.pointerType !== 'touch' && setHover(null)}
                  onFocus={() => setHover(t.id)}
                  onBlur={() => setHover(null)}
                  className={`ring-focus relative grid h-10 w-11 place-items-center rounded-full transition-colors duration-150 ${on ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}
                >
                  {on && <motion.span layoutId="dock-plate" className="absolute inset-0 rounded-full bg-surface-2" transition={reduce ? { duration: 0 } : MORPH} />}
                  <span className="relative">{t.icon}</span>
                  {/* A count waiting on the tool, popping in and out. */}
                  <AnimatePresence>
                    {!!t.badge && !on && (
                      <motion.span
                        key="badge"
                        aria-label={`${t.badge} new`}
                        className="tnum absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-semibold leading-none text-white shadow-[0_0_0_2px_var(--surface)]"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 600, damping: 26 }}
                      >
                        {t.badge}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
