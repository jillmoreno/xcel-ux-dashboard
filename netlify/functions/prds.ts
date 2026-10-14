/**
 * PRDs store — the PRDs section's links, authored on the page (2026-10-07).
 *
 * The FOURTH instance of `linkBoardHandler` (`netlify/lib/linkBoard.ts`),
 * after Links, Demo and Research — and Research's twin: Links' shape exactly
 * (title · url · note · addedBy · type · date, no `isPublic`, no `product`),
 * under its own store. A PRDs row is a product requirements document — the
 * brief a design answers — which is a different kind of thing from the
 * evidence Research holds and the catch-all Other Links is, and keeping the
 * three apart is the whole reason this is a section rather than a Type.
 *
 * Ungated like its siblings, so this endpoint is reachable on the PUBLIC site
 * too — `scripts/public-redirects.mjs` leaves `/api/*` alone. Same exposure,
 * same reasoning, same (absent) auth as Links: the Netlify site password is
 * the only control.
 */
import { ALLOWED_TYPES, linkBoardHandler } from '../lib/linkBoard'

export const config = {
  path: ['/api/prds', '/api/prds/:id'],
}

export default linkBoardHandler({
  storeName: 'prds',
  idPrefix: 'prd',
  segment: 'prds',
  types: ALLOWED_TYPES,
  publicFlag: false,
  products: false,
})
