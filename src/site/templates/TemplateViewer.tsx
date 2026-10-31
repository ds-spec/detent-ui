'use client'

import { memo, useEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Check, Copy, Expand, Moon, Refresh, Sun } from '@/lab/icons'
import { useTheme } from '@/lab/lib/hooks'
import { tap } from '@/lab/lib/feel'
import { TemplateBody } from '@pro'
import { TEMPLATES, template } from '@/catalog/templates'
import { START } from '@/catalog/template-start'
import type { Step } from '@/catalog/template-start'
import { Code } from '../browser/Code'
import { Modes, Rule, Tool } from '../exhibit/Exhibit'
import { CopyCommand } from '../parts'
import { Install } from '../Install'
import { Desk } from '../blocks/BlockViewer'
import { ProTag } from '../blocks/ProTag'
import { Rail } from '../exhibit/Rail'
import { DownloadStarter } from './Download'
import { Pager } from '../shell/Pager'
import { Shell, Trail } from '../shell/Shell'
import { useWant } from '../shell/want'
import { TEMPLATE_RAIL } from './rail'

/** The template, scrolling in its own window, kept out of the viewer's renders so resizing stays smooth. */
const Page = memo(function Page({ id, scroller, onScroll, theme }: { id: string; scroller: RefObject<HTMLDivElement | null>; onScroll: () => void; theme?: 'light' | 'dark' }) {
  return (
    <div ref={scroller} onScroll={onScroll} className="h-full overflow-y-auto [scrollbar-width:thin]">
      <TemplateBody id={id} theme={theme} />
    </div>
  )
})

/**
 * The templates' layout: the frame stays put and only what's in it changes. It holds the list of
 * templates and each template; the running app at /live is the one page with no frame at all.
 */
export function TemplateExhibit({ children }: { children: ReactNode }) {
  const [, , slug = '', own] = usePathname().split('/')
  const { id, go } = useWant(slug, '/templates')
  const t = template(id)
  if (own || (id && !t)) return children
  return (
    <Shell list={<Rail label="Templates" groups={TEMPLATE_RAIL} current={id} onPick={go} />} bar={<Trail steps={t ? ['Templates', t.name] : ['Templates']} />}>
      {t && <TemplateViewer key={t.id} id={t.id} go={go} />}
      {/* The list's page while it's the one open; a template's own part draws nothing. */}
      <div className="contents" style={{ display: id === slug ? undefined : 'none' }}>
        {children}
      </div>
    </Shell>
  )
}

/**
 * A template on the desk: the whole site live in a browser window you can resize from a phone's
 * width to the desk's, scroll, switch to dark, or read as code. Below, every section in order;
 * pick one and the page on the desk scrolls to it, and the list follows the page as you scroll.
 * An app fills the window instead of scrolling, so its parts are listed rather than jumped to.
 */
function TemplateViewer({ id, go }: { id: string; go: (id: string) => void }) {
  const t = template(id)!
  const app = t.form === 'app'
  const reduce = useReducedMotion()
  const place = TEMPLATES.findIndex((x) => x.id === id)
  const prev = TEMPLATES[(place - 1 + TEMPLATES.length) % TEMPLATES.length]
  const next = TEMPLATES[(place + 1) % TEMPLATES.length]
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
    <main className="mx-auto max-w-[1280px] px-4 pb-24 sm:px-8 lg:pb-16">
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
          {/* The list down the side does this on a laptop; below one, this is the way back. */}
          <Link href="/templates" className="ring-focus rounded-[6px] text-footnote text-ink-3 transition-colors hover:text-ink lg:hidden">
            All templates
          </Link>
        </div>
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between lg:flex-col lg:items-start xl:flex-row xl:items-end">
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
            className="ring-focus flex h-9 items-center gap-1.5 rounded-full px-3 text-footnote font-medium text-ink-2 transition-[background-color,color,transform] duration-150 hover:bg-surface-2 hover:text-ink active:scale-[0.97] sm:px-3.5"
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

      {START[t.id] && (
        <section aria-labelledby="start" className="mt-24 grid gap-x-16 gap-y-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div>
            <h2 id="start" className="text-title text-ink">
              Make it yours
            </h2>
            <p className="mt-2 max-w-[300px] text-callout text-ink-3">From install to your product, in the order you’d do it. Every file it names lands in your project as source.</p>
            {t.form === 'app' && <DownloadStarter id={t.id} name={t.name} />}
          </div>
          <ol>
            {START[t.id].map((step, i) => (
              <StartStep key={step.title} n={i + 1} step={step} />
            ))}
          </ol>
        </section>
      )}
      {TEMPLATES.length > 1 && !present && <Pager prev={{ name: prev.name, href: prev.id }} next={{ name: next.name, href: next.id }} onPick={go} />}
    </main>
  )
}

/** One step of making a template yours: its number, what to do and why, and the code, with the file it goes in. */
export function StartStep({ n, step }: { n: number; step: Step }) {
  const [copied, setCopied] = useState(false)
  const block = step.code?.includes('\n')
  const copy = () => {
    void navigator.clipboard?.writeText(step.code ?? '').catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }
  return (
    <li className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 py-6 shadow-[inset_0_1px_0_var(--line)]">
      <span className="tnum pt-0.5 font-mono text-[13px] text-ink-3">{n}</span>
      <div className="min-w-0">
        <p className="text-headline text-ink">{step.title}</p>
        <p className="mt-1 max-w-[640px] text-callout leading-[1.6] text-ink-3">{step.line}</p>
        {step.code && !block && (
          <div className="mt-4 max-w-[520px]">
            <CopyCommand command={step.code} fill />
          </div>
        )}
        {step.code && block && (
          <div className="mt-4 overflow-hidden rounded-[14px] bg-surface-2">
            <div className="flex h-10 items-center justify-between pl-4 pr-1.5 shadow-[inset_0_-1px_0_var(--line)]">
              <span className="truncate font-mono text-caption text-ink-3">{step.file}</span>
              <button type="button" onClick={copy} aria-label={copied ? 'Copied' : 'Copy'} className="ring-focus grid size-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-surface hover:text-ink">
                <span className="col-start-1 row-start-1 transition-opacity" style={{ opacity: copied ? 0 : 1 }}>
                  <Copy size={14} />
                </span>
                <span className="col-start-1 row-start-1 text-ok transition-opacity" style={{ opacity: copied ? 1 : 0 }}>
                  <Check size={14} />
                </span>
              </button>
            </div>
            <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[12.5px] leading-[1.7] text-ink-2 [scrollbar-width:thin]" translate="no">
              {step.code.trimEnd()}
            </pre>
          </div>
        )}
      </div>
    </li>
  )
}
