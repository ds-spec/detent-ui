import type { Metadata } from 'next'
import Link from 'next/link'
import { CONTACT, LICENSOR, REFUND_DAYS, updated } from '@/catalog/trust'
import { LegalPage, List, P } from '@/site/trust/Legal'
import { page } from '@/site/seo'

export const metadata: Metadata = page({
  title: 'Terms',
  description: 'The terms for using the Detent site and buying Detent Pro, in plain words.',
  path: '/terms',
  image: '/opengraph-image',
})

const link = (href: string, text: string) => (
  <Link href={href} className="ring-focus rounded-[4px] text-ink underline decoration-[var(--line-strong)] underline-offset-[3px] hover:decoration-ink">
    {text}
  </Link>
)

/** The terms of the site and of buying Pro, in plain words. */
export default function Terms() {
  return (
    <LegalPage
      label="Terms"
      title="The terms, in plain words."
      intro={
        <p>
          These are the terms for using this site and buying Detent Pro, sold by {LICENSOR}. What you may do with the code itself is in the {link('/licence', 'licence')}.
        </p>
      }
      updated={updated()}
      sections={[
        {
          id: 'buying',
          title: 'Buying Pro',
          body: (
            <>
              <P>Pro is one payment, not a subscription. Prices are shown in US dollars; tax is added at checkout where it applies.</P>
              <P>Payments are taken by our checkout partner, which acts as the merchant of record: it handles the payment, your receipt and any sales tax or VAT, and its own terms cover the payment itself.</P>
              <P>
                If it isn’t right for you, you have {REFUND_DAYS} days to ask for your money back. The {link('/refunds', 'refund policy')} has the details.
              </P>
            </>
          ),
        },
        {
          id: 'keys',
          title: 'Accounts and keys',
          body: (
            <>
              <P>You sign in with a link sent to your email, and generate keys in your account. We keep your email address, what you bought, and a hash of your keys, and nothing else about you.</P>
              <P>A key installs Pro from the private registry. Keep it to the people your licence covers: one person for Pro and Pro + Templates, up to five for Team.</P>
              <P>A key that’s shared beyond its licence, or used against the licence’s terms, can be turned off. We’ll write first and give you a chance to put it right.</P>
            </>
          ),
        },
        {
          id: 'updates',
          title: 'Updates',
          body: (
            <>
              <P>Every Pro licence includes every update for as long as Detent is made: fixes, improvements and new components, blocks and templates in what your plan covers.</P>
              <P>Detent changes as it gets better. Now and then a component’s props or behaviour will change between versions; the {link('/changelog', 'changelog')} says what changed, and the version you installed keeps working in your project.</P>
              <P>If Detent ever stops being made, you keep everything you installed, under the same licence.</P>
            </>
          ),
        },
        {
          id: 'site',
          title: 'Using this site',
          body: (
            <List
              items={[
                'The demos, words and designs on this site belong to Detent. The free components are yours to use under MIT; the rest of the site isn’t a free resource to copy.',
                'Don’t try to get at Pro source through the site without a licence, or put an unreasonable load on it.',
                'The site uses only the storage it needs to work: your theme, your package manager, the pages you’ve looked at, kept in your own browser.',
              ]}
            />
          ),
        },
        {
          id: 'warranty',
          title: 'What we promise, and what we don’t',
          body: (
            <>
              <P>We build Detent carefully and fix what’s broken when we hear about it. Even so, it’s provided as it is, without warranties of any kind, and it’s up to you to check it does what your project needs.</P>
              <P>As far as the law allows, we aren’t liable for indirect or consequential losses from using Detent, and our total liability is limited to what you paid for it.</P>
            </>
          ),
        },
        {
          id: 'changes',
          title: 'Changes to these terms',
          body: <P>When these terms change, the date at the top changes with them. Changes never take away anything from a licence you’ve already bought.</P>,
        },
        {
          id: 'contact',
          title: 'Contact',
          body: (
            <P>
              Questions about any of this go to{' '}
              <a href={`mailto:${CONTACT}`} className="ring-focus rounded-[4px] text-ink underline decoration-[var(--line-strong)] underline-offset-[3px] hover:decoration-ink">
                {CONTACT}
              </a>
              .
            </P>
          ),
        },
      ]}
    />
  )
}
