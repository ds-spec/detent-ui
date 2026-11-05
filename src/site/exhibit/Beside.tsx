'use client'

import Link from 'next/link'
import { entry } from '@/catalog/meta'
import { ArrowUpRight } from '@/lab/icons'
import { LivePlate } from '../LivePlate'
import { wellOf } from '../wells'

export function Beside({ id }: { id: string }) {
  const e = entry(id)
  if (!e) return null
  return (
    <section aria-label={`${e.name}, from Pro`} className="mt-12 sm:mt-16">
      <LivePlate
        id={e.id}
        bleed={e.bleed}
        well={wellOf('violet')}
        className="h-[520px] sm:h-[600px]"
        caption={
          <div className="flex shrink-0 items-center gap-4 px-3 pb-2 pt-4">
            <p className="min-w-0 flex-1 text-[15px] leading-5 text-quiet">
              What this usually sits beside.
              <span className="mt-0.5 block text-[17px] leading-6 tracking-[-0.015em] text-ink">
                {e.name} <span className="text-quiet">· Pro</span>
              </span>
            </p>
            <Link href={`/components/${e.id}`} className="ring-focus group/open flex h-9 shrink-0 items-center gap-1 rounded-full px-3.5 text-[13px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] transition-[color,transform] duration-150 hover:text-ink active:scale-[0.97]">
              Open
              <ArrowUpRight size={12} className="transition-transform duration-150 group-hover/open:-translate-y-px group-hover/open:translate-x-px" />
            </Link>
          </div>
        }
      />
    </section>
  )
}
