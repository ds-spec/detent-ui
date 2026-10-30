import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { connection } from 'next/server'
import { SITE } from '@/catalog/site'
import { db } from './db'

/*
 * Signing in by email. A link carries a long random token that lasts 15 minutes and works once; the
 * session it starts lasts 30 days. Both are stored hashed, so the database alone can't sign anyone
 * in. Opening a link only shows a button, and pressing it is what spends the token, because mail
 * scanners open every link they see.
 */

const COOKIE = 'detent_session'
const LINK_MINUTES = 15
const SESSION_DAYS = 30
const HOUR = 3_600_000

export const hash = (secret: string) => createHash('sha256').update(secret).digest('hex')
export const normalEmail = (value: unknown) => {
  const email = String(value ?? '').trim().toLowerCase()
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}

/** Counts this try against a bucket, and says whether it's within the hour's limit. */
async function allowed(bucket: string, limit: number) {
  const client = await db()
  const now = Date.now()
  const { rows } = await client.execute({ sql: 'select count(*) as n from attempt where bucket = ? and at > ?', args: [bucket, now - HOUR] })
  if (Number(rows[0].n) >= limit) return false
  await client.execute({ sql: 'insert into attempt (bucket, at) values (?, ?)', args: [bucket, now] })
  return true
}

async function deliver(email: string, url: string) {
  const text = `Sign in to Detent:\n\n${url}\n\nThe link lasts ${LINK_MINUTES} minutes and works once. If you didn’t ask for it, you can ignore this email.`
  const key = process.env.RESEND_API_KEY
  if (!key) {
    if (process.env.NODE_ENV === 'production') throw new Error('RESEND_API_KEY isn’t set')
    console.log(`\n[detent] Sign-in link for ${email}: ${url}\n`)
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: process.env.DETENT_MAIL_FROM ?? 'Detent <hello@detentui.com>', to: email, subject: 'Sign in to Detent', text }),
  })
  if (!res.ok) throw new Error(`Resend answered ${res.status}`)
}

/** Emails a sign-in link. False when this address or network has asked too often. */
export async function sendLink(email: string, ip: string) {
  if (!(await allowed(`email:${email}`, 5)) || !(await allowed(`ip:${ip}`, 20))) return false
  const client = await db()
  const now = Date.now()
  const token = randomBytes(32).toString('base64url')
  await client.batch(
    [
      { sql: 'delete from link where expires_at < ?', args: [now] },
      { sql: 'delete from session where expires_at < ?', args: [now] },
      { sql: 'delete from attempt where at < ?', args: [now - HOUR] },
      { sql: 'insert into link (hash, email, expires_at) values (?, ?, ?)', args: [hash(token), email, now + LINK_MINUTES * 60_000] },
    ],
    'write',
  )
  await deliver(email, `${SITE}/account/confirm#${token}`)
  return true
}

/** Who a link would sign in, without spending it. */
export async function linkEmail(token: string) {
  const client = await db()
  const { rows } = await client.execute({ sql: 'select email from link where hash = ? and used_at is null and expires_at > ?', args: [hash(token), Date.now()] })
  return rows.length ? String(rows[0].email) : null
}

/** Spends a link and starts a session. False if it was used already or ran out. */
export async function spendLink(token: string) {
  const client = await db()
  const now = Date.now()
  const spent = await client.execute({ sql: 'update link set used_at = ? where hash = ? and used_at is null and expires_at > ? returning email', args: [now, hash(token), now] })
  if (!spent.rows.length) return false
  const session = randomBytes(32).toString('base64url')
  const maxAge = SESSION_DAYS * 86_400
  await client.execute({ sql: 'insert into session (hash, email, expires_at) values (?, ?, ?)', args: [hash(session), String(spent.rows[0].email), now + maxAge * 1000] })
  ;(await cookies()).set(COOKIE, session, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge })
  return true
}

/** The signed-in email, or null. */
export async function currentEmail() {
  const session = (await cookies()).get(COOKIE)?.value
  if (!session) return null
  await connection()
  const client = await db()
  const { rows } = await client.execute({ sql: 'select email from session where hash = ? and expires_at > ?', args: [hash(session), Date.now()] })
  return rows.length ? String(rows[0].email) : null
}

export async function endSession() {
  const store = await cookies()
  const session = store.get(COOKIE)?.value
  if (session) await (await db()).execute({ sql: 'delete from session where hash = ?', args: [hash(session)] })
  store.delete(COOKIE)
}
