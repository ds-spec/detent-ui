import { SITE } from '@/catalog/site'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const CHOICES = [
  ['great', 'Loving it'],
  ['fine', 'It’s fine'],
  ['notyet', 'Not yet'],
] as const

export function askMail(token: string) {
  const link = (m: string) => `${SITE}/feedback/${token}?m=${m}`
  const subject = 'Quick one about Detent'
  const intro = 'You’ve had Detent Pro for about a week, so I wanted to ask: how’s it going?'
  const how = 'Just tap one. It takes a second, and if you feel like saying more there’s room for that too.'

  const text = [
    'Hey,',
    '',
    intro,
    '',
    how,
    '',
    ...CHOICES.map(([m, label]) => `${label}: ${link(m)}`),
    '',
    'Every answer comes straight to me, and it decides what I build next.',
    '',
    'Deep',
    'Detent · https://x.com/next_gendev',
  ].join('\n')

  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Helvetica,Arial,sans-serif"
  const p = 'margin:0 0 18px;font-size:15px;line-height:25px;color:#1d1d1f'
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#ffffff;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden">One tap, and it goes straight to me.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff"><tr><td align="center" style="padding:48px 20px 40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px"><tr><td style="font-family:${font}">
<p style="${p}">Hey,</p>
<p style="${p}">${esc(intro)}</p>
<p style="margin:0 0 14px;font-size:15px;line-height:25px;color:#1d1d1f">${esc(how)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px"><tr>
${CHOICES.map(([m, label], i) => `<td style="padding-right:${i < CHOICES.length - 1 ? 8 : 0}px"><a href="${esc(link(m))}" style="display:inline-block;padding:10px 16px;border-radius:9px;font-family:${font};font-size:14px;font-weight:500;text-decoration:none;${i === 0 ? 'background:#1d1d1f;color:#ffffff;border:1px solid #1d1d1f' : 'background:#ffffff;color:#1d1d1f;border:1px solid #d2d2d7'}">${esc(label)}</a></td>`).join('\n')}
</tr></table>
<p style="${p}">Every answer comes straight to me, and it decides what I build next.</p>
<p style="margin:28px 0 2px;font-size:15px;line-height:22px;color:#1d1d1f">Deep</p>
<p style="margin:0;font-size:13px;line-height:20px;color:#86868b">Detent · <a href="https://x.com/next_gendev" style="color:#86868b;text-decoration:none">@next_gendev</a></p>
<div style="height:1px;background:#ededf0;margin:40px 0 16px"></div>
<p style="margin:0;font-size:12px;line-height:18px;color:#a1a1a6">You’re getting this because you bought Detent Pro at <a href="${SITE}" style="color:#a1a1a6;text-decoration:none">detentui.com</a>. This is the only time I’ll ask.</p>
</td></tr></table>
</td></tr></table>
</body></html>`

  return { subject, text, html }
}
