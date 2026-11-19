export type Recipe = { id: string; name: string; noun: string; triggers: Record<string, number>; pieces: string[] }

export const RECIPES: Recipe[] = [
  { id: 'analytics-dashboard', name: 'Analytics dashboard', noun: 'dashboard', triggers: { dashboard: 3, analytic: 4, metric: 3, kpi: 4, report: 3, stat: 3, insight: 3, overview: 2, traffic: 3, growth: 3, admin: 1, saas: 1, conversion: 2, visitor: 3, usage: 2 }, pieces: ['dates', 'metric', 'shift', 'chart', 'trend', 'funnel', 'filter', 'askchart'] },
  { id: 'finance-dashboard', name: 'Finance dashboard', noun: 'dashboard', triggers: { finance: 4, dashboard: 1, revenue: 3, mrr: 4, arr: 4, cash: 4, runway: 4, budget: 4, spend: 3, fintech: 4, money: 3, profit: 3, expense: 4, burn: 4, invoice: 1 }, pieces: ['dates', 'forecast', 'metric', 'bridge', 'rings', 'filter'] },
  { id: 'agent-dashboard', name: 'Agent dashboard', noun: 'dashboard', triggers: { agent: 3, llm: 3, observability: 5, run: 2, trace: 3, log: 3, token: 2, monitor: 2, dashboard: 1, ai: 1 }, pieces: ['agent-dashboard', 'trace', 'models'] },
  { id: 'pricing-page', name: 'Pricing page', noun: 'page', triggers: { pric: 5, billing: 4, plan: 3, tier: 4, subscription: 4, checkout: 3, upgrade: 3 }, pieces: ['announce', 'slices', 'pricing', 'testimonials', 'faq', 'cta'] },
  { id: 'landing-page', name: 'Landing page', noun: 'page', triggers: { landing: 5, homepage: 5, marketing: 4, website: 3, hero: 3, launch: 2, startup: 2, waitlist: 2, saas: 1 }, pieces: ['threads', 'halo', 'announce', 'slices', 'live-features', 'integrations', 'testimonials', 'pricing', 'faq', 'cta'] },
  { id: 'support-inbox', name: 'Support inbox', noun: 'app', triggers: { support: 4, ticket: 4, inbox: 4, helpdesk: 5, customer: 1, email: 2 }, pieces: ['support-inbox', 'prompt', 'voicenote'] },
  { id: 'ai-chat', name: 'AI chat app', noun: 'app', triggers: { chat: 4, chatbot: 5, assistant: 3, copilot: 4, gpt: 3, conversation: 3, ai: 2, agent: 1, claude: 2, llm: 1 }, pieces: ['agent-chat', 'prompt', 'models', 'trace', 'diff', 'upload'] },
  { id: 'admin-app', name: 'Admin app', noun: 'app', triggers: { crm: 5, admin: 4, internal: 3, backoffice: 5, record: 3, table: 3, customers: 2, list: 1, manage: 2 }, pieces: ['data-table', 'filter', 'popup', 'settings'] },
  { id: 'settings-page', name: 'Settings page', noun: 'page', triggers: { setting: 5, preference: 5, account: 2, profile: 3, config: 3 }, pieces: ['settings', 'phrase', 'popup'] },
  { id: 'auth-flow', name: 'Sign-in and onboarding', noun: 'flow', triggers: { login: 5, signin: 5, sign: 2, signup: 5, auth: 5, onboard: 5, register: 4, welcome: 3 }, pieces: ['sign-in', 'onboarding', 'hello'] },
  { id: 'incident-page', name: 'Incident and status', noun: 'page', triggers: { incident: 5, outage: 5, status: 4, uptime: 4, alert: 3, sre: 4, oncall: 4, ops: 2 }, pieces: ['incident', 'histogram', 'region'] },
  { id: 'dev-tool', name: 'Code review tool', noun: 'app', triggers: { code: 3, review: 3, pr: 4, pull: 3, github: 3, merge: 4, diff: 4, commit: 3, developer: 2 }, pieces: ['code-review', 'task-to-merge', 'mcp'] },
  { id: 'scheduling', name: 'Scheduling', noun: 'app', triggers: { calendar: 5, schedul: 5, booking: 5, meeting: 4, appointment: 5, event: 2 }, pieces: ['calendar', 'dates'] },
]

export const recipe = (id: string) => RECIPES.find((r) => r.id === id)
