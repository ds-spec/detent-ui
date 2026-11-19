/* The prompts people copy into their coding agent. Each one is short and points at a markdown page, so the steps
   live in one place and every agent always reads the current ones. */
import { BLOCKS } from './blocks'
import { entry } from './meta'
import { SITE, isProBlock, isProComponent } from './pro'

export const SETUP_MD = `${SITE}/setup.md`
export const PRO_SETUP_MD = `${SITE}/pro-setup.md`

export const setupPrompt = () =>
  `Set up the Detent component library in this project. Fetch ${SETUP_MD} and follow every step in order. Ask me before anything that needs a decision.`

export const proSetupPrompt = () =>
  `Connect my Detent Pro licence to this project. Fetch ${PRO_SETUP_MD} and follow it. Ask me to paste my key; never print it back, log it or commit it.`

/* One piece, by id: a component or a block */
export function piecePrompt(id: string, forWhat?: string): string | null {
  const e = entry(id)
  const b = e ? null : BLOCKS.find((x) => x.id === id)
  if (!e && !b) return null
  const kind = e ? 'components' : 'blocks'
  const name = (e ?? b)!.name
  const pro = e ? isProComponent(id) : isProBlock(id)
  return [
    `Add Detent's ${name} to this project${forWhat ? ` for ${forWhat}` : ''}.`,
    `Fetch ${SITE}/${kind}/${id}.md and follow its "For agents" steps.`,
    pro ? `It's a Detent Pro piece: if the @detent-pro registry isn't set up here yet, do ${PRO_SETUP_MD} first.` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

type Chosen = { id: string; kind: 'components' | 'blocks'; name: string; pro: boolean; alt?: { id: string; kind: 'components' | 'blocks'; name: string } }


const goalOf = (goal: string) =>
  goal
    .trim()
    .replace(/^(please\s+)?(can you\s+|could you\s+)?(build|make|create|design|code|generate|give|help me build|i want|i need|i'm building|i am building)(\s+(me|us))?\s*:?\s+/i, '')
    .replace(/[.\s]+$/, '')

const FINISH =
  "Fit it into this project's own routes, layout and spacing. Wire it to the project's real data; where there is none yet, put typed sample data in one clearly marked file, never made-up quotes, names or customers. Give it loading, empty and error states that keep the same layout, and check it at a phone width and in dark mode. Then tell me what you built, section by section, and anything you left as a placeholder."

export function planPrompt(goal: string, plan: { id: string; name: string; noun: string }): string {
  return [
    `I'm building: ${goalOf(goal)}. Build the whole ${plan.noun}, finished and working, not just the components. Use the Detent component library for it.`,
    '',
    `If Detent isn't set up in this project yet, fetch ${SETUP_MD} and follow it first.`,
    `I have Detent Pro. If the @detent-pro registry isn't set up here yet, follow ${PRO_SETUP_MD} first (ask me for my key).`,
    '',
    `Then run \`npx shadcn@latest add @detent-pro/plan-${plan.id}\`. It adds .detent/plans/${plan.id}.md, Detent's plan for ${/^[aeiou]/i.test(plan.name) ? 'an' : 'a'} ${plan.name.toLowerCase()}: the sections in order, a layout sketch, which piece goes where, and what to build yourself. Read it, then shape it to what I described: keep the structure, and change the sections, labels and metrics to fit my product.`,
    'Build it section by section. Install each piece the plan names and size it as its page\'s Placement section says. Build the parts the plan leaves to you with this project\'s own components, styled with the Detent theme tokens so the whole thing reads as one product.',
    '',
    FINISH,
  ].join('\n')
}

export function buildPrompt(goal: string, picks: Chosen[], hasPro = false): string {
  const pros = picks.filter((p) => p.pro)
  const line = (p: Chosen) =>
    `- ${p.name}${p.pro ? ` (Pro${!hasPro && p.alt ? `, free fallback: ${p.alt.name} ${SITE}/${p.alt.kind}/${p.alt.id}.md` : ''})` : ''}: ${SITE}/${p.kind}/${p.id}.md`
  const allPro = pros.length === picks.length
  const alts = pros.filter((p) => p.alt).map((p) => p.alt!.name)
  const without = allPro && !alts.length
    ? `- If I don't, don't install ${picks.length === 1 ? 'it' : 'them'} or make up a key. Build what I described with this project's own components instead, and tell me in one line what ${picks.length === 1 ? 'it' : 'the Pro pieces'} would have added (${SITE}/pro).`
    : `- If I don't, don't install the Pro ones or make up a key: ${alts.length ? 'use the free fallback where one is listed, ' : ''}build the rest with the free pieces and this project's own components, and at the end tell me in one line what each skipped piece would have added (its page says what it does).`
  const pro = !pros.length
    ? []
    : hasPro
      ? [`I have Detent Pro. If the @detent-pro registry isn't set up here yet, follow ${PRO_SETUP_MD} first (ask me for my key).`]
      : [`${allPro ? (picks.length === 1 ? 'This is' : 'These are all') : 'Some of these are'} Detent Pro (marked Pro below). Ask me if I have a Detent Pro key.`, `- If I do, follow ${PRO_SETUP_MD} first.`, without]
  return [
    `I'm building: ${goalOf(goal)}. Build what I described, finished and working, using the Detent component library for it.`,
    '',
    `If Detent isn't set up in this project yet, fetch ${SETUP_MD} and follow it first.`,
    ...pro,
    '',
    'These Detent pieces fit it. Fetch each page and follow its "For agents" steps:',
    ...picks.map(line),
    '',
    hasPro
      ? `If what I described is a page, a flow or an app, build all of it: run \`npx shadcn@latest add @detent-pro/plans\` and follow .detent/plans/guide.md for the layout and the parts these pieces don't cover.`
      : "Place each one as its page's Placement section says, inside this project's own layout.",
    '',
    FINISH,
  ]
    .join('\n')
    .trim()
}

export function openPrompt(goal: string, hasPro = false): string {
  return [
    `I'm building: ${goalOf(goal)}. Build what I described, finished and working, using the Detent component library where it fits.`,
    '',
    `If Detent isn't set up in this project yet, fetch ${SETUP_MD} and follow it first.`,
    hasPro
      ? `I have Detent Pro. Run \`npx shadcn@latest add @detent-pro/plans\` and read .detent/plans/guide.md: it lists Detent's page plans and how to build a whole page. If one plan is close to what I described, install it and follow it, shaped to my product. If none is, plan the sections yourself and pick pieces from ${SITE}/agents.md. Tell me the sections and pieces you chose in a few lines, then build it.`
      : `Then read ${SITE}/agents.md and pick the free Detent pieces that fit what I'm building. Tell me which ones you chose and why before adding them.`,
    hasPro
      ? `If the @detent-pro registry isn't set up here yet, follow ${PRO_SETUP_MD} first (ask me for my key).`
      : `If any that fit are Detent Pro, ask me if I have a key. If I don't, use free pieces only, and tell me in one line what the Pro ones would have added (${SITE}/pro).`,
    'Add each piece by fetching its page and following its "For agents" steps.',
    '',
    FINISH,
  ].join('\n')
}

export function partsPrompt(goal: string, plan: { name: string }, free: Chosen[], pro: Chosen[]): string {
  return [
    `I'm building: ${goalOf(goal)}. Add these free Detent components to it. Fetch each page and follow its "For agents" steps:`,
    ...free.map((p) => `- ${p.name}: ${SITE}/${p.kind}/${p.id}.md`),
    '',
    `If Detent isn't set up in this project yet, fetch ${SETUP_MD} and follow it first.`,
    "Place each one as its page's Placement section says, inside this project's own layout. Wire them to the project's real data; where there is none yet, use clearly marked placeholders.",
    `Then tell me what you added, and in one line that Detent Pro builds the whole ${plan.name.toLowerCase()} from a plan${pro.length ? `, with ${pro.map((p) => p.name).join(', ')}` : ''} (${SITE}/pro).`,
  ].join('\n')
}
