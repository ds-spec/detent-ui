'use client'

import { memo, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { ArrowUpRight } from '@/lab/icons'
import { useSite } from '@/site/Providers'
import { Face } from '@/site/VoiceRail'
import { VOICES, byline, source } from '@/site/quotes'
import type { Voice } from '@/site/quotes'

type Cap = { id: string; w?: number; a?: string; b?: string; mod?: string; sym?: string; side?: 'l' | 'r'; kind?: 'fn' | 'touch' | 'caps' | 'globe' }

const line = (v: Voice) => v.short ?? v.text
const PERSON = Object.fromEntries(VOICES.map((v) => [v.key, v])) as Record<string, Voice>

const ease = [0.2, 0.9, 0.25, 1] as const
const MIN = 17
const MAX = 44

const VARS = {
  '--deck': 'light-dark(rgb(0 0 0 / .03), rgb(255 255 255 / .035))',
  '--deck-edge': 'light-dark(rgb(0 0 0 / .08), rgb(255 255 255 / .08))',
  '--deck-hi': 'light-dark(rgb(255 255 255 / .9), rgb(255 255 255 / .07))',
  '--deck-drop': 'light-dark(rgb(0 0 0 / .12), rgb(0 0 0 / .6))',
  '--key': 'light-dark(#ffffff, #2a2a2e)',
  '--key-down': 'light-dark(#f3f3f2, #222226)',
  '--key-hi': 'light-dark(rgb(255 255 255 / 1), rgb(255 255 255 / .1))',
  '--key-edge': 'light-dark(rgb(0 0 0 / .11), rgb(255 255 255 / .09))',
  '--key-shade': 'light-dark(rgb(0 0 0 / .08), rgb(0 0 0 / .55))',
  '--key-lo': 'light-dark(rgb(0 0 0 / .08), rgb(255 255 255 / .1))',
  '--key-ink': 'light-dark(rgb(24 24 27 / .72), rgb(245 245 247 / .8))',
  '--key-ink-2': 'light-dark(rgb(24 24 27 / .42), rgb(245 245 247 / .46))',
  '--key-lit': 'light-dark(#18181b, #ffffff)',
  '--key-glow': 'light-dark(rgb(255 255 255 / 0), rgb(255 255 255 / .5))',
  '--bloom': 'light-dark(rgb(255 255 255 / 0), rgb(255 255 255 / .07))',
  '--ghost': 'light-dark(rgb(24 24 27 / .13), rgb(245 245 247 / .13))',
  '--h1': 'light-dark(rgb(255 140 70 / .8), rgb(255 150 90 / .85))',
  '--h2': 'light-dark(rgb(240 90 150 / .65), rgb(242 110 160 / .75))',
  '--h3': 'light-dark(rgb(140 105 255 / .65), rgb(150 120 255 / .78))',
  '--h4': 'light-dark(rgb(80 120 255 / .8), rgb(100 140 255 / .88))',
} as CSSProperties

const HALO = 'linear-gradient(100deg, var(--h1), var(--h2) 24%, var(--h3) 46%, var(--h4) 66%)'
const FADE_X = 'linear-gradient(to right, color-mix(in oklab, var(--bg) 0%, transparent), color-mix(in oklab, var(--bg) 22%, transparent) 25%, color-mix(in oklab, var(--bg) 52%, transparent) 50%, color-mix(in oklab, var(--bg) 84%, transparent) 70%, var(--bg) calc(100% - 64px))'
const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
const FADE_Y = 'linear-gradient(to bottom, color-mix(in oklab, var(--bg) 0%, transparent), color-mix(in oklab, var(--bg) 18%, transparent) 30%, color-mix(in oklab, var(--bg) 42%, transparent) calc(100% - 64px), color-mix(in oklab, var(--bg) 20%, transparent) calc(100% - 32px), color-mix(in oklab, var(--bg) 0%, transparent) 100%)'
const RISE = 'linear-gradient(to top, #000 0%, rgb(0 0 0 / .55) 45%, rgb(0 0 0 / .12) 100%)'
const RING: CSSProperties = {
  background: HALO,
  maskImage: 'linear-gradient(#000 0 0), linear-gradient(#000 0 0)',
  WebkitMaskImage: 'linear-gradient(#000 0 0), linear-gradient(#000 0 0)',
  maskClip: 'content-box, border-box',
  WebkitMaskClip: 'content-box, border-box',
  maskComposite: 'exclude',
  WebkitMaskComposite: 'xor',
}

function Plate({ energy, onPointerDown, onClick, children }: { energy: MotionValue<number>; onPointerDown: (e: ReactPointerEvent) => void; onClick: (e: ReactMouseEvent) => void; children: ReactNode }) {
  const line = useTransform(energy, [0, 1], [0.7, 1])
  const soft = useTransform(energy, [0, 1], [0.32, 0.75])
  return (
    <div data-plate="" className="@container relative" style={FULL_P}>
      <div
        role="group"
        aria-label="Keyboard. Each key with a face plays what that person said."
        onPointerDown={onPointerDown}
        onClick={onClick}
        className="relative touch-manipulation rounded-[calc(var(--p)*.42)] bg-[var(--deck)] p-[calc(var(--p)*.3)] shadow-[inset_0_1px_0_var(--deck-hi),0_0_0_0.5px_var(--deck-edge),0_28px_56px_-30px_var(--deck-drop)]"
      >
        <span aria-hidden className="pointer-events-none absolute -inset-px rounded-[calc(var(--p)*.42+1px)]" style={{ maskImage: RISE, WebkitMaskImage: RISE }}>
          <motion.span className="absolute -inset-[2px] rounded-[inherit] blur-[6px]" style={{ opacity: soft }}>
            <span className="absolute inset-0 rounded-[inherit] p-[2px]" style={RING} />
          </motion.span>
          <motion.span className="absolute inset-0 rounded-[inherit] p-px" style={{ ...RING, opacity: line }} />
        </span>
        <div className="relative">{children}</div>
      </div>
      <span aria-hidden className="pointer-events-none absolute -bottom-20 -right-6 -top-1 w-[calc(min(360px,42%)+24px)]" style={{ background: FADE_X }}>
        <span className="absolute inset-0 opacity-[.045] mix-blend-overlay" style={{ backgroundImage: NOISE, maskImage: 'linear-gradient(to right, transparent, #000 30%, #000 70%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, #000 30%, #000 70%, transparent)' }} />
      </span>
      <span aria-hidden className="pointer-events-none absolute -bottom-16 -left-6 -right-6 h-[200px]" style={{ background: FADE_Y }} />
    </div>
  )
}

const FULL_P = { '--p': 'min(58px, calc(100cqw / 15.2))', '--g': 'calc(var(--p) * .12)', '--face': '.46' } as CSSProperties

const two = (pairs: string) => pairs.split(' ').map((p) => ({ id: p[1], a: p[0], b: p[1] }))
const letters = (s: string) => [...s].map((c) => ({ id: c, a: c.toUpperCase() }))

const FN: Cap[] = [{ id: 'esc', w: 1.5, a: 'esc', side: 'l', kind: 'fn' }, ...Array.from({ length: 12 }, (_, i) => ({ id: `f${i + 1}`, a: `F${i + 1}`, kind: 'fn' as const })), { id: 'touch', kind: 'touch' }]
const FULL: Cap[][] = [
  [...two('~` !1 @2 #3 $4 %5 ^6 &7 *8 (9 )0 _- +='), { id: 'delete', w: 1.5, mod: 'delete', side: 'r' }],
  [{ id: 'tab', w: 1.5, mod: 'tab', side: 'l' }, ...letters('qwertyuiop'), ...two('{[ }] |\\')],
  [{ id: 'caps', w: 1.8, mod: 'caps lock', side: 'l', kind: 'caps' }, ...letters('asdfghjkl'), ...two(':; "\''), { id: 'return', w: 1.7, mod: 'return', side: 'r' }],
  [{ id: 'shift-l', w: 2.3, mod: 'shift', side: 'l' }, ...letters('zxcvbnm'), ...two('<, >. ?/'), { id: 'shift-r', w: 2.2, mod: 'shift', side: 'r' }],
  [
    { id: 'fn', mod: 'fn', side: 'l', kind: 'globe' },
    { id: 'ctrl', mod: 'control', sym: '⌃', side: 'r' },
    { id: 'alt-l', mod: 'option', sym: '⌥', side: 'r' },
    { id: 'cmd-l', w: 1.25, mod: 'command', sym: '⌘', side: 'r' },
    { id: 'space', w: 5 },
    { id: 'cmd-r', w: 1.25, mod: 'command', sym: '⌘', side: 'l' },
    { id: 'alt-r', mod: 'option', sym: '⌥', side: 'l' },
  ],
]

const SHIFTED: Record<string, string> = { '!': '1', '@': '2', '#': '3', $: '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0', _: '-', '+': '=', '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/', '~': '`', '“': "'", '”': "'" }
const PLAIN: Record<string, string> = { ' ': 'space', '’': "'", '‘': "'", '\n': 'return', '—': '-', '–': '-', '…': '.' }

function stroke(ch: string) {
  if (/[a-z0-9]/.test(ch)) return { id: ch, shift: false }
  if (/[A-Z]/.test(ch)) return { id: ch.toLowerCase(), shift: true }
  if (PLAIN[ch]) return { id: PLAIN[ch], shift: false }
  if (SHIFTED[ch]) return { id: SHIFTED[ch], shift: true }
  if ("`-=[]\\;',./".includes(ch)) return { id: ch, shift: false }
  return null
}

const CODES: Record<string, string> = {
  Space: 'space', Backspace: 'delete', Enter: 'return', Tab: 'tab', CapsLock: 'caps', Escape: 'esc', ShiftLeft: 'shift-l', ShiftRight: 'shift-r', AltLeft: 'alt-l', AltRight: 'alt-r', MetaLeft: 'cmd-l', MetaRight: 'cmd-r', ControlLeft: 'ctrl', Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/',
}
const codeToKey = (code: string) => CODES[code] ?? (code.startsWith('Key') ? code.slice(3).toLowerCase() : code.startsWith('Digit') ? code.slice(5) : /^F\d+$/.test(code) ? code.toLowerCase() : null)

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const quiet = () => () => {}
const canHighlight = () => typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight !== 'undefined'

const type = (size: number): CSSProperties => {
  const t = Math.min(1, Math.max(0, (size - MIN) / (MAX - MIN)))
  return { fontSize: size, lineHeight: `${(1.32 - t * 0.14).toFixed(3)}`, letterSpacing: `${(-0.018 - t * 0.022).toFixed(4)}em` }
}

function fit(probe: HTMLElement, width: number, height: number) {
  probe.style.width = `${width}px`
  return Object.fromEntries(
    VOICES.map((p) => {
      probe.textContent = `${line(p)}|`
      let lo = MIN
      let hi = MAX
      while (hi - lo > 0.25) {
        const mid = (lo + hi) / 2
        const t = type(mid)
        probe.style.fontSize = `${mid}px`
        probe.style.lineHeight = String(t.lineHeight)
        probe.style.letterSpacing = String(t.letterSpacing)
        if (probe.scrollHeight <= height) lo = mid
        else hi = mid
      }
      return [p.id, Math.floor(lo * 2) / 2]
    }),
  ) as Record<string, number>
}

const KEY =
  'relative flex shrink-0 select-none items-center justify-center rounded-[calc(var(--p)*.12)] bg-[var(--key)] text-[var(--key-ink)] shadow-[inset_0_1px_0_var(--key-hi),0_0_0_0.5px_var(--key-edge),0_1px_0_var(--key-shade)] transition-[translate,box-shadow,color,text-shadow,background-color] duration-[280ms] [transition-timing-function:cubic-bezier(.2,.9,.25,1)] data-[down]:translate-y-[0.5px] data-[down]:bg-[var(--key-down)] data-[down]:text-[var(--key-lit)] data-[down]:shadow-[inset_0_1px_0_var(--key-hi),0_0_0_0.5px_var(--key-edge),0_0_0_var(--key-shade),0_0_7px_var(--bloom)] data-[down]:[text-shadow:0_0_6px_var(--key-glow)] data-[down]:duration-[45ms] motion-reduce:transition-none'

const ICON = 'size-[calc(var(--p)*.17)]'
const draw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
const solid = { fill: 'currentColor' } as const

const rays = (r1: number, r2: number) =>
  Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4
    return `M${12 + Math.cos(a) * r1} ${12 + Math.sin(a) * r1}L${12 + Math.cos(a) * r2} ${12 + Math.sin(a) * r2}`
  }).join('')

const FN_ICONS: ReactNode[] = [
  <svg key="1" viewBox="0 0 24 24" className={ICON} {...draw}>
    <circle cx="12" cy="12" r="3" />
    <path d={rays(5.5, 7.5)} />
  </svg>,
  <svg key="2" viewBox="0 0 24 24" className={ICON} {...draw}>
    <circle cx="12" cy="12" r="4" />
    <path d={rays(6.5, 10)} />
  </svg>,
  <svg key="3" viewBox="0 0 24 24" className={ICON} {...draw}>
    <rect x="3" y="4" width="8" height="6" rx="1.2" />
    <rect x="13" y="4" width="8" height="6" rx="1.2" />
    <rect x="6" y="13" width="12" height="7" rx="1.2" />
  </svg>,
  <svg key="4" viewBox="0 0 24 24" className={ICON} {...draw}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="m15 15 5 5" />
  </svg>,
  <svg key="5" viewBox="0 0 24 24" className={ICON} {...draw}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
  </svg>,
  <svg key="6" viewBox="0 0 24 24" className={ICON} {...draw}>
    <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z" />
  </svg>,
  <svg key="7" viewBox="0 0 24 24" className={ICON} {...solid}>
    <path d="M11.5 6v12L3 12Zm9 0v12L12 12Z" />
  </svg>,
  <svg key="8" viewBox="0 0 24 24" className={ICON} {...solid}>
    <path d="M3 6v12l8.5-6ZM14 6h2.4v12H14Zm4.6 0H21v12h-2.4Z" />
  </svg>,
  <svg key="9" viewBox="0 0 24 24" className={ICON} {...solid}>
    <path d="M3 6v12l8.5-6Zm9 0v12l8.5-6Z" />
  </svg>,
  <svg key="10" viewBox="0 0 24 24" className={ICON}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" fill="currentColor" />
  </svg>,
  <svg key="11" viewBox="0 0 24 24" className={ICON}>
    <path d="M3 9.5h3.5L11 5.5v13l-4.5-4H3Z" fill="currentColor" />
    <path d="M14.5 9.5a3.5 3.5 0 0 1 0 5" {...draw} />
  </svg>,
  <svg key="12" viewBox="0 0 24 24" className={ICON}>
    <path d="M2 9.5h3.5L10 5.5v13l-4.5-4H2Z" fill="currentColor" />
    <path d="M13.5 9.5a3.5 3.5 0 0 1 0 5M16.5 7a7 7 0 0 1 0 10" {...draw} />
  </svg>,
]

const Key = memo(function Key({ cap, h, on, dim }: { cap: Cap; h: number; on: boolean; dim: boolean }) {
  const p = PERSON[cap.id]
  const size = { width: `calc(var(--p) * ${cap.w ?? 1} - var(--g))`, height: `calc(var(--p) * ${h} - var(--g))` } as CSSProperties
  if (p)
    return (
      <button
        type="button"
        data-k={cap.id}
        data-person=""
        aria-label={`${p.name}, ${byline(p)}`}
        aria-pressed={on}
        style={size}
        className={`${KEY} group/key outline-none before:absolute before:-inset-[calc(var(--g)/2)] before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]`}
      >
        <span className={`absolute left-[calc(var(--p)*.12)] top-[calc(var(--p)*.1)] text-[calc(var(--p)*.15)] leading-none transition-colors duration-300 ${on ? 'text-[var(--key-lit)]' : 'text-[var(--key-ink-2)]'}`}>{cap.a}</span>
        <span className={`absolute right-[calc(var(--p)*.12)] top-[calc(var(--p)*.12)] size-[calc(var(--p)*.06)] rounded-full transition-[background-color,box-shadow] duration-300 ${on ? 'bg-[#30d158] shadow-[0_0_3px_rgb(48_209_88/.9),0_0_7px_rgb(48_209_88/.45)]' : 'bg-[var(--key-lo)]'}`} />
        <span className={`mt-[calc(var(--p)*.17)] block size-[calc(var(--p)*var(--face))] overflow-hidden rounded-full shadow-[0_0_0_1.5px_var(--key),0_0_0_2px_var(--key-edge)] transition-[opacity,filter] duration-300 ${dim ? 'opacity-55 saturate-[.3]' : ''}`}>
          <Face v={p} ring={false} className="size-full" />
        </span>
        <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-ink px-[7px] py-[3px] text-[11.5px] leading-[15px] text-surface opacity-0 transition-opacity duration-150 [@media(hover:hover)]:group-hover/key:opacity-100 [@media(hover:hover)]:group-hover/key:delay-200">
          {p.name}
        </span>
      </button>
    )
  const legend = 'text-[calc(var(--p)*.14)] leading-none text-[var(--key-ink-2)]'
  const fn = cap.kind === 'fn' && cap.id !== 'esc' ? Number(cap.id.slice(1)) : 0
  return (
    <span aria-hidden data-k={cap.id} style={size} className={KEY}>
      {cap.kind === 'touch' ? (
        <span className="size-[calc(var(--p)*.38)] rounded-full bg-[radial-gradient(circle_at_50%_30%,var(--key-2),var(--key))] shadow-[inset_0_0_0_1px_var(--key-edge),inset_0_1px_2px_var(--key-lo),0_0.5px_0_var(--key-hi)]" />
      ) : fn ? (
        <span className="flex flex-col items-center gap-[calc(var(--p)*.04)] text-[var(--key-ink-2)]">
          {FN_ICONS[fn - 1]}
          <span className="text-[calc(var(--p)*.09)] leading-none">F{fn}</span>
        </span>
      ) : cap.kind === 'fn' ? (
        <span className={`absolute bottom-[calc(var(--p)*.08)] left-[calc(var(--p)*.12)] ${legend}`}>{cap.a}</span>
      ) : cap.mod ? (
        <>
          {cap.kind === 'caps' && <span className="absolute left-[calc(var(--p)*.12)] top-[calc(var(--p)*.12)] size-[calc(var(--p)*.065)] rounded-full bg-[var(--key-lo)] shadow-[inset_0_0.5px_0_var(--key-edge)]" />}
          {cap.sym && <span className={`absolute top-[calc(var(--p)*.11)] ${legend} ${cap.side === 'l' ? 'left-[calc(var(--p)*.12)]' : 'right-[calc(var(--p)*.12)]'}`}>{cap.sym}</span>}
          {cap.kind === 'globe' && (
            <svg aria-hidden className="absolute bottom-[calc(var(--p)*.1)] right-[calc(var(--p)*.12)] size-[calc(var(--p)*.19)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3Z" />
            </svg>
          )}
          <span className={`${cap.side ? 'absolute bottom-[calc(var(--p)*.1)]' : ''} ${legend} ${cap.side === 'l' ? 'left-[calc(var(--p)*.12)]' : cap.side === 'r' ? 'right-[calc(var(--p)*.12)]' : ''}`}>{cap.mod}</span>
        </>
      ) : cap.b ? (
        <span className="flex flex-col items-center gap-[calc(var(--p)*.07)] text-[calc(var(--p)*.16)] leading-none text-[var(--key-ink-2)]">
          <span>{cap.a}</span>
          <span>{cap.b}</span>
        </span>
      ) : (
        <span className="text-[calc(var(--p)*.21)] leading-none">{cap.a}</span>
      )}
    </span>
  )
})

function Arrows() {
  const half = { width: 'calc(var(--p) - var(--g))', height: 'calc(var(--p) * .5 - var(--g) / 2)' }
  const tri = (d: string) => (
    <svg aria-hidden viewBox="0 0 10 10" className="size-[calc(var(--p)*.11)] text-[var(--key-ink-2)]" fill="currentColor">
      <path d={d} />
    </svg>
  )
  return (
    <span aria-hidden className="flex items-end gap-[var(--g)]">
      <span data-k="left" style={half} className={KEY}>
        {tri('M2 5 8 1v8Z')}
      </span>
      <span className="flex flex-col gap-[var(--g)]">
        <span data-k="up" style={half} className={KEY}>
          {tri('M5 2 9 8H1Z')}
        </span>
        <span data-k="down" style={half} className={KEY}>
          {tri('M5 8 1 2h8Z')}
        </span>
      </span>
      <span data-k="right" style={half} className={KEY}>
        {tri('M8 5 2 9V1Z')}
      </span>
    </span>
  )
}

function Row({ caps, h, who }: { caps: Cap[]; h: number; who: string | null }) {
  return caps.map((c) => {
    const p = PERSON[c.id]
    const on = !!who && p?.id === who
    return <Key key={c.id} cap={c} h={h} on={on} dim={!!who && !!p && !on} />
  })
}

const Board = memo(function Board({ rows, fn, who }: { rows: Cap[][]; fn: Cap[]; who: string | null }) {
  return (
    <div className="flex flex-col gap-[var(--g)]">
      <div className="flex gap-[var(--g)]">
        <Row caps={fn} h={0.6} who={null} />
      </div>
      {rows.map((row, r) => (
        <div key={r} className="flex gap-[var(--g)]">
          <Row caps={row} h={1} who={who} />
          {r === rows.length - 1 && <Arrows />}
        </div>
      ))}
    </div>
  )
})

const sound = (() => {
  let ctx: AudioContext | null = null
  let out: AudioNode | null = null
  let noise: AudioBuffer | null = null
  let last = 0
  return {
    wake() {
      if (typeof AudioContext === 'undefined') return
      if (!ctx) {
        ctx = new AudioContext()
        const tone = ctx.createBiquadFilter()
        tone.type = 'lowpass'
        tone.frequency.value = 2600
        tone.Q.value = 0.5
        const level = ctx.createGain()
        level.gain.value = 0.9
        tone.connect(level).connect(ctx.destination)
        out = tone
        const len = Math.floor(ctx.sampleRate * 0.06)
        noise = ctx.createBuffer(1, len, ctx.sampleRate)
        const d = noise.getChannelData(0)
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
      }
      if (ctx.state === 'suspended') void ctx.resume()
    },
    key(big: boolean, soft = 1) {
      if (!ctx || !out || !noise || ctx.state !== 'running') return
      const now = performance.now()
      const gap = now - last
      if (gap < 24) return
      last = now
      const level = soft * Math.min(1, Math.max(0.32, gap / 120))
      const t = ctx.currentTime + 0.003
      const v = 0.94 + Math.random() * 0.12
      const body = ctx.createOscillator()
      body.type = 'sine'
      body.frequency.setValueAtTime((big ? 150 : 236) * v, t)
      body.frequency.exponentialRampToValueAtTime((big ? 82 : 148) * v, t + 0.035)
      const bg = ctx.createGain()
      bg.gain.setValueAtTime(0.0001, t)
      bg.gain.exponentialRampToValueAtTime((big ? 0.3 : 0.2) * level, t + 0.005)
      bg.gain.exponentialRampToValueAtTime(0.0001, t + (big ? 0.12 : 0.075))
      body.connect(bg).connect(out)
      body.start(t)
      body.stop(t + 0.14)
      const tap = ctx.createBufferSource()
      tap.buffer = noise
      const tf = ctx.createBiquadFilter()
      tf.type = 'lowpass'
      tf.frequency.value = (big ? 900 : 1500) * v
      const tg = ctx.createGain()
      tg.gain.setValueAtTime(0.0001, t)
      tg.gain.exponentialRampToValueAtTime((big ? 0.06 : 0.05) * level, t + 0.002)
      tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.02)
      tap.connect(tf).connect(tg).connect(out)
      tap.start(t, Math.random() * 0.03)
      tap.stop(t + 0.03)
    },
  }
})()

export function Keys() {
  const reduce = useReducedMotion()
  const [who, setWho] = useState<string | null>(null)
  const [said, setSaid] = useState('')
  const [n, setN] = useState(0)
  const [done, setDone] = useState(false)
  const [sizes, setSizes] = useState<Record<string, number>>({})
  const root = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const probe = useRef<HTMLParagraphElement>(null)
  const gen = useRef(0)
  const auto = useRef(true)
  const seen = useRef(false)
  const visible = useRef(false)
  const shown = useRef(0)
  const timers = useRef(new WeakMap<HTMLElement, number>())
  const again = useRef<(v: Voice) => void>(() => {})
  const tx = useRef<HTMLParagraphElement>(null)
  const caret = useRef<HTMLSpanElement>(null)
  const mark = `k${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const native = useSyncExternalStore(quiet, canHighlight, () => false)
  const sizeRef = useRef(30)
  const site = useSite()
  const energy = useMotionValue(0)
  const loud = useRef(false)

  useEffect(() => {
    loud.current = !!site?.sound
  }, [site?.sound])

  const keys = (id: string) => root.current?.querySelectorAll<HTMLElement>(`[data-k="${CSS.escape(id)}"]`) ?? []

  const hold = useCallback((id: string, down: boolean) => {
    for (const el of keys(id)) {
      window.clearTimeout(timers.current.get(el))
      if (down) el.dataset.down = ''
      else delete el.dataset.down
    }
  }, [])

  const tap = useCallback((id: string, ms = 70) => {
    if (!reduce) {
      energy.stop()
      energy.set(Math.min(1, energy.get() + 0.12))
      animate(energy, 0, { duration: 1.8, ease: [0.3, 0, 0.2, 1] })
    }
    for (const el of keys(id)) {
      el.dataset.down = ''
      window.clearTimeout(timers.current.get(el))
      timers.current.set(
        el,
        window.setTimeout(() => delete el.dataset.down, ms),
      )
    }
    if (loud.current) sound.key(id === 'space' || id === 'return', auto.current ? 0.6 : 1)
  }, [energy, reduce])

  const paint = useCallback(() => {
    const p = tx.current
    const node = p?.firstChild
    if (!p || !node || node.nodeType !== Node.TEXT_NODE) return
    const len = (node as Text).length
    const k = Math.min(shown.current, len)
    const r = new Range()
    r.setStart(node, k)
    r.setEnd(node, len)
    CSS.highlights.set(mark, new Highlight(r))
    const c = caret.current
    if (!c || !len) return
    const at = new Range()
    at.setStart(node, k === 0 ? 0 : k - 1)
    at.setEnd(node, k === 0 ? 1 : k)
    const rects = at.getClientRects()
    const last = rects[rects.length - 1]
    if (!last) return
    const b = p.getBoundingClientRect()
    const h = sizeRef.current * 1.02
    c.style.transform = `translate3d(${(k === 0 ? last.left : last.right) - b.left}px, ${last.top - b.top + (last.height - h) / 2}px, 0)`
  }, [mark])

  const reveal = useCallback(
    (count: number) => {
      shown.current = count
      if (native) paint()
      else setN(count)
    },
    [native, paint],
  )

  const speak = useCallback(
    async (v: Voice, byHand: boolean) => {
      const g = ++gen.current
      if (byHand) auto.current = false
      const live = () => g === gen.current
      if (shown.current) {
        hold('cmd-l', true)
        await sleep(40)
        tap('delete', 90)
        await sleep(60)
        hold('cmd-l', false)
        if (!live()) return
        setDone(false)
        setWho(null)
        setSaid('')
        reveal(0)
        await sleep(90)
        if (!live()) return
      }
      const text = line(v)
      setWho(v.id)
      setDone(false)
      setSaid(text)
      if (reduce) {
        reveal(text.length)
        setDone(true)
      } else {
        reveal(0)
        const chars = [...text]
        const base = Math.min(46, Math.max(10, Math.min(3000, 900 + chars.length * 12) / chars.length))
        for (let i = 0; i < chars.length; i++) {
          if (!live()) return
          const ch = chars[i]
          const s = stroke(ch)
          if (s?.shift) hold('shift-l', true)
          if (s) tap(s.id, s.id === 'space' ? 90 : 70)
          reveal(i + 1)
          await sleep(base * (0.75 + Math.random() * 0.5) + (/[.,!?]/.test(ch) ? 70 : 0))
          if (s?.shift) hold('shift-l', false)
        }
        if (!live()) return
        setDone(true)
      }
      if (!auto.current) return
      await sleep(2200 + text.length * 14)
      while (live() && (!visible.current || document.hidden)) await sleep(400)
      if (!live() || !auto.current) return
      const i = VOICES.findIndex((x) => x.id === v.id)
      again.current(VOICES[(i + 1) % VOICES.length])
    },
    [hold, tap, reveal, reduce],
  )

  useEffect(() => {
    again.current = (v) => void speak(v, false)
  }, [speak])

  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        visible.current = !!e?.isIntersecting
        if (e?.isIntersecting && !seen.current) {
          seen.current = true
          void speak(VOICES[0], false)
        }
      },
      { threshold: 0.45 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [speak])

  useEffect(() => {
    const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
    const down = (e: KeyboardEvent) => {
      if (!visible.current || typing(e.target)) return
      const id = codeToKey(e.code)
      if (!id) return
      hold(id, true)
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      const p = PERSON[id]
      if (p) {
        if (loud.current) sound.wake()
        void speak(p, true)
      }
    }
    const up = (e: KeyboardEvent) => {
      const id = codeToKey(e.code)
      if (id) hold(id, false)
    }
    const blur = () => root.current?.querySelectorAll<HTMLElement>('[data-down]').forEach((el) => delete el.dataset.down)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [hold, speak])

  useEffect(() => {
    if (!native) return
    return () => {
      CSS.highlights.delete(mark)
    }
  }, [native, mark])

  useLayoutEffect(() => {
    const b = box.current
    const el = probe.current
    if (!b || !el) return
    let w = 0
    const ro = new ResizeObserver(() => {
      if (b.clientWidth === w) return
      w = b.clientWidth
      setSizes(fit(el, b.clientWidth, b.clientHeight))
    })
    ro.observe(b)
    return () => ro.disconnect()
  }, [])

  const press = (e: ReactPointerEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-k]')
    if (!el) return
    if (loud.current) sound.wake()
    const id = el.dataset.k!
    const p = PERSON[id]
    if (p) {
      tap(id, 140)
      void speak(p, true)
      return
    }
    hold(id, true)
    if (loud.current) sound.key(id === 'space' || id === 'return')
    const release = () => {
      hold(id, false)
      removeEventListener('pointerup', release)
      removeEventListener('pointercancel', release)
    }
    addEventListener('pointerup', release)
    addEventListener('pointercancel', release)
  }

  const click = (e: ReactMouseEvent) => {
    if (e.detail !== 0) return
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-person]')
    const p = el && PERSON[el.dataset.k!]
    if (p) void speak(p, true)
  }

  const v = who ? VOICES.find((x) => x.id === who)! : null
  const size = (v && sizes[v.id]) || 30
  const typing = !!said && !done

  useLayoutEffect(() => {
    sizeRef.current = size
    if (native) paint()
  })

  return (
    <div ref={root} style={VARS} className="grid w-full gap-y-10 xl:grid-cols-[minmax(0,5fr)_minmax(0,8fr)] xl:items-center xl:gap-x-16">
      {native && <style>{`::highlight(${mark}){color:var(--ghost)}`}</style>}
      <div className="@container relative flow-root h-[clamp(200px,30cqw,250px)] max-w-[760px] xl:h-[340px]">
        <div className="flex h-6 min-w-0 items-center gap-2 whitespace-nowrap text-[13px] leading-[18px] text-ink-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {v && (
              <motion.span
                key={v.id}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease } }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                className="flex min-w-0 items-center gap-2"
              >
                <Face v={v} size={22} />
                <span className="shrink-0 font-medium text-ink">{v.name}</span>
                <span aria-hidden className="text-[var(--quiet)]">·</span>
                <span className="min-w-0 truncate">{byline(v)}</span>
                <span aria-hidden className={`text-[var(--quiet)] transition-opacity duration-200 ${done && !source(v) ? 'opacity-0' : ''}`}>·</span>
                <span className="relative inline-grid shrink-0">
                  <span className={`col-start-1 row-start-1 transition-opacity duration-200 ${done ? 'opacity-0' : 'opacity-100'}`}>typing…</span>
                  {source(v) ? (
                    <a href={source(v)} target="_blank" rel="noopener noreferrer" tabIndex={done ? 0 : -1} className={`ring-focus group/src col-start-1 row-start-1 inline-flex items-center gap-0.5 rounded-[3px] transition-[opacity,color] duration-200 hover:text-ink ${done ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
                      on X
                      <ArrowUpRight size={10} strokeWidth={2.2} className="transition-transform duration-150 group-hover/src:-translate-y-px group-hover/src:translate-x-px" />
                    </a>
                  ) : null}
                </span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div ref={box} aria-hidden className="pointer-events-none invisible absolute inset-x-0 bottom-0 top-[44px]">
          <p ref={probe} className="whitespace-pre-line text-pretty font-normal" />
        </div>
        <p ref={tx} aria-hidden className="relative mt-5 whitespace-pre-line text-pretty font-normal text-ink" style={type(size)}>
          {native ? (
            said
          ) : (
            <>
              {said.slice(0, n)}
              <span className="text-[var(--ghost)]">{said.slice(n)}</span>
            </>
          )}
          {native && typing && <span ref={caret} className="pointer-events-none absolute left-0 top-0 h-[1.02em] w-[0.07em] min-w-[2px] rounded-full bg-accent will-change-transform" />}
        </p>
        <p className="sr-only" aria-live="polite">
          {v && done ? `${v.name}: ${line(v)}` : ''}
        </p>
      </div>

      <div className="min-w-0">
        <Plate energy={energy} onPointerDown={press} onClick={click}>
          <Board rows={FULL} fn={FN} who={who} />
        </Plate>
        <p className="relative mt-5 text-[13px] leading-5 text-ink-3">
          <span className="pointer-coarse:hidden">Press a key with a face, or type its letter.</span>
          <span className="hidden pointer-coarse:inline">Tap a key with a face.</span>
        </p>
      </div>
    </div>
  )
}
