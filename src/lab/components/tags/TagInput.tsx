'use client'

import { useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Ref } from 'react'
import { AnimatePresence, motion, useAnimationControls } from 'motion/react'
import { Close, Plus } from '../../icons'
import { ease, spring } from '../../lib/motion'

type Props = {
  /** The field's name, shown above it and read to screen readers. */
  label?: string
  /** The tags it starts with. */
  initial?: string[]
  /** Offered under the field as you type; Tab or Enter takes the highlighted one. */
  suggestions?: string[]
  /** The most tags it holds. Past it, new ones are refused. */
  max?: number
  /** Shown in the field while it's empty. */
  placeholder?: string
  /** Called with the whole list whenever a tag is added or removed. */
  onChange?: (tags: string[]) => void
  /** The field's width, in pixels. */
  width?: number
  ref?: Ref<TagsHandle>
}
/** For demos and tests: type, press Enter or Backspace, paste and reset, all without taking focus. */
export type TagsHandle = { type(text: string): void; enter(): void; backspace(): void; paste(text: string): void; reset(): void }

const pop = { type: 'spring', bounce: 0.25, duration: 0.4 } as const

/*
 * Every tag has a colour of its own, the same one every time it appears: a soft tint with a deep
 * tone on it, picked from a small palette by its name. Colour here is identity, never decoration.
 */
const HUES = [255, 150, 30, 300, 75, 195, 345]
export const hueOf = (tag: string) => {
  let h = 0
  for (const c of tag.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return HUES[h % HUES.length]
}
const tint = (hue: number) => ({
  background: `light-dark(oklch(0.95 0.035 ${hue}), oklch(0.26 0.065 ${hue}))`,
  color: `light-dark(oklch(0.46 0.13 ${hue}), oklch(0.88 0.07 ${hue}))`,
})
const dot = (hue: number) => `light-dark(oklch(0.62 0.15 ${hue}), oklch(0.75 0.12 ${hue}))`
// In dark a tag is a deep wash of its hue edged with a ring of it, so it stays crisp on black.
const edge = (hue: number) => `inset 0 0 0 1px light-dark(transparent, oklch(0.75 0.12 ${hue} / 0.38))`

/**
 * Tags that pop in as you type, each in a colour of its own. Suggestions show the colour a tag
 * will be before you take it, and when what you've typed is new, the last row says so and
 * creates it. Backspace highlights the last tag before removing it, pasting a list adds each
 * item in turn, and a duplicate nudges the tag you already have.
 */
export function TagInput({ label = 'Topics', initial = [], suggestions = [], max = 8, placeholder = 'Add a topic…', onChange, width = 380, ref }: Props) {
  const [tags, setTags] = useState<string[]>(initial)
  const changed = useRef(onChange)
  useLayoutEffect(() => {
    changed.current = onChange
  })
  const [text, setText] = useState('')
  const [armed, setArmed] = useState(false)
  const [nudge, setNudge] = useState<{ tag: string; n: number }>({ tag: '', n: 0 })
  const [focused, setFocused] = useState(false)
  const [cursor, setCursor] = useState(0)
  const [via, setVia] = useState<'pointer' | 'keys'>('keys')
  // Driven from code: the field looks focused and offers suggestions, but focus is never taken.
  const [driven, setDriven] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const field = useRef<HTMLDivElement>(null)
  const hint = useRef<HTMLParagraphElement>(null)
  const listId = useId()

  // The hint rides under the field by transform, so the field growing a row never moves it in the layout.
  useLayoutEffect(() => {
    const f = field.current
    const p = hint.current
    if (!f || !p) return
    const ro = new ResizeObserver(() => (p.style.translate = `0 ${f.offsetHeight}px`))
    ro.observe(f)
    return () => ro.disconnect()
  }, [])

  const matches = useMemo(() => {
    const q = text.trim().toLowerCase()
    if (!q) return []
    return suggestions.filter((s) => s.toLowerCase().includes(q) && !tags.some((t) => t.toLowerCase() === s.toLowerCase())).slice(0, 5)
  }, [text, suggestions, tags])

  // When what's typed is new, the list ends with a row that creates it.
  const fresh = text.trim() && !suggestions.some((s) => s.toLowerCase() === text.trim().toLowerCase()) && !tags.some((t) => t.toLowerCase() === text.trim().toLowerCase()) ? text.trim() : ''
  const options = fresh ? [...matches, fresh] : matches

  // What's typed changes: the highlight goes back to the first row.
  const write = (t: string) => {
    setText(t)
    setCursor(0)
  }

  // Kept in step after each render, so a pasted list adds against the latest tags.
  const tagsRef = useRef(tags)
  useLayoutEffect(() => {
    tagsRef.current = tags
  })

  const addOne = (raw: string) => {
    const t = raw.trim()
    const list = tagsRef.current
    if (!t) return
    const existing = list.find((x) => x.toLowerCase() === t.toLowerCase())
    if (existing) return setNudge((v) => ({ tag: existing, n: v.n + 1 }))
    if (list.length >= max) return
    const next = [...list, t]
    tagsRef.current = next
    setTags(next)
    changed.current?.(next)
  }

  const add = (raw: string) => {
    raw
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((t, i) => (i ? setTimeout(() => addOne(t), i * 70) : addOne(t)))
    setText('')
    setArmed(false)
  }

  const remove = (t: string) => {
    const next = tagsRef.current.filter((x) => x !== t)
    tagsRef.current = next
    setTags(next)
    changed.current?.(next)
    setArmed(false)
    if (!driven) input.current?.focus()
  }

  const latest = useRef({ add, remove, text, options, cursor, armed, tags })
  useLayoutEffect(() => {
    latest.current = { add, remove, text, options, cursor, armed, tags }
  })
  useImperativeHandle(ref, () => ({
    type: (t) => {
      setDriven(true)
      write(t)
      setArmed(false)
    },
    enter: () => {
      const l = latest.current
      if (l.text.trim()) l.add(l.options.length ? l.options[l.cursor] : l.text)
    },
    backspace: () => {
      const l = latest.current
      if (l.text || !l.tags.length) return
      if (l.armed) l.remove(l.tags[l.tags.length - 1])
      else setArmed(true)
    },
    paste: (t) => latest.current.add(t),
    reset: () => {
      tagsRef.current = initial
      setTags(initial)
      setText('')
      setArmed(false)
      setDriven(false)
    },
  }))

  const full = tags.length >= max
  const open = (focused || driven) && options.length > 0 && !full

  return (
    <div style={{ width, maxWidth: '100%' }}>
      <div className="mb-2 flex items-baseline justify-between px-0.5">
        <label htmlFor={listId + 'in'} className="text-footnote font-medium">
          {label}
        </label>
        <span className={`tnum text-caption transition-colors ${full ? 'text-ink' : 'text-ink-3'}`}>
          {tags.length}/{max}
        </span>
      </div>

      <div className="relative">
        {/* Until it's measured (and on the server) it sits under a one-row field. */}
        <p ref={hint} className="absolute inset-x-0 top-0 mt-2 translate-y-12 px-0.5 text-caption text-ink-3">
          Enter or comma to add. Paste a list to add several.
        </p>
      </div>
      <div ref={field} className="relative">
        <div
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault()
              input.current?.focus()
            }
          }}
          className={`flex min-h-[48px] cursor-text flex-wrap items-center gap-1.5 rounded-row bg-surface p-[7px] transition-shadow duration-200 ${focused || driven ? 'shadow-field' : 'shadow-raised'}`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {tags.map((t, i) => (
              <Tag key={t} label={t} armed={armed && i === tags.length - 1} nudge={nudge.tag === t ? nudge.n : 0} onRemove={() => remove(t)} />
            ))}
          </AnimatePresence>
          <motion.input
            layout="position"
            ref={input}
            id={listId + 'in'}
            value={text}
            disabled={false}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            placeholder={full ? 'That’s the limit' : tags.length ? '' : placeholder}
            onFocus={() => {
              setFocused(true)
              setDriven(false)
            }}
            onBlur={() => {
              setFocused(false)
              setArmed(false)
            }}
            onChange={(e) => {
              write(e.target.value)
              setArmed(false)
            }}
            onPaste={(e) => {
              const data = e.clipboardData.getData('text')
              if (/[,\n]/.test(data)) {
                e.preventDefault()
                add(data)
              }
            }}
            onKeyDown={(e) => {
              if (open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                e.preventDefault()
                setVia('keys')
                setCursor((c) => (c + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length)
              } else if (e.key === 'Enter' || e.key === ',' || (e.key === 'Tab' && text.trim())) {
                if (!text.trim() && e.key !== ',') return
                e.preventDefault()
                add(open && e.key !== ',' ? options[cursor] : text)
              } else if (e.key === 'Backspace' && !text && tags.length) {
                e.preventDefault()
                if (armed) remove(tags[tags.length - 1])
                else setArmed(true)
              } else if (e.key === 'Escape') {
                e.preventDefault()
                setArmed(false)
                setText('')
              }
            }}
            className="h-8 min-w-[120px] flex-1 bg-transparent px-1.5 text-callout text-ink outline-none placeholder:text-ink-3"
          />
        </div>

        {/* A list closing as a tag lands stays where it was while it fades, even though the field grows a row. */}
        <AnimatePresence mode="popLayout">
          {open && (
            <motion.ul
              id={listId}
              role="listbox"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.14, ease: ease.out } }}
              exit={{ opacity: 0, transition: { duration: 0.12, ease: ease.out } }}
              className="absolute inset-x-0 top-[calc(100%+6px)] z-20 origin-top rounded-menu bg-surface shadow-modal"
              style={{ height: options.length * 36 + 8 }}
            >
              {/* One highlight: glides for the pointer, jumps for the keyboard. */}
              <motion.span
                aria-hidden
                className="absolute inset-x-1 top-1 h-9 rounded-[10px] bg-surface-2"
                initial={false}
                animate={{ y: cursor * 36 }}
                transition={via === 'keys' ? { duration: 0 } : spring.snappy}
              />
              {options.map((m, i) => {
                const create = m === fresh && i === options.length - 1
                return (
                  // Each row is placed by its index and moves by transform, so rows coming and going as you type never shift the others.
                  <motion.li
                    key={create ? '+create' : m}
                    initial={false}
                    animate={{ y: i * 36 }}
                    transition={spring.snappy}
                    role="option"
                    aria-selected={i === cursor}
                    onPointerEnter={() => {
                      setVia('pointer')
                      setCursor(i)
                    }}
                    onPointerDown={(e) => {
                      e.preventDefault()
                      add(m)
                    }}
                    className="absolute inset-x-1 top-1 flex h-9 cursor-pointer items-center gap-2.5 rounded-[10px] px-3 text-callout"
                  >
                    {create ? (
                      <>
                        <span className="relative grid size-4 place-items-center rounded-full text-ink-3 shadow-[inset_0_0_0_1.5px_currentColor]">
                          <Plus size={9} strokeWidth={3} />
                        </span>
                        <span className="relative min-w-0 truncate font-medium text-ink">{`Create “${m}”`}</span>
                      </>
                    ) : (
                      <>
                        {/* The colour it will be, before you take it. */}
                        <span className="relative size-2 shrink-0 rounded-full" style={{ background: dot(hueOf(m)) }} />
                        <span className="relative">
                          {/* Rebuilt for each query: letters turning bold leave the rest where it was, as new text rather than moved text. */}
                          <Highlight key={text.trim()} text={m} query={text.trim()} />
                        </span>
                      </>
                    )}
                  </motion.li>
                )
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      {/* Room for the hint, which is placed above by transform. */}
      <div aria-hidden className="h-6" />
    </div>
  )
}

function Tag({ label, armed, nudge, onRemove }: { label: string; armed: boolean; nudge: number; onRemove: () => void }) {
  const ctl = useAnimationControls()
  const hue = hueOf(label)
  useEffect(() => {
    if (nudge) ctl.start({ x: [0, -4, 4, -2, 0], transition: { duration: 0.36, ease: 'easeOut' } })
  }, [nudge, ctl])

  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.16 } }}
      transition={pop}
      className="group/tag"
    >
      {/* Even insets: 10px of space on the left, and the close button's glyph sits 10px from the right edge. */}
      <motion.span
        animate={ctl}
        className="flex h-8 items-center gap-0.5 rounded-control pl-2.5 pr-1 text-footnote font-medium transition-[box-shadow] duration-200"
        style={{ ...tint(hue), boxShadow: armed ? `inset 0 0 0 1.5px ${dot(hue)}` : nudge ? `inset 0 0 0 1px ${dot(hue)}` : edge(hue) }}
      >
        {label}
        <button
          type="button"
          tabIndex={-1}
          aria-label={`Remove ${label}`}
          onPointerDown={(e) => e.preventDefault()}
          onClick={onRemove}
          className={`flex size-6 items-center justify-center rounded-[7px] transition-[opacity,background-color] duration-150 hover:bg-[color-mix(in_oklch,currentColor_12%,transparent)] ${armed ? 'opacity-100' : 'opacity-60 group-hover/tag:opacity-100'}`}
        >
          <Close size={12} strokeWidth={2.4} />
        </button>
      </motion.span>
    </motion.span>
  )
}

function Highlight({ text, query }: { text: string; query: string }) {
  const i = text.toLowerCase().indexOf(query.toLowerCase())
  if (i < 0 || !query) return <>{text}</>
  return (
    <>
      <span className="text-ink-2">{text.slice(0, i)}</span>
      <span className="font-semibold text-ink">{text.slice(i, i + query.length)}</span>
      <span className="text-ink-2">{text.slice(i + query.length)}</span>
    </>
  )
}
