import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { LAST_USED, socialProviders, type Provider } from '@/lib/account/auth'
import { listKeys, MAX_KEYS, purchaseFor, usageFor } from '@/lib/account/keys'
import { safeNext } from '@/lib/account/next'
import { currentAccount } from '@/lib/account/session'
import { buying } from '@/site/account/buying'
import { AuthHead, SignIn } from '@/site/account/Forms'
import { Centered } from '@/site/account/Frame'
import { AccountView } from '@/site/account/AccountView'
import { Footer } from '@/site/Footer'
import { Header } from '@/site/Header'

export const metadata: Metadata = { title: 'Account', robots: { index: false, follow: false } }

type Back = { bought?: string; status?: string; email?: string; error?: string; next?: string }

/** Why GitHub came back without signing anyone in, said plainly. */
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
  // On the way to buy: sign in (which makes the account) and then go on to the store.
  const next = safeNext(back.next)
  // Back from checkout: Dodo says how the payment went and which address paid.
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
    if (fromCheckout) return <SignIn title="Thank you. Now your key." lead="Your payment went through. Sign in with the address you paid with, and your key works right away." email={back.email} {...shared} />
    return <SignIn title="Sign in to Detent" lead="Get your keys for the Pro registry." {...shared} />
  }
  // Already signed in on the way to buy: straight on to the store.
  if (next !== '/account') redirect(next)

  const [purchase, keys] = await Promise.all([purchaseFor(account.email), listKeys(account.email)])
  const usage = purchase ? await usageFor(account.email, purchase.since).catch(() => null) : null
  return <AccountView account={account} purchase={purchase} keys={keys} usage={usage} fromCheckout={fromCheckout} max={MAX_KEYS} />
}

/** Sign in, and once in, the plan and the keys. Everything that knows who you are streams in behind Suspense. */
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
