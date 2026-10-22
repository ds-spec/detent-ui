import type { CSSProperties } from 'react'

/** A stable number from a string, so the same name always gets the same orb. */
function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

const at = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180
  return `${(50 + r * Math.cos(a)).toFixed(1)}% ${(50 + r * Math.sin(a)).toFixed(1)}%`
}

/**
 * A person, or anything with an identity, as a soft gradient ball. Their colour pools in the
 * middle; its complement and a warm neighbour bleed in from the edges; the whole field is
 * blurred so the colours melt rather than meet. Light falls from the upper left and shade
 * gathers underneath, so it reads as a sphere. The name decides where each colour comes in,
 * so no two orbs are quite alike, and the hue keeps each on its person's colour. Quiet turns the
 * colour down to a tint, for calm apps where one accent should be the only colour on screen.
 */
export function Orb({ seed, hue, size = 32, quiet = false, className = '', style }: { seed: string; hue?: number; size?: number; quiet?: boolean; className?: string; style?: CSSProperties }) {
  const n = hash(seed)
  const h = hue ?? n % 360
  const turn = n % 360
  const comp = (h + 160 + (n % 40)) % 360
  const warm = (h + 30 + ((n >> 6) % 30)) % 360
  const glint = (h + 190 + ((n >> 11) % 40)) % 360
  // Chroma, scaled down for a quiet orb.
  const c = (v: number) => (quiet ? v * 0.32 : v).toFixed(3)
  return (
    <span aria-hidden className={`relative block shrink-0 overflow-hidden rounded-full ${className}`} style={{ width: size, height: size, ...style }}>
      <span
        className="absolute -inset-[18%] block"
        style={{
          background: [
            `radial-gradient(circle at 46% 42%, oklch(0.84 ${c(0.15)} ${h}) 0%, transparent 60%)`,
            `radial-gradient(circle at ${at(50, turn + 165)}, oklch(0.84 ${c(0.15)} ${comp}) 0%, transparent 40%)`,
            `radial-gradient(circle at ${at(50, turn + 45)}, oklch(${quiet ? 0.66 : 0.7} ${c(0.19)} ${warm}) 0%, transparent 42%)`,
            `radial-gradient(circle at ${at(52, turn - 65)}, oklch(0.88 ${c(0.1)} ${glint}) 0%, transparent 28%)`,
            `oklch(${quiet ? 0.72 : 0.78} ${c(0.15)} ${h})`,
          ].join(', '),
          filter: `blur(${Math.max(1.5, size * 0.1)}px)`,
        }}
      />
      {/* The light: a soft highlight up top, shade gathering below, and a hairline edge. */}
      <span
        className="absolute inset-0 block rounded-full"
        style={{
          background: 'radial-gradient(circle at 34% 26%, rgb(255 255 255 / 0.42) 0%, rgb(255 255 255 / 0.12) 26%, transparent 46%)',
          boxShadow: `inset 0 ${-size * 0.1}px ${size * 0.22}px oklch(0.4 0.12 ${h} / 0.2), inset 0 0 0 0.5px rgb(0 0 0 / 0.07)`,
        }}
      />
    </span>
  )
}
