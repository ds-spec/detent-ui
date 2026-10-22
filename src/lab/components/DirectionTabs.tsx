'use client'

import { useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode, Ref } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { tap } from '../lib/feel'

export type Tab = { id: string; label: string; content: ReactNode }
/** For demos and tests: switch tabs without touching focus. */
export type TabsHandle = { go(i: number): void }

const ease = { type: 'spring', bounce: 0, duration: 0.42 } as const

const panel = {
  enter: (dir: number) => ({ x: dir * 40, opacity: 0, filter: 'blur(4px)' }),
  center: { x: 0, opacity: 1, filter: 'blur(0px)' },
  exit: (dir: number) => ({ x: dir * -40, opacity: 0, filter: 'blur(4px)' }),
}

/** Tabs whose content slides in from the side you moved toward, while the card's height follows. */
export function DirectionTabs({
  tabs,
  defaultTab,
  onChange,
  id = 'tabs',
  ref,
}: {
  /** Each tab's id, its label, and what it shows. */
  tabs: Tab[]
  /** The id of the tab that's open first. */
  defaultTab?: string
  /** Called with a tab's id when a person opens it. */
  onChange?: (id: string) => void
  /** Keeps the sliding indicator to this set of tabs when there are several on a page. */
  id?: string
  ref?: Ref<TabsHandle>
}) {
  const [[index, dir], setState] = useState<[number, number]>(() => [Math.max(0, tabs.findIndex((t) => t.id === defaultTab)), 0])
  const changed = useRef(onChange)
  useLayoutEffect(() => {
    changed.current = onChange
  })
  const [height, setHeight] = useState<number | 'auto'>('auto')
  const inner = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = inner.current
    if (!el) return
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const go = (next: number) => {
    if (next === index) return
    setState([next, next > index ? 1 : -1])
    changed.current?.(tabs[next].id)
  }
  useImperativeHandle(ref, () => ({ go: (i) => setState(([at]) => (i === at ? [at, 0] : [i, i > at ? 1 : -1])) }))

  return (
    <div className="w-full overflow-hidden rounded-card bg-surface shadow-float">
      <div
        role="tablist"
        className="m-1.5 flex rounded-[16px] bg-surface-2 p-1"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go((index + 1) % tabs.length)
          else if (e.key === 'ArrowLeft') go((index - 1 + tabs.length) % tabs.length)
          else return
          e.preventDefault()
        }}
      >
        {tabs.map((t, i) => {
          const on = i === index
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              tabIndex={on ? 0 : -1}
              onPointerDown={tap}
              onClick={() => go(i)}
              ref={(el) => {
                if (on && el && document.activeElement?.getAttribute('role') === 'tab') el.focus()
              }}
              className={`ring-focus relative h-8 flex-1 rounded-[12px] text-footnote font-medium transition-colors duration-200 ${on ? 'text-ink' : 'text-ink-2 hover:text-ink'}`}
            >
              {on && <motion.span layoutId={`${id}-pill`} className="absolute inset-0 rounded-[12px] bg-plate shadow-raised" transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }} />}
              <span className="relative">{t.label}</span>
            </button>
          )
        })}
      </div>

      <motion.div animate={{ height }} transition={ease} className="relative overflow-hidden">
        <div ref={inner}>
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.div key={tabs[index].id} role="tabpanel" custom={dir} variants={panel} initial="enter" animate="center" exit="exit" transition={ease}>
              {tabs[index].content}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
