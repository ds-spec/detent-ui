'use client'

const FONT: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
}

const COLS = 5
const ROWS = 7
const OFF = 'color-mix(in oklch, var(--ink) 5%, transparent)'
const DIM = 'color-mix(in oklch, var(--ink) 26%, transparent)'

export function DotType({
  text,
  slots = text.length,
  dot = 4,
  gap = 2,
  level = 1,
  over = 0,
  quick = false,
  className = '',
}: {
  text: string
  slots?: number
  dot?: number
  gap?: number
  level?: number
  over?: number
  quick?: boolean
  className?: string
}) {
  const chars = [...text.padStart(slots, ' ').slice(-slots)]
  const pitch = dot + gap
  const glyphW = COLS * pitch - gap
  const space = Math.round(dot * 1.5)
  const w = slots * glyphW + (slots - 1) * space
  const h = ROWS * pitch - gap
  const filled = Math.round(Math.min(1, Math.max(0, level)) * ROWS)
  const hot = over > 0 ? Math.max(1, Math.round(Math.min(1, over) * ROWS)) : 0
  const r = dot / 2
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={`block shrink-0 ${className}`} aria-hidden>
      {chars.map((ch, g) =>
        (FONT[ch] ?? FONT[' ']).map((row, y) =>
          [...row].map((bit, x) => {
            const on = bit === '1'
            const fill = !on ? OFF : y < hot ? 'var(--warn)' : y >= ROWS - filled ? 'var(--ink)' : DIM
            return (
              <circle
                key={`${g}-${y}-${x}`}
                cx={g * (glyphW + space) + x * pitch + r}
                cy={y * pitch + r}
                r={r}
                style={{ fill, transition: quick ? 'fill 40ms linear' : 'fill 260ms cubic-bezier(0.2, 0.9, 0.25, 1)', transitionDelay: quick ? '0ms' : `${g * 50 + (ROWS - 1 - y) * 38}ms` }}
                className="motion-reduce:[transition:none]"
              />
            )
          }),
        ),
      )}
    </svg>
  )
}
