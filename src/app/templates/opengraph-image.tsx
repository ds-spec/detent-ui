import { CONTENT_TYPE, OG, pageImage } from '@/site/og'
import { TEMPLATES } from '@/catalog/templates'

export const alt = 'Detent templates: whole landing pages and apps for AI products.'
export const size = OG
export const contentType = CONTENT_TYPE

export default async function Image() {
  return pageImage({
    kicker: `${TEMPLATES.length} templates`,
    title: 'Whole apps,',
    turn: 'ready to ship.',
    tag: 'Pro',
  })
}
