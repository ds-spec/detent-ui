'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CodeInput } from '../components/code/CodeInput'
import type { CodeHandle } from '../components/code/CodeInput'
import { PROMPT_MATERIAL, PromptBox } from '../components/prompt/PromptBox'
import type { Attachment, Message, Model, PromptHandle } from '../components/prompt/PromptBox'
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
const logo = (d: string, fill: string, name: string, box = '0 0 24 24') => (
  <svg width="16" height="16" viewBox={box} fill={fill} role="img" aria-label={name} className="shrink-0">
    <path d={d} />
  </svg>
)
const CLAUDE = logo(
  'm4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z',
  '#D97757',
  'Claude',
)
const OPENAI = logo('M9.94494 9.59163V8.13227C9.94494 8.00935 9.99105 7.91713 10.0985 7.85575L13.0327 6.16599C13.4321 5.93558 13.9083 5.8281 14.3998 5.8281C16.2432 5.8281 17.4108 7.25677 17.4108 8.77751C17.4108 8.885 17.4108 9.00792 17.3953 9.13083L14.3537 7.34884C14.1694 7.24135 13.985 7.24135 13.8007 7.34884L9.94494 9.59163ZM16.7963 15.2755V11.7883C16.7963 11.5732 16.704 11.4196 16.5197 11.3121L12.664 9.0693L13.9236 8.34725C14.0311 8.28587 14.1234 8.28587 14.2308 8.34725L17.165 10.037C18.0099 10.5287 18.5782 11.5732 18.5782 12.587C18.5782 13.7544 17.887 14.8298 16.7963 15.2753V15.2755ZM9.03861 12.2031L7.77896 11.4658C7.67146 11.4045 7.62535 11.3122 7.62535 11.1893V7.8098C7.62535 6.16613 8.88501 4.92176 10.5902 4.92176C11.2354 4.92176 11.8344 5.13689 12.3415 5.52089L9.31526 7.27218C9.13097 7.37968 9.03875 7.53328 9.03875 7.74841V12.2033L9.03861 12.2031ZM11.75 13.77L9.94494 12.7562V10.6056L11.75 9.59178L13.5549 10.6056V12.7562L11.75 13.77ZM12.9098 18.44C12.2645 18.44 11.6655 18.2249 11.1585 17.8409L14.1847 16.0896C14.369 15.9821 14.4612 15.8285 14.4612 15.6134V11.1585L15.7363 11.8958C15.8438 11.9572 15.8899 12.0494 15.8899 12.1723V15.5519C15.8899 17.1955 14.6148 18.44 12.9098 18.44ZM9.26901 15.0144L6.33486 13.3246C5.4899 12.833 4.92161 11.7885 4.92161 10.7746C4.92161 9.59177 5.62824 8.53183 6.71886 8.0863V11.5887C6.71886 11.8039 6.81109 11.9575 6.99538 12.065L10.8359 14.2923L9.57621 15.0144C9.46872 15.0758 9.37649 15.0758 9.26901 15.0144ZM9.10013 17.5337C7.36426 17.5337 6.08919 16.2279 6.08919 14.6149C6.08919 14.492 6.1046 14.3691 6.11988 14.2462L9.1461 15.9975C9.33039 16.105 9.51483 16.105 9.69912 15.9975L13.5549 13.7702V15.2295C13.5549 15.3524 13.5088 15.4446 13.4013 15.506L10.4671 17.1958C10.0677 17.4262 9.59148 17.5337 9.09999 17.5337H9.10013ZM12.9098 19.3616C14.7685 19.3616 16.32 18.0406 16.6735 16.2893C18.3939 15.8438 19.5 14.2308 19.5 12.5872C19.5 11.5118 19.0391 10.4673 18.2096 9.71454C18.2864 9.39192 18.3326 9.0693 18.3326 8.74682C18.3326 6.55014 16.5505 4.90634 14.4921 4.90634C14.0774 4.90634 13.6779 4.96772 13.2785 5.10605C12.5872 4.43011 11.6347 4 10.5902 4C8.7314 4 7.17996 5.32103 6.8265 7.07232C5.10605 7.51786 4 9.13083 4 10.7745C4 11.8498 4.4608 12.8944 5.29035 13.6471C5.21354 13.9697 5.16743 14.2923 5.16743 14.6148C5.16743 16.8114 6.94941 18.4552 9.00792 18.4552C9.42261 18.4552 9.82204 18.3939 10.2215 18.2556C10.9127 18.9315 11.8651 19.3616 12.9098 19.3616Z', 'currentColor', 'OpenAI', '3.75 3.68 16 16')
const GEMINI = logo('M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81', '#8E75B2', 'Gemini')
const MODELS: Model[] = [
  { name: 'Claude Sonnet 4.5', short: 'Sonnet 4.5', icon: CLAUDE },
  { name: 'Claude Opus 4.5', short: 'Opus 4.5', icon: CLAUDE },
  { name: 'GPT-5', icon: OPENAI },
  { name: 'Gemini 2.5 Pro', icon: GEMINI },
]
const PROJECTS = ['Q3 board update', 'Acme renewal', 'Hiring plan']
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
      className="flex h-[500px] w-[640px] max-w-full flex-col items-center justify-center overflow-hidden rounded-[28px] bg-[var(--c-ground)] px-5 shadow-border max-sm:px-3"
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
        <PromptBox ref={box} width={600} onGrow={onGrow} model="Claude Sonnet 4.5" models={MODELS} projects={PROJECTS} status="Reading the board update" onVoice={() => b.log('onVoice')} onSend={(m) => (b.log('onSend', m), onSend(m))} onStop={() => (b.log('onStop'), onStop())} suggestions={SUGGEST} initialFiles={[BOARD]} placeholder={b.get('placeholder', 'Ask anything')} />
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
