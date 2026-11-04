export type Story = {
  id: string
  name: string
  role: string
  company: string
  hue: number
  quote: string
  metric: string
  before: string
  after: string
}

export const STORIES: Story[] = [
  {
    id: 'priya',
    name: 'Priya Shah',
    role: 'Head of Support',
    company: 'Fieldwork',
    hue: 330,
    quote: 'We were drowning in where-is-my-order tickets. Detent now answers {two out of three before anyone on the team has opened their laptop,} and the answers are better than our macros ever were.',
    metric: 'Resolved without a person',
    before: '0%',
    after: '68%',
  },
  {
    id: 'marcus',
    name: 'Marcus Bell',
    role: 'COO',
    company: 'Northwind',
    hue: 210,
    quote: 'The approval step is why we said yes. It refunds, replaces and extends trials, but {nothing that moves money happens without one of us.} Finance signed off in a day.',
    metric: 'First reply',
    before: '6h 40m',
    after: '9s',
  },
  {
    id: 'elena',
    name: 'Elena Sokolova',
    role: 'Support Lead',
    company: 'Tessera',
    hue: 150,
    quote: 'We support customers in eleven languages with a team of six. {Nobody is translating at 2am anymore,} and our satisfaction scores went up, not down.',
    metric: 'Satisfaction',
    before: '4.1',
    after: '4.7',
  },
  {
    id: 'tom',
    name: 'Tom Okafor',
    role: 'Founder',
    company: 'kite',
    hue: 40,
    quote: 'I set it up on a Sunday from our help center. {By Monday it had closed 212 tickets,} and I read every one of them. I’d have sent all but three.',
    metric: 'Closed on day one',
    before: '0',
    after: '212',
  },
]

export type Short = { name: string; role: string; company: string; hue: number; quote: string; result: string }

export const QUOTES: Short[] = [
  { name: 'Hana Ito', role: 'Support Ops', company: 'Orbital', hue: 260, quote: 'Our first reply went from hours to seconds. Customers noticed before we announced it.', result: 'First reply −98%' },
  { name: 'Diego Álvarez', role: 'CX Manager', company: 'Saltbox', hue: 20, quote: 'It hands off with a summary so good my team stopped asking customers to repeat themselves.', result: 'Repeat contacts −41%' },
  { name: 'Ama Owusu', role: 'Brand Lead', company: 'Ferngrove', hue: 120, quote: 'The tone settings are the reason it sounds like us and not like a script.', result: 'Satisfaction 4.8' },
  { name: 'Ben Carter', role: 'VP Support', company: 'Holloway', hue: 230, quote: 'We turned it on for billing first. Two weeks later we turned it on for everything.', result: 'Live in 2 weeks' },
  { name: 'Lina Park', role: 'Support Lead', company: 'Quillstone', hue: 300, quote: 'Every answer shows where it came from, so I trust it the way I’d trust a good new hire.', result: '71% resolved' },
  { name: 'Sam Reyes', role: 'Head of CX', company: 'Marlow & Co', hue: 70, quote: 'Paying per conversation meant we could start small and prove it before asking for budget.', result: '$0 to start' },
]
