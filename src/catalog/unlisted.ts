/**
 * Basics that left the catalog on 2026-10-24. shadcn and Radix cover them, so Detent doesn't sell
 * them; the code stays, because blocks and templates are built from it. Its own tiny module, so
 * pricing can tell which Pro components count without loading the catalogue.
 */
export const UNLISTED = new Set(['buttons', 'tabs', 'select', 'stepper', 'code', 'toaster', 'dialog', 'confirm', 'popover', 'tooltip', 'dropdown', 'context-menu', 'hovercard', 'combobox', 'command', 'carousel', 'sidebar'])
