'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CodeInput } from '../components/code/CodeInput'
import type { CodeHandle } from '../components/code/CodeInput'
import { PromptBox, PromptStarters } from '../components/prompt/PromptBox'
import type { Attachment, Message, PromptHandle, Starter } from '../components/prompt/PromptBox'
import { Mail, Orbit } from '../icons'
import { ease, press } from '../lib/motion'
import { useBench } from './bench'

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
    <div className="w-[360px] max-w-full" onPointerEnter={() => (held.current = true)} onPointerLeave={() => (held.current = false)} onPointerDownCapture={() => (touched.current = true)} onKeyDownCapture={() => (touched.current = true)}>
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
const STARTERS: Starter[] = [
  { label: 'Draft', lead: 'A note to Acme', rest: 'on the late invoices.' },
  { label: 'Find', lead: 'Refunds over $500', rest: 'since the 1st.' },
  { label: 'Explain', lead: 'Why burn rose', rest: 'in October.' },
]
const BOARD = { id: 'sample', name: 'Q3 board update.pdf', size: 1_153_434, type: 'application/pdf' }

/** The demo writes its own prompts: a mode, a few words typed with a human rhythm, then Send. */
const SCRIPT = [
  { mode: 'think', text: 'Summarize this in three lines' },
  { mode: 'research', text: 'How do other teams open theirs?' },
  { mode: 'quick', text: 'Shorter, please' },
]

type Turn = { id: number; q: string; files: Attachment[]; a: string | null; stopped?: boolean }

/** Types, sends, waits for the answer, and goes again. Hovering pauses it; touching it hands it over. */
export function PromptDemo() {
  const b = useBench()
  const [turn, setTurn] = useState<Turn | null>(null)
  // How far the box has grown above its rest, so the thread can make room for it.
  const [grown, setGrown] = useState(0)
  const pending = useRef<{ t: number; done: () => void } | null>(null)
  const box = useRef<PromptHandle>(null)
  const held = useRef(false)
  const touched = useRef(false)

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
      className="flex h-[500px] w-[540px] max-w-full flex-col overflow-hidden rounded-[28px] bg-card shadow-border"
      onPointerEnter={() => (held.current = true)}
      onPointerLeave={() => (held.current = false)}
      onPointerDownCapture={() => (touched.current = true)}
      onKeyDownCapture={() => (touched.current = true)}
    >
      {/* The host: a chat that names itself once there's something to name it after. */}
      <div className="flex h-12 shrink-0 items-center justify-between px-5">
        <span className="grid text-footnote font-medium">
          <span className={`col-start-1 row-start-1 transition-opacity duration-300 ${turn ? 'opacity-0' : 'text-ink-3'}`}>New chat</span>
          <span className={`col-start-1 row-start-1 text-ink transition-opacity duration-300 ${turn ? '' : 'opacity-0'}`}>Q3 board update</span>
        </span>
        <span className="flex items-center gap-1.5 text-caption text-ink-3">
          <span className="size-1.5 rounded-full bg-[var(--ok)]" />
          Detent Pro
        </span>
      </div>
      {/* Attachments sit in the box, so the thread only needs a little room; anything taller floats over it. */}
      <div className="relative flex flex-1 flex-col justify-end px-6" style={{ paddingBottom: 20 + grown }}>
        <AnimatePresence mode="popLayout" initial={false}>
          {turn ? (
            <motion.div key={turn.id} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
              {/* What was sent with it: the files as small cards above the words, as they sat in the box. */}
              {turn.files.length > 0 && (
                <motion.div className="mb-1.5 ml-auto flex w-fit max-w-[82%] flex-wrap justify-end gap-1.5" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: ease.out, delay: 0.08 }}>
                  {turn.files.map((f) => (
                    <span key={f.id} className="flex h-9 max-w-[200px] items-center gap-2 rounded-[11px] bg-surface pl-1 pr-2.5" style={{ boxShadow: 'var(--elev-raised)' }}>
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-surface-2 bg-cover bg-center font-mono text-[8.5px] text-ink-2" style={f.url ? { backgroundImage: `url("${f.url}")` } : undefined}>
                        {!f.url && (f.name.split('.').pop() ?? '').slice(0, 4).toUpperCase()}
                      </span>
                      <span className="truncate text-footnote text-ink">{f.name}</span>
                    </span>
                  ))}
                </motion.div>
              )}
              {turn.q && (
                <motion.div
                  className="ml-auto w-fit max-w-[82%] rounded-[18px] rounded-br-[6px] bg-surface px-3.5 py-2 text-callout leading-[21px] text-ink"
                  style={{ boxShadow: 'var(--elev-raised)' }}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: ease.out, delay: 0.12 }}
                >
                  {turn.q}
                </motion.div>
              )}
              {/* The reply: who's answering, thinking while it works, then the answer a word at a time. */}
              <div className="mt-4 flex min-h-[88px] gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface text-[var(--accent)]" style={{ boxShadow: 'var(--elev-raised)' }}>
                  <Orbit size={14} />
                </span>
                <div className="relative min-w-0 flex-1 pt-1 text-callout leading-[22px]">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={turn.stopped ? 'stopped' : turn.a ? 'answer' : 'thinking'}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: { duration: 0.3, ease: ease.out, delay: turn.a || turn.stopped ? 0 : 0.35 } }}
                      exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    >
                      {turn.stopped ? <p className="text-ink-3">Stopped. Ask again whenever you like.</p> : turn.a ? <Stream text={turn.a} /> : <p className="ai-text">Reading the board update</p>}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" className="-mx-3 pb-1" exit={{ opacity: 0, transition: { duration: 0.15 } }}>
              <PromptStarters width={516} items={STARTERS} onPick={(t) => (b.log('onPick', t), box.current?.type(t))} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="shrink-0 px-3 pb-3">
        <PromptBox ref={box} width={516} onGrow={setGrown} label={turn ? undefined : 'New chat'} hint="or drop a file to start from it." model="Sonnet 4.5" status="Reading the board update" onVoice={() => b.log('onVoice')} onSend={(m) => (b.log('onSend', m), onSend(m))} onStop={() => (b.log('onStop'), onStop())} suggestions={SUGGEST} initialFiles={[BOARD]} placeholder={b.get('placeholder', 'Ask anything')} />
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
    <p className="text-ink">
      {words.map((w, i) => (
        <span key={i} className={i < shown ? 'word-in' : 'invisible'}>
          {i > 0 && ' '}
          {w}
        </span>
      ))}
    </p>
  )
}
