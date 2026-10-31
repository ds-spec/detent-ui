'use client'

import { useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, ReactNode, Ref } from 'react'
import { AnimatePresence } from 'motion/react'
import { Layer, fill, frameOf, inFrame, place, useDismiss, useHost } from '../../lib/layer'
import type { Box } from '../../lib/layer'
import { MenuPanel } from './Menu'
import type { MenuControl, MenuItem } from './Menu'

/** For demos and tests: open at a point in the area (its own pixels), then point at or choose items, without touching focus. */
export type ContextMenuHandle = MenuControl & { openAt(x: number, y: number): void; close(): void }

const HOLD = 480

/**
 * The menu behind a right-click. It opens at the exact point you pressed and grows from it,
 * flipping up or left near an edge so it never leaves the screen. On touch, holding a finger
 * still for half a second opens it; on a keyboard, the menu key or Shift+F10 opens it at the
 * middle of the area. Same items as a dropdown: icons, shortcuts, checks and submenus.
 */
export function ContextMenu({
  items,
  label,
  children,
  className = '',
  ref,
}: {
  /** What's in the menu. */
  items: MenuItem[]
  /** Accessible name for the menu. */
  label: string
  /** The area that has the menu. */
  children: ReactNode
  className?: string
  ref?: Ref<ContextMenuHandle>
}) {
  const [state, setState] = useState<{ via: 'pointer' | 'keys'; quiet: boolean; point: Box } | null>(null)
  const [at, setAt] = useState<ReturnType<typeof place> | null>(null)
  const area = useRef<HTMLDivElement>(null)
  const layer = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement | null>(null)
  const control = useRef<MenuControl>(null)
  const hold = useRef<{ t: number; x: number; y: number } | null>(null)
  const { contained, frame } = useHost()

  const openAtClient = (x: number, y: number, via: 'pointer' | 'keys', quiet: boolean) => {
    const f = frameOf(frame)
    setAt(null)
    setState({ via, quiet, point: inFrame({ left: x, top: y, width: 0, height: 0 }, f) })
  }
  const close = () => {
    const quiet = state?.quiet
    setState(null)
    if (!quiet && state?.via === 'keys') area.current?.focus({ preventScroll: true })
  }

  useLayoutEffect(() => {
    if (!state || at || !panel.current) return
    const f = frameOf(frame)
    setAt(place(state.point, { w: panel.current.offsetWidth, h: panel.current.offsetHeight }, f, 'bottom', 'start', 2))
  }, [state, at, frame])
  useDismiss(!!state, [layer], close)

  useImperativeHandle(ref, () => ({
    openAt: (x, y) => {
      const r = area.current?.getBoundingClientRect()
      if (!r || !area.current) return
      const scale = r.width / (area.current.offsetWidth || 1)
      openAtClient(r.left + x * scale, r.top + y * scale, 'pointer', true)
    },
    close: () => setState(null),
    point: (path) => control.current?.point(path),
    choose: (path) => control.current?.choose(path),
  }))

  const down = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') return
    const { clientX: x, clientY: y } = e
    hold.current = { x, y, t: window.setTimeout(() => openAtClient(x, y, 'pointer', false), HOLD) }
  }
  const moved = (e: PointerEvent) => {
    const h = hold.current
    if (h && Math.hypot(e.clientX - h.x, e.clientY - h.y) > 8) cancel()
  }
  const cancel = () => {
    if (hold.current) clearTimeout(hold.current.t)
    hold.current = null
  }
  const keys = (e: KeyboardEvent) => {
    if (e.key !== 'ContextMenu' && !(e.key === 'F10' && e.shiftKey)) return
    e.preventDefault()
    const r = area.current!.getBoundingClientRect()
    openAtClient(r.left + r.width / 2, r.top + r.height / 2, 'keys', false)
  }

  return (
    <>
      <div
        ref={area}
        tabIndex={0}
        aria-haspopup="menu"
        onContextMenu={(e) => {
          e.preventDefault()
          cancel()
          openAtClient(e.clientX, e.clientY, 'pointer', false)
        }}
        onPointerDown={down}
        onPointerMove={moved}
        onPointerUp={cancel}
        onPointerCancel={cancel}
        onKeyDown={keys}
        className={`ring-focus pointer-coarse:select-none [-webkit-touch-callout:none] ${className}`}
      >
        {children}
      </div>
      <Layer>
        <div ref={layer} className={`${fill(contained)} pointer-events-none z-50`}>
          <AnimatePresence>
            {state && <MenuPanel key={`${state.point.x},${state.point.y}`} items={items} label={label} via={state.via} quiet={state.quiet} at={at} side={at?.side ?? 'bottom'} arrow={at ? state.point.x - at.x : 0} control={control} panelRef={(el) => void (panel.current = el)} onClose={close} />}
          </AnimatePresence>
        </div>
      </Layer>
    </>
  )
}
