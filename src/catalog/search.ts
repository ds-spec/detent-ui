// What people actually type into Google or ask an AI, per piece. Our own names
// ("Matchup", "Run waterfall") stay on the page; these lead the <title> and the
// meta description so a page can match the query. Keep each under ~46 chars so
// the full title, with " · Detent UI", fits Google's ~60.

export const SEARCH: Record<string, string> = {
  // components
  trace: 'React LLM Trace Viewer: Run waterfall',
  diff: 'AI Code Diff Review Component for React',
  rewrite: 'AI Inline Rewrite Text Editor for React',
  prompt: 'AI Prompt Input Box for React and shadcn',
  models: 'AI Model Picker with Reasoning Effort',
  filter: 'Natural Language Filter Input for React',
  radar: 'React Radar Chart for shadcn: Matchup',
  scatter: 'React Scatter Plot with Lasso Selection',
  histogram: 'React Dot Histogram Chart for shadcn',
  funnel: 'React Funnel Chart for shadcn: Flow funnel',
  bridge: 'React Waterfall Chart: Revenue bridge',
  askchart: 'Ask Your Data: AI Chart for React',
  chart: 'React Line Chart with Baseline for shadcn',
  dates: 'React Date Range Picker with Presets',
  upload: 'Animated File Upload Component for React',
  extract: 'AI Document Extraction Review UI, React',
  trend: 'React Forecast Chart with Confidence Band',
  rings: 'React Goal Progress Bars with Percentages',
  metric: 'AI Metric Card with Insights for React',
  forecast: 'React Cash Runway Forecast Chart',
  voicenote: 'React Voice Note Player with Transcript',
  halo: 'React Glow Gradient Effect: Halo bands',
  find: 'React Find in Page with Highlight',
  rewind: 'React Textarea with Undo History Scrub',
  popup: 'React Popup Select that Opens at Cursor',
  phrase: 'React Sentence Settings Control: Phrase',
  announce: 'Animated Announcement Badge for React',
  slices: 'React Animated Text Reveal: Slice text',
  region: 'React Server Region Picker with Globe',
  threads: 'Animated Hero Background for React',
  glyph: 'React ASCII Art Component: Glyph art',
  hello: 'React Language Picker with Globe',
  'agent-canvas': 'AI Agent Chat with Canvas UI for React',
  emoji: 'React Emoji Picker, Round and Flickable',
  shift: 'React Traffic Sources Card with Charts',
  livelist: 'React Collaborative Checklist, Live',
  week: 'AI Calendar with Natural Language, React',
  buddy: 'AI Assistant Avatar with Moods, React',
  vault: 'Web3 Deposit and Withdraw Card, React',
  'agent-wallet': 'AI Agent Wallet and Spend Limits, React',
  'support-chat': 'AI Customer Support Chat Widget, React',
  mcp: 'MCP Server Install Config Component',

  // blocks
  'live-features': 'AI Landing Page Features Section, React',
  pricing: 'Usage-Based Pricing Section for React',
  integrations: 'Integrations Section Block for React',
  testimonials: 'Testimonials Section with Results, React',
  faq: 'Searchable FAQ Section Block for React',
  cta: 'Call to Action Section Block for React',
  calendar: 'AI Scheduling Calendar UI for React',
  'data-table': 'React Data Table with AI Filters',
  'agent-chat': 'AI Agent Chat UI for React and AI SDK',
  'task-to-merge': 'AI Coding Agent Task to PR UI, React',
  'voice-mode': 'AI Voice Mode UI with Live Notes, React',
  evals: 'LLM Evals Comparison UI for React',
  'agent-dashboard': 'AI Agent Monitoring Dashboard, React',
  'support-inbox': 'AI Support Inbox Template for React',
  onboarding: 'SaaS Onboarding Flow UI for React',
  'sign-in': 'Sign In Page Block for React and shadcn',
  settings: 'SaaS Settings Pages UI for React',
  'code-review': 'AI Code Review Pull Request UI, React',
  incident: 'Incident Page UI for React',

  // templates
  detent: 'AI Agent App Template for Next.js',
}

/** The noun phrase for a description: "React Radar Chart for shadcn: Matchup" -> "React Radar Chart for shadcn". */
export const searchPhrase = (id: string) => SEARCH[id]?.split(':')[0]

/** Facts first, in the order a search result or an AI answer quotes them; our own line follows and gets cut first. */
export function searchDescription(id: string, line: string, pro: boolean) {
  const what = searchPhrase(id)
  const facts = `${pro ? 'Part of Detent Pro' : 'Free and MIT'}. React 19, Tailwind v4, installs with the shadcn CLI.`
  return what ? `${what}. ${facts} ${line}` : `${line} ${facts}`
}
