'use client'

import { Children, isValidElement, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent as ReactPointerEvent, ReactElement, ReactNode, Ref } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { spring } from '../../lib/motion'

/*
 * Panels you resize by their edges. Drag a handle and the space passes between its neighbours;
 * at a panel's smallest it resists, and a panel that can close snaps shut once it's dragged past
 * half its smallest, then springs open again from the same handle. A double click on a handle,
 * or Enter on it, closes or opens its closable neighbour. The arrow keys move a focused handle.
 * Groups nest, across and down, and can remember their sizes.
 *
 * Write it as you'd draw it: a PanelGroup holding Panels with ResizeHandles between them.
 */

export type PanelProps = {
  id: string
  /** Its share of the group to start with, in percent. */
  defaultSize: number
  /** The smallest it goes, in percent, before it resists or closes. */
  minSize?: number
  /** It can close to nothing by being dragged small. */
  collapsible?: boolean
  children?: ReactNode
}
export type PanelGroupHandle = { resize(id: string, size: number): void; collapse(id: string): void; expand(id: string): void }

/** A panel: its content and its rules. The group lays it out. */
export function Panel(props: PanelProps) {
  void props
  return null
}
/** The handle between two panels. */
export function ResizeHandle() {
  return null
}

const isPanel = (el: unknown): el is ReactElement<PanelProps> => isValidElement(el) && el.type === Panel
const isHandle = (el: unknown): el is ReactElement => isValidElement(el) && el.type === ResizeHandle

export function PanelGroup({ direction = 'horizontal', storageKey, children, className = '', ref }: { direction?: 'horizontal' | 'vertical'; /** Remember the sizes under this key. */ storageKey?: string; children: ReactNode; className?: string; ref?: Ref<PanelGroupHandle> }) {
  const items = Children.toArray(children)
  const panels = items.filter(isPanel).map((p) => p.props)
  const sizes = useMotionValue(panels.map((p) => p.defaultSize))
  // The size each closable panel had before it closed, to open back to.
  const before = useRef<Record<string, number>>({})
  const box = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const across = direction === 'horizontal'

  /** Springs every panel to its new size together, and remembers the layout. */
  const ease = (to: number[]) => {
    if (reduce) sizes.set(to)
    else {
      const from = sizes.get()
      animate(0, 1, { ...spring.smooth, onUpdate: (v) => sizes.set(from.map((f, i) => f + (to[i] - f) * v)) })
    }
    if (storageKey)
      try {
        localStorage.setItem(storageKey, JSON.stringify(to))
      } catch {
        /* Not remembered in private mode; still works. */
      }
  }

  useEffect(() => {
    if (!storageKey) return
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as number[] | null
      if (saved?.length === panels.length) sizes.set(saved)
    } catch {
      /* A bad value is ignored. */
    }
    // Read once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Moves the edge after panel `k` by `delta` percent, within both panels' rules. */
  const shift = (start: number[], k: number, delta: number, live: boolean) => {
    const a = panels[k]
    const b = panels[k + 1]
    const pair = start[k] + start[k + 1]
    let x = start[k] + delta
    const minA = a.minSize ?? 0
    const minB = b.minSize ?? 0
    // Below the smallest, a closable panel shuts past half of it; otherwise it resists.
    if (x < minA) x = a.collapsible && x < minA / 2 ? (live ? Math.max(0, x * 0.5) : 0) : live ? minA - (minA - x) * 0.15 : minA
    if (pair - x < minB) {
      const y = pair - x
      x = pair - (b.collapsible && y < minB / 2 ? (live ? Math.max(0, y * 0.5) : 0) : live ? minB - (minB - y) * 0.15 : minB)
    }
    const next = [...start]
    next[k] = Math.max(0, Math.min(pair, x))
    next[k + 1] = pair - next[k]
    return next
  }

  const indexOf = (id: string) => panels.findIndex((p) => p.id === id)
  const neighbour = (i: number) => (i < panels.length - 1 ? i : i - 1)
  const collapse = (id: string) => {
    const i = indexOf(id)
    const cur = sizes.get()
    if (i < 0 || cur[i] === 0) return
    before.current[id] = cur[i]
    const j = i === neighbour(i) ? i + 1 : i - 1
    const to = [...cur]
    to[j] += to[i]
    to[i] = 0
    ease(to)
  }
  const expand = (id: string) => {
    const i = indexOf(id)
    const cur = sizes.get()
    if (i < 0 || cur[i] > 0) return
    const want = before.current[id] ?? panels[i].defaultSize
    const j = i === neighbour(i) ? i + 1 : i - 1
    const to = [...cur]
    const give = Math.min(want, to[j] - (panels[j].minSize ?? 0))
    to[i] = give
    to[j] -= give
    ease(to)
  }
  useImperativeHandle(ref, () => ({
    resize: (id, size) => {
      const i = indexOf(id)
      if (i < 0) return
      const k = neighbour(i)
      const cur = sizes.get()
      ease(shift(cur, k, k === i ? size - cur[i] : cur[i] - size, false))
    },
    collapse,
    expand,
  }))

  let p = -1
  let h = -1
  return (
    <div ref={box} className={`flex h-full w-full ${across ? 'flex-row' : 'flex-col'} ${className}`}>
      {items.map((el) => {
        if (isPanel(el)) {
          p++
          return (
            <Pane key={el.props.id} i={p} sizes={sizes}>
              {el.props.children}
            </Pane>
          )
        }
        if (isHandle(el)) {
          h++
          const k = h
          const closable = panels[k].collapsible ? panels[k].id : panels[k + 1]?.collapsible ? panels[k + 1].id : null
          return (
            <Handle
              key={`handle-${k}`}
              k={k}
              across={across}
              sizes={sizes}
              label={`Resize ${panels[k].id} and ${panels[k + 1]?.id}`}
              onDrag={(start, deltaPx, live) => {
                const total = (across ? box.current?.offsetWidth : box.current?.offsetHeight) || 1
                const next = shift(start, k, (deltaPx / total) * 100, live)
                if (live) sizes.set(next)
                else ease(next)
                return next
                if (!live) {
                  if (next[k] === 0) before.current[panels[k].id] = Math.max(panels[k].minSize ?? 0, before.current[panels[k].id] ?? panels[k].defaultSize)
                  if (next[k + 1] === 0) before.current[panels[k + 1].id] = Math.max(panels[k + 1].minSize ?? 0, before.current[panels[k + 1].id] ?? panels[k + 1].defaultSize)
                }
              }}
              onToggle={() => {
                if (!closable) return
                const i = indexOf(closable)
                if (sizes.get()[i] === 0) expand(closable)
                else collapse(closable)
              }}
              onStep={(d) => ease(shift(sizes.get(), k, d, false))}
            />
          )
        }
        return el
      })}
    </div>
  )
}

function Pane({ i, sizes, children }: { i: number; sizes: MotionValue<number[]>; children: ReactNode }) {
  const basis = useTransform(sizes, (s) => `${s[i]}%`)
  // Closing, its content fades before it's gone, so nothing squashes on its way out.
  const opacity = useTransform(sizes, (s) => Math.min(1, s[i] / 4))
  return (
    <motion.div className="relative min-h-0 min-w-0 shrink-0 grow-0 overflow-hidden" style={{ flexBasis: basis }}>
      <motion.div className="h-full w-full" style={{ opacity }}>
        {children}
      </motion.div>
    </motion.div>
  )
}

function Handle({ k, across, sizes, label, onDrag, onToggle, onStep }: { k: number; across: boolean; sizes: MotionValue<number[]>; label: string; onDrag: (start: number[], deltaPx: number, live: boolean) => number[]; onToggle: () => void; onStep: (d: number) => void }) {
  const start = useRef<{ at: number; sizes: number[]; scale: number } | null>(null)
  const [active, setActive] = useState(false)
  const [now, setNow] = useState(() => Math.round(sizes.get()[k]))
  const pos = (e: ReactPointerEvent) => (across ? e.clientX : e.clientY)
  const keys = (e: KeyboardEvent) => {
    const back = across ? 'ArrowLeft' : 'ArrowUp'
    const fwd = across ? 'ArrowRight' : 'ArrowDown'
    if (e.key === back || e.key === fwd) {
      e.preventDefault()
      onStep((e.key === fwd ? 1 : -1) * (e.shiftKey ? 10 : 2))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      onToggle()
    } else return
    setNow(Math.round(sizes.get()[k]))
  }
  return (
    <div
      role="separator"
      aria-orientation={across ? 'vertical' : 'horizontal'}
      aria-label={label}
      aria-valuenow={now}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onPointerDown={(e) => {
        const el = e.currentTarget
        el.setPointerCapture(e.pointerId)
        const r = el.getBoundingClientRect()
        start.current = { at: pos(e), sizes: sizes.get(), scale: (across ? r.width / (el.offsetWidth || 1) : r.height / (el.offsetHeight || 1)) || 1 }
        setActive(true)
      }}
      onPointerMove={(e) => {
        const s = start.current
        if (s) onDrag(s.sizes, (pos(e) - s.at) / s.scale, true)
      }}
      onPointerUp={(e) => {
        const s = start.current
        if (!s) return
        start.current = null
        setActive(false)
        // Reported where it's heading, not where the spring happens to be.
        setNow(Math.round(onDrag(s.sizes, (pos(e) - s.at) / s.scale, false)[k]))
      }}
      onDoubleClick={onToggle}
      onKeyDown={keys}
      className={`group/handle ring-focus relative z-10 shrink-0 touch-none ${across ? '-mx-1 w-2 cursor-col-resize' : '-my-1 h-2 cursor-row-resize'}`}
    >
      <span className={`absolute bg-[var(--line)] ${across ? 'inset-y-0 left-1/2 w-px -translate-x-1/2' : 'inset-x-0 top-1/2 h-px -translate-y-1/2'}`} />
      <span
        className={`absolute rounded-full transition-[background-color,opacity] duration-150 ${across ? 'left-1/2 top-1/2 h-8 w-[3px] -translate-x-1/2 -translate-y-1/2' : 'left-1/2 top-1/2 h-[3px] w-8 -translate-x-1/2 -translate-y-1/2'} ${active ? 'bg-[var(--accent)] opacity-100' : 'bg-[var(--ink-3)] opacity-0 group-hover/handle:opacity-100 group-focus-visible/handle:opacity-100'}`}
      />
    </div>
  )
}
