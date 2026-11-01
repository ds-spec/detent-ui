/**
 * What each free component usually sits next to in a real app: the Pro piece that picks up where
 * it stops. Its page shows that piece running under the docs. Chosen by hand, one by one, by what
 * shares a screen or comes next in the same job.
 */
export const BESIDE: Record<string, string> = {
  diff: 'activity', // Reading the change, and what each agent is doing next.
  prompt: 'activity', // What you ask, and the agents working on it.
  upload: 'extract', // A file comes in, and gets read.
  history: 'activity', // What happened, and which agent needs a person next.
  rings: 'bridge', // Big numbers up top, and what moved them.
  metric: 'lens', // Why the number moved, and whether that day was really unusual.
  dock: 'flow', // The toolbar over a canvas.
  voicenote: 'activity', // A spoken update, from one of the agents at work.
  readalong: 'print', // A note read aloud, and the word that opens the page.
  halo: 'threads', // Light behind a section, and the hero that sits in it.
  slices: 'print', // Two ways to open a page.
  rewrite: 'extract', // What the AI changed in the text, and what it read from a file, both for a person to check.
  models: 'usage', // Choosing the model, and how much of the month it leaves.
  chart: 'forecast', // The month behind you, and the cash ahead.
  trend: 'askchart', // A range you can trust, and a question to ask of it.
  carousel: 'region', // A run of places, and the wheel that picks one.
}
