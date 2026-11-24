import { addRequest, addRequestEmail, cleanPicks, cleanText } from '@/lib/account/requests'
import { allowed, cleanEmail } from '@/lib/account/subscribers'
import { deliver } from '@/lib/account/mail'
import { CONTACT } from '@/catalog/trust'
import { capture, isLocal } from '@/lib/posthog-server'
import { NOTRACK, VISITOR, cookieOf } from '@/site/source'

const answer = (body: { ok: true; id?: string } | { error: 'invalid' | 'limited' | 'failed' }, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } })

/* A piece someone wants that Detent doesn't have: first the words, then, if they like, an email for when it ships */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { text?: unknown; picks?: unknown; id?: unknown; email?: unknown; company?: unknown } | null
  if (!body) return answer({ error: 'invalid' }, 400)
  if (typeof body.company === 'string' && body.company) return answer({ ok: true })
  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'

  try {
    if (!(await allowed(`request:${ip}`, 12))) return answer({ error: 'limited' }, 429)
    if (typeof body.id === 'string') {
      const email = cleanEmail(body.email)
      if (!email || !/^[0-9a-f-]{36}$/.test(body.id)) return answer({ error: 'invalid' }, 400)
      await addRequestEmail(body.id, email)
      return answer({ ok: true })
    }
    const text = cleanText(body.text)
    if (text.length < 3) return answer({ error: 'invalid' }, 400)
    const picks = cleanPicks(body.picks)
    const country = req.headers.get('cf-ipcountry')?.slice(0, 2) || null
    const id = await addRequest(text, picks, country)
    /* A note to the owner for every new request or wish. It carries the words and the country, never an email address
       (a requester's email only arrives later, on its own call, and isn't sent anywhere). A failed mail never fails the request. */
    try {
      const wish = picks.split(',')[0] === 'wish'
      await deliver({
        to: process.env.DETENT_NOTIFY_TO ?? CONTACT,
        subject: `${wish ? 'New wish' : 'New piece request'}: ${text.replace(/^Wish:\s*/, '').slice(0, 70)}`,
        text: [text, '', `Picks: ${picks || 'none'}`, `Country: ${country ?? 'unknown'}`, `Id: ${id}`].join('\n'),
      })
    } catch (error) {
      console.error('[request] notify', error)
    }
    const cookies = req.headers.get('cookie')
    /* analytics gets that a request happened, never the words or an email */
    if (!isLocal(req) && !cookieOf(cookies, NOTRACK)) {
      const visitor = cookieOf(cookies, VISITOR)
      await capture(visitor ?? crypto.randomUUID(), 'piece_requested', { matched: picks ? picks.split(',').length : 0, $geoip_disable: true, ...(visitor ? {} : { $process_person_profile: false }) })
    }
    return answer({ ok: true, id })
  } catch (error) {
    console.error('[request]', error)
    return answer({ error: 'failed' }, 500)
  }
}
