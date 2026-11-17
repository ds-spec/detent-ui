import type { Metadata } from 'next'
import { CONTACT, REFUND_RULE_UPDATED, updated } from '@/catalog/trust'
import { LegalPage, P } from '@/site/trust/Legal'
import { page } from '@/site/seo'

export const metadata: Metadata = page({
  title: 'Refunds',
  description: 'All Detent Pro sales are final. Everything runs live on the site to try before you buy, and if something doesn’t work, we’ll help you fix it.',
  path: '/refunds',
  image: '/opengraph-image',
})

const mail = (
  <a href={`mailto:${CONTACT}`} className="ring-focus rounded-[4px] text-ink underline decoration-[var(--line-strong)] underline-offset-[3px] hover:decoration-ink">
    {CONTACT}
  </a>
)

export default function Refunds() {
  return (
    <LegalPage
      label="Refunds"
      title="All sales are final."
      intro={<p>Detent Pro gives you the full source code the moment you buy, and code can’t be returned, so we don’t offer refunds.</p>}
      updated={updated(REFUND_RULE_UPDATED)}
      sections={[
        {
          id: 'using',
          title: 'What counts as using it',
          body: <P>Installing any Pro component or block with the CLI, copying its code, or downloading a template counts as using it. Every Pro piece and the template run live on detentui.com, so you can try them before you buy.</P>,
        },
        {
          id: 'support',
          title: 'Support',
          body: <P>If a component or the template doesn’t work in your project, email {mail} and we’ll help you fix it.</P>,
        },
      ]}
    />
  )
}
