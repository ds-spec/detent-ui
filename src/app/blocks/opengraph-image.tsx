import { BLOCKS } from '@/pro/blocks/meta'
import { CONTENT_TYPE, OG, pageImage } from '@/site/og'

export const alt = 'Detent blocks: whole screens for AI products, already working.'
export const size = OG
export const contentType = CONTENT_TYPE

export default async function Image() {
  return pageImage({
    kicker: `${BLOCKS.length} blocks`,
    title: 'Whole screens,',
    turn: 'already working.',
    tag: 'Pro',
  })
}
