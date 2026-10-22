'use client'

import { tap } from '../../lib/feel'
import { useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode, Ref } from 'react'
import type { MotionValue } from 'motion/react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { ArrowUp, Bolt, Check, ChevronDown, Close, FilePage, Plus, Search, Orbit, Stop, Upload } from '../../icons'
import { useStack } from '../../lib/hooks'
import { ease, press, spring } from '../../lib/motion'
import { Kbd } from '../../ui/Kbd'
import { Morph } from '../../ui/Morph'
import { Glow, useTone } from '../../ui/Intelligence'
import type { Tone } from '../../ui/Intelligence'

export type Attachment = {
  id: string
  name: string
  size: number
  type: string
  url?: string
  file?: File
}
export type Mode = { id: string; name: string; note: string; icon: ReactNode }
export type Message = { text: string; files: Attachment[]; mode: string }
/** For demos and tests: write, attach, switch mode and send without touching focus. */
export type PromptHandle = { type(text: string): void; attach(files: Attachment[]): void; mode(id: string): void; send(): void }

const DEFAULT_MODES: Mode[] = [
  {
    id: 'quick',
    name: 'Quick',
    note: 'Short answers, right away',
    icon: <Bolt size={15} />,
  },
  {
    id: 'think',
    name: 'Think',
    note: 'Reasons it through step by step',
    icon: <Orbit size={15} />,
  },
  {
    id: 'research',
    name: 'Research',
    note: 'Searches and cites its sources',
    icon: <Search size={15} />,
  },
]

const LINE = 22
const MAX_LINES = 6
const PAD = 8
const TOOLBAR = 36
/** Height of the box with one line and no files. The component reserves exactly this. */
const BASE = PAD + 36 + TOOLBAR + PAD
const ROW = 52
const FILES = 42
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
 * A prompt box for AI products. It sits in a fixed footprint and grows upward over the
 * page as you write or attach, so nothing beneath it ever moves. Send lifts your words off
 * the box; while the answer is coming the send button becomes Stop, circled by a slow orbit.
 * Drop files anywhere on it. Enter sends, Shift+Enter adds a line, Escape stops. Given
 * suggestions, the empty box rolls through them, and Tab takes the one showing.
 */
export function PromptBox({
  onSend,
  onStop,
  placeholder = 'Ask anything',
  modes = DEFAULT_MODES,
  initialMode,
  initialFiles = [],
  suggestions,
  width = 420,
  busy: working,
  onGrow,
  tone: toneProp,
  ref,
}: {
  /** Return a promise to show the working state until it settles. */
  onSend?: (message: Message) => Promise<unknown> | void
  /** Called when a person stops what's working. */
  onStop?: () => void
  /** Shown while the box is empty. */
  placeholder?: string
  /** The modes to choose between, each with an icon and a line about it. */
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
  /** Called as the box grows above its resting height, with how far, so whatever sits above it can make room. */
  onGrow?: (by: number) => void
  /** How loud the working glow is: the full spectrum, or the same motion in ink. Leave it out and it's loud the first time, then quiet for a while. */
  tone?: Tone
  ref?: Ref<PromptHandle>
}) {
  const [text, setText] = useState('')
  const [files, setFiles] = useState<Attachment[]>(initialFiles)
  const [mode, setMode] = useState(initialMode ?? modes[1]?.id ?? modes[0].id)
  const [pending, setPending] = useState(false)
  const busy = working ?? pending
  const auto = useTone(busy, 'prompt')
  const tone = toneProp ?? auto
  const [focused, setFocused] = useState(false)
  const [drag, setDrag] = useState(false)
  const [menu, setMenu] = useState(false)
  const [lifts, setLifts] = useState<{ id: number; text: string }[]>([])
  const [layer, setLayer] = useState<HTMLDivElement | null>(null)
  const [tip, setTip] = useState(0)

  const area = useRef<HTMLTextAreaElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const sat = useRef(() => {})
  // Attachments, text and toolbar are stacked by transform, so attachments folding away never moves the rest in the layout.
  useStack(content, 0, () => sat.current())
  const picker = useRef<HTMLInputElement>(null)
  const run = useRef(0)
  const depth = useRef(0)
  const filesRef = useRef(files)
  useLayoutEffect(() => {
    filesRef.current = files
  })
  const reduce = useReducedMotion()

  // The box follows its content's height, and grows upward because it hangs from the bottom.
  // Box and content are both placed by transform from a fixed top, so growing never moves either in the layout.
  const h = useMotionValue(BASE)
  const grew = useRef(onGrow)
  useLayoutEffect(() => {
    grew.current = onGrow
  })
  useLayoutEffect(() => {
    const el = content.current
    if (!el) return
    let placed = false
    const sit = () => (el.style.translate = `0 ${h.get() - parseFloat(getComputedStyle(el).height)}px`)
    sat.current = sit
    const ro = new ResizeObserver(() => {
      const next = Math.max(BASE, el.offsetHeight)
      if (!placed || reduce) h.set(next)
      else animate(h, next, spring.smooth)
      placed = true
      sit()
    })
    ro.observe(el)
    const off = h.on('change', (v) => {
      sit()
      grew.current?.(v - BASE)
    })
    sit()
    return () => {
      ro.disconnect()
      off()
    }
  }, [h, reduce])
  const menuBottom = useTransform(h, (v) => v + 8)

  // Grow the textarea with its text, up to six lines; past that it scrolls.
  useLayoutEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${Math.min(el.scrollHeight, LINE * MAX_LINES)}px`
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

  const current = modes.find((m) => m.id === mode) ?? modes[0]

  return (
    <div ref={setLayer} className="relative" style={{ width, maxWidth: '100%', height: BASE }}>
      {/* While it answers, the box wears Intelligence: a halo behind it, light running round its edge. */}
      <Glow on={busy} tone={tone} layer="halo" radius="var(--radius-card)" style={{ top: 'calc(100% - 2px)', bottom: 'auto', height: h, y: '-100%' }} />
      <motion.div
        className="absolute inset-x-0 top-full -translate-y-full overflow-hidden rounded-card bg-surface transition-shadow duration-200"
        style={{
          height: h,
          boxShadow: focused ? 'var(--elev-field), var(--elev-float)' : 'var(--elev-float)',
        }}
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
        <div ref={content} className="absolute inset-x-0 top-0 p-2">
          {/* Attachments */}
          <AnimatePresence initial={false}>
            {files.length > 0 && (
              <motion.div
                key="files"
                className="flex gap-1.5 overflow-x-auto px-0.5 pb-1 pt-1.5 [scrollbar-width:none]"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: FILES, opacity: 1 }}
                exit={{
                  height: 0,
                  opacity: 0,
                  transition: { duration: 0.2, ease: ease.out },
                }}
                transition={spring.smooth}
              >
                <AnimatePresence initial={false} mode="popLayout">
                  {files.map((f, i) => (
                    <Chip key={f.id} file={f} index={i} onRemove={() => remove(f.id)} />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Text */}
          <div className="relative px-2.5 pb-1.5 pt-2">
            {/* The placeholder's slot: suggestions roll through it like an odometer. */}
            <span aria-hidden className="pointer-events-none absolute inset-x-2.5 top-2 h-[22px] overflow-hidden">
              <AnimatePresence initial={false}>
                {!text && (
                  <motion.span
                    key={busy ? 'busy' : offer ? `tip-${tip}` : 'idle'}
                    className="absolute inset-0 flex items-center gap-2 text-body leading-[22px] text-ink-3"
                    initial={{ y: offer && !reduce ? '100%' : 0, opacity: 0 }}
                    animate={{ y: 0, opacity: 1, transition: { duration: 0.42, ease: ease.out } }}
                    exit={{ y: offer && !reduce ? '-100%' : 0, opacity: 0, transition: { duration: 0.3, ease: ease.out } }}
                  >
                    <span className="truncate">{busy ? 'Add a follow-up' : (offer ?? placeholder)}</span>
                    {offer && <Kbd>Tab</Kbd>}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            <textarea
              ref={area}
              rows={1}
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
              className="block w-full resize-none bg-transparent text-body leading-[22px] text-ink outline-none [scrollbar-width:thin]"
            />
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1" style={{ height: TOOLBAR }}>
            <motion.button type="button" whileTap={press} aria-label="Attach files" onClick={() => picker.current?.click()} className="ring-focus flex size-8 items-center justify-center rounded-full text-ink-3 transition-colors duration-150 hover:bg-surface-2 hover:text-ink">
              <Plus size={17} />
            </motion.button>
            <input ref={picker} type="file" multiple hidden onChange={(e) => (e.target.files && add(e.target.files), (e.target.value = ''))} />

            <ModePicker modes={modes} current={current} open={menu} setOpen={setMenu} onPick={setMode} bottom={menuBottom} layer={layer} />

            <span className="flex-1" />
            <SendButton canSend={canSend} busy={busy} tone={tone} onSend={send} onStop={stop} reduce={!!reduce} />
          </div>
        </div>

        {/* Drop target */}
        <AnimatePresence>
          {drag && (
            <motion.div
              className="pointer-events-none absolute inset-1.5 flex items-center justify-center gap-2 rounded-[16px] bg-surface text-callout font-medium text-ink-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={{ duration: 0.15 }}
            >
              <svg className="absolute inset-0 size-full" aria-hidden>
                <rect
                  x="1"
                  y="1"
                  rx="16"
                  style={{
                    width: 'calc(100% - 2px)',
                    height: 'calc(100% - 2px)',
                  }}
                  fill="none"
                  stroke="var(--line-strong)"
                  strokeWidth="1.5"
                  strokeDasharray="6 5"
                  className="motion-safe:animate-[march_0.6s_linear_infinite]"
                />
              </svg>
              <Upload size={17} />
              Drop to attach
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <Glow on={busy} tone={tone} layer="ring" radius="var(--radius-card)" style={{ top: '100%', bottom: 'auto', height: h, y: '-100%' }} />

      {/* Sent words lift off the box and fade, outside its clipping. */}
      <AnimatePresence>
        {lifts.map((l) => (
          <motion.div
            key={l.id}
            aria-hidden
            className="pointer-events-none absolute flex max-h-[132px] flex-col justify-end overflow-hidden whitespace-pre-wrap break-words text-body leading-[22px] text-ink"
            style={{
              left: PAD + 10,
              right: PAD + 10,
              bottom: PAD + TOOLBAR + 6,
            }}
            initial={{ opacity: 1, y: 0 }}
            animate={reduce ? { opacity: 0 } : { opacity: 0, y: -34 }}
            transition={{
              duration: 0.45,
              ease: ease.out,
              opacity: { duration: 0.42, ease: [0.4, 0, 0.6, 1] },
            }}
            onAnimationComplete={() => setLifts((all) => all.filter((x) => x.id !== l.id))}
          >
            {l.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/* ───────────────────────────── Parts ───────────────────────────── */

function Chip({ file, index, onRemove }: { file: Attachment; index: number; onRemove: () => void }) {
  return (
    <motion.div
      layout="position"
      className="group/chip flex h-8 shrink-0 items-center gap-2 rounded-full bg-surface-2 pl-1 pr-1"
      initial={{ opacity: 0, y: 6 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.24,
          ease: ease.out,
          delay: Math.min(index, 4) * 0.03,
        },
      }}
      exit={{ opacity: 0, transition: { duration: 0.14 } }}
      transition={spring.smooth}
    >
      {/* Images show themselves; everything else gets a quiet page. */}
      <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface bg-cover bg-center text-ink-3 shadow-border" style={file.url ? { backgroundImage: `url(${file.url})` } : undefined}>
        {!file.url && <FilePage size={12} />}
      </span>
      <span className="max-w-[150px] truncate text-footnote font-medium text-ink">{file.name}</span>
      <span className="tnum text-caption text-ink-3">{sizeOf(file.size)}</span>
      {/* The remove button keeps its slot; it only shows on hover or focus. */}
      <button
        type="button"
        aria-label={`Remove ${file.name}`}
        onClick={onRemove}
        className="flex size-6 items-center justify-center rounded-full text-ink-3 opacity-0 outline-none transition-[opacity,color,background-color] duration-150 hover:bg-surface hover:text-ink focus-visible:opacity-100 group-hover/chip:opacity-100"
      >
        <Close size={11} strokeWidth={2.6} />
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
    setHi(
      Math.max(
        0,
        modes.findIndex((m) => m.id === current.id),
      ),
    )
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

  const views = Object.fromEntries(
    modes.map((m) => [
      m.id,
      <span key={m.id} className="flex h-8 items-center gap-1.5 pl-2.5 pr-2 text-footnote font-medium">
        {m.icon}
        {m.name}
        <ChevronDown size={13} className="text-ink-3" />
      </span>,
    ]),
  )

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
        className="ring-focus group/mode rounded-full "
      >
        {/* The chip morphs to each label's measured width, so it never squashes. */}
        <Morph view={current.id} views={views} radius={16} anchor="center" justify="start" className={`transition-colors duration-150 ${open ? 'bg-surface-2 text-ink' : 'text-ink-2 group-hover/mode:bg-surface-2 group-hover/mode:text-ink'}`} />
      </button>

      {layer &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={list}
                role="listbox"
                aria-label="Mode"
                className="glass absolute z-20 w-[272px] rounded-[18px] bg-surface p-1.5"
                style={{
                  left: PAD + 32 + 4,
                  bottom,
                  boxShadow: 'var(--elev-modal)',
                  transformOrigin: '24px 100%',
                }}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1, transition: { duration: 0.14, ease: ease.out } }}
                exit={{ opacity: 0, transition: { duration: 0.12, ease: ease.out } }}
              >
                {/* One highlight glides between rows. */}
                <motion.div className="absolute inset-x-1.5 top-1.5 rounded-[12px] bg-surface-2" style={{ height: ROW }} initial={false} animate={{ y: hi * ROW }} transition={via === 'keys' ? { duration: 0 } : spring.snappy} />
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
                    className="relative flex w-full items-center gap-3 rounded-[12px] px-2.5 text-left outline-none"
                    style={{ height: ROW }}
                  >
                    <span className={`flex size-[30px] shrink-0 items-center justify-center rounded-[9px] transition-colors duration-150 ${hi === i ? 'bg-plate text-ink shadow-raised' : 'bg-surface-2 text-ink-2'}`}>{m.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-callout font-medium">{m.name}</span>
                      <span className="block truncate text-caption text-ink-3">{m.note}</span>
                    </span>
                    <span className="flex w-4 shrink-0 justify-center text-ink">{m.id === current.id && <Check size={15} strokeWidth={2.6} />}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>,
          layer,
        )}
    </>
  )
}

function SendButton({ canSend, busy, tone, onSend, onStop, reduce }: { canSend: boolean; busy: boolean; tone: Tone; onSend: () => void; onStop: () => void; reduce: boolean }) {
  const lit = canSend || busy
  const orbit = useId()
  return (
    <motion.button
      type="button"
      whileTap={lit ? press : undefined}
      disabled={!lit}
      aria-label={busy ? 'Stop' : 'Send'}
      onPointerDown={() => lit && tap()}
      onClick={busy ? onStop : onSend}
      className="sink ring-focus relative flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200 disabled:cursor-default"
      style={{
        background: lit ? 'var(--ink)' : 'var(--surface-2)',
        color: lit ? 'var(--surface)' : 'var(--ink-3)',
      }}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span key={busy ? 'stop' : 'send'} className="flex" initial={{ opacity: 0, y: busy ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: busy ? -6 : 0 }} transition={{ duration: 0.2, ease: ease.out }}>
          {busy ? <Stop size={14} /> : <ArrowUp size={16} />}
        </motion.span>
      </AnimatePresence>

      {/* While working, a short arc orbits the button. */}
      <AnimatePresence>
        {busy && (
          <motion.svg
            aria-hidden
            className="pointer-events-none absolute -inset-[4px] size-[40px]"
            viewBox="0 0 40 40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, rotate: reduce ? 0 : 360 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{
              opacity: { duration: 0.2 },
              rotate: { duration: 1.4, ease: 'linear', repeat: Infinity },
            }}
          >
            <defs>
              <linearGradient id={orbit} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" style={{ stopColor: tone === 'loud' ? 'var(--ai-1)' : 'var(--ink-3)' }} />
                <stop offset="0.5" style={{ stopColor: tone === 'loud' ? 'var(--ai-3)' : 'var(--ink-2)' }} />
                <stop offset="1" style={{ stopColor: tone === 'loud' ? 'var(--ai-4)' : 'var(--ink)' }} />
              </linearGradient>
            </defs>
            <circle cx="20" cy="20" r="18.5" fill="none" stroke="var(--line)" strokeWidth="1.5" />
            <circle cx="20" cy="20" r="18.5" fill="none" stroke={`url(#${orbit})`} strokeWidth="2" strokeLinecap="round" strokeDasharray="26 200" />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
