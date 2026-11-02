import { PLANS } from '@/catalog/pro'
import { CONTENT_TYPE, OG, pageImage } from '@/site/og'

export const alt = 'Detent Pro: premium React components, whole screens and templates.'
export const size = OG
export const contentType = CONTENT_TYPE

export default async function Image() {
  return pageImage({
    kicker: 'Detent Pro',
    title: 'Make your app feel expensive.',
    turn: `$${PLANS[0].price}, once.`,
    tag: 'Pro',
  })
}
