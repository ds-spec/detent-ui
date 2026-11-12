/* Where a visitor came from, kept in first-party cookies so the checkout route can hand it to Dodo
   and the Dodo webhook can put it on the PostHog purchase event.
   First touch is set once and kept 90 days. Last touch is replaced on every visit from outside. */

export type Source = { source: string; medium?: string; campaign?: string; content?: string; referrer?: string; landing?: string; at?: string }

export const FIRST = 'dt_src'
export const LAST = 'dt_last'
export const VISITOR = 'dt_vid'
export const NOTRACK = 'dt_notrack'
export const KEEP = 60 * 60 * 24 * 90

/** Hosts that are the site itself or the checkout coming back: not a new touch. */
const OWN = /(^|\.)(detentui\.com|dodopayments\.com|localhost|127\.0\.0\.1)$/

const NAMED: [RegExp, string][] = [
  [/(^|\.)(t\.co|x\.com|twitter\.com)$/, 'x'],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, 'linkedin'],
  [/(^|\.)news\.ycombinator\.com$/, 'hackernews'],
  [/(^|\.)producthunt\.com$/, 'producthunt'],
  [/(^|\.)reddit\.com$/, 'reddit'],
  [/(^|\.)medium\.com$/, 'medium'],
  [/(^|\.)github\.com$/, 'github'],
  [/(^|\.)shadcn\.com$/, 'shadcn'],
  [/(^|\.)google\.[a-z.]+$/, 'google'],
  [/(^|\.)bing\.com$/, 'bing'],
  [/(^|\.)duckduckgo\.com$/, 'duckduckgo'],
  [/(^|\.)(chatgpt\.com|openai\.com)$/, 'chatgpt'],
  [/(^|\.)perplexity\.ai$/, 'perplexity'],
  [/(^|\.)claude\.ai$/, 'claude'],
]

const ALIAS: Record<string, string> = { twitter: 'x', tw: 'x', li: 'linkedin', ph: 'producthunt', hn: 'hackernews' }

const clip = (v: string | null | undefined, n = 80) => v?.trim().slice(0, n) || undefined

const hostOf = (href: string) => {
  try {
    return new URL(href).hostname.replace(/^www\./, '')
  } catch {
    return undefined
  }
}

/** The touch this page view represents, or null when it is direct or internal. */
export function sourceOf(href: string, referrer: string): Source | null {
  const url = new URL(href)
  const q = url.searchParams
  const tagged = clip(q.get('utm_source') ?? q.get('ref') ?? q.get('via'))?.toLowerCase()
  let domain = referrer ? hostOf(referrer) : undefined
  if (domain && OWN.test(domain)) domain = undefined
  if (!tagged && !domain) return null
  return {
    source: tagged ? (ALIAS[tagged] ?? tagged) : (NAMED.find(([re]) => re.test(domain!))?.[1] ?? domain!),
    medium: clip(q.get('utm_medium')) ?? (tagged ? undefined : 'referral'),
    campaign: clip(q.get('utm_campaign')),
    content: clip(q.get('utm_content')),
    referrer: domain,
    landing: clip(url.pathname, 120),
    at: new Date().toISOString().slice(0, 10),
  }
}

export function cookieOf(header: string | null | undefined, name: string) {
  const raw = header
    ?.split(/;\s*/)
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1)
  if (!raw) return undefined
  try {
    return decodeURIComponent(raw)
  } catch {
    return undefined
  }
}

export function readSource(value: string | undefined): Source | null {
  if (!value) return null
  try {
    const s = JSON.parse(value)
    return s && typeof s.source === 'string' ? (s as Source) : null
  } catch {
    return null
  }
}

/** Browser only. Records this page view's touch and returns first and last touch. */
export function rememberSource() {
  const put = (name: string, value: string) => {
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${KEEP}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
  }
  const touch = sourceOf(location.href, document.referrer)
  if (touch) put(LAST, JSON.stringify(touch))
  if (!readSource(cookieOf(document.cookie, FIRST))) {
    put(FIRST, JSON.stringify(touch ?? { source: 'direct', landing: location.pathname, at: new Date().toISOString().slice(0, 10) }))
  }
  return { first: readSource(cookieOf(document.cookie, FIRST)), last: readSource(cookieOf(document.cookie, LAST)) }
}

export function setVisitor(id: string) {
  document.cookie = `${VISITOR}=${encodeURIComponent(id)}; Max-Age=${KEEP}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
}

/** Dodo metadata from the request cookies: first touch, last touch and the PostHog visitor id. */
export function sourceMetadata(header: string | null | undefined) {
  const first = readSource(cookieOf(header, FIRST))
  const last = readSource(cookieOf(header, LAST))
  const out: Record<string, string> = {}
  const set = (key: string, value: string | undefined) => {
    if (value) out[key] = value.slice(0, 120)
  }
  set('source', first?.source)
  set('medium', first?.medium)
  set('campaign', first?.campaign)
  set('referrer', first?.referrer)
  set('landing', first?.landing)
  set('first_seen', first?.at)
  set('last_source', last?.source)
  set('last_medium', last?.medium)
  set('last_campaign', last?.campaign)
  set('last_content', last?.content)
  set('visitor', cookieOf(header, VISITOR))
  return out
}
