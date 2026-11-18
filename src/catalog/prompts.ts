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

/* One prompt for a whole idea: set Detent up if needed, then add each chosen piece by its own steps. Without Pro,
   the agent asks, skips the Pro pieces for their free fallbacks, and says what Pro would have added. */
type Chosen = { id: string; kind: 'components' | 'blocks'; name: string; pro: boolean; alt?: { id: string; kind: 'components' | 'blocks'; name: string } }

export function buildPrompt(goal: string, picks: Chosen[], hasPro = false): string {
  const pros = picks.filter((p) => p.pro)
  const line = (p: Chosen) =>
    `- ${p.name}${p.pro ? ` (Pro${!hasPro && p.alt ? `, free fallback: ${p.alt.name} ${SITE}/${p.alt.kind}/${p.alt.id}.md` : ''})` : ''}: ${SITE}/${p.kind}/${p.id}.md`
  const allPro = pros.length === picks.length
  const alts = pros.filter((p) => p.alt).map((p) => p.alt!.name)
  /* Without a key, the agent only builds what it can build well: the free pieces, and the named fallbacks */
  const without = allPro
    ? alts.length
      ? `- If I don't, don't install the Pro ones or make up a key: add only the free fallbacks listed (${alts.join(', ')}), and tell me in one line what the Pro pieces would have added (their pages say what they do).`
      : `- If I don't, stop before changing anything: don't install them, make up a key or build something else in their place. Tell me this needs Detent Pro (${SITE}/pro).`
    : `- If I don't, don't install the Pro ones or make up a key: ${alts.length ? 'use the free fallback where one is listed, ' : ''}build the rest with the free pieces, and at the end tell me in one line what each skipped piece would have added (its page says what it does).`
  const pro = !pros.length
    ? []
    : hasPro
      ? [`I have Detent Pro. If the @detent-pro registry isn't set up here yet, follow ${PRO_SETUP_MD} first (ask me for my key).`]
      : [`${allPro ? (picks.length === 1 ? 'This is' : 'These are all') : 'Some of these are'} Detent Pro (marked Pro below). Ask me if I have a Detent Pro key.`, `- If I do, follow ${PRO_SETUP_MD} first.`, without]
  return [
    `I'm building: ${goal.trim().replace(/[.\s]+$/, '')}. Use the Detent component library for it.`,
    '',
    /* when everything needs Pro and there is no key, ask before touching the project */
    ...(allPro && !hasPro ? [...pro, `Once that's settled, if Detent isn't set up in this project yet, fetch ${SETUP_MD} and follow it.`] : [`If Detent isn't set up in this project yet, fetch ${SETUP_MD} and follow it first.`, ...pro]),
    '',
    'Then add these, fetching each page and following its "For agents" steps:',
    ...picks.map(line),
    '',
    "Size and place each one as its page's Placement section says, inside this project's own layout and spacing, and check it at a phone width too. Wire them to this project's real data; where there is none yet, use clearly marked placeholders, never made-up quotes or numbers. Tell me what you built.",
  ]
    .join('\n')
    .trim()
}

/* When the words match no piece by name, the agent picks: it reads the index and asks before anything Pro */
export function openPrompt(goal: string, hasPro = false): string {
  return [
    `I'm building: ${goal.trim().replace(/[.\s]+$/, '')}. Use the Detent component library where it fits.`,
    '',
    `If Detent isn't set up in this project yet, fetch ${SETUP_MD} and follow it first.`,
    `Then read ${SITE}/agents.md and pick the Detent pieces that fit what I'm building. Tell me which ones you chose and why before adding them.`,
    hasPro
      ? `I have Detent Pro. If the @detent-pro registry isn't set up here yet, follow ${PRO_SETUP_MD} first (ask me for my key).`
      : `If any you pick are Detent Pro, ask me if I have a key. If I don't, use free pieces only and tell me in one line what the Pro ones would have added (${SITE}/pro).`,
    'Add each by fetching its page and following its "For agents" steps, wire it to this project\'s real data, and tell me what you built.',
  ].join('\n')
}
