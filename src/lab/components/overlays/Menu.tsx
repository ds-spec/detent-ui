'use client'

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode, Ref } from 'react'
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'motion/react'
import { Check, ChevronRight } from '../../icons'
import { tap } from '../../lib/feel'
import { ease, spring, dur } from '../../lib/motion'
import { frameOf, inFrame, originOf, place, useHost } from '../../lib/layer'
import type { Side } from '../../lib/layer'

export type MenuItem =
  | { kind?: 'item'; label: string; icon?: ReactNode; shortcut?: string; danger?: boolean; disabled?: boolean; onSelect?: () => void }
  | { kind: 'check'; label: string; icon?: ReactNode; shortcut?: string; checked: boolean; onCheckedChange: (next: boolean) => void; disabled?: boolean }
  | { kind: 'sub'; label: string; icon?: ReactNode; shortcut?: string; items: MenuItem[]; disabled?: boolean }
  | { kind: 'separator' }
  | { kind: 'label'; label: string }

export type MenuControl = { point(path: number[]): void; choose(path: number[]): void }

const usable = (it: MenuItem) => (it.kind === undefined || it.kind === 'item' || it.kind === 'check' || it.kind === 'sub') && !('disabled' in it && it.disabled)
const labelOf = (it: MenuItem) => ('label' in it ? it.label : '')

type Pt = { x: number; y: number }
const inside = (p: Pt, a: Pt, b: Pt, c: Pt) => {
  const s = (p1: Pt, p2: Pt, p3: Pt) => (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y)
  const d1 = s(p, a, b)
  const d2 = s(p, b, c)
  const d3 = s(p, c, a)
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))
}

export function MenuPanel({
  items,
  label,
  via: startVia,
  instant = startVia === 'keys',
  quiet,
  onClose,
  onBack,
  side = 'bottom',
  arrow = 0,
  at,
  control,
  panelRef,
  depth = 0,
}: {
  items: MenuItem[]
  label: string
  via: 'pointer' | 'keys'
  instant?: boolean
  quiet: boolean
  onClose: (chose: boolean) => void
  onBack?: () => void
  side?: Side
  arrow?: number
  at: { x: number; y: number } | null
  control?: Ref<MenuControl>
  panelRef?: (el: HTMLDivElement | null) => void
  depth?: number
}) {
  const [active, setActive] = useState(startVia === 'keys' ? items.findIndex(usable) : -1)
  const [via, setVia] = useState(startVia)
  const [sub, setSub] = useState<{ index: number; via: 'pointer' | 'keys' } | null>(null)
  const [subAt, setSubAt] = useState<{ x: number; y: number; side: Side } | null>(null)
  const [plate, setPlate] = useState<{ y: number; h: number } | null>(null)
  const box = useRef<HTMLDivElement | null>(null)
  const rows = useRef<(HTMLDivElement | null)[]>([])
  const subBox = useRef<HTMLDivElement | null>(null)
  const subControl = useRef<MenuControl>(null)
  const typed = useRef({ text: '', at: 0 })
  const aim = useRef<{ from: Pt; until: number } | null>(null)
  const hover = useRef(0)
  const flash = useAnimationControls()
  const reduce = useReducedMotion()
  const { frame } = useHost()

  useLayoutEffect(() => {
    const el = active >= 0 ? rows.current[active] : null
    setPlate(el ? { y: el.offsetTop, h: el.offsetHeight } : null)
  }, [active])

  useEffect(() => {
    if (at && !quiet) box.current?.focus({ preventScroll: true })
  }, [at, quiet])

  useEffect(() => () => clearTimeout(hover.current), [])

  const openSub = (i: number, how: 'pointer' | 'keys') => {
    const row = rows.current[i]
    if (!row) return
    setSub({ index: i, via: how })
    setSubAt(null)
  }

  useLayoutEffect(() => {
    if (!sub || subAt || !subBox.current) return
    const row = rows.current[sub.index]
    if (!row) return
    const f = frameOf(frame)
    const anchor = inFrame(row.getBoundingClientRect(), f)
    const size = { w: subBox.current.offsetWidth, h: subBox.current.offsetHeight }
    const p = place({ ...anchor, y: anchor.y - 4 }, size, f, 'right', 'start', 2, 8)
    setSubAt({ x: p.x, y: p.y, side: p.side })
  }, [sub, subAt, frame])

  const choose = async (i: number, how: 'pointer' | 'keys') => {
    const it = items[i]
    if (!it || !usable(it)) return
    if (it.kind === 'sub') return openSub(i, how)
    if (it.kind === 'check') {
      it.onCheckedChange(!it.checked)
      return
    }
    if (!reduce) await flash.start({ opacity: [1, 0.25, 1], transition: { duration: 0.16, times: [0, 0.5, 1], ease: ease.out } })
    onClose(true)
    if (it.kind === undefined || it.kind === 'item') it.onSelect?.()
  }

  useImperativeHandle(control, () => ({
    point: (path) => {
      setVia('pointer')
      setActive(path[0])
      if (path.length > 1) {
        openSub(path[0], 'pointer')
        const rest = path.slice(1)
        const go = (n: number) => (subControl.current ? subControl.current.point(rest) : n && setTimeout(() => go(n - 1), 40))
        setTimeout(() => go(10), 60)
      } else if (sub && sub.index !== path[0]) setSub(null)
    },
    choose: (path) => {
      if (path.length > 1) return subControl.current?.choose(path.slice(1))
      choose(path[0], 'pointer')
    },
  }))

  const move = (d: 1 | -1) => {
    const n = items.length
    for (let k = 1; k <= n; k++) {
      const i = ((((active < 0 ? (d > 0 ? -1 : 0) : active) + d * k) % n) + n) % n
      if (usable(items[i])) return setActive(i)
    }
  }

  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    if (sub) return
    setVia('keys')
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      move(e.key === 'ArrowDown' ? 1 : -1)
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      const order = items.map((it, i) => (usable(it) ? i : -1)).filter((i) => i >= 0)
      setActive(e.key === 'Home' ? order[0] : order[order.length - 1])
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (active >= 0) {
        tap()
        choose(active, 'keys')
      }
    } else if (e.key === 'ArrowRight' && active >= 0 && items[active].kind === 'sub') {
      e.preventDefault()
      openSub(active, 'keys')
    } else if (e.key === 'ArrowLeft' && onBack) {
      e.preventDefault()
      onBack()
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      const now = e.timeStamp
      typed.current = { text: (now - typed.current.at < 600 ? typed.current.text : '') + e.key.toLowerCase(), at: now }
      const q = typed.current.text
      const start = active < 0 ? 0 : active + (q.length === 1 ? 1 : 0)
      for (let k = 0; k < items.length; k++) {
        const i = (start + k) % items.length
        if (usable(items[i]) && labelOf(items[i]).toLowerCase().startsWith(q)) return setActive(i)
      }
    }
  }

  const heading = (p: Pt, now: number) => {
    const a = aim.current
    const s = subBox.current?.getBoundingClientRect()
    if (!a || !s || now > a.until) return false
    const near = subAt?.side === 'left' ? s.right : s.left
    return inside(p, a.from, { x: near, y: s.top - 6 }, { x: near, y: s.bottom + 6 })
  }

  const enter = (i: number, e: { clientX: number; clientY: number; timeStamp: number }) => {
    if (heading({ x: e.clientX, y: e.clientY }, e.timeStamp)) return
    setVia('pointer')
    setActive(usable(items[i]) ? i : -1)
    clearTimeout(hover.current)
    if (items[i].kind === 'sub' && usable(items[i])) hover.current = window.setTimeout(() => openSub(i, 'pointer'), 110)
    else if (sub) hover.current = window.setTimeout(() => setSub(null), 140)
  }

  const danger = active >= 0 && items[active] && 'danger' in items[active] && (items[active] as { danger?: boolean }).danger
  const subItem = sub ? items[sub.index] : null

  return (
    <>
      <motion.div
        ref={(el) => {
          box.current = el
          panelRef?.(el)
        }}
        role="menu"
        aria-label={label}
        tabIndex={-1}
        onKeyDown={keys}
        onPointerLeave={(e) => {
          if (!sub) setActive(-1)
          else aim.current = { from: { x: e.clientX, y: e.clientY }, until: e.timeStamp + 400 }
        }}
        className="absolute left-0 top-0 min-w-[224px] rounded-menu bg-surface p-1 shadow-modal outline-none"
        style={{ x: at?.x ?? 0, y: at?.y ?? 0, visibility: at ? 'visible' : 'hidden', transformOrigin: originOf(side, arrow), pointerEvents: 'auto' }}
        initial={instant ? false : reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
        animate={at || instant ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
        exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12, ease: ease.out } }}
        transition={{ duration: 0.18, ease: ease.out }}
      >
        <div className="relative">
          <motion.div
            aria-hidden
            className={`pointer-events-none absolute inset-x-0 top-0 rounded-[10px] ${danger ? 'bg-[color-mix(in_oklch,var(--danger)_12%,transparent)]' : 'bg-surface-2'}`}
            initial={false}
            animate={plate ? { y: plate.y, height: plate.h, opacity: 1 } : { opacity: 0 }}
            transition={via === 'pointer' ? spring.snappy : { duration: 0 }}
          >
            <motion.div className="h-full w-full rounded-[inherit] bg-[inherit]" animate={flash} />
          </motion.div>
          {items.map((it, i) => {
            if (it.kind === 'separator') return <div key={i} ref={(el) => void (rows.current[i] = el)} role="separator" className="mx-2 my-1 h-px bg-line" />
            if (it.kind === 'label')
              return (
                <div key={i} ref={(el) => void (rows.current[i] = el)} className="flex h-7 items-center px-2.5 text-caption text-ink-3">
                  {it.label}
                </div>
              )
            const on = i === active
            const isDanger = 'danger' in it && it.danger
            return (
              <div
                key={i}
                ref={(el) => void (rows.current[i] = el)}
                role={it.kind === 'check' ? 'menuitemcheckbox' : 'menuitem'}
                aria-checked={it.kind === 'check' ? it.checked : undefined}
                aria-haspopup={it.kind === 'sub' ? 'menu' : undefined}
                aria-expanded={it.kind === 'sub' ? sub?.index === i : undefined}
                aria-disabled={it.disabled || undefined}
                onPointerMove={(e) => (active !== i || via !== 'pointer') && enter(i, e)}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => {
                  tap()
                  choose(i, 'pointer')
                }}
                className={`relative flex h-8 pointer-coarse:h-10 cursor-default select-none items-center gap-2.5 rounded-[10px] px-2.5 text-callout transition-colors duration-100 ${it.disabled ? 'text-ink-3/70' : isDanger ? 'text-danger' : on ? 'text-ink' : 'text-ink-2'}`}
              >
                {it.kind === 'check' ? (
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    <AnimatePresence initial={false}>
                      {it.checked && (
                        <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6, transition: { duration: dur.exit, ease: ease.out } }} transition={spring.snappy}>
                          <Check size={15} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                ) : it.icon ? (
                  <span className={`flex size-4 shrink-0 items-center justify-center ${isDanger ? '' : 'text-ink-3'}`}>{it.icon}</span>
                ) : null}
                <span className="min-w-0 flex-1 truncate">{it.label}</span>
                {'shortcut' in it && it.shortcut && <span className="shrink-0 pl-4 text-footnote tracking-[0.04em] text-ink-3">{it.shortcut}</span>}
                {it.kind === 'sub' && (
                  <span className="-mr-1 shrink-0 text-ink-3">
                    <ChevronRight size={15} />
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>
      <AnimatePresence>
        {sub && subItem && subItem.kind === 'sub' && (
          <MenuPanel
            key={sub.index}
            items={subItem.items}
            label={subItem.label}
            via={sub.via}
            quiet={quiet}
            at={subAt}
            side={subAt?.side === 'left' ? 'left' : 'right'}
            arrow={14}
            depth={depth + 1}
            control={subControl}
            panelRef={(el) => void (subBox.current = el)}
            onClose={onClose}
            onBack={() => {
              setSub(null)
              if (!quiet) box.current?.focus({ preventScroll: true })
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
