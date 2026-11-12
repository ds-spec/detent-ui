import posthog from 'posthog-js'
import { NOTRACK, rememberSource, setVisitor } from './src/site/source'

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN

/* Only the real site counts. localhost, 127.0.0.1, previews and workers.dev hosts never send events.
   NEXT_PUBLIC_POSTHOG_LOCAL=1 turns it on locally when you need to debug tracking itself. */
const live = /(^|\.)detentui\.com$/.test(location.hostname) || process.env.NEXT_PUBLIC_POSTHOG_LOCAL === '1'

/* Your own visits: open detentui.com/?notrack=1 once per browser to stop counting yourself, ?notrack=0 to undo. */
function optedOut() {
  try {
    const flag = new URLSearchParams(location.search).get('notrack')
    if (flag === '1') localStorage.setItem(NOTRACK, '1')
    if (flag === '0') localStorage.removeItem(NOTRACK)
    const off = localStorage.getItem(NOTRACK) === '1'
    document.cookie = off ? `${NOTRACK}=1; Max-Age=31536000; Path=/; SameSite=Lax` : `${NOTRACK}=; Max-Age=0; Path=/`
    return off
  } catch {
    return false
  }
}

/* Runs on every full page load, tracked or not, so checkout can tell Dodo where the buyer came from. */
const touch = rememberSource()

if (token && live && !optedOut()) {
  posthog.init(token, {
    api_host: '/ingest',
    ui_host: 'https://us.posthog.com',
    defaults: '2026-08-30',
    capture_exceptions: true,
    session_recording: { maskAllInputs: true },
    debug: process.env.NODE_ENV === 'development',
    loaded: (ph) => {
      /* Every event carries where this visitor first and last came from. */
      const props: Record<string, string> = {}
      const add = (key: string, value: string | undefined) => {
        if (value) props[key] = value
      }
      add('first_source', touch.first?.source)
      add('first_medium', touch.first?.medium)
      add('first_campaign', touch.first?.campaign)
      add('first_referrer', touch.first?.referrer)
      add('last_source', touch.last?.source)
      add('last_campaign', touch.last?.campaign)
      add('last_content', touch.last?.content)
      ph.register(props)
      setVisitor(ph.get_distinct_id())
    },
  })
}
