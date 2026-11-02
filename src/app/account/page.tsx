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

async function Account() {
  const email = await currentEmail()
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
  return (
    <>
      <Heading first="Your keys." second={bought ? bought.name : 'No Pro purchase yet.'} />
      <p className="mt-4 text-body text-ink-3">
        Signed in as <span className="text-ink">{email}</span>.{' '}
        {!bought && (
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
export default function AccountPage() {
  return (
    <>
      <Header />
      <main className="mx-auto min-h-[60vh] max-w-[560px] px-5 pt-20 sm:px-6 sm:pt-28">
        <Suspense fallback={<div aria-hidden className="h-40" />}>
          <Account />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
