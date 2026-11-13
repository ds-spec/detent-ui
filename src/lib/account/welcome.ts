import { SITE } from '@/catalog/site'

type Welcome = { link?: string; minutes?: number; signedIn?: boolean }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function welcomeMail({ link, minutes = 15, signedIn = false }: Welcome = {}) {
  const account = `${SITE}/account`
  const key = link ?? account
  const subject = 'Welcome to Detent Pro'
  const keyNote = link
    ? `That link works once and lasts ${minutes} minutes. If it runs out, sign in at detentui.com/account with this email and Pro will be there.`
    : signedIn
      ? 'You were signed in when you bought, so it’s already waiting on your account page.'
      : 'Sign in at detentui.com/account with this email and your key is there.'

  const text = [
    'Hey,',
    '',
    'Thanks for picking up Detent Pro. I build Detent on my own, so every purchase genuinely means a lot.',
    '',
    `Your key is here: ${key}`,
    keyNote,
    '',
    'Setup takes about a minute. Add the @detent-pro registry to components.json, put your key in .env.local as DETENT_PRO_KEY, then install anything:',
    '',
    '  npx shadcn add @detent-pro/askchart',
    '',
    `Every step is written out on your account page: ${account}`,
    '',
    `If you’re not sure where to start, try Ask chart (${SITE}/components/askchart), or open the Detent app template (${SITE}/templates/detent) and pull it apart.`,
    '',
    'And one favour: reply and tell me what you’re building. I read every reply, and they decide what I make next.',
    '',
    'Deep',
    'Detent · https://x.com/next_gendev',
  ].join('\n')

  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Helvetica,Arial,sans-serif"
  const p = 'margin:0 0 18px;font-size:15px;line-height:25px;color:#1d1d1f'
  const a = 'color:#1d1d1f;text-decoration:underline;text-decoration-color:#c7c7cc;text-underline-offset:3px'
  const mono = 'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px'

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#ffffff;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden">Your key, and a one-minute setup.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff"><tr><td align="center" style="padding:48px 20px 40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px"><tr><td style="font-family:${font}">
<a href="${esc(key)}" style="display:block;margin:0 0 32px"><img src="${SITE}/media/mail/welcome-card.png" width="480" alt="Detent Pro" style="display:block;width:100%;max-width:480px;height:auto;border:0;margin:0 -0px"></a>
<p style="${p}">Hey,</p>
<p style="${p}">Thanks for picking up Detent Pro. I build Detent on my own, so every purchase genuinely means a lot.</p>
<p style="margin:0 0 10px;font-size:15px;line-height:25px;color:#1d1d1f">Your key is waiting for you:</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 12px"><tr><td style="border-radius:9px;background:#1d1d1f"><a href="${esc(key)}" style="display:inline-block;padding:11px 18px;font-family:${font};font-size:14px;font-weight:500;color:#ffffff;text-decoration:none;border-radius:9px">Get your key</a></td></tr></table>
<p style="margin:0 0 28px;font-size:13px;line-height:20px;color:#86868b">${esc(keyNote)}</p>
<p style="${p}">Setup takes about a minute. Add the <span style="${mono}">@detent-pro</span> registry to <span style="${mono}">components.json</span>, put your key in <span style="${mono}">.env.local</span> as <span style="${mono}">DETENT_PRO_KEY</span>, then install anything:</p>
<p style="margin:0 0 18px;padding:12px 14px;border-radius:9px;background:#f5f5f7;${mono};line-height:20px;color:#1d1d1f">npx shadcn add @detent-pro/askchart</p>
<p style="${p}">Every step is written out on <a href="${account}" style="${a}">your account page</a>. If you’re not sure where to start, try <a href="${SITE}/components/askchart" style="${a}">Ask chart</a>, or open the <a href="${SITE}/templates/detent" style="${a}">Detent app template</a> and pull it apart.</p>
<p style="${p}">And one favour: reply and tell me what you’re building. I read every reply, and they decide what I make next.</p>
<p style="margin:28px 0 2px;font-size:15px;line-height:22px;color:#1d1d1f">Deep</p>
<p style="margin:0;font-size:13px;line-height:20px;color:#86868b">Detent · <a href="https://x.com/next_gendev" style="color:#86868b;text-decoration:none">@next_gendev</a></p>
<div style="height:1px;background:#ededf0;margin:40px 0 16px"></div>
<p style="margin:0;font-size:12px;line-height:18px;color:#a1a1a6">You’re getting this because you bought Detent Pro at <a href="${SITE}" style="color:#a1a1a6;text-decoration:none">detentui.com</a>.</p>
</td></tr></table>
</td></tr></table>
</body></html>`

  return { subject, text, html }
}
