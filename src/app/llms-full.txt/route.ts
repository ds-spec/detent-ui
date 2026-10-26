/**
 * /llms-full.txt — Every page concatenated into one markdown document.
 * AI agents can fetch the entire site's content in a single request.
 *
 * keep in sync with: /llms.txt, /ai.txt, /robots.txt, /api/md/_catalog
 *
 * Capped at ~500k chars; if content exceeds that, a warning is logged and the
 * tail is truncated. Dynamic collections (components, blocks) include only the
 * top N items.
 */

import { listMarkdownRoutes } from '@/lib/md/registry'
import { renderMarkdown } from '@/lib/md/registry'
import { NAME, DESCRIPTION } from '@/site/seo'
import { SITE } from '@/catalog/pro'
import { today } from '@/lib/md/format'

const MAX_CHARS = 500_000

export function GET() {
  const routes = listMarkdownRoutes().filter((r) => r.inFull)

  const sections: string[] = [
    `# ${NAME} — full content`,
    `> ${DESCRIPTION}`,
    `Generated: ${today()}`,
    `Total pages: ${routes.length}`,
    '',
  ]

  let totalChars = sections.join('\n').length
  let truncated = false

  for (const route of routes) {
    const { content } = renderMarkdown(route.path)
    if (!content) continue

    const section = [`---`, `<!-- source: ${SITE}${route.path} -->`, content].join('\n')

    if (totalChars + section.length > MAX_CHARS) {
      console.warn(`[llms-full.txt] Content exceeded ${MAX_CHARS} chars, truncating at ${route.path}`)
      sections.push('---', `<!-- Content truncated at ${MAX_CHARS} chars. See /api/md/_catalog for the full route list. -->`)
      truncated = true
      break
    }

    sections.push(section)
    totalChars += section.length
  }

  if (truncated) {
    sections.push(``, `See ${SITE}/api/md/_catalog for the complete route list.`)
  }

  const body = sections.join('\n') + '\n'

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      'X-Markdown-Tokens': String(Math.ceil(body.length / 4)),
      'Access-Control-Allow-Origin': '*',
    },
  })
}
