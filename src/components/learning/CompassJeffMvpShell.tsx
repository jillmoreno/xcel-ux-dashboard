import type { ReactNode } from 'react'
import {
  BallotCheckRegular,
  BookOpenRegular,
  CalendarRegular,
  ClipboardList,
  Gauge,
  HouseRegular,
  Library,
  Notebook,
} from '@/icons'
import { JEFF_MVP_PAGES, JEFF_MVP_RAIL, type JeffMvpPage } from '@/data/compassJeffMvpFixtures'
import { CompassJeffMvpReadiness } from './CompassJeffMvpReadiness'
import { CompassJeffMvpLearn } from './CompassJeffMvpLearn'
import { CompassJeffMvpOverview } from './CompassJeffMvpOverview'
import { CompassJeffMvpPractice } from './CompassJeffMvpPractice'
import './compassJeffMvp.css'

/**
 * JEFF'S COMPASS MVP — the shell, 2026-11-09, from
 * `public/prototypes/xcel-compass-mvp.html`.
 *
 * Thirteen pages behind one rail. Jillienne's ask: "this needs to get
 * populated into my repo. page by page. with a tag that shows its jeffs
 * version." So this is the rail and the tag, and the pages arrive one at a
 * time underneath it — Readiness first, the rest drawn as rows that say what
 * they are waiting for rather than as rows that are not there.
 *
 * ⚠ A SEPARATE SHELL, NOT A FLAG THROUGH `CompassLearningPage`. His rail is a
 * different object: three learning rows, an EXAM PREP rule, and five more
 * BELOW it that NAVIGATE — where Anjani's locks hers behind a gate dialog.
 * Threading that through `CompassRail` would mean her next rail change moves
 * his page, which is the collision the project's own fork rule exists to
 * prevent (`CourseContentV2` is the worked example, `CompassRail`'s own
 * header comment is the precedent).
 *
 * ⚠ NO LOCKUP IN THE RAIL, and that is the 2026-10-15 decision applied, not a
 * loss. His standalone file has no product header, so its rail carries the
 * XCEL logo and "COMPASS"; in the shell the global header already shows the
 * logo, and Anjani's rail had the same duplicate removed on the direct ask.
 * His collapse toggle goes with it — there is nothing above the rows left to
 * collapse away from.
 *
 * ⚠ ROW ORDER IS HIS AND IS AN ARGUMENT. Study planner is the third LEARNING
 * row, above the rule, not one of the five exam-prep rows below it: planning
 * is part of learning, and what sits under EXAM PREP is what you do once the
 * course is behind you. Readiness is last of the five, as the thing the other
 * four feed.
 */
export function CompassJeffMvpShell({
  page,
  onSelectPage,
}: {
  page: JeffMvpPage
  onSelectPage: (p: JeffMvpPage) => void
}) {
  return (
    <div className="cjm cjm-shell">
      <CompassJeffMvpRail page={page} onSelectPage={onSelectPage} />
      {page === 'readiness' ? (
        <CompassJeffMvpReadiness onSelectPage={onSelectPage} />
      ) : page === 'learn' ? (
        <CompassJeffMvpLearn />
      ) : page === 'overview' ? (
        <CompassJeffMvpOverview onSelectPage={onSelectPage} />
      ) : page === 'practice' ? (
        <CompassJeffMvpPractice onSelectPage={onSelectPage} />
      ) : (
        <CompassJeffMvpPending page={page} />
      )}
    </div>
  )
}

/**
 * HIS ICONS, AGAINST THIS REGISTRY.
 *
 * ⚠ THREE ARE EXACT and three follow precedent; two are substitutions and say
 * so. Inventing an SVG to match a glyph is a registry decision, not a port's
 * — the same call `compassPages.ts` recorded for her bookmark.
 *
 *   Overview       house outline      → `HouseRegular`     exact
 *   Learn          open book          → `BookOpenRegular`  exact
 *   Study planner  calendar           → `CalendarRegular`  exact
 *   Flashcards     two offset cards   → `Notebook`         precedent: `COMPASS_PAGES`
 *   Exam Simulator clipboard + check  → `ClipboardList`    precedent: `COMPASS_PAGES`
 *   Readiness      gauge              → `Gauge`            precedent: `COMPASS_PAGES`
 *   Prep Review    book + check       → `BallotCheckRegular` ⚠ SUBSTITUTION. No
 *     book-with-check here, and `BookOpenRegular` is Learn's. A checked list is
 *     the nearest reading of "review what you got wrong".
 *   Practice       a stack of layers  → `Library`          ⚠ SUBSTITUTION. The
 *     registry ships no layers glyph. Library — a bank of sets — is the nearest
 *     meaning, and Practice IS a bank of sets in his design.
 */
const RAIL_ICONS: Record<JeffMvpPage, typeof HouseRegular> = {
  overview: HouseRegular,
  learn: BookOpenRegular,
  'study-planner': CalendarRegular,
  'prep-review': BallotCheckRegular,
  practice: Library,
  flashcards: Notebook,
  'exam-simulator': ClipboardList,
  readiness: Gauge,
}

export function CompassJeffMvpRail({
  page,
  onSelectPage,
}: {
  page: JeffMvpPage
  onSelectPage: (p: JeffMvpPage) => void
}) {
  const row = (r: { page: string; label: string }) => {
    const id = r.page as JeffMvpPage
    const Icon = RAIL_ICONS[id]
    return (
      <li key={id}>
        <button
          type="button"
          className="cjm-rail__row"
          aria-current={id === page ? 'page' : undefined}
          onClick={() => onSelectPage(id)}
        >
          <Icon size={15} aria-hidden />
          {r.label}
        </button>
      </li>
    )
  }
  return (
    <aside className="cjm-rail">
      <nav aria-label="Compass pages">
        <ul className="cjm-rail__list">{JEFF_MVP_RAIL.primary.map(row)}</ul>
        {/* ⚠ "Exam prep" IS THE STRING; the capitals are `text-transform`. His
            data says "Exam prep" and his CSS uppercases it — typing the
            capitals here would double-transform nowhere and pass a parity
            check against his `innerText`, which is the exact trap the
            2026-11-05 Readiness parity run fell into. */}
        <p className="cjm-rail__group">{JEFF_MVP_RAIL.groupLabel}</p>
        <ul className="cjm-rail__list">{JEFF_MVP_RAIL.examPrep.map(row)}</ul>
      </nav>
    </aside>
  )
}

/**
 * THE TAG — "with a tag that shows its jeffs version".
 *
 * ⚠ IT SAYS WHOSE AND WHAT, not just whose. A reviewer three pages in needs to
 * know this is Jeff's MVP rather than Jeff's course player, which is a
 * different file behind a different control on a different surface.
 *
 * ⚠ IT IS NOT A CONTROL. The Design bar's dropdown is how you leave; a tag
 * that looked clickable would invite a reviewer to try to dismiss the one
 * thing on screen telling them what they are looking at.
 */
export function CompassJeffMvpTag() {
  return (
    <p className="cjm-tag" data-testid="jeff-mvp-tag">
      Jeff’s version · Compass MVP
    </p>
  )
}

/**
 * A ROW HIS RAIL REACHES THAT THIS PORT HAS NOT BUILT YET.
 *
 * ⚠ IT DOES NOT FALL BACK TO THE PRODUCT'S OWN PAGE, for the reason
 * `CompassContentPending` gives: a silent fallback renders the shipped page
 * under Jeff's name, the reviewer believes it is his, and nothing on screen
 * corrects them. Naming what is missing is the honest state of the work.
 *
 * ⚠ IT KEEPS THE RAIL, so the one click out is the rail itself. An empty
 * state that also removes the navigation is a dead end.
 */
export function CompassJeffMvpPending({ page }: { page: JeffMvpPage }) {
  const label = JEFF_MVP_PAGES.find((p) => p.page === page)?.label ?? page
  return (
    <div className="cjm-page">
      <div className="cjm-pending" role="region" aria-label={`${label} — not ported yet`}>
        <CompassJeffMvpTag />
        <h1>{label}</h1>
        <p>
          This page is in Jeff’s prototype and is not in the React port yet. It is being ported page
          by page; Readiness is the one that is built.
        </p>
        <p>
          To see this page as he drew it, open <strong>Explorations</strong> on the Hub and pick
          Compass MVP — his own Pages menu is bottom left.
        </p>
      </div>
    </div>
  )
}

/**
 * The heading block every ported page shares: the tag, the title, the lead,
 * and whatever the page puts top right.
 *
 * ⚠ `ruled` AND `leadClass` ARE PER-PAGE, not decoration. His Readiness header
 * carries a 1px ink rule and a 680px lead at 1.55; his Learn header carries no
 * rule and a 600px lead at 1.5. Measured on both — see the stylesheet.
 */
export function CompassJeffMvpHead({
  title,
  lead,
  aside,
  ruled,
  leadClass,
  below,
}: {
  title: string
  /** Omitted on the Overview, which carries a course line and a meta row
   *  instead of a paragraph. */
  lead?: string
  aside?: ReactNode
  ruled?: boolean
  leadClass?: string
  /** What the Overview puts under its title in place of a lead. */
  below?: ReactNode
}) {
  return (
    <header className={ruled ? 'cjm-head cjm-head--ruled' : 'cjm-head'}>
      <div style={{ minWidth: 0 }}>
        <CompassJeffMvpTag />
        <h1 className="cjm-h1 cjm-serif">{title}</h1>
        {lead ? <p className={leadClass ? `cjm-lead ${leadClass}` : 'cjm-lead'}>{lead}</p> : null}
        {below}
      </div>
      {aside}
    </header>
  )
}

/** His column: a 1100px measure centred inside the page's own padding. Every
 *  page of his uses it, so it lives here rather than in each one. */
export function CompassJeffMvpColumn({ children }: { children: ReactNode }) {
  return <div className="cjm-page__col">{children}</div>
}
