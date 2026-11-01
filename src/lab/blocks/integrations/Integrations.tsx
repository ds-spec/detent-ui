'use client'

import { useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import { AnimatePresence, motion, useAnimationFrame, useInView, useReducedMotion } from 'motion/react'
import { dragProps, useDetent } from '@/lab/lib/detent'
import { tap } from '@/lab/lib/feel'
import { Count } from '@/lab/ui/Count'
import { DrawnCheck } from '@/lab/ui/Outcome'
import { Spinner } from '@/lab/ui/Spinner'
import { ArrowRight, Check } from '@/lab/blocks/kit/icons'
import { btn } from '@/lab/blocks/kit/primitives'
import { InPlay, useDirector } from '@/lab/blocks/kit/director'
import { accentVars } from '@/lab/blocks/kit/props'
import type { BlockProps } from '@/lab/blocks/kit/props'
import { ACCESS, INTEGRATIONS } from './content'
import type { Integration } from './content'
import { ease, dur, spring } from '@/lab/lib/motion'

/** The dialog's main button takes focus without moving the page: the block's demo opens it unasked. */
const takeFocus = (el: HTMLButtonElement | null) => el?.focus({ preventScroll: true })

/**
 * The tools a product connects to, seen through glass. Three rows of marks drift in ink, each its
 * own way; a capsule of glass floats over the middle, and whatever passes behind it swells, bends
 * at the rim and takes its own colour, with its name under it. Press a tool and the rows ease to a
 * stop with it under the glass; the glass opens into a frosted panel there, with what connecting
 * it does and Connect. Once connected, a tool keeps its colour everywhere, so the rows fill with
 * colour as the stack comes together. The glass's light follows the pointer; grab the rows to pull
 * them through it, and let go to see them coast.
 *
 * The glass is an SVG filter: the rows drawn a second time, magnified, in colour and named,
 * pushed through a displacement map shaped like the capsule's bevel, with its three colours
 * parted a little at the rim.
 */

export type IntegrationsProps = BlockProps & {
  /** The product's name, in the line under the glass and on the panel. */
  product?: string
  /** The heading, set in two tones. */
  title?: [string, string]
  subline?: string
  /** The tools, dealt across three rows in turn. Eighteen to thirty sit best. */
  integrations?: Integration[]
  /** The link under the line. */
  more?: { label: string; href: string }
  /** How fast the rows drift, in pixels a second. */
  speed?: number
  /** Called when a person presses Connect. Return a promise to keep it busy until it settles. */
  onConnect?: (id: string) => Promise<void> | void
}

const mod = (a: number, n: number) => ((a % n) + n) % n
/** Seconds of travel a flick is worth: what the rows' old drag of 0.04 a second came to. */
const COAST = 0.31
const GLIDE = { w: 13, z: 1 }

/** A brand colour that would vanish on the theme's ground gives way to ink there. */
function markFill(hex: string) {
  const c = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return `light-dark(${lum > 0.78 ? 'var(--ink)' : hex}, ${lum < 0.22 ? 'var(--ink)' : hex})`
}

/**
 * The capsule's bevel as a displacement map, `pad` wider than the glass on every side: flat in the
 * middle, bending harder toward the rim, then easing back to nothing just outside it.
 */
function capsuleMap(w: number, h: number, pad: number, density: number) {
  const W = Math.round((w + pad * 2) * density)
  const H = Math.round((h + pad * 2) * density)
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  if (!ctx) return ''
  const img = ctx.createImageData(W, H)
  const r = h / 2
  const a = w / 2 - r
  const bevel = r * 0.46
  for (let py = 0; py < H; py++)
    for (let px = 0; px < W; px++) {
      const x = (px + 0.5) / density - pad - w / 2
      const y = (py + 0.5) / density - pad - h / 2
      const cx = Math.max(-a, Math.min(a, x))
      const dx = x - cx
      const len = Math.hypot(dx, y) || 1
      const d = len - r
      let k = 0
      if (d <= 0) k = -d < bevel ? Math.pow(1 - -d / bevel, 2.6) : 0
      else if (d < pad * 0.8) {
        const t = d / (pad * 0.8)
        k = 1 - t * t * (3 - 2 * t)
      }
      const i = (py * W + px) * 4
      img.data[i] = Math.round(128 - (dx / len) * k * 127)
      img.data[i + 1] = Math.round(128 - (y / len) * k * 127)
      img.data[i + 2] = 128
      img.data[i + 3] = 255
    }
  ctx.putImageData(img, 0, 0)
  return c.toDataURL()
}

/** Measures a box before it paints, and again whenever it changes size. */
function useSize<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null)
  const [w, setW] = useState(fallback)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => setW(Math.max(280, Math.round(el.clientWidth)))
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

function Mark({ path, size, color }: { path: string; size: number; color: string }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" className="block" style={{ fill: markFill(color) }}>
      <path d={path} />
    </svg>
  )
}

export function Integrations({
  autoplay = true,
  accent,
  product = 'Detent',
  title = ['Plugs into the tools', 'your team lives in.'],
  subline = 'It reads from them, writes to them, and knows when to hand over to a person. Press any of them to connect it.',
  integrations = INTEGRATIONS,
  more = { label: 'See all 40 integrations', href: '#integrations' },
  speed = 22,
  onConnect,
  className = '',
}: IntegrationsProps) {
  const calls = useRef({ onConnect })
  useLayoutEffect(() => {
    calls.current = { onConnect }
  })
  const reduce = useReducedMotion()
  const inPlay = useContext(InPlay)
  // Ids for the glass's gradients and filters, safe inside url(#…) and unique per block on a page.
  const id = `glass${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const handed = useRef(!autoplay)

  // ── Geometry, from the stage's measured width ─────────────────────────────────────────────
  const [box, W] = useSize<HTMLDivElement>(1100)
  const seen = useInView(box)
  const rowH = Math.round(Math.min(76, Math.max(56, W * 0.066)))
  const chipW = Math.round(rowH * 1.38)
  const gap = Math.round(rowH * 0.2)
  const step = chipW + gap
  const rowGap = Math.round(rowH * 0.26)
  const padY = Math.round(rowH * 0.6)
  const H = rowH * 3 + rowGap * 2 + padY * 2
  const rows = [0, 1, 2].map((r) => integrations.filter((_, i) => i % 3 === r))
  const rowY = (r: number) => padY + r * (rowH + rowGap)
  const Gh = Math.round(rowH * 1.9)
  const Gw = Math.round(Math.min(W * 0.46, Gh * 2.6))
  const pad = Math.round(Gh * 0.16)
  const M = 1.22
  const mark = Math.round(rowH * 0.38)
  const map = useMemo(() => (typeof document === 'undefined' ? '' : capsuleMap(Gw, Gh, pad, 1.5)), [Gw, Gh, pad])
  // Which way each row drifts, and how fast against the others.
  const drift = [-1, 0.8, -1.15]

  const [connected, setConnected] = useState(() => new Set(integrations.filter((t) => t.connected).map((t) => t.id)))
  const [open, setOpen] = useState<{ id: string; phase: 'ask' | 'busy' | 'done' } | null>(null)

  // ── The drift, the hand and the light, kept outside React and painted each frame ──────────
  const travel = useRef(0)
  const scrub = useRef({ at: 0 })
  const pace = useRef(1)
  const hover = useRef(false)
  const held = useRef(false)
  const pressed = useRef({ x: 0, y: 0, t: 0 })
  const width = useRef(W)
  const pick = useRef(() => {})
  const light = useRef({ x: 0, y: 0, tx: 0, ty: 0 })
  const [focus, setFocus] = useState(rows[1][0]?.id ?? integrations[0].id)
  const focused = useRef(focus)

  const base = useRef<(SVGGElement | null)[]>([])
  const lit = useRef<(SVGGElement | null)[]>([])
  const lens = useRef<SVGGElement>(null)
  const copy = useRef<SVGGElement>(null)
  const rim = useRef<SVGLinearGradientElement>(null)
  const glint = useRef<SVGEllipseElement>(null)

  const offset = (r: number) => {
    const len = rows[r].length * step
    return mod(drift[r] * travel.current + scrub.current.at, len) - len
  }
  const paint = () => {
    const l = light.current
    const gx = W / 2 + l.x * 10
    const gy = H / 2 + l.y * 6
    for (let r = 0; r < 3; r++) {
      const t = `translate(${offset(r)} ${rowY(r)})`
      base.current[r]?.setAttribute('transform', t)
      lit.current[r]?.setAttribute('transform', t)
    }
    lens.current?.setAttribute('transform', `translate(${gx} ${gy})`)
    copy.current?.setAttribute('transform', `scale(${M}) translate(${-gx} ${-gy})`)
    // The rim's light comes from the pointer's side; the glint leans toward it.
    rim.current?.setAttribute('gradientTransform', `rotate(${(Math.atan2(l.y, l.x || 0.0001) * 180) / Math.PI + 135} 0.5 0.5)`)
    glint.current?.setAttribute('transform', `translate(${l.x * Gw * 0.12} 0)`)
  }
  /** The tool at the glass's middle names the line under it. */
  const name = () => {
    const row = rows[1]
    const j = Math.round((W / 2 + light.current.x * 10 - offset(1) - chipW / 2) / step)
    const t = row[mod(j, row.length)]
    if (t && t.id !== focused.current) {
      focused.current = t.id
      setFocus(t.id)
    }
  }
  const latest = useRef({ paint, name })
  useLayoutEffect(() => {
    latest.current = { paint, name }
    paint()
  })

  // The rows are one value in the hand: a flick coasts about as far as it always did, and it can be caught.
  const dial = useDetent({
    value: 0,
    throw: COAST,
    spring: GLIDE,
    muted: true,
    onFrame: (x) => {
      scrub.current.at = x
      latest.current.paint()
      latest.current.name()
    },
  })
  const [drag] = useState(() =>
    dragProps(dial, () => ({
      box: () => box.current,
      units: width.current,
      muted: true,
      release: () => ({ flick: !reduce }),
      onTap: () => pick.current(),
    })),
  )

  useAnimationFrame((_, delta) => {
    if (!seen || !inPlay) return
    const dt = Math.min(delta, 64) / 1000
    // Pointing at the stage slows the drift to a crawl so a name can be read; a panel stops it.
    pace.current += ((held.current ? 0 : hover.current ? 0.22 : 1) - pace.current) * Math.min(1, dt * 4)
    if (autoplay && !reduce && dial.mode() !== 'held') travel.current += speed * pace.current * dt
    const l = light.current
    l.x += (l.tx - l.x) * Math.min(1, dt * (reduce ? 60 : 6))
    l.y += (l.ty - l.y) * Math.min(1, dt * (reduce ? 60 : 6))
    latest.current.paint()
    latest.current.name()
  })

  /** Slides the rows so a chip's middle comes to rest under the glass. */
  const bring = (cx: number) => {
    dial.to(dial.get() + (W / 2 - cx))
  }
  /** Where a tool's nearest chip sits now, and in which row. */
  const where = (tid: string) => {
    const r = rows.findIndex((row) => row.some((t) => t.id === tid))
    const i = rows[r].findIndex((t) => t.id === tid)
    const len = rows[r].length * step
    const x0 = offset(r) + i * step + chipW / 2
    const k = Math.round((W / 2 - x0) / len)
    return x0 + k * len
  }

  const ask = (tid: string) => {
    held.current = true
    bring(where(tid))
    setOpen({ id: tid, phase: 'ask' })
  }
  const close = () => {
    held.current = false
    setOpen(null)
    box.current?.focus({ preventScroll: true })
  }
  const connect = async () => {
    if (!open || open.phase !== 'ask') return
    const tid = open.id
    setOpen({ id: tid, phase: 'busy' })
    await Promise.all([handed.current ? calls.current.onConnect?.(tid) : undefined, new Promise((r) => setTimeout(r, 1000))])
    setConnected((s) => new Set(s).add(tid))
    setOpen({ id: tid, phase: 'done' })
  }
  // Connected: the panel says so for a moment, then folds back into the glass.
  useEffect(() => {
    if (open?.phase !== 'done') return
    const t = setTimeout(() => {
      held.current = false
      setOpen(null)
    }, 1300)
    return () => clearTimeout(t)
  }, [open])

  const latestConnect = useRef(connect)
  useLayoutEffect(() => {
    latestConnect.current = connect
  })
  const director = useDirector(
    async (wait, pass) => {
      if (pass > 0) setConnected(new Set(integrations.filter((t) => t.connected).map((t) => t.id)))
      await wait(3200)
      for (const tid of ['intercom', 'hubspot']) {
        if (!integrations.some((t) => t.id === tid)) continue
        ask(tid)
        await wait(1900)
        await latestConnect.current()
        await wait(4600)
      }
      await wait(4000)
    },
    autoplay,
    () => {
      handed.current = true
    },
  )
  // ── The hand: drag to pull the rows, press a chip to connect it ───────────────────────────
  const local = (e: { clientX: number; clientY: number }) => {
    const r = box.current!.getBoundingClientRect()
    const k = r.width / W
    return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k }
  }
  /** The tool under a point on the stage, if the point is on a chip. */
  const chipAt = (p: { x: number; y: number }) => {
    const r = [0, 1, 2].find((q) => p.y >= rowY(q) && p.y <= rowY(q) + rowH)
    if (r === undefined) return null
    const rel = p.x - offset(r)
    if (mod(rel, step) > chipW) return null
    return rows[r][mod(Math.floor(rel / step), rows[r].length)]
  }
  useLayoutEffect(() => {
    width.current = W
    pick.current = () => {
      if (performance.now() - pressed.current.t >= 500) return
      const t = chipAt(pressed.current)
      if (t) {
        tap()
        ask(t.id)
      }
    }
  })
  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    if (open) {
      if (open.phase !== 'busy') close()
      return
    }
    pressed.current = { ...local(e), t: performance.now() }
    drag.onPointerDown(e)
  }
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const p = local(e)
    light.current.tx = Math.max(-1, Math.min(1, (p.x - W / 2) / (W / 2)))
    light.current.ty = Math.max(-1, Math.min(1, (p.y - H / 2) / (H / 2)))
    drag.onPointerMove(e)
  }
  const up = (e: ReactPointerEvent<HTMLDivElement>) => {
    pressed.current = { ...pressed.current, ...local(e) }
    drag.onPointerUp(e)
  }
  const key = (e: ReactKeyboardEvent) => {
    if (open) {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
      return
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      bring(W / 2 + (e.key === 'ArrowRight' ? step : -step))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      ask(focused.current)
    }
  }

  const asked = open ? integrations.find((t) => t.id === open.id) : null
  // The line names the tool in the glass, or the one whose panel is open.
  const tool = asked ?? integrations.find((t) => t.id === focus) ?? integrations[0]
  const swap = {
    initial: { opacity: 0, y: reduce ? 0 : 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: reduce ? 0 : -6, transition: { duration: dur.exit, ease: ease.out } },
  }
  const pw = Math.min(400, W - 32)

  /** One row of chips, repeated so it never runs out: in ink (connected ones in colour), or in colour and named for under the glass. */
  const row = (r: number, glass: boolean) => {
    const list = rows[r]
    const len = list.length * step
    const times = Math.ceil((W + len * 2) / len)
    return Array.from({ length: times }, (_, k) =>
      list.map((t, i) => {
        const x = k * len + i * step
        const up = glass ? -rowH * 0.1 : 0
        const on = connected.has(t.id)
        return (
          <g key={`${k}-${t.id}`} transform={`translate(${x} 0)`}>
            <rect x={0.5} y={0.5} width={chipW - 1} height={rowH - 1} rx={rowH * 0.24} fill="var(--card)" stroke="var(--line)" />
            <path d={t.mark} transform={`translate(${chipW / 2 - mark / 2} ${rowH / 2 - mark / 2 + up}) scale(${mark / 24})`} style={{ fill: glass || on ? markFill(t.color) : 'var(--ink)' }} opacity={glass || on ? 1 : 0.36} />
            {glass && (
              <text x={chipW / 2} y={rowH / 2 + mark / 2 + up + rowH * 0.2} textAnchor="middle" fontSize={rowH * 0.145} fontWeight={500} fill="var(--ink)" fillOpacity={0.78} letterSpacing="-0.01em">
                {t.name}
              </text>
            )}
            {on && (
              <g transform={`translate(${chipW - rowH * 0.2} ${rowH * 0.2})`}>
                <circle r={rowH * 0.085} fill="var(--ok)" />
                <path d="M -2.6 0.1 L -0.8 1.9 L 2.7 -1.7" fill="none" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" transform={`scale(${rowH / 70})`} />
              </g>
            )}
          </g>
        )
      }),
    )
  }

  return (
    <div className={`pro-app @container h-full w-full overflow-y-auto overflow-x-hidden bg-surface text-ink [scrollbar-width:thin] ${className}`} style={accentVars(accent)} onPointerDownCapture={director.onPointerDownCapture} onPointerUpCapture={director.onPointerUpCapture} onKeyDownCapture={director.onKeyDownCapture}>
      <div className="flex min-h-full items-center">
        <section className="mx-auto w-full max-w-[1180px] px-5 py-14 text-center @3xl:px-8 @3xl:py-20">
          <h2 className="text-[clamp(30px,4.6cqi,52px)] font-normal leading-[1.04] tracking-[-0.045em] text-ink">
            {title[0]}
            <span className="block text-[color-mix(in_oklch,var(--ink)_42%,transparent)]">{title[1]}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[480px] text-callout leading-[1.55] text-ink-2">{subline}</p>
          <p className="mt-5 inline-flex h-7 items-center gap-2 rounded-full bg-surface-2 px-3 text-footnote text-ink-2 shadow-[inset_0_0_0_1px_var(--line)]">
            <span className="size-1.5 rounded-full bg-[var(--ok)]" />
            <span className="tnum font-medium text-ink">
              <Count value={connected.size} duration={0.5} />
            </span>
            of {integrations.length} connected
          </p>

          {/* ── The rows, the glass over them, and the panel it opens into ── */}
          <div
            ref={box}
            tabIndex={0}
            role="group"
            aria-label={`Integrations. ${tool.name} is under the glass. Arrow keys move the rows, Enter connects.`}
            onKeyDown={key}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={drag.onPointerCancel}
            onFocus={() => (hover.current = true)}
            onBlur={() => (hover.current = false)}
            onPointerEnter={() => (hover.current = true)}
            onPointerLeave={(e) => {
              hover.current = false
              light.current.tx = 0
              light.current.ty = 0
              up(e)
            }}
            className={`ring-focus relative -mx-5 mt-8 touch-pan-y select-none rounded-[20px] @3xl:mx-0 @3xl:mt-10 ${open ? '' : 'cursor-grab active:cursor-grabbing'}`}
            style={{ height: H }}
          >
            <svg aria-hidden width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 block" style={{ maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)' }}>
              <defs>
                <clipPath id={`${id}-clip`}>
                  <rect x={-Gw / 2} y={-Gh / 2} width={Gw} height={Gh} rx={Gh / 2} />
                </clipPath>
                <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation={Math.max(3, Gh * 0.1)} />
                </filter>
                <filter id={`${id}-edge`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation={1.6} />
                </filter>
                {/* The glass: the lit rows, magnified, pushed through the bevel, each colour a little further than the last. */}
                <filter id={`${id}-glass`} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x={-Gw / 2 - pad} y={-Gh / 2 - pad} width={Gw + pad * 2} height={Gh + pad * 2} colorInterpolationFilters="sRGB">
                  <feImage href={map} x={-Gw / 2 - pad} y={-Gh / 2 - pad} width={Gw + pad * 2} height={Gh + pad * 2} preserveAspectRatio="none" result="map" />
                  <feDisplacementMap in="SourceGraphic" in2="map" scale={Gh * 0.27} xChannelSelector="R" yChannelSelector="G" result="r0" />
                  <feDisplacementMap in="SourceGraphic" in2="map" scale={Gh * 0.278} xChannelSelector="R" yChannelSelector="G" result="g0" />
                  <feDisplacementMap in="SourceGraphic" in2="map" scale={Gh * 0.286} xChannelSelector="R" yChannelSelector="G" result="b0" />
                  <feColorMatrix in="r0" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
                  <feColorMatrix in="g0" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
                  <feColorMatrix in="b0" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
                  <feBlend in="r" in2="g" mode="screen" result="rg" />
                  <feBlend in="rg" in2="b" mode="screen" />
                </filter>
                <radialGradient id={`${id}-glint`} cx="0.5" cy="0" r="0.8">
                  <stop offset="0" stopColor="white" stopOpacity={0.8} />
                  <stop offset="1" stopColor="white" stopOpacity={0} />
                </radialGradient>
                <linearGradient id={`${id}-rim`} ref={rim} x1="0" y1="0.5" x2="1" y2="0.5">
                  <stop offset="0" stopColor="white" stopOpacity={0.95} />
                  <stop offset="0.35" stopColor="white" stopOpacity={0.06} />
                  <stop offset="0.65" stopColor="white" stopOpacity={0.06} />
                  <stop offset="1" stopColor="white" stopOpacity={0.55} />
                </linearGradient>
              </defs>

              {[0, 1, 2].map((r) => (
                <g
                  key={r}
                  transform={`translate(${-rows[r].length * step} ${rowY(r)})`}
                  ref={(el) => {
                    base.current[r] = el
                  }}
                >
                  {row(r, false)}
                </g>
              ))}

              <g ref={lens} transform={`translate(${W / 2} ${H / 2})`} className="transition-opacity duration-300" opacity={open ? 0 : 1}>
                <rect x={-Gw / 2 + Gh * 0.08} y={-Gh / 2 + Gh * 0.16} width={Gw - Gh * 0.16} height={Gh} rx={Gh / 2} fill="black" opacity={0.17} filter={`url(#${id}-soft)`} />
                <g clipPath={`url(#${id}-clip)`}>
                  <g filter={`url(#${id}-glass)`}>
                    <rect x={-Gw / 2 - pad} y={-Gh / 2 - pad} width={Gw + pad * 2} height={Gh + pad * 2} fill="var(--surface)" />
                    <g ref={copy} transform={`scale(${M}) translate(${-W / 2} ${-H / 2})`}>
                      {[0, 1, 2].map((r) => (
                        <g
                          key={r}
                          transform={`translate(${-rows[r].length * step} ${rowY(r)})`}
                          ref={(el) => {
                            lit.current[r] = el
                          }}
                        >
                          {row(r, true)}
                        </g>
                      ))}
                    </g>
                  </g>
                  <rect x={-Gw / 2} y={-Gh / 2} width={Gw} height={Gh} rx={Gh / 2} fill="white" opacity={0.05} />
                  <ellipse ref={glint} cy={-Gh * 0.36} rx={Gw * 0.4} ry={Gh * 0.24} fill={`url(#${id}-glint)`} className="opacity-55 dark:opacity-15" />
                  <rect x={-Gw / 2 + 1.5} y={-Gh / 2 + 1.5} width={Gw - 3} height={Gh - 3} rx={Gh / 2 - 1.5} fill="none" stroke="black" strokeOpacity={0.1} strokeWidth={3} filter={`url(#${id}-edge)`} />
                </g>
                <rect x={-Gw / 2 + 0.75} y={-Gh / 2 + 0.75} width={Gw - 1.5} height={Gh - 1.5} rx={Gh / 2 - 0.75} fill="none" stroke={`url(#${id}-rim)`} strokeWidth={1.5} />
                <rect x={-Gw / 2 - 0.5} y={-Gh / 2 - 0.5} width={Gw + 1} height={Gh + 1} rx={Gh / 2 + 0.5} fill="none" stroke="var(--ink)" strokeOpacity={0.13} />
              </g>
            </svg>

            {/* The glass, opened: a frosted panel grown from the capsule, with what connecting does and Connect. */}
            <AnimatePresence>
              {asked && open && (
                <motion.div
                  key="panel"
                  role="dialog"
                  aria-label={`Connect ${asked.name}`}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute left-1/2 top-1/2 z-10 overflow-hidden text-left shadow-[0_0_0_1px_var(--line),inset_0_1px_0_light-dark(rgb(255_255_255/0.85),rgb(255_255_255/0.08)),0_30px_60px_-28px_rgb(0_0_0/0.4)] [-webkit-backdrop-filter:blur(18px)_saturate(1.6)] [backdrop-filter:blur(18px)_saturate(1.6)]"
                  style={{ x: '-50%', y: '-50%', background: 'color-mix(in oklch, var(--surface) 62%, transparent)' }}
                  initial={{ width: Gw, height: Gh, borderRadius: Gh / 2, opacity: 0.4 }}
                  animate={{ width: pw, height: 'auto', borderRadius: 26, opacity: 1 }}
                  exit={{ width: Gw, height: Gh, borderRadius: Gh / 2, opacity: 0, transition: spring.move }}
                  transition={spring.move}
                >
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: dur.enter, ease: ease.out, delay: 0.12 } }} exit={{ opacity: 0, transition: { duration: dur.exit, ease: ease.out } }} className="p-5" style={{ width: pw }}>
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-[var(--card)] shadow-[0_0_0_1px_var(--line),0_1px_2px_rgb(0_0_0/0.06)]">
                        <Mark path={asked.mark} size={21} color={asked.color} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-callout font-medium leading-5 text-ink">{asked.name}</p>
                        <p className="truncate text-footnote text-ink-3">{asked.kind}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-footnote leading-[1.55] text-ink-2">
                      <span className="font-medium text-ink">{product}</span> {asked.does}
                    </p>
                    <ul className="mt-4 flex flex-col gap-2 border-t border-[var(--line)] pt-4">
                      {(asked.access ?? ACCESS[asked.kind] ?? []).map((a) => (
                        <li key={a} className="flex items-center gap-2 text-footnote text-ink-2">
                          <Check size={13} className="shrink-0 text-ink-3" />
                          {a}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 flex h-9 items-center justify-end gap-2">
                      {open.phase === 'done' ? (
                        <span className="flex items-center gap-1.5 text-footnote font-medium text-[color-mix(in_oklch,var(--ok)_72%,var(--ink))]">
                          <DrawnCheck size={13} />
                          {asked.name} is connected
                        </span>
                      ) : connected.has(asked.id) ? (
                        <>
                          <span className="mr-auto flex items-center gap-1.5 text-footnote text-[color-mix(in_oklch,var(--ok)_72%,var(--ink))]">
                            <Check size={13} /> Connected
                          </span>
                          <button type="button" onClick={close} className={btn.secondary} ref={takeFocus}>
                            Done
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={close} className={btn.ghost} disabled={open.phase === 'busy'}>
                            Not now
                          </button>
                          <button type="button" onClick={() => void connect()} className={`${btn.primary} min-w-[104px]`} disabled={open.phase === 'busy'} ref={takeFocus}>
                            {open.phase === 'busy' ? <Spinner size={13} /> : `Connect ${asked.name.split(' ')[0]}`}
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* What the product does in the tool at the glass's middle. It holds its room, so nothing below moves. */}
          <div className="mx-auto mt-8 grid min-h-[48px] max-w-[540px] @3xl:mt-10" aria-live="polite">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.p key={tool.id} {...swap} transition={spring.snappy} className="col-start-1 row-start-1 text-footnote leading-[1.6] text-ink-2">
                <span className="font-medium text-ink">{tool.name}</span>
                <span className="text-ink-3"> · {connected.has(tool.id) ? 'Connected' : tool.kind} · </span>
                {product} {tool.does}
              </motion.p>
            </AnimatePresence>
          </div>

          <a href={more.href} className="ring-focus group mt-6 inline-flex items-center gap-1.5 rounded-[6px] text-footnote font-medium text-[var(--accent-ink)]">
            {more.label}
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </a>
        </section>
      </div>
    </div>
  )
}
