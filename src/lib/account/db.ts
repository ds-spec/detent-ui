import 'server-only'
import { createClient, type Client } from '@libsql/client'

/*
 * The one database behind accounts: who signed in, their keys and what they bought. In development
 * it's a file in .detent, with nothing to set up; in production DETENT_DB_URL and DETENT_DB_TOKEN
 * point it at a Turso database. Secrets are never kept here, only their hashes.
 */

const SCHEMA = [
  `create table if not exists link (hash text primary key, email text not null, expires_at integer not null, used_at integer)`,
  `create table if not exists session (hash text primary key, email text not null, expires_at integer not null)`,
  `create table if not exists key (id text primary key, hash text not null unique, email text not null, name text not null, hint text not null, created_at integer not null, used_at integer)`,
  `create index if not exists key_email on key (email)`,
  `create table if not exists purchase (order_id text primary key, email text not null, plan text not null, refunded integer not null default 0, created_at integer not null)`,
  `create index if not exists purchase_email on purchase (email)`,
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
