'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ChevronDown, Code, FilePage, Folder, FolderOpen } from '../../icons'
import { useStack } from '../../lib/hooks'
import { ease } from '../../lib/motion'

export type TreeNode = { name: string; children?: TreeNode[]; icon?: ReactNode }

type Row = { path: string; node: TreeNode; depth: number; folder: boolean }

const ROW = 32
const INDENT = 16
const PAD = 8
const fold = { type: 'spring', bounce: 0, duration: 0.3 } as const

const flatten = (nodes: TreeNode[], open: Set<string>, depth = 0, parent = ''): Row[] =>
  nodes.flatMap((node) => {
    const path = parent ? `${parent}/${node.name}` : node.name
    const folder = !!node.children
    const row = { path, node, depth, folder }
    return folder && open.has(path) ? [row, ...flatten(node.children!, open, depth + 1, path)] : [row]
  })

const allPaths = (nodes: TreeNode[], parent = ''): string[] =>
  nodes.flatMap((n) => {
    const path = parent ? `${parent}/${n.name}` : n.name
    return [path, ...(n.children ? allPaths(n.children, path) : [])]
  })

const parentOf = (path: string) => path.slice(0, Math.max(0, path.lastIndexOf('/')))

const iconFor = (row: Row, open: boolean) => {
  if (row.node.icon) return row.node.icon
  if (row.folder) return open ? <FolderOpen size={16} /> : <Folder size={16} />
  return /\.(tsx?|jsx?|json|ya?ml|toml|css)$/.test(row.node.name) ? <Code size={16} /> : <FilePage size={16} />
}

/**
 * A file tree for code and agent tools. Opening a folder lets its children cascade in while
 * their indent guide draws down; the guide of the folder you're in glows. Files that appear
 * while you watch flash in place and their folders open themselves. Fully keyboard driven:
 * arrows walk and open, Left climbs to the parent, typing jumps.
 */
export function FileTree({
  nodes,
  defaultOpen = [],
  selected: selectedProp,
  onSelect,
  label = 'Files',
}: {
  /** The folders and files. A node with children is a folder. */
  nodes: TreeNode[]
  /** Paths of the folders open at first. */
  defaultOpen?: string[]
  /** The selected path, to control it from outside. Leave it out and the tree keeps its own. */
  selected?: string | null
  /** Called with a file's path when a person opens it. */
  onSelect?: (path: string) => void
  /** The tree's accessible name. */
  label?: string
}) {
  const [open, setOpen] = useState(() => new Set(defaultOpen))
  const [own, setOwn] = useState<string | null>(null)
  const [active, setActive] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)
  const [fresh, setFresh] = useState<Set<string>>(new Set())
  const known = useRef(new Set(allPaths(nodes)))
  const shown = useRef(new Set<string>())
  const typed = useRef({ text: '', at: 0 })
  const reduce = useReducedMotion()
  const id = useId()
  // Rows unfold by their own height and are stacked by transform, so a folder opening never moves the rows below it in the layout.
  const stack = useRef<HTMLDivElement>(null)
  useStack(stack)

  const selected = selectedProp !== undefined ? selectedProp : own
  const rows = useMemo(() => flatten(nodes, open), [nodes, open])

  // Files that arrive later flash once, and the folders they land in open on their own.
  useEffect(() => {
    const now = allPaths(nodes)
    const added = now.filter((p) => !known.current.has(p))
    known.current = new Set(now)
    if (!added.length) return
    setOpen((o) => {
      const next = new Set(o)
      added.forEach((p) => {
        for (let a = parentOf(p); a; a = parentOf(a)) next.add(a)
      })
      return next
    })
    setFresh((f) => new Set([...f, ...added]))
    const t = window.setTimeout(() => setFresh((f) => new Set([...f].filter((p) => !added.includes(p)))), 1600)
    return () => clearTimeout(t)
  }, [nodes])

  // Rows revealed together cascade in order; everything else appears at once.
  const entering = rows.filter((r) => !shown.current.has(r.path)).map((r) => r.path)
  useEffect(() => {
    shown.current = new Set(rows.map((r) => r.path))
  })

  const toggle = (path: string) =>
    setOpen((o) => {
      const next = new Set(o)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })

  const choose = (row: Row) => {
    setActive(row.path)
    if (row.folder) return toggle(row.path)
    setOwn(row.path)
    onSelect?.(row.path)
  }

  const focusFolder = selected ? (rows.find((r) => r.path === selected)?.folder ? selected : parentOf(selected)) : null
  const cursor = Math.max(
    0,
    rows.findIndex((r) => r.path === (active ?? selected)),
  )

  const onKeys = (e: KeyboardEvent) => {
    const row = rows[cursor]
    const go = (i: number) => rows[i] && setActive(rows[i].path)
    const keys: Record<string, () => void> = {
      ArrowDown: () => go(Math.min(rows.length - 1, cursor + 1)),
      ArrowUp: () => go(Math.max(0, cursor - 1)),
      Home: () => go(0),
      End: () => go(rows.length - 1),
      ArrowRight: () => {
        if (!row?.folder) return
        if (!open.has(row.path)) toggle(row.path)
        else go(cursor + 1)
      },
      ArrowLeft: () => {
        if (row?.folder && open.has(row.path)) return toggle(row.path)
        const up = rows.findIndex((r) => r.path === parentOf(row?.path ?? ''))
        if (up >= 0) go(up)
      },
      Enter: () => row && choose(row),
      ' ': () => row && choose(row),
    }
    if (keys[e.key]) {
      e.preventDefault()
      keys[e.key]()
      return
    }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      const t = Date.now()
      typed.current = { text: (t - typed.current.at < 500 ? typed.current.text : '') + e.key.toLowerCase(), at: t }
      const q = typed.current.text
      for (let n = 1; n <= rows.length; n++) {
        const i = (cursor + (q.length === 1 ? n : n - 1)) % rows.length
        if (rows[i].node.name.toLowerCase().startsWith(q)) return go(i)
      }
    }
  }

  const rowId = (path: string) => `${id}-${path.replace(/[^a-z0-9]/gi, '-')}`

  return (
    <div
      ref={stack}
      role="tree"
      aria-label={label}
      tabIndex={0}
      aria-activedescendant={rows[cursor] ? rowId(rows[cursor].path) : undefined}
      onKeyDown={onKeys}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="ring-focus relative select-none rounded-[10px]"
    >
      <AnimatePresence initial={false}>
        {rows.map((row) => {
          const isOpen = open.has(row.path)
          const isSelected = row.path === selected
          const isCursor = focused && row.path === rows[cursor]?.path
          const order = entering.indexOf(row.path)
          return (
            <motion.div
              key={row.path}
              id={rowId(row.path)}
              role="treeitem"
              aria-level={row.depth + 1}
              aria-expanded={row.folder ? isOpen : undefined}
              aria-selected={isSelected}
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: ROW,
                opacity: 1,
                transition: { ...fold, delay: reduce ? 0 : Math.min(order, 7) * 0.025, opacity: { duration: 0.2, delay: reduce ? 0 : Math.min(order, 7) * 0.025 + 0.04 } },
              }}
              exit={{ height: 0, opacity: 0, transition: { ...fold, opacity: { duration: 0.1 } } }}
              className="overflow-hidden"
            >
              <div
                onClick={() => choose(row)}
                onPointerMove={() => setActive(row.path)}
                className={`group/row relative flex cursor-default items-center gap-2 rounded-[8px] pr-2 text-callout transition-colors duration-150 ${isSelected ? 'bg-surface-2 text-ink' : 'text-ink hover:bg-[color-mix(in_oklch,var(--surface-2)_60%,transparent)]'}`}
                style={{ height: ROW, paddingLeft: PAD + row.depth * INDENT, boxShadow: isCursor ? 'inset 0 0 0 1px var(--line-strong)' : undefined }}
              >
                {/* A file that just appeared lights up once, then settles. */}
                <AnimatePresence>
                  {fresh.has(row.path) && (
                    <motion.span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-[8px]"
                      style={{ background: 'color-mix(in oklch, var(--accent) 20%, transparent)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0], transition: { duration: 1.5, times: [0, 0.15, 1], ease: ease.out, delay: 0.1 } }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </AnimatePresence>
                {/* Indent guides, one per ancestor. The guide of the folder you're in is brighter. */}
                {Array.from({ length: row.depth }, (_, level) => {
                  const ancestor = row.path
                    .split('/')
                    .slice(0, level + 1)
                    .join('/')
                  return (
                    <span
                      key={level}
                      aria-hidden
                      className={`absolute inset-y-0 w-px transition-colors duration-200 ${ancestor === focusFolder ? 'bg-ink-3' : 'bg-line'}`}
                      style={{ left: PAD + level * INDENT + 7.5 }}
                    />
                  )
                })}

                <span className={`relative flex size-4 shrink-0 items-center justify-center ${row.folder ? 'text-ink' : 'text-ink-2'}`}>
                  <AnimatePresence initial={false} mode="popLayout">
                    <motion.span
                      key={row.folder && isOpen ? 'open' : 'shut'}
                      className="flex"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.16 }}
                    >
                      {iconFor(row, isOpen)}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {row.node.name}
                  {row.folder && <span className="text-ink-3">/</span>}
                </span>
                {row.folder && (
                  <motion.span
                    className="flex text-ink-3 opacity-0 transition-opacity duration-150 group-hover/row:opacity-100"
                    style={{ opacity: row.depth === 0 ? 1 : undefined }}
                    initial={false}
                    animate={{ rotate: isOpen ? 0 : -90 }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
                  >
                    <ChevronDown size={14} />
                  </motion.span>
                )}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
