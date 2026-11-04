import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import type { ReactNode } from 'react'

/*
 * The images links unfurl into. One object: the Seated D made of fine points of light on near black,
 * lit from its upper right, the way the home image is (a still of /preview/og-v2, drawn once into
 * public/media/og/lit-d.png and set here as an image), centred. Little type, along the foot: the
 * wordmark on the left, the page's name on the right.
 * Set in Geist Regular with its kerning table taken out: the renderer measures each word without
 * kerning but draws it with kerning, which leaves a gap after any word with a kerned pair. Without
 * the table the two agree and the spacing is even. (Geist is under the SIL Open Font Licence.)
 */

let font: Promise<Buffer> | null = null
const geist = () => (font ??= import('../../.detent/og-font.json').then((m) => Buffer.from(m.default.data, 'base64')))
const options = async () => ({ ...OG, fonts: [{ name: 'Geist', data: await geist(), weight: 400 as const, style: 'normal' as const }] })

let art: Promise<string> | null = null
const litD = () => (art ??= readFile(path.join(process.cwd(), 'public/media/og/lit-d.png')).then((b) => `data:image/png;base64,${b.toString('base64')}`))

export const OG = { width: 1200, height: 630 }
export const CONTENT_TYPE = 'image/png'

const H = OG.height
const INK = '#ededed'
const QUIET = '#8f8f8f'

/** The art is 560×630 with the D 378 high at its centre. It sits centred, raised to leave the foot for type. */
const ART = { w: 560, rise: 28 }
/** The bar of type along the foot. */
const EDGE = 56

/**
 * Every image's layout, the home image's: the lit D centred, and along the foot the wordmark on
 * the left and what the page is on the right.
 */
async function Stage({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: '#030305' }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori draws plain img */}
      <img src={await litD()} width={ART.w} height={H} style={{ position: 'absolute', left: (OG.width - ART.w) / 2, top: -ART.rise }} alt="" />
      <div style={{ position: 'absolute', left: EDGE, bottom: EDGE - 4, display: 'flex', alignItems: 'center' }}>{head}</div>
      <div style={{ position: 'absolute', right: EDGE, bottom: EDGE - 10, width: 820, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>{children}</div>
    </div>
  )
}

/** The wordmark: the Seated D and the name. */
const Name = () => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <svg width={22} height={24} viewBox="3.75 3 16.5 18" style={{ marginRight: 11 }}>
      <rect x="3.75" y="3" width="5.5" height="18" rx="1.1" fill={INK} />
      <path d="M11.25 3a9 9 0 0 1 0 18z" fill={INK} />
    </svg>
    <span style={{ fontSize: 26, lineHeight: 1, color: INK, letterSpacing: '-0.03em', WebkitTextStroke: `0.5px ${INK}` }}>Detent</span>
  </div>
)

/** A page's image: its name, with a grey turn after it when it has one, and what kind of thing it is above. */
export async function pageImage({ kicker, title, turn, tag }: { kicker: string; title: string; turn?: string; tag?: string }) {
  const words = [...title.split(' ').map((w) => [w, INK]), ...(turn ? turn.split(' ').map((w) => [w, QUIET]) : [])]
  return new ImageResponse(
    await Stage({
      head: (
        <>
          <Name />
          {tag && <span style={{ display: 'flex', alignItems: 'center', height: 26, marginLeft: 12, padding: '0 10px', borderRadius: 26, fontSize: 15, color: QUIET, border: '1px solid rgba(255,255,255,0.16)' }}>{tag}</span>}
        </>
      ),
      // An array, not a fragment: Satori lays a fragment's children out in a row.
      children: [
        <span key="k" style={{ fontSize: 19, color: QUIET, marginBottom: 8 }}>{kicker}</span>,
        <div key="t" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', fontSize: 36, lineHeight: 1.12, letterSpacing: '-0.035em', columnGap: 36 * 0.24 }}>
          {words.map(([w, color], i) => (
            <span key={i} style={{ color }}>
              {w}
            </span>
          ))}
        </div>,
      ],
    }),
    await options(),
  )
}
