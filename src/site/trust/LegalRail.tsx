'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export type Doc = { href: string; name: string }

export function LegalRail({ docs, current, sections }: { docs: Doc[]; current: string; sections: { id: string; title: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id)

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => !!el)
    const pick = () => {
      const line = window.innerHeight * 0.3
      let on = els[0]?.id
      for (const el of els) if (el.getBoundingClientRect().top <= line) on = el.id
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) on = els[els.length - 1]?.id
      setActive(on)
    }
    pick()
    window.addEventListener('scroll', pick, { passive: true })
    window.addEventListener('resize', pick)
    return () => {
      window.removeEventListener('scroll', pick)
      window.removeEventListener('resize', pick)
    }
  }, [sections])

  return (
    <nav aria-label="Legal" className="sticky top-24">
      <p className="px-2.5 text-[12px] text-ink-3">Legal</p>
      <ul className="mt-2 flex flex-col gap-0.5">
        {docs.map((d) => {
          const on = d.name === current
          return (
            <li key={d.href}>
              <Link href={d.href} aria-current={on ? 'page' : undefined} className={`ring-focus block rounded-[8px] px-2.5 py-1.5 text-[13px] transition-colors ${on ? 'bg-surface-2 font-medium text-ink' : 'text-ink-3 hover:text-ink'}`}>
                {d.name}
              </Link>
              {on && (
                <ol className="my-1.5 ml-2.5 flex flex-col shadow-[inset_1px_0_0_var(--line)]">
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} className={`ring-focus -ml-px block py-1 pl-3.5 text-[12.5px] leading-[18px] transition-colors hover:text-ink ${active === s.id ? 'text-ink shadow-[inset_1px_0_0_var(--ink)]' : 'text-ink-3'}`}>
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
