import Link from 'next/link'
import type { Plan } from '@/catalog/licence'
import { SITE } from '@/catalog/site'
import type { Step } from '@/catalog/template-start'
import { CONTACT } from '@/catalog/trust'
import { Key } from '@/lab/blocks/kit/icons'
import { KeySheet, RemoveKey, Snippet } from './Forms'
import { Membership } from './Membership'
import type { Usage } from '@/lib/account/keys'
import { ProBadge } from './ProBadge'
import { SettingsCard, SettingsNav, SMALL_QUIET } from './Settings'
import { Avatar, SignOutButton } from '@/site/UserMenu'

const day = (at: number) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(at)
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
  { title: 'Install anything', line: 'Components and blocks by name. The source lands in your project, yours to change.', code: 'npx shadcn add @detent-pro/glyph' },
]

export type AccountKey = { id: string; name: string; hint: string; createdAt: number; usedAt: number | null }

export function AccountView({ account, purchase, keys, usage = null, fromCheckout, max = 5 }: { account: { email: string; name: string; image: string | null }; purchase: { plan: Plan; since: number } | null; keys: AccountKey[]; usage?: Usage | null; fromCheckout: boolean; max?: number }) {
  const MAX_KEYS = max
  const name = account.name || account.email.split('@')[0]
  return (
    <div className="mx-auto max-w-[1040px] pb-20 pt-10 sm:pt-14">
      <header className="flex items-center gap-4">
        <span className="rounded-full p-[3px] shadow-[0_0_0_1px_var(--line)]">
          <Avatar email={account.email} image={account.image} size={56} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="truncate text-[24px] font-semibold leading-[1.2] tracking-[-0.03em] text-ink">{name}</h1>
            {purchase && <ProBadge plan={purchase.plan} />}
          </div>
          <p className="mt-0.5 truncate text-[14px] text-ink-3">{account.email}</p>
        </div>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-12">
        <SettingsNav
          items={[
            ['plan', 'Plan'],
            ['keys', 'API keys'],
            ['install', 'Install'],
            ['session', 'Session'],
          ]}
        />
        <div className="grid min-w-0 gap-6">
          <Membership purchase={purchase} usage={usage} arriving={fromCheckout && !purchase} thanks={fromCheckout} />

          <SettingsCard
            id="keys"
            title="API keys"
            line={purchase ? 'Each key installs Pro with the shadcn CLI. Make one for each machine and one for CI, and remove any you lose.' : 'A key starts working the moment this account has Pro.'}
            foot={`${keys.length} of ${MAX_KEYS} keys`}
            action={<KeySheet count={keys.length} max={MAX_KEYS} compact />}
          >
            {keys.length > 0 ? (
              <ul className="overflow-hidden rounded-[10px] shadow-[0_0_0_1px_var(--line)]">
                {keys.map((key, i) => (
                  <li key={key.id} className={`flex items-center gap-3 px-4 py-3 ${i ? 'shadow-[inset_0_1px_0_var(--line)]' : ''}`}>
                    <span className="grid size-8 shrink-0 place-items-center rounded-[8px] bg-[color-mix(in_oklch,var(--ink)_6%,transparent)] text-ink-2">
                      <Key size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-ink">{key.name}</p>
                      <p className="truncate text-[12.5px] text-ink-3">
                        <span className="font-mono" translate="no">
                          dtnt_••••{key.hint}
                        </span>
                        <span aria-hidden> · </span>
                        {key.usedAt ? `Last used ${ago(key.usedAt)}` : `Made ${ago(key.createdAt)}, not used yet`}
                      </p>
                    </div>
                    <RemoveKey id={key.id} name={key.name} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="grid place-items-center rounded-[10px] px-6 py-8 text-center shadow-[inset_0_0_0_1px_var(--line)]">
                <span className="grid size-10 place-items-center rounded-[10px] bg-[color-mix(in_oklch,var(--ink)_6%,transparent)] text-ink-2">
                  <Key size={16} />
                </span>
                <p className="mt-3 text-[14px] font-medium text-ink">No keys yet</p>
                <p className="mt-1 max-w-[320px] text-[13px] text-ink-3">Create one, put it in your project’s .env.local, and install with the shadcn CLI.</p>
              </div>
            )}
          </SettingsCard>

          <SettingsCard
            id="install"
            title="Install with your key"
            line="Three steps, once per project."
            foot={
              <>
                The whole guide is on{' '}
                <Link href="/pro#install" className={LINK}>
                  Install
                </Link>
              </>
            }
          >
            <ol className="grid gap-5">
              {USE.map((step, i) => (
                <li key={step.title} className="flex gap-3.5">
                  <span className="tnum grid size-6 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklch,var(--ink)_7%,transparent)] text-[12px] font-medium text-ink-2">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-ink">{step.title}</p>
                    <p className="mt-0.5 text-[13px] leading-[1.5] text-ink-3">{step.line}</p>
                    <div className="mt-2.5">
                      <Snippet file={step.file} code={step.code ?? ''} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </SettingsCard>

          <SettingsCard
            id="session"
            title="Sign out"
            line="Sign out of Detent on this browser. Otherwise you stay signed in for 30 days."
            action={
              <SignOutButton icon={false} className={SMALL_QUIET}>
                Sign out
              </SignOutButton>
            }
          />

          <p className="text-center text-[13px] text-ink-3">
            Questions about your purchase? Write to{' '}
            <a href={`mailto:${CONTACT}`} className={LINK}>
              {CONTACT}
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

