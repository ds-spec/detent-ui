import { SITE } from '@/catalog/site'
import type { Step } from '@/catalog/template-start'
import { StartStep } from '@/site/templates/TemplateViewer'

const STEPS: Step[] = [
  {
    title: 'Add the registry',
    line: 'Tell the shadcn CLI where Detent Pro lives and how to sign in to it. It goes beside what shadcn already wrote there.',
    file: 'components.json',
    code: `{
  "registries": {
    "@detent-pro": {
      "url": "${SITE}/r/pro/{name}.json",
      "headers": {
        "Authorization": "Bearer \${DETENT_PRO_KEY}"
      }
    }
  }
}`,
  },
  {
    title: 'Add your key',
    line: 'Sign in at /account with the email you bought with and generate a key. Keep it out of git: put it in .env.local here, and give CI and your host the same variable.',
    file: '.env.local',
    code: 'DETENT_PRO_KEY=dtnt_your-key\n',
  },
  {
    title: 'Install anything',
    line: 'Components and blocks by name, and with Pro + Templates the template too, as template-detent. The source lands in your project, yours to change.',
    code: 'npx shadcn add @detent-pro/glyph',
  },
  {
    title: 'Respect reduced motion',
    line: 'Wrap your app in this once, around everything in your root layout. For anyone who asks their device for less motion, things stop moving and fades stay.',
    file: 'app/layout.tsx',
    code: `import { MotionConfig } from 'motion/react'

<MotionConfig reducedMotion="user">{children}</MotionConfig>`,
  },
]

const NO: [string, string][] = [
  ['Needs your key', 'The key isn’t reaching it. Check .env.local has DETENT_PRO_KEY, and that the header in components.json reads it.'],
  ['That key isn’t one of ours', 'It may have been removed. Generate a new one in your account.'],
  ['No Pro purchase on this email yet', 'Sign in with the address on your receipt. Bought with another one? Write to us and we’ll move it.'],
  ['Comes with Pro + Templates', 'Templates are in Pro + Templates. Upgrading keeps your key.'],
  ['Couldn’t check your key just now', 'Try again in a minute.'],
]

export function Install() {
  return (
    <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div>
        <ol>
          {STEPS.map((step, i) => (
            <StartStep key={step.title} n={i + 1} step={step} />
          ))}
        </ol>
      </div>
      <div className="lg:pt-6">
        <p className="text-headline text-ink">If it says no</p>
        <dl className="mt-4">
          {NO.map(([said, fix]) => (
            <div key={said} className="py-4 shadow-[inset_0_1px_0_var(--line)]">
              <dt className="text-callout text-ink">“{said}”</dt>
              <dd className="mt-1 text-callout leading-[1.6] text-ink-3">{fix}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
