/**
 * What each free component usually sits next to in a real app: the Pro piece that picks up where
 * it stops. Its page shows that piece running under the docs. Chosen by hand, one by one, by what
 * shares a screen or comes next in the same job.
 */
export const BESIDE: Record<string, string> = {
  scaffold: 'trace', // It builds the project; the waterfall says what it did and where the time went.
  images: 'reveal', // Finding an image, and making one.
  diff: 'approval', // Reading the change, then letting the agent go ahead.
  prompt: 'answer', // What you ask, and what comes back.
  upload: 'extract', // A file comes in, and gets read.
  history: 'activity', // What happened, and which agent needs a person next.
  signature: 'extract', // Check what the AI read in the contract, then sign it.
  presence: 'kanban', // Who's here, on the board everyone's looking at.
  hold: 'rewrite', // Dictate it, then tidy the phrase in place.
  rings: 'chart', // Big numbers up top, the trend under them.
  metric: 'lens', // Why the number moved, and whether that day was really unusual.
  dock: 'flow', // The toolbar over a canvas.
  voicenote: 'answer', // A spoken reply and a written one, in the same thread.
  photobar: 'carousel', // A finished photo, and a run of them.
  checklist: 'tour', // The list says what to do; the tour shows where.
  readalong: 'video', // Read along with a note, or watch with chapters and captions.
  secret: 'region', // Both live on a project's settings page: its keys and where it runs.
  halo: 'carousel', // Light behind a section, and what sits in it.
  slices: 'video', // The headline, and the film under it.
  threads: 'video', // The hero, and the film under it.
}
