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
 * tour, bridge, donut, funnel and diff. What stays here is commodity, a double, or waiting on a redesign.
 */
export const UNLISTED = new Set(['buttons', 'tabs', 'select', 'stepper', 'code', 'toaster', 'dialog', 'confirm', 'popover', 'tooltip', 'dropdown', 'context-menu', 'hovercard', 'combobox', 'command', 'carousel', 'sidebar', 'chips', 'retry', 'typing', 'bars', 'waffle', 'run', 'context', 'models', 'chart', 'trend'])
