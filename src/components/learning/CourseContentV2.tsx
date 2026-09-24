import { useEffect, type CSSProperties } from 'react'
import { ArrowLeft, ArrowRight, CalendarDay, FileText, Plus, RubiLogo, Sun, X } from '@/icons'
import { Logo } from '@/components/brand/Logo'
import { readExamDate } from '@/data/examDateStore'
import { daysUntil, formatPaceDate } from '@/lib/studyPace'
import { FIXTURE_TODAY } from '@/data/myCoursesFixtures'
import { setCourseChrome } from './courseTakeover'
import { CompassContents, RubiAside } from './CompassCoursePlayer'

/**
 * OPTION 2's COURSE PAGE — `dashboard-navigation: option-2`, 2026-09-23.
 *
 * ⚠ A FULL-SCREEN TAKEOVER, and that is a change of shape from this file's
 * first build. It started as Option 2's course BODY only, sharing the player's
 * shell — sidebar, breadcrumb, app header — on the argument that an A/B whose
 * arms differ in a dozen untracked places cannot attribute anything a
 * participant says. The direct ask overrode it: "the navigation is going to
 * change drastically", and the new header carries the course and section
 * naming that the breadcrumb and the app header were carrying.
 *
 * SO OPTION 2 IS NOW A SEPARATE PAGE, not a variant body, and the comparison
 * it supports changed with it: the two arms differ in their whole navigation,
 * which is the thing being tested rather than a confound. `PlatformShell`
 * branches between them at the launcher.
 *
 * ⚠ IT SUPPRESSES THE APP HEADER while mounted — `courseTakeover`. Without it
 * there are two XCEL logos stacked, which reads as broken rather than as a
 * variant.
 *
 * WHAT IS WIRED: ✕ (closes the course). Everything else in the header — the
 * exam-date pill, + Demo, the brightness glyph, Notes, Rubi — renders and does
 * nothing yet, awaiting the icon spec. They are deliberately NOT `<button>`s
 * for that reason: this player's rule throughout is that a control which looks
 * pressable and is not is what gets reported as broken.
 *
 * ⚠ THE NAMES ARE THE DEMO'S OWN, not the mock's. The design draws
 * "Life & Health · Life insurance policy types"; this renders the course and
 * chapter the rest of the session names — the sidebar in Option 1, the
 * dashboard behind it, the Study Journey. A participant who meets two
 * different course names in one sitting stops believing both.
 */
export function CourseContentV2({
  courseTitle,
  chapterTitle,
  percentComplete,
  completedLessons,
  totalLessons,
  onClose,
}: {
  /** The learner's course — the persona's own title, as the dashboard states it. */
  courseTitle: string
  /** The current chapter, named in the header and above the progress track. */
  chapterTitle: string
  /** 0–100, drawn as the section track and printed beside it. */
  percentComplete: number
  /** The TOC's "Completed N of M", both halves. */
  completedLessons: number
  totalLessons: number
  /** Leave the course. The ✕ — the one wired control in this header. */
  onClose: () => void
}) {
  useEffect(() => {
    setCourseChrome('takeover')
    return () => setCourseChrome('none')
  }, [])

  /* THE EXAM DATE THE LEARNER ACTUALLY BOOKED, from the same store the
     Schedule State Exam card writes. The mock draws "Aug 14, 2026 · 8 days
     out"; hard-coding that would put a specific false date on screen, which is
     the one thing this repo's fixtures are careful never to do. With no date
     booked the pill says so — it is the honest half of the same control. */
  const examIso = readExamDate()
  const examOut = examIso ? daysUntil(examIso, FIXTURE_TODAY) : null

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div style={headerRowStyle}>
          <div style={identityStyle}>
            <Logo height={30} />
            <span style={wordmarkStyle}>Compass</span>
            <span aria-hidden style={dividerStyle} />
            {/* COURSE THEN SECTION, weighted apart rather than separated only
                by a dot: the section is where the learner is and the course is
                the context for it, so the emphasis does the work the mock's
                bolding does. */}
            <p style={crumbStyle}>
              <span style={crumbCourseStyle}>{courseTitle}</span>
              <span aria-hidden style={crumbDotStyle}>
                ·
              </span>
              <span style={crumbSectionStyle}>{chapterTitle}</span>
            </p>
          </div>

          <div style={headerActionsStyle}>
            <span style={datePillStyle}>
              <CalendarDay size={14} aria-hidden />
              {examIso ? (
                <>
                  {formatPaceDate(examIso)}
                  {examOut != null ? (
                    <span style={datePillMutedStyle}>· {examOut} days out</span>
                  ) : null}
                </>
              ) : (
                <span style={datePillMutedStyle}>No exam date yet</span>
              )}
            </span>
            <span style={demoPillStyle}>
              <Plus size={13} aria-hidden />
              Demo
            </span>
            <span style={glyphStyle} aria-hidden>
              <Sun size={15} />
            </span>
            <button type="button" onClick={onClose} aria-label="Close the course" style={closeStyle}>
              <X size={15} aria-hidden />
            </button>
          </div>
        </div>

        {/* THE SECTION TRACK — read-only, by the ask. The handle marks where
            the learner is; it does not drag. There is nothing for a dragged
            position to mean while the body below is a placeholder block, and a
            handle that moves without moving anything is the "looks pressable,
            is not" failure the rest of this page avoids. */}
        <div style={progressRowStyle}>
          <div style={progressTrackWrapStyle}>
            <p style={progressLabelStyle}>{chapterTitle}</p>
            <div style={progressTrackStyle}>
              <span
                aria-hidden
                style={{ ...progressHandleStyle, left: `${Math.min(100, Math.max(0, percentComplete))}%` }}
              />
              <span
                aria-hidden
                style={{ ...progressFillStyle, width: `${Math.min(100, Math.max(0, percentComplete))}%` }}
              />
            </div>
            <p style={progressPctStyle}>{Math.round(percentComplete)}%</p>
          </div>
          <div style={progressActionsStyle}>
            <span style={notesPillStyle}>
              <FileText size={14} aria-hidden />
              Notes
              <span style={notesCountStyle}>0</span>
            </span>
            <span style={rubiPillStyle}>
              <RubiLogo size={14} aria-hidden />
              Rubi
            </span>
          </div>
        </div>
      </header>

      <div style={bodyStyle}>
        {/*
          THE SIMPLIFIED TOC — 2026-09-23, the direct ask: "we still need this
          to be part of option 2 — a simplified left TOC".

          WHAT "SIMPLIFIED" MEANS HERE, and it is not a style choice: Option 1's
          sidebar carries the course title, a progress bar, the percentage, the
          Home / Overview / Course breadcrumb and the eight-page rail. Four of
          those are now in this page's HEADER — the course, the section, the
          track and the percent — so repeating them a few pixels below would be
          the same facts twice, which is the thing a navigation redesign is
          usually trying to fix. The rail and the breadcrumb go because this
          page has neither.

          WHAT IS LEFT is the part the header cannot carry: which lessons there
          are, which one you are on, and how many are done. `CompassContents`
          is shared rather than copied — see its own note: both arms must list
          the same 42 lessons or the A/B compares two syllabuses.
        */}
        <aside style={tocStyle} aria-label="Course contents">
          <p style={tocCaptionStyle}>Course Content</p>
          <CompassContents completedLessons={completedLessons} totalLessons={totalLessons} />
        </aside>
        <div style={columnStyle}>
          <main style={mainStyle}>
            {/* THE PLACEHOLDER IS THE DESIGN, the same position Option 1 takes:
                the courseware is Compass's, served into this frame, and neither
                the mock nor this repo has it. */}
            <div style={cardStyle}>
              <p style={captionStyle}>Course Content</p>
              <div aria-hidden style={blockStyle} />
            </div>
          </main>
          <footer style={footerStyle}>
            <span style={prevStyle}>
              <ArrowLeft size={16} aria-hidden />
              Previous
            </span>
            <span style={nextStyle}>
              Next
              <ArrowRight size={16} aria-hidden />
            </span>
          </footer>
        </div>
        <RubiAside />
      </div>
    </div>
  )
}

/* ─── Option 2's own layout ────────────────────────────────────────────────
   Owned here rather than imported: Option 2 exists to be changed freely, and
   shared constants would mean every edit here silently moved Option 1 too —
   the one failure that would invalidate the comparison mid-test. */

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  background: 'var(--color-surface-card)',
}

const headerStyle: CSSProperties = {
  flexShrink: 0,
  background: 'var(--color-surface-card)',
  borderBottom: '1px solid var(--compass-rule)',
}

const headerRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 24,
  height: 64,
  padding: '0 24px',
  borderBottom: '1px solid var(--compass-rule)',
}

const identityStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
}

const wordmarkStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: '-0.01em',
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
}

const dividerStyle: CSSProperties = {
  width: 1,
  height: 26,
  flexShrink: 0,
  background: 'var(--compass-edge)',
}

const crumbStyle: CSSProperties = {
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  minWidth: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  overflow: 'hidden',
}

/*
 * ⚠ THE EMPHASIS INVERTED — 2026-09-23. The COURSE is the serif, bold half and
 * the SECTION is regular body text; it was the other way round, matching the
 * mock's bolded section.
 *
 * The comment that stood here argued the old arrangement: "the section is
 * where the learner is and the course is the context for it, so the emphasis
 * does the work the mock's bolding does." The ask reversed it, and the reading
 * that makes sense of the new order is the masthead one — the course is the
 * PRODUCT's name in this header, sitting beside "Compass" as part of the
 * identity, and the section is a location within it. The section still has the
 * progress row directly beneath naming it a second time, so it is not lost by
 * being set in plain body text.
 */
const crumbCourseStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
}

const crumbDotStyle: CSSProperties = { color: 'var(--color-text-tertiary)' }

const crumbSectionStyle: CSSProperties = {
  fontWeight: 400,
  color: 'var(--color-text-secondary)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const headerActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexShrink: 0,
}

const pillBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  height: 34,
  padding: '0 14px',
  borderRadius: 'var(--radius-pill)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

const datePillStyle: CSSProperties = {
  ...pillBase,
  border: '1px solid var(--compass-edge)',
  color: 'var(--color-text-primary)',
}

const datePillMutedStyle: CSSProperties = {
  color: 'var(--color-text-tertiary)',
  fontWeight: 500,
}

/* DASHED, as drawn — the mock's own way of saying this one adds something
   rather than reporting it. */
const demoPillStyle: CSSProperties = {
  ...pillBase,
  border: '1px dashed var(--compass-edge)',
  color: 'var(--color-text-secondary)',
}

const glyphBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 34,
  height: 34,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--compass-edge)',
  color: 'var(--color-text-primary)',
}

const glyphStyle: CSSProperties = glyphBase

const closeStyle: CSSProperties = {
  ...glyphBase,
  background: 'transparent',
  cursor: 'pointer',
}

const progressRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 24,
  minHeight: 56,
  padding: '8px 24px',
}

const progressTrackWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flex: 1,
  minWidth: 0,
  justifyContent: 'center',
}

const progressLabelStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 280,
}

const progressTrackStyle: CSSProperties = {
  position: 'relative',
  flex: 1,
  maxWidth: 420,
  height: 4,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--compass-rule)',
}

const progressFillStyle: CSSProperties = {
  position: 'absolute',
  insetInlineStart: 0,
  top: 0,
  height: '100%',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--compass-edge)',
}

const progressHandleStyle: CSSProperties = {
  position: 'absolute',
  top: '50%',
  width: 12,
  height: 12,
  marginInlineStart: -6,
  transform: 'translateY(-50%)',
  borderRadius: '50%',
  background: 'var(--color-surface-card)',
  border: '1.5px solid var(--color-text-primary)',
  zIndex: 1,
}

const progressPctStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
}

const progressActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexShrink: 0,
}

const notesPillStyle: CSSProperties = {
  ...pillBase,
  border: '1px solid var(--compass-edge)',
  color: 'var(--color-text-primary)',
}

const notesCountStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 18,
  height: 18,
  padding: '0 5px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--compass-content)',
  color: 'var(--color-text-secondary)',
  fontSize: 11,
  fontWeight: 700,
}

const rubiPillStyle: CSSProperties = {
  ...pillBase,
  border: '1px solid var(--compass-edge)',
  background: 'var(--compass-current)',
  color: 'var(--color-text-primary)',
}

const bodyStyle: CSSProperties = {
  display: 'flex',
  flex: 1,
  minHeight: 0,
}

/* 260px, matching Option 1 — the column width is not what the variant is
   about, and changing it would put a second difference into the comparison for
   no reason anyone could name afterwards. */
const tocStyle: CSSProperties = {
  width: 260,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '20px 20px 24px',
  overflowY: 'auto',
  background: 'var(--color-surface-card)',
  borderInlineEnd: '1px solid var(--compass-rule)',
}

const tocCaptionStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1.1,
  textTransform: 'uppercase',
  lineHeight: '16.5px',
  color: 'var(--color-text-primary)',
}

const columnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minWidth: 0,
  background: 'var(--compass-ground)',
}

const mainStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '100px 104px 56px',
  display: 'flex',
  justifyContent: 'center',
}

const cardStyle: CSSProperties = {
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

const captionStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 34,
  fontWeight: 500,
  letterSpacing: '-0.34px',
  lineHeight: '39px',
  textAlign: 'center',
  color: 'var(--compass-rule)',
}

const blockStyle: CSSProperties = {
  width: '100%',
  aspectRatio: '830 / 467',
  background: 'var(--compass-content)',
}

const footerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  height: 72,
  padding: '0 40px',
  background: 'var(--color-surface-card)',
  borderTop: '1px solid var(--compass-rule)',
  flexShrink: 0,
}

const footerButtonBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  height: 40,
  padding: '0 18px',
  borderRadius: 'var(--radius-pill)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
}

const prevStyle: CSSProperties = {
  ...footerButtonBase,
  background: 'var(--color-surface-card)',
  border: '1px solid var(--compass-edge)',
  color: 'var(--color-text-primary)',
  opacity: 0.4,
}

const nextStyle: CSSProperties = {
  ...footerButtonBase,
  background: 'var(--color-primary-500)',
  border: '1px solid var(--color-primary-700)',
  color: 'var(--color-text-inverse)',
}
