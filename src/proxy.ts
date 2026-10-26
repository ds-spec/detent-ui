/**
 * proxy.ts — rewrites .md suffix requests and Accept: text/markdown negotiation
 * to /api/md/<path>, the single markdown handler.
 *
 * Rules:
 * - .md suffix: /pricing.md → /api/md/pricing; /index.md → /api/md/index
 *   Any non-excluded .md request is routed to the markdown handler (which returns a
 *   clean markdown 404 if the page does not exist).
 * - Content negotiation: Accept header containing text/markdown with higher q than text/html
 *   → rewrite to /api/md/<path> for known content paths.
 * - *‌/*, missing Accept, or text/html-preferred = pass through untouched.
 * - Adds a global Link response header advertising /llms.txt, /llms-full.txt and /ai.txt
 *   on all HTML responses.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SITE } from '@/catalog/pro'

// ─── Allowlist for content negotiation ─────────────────────────────────────────
// Only these path prefixes (and exact matches) will negotiate markdown via Accept header.
const CONTENT_PATHS = [
  '/',
  '/pro',
  '/components',
  '/blocks',
  '/templates',
  '/ai-sdk',
  '/system',
  '/changelog',
  '/licence',
  '/terms',
  '/refunds',
]

/** Returns true when the path is a public content route we have a renderer for. */
function isContentPath(pathname: string): boolean {
  if (pathname === '/') return true
  return CONTENT_PATHS.some((p) => p !== '/' && (pathname === p || pathname.startsWith(p + '/')))
}

// ─── Accept header parsing ────────────────────────────────────────────────────

type MediaType = { type: string; q: number }

function parseAccept(header: string | null): MediaType[] {
  if (!header) return []
  return header
    .split(',')
    .map((part) => {
      const [typeRaw, ...params] = part.trim().split(';')
      const type = typeRaw.trim().toLowerCase()
      const qParam = params.find((p) => p.trim().startsWith('q='))
      const q = qParam ? parseFloat(qParam.split('=')[1]) : 1
      return { type, q: isNaN(q) ? 1 : q }
    })
    .sort((a, b) => b.q - a.q)
}

/**
 * Returns true when the client explicitly prefers text/markdown over text/html.
 * A plain *‌/* or missing Accept never triggers this — browsers and curl must keep getting HTML.
 */
function prefersMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) return false
  const types = parseAccept(acceptHeader)
  const mdEntry = types.find((t) => t.type === 'text/markdown')
  const htmlEntry = types.find((t) => t.type === 'text/html' || t.type === '*/*')
  if (!mdEntry) return false
  if (!htmlEntry) return true
  return mdEntry.q > htmlEntry.q
}

// ─── Proxy function ────────────────────────────────────────────────────────────

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. .md suffix: /foo/bar.md → /api/md/foo/bar
  if (pathname.endsWith('.md')) {
    const withoutSuffix = pathname.slice(0, -3) || '/'
    const mdPath = withoutSuffix === '/' || withoutSuffix === '/index' ? '/api/md/index' : `/api/md${withoutSuffix}`
    return NextResponse.rewrite(new URL(mdPath, request.url))
  }

  // 2. Content negotiation: Accept: text/markdown with higher q than text/html
  if (prefersMarkdown(request.headers.get('accept')) && isContentPath(pathname)) {
    const mdPath = pathname === '/' ? '/api/md/index' : `/api/md${pathname}`
    const rewritten = NextResponse.rewrite(new URL(mdPath, request.url))
    rewritten.headers.set('Vary', 'Accept')
    return rewritten
  }

  // 3. All other requests pass through — HTML is untouched.
  //    Advertise /llms.txt, /llms-full.txt and /ai.txt via Link response header.
  const res = NextResponse.next()
  res.headers.set(
    'Link',
    `<${SITE}/llms.txt>; rel="describedby", <${SITE}/llms-full.txt>; rel="describedby", <${SITE}/ai.txt>; rel="describedby"`,
  )
  return res
}

// ─── Matcher ──────────────────────────────────────────────────────────────────
// Exclude: API routes, Next.js internals, static assets, well-known, robots/sitemap.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|_next/data|favicon\\.ico|sitemap\\.xml|robots\\.txt|manifest\\.webmanifest|\\.well-known|r/).*)',
  ],
}
