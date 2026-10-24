'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useReducedMotion } from 'motion/react'
import { ENTRIES } from '@/catalog/meta'
import { BLOCKS } from '@/catalog/blocks'
import { installCommand, isProComponent } from '@/catalog/pro'
import { CopyCommand } from './parts'
import { readVisit, recordPage } from './visit'

type Part = { t: string; href?: string; ink?: boolean }
type Seen = { name: string; href: string; install: string }

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']
const PACE = 26

/** What a path was, if it's something you can take home. */
function seenAt(path: string): Seen | null {
  const [, area, id] = path.split('/')
  if (area === 'components') {
    const e = ENTRIES.find((x) => x.id === id)
    return e ? { name: e.name, href: path, install: installCommand(e.id, !isProComponent(e.id)) } : null
  }
  if (area === 'blocks') {
    const b = BLOCKS.find((x) => x.id === id)
    return b ? { name: b.name, href: path, install: installCommand(b.id, false) } : null
  }
  return null
}

function minutes(ms: number) {
  const m = Math.round(ms / 60000)
  if (m < 1) return 'under a minute'
  if (m === 1) return 'a minute'
  if (m < 60) return `${WORDS[m] ?? m} minutes`
  return m < 120 ? 'over an hour' : `${Math.floor(m / 60)} hours`
}

/** One sentence about this visit, from what was actually seen and measured. */
function compose(): { parts: Part[]; last: Seen | null } {
  const v = readVisit()
  const seen: Seen[] = []
  for (const p of v.pages) {
    const s = seenAt(p)
    if (s && !seen.some((x) => x.href === s.href)) seen.push(s)
  }
  const time = minutes(Date.now() - v.start)
  const cls = v.cls.toFixed(3)
  const still = v.cls < 0.005
  const parts: Part[] = []
  if (seen.length === 0) parts.push({ t: 'You’ve just arrived, and nothing has shifted under you yet: ' })
  else if (seen.length === 1) parts.push({ t: `You’ve spent ${time} with ` }, { t: seen[0].name, href: seen[0].href, ink: true }, { t: still ? ', and nothing has shifted under you: ' : ', and the layout has shifted ' })
  else {
    const named = seen.slice(-3)
    const more = seen.length - named.length
    parts.push({ t: `In ${time} you’ve looked at ` })
    named.forEach((s, i) => {
      if (i) parts.push({ t: i === named.length - 1 && !more ? ' and ' : ', ' })
      parts.push({ t: s.name, href: s.href, ink: true })
    })
    if (more) parts.push({ t: ` and ${WORDS[more] ?? more} more` })
    parts.push({ t: still ? ', and nothing has shifted under you: ' : ', and the layout has shifted ' })
  }
  parts.push({ t: cls, ink: true }, { t: still ? '.' : '. We’re on it.' })
  return { parts, last: seen[seen.length - 1] ?? null }
}

/**
 * The footer writes itself. When you reach it, it says in one sentence what this visit has
 * been: how long, what you looked at, and how far the layout moved while you did, measured
 * across every page. Each name is a way back. The words stream in the way an answer does:
 * every word holds its place from the start, lands in the accent and cools to ink, so the
 * sentence never re-wraps as it writes. Nothing here leaves the tab.
 */
export function Recap() {
  const path = usePathname()
  const box = useRef<HTMLDivElement>(null)
  const [said, setSaid] = useState<{ parts: Part[]; last: Seen | null } | null>(null)
  const [shown, setShown] = useState(0)
  const [run, setRun] = useState(0)
  const reduce = useReducedMotion()

  // Note the page, then compose before paint, so the sentence has its full size before anyone could see it.
  useLayoutEffect(() => {
    recordPage(path)
    setSaid(compose())
    setShown(0)
  }, [path])

  // Write it out each time it comes into view with something new to say.
  const last = useRef('')
  useEffect(() => {
    const el = box.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      const next = compose()
      const key = next.parts.map((p) => p.t).join('')
      if (key === last.current) return
      last.current = key
      setSaid(next)
      setShown(0)
      setRun((r) => r + 1)
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [path])

  const total = said ? said.parts.reduce((n, p) => n + p.t.split(' ').filter(Boolean).length, 0) : 0
  useEffect(() => {
    if (!run) return
    if (reduce) return setShown(Infinity)
    let n = 0
    const t = setInterval(() => {
      n++
      setShown(n)
      if (n >= total) clearInterval(t)
    }, PACE)
    return () => clearInterval(t)
  }, [run, total, reduce])

  let w = 0
  const word = (s: string, key: string) => {
    const i = w++
    return (
      <span key={key} className={i < shown ? 'word-in ai-warm' : 'invisible'}>
        {s}
      </span>
    )
  }

  return (
    <div ref={box} className="min-w-0">
      <p
        className="min-h-[4.6em] max-w-[920px] text-[clamp(26px,3.1vw,42px)] font-normal leading-[1.15] tracking-[-0.035em] text-quiet sm:min-h-[3.45em]"
        style={{ ['--ai-word' as string]: 'var(--accent)' }}
      >
        {said?.parts.map((p, k) => {
          // Spaces stay real text between the word spans, so the line breaks exactly where the finished sentence will.
          const tokens = p.t.split(/(\s+)/).filter(Boolean)
          const body = tokens.map((tok, j) => (/^\s+$/.test(tok) ? tok : word(tok, `${k}-${j}`)))
          if (p.href)
            return (
              <Link key={k} href={p.href} className="ring-focus rounded-[4px] text-ink decoration-[color-mix(in_oklch,var(--accent)_60%,transparent)] decoration-[0.06em] underline-offset-[0.14em] transition-colors hover:text-[var(--accent-ink)] hover:underline">
                {body}
              </Link>
            )
          return (
            <span key={k} className={p.ink ? 'tnum text-ink' : undefined}>
              {body}
            </span>
          )
        })}
      </p>
      <div className={`mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 transition-opacity duration-500 ${said && shown >= total && total ? '' : 'opacity-0'}`}>
        {said?.last ? (
          <>
            <span className="text-footnote text-ink-3">
              Take <span className="text-ink">{said.last.name}</span> with you
            </span>
            <span className="w-full max-w-[420px]">
              <CopyCommand fill command={said.last.install} />
            </span>
          </>
        ) : (
          <Link href="/components" className="ring-focus rounded-[4px] text-footnote text-ink-2 transition-colors hover:text-[var(--accent-ink)]">
            Start with the components, every one of them live →
          </Link>
        )}
      </div>
    </div>
  )
}
