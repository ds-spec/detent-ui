type Gtag = (...args: unknown[]) => void

export const gtag: Gtag = (...args) => (window as { gtag?: Gtag }).gtag?.(...args)

export function track(event: string, params?: Record<string, string | number | undefined>) {
  gtag('event', event, params)
}
