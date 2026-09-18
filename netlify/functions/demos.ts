/**
 * Demo store — the work-in-review inbox, authored on the page (2026-09-18).
 *
 * A designer pushes a branch, Netlify gives it a URL, and they add that URL
 * here with a title and a note. Same shape as Links (`netlify/lib/linkBoard.ts`
 * is the handler for both) with two differences:
 *
 * - `isPublic`, a boolean. False by default. The PUBLIC build shows only rows
 *   where it is true; the full site shows every row and carries the toggle. So
 *   a designer adds their work and the team sees it; Jillienne flips it public
 *   when it is ready for stakeholders. That is the whole review gate.
 * - No `type` field. Demo rows are all the same kind of thing.
 *
 * NOT blocked on the public build (`scripts/public-redirects.mjs` leaves
 * `/api/*` alone) — the public site has to be able to READ the store to show
 * the public rows. The public build's Demo panel is read-only, so the write
 * methods here are reached only from the full site in practice; nothing
 * enforces that server-side (there is no auth on any of these endpoints — the
 * Netlify site password is the only control), so a stakeholder who found the
 * endpoint could write to it. Accepted, on the same reasoning as Links.
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
  publicFlag: true,
})
