import 'server-only'
import { createHash } from 'node:crypto'
import { getSessionCookie } from 'better-auth/cookies'
import { headers } from 'next/headers'
import { connection } from 'next/server'
import { COOKIE_PREFIX, getAuth } from './auth'

/*
 * Who's signed in, for the rest of the site. Sessions are Better Auth's (./auth.ts) and last 30
 * days. Everything a person can do here follows their email, so only an email they've proven
 * counts as signed in.
 */

export const hash = (secret: string) => createHash('sha256').update(secret).digest('hex')
export const normalEmail = (value: unknown) => {
  const email = String(value ?? '').trim().toLowerCase()
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}

export type Account = { id: string; email: string; name: string; image: string | null }

/** Who's signed in, with a verified email, or null. */
export async function currentAccount(): Promise<Account | null> {
  const request = await headers()
  if (!getSessionCookie(request, { cookiePrefix: COOKIE_PREFIX })) return null
  await connection()
  const session = await (await getAuth()).api.getSession({ headers: request })
  const email = session?.user.emailVerified ? normalEmail(session.user.email) : null
  return session && email ? { id: session.user.id, email, name: session.user.name?.trim() ?? '', image: session.user.image ?? null } : null
}

/** The signed-in, verified email, or null. */
export async function currentEmail() {
  return (await currentAccount())?.email ?? null
}

export async function endSession() {
  await (await getAuth()).api.signOut({ headers: await headers() })
}
