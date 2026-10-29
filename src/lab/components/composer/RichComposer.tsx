'use client'

import { useEffect, useId, useImperativeHandle, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode, Ref } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowUp, Link } from '@/lab/icons'
import { tap } from '@/lab/lib/feel'
import { ease, spring } from '@/lab/lib/motion'

/*
 * A composer for comments and messages that formats as you write. Type **like this** and it turns
 * bold the moment the closing stars land; the same for _italic_, `code` and ~~strike~~. @ brings
 * up the people you can mention and their name goes in as one piece: Backspace lights it first,
 * then takes it. Select some words and a small toolbar rises over them, gliding as the selection
 * changes; its link button turns into a field right there. Pasting brings in plain words only,
 * and a link pasted over a selection becomes a link. Enter sends; Shift+Enter starts a new line.
 */

export type Person = { id: string; name: string; role?: string; hue?: number }
export type Mark = 'b' | 'i' | 'c' | 's'
/** What was written, as runs of text with their marks, mentions and line breaks. */
export type Run = { kind: 'text'; text: string; marks: Mark[]; href?: string } | { kind: 'mention'; id: string; name: string } | { kind: 'break' }
export type Sent = { runs: Run[]; markdown: string; text: string; mentions: string[] }

export type ComposerHandle = {
  /** Writes at the end, as typing would, without taking focus. */
  type(text: string): void
  /** Picks the n-th person in the open mention list. */
  choose(n: number): void
  /** Selects the first match of some words, as a hand would, without touching the page's selection. */
  select(words: string | null): void
  /** Applies a mark to the selection. */
  format(mark: Mark): void
  send(): void
  clear(): void
}

const ZW = '​'
const TAG: Record<Mark, string> = { b: 'STRONG', i: 'EM', c: 'CODE', s: 'S' }
const MARK_CLASS: Record<Mark, string> = { b: 'font-semibold', i: 'italic', c: 'rounded-[5px] bg-surface-2 px-1 py-px font-mono text-[0.92em]', s: 'line-through' }
const CHIP = 'mention inline-flex items-center rounded-[6px] bg-[color-mix(in_oklch,var(--accent)_12%,transparent)] px-1 font-medium text-[var(--accent-ink,var(--accent))] transition-shadow'
const DELIM: Record<Mark, number> = { b: 2, s: 2, c: 1, i: 1 }
const RULES: [RegExp, Mark][] = [
  [/\*\*([^*\n]+)\*\*$/, 'b'],
  [/~~([^~\n]+)~~$/, 's'],
  [/`([^`\n]+)`$/, 'c'],
  [/(?:^|[^\w*])\*([^*\n]+)\*$/, 'i'],
  [/(?:^|[^\w])_([^_\n]+)_$/, 'i'],
]
const HL = 'composer-selection'

const markOf = (el: Element): Mark | null => (el.tagName === 'STRONG' || el.tagName === 'B' ? 'b' : el.tagName === 'EM' || el.tagName === 'I' ? 'i' : el.tagName === 'CODE' ? 'c' : el.tagName === 'S' || el.tagName === 'STRIKE' ? 's' : null)

/** The caret at the very end of what's written. */
function endOf(root: HTMLElement): Range {
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let last: Text | null = null
  while (walk.nextNode()) last = walk.currentNode as Text
  if (!last || last.parentElement?.closest('[data-mention]') || last.parentElement !== root) {
    last = document.createTextNode('')
    root.appendChild(last)
  }
  const r = document.createRange()
  r.setStart(last, last.length)
  r.collapse(true)
  return r
}

/** Puts plain text in at a caret and returns the caret after it. */
function insertAt(range: Range, text: string): Range {
  let node = range.startContainer
  let at = range.startOffset
  if (!(node instanceof Text)) {
    const t = document.createTextNode('')
    range.insertNode(t)
    node = t
    at = 0
  }
  ;(node as Text).insertData(at, text)
  const r = document.createRange()
  r.setStart(node, at + text.length)
  r.collapse(true)
  return r
}

/** If the words just before the caret close a markdown mark, turns them into it. Returns the new caret. */
function shortcut(range: Range): Range | null {
  const node = range.startContainer
  if (!(node instanceof Text) || node.parentElement?.closest('code,[data-mention]')) return null
  const before = node.data.slice(0, range.startOffset)
  for (const [re, mark] of RULES) {
    const m = before.match(re)
    if (!m) continue
    const inner = m[1]
    const start = before.length - inner.length - DELIM[mark] * 2
    node.splitText(range.startOffset)
    const mid = node.splitText(start)
    const el = document.createElement(TAG[mark])
    el.className = MARK_CLASS[mark]
    el.textContent = inner
    mid.replaceWith(el)
    // A zero-width space after the mark, so what's typed next isn't swallowed into it.
    const after = document.createTextNode(ZW)
    el.after(after)
    const r = document.createRange()
    r.setStart(after, 1)
    r.collapse(true)
    return r
  }
  return null
}

/** An @ being typed just before the caret: where it starts and what's been typed after it. */
function mentionAt(range: Range) {
  const node = range.startContainer
  if (!(node instanceof Text) || node.parentElement?.closest('code')) return null
  const m = node.data.slice(0, range.startOffset).match(/(^|[\s​ ])@([\p{L}]{0,20})$/u)
  if (!m) return null
  return { node, start: range.startOffset - m[2].length - 1, end: range.startOffset, query: m[2] }
}

/** Wraps a range in a mark, or takes the mark off if the range is already inside one. Returns the range over the result. */
function toggleMark(root: HTMLElement, range: Range, tag: string, attrs?: Record<string, string>, cls = ''): Range {
  const base = range.commonAncestorContainer
  const inside = (base instanceof Element ? base : base.parentElement)?.closest(tag)
  const r = document.createRange()
  if (inside && root.contains(inside) && !attrs) {
    const first = inside.firstChild
    const last = inside.lastChild
    inside.replaceWith(...inside.childNodes)
    if (first && last) {
      r.setStartBefore(first)
      r.setEndAfter(last)
    }
    return r
  }
  const frag = range.extractContents()
  frag.querySelectorAll(tag).forEach((el) => el.replaceWith(...el.childNodes))
  const el = document.createElement(tag)
  if (cls) el.className = cls
  for (const [k, v] of Object.entries(attrs ?? {})) el.setAttribute(k, v)
  el.append(frag)
  range.insertNode(el)
  r.selectNodeContents(el)
  return r
}

/** Reads what's written into runs. */
export function parse(root: Node): Run[] {
  const out: Run[] = []
  const walk = (n: Node, marks: Mark[], href?: string) => {
    if (n instanceof Text) {
      const text = n.data.replace(/​/g, '').replace(/ /g, ' ')
      if (text) out.push({ kind: 'text', text, marks, href })
      return
    }
    if (!(n instanceof HTMLElement)) return
    if (n.dataset.mention) {
      out.push({ kind: 'mention', id: n.dataset.mention, name: (n.textContent ?? '').replace(/^@/, '') })
      return
    }
    if (n.tagName === 'BR') {
      out.push({ kind: 'break' })
      return
    }
    const block = n.tagName === 'DIV' || n.tagName === 'P'
    if (block && out.length && out[out.length - 1].kind !== 'break') out.push({ kind: 'break' })
    const m = markOf(n)
    const link = n.tagName === 'A' ? (n.getAttribute('href') ?? undefined) : href
    n.childNodes.forEach((c) => walk(c, m && !marks.includes(m) ? [...marks, m] : marks, link))
  }
  root.childNodes.forEach((c) => walk(c, []))
  while (out.length && out[out.length - 1].kind === 'break') out.pop()
  return out
}

const WRAP: Record<Mark, string> = { b: '**', i: '_', c: '`', s: '~~' }
const toMarkdown = (runs: Run[]) =>
  runs
    .map((r) => {
      if (r.kind === 'break') return '\n'
      if (r.kind === 'mention') return `@${r.name}`
      const text = r.marks.reduce((t, m) => `${WRAP[m]}${t}${WRAP[m]}`, r.text)
      return r.href ? `[${text}](${r.href})` : text
    })
    .join('')

/** Renders runs as they were written: for the message once it's sent. */
export function Runs({ runs }: { runs: Run[] }) {
  return (
    <>
      {runs.map((r, i) => {
        if (r.kind === 'break') return <br key={i} />
        if (r.kind === 'mention')
          return (
            <span key={i} className={CHIP}>
              @{r.name}
            </span>
          )
        let node: ReactNode = r.text
        for (const m of r.marks) {
          const Tag = TAG[m].toLowerCase() as 'strong'
          node = <Tag className={MARK_CLASS[m]}>{node}</Tag>
        }
        return r.href ? (
          <a key={i} href={r.href} className="text-[var(--accent-ink,var(--accent))] underline decoration-[color-mix(in_oklch,var(--accent)_40%,transparent)] underline-offset-2">
            {node}
          </a>
        ) : (
          <span key={i}>{node}</span>
        )
      })}
    </>
  )
}

const safeUrl = (s: string) => {
  const t = s.trim()
  if (!t) return null
  if (/^(https?:|mailto:)/i.test(t)) return t
  if (/^[\w-]+(\.[\w-]+)+/.test(t)) return `https://${t}`
  return null
}

export function RichComposer({
  people,
  placeholder = 'Write a comment…',
  onSend,
  ref,
}: {
  /** Who can be mentioned. */
  people: Person[]
  placeholder?: string
  onSend?: (sent: Sent) => void
  ref?: Ref<ComposerHandle>
}) {
  const editor = useRef<HTMLDivElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const linkField = useRef<HTMLInputElement>(null)
  const saved = useRef<Range | null>(null)
  const query = useRef<ReturnType<typeof mentionAt>>(null)
  const plate = useId()
  const listId = useId()
  const reduce = useReducedMotion()
  const [empty, setEmpty] = useState(true)
  const [mention, setMention] = useState<{ query: string; x: number; y: number } | null>(null)
  const [hi, setHi] = useState(0)
  const [tool, setTool] = useState<{ x: number; y: number; marks: Mark[]; link: boolean } | null>(null)
  const [linking, setLinking] = useState(false)
  const [url, setUrl] = useState('')

  const matches = mention ? people.filter((p) => p.name.toLowerCase().split(/\s+/).some((w) => w.startsWith(mention.query.toLowerCase()))).slice(0, 5) : []

  /** A rect from the screen in the wrapper's own pixels, whatever the page's zoom. */
  const local = (r: DOMRect) => {
    const w = wrap.current!
    const b = w.getBoundingClientRect()
    const k = b.width / (w.offsetWidth || 1)
    return { x: (r.left - b.left) / k, y: (r.top - b.top) / k, w: r.width / k, h: r.height / k, right: (r.right - b.left) / k }
  }

  /** After any change at a caret: format what closed, and open or follow a mention. */
  const settle = (range: Range | null) => {
    const el = editor.current
    if (!el) return
    setEmpty(!el.textContent?.replace(/​/g, '').trim() && !el.querySelector('[data-mention]'))
    el.querySelectorAll('[data-selected]').forEach((c) => c.removeAttribute('data-selected'))
    if (!range) return setMention(null)
    const moved = shortcut(range)
    if (moved) {
      const sel = getSelection()
      if (sel && el.contains(sel.anchorNode)) {
        sel.removeAllRanges()
        sel.addRange(moved)
      }
      range = moved
    }
    const m = mentionAt(range)
    query.current = m
    if (!m) return setMention(null)
    const r = document.createRange()
    r.setStart(m.node, m.start)
    r.setEnd(m.node, m.start + 1)
    const at = local(r.getBoundingClientRect())
    setMention((was) => {
      if (!was || was.query !== m.query) setHi(0)
      return { query: m.query, x: at.x, y: at.y }
    })
  }

  /** Swaps the typed @name for the person, as one piece. */
  const putMention = (p: Person) => {
    const m = query.current
    const el = editor.current
    if (!m || !el) return
    const r = document.createRange()
    r.setStart(m.node, m.start)
    r.setEnd(m.node, m.end)
    r.deleteContents()
    const chip = document.createElement('span')
    chip.dataset.mention = p.id
    chip.contentEditable = 'false'
    chip.className = CHIP
    chip.textContent = `@${p.name}`
    r.insertNode(chip)
    const space = document.createTextNode(' ')
    chip.after(space)
    const caret = document.createRange()
    caret.setStart(space, 1)
    caret.collapse(true)
    const sel = getSelection()
    if (sel && document.activeElement === el) {
      sel.removeAllRanges()
      sel.addRange(caret)
    }
    query.current = null
    setMention(null)
    setEmpty(false)
  }

  /** Lights a range's words and puts the toolbar over them. */
  const showTool = (range: Range | null) => {
    if (!range || range.collapsed || !editor.current?.contains(range.commonAncestorContainer)) {
      setTool(null)
      setLinking(false)
      return
    }
    saved.current = range.cloneRange()
    const rects = [...range.getClientRects()]
    const first = local(rects[0] ?? range.getBoundingClientRect())
    const all = local(range.getBoundingClientRect())
    const base = range.commonAncestorContainer
    const marks: Mark[] = []
    for (let n: Element | null = base instanceof Element ? base : base.parentElement; n && n !== editor.current; n = n.parentElement) {
      const m = markOf(n)
      if (m) marks.push(m)
    }
    const link = !!(base instanceof Element ? base : base.parentElement)?.closest('a')
    setTool({ x: rects.length > 1 ? all.x + all.w / 2 : first.x + first.w / 2, y: first.y, marks, link })
  }

  /** Opens the link field, keeping the words it'll link drawn as selected while focus is in the field. */
  const startLink = () => {
    if (saved.current && typeof CSS !== 'undefined' && 'highlights' in CSS) CSS.highlights.set(HL, new Highlight(saved.current))
    setLinking(true)
  }

  const format = (m: Mark) => {
    const el = editor.current
    const r = saved.current
    if (!el || !r) return
    const next = toggleMark(el, r, TAG[m].toLowerCase(), undefined, MARK_CLASS[m])
    keep(next)
  }

  const linkTo = (href: string | null) => {
    const el = editor.current
    const r = saved.current
    if (!el || !r) return
    if (href === null) {
      const a = (r.commonAncestorContainer instanceof Element ? r.commonAncestorContainer : r.commonAncestorContainer.parentElement)?.closest('a')
      if (a) a.replaceWith(...a.childNodes)
      setTool(null)
      return
    }
    const next = toggleMark(el, r, 'a', { href, rel: 'noreferrer', target: '_blank' }, 'text-[var(--accent-ink,var(--accent))] underline decoration-[color-mix(in_oklch,var(--accent)_40%,transparent)] underline-offset-2')
    setLinking(false)
    setUrl('')
    keep(next)
  }

  /** After formatting, keeps the same words selected: the page's selection if it was ours, otherwise the drawn one. */
  const keep = (r: Range) => {
    const el = editor.current!
    const sel = getSelection()
    if (sel && document.activeElement === el) {
      sel.removeAllRanges()
      sel.addRange(r)
    } else if (typeof CSS !== 'undefined' && 'highlights' in CSS) CSS.highlights.set(HL, new Highlight(r))
    showTool(r)
    setEmpty(false)
  }

  const send = () => {
    const el = editor.current
    if (!el) return
    const runs = parse(el)
    if (!runs.length) return
    onSend?.({ runs, markdown: toMarkdown(runs), text: runs.map((r) => (r.kind === 'text' ? r.text : r.kind === 'mention' ? `@${r.name}` : '\n')).join(''), mentions: runs.flatMap((r) => (r.kind === 'mention' ? [r.id] : [])) })
    el.replaceChildren()
    setEmpty(true)
    setMention(null)
    setTool(null)
    if (typeof CSS !== 'undefined' && 'highlights' in CSS) CSS.highlights.delete(HL)
  }

  // The toolbar follows the page's selection while it's inside the composer.
  useEffect(() => {
    const on = () => {
      const sel = getSelection()
      const el = editor.current
      if (!sel || !el || !sel.rangeCount || !el.contains(sel.anchorNode) || document.activeElement !== el) return
      showTool(sel.getRangeAt(0))
    }
    document.addEventListener('selectionchange', on)
    return () => document.removeEventListener('selectionchange', on)
  })

  useEffect(() => () => void (typeof CSS !== 'undefined' && 'highlights' in CSS && CSS.highlights.delete(HL)), [])

  useImperativeHandle(ref, () => ({
    type: (text) => {
      const el = editor.current
      if (!el) return
      let r = endOf(el)
      for (const ch of text) {
        r = insertAt(r, ch)
        settle(r)
        r = endOf(el)
      }
    },
    choose: (n) => {
      const p = matches[n]
      if (!p) return
      const m = query.current
      if (m) putMention(p)
    },
    select: (words) => {
      const el = editor.current
      if (!el) return
      if (!words) {
        if (typeof CSS !== 'undefined' && 'highlights' in CSS) CSS.highlights.delete(HL)
        showTool(null)
        return
      }
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      while (walk.nextNode()) {
        const t = walk.currentNode as Text
        const i = t.data.indexOf(words)
        if (i < 0) continue
        const r = document.createRange()
        r.setStart(t, i)
        r.setEnd(t, i + words.length)
        if (typeof CSS !== 'undefined' && 'highlights' in CSS) CSS.highlights.set(HL, new Highlight(r))
        showTool(r)
        return
      }
    },
    format,
    send,
    clear: () => {
      editor.current?.replaceChildren()
      setEmpty(true)
      setTool(null)
      setMention(null)
    },
  }))

  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    if (mention && matches.length) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        setHi((h) => (h + (e.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        putMention(matches[Math.min(hi, matches.length - 1)])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setMention(null)
        return
      }
    }
    const mod = e.metaKey || e.ctrlKey
    const hot: Record<string, Mark> = { b: 'b', i: 'i', e: 'c' }
    if (mod && (hot[e.key] || (e.shiftKey && e.key.toLowerCase() === 'x'))) {
      e.preventDefault()
      const sel = getSelection()
      if (sel?.rangeCount && !sel.isCollapsed) {
        saved.current = sel.getRangeAt(0)
        format(hot[e.key] ?? 's')
      }
      return
    }
    if (mod && e.key === 'k') {
      e.preventDefault()
      const sel = getSelection()
      if (sel?.rangeCount && !sel.isCollapsed) {
        showTool(sel.getRangeAt(0))
        startLink()
      }
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
      return
    }
    // A mention goes in two presses: the first lights it, the second takes it.
    if (e.key === 'Backspace') {
      const sel = getSelection()
      if (!sel?.isCollapsed || !sel.rangeCount) return
      const r = sel.getRangeAt(0)
      let prev: Node | null = null
      if (r.startContainer instanceof Text) {
        const before = r.startContainer.data.slice(0, r.startOffset).replace(/[​ ]/g, '')
        if (!before) prev = r.startContainer.previousSibling
      } else prev = r.startContainer.childNodes[r.startOffset - 1] ?? null
      if (prev instanceof HTMLElement && prev.dataset.mention) {
        e.preventDefault()
        if (prev.hasAttribute('data-selected')) {
          const after = prev.nextSibling
          prev.remove()
          if (after instanceof Text) after.data = after.data.replace(/^ /, '')
          settle(null)
        } else prev.setAttribute('data-selected', '')
      }
    }
  }

  return (
    <div ref={wrap} className="relative">
      <style>{`::highlight(${HL}){background-color:color-mix(in oklch,var(--accent) 26%,transparent)}[data-mention][data-selected]{box-shadow:0 0 0 2px var(--accent)}`}</style>
      <div className="rounded-[16px] bg-surface shadow-raised ring-1 ring-[color-mix(in_oklch,var(--ink)_6%,transparent)] transition-shadow focus-within:shadow-[0_0_0_3px_color-mix(in_oklch,var(--accent)_22%,transparent),var(--elev-raised)]">
        <div className="relative px-4 pt-3">
          {empty && <span className="pointer-events-none absolute left-4 top-3 text-body text-ink-3">{placeholder}</span>}
          <div
            ref={editor}
            role="textbox"
            aria-multiline="true"
            aria-label={placeholder}
            aria-autocomplete="list"
            aria-controls={mention ? listId : undefined}
            contentEditable
            suppressContentEditableWarning
            spellCheck
            onInput={() => {
              const sel = getSelection()
              settle(sel?.rangeCount ? sel.getRangeAt(0) : null)
            }}
            onKeyDown={keys}
            onPaste={(e) => {
              e.preventDefault()
              const text = e.clipboardData.getData('text/plain')
              const sel = getSelection()
              const href = safeUrl(text)
              if (href && sel && !sel.isCollapsed && sel.rangeCount && !/\s/.test(text.trim())) {
                saved.current = sel.getRangeAt(0)
                linkTo(href)
                return
              }
              document.execCommand('insertText', false, text)
            }}
            onDrop={(e) => e.preventDefault()}
            onBlur={() => setMention(null)}
            className="min-h-[48px] max-h-48 overflow-y-auto whitespace-pre-wrap break-words pb-2 text-body text-ink outline-none"
          />
        </div>
        <div className="flex items-center justify-between gap-3 px-3 pb-3 pl-4">
          <span className="truncate text-caption text-ink-3">
            <kbd className="font-mono">**bold**</kbd> · <kbd className="font-mono">_italic_</kbd> · <kbd className="font-mono">`code`</kbd> · @ to mention
          </span>
          <motion.button
            type="button"
            aria-label="Send"
            disabled={empty}
            onClick={() => (tap(), send())}
            whileTap={empty || reduce ? undefined : { scale: 0.92 }}
            className="ring-focus grid size-8 shrink-0 place-items-center rounded-full bg-ink text-surface transition-opacity disabled:opacity-25"
          >
            <ArrowUp size={16} />
          </motion.button>
        </div>
      </div>

      {/* People to mention, above the @. */}
      <AnimatePresence>
        {mention && matches.length > 0 && (
          <motion.div
            key="people"
            id={listId}
            role="listbox"
            aria-label="People"
            className="absolute z-20 w-60 rounded-[14px] bg-surface p-1 shadow-float ring-1 ring-[color-mix(in_oklch,var(--ink)_8%,transparent)]"
            style={{ left: Math.max(0, mention.x - 12), bottom: `calc(100% - ${mention.y}px + 8px)` }}
            initial={{ opacity: 0, y: 6, scale: reduce ? 1 : 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, transition: { duration: 0.12 } }}
            transition={spring.snappy}
          >
            {matches.map((p, i) => (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={i === hi}
                tabIndex={-1}
                onPointerDown={(e) => e.preventDefault()}
                onPointerEnter={() => setHi(i)}
                onClick={() => putMention(p)}
                className="relative flex h-10 w-full items-center gap-2.5 rounded-[10px] px-2 text-left"
              >
                {i === hi && <motion.span layoutId={plate} transition={spring.move} className="absolute inset-0 rounded-[10px] bg-surface-2" />}
                <span className="relative grid size-6 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ background: `oklch(0.62 0.12 ${p.hue ?? 250})` }}>
                  {p.name
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)}
                </span>
                <span className="relative min-w-0">
                  <span className="block truncate text-footnote font-medium text-ink">{p.name}</span>
                  {p.role && <span className="block truncate text-caption text-ink-3">{p.role}</span>}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The selection toolbar, risen over the selected words. */}
      <AnimatePresence>
        {tool && (
          <motion.div
            key="tool"
            role="toolbar"
            aria-label="Format"
            className="absolute left-0 top-0 z-20"
            initial={{ opacity: 0, x: tool.x, y: tool.y - 6 }}
            animate={{ opacity: 1, x: tool.x, y: tool.y }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={reduce ? { duration: 0 } : { ...spring.move, opacity: { duration: 0.14 } }}
          >
            <motion.div layout transition={spring.smooth} className="absolute bottom-2 left-0 flex -translate-x-1/2 items-center gap-0.5 overflow-hidden rounded-[12px] bg-ink p-1 text-surface shadow-float">
              <AnimatePresence mode="popLayout" initial={false}>
                {linking ? (
                  <motion.form
                    key="link"
                    className="flex items-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.14, ease: ease.out }}
                    onSubmit={(e) => {
                      e.preventDefault()
                      linkTo(safeUrl(url))
                    }}
                  >
                    <Link size={14} className="ml-1.5 opacity-60" />
                    <input
                      ref={linkField}
                      autoFocus
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key !== 'Escape') return
                        setLinking(false)
                        if (typeof CSS !== 'undefined' && 'highlights' in CSS) CSS.highlights.delete(HL)
                      }}
                      placeholder="Paste a link"
                      className="h-7 w-44 bg-transparent px-1 text-caption text-surface outline-none placeholder:text-[color-mix(in_oklch,var(--surface)_50%,transparent)]"
                    />
                  </motion.form>
                ) : (
                  <motion.div key="marks" className="flex items-center gap-0.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}>
                    {(
                      [
                        ['b', 'Bold', <span key="b" className="font-bold">B</span>],
                        ['i', 'Italic', <span key="i" className="font-serif italic">I</span>],
                        ['c', 'Code', <span key="c" className="font-mono text-[11px]">{'<>'}</span>],
                        ['s', 'Strikethrough', <span key="s" className="line-through">S</span>],
                      ] as [Mark, string, ReactNode][]
                    ).map(([m, label, glyph]) => (
                      <button
                        key={m}
                        type="button"
                        aria-label={label}
                        aria-pressed={tool.marks.includes(m)}
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={() => (tap(), format(m))}
                        className={`grid size-7 place-items-center rounded-[8px] text-footnote transition-colors ${tool.marks.includes(m) ? 'bg-[color-mix(in_oklch,var(--surface)_22%,transparent)]' : 'hover:bg-[color-mix(in_oklch,var(--surface)_12%,transparent)]'}`}
                      >
                        {glyph}
                      </button>
                    ))}
                    <span className="mx-0.5 h-4 w-px bg-[color-mix(in_oklch,var(--surface)_20%,transparent)]" />
                    <button
                      type="button"
                      aria-label={tool.link ? 'Remove link' : 'Link'}
                      aria-pressed={tool.link}
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={() => (tap(), tool.link ? linkTo(null) : startLink())}
                      className={`grid size-7 place-items-center rounded-[8px] transition-colors ${tool.link ? 'bg-[color-mix(in_oklch,var(--surface)_22%,transparent)]' : 'hover:bg-[color-mix(in_oklch,var(--surface)_12%,transparent)]'}`}
                    >
                      <Link size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
