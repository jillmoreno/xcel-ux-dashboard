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
import { REFINED_COURSE, REFINED_RAIL_LABELS } from '@/data/compassRefinedCopy'
import './compassRefined.css'

/**
 * REFINED'S CHROME — the rail, the page header, the column and the
 * not-ported panel. A frozen fork of the four primitives that lived in
 * `CompassJeffMvpShell.tsx`, 2026-11-10.
 *
 * ⚠ THE HEADER IS WHY THIS EXISTS. Jillienne's first instruction for
 * Refined was about the page head on EVERY page — the course name as an
 * eyebrow above the title, the two pills gone, the access date moved up
 * beside the eyebrow — and nine of his pages render their header through one
 * component. There is no version of "change it on every page" that does not
 * fork this file.
 *
 * ⚠ THE RAIL AND THE PENDING PANEL CAME WITH IT, not because they needed to
 * change but because they live in the same file and Refined's pages must not
 * reach back into his. They are his, verbatim but for the prefix, until
 * somebody refines them.
 *
 * ⚠ THE FIXTURES ARE STILL HIS. `JEFF_MVP_RAIL` and `JEFF_MVP_PAGES` are
 * imported, not copied — the data is shared until Refined decides different
 * words, which is the rule in `compassRefinedPages.ts`.
 */

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

export function CompassRefinedRail({
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
          className="crf-rail__row"
          aria-current={id === page ? 'page' : undefined}
          onClick={() => onSelectPage(id)}
        >
          <Icon size={15} aria-hidden />
          {/* ⚠ HIS ROWS, REFINED'S WORDS — 2026-11-11, "title case everywhere".
              The row list, its order and its grouping are still
              `JEFF_MVP_RAIL`; only the label is looked up, so a row he adds
              appears here and falls back to his spelling until somebody
              decides Refined's. */}
          {REFINED_RAIL_LABELS[id] ?? r.label}
        </button>
      </li>
    )
  }
  return (
    <aside className="crf-rail">
      <nav aria-label="Compass pages">
        <ul className="crf-rail__list">{JEFF_MVP_RAIL.primary.map(row)}</ul>
        {/* ⚠ "Exam prep" IS THE STRING; the capitals are `text-transform`. His
            data says "Exam prep" and his CSS uppercases it — typing the
            capitals here would double-transform nowhere and pass a parity
            check against his `innerText`, which is the exact trap the
            2026-11-05 Readiness parity run fell into. */}
        <p className="crf-rail__group">{JEFF_MVP_RAIL.groupLabel}</p>
        <ul className="crf-rail__list">{JEFF_MVP_RAIL.examPrep.map(row)}</ul>
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
export function CompassRefinedPending({ page }: { page: JeffMvpPage }) {
  /* ⚠ LOOKS IN BOTH LISTS. Since every rail row is ported, the only pages
     that reach this panel are the SUB-pages — a question set, a study
     session, a lesson — which live in their own list by design. */
  const label =
    JEFF_MVP_PAGES.find((p) => p.page === page)?.label ??
    JEFF_MVP_SUBPAGES.find((p) => p.page === page)?.label ??
    page
  return (
    <div className="crf-page">
      <div className="crf-pending" role="region" aria-label={`${label} — not ported yet`}>
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
/**
 * THE PAGE HEADER — eyebrow and title, and nothing else.
 *
 * ⚠ THAT IS A RULE, NOT A SHAPE IT HAPPENS TO HAVE — 2026-11-10, Jillienne:
 * "there should never be copy between the eyebrow and title - or after it.
 * every page should have eyebrow/title, and everything else is separate from
 * that component."
 *
 * It used to take `lead`, `below`, `leadClass` and `aside`, and the pages
 * used all four: a paragraph under the title here, a dismissible intro there,
 * an exam-date chip top right. So "the header" meant something different on
 * every page, and the eyebrow and title — the two things that ARE the same on
 * every page — were buried among the differences. The props are gone rather
 * than deprecated; a page that wants a lead renders one after this component,
 * where it is page content and reads as page content.
 *
 * ⚠ `ruled` STAYS, because the rule belongs to the header: it is the line
 * BETWEEN the header and whatever the page puts next, which is the separation
 * this change is about. Readiness is the page that carries one.
 */
export function CompassRefinedHead({ title, ruled }: { title: string; ruled?: boolean }) {
  return (
    <header className={ruled ? 'crf-head crf-head--ruled' : 'crf-head'}>
      <div style={{ minWidth: 0 }}>
        {/* ⚠ THE COURSE EYEBROW, ON EVERY PAGE — 2026-11-10. It is rendered
            here rather than passed in because it is the same on all of them:
            "this entire platform is about that 1 course". A prop would invite
            a page to leave it out, which is the state this replaced. The
            access date rides beside it, dot-separated. */}
        <p className="crf-head__eyebrow">
          <span>{REFINED_COURSE.name}</span>
          <span className="crf-head__dot" aria-hidden>
            ·
          </span>
          <span className="crf-head__access">{REFINED_COURSE.access}</span>
        </p>
        <h1 className="crf-h1">{title}</h1>
      </div>
    </header>
  )
}

/** His column: a 1100px measure centred inside the page's own padding. Every
 *  page of his uses it, so it lives here rather than in each one. */
export function CompassRefinedColumn({ children }: { children: ReactNode }) {
  return <div className="crf-page__col">{children}</div>
}
