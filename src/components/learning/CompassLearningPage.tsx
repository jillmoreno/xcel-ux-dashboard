import { useState, type CSSProperties } from 'react'
import { CompassSidebar, CompassPageBody, type CompassPage } from './CompassCoursePlayer'
import { CompassLearningOverview } from './CompassLearningOverview'
import { useNavPlacement } from '@/components/layout/navPlacement'

/**
 * COMPASS LEARNING — the top nav's second destination (Figma 765:3471).
 *
 * The frame is the Compass course chrome reached from the HEADER rather than
 * by launching a course: the 220px sidebar on the left, and on the right a
 * page header (eyebrow, title, the exam-date strip) over the populated
 * Overview body.
 *
 * ⚠ IT REUSES `CompassSidebar` RATHER THAN DRAWING ONE. The sidebar already
 * carries exactly the eight rows the design draws — Overview, Course,
 * Flashcards, Exam Simulator, Progress, Resources, Readiness, Rubi Insights —
 * plus the breadcrumb, course title and progress bar above them. Rebuilding it
 * here would have produced a second sidebar to keep in step with the first.
 *
 * ⚠ IT OPENS ON OVERVIEW, where the launcher opens on Course. That is the
 * difference between the two entrances: launching a course means "take me into
 * the courseware", and choosing Compass Learning from the nav means "show me
 * where I am". The other seven pages are the player's own bare grounds,
 * unchanged.
 *
 * ⚠ THE BREADCRUMB IS THE PLAYER'S, NOT THE MOCK'S. The Figma draws "Home /
 * My Learning / Course"; `CompassSidebar` renders "Home → Overview → …", which
 * is a recorded direct correction from 2026-09-23 with its reasoning written
 * beside it. Reversing a decision that deliberate on the strength of a
 * screenshot is not a call this page should make on its own.
 */
export function CompassLearningPage({
  courseTitle,
  percentComplete,
  completedLessons,
  totalLessons,
  timeRemaining,
  onLeave,
  onStartSession,
}: {
  courseTitle: string
  percentComplete: number
  completedLessons: number
  totalLessons: number
  /** "17 days" — the subtext under the title. */
  timeRemaining?: string
  /** Home — the one crumb that leaves. */
  onLeave: () => void
  /** Open the session (the Tonight card's Start session). */
  onStartSession?: () => void
}) {
  const [page, setPage] = useState<CompassPage>('overview')
  /* Option 3 only — the header and the rail both carry a Home there, so the
     sidebar's trail would be the third. See the prop. */
  const hideCrumb = useNavPlacement() === 'hybrid'
  return (
    <div style={pageStyle}>
      <CompassSidebar
        courseTitle={courseTitle}
        percentComplete={percentComplete}
        completedLessons={completedLessons}
        totalLessons={totalLessons}
        onLeave={onLeave}
        page={page}
        onSelectPage={setPage}
        hideCrumb={hideCrumb}
        timeRemaining={timeRemaining}
      />
      <div style={mainStyle}>
        {page === 'overview' ? (
          <>
            <header style={headerStyle}>
              <div style={{ minWidth: 0 }}>
                <p style={eyebrowStyle}>Let’s get started</p>
                <h1 style={titleStyle}>Compass Learning</h1>
              </div>
              <ExamDateStrip />
            </header>
            <CompassLearningOverview onStartSession={onStartSession} />
          </>
        ) : (
          /* Every other page is the player's own, so it stays the player's —
             including the deliberate blank grounds. */
          <CompassPageBody page={page} />
        )}
      </div>
    </div>
  )
}

/**
 * The exam-date strip the design puts top-right.
 *
 * ⚠ "TO BE SCHEDULED" IS HARDCODED, and it matches the mock rather than the
 * app: the real date lives in `examDateStore` and the Home page's Exam Date
 * card is what writes it. Reading it here would make the two disagree the
 * moment a reviewer enters a date on Home, because Edit below does nothing
 * yet — a strip that states a date it cannot change is worse than one that
 * states the demo's state. Wire both halves together, or neither.
 */
function ExamDateStrip() {
  return (
    <div style={examStripStyle}>
      <span style={examLabelStyle}>State License Exam Date: To be Scheduled</span>
      <button type="button" style={examEditStyle}>
        Edit
      </button>
    </div>
  )
}

/* FLEX WITH `minHeight: 0`, NOT A GRID WITH A `100vh` FLOOR — the shape
   `CompassCoursePlayer` uses, and this page is its sibling: both are returned
   ABOVE the shell grid and both draw their own sidebar, so both should size
   against their parent rather than against the viewport. A `100vh` floor
   inside the demo frame's own chrome is a second, competing height for the
   same box. */
const pageStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  flex: 1,
  minHeight: 0,
  background: 'var(--color-surface-page)',
}
/* The scroll container. The sidebar stays put and this column moves, which is
   what the frame draws and what the player does. */
const mainStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  overflowY: 'auto',
  padding: '28px 40px 96px',
}
const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 24,
  marginBottom: 28,
}
const eyebrowStyle: CSSProperties = {
  margin: '0 0 4px',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-primary-700)',
}
const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading, Georgia, serif)',
  fontSize: 28,
  fontWeight: 700,
  lineHeight: 1.15,
  color: 'var(--color-text-primary)',
}
const examStripStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  justifyContent: 'space-between',
  background: 'var(--color-neutral-100)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 6,
  padding: '10px 16px',
  minWidth: 462,
  flex: 'none',
}
const examLabelStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}
const examEditStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 16,
  fontWeight: 600,
  color: 'var(--color-primary-600)',
}
