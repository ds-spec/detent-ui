import type { Metadata } from 'next'
import { Footer } from '@/site/Footer'
import { Header } from '@/site/Header'
import { Materials, Motion, Shape, Type } from '@/site/system/Specimens'
import { page } from '@/site/seo'

export const metadata: Metadata = page({
  title: 'Design system',
  description: 'The type scale, materials, motion and shape every Detent component is built on: Geist, four depths of material, springs, and one accent.',
  path: '/system',
  image: '/opengraph-image',
})

const SECTIONS = [
  { id: 'type', title: 'Type', line: 'Eight sizes in every component, and no others. Set in Geist. Big type stays regular and tight: the step in size is the emphasis.', body: <Type /> },
  { id: 'materials', title: 'Materials', line: 'Four depths, and one light. Raised surfaces catch light at their top edge; floating ones are glass; pressed ones sink; and Intelligence glows only while AI works.', body: <Materials /> },
  { id: 'motion', title: 'Motion', line: 'Things move and reshape rather than fade. Text and numbers roll through their slot. Springs, not timers.', body: <Motion /> },
  { id: 'shape', title: 'Shape', line: 'Radii are concentric, spacing sits on a 4pt grid, and anything you can press is at least 32 points.', body: <Shape /> },
]

export default function System() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1360px] px-5 sm:px-6">
        <section className="pt-20 sm:pt-28">
          <p className="text-footnote text-ink-3">System</p>
          <h1 className="mt-3 max-w-[760px] text-[clamp(36px,4.6vw,52px)] font-normal leading-[1.04] tracking-[-0.05em] text-ink">Everything is built on the same four things.</h1>
          <p className="mt-5 max-w-[560px] text-body text-ink-3">Type, materials, motion and shape. Every component follows them, so forty pieces read as one set.</p>
        </section>
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="mt-24 scroll-mt-24">
            <div className="grid gap-x-16 gap-y-3 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div>
                <h2 className="text-title text-ink">{s.title}</h2>
                <p className="mt-2 text-callout text-ink-3">{s.line}</p>
              </div>
              <div className="min-w-0">{s.body}</div>
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </>
  )
}
