'use client'

import { tap } from '../../lib/feel'
import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, Ref } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown } from '../../icons'
import { ease } from '../../lib/motion'
import { Morph } from '../../ui/Morph'
import { RollingText } from '../../ui/RollingText'

export type Model = {
  id: string
  name: string
  blurb: string
  /** Seconds for a typical reply at medium effort. */
  time: number
  /** Dollars for a typical run at medium effort. */
  cost: number
  /** Whether reasoning effort can be set. */
  reasons: boolean
  /** A word after the name, like "New". */
  badge?: string
  /** The model's colour. Its effort bars fill in it, so the setting says which model too. */
  tint?: string
}
export type ModelValue = { model: string; effort: number }
export type PickerHandle = { open(): void; close(): void; point(i: number): void; effort(e: number): void; choose(i: number): void }

const EFFORT = ['Low', 'Medium', 'High', 'Max']
const TIME = [0.5, 1, 2, 3.5]
const COST = [0.55, 1, 1.9, 3.4]
const ROW = 54

/** What a run costs in time and money at a given effort. Models that don't reason ignore it. */
const facts = (m: Model, effort: number) => {
  const e = m.reasons ? effort : 1
  return { time: Math.max(1, Math.round(m.time * TIME[e])), cost: m.cost * COST[e] }
}

/**
 * Choosing a model, and how hard it should think.
 *
 * The list is just names and one line each, with a highlight that glides for the pointer and
 * jumps for the keyboard. Effort is four bars that rise as they fill; the same bars sit small
 * in the trigger, so you can read the setting without opening anything. Under them, one quiet
 * line says what a reply will take, and its numbers roll as you browse and push the effort.
 */
export function ModelPicker({ models, value, onChange, ref }: {
  /** The models to choose from, with what each is good at. */
  models: Model[]
  /** The chosen model and how hard it thinks. */
  value: ModelValue
  /** Called with the new model and effort. */
  onChange: (v: ModelValue) => void
  ref?: Ref<PickerHandle>
}) {
  const [open, setOpen] = useState(false)
  const chosen = Math.max(
    0,
    models.findIndex((m) => m.id === value.model),
  )
  const [point, setPoint] = useState(chosen)
  const [effort, setEffort] = useState(value.effort)
  const [keys, setKeys] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  // Only a person opening it moves focus; the demo driving it never steals focus from the page.
  const grab = useRef(false)
  const show = (focus = true) => {
    grab.current = focus
    setPoint(chosen)
    setEffort(value.effort)
    setOpen(true)
  }
  const hide = (refocus = true) => {
    setOpen(false)
    if (refocus) trigger.current?.focus({ preventScroll: true })
  }
  const choose = (i: number, refocus = true) => {
    onChange({ model: models[i].id, effort })
    hide(refocus)
  }
  useImperativeHandle(ref, () => ({ open: () => show(false), close: () => hide(false), point: setPoint, effort: setEffort, choose: (i) => choose(i, false) }))

  useEffect(() => {
    if (open && grab.current) panel.current?.focus({ preventScroll: true })
  }, [open])

  // Clicking anywhere else closes it.
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const away = (e: globalThis.PointerEvent) => !root.current?.contains(e.target as Node) && hide(false)
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])

  const onKey = (e: KeyboardEvent) => {
    const go: Record<string, () => void> = {
      ArrowDown: () => setPoint((p) => Math.min(models.length - 1, p + 1)),
      ArrowUp: () => setPoint((p) => Math.max(0, p - 1)),
      ArrowRight: () => models[point].reasons && setEffort((x) => Math.min(3, x + 1)),
      ArrowLeft: () => models[point].reasons && setEffort((x) => Math.max(0, x - 1)),
      Enter: () => choose(point),
      Escape: () => hide(),
    }
    const f = go[e.key]
    if (!f) return
    e.preventDefault()
    setKeys(true)
    f()
  }

  const m = models[point]
  const now = facts(m, effort)
  const cur = models[chosen]

  // Every label the trigger can show, measured up front so it resizes on a spring instead of snapping.
  const views = Object.fromEntries(
    models.flatMap((x) =>
      EFFORT.map((_, e) => [
        `${x.id}-${e}`,
        <span key={`${x.id}-${e}`} className="flex h-8 items-center gap-2 pl-3 pr-2.5 text-footnote font-medium">
          {x.name}
          {x.reasons && <Bars level={e} small tint={x.tint} />}
          <ChevronDown size={13} className="text-ink-3" />
        </span>,
      ]),
    ),
  )

  return (
    // The panel opens above the trigger and floats; nothing around it moves.
    <div ref={root} className="relative">
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Choose a model"
            onKeyDown={onKey}
            onPointerMove={() => setKeys(false)}
            className="glass absolute bottom-full left-0 mb-2 w-[320px] rounded-[20px] bg-surface p-2 shadow-modal outline-none"
            style={{ transformOrigin: '24px 100%' }}
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98, transition: { duration: 0.14, ease: ease.exit } }}
            transition={{ type: 'spring', stiffness: 520, damping: 36 }}
          >
            <div
              ref={panel}
              role="listbox"
              data-part="list"
              aria-label="Model"
              aria-activedescendant={`model-${m.id}`}
              tabIndex={-1}
              className="relative outline-none"
              onPointerLeave={() => !keys && setPoint(chosen)}
            >
              {/* One highlight glides for the pointer and jumps for the keyboard. */}
              <motion.span
                aria-hidden
                className="absolute inset-x-0 top-0 rounded-[12px] bg-surface-2"
                style={{ height: ROW }}
                initial={false}
                animate={{ y: point * ROW }}
                transition={keys ? { duration: 0 } : { type: 'spring', stiffness: 700, damping: 48 }}
              />
              {models.map((x, i) => (
                <button
                  key={x.id}
                  id={`model-${x.id}`}
                  type="button"
                  role="option"
                  aria-selected={i === chosen}
                  tabIndex={-1}
                  onPointerEnter={() => setPoint(i)}
                  onClick={() => choose(i)}
                  className="relative flex w-full items-center gap-3 rounded-[12px] px-3 text-left"
                  style={{ height: ROW }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-callout font-medium leading-5 text-ink">
                      {x.name}
                      {x.badge && <span className="text-caption font-medium text-accent">{x.badge}</span>}
                    </span>
                    <span className="mt-0.5 block truncate text-footnote text-ink-3">{x.blurb}</span>
                  </span>
                  <span className="flex w-4 shrink-0 justify-center text-ink">{i === chosen && <Check size={14} strokeWidth={2.6} />}</span>
                </button>
              ))}
            </div>

            <Effort value={effort} onChange={setEffort} disabled={!m.reasons} time={now.time} cost={now.cost} tint={m.tint} />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        data-invite
        aria-label={`Model: ${cur.name}${cur.reasons ? `, ${EFFORT[value.effort]} effort` : ''}`}
        onPointerDown={tap}
        onClick={() => (open ? hide() : show())}
        onKeyDown={(e) => {
          if (!open && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            e.preventDefault()
            show()
          }
        }}
        data-part="trigger"
        className="sink ring-focus group/trigger rounded-full"
      >
        <Morph
          view={`${cur.id}-${value.effort}`}
          views={views}
          radius={16}
          anchor="center"
          justify="start"
          className={`transition-colors duration-150 ${open ? 'bg-surface-2 text-ink' : 'text-ink-2 group-hover/trigger:bg-surface-2 group-hover/trigger:text-ink'}`}
        />
      </button>
    </div>
  )
}

/**
 * Effort as four rising bars. Filled bars stand at full height; empty ones wait a little
 * shorter and lighter, so pushing the effort makes each one spring up into place.
 */
function Bars({ level, small, dim, tint }: { level: number; small?: boolean; dim?: boolean; tint?: string }) {
  const h = small ? [4, 6, 8, 10] : [7, 11, 15, 19]
  return (
    <span aria-hidden className={`flex items-end ${small ? 'h-2.5 gap-[1.5px]' : 'h-[19px] gap-[3px]'}`} style={{ opacity: dim ? 0.4 : 1 }}>
      {h.map((px, i) => {
        const on = i <= level
        return (
          <motion.span
            key={i}
            className={`block rounded-full transition-[background-color] duration-300 ${small ? 'w-[2.5px]' : 'w-[5px]'}`}
            style={{ height: px, originY: 1, backgroundColor: on ? (tint ?? 'var(--ink)') : 'var(--surface-3)' }}
            initial={false}
            animate={{ scaleY: on ? 1 : 0.72 }}
            transition={{ type: 'spring', stiffness: 760, damping: 17, delay: on ? Math.max(0, i - 1) * 0.03 : 0 }}
          />
        )
      })}
    </span>
  )
}

/** The effort control and what a reply will take. Models that can't reason dim it and say so; the panel never changes shape. */
function Effort({ value, onChange, disabled, time, cost, tint }: {
  value: number
  onChange: (v: number) => void
  disabled: boolean
  time: number
  cost: number
  tint?: string
}) {
  const box = useRef<HTMLSpanElement>(null)
  const dragging = useRef(false)
  const at = (clientX: number) => {
    const r = box.current!.getBoundingClientRect()
    return Math.max(0, Math.min(3, Math.floor(((clientX - r.left) / r.width) * 4)))
  }
  const down = (e: PointerEvent) => {
    if (disabled) return
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      /* not a real pointer */
    }
    dragging.current = true
    onChange(at(e.clientX))
  }
  const move = (e: PointerEvent) => {
    if (!dragging.current) return
    const s = at(e.clientX)
    if (s !== value) onChange(s)
  }
  const label = disabled ? 'Fixed' : EFFORT[value]

  return (
    <div data-part="effort" className="mt-1.5 px-3 pb-2.5 pt-3 shadow-[inset_0_1px_0_var(--line)]">
      <div className="flex items-center gap-3">
        <span className="flex-1 text-footnote font-medium text-ink">Effort</span>
        <span data-part="level" className="relative h-5 w-[56px] text-right text-footnote text-ink-2">
          <AnimatePresence initial={false}>
            <motion.span
              key={label}
              className="absolute inset-0"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.18, ease: ease.out }}
            >
              {label}
            </motion.span>
          </AnimatePresence>
        </span>
        <span
          ref={box}
          role="slider"
          data-part="bars"
          aria-label="Reasoning effort"
          aria-valuemin={0}
          aria-valuemax={3}
          aria-valuenow={value}
          aria-valuetext={label}
          aria-disabled={disabled}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
          className={`-m-1.5 flex touch-none p-1.5 ${disabled ? '' : 'cursor-pointer'}`}
        >
          <Bars level={disabled ? 1 : value} dim={disabled} tint={disabled ? undefined : tint} />
        </span>
      </div>
      <p data-part="facts" className="mt-1.5 flex items-center text-footnote text-ink-3">
        About&nbsp;
        <RollingText text={`${time}s`} />
        &nbsp;a reply · $
        <RollingText text={cost.toFixed(3)} />
        &nbsp;a run
      </p>
    </div>
  )
}

