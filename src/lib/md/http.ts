/**
 * HTTP response builder for every markdown endpoint.
 * Applies all required headers from the prompt spec in one place.
 */

import { SITE } from '@/catalog/pro'

/** The required headers for every markdown response. */
function mdHeaders(path: string, isStatic = false): HeadersInit {
  return {
    'Content-Type': 'text/markdown; charset=utf-8',
    'X-Robots-Tag': 'noindex, follow',
    'Content-Location': `${SITE}${path}`,
    'Link': `<${SITE}${path}>; rel="canonical", <${SITE}/llms.txt>; rel="describedby", <${SITE}/llms-full.txt>; rel="describedby", <${SITE}/ai.txt>; rel="describedby"`,
    'Vary': 'Accept',
    'Cache-Control': isStatic
      ? 'public, s-maxage=86400, stale-while-revalidate=604800'
      : 'public, s-maxage=3600, stale-while-revalidate=86400',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  }
}

/**
 * Build a markdown Response with the correct headers.
 * `canonicalPath` is the HTML page path (e.g. "/pricing"), without ".md".
 */
export function respond(
  body: string,
  canonicalPath: string,
  { isStatic = false, status = 200 }: { isStatic?: boolean; status?: number } = {},
): Response {
  const headers = new Headers(mdHeaders(canonicalPath, isStatic) as Record<string, string>)
  // Approximate token count: characters / 4
  headers.set('X-Markdown-Tokens', String(Math.ceil(body.length / 4)))
  return new Response(body, { status, headers })
}

/** Respond to an OPTIONS preflight request. */
export function options(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Accept',
    },
  })
}

/** Standard markdown 404 body. */
export function notFound(path: string): Response {
  const body = `# 404 — Not Found\n\n> The page \`${path}\` does not exist or is not available as markdown.\n\nCanonical: ${SITE}${path}\n`
  return respond(body, path, { status: 404 })
}
