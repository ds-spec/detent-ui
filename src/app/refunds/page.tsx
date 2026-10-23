import type { Metadata } from 'next'
import { CONTACT, REFUND_DAYS, updated } from '@/catalog/trust'
import { LegalPage, List, P } from '@/site/trust/Legal'
import { page } from '@/site/seo'

export const metadata: Metadata = page({
  title: 'Refunds',
  description: `If Detent Pro isn’t right for you, ask within ${REFUND_DAYS} days and get every penny back.`,
  path: '/refunds',
  image: '/opengraph-image',
})

const mail = (
  <a href={`mailto:${CONTACT}`} className="ring-focus rounded-[4px] text-ink underline decoration-[var(--line-strong)] underline-offset-[3px] hover:decoration-ink">
    {CONTACT}
  </a>
)

/** The refund policy: short, because it is. */
export default function Refunds() {
  return (
    <LegalPage
      label="Refunds"
      title={`${REFUND_DAYS} days to change your mind.`}
      intro={<p>If Pro isn’t what you needed, write within {REFUND_DAYS} days of buying it and you’ll get all of it back. You don’t need a reason.</p>}
      updated={updated()}
      sections={[
        {
          id: 'how',
          title: 'How to ask',
          body: (
            <>
              <P>Email {mail} from the address you bought with, or reply to your receipt. Include the order number if you have it to hand; if not, the email address is enough.</P>
              <P>Refunds go back to the way you paid, usually within five to ten working days depending on your bank.</P>
            </>
          ),
        },
        {
          id: 'what',
          title: 'What happens next',
          body: <List items={['Your licence key stops working with the private registry.', 'Code you installed should come out of your projects, and you agree not to keep using it.', 'If you buy again later, you start a new licence on the same terms as everyone else.']} />,
        },
        {
          id: 'after',
          title: `After ${REFUND_DAYS} days`,
          body: <P>Past the {REFUND_DAYS} days, purchases are final. If something’s wrong with Detent itself, like a component that doesn’t work as described, write anyway: we’ll fix it, or make it right.</P>,
        },
        {
          id: 'upgrades',
          title: 'Upgrades',
          body: <P>Moving from Pro to Pro + Templates, or to Team, you pay only the difference, and the {REFUND_DAYS} days start again for the upgrade.</P>,
        },
      ]}
    />
  )
}
