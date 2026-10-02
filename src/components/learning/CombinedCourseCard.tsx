import { LoFiWidgetBody } from '@/components/lo-fi/LoFiPlaceholders'
import { useLoFi } from '@/context/LoFiContext'
import type { CSSProperties } from 'react'
import { ArrowRight } from '@/icons'
import {
  NY_LH_CURRENT_CHAPTER,
  NY_LH_LESSON_MINUTES_INVENTED,
} from '@/data/nyProducerRequirements'
import type { LearningPathSummary } from '@/data/learningFixtures'
import { StudyJourneyRail } from './StudyJourneyRail'
import { journeyStopsFor } from './studyJourneyUtil'

/**
 * THE COURSE AND ITS COURSEWORK, AS ONE CARD — Testing 3, 2026-10-01.
 *
 * ⚠ A FORK OF `CourseEntryCard`, NOT A MODE OF IT. That file is untouched and
 * still what every other version renders; this one is Testing 3's in full.
 * CLAUDE.md's rule for changing something that already exists, and the reason
 * the two can be held side by side rather than one replaced on a hunch.
 *
 * ⚠ FORK THE LAYOUT, IMPORT THE DATA — the other half of that rule, and the
 * part that is easy to get wrong. The coursework half is `StudyJourneyRail`
 * ITSELF, rendered inside this card rather than redrawn: the stops, their
 * statuses, the counts and the View All route all come from the same component
 * the Study Journey column uses. If the two duplicated that list, the
 * comparison would stop being about the combination and start being about
 * which copy was updated last.
 *
 * THE ARGUMENT. "Current course" and "Complete coursework" are the same subject
 * in two columns. Both name the course; both say how far through it the learner
 * is — one as a percentage and a bar, the other as six stops with ticks. A
 * learner reading down the page meets that progress twice in two shapes and has
 * to work out for themselves that they agree. This says it once: identity and
 * the action at the top, then the stops that the percentage is made of.
 *
 * ⚠ THE NUMBERING IS SETTLED: THIS BLOCK IS STEP 1 (2026-10-01, the direct
 * ask). The rail is given `stepRange` + `stepNumber={1}`, so its eyebrow reads
 * "Step 1 · Atlas Study Journey" and the journey column carries on at Step 2.
 *
 * It wrote a bare "Atlas Study Journey" for one build, which left the page
 * running: block (unnumbered), Step 2, Step 3, Step 4 — step 1 existing but
 * labelled nowhere. The other way out was renumbering the column 1-3, and that
 * says the journey HAS three steps, which is a different claim about the
 * product. The coursework did not stop being step 1; it moved.
 *
 * ⚠ SO THE NUMBERS NOW SPAN TWO COLUMNS, which is this version's real cost and
 * the thing to judge: 1 is in the left column inside the combined block, and
 * 2-4 are cards down the right. They read in order going down the page, but
 * they are not in one line of sight.
 */
export function CombinedCourseCard({
  courseTitle,
  cover,
  percent,
  stats,
  lessonsCompleted,
  complete = false,
  showDetails = false,
  path,
  onResume,
  onDetails,
  onOpenStop,
  onViewAll,
}: {
  courseTitle: string
  cover?: string | null
  percent: number
  stats: { value: string; caption: string }[]
  lessonsCompleted: number
  complete?: boolean
  showDetails?: boolean
  /** The journey the coursework half draws. Same object the Study Journey
   *  column is given, so the two cannot describe different coursework. */
  path: LearningPathSummary
  onResume?: () => void
  onDetails?: () => void
  onOpenStop?: (id: string) => void
  onViewAll?: () => void
}) {
  const pct = Math.max(0, Math.min(100, percent))
  const showPercent = pct > 0

  /*
   * WHERE THE LESSON LINE GOES — 2026-10-01, the direct ask: "move the lesson
   * section to be within the complete coursework, under the pre-licensing
   * lessons to better indicate where the user is".
   *
   * ⚠ UNDER THE CURRENT STOP, NOT UNDER A NAMED ONE. The ask says
   * "pre-licensing lessons" because that is the stop the demo learner is on;
   * what it asks FOR is "where the user is". Hard-coding the first stop's id
   * would be right today and wrong the moment the learner finishes it — the
   * lesson line would sit under a ticked step while the live one sat below it,
   * which is the opposite of what this move is for. The stop id is not a stable
   * literal anyway: it is spread from the requirement category.
   *
   * ⚠ AND IT FALLS BACK RATHER THAN DISAPPEARING. With the coursework finished
   * there IS no current stop (`findIndex` returns -1), and Resume lives inside
   * this block — so nesting unconditionally would delete the card's primary
   * action on exactly the learner who has a course to review. The same
   * `findIndex` the rail uses, so the two cannot disagree about which stop is
   * live.
   */
  const stops = journeyStopsFor(path)
  const currentStopIndex = stops.findIndex((st) => st.status !== 'completed')
  const nestLesson = !complete && currentStopIndex >= 0

  /* LO-FI — the shell stays, the detail goes, and the shell is now TALLER
     because this card carries two halves. Six rows rather than four, so the
     placeholder still reads as this card's template rather than as the one it
     forked from. */
  const { loFi } = useLoFi()
  if (loFi) {
    return (
      <section aria-label="Current course" style={card}>
        <LoFiWidgetBody rows={6} showCta ariaLabel="Lo-fi current course card" />
      </section>
    )
  }

  const lessonBlock = (
    <div style={lessonRow}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {complete ? (
          <p style={lessonTitle}>All coursework complete</p>
        ) : (
          <>
            <p style={lessonMeta}>
              Lesson {lessonsCompleted + 1}
              <span aria-hidden style={dot} />
              {/* ⚠ INVENTED, and named as such at its source. See
                  `NY_LH_LESSON_MINUTES_INVENTED`. */}
              <span style={estimate}>About {NY_LH_LESSON_MINUTES_INVENTED} minutes</span>
            </p>
            <h3 style={lessonTitle}>{NY_LH_CURRENT_CHAPTER}</h3>
          </>
        )}
      </div>
      <button type="button" data-cta-id="home.resume" onClick={onResume} style={cta}>
        {complete ? 'Review course' : lessonsCompleted > 0 ? 'Resume' : 'Start course'}{' '}
        <ArrowRight size={16} aria-hidden />
      </button>
    </div>
  )

  return (
    /* ⚠ STILL `aria-label="Current course"`. The combined block is reached by
       that name in five suites and by anyone scanning with a screen reader;
       renaming it would be a second change riding along with this one. What it
       CONTAINS has grown — the name for the thing has not. */
    <section aria-label="Current course" style={card}>
      <div style={topRow}>
        {cover ? <img src={cover} alt="" aria-hidden style={coverStyle} /> : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="cre-eyebrow-ink" style={eyebrow}>
            Current course
          </p>
          <h2 style={title}>{courseTitle}</h2>

          <div aria-hidden style={track}>
            <div style={{ ...fill, width: `${pct}%` }} />
          </div>

          <div style={metaRow}>
            <div style={metaLeft}>
              {showPercent && (
                <span style={figureWrap}>
                  <span style={figure}>{Math.round(pct)}</span>
                  <span style={figureUnit}>%</span>
                </span>
              )}
              <div style={{ ...statCluster, ...(showPercent ? withRule : null) }}>
                {stats.map((s) => (
                  <span key={s.caption} style={statPair}>
                    <span style={statValue}>{s.value}</span>
                    <span style={statCaption}>{s.caption}</span>
                  </span>
                ))}
              </div>
            </div>
            {showDetails && (
              <button type="button" onClick={onDetails} style={detailsLink}>
                Details <ArrowRight size={13} aria-hidden />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ⚠ THE LESSON BLOCK IS THE SAME MARKUP IN BOTH POSITIONS, built once
          here and placed by `nestLesson`. Two copies — one for the band, one
          for the slot — is how the nested one would quietly stop matching the
          flat one. */}
      {nestLesson ? null : (
        <>
          <div aria-hidden style={divider} />
          {lessonBlock}
        </>
      )}

      {/* ── THE COURSEWORK HALF ────────────────────────────────────────────
          A HAIRLINE, the same one the card already uses between its halves, so
          none of the bands reads as a card stapled to another.

          ⚠ `onViewAll` IS PASSED THROUGH, so View All still leaves for the full
          Learning Path. The combined block absorbs the coursework SUMMARY, not
          the page behind it — dropping that route would quietly make this the
          only view of the stops.

          ⚠ `stopDetail` IS WHAT PUTS THE LEARNER IN THE LIST. It hangs the
          lesson line and Resume under the stop that is actually live, so the
          card says which step you are on AND where you are inside it, in one
          place rather than as two facts the reader has to join up. */}
      <div aria-hidden style={divider} />
      <StudyJourneyRail
        path={path}
        onOpenStop={onOpenStop}
        onViewAll={onViewAll}
        /* "Step 1 · Atlas Study Journey" — 2026-10-01, the direct ask, and it
           SETTLES the numbering seam this card opened.
        
           The combined block IS step 1. It read a bare "Atlas Study Journey"
           for one build, which left the page running: block (unnumbered), Step
           2, Step 3, Step 4 — step 1 existing but labelled nowhere. The other
           way out was renumbering the column 1-3, and that says the journey HAS
           three steps, which is a different claim about the product. The
           coursework did not stop being step 1; it moved.
        
           ⚠ THE EYEBROW SITS INSIDE THE BLOCK, NOT ON IT, so the number lands
           on the coursework half rather than on the card as a whole. That is
           the honest placement: the course identity above it is not a step, it
           is what all four steps are about. */
        stepRange
        stepNumber={1}
        stopDetail={
          nestLesson
            ? (_id, { isCurrent }) => (isCurrent ? <div style={nestedLesson}>{lessonBlock}</div> : null)
            : undefined
        }
      />
    </section>
  )
}

/* The nested lesson block — recessed by INDENT ALONE, so it reads as the inside
   of the step above it rather than as a sixth stop in the list.

   ⚠ IT CARRIED A LEFT RULE FOR ONE BUILD, and that was wrong on screen: the
   rail's own spine runs down this column already, so the rule rendered as a
   SECOND vertical line 24px to its right — two parallel rails saying one thing.
   Measured, not guessed (spine at x=97, rule at x=121). The spine is what ties
   this block to its step; indentation is all that is left to say.

   ⚠ The `marginBottom` is what keeps the next stop from crowding it; the
   spine's `flex: 1` stretches over the whole thing on its own. */
const nestedLesson: CSSProperties = {
  margin: '2px 0 14px',
  padding: '8px 0 2px',
}

/* ─── styles ──────────────────────────────────────────────────────────── */

const card: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-primary-100)',
  /* 4 — `--radius-sm`, matching the Study Journey and Schedule State Exam
     cards beside it (2026-09-28, the direct ask). The token, not a literal. */
  borderRadius: 'var(--radius-sm)',
  padding: 20,
  minWidth: 0,
}

const topRow: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 16, minWidth: 0 }

const coverStyle: CSSProperties = {
  width: 104,
  alignSelf: 'stretch',
  height: 'auto',
  flex: 'none',
  /* The same two diagonally-opposite corners the split header rounds. */
  borderRadius: '0 var(--radius-md) 0 var(--radius-md)',
  objectFit: 'cover',
  display: 'block',
}

const eyebrow: CSSProperties = {
  margin: '0 0 6px',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const title: CSSProperties = {
  margin: 0,
  minWidth: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 26,
  lineHeight: 1.15,
  color: 'var(--color-text-primary)',
}

const track: CSSProperties = {
  marginTop: 12,
  width: '100%',
  height: 8,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-neutral-300)',
  overflow: 'hidden',
}

const fill: CSSProperties = {
  height: '100%',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-primary-500)',
}

/* ⚠ `nowrap`. With `wrap` the Details link was the thing that gave way and
   dropped BELOW the stats, left-aligned under the figure — which reads as a
   stray link rather than as the row's action. The stat cluster wraps internally
   instead, so the row keeps its shape and Details stays where the split header
   puts it. */
const metaRow: CSSProperties = {
  marginTop: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 20,
  flexWrap: 'nowrap',
}

const metaLeft: CSSProperties = { display: 'flex', alignItems: 'center', gap: 15, minWidth: 0 }

const figureWrap: CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 2, flexShrink: 0 }

const figure: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 30,
  lineHeight: 1,
  color: 'var(--color-text-primary)',
}

const figureUnit: CSSProperties = { ...figure, fontSize: 16 }

const statCluster: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 18,
  flexWrap: 'wrap',
  minWidth: 0,
}

/* ⚠ `--color-neutral-300`, NOT `--color-border-subtle`: the subtle token reads
   1.29:1 light and 1.38:1 dark, i.e. a rule that disappears in one theme. The
   split header's own note records the same decision. */
const withRule: CSSProperties = {
  borderLeft: '1px solid var(--color-neutral-300)',
  paddingLeft: 15,
}

const statPair: CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 6 }

const statValue: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
}

const statCaption: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}

const detailsLink: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: 0,
  border: 0,
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-primary-600)',
  flexShrink: 0,
}

const divider: CSSProperties = {
  margin: '18px 0',
  height: 1,
  background: 'var(--color-primary-100)',
}

const lessonRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }

const lessonMeta: CSSProperties = {
  margin: '0 0 4px',
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const dot: CSSProperties = {
  display: 'inline-block',
  width: 3,
  height: 3,
  borderRadius: '50%',
  margin: '0 8px',
  verticalAlign: 'middle',
  background: 'var(--color-neutral-300)',
}

/** Quieter than the lesson line: a note about the work, not a name for it. */
const estimate: CSSProperties = { fontWeight: 400, letterSpacing: '0.04em', textTransform: 'none' }

const lessonTitle: CSSProperties = {
  margin: 0,
  /* ⚠ BODY FACE, not `--font-heading`: the `dashboard-heading-font` variant
     re-points the heading token at a serif, and a chapter name is a row label
     rather than a heading. `JumpBackInWidget` makes the same call. */
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 15,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const cta: CSSProperties = {
  flexShrink: 0,
  padding: '0 20px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  height: 44,
  borderRadius: 'var(--radius-md)',
  border: 0,
  cursor: 'pointer',
  background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))',
  color: 'rgb(255 255 255 / 1)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 14,
}
