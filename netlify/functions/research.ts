/**
 * Research store — the Research section's links, authored on the page (2026-10-07).
 *
 * The THIRD instance of `linkBoardHandler` (`netlify/lib/linkBoard.ts`), after
 * Links (2026-09-10) and Demo (2026-09-18). Same shape as Links in every
 * respect — title · url · note · addedBy · type · date, no `isPublic`, no
 * `product` — because it answers the same request: a link can be attached
 * without a code change. What differs is only what the rows MEAN: a Links row
 * is "everything that lives elsewhere"; a Research row is a study, a finding, a
 * rationale doc, a survey — the evidence behind a decision.
 *
 * Before this the section was an authored empty state ("No decisions log yet")
 * waiting for a generated decisions-log build that XCEL never
 * grew. A board the team fills in the browser is the honest replacement.
 *
 * The section is UNGATED, like Other Links, so this endpoint is reachable on the
 * PUBLIC site too — a stakeholder can read the research behind a decision, and
 * `scripts/public-redirects.mjs` leaves `/api/*` alone for exactly that reason.
 * Same exposure, same reasoning, same (absent) auth as Links: the Netlify site
 * password is the only control.
 */
import { ALLOWED_TYPES, linkBoardHandler } from '../lib/linkBoard'

export const config = {
  path: ['/api/research', '/api/research/:id'],
}

export default linkBoardHandler({
  storeName: 'research',
  // `research-001`. The prefix EQUALS the path segment here, which is the case
  // `linkBoard.ts`'s tail pattern had to become non-greedy for — see the note
  // beside `tailPattern`.
  idPrefix: 'research',
  segment: 'research',
  types: ALLOWED_TYPES,
  publicFlag: false,
  products: false,
})
