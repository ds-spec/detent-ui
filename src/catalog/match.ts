/* "What are you building?" without a model: the words someone types are scored against what each piece is for.
   HINTS carries the intent a plain word overlap misses (someone says "billing", the piece says "pricing"). */
import { GUIDE } from './guide'
import { BLOCKS } from './blocks'
import { CATEGORIES, ENTRIES } from './meta'
import { isProBlock, isProComponent } from './pro'
import { RECIPES } from './recipes'
import type { Recipe } from './recipes'

export type Alt = { id: string; kind: 'components' | 'blocks'; name: string }
export type Pick = { id: string; kind: 'components' | 'blocks'; name: string; pro: boolean; why: string; score: number; group: string; alt?: Alt }

type Doc = { id: string; kind: 'components' | 'blocks'; name: string; pro: boolean; why: string; group: string; strong: Set<string>; weak: Set<string> }

const STOP = new Set('a an and app the for of to in on with my our your i we is it that this some page screen site want need build building make like using use where who what can into from just something thing'.split(' '))

export const stem = (w: string) => w.replace(/(ies)$/, 'y').replace(/(ing|ed|es|s)$/, '').replace(/'s$/, '')
export const words = (t: string) =>
  t
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map(stem)

/* word stem -> pieces it points at, with how strongly */
const HINTS: [string[], Record<string, number>][] = [
  [['pric', 'billing', 'plan', 'subscription', 'checkout', 'tier', 'usage', 'meter'], { pricing: 4, faq: 2, testimonials: 2 }],
  [['landing', 'marketing', 'website', 'homepage', 'hero', 'launch'], { 'live-features': 3, threads: 2, announce: 2, testimonials: 2, cta: 2, faq: 1, halo: 1, slices: 1, integrations: 1, pricing: 1 }],
  [['dashboard', 'analytic', 'metric', 'kpi', 'report', 'stat', 'insight', 'overview'], { metric: 3, chart: 3, trend: 2, shift: 2, rings: 1, funnel: 1, askchart: 1 }],
  [['chart', 'graph', 'data', 'viz', 'visuali', 'plot'], { chart: 3, askchart: 3, trend: 2, histogram: 2, scatter: 2, radar: 1, bridge: 1, funnel: 1 }],
  [['agent', 'ai', 'llm', 'assistant', 'copilot', 'gpt', 'claude', 'bot'], { 'agent-chat': 3, trace: 3, prompt: 2, models: 2, 'agent-dashboard': 2, 'agent-canvas': 1, diff: 1, extract: 1 }],
  [['chat', 'conversation', 'messag', 'reply'], { 'agent-chat': 4, prompt: 3, voicenote: 1, emoji: 1 }],
  [['approval', 'approve', 'human', 'loop', 'permission', 'run', 'trace', 'step', 'workflow'], { trace: 4, 'code-review': 1, diff: 1, extract: 1 }],
  [['code', 'pr', 'pull', 'github', 'merge', 'diff', 'commit', 'developer', 'dev'], { 'code-review': 4, diff: 3, 'task-to-merge': 3 }],
  [['support', 'ticket', 'inbox', 'helpdesk', 'customer', 'email'], { 'support-inbox': 4, faq: 1 }],
  [['voice', 'call', 'transcript', 'audio', 'speech', 'podcast'], { 'voice-mode': 4, voicenote: 3 }],
  [['eval', 'regression', 'benchmark'], { evals: 4, radar: 1 }],
  [['calendar', 'schedul', 'booking', 'meeting', 'event'], { calendar: 4, dates: 2 }],
  [['date', 'range', 'period', 'time'], { dates: 4 }],
  [['table', 'crm', 'admin', 'record', 'list', 'row'], { 'data-table': 4, filter: 3, find: 1 }],
  [['filter', 'query', 'search', 'find'], { filter: 3, find: 3, 'data-table': 1 }],
  [['onboard', 'signup', 'setup', 'welcome', 'first', 'workspace'], { onboarding: 4, 'sign-in': 2 }],
  [['login', 'auth', 'signin', 'sign', 'password', 'account'], { 'sign-in': 4 }],
  [['setting', 'preference', 'config', 'option', 'toggle'], { settings: 4, phrase: 2, popup: 1 }],
  [['form', 'input', 'select', 'dropdown', 'picker', 'menu'], { popup: 3, phrase: 2, upload: 1, dates: 1 }],
  [['upload', 'file', 'attachment', 'drop', 'image'], { upload: 4 }],
  [['document', 'invoice', 'receipt', 'ocr', 'extract', 'pdf', 'parse', 'form'], { extract: 4 }],
  [['forecast', 'runway', 'cash', 'finance', 'budget', 'fintech', 'money', 'spend'], { forecast: 4, bridge: 2, trend: 2, metric: 1 }],
  [['revenue', 'mrr', 'arr', 'sale', 'profit', 'waterfall'], { bridge: 4, funnel: 2, metric: 2, forecast: 1 }],
  [['funnel', 'conversion', 'growth', 'retention', 'churn', 'signup'], { funnel: 4, metric: 1 }],
  [['incident', 'outage', 'alert', 'monitor', 'ops', 'sre', 'uptime', 'error', 'log'], { incident: 4, 'agent-dashboard': 1, trace: 1 }],
  [['language', 'i18n', 'locale', 'translat', 'country', 'international'], { hello: 4 }],
  [['region', 'latency', 'server', 'deploy', 'cloud', 'infra', 'hosting', 'edge'], { region: 4 }],
  [['emoji', 'reaction', 'sticker'], { emoji: 4 }],
  [['mcp', 'cursor', 'editor', 'ide'], { mcp: 4 }],
  [['integration', 'connect', 'stack', 'api', 'plugin'], { integrations: 4, mcp: 1 }],
  [['testimonial', 'review', 'social', 'proof', 'customer', 'quote'], { testimonials: 4 }],
  [['faq', 'question', 'help', 'doc'], { faq: 4 }],
  [['cta', 'waitlist', 'newsletter', 'capture', 'lead'], { cta: 4 }],
  [['note', 'editor', 'writing', 'text', 'journal', 'textarea', 'undo', 'history'], { rewind: 3, rewrite: 2 }],
  [['rewrite', 'copywriting', 'edit', 'tone', 'grammar'], { rewrite: 4 }],
  [['team', 'collab', 'realtime', 'multiplayer', 'todo', 'checklist', 'task'], { livelist: 3, 'task-to-merge': 1 }],
  [['goal', 'okr', 'progress', 'target', 'habit', 'fitness'], { rings: 4, histogram: 1 }],
  [['compare', 'versu', 'vs', 'matchup', 'competitor'], { radar: 4 }],
  [['distribution', 'percentile', 'p95', 'latency'], { histogram: 3, scatter: 2 }],
  [['model', 'reasoning', 'effort', 'token', 'cost'], { models: 4 }],
  [['traffic', 'source', 'referrer', 'visitor', 'channel', 'utm'], { shift: 4 }],
  [['icon', 'logo', 'art', 'ascii', 'brand'], { glyph: 4 }],
  [['announcement', 'new', 'release', 'changelog'], { announce: 3 }],
  [['headline', 'title', 'typography', 'heading'], { slices: 3 }],
  [['glow', 'background', 'gradient', 'light'], { halo: 3 }],
  [['calendar', 'schedule', 'event', 'meeting', 'week', 'planner'], { week: 4 }],
  [['avatar', 'assistant', 'mascot', 'face', 'character'], { buddy: 3 }],
  [['crypto', 'web3', 'wallet', 'deposit', 'withdraw', 'token', 'defi'], { vault: 4, 'agent-wallet': 1 }],
  [['agent', 'budget', 'spend', 'payments', 'approve', 'limit'], { 'agent-wallet': 4 }],
  [['support', 'help', 'helpdesk', 'intercom', 'widget', 'customer'], { 'support-chat': 4 }],
]

/* A hint key of four letters or more also matches longer words it starts ("pric" catches pricing and price) */
const hintsFor = (w: string) => {
  const out: Record<string, number> = {}
  for (const [keys, to] of HINTS) {
    /* keys are stemmed like the words, so "landing" meets "landing" (both "land") */
    if (!keys.some((k) => {
      const sk = stem(k)
      return w === sk || (sk.length >= 4 && w.startsWith(sk))
    }))
      continue
    for (const [id, n] of Object.entries(to)) out[id] = Math.max(out[id] ?? 0, n)
  }
  return out
}

const DOCS: Doc[] = [
  ...ENTRIES.map((e) => ({
    id: e.id,
    kind: 'components' as const,
    name: e.name,
    pro: isProComponent(e.id),
    why: GUIDE[e.id]?.use ?? e.line,
    group: e.category,
    strong: new Set(words(`${e.name} ${GUIDE[e.id]?.use ?? ''}`)),
    weak: new Set(words(`${e.line} ${e.category}`)),
  })),
  ...BLOCKS.map((b) => ({
    id: b.id,
    kind: 'blocks' as const,
    name: b.name,
    pro: isProBlock(b.id),
    why: b.line.split(/(?<=[.:])\s/)[0].replace(/:$/, '.'),
    group: b.kind,
    strong: new Set(words(b.name)),
    weak: new Set(words(`${b.line} ${b.kind}`)),
  })),
]

const FALLBACK: Record<string, string> = {
  'agent-chat': 'prompt',
  'agent-canvas': 'prompt',
  threads: 'halo',
  'agent-dashboard': 'metric',
  askchart: 'chart',
  forecast: 'trend',
  settings: 'phrase',
  'voice-mode': 'voicenote',
  'code-review': 'diff',
  'task-to-merge': 'diff',
  onboarding: 'sign-in',
}

export function match(text: string, limit = 4): Pick[] {
  const asked = [...new Set(words(text))]
  if (!asked.length) return []
  const score = new Map<string, number>()
  for (const w of asked) for (const [id, n] of Object.entries(hintsFor(w))) score.set(id, (score.get(id) ?? 0) + n)
  for (const d of DOCS) {
    let s = score.get(d.id) ?? 0
    for (const w of asked) s += d.strong.has(w) ? 2 : d.weak.has(w) ? 0.5 : 0
    score.set(d.id, s)
  }
  const all = DOCS.map((d) => ({ ...d, score: score.get(d.id) ?? 0 })).sort((a, b) => b.score - a.score)
  const ranked = all.filter((d) => d.score >= 2)
  const top = ranked[0]?.score ?? 0
  const picks = ranked.filter((d) => d.score >= top * 0.35).slice(0, limit)
  /* For a Pro pick, a free piece that genuinely does part of the same job, or nothing. A wrong stand-in is worse
     than none, so these are chosen by hand. */
  const altFor = (d: Doc): Alt | undefined => {
    const id = FALLBACK[d.id]
    const x = id && !picks.some((p) => p.id === id) ? DOCS.find((y) => y.id === id && !y.pro) : undefined
    return x ? { id: x.id, kind: x.kind, name: x.name } : undefined
  }
  return picks.map((d) => ({ id: d.id, kind: d.kind, name: d.name, pro: d.pro, why: d.why, score: d.score, group: d.group, ...(d.pro ? { alt: altFor(d) } : {}) }))
}

/* For an all-free answer: how much more Pro has in the family the answer leans on, and where to see it */
export function moreInPro(picks: Pick[]): { count: number; label: string } | null {
  const groups = picks.filter((p) => p.kind === 'components').map((p) => p.group)
  const group = groups.sort((a, b) => groups.filter((g) => g === b).length - groups.filter((g) => g === a).length)[0]
  if (group) {
    const count = ENTRIES.filter((e) => e.category === group && isProComponent(e.id)).length
    if (count) return { count, label: `for ${CATEGORIES.find((c) => c.id === group)?.name.toLowerCase() ?? group}` }
  }
  const blocks = BLOCKS.filter((b) => isProBlock(b.id)).length
  return blocks ? { count: blocks, label: 'whole screens' } : null
}

const hits = (w: string, k: string) => {
  const sk = stem(k)
  return w === sk || (sk.length >= 4 && w.startsWith(sk))
}

export function recipeFor(text: string): Recipe | null {
  const asked = [...new Set(words(text))]
  if (!asked.length) return null
  let best: Recipe | null = null
  let top = 0
  for (const r of RECIPES) {
    let s = 0
    for (const [k, n] of Object.entries(r.triggers)) if (asked.some((w) => hits(w, k))) s += n
    if (s > top) {
      best = r
      top = s
    }
  }
  return top >= 3 ? best : null
}

export function recipePicks(r: Recipe): Pick[] {
  return r.pieces.flatMap((id) => {
    const d = DOCS.find((x) => x.id === id)
    return d ? [{ id: d.id, kind: d.kind, name: d.name, pro: d.pro, why: d.why, score: 0, group: d.group }] : []
  })
}
