import { useState, type ComponentType, type CSSProperties } from 'react'
import {
  ArrowLeft,
  BookFull,
  ClipboardList,
  Gauge,
  Layout,
  Notebook,
  RubiLogo,
  ShoePrints,
  ArrowRight,
  CalendarDay,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Check,
  FileText,
  House,
  MagnifyingGlass,
  Sliders,
  X,
} from '@/icons'
import {
  NY_LH_COURSE_CHAPTERS,
  NY_LH_CURRENT_CHAPTER_INDEX,
  NY_LH_LESSON_MINUTES_INVENTED,
  NY_LH_LESSON_TITLES_INVENTED,
} from '@/data/nyProducerRequirements'
import { readExamDate } from '@/data/examDateStore'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatExamChip } from './compassPlayerUtil'

/**
 * COMPASS COURSE PLAYER — Figma `Atlas-Compass-Global-Navigation`, node 49:2903.
 *
 * What a learner lands in after "Start course" / "Resume" on the Jump Back In
 * card. It replaces the lo-fi placeholder that has stood in the launcher since
 * 2026-09-17 ("this is where Compass Course content will live"), and it is
 * behind `course-launcher-style` so the two can be compared — see that flag's
 * own note.
 *
 * A FULL-WINDOW TAKEOVER, which is the load-bearing structural decision and
 * the direct answer to a question asked before building. The design draws its
 * OWN 260px left sidebar — breadcrumb, course title, table of contents — in
 * the space the dashboard rail occupies, so the two cannot both be on screen.
 * `PlatformShell` therefore renders this INSTEAD of the rail + content column
 * rather than inside it, keeping only the global header above (which the design
 * also draws, unchanged: logo, cart, notifications, avatar).
 *
 * STATIC, deliberately and by instruction. Everything here renders its real
 * state and nothing is wired except Close — no chapter navigation, no working
 * Notes, search, settings or Rubi thread. The centre stays a "Course Content"
 * placeholder because that is what the Figma itself draws: the player's chrome
 * is the subject of this design, not the courseware inside it.
 *
 * EVERY FIGURE IS REAL, which is the other answer to a question asked first.
 * The mock says "Florida Life & Health", a Florida chapter list and
 * "August 14, 2026 · 8 Days Out". None of that is here. The title, the
 * percentage and the table of contents come from the NY fixtures the rest of
 * the product reads, and the date chip reads the exam date the learner entered
 * on Schedule State Exam — so the player agrees with the dashboard behind it
 * rather than stating a second, prettier set of facts.
 *
 * ONE HONEST GAP, recorded rather than filled. The design's contents tree has
 * TWO levels — sections ("Insurance Basics") containing chapters, a Knowledge
 * Check and a Recap. `NY_LH_COURSE_CHAPTERS` is ELEVEN FLAT CHAPTERS; nothing
 * in this repo knows which chapters group into which section, and the study
 * guide the list came from does not publish it. So the chapters render as the
 * tree's top level and the child level is absent — the states (done · now ·
 * up next) are all real, and no section names were invented to produce a
 * hierarchy the fixtures cannot support. When a real outline arrives, the
 * child row is `TocChildItem` below, already built and already styled.
 */
/**
 * THE PLAYER'S OWN PAGES — 2026-09-23, the direct ask: "make this section have
 * pages like the Home screen ui. Options are Overview, Course, Flashcards, Exam
 * Simulator, Progress, Resources, Readiness, Rubi Insights."
 *
 * A course-scoped rail, sitting where the dashboard's own rail would be if the
 * player were not a takeover. Only COURSE is built; the other seven render the
 * bare ground, which is the same shell Overview got an hour earlier and for the
 * same reason — these are pages being designed, not courseware standing in for
 * something we do not have.
 *
 * ICONS: three are the DASHBOARD RAIL'S OWN — Readiness is `Gauge`, Resources
 * is `FileText`, Rubi Insights is `RubiLogo` — because those three sections
 * exist out there too and a learner who has seen them in the rail should not
 * have to learn a second glyph for the same thing. The other five are chosen
 * from the registry and are the softest part of this: `ShoePrints` for Progress
 * in particular is the repo's journey glyph rather than an obvious "progress"
 * mark. Swapping any of them is one line.
 */
export type CompassPage =
  | 'overview'
  | 'course'
  | 'flashcards'
  | 'exam-simulator'
  | 'progress'
  | 'resources'
  | 'readiness'
  | 'rubi-insights'

const COMPASS_PAGES: {
  id: CompassPage
  label: string
  icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
}[] = [
  { id: 'overview', label: 'Overview', icon: Layout },
  { id: 'course', label: 'Course', icon: BookFull },
  { id: 'flashcards', label: 'Flashcards', icon: Notebook },
  { id: 'exam-simulator', label: 'Exam Simulator', icon: ClipboardList },
  { id: 'progress', label: 'Progress', icon: ShoePrints },
  { id: 'resources', label: 'Resources', icon: FileText },
  { id: 'readiness', label: 'Readiness', icon: Gauge },
  { id: 'rubi-insights', label: 'Rubi Insights', icon: RubiLogo },
]

export function CompassCoursePlayer({
  courseTitle,
  percentComplete,
  completedLessons,
  totalLessons,
  onClose,
  closeLabel,
}: {
  courseTitle: string
  percentComplete: number
  /** The card's "26 of 42 lessons", both halves. See `CompassContents`. */
  completedLessons: number
  totalLessons: number
  onClose: () => void
  /** Names what Close returns to, for the screen-reader label only — the
   *  design gives the control no visible text. */
  closeLabel: string
}) {
  /*
   * WHICH VIEW THE PLAYER IS SHOWING — 2026-09-23, the direct ask: "When user
   * clicks there, keep this left nav for now. and everything on the right will
   * be the background color."
   *
   * Overview is a THIRD state rather than a fourth exit. The breadcrumb's two
   * crumbs both closed the player until now, which was right while there was
   * nothing behind them; Overview is a page of this course, so it keeps the
   * contents nav and replaces only the right-hand side. Home still leaves.
   *
   * Local state, not a route: the launcher has no URL of its own (it overlays
   * a section), so a `?view=` would be a parameter on the page underneath.
   */
  const [page, setPage] = useState<CompassPage>('course')

  const currentChapter =
    NY_LH_COURSE_CHAPTERS[NY_LH_CURRENT_CHAPTER_INDEX] ?? NY_LH_COURSE_CHAPTERS[0]

  return (
    <div style={playerStyle}>
      <CompassSidebar
        courseTitle={courseTitle}
        percentComplete={percentComplete}
        completedLessons={completedLessons}
        totalLessons={totalLessons}
        onLeave={onClose}
        page={page}
        onSelectPage={setPage}
      />
      <div style={rightOfSidebarStyle}>
        {/* OVERVIEW IS A BLANK GROUND for now, by instruction — the nav stays,
            the toolbar and the reading column and Rubi all go, and what is left
            is the page colour waiting for content. Deliberately not a lo-fi
            placeholder with a caption: the lo-fi block says "something is
            coming here", and this is a page being designed rather than one
            standing in for courseware we do not have. */}
        {page !== 'course' ? (
          <div
            style={overviewGroundStyle}
            role="region"
            aria-label={`${COMPASS_PAGES.find((p) => p.id === page)?.label ?? ''} page`}
          />
        ) : (
          <>
        <CompassTopBar
          chapterTitle={currentChapter}
          onClose={onClose}
          closeLabel={closeLabel}
        />
        <div style={playerBodyStyle}>
          <div style={readingColumnStyle}>
            <main style={readingMainStyle}>
              {/* THE PLACEHOLDER IS THE DESIGN, not a stand-in for it. The
                  Figma draws this same empty card and caption — the courseware
                  is Compass's, served into this frame, and neither the mock nor
                  this repo has it. Drawing a fake lesson here would be the one
                  thing the surrounding chrome is honest about avoiding. */}
              <div style={contentCardStyle}>
                <p style={contentCaptionStyle}>Course Content</p>
                <div aria-hidden style={contentBlockStyle} />
              </div>
            </main>
            <footer style={readingFooterStyle}>
              {/* Disabled-looking at 40% opacity, as drawn: chapter one of the
                  current section has nothing before it. Not a `disabled`
                  button — nothing here is wired, and a real disabled state
                  would claim the rest is not. */}
              <span style={prevButtonStyle}>
                <ArrowLeft size={16} aria-hidden />
                Previous
              </span>
              {/* "Next", not the Figma's "Next: Reading" — 2026-09-22, the
                  direct ask. The mock's suffix names the TYPE of the next item
                  (a reading, a knowledge check, a recap), which this cannot
                  know: the contents tree is eleven flat chapters and the centre
                  is a placeholder, so there is nothing here that knows what
                  comes next is a reading. The bare verb is the honest half, and
                  the suffix comes back with the outline that would populate
                  it — same gap `TocChildItem` is waiting on. */}
              <span style={nextButtonStyle}>
                Next
                <ArrowRight size={16} aria-hidden />
              </span>
            </footer>
          </div>
          <RubiAside />
        </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── the 260px sidebar ────────────────────────────────────────────────── */

function CompassSidebar({
  courseTitle,
  percentComplete,
  completedLessons,
  totalLessons,
  onLeave,
  page,
  onSelectPage,
}: {
  courseTitle: string
  percentComplete: number
  completedLessons: number
  totalLessons: number
  /** Home is the only crumb that LEAVES the player. */
  onLeave: () => void
  page: CompassPage
  onSelectPage: (page: CompassPage) => void
}) {
  const activeLabel = COMPASS_PAGES.find((p) => p.id === page)?.label ?? ''
  /*
   * WHICH HALF OF THE SIDEBAR IS SHOWING, and the reason it is a named
   * constant rather than an inline `page !== 'course'` at each of the two call
   * sites: `aria-current` has to follow it. Exactly one element may claim to
   * be the current page, and WHICH element that is changes with the mode — the
   * rail row when the rail is up, the trailing crumb when it is not. Two
   * separate conditions would have drifted into the "both" and "neither" bugs,
   * and this player has already shipped the "both" one once.
   */
  const railShown = page !== 'course'
  return (
    <aside style={sidebarStyle} aria-label="Course contents">
      {/*
        BREADCRUMB — the two crumbs are REAL, as of 2026-09-22, and wear the
        house link-CTA (`cre-link-action cre-cta-ink`): the direct ask, pointed
        at "Customize Study Plan" on Home.

        THEY WERE STATIC, and the note here argued that rendering them as
        anchors "would offer two exits and honour one". The ask settles the
        other half of that trade: dressing them as the house CTA and leaving
        them inert is the worse end of it — a control that looks pressable and
        is not is what gets reported as broken, which is the rule the rest of
        this player's chrome follows by NOT looking pressable. So they got the
        style and the behaviour together.

        THEY NOW GO TO DIFFERENT PLACES, which is the half this note used to
        record as unresolvable: "Home" leaves the player for the dashboard,
        "Overview" selects the player's own Overview page. That second
        destination did not exist when the crumbs were first wired — the note
        said so and named this the call site if one ever appeared. It has.

        NO INLINE `color`. `.cre-cta-ink` carries it and re-points on the dark
        theme; an inline colour would beat the stylesheet, which is the trap
        that class's own note in `tokens.css` records.

        The LAST crumb stays a plain span — it is the page you are on, and a
        breadcrumb's last crumb is not a link.
      */}
      <p style={breadcrumbStyle}>
        {/* "Home" BESIDE THE GLYPH, and the `aria-label` went with it. With a
            visible word the label has to match it (WCAG 2.5.3, Label in Name);
            "Back to the dashboard" beside the word "Home" is exactly the
            mismatch that rule exists for, so the visible text is the accessible
            name now. It also fixes the 13x13 hit area the UX scan flagged —
            the control is a word plus a glyph rather than a 13px icon. */}
        <button
          type="button"
          onClick={onLeave}
          className="cre-link-action cre-cta-ink"
          style={crumbButtonStyle}
        >
          <House size={13} aria-hidden />
          Home
        </button>
        <span aria-hidden style={crumbSlashStyle}>
          /
        </span>
        {/* OVERVIEW IS AN ANCESTOR, NOT A SIBLING — restored 2026-09-23 on the
            direct correction, "breadcrumbs should be Home, Overview, Course."

            The build in between dropped it, and the reasoning recorded here was
            wrong about the SHAPE rather than about breadcrumbs: it read the
            page rail as the trail's source, so eight sibling pages meant one
            crumb for wherever you were. But the eight rows all hang off the
            course's Overview — it is the course's own front door, one level
            under Home — so the trail is Home → Overview → wherever, and only
            the LAST crumb moves as the rail does.

            On Overview itself the third crumb would just repeat the second, so
            Overview becomes the here-crumb and the trail is two long.

            `aria-current` ON THE HERE-CRUMB ONLY WHEN THE RAIL IS DOWN — see
            `railShown`. For one build the trail and the active rail row BOTH
            carried it, two elements claiming to be the current page, which is
            worse than neither; the fix then was to strip it from the trail and
            let the rail own it. That held until the rail stopped rendering on
            the Course page, at which point stripping it left NOBODY marking the
            current page. It moves with the mode now: rail row when there is a
            rail, trailing crumb when there is not. Always exactly one. */}
        {page === 'overview' ? (
          <span style={crumbHereStyle}>Overview</span>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onSelectPage('overview')}
              className="cre-link-action cre-cta-ink"
              style={crumbButtonStyle}
            >
              Overview
            </button>
            <span aria-hidden style={crumbSlashStyle}>
              /
            </span>
            <span style={crumbHereStyle} aria-current={railShown ? undefined : 'page'}>
              {activeLabel}
            </span>
          </>
        )}
      </p>

      <div style={sidebarHeadStyle}>
        <h1 style={sidebarTitleStyle}>{courseTitle}</h1>
        {/*
          THE HOME PAGE'S TREATMENT — 2026-09-23, the direct ask: "change the
          progress in the nav to better match the style used in the Home page."

          It was a grey pill reading "62% Complete". Home states the same fact
          as the SHARED `ProgressBar` with the percentage printed beside it, and
          this is now the only progress readout in the player (the top bar's was
          removed in the same pass), so it is the one that has to be right.

          THE SHARED COMPONENT, NOT A LOOKALIKE, which is the rule that
          component was extracted for: Readiness once drew its own 3px bar in a
          different green and one learner's 32% became two different bars a rail
          item apart. The percentage is printed beside it because `ProgressBar`
          deliberately carries no label of its own.

          NO `track` OVERRIDE, unlike Home's call. The default
          `--color-neutral-100` measures 1.08:1 on the shell's page grey, which
          is why the band passes a darker groove — this sidebar is
          `--color-surface-card`, the white the default was designed for.
        */}
        <div style={progressRowStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <ProgressBar pct={percentComplete} height={8} fill="var(--color-primary-500)" />
          </div>
          <span style={progressPctStyle}>{percentComplete}%</span>
        </div>
      </div>

      {/*
        THE SIDEBAR HAS TWO MODES AND SHOWS ONE AT A TIME — 2026-09-23, the
        direct ask on the page rail: "this doesn't show in the Course (only for
        overview)."

        For one build it stacked BOTH: eight page rows, then the eyebrow, then
        42 lessons behind two expanders. That read as one long list with a rule
        through it, and it asked the Course page — the one place the learner is
        actually working — to carry the navigation for seven pages they are not
        on.

        So the modes swap. On COURSE the sidebar is the table of contents,
        because "where am I in the coursework" is the only question that view is
        asking. EVERYWHERE ELSE it is the page rail.

        WHICH MEANS THE BREADCRUMB IS NOW LOAD-BEARING RATHER THAN DECORATIVE: with the
        rail gone, the Overview crumb restored above it is the ONLY way out of
        the Course view that does not leave the player entirely. The two changes
        landed an hour apart and the second is what makes this one safe.

        THE RAIL SURVIVES ON THE OTHER SIX PAGES, not on Overview alone. Taken
        literally the ask would strand a learner on Flashcards with no route to
        Readiness except back through Overview; "not in the Course" is the part
        that is about a real collision, and this is the smallest change that
        honours it. One condition to flip if Overview-only is what you meant.
      */}
      {!railShown ? (
        <>
          {/* "Course Content", not "Table of Contents" — 2026-09-23, the direct
              ask. Note the reading column's placeholder caption says the same
              two words; that one names the COURSEWARE that will render there,
              this one names the list. They do not collide today (the
              placeholder only shows on the Course view, beside this) but the
              two are one rename apart from reading as the same thing. */}
          <p style={sidebarEyebrowStyle}>Course Content</p>
          <CompassContents completedLessons={completedLessons} totalLessons={totalLessons} />
        </>
      ) : (
        /* Styled after the dashboard's own rows — icon, label, a tinted active
           state with a solid left bar — because a learner arriving from that
           rail should not have to learn a second way of reading "you are here".
           The colours are the PRIMARY ramp rather than the `--color-nav-*`
           tokens: those are tuned for the dark rail, and this sidebar is
           `--color-surface-card`. */
        <nav aria-label="Course pages">
          <ul style={pageNavListStyle}>
            {COMPASS_PAGES.map((p) => (
              <li key={p.id}>
                <CompassNavRow
                  item={p}
                  active={p.id === page}
                  onSelect={() => onSelectPage(p.id)}
                />
              </li>
            ))}
          </ul>
        </nav>
      )}
    </aside>
  )
}

/**
 * One page row. The dashboard rail's shape — icon, label, a 3px left bar that
 * is solid on the active row and transparent otherwise, so the text never
 * shifts between states.
 *
 * ITS OWN COMPONENT because it needs local hover state, which is the same
 * reason `RailRow` is one out in `PlatformSideNav`. Not a reuse of that one:
 * it reads `--color-nav-*`, tuned for the dark rail, and would be invisible on
 * this white sidebar.
 */
function CompassNavRow({
  item,
  active,
  onSelect,
}: {
  item: (typeof COMPASS_PAGES)[number]
  active: boolean
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-current={active ? 'page' : undefined}
      style={{
        ...pageNavRowStyle,
        borderLeftColor: active ? 'var(--color-primary-500)' : 'transparent',
        /* `backgroundColor`, NOT the `background` shorthand. jsdom's shorthand
           parser throws on `color-mix()` — it fails while CLONING the node,
           which is what testing-library's role queries do, so the symptom is an
           unrelated-looking TypeError deep in a `getByRole` rather than
           anything pointing here. The longhand skips that parser entirely, and
           the dashboard rail's own active tint is set the same way. */
        backgroundColor: active
          ? 'color-mix(in srgb, var(--color-primary-500) 10%, transparent)'
          : hovered
            ? 'var(--color-neutral-75)'
            : 'transparent',
        color: active ? 'var(--color-primary-500)' : 'var(--color-text-secondary)',
        fontWeight: active ? 700 : 600,
      }}
    >
      <span style={{ display: 'inline-flex', color: 'inherit', flexShrink: 0 }}>
        <Icon size={16} aria-hidden />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>{item.label}</span>
    </button>
  )
}

/** How many UNSTARTED lessons show before the "Show all" link appears. Six is
 *  the point where the column stops being a list you can take in and becomes
 *  one you scroll — with 42 lessons and 26 done there are 15 ahead, and all of
 *  them pushed Resources off the screen. */
const UPCOMING_PREVIEW = 6

/**
 * THE CONTENTS TREE — 42 LESSONS, collapsed around where the learner is.
 *
 * 2026-09-23, the direct ask: "there should be 42 lessons listed in that table
 * of contents according to the home screen 26 of 42 completed. So lets show 1
 * line with a solid checkmark next to a link CTA that is Completed 26 of 42.
 * Clicking on that link will expand to show all of the completed lessons, this
 * will help the most current lesson to always be at the top, and if there would
 * be excessive scrolling for the uncompleted we can add a 'show all' link cta
 * to expand the entire list as well."
 *
 * IT REPLACES A CHAPTER TREE, and that is the substance of the change. The list
 * was `NY_LH_COURSE_CHAPTERS` — eleven chapter names — while every count on the
 * dashboard is in LESSONS. The two never reconciled (the note this file used to
 * carry called it "one honest gap"), and a contents tree that cannot agree with
 * "26 of 42" about how much there is cannot show a learner where they are.
 *
 * ⚠ THE COUNTS ARE SOURCED; THE TITLES ARE INVENTED, ALL 42 OF THEM.
 * `completedLessons` and `totalLessons` are summed off `resolvePathCategories`,
 * the same two figures the card prints. No source in this repo publishes a
 * lesson NAME — there are 11 chapter names and 42 lessons, with no mapping
 * between them — so every row's label comes from
 * {@link NY_LH_LESSON_TITLES_INVENTED}, whose own note carries the warning and
 * how the 42 were built.
 *
 * THIS IS THE MOST CONVINCING INVENTION ON THE SCREEN and is worth saying
 * plainly, because an earlier version of this note refused it on exactly that
 * ground. A full column of plausible titles reads as a real syllabus, and
 * nothing in the UI distinguishes it from one. It was authored anyway, on the
 * direct ask, after the partial map turned out to be worse: it only looked
 * honest from the one scroll position it was written for, and rendered seven
 * unlabelled "Lesson N" rows at 0%.
 *
 * THE ORDINAL FALLBACK STAYS in `LessonRow` even though nothing reaches it
 * today — it is what lets a real outline arrive as a partial map without a
 * component change.
 */
function CompassContents({
  completedLessons,
  totalLessons,
}: {
  completedLessons: number
  totalLessons: number
}) {
  const [showCompleted, setShowCompleted] = useState(false)
  const [showAllUpcoming, setShowAllUpcoming] = useState(false)

  /* Clamped so a fixture that ever reports more done than exist cannot produce
     a negative run of upcoming lessons or a current lesson past the end. */
  const done = Math.max(0, Math.min(completedLessons, totalLessons))
  const current = done < totalLessons ? done + 1 : null
  const upcoming: number[] = []
  for (let n = done + 2; n <= totalLessons; n++) upcoming.push(n)
  const visibleUpcoming = showAllUpcoming ? upcoming : upcoming.slice(0, UPCOMING_PREVIEW)
  const hiddenUpcoming = upcoming.length - visibleUpcoming.length
  const rows: { n: number; state: 'current' | 'upcoming' }[] = [
    ...(current != null ? [{ n: current, state: 'current' as const }] : []),
    ...visibleUpcoming.map((n) => ({ n, state: 'upcoming' as const })),
  ]

  return (
    <div style={contentsStyle}>
      {/* THE COMPLETED SUMMARY — one line standing in for 26 rows, which is
          what keeps the current lesson at the top of the column rather than
          26 rows down it. A real <button>: it is the only thing here that
          does something, and `aria-expanded` is how that is announced. */}
      {done > 0 ? (
        <button
          type="button"
          onClick={() => setShowCompleted((v) => !v)}
          aria-expanded={showCompleted}
          className="cre-link-action cre-cta-ink"
          style={completedSummaryStyle}
        >
          <span aria-hidden style={tocDoneDotStyle}>
            <Check
              size={9}
              aria-hidden
              style={{
                color: 'var(--color-text-inverse)',
                stroke: 'currentColor',
                strokeWidth: 38,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
              }}
            />
          </span>
          <span>
            Completed {done} of {totalLessons}
          </span>
          {/* THE CHEVRON — 2026-09-23, the direct ask, "include a chevron icon
              to the right of the completed line to indicate its expandable."

              `aria-expanded` already said this, and said it ONLY to a screen
              reader; sighted reviewers had a link that gave no sign 26 rows sat
              behind it. The glyph is the visible half of the same statement.

              DOWN WHEN CLOSED, UP WHEN OPEN, which is the convention the rest
              of the product follows (the feature-flag panel's group sections,
              built two days ago, do the same). Two glyphs rather than one
              rotated by CSS: the registry publishes both, and a transform on an
              SVG that already has its own width and height is the kind of
              thing the Figma skill's rules warn about.

              `aria-hidden` — it duplicates `aria-expanded`, and announcing it
              twice is worse than not drawing it at all. */}
          {showCompleted ? (
            <ChevronUp size={12} aria-hidden />
          ) : (
            <ChevronDown size={12} aria-hidden />
          )}
        </button>
      ) : null}

      {showCompleted ? (
        <ol style={lessonListStyle}>
          {Array.from({ length: done }, (_, i) => i + 1).map((n, i, all) => (
            <li key={n} style={tocItemStyle}>
              {i < all.length - 1 ? <span aria-hidden style={tocThreadLineStyle} /> : null}
              <LessonRow n={n} state="done" />
            </li>
          ))}
        </ol>
      ) : null}

      {/* THE DASHED THREAD joins one bullet to the next, and is omitted on the
          last row so the line ends at a bullet rather than trailing into the
          link below. Rows are numbered off the rendered slice, not the lesson
          number, so collapsing the upcoming list still ends the thread at the
          last VISIBLE row. */}
      <ol style={lessonListStyle}>
        {rows.map((row, i) => (
          <li key={row.n} style={tocItemStyle}>
            {i < rows.length - 1 ? <span aria-hidden style={tocThreadLineStyle} /> : null}
            <LessonRow n={row.n} state={row.state} />
          </li>
        ))}
      </ol>

      {hiddenUpcoming > 0 ? (
        <button
          type="button"
          onClick={() => setShowAllUpcoming(true)}
          className="cre-link-action cre-cta-ink"
          style={showAllStyle}
        >
          Show all {totalLessons} lessons
        </button>
      ) : null}
    </div>
  )
}

/** One lesson. The bullet states the state — the three the tree already had,
 *  now on lessons rather than chapters. */
function LessonRow({ n, state }: { n: number; state: 'done' | 'current' | 'upcoming' }) {
  return (
    <span style={tocSectionRowStyle}>
      {state === 'done' ? (
        <span aria-hidden style={tocDoneDotStyle}>
          <Check
            size={9}
            aria-hidden
            style={{
              color: 'var(--color-text-inverse)',
              stroke: 'currentColor',
              strokeWidth: 38,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }}
          />
        </span>
      ) : (
        <span aria-hidden style={state === 'current' ? tocRingNowStyle : tocRingIdleStyle} />
      )}
      {/* THE TITLE WHERE ONE IS AUTHORED, the ordinal otherwise — and the
          fallback is doing real work rather than guarding an edge case.
          `NY_LH_LESSON_TITLES_INVENTED` covers only the window a reviewer sees
          (27–33); expanding the completed run or Show all drops straight back
          to "Lesson 12", which is what makes the authored stretch visible
          instead of passing for a real syllabus. */}
      <span style={state === 'current' ? tocSectionTextNowStyle : tocSectionTextStyle}>
        {NY_LH_LESSON_TITLES_INVENTED[n] ?? `Lesson ${n}`}
      </span>
    </span>
  )
}

/* ─── the top bar ──────────────────────────────────────────────────────── */

function CompassTopBar({
  chapterTitle,
  onClose,
  closeLabel,
}: {
  chapterTitle: string
  onClose: () => void
  closeLabel: string
}) {
  /* THE DATE CHIP READS THE LEARNER'S OWN EXAM DATE. The mock hardcodes
     "August 14, 2026 · 8 Days Out"; this reads `cgp.examDate` — the date typed
     on Schedule State Exam — so the player and the dashboard behind it cannot
     state two different exam dates. With nothing entered the chip is OMITTED
     rather than defaulted: a countdown to a date nobody gave is the invented
     figure this repo refuses everywhere else. */
  const examDate = readExamDate()
  const examChip = examDate ? formatExamChip(examDate) : null

  return (
    <header style={topBarStyle}>
      <div style={topBarLeftStyle}>
        {examChip ? (
          <span style={pillStyle}>
            <CalendarDay size={13} aria-hidden style={mutedIconStyle} />
            <span style={pillStrongStyle}>{examChip.date}</span>
            <span aria-hidden style={pillDotStyle} />
            <span style={pillTextStyle}>{examChip.countdown}</span>
          </span>
        ) : null}
        {/*
          OUT OF THE PILL — 2026-09-23, the direct ask: "this should definitely
          include the Chapter Name, and lesson details here, maybe take it out
          of the pill".

          The pill was the problem, not the styling of it. A fixed-height
          rounded container with `white-space: nowrap` had one line to spend on
          a chapter name that runs to 48 characters, so it truncated to "Life
          Insurance Premiu…" — the one fact the bar exists to state, elided.
          Unwrapped, the name gets a line of its own and the lesson detail gets
          the one beneath it.

          ⚠ "SECTION:" IS GONE, AND THAT IS A CORRECTION, not a trim. The label
          said Section and the number beside it is the COURSE percentage — the
          same 62% the sidebar prints under the course title. Nothing here
          tracks per-chapter progress, so a "Section: …  62%" pill was quietly
          attributing the whole course's progress to one chapter. The figure now
          says what it is.
        */}
        <span style={nowPlayingStyle}>
          {/* NO EYEBROW — 2026-09-23, added and removed within the hour.
              "Current Lesson" sat here for one build, and its removal settles a
              tension it had introduced: the title below is a CHAPTER name from
              `NY_LH_COURSE_CHAPTERS`, and the course counts 42 lessons against
              11 chapters with nothing published mapping one onto the other. A
              label reading "Current Lesson" over a chapter asserted that
              equivalence. Without it the bar states the chapter and its
              estimate and claims nothing about the unit.

              The lesson NUMBER and PART, which the eyebrow had replaced, remain
              unrendered here — the Jump Back In card states both, and the
              number still reaches the launcher through `LaunchedCourseMeta`. */}
          <span style={nowPlayingChapterStyle}>{chapterTitle}</span>
          {/* THE ESTIMATE, as the Home card states it — 2026-09-23, the direct
              ask: "add the estimated time to complete line under the title like
              we have in the home card." Same words, same 12/16 in
              `--color-text-secondary`, same 4px above, so the two read as one
              sentence repeated rather than two facts that happen to agree.

              ⚠ THE FIGURE IS INVENTED and now says so on a SECOND surface.
              `NY_LH_LESSON_MINUTES_INVENTED` carries the warning in its name:
              nothing in the fixtures knows a lesson's length, and this version
              refused the reference mock's "· 14 minutes left" three times on
              exactly that ground before it was asked for directly. Reading the
              constant rather than retyping 18 is what keeps one edit enough
              when a real duration arrives. */}
          <span style={nowPlayingEstimateStyle}>
            Estimated Time to Complete: {NY_LH_LESSON_MINUTES_INVENTED} minutes
          </span>
        </span>
        {/* NO PROGRESS HERE — 2026-09-23, the direct ask: "this progress
            belongs in the nav. we do not need multiple progress, its
            confusing."

            The bar and "62% of course" stated the same figure the sidebar
            already prints under the course title, eight inches apart on one
            screen. Two readouts of one number is not twice the information; it
            is a reader checking whether they disagree. The nav keeps it,
            because that is where the course is identified — the number belongs
            next to the thing it measures.

            The top bar is now purely WHERE YOU ARE (chapter, lesson, part) and
            the controls. That split is also why this was the right one to drop
            rather than the chip: a bar in the toolbar reads as progress through
            the current chapter, which is not what the figure is. */}
      </div>

      <div style={topBarActionsStyle}>
        <span style={squarePillStyle}>
          <FileText size={13} aria-hidden style={mutedIconStyle} />
          <span style={pillStrongStyle}>Notes</span>
          <span style={notesCountStyle}>0</span>
        </span>
        {/* THE "DEMO" PILL IS GONE — 2026-09-22, the direct ask. It was drawn
            DASHED in the mock, which is how a Figma marks a control that is not
            real yet; rendered faithfully, that annotation became a live-looking
            button in a learner's course player, which is what the UX scan
            filed under "prototype scaffolding in a learner surface". A note in
            the design is not a control in the product. */}
        {/* "Ask Rubi", not "Rubi" — 2026-09-22, the direct ask. The pill is a
            way IN to the panel, and a bare product name labels the thing
            rather than the action; the aside's own header keeps "Rubi" because
            there it IS the name of what you are looking at. */}
        <span style={rubiPillStyle}>
          <RubiMark size={16} />
          <span style={pillStrongStyle}>Ask Rubi</span>
        </span>
      </div>

      <div style={topBarActionsStyle}>
        <span style={iconButtonStyle}>
          <MagnifyingGlass size={13} aria-hidden style={mutedIconStyle} />
        </span>
        <span style={iconButtonStyle}>
          <Sliders size={13} aria-hidden style={mutedIconStyle} />
        </span>
        {/* THE ONLY WIRED CONTROL ON THE SCREEN. */}
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close course player and return to ${closeLabel}`}
          style={{ ...iconButtonStyle, cursor: 'pointer' }}
        >
          <X size={13} aria-hidden style={mutedIconStyle} />
        </button>
      </div>
    </header>
  )
}

/* ─── the Rubi aside ───────────────────────────────────────────────────── */

function RubiAside() {
  return (
    <aside style={rubiAsideStyle} aria-label="Chat with Rubi">
      <div style={rubiHeaderStyle}>
        <RubiMark size={26} />
        <span style={{ minWidth: 0 }}>
          <span style={rubiNameStyle}>Rubi</span>
          <span style={rubiTaglineStyle}>here to help</span>
        </span>
        <span style={rubiCloseStyle} aria-hidden>
          ×
        </span>
      </div>

      <div style={rubiThreadStyle}>
        <p style={rubiSpeakerStyle}>Rubi</p>
        <p style={rubiMessageStyle}>
          Ask me anything about this chapter — I&rsquo;ll keep it grounded in what
          you&rsquo;re studying.
        </p>
      </div>

      <div style={rubiComposerStyle}>
        <div style={rubiChipRowStyle}>
          <span style={rubiChipStyle}>Give an example</span>
          <span style={rubiChipStyle}>Explain simpler</span>
          <span style={rubiChipStyle}>Quiz me</span>
        </div>
        <div style={rubiInputStyle}>
          <span style={rubiPlaceholderStyle}>Ask Rubi about this…</span>
          <span style={rubiSendStyle} aria-hidden>
            <ChevronRight size={15} style={{ color: 'var(--color-text-inverse)' }} />
          </span>
        </div>
      </div>
    </aside>
  )
}

/** The Rubi hexagon, from the registry's own `rubi-mark` — NOT redrawn and not
 *  the generic star. It is the same mark the rail's Rubi Insights row uses. */
function RubiMark({ size }: { size: number }) {
  return (
    <img
      src={new URL('../../icons/rubi-mark.svg', import.meta.url).href}
      alt=""
      aria-hidden
      width={size}
      height={size}
      style={{ display: 'block', flexShrink: 0 }}
    />
  )
}

/* THE GLOBAL HEADER IS NOT BUILT HERE, and that is deliberate. The design
   draws one above the player — logo, cart, notifications, avatar — and the app
   ALREADY renders exactly that: `<Header />` in `AppLayout`, above
   `PlatformShell`. Because the takeover is returned from inside the shell, that
   header stays put with no work and no second copy to drift. An earlier pass
   built a `CompassGlobalHeader` before checking; it was deleted rather than
   left as a duplicate of a component that is already on screen. */

/* ─── helpers ──────────────────────────────────────────────────────────── */

/* ─── styles ───────────────────────────────────────────────────────────── */

const playerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  flex: 1,
  minHeight: 0,
  background: 'var(--color-surface-card)',
}

const overviewGroundStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  background: 'var(--compass-ground)',
}

const rightOfSidebarStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minWidth: 0,
}

const playerBodyStyle: CSSProperties = {
  display: 'flex',
  flex: 1,
  minHeight: 0,
}

/* sidebar */

const sidebarStyle: CSSProperties = {
  width: 260,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  /* 11 on top, not 12 — it is the top bar's own padding, and the breadcrumb
     row below depends on the two matching. See `breadcrumbStyle`. */
  padding: '11px 20px 24px',
  overflowY: 'auto',
  background: 'var(--color-surface-card)',
  borderRight: '1px solid var(--color-border-subtle)',
}

/*
 * 13/600, MEASURED OFF THE REFERENCE rather than eyeballed — Home's
 * "Customize Study Plan" computes to 13px / 600 / 19.5px, and the ask was for
 * the same link-style CTA.
 *
 * The first pass took "link style" to mean the CLASSES and kept the Figma's
 * 11px/500, so the crumbs had the right colour and hover and the wrong type —
 * which is what "the size still looks wrong" was pointing at. The house CTA is
 * a type ramp as much as a colour: matching half of it is not matching it.
 *
 * The separators and the House glyph scale with it; "Course" takes the size but
 * not the weight, because it is the page you are on rather than an action.
 */
const breadcrumbStyle: CSSProperties = {
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19.5px',
  /*
   * 38px TALL AND CENTRED so the crumbs sit on the same line as the top bar's
   * "Section:" pill — 2026-09-22, the direct ask.
   *
   * IT IS ARITHMETIC, not a nudge. The sidebar and the top bar are SIBLINGS
   * starting at the same y, so aligning their contents means matching the box
   * the text sits in: the bar is `11px padding + 38px pill + 11px`, putting the
   * pill's centre at 30px. The sidebar's own top padding is 11 to match, and
   * this row is the same 38 — so its centre lands at 30 too, and the two stay
   * aligned if either one's type changes.
   */
  minHeight: 38,
  flexShrink: 0,
}

const crumbSlashStyle: CSSProperties = {
  color: 'var(--color-neutral-400)',
  fontSize: 12,
}

/* The crumb controls carry NO colour — `.cre-cta-ink` does, and it swaps on the
   dark theme. Everything else here is the reset a <button> needs to sit in a
   line of text. */
const crumbButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  background: 'transparent',
  border: 0,
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  lineHeight: 'inherit',
  /* 600 — the reference CTA's weight. Inherited size, explicit weight: the
     <p> carries the ramp and this is the half that differs from the crumb you
     are on. */
  fontWeight: 600,
}

const crumbHereStyle: CSSProperties = { color: 'var(--color-text-tertiary)', fontWeight: 500 }
/* NB: `crumbHereStyle` sets no size — it inherits the 13 from `breadcrumbStyle`
   so the three crumbs sit on one baseline, and differs only in weight and ink. */

const sidebarHeadStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '4px 8px 8px 0',
}

/*
 * THE SERIF, IN BODY BLACK — 2026-09-23, the direct ask: "change this to black
 * and the source serif font used in the home screen". It was blue for a day,
 * from the ask before this one.
 *
 * MEASURED OFF HOME rather than guessed: that page's course title computes to
 * the Georgia stack in `rgb(58,58,58)`, which are `--font-heading-serif` and
 * `--color-text-primary`.
 *
 * `--font-heading-serif` DIRECTLY, not `--font-heading`. Home reaches the serif
 * because `dashboard-heading-font: serif` re-points the heading token for that
 * subtree; the player is a full-window takeover outside it, so referencing
 * `--font-heading` here would render Lato and silently not match. The ask was
 * for the serif, so the serif is what is named.
 *
 * THE SIZE DOES NOT FOLLOW. Home sets 28/700 in a full-width band; this column
 * is 220px and the name runs to 38 characters. Matching the face and the ink is
 * what makes the two read as one product — matching the display size would put
 * a four-line headline in a sidebar.
 */
const sidebarTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontSize: 16,
  fontWeight: 600,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}

const progressRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginTop: 2,
}

/* 13/700, the size and weight Home prints beside its own bar — the point of
   matching is that one learner's one percentage looks like one thing. */
const progressPctStyle: CSSProperties = {
  flexShrink: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
}

const sidebarEyebrowStyle: CSSProperties = {
  margin: '10px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '1.1px',
  textTransform: 'uppercase',
  lineHeight: '16.5px',
  /* `--color-text-primary`, not `--color-neutral-950`: it IS the body ink and
     it re-points on the dark theme, where a literal black would vanish. */
  color: 'var(--color-text-primary)',
}

const tocItemStyle: CSSProperties = { position: 'relative' }

const tocThreadLineStyle: CSSProperties = {
  position: 'absolute',
  /* Centred under a 14px bullet at the row's left edge: 7 - half the 1px rule. */
  left: 6.5,
  /* Below the bullet (3px row padding + 1px nudge + 14px bullet + 2), running
     past the row's own bottom to cross the list's 4px gap — without that it
     breaks at every boundary, which is the opposite of connecting them. */
  top: 20,
  bottom: -4,
  borderLeft: '1px dashed var(--color-neutral-300)',
}

const pageNavListStyle: CSSProperties = {
  listStyle: 'none',
  margin: '2px 0 0',
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}

const pageNavRowStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 10px',
  /* The bar is ALWAYS 3px and only its colour changes — an active row that
     grows a border shifts its own label, which is the flicker the dashboard
     rail's own note records. */
  borderWidth: '0 0 0 3px',
  borderStyle: 'solid',
  borderColor: 'transparent',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: 1.2,
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'background 120ms, color 120ms',
}

const contentsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  marginTop: 2,
}

const lessonListStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  /* 4, not the 6 the chapter tree used. Chapter names wrapped to two and three
     lines and needed the gap to stop consecutive ones merging; "Lesson 27" is
     one line, so the same 6 left the column looking gappy. */
  gap: 4,
}

/* The two CTAs share the house link style (`cre-link-action cre-cta-ink`) and
   set no colour of their own — the class carries it and re-points on the dark
   theme, which is the trap that class's note in `tokens.css` records. */
const completedSummaryStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 9,
  alignSelf: 'flex-start',
  background: 'transparent',
  border: 0,
  padding: '3px 0',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  lineHeight: '17px',
}

const showAllStyle: CSSProperties = {
  ...completedSummaryStyle,
  /* Indented to the lesson TEXT rather than the bullet, so it reads as an
     action on the list instead of another row in it. */
  marginLeft: 23,
}

/*
 * TOP-ALIGNED AND PADDED, NOT THE DESIGN'S 30px CENTRED ROW — 2026-09-22.
 *
 * The Figma's section titles are short single-line labels ("Insurance Basics"),
 * so a fixed 30px row with everything vertically centred is right there. The
 * REAL chapter names are up to 48 characters and wrap to two and three lines in
 * a 220px column, and at that point the design's values fail in two ways at
 * once: the bullet floats to the middle of a three-line block instead of
 * marking its first line, and consecutive wrapped titles run together because
 * a fixed height leaves no space between them.
 *
 * So the row grows with its content, the icon pins to the first line, and the
 * spacing moves from `minHeight` to padding + a gap on the list — which is the
 * same rhythm at one line and survives three.
 */
const tocSectionRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 9,
  padding: '3px 8px 3px 0',
  borderRadius: 'var(--radius-md)',
}

/* The shared bullet box. Every state is 12x12 and nudged 2px down so it sits
   optically centred on the FIRST LINE of a wrapped title — (17px line - 12px
   bullet) / 2 — rather than on the cap-line, where it reads high. All three
   share it so a state change can never move the text. */
const tocBulletBase: CSSProperties = {
  /* 14, UP FROM 12 — 2026-09-22: "this icon looks weird, cant see the
     checkmark". The tick is Font Awesome PRO LIGHT, a hairline path, and at 7px
     inside a 12px disc there was not enough room for the stroke to register as
     a check rather than as a smudge. The disc is the constraint, so the disc
     grew; the design's own done glyph is 15px, so this moves TOWARDS the mock
     rather than away — the 12 came from the type-downsizing pass and took the
     tick with it. All three states share the box, so none of them can shift
     the text relative to the others. */
  width: 14,
  height: 14,
  flexShrink: 0,
  borderRadius: '50%',
  /* (17px line - 14px bullet) / 2 ≈ 1, so the first-line nudge shrinks with
     the disc growing — without re-deriving it the bullet would sit low. */
  marginTop: 1,
  /* ABOVE THE DASHED THREAD, which runs behind the column. Without this the
     line crosses the open rings and they read as struck through. */
  position: 'relative',
  zIndex: 1,
  background: 'var(--color-surface-card)',
}

const tocRingNowStyle: CSSProperties = {
  ...tocBulletBase,
  border: '1.5px solid var(--color-primary-500)',
}

const tocRingIdleStyle: CSSProperties = {
  ...tocBulletBase,
  border: '1.5px solid var(--color-neutral-300)',
}

const tocDoneDotStyle: CSSProperties = {
  ...tocBulletBase,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--color-primary-500)',
}




/* 13/17, down from the design's 15/20. The mock's labels are short enough that
   15 reads as a comfortable nav size; on titles that wrap twice it reads as a
   heading and the column stops being scannable. 13 is the size the design
   already uses for its CHILD rows, so this is the tree's own smaller step
   rather than a new one, and 17 tightens the leading inside a wrapped title so
   the two lines group before the gap separates them from the next item. */
const tocSectionTextStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '17px',
  color: 'var(--color-neutral-800)',
}

const tocSectionTextNowStyle: CSSProperties = {
  ...tocSectionTextStyle,
  fontWeight: 600,
  color: 'var(--color-primary-500)',
}









/* top bar */

const topBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 32,
  padding: '11px 20px',
  background: 'var(--color-neutral-75)',
  borderBottom: '1px solid var(--color-border-subtle)',
  flexWrap: 'wrap',
}

const topBarLeftStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flex: 1,
  minWidth: 0,
  flexWrap: 'wrap',
}

const topBarActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexShrink: 0,
}

const mutedIconStyle: CSSProperties = { color: 'var(--color-neutral-600)' }

const pillBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  height: 38,
  padding: '9px 18px',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-pill)',
}

const pillStyle: CSSProperties = { ...pillBase }

const nowPlayingStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  flex: '1 1 auto',
}

const nowPlayingChapterStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
  /* WRAPS rather than truncating. The pill's `nowrap` is what elided the name
     in the first place; the bar can take two lines more cheaply than the
     reader can take an ellipsis. */
  minWidth: 0,
}

/* 12/16 in `--color-text-secondary`, 4px above — the Home card's own values,
   copied deliberately rather than approximated. */
const nowPlayingEstimateStyle: CSSProperties = {
  marginTop: 4,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '16px',
  color: 'var(--color-text-secondary)',
}




const pillTextStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-neutral-800)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const pillStrongStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  lineHeight: '20px',
  color: 'var(--color-neutral-800)',
  whiteSpace: 'nowrap',
}

const pillDotStyle: CSSProperties = {
  width: 3,
  height: 3,
  borderRadius: '50%',
  background: 'var(--color-neutral-600)',
  flexShrink: 0,
}



const squarePillStyle: CSSProperties = {
  ...pillBase,
  padding: '9px 14px',
  borderRadius: 'var(--radius-md)',
}


const rubiPillStyle: CSSProperties = {
  ...squarePillStyle,
  background: 'var(--compass-current)',
  borderColor: 'var(--color-neutral-200)',
}

const notesCountStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 21,
  height: 21,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-primary-500)',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
}

const iconButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 38,
  height: 38,
  padding: 9,
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
}

/* reading column */

const readingColumnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minWidth: 0,
  background: 'var(--compass-ground)',
}

const readingMainStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '100px 104px 56px',
  display: 'flex',
  justifyContent: 'center',
}

const contentCardStyle: CSSProperties = {
  width: '100%',
  maxWidth: 832,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 24,
  paddingTop: 24,
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--compass-content)',
  overflow: 'hidden',
}

const contentCaptionStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 34,
  fontWeight: 500,
  letterSpacing: '-0.34px',
  lineHeight: '39px',
  textAlign: 'center',
  color: 'var(--compass-rule)',
}

const contentBlockStyle: CSSProperties = {
  width: '100%',
  aspectRatio: '830 / 467',
  background: 'var(--compass-content)',
}

const readingFooterStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  height: 72,
  /* 40, down from the Figma's 80 — 2026-09-22, the direct ask. The mock is
     drawn at 1680 wide where 80 reads as a margin; at the widths this actually
     renders the two controls were pulled well inside the reading column they
     belong to. */
  padding: '0 40px',
  background: 'var(--color-surface-card)',
  borderTop: '1px solid var(--compass-rule)',
  flexShrink: 0,
}

const footerButtonBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  height: 44,
  padding: '0 20px',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
}

const prevButtonStyle: CSSProperties = {
  ...footerButtonBase,
  background: 'var(--color-surface-card)',
  border: '1px solid var(--compass-edge)',
  color: 'var(--color-text-primary)',
  opacity: 0.4,
}

const nextButtonStyle: CSSProperties = {
  ...footerButtonBase,
  background: 'var(--color-primary-500)',
  border: '1px solid var(--color-primary-700)',
  color: 'var(--color-text-inverse)',
}

/* Rubi aside */

const rubiAsideStyle: CSSProperties = {
  width: 380,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--color-surface-card)',
  borderLeft: '1px solid var(--compass-edge)',
}

const rubiHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '16px',
  borderBottom: '1px solid var(--compass-rule)',
  flexShrink: 0,
}

const rubiNameStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-heading)',
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: '0.6px',
  lineHeight: '22.5px',
  color: 'var(--rubi-red)',
}

const rubiTaglineStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 10.5,
  lineHeight: '15.75px',
  color: 'var(--color-text-tertiary)',
}

const rubiCloseStyle: CSSProperties = {
  marginLeft: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--compass-rule)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-secondary)',
  fontSize: 16,
  lineHeight: 1,
}

const rubiThreadStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '14px 16px',
}

const rubiSpeakerStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  lineHeight: '15px',
  color: 'var(--rubi-red)',
}

const rubiMessageStyle: CSSProperties = {
  margin: '8px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19.5px',
  color: 'var(--color-text-primary)',
}

const rubiComposerStyle: CSSProperties = {
  flexShrink: 0,
  padding: '11px 13px',
  borderTop: '1px solid var(--compass-rule)',
}

const rubiChipRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const rubiChipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 22.5,
  padding: '0 10px',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--compass-edge)',
  background: 'var(--color-surface-card)',
  fontFamily: 'var(--font-body)',
  fontSize: 10.5,
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
}

const rubiInputStyle: CSSProperties = {
  marginTop: 10,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  height: 46,
  padding: '0 9px 0 11px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--compass-edge)',
}

const rubiPlaceholderStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-neutral-600)',
}

const rubiSendStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  flexShrink: 0,
  borderRadius: 'var(--radius-sm)',
  background: 'var(--color-primary-500)',
}

