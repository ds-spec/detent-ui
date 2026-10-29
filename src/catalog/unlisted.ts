/**
 * Basics that left the catalog on 2026-10-24. shadcn and Radix cover them, so Detent doesn't sell
 * them; the code stays, because blocks and templates are built from it. Its own tiny module, so
 * pricing can tell which Pro components count without loading the catalogue.
 *
 * On 2026-10-29 four general widgets left Pro the same way (kanban, cropper, video, tour): good, but
 * not AI, and available elsewhere. Their places go to AI components for designers.
 *
 * Later that day eight more left: doubles of better pieces (prompt chips, retry, typing bubble),
 * two of the four small charts (goal bars, share grid), and three agent controls that didn't hold
 * up (run button, context ring, model & effort). Diff review followed it out.
 */
export const UNLISTED = new Set(['buttons', 'tabs', 'select', 'stepper', 'code', 'toaster', 'dialog', 'confirm', 'popover', 'tooltip', 'dropdown', 'context-menu', 'hovercard', 'combobox', 'command', 'carousel', 'sidebar', 'kanban', 'cropper', 'video', 'tour', 'chips', 'retry', 'typing', 'bars', 'waffle', 'run', 'context', 'models', 'diff', 'chart', 'trend', 'funnel', 'bridge', 'donut'])
