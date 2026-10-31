/**
 * Roughly how many working days it takes a good engineer to build each piece of Pro to this
 * standard: every state, the keyboard, both themes, every width, and nothing on the page ever
 * jumping. Estimates, and said so wherever they're shown; the Pro page adds them up. Its own tiny
 * file, so a page that names one piece never loads the block and template catalogues behind it.
 */
export const DAYS: Record<string, number> = {
  // Components
  answer: 10,
  ask: 8,
  askchart: 12,
  bridge: 7,
  funnel: 8,
  radar: 6,
  donut: 5,
  scatter: 8,
  histogram: 7,
  activity: 7,
  trace: 12,
  approval: 8,
  rewrite: 8,
  models: 6,
  filter: 8,
  chart: 8,
  trend: 8,
  usage: 6,
  dates: 8,
  extract: 9,
  lens: 5,
  flow: 15,
  kanban: 10,
  forecast: 7,
  video: 8,
  tour: 8,
  codeblock: 6,
  carousel: 8,
  region: 14,
  reveal: 10,
  // Blocks
  'live-features': 8,
  pricing: 6,
  integrations: 8,
  cta: 4,
  calendar: 12,
  'data-table': 10,
  analytics: 10,
  'agent-chat': 12,
  'task-to-merge': 15,
  'voice-mode': 15,
  evals: 12,
  'support-inbox': 15,
  onboarding: 8,
  billing: 10,
  settings: 10,
  'code-review': 12,
  // Templates
  detent: 24,
  tandem: 24,
  rapport: 30,
}

export const daysFor = (id: string) => DAYS[id] ?? 8
