import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { SITE } from '@/catalog/site'
import { db } from './db'

const HOUR = 3_600_000
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const cleanEmail = (v: unknown) => {
  if (typeof v !== 'string') return null
  const email = v.trim().toLowerCase()
  return email.length <= 254 && EMAIL.test(email) ? email : null
}

export const cleanSource = (v: unknown) => (typeof v === 'string' && /^(home|pro|component:[a-z0-9-]{1,48})$/.test(v) ? v : 'other')

const secret = () => {
  const s = process.env.BETTER_AUTH_SECRET
  if (!s) throw new Error('BETTER_AUTH_SECRET isn’t set')
  return s
}

const sign = (email: string) => createHmac('sha256', secret()).update(`unsubscribe:${email}`).digest('base64url').slice(0, 24)

export const unsubscribeToken = (email: string) => `${Buffer.from(email).toString('base64url')}.${sign(email)}`

export function emailOfUnsubscribe(token: string) {
  const [id, mac] = token.split('.')
  if (!id || !mac) return null
  const email = Buffer.from(id, 'base64url').toString()
  const want = Buffer.from(sign(email))
  const given = Buffer.from(mac)
  return want.length === given.length && timingSafeEqual(want, given) ? email : null
}

export const unsubscribeLink = (email: string) => `${SITE}/unsubscribe/${unsubscribeToken(email)}`
export const unsubscribePost = (email: string) => `${SITE}/api/unsubscribe?t=${unsubscribeToken(email)}`

export const listHeaders = (email: string) => ({
  'List-Unsubscribe': `<${unsubscribePost(email)}>`,
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
})

export async function allowed(bucket: string, limit: number) {
  const client = await db()
  const now = Date.now()
  const { rows } = await client.execute({ sql: 'select count(*) as n from attempt where bucket = ? and at > ?', args: [bucket, now - HOUR] })
  if (Number(rows[0].n) >= limit) return false
  await client.batch(
    [
      { sql: 'delete from attempt where at < ?', args: [now - HOUR] },
      { sql: 'insert into attempt (bucket, at) values (?, ?)', args: [bucket, now] },
    ],
    'write',
  )
  return true
}

export async function subscribe(email: string, source: string, country: string | null) {
  const client = await db()
  const { rows } = await client.execute({ sql: 'select unsubscribed_at from subscriber where email = ?', args: [email] })
  const fresh = !rows.length || rows[0].unsubscribed_at != null
  await client.execute({
    sql: 'insert into subscriber (email, source, created_at, country) values (?, ?, ?, ?) on conflict (email) do update set unsubscribed_at = null',
    args: [email, source, Date.now(), country],
  })
  return fresh
}

export async function unsubscribe(email: string) {
  const client = await db()
  await client.execute({ sql: 'update subscriber set unsubscribed_at = ? where email = ? and unsubscribed_at is null', args: [Date.now(), email] })
}

export async function resubscribe(email: string) {
  const client = await db()
  await client.execute({ sql: 'update subscriber set unsubscribed_at = null where email = ?', args: [email] })
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function welcomeSubscriber(email: string) {
  const out = unsubscribeLink(email)
  const library = `${SITE}/components`
  const subject = 'You’re in'
  const text = [
    'Hey,',
    '',
    'Thanks for signing up. Every Friday you’ll get one new free component from Detent: what it does, a short clip, and the one command to install it.',
    '',
    'Black Friday is close too. On Nov 24 you’ll hear about the deal before anyone else.',
    '',
    'While you wait, the free ones are all live on the site:',
    `Browse components: ${library}`,
    '',
    'Reply to this email any time. I read every one.',
    '',
    '— Deep from Detent',
    '',
    '---',
    `You signed up at detentui.com. Unsubscribe in one click: ${out}`,
  ].join('\n')

  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Helvetica,Arial,sans-serif"
  const p = 'margin:0 0 16px;font-size:15px;line-height:24px;color:#1c1b19'

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#ffffff;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden">One new component, every Friday.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff"><tr><td align="center" style="padding:44px 20px 36px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px"><tr><td style="font-family:${font}">
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 26px"><tr><td width="28" height="28" align="center" valign="middle" style="width:28px;height:28px;border-radius:8px;background:#1c1b19;color:#ffffff;font-family:${font};font-size:15px;font-weight:700;line-height:28px">D</td></tr></table>
<p style="${p}">Hey,</p>
<p style="${p}">Thanks for signing up. Every Friday you’ll get one new free component from Detent: what it does, a short clip, and the one command to install it.</p>
<p style="${p}">Black Friday is close too. On <strong style="font-weight:600">Nov 24</strong> you’ll hear about the deal before anyone else.</p>
<p style="${p}">While you wait, the free ones are all live on the site:</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:2px 0 20px"><tr><td style="border-radius:9px;background:#1c1b19"><a href="${library}" style="display:inline-block;padding:11px 18px;font-family:${font};font-size:14px;font-weight:500;color:#ffffff;text-decoration:none;border-radius:9px">Browse components →</a></td></tr></table>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#77756f">Reply to this email any time. I read every one.</p>
<p style="margin:0;font-size:15px;line-height:24px;color:#1c1b19">— Deep from Detent</p>
<div style="height:1px;background:#eeede9;margin:36px 0 14px"></div>
<p style="margin:0;font-size:12px;line-height:18px;color:#9a9893">You signed up at <a href="${SITE}" style="color:#9a9893;text-decoration:none">detentui.com</a>. <a href="${esc(out)}" style="color:#9a9893;text-decoration:underline">Unsubscribe in one click.</a></p>
</td></tr></table>
</td></tr></table>
</body></html>`

  return { subject, text, html }
}
