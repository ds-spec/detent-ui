'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { tap } from '@/lab/lib/feel'
import { Orb } from '@/lab/ui/Orb'
import { ArrowRight } from '@/lab/blocks/kit/icons'
import { useDirector } from '@/lab/blocks/kit/director'
import { accentVars } from '@/lab/blocks/kit/props'
import type { BlockProps } from '@/lab/blocks/kit/props'
import { QUOTES, STORIES } from './content'
import type { Short, Story } from './content'
import { ease, press } from '@/lab/lib/motion'

const DWELL = 7600

export type TestimonialsProps = BlockProps & {
  product?: string
  eyebrow?: string
  title?: [string, string]
  stories?: Story[]
  quotes?: Short[]
}

export function Testimonials({
  autoplay = true,
  accent,
  product = 'Detent',
  eyebrow = 'Customers',
  title = ['Teams that handed it the queue,', 'and got their week back.'],
  stories: given,
  quotes = QUOTES,
  className = '',
}: TestimonialsProps) {
  const stories = useMemo(() => given ?? STORIES.map((s) => ({ ...s, quote: s.quote.replaceAll('Detent', product) })), [given, product])
  const [at, setAt] = useState(0)
  const [run, setRun] = useState(0)
  const [handed, setHanded] = useState(!autoplay)
  const director = useDirector(
    async (wait) => {
      await wait(DWELL)
      setAt((a) => (a + 1) % stories.length)
      setRun((r) => r + 1)
    },
    autoplay,
    () => setHanded(true),
  )
  const show = (i: number) => {
    setAt(i)
    setRun((r) => r + 1)
  }
  const cell = (on: boolean) => `col-start-1 row-start-1 transition-[opacity,visibility] ${on ? 'duration-300' : 'invisible opacity-0 duration-150'}`

  return (
    <div className={`pro-app @container h-full w-full overflow-y-auto overflow-x-hidden bg-surface text-ink [scrollbar-width:thin] ${className}`} style={accentVars(accent)}>
      <section className="mx-auto max-w-[1180px] px-5 py-14 @3xl:px-8 @3xl:py-20">
        <header>
          <p className="text-footnote font-medium text-[var(--accent-ink)]">{eyebrow}</p>
          <h2 className="mt-3 text-[clamp(28px,4.2cqi,44px)] font-normal leading-[1.06] tracking-[-0.04em] text-ink">
            {title[0]}
            <span className="block text-[color-mix(in_oklch,var(--ink)_42%,transparent)]">{title[1]}</span>
          </h2>
        </header>

        <figure className="mt-10 grid gap-8 rounded-[24px] bg-[var(--card)] p-6 shadow-[0_0_0_1px_var(--line)] @3xl:mt-12 @3xl:p-10 @4xl:grid-cols-[minmax(0,1fr)_248px] @4xl:gap-12">
          <div className="min-w-0">
            <span aria-hidden className="block h-7 text-[60px] leading-[0.9] text-[var(--accent)]">
              “
            </span>
            <blockquote className="mt-3 grid text-[clamp(20px,2.5cqi,27px)] leading-[1.32] tracking-[-0.022em] text-ink">
              {stories.map((s, i) => (
                <p key={s.id} aria-hidden={i !== at} className={cell(i === at)}>
                  {i === at ? <Writing key={run} text={s.quote} delay={run ? 180 : 500} /> : <Plain text={s.quote} />}
                </p>
              ))}
            </blockquote>
            <figcaption className="mt-7 grid">
              {stories.map((s, i) => (
                <span key={s.id} aria-hidden={i !== at} className={`${cell(i === at)} flex items-center gap-3`}>
                  <Orb seed={s.name} hue={s.hue} size={36} />
                  <span>
                    <span className="block text-callout font-medium text-ink">{s.name}</span>
                    <span className="block text-footnote text-ink-3">
                      {s.role}, {s.company}
                    </span>
                  </span>
                </span>
              ))}
            </figcaption>
          </div>

          <div className="flex flex-col justify-between gap-6">
            <div className="grid">
              {stories.map((s, i) => (
                <div key={s.id} aria-hidden={i !== at} className={`${cell(i === at)} rounded-[16px] bg-surface p-5 shadow-raised`}>
                  <p className="text-footnote text-ink-3">{s.metric}</p>
                  <div className="mt-4 flex items-end gap-3">
                    <span>
                      <span className="block text-caption text-ink-3">Before</span>
                      <span className="tnum block text-[20px] leading-tight tracking-[-0.02em] text-ink-3 line-through decoration-[color-mix(in_oklch,var(--ink)_30%,transparent)]">{s.before}</span>
                    </span>
                    <ArrowRight size={15} className="mb-1.5 shrink-0 text-ink-3" />
                    <span>
                      <span className="block text-caption font-medium text-[var(--accent-ink)]">With {product}</span>
                      <motion.span key={i === at ? run : 'rest'} className="tnum block text-[34px] leading-none tracking-[-0.04em] text-ink" initial={i === at ? { opacity: 0, y: 6 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25, ease: ease.out }}>
                        {s.after}
                      </motion.span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div role="radiogroup" aria-label="Customer" className="flex gap-1.5" onPointerDownCapture={director.onPointerDownCapture} onPointerUpCapture={director.onPointerUpCapture} onKeyDownCapture={director.onKeyDownCapture}>
              {stories.map((s, i) => (
                <motion.button whileTap={press}
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={i === at}
                  aria-label={`${s.name}, ${s.company}`}
                  title={s.name}
                  onKeyDown={(e) => {
                    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
                    if (!d) return
                    e.preventDefault()
                    const n = (at + d + stories.length) % stories.length
                    show(n)
                    ;(e.currentTarget.parentElement?.children[n] as HTMLElement | undefined)?.focus()
                  }}
                  tabIndex={i === at ? 0 : -1}
                  onClick={() => (tap(), i !== at && show(i))}
                  className="ring-focus relative grid size-10 place-items-center rounded-full"
                >
                  <svg aria-hidden viewBox="0 0 40 40" className="absolute inset-0 size-full -rotate-90">
                    <circle cx="20" cy="20" r="18.75" fill="none" stroke="var(--line-strong)" strokeWidth="1.5" className={`transition-opacity ${i === at ? '' : 'opacity-0'}`} />
                    {i === at && <motion.circle key={handed ? 'held' : run} cx="20" cy="20" r="18.75" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" initial={{ pathLength: handed ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: handed ? 0 : DWELL / 1000, ease: 'linear' }} />}
                  </svg>
                  <Orb seed={s.name} hue={s.hue} size={28} className={`transition-[filter,opacity] duration-300 ${i === at ? '' : 'opacity-70 grayscale-[0.5] hover:opacity-100 hover:grayscale-0'}`} />
                </motion.button>
              ))}
            </div>
          </div>
        </figure>

        <ul className="mt-3 columns-1 gap-3 @3xl:columns-2 @5xl:columns-3">
          {quotes.map((q) => (
            <li key={q.name} className="mb-3 break-inside-avoid rounded-[20px] bg-[var(--card)] p-5 shadow-[0_0_0_1px_var(--line)]">
              <p className="text-callout leading-[22px] text-ink">“{q.quote}”</p>
              <div className="mt-5 flex items-center gap-2.5">
                <Orb seed={q.name} hue={q.hue} size={28} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-footnote font-medium text-ink">{q.name}</span>
                  <span className="block truncate text-caption text-ink-3">
                    {q.role}, {q.company}
                  </span>
                </span>
                <span className="chip tnum shrink-0 rounded-full px-2 text-caption font-medium leading-6 text-[var(--accent-ink)] [--chip:var(--accent)]">{q.result}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

type Piece = { t: string; mark: boolean }
const pieces = (q: string): Piece[] =>
  q
    .split(/(\{[^}]*\})/)
    .filter(Boolean)
    .map((s) => (s.startsWith('{') ? { t: s.slice(1, -1), mark: true } : { t: s, mark: false }))

const highlight = (on: boolean): CSSProperties => ({
  color: 'inherit',
  backgroundColor: 'transparent',
  backgroundImage: 'linear-gradient(color-mix(in oklch, var(--accent) 15%, transparent), color-mix(in oklch, var(--accent) 15%, transparent))',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: '0 82%',
  backgroundSize: on ? '100% 0.62em' : '0% 0.62em',
  transition: 'background-size 1100ms cubic-bezier(0.6, 0, 0.3, 1)',
})

function Writing({ text, delay = 0, pace = 30 }: { text: string; delay?: number; pace?: number }) {
  const reduce = useReducedMotion()
  const ps = pieces(text)
  const total = ps.reduce((n, p) => n + p.t.split(/\s+/).filter(Boolean).length, 0)
  const [shown, setShown] = useState(reduce ? total : 0)
  useEffect(() => {
    if (shown >= total) return
    const t = setTimeout(() => setShown(shown + 1), shown === 0 ? delay : pace)
    return () => clearTimeout(t)
  }, [shown, total, delay, pace])
  let w = 0
  return ps.map((p, k) => {
    const body = p.t
      .split(/(\s+)/)
      .filter(Boolean)
      .map((tok, j) => {
        if (/^\s+$/.test(tok)) return tok
        const i = w++
        return (
          <span key={j} className={i < shown ? 'word-in ai-warm' : 'invisible'}>
            {tok}
          </span>
        )
      })
    if (!p.mark) return <span key={k}>{body}</span>
    return (
      <mark key={k} style={highlight(shown >= w)}>
        {body}
      </mark>
    )
  })
}

function Plain({ text }: { text: string }) {
  return pieces(text).map((p, k) => (p.mark ? <mark key={k} style={highlight(true)}>{p.t}</mark> : <span key={k}>{p.t}</span>))
}
