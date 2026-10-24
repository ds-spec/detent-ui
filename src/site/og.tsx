import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import type { ReactNode } from 'react'

/*
 * The images links unfurl into. One object, drawn as an engineer would: the Seated D as a
 * machined part on true black, its slab and half-disc made solid and seen a little from above,
 * faces section-hatched, hidden edges dashed, a centre line through the half-disc, its radius
 * called out, and one dimension in the accent: the two-unit seam where the parts click. Little
 * type, placed exactly: the name level with the part's face, the message resting on its foot.
 * Film grain keeps the dark from banding.
 * Set in Geist Regular with its kerning table taken out: the renderer measures each word without
 * kerning but draws it with kerning, which leaves a gap after any word with a kerned pair. Without
 * the table the two agree and the spacing is even. (Geist is under the SIL Open Font Licence.)
 */

let font: Promise<Buffer> | null = null
const geist = () => (font ??= readFile(join(process.cwd(), 'src/site/fonts/geist-og.ttf')))
const options = async () => ({ ...OG, fonts: [{ name: 'Geist', data: await geist(), weight: 400 as const, style: 'normal' as const }] })

export const OG = { width: 1200, height: 630 }
export const CONTENT_TYPE = 'image/png'

const W = OG.width
const H = OG.height
const INK = '#ededed'
const QUIET = '#8f8f8f'
const ACCENT = '#5b8cff'

type Pt = readonly [number, number]

const arc = (cx: number, cy: number, r: number, from: number, to: number, steps: number): Pt[] =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const a = ((from + ((to - from) * i) / steps) * Math.PI) / 180
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const
  })
const path = (pts: readonly Pt[], close = true) => `M${pts.map(([a, b]) => `${a.toFixed(2)} ${b.toFixed(2)}`).join('L')}${close ? 'Z' : ''}`
const add = ([a, b]: Pt, [c, d]: Pt): Pt => [a + c, b + d]

/**
 * One part of the mark, made solid (a plain function: inside an <svg>, Satori takes only plain elements): its outline (clockwise) pushed back along `depth`, drawn the
 * way a part is drawn in an oblique projection. The face keeps its true shape; each side wall that
 * turns toward the viewer is shaded by the way it faces the light, so a curve shades like a turned
 * edge; and the edges where the walls turn away are drawn as the silhouette.
 */
function solid(outline: Pt[], depth: Pt, id: string) {
  const n = outline.length
  const walls: ReactNode[] = []
  const edges: string[] = []
  const hidden: string[] = []
  const seen = (i: number) => {
    const [a, b] = outline[i]
    const [c, d] = outline[(i + 1) % n]
    // The outward normal of a clockwise edge, on screen (y down): it shows if it faces along the depth.
    const nx = d - b
    const ny = -(c - a)
    return { show: nx * depth[0] + ny * depth[1] > 0, nx, ny, len: Math.hypot(nx, ny) || 1 }
  }
  for (let i = 0; i < n; i++) {
    const e = seen(i)
    if (!e.show) {
      hidden.push(path([add(outline[i], depth), add(outline[(i + 1) % n], depth)], false))
      continue
    }
    const p = outline[i]
    const q = outline[(i + 1) % n]
    // Light from above and a little left.
    const lit = (e.nx * -0.34 + e.ny * -0.94) / e.len
    const l = Math.round(16 + Math.max(0, lit) * 44 + Math.min(0, lit) * 6)
    const fill = `hsl(228 6% ${l}%)`
    walls.push(<path key={i} d={path([p, q, add(q, depth), add(p, depth)])} fill={fill} stroke={fill} strokeWidth={0.8} />)
    edges.push(path([add(p, depth), add(q, depth)], false))
    if (!seen((i + n - 1) % n).show) edges.push(path([p, add(p, depth)], false))
    if (!seen((i + 1) % n).show) edges.push(path([q, add(q, depth)], false))
  }
  return (
    <g>
      {walls}
      <path d={path(outline)} fill={`url(#face-${id})`} />
      <path d={path(outline)} fill="url(#hatch)" />
      <path d={hidden.join('')} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1} strokeDasharray="5 4" />
      <path d={edges.join('')} fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth={1} />
      <path d={path(outline)} fill="none" stroke="rgba(255,255,255,0.62)" strokeWidth={1.1} />
    </g>
  )
}

/** Where the radius callout leaves the arc. */
const callout = (u: number, x: number, y: number) => arc(x + 11.25 * u, y + 12 * u, 9 * u, 62, 62, 1)[0]

/**
 * The mark as a machined part, drawn as one would draw it: the slab and the half-disc made solid
 * and seen a little from above and to the right, their faces section-hatched, a centre line
 * through the half-disc, and one dimension, in the accent: the two-unit seam where they click.
 * `u` is one unit of the mark's 24-unit grid; (x, y) is the grid's top left on the face.
 */
function Machined({ u, x, y }: { u: number; x: number; y: number }) {
  const X = (a: number) => x + a * u
  const Y = (b: number) => y + b * u
  const r = 1.1 * u
  const slab = [...arc(X(9.25) - r, Y(3) + r, r, -90, 0, 18), ...arc(X(9.25) - r, Y(21) - r, r, 0, 90, 18), ...arc(X(3.75) + r, Y(21) - r, r, 90, 180, 18), ...arc(X(3.75) + r, Y(3) + r, r, 180, 270, 18)]
  const disc = arc(X(11.25), Y(12), 9 * u, -90, 90, 96)
  const angle = (32 * Math.PI) / 180
  const depth: Pt = [2.8 * u * Math.cos(angle), -2.8 * u * Math.sin(angle)]
  const big = { filterUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H } as const
  const dim = Y(21) + 30
  const lead = callout(u, x, y)
  const tick = 5
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', left: 0, top: 0 }}>
      <defs>
        <pattern id="hatch" patternUnits="userSpaceOnUse" width={7} height={7} patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={7} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
        </pattern>
        <linearGradient id="face-slab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141416" />
          <stop offset="1" stopColor="#070708" />
        </linearGradient>
        <linearGradient id="face-disc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141416" />
          <stop offset="1" stopColor="#070708" />
        </linearGradient>
        <filter id="glow" {...big}>
          <feGaussianBlur stdDeviation={u * 2.4} />
        </filter>
      </defs>

      {/* A low light behind the part, strongest through the seam. */}
      <ellipse cx={X(10.25) + depth[0] / 2} cy={Y(12) + depth[1] / 2} rx={u * 7} ry={u * 10} fill="#aab8ff" opacity={0.13} filter="url(#glow)" />
      <rect x={X(9.6)} y={Y(4)} width={u * 1.3} height={u * 16} fill="#ffffff" opacity={0.35} filter="url(#glow)" />

      {solid(slab, depth, 'slab')}
      {solid(disc, depth, 'disc')}

      {/* The centre line through the half-disc, long dash and dot. */}
      <line x1={X(2.4)} y1={Y(12)} x2={X(21.6)} y2={Y(12)} stroke="rgba(255,255,255,0.3)" strokeWidth={1} strokeDasharray="18 4 3 4" />
      <g stroke="rgba(255,255,255,0.55)" strokeWidth={1}>
        <line x1={X(11.25) - 6} y1={Y(12)} x2={X(11.25) + 6} y2={Y(12)} />
        <line x1={X(11.25)} y1={Y(12) - 6} x2={X(11.25)} y2={Y(12) + 6} />
      </g>

      {/* The half-disc's radius, called out. */}
      <path d={`M${lead[0]} ${lead[1]}l28 28h40`} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
      <circle cx={lead[0]} cy={lead[1]} r={2} fill="rgba(255,255,255,0.7)" />

      {/* The seam, dimensioned: the one accent. */}
      <g stroke={ACCENT} strokeWidth={1}>
        <line x1={X(9.25)} y1={Y(21) + 6} x2={X(9.25)} y2={dim + 6} />
        <line x1={X(11.25)} y1={Y(21) + 6} x2={X(11.25)} y2={dim + 6} />
        <line x1={X(9.25)} y1={dim} x2={X(11.25)} y2={dim} />
      </g>
      <path d={`M${X(9.25)} ${dim}l${tick} -3v6Z M${X(11.25)} ${dim}l${-tick} -3v6Z`} fill={ACCENT} />
    </svg>
  )
}

/** Film grain over everything, so the light falls off smoothly instead of in bands. */
function Grain({ amount = 0.07 }: { amount?: number }) {
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', left: 0, top: 0 }}>
      <filter id="grain" filterUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
        <feTurbulence type="fractalNoise" baseFrequency={0.85} numOctaves={2} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width={W} height={H} filter="url(#grain)" opacity={amount} />
    </svg>
  )
}

/** Type set word by word, so the space between words is exact; words wrap inside `width`. */
function Words({ text, size, color, tracking = -0.045, width, leading = 1.06 }: { text: string; size: number; color: string; tracking?: number; width?: number; leading?: number }) {
  const gap = size * 0.24
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', ...(width ? { width } : {}), fontSize: size, lineHeight: leading, color, letterSpacing: `${tracking}em`, columnGap: gap }}>
      {text.split(' ').map((w, i) => (
        <span key={i}>{w}</span>
      ))}
    </div>
  )
}

/**
 * Every image's layout: the mark on the right, the name at the top left with its cap height level
 * with the mark's top, and the message at the bottom left with its baseline on the mark's foot.
 * `sink` is how far the last line's box runs below its baseline, measured from the render.
 */
function Stage({ u, sink, head, children }: { u: number; sink: number; head: ReactNode; children: ReactNode }) {
  // The part's far edge, pushed back up and to the right, ends at the right margin.
  const x = 1128 - 20.25 * u - 2.8 * u * Math.cos((32 * Math.PI) / 180)
  const y = H / 2 - 12 * u + 1.4 * u * Math.sin((32 * Math.PI) / 180)
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: '#000' }}>
      <Machined u={u} x={x} y={y} />
      <div style={{ position: 'absolute', left: x + 10.25 * u - 40, width: 80, top: y + 21 * u + 40, display: 'flex', justifyContent: 'center', fontSize: 15, color: ACCENT, letterSpacing: '0.02em' }}>2.00</div>
      <div style={{ position: 'absolute', left: callout(u, x, y)[0] + 76, top: callout(u, x, y)[1] + 18, display: 'flex', fontSize: 15, color: QUIET, letterSpacing: '0.02em' }}>R 9.00</div>
      <div style={{ position: 'absolute', left: 72, top: y + 3 * u - 4, display: 'flex', alignItems: 'center' }}>{head}</div>
      <div style={{ position: 'absolute', left: 72, bottom: H - (y + 21 * u) - sink, width: x + 3.75 * u - 72 - 72, display: 'flex', flexDirection: 'column' }}>{children}</div>
      <Grain />
    </div>
  )
}

const Name = () => <span style={{ fontSize: 28, lineHeight: 1, color: INK, letterSpacing: '-0.03em', WebkitTextStroke: `0.5px ${INK}` }}>Detent</span>

/** The home image: the mark, lit, and the line Detent stands for. */
export async function homeImage() {
  return new ImageResponse(
    <Stage u={23} sink={10} head={<Name />}>
      <Words text="Interfaces that click into place." size={30} color={INK} tracking={-0.025} leading={1.3} />
      <Words text="React components for AI products." size={30} color={QUIET} tracking={-0.025} leading={1.3} />
    </Stage>,
    await options(),
  )
}

/** A page's image: its name, with a grey turn after it when it has one, and what kind of thing it is above. */
export async function pageImage({ kicker, title, turn, tag }: { kicker: string; title: string; turn?: string; tag?: string }) {
  return new ImageResponse(
    <Stage
      u={21}
      sink={12}
      head={
        <>
          <Name />
          {tag && <span style={{ display: 'flex', alignItems: 'center', height: 28, marginLeft: 14, padding: '0 11px', borderRadius: 28, fontSize: 16, color: QUIET, border: '1px solid rgba(255,255,255,0.16)' }}>{tag}</span>}
        </>
      }
    >
      <span style={{ fontSize: 22, color: QUIET, marginBottom: 14 }}>{kicker}</span>
      <Words text={title} size={60} color={INK} tracking={-0.045} leading={1.08} />
      {turn && <Words text={turn} size={60} color={QUIET} tracking={-0.045} leading={1.08} />}
    </Stage>,
    await options(),
  )
}
