import { deliver } from '@/lib/account/mail'
import { allowed, cleanEmail, cleanSource, listHeaders, subscribe, welcomeSubscriber } from '@/lib/account/subscribers'
import { capture, isLocal } from '@/lib/posthog-server'
import { NOTRACK, VISITOR, cookieOf } from '@/site/source'

const answer = (body: { ok: true } | { error: 'invalid' | 'limited' | 'failed' }, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } })

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: unknown; source?: unknown; company?: unknown } | null
  if (!body) return answer({ error: 'invalid' }, 400)
  if (typeof body.company === 'string' && body.company) return answer({ ok: true })
  const email = cleanEmail(body.email)
  if (!email) return answer({ error: 'invalid' }, 400)
  const source = cleanSource(body.source)
  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const country = req.headers.get('cf-ipcountry')?.slice(0, 2) || null

  try {
    if (!(await allowed(`subscribe:${ip}`, 6))) return answer({ error: 'limited' }, 429)
    const fresh = await subscribe(email, source, country)
    if (fresh) await deliver({ to: email, ...welcomeSubscriber(email), headers: listHeaders(email) }).catch((error) => console.error('[subscribe] welcome mail', error))
  } catch (error) {
    console.error('[subscribe]', error)
    return answer({ error: 'failed' }, 500)
  }

  const cookies = req.headers.get('cookie')
  if (!isLocal(req) && !cookieOf(cookies, NOTRACK)) {
    const visitor = cookieOf(cookies, VISITOR)
    await capture(visitor ?? crypto.randomUUID(), 'subscribed', { source, country, $geoip_disable: true, ...(visitor ? {} : { $process_person_profile: false }) })
  }
  return answer({ ok: true })
}
