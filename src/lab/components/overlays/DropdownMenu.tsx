'use client'

import { cloneElement, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactElement, Ref } from 'react'
import { AnimatePresence } from 'motion/react'
import { tap } from '../../lib/feel'
import { Layer, fill, frameOf, inFrame, place, useDismiss, useHost, useReposition } from '../../lib/layer'
import type { Align, Side } from '../../lib/layer'
import { MenuPanel } from './Menu'
import type { MenuControl, MenuItem } from './Menu'

/** For demos and tests: open the menu and point at or choose items by path, without touching focus. */
export type DropdownHandle = MenuControl & { open(): void; close(): void }

/**
 * A menu that opens from a button. It grows out of the button's edge, flips to the other side
 * when there's no room, and slides along to stay on screen. The keyboard opens it with the
 * first item ready; the pointer opens it with nothing highlighted until you point. Items can
 * carry an icon, a shortcut, a check, a submenu or a warning colour.
 */
export function DropdownMenu({
  trigger,
  items,
  label,
  side = 'bottom',
  align = 'start',
  ref,
}: {
  /** The button that opens it. It gets the menu's ARIA wiring. */
  trigger: ReactElement<Record<string, unknown>>
  /** What's in the menu: items, checks, submenus, separators and labels. */
  items: MenuItem[]
  /** Accessible name for the menu. */
  label: string
  /** Which side of the button it prefers. */
  side?: Side
  /** How it lines up with the button along that side. */
  align?: Align
  ref?: Ref<DropdownHandle>
}) {
  const [state, setState] = useState<{ via: 'pointer' | 'keys'; quiet: boolean } | null>(null)
  const [at, setAt] = useState<ReturnType<typeof place> | null>(null)
  const anchor = useRef<HTMLSpanElement>(null)
  const layer = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement | null>(null)
  const control = useRef<MenuControl>(null)
  const { contained, frame } = useHost()

  const show = (via: 'pointer' | 'keys', quiet: boolean) => {
    setAt(null)
    setState({ via, quiet })
  }
  const close = () => {
    const quiet = state?.quiet
    setState(null)
    if (!quiet) anchor.current?.querySelector<HTMLElement>('button,[tabindex]')?.focus({ preventScroll: true })
  }

  const measure = () => {
    if (!panel.current || !anchor.current) return
    const f = frameOf(frame)
    setAt(place(inFrame(anchor.current.getBoundingClientRect(), f), { w: panel.current.offsetWidth, h: panel.current.offsetHeight }, f, side, align, 6))
  }
  useLayoutEffect(() => {
    if (state && !at) measure()
  })
  useReposition(!!state, measure)
  useDismiss(!!state, [layer, anchor], close)

  useImperativeHandle(ref, () => ({
    open: () => show('pointer', true),
    close: () => setState(null),
    point: (path) => control.current?.point(path),
    choose: (path) => control.current?.choose(path),
  }))

  const keys = (e: KeyboardEvent) => {
    if (state || !['ArrowDown', 'Enter', ' '].includes(e.key)) return
    e.preventDefault()
    show('keys', false)
  }

  return (
    <>
      <span ref={anchor} className="inline-flex" onClick={() => (state ? close() : (tap(), show('pointer', false)))} onKeyDown={keys}>
        {cloneElement(trigger, { 'aria-haspopup': 'menu', 'aria-expanded': !!state })}
      </span>
      <Layer>
        <div ref={layer} className={`${fill(contained)} pointer-events-none z-50`}>
          <AnimatePresence>{state && <MenuPanel key="menu" items={items} label={label} via={state.via} quiet={state.quiet} at={at} side={at?.side ?? side} arrow={at?.arrow ?? 0} control={control} panelRef={(el) => void (panel.current = el)} onClose={close} />}</AnimatePresence>
        </div>
      </Layer>
    </>
  )
}
