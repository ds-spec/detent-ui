import type { Metadata } from 'next'
import { CONTACT, updated } from '@/catalog/trust'
import { LegalPage, List, P } from '@/site/trust/Legal'
import { page } from '@/site/seo'

export const metadata: Metadata = page({
  title: 'Privacy',
  description: 'What Detent keeps about you, why, who helps run it, and how to have it removed. No ads, nothing sold.',
  path: '/privacy',
  image: '/opengraph-image',
})

const mail = (
  <a href={`mailto:${CONTACT}`} className="ring-focus rounded-[4px] text-ink underline decoration-[var(--line-strong)] underline-offset-[3px] hover:decoration-ink">
    {CONTACT}
  </a>
)

export default function Privacy() {
  return (
    <LegalPage
      label="Privacy"
      title="We keep as little as we can."
      intro={<p>You can browse Detent and install every free component without an account. We only keep what we need to sign you in, deliver what you bought and answer you when you write.</p>}
      updated={updated()}
      sections={[
        {
          id: 'collect',
          title: 'What we keep',
          body: (
            <List
              items={[
                'Your email address, when you create an account. If you sign in with GitHub, your name and avatar from GitHub too.',
                'Sign-in records: your session, and how you last signed in, so you stay signed in and we can keep your account safe.',
                'Your purchases: which plan, when, the payment reference from Dodo Payments, and whether it was refunded. We never see or store your card details.',
                'Your licence keys, and checks of a key when it installs Pro components, so a key only works for the person who bought it.',
                'Which Pro components and templates each account has installed, and when. It’s how your account page counts what you’ve tried, and how we answer refund requests fairly.',
                'What you send us by email, so we can reply.',
              ]}
            />
          ),
        },
        {
          id: 'not',
          title: 'What we don’t do',
          body: <List items={['No advertising, and no ad cookies. Google Analytics’ advertising features are off.', 'We don’t sell or rent your data to anyone.', 'The live demos run in your browser or against a scripted demo. We don’t keep what you type into them.']} />,
        },
        {
          id: 'analytics',
          title: 'How we count visits',
          body: (
            <>
              <P>Google Analytics shows us which pages people visit, which components and blocks they open, copy and install, what they search for, and when they start a purchase. That tells us what to make next. Cloudflare Web Analytics also counts visits, without cookies.</P>
              <P>Google Analytics sets its own cookies to tell visits apart, and Google receives your IP address and browser details to do this, under its own privacy policy. You can block it with any content blocker, or with Google’s opt-out add-on, and the site works the same.</P>
            </>
          ),
        },
        {
          id: 'who',
          title: 'Who helps us run it',
          body: (
            <>
              <P>A few services process data for us, only to do their part:</P>
              <List
                items={[
                  'Dodo Payments takes payment as the merchant of record: your payment details, billing address and receipts are handled by them, under their privacy policy.',
                  'Cloudflare hosts the site, keeps standard request logs such as IP addresses to keep it running and secure, and counts visits in aggregate for our traffic numbers.',
                  'Google Analytics counts visits and what people open, copy and buy, as described above.',
                  'Turso stores our database: accounts, purchases and keys.',
                  'Resend sends our emails: sign-in links and messages about your purchase.',
                  'GitHub, only if you choose to sign in with it.',
                ]}
              />
            </>
          ),
        },
        {
          id: 'cookies',
          title: 'Cookies and storage',
          body: <P>Our own cookies keep you signed in. Google Analytics sets its own to tell visits apart, as described above. Your browser also remembers small preferences, like light or dark mode, and your package manager.</P>,
        },
        {
          id: 'keep',
          title: 'How long we keep it',
          body: <P>Your account stays until you ask us to delete it. Purchase records are kept as long as tax and accounting rules require, even after an account is deleted. Request logs are kept only briefly by our hosting provider.</P>,
        },
        {
          id: 'rights',
          title: 'Your choices',
          body: (
            <>
              <P>Write to {mail} from the address on your account and we’ll send you a copy of what we hold, correct it, or delete your account. We’ll answer within 30 days, usually much sooner.</P>
              <P>Deleting your account also stops your licence keys from working.</P>
            </>
          ),
        },
        {
          id: 'changes',
          title: 'Changes',
          body: <P>If this policy changes in a way that matters, we’ll update the date above, and email you if you have an account.</P>,
        },
      ]}
    />
  )
}
