'use client'

import { useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode, Ref } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Search } from '../../icons'
import { byKey } from '../../lib/feel'
import { ease, spring } from '../../lib/motion'
import { Kbd } from '../../ui/Kbd'

export type Command = {
  id: string
  label: string
  group: string
  icon?: ReactNode
  hint?: ReactNode
  keywords?: string
  onSelect: () => void
}

export type CommandHandle = { type(q: string): void; move(i: number): void; run(): void }

const ROW = 40
const HEAD = 32
const PAD = 6
const LIST_H = 336

const match = (c: Command, q: string) => {
  if (!q) return { hit: true, at: -1 }
  const at = c.label.toLowerCase().indexOf(q)
  if (at >= 0) return { hit: true, at }
  return { hit: `${c.group} ${c.keywords ?? ''}`.toLowerCase().includes(q), at: -1 }
}

export function CommandMenu({
  open,
  onOpenChange,
  commands,
  placeholder = 'Search…',
  inline = false,
  listHeight = LIST_H,
  ref,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  commands: Command[]
  placeholder?: string
  inline?: boolean
  listHeight?: number
  ref?: Ref<CommandHandle>
}) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [via, setVia] = useState<'pointer' | 'keys'>('keys')
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)
  const id = useId()
  const [opened, setOpened] = useState(open)
  const [instant, setInstant] = useState(byKey)
  if (open !== opened) {
    setOpened(open)
    if (open) setInstant(byKey())
  }

  const q = query.trim().toLowerCase()
  const results = useMemo(() => commands.map((c) => ({ c, ...match(c, q) })).filter((r) => r.hit), [commands, q])
  const { rows, end } = useMemo(() => {
    const out: (({ kind: 'group'; label: string } | { kind: 'item'; r: (typeof results)[number]; index: number }) & { y: number })[] = []
    let index = 0
    let group = ''
    let y = PAD
    for (const r of results) {
      if (r.c.group !== group) {
        group = r.c.group
        out.push({ kind: 'group', label: group, y })
        y += HEAD
      }
      out.push({ kind: 'item', r, index: index++, y })
      y += ROW
    }
    return { rows: out, end: y }
  }, [results])
  const rowOf = (i: number) => rows.find((row) => row.kind === 'item' && row.index === i)
  const placed = useRef(rowOf)
  useLayoutEffect(() => {
    placed.current = rowOf
  })

  useEffect(() => {
    if (inline) return
    if (open) {
      returnTo.current = document.activeElement as HTMLElement
      setQuery('')
      setActive(0)
    } else returnTo.current?.focus?.({ preventScroll: true })
  }, [open, inline])

  useEffect(() => setActive(0), [q])

  useLayoutEffect(() => {
    if (!(open || inline) || via !== 'keys') return
    const box = list.current
    const row = placed.current(active)
    if (!box || !row) return
    if (row.y < box.scrollTop) box.scrollTop = row.y - 6
    else if (row.y + ROW > box.scrollTop + box.clientHeight) box.scrollTop = row.y + ROW - box.clientHeight + 6
  }, [active, open, inline, via])

  const choose = (i: number) => {
    const r = results[i]
    if (!r) return
    if (!inline) onOpenChange(false)
    r.c.onSelect()
  }

  const latest = useRef(choose)
  useLayoutEffect(() => {
    latest.current = choose
  })
  useImperativeHandle(ref, () => ({
    type: setQuery,
    move: (i) => {
      setVia('keys')
      setActive(i)
    },
    run: () => latest.current(active),
  }))

  const onKeys = (e: KeyboardEvent) => {
    const keys: Record<string, () => void> = {
      ArrowDown: () => setActive((a) => Math.min(results.length - 1, a + 1)),
      ArrowUp: () => setActive((a) => Math.max(0, a - 1)),
      Home: () => setActive(0),
      End: () => setActive(results.length - 1),
      Enter: () => choose(active),
      Escape: () => onOpenChange(false),
    }
    if (!keys[e.key]) return
    e.preventDefault()
    setVia('keys')
    keys[e.key]()
  }

  const lit = rowOf(active)
  const hl = lit ? { y: lit.y, show: true } : { y: 0, show: false }

  const panel = (
    <>
      <div className="flex h-[52px] items-center gap-3 px-4" style={{ boxShadow: 'inset 0 -1px 0 var(--line)' }}>
        <Search size={17} className="shrink-0 text-ink-3" />
        <input
          ref={input}
          autoFocus={!inline}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          role="combobox"
          aria-expanded
          aria-controls={`${id}-list`}
          aria-activedescendant={results[active] ? `${id}-${active}` : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-3"
        />
        {!inline && <Kbd>Esc</Kbd>}
      </div>

      <div ref={list} id={`${id}-list`} role="listbox" className="relative overflow-y-auto overscroll-contain p-1.5 [scrollbar-width:thin]" style={{ height: listHeight }}>
        <motion.div
          aria-hidden
          className="absolute inset-x-1.5 top-0 rounded-[10px] bg-surface-2"
          style={{ height: ROW }}
          initial={false}
          animate={{ y: hl.y, opacity: hl.show ? 1 : 0 }}
          transition={via === 'keys' ? { duration: 0 } : { y: spring.snappy, opacity: { duration: 0.1 } }}
        />
        {rows.map((row, i) =>
          row.kind === 'group' ? (
            <div key={`g-${row.label}-${i}`} className="absolute inset-x-1.5 top-0 px-3 pb-1 pt-3 text-caption font-medium text-ink-3" style={{ height: HEAD, transform: `translateY(${row.y}px)` }}>
              {row.label}
            </div>
          ) : (
            <div
              key={row.r.c.id}
              id={`${id}-${row.index}`}
              data-index={row.index}
              role="option"
              aria-selected={row.index === active}
              onPointerMove={() => {
                if (row.index === active) return
                setVia('pointer')
                setActive(row.index)
              }}
              onClick={() => choose(row.index)}
              className={`absolute inset-x-1.5 top-0 flex cursor-default items-center gap-3 rounded-[10px] px-3 text-callout ${row.index === active ? 'text-ink' : 'text-ink-2'}`}
              style={{ height: ROW, transform: `translateY(${row.y}px)` }}
            >
              {row.r.c.icon && <span className="flex size-4 shrink-0 items-center justify-center text-ink-3">{row.r.c.icon}</span>}
              <span className="min-w-0 flex-1 truncate">
                <Label key={q} text={row.r.c.label} at={row.r.at} length={q.length} />
              </span>
              {row.r.c.hint && <span className="shrink-0 text-caption text-ink-3">{row.r.c.hint}</span>}
            </div>
          ),
        )}
        <div aria-hidden style={{ height: end - PAD }} />
        {!results.length && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-callout text-ink-2">Nothing matches “{query}”</p>
            <p className="mt-1 text-caption text-ink-3">Try a component name or a category.</p>
          </div>
        )}
      </div>

      <div className="flex h-10 items-center gap-4 px-4 text-caption text-ink-3" style={{ boxShadow: 'inset 0 1px 0 var(--line)' }}>
        <span className="flex items-center gap-1.5 pointer-coarse:hidden">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          Move
        </span>
        <span className="flex items-center gap-1.5 pointer-coarse:hidden">
          <Kbd>↵</Kbd>
          Open
        </span>
        <span className="tnum flex-1 text-right [direction:rtl] [unicode-bidi:plaintext]">{`${results.length} result${results.length === 1 ? '' : 's'}`}</span>
      </div>
    </>
  )

  if (inline)
    return (
      <div role="dialog" aria-label="Command menu" className="flex w-full flex-col overflow-hidden rounded-[18px] bg-surface shadow-float" onKeyDown={onKeys}>
        {panel}
      </div>
    )

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex justify-center px-4 pt-[16vh]"
          initial={instant ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          transition={{ duration: 0.14 }}
        >
          <div className="absolute inset-0 bg-[color-mix(in_oklch,var(--bg)_55%,transparent)] backdrop-blur-[2px]" onPointerDown={() => onOpenChange(false)} />
          <motion.div
            role="dialog"
            aria-label="Command menu"
            className="glass relative flex h-fit w-full max-w-[580px] flex-col overflow-hidden rounded-[18px] bg-surface shadow-modal"
            initial={instant ? false : { opacity: 0, scale: 0.98, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.16, ease: ease.out } }}
            exit={{ opacity: 0, scale: 0.99, transition: { duration: 0.12, ease: ease.out } }}
            style={{ transformOrigin: '50% 0%' }}
            onKeyDown={onKeys}
          >
            {panel}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function Label({ text, at, length }: { text: string; at: number; length: number }) {
  if (at < 0 || !length) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <span className="font-semibold text-ink">{text.slice(at, at + length)}</span>
      {text.slice(at + length)}
    </>
  )
}
