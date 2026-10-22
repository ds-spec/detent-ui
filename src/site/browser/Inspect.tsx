'use client'

import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { AnimatePresence, motion } from 'motion/react'

/** Where the pointed-at part is on the stage (screen px), its zoom, and its padding (design px). */
type Box = { x: number; y: number; w: number; h: number; r: number; scale: number; pad: [number, number, number, number] }
type Spec = { size: string; rows: [string, string][] }

const TYPE: [string, string][] = [
  ['caption', 'Caption'],
  ['footnote', 'Footnote'],
  ['callout', 'Callout'],
  ['body', 'Body'],
  ['headline', 'Headline'],
  ['title', 'Title'],
  ['large', 'Large'],
  ['display', 'Display'],
  ['lead', 'Lead'],
]
const COLORS = ['ink', 'ink-2', 'ink-3', 'quiet', 'surface', 'surface-2', 'surface-3', 'plate', 'card', 'bg', 'accent', 'ok', 'danger', 'warn', 'warn-ink', 'agents', 'data', 'inputs']
const SHADOWS: [string, string][] = [
  ['elev-border', 'Hairline'],
  ['elev-raised', 'Raised, small'],
  ['elev-float', 'Raised'],
  ['elev-modal', 'Floating'],
]
const WEIGHT: Record<string, string> = { '400': 'Regular', '500': 'Medium', '600': 'Semibold', '700': 'Bold' }
const SPRING = { type: 'spring', stiffness: 640, damping: 46, mass: 0.6 } as const
const CARD_W = 264
const CARD_MIN = 200

const round = (n: number) => Math.round(n * 10) / 10
const clear = (c: string) => c === 'rgba(0, 0, 0, 0)' || c === 'transparent'
const hasText = (el: Element) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())
const shorthand = ([t, r, b, l]: number[]) => (t === b && r === l ? (t === r ? `${t}` : `${t} ${r}`) : `${t} ${r} ${b} ${l}`)

/** The part a person means when they point: a text leaf, an icon, or the nearest thing with a surface. */
function pick(hit: Element | null, root: Element): Element | null {
  if (!hit || !root.contains(hit) || hit === root) return null
  const svg = hit.closest('svg')
  if (svg && root.contains(svg)) return svg
  for (let n: Element | null = hit; n && n !== root; n = n.parentElement) {
    if (hasText(n)) return n
    const cs = getComputedStyle(n)
    if (!clear(cs.backgroundColor) || cs.boxShadow !== 'none' || parseFloat(cs.borderTopLeftRadius) > 0) return n
  }
  return null
}

/** How much the stage has zoomed this part: its box on screen over its own layout width. */
function scaleOf(el: Element) {
  let n: Element | null = el
  while (n && !(n instanceof HTMLElement)) n = n.parentElement
  if (!n) return 1
  const r = n.getBoundingClientRect()
  return n.offsetWidth ? r.width / n.offsetWidth : 1
}

function measure(el: Element, stage: DOMRect): Box {
  const r = el.getBoundingClientRect()
  const cs = getComputedStyle(el)
  const scale = scaleOf(el)
  const radius = Math.min(parseFloat(cs.borderTopLeftRadius) || 0, r.height / scale / 2)
  const pad = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map((v) => round(parseFloat(v) || 0)) as Box['pad']
  return { x: r.left - stage.left, y: r.top - stage.top, w: r.width, h: r.height, r: radius * scale, scale, pad }
}

/**
 * Names a part in the system's own words: its type token, colour tokens, material and radius,
 * read live from the page. A probe inside the stage resolves the tokens, so they follow the
 * stage's theme.
 */
function describe(el: Element, host: HTMLElement, box: Box): Spec {
  const cs = getComputedStyle(el)
  const probe = document.createElement('span')
  probe.style.display = 'none'
  host.appendChild(probe)
  const resolve = (prop: 'color' | 'boxShadow', value: string) => {
    probe.style[prop] = value
    return getComputedStyle(probe)[prop]
  }
  const colorName = (c: string) => COLORS.find((n) => resolve('color', `var(--${n})`) === c)
  const rows: [string, string][] = []

  if (hasText(el) || el instanceof SVGElement) {
    const fs = round(parseFloat(cs.fontSize))
    const lh = cs.lineHeight === 'normal' ? null : round(parseFloat(cs.lineHeight))
    const weight = WEIGHT[cs.fontWeight] ?? cs.fontWeight
    if (hasText(el)) {
      // The type tokens are compiled into their classes, so read each one off a probe wearing it.
      const metrics = TYPE.map(([t, name]) => {
        probe.className = `text-${t}`
        const p = getComputedStyle(probe)
        return { name, fs: round(parseFloat(p.fontSize)), lh: round(parseFloat(p.lineHeight)), w: p.fontWeight }
      })
      probe.className = ''
      // Body and Headline share a size; the line height and weight tell them apart.
      const token = metrics.find((m) => m.fs === fs && m.lh === lh && m.w === cs.fontWeight) ?? metrics.find((m) => m.fs === fs && m.lh === lh && m.w === '400')
      const sized = metrics.find((m) => m.fs === fs)
      const name = token?.name ?? sized?.name
      rows.push(['Type', `${name ? `${name} · ` : ''}${fs}${lh ? `/${lh}` : ''} · ${weight}${/mono/i.test(cs.fontFamily) ? ' · Mono' : ''}`])
    }
    const ink = colorName(cs.color)
    rows.push([el instanceof SVGElement ? 'Icon' : 'Colour', ink ?? cs.color])
  }
  if (!clear(cs.backgroundColor)) rows.push(['Fill', el.classList.contains('glass') ? 'surface at 80%, blurred' : (colorName(cs.backgroundColor) ?? 'tint')])
  if (cs.boxShadow !== 'none') {
    const m = SHADOWS.find(([v]) => resolve('boxShadow', `var(--${v})`) === cs.boxShadow)
    const glass = el.classList.contains('glass')
    if (m || glass) rows.push(['Material', `${m?.[1] ?? 'Floating'}${glass ? ', glass' : ''}`])
  }
  if (el.classList.contains('sink')) rows.push(['Press', 'Sinks in'])

  // Radius, and whether it's concentric with the surface it sits in.
  const r = round(box.r / box.scale)
  if (r > 0) {
    const full = r >= round(box.h / box.scale / 2) - 0.5
    let value = full ? 'Full' : `${r}`
    if (!full) {
      for (let a = el.parentElement; a && a !== host.parentElement; a = a.parentElement) {
        const acs = getComputedStyle(a)
        const ar = round(parseFloat(acs.borderTopLeftRadius) || 0)
        if (!ar || (clear(acs.backgroundColor) && acs.boxShadow === 'none')) continue
        const inset = round((el.getBoundingClientRect().left - a.getBoundingClientRect().left) / box.scale)
        if (Math.abs(ar - inset - r) <= 1.5) value = `${r} = ${ar} − ${inset}, concentric`
        break
      }
    }
    rows.push(['Radius', value])
  }
  if (box.pad.some(Boolean)) rows.push(['Padding', shorthand(box.pad)])
  probe.remove()
  return { size: `${Math.round(box.w / box.scale)} × ${Math.round(box.h / box.scale)}`, rows }
}

/**
 * Inspect: point at any part of the live component and see what it's made of. Hairlines frame
 * the part and shade its padding; a card names its tokens. The component keeps running, and
 * pointing at it pauses the demo, so the part holds still while you read.
 */
export function InspectLayer({ on, stage }: { on: boolean; stage: RefObject<HTMLElement | null> }) {
  const [box, setBox] = useState<Box | null>(null)
  const [spec, setSpec] = useState<Spec | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [frame, setFrame] = useState<{ x: number; w: number } | null>(null)
  const host = useRef<HTMLDivElement>(null)
  const at = useRef<{ x: number; y: number } | null>(null)
  const current = useRef<Element | null>(null)

  useEffect(() => {
    const s = stage.current
    if (!on || !s) return
    let raf = 0
    let last = ''
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const root = s.querySelector('[data-inspect-root]')
      const p = at.current
      if (!root || !p || !host.current) return
      const sr = s.getBoundingClientRect()
      const el = pick(document.elementFromPoint(p.x, p.y), root)
      if (!el) {
        if (current.current) {
          current.current = null
          last = ''
          setBox(null)
          setSpec(null)
        }
        return
      }
      const b = measure(el, sr)
      const fr = (root.querySelector('[data-fit]') ?? root).getBoundingClientRect()
      // Re-render only when something visible changed, not on every frame.
      const key = [b.x, b.y, b.w, b.h, b.r, fr.left, fr.width].map(Math.round).join() + el.tagName
      if (el !== current.current) {
        current.current = el
        setSpec(describe(el, host.current, b))
      }
      if (key !== last) {
        last = key
        setBox(b)
        setSize({ w: sr.width, h: sr.height })
        setFrame({ x: fr.left - sr.left, w: fr.width })
      }
    }
    const move = (e: PointerEvent) => (at.current = { x: e.clientX, y: e.clientY })
    const leave = () => (at.current = null)
    s.addEventListener('pointermove', move)
    s.addEventListener('pointerdown', move)
    s.addEventListener('pointerleave', leave)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      s.removeEventListener('pointermove', move)
      s.removeEventListener('pointerdown', move)
      s.removeEventListener('pointerleave', leave)
      current.current = null
      setBox(null)
      setSpec(null)
    }
  }, [on, stage])

  // The card sits in the margin beside the component, level with the part, with a leader line to it.
  const card = box && spec ? place(box, frame, size, 26 + Math.max(1, spec.rows.length) * 22) : null

  return (
    <div ref={host} aria-hidden className="pointer-events-none absolute inset-0 z-[4]">
      <AnimatePresence>
        {on && !box && (
          <motion.p
            key="hint"
            className="absolute bottom-4 left-4 flex h-8 items-center gap-2 rounded-full bg-surface/80 pl-3 pr-1.5 text-footnote text-ink-2 shadow-border"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2 }}
          >
            Point at any part
            <span className="flex h-5 min-w-5 items-center justify-center rounded-[6px] bg-surface-2 px-1 text-caption font-medium leading-none text-ink-3">I</span>
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {on && box && (
          <motion.div
            key="frame"
            className="absolute left-0 top-0"
            initial={{ opacity: 0, x: box.x, y: box.y, width: box.w, height: box.h }}
            animate={{ opacity: 1, x: box.x, y: box.y, width: box.w, height: box.h }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ ...SPRING, opacity: { duration: 0.15 } }}
          >
            {/* Padding, shaded; then the part's own outline on top. */}
            <Pads box={box} />
            <span className="absolute inset-0" style={{ borderRadius: box.r, boxShadow: 'inset 0 0 0 1px var(--accent)' }} />
            <span
              className={`absolute left-1/2 flex h-5 -translate-x-1/2 items-center whitespace-nowrap rounded-[6px] bg-accent px-1.5 font-mono text-caption leading-none text-white ${box.y + box.h + 28 > size.h ? '-top-7' : '-bottom-7'}`}
            >
              {spec?.size}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {on && card && box && card.lead && (
          <motion.span
            key="lead"
            className="absolute left-0 top-0 h-px origin-left"
            style={{ background: 'color-mix(in oklch, var(--accent) 70%, transparent)' }}
            initial={{ opacity: 0, x: card.lead.x, y: card.lead.y, width: card.lead.w }}
            animate={{ opacity: 1, x: card.lead.x, y: card.lead.y, width: card.lead.w }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ ...SPRING, opacity: { duration: 0.15 } }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {on && card && spec && (
          <motion.div
            key="card"
            className="glass absolute left-0 top-0 rounded-[16px] bg-surface p-3 shadow-modal"
            style={{ width: card.w }}
            initial={{ opacity: 0, x: card.x, y: card.y, scale: 0.98 }}
            animate={{ opacity: 1, x: card.x, y: card.y, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ ...SPRING, opacity: { duration: 0.15 } }}
          >
            <dl className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-3 gap-y-1">
              {spec.rows.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-caption leading-[18px] text-ink-3">{k}</dt>
                  <dd className="text-footnote text-ink [overflow-wrap:anywhere]">{v}</dd>
                </div>
              ))}
              {!spec.rows.length && <dd className="col-span-2 text-footnote text-ink-3">A layout box: no surface of its own.</dd>}
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** The four padding bands of the part, with their sizes where there's room to print them. */
function Pads({ box }: { box: Box }) {
  const [t, r, b, l] = box.pad.map((v) => v * box.scale)
  const band = 'absolute flex items-center justify-center bg-[color-mix(in_oklch,var(--accent)_12%,transparent)] font-mono text-caption leading-none text-accent'
  const label = (v: number, room: number) => (room >= 16 && v ? round(v / box.scale) : null)
  return (
    <span className="absolute inset-0 overflow-hidden" style={{ borderRadius: box.r }}>
      {t > 0 && <span className={`${band} inset-x-0 top-0`} style={{ height: t }}>{label(t, t)}</span>}
      {b > 0 && <span className={`${band} inset-x-0 bottom-0`} style={{ height: b }}>{label(b, b)}</span>}
      {l > 0 && <span className={band} style={{ left: 0, top: t, bottom: b, width: l }}>{label(l, l)}</span>}
      {r > 0 && <span className={band} style={{ right: 0, top: t, bottom: b, width: r }}>{label(r, r)}</span>}
    </span>
  )
}

function place(box: Box, frame: { x: number; w: number } | null, stage: { w: number; h: number }, h: number) {
  const gap = 24
  const mid = box.y + box.h / 2
  const clampY = (y: number) => Math.min(stage.h - h - 12, Math.max(12, y))
  const y = clampY(mid - h / 2)
  // Level with the part, the leader runs from its edge to the card across the margin.
  const lead = (from: number, to: number) => (Math.abs(to - from) > 8 && mid > y + 6 && mid < y + h - 6 ? { x: Math.min(from, to), y: mid, w: Math.abs(to - from) } : null)
  const f = frame ?? { x: box.x, w: box.w }
  // The card takes the wider margin, and narrows to fit it rather than covering the component.
  const right = stage.w - 12 - (f.x + f.w + gap)
  const left = f.x - gap - 12
  if (Math.max(right, left) >= CARD_MIN) {
    if (right >= left) {
      const w = Math.min(CARD_W, right)
      const x = f.x + f.w + gap
      return { x, y, w, lead: lead(box.x + box.w, x) }
    }
    const w = Math.min(CARD_W, left)
    const x = f.x - gap - w
    return { x, y, w, lead: lead(x + w, box.x) }
  }
  // A component as wide as the stage: under the part if that fits, otherwise over it.
  const below = box.y + box.h + 40
  const w = CARD_W
  return { x: Math.min(stage.w - w - 12, Math.max(12, box.x)), y: clampY(below + h <= stage.h - 12 ? below : box.y - h - 40), w, lead: null }
}
