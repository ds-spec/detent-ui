'use client'

import { useEffect, useState } from 'react'
import { siGithub } from 'simple-icons'

export const REPO = 'ds-spec/detent-ui'
const KEY = 'detent.stars'
const FALLBACK = 0
const SHOW_FROM = 100

const STAR = 'M12 2.6l2.83 5.74 6.33.92-4.58 4.46 1.08 6.3L12 17.04l-5.66 2.98 1.08-6.3-4.58-4.46 6.33-.92L12 2.6z'

export function useStars() {
  const [stars, setStars] = useState(FALLBACK)
  useEffect(() => {
    let live = true
    let kept = 0
    try {
      kept = Number(sessionStorage.getItem(KEY)) || 0
    } catch {}
    const count: Promise<number | undefined> = kept
      ? Promise.resolve(kept)
      : fetch(`https://api.github.com/repos/${REPO}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d: { stargazers_count?: number } | null) => d?.stargazers_count)
    count
      .then((n) => {
        if (!live || typeof n !== 'number') return
        setStars(n)
        try {
          sessionStorage.setItem(KEY, String(n))
        } catch {}
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [])
  return stars
}

const short = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n))

export function GitHubStars({ className = '', style, label }: { className?: string; style?: React.CSSProperties; label?: string }) {
  const stars = useStars()
  return (
    <a
      href={`https://github.com/${REPO}`}
      target="_blank"
      rel="noreferrer"
      aria-label={stars >= SHOW_FROM ? `Star Detent on GitHub, ${stars} stars` : 'Detent on GitHub'}
      className={`group/gh ring-focus flex h-9 items-center gap-2 rounded-full ${stars >= SHOW_FROM || label ? 'pl-2.5 pr-3.5' : 'w-9 justify-center'} text-[13px] text-ink-2 transition-[color,transform] duration-150 hover:text-ink active:scale-[0.97] ${className}`}
      style={style}
    >
      <span aria-hidden className="relative grid size-[18px] place-items-center">
        <svg viewBox="0 0 24 24" className="absolute size-4 fill-current transition-[opacity,filter,scale] duration-200 ease-out group-hover/gh:scale-75 group-hover/gh:opacity-0 group-hover/gh:blur-[3px] motion-reduce:transition-none">
          <path d={siGithub.path} />
        </svg>
        <svg viewBox="0 0 24 24" className="absolute size-[17px] scale-75 fill-[#f5b400] opacity-0 blur-[3px] transition-[opacity,filter,scale] duration-200 ease-out group-hover/gh:scale-100 group-hover/gh:opacity-100 group-hover/gh:blur-none motion-reduce:transition-none">
          <path d={STAR} strokeLinejoin="round" />
        </svg>
      </span>
      {label && <span className="flex-1">{label}</span>}
      {stars >= SHOW_FROM && <span className={label ? 'tabular-nums text-ink-3' : 'tabular-nums font-medium'}>{short(stars)}</span>}
    </a>
  )
}
