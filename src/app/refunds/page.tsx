import type { Metadata } from 'next'
import { CONTACT, REFUND_DAYS, TRIAL_INSTALLS, updated } from '@/catalog/trust'
import { LegalPage, List, P } from '@/site/trust/Legal'
import { page } from '@/site/seo'

export const metadata: Metadata = page({
  title: 'Refunds',
  description: `Try Detent Pro for ${REFUND_DAYS} days. If it isn’t right for you, ask and get every penny back.`,
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
      title={`${REFUND_DAYS} days to try it properly.`}
      intro={
        <p>
          Install a few components, put them in your app, see how they feel. If Pro isn’t what you needed, write within {REFUND_DAYS} days and you’ll get all of it back. You don’t need a reason.
        </p>
      }
      updated={updated()}
      sections={[
        {
          id: 'trying',
          title: 'Trying versus using',
          body: (
            <>
              <P>
                The refund covers trying Pro: up to {TRIAL_INSTALLS} components and blocks installed, and no templates downloaded. That’s plenty to know whether it’s right for you, and your account page shows how many you’ve tried.
              </P>
              <P>
                Past that, you’ve put Pro to real use, so the purchase is final. Templates are final once downloaded, since each one is a whole product in a single download. We keep a simple record of what each key installs, which is how we can say yes to a refund straight away instead of asking you questions.
              </P>
            </>
          ),
        },
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
          body: <List items={['Your keys stop working with the private registry.', 'Code you installed should come out of your projects, and you agree not to keep using it.', 'If you buy again later, that purchase is final: the trial is once per person.']} />,
        },
        {
          id: 'after',
          title: `After ${REFUND_DAYS} days`,
          body: <P>Past the {REFUND_DAYS} days, purchases are final. Whenever you bought, if something’s wrong with Detent itself, like a component that doesn’t work as described, write anyway: we’ll fix it, or make it right.</P>,
        },
        {
          id: 'upgrades',
          title: 'Upgrades',
          body: <P>Moving from Pro to Pro + Templates, you pay only the difference, and the {REFUND_DAYS} days start again for the upgrade.</P>,
        },
      ]}
    />
  )
}
