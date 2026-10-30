import type { Metadata } from 'next'
import { Confirm } from '@/site/account/Forms'
import { Footer } from '@/site/Footer'
import { Header } from '@/site/Header'

export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: false }, referrer: 'no-referrer' }

/** Where a sign-in link lands: one press to finish, so a mail scanner opening it signs no one in. */
export default function ConfirmPage() {
  return (
    <>
      <Header />
      <main className="mx-auto min-h-[60vh] max-w-[560px] px-5 pt-20 sm:px-6 sm:pt-28">
        <h1 className="text-[clamp(32px,4vw,44px)] font-normal leading-[1.08] tracking-[-0.045em] text-ink">Almost in.</h1>
        <Confirm />
      </main>
      <Footer />
    </>
  )
}
