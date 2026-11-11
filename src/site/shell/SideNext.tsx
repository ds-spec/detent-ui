'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PLANS } from '@/catalog/pro'
import { FIRST_BLOCK, FIRST_COMPONENT } from '@/catalog/site'
import * as I from '@/lab/icons'
import { Mark, ThemeButton } from '../parts'
import { useSite } from '../Providers'
import { ForPlan } from '../Owned'
import { PriceNow } from '../Promo'
import { usePeek } from '../exhibit/Rail'
import type { RailGroup } from '../exhibit/Rail'

const PLACES = [
  { href: FIRST_COMPONENT, section: '/components', label: 'Components', icon: <I.Layers size={14} /> },
  { href: FIRST_BLOCK, section: '/blocks', label: 'Blocks', icon: <I.Table size={14} /> },
  { href: '/templates', section: '/templates', label: 'Templates', icon: <I.Folder size={14} /> },
  { href: '/changelog', section: '/changelog', label: 'Changelog', icon: <I.Clock size={14} /> },
]
const OUT = [
  { href: 'https://github.com/ds-spec/detent-ui', label: 'GitHub', icon: <I.Fork size={14} /> },
  { href: 'https://x.com', label: 'Follow on X', icon: <I.Bell size={14} /> },
]

const GLYPH: Record<string, ReactNode> = {
  trace: <I.Bolt size={13} />, diff: <I.Fork size={13} />, rewrite: <I.Pencil size={13} />, prompt: <I.Prompt size={13} />, models: <I.Spark size={13} />, extract: <I.FilePage size={13} />, voicenote: <I.Mic size={13} />,
  filter: <I.Sliders size={13} />, radar: <I.Orbit size={13} />, scatter: <I.Grip size={13} />, histogram: <I.Table size={13} />, funnel: <I.ChevronDown size={13} />, bridge: <I.Card size={13} />, askchart: <I.Bubble size={13} />,
  chart: <I.Chart size={13} />, lens: <I.Eye size={13} />, trend: <I.ArrowUpRight size={13} />, rings: <I.Check size={13} />, metric: <I.Note size={13} />, forecast: <I.Bag size={13} />,
  dates: <I.Calendar size={13} />, upload: <I.Upload size={13} />, rewind: <I.RotateLeft size={13} />, popup: <I.More size={13} />, region: <I.Plane size={13} />, find: <I.Search size={13} />,
  carousel: <I.Picture size={13} />, halo: <I.Sun size={13} />, announce: <I.Bell size={13} />, slices: <I.FlipH size={13} />, threads: <I.Link size={13} />,
  'live-features': <I.Spark size={13} />, pricing: <I.Card size={13} />, integrations: <I.Plug size={13} />, testimonials: <I.Bubble size={13} />, faq: <I.ChevronDown size={13} />, cta: <I.ArrowRight size={13} />,
  calendar: <I.Calendar size={13} />, 'data-table': <I.Table size={13} />, analytics: <I.Chart size={13} />, 'agent-chat': <I.Prompt size={13} />, 'task-to-merge': <I.Fork size={13} />, 'voice-mode': <I.Mic size={13} />,
  evals: <I.Check size={13} />, 'support-inbox': <I.Mail size={13} />, settings: <I.Sliders size={13} />, 'code-review': <I.Code size={13} />,
  onboarding: <I.Plane size={13} />, 'sign-in': <I.Shield size={13} />, billing: <I.Bag size={13} />,
}

const row = 'ring-focus flex h-[30px] items-center gap-2.5 rounded-[7px] px-2 text-[13.5px] transition-colors duration-100'

export function SideNext({ groups, current, onPick, preview, label = 'Components' }: { groups: RailGroup[]; current: string; onPick: (id: string) => void; preview?: Parameters<typeof usePeek>[1]; label?: string }) {
  const path = usePathname()
  const { openSearch } = useSite()
  const [q, setQ] = useState('')
  const { aim, leave, card } = usePeek(groups.flatMap((g) => g.items), preview)
  const words = q.trim().toLowerCase()
  const count = groups.reduce((n, g) => n + g.items.length, 0)
  const shown = groups.map((g) => ({ ...g, items: g.items.filter((x) => !words || x.name.toLowerCase().includes(words)) })).filter((g) => g.items.length)
  return (
    <div className="flex min-h-0 flex-1 flex-col pr-3">
      <div className="flex h-10 items-center gap-2 pl-2">
        <Link href="/" className="ring-focus -ml-1 flex items-center gap-2.5 rounded-[8px] px-1 py-1">
          <Mark />
          <span className="text-[15px] font-medium tracking-[-0.02em] text-ink">Detent</span>
        </Link>
        <span className="flex-1" />
        <button type="button" onClick={openSearch} aria-label="Search (⌘K)" className="ring-focus grid size-8 place-items-center rounded-[8px] text-ink-3 transition-colors hover:bg-[var(--shell-hover)] hover:text-ink">
          <I.Search size={15} />
        </button>
        <ThemeButton />
      </div>

      <div onPointerLeave={leave} className="mt-4 min-h-0 flex-1 overflow-y-auto pb-6 [scrollbar-width:none]">
        <nav aria-label="Library" className="flex flex-col">
          {PLACES.map((n) => {
            const on = path.startsWith(n.section)
            return (
              <Link key={n.href} href={n.href} aria-current={on ? 'page' : undefined} className={`${row} ${on ? 'text-ink' : 'text-ink-3 hover:bg-[var(--shell-hover)] hover:text-ink'}`}>
                <span className={on ? 'text-ink' : 'text-ink-3'}>{n.icon}</span>
                {n.label}
              </Link>
            )
          })}
          {OUT.map((n) => (
            <a key={n.href} href={n.href} target="_blank" rel="noreferrer" className={`${row} group/out text-ink-3 hover:bg-[var(--shell-hover)] hover:text-ink`}>
              <span>{n.icon}</span>
              {n.label}
              <I.ArrowUpRight size={11} className="ml-auto opacity-50 transition-transform duration-150 group-hover/out:-translate-y-px group-hover/out:translate-x-px" />
            </a>
          ))}
        </nav>

        <label className="mt-6 flex h-[30px] items-center gap-2 rounded-[7px] px-2 text-[13px] text-ink-3 focus-within:bg-[var(--shell-hover)]">
          <I.Search size={13} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={count === 1 ? `Filter 1 ${label.toLowerCase().replace(/s$/, '')}` : `Filter ${count} ${label.toLowerCase()}`} className="w-full bg-transparent text-ink outline-none placeholder:text-ink-3" />
        </label>

        {shown.map((g) => (
          <section key={g.id} className="mt-5">
            <h3 className="px-2 pb-1 text-[13px] font-medium text-ink">{g.name}</h3>
            {g.items.map((x) => {
              const on = x.id === current
              return (
                <button key={x.id} type="button" onClick={() => onPick(x.id)} onPointerEnter={(e) => aim(x.id, e.currentTarget)} onFocus={(e) => aim(x.id, e.currentTarget)} onBlur={leave} aria-current={on ? 'page' : undefined} className={`${row} w-full ${on ? 'bg-[var(--shell-on)] text-ink' : 'text-ink-3 hover:bg-[var(--shell-hover)] hover:text-ink active:bg-[var(--shell-on)]'}`}>
                  <span className={on ? 'text-ink' : 'text-ink-3'}>{GLYPH[x.id] ?? g.icon}</span>
                  {x.name}
                  {x.pro && <span className="ml-auto text-[11px] text-ink-3">Pro</span>}
                </button>
              )
            })}
          </section>
        ))}
      </div>

      {card}
      <ForPlan
        none={
          <Link href="/pro" className="ring-focus group/pro mt-1 flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-[12.5px] text-ink-2 transition-colors hover:bg-[var(--shell-hover)] hover:text-ink">
            <span className="rounded-[5px] bg-[var(--accent)] px-1.5 text-[10.5px] font-medium leading-[18px] text-white">Pro</span>
            Pricing
            <span className="ml-auto text-ink-3"><PriceNow value={PLANS[0].price} /></span>
            <I.ArrowRight size={12} className="text-ink-3" />
          </Link>
        }
      />
    </div>
  )
}
