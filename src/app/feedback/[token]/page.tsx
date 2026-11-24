import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { emailOfToken, piecesFor, pulseFor } from '@/lib/account/pulse'
import { isMood } from '@/lib/account/pulse-token'
import { AuthHead } from '@/site/account/Forms'
import { Pulse } from '@/site/account/Pulse'
import { Footer } from '@/site/Footer'
import { Header } from '@/site/Header'

export const metadata: Metadata = { title: 'How’s Detent?', robots: { index: false, follow: false } }

async function Ask({ params, query }: { params: Promise<{ token: string }>; query: Promise<{ m?: string }> }) {
  const [{ token }, { m }] = await Promise.all([params, query])
  const email = await emailOfToken(token)
  if (!email)
    return (
      <>
        <AuthHead title="This link has run out" lead="Sign in to your account and you can leave a note there instead." />
        <Link href="/account" className="ring-focus mt-8 grid h-11 w-full place-items-center rounded-[12px] bg-ink text-[14px] font-medium text-surface transition-opacity duration-150 hover:opacity-90">
          Go to your account
        </Link>
      </>
    )
  const [pieces, given] = await Promise.all([piecesFor(email), pulseFor(email)])
  return (
    <>
      <AuthHead title="Thanks for trying Detent" lead="A tap or two is plenty. Every answer comes straight to me, Deep, and it decides what I build next." />
      <div className="mt-9">
        <Pulse token={token} start={isMood(m) ? m : null} pieces={pieces} given={given} />
      </div>
    </>
  )
}

export default function FeedbackPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ m?: string }> }) {
  return (
    <>
      <Header />
      <main className="px-5 sm:px-6">
        <div className="mx-auto flex min-h-[calc(100svh-72px)] w-full max-w-[440px] flex-col justify-center pb-28 pt-12">
          <Suspense fallback={<div aria-hidden className="min-h-[420px]" />}>
            <Ask params={params} query={searchParams} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  )
}
