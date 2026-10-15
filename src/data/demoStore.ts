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
import { createLinkBoard } from './linkStore'

export const DEMO_BOARD = createLinkBoard({
  base: '/api/demos',
  event: 'cgp.demos',
  lastAuthorKey: 'cgp.links.lastAuthor',
})

export const {
  listLinks: listDemos,
  useLinks: useDemos,
  useLinkCount: useDemoCount,
} = DEMO_BOARD
