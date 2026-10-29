/**
 * Basics that left the catalog on 2026-10-24. shadcn and Radix cover them, so Detent doesn't sell
 * them; the code stays, because blocks and templates are built from it. Its own tiny module, so
 * pricing can tell which Pro components count without loading the catalogue.
 *
 * On 2026-10-29 four general widgets left Pro the same way (kanban, cropper, video, tour): good, but
 * not AI, and available elsewhere. Their places go to AI components for designers.
 */
export const UNLISTED = new Set(['buttons', 'tabs', 'select', 'stepper', 'code', 'toaster', 'dialog', 'confirm', 'popover', 'tooltip', 'dropdown', 'context-menu', 'hovercard', 'combobox', 'command', 'carousel', 'sidebar', 'kanban', 'cropper', 'video', 'tour'])
