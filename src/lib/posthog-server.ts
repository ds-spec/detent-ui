const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

/** Server-side events. Never sent from `next dev`, so local testing does not pollute the project. */
export async function capture(distinctId: string, event: string, properties: Record<string, unknown> = {}) {
  if (!token || !host || !distinctId || process.env.NODE_ENV === 'development') return
  await fetch(`${host.replace(/\/$/, '')}/i/v0/e/`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ api_key: token, event, distinct_id: distinctId, properties: { ...properties, $lib: 'detent-server' } }),
    signal: AbortSignal.timeout(1500),
  }).catch(() => {})
}

/** True for a request from localhost, so a local `next start` stays out of the numbers too. */
export const isLocal = (req: Request) => /^(localhost|127\.0\.0\.1|\[::1\])$/.test(new URL(req.url).hostname)
