import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { connection } from 'next/server'
import { emailOfUnsubscribe, unsubscribe } from '@/lib/account/subscribers'
import { AuthHead } from '@/site/account/Forms'
import { Footer } from '@/site/Footer'
import { Header } from '@/site/Header'

export const instant = false

export const metadata: Metadata = { title: 'Unsubscribe', robots: { index: false, follow: false } }

const BUTTON = 'ring-focus mt-8 grid h-11 w-full place-items-center rounded-[12px] text-[14px] font-medium transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]'
const QUIET = `${BUTTON} bg-surface text-ink shadow-[0_0_0_1px_var(--line-strong)]`

async function Done({ params, query }: { params: Promise<{ token: string }>; query: Promise<{ again?: string }> }) {
  await connection()
  const [{ token }, { again }] = await Promise.all([params, query])
  const email = emailOfUnsubscribe(token)
  if (!email)
    return (
      <>
        <AuthHead title="This link doesn’t work" lead="Your mail app may have cut it short. Open the newest email from Detent and use the link at the bottom." />
        <Link href="/" className={QUIET}>
          Back to Detent
        </Link>
      </>
    )
  if (again)
    return (
      <>
        <AuthHead title="You’re back in" lead={<>The next Friday component goes to <span className="text-ink">{email}</span>.</>} />
        <Link href="/components" className={QUIET}>
          See the components
        </Link>
      </>
    )
  await unsubscribe(email)
  return (
    <>
      <AuthHead title="You’re unsubscribed" lead={<>No more emails from Detent to <span className="text-ink">{email}</span>. Clicked by mistake?</>} />
      <form method="post" action={`/api/unsubscribe?t=${encodeURIComponent(token)}&undo=1`}>
        <button type="submit" className={QUIET}>
          Subscribe again
        </button>
      </form>
    </>
  )
}

export default function UnsubscribePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ again?: string }> }) {
  return (
    <>
      <Header />
      <main className="px-5 sm:px-6">
        <div className="mx-auto flex min-h-[calc(100svh-72px)] w-full max-w-[440px] flex-col justify-center pb-28 pt-12">
          <Suspense fallback={<div aria-hidden className="min-h-[260px]" />}>
            <Done params={params} query={searchParams} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  )
}
