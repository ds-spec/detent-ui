import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { basename, extname } from 'node:path'
import { createClient } from '@libsql/client'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .map((l) => /^\s*(?:export\s+)?([A-Z0-9_]+)=(.*)$/.exec(l))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim().replace(/^(['"])(.*)\1$/, '$2')]),
)
const get = (k) => process.env[k] ?? env[k]

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const option = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const loose = args.filter((a, i) => !a.startsWith('--') && !['--limit', '--slug', '--to', '--footer'].includes(args[i - 1]))
const [subject, file] = loose

if (!subject || !file) {
  console.log(`
Usage: node --network-family-autoselection-attempt-timeout=500 scripts/broadcast.mjs "<subject>" <file.md|file.html> [--send] [--limit 100] [--slug name] [--to you@example.com]

  Dry run by default: prints how many people would get it and a few masked addresses.
  --send     actually send, through Resend
  --limit    most mails this run (default 100, the Resend free daily cap; welcome mails count too)
  --slug     name for this broadcast (default: the file name). Anyone already sent this slug is skipped, so rerun tomorrow to finish.
  --to       send only to this one address (a test to yourself), not recorded
  --footer   line before the unsubscribe link (default "One email a week.")

  The "— Deep from Detent" signature and the unsubscribe footer are added for you.
`)
  process.exit(1)
}

const SITE = (get('NEXT_PUBLIC_SITE_URL') ?? 'https://detentui.com').replace(/\/$/, '')
const secret = get('BETTER_AUTH_SECRET')
if (!secret) throw new Error('BETTER_AUTH_SECRET isn’t set')
const token = (email) => `${Buffer.from(email).toString('base64url')}.${createHmac('sha256', secret).update(`unsubscribe:${email}`).digest('base64url').slice(0, 24)}`

const source = readFileSync(file, 'utf8')
const isHtml = /\.html?$/i.test(extname(file))
const slug = option('slug') ?? basename(file, extname(file))
const limit = Math.max(1, Number(option('limit')) || 100)
const send = flag('send')
const only = option('to')?.trim().toLowerCase()
const footer = option('footer') ?? 'One email a week.'

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, '<span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px">$1</span>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight:600">$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" style="color:#1c1b19;text-decoration:underline;text-decoration-color:#c7c7cc;text-underline-offset:3px">$1</a>')

const markdown = (md) =>
  md
    .trim()
    .split(/\n{2,}/)
    .map((block) => {
      const h = /^(#{1,3})\s+(.*)$/.exec(block)
      if (h) return `<p style="margin:0 0 14px;font-size:${h[1].length === 1 ? 22 : 18}px;line-height:1.3;font-weight:600;letter-spacing:-0.01em;color:#1c1b19">${inline(h[2])}</p>`
      const img = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(block.trim())
      if (img) return `<img src="${esc(img[2])}" alt="${esc(img[1])}" width="480" style="display:block;width:100%;max-width:480px;height:auto;border:0;border-radius:12px;margin:0 0 18px">`
      const btn = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(block.trim())
      if (btn) return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:2px 0 20px"><tr><td style="border-radius:9px;background:#1c1b19"><a href="${esc(btn[2])}" style="display:inline-block;padding:11px 18px;font-family:${font};font-size:14px;font-weight:500;color:#ffffff;text-decoration:none;border-radius:9px">${esc(btn[1])}</a></td></tr></table>`
      if (block.startsWith('```')) return `<p style="margin:0 0 18px;padding:12px 14px;border-radius:9px;background:#f5f5f7;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:20px;color:#1c1b19;white-space:pre-wrap">${esc(block.replace(/^```\w*\n?|```$/g, '').trim())}</p>`
      return `<p style="margin:0 0 18px;font-size:15px;line-height:25px;color:#1c1b19">${inline(block).replace(/\n/g, '<br>')}</p>`
    })
    .join('\n')

const plain = (md) => md.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1 ($2)').trim()

const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Helvetica,Arial,sans-serif"
const body = isHtml ? source : markdown(source)
const mail = (email) => {
  const out = `${SITE}/unsubscribe/${token(email)}`
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#ffffff;-webkit-font-smoothing:antialiased">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff"><tr><td align="center" style="padding:48px 20px 40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px"><tr><td style="font-family:${font}">
${body}
<p style="margin:0;font-size:15px;line-height:24px;color:#1c1b19">— Deep from Detent</p>
<div style="height:1px;background:#eeede9;margin:36px 0 14px"></div>
<p style="margin:0;font-size:12px;line-height:18px;color:#9a9893">${esc(footer)} <a href="${esc(out)}" style="color:#9a9893;text-decoration:underline">Unsubscribe in one click.</a></p>
</td></tr></table>
</td></tr></table>
</body></html>`
  const text = `${isHtml ? source.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim() : plain(source)}\n\n— Deep from Detent\n\n---\n${footer} Unsubscribe in one click: ${out}`
  return {
    from: get('DETENT_MAIL_FROM') ?? 'Detent <hello@detentui.com>',
    to: email,
    subject,
    html,
    text,
    headers: { 'List-Unsubscribe': `<${SITE}/api/unsubscribe?t=${token(email)}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    ...(get('DETENT_REPLY_TO') ? { reply_to: get('DETENT_REPLY_TO') } : {}),
  }
}

const deliver = async (email) => {
  const key = get('RESEND_API_KEY')
  if (!key) throw new Error('RESEND_API_KEY isn’t set')
  for (let tries = 0; ; tries++) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify(mail(email)),
    })
    if (res.ok) return
    if (res.status === 429 && tries < 3) {
      await new Promise((r) => setTimeout(r, 1500 * (tries + 1)))
      continue
    }
    throw new Error(`Resend answered ${res.status}: ${(await res.text()).slice(0, 200)}`)
  }
}

const mask = (email) => {
  const [name, host] = email.split('@')
  return `${name.slice(0, 2)}${'•'.repeat(Math.max(1, name.length - 2))}@${host}`
}

if (only) {
  console.log(`\n${send ? 'Sending' : 'Would send'} "${subject}" to ${only} only.`)
  if (send) {
    await deliver(only)
    console.log('Sent.')
  } else console.log('Add --send to send it.')
  process.exit(0)
}

const url = process.env.DETENT_DB_URL ?? env.DETENT_DB_URL ?? 'file:.detent/account.db'
const client = createClient({ url, authToken: url.startsWith('file:') ? undefined : (process.env.DETENT_DB_TOKEN ?? env.DETENT_DB_TOKEN) })
const rows = async (sql, args) => {
  try {
    return (await client.execute({ sql, args })).rows
  } catch (error) {
    if (/no such table/i.test(String(error))) return null
    throw error
  }
}

if (send) await client.execute('create table if not exists broadcast_sent (slug text not null, email text not null, at integer not null, primary key (slug, email))')
const sentRows = await rows('select email from broadcast_sent where slug = ?', [slug])
const already = new Set((sentRows ?? []).map((r) => String(r.email)))
const people = await rows('select email from subscriber where unsubscribed_at is null order by created_at', [])
if (!people) {
  console.log('\nNo subscriber table in this database yet. Deploy the site first.')
  process.exit(1)
}
const waiting = people.map((r) => String(r.email)).filter((e) => !already.has(e))
const done = { n: already.size }
const batch = waiting.slice(0, limit)

console.log(`\nBroadcast "${slug}": ${subject}`)
console.log(`Already sent: ${Number(done.n)}. Still to send: ${waiting.length}. This run: ${batch.length}${waiting.length > batch.length ? ` (limit ${limit}, rerun tomorrow for the rest)` : ''}.`)
console.log(batch.slice(0, 5).map((e) => `  ${mask(e)}`).join('\n') + (batch.length > 5 ? `\n  …and ${batch.length - 5} more` : ''))

if (!send) {
  console.log('\nDry run. Nothing was sent. Add --send to send.')
  process.exit(0)
}

let sent = 0
for (const email of batch) {
  try {
    await deliver(email)
    await client.execute({ sql: 'insert or ignore into broadcast_sent (slug, email, at) values (?, ?, ?)', args: [slug, email, Date.now()] })
    sent++
    process.stdout.write(`\r  sent ${sent}/${batch.length}`)
  } catch (error) {
    console.error(`\n  stopped at ${mask(email)}: ${error.message}`)
    break
  }
  await new Promise((r) => setTimeout(r, 600))
}
console.log(`\nSent ${sent}. ${waiting.length - sent} still to go.`)
