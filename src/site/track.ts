'use client'

import posthog from 'posthog-js'

type Gtag = (...args: unknown[]) => void

export const gtag: Gtag = (...args) => (window as { gtag?: Gtag }).gtag?.(...args)

export function track(event: string, params?: Record<string, string | number | undefined>) {
  gtag('event', event, params)
  const properties = { ...params }
  delete properties.search_term
  posthog.capture(event, properties)
}
