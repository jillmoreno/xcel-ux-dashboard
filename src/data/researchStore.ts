/**
 * Research — the section's links, authored on the page (2026-10-07).
 *
 * The third instance of `createLinkBoard`; see `linkStore.ts` for the shape and
 * the reasoning it inherits (no committed seed, re-read after every write, the
 * markdown escape hatch for a store nothing backs up), and `demoStore.ts` for
 * the second instance.
 *
 * Shaped like LINKS rather than like Demo: it keeps the `type` taxonomy (a
 * brief, a design, a prototype, a reference — the kinds of thing a study points
 * at) and has no `isPublic` gate, because the Research section is ungated and
 * every row on it is already something a stakeholder may read.
 *
 * Shares `cgp.links.lastAuthor` with the other two boards on purpose — it is a
 * fact about the person at this keyboard, not about the board.
 */
import { createLinkBoard } from './linkStore'

export const RESEARCH_BOARD = createLinkBoard({
  base: '/api/research',
  event: 'cgp.research',
  lastAuthorKey: 'cgp.links.lastAuthor',
})

export const {
  listLinks: listResearch,
  useLinks: useResearch,
  useLinkCount: useResearchCount,
} = RESEARCH_BOARD
