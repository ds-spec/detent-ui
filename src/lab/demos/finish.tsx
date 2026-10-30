'use client'

import { Checklist } from '../components/checklist/Checklist'
import type { ChecklistStep } from '../components/checklist/Checklist'
import { HaloBands } from '../components/halo/HaloBands'
import { PhotoBar } from '../components/photobar/PhotoBar'
import { ReadAlong } from '../components/readalong/ReadAlong'
import { SecretField } from '../components/secret/SecretField'
import { GRAIN } from '../lib/grain'

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Soft printed light for a piece to sit on. */
function Light({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex size-full min-h-[560px] items-center lg:min-w-[620px] justify-center overflow-hidden p-5" style={{ background: 'radial-gradient(70% 80% at 15% 10%, #ffc08f, transparent 62%), radial-gradient(70% 90% at 90% 20%, #a9c6ff, transparent 62%), radial-gradient(80% 80% at 60% 100%, #f4a0c3, transparent 62%), #efe4d6' }}>
      <span aria-hidden className="absolute inset-0 opacity-[0.28] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
      <div className="relative w-full [&>*]:mx-auto">{children}</div>
    </div>
  )
}

export function PhotoBarDemo() {
  return <PhotoBar src="/media/search/aerial-shore.jpg" alt="Waves meeting a pale beach, from the air" className="size-full min-h-[560px] !rounded-none lg:min-w-[860px]" />
}

const Pill = ({ children }: { children: React.ReactNode }) => <span className="inline-flex h-7 max-w-full items-center gap-1.5 truncate rounded-[8px] bg-white/70 px-2 font-mono text-[11.5px]">{children}</span>
const Face = ({ who, tone }: { who: string; tone: string }) => <span className="-ml-0.5 grid size-7 place-items-center rounded-full text-[10px] font-medium text-white shadow-[0_0_0_2px_rgb(255_255_255/0.8)] first:ml-0" style={{ background: tone }}>{who}</span>

const STEPS: ChecklistStep[] = [
  { id: 'domain', title: 'Point your domain', takes: '3 min', line: 'One record, and acme.co opens on your own address.', action: 'Check record', preview: <Pill>CNAME app</Pill> },
  {
    id: 'team',
    title: 'Bring your team',
    takes: '1 min',
    line: 'Three people are ready to go. They’ll get an email.',
    action: 'Send invites',
    onAction: () => wait(900),
    preview: (
      <span className="flex items-center">
        <Face who="MK" tone="#7c5cff" />
        <Face who="TR" tone="#e0568f" />
        <Face who="JL" tone="#2f8fdf" />
      </span>
    ),
  },
  { id: 'money', title: 'Turn on payments', takes: '2 min', line: 'Payouts land in this account every Monday.', action: 'Link account', onAction: () => wait(900), preview: <Pill>Business ···· 4821</Pill> },
  {
    id: 'live',
    title: 'Open the doors',
    line: 'Nothing goes out until you press this.',
    action: 'Go live',
    onAction: () => wait(900),
    preview: (
      <Pill>
        <span className="size-1.5 rounded-full bg-[#0f9d76]" /> acme.co
      </Pill>
    ),
  },
]

export function ChecklistDemo() {
  return (
    <Light>
      <Checklist steps={STEPS} done={['domain']} finishedLine="acme.co is open." />
    </Light>
  )
}

const NOTE = [
  { at: 0, text: 'Quick one on the pricing page before the review.' },
  { at: 24, text: 'The annual toggle is the first thing people miss.' },
  { at: 51, text: 'Moving it above the plans lifted clicks by a fifth.' },
  { at: 83, text: 'I’d keep the three cards and lose the comparison table.' },
  { at: 112, text: 'Let’s ship it Thursday if nobody objects.' },
]

export function ReadAlongDemo() {
  return (
    <div className="flex size-full min-h-[560px] items-center justify-center bg-cover lg:min-w-[620px] bg-center p-5" style={{ backgroundImage: 'url(/media/search/dunes.jpg)' }}>
      <ReadAlong lines={NOTE} length={137} start={31} from="Priya, on the pricing page" />
    </div>
  )
}

export function SecretDemo() {
  return (
    <Light>
      <div className="w-[432px] max-w-full rounded-[26px] bg-surface p-6 shadow-[0_0_0_1px_var(--line),0_34px_64px_-30px_rgb(50_20_60/0.45)]">
        <SecretField name="Production" scope="Full access" value="dtnt_pf02Q7ziuVe4SOovKX7AVYDbn6jc" used="Last used 2 hours ago from Vercel" copiedLabel="Copied. Paste it into .env.local" />
        <div className="my-4 h-px bg-[var(--line)]" />
        <SecretField name="CI" scope="Install only" value="dtnt_Xa91mRtLw3qZk8YhJc2VbNf0d7Pe" used="Last used on Oct 27 from GitHub Actions" copiedLabel="Copied. Paste it into .env.local" />
      </div>
    </Light>
  )
}

export function HaloDemo() {
  return (
    <HaloBands className="size-full min-h-[560px] !rounded-none lg:min-w-[860px]">
      <div className="flex h-full min-h-[560px] flex-col items-center justify-center px-6 text-center">
        <h2 className="text-[clamp(38px,5vw,60px)] font-normal leading-[1.03] tracking-[-0.05em] text-ink">
          Things that
          <span className="block text-ink-3">click into place.</span>
        </h2>
        <p className="mt-4 text-body text-ink-3">Move through the glass. Press to change the light.</p>
        <button type="button" className="ring-focus mt-7 h-11 rounded-full bg-ink px-6 text-callout font-medium text-surface transition-transform duration-150 active:scale-[0.96]">
          Get started
        </button>
      </div>
    </HaloBands>
  )
}
