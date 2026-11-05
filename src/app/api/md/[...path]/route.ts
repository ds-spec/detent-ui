import type { NextRequest } from 'next/server'
import { listMarkdownRoutes, renderMarkdown } from '@/lib/md/registry'
import { notFound, options, respond } from '@/lib/md/http'
import { abs, mdAbs, today } from '@/lib/md/format'

function catalogResponse(): Response {
  const routes = listMarkdownRoutes()
  const catalog = {
    generated: today(),
    total: routes.length,
    routes: routes.map((r) => ({
      path: r.path,
      html: abs(r.path),
      markdown: mdAbs(r.path),
      description: r.desc,
      inFull: r.inFull,
    })),
  }
  return Response.json(catalog, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

function canonicalPath(segments: string[]): string {
  if (segments.length === 0) return '/'
  if (segments.length === 1 && segments[0] === 'index') return '/'
  return '/' + segments.join('/')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const segments = (await params).path ?? []
  if (segments.length === 1 && segments[0] === '_catalog') {
    return catalogResponse()
  }

  const path = canonicalPath(segments)
  const { content, isStatic } = renderMarkdown(path)
  if (content === null) return notFound(path)
  return respond(content, path, { isStatic })
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const segments = (await params).path ?? []
  if (segments.length === 1 && segments[0] === '_catalog') {
    const full = catalogResponse()
    return new Response(null, { status: full.status, headers: full.headers })
  }

  const path = canonicalPath(segments)
  const { content, isStatic } = renderMarkdown(path)
  if (content === null) return notFound(path)
  const full = respond(content, path, { isStatic })
  return new Response(null, { status: full.status, headers: full.headers })
}

export async function OPTIONS() {
  return options()
}
