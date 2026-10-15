/**
 * Demo store — Refinement, the work-in-review inbox, authored on the page
 * (2026-09-18).
 *
 * A designer pushes a branch, Netlify gives it a URL, and they add that URL
 * here with a title and a note. Same shape as Links (`netlify/lib/linkBoard.ts`
 * is the handler for both) with three differences:
 *
 * - `product` — which product the row is about (Atlas · Compass · Both).
 * - `archivedAt` / `archivedBy` (2026-10-15) — a row can be ARCHIVED: hidden
 *   from the board and listed under "Show archive", reversible, stamped
 *   server-side. Remove still deletes.
 * - No `type` field. Demo rows are all the same kind of thing.
 *
 * `isPublic` was the fourth until 2026-10-15, when the public site it gated
 * was retired; the handler drops it on the way in now. There is no auth on
 * any of these endpoints — the Netlify site password is the only control —
 * so anyone with the site could write to it. Accepted, on the same reasoning
 * as Links.
 */
import { linkBoardHandler } from '../lib/linkBoard'

export const config = {
  path: ['/api/demos', '/api/demos/:id'],
}

export default linkBoardHandler({
  storeName: 'demos',
  idPrefix: 'demo',
  segment: 'demos',
  types: null,
  products: true,
  archivable: true,
})
