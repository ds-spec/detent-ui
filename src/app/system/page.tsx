import type { Metadata } from 'next'
import { ENTRIES } from '@/catalog/meta'
import { Materials, Motion, Shape, Type } from '@/site/system/Specimens'
import { page } from '@/site/seo'
import { LinkShell } from '@/site/shell/Shell'

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

/** The list down the side: the four things, and the list marks the one you're reading. */
const RAIL = [{ id: 'page', name: 'On this page', items: SECTIONS.map((s) => ({ id: s.id, name: s.title })) }]
const LINKS = Object.fromEntries(SECTIONS.map((s) => [s.id, `#${s.id}`]))

export default function System() {
  return (
    <LinkShell label="System" groups={RAIL} links={LINKS} trail={['System']}>
      <main className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-8">
        <section className="pt-16 sm:pt-24">
          <p className="text-footnote text-ink-3">System</p>
          <h1 className="mt-3 max-w-[760px] text-[clamp(36px,4.6vw,52px)] font-normal leading-[1.04] tracking-[-0.05em] text-ink">Everything is built on the same four things.</h1>
          <p className="mt-5 max-w-[560px] text-body text-ink-3">Type, materials, motion and shape. Every component follows them, so {ENTRIES.length} pieces read as one set.</p>
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
    </LinkShell>
  )
}
