'use client'

import posthog from 'posthog-js'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    posthog.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#fafaf9', color: '#141414', font: '15px/1.5 ui-sans-serif, system-ui, -apple-system, sans-serif', WebkitFontSmoothing: 'antialiased' }}>
        <main style={{ display: 'grid', justifyItems: 'center', gap: 20, padding: 24, textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Something broke.
            <span style={{ display: 'block', color: 'rgb(0 0 0 / 0.38)' }}>It’s on us, not you.</span>
          </h1>
          <button
            type="button"
            onClick={reset}
            style={{ height: 40, padding: '0 18px', border: 0, borderRadius: 10, background: '#141414', color: '#fafaf9', font: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
