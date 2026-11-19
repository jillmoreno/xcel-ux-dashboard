/* eslint-disable react-refresh/only-export-components -- a render table, not a
   component module: two private wrappers and one exported map of cells. */
import type { ReactNode } from 'react'
import {
  JeffReadinessFootnote,
  JeffReadinessHead,
  JeffReadinessNext,
  JeffReadinessRing,
  JeffReadinessTopics,
  JeffReadinessTrend,
} from '@/components/learning/CompassJeffMvpReadiness'
import {
  RefinedReadinessFootnote,
  RefinedReadinessHead,
  RefinedReadinessHero,
  RefinedReadinessNext,
  RefinedReadinessTopics,
  RefinedReadinessTrend,
  type RefinedHeroStyle,
} from '@/components/learning/CompassReadinessRefined'
import { JEFF_MVP_READINESS } from '@/data/compassJeffMvpFixtures'
import { REFINED_READINESS, topicsWeakestFirst } from '@/data/compassReadinessRefinedFixtures'

/**
 * THE RENDER TABLE for `/compare/compass-readiness` — one cell per
 * (widget, version), drawn by the real block components exported from the
 * two Readiness pages. The deck's metadata is in `src/data/compareDecks.ts`;
 * this file is the JSX it deliberately keeps out of the data layer.
 *
 * Each cell is wrapped the way its page wraps it — `.cjm > .cjm-page` for V1,
 * `.cre-rdr` for Refined — so the block's own stylesheet applies unchanged.
 * The compare page zeroes the page padding on those wrappers; it changes
 * nothing else about how a block is drawn.
 *
 * `choices` is the current value of every control in the deck, by key.
 */
export type Choices = Record<string, string>

type Cell = (choices: Choices) => ReactNode

const V1 = ({ children }: { children: ReactNode }) => (
  <div className="cjm">
    <div className="cjm-page cmp-cell">{children}</div>
  </div>
)
const RF = ({ children }: { children: ReactNode }) => (
  <div className="cre-rdr cmp-cell">
    <div className="cre-rdr-col">{children}</div>
  </div>
)

function rowsFor(choice: string | undefined, names: string[], pageDefault: Record<string, boolean>) {
  if (choice === 'all-open') return Object.fromEntries(names.map((n) => [n, true]))
  if (choice === 'all-closed') return Object.fromEntries(names.map((n) => [n, false]))
  return pageDefault
}

const V1_ROWS = JEFF_MVP_READINESS.rows.map((r) => r.name)
const V1_DEFAULT_ROWS = Object.fromEntries(JEFF_MVP_READINESS.rows.map((r) => [r.name, r.expanded]))
const RF_ROWS = topicsWeakestFirst(REFINED_READINESS).map((t) => t.name)
const RF_DEFAULT_ROWS = { [RF_ROWS[0]]: true }

/** A `key` that changes with the control, so a block that seeds state from a
 *  prop re-mounts when the control moves. */
const k = (c: Choices) => `${c.levels ?? ''}|${c.rows ?? ''}`

export const COMPASS_READINESS_CELLS: Record<string, Record<string, Cell>> = {
  head: {
    v1: () => (
      <V1>
        <JeffReadinessHead />
      </V1>
    ),
    refined: () => (
      <RF>
        <RefinedReadinessHead />
      </RF>
    ),
  },
  hero: {
    /* V1 has no hero of its own: the ring sits inside the Do this next card.
       Shown here on its own, in the card's frame, so the two graphics meet. */
    v1: () => (
      <V1>
        <section className="cjm-next">
          <div className="cjm-next__body">
            <JeffReadinessRing />
          </div>
        </section>
      </V1>
    ),
    refined: (c) => (
      <RF>
        <RefinedReadinessHero hero={(c.hero as RefinedHeroStyle) ?? 'rings'} />
      </RF>
    ),
  },
  next: {
    v1: () => (
      <V1>
        <JeffReadinessNext ring={false} />
      </V1>
    ),
    refined: () => (
      <RF>
        <RefinedReadinessNext />
      </RF>
    ),
  },
  trend: {
    v1: () => (
      <V1>
        <JeffReadinessTrend />
      </V1>
    ),
    refined: () => (
      <RF>
        <RefinedReadinessTrend />
      </RF>
    ),
  },
  topics: {
    v1: (c) => (
      <V1>
        <JeffReadinessTopics
          key={k(c)}
          footnote={false}
          initialHelp={c.levels === 'open'}
          initialOpen={rowsFor(c.rows, V1_ROWS, V1_DEFAULT_ROWS)}
        />
      </V1>
    ),
    refined: (c) => (
      <RF>
        <RefinedReadinessTopics
          key={k(c)}
          footnote={false}
          initialLevelsOpen={c.levels === 'open'}
          initialOpen={rowsFor(c.rows, RF_ROWS, RF_DEFAULT_ROWS)}
        />
      </RF>
    ),
  },
  footnote: {
    v1: () => (
      <V1>
        <section className="cjm-topics">
          <JeffReadinessFootnote />
        </section>
      </V1>
    ),
    refined: () => (
      <RF>
        <section className="cre-rdr-topics">
          <RefinedReadinessFootnote />
        </section>
      </RF>
    ),
  },
}
