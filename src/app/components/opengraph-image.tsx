import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { CONTENT_TYPE, OG } from '@/site/og'

export const alt = 'Detent components: a wall of real React components.'
export const size = OG
export const contentType = CONTENT_TYPE

export default async function Image() {
  return new Response(await readFile(path.join(process.cwd(), 'public/media/og/components.png')), { headers: { 'Content-Type': CONTENT_TYPE } })
}
