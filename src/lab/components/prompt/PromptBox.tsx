'use client'

import { tap } from '../../lib/feel'
import { useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode, Ref } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, Close, Upload } from '../../icons'
import { clamp, springStep } from '../../lib/detent'
import type { Body, Spring } from '../../lib/detent'
import { ease, press } from '../../lib/motion'

export type Attachment = {
  id: string
  name: string
  size: number
  type: string
  url?: string
  file?: File
}
/** A way of answering. `badge` is the small word beside its name; `aside` and `level` are kept for hosts that use them. */
export type Mode = { id: string; name: string; note: string; icon?: ReactNode; level?: number; aside?: string; badge?: string }
/** A model to offer. Bring your own `icon`, about 16px. `short` is what the row shows, when the icon already says whose it is. */
export type Model = { name: string; short?: string; icon?: ReactNode }
export type Message = { text: string; files: Attachment[]; mode: string; model?: string; project?: string | null }
/** For demos and tests: write, attach, switch mode, send and focus. */
export type PromptHandle = { type(text: string): void; attach(files: Attachment[]): void; mode(id: string): void; send(): void; focus(): void }
/** A prompt to start from. `prompt` is what it sends; by default, the sentence. */
export type Starter = { label: string; lead: string; rest?: string; prompt?: string }

const icon = (d: ReactNode) => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
    {d}
  </svg>
)
const DEFAULT_MODES: Mode[] = [
  { id: 'quick', name: 'Quick', badge: 'Fast', note: 'Short answers, right away', level: 1, icon: icon(<path d="M10.2 2.6 4.6 10h4.1l-.9 5.4 5.6-7.4H9.3z" />) },
  { id: 'think', name: 'Think', badge: 'Deep', note: 'Reasons it through step by step', level: 3, icon: icon(<path d="M9 2.6c.45 3.3 2.1 4.95 5.4 5.4-3.3.45-4.95 2.1-5.4 5.4-.45-3.3-2.1-4.95-5.4-5.4 3.3-.45 4.95-2.1 5.4-5.4Z" />) },
  {
    id: 'research',
    name: 'Research',
    badge: 'Cited',
    note: 'Searches and cites its sources',
    level: 4,
    icon: icon(
      <>
        <circle cx="9" cy="9" r="6.2" />
        <path d="M2.8 9h12.4M9 2.8c1.7 1.8 2.5 3.9 2.5 6.2S10.7 13.4 9 15.2C7.3 13.4 6.5 11.3 6.5 9S7.3 4.6 9 2.8Z" />
      </>,
    ),
  },
]

/**
 * The material. Each step in dark is the same step in light: the card lifted off the page, the tray one
 * step under it, an edge one step past both. Colours are `light-dark()` pairs, not `dark:` classes, so
 * they read the element's own colour scheme and a panel forced light on a dark page stays light. Set
 * `--prompt-send` on any ancestor to take your own colour for the key. Spread it on the page behind the box.
 */
export const PROMPT_MATERIAL = {
  '--c-ground': 'light-dark(#ffffff, #1a1a1e)',
  '--c-field': 'light-dark(#ffffff, #26262a)',
  '--c-edge': 'light-dark(#e9e9e7, #313136)',
  '--c-edge-on': 'light-dark(#dcdcd9, #3c3c42)',
  '--c-key': 'light-dark(#e6e6e3, #38383d)',
  '--c-strip': 'light-dark(#f5f5f4, #1f1f23)',
  '--c-well': 'light-dark(#f2f2f1, #1f1f23)',
  '--c-lift': 'light-dark(#ffffff, #3a3a3f)',
  '--c-ink': 'light-dark(#1a1a1a, #f5f5f7)',
  '--c-ink-2': 'light-dark(#5c5c5c, #a1a1a6)',
  '--c-ink-3': 'light-dark(#7c7c7c, #909096)',
  '--c-hover': 'light-dark(#f2f2f0, #2e2e33)',
  '--c-rim': 'light-dark(rgba(0,0,0,0.07), rgba(255,255,255,0.08))',
  '--c-send': 'var(--prompt-send, light-dark(#1d1d1f, #f5f5f7))',
  '--c-send-ink': 'light-dark(#ffffff, #1d1d1f)',
  '--c-shadow': 'light-dark(rgba(20,20,18,0.07), rgba(0,0,0,0.45))',
} as CSSProperties

const LINE = 24
const MIN_LINES = 2
const MAX_LINES = 8
/** Sizes are in pixels on purpose: `.pro-app` rescales Tailwind's spacing, and these have to add up. */
const ROW = 34
const PAD = 14
const FRAME = 18 + ROW + PAD
const GAP = 24
/** Corners nest: a round key, the padding around it, and the card's corner. */
const R = ROW / 2 + PAD
const REST = LINE * MIN_LINES + GAP
const SHELF = 44
const HEAD = 26
/** The plate is this tall and slides, so the field changes size with a transform and no layout. */
const PLATE = 640
/** The tray under the card: what it's filed under at rest, what it's doing while it answers. */
const STRIP = 42
/** The height a PromptBox takes at rest, for a host that reserves its room. Add `PROMPT_STRIP` if it has projects. */
export const PROMPT_H = FRAME + REST + HEAD
/** The height at rest of a PromptBox given no label. */
export const PROMPT_H_BARE = FRAME + REST
export const PROMPT_STRIP = STRIP

const TEXT = 'text-[17px]! tracking-[-0.011em]'
const ROW_TEXT = 'text-[16px] tracking-[-0.006em]'
/** On a touch screen, a small key is tappable out to 44px by a hit area that reaches past it. */
const HIT = "pointer-coarse:before:absolute pointer-coarse:before:left-1/2 pointer-coarse:before:top-1/2 pointer-coarse:before:size-[44px] pointer-coarse:before:-translate-x-1/2 pointer-coarse:before:-translate-y-1/2 pointer-coarse:before:content-['']"
/** Press: 0.97, reached in 100ms from the frame the pointer comes down, and back from wherever it got to. */
const TAP = { whileTap: press, transition: { scale: { duration: 0.1, ease: ease.out } } }
/** A mouse press on a key doesn't take focus out of the words. */
const keep = (e: ReactMouseEvent) => e.preventDefault()
/** A press that moves this far means a slide, not a tap. */
const SLOP = 10
/** A send has a moment to land before Stop takes a press: a double click isn't a change of mind. */
const ARMS = 320
/** How long with no new status before it says it's still waiting. No shimmer: it says what it knows. */
const STALL = 20
/** The card's give at the limit: about 3px, there and back. */
const GIVE = 160
const SIZE: Spring = { w: (2 * Math.PI) / 0.3, z: 1 }
const FAR: Spring = { w: (2 * Math.PI) / 0.44, z: 1 }
const MENU = { scale: { type: 'spring', bounce: 0, duration: 0.22 }, opacity: { duration: 0.12, ease: ease.out } } as const
const MENU_W = 244

const fromFile = (f: File): Attachment => ({
  id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 7)}`,
  name: f.name,
  size: f.size,
  type: f.type,
  file: f,
  url: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
})
/** A finger and no mouse: return makes a new line there, because a phone has no Shift+Enter. */
const fingers = () => matchMedia('(hover: none) and (pointer: coarse)').matches
const thenable = (v: unknown): v is PromiseLike<unknown> => typeof (v as PromiseLike<unknown> | undefined)?.then === 'function'
const blank = (t: EventTarget) => !(t as Element).closest('button,a,input,textarea,label,[role^="menuitem"]')

type Part = 'head' | 'files' | 'words' | 'lift'
type Size = Body & { t: number }

/**
 * A prompt box. A white card on a quiet tray, round keys, and one dark key that speaks or sends.
 * It keeps a fixed footprint and grows upward as you write, so nothing beneath it ever moves.
 *
 * The modes sit in a capsule, the chosen one lifted with its name. Given `models`, the model is a menu:
 * press and slide to a row, or tap. Given `projects`, the tray under the card offers them. While it
 * answers, the tray says what it's doing and for how long, in real seconds, and admits it when it's
 * still waiting; with no projects it slides out from under the card for that, and the card rises.
 *
 * Send clears the box at once. Drop or paste files anywhere on it. Enter sends, Shift+Enter adds a line
 * (on a phone return does), Escape stops, and Cmd+Z straight after a send brings the words back. If a
 * send fails, they come back by themselves. Given suggestions, the focused empty box offers one, and
 * Tab takes it. PromptStarters, beside it, offers whole prompts to begin with.
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
  model: firstModel,
  models,
  onModel,
  projects,
  onProject,
  onVoice,
  onGrow,
  ref,
}: {
  /** Return a promise to show the working state until it settles; if it rejects, the words come back to the box. */
  onSend?: (message: Message) => Promise<unknown> | void
  /** Called when a person stops what's working. */
  onStop?: () => void
  /** Shown while the box is empty. */
  placeholder?: string
  /** The rest of the placeholder: "or drop a file to start from it." */
  hint?: string
  /** A quiet line over the words, e.g. "New chat". */
  label?: string
  /** The modes to choose between. */
  modes?: Mode[]
  /** The id of the mode it starts in. */
  initialMode?: string
  /** Files already attached when it opens. */
  initialFiles?: Attachment[]
  /** Prompts to offer; the focused, empty box shows the first, and Tab takes it. */
  suggestions?: string[]
  /** The box's width. It grows in height only, as far as its own scroll. */
  width?: number
  /** Whether an answer is coming, when you track that yourself. Leave it out and the box follows the promise `onSend` returns. */
  busy?: boolean
  /** What it's doing while it answers: "Reading the board update". Only ever what you say. */
  status?: string
  /** The model, named beside Send. With `models`, the one it starts on. */
  model?: string
  /** Models to choose between, each with your own icon. Without them `model` is plain text, with no chevron pretending to be a menu. */
  models?: Model[]
  /** Called when a person picks a model. */
  onModel?: (name: string) => void
  /** Projects to file this under. Given, a slim strip under the field offers them. */
  projects?: string[]
  /** Called when a person picks a project, or null for none. */
  onProject?: (name: string | null) => void
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
  const [modelMenu, setModelMenu] = useState(false)
  const [projectMenu, setProjectMenu] = useState(false)
  const [model, setModel] = useState(firstModel ?? models?.[0]?.name)
  const [project, setProject] = useState<string | null>(null)
  const [layer, setLayer] = useState<HTMLDivElement | null>(null)
  const [failed, setFailed] = useState(false)
  const [sent, setSent] = useState(0)

  const area = useRef<HTMLTextAreaElement>(null)
  const ghost = useRef<HTMLTextAreaElement>(null)
  const card = useRef<HTMLDivElement | null>(null)
  const hang = useCallback((n: HTMLDivElement | null) => {
    card.current = n
    setLayer(n)
  }, [])
  const plate = useRef<HTMLDivElement>(null)
  const headBox = useRef<HTMLDivElement>(null)
  const filesBox = useRef<HTMLDivElement>(null)
  const wordsBox = useRef<HTMLDivElement>(null)
  const rail = useRef<HTMLDivElement>(null)
  const sendKey = useRef<HTMLButtonElement>(null)
  const picker = useRef<HTMLInputElement>(null)
  const run = useRef(0)
  const depth = useRef(0)
  const started = useRef(0)
  const limit = useRef(false)
  const count = useRef(files.length)
  const filesRef = useRef(files)
  // What just left, for Cmd+Z. Any edit forgets it, so Cmd+Z goes back to meaning undo.
  const last = useRef<{ text: string; files: Attachment[] } | null>(null)
  useLayoutEffect(() => {
    filesRef.current = files
  })
  useLayoutEffect(() => {
    if (busy) started.current = performance.now()
  }, [busy])
  const reduce = useReducedMotion()
  const head = !!label
  const under = projects?.length ? STRIP : 0
  const base = FRAME + REST + (head ? HEAD : 0) + under
  const edge = `inset 0 0 0 1px var(${focused ? '--c-edge-on' : '--c-edge'})`
  const tray = useRef<HTMLDivElement>(null)
  // The tray shows while it answers or after a failed send; with projects it's always there and holds still.
  const telling = busy || failed

  // The card is the sum of three parts, each a spring from its live value: one source of truth for
  // every height, so nothing chases anything, and a change mid-flight keeps its speed.
  const sizes = useRef<Record<Part, Size>>({
    head: { x: head ? HEAD : 0, v: 0, t: head ? HEAD : 0 },
    files: { x: initialFiles.length ? SHELF : 0, v: 0, t: initialFiles.length ? SHELF : 0 },
    words: { x: REST, v: 0, t: REST },
    lift: { x: 0, v: 0, t: 0 },
  })
  const loop = useRef({ raf: 0, then: 0, live: false })
  const grew = useRef(onGrow)
  const baseRef = useRef(base)
  const underRef = useRef(under)
  const still = useRef(reduce)
  useLayoutEffect(() => {
    grew.current = onGrow
    baseRef.current = base
    underRef.current = under
    still.current = reduce
  })
  // Layout was set once, at the final size. Each frame is transforms only: the plate slides, and
  // what's above the keys is held where the spring says it is. Nothing here costs a layout.
  const paint = useCallback(() => {
    const s = sizes.current
    const total = FRAME + s.head.x + s.files.x + s.words.x
    const w = s.words.t - s.words.x
    const f = s.files.t - s.files.x
    const h = s.head.t - s.head.x
    if (plate.current) plate.current.style.transform = `translate3d(0,${PLATE - total}px,0)`
    if (wordsBox.current) wordsBox.current.style.transform = `translate3d(0,${w}px,0)`
    if (filesBox.current) {
      filesBox.current.style.transform = `translate3d(0,${w + f}px,0)`
      filesBox.current.style.clipPath = f > 0 ? `inset(0 0 ${f}px 0)` : ''
    }
    if (headBox.current) headBox.current.style.transform = `translate3d(0,${w + f + h}px,0)`
    // The card rises off the tray as it slides out, by transform like everything else.
    const up = s.lift.x
    if (card.current) card.current.style.transform = up ? `translate3d(0,${-up}px,0)` : ''
    if (tray.current && !underRef.current) {
      tray.current.style.opacity = `${clamp(up / 14, 0, 1)}`
      tray.current.style.transform = `translate3d(0,${(STRIP - up) * 0.25}px,0)`
    }
    grew.current?.(total + up + underRef.current - baseRef.current)
  }, [])
  const wake = useCallback(() => {
    const l = loop.current
    if (l.raf) return
    l.then = performance.now()
    const step = (now: number) => {
      l.raf = 0
      const dt = clamp((now - l.then) / 1000, 1 / 240, 0.05)
      l.then = now
      let moving = false
      for (const s of Object.values(sizes.current)) {
        if (s.x === s.t && s.v === 0) continue
        springStep(s, s.t, Math.abs(s.t - s.x) > LINE * 2.5 ? FAR : SIZE, dt)
        if (Math.abs(s.x - s.t) < 0.05 && Math.abs(s.v) < 1) {
          s.x = s.t
          s.v = 0
        } else moving = true
      }
      paint()
      if (moving) l.raf = requestAnimationFrame(step)
    }
    l.raf = requestAnimationFrame(step)
  }, [paint])
  const size = useCallback(
    (part: Part, to: number) => {
      const b = sizes.current[part]
      if (b.t === to) return
      b.t = to
      // The one layout: straight to the final size, and held in the same breath by its transform.
      const s = sizes.current
      if (headBox.current) headBox.current.style.height = `${s.head.t}px`
      if (filesBox.current) filesBox.current.style.height = `${s.files.t}px`
      if (wordsBox.current) wordsBox.current.style.height = `${s.words.t}px`
      if (card.current) card.current.style.height = `${FRAME + s.head.t + s.files.t + s.words.t}px`
      if (still.current || !loop.current.live) {
        b.x = to
        b.v = 0
      }
      paint()
      if (!still.current && loop.current.live) wake()
    },
    [paint, wake],
  )
  useEffect(() => {
    const l = loop.current
    return () => {
      cancelAnimationFrame(l.raf)
      l.raf = 0
    }
  }, [])

  // Past the limit the words fade on any side that has more, so text cut off reads as text that continues.
  const more = () => {
    const a = area.current
    if (!a) return
    a.style.setProperty('--fade-t', `${Math.min(18, a.scrollTop)}px`)
    a.style.setProperty('--fade-b', `${Math.min(18, Math.max(0, a.scrollHeight - a.clientHeight - a.scrollTop))}px`)
  }
  // The textarea takes its new height at once. A hidden twin does the measuring, so the real one is
  // never touched: no flash of zero height, no lost scroll.
  const fit = () => {
    const a = area.current
    const h = ghost.current
    if (!a || !h) return
    const top = LINE * MAX_LINES
    const over = a.scrollHeight > top + 2
    const b = sizes.current.words
    // The first line past the limit: the card gives a little and comes back, the answer to "why did it stop growing?"
    if (over && !limit.current && !still.current && a.clientHeight === top) {
      b.v += GIVE
      wake()
    }
    limit.current = over
    if (a.clientHeight === top && a.scrollHeight > top + LINE) {
      if (a.selectionEnd === a.value.length) a.scrollTop = a.scrollHeight
      more()
      return
    }
    h.value = a.value
    const next = clamp(h.scrollHeight, LINE * MIN_LINES, top)
    if (a.style.height !== `${next}px`) a.style.height = `${next}px`
    if (a.selectionEnd === a.value.length) a.scrollTop = a.scrollHeight
    more()
    size('words', next + GAP)
  }
  const fitRef = useRef(fit)
  useLayoutEffect(() => {
    fitRef.current = fit
  })
  useLayoutEffect(() => fitRef.current(), [text])
  useLayoutEffect(() => {
    size('head', head ? HEAD : 0)
    size('files', files.length ? SHELF : 0)
  }, [head, files.length, size])
  useLayoutEffect(() => {
    size('lift', telling && !under ? STRIP : 0)
  }, [telling, under, size])
  useLayoutEffect(() => {
    if (layer) paint()
    loop.current.live = true
  }, [layer, paint])
  useEffect(() => {
    const a = area.current
    if (!a) return
    let w = a.clientWidth
    const ro = new ResizeObserver(() => {
      if (a.clientWidth === w) return
      w = a.clientWidth
      fitRef.current()
    })
    ro.observe(a)
    void document.fonts?.ready.then(() => fitRef.current())
    return () => ro.disconnect()
  }, [])
  // The row of files fades only on a side that has more, and a new file always comes into view.
  const edges = () => {
    const r = rail.current
    if (!r) return
    r.style.setProperty('--fade-l', `${Math.min(28, r.scrollLeft)}px`)
    r.style.setProperty('--fade-r', `${Math.min(28, Math.max(0, r.scrollWidth - r.clientWidth - r.scrollLeft))}px`)
  }
  useLayoutEffect(() => {
    const r = rail.current
    if (r && files.length > count.current && r.scrollWidth > r.clientWidth) r.scrollTo({ left: r.scrollWidth, behavior: reduce ? 'auto' : 'smooth' })
    count.current = files.length
    edges()
  }, [files.length, reduce])
  useEffect(() => () => filesRef.current.forEach((f) => f.url && URL.revokeObjectURL(f.url)), [])

  const canSend = !busy && (text.trim().length > 0 || files.length > 0)
  // One suggestion, offered only when someone has come to the box: nothing moves at rest.
  const offer = !text && !busy && focused && suggestions?.length ? suggestions[0] : null

  const send = () => {
    if (!canSend) {
      // Words are waiting and an answer is coming: say so at the key that's in the way.
      if (busy && text.trim() && !reduce) sendKey.current?.animate([{ transform: 'scale(0.92)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'cubic-bezier(0.2,0.9,0.25,1)' })
      return
    }
    const message: Message = { text: text.trim(), files, mode, model, project }
    last.current = { text, files }
    setSent((n) => n + 1)
    setFailed(false)
    setText('')
    setFiles([])
    let result: unknown
    try {
      result = onSend?.(message)
    } catch (e) {
      result = Promise.reject(e)
    }
    if (!thenable(result)) return
    const id = ++run.current
    setPending(true)
    void Promise.resolve(result).then(
      () => {
        if (run.current === id) setPending(false)
      },
      () => {
        // A send that failed gives the words back. A stopped one was meant to end.
        if (run.current !== id) return
        setPending(false)
        setFailed(true)
        last.current = null
        setText((t) => t || message.text)
        setFiles((x) => (x.length ? x : message.files))
      },
    )
  }
  const latest = useRef(() => {})
  useLayoutEffect(() => {
    latest.current = send
  })
  useImperativeHandle(ref, () => ({ type: setText, attach: (list) => setFiles((f) => [...f, ...list]), mode: setMode, send: () => latest.current(), focus: () => area.current?.focus() }), [])

  const stop = () => {
    run.current++
    setPending(false)
    onStop?.()
  }
  const add = (list: FileList | File[]) => {
    const next = [...list].map(fromFile)
    if (next.length) {
      setFailed(false)
      setFiles((f) => [...f, ...next])
    }
  }
  const remove = (id: string, byKey: boolean) => {
    setFiles((f) => {
      const gone = f.find((x) => x.id === id)
      if (gone?.url) URL.revokeObjectURL(gone.url)
      return f.filter((x) => x.id !== id)
    })
    if (byKey) area.current?.focus()
  }
  // Through the browser's own editing, so Cmd+Z undoes it and the caret lands after it.
  const insert = (words: string) => {
    const el = area.current
    if (!el) return
    el.focus()
    if (document.execCommand('insertText', false, words)) return
    el.setRangeText(words, el.selectionStart, el.selectionEnd, 'end')
    setText(el.value)
  }
  const chosen = models?.find((m) => m.name === model)
  const quiet = `${ROW_TEXT} text-[var(--c-ink-2)] transition-colors duration-150 hover:text-[var(--c-ink)]`
  const plateAt = PLATE - (base - under) - (initialFiles.length ? SHELF : 0)

  return (
    <div className="@container relative" style={{ width, maxWidth: '100%', height: base, ...PROMPT_MATERIAL }}>
      {/* The tray: under the card, its corners the card's own. It tells, and with projects it files. */}
      <div
        ref={tray}
        aria-hidden={!under && !telling}
        {...(!under && !telling ? { inert: true } : {})}
        className="absolute inset-x-0 bottom-0 rounded-[var(--r)] bg-[var(--c-strip)] shadow-[inset_0_0_0_1px_var(--c-edge)] will-change-transform"
        style={{ height: STRIP + 2 * R, opacity: under ? 1 : 0, '--r': `${R}px` } as CSSProperties}
      >
        <div className="absolute inset-x-0 bottom-0 flex items-center px-[8px]" style={{ height: STRIP }}>
          <AnimatePresence initial={false} mode="popLayout">
            {failed ? (
              <Told key="failed" reduce={!!reduce}>
                <span className="flex size-[18px] shrink-0 items-center justify-center text-[var(--danger)]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden>
                    <circle cx="8" cy="8" r="6.2" />
                    <path d="M8 4.9v3.5M8 10.9v.1" />
                  </svg>
                </span>
                <span data-error role="status" className="truncate text-[var(--c-ink)]">
                  Not sent. Your message is back.
                </span>
              </Told>
            ) : busy ? (
              <Told key="busy" reduce={!!reduce}>
                <span className="flex size-[18px] shrink-0 items-center justify-center text-[var(--c-ink-2)]">{chosen?.icon ?? <Seat />}</span>
                <span role="status" className="flex min-w-0 flex-1 items-center gap-[6px]">
                  <AnimatePresence initial={false} mode="popLayout">
                    <motion.span key={status} className="truncate" initial={{ opacity: 0, y: reduce ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -4 }} transition={{ duration: 0.16, ease: ease.out }}>
                      {status}
                    </motion.span>
                  </AnimatePresence>
                  <Elapsed key={status} since={started} />
                </span>
                <Spin still={!!reduce} />
              </Told>
            ) : under ? (
              <Told key="project" reduce={!!reduce}>
                <Reach
                  label={`Project: ${project ?? 'none'}`}
                  items={[null, ...(projects ?? [])].map((n) => ({
                    id: n ?? '',
                    name: n ?? 'No project',
                    on: n === project,
                    run: () => {
                      setProject(n)
                      onProject?.(n)
                    },
                  }))}
                  open={projectMenu}
                  setOpen={setProjectMenu}
                  layer={layer}
                  className="-ml-[6px] h-[32px] min-w-0 max-w-full justify-start gap-[8px] rounded-[10px] px-[6px] text-[15px] tracking-[-0.006em] text-[var(--c-ink-2)] transition-colors duration-150 hover:text-[var(--c-ink)]"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
                    <rect x="2.75" y="2.75" width="10.5" height="10.5" rx="2.6" />
                    <path d="M5.6 6.1h4.8M5.6 8.9h2.8" />
                  </svg>
                  <span className="truncate">{project ?? 'Add to a project'}</span>
                </Reach>
              </Told>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div
        ref={hang}
        data-prompt-box
        className="absolute inset-x-0 will-change-transform"
        style={{ bottom: under, height: base - under + (initialFiles.length ? SHELF : 0), borderRadius: R }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && busy) {
            e.preventDefault()
            stop()
          }
        }}
        onDragEnter={(e) => {
          if (!e.dataTransfer.types.includes('Files')) return
          depth.current++
          setDrag(true)
        }}
        onDragLeave={(e) => {
          if (!e.dataTransfer.types.includes('Files')) return
          depth.current = Math.max(0, depth.current - 1)
          if (!depth.current) setDrag(false)
        }}
        onDragOver={(e) => e.dataTransfer.types.includes('Files') && e.preventDefault()}
        onDrop={(e) => {
          // Text dragged in is the textarea's to take.
          if (!e.dataTransfer.types.includes('Files')) return
          e.preventDefault()
          depth.current = 0
          setDrag(false)
          add(e.dataTransfer.files)
        }}
      >
        {/* The card: a plate that slides up and a fixed foot, so its size changes by transform alone. Its
            shadow is drawn from the clipped shape, so it follows the card at any height. */}
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ filter: 'drop-shadow(0 1px 1px var(--c-shadow)) drop-shadow(0 6px 14px var(--c-shadow))' }}>
          <div className="absolute inset-x-0 bottom-0 overflow-clip" style={{ height: PLATE, borderBottomLeftRadius: R, borderBottomRightRadius: R }}>
            <div ref={plate} className="absolute inset-x-0 top-0 bg-[var(--c-field)] transition-shadow duration-150 will-change-transform" style={{ height: PLATE, transform: `translate3d(0,${plateAt}px,0)`, boxShadow: edge, borderTopLeftRadius: R, borderTopRightRadius: R }} />
            <div className="absolute inset-x-0 bottom-0 h-[44px] bg-[var(--c-field)] transition-shadow duration-150" style={{ clipPath: 'inset(3px 0 0 0)', boxShadow: edge, borderBottomLeftRadius: R, borderBottomRightRadius: R }} />
          </div>
        </div>

        <div className="relative flex h-full cursor-text flex-col rounded-[inherit]" style={{ padding: `18px ${PAD}px ${PAD}px` }} onMouseDown={(e) => blank(e.target) && e.preventDefault()} onClick={(e) => blank(e.target) && area.current?.focus()}>
          {/* What rides above the keys. Its bottom edge is the keys' top. */}
          <div className="shrink-0" style={{ clipPath: 'inset(-640px -24px 0 -24px)' }}>
            <div ref={headBox} className="relative shrink-0 overflow-clip text-[13px] leading-[18px] text-[var(--c-ink-3)]" style={{ height: head ? HEAD : 0 }}>
              <span className="block truncate">{label}</span>
            </div>

            {/* Files: named, removable, nothing more. Many scroll sideways. */}
            <div ref={filesBox} className="relative shrink-0 overflow-clip" style={{ height: initialFiles.length ? SHELF : 0 }}>
              <div ref={rail} onScroll={edges} className="flex gap-[6px] overflow-x-auto [scrollbar-width:none]" style={{ maskImage: 'linear-gradient(90deg, transparent, #000 var(--fade-l, 0px), #000 calc(100% - var(--fade-r, 0px)), transparent)' }}>
                <AnimatePresence key={sent} initial={false} mode="popLayout">
                  {files.map((f) => (
                    <Chip key={f.id} file={f} onRemove={(byKey) => remove(f.id, byKey)} />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div ref={wordsBox} className="relative shrink-0" style={{ height: REST }}>
              <span aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 flex items-center gap-[8px] overflow-hidden ${TEXT} text-[var(--c-ink-3)]`} style={{ height: LINE, lineHeight: `${LINE}px`, visibility: text ? 'hidden' : 'visible' }}>
                {/* Keyed on the send: the old sentence goes at once, and the next comes in after. */}
                <motion.span key={sent} className="flex min-w-0 items-center gap-[8px]" initial={sent ? { opacity: 0 } : false} animate={{ opacity: 1, transition: { duration: 0.2, ease: ease.out, delay: 0.16 } }}>
                  <span className="truncate">{busy ? 'Add a follow-up' : (offer ?? `${placeholder}${hint ? `, ${hint}` : ''}`)}</span>
                  {offer && <span className="shrink-0 rounded-[6px] px-[6px] text-[13px] leading-[20px] tracking-normal shadow-[inset_0_0_0_1px_var(--c-edge-on)] pointer-coarse:hidden">Tab</span>}
                </motion.span>
              </span>
              <textarea ref={ghost} aria-hidden tabIndex={-1} readOnly rows={1} className={`invisible absolute inset-x-0 top-0 block h-0 w-full resize-none overflow-hidden ${TEXT} [scrollbar-gutter:stable]`} style={{ lineHeight: `${LINE}px` }} />
              <textarea
                ref={area}
                rows={MIN_LINES}
                value={text}
                dir="auto"
                enterKeyHint="enter"
                aria-label={offer ? `${placeholder}. Suggestion: ${offer}, press Tab to use it` : placeholder}
                onChange={(e) => {
                  setText(e.target.value)
                  last.current = null
                  setFailed(false)
                  setModelMenu(false)
                  setProjectMenu(false)
                }}
                onScroll={more}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && !e.shiftKey && offer) {
                    e.preventDefault()
                    insert(offer)
                  } else if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                    if (fingers() && !e.metaKey && !e.ctrlKey) return
                    e.preventDefault()
                    send()
                  } else if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !text && last.current) {
                    e.preventDefault()
                    const back = last.current
                    last.current = null
                    setText(back.text)
                    setFiles(back.files)
                  }
                }}
                onPaste={(e) => {
                  const d = e.clipboardData
                  if (!d.files.length) return
                  // A table copied from a spreadsheet arrives as text and as a picture of itself. The text is what was meant.
                  if (d.types.includes('text/html') && d.getData('text/plain').trim()) return
                  e.preventDefault()
                  add(d.files)
                }}
                className={`block w-full resize-none bg-transparent ${TEXT} text-[var(--c-ink)] caret-[var(--c-ink)] outline-none [scrollbar-gutter:stable] [scrollbar-width:none]`}
                style={{ lineHeight: `${LINE}px`, height: LINE * MIN_LINES, maskImage: 'linear-gradient(180deg, transparent, #000 var(--fade-t, 0px), #000 calc(100% - var(--fade-b, 0px)), transparent)' }}
              />
            </div>
          </div>

          <div className="flex shrink-0 cursor-default items-center gap-[8px]" style={{ height: ROW }}>
            <Key label="Attach files" onClick={() => picker.current?.click()}>
              <path d="m14.6 8.6-5.5 5.5a3.6 3.6 0 0 1-5.1-5.1l5.9-5.9a2.4 2.4 0 0 1 3.4 3.4l-5.9 5.9a1.2 1.2 0 0 1-1.7-1.7l5.4-5.4" />
            </Key>
            <input ref={picker} type="file" multiple hidden onChange={(e) => (e.target.files && add(e.target.files), (e.target.value = ''))} />
            <Modes modes={modes} mode={mode} onMode={setMode} />
            {model &&
              (models?.length ? (
                <span className="hidden shrink-0 items-center @min-[480px]:flex">
                  <Reach
                    label={`Model: ${model}`}
                    items={models.map((m) => ({
                      id: m.name,
                      name: m.name,
                      icon: m.icon,
                      on: m.name === model,
                      run: () => {
                        setModel(m.name)
                        onModel?.(m.name)
                      },
                    }))}
                    open={modelMenu}
                    setOpen={setModelMenu}
                    layer={layer}
                    className={`h-[34px] gap-[7px] rounded-full pl-[10px] pr-[12px] shadow-[inset_0_0_0_1px_var(--c-key)] hover:bg-[var(--c-hover)] ${quiet}`}
                  >
                    {chosen?.icon}
                    <span className="text-[var(--c-ink)]">{chosen?.short ?? model}</span>
                  </Reach>
                </span>
              ) : (
                <span className={`hidden shrink-0 @min-[480px]:block ${ROW_TEXT} px-[6px] text-[var(--c-ink-2)]`}>{model}</span>
              ))}
            <span className="min-w-0 flex-1" />
            <SendKey
              ref={sendKey}
              canSend={canSend}
              busy={busy}
              onVoice={onVoice}
              onSend={(byKey) => {
                send()
                // A press on an empty key still gets an answer: the caret, where the words go.
                if (byKey || !canSend) area.current?.focus()
              }}
              onStop={stop}
            />
          </div>

          <AnimatePresence>
            {drag && (
              <motion.div
                className="pointer-events-none absolute inset-0 flex items-center justify-center gap-[8px] rounded-[inherit] bg-[var(--c-field)] text-[15px] text-[var(--c-ink-2)] shadow-[inset_0_0_0_1px_var(--c-edge-on)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12, ease: ease.out }}
              >
                <Upload size={15} />
                Drop to attach
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

/**
 * Prompts to start from, for the empty state beside a PromptBox: a quiet numbered list. Press one, or
 * its number while none is focused, and `onPick` gets the prompt.
 */
export function PromptStarters({ items, onPick, width = 420 }: { items: Starter[]; onPick: (prompt: string) => void; width?: number }) {
  const held = useRef('')
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      // A digit still held after it picked is the same press, even though focus is in the box now.
      if (e.repeat && e.key === held.current) return e.preventDefault()
      held.current = ''
      if (e.repeat || (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))) return
      const n = +e.key - 1
      if (Number.isInteger(n) && n >= 0 && n < items.length && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Taken here, or the digit follows focus into the box and types itself.
        e.preventDefault()
        held.current = e.key
        onPick(items[n].prompt ?? [items[n].lead, items[n].rest].filter(Boolean).join(' '))
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [items, onPick])
  return (
    <div className="grid gap-px" style={{ width, maxWidth: '100%', ...PROMPT_MATERIAL }}>
      {items.map((s, i) => (
        <motion.button key={s.label + s.lead} type="button" {...TAP} onClick={() => onPick(s.prompt ?? [s.lead, s.rest].filter(Boolean).join(' '))} className="ring-focus flex items-baseline gap-[12px] rounded-[10px] py-[6px] text-left">
          <span className="tnum w-[12px] shrink-0 text-[13px] text-[var(--c-ink-3)] pointer-coarse:hidden">{i + 1}</span>
          <span className="text-[14px] leading-[20px]">
            <span className="text-[var(--c-ink)]">{s.lead}</span>
            {s.rest && <span className="text-[var(--c-ink-3)]"> {s.rest}</span>}
          </span>
        </motion.button>
      ))}
    </div>
  )
}

/* ───────────────────────────── Parts ───────────────────────────── */

/** The Seated D, beside the mode. */
function Seat() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="shrink-0">
      <rect x="2.5" y="3" width="6.5" height="18" rx="1.2" />
      <path d="M11 3h1a9 9 0 0 1 0 18h-1z" />
    </svg>
  )
}

/** A round key with a hairline, its corner nested in the card's. */
function Key({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <motion.button type="button" {...TAP} aria-label={label} title={label} onMouseDown={keep} onClick={onClick} className={`ring-focus relative flex shrink-0 items-center justify-center rounded-full text-[var(--c-ink-2)] shadow-[inset_0_0_0_1px_var(--c-key)] transition-colors duration-150 hover:bg-[var(--c-hover)] hover:text-[var(--c-ink)] ${HIT}`} style={{ width: ROW, height: ROW }}>
      <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
    </motion.button>
  )
}

/**
 * The modes, in a well. The chosen one is lifted out of it and says its name; the rest are their marks.
 * The well is as wide as its longest name at all times, so choosing never moves what sits beside it:
 * only the lift travels, and the segments trade widths inside. Arrow keys move it.
 */
function Modes({ modes, mode, onMode }: { modes: Mode[]; mode: string; onMode: (id: string) => void }) {
  const keys = useRef<(HTMLButtonElement | null)[]>([])
  const names = useRef<HTMLSpanElement>(null)
  // Until it's measured, a fair guess, so the first paint is already close.
  const [nameW, setNameW] = useState(() => Math.max(...modes.map((m) => m.name.length)) * 8.6)
  const at = Math.max(0, modes.findIndex((m) => m.id === mode))
  useLayoutEffect(() => {
    const n = names.current
    if (!n) return
    const read = () => setNameW(n.offsetWidth)
    read()
    const ro = new ResizeObserver(read)
    ro.observe(n)
    void document.fonts?.ready.then(read)
    return () => ro.disconnect()
  }, [modes])
  const go = (i: number) => {
    const n = (i + modes.length) % modes.length
    onMode(modes[n].id)
    keys.current[n]?.focus()
  }
  const KEY = ROW - 4
  // The chosen one: its mark, a gap, the longest name, and room each side. With names hidden, just a wider mark.
  const wide = nameW ? 10 + 16 + 6 + Math.ceil(nameW) + 12 : KEY + 12
  const widthOf = (m: Mode, on: boolean) => (on ? wide : m.icon ? KEY : wide)
  const left = 2 + modes.slice(0, at).reduce((sum, m) => sum + widthOf(m, false), 0)
  const move = 'duration-300 ease-[cubic-bezier(0.2,0.9,0.25,1)] motion-reduce:transition-none'
  return (
    <div role="radiogroup" aria-label="Mode" className="relative flex min-w-0 shrink-0 items-center rounded-full bg-[var(--c-well)] p-[2px]" style={{ height: ROW }}>
      {/* The longest name, unseen: the well's width comes from it. Hidden with the names on a narrow box. */}
      <span aria-hidden className={`pointer-events-none invisible absolute grid whitespace-nowrap @max-[380px]:hidden ${ROW_TEXT}`}>
        <span ref={names} className="col-start-1 row-start-1 grid">
          {modes.map((m) => (
            <span key={m.id} className="col-start-1 row-start-1">
              {m.name}
            </span>
          ))}
        </span>
      </span>
      <span aria-hidden className={`pointer-events-none absolute left-0 top-[2px] rounded-full bg-[var(--c-lift)] shadow-[0_0_0_1px_var(--c-rim),0_1px_2px_var(--c-shadow)] transition-transform ${move}`} style={{ width: wide, height: KEY, transform: `translate3d(${left}px,0,0)` }} />
      {modes.map((m, i) => {
        const on = i === at
        const named = on || !m.icon
        return (
          <motion.button
            key={m.id}
            ref={(n) => {
              keys.current[i] = n
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={m.name}
            title={on ? m.note : m.name}
            tabIndex={on ? 0 : -1}
            {...TAP}
            onMouseDown={keep}
            onClick={() => onMode(m.id)}
            onKeyDown={(e) => {
              const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
              if (!step) return
              e.preventDefault()
              go(i + step)
            }}
            className={`ring-focus relative flex h-full shrink-0 items-center justify-center gap-[6px] overflow-hidden whitespace-nowrap rounded-full ${ROW_TEXT} transition-[width,color] ${move} ${on ? 'text-[var(--c-ink)]' : 'text-[var(--c-ink-3)] hover:text-[var(--c-ink)]'} ${HIT}`}
            style={{ width: widthOf(m, on) }}
          >
            {m.icon && <span className="flex shrink-0">{m.icon}</span>}
            {named && <span className={`shrink-0 transition-opacity duration-200 ease-out @max-[380px]:hidden ${on || !m.icon ? 'opacity-100' : 'opacity-0'}`}>{m.name}</span>}
          </motion.button>
        )
      })}
    </div>
  )
}

/** One reading in the tray. */
function Told({ reduce, children, ref }: { reduce: boolean; children: ReactNode; ref?: Ref<HTMLDivElement> }) {
  return (
    <motion.div ref={ref} className="flex min-w-0 flex-1 items-center gap-[9px] pl-[6px] pr-[8px] text-[15px] tracking-[-0.006em] text-[var(--c-ink-2)]" initial={{ opacity: 0, y: reduce ? 0 : 4 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: ease.out, delay: 0.06 } }} exit={{ opacity: 0, transition: { duration: 0.1, ease: ease.out } }}>
      {children}
    </motion.div>
  )
}

/** A thin ring with one open arc, under the key it answers to. Held still for reduced motion. */
function Spin({ still }: { still: boolean }) {
  return (
    <span className="mr-[6px] flex size-[18px] shrink-0 items-center justify-center text-[var(--c-ink-2)]">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className={still ? '' : 'animate-spin [animation-duration:900ms]'}>
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.6" />
        <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  )
}

/** A file: its name and a way to remove it. An image shows itself. */
function Chip({ file, onRemove, ref }: { file: Attachment; onRemove: (byKey: boolean) => void; ref?: Ref<HTMLDivElement> }) {
  return (
    <motion.div ref={ref} layout="position" data-file={file.id} className="flex h-[36px] max-w-[236px] shrink-0 cursor-default items-center gap-[6px] rounded-[11px] pl-[12px] pr-[4px] text-[15px] text-[var(--c-ink)] shadow-[inset_0_0_0_1px_var(--c-edge-on)]" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: ease.out } }} exit={{ opacity: 0, y: 6, transition: { duration: 0.12, ease: ease.out } }}>
      {file.url && <span className="size-[20px] shrink-0 rounded-[5px] bg-cover bg-center" style={{ backgroundImage: `url("${file.url}")` }} />}
      <span className="min-w-0 truncate">{file.name}</span>
      <motion.button type="button" {...TAP} aria-label={`Remove ${file.name}`} onMouseDown={keep} onClick={(e) => onRemove(e.detail === 0)} className="relative flex size-[28px] shrink-0 items-center justify-center rounded-full opacity-60 outline-none before:absolute before:-inset-[8px] before:content-[''] hover:opacity-100 focus-visible:opacity-100">
        <Close size={11} strokeWidth={2.2} />
      </motion.button>
    </motion.div>
  )
}

type Item = { id: string; name: string; badge?: string; icon?: ReactNode; on?: boolean; run: () => void }

/**
 * A small menu. Press and it opens on the way down. Let go and it stays. Or slide to a row and let go,
 * one gesture instead of two clicks; let go anywhere else and nothing happened.
 */
function Reach({ items, open, setOpen, layer, className, label, children }: { items: Item[]; open: boolean; setOpen: (v: boolean) => void; layer: HTMLElement | null; className: string; label: string; children: ReactNode }) {
  const [hi, setHi] = useState(-1)
  const [place, setPlace] = useState({ left: 0, bottom: 0, ox: 24 })
  // Opened or closed from the keyboard, it's simply there or gone.
  const [byKey, setByKey] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const uid = useId()
  const reduce = useReducedMotion()
  const slide = useRef<{ x: number; y: number; moved: boolean } | null>(null)
  const opening = useRef(false)

  const show = (keyed: boolean) => {
    const b = button.current
    if (b && layer) {
      const r = b.getBoundingClientRect()
      const c = layer.getBoundingClientRect()
      const k = c.width / layer.offsetWidth || 1
      const left = clamp((r.left - c.left) / k - 4, 0, Math.max(0, layer.offsetWidth - MENU_W))
      setPlace({ left, bottom: (c.bottom - r.top) / k + 8, ox: (r.left + r.width / 2 - c.left) / k - left })
    }
    setHi(keyed ? 0 : -1)
    setByKey(keyed)
    setOpen(true)
  }
  const close = (keyed: boolean) => {
    setByKey(keyed)
    setOpen(false)
  }
  const choose = (i: number, keyed: boolean) => {
    close(keyed)
    items[i].run()
  }
  const rowAt = (x: number, y: number) => {
    const row = document.elementFromPoint(x, y)?.closest<HTMLElement>('[role^="menuitem"]')
    return row && list.current?.contains(row) ? +(row.dataset.row ?? -1) : -1
  }

  const state = useRef({ hi, n: items.length, choose, close })
  useLayoutEffect(() => {
    state.current = { hi, n: items.length, choose, close }
  })
  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      const t = e.target as Node
      if (!button.current?.contains(t) && !list.current?.contains(t)) state.current.close(false)
    }
    const keys = (e: KeyboardEvent) => {
      const { n } = state.current
      const go = (next: (i: number) => number) => {
        e.preventDefault()
        e.stopPropagation()
        setHi(next)
      }
      if (e.key === 'ArrowDown') go((i) => (i + 1) % n)
      else if (e.key === 'ArrowUp') go((i) => (Math.max(i, 0) - 1 + n) % n)
      else if (e.key === 'Home') go(() => 0)
      else if (e.key === 'End') go(() => n - 1)
      else if (e.key === 'Enter' || (e.key === ' ' && e.target === button.current)) {
        e.preventDefault()
        e.stopPropagation()
        if (state.current.hi >= 0) state.current.choose(state.current.hi, true)
        else state.current.close(true)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        state.current.close(true)
      } else if (e.key === 'Tab') state.current.close(true)
    }
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', keys, true)
    return () => {
      document.removeEventListener('pointerdown', away)
      document.removeEventListener('keydown', keys, true)
    }
  }, [open])

  return (
    <>
      <motion.button
        ref={button}
        type="button"
        {...TAP}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${uid}-list` : undefined}
        aria-activedescendant={open && hi >= 0 ? `${uid}-${hi}` : undefined}
        aria-label={label}
        onMouseDown={keep}
        onPointerDown={(e) => {
          if (e.button || open) return
          show(false)
          opening.current = true
          slide.current = { x: e.clientX, y: e.clientY, moved: false }
          e.currentTarget.setPointerCapture?.(e.pointerId)
        }}
        onPointerMove={(e) => {
          const s = slide.current
          if (!s) return
          if (!s.moved && Math.hypot(e.clientX - s.x, e.clientY - s.y) > SLOP) s.moved = true
          if (s.moved) setHi(rowAt(e.clientX, e.clientY))
        }}
        onPointerUp={(e) => {
          const s = slide.current
          slide.current = null
          if (!s?.moved) return
          const row = rowAt(e.clientX, e.clientY)
          if (row >= 0) choose(row, false)
          else close(false)
        }}
        onPointerCancel={() => {
          slide.current = null
        }}
        onClick={(e) => {
          // The press that opened it has done its work; this click is only the hand coming up.
          if (opening.current) {
            opening.current = false
            return
          }
          if (open) close(e.detail === 0)
          else show(e.detail === 0)
        }}
        onKeyDown={(e) => {
          if (!open && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            e.preventDefault()
            show(true)
          }
        }}
        className={`ring-focus relative flex shrink-0 touch-none items-center justify-center transition-colors duration-150 ${className} ${HIT}`}
      >
        {children}
      </motion.button>

      {layer &&
        createPortal(
          <AnimatePresence custom={byKey}>
            {open && (
              <motion.div
                ref={list}
                id={`${uid}-list`}
                role="menu"
                aria-label={label}
                className="absolute z-20 overflow-hidden rounded-[18px] bg-[var(--c-field)] p-[6px] shadow-[inset_0_0_0_1px_var(--c-edge-on),0_14px_32px_-14px_rgba(0,0,0,0.28)]"
                style={{ left: place.left, bottom: place.bottom, width: MENU_W, maxWidth: '100%', transformOrigin: `${place.ox}px calc(100% + 26px)` }}
                custom={byKey}
                variants={{
                  away: (keyed: boolean) => (keyed ? { opacity: 0, scale: 1, transition: { duration: 0 } } : { opacity: 0, scale: reduce ? 1 : 0.97 }),
                  here: { opacity: 1, scale: 1 },
                }}
                initial={byKey ? false : 'away'}
                animate="here"
                exit="away"
                transition={MENU}
              >
                {items.map((m, i) => (
                  <button
                    key={m.id}
                    id={`${uid}-${i}`}
                    type="button"
                    role={m.on === undefined ? 'menuitem' : 'menuitemradio'}
                    aria-checked={m.on}
                    data-row={i}
                    tabIndex={-1}
                    onPointerEnter={() => setHi(i)}
                    onPointerLeave={() => setHi(-1)}
                    onMouseDown={keep}
                    onClick={(e) => choose(i, e.detail === 0)}
                    className={`relative flex h-[40px] w-full items-center gap-[8px] rounded-[12px] px-[12px] text-left text-[16px] text-[var(--c-ink)] outline-none ${i === hi ? 'bg-[var(--c-hover)]' : ''}`}
                  >
                    {m.icon}
                    <span className="min-w-0 flex-1 truncate">
                      {m.name}
                    </span>
                    {m.badge && <span className="shrink-0 rounded-[7px] bg-[var(--c-badge)] px-[6px] text-[14px] leading-[22px] text-[var(--c-badge-ink)]">{m.badge}</span>}
                    {m.on && <Check size={14} strokeWidth={2.2} />}
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

/**
 * The one dark key. Empty, with `onVoice`, it's a voice key and shows a wave; words turn the wave into
 * Send, and Send into Stop while it answers: the shaft widens into the square and the head folds away,
 * and back from wherever it got to. Never `disabled`: that would drop keyboard focus onto the page the
 * moment the words left.
 */
function SendKey({ canSend, busy, onSend, onStop, onVoice, ref }: { canSend: boolean; busy: boolean; onSend: (byKey: boolean) => void; onStop: () => void; onVoice?: () => void; ref?: Ref<HTMLButtonElement> }) {
  const voice = !!onVoice && !canSend && !busy
  const lit = canSend || busy || voice
  const armed = useRef(0)
  useLayoutEffect(() => {
    if (busy) armed.current = performance.now() + ARMS
  }, [busy])
  const glyph = 'transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.2,0.9,0.25,1)] motion-reduce:transition-none'
  const arrow = !voice
  return (
    <motion.button
      ref={ref}
      type="button"
      {...(lit ? TAP : {})}
      aria-disabled={!lit}
      aria-label={busy ? 'Stop' : voice ? 'Speak' : 'Send'}
      onMouseDown={keep}
      onPointerDown={() => lit && tap()}
      onClick={(e) => {
        if (voice) return onVoice?.()
        if (!busy) return onSend(e.detail === 0)
        if (performance.now() >= armed.current) onStop()
      }}
      className={`ring-focus relative flex shrink-0 items-center justify-center rounded-full transition-[background-color,color,box-shadow] duration-150 aria-disabled:cursor-default ${lit ? 'bg-[var(--c-send)] text-[var(--c-send-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_2px_var(--c-shadow)]' : 'bg-[var(--c-well)] text-[var(--c-ink-3)]'} ${HIT}`}
      style={{ width: ROW, height: ROW, backgroundImage: lit ? 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.1))' : undefined }}
    >
      <span aria-hidden className="relative block size-[16px]">
        {/* The wave: five bars, the middle tallest, that fold into the shaft as words arrive. */}
        <span className={`absolute inset-0 flex items-center justify-center gap-[2px] ${glyph}`} style={{ opacity: voice ? 1 : 0, transform: voice ? 'none' : 'scale(0.4, 0.6)' }}>
          {[5, 9, 13, 9, 5].map((h, i) => (
            <span key={i} className="block w-[1.6px] rounded-full bg-current" style={{ height: h }} />
          ))}
        </span>
        <span className={`absolute left-[3px] top-[3px] size-[10px] rounded-[2.5px] bg-current ${glyph}`} style={{ opacity: arrow ? 1 : 0, transform: busy ? 'scale(0.85)' : 'translateY(0.25px) scale(0.17, 1)' }} />
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={`absolute inset-0 ${glyph}`} style={{ opacity: arrow && !busy ? 1 : 0, transform: busy ? 'translateY(3px) scale(0.6)' : voice ? 'translateY(2px) scale(0.7)' : 'scale(0.85)', transformOrigin: '8px 3.4px' }}>
          <path d="M3.9 7.5 8 3.4l4.1 4.1" />
        </svg>
      </span>
    </motion.button>
  )
}

/** Real seconds, from the first second on. After a stretch with no new status it says so. Mounts with each status, so the quiet count starts again. */
function Elapsed({ since }: { since: { current: number } }) {
  const [t, setT] = useState({ s: 0, quiet: 0 })
  useEffect(() => {
    const born = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      const s = Math.floor((now - since.current) / 1000)
      const quiet = Math.floor((now - born) / 1000)
      setT((o) => (o.s === s && o.quiet === quiet ? o : { s, quiet }))
    }, 250)
    return () => clearInterval(id)
  }, [since])
  return (
    <span className="tnum shrink-0" style={{ opacity: t.s ? 1 : 0, transition: 'opacity 150ms' }}>
      {t.s}s{t.quiet >= STALL ? ', still waiting' : ''}
    </span>
  )
}
