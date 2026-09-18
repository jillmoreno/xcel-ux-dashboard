/**
 * Links store — create, edit and delete links from the live page.
 *
 * The point of this endpoint is that the Links section needs NO code change to
 * gain a link. There is no committed seed the way `qaNotes.ts` is one for the QA
 * section: every link on the page came through here, so the store is the whole
 * list rather than an override layer over a file.
 *
 * The handler itself — validation, the URL allow-list, id allocation, the
 * ''-not-absent rule for optional fields — lives in `netlify/lib/linkBoard.ts`
 * since 2026-09-18, shared with the Demo board. Read the security note there:
 * every stored `url` becomes an `<a href>`, and the protocol check is what
 * stops "add a link" becoming "run code in every reviewer's browser".
 *
 * On authentication: the Netlify site password is the only control. On the
 * PUBLIC site (which has none) this endpoint is reachable by anyone with the
 * link — the same exposure the Links section has carried since it was made
 * ungated, and accepted for the same reason (it is the place you send someone).
 */
import { ALLOWED_TYPES, linkBoardHandler } from '../lib/linkBoard'

export const config = {
  path: ['/api/links', '/api/links/:id'],
}

export default linkBoardHandler({
  storeName: 'links',
  idPrefix: 'link',
  segment: 'links',
  types: ALLOWED_TYPES,
  publicFlag: false,
})
