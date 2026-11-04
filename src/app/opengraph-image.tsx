import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { CONTENT_TYPE, OG } from '@/site/og'

/*
 * The image a link to Detent unfurls into, and every page's unless it draws its own (see site/og):
 * the Seated D made of fine points of light, lit from its upper right, on near black, with the name
 * and along its foot "The React component library" over "Most apps look the same. Yours won’t." A still of /preview/og-v2, rendered once at twice the size into public/media/og/home.png.
 */

export const alt = 'Detent, the React component library. Most apps look the same. Yours won’t.'
export const size = OG
export const contentType = CONTENT_TYPE

export default async function Image() {
  return new Response(await readFile(path.join(process.cwd(), 'public/media/og/home.png')), { headers: { 'Content-Type': CONTENT_TYPE } })
}
