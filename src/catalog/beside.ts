/**
 * What each free component usually sits next to in a real app: the Pro piece that picks up where
 * it stops. Its page shows that piece running under the docs. Chosen by hand, one by one, by what
 * shares a screen or comes next in the same job.
 */
export const BESIDE: Record<string, string> = {
  diff: 'trace', // Reading the change, and the run that made it.
  prompt: 'trace', // What you ask, and the run that answers it.
  upload: 'extract', // A file comes in, and gets read.
  rings: 'bridge', // Big numbers up top, and what moved them.
  metric: 'lens', // Why the number moved, and whether that day was really unusual.
  voicenote: 'trace', // A spoken update, and the run behind it.
  halo: 'threads', // Light behind a section, and the hero that sits in it.
  rewrite: 'extract', // What the AI changed in the text, and what it read from a file, both for a person to check.
  chart: 'forecast', // The month behind you, and the cash ahead.
  trend: 'askchart', // A range you can trust, and a question to ask of it.
  carousel: 'region', // A run of places, and the wheel that picks one.
}
