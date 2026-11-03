import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PLANS } from '@/catalog/pro'
import { listKeys, planFor } from '@/lib/account/keys'
import { currentEmail } from '@/lib/account/session'
import { NewKey, SignIn } from '@/site/account/Forms'
import { Footer } from '@/site/Footer'
import { Header } from '@/site/Header'
import { deleteKey, signOut } from './actions'

export const metadata: Metadata = { title: 'Account', robots: { index: false, follow: false } }

const day = (at: number) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(at)
const Quiet = ({ action, name, value, label }: { action: (form: FormData) => Promise<void>; name: string; value: string; label: string }) => (
  <form action={action} className="shrink-0">
    <input type="hidden" name={name} value={value} />
    <button type="submit" className="ring-focus rounded-[4px] text-footnote text-ink-3 transition-colors duration-150 hover:text-ink">
      {label}
    </button>
  </form>
)

function Heading({ first, second }: { first: string; second: string }) {
  return (
    <h1 className="text-[clamp(32px,4vw,44px)] font-normal leading-[1.08] tracking-[-0.045em] text-ink">
      {first}
      <span className="block text-ink-3">{second}</span>
    </h1>
  )
}

type Back = { bought?: string; status?: string; email?: string }

async function Account({ query }: { query: Promise<Back> }) {
  const [email, back] = await Promise.all([currentEmail(), query])
  // Back from checkout: Dodo says how the payment went and which address paid.
  const fromCheckout = back.bought === '1'
  const failed = fromCheckout && back.status === 'failed'
  if (failed)
    return (
      <>
        <Heading first="That didn’t go through." second="Nothing was charged." />
        <p className="mt-4 text-body text-ink-3">
          The payment was declined or cancelled.{' '}
          <Link href="/pro" className="ring-focus rounded-[4px] text-ink underline decoration-[var(--line-strong)] underline-offset-[3px] hover:decoration-ink">
            Try again
          </Link>
        </p>
      </>
    )
  if (!email && fromCheckout)
    return (
      <>
        <Heading first="Thank you." second="Now your key." />
        <p className="mt-4 text-body text-ink-3">Your payment went through. Sign in with the address you paid with, then generate a key. Pro works with it right away.</p>
        <SignIn email={back.email} />
      </>
    )
  if (!email)
    return (
      <>
        <Heading first="One email." second="Then your key." />
        <p className="mt-4 text-body text-ink-3">Sign in with a link, no password, and generate a key for the Pro registry.</p>
        <SignIn />
      </>
    )
  const [plan, keys] = await Promise.all([planFor(email), listKeys(email)])
  const bought = PLANS.find((p) => p.id === plan)
  // Just paid, but the store's note hasn't landed yet: say so, rather than "no purchase".
  const arriving = fromCheckout && !bought
  return (
    <>
      <Heading first={fromCheckout ? 'Thank you.' : 'Your keys.'} second={bought ? bought.name : arriving ? 'Your purchase is on its way.' : 'No Pro purchase yet.'} />
      <p className="mt-4 text-body text-ink-3">
        Signed in as <span className="text-ink">{email}</span>.{' '}
        {arriving && <>Payments take a few seconds to confirm. Refresh in a moment and your plan will show here. </>}
        {!bought && !arriving && (
          <>
            A key starts working as soon as this address buys Pro.{' '}
            <Link href="/pro" className="ring-focus rounded-[4px] text-ink underline decoration-[var(--line-strong)] underline-offset-[3px] hover:decoration-ink">
              See plans
            </Link>
          </>
        )}
      </p>

      <section aria-label="Keys" className="mt-10">
        <NewKey />
        {keys.length > 0 && (
          <ul className="mt-6">
            {keys.map((key) => (
              <li key={key.id} className="flex items-center gap-4 py-3.5 shadow-[inset_0_1px_0_var(--line)]">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-callout text-ink">{key.name}</p>
                  <p className="mt-0.5 truncate text-footnote text-ink-3">
                    ending {key.hint} · {key.usedAt ? `last used ${day(key.usedAt)}` : `made ${day(key.createdAt)}`}
                  </p>
                </div>
                <Quiet action={deleteKey} name="id" value={key.id} label="Remove" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-12 flex items-center gap-5 text-footnote">
        <Link href="/pro#install" className="ring-focus rounded-[4px] text-ink-3 transition-colors duration-150 hover:text-ink">
          How to install
        </Link>
        <form action={signOut}>
          <button type="submit" className="ring-focus rounded-[4px] text-ink-3 transition-colors duration-150 hover:text-ink">
            Sign out
          </button>
        </form>
      </div>
    </>
  )
}

/** Sign in, and once in, the keys. Everything that knows who you are streams in behind Suspense. */
export default function AccountPage({ searchParams }: PageProps<'/account'>) {
  return (
    <>
      <Header />
      <main className="mx-auto min-h-[60vh] max-w-[560px] px-5 pt-20 sm:px-6 sm:pt-28">
        <Suspense fallback={<div aria-hidden className="h-40" />}>
          <Account query={searchParams as Promise<Back>} />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
