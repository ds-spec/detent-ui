import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from '@/lab/icons'

const STEPS: { title: string; line: ReactNode }[] = [
  { title: 'Make a key', line: 'Sign in at /account with the email you bought with, and generate one.' },
  { title: 'Connect it once', line: 'One block in components.json, and your key in .env.local.' },
  {
    title: 'Install by name',
    line: <code className="font-mono text-[13px] text-ink-2">npx shadcn add @detent-pro/glyph</code>,
  },
]

export function Install() {
  return (
    <div>
      <ol className="grid gap-3 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="rounded-[24px] bg-surface p-6 shadow-[var(--card-edge)] sm:p-7">
            <span className="tnum text-[13px] text-ink-3">{i + 1}</span>
            <p className="mt-3 text-[17px] tracking-[-0.015em] text-ink">{s.title}</p>
            <p className="mt-1.5 text-[14px] leading-[1.6] text-ink-3">{s.line}</p>
          </li>
        ))}
      </ol>
      <Link href="/docs#pro" className="ring-focus group/go mt-6 inline-flex h-10 items-center gap-2 rounded-full px-1 text-[14px] font-medium text-ink-2 transition-[color,transform] duration-150 hover:text-ink active:scale-[0.97]">
        Full setup, step by step
        <ArrowRight size={13} className="transition-transform duration-150 group-hover/go:translate-x-0.5" />
      </Link>
    </div>
  )
}
