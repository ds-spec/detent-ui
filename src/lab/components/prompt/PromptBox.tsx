'use client'

import { tap } from '../../lib/feel'
import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode, Ref } from 'react'
import type { MotionValue } from 'motion/react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { ArrowUp, Check, Close, Upload } from '../../icons'
import { ease, press, spring } from '../../lib/motion'

export type Attachment = {
  id: string
  name: string
  size: number
  type: string
  url?: string
  file?: File
}
/** A way of answering. `level` (1 to 4) is how hard it thinks, drawn as the ramp; `aside` is the quiet word after its name. */
export type Mode = { id: string; name: string; note: string; icon?: ReactNode; level?: number; aside?: string }
export type Message = { text: string; files: Attachment[]; mode: string }
/** For demos and tests: write, attach, switch mode and send without touching focus. */
export type PromptHandle = { type(text: string): void; attach(files: Attachment[]): void; mode(id: string): void; send(): void }
/** A prompt to start from: a mono label over a two-tone sentence. `prompt` is what it sends; by default, the sentence. */
export type Starter = { label: string; lead: string; rest?: string; prompt?: string }

const DEFAULT_MODES: Mode[] = [
  { id: 'quick', name: 'Quick', aside: 'answers', note: 'Short answers, right away', level: 1 },
  { id: 'think', name: 'Think', aside: 'hard', note: 'Reasons it through step by step', level: 3 },
  { id: 'research', name: 'Research', aside: 'and cite', note: 'Searches and cites its sources', level: 4 },
]

const MONO = 'font-mono text-[10.5px] uppercase tracking-[0.06em]'
/** An edge that catches light from the top left, on paper or on black. */
const LIT =
  'bg-[linear-gradient(150deg,#fff,rgba(0,0,0,0.07)_35%,rgba(0,0,0,0.15))] dark:bg-[linear-gradient(150deg,rgba(255,255,255,0.28),rgba(255,255,255,0.07)_26%,rgba(255,255,255,0.03)_60%,rgba(255,255,255,0.1))]'
const LIFT = 'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-18px_rgba(0,0,0,0.18)] dark:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)]'
const CARD = 'bg-surface dark:bg-[#161618]'
const LINE = 23
const MAX_LINES = 6
/** Height of the box at rest: the lit edge, the label, two lines for the words, and the keys. The component reserves exactly this. */
const BASE = 1 + 14 + 16 + 12 + LINE * 2 + 12 + 32 + 14 + 1
/** The height a PromptBox takes at rest, for a host that reserves its room. */
export const PROMPT_H = BASE
const ROW = 48
const sizeOf = (b: number) => (b < 1024 ? `${b} B` : b < 1024 ** 2 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 ** 2).toFixed(1)} MB`)
const fromFile = (f: File): Attachment => ({
  id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 7)}`,
  name: f.name,
  size: f.size,
  type: f.type,
  file: f,
  url: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
})

/**
 * A prompt box for AI products. One card whose edge catches light from the top left. A small mono line
 * across its top says what the message goes with: the files attached, each removable, or while it
 * answers, what it's doing and for how long; the model sits at its right with its mark. The placeholder
 * is a two-tone sentence. Under the words, a row of keys: attach, mention, how hard it thinks (a ramp of
 * dots lit up to the level, which opens the modes), and Send, an ink key in the same set that turns to
 * Stop while it answers.
 *
 * It keeps a fixed footprint and grows upward over the page as you write, so nothing beneath it ever
 * moves. Send lifts your words off the card. Drop or paste files anywhere on it. Enter sends,
 * Shift+Enter adds a line, Escape stops. Given suggestions, the empty box rolls through them, and Tab
 * takes the one showing. PromptStarters, beside it, offers whole prompts to begin with.
 */
export function PromptBox({
  onSend,
  onStop,
  placeholder = 'Ask anything',
  hint,
  label,
  modes = DEFAULT_MODES,
  initialMode,
  initialFiles = [],
  suggestions,
  width = 420,
  busy: working,
  status = 'Thinking',
  model,
  onVoice,
  onGrow,
  ref,
}: {
  /** Return a promise to show the working state until it settles. */
  onSend?: (message: Message) => Promise<unknown> | void
  /** Called when a person stops what's working. */
  onStop?: () => void
  /** Shown while the box is empty. */
  placeholder?: string
  /** The quieter second half of the placeholder: "or drop a file to start from it." */
  hint?: string
  /** The mono line across the top when nothing is attached, e.g. "New chat". */
  label?: string
  /** The modes to choose between. */
  modes?: Mode[]
  /** The id of the mode it starts in. */
  initialMode?: string
  /** Files already attached when it opens. */
  initialFiles?: Attachment[]
  /** Prompts to offer while the box is empty; Tab takes the one showing. */
  suggestions?: string[]
  /** The box's width. It grows in height only, as far as its own scroll. */
  width?: number
  /** Whether an answer is coming, when you track that yourself, say for a question asked from outside the box. Leave it out and the box follows the promise `onSend` returns. */
  busy?: boolean
  /** What it's doing while it answers: "Reading the board update". */
  status?: string
  /** The model, named at the top right with its mark. */
  model?: string
  /** Shows a microphone key; called when it's pressed. */
  onVoice?: () => void
  /** Called as the box grows above its resting height, with how far, so whatever sits above it can make room. */
  onGrow?: (by: number) => void
  ref?: Ref<PromptHandle>
}) {
  const [text, setText] = useState('')
  const [files, setFiles] = useState<Attachment[]>(initialFiles)
  const [mode, setMode] = useState(initialMode ?? modes[1]?.id ?? modes[0].id)
  const [pending, setPending] = useState(false)
  const busy = working ?? pending
  const [focused, setFocused] = useState(false)
  const [drag, setDrag] = useState(false)
  const [menu, setMenu] = useState(false)
  const [lifts, setLifts] = useState<{ id: number; text: string }[]>([])
  const [layer, setLayer] = useState<HTMLDivElement | null>(null)
  const [tip, setTip] = useState(0)

  const area = useRef<HTMLTextAreaElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const picker = useRef<HTMLInputElement>(null)
  const run = useRef(0)
  const depth = useRef(0)
  const filesRef = useRef(files)
  useLayoutEffect(() => {
    filesRef.current = files
  })
  const reduce = useReducedMotion()

  // The box follows its content's height and grows upward, because it hangs from the bottom of a fixed footprint.
  const h = useMotionValue(BASE)
  const grew = useRef(onGrow)
  useLayoutEffect(() => {
    grew.current = onGrow
  })
  useLayoutEffect(() => {
    const el = content.current
    if (!el) return
    let placed = false
    const ro = new ResizeObserver(() => {
      const next = Math.max(BASE, el.offsetHeight + 2)
      if (!placed || reduce) h.set(next)
      else animate(h, next, spring.smooth)
      placed = true
    })
    ro.observe(el)
    const off = h.on('change', (v) => grew.current?.(v - BASE))
    return () => {
      ro.disconnect()
      off()
    }
  }, [h, reduce])
  const menuBottom = useTransform(h, (v) => v + 8)

  // Grow the textarea with its text, from two lines up to six; past that it scrolls.
  useLayoutEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${Math.max(LINE * 2, Math.min(el.scrollHeight, LINE * MAX_LINES))}px`
  }, [text])

  useEffect(() => () => filesRef.current.forEach((f) => f.url && URL.revokeObjectURL(f.url)), [])

  const canSend = !busy && (text.trim().length > 0 || files.length > 0)

  // While the box is empty, the suggestions take turns in the placeholder's slot.
  const offer = !text && !busy && suggestions?.length ? suggestions[tip % suggestions.length] : null
  const many = (suggestions?.length ?? 0) > 1
  useEffect(() => {
    if (text || busy || !many || reduce) return
    const t = window.setInterval(() => setTip((n) => n + 1), 3600)
    return () => clearInterval(t)
  }, [text, busy, many, reduce])

  const send = async () => {
    if (!canSend) return
    const message = { text: text.trim(), files, mode }
    if (message.text) setLifts((l) => [...l, { id: Date.now(), text: message.text }])
    setText('')
    setFiles([])
    const result = onSend?.(message)
    if (!(result instanceof Promise)) return
    const id = ++run.current
    setPending(true)
    try {
      await result
    } finally {
      if (run.current === id) setPending(false)
    }
  }

  const latest = useRef(() => {})
  useLayoutEffect(() => {
    latest.current = send
  })
  useImperativeHandle(ref, () => ({ type: setText, attach: (list) => setFiles((f) => [...f, ...list]), mode: setMode, send: () => latest.current() }), [])

  const stop = () => {
    run.current++
    setPending(false)
    onStop?.()
    area.current?.focus()
  }

  const add = (list: FileList | File[]) => {
    const next = [...list].map(fromFile)
    if (next.length) setFiles((f) => [...f, ...next])
  }
  const remove = (id: string) =>
    setFiles((f) => {
      const gone = f.find((x) => x.id === id)
      if (gone?.url) URL.revokeObjectURL(gone.url)
      return f.filter((x) => x.id !== id)
    })
  // Mention: an @ at the caret, for whatever mention menu the product has.
  const mention = () => {
    const el = area.current
    const at = el?.selectionStart ?? text.length
    const before = text.slice(0, at)
    const next = `${before}${before && !/\s$/.test(before) ? ' ' : ''}@${text.slice(at)}`
    setText(next)
    requestAnimationFrame(() => {
      el?.focus()
      const c = next.length - (text.length - at)
      el?.setSelectionRange(c, c)
    })
  }

  const current = modes.find((m) => m.id === mode) ?? modes[0]

  return (
    <div ref={setLayer} className="relative" style={{ width, maxWidth: '100%', height: BASE }}>
      {/* The card, hung from the bottom of the footprint: it grows upward. Its edge catches light from the top left. */}
      <motion.div
        className={`${LIT} ${LIFT} absolute inset-x-0 top-full -translate-y-full rounded-[22px] p-px`}
        style={{ height: h }}
        onDragEnter={(e) => {
          if (!e.dataTransfer.types.includes('Files')) return
          depth.current++
          setDrag(true)
        }}
        onDragLeave={() => {
          depth.current = Math.max(0, depth.current - 1)
          if (!depth.current) setDrag(false)
        }}
        onDragOver={(e) => e.dataTransfer.types.includes('Files') && e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          depth.current = 0
          setDrag(false)
          add(e.dataTransfer.files)
        }}
      >
        <div className={`${CARD} relative h-full overflow-hidden rounded-[21px] transition-shadow duration-200`} style={{ boxShadow: focused ? 'inset 0 0 0 1px var(--line-strong)' : undefined }}>
          <div ref={content} className="absolute inset-x-0 bottom-0 px-4 pb-3.5 pt-3.5">
            {/* The line across the top: what goes with the message, or what it's doing; the model on the right. */}
            <div className={`${MONO} flex h-4 items-center gap-3 text-ink-3`}>
              <div className="relative flex h-full min-w-0 flex-1 items-center">
                <AnimatePresence initial={false} mode="popLayout">
                  {busy ? (
                    <motion.span key="busy" className="flex min-w-0 items-center gap-2" initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.2, ease: ease.out }}>
                      <span className="relative flex size-1.5 shrink-0">
                        {!reduce && <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-50" />}
                        <span className="relative size-1.5 rounded-full bg-accent" />
                      </span>
                      <span className="truncate text-ink-2">{status}</span>
                      <Elapsed />
                    </motion.span>
                  ) : label ? (
                    <motion.span key="label" className="truncate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
                      {label}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </div>
              {model && (
                <span className="flex shrink-0 items-center gap-1.5 text-ink-2">
                  <Glyph />
                  {model}
                </span>
              )}
            </div>

            {/* Files: a row of cards above the words; many scroll sideways inside the card. */}
            <AnimatePresence initial={false}>
              {files.length > 0 && (
                <motion.div key="files" className="overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: 56, opacity: 1 }} exit={{ height: 0, opacity: 0, transition: { duration: 0.18, ease: ease.out } }} transition={spring.smooth}>
                  <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pt-3 [scrollbar-width:none]" style={files.length > 2 ? { maskImage: 'linear-gradient(90deg, #000 calc(100% - 28px), transparent)' } : undefined}>
                    <AnimatePresence initial={false} mode="popLayout">
                      {files.map((f, i) => (
                        <File key={f.id} file={f} index={i} onRemove={() => remove(f.id)} />
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* The words. */}
            <div className="relative mt-3">
              {/* The placeholder's slot: a two-tone sentence, or suggestions rolling through it like an odometer. */}
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden" style={{ height: LINE }}>
                <AnimatePresence initial={false}>
                  {!text && (
                    <motion.span
                      key={busy ? 'busy' : offer ? `tip-${tip}` : 'idle'}
                      className="absolute inset-0 flex items-center gap-2 text-[15.5px] tracking-[-0.01em]"
                      style={{ lineHeight: `${LINE}px` }}
                      initial={{ y: offer && !reduce ? '100%' : 0, opacity: 0 }}
                      animate={{ y: 0, opacity: 1, transition: { duration: 0.42, ease: ease.out } }}
                      exit={{ y: offer && !reduce ? '-100%' : 0, opacity: 0, transition: { duration: 0.3, ease: ease.out } }}
                    >
                      {busy ? (
                        <span className="truncate text-ink-3">Add a follow-up</span>
                      ) : offer ? (
                        <>
                          <span className="truncate text-ink-3">{offer}</span>
                          <span className="shrink-0 rounded-[5px] px-1.5 text-[11px] leading-[18px] text-ink-3 shadow-[inset_0_0_0_1px_var(--line)]">Tab</span>
                        </>
                      ) : (
                        <span className="truncate">
                          <span className="text-ink-2">
                            {placeholder}
                            {hint ? ',' : ''}
                          </span>
                          {hint && <span className="text-ink-3"> {hint}</span>}
                        </span>
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <textarea
                ref={area}
                rows={2}
                value={text}
                aria-label={offer ? `${placeholder}. Suggestion: ${offer}, press Tab to use it` : placeholder}
                onChange={(e) => setText(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && !e.shiftKey && offer) {
                    e.preventDefault()
                    setText(offer)
                  } else if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    send()
                  } else if (e.key === 'Escape' && busy) {
                    e.preventDefault()
                    stop()
                  }
                }}
                onPaste={(e) => {
                  if (e.clipboardData.files.length) {
                    e.preventDefault()
                    add(e.clipboardData.files)
                  }
                }}
                className="block w-full resize-none bg-transparent text-[15.5px] tracking-[-0.01em] text-ink caret-[var(--accent)] outline-none [scrollbar-width:thin]"
                style={{ lineHeight: `${LINE}px` }}
              />
            </div>

            {/* The keys: attach, mention, how hard it thinks; voice and Send on the right. */}
            <div className="mt-3 flex h-8 items-center gap-2">
              <Key label="Attach files" onClick={() => picker.current?.click()}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                  <path d="M8 3.5v9M3.5 8h9" />
                </svg>
              </Key>
              <input ref={picker} type="file" multiple hidden onChange={(e) => (e.target.files && add(e.target.files), (e.target.value = ''))} />
              <Key label="Mention" onClick={mention}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="2.4" />
                  <path d="M10.4 8v.9a1.6 1.6 0 0 0 3.2 0V8A5.6 5.6 0 1 0 11 12.8" />
                </svg>
              </Key>
              <ModePicker modes={modes} current={current} open={menu} setOpen={setMenu} onPick={setMode} bottom={menuBottom} layer={layer} />
              <span className="flex-1" />
              {onVoice && (
                <motion.button type="button" whileTap={press} aria-label="Speak" onClick={onVoice} className="ring-focus flex size-8 items-center justify-center rounded-[10px] text-ink-3 transition-colors duration-150 hover:text-ink">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5.6" y="2" width="4.8" height="7.6" rx="2.4" />
                    <path d="M3.4 7.6a4.6 4.6 0 0 0 9.2 0M8 12.2V14" />
                  </svg>
                </motion.button>
              )}
              <SendKey canSend={canSend} busy={busy} onSend={send} onStop={stop} />
            </div>
          </div>

          {/* Drop target */}
          <AnimatePresence>
            {drag && (
              <motion.div
                className={`${CARD} pointer-events-none absolute inset-0 flex items-center justify-center gap-2 rounded-[21px] text-[13px] text-ink-2`}
                style={{ boxShadow: 'inset 0 0 0 1.5px var(--line-strong)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={{ duration: 0.15 }}
              >
                <Upload size={15} />
                Drop to attach
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Sent words lift off the card and fade, outside its clipping. */}
      <AnimatePresence>
        {lifts.map((l) => (
          <motion.div
            key={l.id}
            aria-hidden
            className="pointer-events-none absolute flex max-h-[138px] flex-col justify-end overflow-hidden whitespace-pre-wrap break-words text-[15.5px] tracking-[-0.01em] text-ink"
            style={{ left: 17, right: 17, bottom: 1 + 14 + 32 + 12 + LINE, lineHeight: `${LINE}px` }}
            initial={{ opacity: 1, y: 0 }}
            animate={reduce ? { opacity: 0 } : { opacity: 0, y: -34 }}
            transition={{ duration: 0.45, ease: ease.out, opacity: { duration: 0.42, ease: [0.4, 0, 0.6, 1] } }}
            onAnimationComplete={() => setLifts((all) => all.filter((x) => x.id !== l.id))}
          >
            {l.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/**
 * Prompts to start from, for the empty state beside a PromptBox: each a card with the same lit edge, a
 * mono label and its number, and a two-tone sentence. Press one, or its number while none is focused,
 * and `onPick` gets the prompt.
 */
export function PromptStarters({ items, onPick, width = 420 }: { items: Starter[]; onPick: (prompt: string) => void; width?: number }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      const n = +e.key - 1
      if (Number.isInteger(n) && n >= 0 && n < items.length && !e.metaKey && !e.ctrlKey && !e.altKey) onPick(items[n].prompt ?? [items[n].lead, items[n].rest].filter(Boolean).join(' '))
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [items, onPick])
  return (
    <div className="grid gap-3" style={{ width, maxWidth: '100%', gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, minmax(0, 1fr))` }}>
      {items.map((s, i) => (
        <motion.button
          key={s.label + s.lead}
          type="button"
          whileTap={press}
          onClick={() => onPick(s.prompt ?? [s.lead, s.rest].filter(Boolean).join(' '))}
          className={`${LIT} ${LIFT} ring-focus group/starter rounded-[16px] p-px text-left`}
        >
          <span className={`${CARD} flex h-full min-h-[96px] flex-col rounded-[15px] px-3.5 pb-3 pt-3 transition-colors duration-150`}>
            <span className={`${MONO} flex justify-between text-ink-3`}>
              {s.label}
              <span className="normal-case transition-colors duration-150 group-hover/starter:text-ink-2">{i + 1}</span>
            </span>
            <span className="mt-2.5 text-[13.5px] leading-[19px]">
              <span className="text-ink">{s.lead}</span>
              {s.rest && <span className="text-ink-3"> {s.rest}</span>}
            </span>
          </span>
        </motion.button>
      ))}
    </div>
  )
}

/* ───────────────────────────── Parts ───────────────────────────── */

/** The model's mark: a 5×5 pixel glyph. */
function Glyph() {
  const on = [2, 6, 7, 8, 10, 12, 14, 16, 17, 18, 22]
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden>
      {on.map((i) => (
        <rect key={i} x={(i % 5) * 2.8 + 0.2} y={Math.floor(i / 5) * 2.8 + 0.2} width="2.2" height="2.2" rx="0.6" fill="currentColor" />
      ))}
    </svg>
  )
}

/** How hard it thinks: stairs of 2 to 5 dots, lit in the accent up to the level. */
function Ramp({ level }: { level: number }) {
  return (
    <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden>
      {[2, 3, 4, 5].map((n, c) =>
        Array.from({ length: n }, (_, r) => (
          <rect key={`${c}-${r}`} x={c * 5.6 + 1} y={14 - (r + 1) * 2.8 + 0.4} width="2" height="2" rx="0.6" fill={c < level ? 'var(--accent)' : 'color-mix(in oklch, var(--ink) 14%, transparent)'} style={{ transition: `fill 160ms ${c * 30}ms` }} />
        )),
      )}
    </svg>
  )
}

/** One of the row's keys: a square with a hairline edge. */
function Key({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <motion.button type="button" whileTap={press} aria-label={label} title={label} onClick={onClick} className="ring-focus flex size-8 shrink-0 items-center justify-center rounded-[10px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] transition-colors duration-150 hover:bg-surface-2 hover:text-ink dark:hover:bg-surface-3">
      {children}
    </motion.button>
  )
}

const kindOf = (f: Attachment) => (f.name.includes('.') ? f.name.split('.').pop()!.slice(0, 4).toUpperCase() : f.type.split('/').pop()?.slice(0, 4).toUpperCase() || 'FILE')

/** A file above the words: a tile with its type, or the image itself, its name and size, and a remove that shows on hover. */
function File({ file, index, onRemove }: { file: Attachment; index: number; onRemove: () => void }) {
  return (
    <motion.div
      layout="position"
      className="group/file relative flex h-11 w-[188px] shrink-0 items-center gap-2.5 rounded-[12px] pl-1.5 pr-3 shadow-[inset_0_0_0_1px_var(--line)]"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.24, ease: ease.out, delay: Math.min(index, 4) * 0.03 } }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.14 } }}
      transition={spring.smooth}
    >
      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-surface-2 bg-cover bg-center font-mono text-[9px] tracking-[0.04em] text-ink-2 dark:bg-surface-3" style={file.url ? { backgroundImage: `url("${file.url}")` } : undefined}>
        {!file.url && kindOf(file)}
      </span>
      <span className="min-w-0 flex-1 leading-4">
        <span className="block truncate text-[12.5px] text-ink">{file.name}</span>
        <span className="tnum block text-[11.5px] text-ink-3">{sizeOf(file.size)}</span>
      </span>
      <button
        type="button"
        aria-label={`Remove ${file.name}`}
        onClick={onRemove}
        className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-ink text-surface opacity-0 shadow-[0_0_0_2px_var(--surface)] outline-none transition-opacity duration-150 focus-visible:opacity-100 group-hover/file:opacity-100"
      >
        <Close size={9} strokeWidth={2.8} />
      </button>
    </motion.div>
  )
}

function ModePicker({
  modes,
  current,
  open,
  setOpen,
  onPick,
  bottom,
  layer,
}: {
  modes: Mode[]
  current: Mode
  open: boolean
  setOpen: (v: boolean) => void
  onPick: (id: string) => void
  bottom: MotionValue<number>
  /** The menu renders here, outside the box's clipping. */
  layer: HTMLElement | null
}) {
  const [hi, setHi] = useState(0)
  const [via, setVia] = useState<'pointer' | 'keys'>('pointer')
  const button = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)

  // It opens with the current mode highlighted.
  const show = () => {
    setHi(Math.max(0, modes.findIndex((m) => m.id === current.id)))
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      const t = e.target as Node
      if (!button.current?.contains(t) && !list.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const pick = (id: string) => {
    onPick(id)
    setOpen(false)
    button.current?.focus()
  }
  const mark = (m: Mode) => (m.level !== undefined ? <Ramp level={m.level} /> : m.icon)

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Mode: ${current.name}`}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (!open && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            e.preventDefault()
            show()
          } else if (open && e.key === 'ArrowDown') {
            e.preventDefault()
            setVia('keys')
            setHi((i) => (i + 1) % modes.length)
          } else if (open && e.key === 'ArrowUp') {
            e.preventDefault()
            setVia('keys')
            setHi((i) => (i - 1 + modes.length) % modes.length)
          } else if (open && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            pick(modes[hi].id)
          } else if (open && e.key === 'Escape') {
            e.preventDefault()
            setOpen(false)
          }
        }}
        className={`ring-focus ml-1 flex h-8 shrink-0 items-center gap-2 rounded-[10px] pl-1.5 pr-2 text-[13.5px] transition-colors duration-150 ${open ? 'bg-surface-2 text-ink dark:bg-surface-3' : 'text-ink-2 hover:bg-surface-2 hover:text-ink dark:hover:bg-surface-3'}`}
      >
        <span className="flex text-ink-2">{mark(current)}</span>
        <span>{current.name}</span>
        {current.aside && <span className="-ml-0.5 text-ink-3">{current.aside}</span>}
      </button>

      {layer &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={list}
                role="listbox"
                aria-label="Mode"
                className={`${LIT} absolute z-20 w-[268px] rounded-[15px] p-px`}
                style={{ left: 88, bottom, boxShadow: '0 16px 40px -16px rgb(0 0 0 / 0.3)', transformOrigin: '24px 100%' }}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1, transition: { duration: 0.14, ease: ease.out } }}
                exit={{ opacity: 0, transition: { duration: 0.12, ease: ease.out } }}
              >
                <div className={`${CARD} relative rounded-[14px] p-1`}>
                  {/* One highlight glides between rows. */}
                  <motion.div className="absolute inset-x-1 top-1 rounded-[10px] bg-surface-2 dark:bg-surface-3" style={{ height: ROW }} initial={false} animate={{ y: hi * ROW }} transition={via === 'keys' ? { duration: 0 } : spring.snappy} />
                  {modes.map((m, i) => (
                    <button
                      key={m.id}
                      type="button"
                      role="option"
                      aria-selected={m.id === current.id}
                      tabIndex={-1}
                      onPointerEnter={() => {
                        setVia('pointer')
                        setHi(i)
                      }}
                      onClick={() => pick(m.id)}
                      className="relative flex w-full items-center gap-3 rounded-[10px] px-2.5 text-left outline-none"
                      style={{ height: ROW }}
                    >
                      <span className="flex w-[22px] shrink-0 justify-center text-ink-2">{mark(m)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] text-ink">
                          {m.name}
                          {m.aside && <span className="text-ink-3"> {m.aside}</span>}
                        </span>
                        <span className="block truncate text-[12px] text-ink-3">{m.note}</span>
                      </span>
                      <span className="flex w-4 shrink-0 justify-center text-ink">{m.id === current.id && <Check size={13} strokeWidth={2.6} />}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          layer,
        )}
    </>
  )
}

/** Send, a key in the same set as the others: ink when there's something to send, a square Stop while it answers. */
function SendKey({ canSend, busy, onSend, onStop }: { canSend: boolean; busy: boolean; onSend: () => void; onStop: () => void }) {
  const lit = canSend || busy
  return (
    <motion.button
      type="button"
      whileTap={lit ? press : undefined}
      disabled={!lit}
      aria-label={busy ? 'Stop' : 'Send'}
      onPointerDown={() => lit && tap()}
      onClick={busy ? onStop : onSend}
      className="ring-focus relative flex size-8 shrink-0 items-center justify-center rounded-[10px] transition-colors duration-200 disabled:cursor-default"
      style={{ background: lit ? 'var(--ink)' : 'color-mix(in oklch, var(--ink) 9%, transparent)', color: lit ? 'var(--surface)' : 'var(--ink-3)' }}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span key={busy ? 'stop' : 'send'} className="flex" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.18, ease: ease.out }}>
          {busy ? <span className="size-[9px] rounded-[2.5px] bg-current" /> : <ArrowUp size={14} strokeWidth={2.2} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

/** How long it's been answering; it keeps its own clock so the box doesn't re-render. */
function Elapsed() {
  const [t0] = useState(() => performance.now())
  const [ms, setMs] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setMs(performance.now() - t0), 100)
    return () => clearInterval(id)
  }, [t0])
  return <span className="tnum shrink-0 normal-case">{(ms / 1000).toFixed(1)}s</span>
}
