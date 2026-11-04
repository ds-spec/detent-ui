import 'server-only'
import type { Client } from '@libsql/client'
import { LibsqlDialect } from '@libsql/kysely-libsql'
import { dash } from '@better-auth/infra'
import { betterAuth } from 'better-auth'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { nextCookies } from 'better-auth/next-js'
import { lastLoginMethod, magicLink } from 'better-auth/plugins'
import { SITE } from '@/catalog/site'
import { db } from './db'
import { safeNext } from './next'

/*
 * Signing in, by Better Auth, in the same Turso database as the keys and purchases. The ways in are
 * an emailed link, which always works, and GitHub and Google once their OAuth apps are set
 * (GITHUB_CLIENT_ID and _SECRET, GOOGLE_CLIENT_ID and _SECRET). What a person can install still
 * follows their email, so only an email someone has proven counts: a link proves it, and GitHub or
 * Google count only when they say the address is verified. An account is only joined to one
 * that's already here when both sides have proven the same address.
 *
 * The link opens /account/confirm rather than signing in on the spot, because mail scanners open
 * every link they see; pressing the button there is what spends it.
 *
 * dash() connects Better Auth's dashboard. It reports sign-ins to dash.better-auth.com, so it's only
 * mounted once BETTER_AUTH_API_KEY is set.
 */

export const COOKIE_PREFIX = 'detent'
/**
 * Says only that this browser is signed in, for the header to show Account rather than Sign in.
 * Readable by the page, unlike the session itself, and it opens nothing.
 */
export const SIGNED_IN = 'detent.in'
/** How this browser signed in last time (github, google or magic-link), so its button can say so. */
export const LAST_USED = 'detent.last_used'
const LINK_MINUTES = 15
const HOUR = 3_600_000
const dev = process.env.NODE_ENV === 'development'

/** Counts this try against a bucket, and says whether it's within the hour's limit. */
async function allowed(bucket: string, limit: number) {
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

async function deliver(email: string, url: string) {
  const text = `Sign in to Detent:\n\n${url}\n\nThe link lasts ${LINK_MINUTES} minutes and works once. If you didn’t ask for it, you can ignore this email.`
  const key = process.env.RESEND_API_KEY
  if (!key) {
    if (!dev) throw new Error('RESEND_API_KEY isn’t set')
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

/** The OAuth providers that are set up, in the order their buttons show. */
export function socialProviders() {
  const env = process.env
  return {
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET ? { github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET } } : {}),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, prompt: 'select_account' as const } } : {}),
  }
}
export type Provider = 'github' | 'google'

const create = (client: Client) =>
  betterAuth({
    appName: 'Detent',
    // Locally, whichever port the dev server is on; deployed, only the site's own address.
    baseURL: dev ? { allowedHosts: ['localhost:*', '127.0.0.1:*'], protocol: 'http', fallback: 'http://localhost:3000' } : SITE,
    secret: process.env.BETTER_AUTH_SECRET,
    database: { dialect: new LibsqlDialect({ client }), type: 'sqlite' },
    user: { modelName: 'auth_user' },
    session: { modelName: 'auth_session', expiresIn: 30 * 86_400, updateAge: 86_400 },
    account: { modelName: 'auth_account', encryptOAuthTokens: true },
    verification: { modelName: 'auth_verification' },
    // In the database, because each Worker isolate would otherwise count on its own.
    rateLimit: { enabled: true, storage: 'database', modelName: 'auth_rate_limit' },
    socialProviders: socialProviders(),
    advanced: {
      cookiePrefix: COOKIE_PREFIX,
      ipAddress: { ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'] },
      // db() makes the tables. Checking them on every cold start costs a round trip per table, so only locally.
      database: { validateSchema: dev },
    },
    hooks: {
      after: createAuthMiddleware(async (ctx) => {
        const hint = { path: '/', sameSite: 'lax' as const, secure: !dev, httpOnly: false }
        if (ctx.context.newSession) ctx.setCookie(SIGNED_IN, '1', { ...hint, maxAge: 30 * 86_400 })
        else if (ctx.path === '/sign-out') ctx.setCookie(SIGNED_IN, '', { ...hint, maxAge: 0 })
      }),
    },
    plugins: [
      magicLink({
        expiresIn: LINK_MINUTES * 60,
        storeToken: 'hashed',
        async sendMagicLink({ email: typed, token, url }, ctx) {
          // As typed, so one address in other capitals would otherwise count as a new one.
          const email = typed.trim().toLowerCase()
          const headers = ctx?.headers ?? ctx?.request?.headers
          const ip = headers?.get('cf-connecting-ip') ?? headers?.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
          if (!(await allowed(`email:${email}`, 5)) || !(await allowed(`ip:${ip}`, 20))) throw new APIError('TOO_MANY_REQUESTS', { message: 'That’s a lot of links. Try again in an hour.' })
          // In the fragment, which never reaches a server log. The email is only there to show who's
          // signing in, and `next` is where they were going, such as the checkout they started.
          const verify = new URL(url)
          const next = safeNext(verify.searchParams.get('callbackURL'))
          await deliver(email, `${verify.origin}/account/confirm#${new URLSearchParams({ token, email, next })}`)
        },
      }),
      lastLoginMethod({ cookieName: LAST_USED, maxAge: 180 * 86_400 }),
      ...(process.env.BETTER_AUTH_API_KEY ? [dash({ apiKey: process.env.BETTER_AUTH_API_KEY })] : []),
      // Last, so cookies set while signing in or out from a Server Action reach the browser.
      nextCookies(),
    ],
  })

let ready: Promise<ReturnType<typeof create>> | undefined

/** Better Auth, made once its tables are there. */
export function getAuth() {
  ready ??= db()
    .then(create)
    .catch((error) => {
      ready = undefined
      throw error
    })
  return ready
}
