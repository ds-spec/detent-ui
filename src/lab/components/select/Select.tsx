'use client'

import { tap } from '../../lib/feel'
import { useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode, Ref } from 'react'
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'motion/react'
import { Check, Chevrons } from '../../icons'
import { ease, spring } from '../../lib/motion'

export type Option = { value: string; label: string; icon?: ReactNode; hint?: string; disabled?: boolean }

const ITEM = 36
const PAD = 4
const MAX_ALIGNED = 8
const EDGE = 8

export type SelectHandle = { open(): void; point(i: number): void; choose(i: number): void }

export function Select({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select…',
  ref,
}: {
  value: string | null
  onChange: (value: string) => void
  options: Option[]
  label: string
  placeholder?: string
  ref?: Ref<SelectHandle>
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [via, setVia] = useState<'pointer' | 'keys'>('pointer')
  const [place, setPlace] = useState<{ top: number; origin: number } | null>(null)
  const [width, setWidth] = useState<number>()
  const [dir, setDir] = useState(1)
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const probe = useRef<HTMLSpanElement>(null)
  const typed = useRef({ text: '', at: 0 })
  const closing = useRef(false)
  const quiet = useRef(false)
  const flash = useAnimationControls()
  const reduce = useReducedMotion()
  const id = useId()

  const index = options.findIndex((o) => o.value === value)
  const current = index >= 0 ? options[index] : null
  const aligned = options.length <= MAX_ALIGNED

  useLayoutEffect(() => {
    const el = probe.current
    if (!el) return
    const read = () => setWidth(Math.max(...[...el.children].map((c) => (c as HTMLElement).offsetWidth)) + 1)
    read()
    document.fonts?.ready.then(read)
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [options])

  const show = (how: 'pointer' | 'keys') => {
    quiet.current = false
    closing.current = false
    setVia(how)
    setActive(Math.max(0, index))
    setPlace(null)
    setOpen(true)
  }

  const hide = () => {
    setOpen(false)
    if (!quiet.current) trigger.current?.focus()
  }

  useLayoutEffect(() => {
    if (!open || !panel.current || !trigger.current) return
    const t = trigger.current
    const r = t.getBoundingClientRect()
    const scale = r.height / t.offsetHeight || 1
    const h = panel.current.offsetHeight
    const row = PAD + Math.max(0, index) * ITEM + ITEM / 2
    let top = aligned ? t.offsetHeight / 2 - row : t.offsetHeight + 6
    const absTop = r.top + top * scale
    if (absTop < EDGE) top += (EDGE - absTop) / scale
    const absBottom = r.top + (top + h) * scale
    if (absBottom > innerHeight - EDGE) top -= (absBottom - innerHeight + EDGE) / scale
    setPlace({ top, origin: aligned ? t.offsetHeight / 2 - top : 0 })
    if (!aligned && scroller.current) scroller.current.scrollTop = Math.max(0, index * ITEM - ITEM * 2)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (open && place && !quiet.current) panel.current?.focus({ preventScroll: true })
  }, [open, place])

  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      const t = e.target as Node
      if (!panel.current?.contains(t) && !trigger.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])

  const choose = (i: number) => {
    const o = options[i]
    if (!o || o.disabled || closing.current) return
    closing.current = true
    setActive(i)
    setDir(i >= index ? 1 : -1)
    if (o.value !== value) onChange(o.value)
    if (!reduce) flash.start({ opacity: [1, 0, 1], transition: { duration: 0.14, times: [0, 0.45, 1], ease: 'linear' } })
    window.setTimeout(hide, reduce ? 0 : 150)
  }

  const latest = useRef(choose)
  useLayoutEffect(() => {
    latest.current = choose
  })
  useImperativeHandle(ref, () => ({
    open: () => {
      closing.current = false
      quiet.current = true
      setVia('pointer')
      setActive(Math.max(0, index))
      setPlace(null)
      setOpen(true)
    },
    point: (i) => {
      setVia('pointer')
      setActive(i)
    },
    choose: (i) => latest.current(i),
  }))

  const move = (from: number, step: number) => {
    for (let n = 1; n <= options.length; n++) {
      const i = (from + step * n + options.length * n) % options.length
      if (!options[i].disabled) return i
    }
    return from
  }

  const onKeys = (e: KeyboardEvent) => {
    const keys: Record<string, () => void> = {
      ArrowDown: () => setActive((a) => move(a, 1)),
      ArrowUp: () => setActive((a) => move(a, -1)),
      Home: () => setActive(move(-1, 1)),
      End: () => setActive(move(options.length, -1)),
      Enter: () => choose(active),
      ' ': () => choose(active),
      Escape: () => hide(),
      Tab: () => setOpen(false),
    }
    if (keys[e.key]) {
      if (e.key !== 'Tab') e.preventDefault()
      setVia('keys')
      keys[e.key]()
      return
    }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      const now = Date.now()
      typed.current = { text: (now - typed.current.at < 500 ? typed.current.text : '') + e.key.toLowerCase(), at: now }
      const q = typed.current.text
      const start = q.length === 1 ? active + 1 : active
      for (let n = 0; n < options.length; n++) {
        const i = (start + n) % options.length
        if (!options[i].disabled && options[i].label.toLowerCase().startsWith(q)) {
          setVia('keys')
          setActive(i)
          break
        }
      }
    }
  }

  return (
    <div className="relative inline-block">
      <button
        ref={trigger}
        type="button"
        aria-label={`${label}: ${current?.label ?? placeholder}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        data-invite
        onPointerDown={tap}
        onClick={() => (open ? setOpen(false) : show('pointer'))}
        onKeyDown={(e) => {
          if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
            e.preventDefault()
            show('keys')
          }
        }}
        className={`sink ring-focus flex h-9 items-center gap-2 rounded-[10px] pl-3 pr-2 text-callout text-ink transition-colors duration-150 hover:bg-surface-3 ${open ? 'bg-surface-3' : 'bg-surface-2'}`}
      >
        <span className="relative flex items-center overflow-hidden" style={{ width }}>
          <AnimatePresence initial={false} mode="popLayout" custom={dir}>
            <motion.span
              key={current?.value ?? 'none'}
              custom={dir}
              className="flex items-center gap-2 whitespace-nowrap"
              variants={{
                in: (d: number) => ({ opacity: 0, y: d * 8 }),
                at: { opacity: 1, y: 0 },
                out: (d: number) => ({ opacity: 0, y: d * -8 }),
              }}
              initial="in"
              animate="at"
              exit="out"
              transition={{ duration: 0.2, ease: ease.out }}
            >
              {current ? (
                <>
                  {current.icon && <span className="flex size-4 items-center justify-center text-ink-2">{current.icon}</span>}
                  {current.label}
                </>
              ) : (
                <span className="text-ink-3">{placeholder}</span>
              )}
            </motion.span>
          </AnimatePresence>
        </span>
        <Chevrons size={14} className="text-ink-3" />
      </button>

      <span ref={probe} aria-hidden className="pointer-events-none invisible absolute left-0 top-0 -z-50 flex flex-col text-callout">
        {[...options, { value: '', label: placeholder }].map((o, i) => (
          <span key={i} className="flex w-max items-center gap-2 whitespace-nowrap">
            {'icon' in o && o.icon && <span className="size-4" />}
            {o.label}
          </span>
        ))}
      </span>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panel}
            id={`${id}-list`}
            role="listbox"
            aria-label={label}
            tabIndex={-1}
            aria-activedescendant={`${id}-${active}`}
            onKeyDown={onKeys}
            className="glass absolute z-50 rounded-menu bg-surface p-1 shadow-modal outline-none"
            style={{
              top: place?.top ?? 0,
              left: -2,
              minWidth: (trigger.current?.offsetWidth ?? 0) + 4,
              visibility: place ? 'visible' : 'hidden',
              transformOrigin: `50% ${place?.origin ?? 0}px`,
            }}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.14, ease: ease.out } }}
            exit={{ opacity: 0, transition: { duration: 0.12, ease: ease.out } }}
          >
            <div ref={scroller} className="relative overflow-y-auto overscroll-contain [scrollbar-width:none]" style={{ maxHeight: MAX_ALIGNED * ITEM }}>
              <motion.div
                aria-hidden
                className="absolute inset-x-0 top-0"
                style={{ height: ITEM }}
                initial={false}
                animate={{ y: active * ITEM }}
                transition={via === 'keys' ? { duration: 0 } : spring.snappy}
              >
                <motion.div className="size-full rounded-[10px] bg-surface-2" animate={flash} />
              </motion.div>
              {options.map((o, i) => (
                <div
                  key={o.value}
                  id={`${id}-${i}`}
                  role="option"
                  aria-selected={o.value === value}
                  aria-disabled={o.disabled || undefined}
                  onPointerMove={() => {
                    if (o.disabled || closing.current) return
                    setVia('pointer')
                    setActive(i)
                  }}
                  onClick={() => choose(i)}
                  className={`relative flex cursor-default items-center gap-2 rounded-[10px] pl-2.5 pr-2 text-callout ${o.disabled ? 'text-ink-3' : 'text-ink'}`}
                  style={{ height: ITEM }}
                >
                  {o.icon && <span className={`flex size-4 items-center justify-center ${o.disabled ? 'opacity-50' : 'text-ink-2'}`}>{o.icon}</span>}
                  <span className="flex-1 truncate">{o.label}</span>
                  {o.hint && <span className="text-caption text-ink-3">{o.hint}</span>}
                  <span className="flex w-4 shrink-0 justify-center">{o.value === value && <Check size={15} strokeWidth={2.4} />}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
