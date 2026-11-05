'use client'

import Link from 'next/link'
import { ArrowUpRight } from '@/lab/icons'
import { LivePlate } from '../LivePlate'
import { wellOf } from '../wells'
import type { Tone } from '../home/lights'

const PIECES: { id: string; name: string; line: string; tone: Tone; bleed?: boolean; className: string }[] = [
  { id: 'region', name: 'Region wheel', line: 'Flick the drum and the Earth turns with it, in today’s real sunlight.', tone: 'blue', bleed: true, className: 'h-[580px] sm:h-[640px] lg:col-span-12 lg:h-[700px]' },
  { id: 'glyph', name: 'Glyph art', line: 'Any icon or word, drawn in characters that light up under your hand.', tone: 'amber', className: 'h-[520px] lg:col-span-7 lg:h-[600px]' },
  { id: 'find', name: 'Lit find', line: 'Search lights the sentence, not only the word.', tone: 'blue', className: 'h-[520px] lg:col-span-5 lg:h-[600px]' },
  { id: 'threads', name: 'Thread hero', line: 'Threads that lead the eye to your button.', tone: 'rose', bleed: true, className: 'h-[560px] lg:col-span-12 lg:h-[640px]' },
]

export function Touch() {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
      {PIECES.map((p) => (
        <LivePlate
          key={p.id}
          id={p.id}
          bleed={p.bleed}
          well={wellOf(p.tone)}
          className={p.className}
          caption={
            <div className="flex shrink-0 items-center gap-4 px-3 pb-2 pt-4">
              <p className="min-w-0 flex-1 text-[17px] leading-6 tracking-[-0.015em] text-ink">
                {p.name}
              </p>
              <Link href={`/components/${p.id}`} className="ring-focus group/open flex h-9 shrink-0 items-center gap-1 rounded-full px-3.5 text-[13px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] transition-[color,transform] duration-150 hover:text-ink active:scale-[0.97]">
                Open
                <ArrowUpRight size={12} className="transition-transform duration-150 group-hover/open:-translate-y-px group-hover/open:translate-x-px" />
              </Link>
            </div>
          }
        />
      ))}
    </div>
  )
}
