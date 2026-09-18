/**
 * Demo — the work-in-review inbox, authored on the page (2026-09-18).
 *
 * The second instance of `createLinkBoard`; see `linkStore.ts` for the shape
 * and the reasoning it inherits (no committed seed, re-read after every write,
 * the markdown escape hatch for a store nothing backs up).
 *
 * What is different is what the rows MEAN. A Links row is a destination that
 * lives elsewhere; a Demo row is a designer's branch, built by Netlify at
 * `<branch>--<site>.netlify.app`, put here so the team — and, once its
 * `isPublic` flag is on, stakeholders — can open it and talk about it. When the
 * work is promoted into Prototypes (see `.claude/skills/promote-to-prototype`)
 * the row is retired.
 *
 * `isPublic` is the review gate, and it is only editable on the FULL site: the
 * public build renders `DemoPanel` read-only and filtered to public rows. So
 * the flow is "designer adds → team sees → Jillienne flips → stakeholders see",
 * with no commit anywhere in it.
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
