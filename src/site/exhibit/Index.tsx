'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { DEMOS } from '@/catalog/demos'
import { CATEGORIES, ENTRIES } from '@/catalog/meta'
import { isProComponent } from '@/catalog/pro'
import { ProTag } from '../blocks/ProTag'
import { Close } from '@/lab/icons'
import { Fit } from '../Fit'

const ease = [0.2, 0.9, 0.25, 1] as const

export function Index({ open, current, onPick, onClose }: { open: boolean; current: string; onPick: (id: string) => void; onClose: () => void }) {
  const router = useRouter()
  const [peek, setPeek] = useState<{ id: string; x: number; y: number } | null>(null)
  const timer = useRef(0)
  const sheet = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', key)
    document.documentElement.style.overflow = 'hidden'
    sheet.current?.focus({ preventScroll: true })
    return () => {
      window.removeEventListener('keydown', key)
      document.documentElement.style.overflow = ''
      clearTimeout(timer.current)
    }
  }, [open, onClose])

  const point = (id: string, el: HTMLElement) => {
    clearTimeout(timer.current)
    const r = el.getBoundingClientRect()
    timer.current = window.setTimeout(() => {
      setPeek({ id, x: r.right + 28, y: r.top + r.height / 2 })
      router.prefetch(`/components/${id}`)
    }, 140)
  }
  const Peek = peek ? DEMOS[peek.id] : null

  return (
    <AnimatePresence onExitComplete={() => setPeek(null)}>
      {open && (
        <motion.div
          key="index"
          ref={sheet}
          role="dialog"
          aria-label="All components"
          tabIndex={-1}
          className="fixed inset-0 z-[60] overflow-y-auto bg-bg outline-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.18 } }}
          transition={{ duration: 0.25, ease }}
        >
          <div className="mx-auto max-w-[1360px] px-5 pb-24 pt-8 sm:px-8">
            <div className="flex items-center justify-between">
              <p className="text-footnote text-ink-3">
                Index <span className="tnum">· {ENTRIES.length} components</span>
              </p>
              <button type="button" onClick={onClose} aria-label="Close the index" className="ring-focus flex size-10 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink">
                <Close size={18} />
              </button>
            </div>

            <div className="mt-10 grid gap-x-16 gap-y-14 sm:grid-cols-2 lg:grid-cols-3" onPointerLeave={() => {
                clearTimeout(timer.current)
                setPeek(null)
              }}>
              {CATEGORIES.map((c, ci) => {
                const items = ENTRIES.filter((e) => e.category === c.id)
                return (
                  <motion.section key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease, delay: 0.04 * ci }}>
                    <h2 className="flex items-center gap-2 text-footnote text-ink-3">
                      <span className="size-2 rounded-full" style={{ background: `var(--${c.id})` }} />
                      {c.name}
                      <span className="tnum">{items.length}</span>
                    </h2>
                    <ul className="mt-4">
                      {items.map((e) => {
                        const here = e.id === current
                        return (
                          <li key={e.id}>
                            <button
                              type="button"
                              onPointerEnter={(ev) => point(e.id, ev.currentTarget)}
                              onFocus={(ev) => point(e.id, ev.currentTarget)}
                              onClick={() => onPick(e.id)}
                              className={`ring-focus group/name flex items-center gap-3 rounded-[8px] py-0.5 text-left text-[clamp(22px,2.1vw,28px)] leading-[1.3] tracking-[-0.035em] transition-colors duration-150 ${here ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}
                            >
                              <span className={`h-[2px] rounded-full bg-ink transition-[width] duration-200 ${here ? 'w-4' : 'w-0 group-hover/name:w-2'}`} />
                              {e.name}
                              {isProComponent(e.id) && <ProTag className="ml-1 translate-y-[1px]" />}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </motion.section>
                )
              })}
            </div>
          </div>

          <AnimatePresence>
            {peek && Peek && (
              <motion.div
                key="peek"
                className="pointer-events-none fixed left-0 top-0 z-10 hidden h-[220px] w-[300px] overflow-hidden rounded-[24px] bg-card shadow-float lg:block"
                initial={{ opacity: 0, scale: 0.96, x: peek.x, y: peek.y - 110 }}
                animate={{ opacity: 1, scale: 1, x: Math.min(peek.x, window.innerWidth - 324), y: Math.min(Math.max(peek.y - 110, 16), window.innerHeight - 236) }}
                exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 38, opacity: { duration: 0.18 } }}
              >
                <Fit key={peek.id} pad={18} max={0.62}>
                  <Peek />
                </Fit>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
