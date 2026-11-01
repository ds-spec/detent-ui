import { TOTAL_DAYS } from '@/catalog/effort'
import { PLANS } from '@/catalog/pro'
import { CONTENT_TYPE, OG, pageImage } from '@/site/og'

export const alt = 'Detent Pro: premium React components, whole screens and templates.'
export const size = OG
export const contentType = CONTENT_TYPE

export default async function Image() {
  return pageImage({
    kicker: 'Detent Pro',
    title: `${TOTAL_DAYS} days of work.`,
    turn: `Yours for $${PLANS[0].price}.`,
    tag: 'Pro',
  })
}
