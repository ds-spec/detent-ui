import 'server-only'
import { createClient, type Client } from '@libsql/client'

/*
 * The one database behind accounts: who's signed in, their keys and what they bought. In development
 * it's a file in .detent, with nothing to set up; in production DETENT_DB_URL and DETENT_DB_TOKEN
 * point it at a Turso database. Keys and sign-in links are kept only as hashes, OAuth tokens are
 * encrypted, and a session cookie is signed with BETTER_AUTH_SECRET, so the database alone can't
 * sign anyone in.
 */

/*
 * The auth_ tables are Better Auth's (src/lib/account/auth.ts), prefixed so they can't meet ours. Their
 * shape is what Better Auth's getMigrations compiles for that config; after changing its plugins or
 * fields, compile it again and add what's new here. The old link and session tables are no longer
 * read, and can be dropped.
 */
const SCHEMA = [
  `create table if not exists "auth_user" ("id" text not null primary key, "name" text not null, "email" text not null unique, "emailVerified" integer not null, "image" text, "createdAt" date not null, "updatedAt" date not null)`,
  `create table if not exists "auth_session" ("id" text not null primary key, "expiresAt" date not null, "token" text not null unique, "createdAt" date not null, "updatedAt" date not null, "ipAddress" text, "userAgent" text, "userId" text not null references "auth_user" ("id") on delete cascade)`,
  `create table if not exists "auth_account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "auth_user" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" date, "refreshTokenExpiresAt" date, "scope" text, "password" text, "createdAt" date not null, "updatedAt" date not null)`,
  `create table if not exists "auth_verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" date not null, "createdAt" date not null, "updatedAt" date not null)`,
  `create table if not exists "auth_rate_limit" ("id" text not null primary key, "key" text not null unique, "count" integer not null, "lastRequest" bigint not null)`,
  `create index if not exists "auth_session_userId_idx" on "auth_session" ("userId")`,
  `create index if not exists "auth_account_userId_idx" on "auth_account" ("userId")`,
  `create index if not exists "auth_verification_identifier_idx" on "auth_verification" ("identifier")`,
  `create table if not exists key (id text primary key, hash text not null unique, email text not null, name text not null, hint text not null, created_at integer not null, used_at integer)`,
  `create index if not exists key_email on key (email)`,
  `create table if not exists purchase (order_id text primary key, email text not null, plan text not null, refunded integer not null default 0, created_at integer not null)`,
  `create index if not exists purchase_email on purchase (email)`,
  `create table if not exists install (email text not null, item text not null, kind text not null, at integer not null, primary key (email, item))`,
  `create table if not exists attempt (bucket text not null, at integer not null)`,
  `create index if not exists attempt_bucket on attempt (bucket, at)`,
]

let ready: Promise<Client> | undefined

/** The database, with its tables made the first time anything asks. */
export function db() {
  ready ??= (async () => {
    const client = createClient({ url: process.env.DETENT_DB_URL ?? 'file:.detent/account.db', authToken: process.env.DETENT_DB_TOKEN })
    await client.batch(SCHEMA, 'write')
    return client
  })().catch((error) => {
    ready = undefined
    throw error
  })
  return ready
}
