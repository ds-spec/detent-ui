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
import { deliver } from './mail'
import { welcomeMail } from './welcome'
import { safeNext } from './next'

export const COOKIE_PREFIX = 'detent'
export const SIGNED_IN = 'detent.in'
export const LAST_USED = 'detent.last_used'
const LINK_MINUTES = 15
const HOUR = 3_600_000
const dev = process.env.NODE_ENV === 'development'

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

export function socialProviders() {
  const env = process.env
  return {
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET ? { github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET } } : {}),
  }
}
export type Provider = 'github'

const create = (client: Client) =>
  betterAuth({
    appName: 'Detent',
    baseURL: dev ? { allowedHosts: ['localhost:*', '127.0.0.1:*'], protocol: 'http', fallback: 'http://localhost:3000' } : SITE,
    secret: process.env.BETTER_AUTH_SECRET,
    database: { dialect: new LibsqlDialect({ client }), type: 'sqlite' },
    user: { modelName: 'auth_user' },
    session: { modelName: 'auth_session', expiresIn: 30 * 86_400, updateAge: 86_400 },
    account: { modelName: 'auth_account', encryptOAuthTokens: true },
    verification: { modelName: 'auth_verification' },
    rateLimit: { enabled: true, storage: 'database', modelName: 'auth_rate_limit' },
    socialProviders: socialProviders(),
    advanced: {
      cookiePrefix: COOKIE_PREFIX,
      ipAddress: { ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'] },
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
          const email = typed.trim().toLowerCase()
          const headers = ctx?.headers ?? ctx?.request?.headers
          const ip = headers?.get('cf-connecting-ip') ?? headers?.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
          if (!(await allowed(`email:${email}`, 5)) || !(await allowed(`ip:${ip}`, 20))) throw new APIError('TOO_MANY_REQUESTS', { message: 'That’s a lot of links. Try again in an hour.' })
          const verify = new URL(url)
          const next = safeNext(verify.searchParams.get('callbackURL'))
          const link = `${verify.origin}/account/confirm#${new URLSearchParams({ token, email, next })}`
          if (!ctx?.request && headers?.get('x-detent-purchase')) {
            await deliver({ to: email, ...welcomeMail({ link, minutes: LINK_MINUTES }) })
            return
          }
          await deliver({ to: email, subject: 'Sign in to Detent', text: `Sign in to Detent:\n\n${link}\n\nThe link lasts ${LINK_MINUTES} minutes and works once. If you didn’t ask for it, you can ignore this email.` })
        },
      }),
      lastLoginMethod({ cookieName: LAST_USED, maxAge: 180 * 86_400 }),
      ...(process.env.BETTER_AUTH_API_KEY ? [dash({ apiKey: process.env.BETTER_AUTH_API_KEY })] : []),
      nextCookies(),
    ],
  })

let ready: Promise<ReturnType<typeof create>> | undefined

export function getAuth() {
  ready ??= db()
    .then(create)
    .catch((error) => {
      ready = undefined
      throw error
    })
  return ready
}
