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
import {
  JEFF_MVP_PAGES,
  JEFF_MVP_RAIL,
  JEFF_MVP_SUBPAGES,
  type JeffMvpPage,
} from '@/data/compassJeffMvpFixtures'
import { CompassJeffMvpReadiness } from './CompassJeffMvpReadiness'
import { CompassReadinessRefined } from './CompassReadinessRefined'
import { CompassJeffMvpLearn } from './CompassJeffMvpLearn'
import { CompassJeffMvpOverview } from './CompassJeffMvpOverview'
import { CompassJeffMvpPractice } from './CompassJeffMvpPractice'
import { CompassJeffMvpPrep } from './CompassJeffMvpPrep'
import { CompassJeffMvpPlanner } from './CompassJeffMvpPlanner'
import { CompassJeffMvpFlashcards } from './CompassJeffMvpFlashcards'
import { CompassJeffMvpSimulator } from './CompassJeffMvpSimulator'
import { CompassJeffMvpFlashcardTopic } from './CompassJeffMvpFlashcardTopic'
import { CompassJeffMvpExamSession } from './CompassJeffMvpExamSession'
import { CompassJeffMvpQuestionSet } from './CompassJeffMvpQuestionSet'
import { CompassJeffMvpCardStudy } from './CompassJeffMvpCardStudy'
import { CompassJeffCourse } from './CompassJeffCourse'
import './compassJeffMvp.css'

/**
 * JEFF'S COMPASS MVP — the shell, 2026-11-09, from
 * `public/prototypes/xcel-compass-mvp.html`.
 *
 * Thirteen pages behind one rail, arriving one at a time — the rest drawn as
 * rows that say what they are waiting for rather than as rows that are not
 * there.
 *
 * ⚠ NO PER-PAGE VERSION BADGE. There was one for four pages (2026-11-09, from
 * "with a tag that shows its jeffs version"); Jillienne had it removed the
 * same day, looking at it on screen. What says whose version is on screen is
 * the Design bar — it names the surface "Compass · Jeff's MVP" and its
 * Compass version control reads "Jeff's MVP" — which is where every other
 * version in this app is declared. A badge in the page content was the port
 * answering a question the chrome already answers, and it sat in every
 * screenshot.
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
  readiness = 'jeff',
}: {
  page: JeffMvpPage
  onSelectPage: (p: JeffMvpPage) => void
  /** WHICH READINESS PAGE THE RAIL ROW OPENS — 2026-11-09. `jeff` is his, as
   *  ported; `refined` is `CompassReadinessRefined`, his page rebuilt against
   *  the research. The third Compass version IS this prop: same rail, same
   *  other pages, one row different. A second shell for one swapped page
   *  would have meant two rails to keep in step. */
  readiness?: 'jeff' | 'refined'
}) {
  /* ⚠ THE SIMULATED EXAM TAKES THE WHOLE SURFACE, RAIL INCLUDED. Every other
     page of his MVP renders beside the Compass rail; this one must not. It is
     imitating a Pearson VUE test centre, and a Compass sidebar down the left
     breaks that on the first screen — which is the one thing the simulator
     exists to get right. Same decision `CompassWorkspace` records for
     Anjani's session takeover. */
  /* ⚠ HIS LESSON IS ALREADY PORTED — and from the same designer's earlier
     file, so this reuses it rather than building a second copy.
     `CompassJeffCourse` came from `compass-prototype-b-v3.html` on
     2026-11-05; measured against his MVP's `Course.dc.html` on 2026-11-09,
     81 of its 82 lines render identically. The single difference is the
     literal string "Demo settings": his MVP opens that dialog from the page,
     and the v3 port turned those three settings into Design-bar flags, which
     is what `/port-prototype` prescribes for a prototype's own control bar.
     So the control exists, on the bar, and the page is the same page.

     Porting it again would mean two components for one lesson from one
     designer, drifting apart the first time either is touched. It is a
     takeover like the simulated exam, so it renders without the rail. */
  if (page === 'course') {
    return (
      <div className="cjm cjm-shell">
        <CompassJeffCourse onExit={() => onSelectPage('learn')} />
      </div>
    )
  }

  if (page === 'exam-session') {
    return (
      <div className="cjm cjm-shell">
        <CompassJeffMvpExamSession onSelectPage={onSelectPage} />
      </div>
    )
  }

  return (
    <div className="cjm cjm-shell">
      <CompassJeffMvpRail page={page} onSelectPage={onSelectPage} />
      {page === 'readiness' ? (
        readiness === 'refined' ? (
          <CompassReadinessRefined onSelectPage={onSelectPage} />
        ) : (
          <CompassJeffMvpReadiness onSelectPage={onSelectPage} />
        )
      ) : page === 'learn' ? (
        <CompassJeffMvpLearn onSelectPage={onSelectPage} />
      ) : page === 'overview' ? (
        <CompassJeffMvpOverview onSelectPage={onSelectPage} />
      ) : page === 'practice' ? (
        <CompassJeffMvpPractice onSelectPage={onSelectPage} />
      ) : page === 'prep-review' ? (
        <CompassJeffMvpPrep />
      ) : page === 'study-planner' ? (
        <CompassJeffMvpPlanner />
      ) : page === 'flashcards' ? (
        <CompassJeffMvpFlashcards onSelectPage={onSelectPage} />
      ) : page === 'exam-simulator' ? (
        <CompassJeffMvpSimulator onSelectPage={onSelectPage} />
      ) : page === 'flashcard-topic' ? (
        <CompassJeffMvpFlashcardTopic onSelectPage={onSelectPage} />
      ) : page === 'practice-session' ? (
        <CompassJeffMvpQuestionSet onSelectPage={onSelectPage} />
      ) : page === 'flashcard-study' ? (
        <CompassJeffMvpCardStudy onSelectPage={onSelectPage} />
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
/* Keyed by RAIL page only — the sub-pages have no rail row, by construction. */
const RAIL_ICONS: Record<(typeof JEFF_MVP_PAGES)[number]['page'], typeof HouseRegular> = {
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
    const id = r.page as (typeof JEFF_MVP_PAGES)[number]['page']
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
  /* ⚠ LOOKS IN BOTH LISTS. Since every rail row is ported, the only pages
     that reach this panel are the SUB-pages — a question set, a study
     session, a lesson — which live in their own list by design. */
  const label =
    JEFF_MVP_PAGES.find((p) => p.page === page)?.label ??
    JEFF_MVP_SUBPAGES.find((p) => p.page === page)?.label ??
    page
  return (
    <div className="cjm-page">
      <div className="cjm-pending" role="region" aria-label={`${label} — not ported yet`}>
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
