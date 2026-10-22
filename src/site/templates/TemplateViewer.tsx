'use client'

import { memo, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Expand, Moon, Refresh, Sun } from '@/lab/icons'
import { useTheme } from '@/lab/lib/hooks'
import { tap } from '@/lab/lib/feel'
import { TemplateBody } from '@/templates/registry'
import { template } from '@/templates/meta'
import { Code } from '../browser/Code'
import { Modes, Rule, Tool } from '../exhibit/Exhibit'
import { Install } from '../parts'
import { Desk } from '../blocks/BlockViewer'
import { ProTag } from '../blocks/ProTag'

/** The template, scrolling in its own window, kept out of the viewer's renders so resizing stays smooth. */
const Page = memo(function Page({ id, scroller, onScroll, theme }: { id: string; scroller: RefObject<HTMLDivElement | null>; onScroll: () => void; theme?: 'light' | 'dark' }) {
  return (
    <div ref={scroller} onScroll={onScroll} className="h-full overflow-y-auto [scrollbar-width:thin]">
      <TemplateBody id={id} theme={theme} />
    </div>
  )
})

/**
 * A template on the desk: the whole site live in a browser window you can resize from a phone's
 * width to the desk's, scroll, switch to dark, or read as code. Below, every section in order;
 * pick one and the page on the desk scrolls to it, and the list follows the page as you scroll.
 * An app fills the window instead of scrolling, so its parts are listed rather than jumped to.
 */
export function TemplateViewer({ id }: { id: string }) {
  const t = template(id)!
  const app = t.form === 'app'
  const reduce = useReducedMotion()
  const [mode, setMode] = useState<'preview' | 'code'>('preview')
  const [run, setRun] = useState(0)
  const [present, setPresent] = useState(false)
  const page = useTheme()
  const [stageTheme, setStageTheme] = useState<'light' | 'dark' | null>(null)
  const shown = stageTheme ?? page
  const scroller = useRef<HTMLDivElement>(null)
  const [at, setAt] = useState(t.parts[0].anchor)

  useEffect(() => {
    if (!present) return
    const on = (e: KeyboardEvent) => e.key === 'Escape' && setPresent(false)
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [present])

  // Which section is at the top of the window, so the list can say where you are. Made once, so
  // the page it's handed to never re-renders because of it.
  const [onScroll] = useState(() => () => {
    const box = scroller.current
    if (!box) return
    const top = box.getBoundingClientRect().top + 120
    let here = t.parts[0].anchor
    for (const p of t.parts) {
      const el = box.querySelector<HTMLElement>(`#${p.anchor}`)
      if (el && el.getBoundingClientRect().top <= top) here = p.anchor
    }
    setAt((a) => (a === here ? a : here))
  })

  const jump = (anchor: string) => {
    tap()
    setMode('preview')
    const box = scroller.current
    const el = box?.querySelector<HTMLElement>(`#${anchor}`)
    if (!box || !el) return
    // Under the page's own sticky nav, which is 64px tall.
    const y = anchor === t.parts[0].anchor ? 0 : el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 64
    box.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' })
    document.querySelector('[data-desk]')?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <main className="mx-auto max-w-[1360px] px-5 pb-24 sm:px-6">
      <header className="pt-8 sm:pt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-footnote text-ink-3">
            <ProTag />
            <span>{app ? 'App' : 'Landing page'}</span>
            <span aria-hidden className="size-[3px] rounded-full bg-ink-3/60" />
            <span>
              {t.parts.length} {app ? 'parts' : 'sections'}
            </span>
            <span aria-hidden className="size-[3px] rounded-full bg-ink-3/60" />
            <span>Light and dark</span>
            <span aria-hidden className="size-[3px] rounded-full bg-ink-3/60" />
            <span>Fits any width</span>
          </p>
          <Link href="/templates" className="ring-focus rounded-[6px] text-footnote text-ink-3 transition-colors hover:text-ink">
            All templates
          </Link>
        </div>
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="min-w-0 text-[clamp(32px,3.8vw,48px)] font-normal leading-[1.08] tracking-[-0.045em] text-ink">
            {t.name}
            <span className="block text-quiet">For {t.suits}.</span>
          </h1>
          <div className="w-full shrink-0 sm:w-[400px] lg:w-[460px]">
            <Install id={`template-${t.id}`} free={false} />
          </div>
        </div>
      </header>

      <Desk title={t.window} chrome="browser" run={run} mode={mode} theme={stageTheme} present={present} onExit={() => setPresent(false)} view={<Page key={run} id={t.id} scroller={scroller} onScroll={onScroll} theme={app ? shown : undefined} />} code={<Code id={`template-${t.id}`} />} />

      <div className="mt-5 flex justify-center">
        <div className="flex items-center gap-0.5 rounded-full bg-surface p-1 shadow-float">
          <Modes mode={mode} setMode={setMode} pro />
          <Rule />
          <Tool label={shown === 'dark' ? 'View in light' : 'View in dark'} onClick={() => setStageTheme(stageTheme ? null : page === 'dark' ? 'light' : 'dark')}>
            {shown === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </Tool>
          <Tool label={app ? 'Start over' : 'Back to the top'} onClick={() => (setRun((r) => r + 1), setAt(t.parts[0].anchor))}>
            <motion.span key={run} className="flex" initial={{ rotate: -180 }} animate={{ rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
              <Refresh size={16} />
            </motion.span>
          </Tool>
          <Tool className="hidden sm:block" label="Full screen" keys="Esc" onClick={() => setPresent(true)}>
            <Expand size={16} />
          </Tool>
          <Rule />
          <a
            href={`/templates/${t.id}/live`}
            target="_blank"
            rel="noreferrer"
            aria-label={app ? 'Open the app in a new tab' : 'Open the page in a new tab'}
            className="ring-focus flex h-9 items-center gap-1.5 rounded-full px-3 text-footnote font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink sm:px-3.5"
          >
            <span className="hidden sm:inline">{app ? 'Open the app' : 'Open the page'}</span>
            <ArrowRight size={14} className="-rotate-45" />
          </a>
        </div>
      </div>

      <section aria-labelledby="inside" className="mt-24 grid gap-x-16 gap-y-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div>
          <h2 id="inside" className="text-title text-ink">
            What’s inside
          </h2>
          <p className="mt-2 max-w-[300px] text-callout text-ink-3">{app ? 'Every part of the app, and all of it works on the desk above.' : 'Every section, top to bottom. Pick one and the page on the desk takes you there.'}</p>
        </div>
        <ul className="grid gap-x-12 sm:grid-cols-2">
          {t.parts.map((p) => {
            if (app)
              return (
                <li key={p.anchor} className="flex flex-col gap-1 py-4 shadow-[inset_0_1px_0_var(--line)]">
                  <span className="text-headline text-ink-2">{p.name}</span>
                  <span className="text-callout text-ink-3">{p.line}</span>
                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                    {p.uses.map((u) => (
                      <span key={u} className="rounded-full px-2 text-caption leading-5 text-ink-3 shadow-[inset_0_0_0_1px_var(--line)]">
                        {u}
                      </span>
                    ))}
                  </span>
                </li>
              )
            const here = p.anchor === at && mode === 'preview'
            return (
              <li key={p.anchor} className="shadow-[inset_0_1px_0_var(--line)]">
                <button type="button" onClick={() => jump(p.anchor)} aria-current={here ? 'location' : undefined} className="ring-focus group/part flex w-full flex-col gap-1 rounded-[6px] py-4 text-left">
                  <span className="flex items-center gap-2">
                    <span className={`size-1.5 rounded-full bg-[var(--accent)] transition-[opacity,transform] duration-300 ${here ? '' : 'scale-50 opacity-0'}`} />
                    <span className={`text-headline transition-colors ${here ? 'text-ink' : 'text-ink-2 group-hover/part:text-ink'}`}>{p.name}</span>
                    <span className="flex-1" />
                    <ArrowRight size={14} className="text-ink-3 opacity-0 transition-[opacity,transform] duration-200 group-hover/part:translate-x-0.5 group-hover/part:opacity-100" />
                  </span>
                  <span className="pl-3.5 text-callout text-ink-3">{p.line}</span>
                  <span className="mt-1.5 flex flex-wrap gap-1.5 pl-3.5">
                    {p.uses.map((u) => (
                      <span key={u} className="rounded-full px-2 text-caption leading-5 text-ink-3 shadow-[inset_0_0_0_1px_var(--line)]">
                        {u}
                      </span>
                    ))}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="details" className="mt-24 grid gap-x-16 gap-y-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <h2 id="details" className="text-title text-ink">
          The details
        </h2>
        <ul className="grid gap-x-12 sm:grid-cols-2">
          {t.details.map((d, n) => (
            <li key={n} className="py-4 text-body text-ink-2 shadow-[inset_0_1px_0_var(--line)]">
              {d}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
