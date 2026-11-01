import { CONTENT_TYPE, OG, homeImage } from '@/site/og'

/* The image a link to Detent unfurls into, and every page's unless it draws its own (see site/og). */

export const alt = 'Detent — premium React components. Interfaces that click into place.'
export const size = OG
export const contentType = CONTENT_TYPE

export default async function Image() {
  return homeImage()
}
