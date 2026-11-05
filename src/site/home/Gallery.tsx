'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { RefObject } from 'react'
import Link from 'next/link'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DEMOS, SPOTS } from '@/catalog/demos'
import { SIZE, SPOT_SIZE } from '@/catalog/sizes'
import { CATEGORIES, ENTRIES, FEELS } from '@/catalog/meta'
import type { Entry, Feel } from '@/catalog/meta'
import { isProComponent } from '@/catalog/pro'
import { ArrowRight } from '@/lab/icons'
import { RollingText } from '@/lab/ui/RollingText'
import { Fit } from '../Fit'
import { ProTag } from '../blocks/ProTag'
import { useNear } from '../near'
import { FAMILY_EVENT } from './FamilyTag'

const NAT: Record<string, [number, number]> = { ...SIZE, ...SPOT_SIZE }
const PAD = 28
const MIN_ZOOM = 0.62
const ROW = 4
const GAP = 16

const WIDE_ORDER = ['radar', 'prompt', 'confirm', 'dates', 'dialog', 'rewrite', 'trace', 'toasts', 'scaffold']
const WIDE = new Set(WIDE_ORDER)

const LAYOUTS = [
  { cols: 2, col: 480, pair: 976 },
  { cols: 3, col: 427, pair: 869 },
] as const

const snap = (px: number) => Math.ceil(px / ROW) * ROW

const heightFor = (id: string, width: number) => {
  const n = NAT[id]
  if (!n) return snap(Math.min(480, Math.max(360, width * 0.55)))
  const z = Math.min(1, (width - PAD * 2) / n[0])
  return snap(Math.max(260, n[1] * z + PAD * 2))
}

const fluid = (id: string) => {
  const n = NAT[id]
  if (!n) return 'clamp(300px, 72cqw, 480px)'
  const [w, h] = n
  return `clamp(${Math.max(220, Math.round(h * MIN_ZOOM + PAD * 2))}px, calc(${(h / w).toFixed(4)} * (100cqw - ${PAD * 2}px) + ${PAD * 2}px), ${h + PAD * 2}px)`
}

const arrange = (list: Entry[]) => {
  const wides = list.filter((e) => WIDE.has(e.id)).sort((a, b) => WIDE_ORDER.indexOf(a.id) - WIDE_ORDER.indexOf(b.id))
  const small = (e: Entry) => (NAT[e.id]?.[1] ?? 999) <= 260
  const big = list.filter((e) => !WIDE.has(e.id) && !small(e))
  const tiny = list.filter((e) => !WIDE.has(e.id) && small(e))
  const rest: Entry[] = []
  const gap = tiny.length ? big.length / tiny.length : Infinity
  for (let b = 0, t = 0; b < big.length || t < tiny.length; ) {
    if (b < big.length) rest.push(big[b++])
    if (t < tiny.length && (b >= (t + 1) * gap - 0.5 || b >= big.length)) rest.push(tiny[t++])
  }
  const every = wides.length ? Math.max(1, Math.round(rest.length / wides.length)) : rest.length
  const out: Entry[] = []
  for (let w = 0, r = 0; w < wides.length || r < rest.length; ) {
    if (w < wides.length) out.push(wides[w++])
    for (let k = 0; k < every && r < rest.length; k++) out.push(rest[r++])
  }
  return out
}

type Slot = { c: number; span: number; top: number; h: number; base: number }

const pack = (order: Entry[], cols: number, col: number, pair: number) => {
  const slots = new Map<string, Slot>()
  const bottom: number[] = Array(cols).fill(0)
  const last: (string | null)[] = Array(cols).fill(null)
  const stack: string[][] = Array.from({ length: cols }, () => [])
  const queue = [...order]
  const wide = (e: Entry) => cols > 1 && WIDE.has(e.id)
  const size = (e: Entry) => heightFor(e.id, wide(e) ? pair : col)
  const put = (e: Entry, c: number, span: number, top: number) => {
    const h = size(e)
    slots.set(e.id, { c, span, top, h, base: h })
    for (let i = c; i < c + span; i++) {
      bottom[i] = top + h + GAP
      last[i] = e.id
      stack[i].push(e.id)
    }
  }
  const growable = (i: number) => {
    const id = last[i]
    const s = id ? slots.get(id) : undefined
    if (!s) return false
    for (let k = s.c; k < s.c + s.span; k++) if (last[k] !== id) return false
    return true
  }
  const reach = (i: number, to: number) => {
    const d = to - bottom[i]
    if (d <= 0) return
    const run: Slot[] = []
    for (let k = stack[i].length - 1; k >= 0; k--) {
      const s = slots.get(stack[i][k])!
      if (s.span !== 1) break
      run.unshift(s)
    }
    if (run.length) {
      const per = Math.floor(d / run.length / ROW) * ROW
      let shift = 0
      run.forEach((s, k) => {
        const g = k === run.length - 1 ? d - per * (run.length - 1) : per
        s.top += shift
        s.h += g
        shift += g
      })
      bottom[i] = to
      return
    }
    if (!growable(i)) return
    const s = slots.get(last[i]!)!
    s.h += d
    for (let k = s.c; k < s.c + s.span; k++) bottom[k] += d
  }
  const fits = (room: number) => queue.filter((x) => !wide(x) && size(x) + GAP <= room + 40)

  const stretchable = (i: number) => {
    const id = stack[i].at(-1)
    return (!!id && slots.get(id)!.span === 1) || growable(i)
  }
  const beside = (i: number, only?: number) => {
    for (const j of only === undefined ? [i - 1, i + 1] : [only]) {
      if (j < 0 || j >= cols || bottom[j] <= bottom[i]) continue
      const s = last[j] ? slots.get(last[j]!) : undefined
      if (!s || s.top < bottom[i]) continue
      if ((j === i - 1 && s.c + s.span === i) || (j === i + 1 && s.c === i + 1)) return { j, s }
    }
    return null
  }
  const widen = (i: number, only?: number) => {
    const b = beside(i, only)
    if (!b) return false
    if (bottom[i] < b.s.top) reach(i, b.s.top)
    if (bottom[i] !== b.s.top) return false
    if (b.j === i - 1) b.s.span += 1
    else {
      b.s.c = i
      b.s.span += 1
    }
    last[i] = last[b.j]
    stack[i].push(last[i]!)
    bottom[i] = bottom[b.j]
    return true
  }
  const leftover = (i: number) => {
    const low = bottom[i] < bottom[i + 1] ? i : i + 1
    const room = Math.max(bottom[i], bottom[i + 1]) - bottom[low]
    if (!room) return 0
    const near = fits(room)
    if (near.length) return Math.min(...near.map((x) => Math.abs(room - size(x) - GAP)))
    if (stretchable(low)) return room
    return beside(low, low === i ? i + 1 : i) ? room / 2 : Infinity
  }
  const waited = new Map<string, number>()

  while (queue.length) {
    const e = queue.shift()!
    if (!wide(e)) {
      const c = bottom.indexOf(Math.min(...bottom))
      put(e, c, 1, bottom[c])
      continue
    }
    if (cols > 2 && !queue.some((x) => !wide(x))) {
      const top = Math.max(...bottom)
      for (let i = 0; i < cols; i++) if (!stretchable(i) || bottom[i] < top) reach(i, top)
      for (let i = 0; i < cols; i++) if (bottom[i] < top) widen(i)
      put(e, 0, cols, Math.max(...bottom))
      continue
    }
    let c = -1
    let cost = Infinity
    for (let i = 0; i + 1 < cols; i++) {
      const k = Math.max(bottom[i], bottom[i + 1]) + leftover(i)
      if (k < cost) {
        cost = k
        c = i
      }
    }
    const next = queue.findIndex((x) => !wide(x))
    const rest = c < 0 ? Infinity : leftover(c)
    if (next >= 0 && (c < 0 || (rest > 96 && (waited.get(e.id) ?? 0) < 2))) {
      waited.set(e.id, (waited.get(e.id) ?? 0) + 1)
      const [x] = queue.splice(next, 1)
      queue.unshift(e)
      const k = bottom.indexOf(Math.min(...bottom))
      put(x, k, 1, bottom[k])
      continue
    }
    if (c < 0) c = 0
    for (;;) {
      const top = Math.max(bottom[c], bottom[c + 1])
      const low = bottom[c] < bottom[c + 1] ? c : c + 1
      const room = top - bottom[low]
      const near = fits(room)
      if (!room || !near.length) break
      const best = near.reduce((a, b) => (Math.abs(room - size(b) - GAP) < Math.abs(room - size(a) - GAP) - 24 ? b : a))
      queue.splice(queue.indexOf(best), 1)
      put(best, low, 1, bottom[low])
    }
    for (let round = 0; round < 3 && bottom[c] !== bottom[c + 1]; round++) {
      const top = Math.max(bottom[c], bottom[c + 1])
      for (const i of [c, c + 1]) {
        reach(i, top)
        if (bottom[i] < top) widen(i, i === c ? c + 1 : c)
      }
    }
    put(e, c, 2, Math.max(bottom[c], bottom[c + 1]))
  }
  const end = Math.max(...bottom)
  for (let i = 0; i < cols; i++) reach(i, end)
  for (let i = 0; i < cols; i++) if (bottom[i] < end) widen(i)
  return slots
}

const spring = { type: 'spring', stiffness: 380, damping: 38 } as const

export function Gallery() {
  const [lens, setLens] = useState<Lens>('family')
  const [value, setValue] = useState('all')
  useEffect(() => {
    const go = (e: Event) => {
      setLens('family')
      setValue((e as CustomEvent<string>).detail)
      document.getElementById('library')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    }
    window.addEventListener(FAMILY_EVENT, go)
    return () => window.removeEventListener(FAMILY_EVENT, go)
  }, [])
  const shown = arrange(ENTRIES.filter((e) => value === 'all' || (lens === 'family' ? e.category === value : e.feel.includes(value as Feel))))
  const [two, three] = LAYOUTS.map((l) => best(shown, l.cols, l.col, l.pair))
  return (
    <div>
      <Filters
        lens={lens}
        value={value}
        onLens={(l) => {
          setLens(l)
          setValue('all')
        }}
        onChange={setValue}
      />
      <LayoutGroup>
        <div className="@container mt-6 grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2 md:auto-rows-[4px] md:gap-y-0 xl:grid-cols-3">
          {shown.map((e) => (
            <Card key={e.id} e={e} at={[two.get(e.id)!, three.get(e.id)!]} />
          ))}
        </div>
      </LayoutGroup>
    </div>
  )
}

type Lens = 'family' | 'feel'

function Filters({ lens, value, onLens, onChange }: { lens: Lens; value: string; onLens: (l: Lens) => void; onChange: (v: string) => void }) {
  const plate = useId()
  return (
    <div className="flex items-center gap-3">
      <div role="radiogroup" aria-label="Browse by" className="flex h-9 shrink-0 items-center rounded-full bg-card p-1">
        {(['family', 'feel'] as const).map((l) => (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={lens === l}
            onClick={() => onLens(l)}
            className={`ring-focus relative h-7 rounded-full px-3 text-footnote font-medium capitalize transition-colors duration-200 ${lens === l ? 'text-ink' : 'text-ink-3 hover:text-ink-2'}`}
          >
            {lens === l && <motion.span layoutId={plate} className="absolute inset-0 rounded-full bg-plate shadow-raised" transition={spring} />}
            <span className="relative">{l}</span>
          </button>
        ))}
      </div>
      <span aria-hidden className="h-5 w-px shrink-0 bg-line-strong" />
      <div className="relative min-w-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={lens} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8, transition: { duration: 0.12 } }} transition={{ duration: 0.22, ease: [0.2, 0.9, 0.25, 1] }}>
            <Families lens={lens} value={value} onChange={onChange} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function Families({ lens, value, onChange }: { lens: Lens; value: string; onChange: (v: string) => void }) {
  const id = useId()
  const groups = lens === 'family' ? CATEGORIES.map((c) => ({ id: c.id, name: c.name, n: ENTRIES.filter((e) => e.category === c.id).length })) : FEELS.map((f) => ({ id: f.id, name: f.name, n: ENTRIES.filter((e) => e.feel.includes(f.id)).length }))
  const all = [{ id: 'all', name: 'All', n: ENTRIES.length }, ...groups]
  return (
    <div role="radiogroup" aria-label={lens === 'family' ? 'Family' : 'Feel'} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" style={{ scrollbarWidth: 'none' }}>
      {all.map((f) => {
        const on = f.id === value
        return (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(f.id)}
            className={`ring-focus relative flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-callout transition-colors duration-200 ${on ? 'text-surface' : 'text-ink-2 hover:text-ink'}`}
          >
            {on && <motion.span layoutId={id} className="absolute inset-0 rounded-full bg-ink" transition={spring} />}
            <span className="relative">{f.name}</span>
            <span className={`tnum relative flex font-mono text-caption transition-colors duration-200 ${on ? 'text-surface/60' : 'text-ink-3'}`}>
              <RollingText text={String(f.n)} />
            </span>
          </button>
        )
      })}
    </div>
  )
}

const best = (order: Entry[], cols: number, col: number, pair: number) => {
  const tail = Math.min(10, order.length)
  const head = order.slice(0, order.length - tail)
  const end = order.slice(order.length - tail)
  const tries = [order]
  for (let k = 1; k < tail; k++) tries.push([...head, ...end.slice(k), ...end.slice(0, k)])
  tries.push([...head, ...[...end].reverse()])
  let pick = pack(order, cols, col, pair)
  let worst = Infinity
  for (const t of tries) {
    const slots = pack(t, cols, col, pair)
    const w = Math.max(0, ...[...slots.values()].map((x) => x.h - x.base))
    if (w < worst) {
      worst = w
      pick = slots
    }
  }
  return pick
}

const area = (s: Slot) => ({ col: `${s.c + 1} / span ${s.span}`, row: `${s.top / ROW + 1} / span ${s.h / ROW}` })

function Card({ e, at }: { e: Entry; at: [Slot, Slot] }) {
  const box = useRef<HTMLDivElement>(null)
  const near = useNear(box)
  const Demo = SPOTS[e.id] ?? DEMOS[e.id]
  const [two, three] = at.map(area)
  const [hover, setHover] = useState(false)

  return (
    <motion.article
      layout="position"
      layoutId={e.id}
      transition={{ layout: spring }}
      className="group/card relative md:[grid-column:var(--c2)] md:[grid-row:var(--r2)] xl:[grid-column:var(--c3)] xl:[grid-row:var(--r3)]"
      style={{ ['--c2' as string]: two.col, ['--r2' as string]: two.row, ['--c3' as string]: three.col, ['--r3' as string]: three.row }}
    >
      <div
        ref={box}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        className="relative h-[var(--fluid)] overflow-hidden rounded-[32px] bg-card md:h-full shadow-[inset_0_0_0_1px_light-dark(transparent,var(--line))]"
        style={{ ['--fluid' as string]: fluid(e.id) }}
      >
        <Invite box={box} active={near && !hover} />
        {isProComponent(e.id) && <ProTag className="pointer-events-none absolute right-3.5 top-3.5 z-10" />}
        {near && (
          <motion.div className="absolute inset-0" initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.2, 0.9, 0.25, 1] }}>
            {e.bleed ? (
              <Demo />
            ) : (
              <Fit pad={PAD} max={1} min={MIN_ZOOM}>
                <Demo />
              </Fit>
            )}
          </motion.div>
        )}
        <Link
          href={`/components/${e.id}`}
          className="ring-focus group/name absolute bottom-3.5 left-3.5 flex h-9 translate-y-1.5 items-center gap-2 rounded-full bg-surface/85 pl-3.5 pr-3 text-footnote font-medium text-ink opacity-0 shadow-border backdrop-blur transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.2,0.9,0.25,1)] focus-visible:translate-y-0 focus-visible:opacity-100 group-hover/card:translate-y-0 group-hover/card:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100"
        >
          {e.name}
          <ArrowRight size={12} className="text-ink-3 transition-transform duration-200 group-hover/name:translate-x-0.5" />
        </Link>
      </div>
    </motion.article>
  )
}

function Invite({ box, active }: { box: RefObject<HTMLDivElement | null>; active: boolean }) {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null)
  const [fine] = useState(() => typeof window !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches)
  useEffect(() => {
    if (!active || !fine) return
    const find = () => {
      const b = box.current
      const el = b?.querySelector<HTMLElement>('[data-invite]')
      if (!b || !el) return setAt(null)
      const r = el.getBoundingClientRect()
      const c = b.getBoundingClientRect()
      if (!r.width || r.bottom < c.top || r.top > c.bottom) return setAt(null)
      setAt({ x: Math.round(r.right - c.left - Math.min(16, r.width * 0.2)), y: Math.round(r.bottom - c.top - Math.min(12, r.height * 0.3)) })
    }
    const first = window.setTimeout(find, 2200)
    const again = window.setInterval(find, 1400)
    return () => {
      clearTimeout(first)
      clearInterval(again)
    }
  }, [active, fine, box])

  return (
    <AnimatePresence>
      {active && fine && at && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute z-20"
          initial={{ opacity: 0, left: at.x + 16, top: at.y + 14 }}
          animate={{ opacity: 1, left: at.x, top: at.y }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          transition={{ left: { type: 'spring', stiffness: 160, damping: 22 }, top: { type: 'spring', stiffness: 160, damping: 22 }, opacity: { duration: 0.4 } }}
        >
          <motion.span className="absolute -left-3 -top-3 size-6 rounded-full border border-[color-mix(in_oklch,var(--ink)_35%,transparent)]" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: [0.4, 1.5], opacity: [0.55, 0] }} transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 2.5, delay: 1.15, ease: 'easeOut' }} />
          <motion.svg width="17" height="19" viewBox="0 0 16 18" className="block drop-shadow-[0_2px_3px_rgb(0_0_0/0.25)]" style={{ originX: 0, originY: 0 }} animate={{ scale: [1, 0.86, 1] }} transition={{ duration: 0.36, repeat: Infinity, repeatDelay: 3.24, delay: 1 }}>
            <path d="M1.5 1.5v13.2l3.6-3.4 2.4 5.2 2.4-1.1-2.3-5.1h5z" fill="var(--ink)" stroke="var(--surface)" strokeWidth="1.3" strokeLinejoin="round" />
          </motion.svg>
        </motion.span>
      )}
    </AnimatePresence>
  )
}
