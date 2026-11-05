import Link from 'next/link'
import type { Metadata } from 'next'
import { block } from '@/catalog/blocks'
import { PRO_BLOCK_COUNT, PRO_COMPONENTS } from '@/catalog/pro'
import { Live } from '@/site/ai/Live'
import { AI_SDK } from '@/catalog/site'
import { Footer } from '@/site/Footer'
import { Header } from '@/site/Header'
import { HomeHero } from '@/site/home/HomeHero'
import { HomeLibrary } from '@/site/home/HomeLibrary'
import { BRIDGE } from '@/site/home/bridge'
import { libraryIndex } from '@/site/home/library'
import { Plans } from '@/site/pro/Plans'
import { Running } from '@/site/pro/Running'
import { DESCRIPTION, JsonLd, NAME, page, siteGraph } from '@/site/seo'

const SHOWN = block('support-inbox')!

export const metadata: Metadata = page({ title: `${NAME} — premium React components`, absolute: true, description: DESCRIPTION, path: '/' })

export default function Home() {
  const lib = libraryIndex()
  return (
    <div className="min-h-dvh" style={{ background: 'var(--ground)' }}>
      <Header />
      <main>
        <JsonLd data={siteGraph()} />
        <HomeHero lib={lib} />
        <div style={{ height: BRIDGE }} />
        <HomeLibrary lib={lib} />

        {AI_SDK && (
          <>
        <section id="ai-sdk" aria-labelledby="ai-sdk-title" className="mt-3 scroll-mt-20 px-2.5 sm:px-5">
          <div className="rounded-[26px] sm:rounded-[36px]" style={{ background: 'var(--leaf)', boxShadow: 'var(--leaf-edge)' }}>
            <div className="mx-auto max-w-[1440px] px-3 pb-6 pt-20 sm:px-8 sm:pb-8 sm:pt-28">
              <div className="flex flex-col items-center px-2 text-center">
                <h2 id="ai-sdk-title" className="text-[clamp(38px,4.2vw,62px)] font-normal leading-[1.02] tracking-[-0.055em] text-ink">
                  Bring your useChat.
                  <br />
                  <span className="text-quiet">We’ll draw the rest.</span>
                </h2>
                <p className="mt-5 max-w-[480px] text-[16px] leading-[1.6] text-ink-3">This window runs on a real AI SDK route. Ask it something, and when it wants to act, you decide.</p>
              </div>
              <div className="mt-12 sm:mt-16">
                <Live height="h-[clamp(560px,calc(100dvh-200px),760px)]" />
              </div>
              <ul className="mt-3 grid gap-3 sm:grid-cols-3">
                {(
                  [
                    ['One hook, the whole chat', 'useDetentChat turns what useChat returns into the streaming answer, the run waterfall and the approval card, each timed as its parts arrive.', '/ai-sdk', 'See how it fits'],
                    ['Your theme, not ours', 'Install with the shadcn CLI and Detent reads your tokens. Your primary becomes its accent, and .dark makes it dark. No second design system.', '/system', 'See the tokens'],
                    ['Or start from a whole app', 'The Detent workspace is a whole chat app: sessions, automations and agents that ask before they act. Rename it and ship.', '/templates', 'See the template'],
                  ] as const
                ).map(([t, d, href, go]) => (
                  <li key={t}>
                    <Link href={href} prefetch={false} className="ring-focus group/go flex h-full flex-col rounded-[24px] bg-surface p-6 shadow-[var(--card-edge)] transition-[box-shadow,transform] duration-200 hover:shadow-[var(--card-lift)] active:scale-[0.99]">
                      <p className="text-[17px] tracking-[-0.01em] text-ink">{t}</p>
                      <p className="mt-2 text-[14px] leading-[1.55] text-ink-3">{d}</p>
                      <span className="mt-auto flex items-center gap-1.5 pt-5 text-[13.5px] font-medium text-ink-2 transition-colors group-hover/go:text-ink">
                        {go}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="transition-transform duration-200 group-hover/go:translate-x-0.5">
                          <path d="M5 12h13.5M13 6.5l5.5 5.5-5.5 5.5" />
                        </svg>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
          </>
        )}

        <section id="pro" className="mt-3 scroll-mt-20 px-2.5 sm:px-5">
          <div className="rounded-[26px] sm:rounded-[36px]" style={{ background: 'var(--paper)', boxShadow: 'var(--leaf-edge)' }}>
            <div className="mx-auto max-w-[1440px] px-3 pb-10 pt-20 sm:px-8 sm:pb-12 sm:pt-28">
              <div className="flex flex-col items-center px-2 text-center">
                <h2 className="text-[clamp(38px,4.2vw,62px)] font-normal leading-[1.02] tracking-[-0.055em] text-ink">
                  The hard parts,
                  <br />
                  <span className="text-quiet">already built.</span>
                </h2>
                <p className="mt-5 max-w-[520px] text-[16px] leading-[1.6] text-ink-3">
                  {PRO_COMPONENTS.length} components and {PRO_BLOCK_COUNT} full screens you’d otherwise build yourself. Pay once, and the code is yours.
                </p>
              </div>
              <div className="mt-12 sm:mt-16">
                <Running id={SHOWN.id} name={SHOWN.name} title={SHOWN.window} count={PRO_BLOCK_COUNT} />
              </div>
              <div className="mt-3">
                <Plans compact />
              </div>
              <div className="mt-6 flex justify-center">
                <Link href="/pro" className="ring-focus group/go inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-medium text-ink-2 transition-[color,transform] duration-150 hover:text-ink active:scale-[0.97]">
                  See everything in Pro
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="transition-transform duration-200 group-hover/go:translate-x-0.5">
                    <path d="M5 12h13.5M13 6.5l5.5 5.5-5.5 5.5" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
