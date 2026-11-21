'use client'

import Link from 'next/link'
import { entry } from '@/catalog/meta'
import { ArrowUpRight } from '@/lab/icons'
import { LivePlate } from '@/site/LivePlate'
import { wellOf } from '@/site/wells'
import type { Tone } from '@/site/home/lights'

const PIECES: { id: string; tone: Tone; bleed?: boolean; className: string }[] = [
  { id: 'askchart', tone: 'blue', className: 'h-[560px] lg:col-span-7 lg:h-[620px]' },
  { id: 'radar', tone: 'violet', className: 'h-[560px] lg:col-span-5 lg:h-[620px]' },
  { id: 'region', tone: 'blue', bleed: true, className: 'h-[580px] sm:h-[640px] lg:col-span-12 lg:h-[700px]' },
  { id: 'find', tone: 'amber', className: 'h-[520px] lg:col-span-5 lg:h-[600px]' },
  { id: 'glyph', tone: 'rose', className: 'h-[520px] lg:col-span-7 lg:h-[600px]' },
]

export function Pieces() {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
      {PIECES.map((p) => {
        const e = entry(p.id)
        return (
          <LivePlate
            key={p.id}
            id={p.id}
            bleed={p.bleed}
            well={wellOf(p.tone)}
            className={p.className}
            caption={
              <div className="flex shrink-0 items-center gap-4 px-3 pb-2 pt-4">
                <p className="min-w-0 flex-1 truncate text-[17px] leading-6 tracking-[-0.015em] text-ink">
                  {e?.name ?? p.id}
                  {e?.short ? <span className="text-ink-3"> · {e.short}</span> : null}
                </p>
                <Link href={`/components/${p.id}`} className="ring-focus group/open flex h-9 shrink-0 items-center gap-1 rounded-full px-3.5 text-[13px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] transition-[color,transform] duration-150 hover:text-ink active:scale-[0.97]">
                  Open
                  <ArrowUpRight size={12} className="transition-transform duration-150 group-hover/open:-translate-y-px group-hover/open:translate-x-px" />
                </Link>
              </div>
            }
          />
        )
      })}
    </div>
  )
}
