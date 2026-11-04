import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SITE } from '@/catalog/site'
import type { Step } from '@/catalog/template-start'
import { CONTACT } from '@/catalog/trust'
import { LAST_USED, socialProviders, type Provider } from '@/lib/account/auth'
import { listKeys, MAX_KEYS, purchaseFor } from '@/lib/account/keys'
import { safeNext } from '@/lib/account/next'
import { currentAccount } from '@/lib/account/session'
import { Key } from '@/lab/blocks/kit/icons'
import { buying } from '@/site/account/buying'
import { AuthHead, KeySheet, RemoveKey, SignIn, Snippet } from '@/site/account/Forms'
import { Centered, Column } from '@/site/account/Frame'
import { Row, Section, Tile } from '@/site/account/Grouped'
import { Membership } from '@/site/account/Membership'
import { ProBadge } from '@/site/account/ProBadge'
import { Footer } from '@/site/Footer'
import { Header } from '@/site/Header'
import { Avatar, SignOutButton } from '@/site/UserMenu'

export const metadata: Metadata = { title: 'Account', robots: { index: false, follow: false } }

const day = (at: number) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(at)
/** When, said the way a person would: just now, 2 hours ago, yesterday, then the date. */
function ago(at: number) {
  const s = (Date.now() - at) / 1000
  const say = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (s < 60) return 'just now'
  if (s < 3600) return say.format(-Math.round(s / 60), 'minute')
  if (s < 86_400) return say.format(-Math.round(s / 3600), 'hour')
  if (s < 86_400 * 14) return say.format(-Math.round(s / 86_400), 'day')
  return `on ${day(at)}`
}
const LINK = 'ring-focus rounded-[4px] text-[var(--accent-ink)] hover:underline'

type Back = { bought?: string; status?: string; email?: string; error?: string; next?: string }

/** Why GitHub or Google came back without signing anyone in, said plainly. */
const oauthError = (code?: string) =>
  !code
    ? undefined
    : code === 'account_not_linked'
      ? 'That account’s email isn’t verified there, so it can’t open this one. Use an email link instead.'
      : 'That sign-in didn’t finish. Try again, or use an email link.'

/** The three steps from a key to a component, here where the key is made. The whole guide is on /pro. */
const USE: Step[] = [
  {
    title: 'Add the registry',
    line: 'In components.json, beside what shadcn already wrote there.',
    file: 'components.json',
    code: `{
  "registries": {
    "@detent-pro": {
      "url": "${SITE}/r/pro/{name}.json",
      "headers": { "Authorization": "Bearer \${DETENT_PRO_KEY}" }
    }
  }
}`,
  },
  { title: 'Add your key', line: 'In .env.local, out of git. Give CI and your host the same variable.', file: '.env.local', code: 'DETENT_PRO_KEY=dtnt_your-key\n' },
  { title: 'Install anything', line: 'Components and blocks by name. The source lands in your project, yours to change.', code: 'npx shadcn add @detent-pro/lens' },
]

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
  const name = account.name || account.email.split('@')[0]
  return (
    <Column>
      {/* Who: the picture large, the name, the address, and what they've bought. */}
      <header className="flex flex-col items-center text-center">
        <span className="rounded-full p-1 shadow-[0_0_0_1px_var(--line)]">
          <Avatar email={account.email} image={account.image} size={88} />
        </span>
        <h1 className="mt-5 text-[28px] font-normal leading-[1.15] tracking-[-0.03em] text-ink sm:text-[32px]">{name}</h1>
        <p className="mt-1 text-callout text-ink-3">{account.email}</p>
        {purchase && (
          <div className="mt-4">
            <ProBadge plan={purchase.plan} />
          </div>
        )}
      </header>

      <Membership purchase={purchase} arriving={fromCheckout && !purchase} thanks={fromCheckout} />

      <Section
        id="keys"
        title="API keys"
        aside={`${keys.length} of ${MAX_KEYS}`}
        footer={purchase ? 'Each key installs Pro with the shadcn CLI. Make one for each machine and for CI, and remove any you lose.' : 'A key starts working the moment this account has Pro.'}
      >
        {keys.map((key) => (
          <Row
            key={key.id}
            tile={
              <Tile>
                <Key size={15} />
              </Tile>
            }
            title={key.name}
            detail={
              <>
                <span className="font-mono" translate="no">
                  dtnt_••••{key.hint}
                </span>
                <span aria-hidden> · </span>
                {key.usedAt ? `Last used ${ago(key.usedAt)}` : `Made ${ago(key.createdAt)}, not used yet`}
              </>
            }
            end={<RemoveKey id={key.id} name={key.name} />}
          />
        ))}
        <KeySheet count={keys.length} max={MAX_KEYS} />
      </Section>

      <Section
        id="install"
        title="Install with your key"
        inset={16}
        footer={
          <>
            The whole guide, with what each answer from the registry means, is on{' '}
            <Link href="/pro#install" className={LINK}>
              Install
            </Link>
            .
          </>
        }
      >
        {USE.map((step, i) => (
          <div key={step.title} className="flex gap-3.5 px-4 py-4">
            <span className="tnum grid size-[26px] shrink-0 place-items-center rounded-full bg-[color-mix(in_oklch,var(--ink)_8%,transparent)] text-caption font-medium text-ink-2">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-callout font-medium text-ink">{step.title}</p>
              <p className="mt-0.5 text-footnote leading-[1.5] text-ink-3">{step.line}</p>
              <div className="mt-3">
                <Snippet file={step.file} code={step.code ?? ''} />
              </div>
            </div>
          </div>
        ))}
      </Section>

      <Section>
        <SignOutButton icon={false} className="flex h-[52px] w-full items-center justify-center gap-2 text-callout text-danger transition-colors duration-150 hover:bg-[color-mix(in_oklch,var(--ink)_3%,transparent)] disabled:opacity-70">
          Sign out
        </SignOutButton>
      </Section>
      <p className="mt-8 text-center text-caption text-ink-3">
        Questions about your purchase? Write to{' '}
        <a href={`mailto:${CONTACT}`} className={LINK}>
          {CONTACT}
        </a>
        .
      </p>
    </Column>
  )
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
