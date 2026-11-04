'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CodeInput } from '../components/code/CodeInput'
import type { CodeHandle } from '../components/code/CodeInput'
import { PROMPT_MATERIAL, PromptBox } from '../components/prompt/PromptBox'
import { MODELS } from '../components/prompt/models'
import type { Attachment, Message, PromptHandle } from '../components/prompt/PromptBox'
import { Mail } from '../icons'
import { springStep } from '../lib/detent'
import { ease, press } from '../lib/motion'
import { useBench } from './bench'
import { hover, pressed } from '@/lab/lib/hand'
import { useAway } from './loop'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/* ───────────────────────────── Verification code ───────────────────────────── */

/** Gets the code wrong once (it shakes and clears from the end), then right (it fuses into Verified), and starts over. Hovering pauses; touching hands it over. */
export function CodeDemo() {
  const b = useBench()
  const [run, setRun] = useState(0)
  const [verified, setVerified] = useState(false)
  const code = useRef<CodeHandle>(null)
  const held = useRef(false)
  const touched = useRef(false)

  useEffect(() => {
    let live = true
    const tick = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await tick(100)
    }
    const write = async (digits: string) => {
      for (let i = 1; i <= digits.length; i++) {
        code.current?.type(digits.slice(0, i))
        await beat(i === 4 ? 340 : 150 + Math.random() * 120)
      }
    }
    const play = async () => {
      for (;;) {
        await beat(1500)
        await write('424224')
        await beat(2600)
        await write('424242')
        await beat(3600)
        setVerified(false)
        setRun((n) => n + 1)
        await beat(600)
      }
    }
    play().catch(() => {})
    return () => {
      live = false
    }
  }, [])

  return (
    <div className="w-[360px] max-w-full" {...hover(held)} {...pressed(() => (touched.current = true))} onKeyDownCapture={() => (touched.current = true)}>
      <span className="flex size-11 items-center justify-center rounded-[14px] bg-surface text-ink-2 shadow-raised">
        <Mail size={19} />
      </span>
      <h2 className="mt-5 text-title text-ink">Check your email</h2>
      <p className="mb-6 mt-1.5 text-callout leading-[22px] text-ink-3">
        Enter the code we sent to <span className="text-ink">maya@northwind.co</span>
      </p>
      <CodeInput
        key={run}
        ref={code}
        onVerify={b.on('onVerify', async (c: string) => {
          await wait(1100)
          return c === '424242'
        })}
        onVerified={b.on('onVerified', () => setVerified(true))}
        onResend={b.on('onResend')}
        resendAfter={b.get('resendAfter', 30)}
      />
      <div className="relative mt-5 h-8">
        <AnimatePresence initial={false}>
          {verified && (
            <motion.button
              key="again"
              whileTap={press}
              onClick={() => {
                setVerified(false)
                setRun((n) => n + 1)
              }}
              className="ring-focus absolute left-0 top-0 h-8 rounded-full bg-surface-2 px-3.5 text-footnote font-medium text-ink-2 transition-colors hover:text-ink"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.6 } }}
              exit={{ opacity: 0 }}
            >
              Start over
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ───────────────────────────── Prompt box ───────────────────────────── */

const REPLY: Record<string, string> = {
  quick: 'Lead with the 18%, give churn one line, and end on the hiring ask.',
  think: 'Revenue grew 18%. Churn rose in September, and the fix ships next week. Hiring is the one decision the board needs to make.',
  research: 'Most teams your size open with one headline metric and move the detail to an appendix. I found five good examples.',
}

const SUGGEST = ['Summarize the board update', 'What changed since Q2?', 'Draft the hiring ask']
/** Real marks, as the makers publish them: Claude and Gemini via simple-icons, OpenAI from developers.openai.com. */
const BOARD = { id: 'sample', name: 'Q3 board update.pdf', size: 1_153_434, type: 'application/pdf' }

/** The demo writes its own prompts: a mode, a few words typed with a human rhythm, then Send. */
const SCRIPT = [
  { mode: 'think', text: 'Summarize this in three lines' },
  { mode: 'research', text: 'How do other teams open theirs?' },
  { mode: 'quick', text: 'Shorter, please' },
]

type Turn = { id: number; q: string; files: Attachment[]; a: string | null; stopped?: boolean }

/**
 * The thread hangs from the box, so a longer answer lifts it. It lays out once and glides there from
 * where it was, by transform, instead of jumping.
 */
function useGlide(key: unknown) {
  const el = useRef<HTMLDivElement>(null)
  const last = useRef(0)
  const body = useRef({ x: 0, v: 0 })
  useLayoutEffect(() => {
    const n = el.current
    if (!n) return
    const h = n.offsetHeight
    const by = h - last.current
    const first = last.current === 0
    last.current = h
    if (first || !by || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const b = body.current
    b.x += by
    let then = performance.now()
    let raf = requestAnimationFrame(function step(now) {
      const dt = Math.min(0.05, Math.max(1 / 240, (now - then) / 1000))
      then = now
      springStep(b, 0, { w: (2 * Math.PI) / 0.32, z: 1 }, dt)
      if (Math.abs(b.x) < 0.05 && Math.abs(b.v) < 1) b.x = b.v = 0
      n.style.transform = b.x ? `translate3d(0,${b.x}px,0)` : ''
      if (b.x) raf = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(raf)
  }, [key])
  return el
}

/** Types, sends, waits for the answer, and goes again. Hovering pauses it; touching it hands it over. */
export function PromptDemo() {
  const b = useBench()
  const [turn, setTurn] = useState<Turn | null>(null)
  const pending = useRef<{ t: number; done: () => void } | null>(null)
  const box = useRef<PromptHandle>(null)
  const held = useRef(false)
  const touched = useRef(false)
  const stage = useRef<HTMLDivElement>(null)
  const room = useRef<HTMLDivElement>(null)
  const title = useRef<HTMLDivElement>(null)
  const thread = useGlide(`${turn?.id}-${!!turn?.a}-${!!turn?.stopped}`)
  useAway(held, stage)

  // Whatever sits above the box makes room by transform, so nothing lays out as it grows.
  const onGrow = (by: number) => {
    const y = `translate3d(0,${-by}px,0)`
    if (room.current) room.current.style.transform = y
    if (title.current) title.current.style.transform = y
  }

  const onSend = (m: Message) =>
    new Promise<void>((done) => {
      const id = Date.now()
      setTurn({ id, q: m.text, files: m.files, a: null })
      const t = window.setTimeout(() => {
        setTurn((x) => (x?.id === id ? { ...x, a: REPLY[m.mode] ?? REPLY.think } : x))
        pending.current = null
        done()
      }, 2400)
      pending.current = { t, done }
    })

  const onStop = () => {
    if (pending.current) {
      clearTimeout(pending.current.t)
      pending.current.done()
      pending.current = null
    }
    setTurn((x) => (x ? { ...x, stopped: true } : x))
  }

  useEffect(() => {
    let live = true
    const tick = (ms: number) => new Promise<void>((r, x) => setTimeout(() => (live && !touched.current ? r() : x(new Error('stopped'))), ms))
    const beat = async (ms: number) => {
      for (let t = 0; t < ms || held.current; t += 100) await tick(100)
    }
    const play = async () => {
      for (let n = 0; ; n++) {
        const s = SCRIPT[n % SCRIPT.length]
        if (n > 0 && n % SCRIPT.length === 0) {
          setTurn(null)
          box.current?.attach([{ ...BOARD, id: `board-${n}` }])
        }
        await beat(n % SCRIPT.length === 0 ? 2600 : 1200)
        box.current?.mode(s.mode)
        await beat(600)
        let typed = ''
        for (const ch of s.text) {
          typed += ch
          box.current?.type(typed)
          await beat(ch === ' ' ? 70 : 28 + Math.random() * 46)
        }
        await beat(650)
        box.current?.send()
        await beat(2400 + 2800)
      }
    }
    play().catch(() => {})
    return () => {
      live = false
    }
  }, [])

  return (
    <div
      ref={stage}
      className="flex h-[540px] w-[640px] max-w-full flex-col items-center justify-end overflow-hidden rounded-[28px] bg-[var(--c-ground)] px-5 pb-8 shadow-border max-sm:px-3"
      style={PROMPT_MATERIAL}
      {...hover(held)}
      {...pressed(() => (touched.current = true))}
      onKeyDownCapture={() => (touched.current = true)}
    >
      <div className="relative w-[600px] max-w-full">
        {/* The name, and once there's a conversation, the thread in its place. The box never moves for either. */}
        <div ref={title} className={`mb-[34px] flex items-center justify-center gap-3 text-[var(--c-ink)] transition-opacity duration-200 ${turn ? 'opacity-0' : ''}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <rect x="2.5" y="3" width="6.5" height="18" rx="1.2" />
            <path d="M11 3h1a9 9 0 0 1 0 18h-1z" />
          </svg>
          <span className="text-[23px] leading-8 tracking-[-0.016em]">Detent</span>
        </div>
        <div ref={room} className="absolute inset-x-0 bottom-[222px]">
          <div ref={thread}>
            <AnimatePresence mode="popLayout" initial={false}>
              {turn && (
                <motion.div key={turn.id} className="text-[16px] leading-6 text-[var(--c-ink)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14, ease: ease.out }}>
                  {turn.files.length > 0 && (
                    <div className="mb-2 ml-auto flex w-fit max-w-[82%] flex-wrap justify-end gap-1.5">
                      {turn.files.map((f) => (
                        <span key={f.id} className="flex h-9 items-center rounded-[11px] bg-[var(--c-field)] px-3 text-[15px] shadow-[inset_0_0_0_1px_var(--c-edge)]">
                          {f.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {turn.q && <div className="ml-auto w-fit max-w-[82%] whitespace-pre-wrap break-words rounded-[20px] bg-[var(--c-field)] px-4 py-2.5 shadow-[inset_0_0_0_1px_var(--c-edge)]">{turn.q}</div>}
                  <div className="mt-5 min-h-12">{turn.stopped ? <p className="text-[var(--c-ink-2)]">Stopped. Ask again whenever you like.</p> : turn.a ? <Stream text={turn.a} /> : null}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <PromptBox ref={box} width={600} onGrow={onGrow} model="Claude Sonnet 4.5" models={MODELS} status="Reading the board update" onSend={(m) => (b.log('onSend', m), onSend(m))} onStop={() => (b.log('onStop'), onStop())} suggestions={SUGGEST} initialFiles={[BOARD]} placeholder={b.get('placeholder', 'Ask anything')} />
      </div>
    </div>
  )
}

/** An answer arriving a word at a time, each word landing where it will stay. */
function Stream({ text }: { text: string }) {
  const words = text.split(' ')
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (shown >= words.length) return
    const t = setTimeout(() => setShown((n) => n + 1), 42)
    return () => clearTimeout(t)
  }, [shown, words.length])
  return (
    <p>
      {words.map((w, i) => (
        <span key={i} style={{ opacity: i < shown ? 1 : 0, transition: 'opacity 320ms cubic-bezier(0.2,0.9,0.25,1)' }}>
          {i > 0 && ' '}
          {w}
        </span>
      ))}
    </p>
  )
}
