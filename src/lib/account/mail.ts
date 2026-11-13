import 'server-only'

const dev = process.env.NODE_ENV === 'development'

export type Mail = { to: string; subject: string; text: string; html?: string }

export async function deliver({ to, subject, text, html }: Mail) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    if (!dev) throw new Error('RESEND_API_KEY isn’t set')
    console.log(`\n[detent] ${subject} for ${to}:\n${text}\n`)
    return
  }
  const replyTo = process.env.DETENT_REPLY_TO
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: process.env.DETENT_MAIL_FROM ?? 'Detent <hello@detentui.com>', to, subject, text, ...(html ? { html } : {}), ...(replyTo ? { reply_to: replyTo } : {}) }),
  })
  if (!res.ok) throw new Error(`Resend answered ${res.status}`)
}
