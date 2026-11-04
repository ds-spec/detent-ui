import type { Metadata } from 'next'
import { allBuying } from '@/site/account/buying'
import { Confirm } from '@/site/account/Forms'
import { Footer } from '@/site/Footer'
import { Header } from '@/site/Header'

export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: false }, referrer: 'no-referrer' }

/** Where a sign-in link lands: one press to finish, so a mail scanner opening it signs no one in. */
export default function ConfirmPage() {
  return (
    <>
      <Header />
      <main className="px-5 sm:px-6">
        <Confirm plans={allBuying()} />
      </main>
      <Footer />
    </>
  )
}
