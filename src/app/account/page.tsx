import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { LAST_USED, socialProviders, type Provider } from '@/lib/account/auth'
import { listKeys, MAX_KEYS, purchaseFor, usageFor } from '@/lib/account/keys'
import { piecesFor, pulseFor } from '@/lib/account/pulse'
import { safeNext } from '@/lib/account/next'
import { currentAccount } from '@/lib/account/session'
import { buying } from '@/site/account/buying'
import { AuthHead, SignIn } from '@/site/account/Forms'
import { Centered } from '@/site/account/Frame'
import { AccountView } from '@/site/account/AccountView'
import { Claim } from '@/site/account/Claim'
import { claimableFor } from './claim'
import { Footer } from '@/site/Footer'
import { Header } from '@/site/Header'

export const metadata: Metadata = { title: 'Account', robots: { index: false, follow: false } }

type Back = { bought?: string; status?: string; email?: string; payment_id?: string; have?: string; error?: string; next?: string }

const oauthError = (code?: string) =>
  !code
    ? undefined
    : code === 'account_not_linked'
      ? 'That account’s email isn’t verified there, so it can’t open this one. Use an email link instead.'
      : 'That sign-in didn’t finish. Try again, or use an email link.'

async function Account({ query }: { query: Promise<Back> }) {
  const [account, back] = await Promise.all([currentAccount(), query])
  const providers = Object.keys(socialProviders()) as Provider[]
  const error = oauthError(back.error)
  const next = safeNext(back.next)
  const fromCheckout = back.bought === '1'
  if (fromCheckout && back.status === 'failed')
    return (
      <Centered>
        <AuthHead title="That didn’t go through" lead="The payment was declined or cancelled, and nothing was charged." />
        <Link href="/pro" className="ring-focus mt-9 grid h-12 w-full place-items-center rounded-[12px] bg-ink text-callout font-medium text-surface transition-opacity duration-150 hover:opacity-90">
          Back to plans
        </Link>
      </Centered>
    )
  if (!account) {
    const lastUsed = (await cookies()).get(LAST_USED)?.value
    const shared = { providers, error, lastUsed }
    if (next !== '/account') return <SignIn title="Sign in to get Pro" lead="Pro goes on your account, so your keys work the moment you’ve paid." next={next} buying={buying(next.split('/').pop())} {...shared} />
    if (back.have === '1') return <SignIn title="You already have Pro" lead="That email already has Pro on it. Sign in with it to get your keys, no need to pay again." {...shared} />
    const paidWith = back.email ?? (await cookies()).get('dt_buyer')?.value
    if (fromCheckout) return <SignIn title="Thank you. Now your key." lead={paidWith ? `Your payment went through. We’ve emailed a sign-in link to ${paidWith}. Open it, or sign in here with that address, and Pro is on your account.` : 'Your payment went through. We’ve emailed a sign-in link to the address you paid with. Open it, or sign in here with that address, and Pro is on your account.'} email={paidWith} {...shared} />
    return <SignIn title="Sign in to Detent" lead="Get your keys for the Pro registry." {...shared} />
  }
  if (next !== '/account') redirect(next)

  const [purchase, keys] = await Promise.all([purchaseFor(account.email), listKeys(account.email)])
  const [usage, feedback, pieces] = purchase ? await Promise.all([usageFor(account.email, purchase.since).catch(() => null), pulseFor(account.email).catch(() => null), piecesFor(account.email).catch(() => [])]) : [null, null, []]
  /* Paid with one email, signed in with another: offer to move that fresh payment here */
  const claim = fromCheckout && !purchase && back.payment_id ? await claimableFor(back.payment_id, account.email) : null
  return (
    <>
      {claim && back.payment_id && <Claim payment={back.payment_id} claim={claim} />}
      <AccountView account={account} purchase={purchase} keys={keys} usage={usage} feedback={feedback} pieces={pieces} fromCheckout={fromCheckout} max={MAX_KEYS} />
    </>
  )
}

export default function AccountPage({ searchParams }: PageProps<'/account'>) {
  return (
    <>
      <Header />
      <main className="px-5 sm:px-6">
        <Suspense fallback={<div aria-hidden className="min-h-[calc(100svh-72px)]" />}>
          <Account query={searchParams as Promise<Back>} />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
