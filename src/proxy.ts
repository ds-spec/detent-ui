import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SITE } from '@/catalog/pro'

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
  '/docs',
  '/privacy',
]

function isContentPath(pathname: string): boolean {
  if (pathname === '/') return true
  return CONTENT_PATHS.some((p) => p !== '/' && (pathname === p || pathname.startsWith(p + '/')))
}

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

function prefersMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) return false
  const types = parseAccept(acceptHeader)
  const mdEntry = types.find((t) => t.type === 'text/markdown')
  const htmlEntry = types.find((t) => t.type === 'text/html' || t.type === '*/*')
  if (!mdEntry) return false
  if (!htmlEntry) return true
  return mdEntry.q > htmlEntry.q
}

const LOCK_COOKIE = 'detent_lock'
const UNLOCK_PATH = '/__unlock'

async function lockToken(secret: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`detent:${secret}`))
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('')
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

function lockPage(next: string, wrong: boolean) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Detent</title>
<style>:root{color-scheme:light dark;--bg:#fafafa;--ink:#1d1d1f;--ink3:#6e6e73;--field:#f0f0f2;--line:rgb(0 0 0/.08)}@media (prefers-color-scheme:dark){:root{--bg:#141416;--ink:#f5f5f7;--ink3:#a1a1a6;--field:#232327;--line:rgb(255 255 255/.08)}}
*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;background:var(--bg);color:var(--ink);font:15px/1.5 -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,system-ui,sans-serif;padding:20px}
form{width:min(100%,340px)}h1{margin:0;font-size:28px;font-weight:500;letter-spacing:-.04em;line-height:1.1}p{margin:8px 0 22px;color:var(--ink3)}
.row{display:flex;gap:8px}input{flex:1;min-width:0;height:42px;border:0;border-radius:10px;background:var(--field);color:var(--ink);padding:0 14px;font:inherit;outline:none;box-shadow:inset 0 0 0 1px var(--line)}input:focus{box-shadow:inset 0 0 0 1.5px var(--ink)}
button{height:42px;border:0;border-radius:10px;background:var(--ink);color:var(--bg);padding:0 16px;font:inherit;font-weight:500;cursor:pointer}.wrong{margin:10px 0 0;color:#d1453b;font-size:13px}</style></head>
<body><form method="post" action="${UNLOCK_PATH}"><h1>Detent</h1><p>Not open yet.</p><input type="hidden" name="next" value="${escapeHtml(next)}"><div class="row"><input name="password" type="password" placeholder="Password" autocomplete="current-password" autofocus required><button type="submit">Enter</button></div>${wrong ? '<p class="wrong">That isn’t it.</p>' : ''}</form></body></html>`
  return new NextResponse(html, { status: 401, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' } })
}

async function gate(request: NextRequest): Promise<NextResponse | null> {
  const secret = process.env.SITE_LOCK
  if (!secret) return null
  const token = await lockToken(secret)
  const { pathname, search } = request.nextUrl
  if (pathname === UNLOCK_PATH && request.method === 'POST') {
    const form = await request.formData()
    const raw = String(form.get('next') ?? '/')
    const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/'
    if (String(form.get('password') ?? '') !== secret) return lockPage(next, true)
    const res = NextResponse.redirect(new URL(next, request.url), 303)
    res.cookies.set(LOCK_COOKIE, token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 })
    return res
  }
  if (request.cookies.get(LOCK_COOKIE)?.value === token) return null
  return lockPage(pathname + search, false)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const locked = await gate(request)
  if (locked) return locked

  if (pathname.endsWith('.md')) {
    const withoutSuffix = pathname.slice(0, -3) || '/'
    const mdPath = withoutSuffix === '/' || withoutSuffix === '/index' ? '/api/md/index' : `/api/md${withoutSuffix}`
    return NextResponse.rewrite(new URL(mdPath, request.url))
  }

  if (prefersMarkdown(request.headers.get('accept')) && isContentPath(pathname)) {
    const mdPath = pathname === '/' ? '/api/md/index' : `/api/md${pathname}`
    const rewritten = NextResponse.rewrite(new URL(mdPath, request.url))
    rewritten.headers.set('Vary', 'Accept')
    return rewritten
  }

  const res = NextResponse.next()
  if (process.env.SITE_LOCK) res.headers.set('x-robots-tag', 'noindex, nofollow')
  res.headers.set(
    'Link',
    `<${SITE}/llms.txt>; rel="describedby", <${SITE}/llms-full.txt>; rel="describedby", <${SITE}/ai.txt>; rel="describedby"`,
  )
  return res
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|_next/data|favicon\\.ico|sitemap\\.xml|robots\\.txt|manifest\\.webmanifest|\\.well-known|r/).*)',
  ],
}
