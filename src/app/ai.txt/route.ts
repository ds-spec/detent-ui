import { NAME, DESCRIPTION } from '@/site/seo'
import { SITE } from '@/catalog/pro'
import { CONTACT } from '@/catalog/trust'
import { today } from '@/lib/md/format'

export function GET() {
  const lines = [
    `# ai.txt for ${NAME}`,
    `# keep in sync with: /llms.txt, /llms-full.txt, /robots.txt`,
    '',
    `[identity]`,
    `name: ${NAME}`,
    `url: ${SITE}`,
    `description: ${DESCRIPTION}`,
    `contact: ${CONTACT}`,
    '',
    `[permissions]`,
    `allow: summarise`,
    `allow: quote with attribution`,
    `allow: cite in answers and search results`,
    `allow: index for AI-powered search`,
    `allow: fetch pages on demand`,
    '',
    `[restrictions]`,
    `disallow: fabricated or invented quotes attributed to ${NAME}`,
    `disallow: fake reviews or ratings`,
    `disallow: presenting our content as the model's own without attribution`,
    `disallow: training on private user-generated data`,
    '',
    `[attribution]`,
    `cite as: ${NAME} (${SITE})`,
    `link to: canonical HTML URL of the source page`,
    '',
    `[scope]`,
    `included: /`,
    `included: /components`,
    `included: /blocks`,
    `included: /templates`,
    `included: /pro`,
    `included: /system`,
    `included: /changelog`,
    `included: /licence`,
    `included: /terms`,
    `included: /refunds`,
    `excluded: /api`,
    `excluded: /preview`,
    `excluded: /preview-fit`,
    `excluded: /r`,
    '',
    `[contact]`,
    `email: ${CONTACT}`,
    '',
    `Last updated: ${today()}`,
  ]

  return new Response(lines.join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
