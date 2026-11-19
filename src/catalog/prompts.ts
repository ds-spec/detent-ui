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

const PRO_GOAL = (what: string) =>
  `Build the whole ${what} in this project, finished and working, at the quality of Detent's own demos: every section in place, Detent components doing the heavy lifting, and everything else styled to match them. Go beyond the basics. It should look like a product someone paid for, not a starter template.`

const PRO_SETUP = [
  `If Detent isn't set up in this project yet, follow ${SETUP_MD}.`,
  `If the @detent-pro registry isn't connected yet, follow ${PRO_SETUP_MD} (ask me for my key).`,
]

const PRODUCT = [
  '<my_product>',
  "Shape it to what I described: keep the structure, and change sections, labels, metrics and sample data to fit my product. If this repo already has an app, fit into its routes, layout and data. If my product isn't clear from my words or the repo, make a sensible choice and tell me what you assumed.",
  '</my_product>',
]

const REPORT = "When you're done, tell me what you built section by section, which Detent pieces are on the page, what is still sample data or a placeholder, and paste the output of the checks you ran."

export function planPrompt(goal: string, plan: { id: string; name: string; noun: string }): string {
  return [
    `I'm building: ${goalOf(goal)}. I have Detent Pro.`,
    '',
    '<goal>',
    PRO_GOAL(plan.noun),
    '</goal>',
    '',
    '<steps>',
    `1. ${PRO_SETUP.join(' ')}`,
    `2. Run \`npx shadcn@latest add @detent-pro/plan-${plan.id}\`. It adds .detent/plans/${plan.id}.md, Detent's plan for ${/^[aeiou]/i.test(plan.name) ? 'an' : 'a'} ${plan.name.toLowerCase()}. Read it in full before writing code: it is the spec for the layout, the Detent piece in each section, the Detent look, the sample data and the checks for done.`,
    '3. Write down the sections you will build, shaped to my product, in a few lines. Then build them in order, installing each Detent piece the plan names.',
    "4. Run the checks in the plan's “Before you say it's done” section and fix whatever fails.",
    '</steps>',
    '',
    ...PRODUCT,
    '',
    REPORT,
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
    : [`${allPro ? (picks.length === 1 ? 'This is' : 'These are all') : 'Some of these are'} Detent Pro (marked Pro below). Ask me if I have a Detent Pro key.`, `- If I do, follow ${PRO_SETUP_MD} first.`, without]
  if (hasPro)
    return [
      `I'm building: ${goalOf(goal)}. I have Detent Pro.`,
      '',
      '<goal>',
      PRO_GOAL('thing'),
      '</goal>',
      '',
      '<steps>',
      `1. ${PRO_SETUP.join(' ')}`,
      "2. Run `npx shadcn@latest add @detent-pro/plans` and read .detent/plans/guide.md in full. If one of its page plans is close to what I described, install that plan too and follow it. If none is, plan the sections the way the guide says.",
      `3. These Detent pieces fit what I described, so use them, plus any others from ${SITE}/agents.md that fit a section. Install each by fetching its page and following its "For agents" and Placement sections:`,
      ...picks.map((p) => `   ${line(p)}`),
      '4. Write down the sections you will build, in a few lines, then build them in order.',
      "5. Run the checks in the guide's “Before you say it's done” section and fix whatever fails.",
      '</steps>',
      '',
      ...PRODUCT,
      '',
      REPORT,
    ].join('\n')
  return [
    `I'm building: ${goalOf(goal)}. Build what I described, finished and working, using the Detent component library for it.`,
    '',
    `If Detent isn't set up in this project yet, fetch ${SETUP_MD} and follow it first.`,
    ...pro,
    '',
    'These Detent pieces fit it. Fetch each page and follow its "For agents" steps:',
    ...picks.map(line),
    '',
    "Place each one as its page's Placement section says, inside this project's own layout.",
    '',
    FINISH,
  ]
    .join('\n')
    .trim()
}

export function openPrompt(goal: string, hasPro = false): string {
  if (hasPro)
    return [
      `I'm building: ${goalOf(goal)}. I have Detent Pro.`,
      '',
      '<goal>',
      PRO_GOAL('thing'),
      '</goal>',
      '',
      '<steps>',
      `1. ${PRO_SETUP.join(' ')}`,
      `2. Run \`npx shadcn@latest add @detent-pro/plans\` and read .detent/plans/guide.md in full. If one of its page plans is close to what I described, install that plan too and follow it. If none is, plan the sections the way the guide says and pick the Detent pieces for them from ${SITE}/agents.md.`,
      '3. Write down the sections and the Detent piece for each, in a few lines, then build them in order, installing each piece by fetching its page and following its "For agents" and Placement sections.',
      "4. Run the checks in the guide's “Before you say it's done” section and fix whatever fails.",
      '</steps>',
      '',
      ...PRODUCT,
      '',
      REPORT,
    ].join('\n')
  return [
    `I'm building: ${goalOf(goal)}. Build what I described, finished and working, using the Detent component library where it fits.`,
    '',
    `If Detent isn't set up in this project yet, fetch ${SETUP_MD} and follow it first.`,
    `Then read ${SITE}/agents.md and pick the free Detent pieces that fit what I'm building. Tell me which ones you chose and why before adding them.`,
    `If any that fit are Detent Pro, ask me if I have a key. If I don't, use free pieces only, and tell me in one line what the Pro ones would have added (${SITE}/pro).`,
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
