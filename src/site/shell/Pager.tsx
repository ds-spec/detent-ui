'use client'

import Link from 'next/link'
import { ArrowLeft } from '@/lab/icons'

type Stop = { name: string; href: string }

const pill = 'ring-focus flex h-11 min-w-0 max-w-[260px] flex-1 items-center gap-2 rounded-full bg-surface px-4 text-[13px] font-medium text-ink shadow-[var(--card-edge),0_8px_24px_rgb(0_0_0/0.12)] active:scale-[.97]'

/** Previous and next under the thumb, on a phone, where there are no arrow keys and no list down the side. */
export function Pager({ prev, next, onPick }: { prev: Stop; next: Stop; /** Moves there itself, so the page can animate the way it's going. */ onPick?: (href: string) => void }) {
  const go = (stop: Stop) => (e: React.MouseEvent) => {
    if (!onPick) return
    e.preventDefault()
    onPick(stop.href)
  }
  return (
    <nav aria-label="Previous and next" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center gap-2 px-4 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
      <Link href={prev.href} onClick={go(prev)} aria-label={`Previous: ${prev.name}`} className={`pointer-events-auto ${pill}`}>
        <ArrowLeft size={15} className="shrink-0" />
        <span className="truncate">{prev.name}</span>
      </Link>
      <Link href={next.href} onClick={go(next)} aria-label={`Next: ${next.name}`} className={`pointer-events-auto justify-end ${pill}`}>
        <span className="truncate">{next.name}</span>
        <ArrowLeft size={15} className="shrink-0 rotate-180" />
      </Link>
    </nav>
  )
}
