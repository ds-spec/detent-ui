'use client'

const KIND: [RegExp, string][] = [
  [/^pdf$/, 'light-dark(oklch(0.57 0.17 18), oklch(0.74 0.14 18))'],
  [/^(fig|sketch|xd)$/, 'light-dark(oklch(0.55 0.2 300), oklch(0.74 0.15 300))'],
  [/^(mp4|mov|webm)$/, 'light-dark(oklch(0.55 0.19 268), oklch(0.74 0.13 268))'],
  [/^(png|jpe?g|gif|webp|svg)$/, 'light-dark(oklch(0.56 0.13 160), oklch(0.76 0.12 160))'],
  [/^(ts|tsx|js|jsx|json)$/, 'light-dark(oklch(0.56 0.14 238), oklch(0.76 0.11 238))'],
  [/^(csv|xlsx?)$/, 'light-dark(oklch(0.56 0.13 150), oklch(0.76 0.12 150))'],
  [/^(zip|tar|gz)$/, 'light-dark(oklch(0.6 0.13 70), oklch(0.8 0.12 75))'],
]

export const fileTint = (name: string) => {
  const ext = (name.includes('.') ? name.split('.').pop()! : '').toLowerCase()
  return KIND.find(([re]) => re.test(ext))?.[1] ?? null
}

export function FileGlyph({ name, size = 34, preview, className = '' }: { name: string; size?: number; preview?: string; className?: string }) {
  const ext = (name.includes('.') ? name.split('.').pop()! : '').slice(0, 4).toUpperCase()
  const tint = fileTint(name)
  const width = Math.round(size * (28 / 34))
  if (preview)
    return (
      <span
        aria-hidden
        className={`block shrink-0 rounded-[6px] ${className}`}
        style={{ width, height: size, background: preview, boxShadow: 'inset 0 0 0 1px rgb(0 0 0 / 0.08)' }}
      />
    )
  return (
    <svg aria-hidden width={width} height={size} viewBox="0 0 28 34" fill="none" className={`shrink-0 ${className}`}>
      <path d="M5 .5h12.4c.8 0 1.5.3 2.1.9l7.1 7.1c.6.6.9 1.3.9 2.1V29a4.5 4.5 0 0 1-4.5 4.5H5A4.5 4.5 0 0 1 .5 29V5A4.5 4.5 0 0 1 5 .5Z" fill="var(--surface)" stroke="var(--line-strong)" />
      <path
        d="M17.5.8V6A3.5 3.5 0 0 0 21 9.5h6.2Z"
        strokeLinejoin="round"
        style={{ fill: tint ? `color-mix(in oklch, ${tint} 22%, var(--surface))` : 'var(--surface-2)', stroke: tint ? `color-mix(in oklch, ${tint} 55%, var(--line-strong))` : 'var(--line-strong)' }}
      />
      {ext && (
        <text x="14" y="27.5" textAnchor="middle" fontSize="6.4" fontWeight="650" letterSpacing="0.3" style={{ fontFamily: 'var(--font-sans)', fill: tint ?? 'var(--ink-3)' }}>
          {ext}
        </text>
      )}
    </svg>
  )
}
