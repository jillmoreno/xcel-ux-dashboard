import type { CSSProperties } from 'react'
import { ArrowRight, BookOpenThin } from '@/icons'
import type { CourseCardData } from '@/components/courses/CourseCard'
import { widgetCardRuledStyle, widgetEyebrowStyle } from './widgetStyles'
import { NY_LH_LESSON_PARTS, NY_LH_LESSON_MINUTES_INVENTED } from '@/data/nyProducerRequirements'

/**
 * JUMP BACK IN — the resume card, as its own widget (2026-09-16).
 *
 * Cover, course title, meta line, progress bar and the Resume CTA. Sits ABOVE
 * the Study Journey in the QE Focused version's right column, at the same width.
 *
 * ── Why it is separate from the Study Journey ────────────────────────────
 *
 * It was the top third of `StudyJourneyWidget`, under a rule. Two reasons it
 * earned its own card:
 *
 *   - **Different question.** "Carry on where you left off" is one action on one
 *     course. The journey is the whole programme's shape. Sharing a card implied
 *     the resume block was the journey's header, which it is not — the journey
 *     stands on its own and the resume course is simply the stop you are on.
 *   - **It had no label.** Every other block on this version carries an eyebrow
 *     (Current Learning Progress, Study Journey, Get Licensed); this one was the
 *     untitled thing at the top of a titled card. It has "Jump Back In" now, in
 *     the shared `widgetEyebrowStyle`, so the four read at one level.
 *
 * ── What it deliberately does NOT own ───────────────────────────────────
 *
 * The course is passed in and launching is a callback — no `useCourseLauncher`,
 * no fixture import. Two components resolving "the course to resume" is how they
 * end up disagreeing, which is the fork `displayedProgressPct` was extracted to
 * close. `LearnerFocusedBand` picks the course from the persona and owns the
 * launcher.
 */
export function JumpBackInWidget({
  course,
  chapterNumber,
  partNumber,
  chapterTitle,
  complete = false,
  onResume,
}: {
  /** The course to resume. Absent → the widget renders nothing; the Study
   *  Journey below still stands on its own. */
  course?: CourseCardData
  /** Which chapter the learner is on. Derived by the caller from progress. */
  chapterNumber?: number
  /** Which part of XCEL's published 3-Part Training Program this is. Derived by
   *  the caller from which category it is working through. */
  partNumber?: number
  /** That chapter's title, from `NY_LH_CURRENT_CHAPTER`. */
  chapterTitle?: string
  /**
   * The coursework is finished — 2026-09-21, the direct ask. The card becomes a
   * door back into material already covered: "Review Course Material", one CTA,
   * and a line saying what was completed. The lesson and the chapter title go,
   * because neither answers anything at 100% — there is no lesson you are ON,
   * and the header band names the course.
   */
  complete?: boolean
  onResume?: (courseId: string) => void
}) {
  if (!course) return null
  /* NOTHING STARTED YET — 2026-09-21, three direct asks on the 0% state.
     "Jump Back In", "Resume" and a hidden lesson line all assume there is a
     place to jump back TO. At 0% there is not: the card is the first thing the
     learner does, and naming it as a return trip is the product describing a
     history they do not have.

     Read off the COURSE rather than taken as a prop: the widget already has the
     record, and a `started` boolean threaded in beside a `course` that already
     answers the question is a second source for one fact. */
  const started = (course.progress ?? 0) > 0
  return (
    /* THE LANDMARK NAME FOLLOWS THE VISIBLE ONE. This repo's own rule, from the
       Get Licensed arrival card: "a region announced as 'Apply for your
       License' while reading 'Get Licensed in New York' is the 'Dash Dashboard'
       defect in miniature." A card reading "Let's get started" must not
       announce itself as "Jump back in". */
    <section
      aria-label={complete ? 'Review course material' : started ? 'Jump back in' : 'Let’s get started'}
      style={widgetCardRuledStyle}
    >
      {/* The SHARED eyebrow type — same face, size, weight and tracking as the
          Study Journey's, which is what "match the Study Journey font" asked
          for — with the INK resolved for this surface.

          `widgetEyebrowStyle` is tertiary, which is correct at 6.19:1 on the
          Study Journey's white card. This card is a tinted recess, and darkening
          it put tertiary at 3.83:1 — under AA for 10px text. Secondary holds
          4.6:1 on the new fill.

          Type shared, ink per surface, is the split this repo already makes with
          `cText` / `cMuted` in the band: a colour that is right on one ground is
          not a property of the type. */}
      {/* THE ACTION SITS TOP-RIGHT, on the eyebrow's line — 2026-09-17, the
          direct ask. It has now been under the block, then beside the title,
          then here; what the last move buys is that the title column gets the
          card's full width back, so a long chapter name wraps to two lines
          instead of three.

          `align-items: center` rather than baseline: the eyebrow is 10px and
          the button is 44px tall, so a shared baseline would hang the label off
          the top of the button. */}
      {/* THE GLYPH IS IN THE EYEBROW as of 2026-09-17 (the direct ask), at the
          13px the Study Pace and Readiness tiles set theirs — those sit
          directly below this card in the same column, so one eyebrow shape
          across the three is what makes them read as a set.

          It replaces the 34px book in a 44px well beside the title. That well
          was also the landing slot for `JUMP_BACK_IN_MARK`, the supplied
          compass-rose artwork, so removing it retires that path too — see the
          note at the foot of this file. */}
      <p
        className="cre-eyebrow-ink"
        style={{ ...widgetEyebrowStyle, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}
      >
        <BookOpenThin size={13} />
        {complete
          ? 'Review Course Material'
          : started
            ? 'Learning With Compass - Jump Back In'
            : 'Let’s get started'}
      </p>

      {/* The action sits on the TITLE'S line (2026-09-17, the direct ask), so
          the row is the text column and the button centred against it. It has
          been under the block, beside the title, top-right and at the foot; what
          `align-items: center` buys over those is that the button tracks the
          title as the title wraps, instead of pinning to the card's top or
          bottom edge and drifting away from what it acts on. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
          {/* AT 100% THE LESSON, THE TITLE AND THE ESTIMATE ALL GO — the direct
              ask. None of them answers anything once the coursework is done:
              there is no lesson you are ON, the header band already names the
              course, and an estimate to complete something already complete is
              a figure with nothing behind it.

              What replaces them is the COMPLETION LINE, which is the one fact
              this card can still state. It counts the journey's own coursework
              stops rather than re-deriving a total, so it cannot disagree with
              the column beside it. */}
          {complete ? (
            <p style={courseTitleStyle}>All coursework complete</p>
          ) : (
            <>
              {chapterNumber != null ? (
                <p style={chapterEyebrowStyle}>
                  Lesson {chapterNumber}
                  {partNumber != null ? (
                    <>
                      {/* The same 3px round dot the page header's meta line and
                          its stat row use — one separator on this page, not a
                          third kind three inches from the other two. */}
                      <span aria-hidden style={dotStyle} />
                      Part {partNumber} of {NY_LH_LESSON_PARTS}
                    </>
                  ) : null}
                </p>
              ) : null}
              {/* The title comes from `NY_LH_GUIDE_CHAPTERS_PARTIAL` — a chapter
                  XCEL's own linked study guide publishes — rather than from copy
                  written to fill this card. */}
              <h3 style={courseTitleStyle}>{chapterTitle ?? course.title}</h3>
              {/* ESTIMATED TIME — 2026-09-17, the direct ask, and the figure is
                  INVENTED. See `NY_LH_LESSON_MINUTES_INVENTED`: nothing in the
                  fixtures knows a lesson's length, and this version refused the
                  reference mock's "· 14 minutes left" three times on exactly
                  that ground. It is here because it was asked for, it reads from
                  a constant whose name says what it is, and the tests that used
                  to forbid the copy now pin it to that constant instead. */}
              <p style={estimateStyle}>
                Estimated Time to Complete: {NY_LH_LESSON_MINUTES_INVENTED} minutes
              </p>
            </>
          )}
      </div>
      {/* 44px stays 44px — the minimum comfortable touch target. `flexShrink: 0`
          so the title column gives way first; the reverse would break "Resume"
          onto two lines, which is the one thing here that must stay one tap. */}
      <button type="button" onClick={() => onResume?.(course.id)} style={ctaStyle}>
        {complete ? 'Review course' : started ? 'Resume' : 'Start course'} <ArrowRight size={16} />
      </button>
      </div>


    </section>
  )
}

/* ─── styles ──────────────────────────────────────────────────────────── */

const courseTitleStyle: CSSProperties = {
  margin: 0,
  /* `--font-body` (Open Sans) as of 2026-09-17, the direct ask — not
     `--font-heading`, which the `dashboard-heading-font` variant re-points to a
     serif. The chapter name is a row label like the journey's stop titles, and
     those moved to the body face on the same grounds: the serif belongs to the
     things that are headings. Under the serif variant this card was the one
     block setting a chapter name in Georgia. */
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 15,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

/** The chapter number, over its title — the same small-caps label the rest of
 *  this version uses for a field name. */
const dotStyle: CSSProperties = {
  display: 'inline-block',
  width: 3,
  height: 3,
  borderRadius: '50%',
  margin: '0 8px',
  verticalAlign: 'middle',
  background: 'var(--color-neutral-300)',
}

/** The estimate under the title. Quieter than the chapter line above it: it is
 *  a note about the work rather than a name for it. */
const estimateStyle: CSSProperties = {
  margin: '4px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '16px',
  color: 'var(--color-text-secondary)',
}

const chapterEyebrowStyle: CSSProperties = {
  margin: '0 0 3px',
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

/**
 * The square brand-style mark this card leads with. **NOT IN THE REPO.**
 *
 * Authored ahead of the artwork on purpose — the `<img onError>` beside it
 * falls back to a registry glyph, so the card is correct either way and
 * dropping the file in finishes it with no code change. That fallback is the
 * ONLY reason a path to a missing file is allowed here.
 *
 * `public/brand/` is where it goes, beside `xcel-logo.webp`. Change the
 * extension here if the export is a png or webp rather than an svg.
 *
 * NOTE ON COLOUR: the supplied mark is RED on a peach ground. "Blue themed" is
 * carried by the WELL below, which tints from the primary ramp — the artwork
 * itself is not recoloured here, because approximating brand artwork in code is
 * the thing `Logo`'s own note refuses ("do NOT recolour the full-colour file to
 * approximate it"). If a blue export exists, it supersedes this path.
 */
export const JUMP_BACK_IN_MARK = '/brand/xcel-mark.svg'

/* `markStyle` and `iconWellStyle` went on 2026-09-17 with the 44px well they
   dressed — see the note at the eyebrow. `JUMP_BACK_IN_MARK` above no longer
   has a call site: it is kept because the artwork it points at is still the
   thing to drop in, and giving it a home again is one `<img>`. */

/* THE PROGRESS BAR LEFT THIS CARD on 2026-09-17, and with it
   `PROGRESS_BAR_HEIGHT` (4), `progressTrackStyle` and `progressFillStyle`.
   The header band directly above runs a full-width bar for the same course
   with the percentage beside it, so this was the third saying of one number in
   one column. `.cre-jbi-progress-fill` in tokens.css now has no call site —
   left in place, because it is one line and re-adding a bar here is what would
   want it back. Its own note records why it exists: on the recessed card the
   track and `--color-primary-500` are both navies in dark, which left the fill
   at 1.22:1 until the class swapped it to the light stop. */

// Light navy, matching the Current Learning Progress block's ink — see the note
// in `tokens.css` on `.cre-cta-ink` for why the CTA ramp is not used here.
const ctaStyle: CSSProperties = {
  /* NO `marginTop` and no `alignSelf` any more: the button is a child of the
     content ROW now rather than a block stacked under it, so the row's
     `align-items: center` places it and the card's column no longer stretches
     it. Both were doing the job this restructure does properly. */
  flexShrink: 0,
  /* IT HAD NONE. The button carried `height: 44` and no horizontal padding at
     all, so the label sat hard against both edges — invisible while the label
     was two short words and obvious the moment it became four. 20 rather than
     the 18 the inline button it replaced used: this label is materially longer,
     and the well beside it is 44px, so the button reads better with a touch
     more air than a bare minimum. */
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

/*
 * THE COMPASS, and why there is no longer a stand-in for it.
 *
 * A compass was asked for on 2026-09-17 and none is vendored — `src/icons/` is
 * 116 Font Awesome 7 Pro Light files and has no `compass.svg`. This repo's rule
 * for a missing glyph is explicit (vendor the file, never hand-author the
 * path), so the fallback ran as `LifeRing` for part of a day: a ring with four
 * spokes, the nearest thing in the set to a compass rose, with its name and its
 * picture disagreeing.
 *
 * That compromise is GONE. The ask moved to a light open book, and
 * `BookOpenThin` is a real registry glyph at the right weight — so the card now
 * carries an icon that means what it is called.
 *
 * If a compass is wanted again: drop `compass.svg` (FA 7 light, matching the
 * ~70 others) into `src/icons/`, add the two lines every icon has in
 * `src/icons/index.tsx`, and change one import. Note too that the supplied
 * `JUMP_BACK_IN_MARK` artwork is itself a four-pointed compass-rose mark, so
 * landing that file answers it without touching the registry at all.
 */
