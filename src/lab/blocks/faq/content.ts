export type Question = { id: string; topic: string; q: string; a: string }

export const QUESTIONS: Question[] = [
  {
    id: 'does',
    topic: 'Product',
    q: 'What does Detent actually do on its own?',
    a: 'It answers from your help center and past tickets, and it can take the actions you allow, like refunds, replacements or trial extensions. Anything that moves money or changes an account waits for a person to approve it.',
  },
  {
    id: 'setup',
    topic: 'Product',
    q: 'How long does setup take?',
    a: 'Most teams are live in an afternoon. Connect your help desk, point it at your help center, then run it over a day of past tickets to see what it would have said before it talks to anyone.',
  },
  {
    id: 'unsure',
    topic: 'Product',
    q: 'What happens when it doesn’t know?',
    a: 'It says so, and hands the conversation to a person with a summary of what the customer needs and what’s been tried. It never guesses at policy.',
  },
  {
    id: 'languages',
    topic: 'Product',
    q: 'Which languages does it speak?',
    a: 'More than 40. It replies in the language the customer wrote in, in the tone you’ve set, with nothing to set up per language.',
  },
  {
    id: 'conversation',
    topic: 'Pricing',
    q: 'What counts as a conversation?',
    a: 'One customer thread, however many messages it takes. Follow-ups on the same issue within 24 hours are part of the same conversation.',
  },
  {
    id: 'cap',
    topic: 'Pricing',
    q: 'Can I set a spending cap?',
    a: 'Yes. Set a monthly cap and Detent hands everything to your team once it’s reached, so a busy month never surprises you.',
  },
  {
    id: 'free',
    topic: 'Pricing',
    q: 'Is there a free plan?',
    a: 'Starter is free for 500 conversations a month, with everything except custom actions. No card needed.',
  },
  {
    id: 'training',
    topic: 'Security',
    q: 'Do you train on our data?',
    a: 'No. Your tickets and docs are used to answer your customers and nothing else. They’re never used to train models, ours or anyone’s.',
  },
  {
    id: 'where',
    topic: 'Security',
    q: 'Where is our data stored?',
    a: 'In the US or the EU, your choice, encrypted at rest and in transit. Enterprise plans can keep it in a dedicated region.',
  },
  {
    id: 'approvers',
    topic: 'Security',
    q: 'Who can approve actions?',
    a: 'Anyone you give the Approver role. Every approval is logged with who, what and when, and you can require two people for amounts over a limit.',
  },
]
