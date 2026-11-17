import type { Metadata } from 'next'
import { CONTACT, REFUND_RULE_UPDATED, updated } from '@/catalog/trust'
import { LegalPage, List, P } from '@/site/trust/Legal'
import { FREE_COUNT, page } from '@/site/seo'

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
      intro={<p>Detent Pro gives you the full source code the moment you buy, and code can’t be returned, so every sale is final. Here’s what counts as using Pro, and how we help when something doesn’t work.</p>}
      updated={updated(REFUND_RULE_UPDATED)}
      summary={[
        { title: 'All sales are final', line: 'Pro is one payment, and once it goes through there are no refunds.' },
        { title: 'Try it first', line: `Everything runs live on the site, and ${FREE_COUNT} components are free.` },
        { title: 'We help you fix it', line: 'If something doesn’t work in your project, email us.' },
      ]}
      sections={[
        {
          id: 'final',
          title: 'No refunds',
          body: (
            <>
              <P>All Detent Pro sales are final. When you buy, you get the full source code of every Pro component, block and the template straight away, and code that’s been delivered can’t be handed back.</P>
              <P>So once your payment goes through, we don’t issue refunds.</P>
            </>
          ),
        },
        {
          id: 'using',
          title: 'What counts as using Pro',
          body: (
            <>
              <P>Pro counts as used as soon as its code reaches you, by any of these routes:</P>
              <List
                items={[
                  'Installing any Pro component, block or the template with the shadcn CLI.',
                  'Getting Pro code through an AI agent, an MCP tool or any other assistant connected to your key.',
                  'Copying code from the site or the docs.',
                  'Downloading the template.',
                ]}
              />
              <P>It’s the same whether you take one component or the whole library.</P>
              <P>That’s why everything is out in the open first. Every Pro piece and the template run live on detentui.com, and {FREE_COUNT} components are free to install, so you can see how it looks and works in your own project before you pay. Buying and accessing Pro means you agree to this policy.</P>
            </>
          ),
        },
        {
          id: 'support',
          title: 'Support',
          body: <P>If a component or the template doesn’t work in your project, email {mail} with what you installed and what you’re seeing, and we’ll help you fix it. When the problem is on our side, the fix ships as an update, so everyone who owns Pro gets it.</P>,
        },
      ]}
    />
  )
}
