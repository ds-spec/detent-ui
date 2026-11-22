'use client'

import { useEffect, useState } from 'react'

export function Toc({ items }: { items: { id: string; name: string; sub?: boolean }[] }) {
  const [at, setAt] = useState(items[0]?.id)
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => e !== null)
    const pick = () => {
      let current = els[0]?.id
      for (const el of els) if (el.getBoundingClientRect().top < 160) current = el.id
      setAt(current)
    }
    pick()
    window.addEventListener('scroll', pick, { passive: true })
    return () => window.removeEventListener('scroll', pick)
  }, [items])
  return (
    <nav aria-label="On this page" className="sticky top-28">
      <p className="text-[12px] text-ink-3">On this page</p>
      <ul className="mt-3 space-y-0.5">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              aria-current={at === i.id ? 'location' : undefined}
              className={`ring-focus block truncate rounded-[6px] py-1 text-[12.5px] leading-[1.4] transition-colors duration-150 ${i.sub ? 'pl-3' : ''} ${at === i.id ? 'text-ink' : 'text-ink-3 hover:text-ink-2'}`}
            >
              {i.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
