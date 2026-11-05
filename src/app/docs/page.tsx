import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { BLOCKS } from '@/catalog/blocks'
import { ENTRIES } from '@/catalog/meta'
import { PLANS, isProComponent } from '@/catalog/pro'
import { SITE, installCommand } from '@/catalog/site'
import { TEMPLATES } from '@/catalog/templates'
import { CONTACT } from '@/catalog/trust'
import { ArrowUpRight } from '@/lab/icons'
import { Snippet } from '@/site/account/Forms'
import { Footer } from '@/site/Footer'
import { Header } from '@/site/Header'
import { CopyCommand } from '@/site/parts'
import { page } from '@/site/seo'
import { CopyPrompt } from './CopyPrompt'

export const metadata: Metadata = page({
  title: 'Get started',
  description: 'Install your first Detent component with the shadcn CLI, set up reduced motion, and connect Pro. Or hand it all to your coding agent.',
  path: '/docs',
  image: '/opengraph-image',
})

const LINK = 'ring-focus rounded-[4px] text-[var(--accent-ink)] hover:underline'
const HOST = SITE.replace(/^https?:\/\//, '')

const FIRST = ENTRIES.find((e) => e.id === 'popup' && !isProComponent(e.id)) ?? ENTRIES.find((e) => !isProComponent(e.id))!

const PROMPT = `Read ${SITE}/llms.txt to learn the Detent component library. Then install the ${FIRST.name} component into this project with the shadcn CLI, using the exact command listed there, and use it on the home page. If the project has no components.json yet, run shadcn init first.`

const USE = `import { Popup } from '@/components/detent/components/popup/Popup'

export default function Page() {
  return (
    <Popup
      label="Repeat"
      options={['Every day', 'Weekdays', 'Never']}
      defaultValue="Every day"
    />
  )
}`

const MOTION = `import { MotionConfig } from 'motion/react'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </body>
    </html>
  )
}`

const REGISTRY = `{
  "registries": {
    "@detent-pro": {
      "url": "${SITE}/r/pro/{name}.json",
      "headers": { "Authorization": "Bearer \${DETENT_PRO_KEY}" }
    }
  }
}`

const TOC = [
  ['agent', 'With your coding agent'],
  ['install', 'Install a component'],
  ['pro', 'Install Pro'],
  ['help', 'If something goes wrong'],
  ['next', 'Where to next'],
] as const

export default function Docs() {
  const free = ENTRIES.filter((e) => !isProComponent(e.id)).length
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1180px] px-5 pb-28 pt-28 sm:px-8 sm:pt-36">
        <div className="grid gap-16 lg:grid-cols-[minmax(0,720px)_200px] lg:justify-between">
          <div className="min-w-0">
            <p className="text-[14px] text-ink-3">Docs</p>
            <h1 className="mt-3 text-[clamp(38px,4.6vw,56px)] font-normal leading-[1.04] tracking-[-0.05em] text-ink">
              Get started.
              <br />
              <span className="text-quiet">Your first component in a minute.</span>
            </h1>
            <p className="mt-6 max-w-[560px] text-[17px] leading-[1.6] text-ink-3">
              Detent installs with the shadcn CLI, so every piece lands in your project as source you own. {free} components are free under MIT; the rest come with Pro.
            </p>

            <section id="agent" aria-labelledby="agent-h" className="mt-12 scroll-mt-28 rounded-[16px] bg-[var(--mount)] p-2 shadow-[0_0_0_1px_var(--line)]">
              <div className="flex flex-wrap items-center justify-between gap-3 px-3 pb-3 pt-2">
                <div>
                  <h2 id="agent-h" className="text-[15px] font-medium text-ink">
                    With your coding agent
                  </h2>
                  <p className="mt-0.5 text-[14px] text-ink-3">Paste this into Cursor, Claude Code or any agent. It reads the library and installs for you.</p>
                </div>
                <CopyPrompt prompt={PROMPT} />
              </div>
              <p className="rounded-[11px] bg-surface px-4 py-3.5 font-mono text-[13px] leading-[1.7] text-ink-2 shadow-[0_0_0_1px_var(--line)]">{PROMPT}</p>
            </section>

            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              <Way href="#install" title="Start a new app" line="Set up shadcn, then add your first piece." />
              <Way href="#use" title="Add to your app" line="Already on shadcn? Two commands." />
              <Way href="#pro" title="Use Pro" line="Connect your key once, install by name." />
            </div>

            <Section id="install" title="Install a component" line="Free components install from a public registry. Every component’s page has its own command.">
              <Steps>
                <Step n={1} title="Set up shadcn" line="Skip this if your project already has a components.json. You need React and Tailwind CSS v4; Next.js is what we test on.">
                  <CopyCommand fill command="npx shadcn@latest init" />
                </Step>
                <Step n={2} id="use" title={`Add ${FIRST.name}`} line="Its source lands in components/detent, ready to change. The first install also brings the Detent theme, and anything a piece needs, like motion, comes with it.">
                  <CopyCommand fill command={installCommand(FIRST.id, true)} />
                </Step>
                <Step n={3} title="Use it" line="Import it like any of your own components.">
                  <Snippet file="app/page.tsx" code={USE} />
                </Step>
                <Step n={4} title="Respect reduced motion" line="Wrap your app once. Everything Detent animates then calms down for people who’ve asked their device for less motion." last>
                  <Snippet file="app/layout.tsx" code={MOTION} />
                </Step>
              </Steps>
            </Section>

            <Section
              id="pro"
              title="Install Pro"
              line={
                <>
                  Pro installs the same way, from a private registry that knows your key.{' '}
                  <Link href="/pro" className={LINK}>
                    Pro is ${PLANS[0].price}, once
                  </Link>
                  , with every update for life.
                </>
              }
            >
              <Steps>
                <Step
                  n={1}
                  title="Make a key"
                  line={
                    <>
                      After you buy, make one on your{' '}
                      <Link href="/account" className={LINK}>
                        account page
                      </Link>
                      . One per machine, and one for CI.
                    </>
                  }
                />
                <Step n={2} title="Add the registry" line="In components.json, beside what shadcn already wrote there.">
                  <Snippet file="components.json" code={REGISTRY} />
                </Step>
                <Step n={3} title="Add your key" line="In .env.local, out of git. Give CI and your host the same variable.">
                  <Snippet file=".env.local" code="DETENT_PRO_KEY=dtnt_your-key" />
                </Step>
                <Step n={4} title="Install anything" line="Components and blocks by name, from their pages." last>
                  <CopyCommand fill command={installCommand('glyph', false)} />
                </Step>
              </Steps>
            </Section>

            <Section id="help" title="If something goes wrong">
              <div className="overflow-hidden rounded-[14px] shadow-[0_0_0_1px_var(--line)]">
                <Fix q="pnpm stops with ERR_PNPM_IGNORED_BUILDS">That’s pnpm holding back Next.js’s own build scripts in a new project, not Detent. Run pnpm approve-builds, then install again.</Fix>
                <Fix q="A Pro install answers 401 or 403">Check that the key is in .env.local as DETENT_PRO_KEY, that the registry block is in components.json, and that the key is still listed on your account page.</Fix>
                <Fix q="Colours or type look unstyled">The theme stylesheet isn’t being loaded. The first install imports it into your global CSS; if you moved that file, import it again.</Fix>
                <Fix q="My coding agent installs the wrong thing">
                  Point it at {HOST}/llms.txt first. It lists every component with the exact command that installs it, so the agent doesn’t have to guess.
                </Fix>
              </div>
              <p className="mt-5 text-[15px] text-ink-3">
                Still stuck? Write to{' '}
                <a href={`mailto:${CONTACT}`} className={LINK}>
                  {CONTACT}
                </a>{' '}
                and we’ll help.
              </p>
            </Section>

            <Section id="next" title="Where to next">
              <div className="grid gap-2 sm:grid-cols-2">
                <Way href="/components" title="Components" line={`All ${ENTRIES.length}, running live. Each page has its command, props and code.`} />
                <Way href="/blocks" title="Blocks" line={`${BLOCKS.length} whole screens built from the components.`} />
                <Way href="/templates" title="Templates" line={`${TEMPLATES.length === 1 ? 'A whole app' : `${TEMPLATES.length} whole apps`} to start from.`} />
                <Way href="/system" title="Design system" line="The type, materials, motion and shape every piece shares." />
              </div>
            </Section>
          </div>

          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-28">
              <p className="text-[13px] text-ink-2">On this page</p>
              <ol className="mt-3 flex flex-col gap-0.5 shadow-[inset_1px_0_0_var(--line)]">
                {TOC.map(([id, name]) => (
                  <li key={id}>
                    <a href={`#${id}`} className="ring-focus block py-1.5 pl-4 text-[13.5px] text-ink-3 transition-colors hover:text-ink">
                      {name}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>
        </div>
      </main>
      <Footer />
    </>
  )
}

function Section({ id, title, line, children }: { id: string; title: string; line?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="mt-20 scroll-mt-28">
      <h2 id={`${id}-h`} className="text-[clamp(24px,2.2vw,30px)] font-normal tracking-[-0.035em] text-ink">
        {title}
      </h2>
      {line && <p className="mt-2 max-w-[600px] text-[15px] leading-[1.6] text-ink-3">{line}</p>}
      <div className="mt-8">{children}</div>
    </section>
  )
}

function Steps({ children }: { children: ReactNode }) {
  return <ol className="grid grid-cols-[minmax(0,1fr)]">{children}</ol>
}

function Step({ n, id, title, line, last = false, children }: { n: number; id?: string; title: string; line: ReactNode; last?: boolean; children?: ReactNode }) {
  return (
    <li id={id} className={`relative min-w-0 scroll-mt-28 pl-12 ${last ? '' : 'pb-10'}`}>
      <span aria-hidden className="tnum absolute left-0 top-0 grid size-7 place-items-center rounded-full bg-surface text-[13px] text-ink shadow-[0_0_0_1px_var(--line-strong)]">
        {n}
      </span>
      {!last && <span aria-hidden className="absolute bottom-1 left-[13.5px] top-9 w-px bg-[var(--line-strong)]" />}
      <h3 className="pt-0.5 text-[16px] font-medium tracking-[-0.01em] text-ink">{title}</h3>
      <p className="mt-1 text-[15px] leading-[1.6] text-ink-3">{line}</p>
      {children && <div className="mt-4">{children}</div>}
    </li>
  )
}

function Way({ href, title, line }: { href: string; title: string; line: string }) {
  return (
    <Link href={href} className="ring-focus group/way flex flex-col rounded-[14px] bg-surface p-4 shadow-[0_0_0_1px_var(--line)] transition-shadow duration-200 hover:shadow-[0_0_0_1px_var(--line-strong),0_8px_24px_-14px_rgb(0_0_0/0.2)]">
      <span className="flex items-center justify-between gap-2 text-[15px] font-medium text-ink">
        {title}
        <ArrowUpRight size={13} className="text-ink-3 transition-transform duration-150 group-hover/way:-translate-y-px group-hover/way:translate-x-px" />
      </span>
      <span className="mt-1 text-[14px] leading-[1.5] text-ink-3">{line}</span>
    </Link>
  )
}

function Fix({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="group/fix bg-surface shadow-[inset_0_-1px_0_var(--line)] last:shadow-none">
      <summary className="ring-focus flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] text-ink [&::-webkit-details-marker]:hidden">
        {q}
        <span aria-hidden className="text-[18px] leading-none text-ink-3 transition-transform duration-200 group-open/fix:rotate-45">
          +
        </span>
      </summary>
      <p className="px-5 pb-5 text-[15px] leading-[1.6] text-ink-3">{children}</p>
    </details>
  )
}
