/**
 * Basics that left the catalog on 2026-10-24. shadcn and Radix cover them, so Detent doesn't sell
 * them; the code stays, because blocks and templates are built from it. Its own tiny module, so
 * pricing can tell which Pro components count without loading the catalogue.
 *
 * On 2026-10-29 four general widgets left Pro the same way (kanban, cropper, video, tour).
 *
 * Later that day eight more left: doubles of better pieces (prompt chips, retry, typing bubble),
 * two of the four small charts (goal bars, share grid), and three agent controls that didn't hold
 * up (run button, context ring, model & effort). Diff review followed it out.
 *
 * On 2026-10-30 Detent stopped being AI-only, so eight came back on merit: kanban, cropper, video,
 * tour, bridge, donut, funnel and diff. What stays here is commodity or a double.
 *
 * Later that day chart, trend, carousel and model & effort came back, redesigned.
 */
export const UNLISTED = new Set([
  // 2026-11-02: the owner's cut. Read-along doubled Voice note.
  'tour', 'readalong', 'dock',
  // 2026-11-02: hidden while its shader is redone.
  'dotlight',
  // 2026-10-31, later: the UI audit found these two can't reach the bar.
  'feedback', 'codeblock', 'donut', 'photobar', 'hold', 'kanban', 'answer',
  // 2026-11-01: the owner's cut from the board of 45.
  'scaffold', 'ask', 'images', 'signature', 'video', 'presence', 'checklist', 'secret', 'reveal', 'approval',
  // 2026-10-31: quality over quantity. No idea of their own, or a stronger piece covers them.
  'versions', 'thinking', 'toasts', 'tags', 'rename', 'waitlist', 'files', 'tree', 'composer', 'meter', 'inbox', 'voice', 'undo','buttons', 'tabs', 'select', 'stepper', 'code', 'toaster', 'dialog', 'confirm', 'popover', 'tooltip', 'dropdown', 'context-menu', 'hovercard', 'combobox', 'command', 'sidebar', 'chips', 'retry', 'typing', 'bars', 'waffle', 'run', 'context', 'carousel'])
