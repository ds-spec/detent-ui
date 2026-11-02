import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { CONTENT_TYPE, OG } from '@/site/og'

/*
 * The image a link to Detent unfurls into, and every page's unless it draws its own (see site/og):
 * the headline on graphite, "won't" printed in the accent's dither, the address under it, and a
 * horizon of dithered light rising from the foot. A still of /preview/og, rendered once into
 * public/media/og/home.png.
 */

export const alt = 'Detent. Most apps look the same. Yours won’t.'
export const size = OG
export const contentType = CONTENT_TYPE

export default async function Image() {
  return new Response(await readFile(path.join(process.cwd(), 'public/media/og/home.png')), { headers: { 'Content-Type': CONTENT_TYPE } })
}
