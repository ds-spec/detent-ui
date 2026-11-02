'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from '@/lab/icons'
import { BTN, useSideNew } from './side'

type Stop = { name: string; href: string }

const pill = 'ring-focus flex h-11 min-w-0 max-w-[260px] flex-1 items-center gap-2 rounded-full bg-surface px-4 text-[13px] font-medium text-ink shadow-[var(--card-edge),0_8px_24px_rgb(0_0_0/0.12)] active:scale-[.97]'
const plate = `ring-focus flex h-11 min-w-0 max-w-[260px] flex-1 items-center gap-2 rounded-[12px] px-4 text-[13px] font-medium active:scale-[.97] ${BTN.plate}`

/** Previous and next under the thumb, on a phone, where there are no arrow keys and no list down the side. */
export function Pager({ prev, next, onPick }: { prev: Stop; next: Stop; /** Moves there itself, so the page can animate the way it's going. */ onPick?: (href: string) => void }) {
  // Out of the way while you read or use what's under it, back when you turn round or reach the end.
  const [away, setAway] = useState(false)
  const side = useSideNew()
  useEffect(() => {
    let last = window.scrollY
    const on = () => {
      const y = window.scrollY
      if (Math.abs(y - last) < 8) return
      const end = y + window.innerHeight >= document.documentElement.scrollHeight - 64
      setAway(y > last && y > 48 && !end)
      last = y
    }
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  const go = (stop: Stop) => (e: React.MouseEvent) => {
    if (!onPick) return
    e.preventDefault()
    onPick(stop.href)
  }
  return (
    <nav aria-label="Previous and next" className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center gap-2 px-4 pb-[max(12px,env(safe-area-inset-bottom))] transition-transform duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] focus-within:translate-y-0 motion-reduce:transition-none lg:hidden ${away ? 'translate-y-[calc(100%+8px)]' : ''}`}>
      <Link href={prev.href} onClick={go(prev)} aria-label={`Previous: ${prev.name}`} className={`pointer-events-auto ${side ? plate : pill}`}>
        <ArrowLeft size={15} className="shrink-0" />
        <span className="truncate">{prev.name}</span>
      </Link>
      <Link href={next.href} onClick={go(next)} aria-label={`Next: ${next.name}`} className={`pointer-events-auto justify-end ${side ? plate : pill}`}>
        <span className="truncate">{next.name}</span>
        <ArrowLeft size={15} className="shrink-0 rotate-180" />
      </Link>
    </nav>
  )
}
