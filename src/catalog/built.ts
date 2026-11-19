export type Built = {
  plan: string
  label: string
  typed: string
  pieces: string[]
  url: string
  shot: { light: string; dark: string }
  note: string
}

export const BUILT: Built[] = [
  {
    plan: 'agent-dashboard',
    label: 'Agent dashboard',
    typed: 'build me an agent dashboard',
    pieces: ['Metric explainer', 'Baseline chart', 'Shift', 'Outlook chart', 'Model & effort'],
    url: 'localhost:3000',
    shot: { light: '/media/built/agent-light.jpg', dark: '/media/built/agent-dark.jpg' },
    note: 'Its sample data tells one story: failures up since refund agent v2.4 shipped.',
  },
  {
    plan: 'analytics-dashboard',
    label: 'Analytics dashboard',
    typed: 'build me an analytics dashboard',
    pieces: ['Metric explainer', 'Shift', 'Baseline chart', 'Outlook chart'],
    url: 'localhost:3000',
    shot: { light: '/media/built/analytics-light.jpg', dark: '/media/built/analytics-dark.jpg' },
    note: 'Its sample data tells one story: one-click Google sign-in lifted signups 12%.',
  },
  {
    plan: 'pricing-page',
    label: 'Pricing page',
    typed: 'a pricing page for my AI app',
    pieces: ['Announcement pill', 'Slice text', 'Testimonials', 'FAQ', 'Call to action'],
    url: 'localhost:3000',
    shot: { light: '/media/built/pricing-light.jpg', dark: '/media/built/pricing-dark.jpg' },
    note: 'Headline, plans priced by usage, proof, questions and a close, in the order people decide.',
  },
]

const NEAREST: Record<string, string> = {
  'finance-dashboard': 'analytics-dashboard',
  'landing-page': 'pricing-page',
  'admin-app': 'analytics-dashboard',
  'incident-page': 'agent-dashboard',
}

export function builtFor(plan: string): { example: Built; exact: boolean } {
  const exact = BUILT.find((b) => b.plan === plan)
  if (exact) return { example: exact, exact: true }
  return { example: BUILT.find((b) => b.plan === NEAREST[plan]) ?? BUILT[0], exact: false }
}
