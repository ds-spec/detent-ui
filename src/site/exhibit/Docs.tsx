'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { DOCS } from '@/catalog/docs'
import { EXAMPLE_VIEWS } from '@/catalog/examples-live'
import { wellOf } from '../wells'
import { BTN } from '../shell/side'
import type { Tone } from '../home/lights'

/** One line under the name: what it is in the words people search, then what makes it this one. */
export function Lede({ id }: { id: string }) {
  const d = DOCS[id]
  if (!d) return null
  return (
    <p className="mt-2.5 max-w-[600px] text-[15px] leading-[1.5] tracking-[-0.005em] text-ink-3">
      <span className="text-ink">{d.lede[0]}</span> {d.lede[1]}
    </p>
  )
}

/**
 * Worked examples in one stage, styled like the demo above it: a tab per example, the
 * live view in the well, its sentence under it. Every title and sentence is in the HTML;
 * the live view mounts when the stage scrolls near.
 */
export function Examples({ id, tone }: { id: string; tone: Tone }) {
  const d = DOCS[id]
  const [at, setAt] = useState(0)
  const plate = useId()
  if (!d?.examples.length) return null
  const x = d.examples[Math.min(at, d.examples.length - 1)]
  return (
    <section aria-labelledby="examples" className="mt-12 min-w-0 max-w-full">
      <h2 id="examples" className="text-[18px] font-medium tracking-[-0.015em] text-ink">Examples</h2>
      <p className="mt-1 text-[14px] text-ink-3">The same piece, set up for other jobs.</p>
      <div className="relative mt-4 min-w-0 rounded-[20px] bg-[var(--mount)] p-[5px] max-sm:-mx-3">
        <div className="flex h-[34px] min-w-0 items-center overflow-x-auto pr-0.5 [scrollbar-width:none]">
          <span role="tablist" aria-label="Examples" className={`flex h-[34px] shrink-0 items-center rounded-[11px] p-[3px] ${BTN.track}`}>
            {d.examples.map((e, i) => (
              <button
                key={e.key}
                type="button"
                role="tab"
                aria-selected={i === at}
                onClick={() => setAt(i)}
                className={`ring-focus relative flex h-full items-center whitespace-nowrap rounded-[8px] px-3 text-[13px] font-medium transition-[color,transform] duration-150 active:scale-[0.97] ${i === at ? 'text-ink' : 'text-ink-3 hover:text-ink-2'}`}
              >
                {i === at && <motion.span layoutId={plate} className={`absolute inset-0 rounded-[8px] ${BTN.plate}`} transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}
                <span className="relative">{e.title}</span>
              </button>
            ))}
          </span>
        </div>
        <div className="mt-[5px] flex min-h-[420px] min-w-0 items-center justify-center overflow-hidden rounded-[15px] px-3 py-8 text-ink shadow-[0_0_0_.5px_var(--line)] sm:min-h-[480px] sm:px-10 sm:py-10" style={{ background: wellOf(tone) }}>
          <Near>
            <Live key={x.key} id={id} k={x.key} wide={d.cols === 1} zoom={d.zoom} />
          </Near>
        </div>
      </div>
      {d.examples.map((e, i) => (
        <p key={e.key} className={`mt-3 max-w-[640px] px-1 text-[14px] leading-[1.55] text-ink-3 ${i === at ? '' : 'hidden'}`}>
          <span className="text-ink">{e.title}.</span> <Rich text={e.line} />
        </p>
      ))}
    </section>
  )
}

/** `name` in docs text reads as code; everything else stays prose. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith('`') && part.endsWith('`') ? (
          <code key={i} className="rounded-[5px] bg-[var(--mount)] px-1 py-px font-mono text-[12.5px] text-ink-2">
            {part.slice(1, -1)}
          </code>
        ) : (
          part
        ),
      )}
    </>
  )
}

function Live({ id, k, wide, zoom }: { id: string; k: string; wide?: boolean; zoom?: number }) {
  const View = EXAMPLE_VIEWS[`${id}:${k}`]
  if (!View) return <p className="text-caption text-ink-3">This example plays with the Pro source checked out.</p>
  return (
    <div className={`w-full min-w-0 ${wide ? 'max-w-[720px]' : 'max-w-[600px]'}`} style={zoom ? { zoom } : undefined}>
      <View />
    </div>
  )
}

/** Holds a live view back until it is about a screen away, so the page's first load stays as light as before. */
function Near({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || near) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '600px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [near])
  return (
    <div ref={ref} className="flex w-full min-w-0 justify-center">
      {near ? children : null}
    </div>
  )
}

/** Questions, closed by default, in the Pro page's style. FAQPage JSON-LD for them is written by the server page. */
export function Questions({ id }: { id: string }) {
  const d = DOCS[id]
  if (!d?.faq.length) return null
  return (
    <section aria-labelledby="questions" className="mt-12">
      <h2 id="questions" className="text-[18px] font-medium tracking-[-0.015em] text-ink">Questions</h2>
      <div className="mt-3">
        {d.faq.map(([q, a]) => (
          <details key={q} className="group/q shadow-[inset_0_1px_0_var(--line)] last:shadow-[inset_0_1px_0_var(--line),inset_0_-1px_0_var(--line)]">
            <summary className="ring-focus flex cursor-pointer list-none items-center justify-between gap-6 rounded-[6px] py-4 text-[15px] tracking-[-0.01em] text-ink transition-colors duration-150 hover:text-ink-2 [&::-webkit-details-marker]:hidden">
              {q}
              <span aria-hidden className="relative size-3 shrink-0 text-ink-3">
                <span className="absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 rounded-full bg-current" />
                <span className="absolute inset-y-0 left-1/2 w-[1.5px] -translate-x-1/2 rounded-full bg-current transition-transform duration-200 group-open/q:scale-y-0" />
              </span>
            </summary>
            <p className="max-w-[640px] pb-5 text-[14px] leading-[1.6] text-ink-3">
              <Rich text={a} />
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}
