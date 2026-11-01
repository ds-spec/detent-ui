import type { Metadata } from 'next'
import { SOON, TEMPLATES } from '@/catalog/templates'
import { ProTag } from '@/site/blocks/ProTag'
import { TemplateCard } from '@/site/templates/TemplateCard'
import { JsonLd, list, page } from '@/site/seo'
import { Band, BandHead, card } from '@/site/sheets'

export const metadata: Metadata = page({
  title: 'Templates — whole apps, ready to run',
  description: `${TEMPLATES.length} app templates with the AI built in: an agent workspace, a SaaS dashboard and a CRM, built in React from Detent components and the AI SDK: light and dark, any width, no layout shift.`,
  path: '/templates',
})

export default function TemplatesPage() {
  return (
    <>
      <Band>
        <BandHead
          as="h1"
          tag={<ProTag />}
          title="Skip the blank repo."
          quiet="Start from an app that works."
          line="Complete apps with the AI wired in: chat, agents, approvals, reports. Every screen live, in light and dark, at any width. Rename it, point it at your model, ship it."
        />
        <JsonLd
          data={list(
            'Detent templates',
            TEMPLATES.map((t) => ({ name: t.name, path: `/templates/${t.id}` })),
          )}
        />
        <div aria-label="Templates" className="mt-12 flex flex-col gap-3 sm:mt-16">
          {TEMPLATES.map((t) => (
            <TemplateCard key={t.id} t={t} />
          ))}
        </div>
      </Band>

      {SOON.length > 0 && (
        <Band tone="quiet" label="In the works">
          <BandHead title="In the works." quiet="One for every kind of AI product." />
          <ul className="mt-12 grid gap-3 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
            {SOON.map((s) => (
              <li key={s.name} className={card}>
                <span className="flex items-center justify-between gap-4">
                  <span className="text-[17px] tracking-[-0.01em] text-ink">{s.name}</span>
                  <span className="text-[13px] text-ink-3">{s.kind}</span>
                </span>
                <span className="mt-2 block text-[14px] leading-[1.55] text-ink-3">{s.line}</span>
              </li>
            ))}
          </ul>
        </Band>
      )}
    </>
  )
}
