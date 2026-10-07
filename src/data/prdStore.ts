/**
 * PRDs — the section's links, authored on the page (2026-10-07).
 *
 * The fourth instance of `createLinkBoard`; see `linkStore.ts` for the shape
 * and the reasoning it inherits, and `researchStore.ts` for its twin — this
 * is that file with a different endpoint, event and name. A PRDs row is a
 * product requirements document, the brief a design answers; Research holds
 * the evidence, Resources everything else.
 *
 * Shares `cgp.links.lastAuthor` with the other boards on purpose — it is a
 * fact about the person at this keyboard, not about the board.
 */
import { createLinkBoard } from './linkStore'

export const PRD_BOARD = createLinkBoard({
  base: '/api/prds',
  event: 'cgp.prds',
  lastAuthorKey: 'cgp.links.lastAuthor',
})

export const {
  listLinks: listPrds,
  useLinks: usePrds,
  useLinkCount: usePrdCount,
} = PRD_BOARD
