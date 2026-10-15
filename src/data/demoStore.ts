/**
 * Demo — the work-in-review inbox, authored on the page (2026-09-18).
 *
 * The second instance of `createLinkBoard`; see `linkStore.ts` for the shape
 * and the reasoning it inherits (no committed seed, re-read after every write,
 * the markdown escape hatch for a store nothing backs up).
 *
 * What is different is what the rows MEAN. A Links row is a destination that
 * lives elsewhere; a Demo row is a designer's branch, built by Netlify at
 * `<branch>--<site>.netlify.app`, put here so everyone with the Hub link —
 * the team and the stakeholders alike, since 2026-10-15 — can open it and
 * talk about it. When the work is promoted into Prototypes (see
 * `.claude/skills/promote-to-prototype`) the row is retired.
 *
 * Until 2026-10-15 a row also carried `isPublic`, the review gate: the public
 * site showed only the rows flipped on. That site is retired and the flag
 * with it — "designer adds → everyone sees", with no commit and no flip.
 *
 * Shares `cgp.links.lastAuthor` with Links on purpose — it is a fact about the
 * person at this keyboard, and they are the same person on both boards.
 */
import { createLinkBoard, isLive } from './linkStore'

export const DEMO_BOARD = createLinkBoard({
  base: '/api/demos',
  event: 'cgp.demos',
  lastAuthorKey: 'cgp.links.lastAuthor',
})

export const { listLinks: listDemos, useLinks: useDemos } = DEMO_BOARD

/** The nav badge counts LIVE rows only (2026-10-15): an archived row is hidden
 *  from the board, so a badge that counted it would read 5 over a list of 4 —
 *  the same "a badge over a list it does not match reads as a load failure"
 *  rule the public build's count followed. */
export const useDemoCount = (): number => DEMO_BOARD.useLinkCount(isLive)
