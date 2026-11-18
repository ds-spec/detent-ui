import { db } from './db'

/* What people asked the homepage for when Detent had nothing that fit: the words, what matched, and an optional
   email to tell them when it ships. Lives only here, never in analytics. */
let made: Promise<void> | undefined
const ensure = async () => {
  made ??= (async () => {
    const client = await db()
    await client.execute('create table if not exists piece_request (id text primary key, text text not null, picks text not null, email text, country text, at integer not null)')
  })().catch((error) => {
    made = undefined
    throw error
  })
  return made
}

export const cleanText = (v: unknown) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, 200) : '')
export const cleanPicks = (v: unknown) =>
  typeof v === 'string'
    ? v
        .split(',')
        .map((x) => x.trim())
        .filter((x) => /^[a-z0-9-]{1,40}$/.test(x))
        .slice(0, 6)
        .join(',')
    : ''

export async function addRequest(text: string, picks: string, country: string | null) {
  await ensure()
  const id = crypto.randomUUID()
  await (await db()).execute({ sql: 'insert into piece_request (id, text, picks, email, country, at) values (?, ?, ?, null, ?, ?)', args: [id, text, picks, country, Date.now()] })
  return id
}

export async function addRequestEmail(id: string, email: string) {
  await ensure()
  await (await db()).execute({ sql: 'update piece_request set email = ? where id = ? and email is null', args: [email, id] })
}
