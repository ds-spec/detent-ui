// npm run feedback:ask            lists buyers who'd get the one-tap feedback mail
// npm run feedback:ask -- --send  sends it, once per buyer, a week or more after they bought
import { createClient } from '@libsql/client'
import { askMail } from '../src/lib/account/ask'
import { pulseToken } from '../src/lib/account/pulse-token'

const WEEK = 7 * 86_400_000
const send = process.argv.includes('--send')
const env = process.env
if (!env.DETENT_DB_URL) throw new Error('DETENT_DB_URL isn’t set')
if (send && !env.RESEND_API_KEY) throw new Error('RESEND_API_KEY isn’t set')

const client = createClient({ url: env.DETENT_DB_URL, authToken: env.DETENT_DB_TOKEN })
await client.batch(
  [
    'create table if not exists pulse (email text primary key, mood text not null, favourite text, at integer not null)',
    'create table if not exists pulse_ask (email text primary key, at integer not null)',
  ],
  'write',
)

const { rows } = await client.execute({
  sql: `select order_id, email, min(created_at) as at from purchase
        where refunded = 0 and created_at <= ?
          and email not in (select email from pulse_ask)
          and email not in (select email from pulse)
          and email not in (select email from feedback)
        group by email`,
  args: [Date.now() - WEEK],
})

const hide = (email: string) => email.replace(/^(.).*?@/, '$1***@')
console.log(`${rows.length} buyer${rows.length === 1 ? '' : 's'} to ask${send ? '' : ' (dry run, add --send to send)'}`)

for (const r of rows) {
  const email = String(r.email)
  const days = Math.floor((Date.now() - Number(r.at)) / 86_400_000)
  if (!send) {
    console.log(`  ${hide(email)} · bought ${days} days ago`)
    continue
  }
  const mail = askMail(pulseToken(String(r.order_id)))
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.DETENT_MAIL_FROM ?? 'Detent <hello@detentui.com>', to: email, ...mail, ...(env.DETENT_REPLY_TO ? { reply_to: env.DETENT_REPLY_TO } : {}) }),
  })
  if (!res.ok) {
    console.log(`  ${hide(email)} · failed: Resend answered ${res.status}`)
    continue
  }
  await client.execute({ sql: 'insert or ignore into pulse_ask (email, at) values (?, ?)', args: [email, Date.now()] })
  console.log(`  ${hide(email)} · sent`)
}
