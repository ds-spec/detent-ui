'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BUILT } from '@/catalog/built'
import { recipe } from '@/catalog/recipes'
import { planPrompt } from '@/catalog/prompts'

const ease = [0.2, 0, 0, 1] as const
const SHEET = 'rounded-[18px] bg-surface shadow-[var(--card-edge)]'

export function Built() {
  const [at, setAt] = useState(0)

  useEffect(() => {
    const pick = () => {
      const want = new URLSearchParams(location.search).get('built')
      const i = BUILT.findIndex((b) => b.plan === want)
      if (i >= 0) setAt(i)
    }
    pick()
    window.addEventListener('popstate', pick)
    return () => window.removeEventListener('popstate', pick)
  }, [])

  const ex = BUILT[at]
  const plan = recipe(ex.plan)
  const prompt = plan ? planPrompt(ex.typed, plan) : ''

  return (
    <div>
      <div role="tablist" aria-label="Example" className="inline-flex max-w-full overflow-x-auto rounded-full bg-surface-2 p-0.5 [scrollbar-width:none]">
        {BUILT.map((b, i) => (
          <button
            key={b.plan}
            role="tab"
            aria-selected={i === at}
            onClick={() => setAt(i)}
            className={`ring-focus relative h-8 shrink-0 rounded-full px-3.5 text-[13px] transition-colors duration-150 pointer-coarse:h-9 ${i === at ? 'text-ink' : 'text-ink-3 hover:text-ink-2'}`}
          >
            {i === at && <motion.span layoutId="built-tab" className="absolute inset-0 rounded-full bg-surface shadow-raised" transition={{ duration: 0.25, ease }} />}
            <span className="relative">{b.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="flex flex-col gap-1.5 rounded-[24px] bg-surface-2 p-1.5 max-lg:order-last dark:bg-transparent dark:shadow-[inset_0_0_0_1px_var(--line)]">
          <p className="px-3 pb-0.5 pt-2 text-[12.5px] text-ink-3">You type</p>
          <div className={`${SHEET} px-4 py-3.5 text-[14px] text-ink`}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={ex.plan} className="block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {ex.typed}
              </motion.span>
            </AnimatePresence>
          </div>

          <p className="px-3 pb-0.5 pt-2 text-[12.5px] text-ink-3">Your agent gets</p>
          <div className={`${SHEET} relative h-[232px] overflow-hidden px-4 py-3.5`}>
            <pre className="whitespace-pre-wrap break-words font-sans text-[12px] leading-[1.6] text-ink-2">{prompt}</pre>
            <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 rounded-b-[18px]" style={{ background: 'linear-gradient(transparent, var(--surface))' }} />
          </div>

          <p className="px-3 pb-0.5 pt-2 text-[12.5px] text-ink-3">On the page</p>
          <div className={`${SHEET} px-4 py-3.5`}>
            <ul className="flex flex-wrap gap-1.5">
              {ex.pieces.map((p) => (
                <li key={p} className="inline-flex h-6 items-center rounded-full bg-surface-2 px-2.5 text-[12px] text-ink-2">
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12.5px] leading-[1.5] text-ink-3">{ex.note}</p>
          </div>
        </div>

        <figure className="min-w-0">
          <div className="overflow-hidden rounded-[18px] bg-surface shadow-[0_0_0_1px_var(--line),0_30px_60px_-30px_rgb(0_0_0/.25)]">
            <div className="flex h-9 items-center gap-1.5 border-b border-line px-3.5">
              <span className="size-2.5 rounded-full bg-surface-3" />
              <span className="size-2.5 rounded-full bg-surface-3" />
              <span className="size-2.5 rounded-full bg-surface-3" />
              <span className="mx-auto -translate-x-6 text-[11.5px] text-ink-3">{ex.url}</span>
            </div>
            <div className="relative aspect-[16/10]">
              <AnimatePresence initial={false}>
                <motion.div key={ex.plan} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease }}>
                  <img src={ex.shot.light} alt={`${ex.label} a coding agent built from the Detent Pro prompt`} width={1600} height={1000} loading="lazy" decoding="async" className="size-full object-cover object-top dark:hidden" />
                  <img src={ex.shot.dark} alt={`${ex.label} a coding agent built from the Detent Pro prompt`} width={1600} height={1000} loading="lazy" decoding="async" className="hidden size-full object-cover object-top dark:block" />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <figcaption className="mt-3 text-[12.5px] leading-[1.5] text-ink-3">Real output, unedited: a fresh Next.js app, the prompt pasted once into Claude Code.</figcaption>
        </figure>
      </div>
    </div>
  )
}
