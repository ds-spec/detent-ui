'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, MotionConfig, animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { ArrowCounterClockwise, ArrowRight, ArrowUpRight, CaretDown, Check, GasPump, WarningCircle, X } from '@phosphor-icons/react'
import { siEthereum, siSolana, siTether } from 'simple-icons'
import { IRIS } from '@/lab/lib/iris'

export type Token = { sym: string; name: string; path: string; tint: string; price: number; wallet: number; vault: number; step: number; dp: number; fee: string; explorer: string; reserve?: number }
export type Result = 'ok' | 'declined' | 'failed'
type Mode = 'deposit' | 'withdraw'
type Phase = 'idle' | 'connecting' | 'sign' | 'chain' | 'done' | 'declined' | 'failed'

export const TOKENS: Token[] = [
  { sym: 'SOL', name: 'Solana', path: siSolana.path, tint: '#9945FF', price: 187.42, wallet: 12, vault: 5.12, step: 0.01, dp: 2, fee: '0.000005 SOL', explorer: 'Solscan', reserve: 0.01 },
  { sym: 'ETH', name: 'Ethereum', path: siEthereum.path, tint: '#627EEA', price: 3412.8, wallet: 1.84, vault: 0.42, step: 0.001, dp: 3, fee: '≈ $0.62', explorer: 'Etherscan', reserve: 0.005 },
  { sym: 'USDT', name: 'Tether', path: siTether.path, tint: '#26A17B', price: 1, wallet: 2480, vault: 650, step: 1, dp: 0, fee: '≈ $0.41', explorer: 'Etherscan' },
]

const ease = [0.2, 0.9, 0.25, 1] as const
const FOCUS = 'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]'

const fmt = (n: number, dp: number) => n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })
const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function Elapsed() {
  const [ms, setMs] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const id = window.setInterval(() => setMs(performance.now() - start), 100)
    return () => window.clearInterval(id)
  }, [])
  return <span className="tabular-nums">{(ms / 1000).toFixed(1)}s</span>
}

function Coin({ t, size = 20 }: { t: Token; size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-full shadow-[inset_0_1px_0_rgb(255_255_255/.25),0_0_0_0.5px_rgb(0_0_0/.1)]" style={{ width: size, height: size, background: t.tint }}>
      <svg viewBox="0 0 24 24" aria-hidden style={{ width: size * 0.56, height: size * 0.56 }} fill="#fff">
        <path d={t.path} />
      </svg>
    </span>
  )
}

export function Vault({
  tokens = TOKENS,
  wallet = '7xKX…9fQa',
  walletName = 'Phantom',
  connected = false,
  apy = 6.2,
  onSubmit,
}: {
  tokens?: Token[]
  wallet?: string
  walletName?: string
  connected?: boolean
  apy?: number
  onSubmit?: (p: { mode: Mode; token: string; amount: number }) => Promise<Result> | Result
}) {
  const reduce = useReducedMotion()
  const [list, setList] = useState(tokens)
  const [ti, setTi] = useState(0)
  const [mode, setMode] = useState<Mode>('deposit')
  const [menu, setMenu] = useState(false)
  const [linked, setLinked] = useState(connected)
  const [before, setBefore] = useState<Token[] | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const t = (phase === 'done' && before ? before : list)[ti]
  const half = (cap: number, tok: Token) => Math.floor(cap / 2 / tok.step) * tok.step
  const cap = (m: Mode, tok: Token) => (m === 'deposit' ? Math.max(0, Math.floor((tok.wallet - (tok.reserve ?? 0)) / tok.step) * tok.step) : tok.vault)
  const nice = (m: Mode, tok: Token) => Math.min(cap(m, tok), half(m === 'deposit' ? tok.wallet : tok.vault, tok))
  const [amount, setAmount] = useState(nice('deposit', t))
  const [draft, setDraft] = useState<string | null>(null)
  const [tx, setTx] = useState('')
  const [tick, setTick] = useState(0)
  const track = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLInputElement>(null)
  const group = useId()
  const num = useMotionValue(amount)
  const dp = useMotionValue(t.dp)
  const text = useTransform([num, dp], ([v, d]) => fmt(v as number, d as number))

  const min = t.step
  const max = cap(mode, t)
  const stops = [
    { label: '25%', value: Math.min(max, Math.floor(((mode === 'deposit' ? t.wallet : t.vault) * 0.25) / t.step) * t.step) },
    { label: 'Half', value: nice(mode, t) },
    { label: 'Max', value: max },
  ]
  const over = amount > max + 1e-9
  const ok = linked && amount >= min && !over && phase === 'idle'
  const after = mode === 'deposit' ? t.vault + amount : t.vault - amount
  const k = Math.max(0, Math.min(1, (Math.min(amount, max) - min) / Math.max(t.step, max - min)))

  useEffect(() => {
    dp.set(t.dp)
  }, [t.dp, dp])

  useEffect(() => {
    if (draft !== null || reduce) {
      num.set(amount)
      return
    }
    const c = animate(num, amount, { duration: 0.32, ease })
    return () => c.stop()
  }, [amount, draft, reduce, num])

  const clamp = (v: number) => Math.max(min, Math.min(max, Math.round(v / t.step) * t.step))

  const set = (v: number, snap = true) => {
    let next = v
    if (snap) {
      const hit = stops.find((s) => Math.abs(s.value - v) <= (max - min) * 0.035)
      if (hit) {
        next = hit.value
        if (Math.abs(hit.value - amount) > 1e-9) setTick((n) => n + 1)
      }
    }
    setAmount(clamp(next))
    setDraft(null)
  }

  const fromPointer = (x: number) => {
    const r = track.current?.getBoundingClientRect()
    if (!r) return
    set(min + (max - min) * Math.max(0, Math.min(1, (x - r.left) / r.width)))
  }

  const reset = (m: Mode, i: number, l = list) => {
    const tok = l[i]
    setAmount(nice(m, tok))
    setDraft(null)
    if (phase === 'done') {
      setPhase('idle')
      setBefore(null)
    }
  }

  const submit = async () => {
    if (!ok && phase !== 'declined' && phase !== 'failed') return
    setPhase('sign')
    const [res] = await Promise.all([Promise.resolve(onSubmit?.({ mode, token: t.sym, amount }) ?? 'ok'), new Promise((r) => setTimeout(r, 1200))])
    if (res === 'declined') {
      setPhase('declined')
      return
    }
    setPhase('chain')
    await new Promise((r) => setTimeout(r, 1600))
    if (res === 'failed') {
      setPhase('failed')
      return
    }
    const sign = mode === 'deposit' ? 1 : -1
    setBefore(list)
    setList((l) => l.map((x, i) => (i === ti ? { ...x, vault: +(x.vault + sign * amount).toFixed(6), wallet: +(x.wallet - sign * amount).toFixed(6) } : x)))
    setTx(`${Math.random().toString(36).slice(2, 6)}…${Math.random().toString(36).slice(2, 6)}`)
    setPhase('done')
  }

  const finish = () => {
    reset(mode, ti)
  }

  const act = async () => {
    if (!linked) {
      setPhase('connecting')
      await new Promise((r) => setTimeout(r, 900))
      setLinked(true)
      setPhase('idle')
      return
    }
    if (phase === 'done') return finish()
    await submit()
  }

  const busy = phase === 'sign' || phase === 'chain' || phase === 'connecting'
  const flow = phase === 'sign' || phase === 'chain' || phase === 'done' || phase === 'declined' || phase === 'failed'
  const verb = mode === 'deposit' ? 'Deposit' : 'Withdraw'
  const shownAmt = `${fmt(Math.min(amount, max), t.dp)} ${t.sym}`
  const label = !linked
    ? phase === 'connecting'
      ? 'Connecting…'
      : `Connect ${walletName}`
    : phase === 'sign'
      ? `Confirm in ${walletName}`
      : phase === 'chain'
        ? 'Confirming on-chain'
        : phase === 'done'
          ? 'Done'
          : phase === 'declined'
            ? 'Try again'
            : phase === 'failed'
              ? 'Retry'
              : over
                ? `Not enough ${t.sym}`
                : amount < min
                  ? 'Enter an amount'
                  : `${verb} ${shownAmt}`
  const actionable = !busy && (!linked || phase === 'done' || phase === 'declined' || phase === 'failed' || ok)
  const dim = linked && phase === 'idle' && !ok
  const atMax = Math.abs(amount - max) < 1e-9 && mode === 'deposit' && (t.reserve ?? 0) > 0
  const hint = !linked
    ? `Connect to deposit from your ${walletName} wallet`
    : phase === 'done'
      ? `Vault now ${fmt(list[ti].vault, t.dp)} ${t.sym}`
      : atMax
        ? `Max keeps ${t.reserve} ${t.sym} for network fees`
        : mode === 'deposit'
          ? `≈ +${fmt((Math.min(amount, max) * apy) / 100, t.dp)} ${t.sym} a year at ${apy}% APY`
          : 'Arrives in your wallet in seconds'

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup id={group}>
        <div style={IRIS} className="w-[380px] h-fit max-w-full self-start rounded-[26px] bg-[var(--i-tray)] p-1.5 shadow-[0_0_0_0.5px_var(--i-edge),0_28px_64px_-28px_var(--i-drop)]">
          <div role="tablist" aria-label="Action" className="grid grid-cols-2 gap-1 p-1">
            {(['deposit', 'withdraw'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                disabled={busy}
                onClick={() => {
                  if (m === mode) return
                  setMode(m)
                  reset(m, ti)
                }}
                className={`relative h-9 rounded-[13px] text-[13px] font-medium capitalize transition-colors duration-150 ${mode === m ? 'text-[var(--i-t1)]' : 'text-[var(--i-t3)] hover:text-[var(--i-t2)]'} ${FOCUS}`}
              >
                {mode === m && <motion.span layoutId="mode" className="absolute inset-0 rounded-[13px] bg-[var(--i-sheet)] shadow-[0_0_0_0.5px_var(--i-edge),0_1px_2px_var(--i-drop)]" transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }} />}
                <span className="relative">{m}</span>
              </button>
            ))}
          </div>

          <div className="relative mt-1 rounded-[20px] bg-[var(--i-sheet)] px-5 pb-5 pt-4 shadow-[0_0_0_0.5px_var(--i-edge),0_1px_2px_var(--i-drop)]">
            <div className="flex items-center justify-between">
              <div className="relative">
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={menu}
                  disabled={busy}
                  onClick={() => setMenu((v) => !v)}
                  onKeyDown={(e) => e.key === 'Escape' && setMenu(false)}
                  className={`flex h-8 items-center gap-1.5 rounded-full bg-[var(--i-tray)] pl-1 pr-2.5 text-[13px] font-medium text-[var(--i-t1)] shadow-[inset_0_0_0_0.5px_var(--i-edge)] transition-transform duration-150 active:scale-[.96] ${FOCUS}`}
                >
                  <Coin t={t} size={24} />
                  {t.sym}
                  <CaretDown aria-hidden size={11} weight="bold" className="text-[var(--i-t3)]" />
                </button>
                <AnimatePresence>
                  {menu && (
                    <motion.ul
                      role="listbox"
                      aria-label="Token"
                      initial={{ opacity: 0, scale: 0.96, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.1 } }}
                      transition={{ duration: 0.18, ease }}
                      style={{ transformOrigin: 'top left' }}
                      className="absolute left-0 top-10 z-20 w-[220px] rounded-[16px] bg-[var(--i-sheet)] p-1 shadow-[0_0_0_0.5px_var(--i-edge),0_12px_32px_-8px_var(--i-drop)]"
                    >
                      {list.map((x, i) => (
                        <li key={x.sym}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={i === ti}
                            onClick={() => {
                              setTi(i)
                              setMenu(false)
                              reset(mode, i)
                            }}
                            className={`flex w-full items-center gap-2.5 rounded-[12px] px-2 py-2 text-left hover:bg-[var(--i-hover)] ${FOCUS}`}
                          >
                            <Coin t={x} size={28} />
                            <span className="min-w-0 flex-1 leading-tight">
                              <span className="block text-[13px] font-medium text-[var(--i-t1)]">{x.sym}</span>
                              <span className="block text-[11.5px] text-[var(--i-t3)]">{x.name}</span>
                            </span>
                            <span className="text-right text-[12px] tabular-nums leading-tight text-[var(--i-t2)]">
                              {fmt(x.wallet, x.dp)}
                              <span className="block text-[11px] text-[var(--i-t3)]">{usd(x.wallet * x.price)}</span>
                            </span>
                            {i === ti && <Check aria-hidden size={13} weight="bold" className="text-[var(--accent)]" />}
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
              <span className="text-[12px] tabular-nums text-[var(--i-t3)]">
                {linked ? `${mode === 'deposit' ? 'Wallet' : 'In vault'} ${fmt(mode === 'deposit' ? t.wallet : t.vault, t.dp)} ${t.sym}` : 'Wallet not connected'}
              </span>
            </div>

            <div className={`mt-6 flex h-[56px] items-baseline justify-center gap-2 text-[48px] font-medium leading-none tracking-[-0.04em] tabular-nums transition-colors duration-200 ${over ? 'text-[#d0702a]' : 'text-[var(--i-t1)]'}`}>
              {draft === null ? (
                <motion.button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setDraft(String(amount))
                    window.setTimeout(() => field.current?.select(), 0)
                  }}
                  aria-label={`Amount ${fmt(amount, t.dp)} ${t.sym}. Click to type.`}
                  className={`rounded-[10px] ${FOCUS}`}
                >
                  {text}
                </motion.button>
              ) : (
                <input
                  ref={field}
                  autoFocus
                  inputMode="decimal"
                  value={draft}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^\d.]/g, '').slice(0, 9)
                    setDraft(clean)
                    const n = Number(clean)
                    if (!Number.isNaN(n)) setAmount(n)
                  }}
                  onBlur={() => {
                    setDraft(null)
                    if (amount < min) setAmount(min)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') field.current?.blur()
                  }}
                  style={{ width: `${Math.max(1, draft.length) * 0.6}em` }}
                  aria-label={`Amount in ${t.sym}`}
                  className="min-w-[1ch] bg-transparent text-center outline-none caret-[var(--accent)]"
                />
              )}
              <span className="text-[22px] font-medium tracking-[-0.01em] text-[var(--i-t3)]">{t.sym}</span>
            </div>
            <p className="mt-1.5 text-center text-[13px] tabular-nums text-[var(--i-t3)]">≈ {usd(Math.min(amount, max) * t.price)}</p>

            <div className="mt-5">
              <div
                ref={track}
                role="slider"
                tabIndex={0}
                aria-label={`Amount in ${t.sym}`}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={Math.min(amount, max)}
                aria-valuetext={`${fmt(amount, t.dp)} ${t.sym}`}
                onPointerDown={(e) => {
                  if (busy) return
                  e.currentTarget.setPointerCapture(e.pointerId)
                  fromPointer(e.clientX)
                }}
                onPointerMove={(e) => {
                  if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e.clientX)
                }}
                onKeyDown={(e) => {
                  const big = (max - min) / 10
                  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') set(amount + t.step, false)
                  else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') set(amount - t.step, false)
                  else if (e.key === 'PageUp') set(amount + big, false)
                  else if (e.key === 'PageDown') set(amount - big, false)
                  else if (e.key === 'Home') set(min, false)
                  else if (e.key === 'End') set(max, false)
                  else return
                  e.preventDefault()
                }}
                className={`relative h-8 touch-none select-none rounded-full ${FOCUS}`}
              >
                <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[var(--i-tray)] shadow-[inset_0_0_0_0.5px_var(--i-edge)]" />
                <motion.span className="absolute left-0 top-1/2 h-1.5 w-full origin-left -translate-y-1/2 rounded-full" style={{ background: over ? '#e08a3a' : `linear-gradient(90deg, color-mix(in oklab, ${t.tint} 70%, white), ${t.tint})` }} animate={{ scaleX: k }} transition={{ type: 'spring', stiffness: 520, damping: 42 }} />
                {stops.map((s) => {
                  const p = (s.value - min) / Math.max(t.step, max - min)
                  return <span key={s.label} aria-hidden className={`absolute top-1/2 h-3 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full ${p <= k ? 'bg-white/75' : 'bg-[var(--i-t3)]/50'}`} style={{ left: `${p * 100}%` }} />
                })}
                <motion.span
                  key={tick}
                  aria-hidden
                  className="absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_0.5px_rgb(0_0_0/.12),0_2px_6px_rgb(0_0_0/.18)]"
                  initial={{ left: `${k * 100}%`, scale: tick ? 1.2 : 1 }}
                  animate={{ left: `${k * 100}%`, scale: 1 }}
                  transition={{ left: { type: 'spring', stiffness: 520, damping: 42 }, scale: { type: 'spring', bounce: 0.5, duration: 0.3 } }}
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {stops.map((s) => {
                  const on = Math.abs(amount - s.value) < 1e-9
                  return (
                    <button
                      key={s.label}
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setAmount(s.value)
                        setTick((n) => n + 1)
                        setDraft(null)
                      }}
                      className={`flex h-10 flex-col items-center justify-center rounded-[12px] leading-tight transition-[transform,background-color,box-shadow] duration-150 active:scale-[.96] ${on ? 'bg-[var(--i-tray)] shadow-[inset_0_0_0_1px_var(--i-edge)]' : 'hover:bg-[var(--i-hover)]'} ${FOCUS}`}
                    >
                      <span className="text-[12px] font-medium text-[var(--i-t1)]">{s.label}</span>
                      <span className="text-[11px] tabular-nums text-[var(--i-t3)]">{fmt(s.value, t.dp)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="relative h-[60px] px-3.5 pt-3 text-[12.5px]">
            <AnimatePresence mode="popLayout" initial={false}>
              {flow ? (
                <motion.div key={`s-${phase}`} className="flex items-center gap-3" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease }} aria-live="polite">
                  <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-[var(--i-sheet)] shadow-[0_0_0_0.5px_var(--i-edge),0_1px_2px_var(--i-drop)]">
                    {phase === 'done' ? (
                      <motion.span initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, duration: 0.4 }} className="grid size-5 place-items-center rounded-full bg-[var(--i-ok)] text-white">
                        <Check aria-hidden size={11} weight="bold" />
                      </motion.span>
                    ) : phase === 'declined' || phase === 'failed' ? (
                      <span className="grid size-5 place-items-center rounded-full bg-[#e5484d] text-white">
                        <X aria-hidden size={11} weight="bold" />
                      </span>
                    ) : (
                      <Coin t={t} size={22} />
                    )}
                    {busy && <motion.span aria-hidden className="pointer-events-none absolute inset-0 rounded-full border-[1.5px] border-transparent border-t-[var(--i-t1)]" animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />}
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className={`block truncate text-[13px] font-medium ${phase === 'declined' || phase === 'failed' ? 'text-[#e5484d]' : 'text-[var(--i-t1)]'}`}>
                      {phase === 'sign' && 'Waiting for your signature'}
                      {phase === 'chain' && `Confirming on ${t.name}`}
                      {phase === 'done' && `${mode === 'deposit' ? 'Deposited' : 'Withdrew'} ${fmt(amount, t.dp)} ${t.sym}`}
                      {phase === 'declined' && 'Request declined'}
                      {phase === 'failed' && 'Transaction failed'}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-[var(--i-t3)]">
                      {phase === 'sign' && `Approve it in ${walletName}`}
                      {phase === 'chain' && (
                        <>
                          Usually a few seconds · <Elapsed />
                        </>
                      )}
                      {phase === 'done' && (
                        <a href="#" onClick={(e) => e.preventDefault()} className={`inline-flex items-center gap-1 font-mono hover:text-[var(--i-t1)] ${FOCUS}`}>
                          {tx} on {t.explorer}
                          <ArrowUpRight aria-hidden size={11} />
                        </a>
                      )}
                      {phase === 'declined' && 'Nothing was sent from your wallet'}
                      {phase === 'failed' && `Your ${t.sym} never left your wallet`}
                    </span>
                  </span>
                </motion.div>
              ) : (
                <motion.dl key="info" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease }}>
                  <div className="flex h-6 items-center justify-between">
                    <dt className="text-[var(--i-t2)]">Vault balance</dt>
                    <dd className="flex items-center gap-1.5 tabular-nums">
                      {!linked ? (
                        <span className="text-[var(--i-t3)]">Connect to see</span>
                      ) : over ? (
                        <span className="flex items-center gap-1 text-[#d0702a]">
                          <WarningCircle aria-hidden size={13} weight="fill" />
                          Only {fmt(max, t.dp)} {t.sym} {mode === 'deposit' ? 'available' : 'in vault'}
                        </span>
                      ) : (
                        <>
                          <span className="text-[var(--i-t3)]">{fmt(t.vault, t.dp)}</span>
                          <ArrowRight aria-hidden size={11} className="text-[var(--i-t3)]" />
                          <span className="font-medium text-[var(--i-t1)]">
                            {fmt(Math.max(0, after), t.dp)} {t.sym}
                          </span>
                        </>
                      )}
                    </dd>
                  </div>
                  <div className="flex h-6 items-center justify-between">
                    <dt className="flex items-center gap-1.5 text-[var(--i-t2)]">
                      {linked ? (
                        <>
                          <span className="size-1.5 rounded-full bg-[var(--i-ok)] shadow-[0_0_0_3px_color-mix(in_oklab,var(--i-ok)_18%,transparent)]" />
                          <span className="font-mono text-[12px] text-[var(--i-t1)]">{wallet}</span>
                          <button type="button" onClick={() => setLinked(false)} className={`rounded-full px-1 text-[11.5px] text-[var(--i-t3)] hover:text-[var(--i-t1)] ${FOCUS}`}>
                            Disconnect
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="size-1.5 rounded-full bg-[var(--i-t3)]" />
                          No wallet connected
                        </>
                      )}
                    </dt>
                    <dd className="flex items-center gap-1 text-[var(--i-t3)]">
                      <GasPump aria-hidden size={13} />
                      {t.fee}
                    </dd>
                  </div>
                </motion.dl>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            disabled={!actionable}
            onClick={() => void act()}
            className={`relative mt-1 h-12 w-full overflow-hidden rounded-[20px] text-[14px] font-medium transition-[transform,opacity,background-color] duration-200 active:scale-[.985] disabled:active:scale-100 ${phase === 'done' ? 'bg-[var(--i-ok)] text-white' : 'bg-[var(--i-ink)] text-[var(--i-ink-on)]'} ${dim ? 'opacity-40' : ''} ${FOCUS}`}
          >
            {phase === 'chain' && <motion.span aria-hidden className="absolute inset-y-0 left-0 w-full origin-left bg-white/15" initial={{ scaleX: 0.05 }} animate={{ scaleX: 0.92 }} transition={{ duration: 2.2, ease: [0.1, 0.6, 0.3, 1] }} />}
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={label} className="relative flex items-center justify-center gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, ease }}>
                {(phase === 'sign' || phase === 'connecting') && <motion.span aria-hidden className="size-3.5 rounded-full border-[1.5px] border-current border-r-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} />}
                {phase === 'done' && <Check aria-hidden size={15} weight="bold" />}
                {(phase === 'declined' || phase === 'failed') && <ArrowCounterClockwise aria-hidden size={14} weight="bold" />}
                {label}
              </motion.span>
            </AnimatePresence>
          </button>
          <div className="flex h-7 items-center justify-center text-[11.5px] text-[var(--i-t3)]">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={hint} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="tabular-nums">
                {hint}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </LayoutGroup>
    </MotionConfig>
  )
}
