import { emailOfUnsubscribe, resubscribe, unsubscribe } from '@/lib/account/subscribers'

export async function POST(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('t') ?? ''
  const email = token ? emailOfUnsubscribe(token) : null
  if (!email) return Response.json({ error: 'invalid' }, { status: 400 })
  if (url.searchParams.get('undo')) {
    await resubscribe(email)
    return Response.redirect(new URL(`/unsubscribe/${token}?again=1`, req.url), 303)
  }
  await unsubscribe(email)
  return Response.json({ ok: true })
}
