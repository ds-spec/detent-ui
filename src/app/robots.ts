import type { MetadataRoute } from 'next'
import { url } from '@/site/seo'

/**
 * robots.txt for Detent.
 * keep in sync with: /llms.txt, /ai.txt — all three share the same path allow/deny logic.
 *
 * AI SEARCH & ANSWER BOTS (allowed — these cite pages in AI responses):
 * - OAI-SearchBot (SearchGPT / ChatGPT search)
 * - ChatGPT-User (browsing on behalf of a ChatGPT user)
 * - Claude-SearchBot (Claude web search)
 * - Claude-User (Claude user-initiated fetches)
 * - PerplexityBot (Perplexity indexer)
 * - Perplexity-User (Perplexity real-time user searches)
 *
 * TRAINING BOTS (opt-in / opt-out — your call):
 * By default left commented so you can choose. Blocking training bots does NOT stop
 * search citations from the bots above.
 * - GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot, Bytespider
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Standard search engines and all well-behaved bots:
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/preview/', '/preview-fit/', '/api/', '/account'],
      },
      // AI search & answer bots: explicitly allowed on all public content
      {
        userAgent: [
          'OAI-SearchBot',
          'ChatGPT-User',
          'Claude-SearchBot',
          'Claude-User',
          'PerplexityBot',
          'Perplexity-User',
        ],
        allow: '/',
        disallow: ['/preview/', '/preview-fit/', '/api/', '/account'],
      },
      // Training crawlers (uncomment to block if you don't want AI training on your code/docs):
      // {
      //   userAgent: ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bytespider'],
      //   disallow: '/',
      // },
    ],
    sitemap: url('/sitemap.xml'),
    host: url(),
  }
}
