/*
 * JILL/ATLAS-MAIN — 2026-10-20, Jillienne: "an exact copy of what the atlas
 * home is looking like on Main so I can implement these changes to that
 * version to explore first".
 *
 * ⚠ THIS FILE IS A VERBATIM COPY of `AtlasHomeEricE2E.tsx` at `8f5f294`, the
 * tip of `main` the day it was taken, with TWO symbols renamed and nothing
 * else touched. The diff against that commit's copy should stay empty until
 * the exploration actually changes something — which is what makes it a
 * baseline rather than a second opinion about what the Home already is.
 *
 * WHY A FORK AND NOT A FLAG. CLAUDE.md's rule for changing something that
 * exists: copy it to a sibling and let the call site choose, so the original
 * cannot conflict with whoever else is editing it. `HybridPacingHome.tsx` is
 * the worked precedent — a copy of Hybrid V1 made so that V1, the baseline a
 * stakeholder lands on, could not move while pacing was explored. Same shape,
 * one generation on: the End-to-End Demo is the baseline now, and the subject
 * is the exam-date logic.
 *
 * ⚠ EVERYTHING EXCEPT THE HOME IS ERIC'S, DELIBERATELY. `jill-atlas-main`
 * answers true to `isEricAtlasWhiteLike` and `isAtlasCompassNavVersion`, wears
 * `ATLAS_HEADER_V2_VERSIONS`' header, and carries every design control scoped
 * to `eric-atlas-e2e` — see `isE2ELikeVersion` in `dashboardVersions.ts`. So a
 * comparison between the two versions is about the Home and nothing else, and
 * a control Eric adds to the End-to-End Demo tomorrow reaches this copy
 * without a second edit.
 *
 * ⚠ THE FIRST THING THIS EXPLORATION WILL WANT is the line the fix of
 * 2026-10-20 left: `examDate: undefined` in the `studyPace` call below. On
 * `main` the Home refuses the stored exam date because it owns neither prompt.
 * Wiring Add Date HERE is what earns the date back — pass `examDate` through,
 * restore it to the destructure and the `useMemo` deps, and give the card a
 * way to clear it. The long note at that call says the rest.
 */
/*
 * END-TO-END DEMO'S HOME — 2026-10-14, Eric's request ("Duplicate the white
 * version and create a new version called End-to-End Demo"). A copy of
 * `AtlasHomeEricV3.tsx` that day, which WIP and White both render, so this
 * demo's Home can change without changing either. Its WIP branches (the
 * `onWhite` false sides) are carried over unchanged and never taken here.
 */
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { isEricAtlasWhiteLike, resolveDashboardVersion } from '@/data/dashboardVersions'
import {
  useBeginOpensCompassSession,
  useCourseOverviewOpensCompass,
  useDashboardCourseTitle,
} from '@/pages/endToEndDemo'
import { AffidavitModal, type AffidavitKind } from '@/components/e2e/AffidavitModal'
import { useAccount } from '@/context/AccountContext'
import {
  AngleRightRegular,
  AngleRightSolid,
  BookOpen,
  FileCertificateLight,
  LockRegular,
} from '@/icons'
import { COMPASS_BUTTON } from './compassButton'
import { AtlasExamDateCard } from './AtlasExamDateCard'
import { AtlasJourneyLinksCard } from './AtlasJourneyLinksCard'
import { ATLAS_HOME_REFRESH } from '@/components/layout/atlasHomeRefresh'
import { CircleCheckSolid } from '@/icons'
import { AtlasCourseProgressStates, type ProgressStage } from './AtlasCourseProgressStates'
import type { NoPaceReason } from './noPaceMessage'
import { ATLAS_PROGRESS_ORDER, atlasRungFor, isLessonRowTitle, journeyTitleFor } from './atlasProgressLadder'
import { paceStandingMessage, type PaceStanding } from './paceStanding'
import { AtlasPaceRingCard } from './AtlasPaceRingCard'
import { AtlasReadinessCard } from './AtlasReadinessCard'
import { useFeatureFlag, useFeatureFlags, useCourseDemo } from '@/context/FeatureFlagContext'
import { AtlasCourseTabs, type AtlasCourseTab } from './AtlasCourseTabs'
import { WHITE_COURSES, WHITE_COURSE_PARAM, whiteCourseFor } from '@/data/atlasWhiteCourses'
import {
  applyJourneySequencing,
  journeyStopsFor,
  whiteJourneyTitles,
  type JourneyStop,
} from '@/components/learning/studyJourneyUtil'
import { getLicensedStepsFor, jurisdictionName } from '@/data/nyProducerRequirements'
import { defaultPreset, formatPaceDate, formatPaceDateLong, studyPace, daysUntil, dateFromIso, isoFromDate, isoPlusDays, NOT_STARTED_NIGHTS } from '@/lib/studyPace'
import { clearExamDate, writeExamDate } from '@/data/examDateStore'
import { AtlasExamCalendar } from './AtlasExamCalendar'
import { EXPIRY_FLAG_KEY } from '@/data/courseFixtures'
import { EXAM_DETAILS_STEP_ID } from '@/data/examDetails'
import './atlasJourneyLink.css'
import type { LearningPathSummary } from '@/data/learningFixtures'

/**
 * ⚠ HOME V3 — a COPY of `AtlasHomeEricV2` (Eric/Atlas V2's Home) made
 * 2026-10-07 (Eric's request: "duplicate home and create a V3 in the feature
 * flags" — then, the same day, "add it to my Demo controls dashboard section"
 * instead). Rendered on `?version=eric-atlas-v3`, Eric/Atlas V3's Dashboard
 * Version. NEW HOME WORK FOR V3 GOES IN THIS FILE. Its classes are V2's (e.g. `cre-atlas-home-v2-course-title`), so
 * the tokens.css rules written for V2's Home apply here too until V3 is given
 * its own.
 *
 * The V2 copy's notes follow, unchanged.
 */
/**
 * ⚠ ERIC/ATLAS V2's HOME — a COPY of `AtlasHomeV2` made 2026-10-07 (Eric's
 * request: "duplicate this home page as V2 and add it to my dashboard
 * versions"). Rendered only on `?version=eric-atlas-v2`; Eric/Atlas V1 and the
 * Atlas/Compass parent keep `AtlasHomeV2`, so V1's Home stays as it was on this
 * date. NEW HOME WORK FOR V2 GOES IN THIS FILE. The two share everything
 * outside it (tokens, the course tabs, the links card, the shell), so a change
 * there still reaches both.
 *
 * The original's notes follow, unchanged.
 */
/**
 * ATLAS HOME, V2 — Figma "Atlas-Compass-Global-Navigation" node 161:662,
 * 2026-10-02, the designer's request: "Replace this home page content and
 * layout with the attached Figma file. Keep the old layout as a V1 Home Page
 * version." The flag is `atlas-home-layout` (v1 = the earlier Atlas home,
 * v2 = this); `LearnerFocusedBand` renders this in place of its Atlas layout.
 *
 * ONE CARD, NOT FIVE. The course, its figures, the pace and the journey sit in
 * a single course card on the left; a narrow column on the right carries the
 * exam-date question and a list of other destinations.
 *
 *   - The three FIGURES (expected completion, days to review, course access)
 *     come from the same pace model the Study Pace card uses
 *     (`studyPace` → `defaultPreset`), so the two layouts cannot disagree.
 *   - The DIAL is the course's own progress (`percent`, the band's figure).
 *   - The JOURNEY is `journeyStopsFor(path)`, the rail's own stops; the current
 *     stop carries Begin Course, the others a chevron into the stop.
 *   - Yes / No on the exam-date card are NOT WIRED yet, as on V1's banner.
 *
 * Departures: Open Sans for the design's Open Sans (same), DM Serif Display
 * through `--font-heading-serif` (the Headings dropdown still swaps it), and
 * every colour a token — the design's steel #3D5A73 is the brand's button
 * colour, its warm rules the Atlas rail rule, its pale panel the brand's
 * Study Pace tint.
 */
/* THE LONG REFERENCE TITLE (2026-10-07, Eric's request) — shown on V2's Home,
   on the current course's tab and heading, while the `atlas-home-long-title`
   design control is on (off by default). Display only: the course behind it
   (figures, journey, cover, Begin Course) is still the fixture (`path`). */
const V2_LONG_TITLE = 'New York Property and Casualty Conversion Course Pre-licensing and Live Review Class'

/** The cover and the column under it share this width (2026-10-08). 260 —
 *  White's left column — since 2026-10-13 (Eric's request); it was 235. */
/* ⚠ 296 — 2026-10-19, and the third number today. It was 260, went to 276
   for "give this container more horizontal spacing" (answered with
   padding), to 320 with the padding cut to 24 for "make larger
   horizontally, reduce right and left padding", and back a step here for
   "too wide. make it a bit smaller". The padding stays at 24: that ask was
   about the column, not the inset.

   ⚠ 248 OF CONTENT IS THE FLOOR FOR THE ESTIMATED COMPLETION ROW. That row
   is one line — a 166-wide tracked label, a 10 gap and the date — so about
   231 is the narrowest it can be before the date drops under the label
   again. There is 17 of slack here; anything tighter wants the row
   revisited rather than just the width.

   ⚠ `COVER_FRAME` READS THIS TOO, on purpose: the course cover's right edge
   lines up with this column below it (2026-10-14). It grows with it, which
   is what keeps that alignment true. */
const V3_LEFT_W = 296

/** V3's course tabs — off on 2026-10-08, back on the same day (Eric's
 *  request: "add the course tabs back to the top"). */
const SHOW_COURSE_TABS: boolean = true

/** The two link tiles under the Readiness card (Certificates, Active
 *  courses) — off on WIP 2026-10-13 (Eric's request: "remove"); the right
 *  rail's Quick Links carry both. Built, both layouts (the Design bar's Link
 *  tiles control, which White still uses): set true to bring them back. */
const SHOW_LINK_TILES: boolean = false

export type AtlasHomeJillMainProps = {
  path: LearningPathSummary
  courseTitle: string
  coverUrl?: string | null
  /** The course's progress, 0–100 — the band's own figure. */
  percent: number
  /** Pace-model inputs, exactly as the band hands them to `StudyPaceTile`. */
  today: Date
  hoursRemaining: number
  accessExpiresAt?: string
  /** ISO yyyy-mm-dd — the learner's booked exam date, `cgp.examDate` by way of
   *  `MembershipOverview`.
   *
   *  ⚠ USED AGAIN SINCE 2026-10-20, and the round trip is the point. `main`'s
   *  Home accepts this prop and refuses to act on it, because it owned neither
   *  exam prompt and a date it could not show or clear dead-ended the pace
   *  card. This version WIRED Add Date, so the page owns the date now — it can
   *  be entered here, changed here and removed here — and the pace model is
   *  entitled to read it again. The two facts are one decision; see the note
   *  at `studyPace` below. */
  examDate?: string
  notStarted?: boolean
  onBegin?: () => void
  onOverview?: () => void
  onOpenStop?: (courseId: string) => void
  onOpenStep?: (id: string) => void
  onOpenRequirements?: () => void
  /** The learner's ACTIVE courses, for the tab strip above the title. Two or
   *  more shows the strip; one hides it. Unset = this course plus the demo's
   *  invented second course (below). */
  courses?: AtlasCourseTab[]
  onSelectCourse?: (id: string) => void
  /** "All courses ›" — defaults to the same destination as the side card's
   *  My Courses link (`section=courses`). */
  onAllCourses?: () => void
}


/* NO LINKS on the End-to-End Demo's Home (2026-10-15, Eric's request): the
   controls stay drawn and do nothing — Course Overview, Begin Course, the
   journey stops, the tiles, My Courses and My Certificates. Set false to wire
   them again.

   ⚠ COURSE OVERVIEW *AND BEGIN COURSE* ARE EXEMPT ON THE END-TO-END WALK
   — Begin joined 2026-10-16 ("make this button go into the compass course"),
   under its own flag and landing in a lesson rather than on the dashboard.
   The rest of the sentence applies to both (2026-10-16,
   Jillienne: "clicking Course Overview … will now link up with Anjani's
   Prototype"). `useCourseOverviewOpensCompass` is `?journey=full` AND the
   flag, so this exemption is live on HER row's walk and nowhere else — the
   Atlas Learning tile, which renders this same component, keeps the inert
   button. This one DOES leave Home, which is the one thing `LINKS_OFF`
   exists to prevent; it is allowed to because joining Atlas to Compass is
   exactly what the End-to-End row is for.

   ⚠ THE THREE INFORMATION SHEETS ARE EXEMPT (2026-10-15, Jillienne: Exam
   Information, Applying for a License and State Requirements "should trigger
   the updated sheets from Jills Hybrid version"). They are the same handlers
   Hybrid is given — `onOpenStep` and `onOpenRequirements`, both from
   `MembershipOverview`, which owns the sheets for every version — so the demo
   shows the current ones rather than a copy that can go stale. A sheet opens
   OVER Home and closes back to it, so none of them leaves the demo, which is
   what `LINKS_OFF` is there to prevent. */
/* The window a learner who has not started gets, when Expires is on
   Automatic — see `accessIso`. */
const ZERO_ACCESS_DAYS = 30
const LINKS_OFF = true
const NO_LINK = () => {}

export function AtlasHomeJillMain({
  path,
  courseTitle,
  coverUrl,
  percent,
  today,
  hoursRemaining,
  accessExpiresAt,
  examDate,
  notStarted = false,
  onBegin,
  onOverview,
  onOpenStop,
  onOpenStep,
  onOpenRequirements,
  courses,
  onSelectCourse,
  onAllCourses,
}: AtlasHomeJillMainProps) {
  const [searchParams, setParams] = useSearchParams()
  // Eric/Atlas White renders this Home too, on its white page (2026-10-14).
  // End-to-End Demo is White's duplicate, so it is "on White" here.
  /* ⚠ RESOLVED, NOT RAW — 2026-10-14, the day this version became the
     default. On a bare `?demo=1` the raw param is null, so this answered
     false and the baseline drew WIP's toned layout with the course tabs
     instead of its own. `DefaultVersionResolution.test.tsx` pins the two
     renders equal. */
  const { brand: e2eBrand } = useAccount()
  const onWhite = isEricAtlasWhiteLike(resolveDashboardVersion(searchParams.get('version'), e2eBrand))
  /* The demo's course title — short, or long when the Long title control is
     on, and FOLLOWING THE COURSE CONTROL since 2026-10-15. This is the
     dashboard, so it shows the course the reviewer picked; the invite door at
     `/end-to-end-demo` keeps `useEndToEndCourseTitle` and stays Florida. */
  const e2eTitle = useDashboardCourseTitle()
  /* Course Overview is exempt from `LINKS_OFF` on the End-to-End row's walk,
     where it opens Anjani's Compass — see the note on `LINKS_OFF`. */
  const overviewOpensCompass = useCourseOverviewOpensCompass()
  /* …and Begin Course, which opens the Compass SESSION on the same walk. */
  const beginOpensCompass = useBeginOpensCompassSession()
  /* The walk's tidied Study Journey steps — see `useWalkStudyJourneySteps`. */
  /*
   * ⚠ THE WALK'S JOURNEY IS THIS VERSION'S DEFAULT — 2026-10-20, after
   * Jillienne: "this section should match what is on main, why is it
   * different?", pointing at Step 3.
   *
   * It was `useWalkStudyJourneySteps()`, which is `?journey=full`. Making Step
   * 2 unconditionally draw the exam card left the rest of the journey on the
   * flag, so a bare visit got the WALK'S STEP 2 beside the NON-WALK STEP 3 — a
   * shape neither the demo nor the mock has ever had:
   *
   *   Step 2  the exam card            ← the walk's
   *   Step 3  "Apply online, then submit your fingerprints."   ← not
   *           [ Florida State Requirements ]                   ← not
   *
   * Both of her mocks show the walk's Step 3 — "Applying for a License" as a
   * stop, no detail sentence, no State Requirements button — because the three
   * changes are ONE treatment: the journey as a list of things to do rather
   * than a recitation of facts. Splitting them is what produced the hybrid.
   *
   * ⚠ IT DOES NOT MAKE THE FLAG POINTLESS, it makes it Eric's. `e2e-walk-journey-steps`
   * still decides the shape on `eric-atlas-e2e`, where the walk is a route into
   * the demo; here the walk's shape IS the version, so there is nothing left to
   * gate. The flag's own description says the tile is unaffected either way —
   * that stays true, because this is the other Home.
   */
  const walkSteps = true
  /* Which Study Pace card — the dial or the stepped states. A design-bar
     radiogroup; see `atlas-pace-card`. */
  const paceCard = useFeatureFlag('atlas-pace-card').variant ?? 'ring'
  /* Whether the column carries Exam readiness at all — a design-bar on/off,
     see `atlas-readiness-section`. */
  const showReadiness = useFeatureFlag('atlas-readiness-section').enabled
  /* ⚠ READ UP HERE, not beside the other bar controls below, because the
     access window and the ring both need it before they are computed. It is
     the DEMO bar's Progress since 2026-10-16 (Eric's design control until
     then) — which state the module opens on, its figure, and the readiness
     band with it. */
  const progressPick = useFeatureFlag('atlas-v3-progress').variant ?? 'not-started'
  // White's course-head panel, measured so Quick Links can take its height
  // (2026-10-14, Eric's request).
  const [headEl, setHeadEl] = useState<HTMLDivElement | null>(null)
  const [headH, setHeadH] = useState<number | undefined>(undefined)
  useEffect(() => {
    // No reset when it goes: the height is only read on White, where it exists.
    if (!headEl) return
    const ro = new ResizeObserver(() => setHeadH(headEl.getBoundingClientRect().height))
    ro.observe(headEl)
    return () => ro.disconnect()
  }, [headEl])
  const go = (section: string, coursePage?: string) =>
    LINKS_OFF ? undefined : setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('section', section)
      if (coursePage) next.set('coursePage', coursePage)
      else next.delete('coursePage')
      return next
    })

  /* ⚠ AT 0% THE WINDOW MOVES, NOT JUST THE COUNT — 2026-10-19, Jillienne:
     "there is 30 days on default, why is it now showing not enough time left
     in pacing".

     The 30 arrived on 2026-10-16 ("at 0% should default to 30 days for course
     access") as a DISPLAY override on the count alone, and the note here said
     so: the date beside it stayed the persona's, "so at 0% the two no longer
     agree by arithmetic… worth doing properly if the pair ever has to be read
     together". They are read together — the pace card reads the real window
     while the meta printed 30 — so on the default screen the card could say
     "Not enough access left" under a line promising 30 days, and even at
     Automatic the 30 contradicted the 05/29 date printed beside it.

     One window now, derived once and read by all three: the meta's date, its
     count, and the pace model. Not Started means the clock has not started,
     so the window IS today plus thirty.

     ⚠ AN EXPLICIT EXPIRES PICK STILL WINS. The ask was for a DEFAULT; a demo
     control set to "1 day" that silently became thirty would be a control
     that does nothing at the one progress state the demo opens on. */
  const expiryPick = useFeatureFlag(EXPIRY_FLAG_KEY).variant ?? 'auto'
  const zeroWindow = progressPick === 'not-started' && expiryPick === 'auto'
  const accessIso = zeroWindow && accessExpiresAt ? isoPlusDays(today, ZERO_ACCESS_DAYS) : accessExpiresAt
  /*
   * THE EXAM DATE BINDS AGAIN HERE — 2026-10-20, the other half of wiring Add
   * Date.
   *
   * ⚠ `main`'s COPY OF THIS FILE PASSES `undefined`, DELIBERATELY, and the
   * difference between the two is not a disagreement — it is the same rule
   * answered by two pages with different powers. A page may act on a date only
   * if it can SHOW it, CHANGE it and REMOVE it. The End-to-End Demo's Home can
   * do none of those (both of its exam prompts are decoration, and say so), so
   * a date typed in Compass weeks earlier dead-ended its pace card for good,
   * per browser, with the page still asking "When is your exam?" underneath
   * the message about the answer. Refusing the date was the honest fix there.
   *
   * THIS VERSION EARNED IT BACK. `ExamDatePrompt` and `ExamDateQuestionPill`
   * both write to `examDateStore` now, both print the stored date, and both
   * offer Remove — so every figure the date moves has a control on this page
   * that moved it.
   *
   * ⚠ WHICH MEANS "NO PACE FITS" IS REACHABLE HERE, AND THAT IS CORRECT. Enter
   * an exam inside `EXAM_BUFFER_DAYS` of today and the card says so, naming the
   * exam rather than access (`noPaceMessage`'s exam arm). It is no longer a
   * dead end: Remove is sitting next to the date that caused it. Do not "fix"
   * that by passing `undefined` again — that would restore the baseline's
   * behaviour on a page that no longer needs it, and silently make Add Date a
   * control that changes nothing.
   */
  const model = useMemo(
    () =>
      studyPace({
        today,
        hoursRemaining,
        accessExpiresAt: accessIso,
        examDate,
        nights: notStarted ? NOT_STARTED_NIGHTS : undefined,
      }),
    [today, hoursRemaining, accessIso, examDate, notStarted],
  )
  const preset = defaultPreset(model)
  /*
   * THE GENTLEST PACE THAT ACTUALLY FITS — 2026-10-15, with the Expires
   * control.
   *
   * ⚠ `defaultPreset` RETURNS THE RECOMMENDED ONE WHETHER OR NOT IT FITS, and
   * reading its `state` as "no pace exists" is wrong by one preset. At 7 days
   * of access the recommended pace wants 3192 minutes a week and reports
   * `no` — while RELAXED fits the same window at 1064, heavy but real. The
   * card said "there isn't enough access left to finish this course" with a
   * workable plan sitting in the model one row up.
   *
   * `presets` is ordered relaxed → recommended → focused, so the first that
   * is not `no` is the gentlest that fits. Everything `no` — the 1-day row —
   * means none does, and THAT is when the card says so.
   */
  const paceFit = preset.state === 'no' ? model.presets.find((x) => x.state !== 'no') : preset
  /* ⚠ WHY NOTHING FITS, WHEN NOTHING DOES — 2026-10-19, Jillienne, after the
     card told her to extend access while her EXAM was the binding deadline.
     `resolveCeiling` already records which of the two ceilings won, for
     exactly this ("so the UI can explain itself instead of silently
     switching"); both cards ignored it and blamed access either way. This
     hands the model's own answer to whichever card is on screen. */
  const noPace: NoPaceReason = {
    binding: model.binding,
    days: model.daysToCeiling,
    dateIso: model.hardEndIso,
  }
  /*
   * ADD DATE, WIRED — 2026-10-20. Three pieces of state and nothing else: the
   * DATE itself is not held here, it is `examDateStore`'s, arriving as the
   * `examDate` prop. Keeping a local copy beside it is how the two come to
   * disagree — the Study Calendar carried its own `calendar.examDate` for
   * exactly that reason and `exam-date-single-store` has just finished
   * unpicking it.
   *
   * `picking` is which phase the prompt is in; `notYet` is Not Yet's dismissal,
   * which was always presentational and still is.
   */
  const [picking, setPicking] = useState(false)
  /* ⚠ `writeExamDate`, NOT `writeExamDateTime`. The picker collects a DAY; the
     Study Calendar's own editors collect a day and a slot. Passing an empty
     time here would write `cgp.examTime` as a blank string and the calendar
     would show a booked exam at no time — so a surface that does not ask for
     the time does not write one, and the time already stored survives a date
     change. */
  const saveExamDate = (iso: string) => {
    writeExamDate(iso)
    setPicking(false)
  }
  /* ⚠ REMOVE IS WHAT MAKES READING THE DATE LEGITIMATE — see the note at
     `studyPace`. Without it this page would be acting on an input it could not
     undo, which is the whole of the bug the baseline was fixed for. */
  const removeExamDate = () => {
    clearExamDate()
    setPicking(false)
  }
  /* ⚠ ONE SUBTRACTION FOR BOTH PLACES THAT PRINT IT — the Scheduled stop and
     the pace column. Two call sites each doing their own is how the mock ended
     up showing 29 and 18 for the same date. */
  const examDays = examDate ? daysUntil(examDate, today) : null
  const examPromptProps = {
    examDate,
    picking,
    today,
    /* ⚠ NO `stateName` HERE. `state` is derived from `path` further down the
       body, and a const read above its declaration is a TDZ throw at render,
       not a compile warning you would notice. The two call sites pass it. */
    onAdd: () => setPicking(true),
    onCancel: () => setPicking(false),
    onSave: saveExamDate,
    onRemove: removeExamDate,
  }
  /* NOT STARTED — the 0% state. Several things read it: the access window
     below, the ring's figure, and the Readiness card's empty band. */
  const atZeroProgress = progressPick === 'not-started'
  /* The top of the ladder. It no longer hides the progress card — see the
     note at the ring — but it still decides the journey's completed shape. */
  const completedView = progressPick === 'completed'
  const ringAtZero = paceCard === 'ring' && atZeroProgress
  const rawAccessDays = accessIso ? Math.max(0, daysUntil(accessIso, today) ?? 0) : null
  /* ⚠ DERIVED, NOT OVERRIDDEN (2026-10-19). It was `atZeroProgress ? 30 :
     rawAccessDays` — a count that ignored the date printed beside it and the
     window the pace card read. The 30 lives in `accessIso` now, so this is
     arithmetic on one window again and the three figures cannot disagree. */
  const accessDays = rawAccessDays
  /* EXPIRES · DAYS TO COMPLETE, under the course title (Figma 368:519,
     2026-10-13, Eric's request). The course's own access end and the days
     left to it — the figures the Access tile reads — not the frame's sample
     11/04/2026 and 27 days. Like the rest of the card, it is the first
     course's whichever tab is picked. */
  const expiresOn = dateFromIso(accessIso)
  const courseMeta =
    expiresOn && accessDays != null ? (
      <div
        style={
          onWhite
            ? // Primary 200 rules on White's Primary 100 panel (2026-10-14),
              // where the card's own 100 would not show.
              { ...META_ROW, borderTop: '1px solid var(--color-primary-200)', borderBottom: '1px solid var(--color-primary-200)' }
            : META_ROW
        }
      >
        <span style={META_PAIR}>
          {/* "Course Access Ends:" on White (2026-10-14, Eric's request). */}
          <span style={META_LABEL}>{onWhite ? 'Course Access Ends:' : 'Expires:'}</span>
          <span style={META_VALUE}>
            {expiresOn.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
            {/* Inside the value, so no gap before it; in the label's weight. */}
            {onWhite ? <span style={META_LABEL}>,</span> : null}
          </span>
        </span>
        {/* ⚠ AT 100% IT CONGRATULATES INSTEAD OF COUNTING (2026-10-19,
            Jillienne: "when at 100%, this messaging should change to Congrats!
            You have completed this course."). "18 days to complete" is time
            the learner still needs; at the end it is time they no longer have
            any use for, and a countdown beside a finished course reads as
            something still owed. The ACCESS DATE stays either way — access
            really does end then, certificate or no certificate. */}
        {completedView ? (
          <span style={{ ...META_PAIR, marginLeft: onWhite ? -4 : undefined }}>
            {onWhite ? null : <span aria-hidden style={META_DIVIDER} />}
            <span style={META_VALUE}>Congrats! You have completed this course.</span>
          </span>
        ) : onWhite ? (
          /* White reads as one line — "…05/29/2026, 18 days to complete" —
             with no divider (2026-10-14, Eric's request). */
          <span style={{ ...META_PAIR, marginLeft: -4 }}>
            <span style={META_VALUE}>
              {accessDays} {accessDays === 1 ? 'day' : 'days'}
            </span>
            <span style={META_LABEL}>to complete</span>
          </span>
        ) : (
          <>
            <span aria-hidden style={META_DIVIDER} />
            <span style={META_PAIR}>
              <span style={META_LABEL}>Days to complete:</span>
              <span style={META_VALUE}>
                {accessDays} {accessDays === 1 ? 'day' : 'days'}
              </span>
            </span>
          </>
        )}
      </div>
    ) : null

  // V3 drops the Attestation & Affidavit stop on every progress stage
  // (2026-10-09, Eric's request). The stop still exists in the shared journey.
  const { regulated } = useCourseDemo()
  /* The design bar's Affidavit control — read here because the journey below
     drops its first row when it is off, not only because the modal reads it. */
  const affidavitFlag = useFeatureFlag('atlas-affidavit')
  const affidavitPick = affidavitFlag.variant ?? 'off'
  const stops = journeyStopsFor(path).filter((s) => s.id !== 'attestation-and-affidavit')
  /* ⚠ THE PATH'S OWN "in-progress" STOP NO LONGER DECIDES THIS (2026-10-16).
     The demo's Progress does — `currentRowIdx` below is the first row the
     ladder has not checked off. The fixture's status said one thing while
     the control said another, and with the control now ticking rows the two
     would have drawn a current dot and a green check on the same row. */
  // White's journey reads as Figma 265:8144 (2026-10-14, Eric's request: the
  // text only, the rows keep their styling) — seven stops, the first current.
  /* REGULATED SEQUENCING (2026-10-15) — Step 1's stops lock behind the one
     the learner may open next. The rule is `applyJourneySequencing`, so every
     drawing of this journey agrees; Unregulated returns the same array.

     ⚠ IT WRAPS `shownStops`, NOT `stops`, and wrapping the wrong one is how
     this shipped doing nothing. The White journey REBUILDS its rows from
     `whiteJourneyTitles`, spreading `stops[0]` into each — so a `locked`
     derived upstream is overwritten by the spread before anything renders.
     Sequence what is DRAWN, which is the array below. */
  /* ⚠ `xcelFlow` IS UNGATED, unlike the step-level copy around it. The ORDER
     of the coursework is a fact about the course, not a thing one row of the
     Prototypes section believes and another does not — so both surfaces of
     this component draw it, and the Progress ladder's rungs (which NAME
     these rows) stay true on both. `AtlasHomeEricV3` and the White home keep
     the original list; they do not pass it.
     ⚠ IT ABSORBS THE AFFIDAVIT RENAME, which WAS gated to the walk for the
     hour between the two asks. One flag for one word, alongside a list that
     already says "Affidavit", was a seam with nothing on the other side of
     it worth keeping. */
  const shownStops: readonly JourneyStop[] = applyJourneySequencing(
    onWhite && stops.length
      ? whiteJourneyTitles(stops[0], { stateExamSimulators: true, preCourseAffidavit: affidavitPick !== 'off', xcelFlow: true }).map((title, i) => ({
          ...stops[0],
          id: `white-${i}`,
          title,
          status: i === 0 ? 'in-progress' : 'not-started',
          /* The rebuild inherits `stops[0]`'s `blocked`, which is about a
             different stop entirely. Cleared so the sequencing below reads
             these rows as the plain not-started ones they are. */
          blocked: false,
        }))
      : stops,
    regulated,
  )
  /* One rung answers all three: the ring's figure, the Readiness band, and
     how far down Step 1 the checks reach. `expired` is off the picker and
     resolves to its own stage. */
  const rung = atlasRungFor(progressPick)
  const progress: { stage: ProgressStage; percent?: number } =
    progressPick === 'expired' ? V3_EXPIRED : { stage: rung.stage, percent: rung.percent }
  /* ⚠ THE LESSON COUNT FOLLOWS THE DEMO'S PROGRESS (2026-10-16, Jillienne:
     "as user progresses through the course progress options, the 23 of 36
     completed should update accordingly").

     The lesson row's title carries the path's own figures — "Pre-Licensing
     Lessons (23 of 36 completed)" — and they did not move when Progress did.
     That was wrong at both ends of the ladder: at 100% a green check sat
     against a row saying 23 of 36, and at 0% a learner who had not started
     already had 23 lessons behind them. It was patched at the top end only,
     for the completed view; this does the whole scale.

     A DISPLAY TRANSFORM, not a change to the path: the figures are the
     fixture's and other surfaces read them. Only the COUNT moves — the
     total stays the path's — and only where the title already has that
     shape, so a title without it is left exactly as it is. */
  const journeyStops: readonly JourneyStop[] = shownStops.map((stop) => {
    const title = journeyTitleFor(stop.title, rung.percent)
    return title === stop.title ? stop : { ...stop, title }
  })
  /* ⚠ WHICH ROWS CARRY THE GREEN CHECK (2026-10-16, Jillienne: "add to the
     progress dropdown for Prep Review Completed, Exam Simulators completed
     etc to show the circles turning into checkmarks throughout the flow").
     It was `done={completedView}` — all six at once at 100%, nothing before
     it — so the five new rungs would have changed the ring and left Step 1
     looking identical.

     The ladder counts from the LESSON row rather than from the top, because
     the Pre-course Affidavit above it is a row the Affidavit design control
     can remove, and an index that shifted with a design control would check
     off the wrong thing. Finding that row by its `x of y` shape rather than
     by its wording keeps this working on the arm that rebuilds its titles.

     The affidavit row itself is done as soon as there is any progress at
     all: it is the gate the learner came through, so a learner at 14% with
     an unticked arrival affidavit would be a contradiction. */
  const lessonRowIdx = Math.max(
    0,
    journeyStops.findIndex((s) => isLessonRowTitle(s.title)),
  )
  const doneRows = rung.percent > 0 ? lessonRowIdx + rung.stepsDone : 0
  /* ⚠ NOTHING IS "CURRENT" WHEN EVERYTHING IS DONE. A filled current-dot
     among green checks would say the learner is still on that row. */
  const currentRowIdx = doneRows < journeyStops.length ? doneRows : -1
  /* THE JURISDICTION COMES FROM THE PATH, heading and steps alike.
     Florida is no longer written here: `MembershipOverview` resolves this
     demo's COURSE to Florida (2026-10-15), so `path.state` already is 'FL'
     and every other surface that reads the path — the three information
     sheets, Readiness, the study plan — says Florida too. Hard-coding the
     word here instead is what let the Home and its own sheets disagree. */
  const licensedSteps = getLicensedStepsFor(path.state)
  const pass = licensedSteps[licensedSteps.length - 2]
  const apply = licensedSteps[licensedSteps.length - 1]
  const state = jurisdictionName(path.state)
  const longTitle = useFeatureFlag('atlas-home-long-title').enabled
  /* The design bar's Affidavit control, and the invite flow's `?affidavit=1`
     as the pre-course one. `null` when neither asks for it. */
  const affidavitKind: AffidavitKind | null =
    affidavitPick === 'pre' || affidavitPick === 'post'
      ? affidavitPick
      : searchParams.get('affidavit') === '1'
        ? 'pre'
        : null
  // The Design bar's Link tiles (V3 only, 2026-10-09) — Stacked (default) or Inline.
  const stackedTiles = (useFeatureFlag('atlas-v3-link-tiles').variant ?? 'stacked') !== 'inline'
  // The Design bar's Quick Links side (2026-10-13) — Left (default) or Right.
  const quickLinksRight = useFeatureFlag('atlas-wip-quick-links-side').variant === 'right'
  // COMPLETED (Design bar's Progress = Completed 100%, 2026-10-09, Eric): no
  // Course progress card, and Step 1 becomes the Congratulations block.
  // Clicking the Course progress card steps the Design bar's Progress itself
  // (2026-10-09, Eric: "trigger the same corresponding screens that the
  // progress dropdown tool does"), so Step 1, Readiness and the Completed view
  // all follow. NB the card is hidden on Completed — the dropdown leaves it.
  const { setVariant } = useFeatureFlags()
  /* Closing the modal turns the control off, so it does not re-open. */
  const setAffidavit = (v: string) => setVariant('atlas-affidavit', v)
  // The Top Nav's Home button starts the demo cards over (2026-10-12): Progress
  // back to Not Started (Readiness follows), and every card remounts.
  const [refreshKey, setRefreshKey] = useState(0)
  useEffect(() => {
    const onRefresh = () => {
      setVariant('atlas-v3-progress', 'not-started')
      setRefreshKey((k) => k + 1)
    }
    window.addEventListener(ATLAS_HOME_REFRESH, onRefresh)
    return () => window.removeEventListener(ATLAS_HOME_REFRESH, onRefresh)
  }, [setVariant])
  /* ⚠ THE MAIN CTA AT 100% IS "VIEW CERTIFICATE" (2026-10-19, Jillienne:
     "when at 100% this main CTA should change to View Certificate"). Begin /
     Resume are both invitations back INTO the course, and there is no course
     left to go back into — the thing the learner wants at the end is the
     thing they finished it for.

     ⚠ THE LABEL AND THE DESTINATION MOVE TOGETHER, in one place, because a
     button saying "View Certificate" that opened the Compass session would
     be a worse bug than the label it fixed. `go('certificates')` is where
     the Certificates tiles in this same column already point, so the page
     has one answer to "where are my certificates" rather than two. It
     no-ops under `LINKS_OFF` exactly as those tiles do. */
  /* Exam Information opens the same sheet Quick Links' own link opens, by
     the same id — `onOpenStep` is exempt from `LINKS_OFF`, so this one
     genuinely works. */
  /* ⚠ THE PACE SENTENCE PAST 0% (2026-10-19). At Not Started the card keeps
     its starting-point copy — there is no standing before you start — so
     this is only built once the learner has one, and `paceFit` has to exist
     for the figures in it to mean anything. */
  const paceStanding = (useFeatureFlag('atlas-pace-standing').variant ?? 'on-track') as PaceStanding
  /* The design bar's Home column — Centred (default) or Left aligned. */
  const columnAlign = useFeatureFlag('atlas-home-align').variant === 'left' ? 'left' : 'center'
  /* The design bar's Exam date prompt — Row (default) or Card. */
  const examPromptCard = useFeatureFlag('atlas-exam-prompt').variant === 'card'
  const examInfo = onOpenStep ? () => onOpenStep(EXAM_DETAILS_STEP_ID) : undefined
  /* …and Step 3's, the same sheet Quick Links' "Applying for a License"
     opens, by the step's own id rather than a second copy of it. */
  const applyInfo = onOpenStep ? () => onOpenStep(apply.id) : undefined
  const beginLabel = completedView
    ? 'View Certificate'
    : progressPick === 'not-started'
      ? 'Begin Course'
      : 'Resume Course'
  const onBeginCta = completedView
    ? () => go('certificates')
    : LINKS_OFF && !beginOpensCompass
      ? NO_LINK
      : onBegin
  const advanceProgress = () =>
    setVariant(
      'atlas-v3-progress',
      ATLAS_PROGRESS_ORDER[(ATLAS_PROGRESS_ORDER.indexOf(progressPick) + 1) % ATLAS_PROGRESS_ORDER.length],
    )
  const currentTitle = longTitle ? V2_LONG_TITLE : courseTitle
  /* THE COURSE TABS ARE WHITE'S THREE COURSES (2026-10-13, Eric's request:
     "Update the course tabs to the 3 used elsewhere") — the list the Top
     Nav's My Courses dropdown and White's own Home use. The pick rides the
     URL as `?whiteCourse=`, so the tabs, the dropdown and White agree; a pick
     swaps the title and cover, and everything below stays the first
     course's. Until that day the tabs had their own two: Life & Health and
     an invented "New York Property & Casualty" (Figma 188:1006), picked in
     page state. */
  const tabs = courses ?? WHITE_COURSES.map((c, i) => (i === 0 ? { id: c.id, title: currentTitle, coverUrl } : c))
  // Which course-header layout is up — flipped by clicking the cover.
  const [whiteHead, setWhiteHead] = useState(false)
  const activeTabId = whiteCourseFor(searchParams.get(WHITE_COURSE_PARAM))
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]
  // The demo's course: the one Invited Product Detail sells (2026-10-15,
  // Eric's request), in place of the course data's title.
  const shownTitle = e2eTitle
  const shownCover = activeTab?.coverUrl ?? coverUrl
  const selectCourse = (id: string) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (id === WHITE_COURSES[0].id) next.delete(WHITE_COURSE_PARAM)
      else next.set(WHITE_COURSE_PARAM, id)
      return next
    })
    onSelectCourse?.(id)
  }

  return (
    // 40 between Quick Links and the course card on White, 8 more than WIP's
    // 32 (2026-10-14, Eric's request) — White's card has no padding of its own.
    <div style={onWhite ? WHITE_PAGE : PAGE}>
      {/* ── The course card ── */}
      {/* NO COURSE TABS on V3 (2026-10-08, Eric's request: "remove from v3"),
          so the card takes its full 48 on top. The tabs' data stays — the
          title and cover still read the first course — so to bring the strip
          back, set SHOW_COURSE_TABS. */}
      {/* No drop shadow, a white fill and no padding on Eric/Atlas White, which
          shows this Home on its white page (2026-10-14, Eric's request); WIP
          keeps all three. */}
      <section
        aria-label="Current course"
        style={{
          ...(SHOW_COURSE_TABS && tabs.length > 1 ? CARD : { ...CARD, paddingTop: 40 }),
          // …and a white fill, the page's own, and no padding — 800 wide
          // (2026-10-14, Eric's request; 750 earlier that day).
          ...(onWhite
            ? {
                boxShadow: 'none',
                background: 'var(--color-fixed-light)',
                flex: '0 1 800px',
                paddingTop: 0,
                paddingRight: 0,
                paddingBottom: 0,
                paddingLeft: 0,
              }
            : null),
        }}
      >
        {/* THE COURSE HEAD — tabs, cover, title, Expires row and buttons. On
            Eric/Atlas White it sits on a Primary 100 panel (40 all round, the
            tabs hidden), with no
            rule under it (2026-10-14, Eric's request). On WIP the wrapper is
            `display: contents`, so nothing about WIP's layout moves. */}
        <div ref={onWhite ? setHeadEl : undefined} style={onWhite ? WHITE_COURSE_HEAD : { display: 'contents' }}>
        {/* No tabs on White (2026-10-14, Eric's request). */}
        {SHOW_COURSE_TABS && !onWhite && tabs.length > 1 ? (
          <AtlasCourseTabs courses={tabs} activeId={activeTab?.id ?? path.id} onSelect={selectCourse} onAllCourses={onAllCourses ?? (() => go('courses'))} />
        ) : null}
        {/* 32, the row below's gap (2026-10-13, Eric's request), so the title
            block starts on the vertical rule under it; it was 40. */}
        {/* TWO HEADER LAYOUTS, FLIPPED BY CLICKING THE IMAGE (2026-10-13,
            Eric's request): this one — the 260 cover beside the title and both
            buttons — and Eric/Atlas White's (`WhiteStyleHead`, below), which
            gives the title the card's width over a 130 cover. A live demo
            toggle, like the Study Pace and Readiness cards' own. */}
        {whiteHead ? (
          <WhiteStyleHead
            cover={shownCover ?? undefined}
            title={shownTitle}
            onCover={() => setWhiteHead(false)}
            onOverview={LINKS_OFF && !overviewOpensCompass ? NO_LINK : onOverview}
            onBegin={completedView ? onBeginCta : LINKS_OFF ? NO_LINK : onBegin}
            beginLabel={beginLabel}
            meta={courseMeta}
          />
        ) : (
        <div style={{ display: 'flex', gap: 32, alignItems: 'stretch' }}>
          {shownCover ? (
            <button
              type="button"
              aria-label="Course header — layout 1 of 2. Press to show the next layout."
              onClick={() => setWhiteHead(true)}
              // 12 corners on Eric/Atlas White, 8 under the card’s 20 (2026-10-14)
              // — and the 260 column's width less the panel's padding there, so
              // its right edge lines up with that column below.
              style={{ ...COVER_FRAME, ...COVER_TOGGLE, ...(onWhite ? { borderRadius: 12, width: V3_LEFT_W - WHITE_HEAD_PAD } : null) }}
            >
              <img src={shownCover} alt="" style={COVER} />
            </button>
          ) : null}
          <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 15, justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={EYEBROW}>Current course</p>
              <h2 className="cre-compass-course-title cre-atlas-home-course-title cre-atlas-home-v2-course-title" style={TITLE}>
                {shownTitle}
              </h2>
              {courseMeta}
            </div>
            {/* The card's two actions, at the main buttons' size (2026-10-06,
                the designer's request): Course Overview — was a 10px chip —
                as the outline button, and Begin Course, MOVED here from the
                Study Journey's current stop. */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {LINKS_OFF || onOverview ? (
                <button
                  type="button"
                  className="cre-compass-secondary cre-atlas-home-secondary"
                  onClick={LINKS_OFF && !overviewOpensCompass ? NO_LINK : onOverview}
                  // Bold 700, the exam-date prompt's Yes (2026-10-15, Eric's
                  // request; Medium 500 from 2026-10-06).
                  style={{ ...HEADER_BUTTON, fontWeight: 700 }}
                >
                  Course Overview
                </button>
              ) : null}
              <button
                type="button"
                className="cre-compass-primary cre-compass-btn-primary"
                onClick={onBeginCta}
                /* Never disabled at completion: its handler is this page's
                   own `go`, not the caller's `onBegin`. */
                disabled={!completedView && !LINKS_OFF && !onBegin}
                style={HEADER_PRIMARY}
              >
                {/* "Resume Course" once the Design bar's Progress is past 0%
                    (2026-10-12, Eric's request), and "View Certificate" at
                    100% (2026-10-19) — see `beginLabel`. */}
                {beginLabel}
              </button>
            </div>
          </div>
        </div>
        )}

        </div>
        {onWhite ? null : <span aria-hidden style={RULE} />}

        {/* 32 either side of the rule, White's (2026-10-13, Eric's request);
            it was 40. */}
        {/* 48 between the two columns (2026-10-15, Eric's request; 32 either side of a divider before). */}
        <div style={{ display: 'flex', gap: 48, alignItems: 'stretch' }}>
          {/* Left: V3's COLUMN, 235 wide — Figma 254:7973 (2026-10-08, Eric's
              request; it was the 200-wide Course progress panel alone). Two
              link tiles (certificates, courses), the Course progress panel
              restyled, and a READINESS card with a half-dial. */}
          <div style={{ width: V3_LEFT_W, flex: 'none', alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* THE COURSE PROGRESS MODULE — Figma 267:8267's five states, in
                place of the Course progress panel (2026-10-08, Eric's
                request). Click it to flip the states. Hidden on the Completed
                view (2026-10-09). */}
            {/* ON WHITE, PROGRESS AND READINESS SHARE ONE OUTLINED PANEL
                (Figma 286:9455; 2026-10-14, Eric's request), a hairline between
                them; each keeps its states and clicks (`bare`). On WIP the
                wrapper is `display: contents` and they stay two cards. */}
            {/* ⚠ NO COLUMN GAP ON THE RING ARM (2026-10-16, Jillienne:
                "spacing between the components and the divider lines should
                be the same"). The ring card ends ON its rule and the
                readiness card brings its own 24 below it, so Eric's 16 here
                was a third helping of air that made THIS rule stand further
                off than the one inside the card. The STATES arm keeps it:
                its two cards have no rule between them to measure from. */}
            <div
              style={
                onWhite
                  ? paceCard === 'ring'
                    ? { ...WHITE_PROGRESS_PANEL, gap: 0 }
                    : WHITE_PROGRESS_PANEL
                  : { display: 'contents' }
              }
            >
            {/* ⚠ THE RING SURVIVES 100% (2026-10-16, Jillienne: "100% still
                needs to show the course progress section because they might
                not always be 100% complete, but still ready"). Completion and
                readiness are two axes, and hiding the progress card at the top
                of the readiness scale collapses them into one — the card has
                to stay visible for a learner who is ready at less than 100%,
                which is the case that argument is really about.

                The STATES arm keeps Eric's behaviour: it swaps the whole
                column for his Congratulations panel at completion, and that
                panel is his design. */}
            {paceCard === 'ring' ? (
              /* THE RING (2026-10-16, the default). The week goal is DERIVED
                 from the same `paceFit` the Expected-completion date reads,
                 not typed: the card beside it prints a finish date, and a
                 hardcoded week count is how those two start describing
                 different plans. `HybridHomeV1` pins its 3 deliberately and
                 records the derivation it dropped — this one keeps it. */
              <AtlasPaceRingCard
                /* The ladder carries the figure for every state now,
                   including 0 — see the note there. The `percent` prop is the
                   persona's and only stands in for a state with no figure. */
                percent={progress.percent ?? percent}
                /* ⚠ NO FALLBACK (2026-10-19). It was `: 3` — a week count
                   nothing had computed, printed at the one moment the model
                   has no plan to offer. `undefined` is what the card reads as
                   "no pace fits", and it is the same condition that already
                   empties the hours line and the completion date, so all
                   three now say the same thing instead of two vanishing while
                   the third made a number up. */
                weeks={paceFit ? Math.max(1, Math.round(paceFit.days / 7)) : undefined}
                /* ⚠ THE BOOKED EXAM, from the same store the prompt writes and
                   counted off the same `today` — 2026-10-20, the third screen's
                   "FLORIDA STATE EXAM / November 16 · 18 days".

                   This is the pair the mock could not make agree: the count
                   there read 18 beside a "29 Days" in Step 2 for one date,
                   because the calendar was on the wall clock and this column on
                   the fixture. Both are `daysUntil(examDate, today)` now, so
                   they are the same subtraction or neither renders.

                   The LABEL names the state, which is why the card takes it
                   rather than typing it — `state` is `jurisdictionName(path.state)`,
                   so it follows the Course control like every other fact here. */
                exam={
                  examDate && examDays != null
                    ? {
                        label: state ? `${state} state exam`.toUpperCase() : 'STATE EXAM',
                        value: formatPaceDateLong(examDate),
                        note:
                          examDays < 0
                            ? 'date has passed'
                            : examDays === 0
                              ? 'today'
                              : `${examDays} ${examDays === 1 ? 'day' : 'days'}`,
                      }
                    : undefined
                }
                noPace={noPace}
                /* ⚠ THE SAME `paceFit` THE WEEK COUNT READS, which is the
                   whole reason both live on this card: the span and the date
                   it lands on come from one model, so they cannot describe
                   two different plans. The states card's `expected` prop is
                   built from the same place for the same reason — see its
                   note there. */
                /* ⚠ NO "AT CURRENT PACE" AT 0% (2026-10-16, Jillienne: "at 0%
                   remove this bit"). There is no current pace to be at — the
                   learner has not started, so the date is what the
                   RECOMMENDED plan would reach, not a projection from
                   anything they have done. The note would be claiming a
                   measurement that does not exist yet. The DATE stays: it is
                   the plan's, and the plan is real. */
                /* ⚠ NO NOTE ON THE RING CARD SINCE 2026-10-19, and it is the
                   one-line row that decides it (Jillienne: "move this to the
                   right of the eyebrow - no need for 2 lines"). The label
                   takes 166 of the column's 272, which leaves room for a
                   date and not for a date plus a qualifier — with the note
                   the value wrapped to "May 24 · At / current pace", which
                   is two lines and an ugly break rather than the one line
                   that was asked for. "At current pace" was already
                   suppressed at 0% (there is no current pace before you
                   start); this drops it at every state, on the ring arm
                   only. The STATES card below still passes it. */
                expected={
                  paceFit
                    ? {
                        /* The month written out — this figure stands alone
                           at 19px, where the short form is for dates inside
                           sentences. See `formatPaceDateLong`. */
                        value: formatPaceDateLong(paceFit.finishIso),
                      }
                    : undefined
                }
                /* THE MODEL'S OWN `minsPerWeek`, not `hoursRemaining / weeks`.
                   The model spreads the work over the nights a learner
                   actually studies; dividing the total myself would answer a
                   different question and disagree with the plan it sits
                   under. Rounded to the hour — the sentence says "about". */
                hoursPerWeek={paceFit ? Math.max(1, Math.round(paceFit.minsPerWeek / 60)) : undefined}
                /* So the card knows whether its last rule has anything below
                   it to divide — see `readinessBelow`. */
                standingMessage={
                  atZeroProgress || !paceFit
                    ? undefined
                    : paceStandingMessage({
                        standing: paceStanding,
                        /* The model's own figure for this pace, so the
                           sentence and the week goal above it cannot
                           disagree about the plan. */
                        goalHoursPerWeek: Number.isFinite(paceFit.minsPerWeek) ? paceFit.minsPerWeek / 60 : 0,
                        weeks: Math.max(1, Math.round(paceFit.days / 7)),
                        finishIso: paceFit.finishIso,
                      })
                }
                readinessBelow={showReadiness}
                align={columnAlign}
                /* ⚠ "HERE" GOES TO COMPASS'S STUDY PLANNER (2026-10-16,
                   Jillienne: "have the 'here' be a link to the study planner
                   of the compass application"). It was `onOpenStop(
                   'study-plan')` — the Atlas journey's own stop, a different
                   page with a similar name. `compassPage` seeds Compass's
                   page on arrival, the same param the lesson's exit uses. */
                onCustomize={() =>
                  setParams(
                    (prev) => {
                      const next = new URLSearchParams(prev)
                      next.set('section', 'compass')
                      next.set('compassPage', 'study-planner')
                      next.delete('coursePage')
                      return next
                    },
                    { replace: true },
                  )
                }
              />
            ) : completedView ? null : (
            <AtlasCourseProgressStates
              bare={onWhite}
              // The pace pill's gauge in Light, Primary 400 (2026-10-15, Eric).
              lightGauge
              key={`progress-${progressPick}-${refreshKey}`}
              initialStage={progress.stage}
              onAdvance={advanceProgress}
              percent={progress.percent ?? percent}
              milestonePercent={75}
              /* THE PACE SENTENCE READS THE SAME MODEL as the figure below
                 it. It was the design's typed "3 weeks" under a card saying
                 "18 days to complete" — a plan that did not fit the window
                 printed beside it. `paceFit.days` is what `expected` renders
                 as a finish DATE; `paceDurationPhrase` says the same span in
                 words, in weeks or months as its length warrants. */
              paceDays={paceFit ? paceFit.days : 'none'}
              noPace={noPace}
              expected={{
                // "Nov. 5" where the pace model has no finish date — a DEMO date.
                /* THE SAME RESOLVED PACE the sentence below reads, so the
                   finish DATE and the week count cannot describe two
                   different plans. The demo date survives for the case where
                   nothing fits at all. */
                value: paceFit ? formatPaceDate(paceFit.finishIso) : 'Nov. 5',
                note: 'At current pace',
              }}
              access={
                accessDays != null && accessIso
                  ? { value: `${accessDays} ${accessDays === 1 ? 'Day' : 'Days'}`, note: `Ends ${formatPaceDate(accessIso)}` }
                  : null
              }
            />
            )}
            {/* THE EXAM-DATE CARD, between Study Pace and Readiness (2026-10-13,
                Eric's request; it was in the side column). */}
            {/* No sub-line on its first screen (2026-10-13, Eric's request). */}
            {/* 20 corners, the Readiness card's under it (2026-10-13, Eric's
                request; the card's own are 12). */}
            {/* Not on Eric/Atlas White (2026-10-14, Eric's request: "remove");
                WIP keeps it. */}
            {onWhite ? null : (
              <AtlasExamDateCard key={refreshKey} stateName={state} style={{ ...RAIL_CARD_BORDER, borderRadius: 20 }} hideIntroCopy />
            )}
            {/* The READINESS card, under the module (Figma 254:8012, 2026-10-08). */}
            {/* On the Completed view it opens on Proficient (2026-10-09, Eric). */}
            {/* Clicking it at Exam Ready takes the page back to Not Started 0%
                (2026-10-09, Eric). */}
            {/* …and it follows the Progress stage (2026-10-09, Eric: "the
                readiness module is not changing when the progress changes"). */}
            {/* Its own key prefix: the two cards are siblings, and a SHARED key
                left orphaned copies of the progress card on screen. */}
            {/* ⚠ AT 0% THE CARD STAYS BUT SAYS NOTHING YET (2026-10-16,
                Jillienne: "replace readiness back in for 0%, just do not show
                anything in the graph. change the text to Not Started. Will
                update as you progress through course material."). The first
                pass HID it — a readiness score before any coursework is a
                number with nothing behind it — but hiding it also hid the
                fact that readiness exists and is coming. An empty dial that
                names itself says both: nothing measured yet, and this is
                where it will appear.

                ⚠ THE RING ARM ONLY. The states card steps THROUGH readiness
                as one of its five screens, so an empty first screen there
                would break its own sequence. */}
            {/* The rule goes with the section: it DIVIDES readiness from the
                pace card, so on its own it is a line under the last thing on
                screen.

                ⚠ THE RING ARM DRAWS ITS OWN (2026-10-16). `readinessBelow`
                gives the ring card a bottom rule under Estimated completion
                when readiness follows, and this one on top of it put TWO
                hairlines 40px apart. The ring card's is the one Jillienne
                named ("remove the bottom divider from the estimated
                completion" — so it is hers when readiness is on), which
                makes this the duplicate. The STATES card has no such prop,
                so it still needs this. */}
            {showReadiness && onWhite && !completedView && paceCard !== 'ring' ? (
              <span aria-hidden style={WHITE_PROGRESS_RULE} />
            ) : null}
            {!showReadiness ? null : (
            <AtlasReadinessCard
              bare={onWhite}
              key={`readiness-${progressPick}-${refreshKey}`}
              initialLevel={rung.readiness}
              notStarted={ringAtZero}
              /* One eyebrow for the column — see `ATLAS_PACE_EYEBROW`. Only
                 the ring arm asks for it; the states card brings its own. */
              matchPaceEyebrow={paceCard === 'ring'}
              align={columnAlign}
              onPastLast={() => setVariant('atlas-v3-progress', 'not-started')}
            />
            )}
            </div>
            {/* The link tiles at the BOTTOM of the column (2026-10-09, Eric's
                request; they led it). */}
            {!SHOW_LINK_TILES ? null : stackedTiles ? (
              /* STACKED (Figma 269:8778, the default since 2026-10-09). DEMO
                 COUNTS as below. */
              <div style={{ display: 'flex', gap: 8 }}>
                <StackedTile
                  icon={<FileCertificateLight size={30} style={{ width: 34 }} aria-hidden />}
                  count={3}
                  noun="Certificates"
                  second="available"
                  label="View certificates"
                  onView={() => go('certificates')}
                  width={114}
                />
                <StackedTile
                  icon={<BookOpen size={30} aria-hidden />}
                  count={tabs.length}
                  noun="Active"
                  second={tabs.length === 1 ? 'course' : 'courses'}
                  label="View courses"
                  onView={() => go('courses')}
                />
              </div>
            ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              {/* INLINE — the 2026-10-08 tiles, now the alternative.
                  DEMO COUNTS — "3 Certificates" is the design's figure, not a
                  fixture's; "2 Courses" is the course tabs' count. */}
              <LinkTile
                icon={<FileCertificateLight size={26} style={{ width: 29 }} aria-hidden />}
                count={3}
                noun="Certificates"
                onView={() => go('certificates')}
              />
              <LinkTile
                icon={<BookOpen size={26} aria-hidden />}
                count={tabs.length}
                noun={tabs.length === 1 ? 'Course' : 'Courses'}
                onView={() => go('courses')}
                grow
              />
            </div>
            )}
          </div>

          {/* No divider here (2026-10-15, Eric's request) — the row's 48 is the
              whole gap. */}

          {/* Right: the journey — at most 335, White's (2026-10-13, Eric's
              request). */}
          <div style={{ flex: '1 1 0', minWidth: 0, maxWidth: 335, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* THE STATE EXAM DATE PROMPT, above the steps — Figma 428:3134
                (2026-10-15, Eric's request). Its own width, wider than the
                steps' 335. Yes and Not Yet are not wired yet. */}
            {/* On the walk this has moved INTO Step 2 — see there. */}
            {/* ⚠ HIS, NOT HERS (2026-10-19). The walk's Step 2 carries
                `ExamDatePrompt`; this position is Eric's Atlas Learning tile
                and carries the pill he promoted — see `ExamDateQuestionPill`
                for why they are two components. */}
            {/* ⚠ THE PILL ABOVE THE STEPS IS GONE ON THIS VERSION (2026-10-20)
                — Jillienne's mock has no prompt here; Step 2 carries the whole
                exam question. Keeping both would ask it twice on one screen,
                which is the duplicate `ExamCardPlacement.test.tsx` exists to
                catch on the version it guards.

                `ExamDateQuestionPill` is KEPT and still wired, unreferenced
                here — it is Eric's position and the shape his Atlas Learning
                tile draws, so it is one line from returning if this version
                wants the pill back. */}
            {/* ⚠ AT 100% THE RING ARM SHOWS THE STOPS, ALL DONE (2026-10-16,
                Jillienne: "we need to show the items in step 1 as compelted").
                The work is what was completed, so the list is the thing worth
                showing — a message in its place tells you it happened without
                showing what did.

                Eric's Congratulations panel is NOT deleted: it is what the
                STATES arm still draws at completion, which is the card it was
                designed beside (Figma 297:247, 2026-10-09). */}
            {completedView && paceCard !== 'ring' ? (
              /* STEP 1 ON THE COMPLETED VIEW — Figma 297:247 (2026-10-09,
                 Eric's request): the eyebrow, "Congratulations!" and a line in
                 place of the journey's stops. */
              <section aria-label="Study journey" style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <p style={STEP_EYEBROW}>
                  Step 1
                  {/* Not on White (2026-10-14, Eric's request). */}
                  {onWhite ? null : ' · Study Journey'}
                </p>
                <p style={STEP_TITLE}>Congratulations!</p>
                <p style={{ ...BODY_TEXT, margin: 0, fontSize: 13, lineHeight: '18px', color: 'var(--color-text-secondary)' }}>
                  You’ve completed your course and passed your course exams.{' '}
                  <span style={{ fontWeight: 600 }}>Time to get ready for your state exam!</span>
                </p>
              </section>
            ) : (
            /* 16px less under the last stop (2026-10-09, Eric: -24, then 8
               back) — its 36px row floor plus the list padding left 45 to the
               rule; now 29. */
            <section aria-label="Study journey" style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: -16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <p style={STEP_EYEBROW}>
                  Step 1
                  {/* Not on White (2026-10-14, Eric's request). */}
                  {onWhite ? null : ' · Study Journey'}
                </p>
                <p style={STEP_TITLE}>Complete Coursework</p>
              </div>
              <ol style={{ listStyle: 'none', margin: 0, padding: '3px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {journeyStops.map((stop, i) => (
                  <JourneyRow
                    key={stop.id}
                    stop={stop}
                    current={i === currentRowIdx}
                    done={i < doneRows}
                    last={i === journeyStops.length - 1}
                    onOpen={onOpenStop && !LINKS_OFF ? () => onOpenStop(stop.id) : undefined}
                    // On Track 14% only (2026-10-09, Eric): the current stop
                    // shows how far through it is and what is next (Figma
                    // 265:8145). DEMO figures and chapter, the design's own.
                    // Not Started and Milestone get the Next line alone (same
                    // day); the chapters are Eric's, per stage.
                    progressDetail={
                      onWhite || i !== currentRowIdx
                        ? undefined
                        : progressPick === 'on-track'
                          ? { done: 4, total: 13, nextLabel: 'Chapter 4', nextName: 'Legal Concepts of Insurance' }
                          : progressPick === 'not-started'
                            ? { done: 1, total: 13, nextLabel: 'Chapter 1', nextName: 'Basic Principles of Life and Health Insurance' }
                            : progressPick === 'milestone'
                              ? { done: 9, total: 13, nextLabel: 'Chapter 9', nextName: 'Annuities' }
                              : undefined
                    }
                  />
                ))}
              </ol>
            </section>
            )}

            <span aria-hidden style={RULE} />
            {/* Steps 2 and 3 drop their links on White (2026-10-14, Eric's
                request); WIP keeps them. */}
            <Step
              number={2}
              title={pass.title}
              /* ⚠ ON THE WALK THE PROMPT *IS* STEP 2'S DETAIL (2026-10-16,
                 Jillienne: "remove the 150 line and replace with the Do you
                 know your state exam"). It is MOVED, not copied — it used to
                 stand above the steps, and leaving it there as well would put
                 the same question on screen twice. Replacing the sentence is
                 also what makes the step ask something instead of reciting
                 figures the learner cannot act on yet. */
              /* ⚠ ALWAYS THE PROMPT ON THIS VERSION, not only on the walk
                 (2026-10-20). It was `walkSteps ? prompt : pass.detail`, so the
                 card needed `?journey=full` and a bare visit recited the exam
                 figures instead — which is the screen Jillienne's first mock
                 replaces. The figures are not lost: Exam Information, the stop
                 directly below, is the sheet that carries them. */
              detail={<ExamDatePrompt {...examPromptProps} stateName={state} onExamInfo={examInfo} card={examPromptCard} />}
              /* The calendar this can open is block content — see `Step`. */
              detailBlock
              link={pass.detailLabel ?? 'What to expect'}
              onLink={onOpenStep && !onWhite ? () => onOpenStep(pass.id) : undefined}
            />
            <span aria-hidden style={RULE} />
            <Step
              number={3}
              title={state ? `Get Licensed in ${state}` : 'Get Licensed'}
              /* ⚠ THE DETAIL LINE WENT, THEN A STOP CAME BACK IN ITS PLACE.
                 The sentence was dropped on the walk (2026-10-16); on
                 2026-10-19 Step 3 gained what Step 2 has — "add a circle
                 link option, blue style, under this that is: Applying for a
                 License". A step that names nothing a learner can do is a
                 heading, not a step. */
              detail={walkSteps ? <StopLink label="Applying for a License" onOpen={applyInfo} /> : apply.detail}
              link={apply.detailLabel ?? 'How to apply'}
              onLink={onOpenStep && !onWhite ? () => onOpenStep(apply.id) : undefined}
            />
            {onOpenRequirements && !walkSteps ? (
              <button
                type="button"
                data-cta-id="home.state-requirements"
                className="cre-compass-secondary"
                /* THE SHEET OPENS HERE TOO (2026-10-15, Jillienne). It is the
                   same sheet the Quick Links row opens, so silencing the big
                   button while the sidebar link worked would have been the
                   one inconsistency on the page. */
                onClick={onOpenRequirements}
                style={REQUIREMENTS}
              >
                {state ? `${state} State Requirements` : 'State Requirements'}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── The side column — on the LEFT of the course card since 2026-10-13
          (Eric's request; it was the right). `order` moves it without moving
          the markup. ── */}
      {/* 230 (2026-10-13, Eric's request) — 260 before; fitted to Quick Links'
          content and unbordered for a while that day, then back to the
          bordered card. */}
      {/* LEFT by default; the Design bar's Quick Links control puts it back on
          the right (2026-10-13). */}
      {/* 234, not 230 (2026-10-14, Eric's request): at 230 "Applying for a
          License" wrapped when hover took it to Medium — it needs 134.6 of the
          row, and 230 left 133. */}
      <div style={{ width: 234, flex: 'none', display: 'flex', flexDirection: 'column', gap: 24, order: quickLinksRight ? undefined : -1 }}>
        {/* THE EXAM-DATE CARD — Figma component 224:4118, all four states and
            a working calendar (2026-10-07, Eric's request). FIRST in the rail,
            above Quick Links, since 2026-10-13 (Eric's request). */}
        {/* The exam-date card left this column for the course card's, between
            Study Pace and Readiness (2026-10-13, Eric's request). */}
        {/* QUICK LINKS — removed on V3 2026-10-07, BACK 2026-10-13 (Eric's
            request): first with only My Courses and My Certificates, then the
            same day with the three sheet links too (Exam Information, Applying
            for a License, State Requirements) — everything but the course's
            own Flashcards and Exam Simulator. The sheets open here, in place. */}
        <AtlasJourneyLinksCard
          withoutCoursePages
          linksOff={LINKS_OFF}
          onOpenStep={onOpenStep}
          onOpenRequirements={onOpenRequirements}
          // Outlined in Secondary 100 darkened 5% (2026-10-13, Eric's request;
          // 15% was tried and reverted); the exam-date card keeps Primary 200.
          // On White, as tall as the course-head panel beside it (2026-10-14,
          // Eric's request).
          style={{
            ...RAIL_CARD_BORDER,
            border: '1px solid color-mix(in srgb, var(--color-atlas-slate-100) 95%, black)',
            ...(onWhite && headH ? { height: headH } : null),
            // …and its 20 corners (same day).
            ...(onWhite ? { borderRadius: 20 } : null),
          }}
        />

      </div>
      {/* THE AFFIDAVIT, over Home on arrival from Confirmation & Password
          (`?affidavit=1`, 2026-10-15, Eric's request), or fired from the
          design bar's Affidavit control (2026-10-16).

          ⚠ TWO WAYS IN, ONE WAY OUT. The param is how the invite flow hands
          over and the control is how a reviewer opens it on demand; whichever
          opened it, closing clears BOTH, or the modal springs straight back
          from whichever one is still set.

          The param alone means the pre-course one — that is the affidavit a
          learner signs on arriving, and it is what the flow has always
          opened. */}
      {affidavitKind ? (
        <AffidavitModal
          kind={affidavitKind}
          onClose={() => {
            setAffidavit('off')
            setParams(
              (prev) => {
                const next = new URLSearchParams(prev)
                next.delete('affidavit')
                return next
              },
              { replace: true },
            )
          }}
        />
      ) : null}
    </div>
  )
}



function JourneyRow({
  stop,
  current,
  done = false,
  last,
  onOpen,
  progressDetail,
}: {
  stop: JourneyStop
  current: boolean
  /** Every stop behind a completed course. Draws the solid check in place of
   *  the outline ring — and outranks `locked`, because a course you finished
   *  has nothing still shut. */
  done?: boolean
  last: boolean
  onOpen?: () => void
  progressDetail?: { done?: number; total?: number; nextLabel: string; nextName: string }
}) {
  if (current && progressDetail) {
    // "Pre-Licensing Lessons (42)" → the name, and 42 as the total.
    // With no `done`, the title stays whole ("Pre-Licensing Lessons (42)").
    const m = progressDetail.done == null ? null : stop.title.match(/^(.*?)\s*\((\d+)\)$/)
    const name = m ? m[1] : stop.title
    // The count is of CHAPTERS ("4 of 13", 2026-10-09), not the 42 lessons.
    const total = progressDetail.total ?? (m ? m[2] : null)
    return (
      <li style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <span aria-hidden style={{ width: 14, flex: 'none', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, paddingTop: 7 }}>
          <span style={MARK_CURRENT} />
          {last ? null : <span style={SPINE} />}
        </span>
        <span style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ ...BODY_TEXT, padding: '5px 0 3px', fontSize: 13, lineHeight: '18px', fontWeight: 600, color: 'var(--color-atlas-home-current-stop, var(--color-compass-page-button))' }}>
            {name}
            {total ? (
              <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-primary-900)' }}>
                {'  ('}
                <strong style={{ fontWeight: 600 }}>{progressDetail.done}</strong> of <strong style={{ fontWeight: 600 }}>{total}</strong> completed)
              </span>
            ) : null}
          </span>
          <span style={{ display: 'flex', alignItems: 'flex-start', gap: 4, paddingBottom: 6, minWidth: 0 }}>
            <span style={NEXT_PILL}>Next</span>
            {/* Wraps (a long chapter title ran out of room at one line). */}
            <span style={{ ...BODY_TEXT, fontSize: 11, lineHeight: '14px', paddingTop: 2, color: 'var(--color-primary-900)', minWidth: 0 }}>
              {progressDetail.nextLabel} - {/* the chapter's NAME in SemiBold, its label not (2026-10-09, Eric) */}
              <span style={{ fontWeight: 600 }}>{progressDetail.nextName}</span>
            </span>
          </span>
        </span>
      </li>
    )
  }
  return (
    <li style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minHeight: current ? 42 : 36 }}>
      <span aria-hidden style={{ width: 14, flex: 'none', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, paddingTop: current ? 7 : 3 }}>
        {/* ⚠ THE LOCK REPLACES THE RING, ON THE LEFT — 2026-10-15, the direct
            ask ("show the small gray lock icon on the left instead of the
            outline circle"). A lock on the RIGHT is what this row used to
            carry and what was removed on 2026-10-06; this is the other side
            and a different claim. The ring says "not reached yet", the
            padlock says "not yours to open", and they occupy one slot
            because a row is in exactly one of those states. */}
        {/* ⚠ DONE OUTRANKS LOCKED. A finished course has nothing still shut,
            and a padlock beside a completed stop reads as a bug. */}
        {done ? (
          <CircleCheckSolid size={14} aria-hidden style={DONE_MARK} />
        ) : current ? (
          <span style={MARK_CURRENT} />
        ) : stop.locked ? (
          <LockRegular size={12} aria-hidden style={LOCK_MARK} />
        ) : (
          <span style={MARK} />
        )}
        {/* ⚠ THE LINE GOES GREEN WITH THE CHECK ABOVE IT (2026-10-19,
            Jillienne: "when the selection turns green checkmark, should show
            the line as green too"). The spine is the track between two
            stops, so a grey one hanging off a finished row read as though
            the path stopped being walked there. Green runs from the first
            check down to the current stop and no further — the segment
            BELOW a done row is the one that has been travelled. */}
        {last ? null : <span style={done ? SPINE_DONE : SPINE} />}
      </span>
      <span
        /* ⚠ THE CURRENT ROW'S TITLE IS LINK TEXT (2026-10-19) — blue, and
           darker with an underline on hover. The class carries the COLOUR as
           well as the hover, because an inline `color` would outrank the
           hover rule and leave it doing nothing. Completed and upcoming rows
           stay inline: the check carries a finished row's state, and
           darkening its text too would make a finished list shout louder
           than the live one. */
        className={current ? 'cre-atlas-journey-link' : undefined}
        style={{
          ...BODY_TEXT,
          flex: '1 1 0',
          minWidth: 0,
          fontSize: 13,
          lineHeight: '18px',
          paddingTop: current ? 5 : 0,
          fontWeight: current ? 600 : 400,
          ...(current ? null : { color: 'var(--color-text-secondary)' }),
        }}
      >
        {stop.title}
      </span>
      {/* The current stop carries no button — Begin Course moved up beside
          the course title (2026-10-06). */}
      {/* UPCOMING stops show NOTHING on the right (2026-10-06, the designer's
          request: the lock icons removed). They were locked from 2026-10-05 —
          the FA lock (`LockRegular`, still in the icon registry), not a button;
          before that, the open chevron. Still not openable. */}
      {current ? null : stop.status === 'not-started' ? null : onOpen ? (
        <button type="button" className="cre-compass-v2-link" onClick={onOpen} aria-label={`Open ${stop.title}`} style={CHEVRON}>
          <AngleRightRegular size={13} aria-hidden style={{ color: 'var(--color-atlas-home-icon, var(--color-compass-page-button))' }} />
        </button>
      ) : null}
    </li>
  )
}

/** The state-exam-date prompt — Figma 428:3134 (2026-10-15, Eric's request).
 *  Yes and Not Yet are not wired. Extracted 2026-10-16 so it can stand above
 *  the steps (as it did) or inside Step 2 (the walk), without two copies. */
/**
 * ⚠ IT ASKS NOTHING NOW — 2026-10-19, Jillienne's copy: "Add your state exam
 * date to help plan your study pace." It was "Do you know your state exam
 * date?" with Yes and Not Yet beside it, and the new line is a REASON rather
 * than a question: it says what the date is for, which is the thing a learner
 * has to believe before entering one.
 *
 * ⚠ AND "NOT YET" IS GONE (the same pass). A question's two answers made
 * sense; a statement's did not, and "Not Yet" was the half that only ever
 * dismissed the prompt. The remaining control is the way IN.
 *
 * The other homes keep the question — `AtlasHomeEricV2`, `AtlasHomeV2` and
 * `HybridHomeV1` each draw their own and are other people's surfaces.
 */
/**
 * ⚠ ERIC'S PROMPT, RESTORED VERBATIM — 2026-10-19 ("do option 1").
 *
 * This is `ExamDatePrompt` as it stood on `ae859be`: Figma 428:3134, the
 * Primary 100 pill with "Do you know your state exam date?", Yes, and Not
 * Yet. It is the ABOVE-THE-STEPS position, which is Eric's Atlas Learning
 * tile and nowhere else.
 *
 * ⚠ WHY IT IS A SIBLING AND NOT A FLAG. Jillienne's rewrites of that
 * component on 2026-10-19 — "When is your exam?", the card, Add Date, the
 * Exam Information stop — were all meant for the WALK's Step 2, and all
 * silently reached this position too, because one component served both. The
 * step-level changes beside them were gated on `walkSteps` and so stayed off
 * his surface; these were not. Splitting the two positions into two
 * components is what makes "only the end-to-end walk" true of the inside of
 * the prompt as well as of where it sits. CLAUDE.md's rule, applied to a
 * component that had quietly become shared chrome.
 *
 * ⚠ IT IS NOT WIRED, and never was: Yes and Not Yet do nothing. Restoring
 * behaviour it did not have would not be restoring it.
 */
/**
 * WIRED — 2026-10-20. What both prompts need to be able to answer the question
 * they ask, and why it is one shape rather than two sets of props: the pill and
 * the card are two DRAWINGS of one question, and the thing the baseline got
 * wrong was having a surface ask it without being able to take the answer. Two
 * divergent prop lists is how one of them quietly goes back to that.
 */
type ExamPromptWiring = {
  /** The stored date, or undefined. Owned by `examDateStore`, never copied. */
  examDate?: string
  picking: boolean
  today: Date
  stateName: string
  onAdd: () => void
  onCancel: () => void
  onSave: (iso: string) => void
  onRemove: () => void
}

/**
 * SCHEDULED — the third screen of the mock (2026-10-20).
 *
 * ⚠ IT IS A JOURNEY STOP, NOT A CARD, which is the whole point of the drawing:
 * once a date exists, the question stops being a question and becomes a thing
 * Step 2 has DONE. So the tinted card goes, the green filled check takes the
 * mark column — `DONE_MARK`, the same glyph every completed row on this page
 * uses — and the row reads "Scheduled" over the date with an Edit beside it.
 *
 * ⚠ FILLED, AND THAT IS DELIBERATE HERE. `MARK_CURRENT`'s note says a filled
 * mark is a finished one ("it is what the green check is") and that open rings
 * are for stops being worked on. Booking the exam finishes this stop, so it
 * takes the check rather than the ring — the one place on Step 2 where that is
 * true.
 *
 * ⚠ THE DAY COUNT IS THE PAGE'S, from `today`. The mock showed "29 Days" here
 * beside "18 days" on the pace card for one date, because the calendar was on
 * the wall clock and the pace card on the fixture. One clock, counted once.
 */
function ExamDateScheduled({
  examDate,
  today,
  onAdd,
}: {
  examDate: string
  today: Date
  onAdd: () => void
}) {
  const days = daysUntil(examDate, today)
  const d = dateFromIso(examDate)
  const full = d
    ? d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : examDate
  /* Past dates are not pickable, so a negative can only come from a date
     entered before the clock moved — say it rather than printing "-3 Days". */
  const count =
    days == null ? null : days < 0 ? 'Date has passed' : days === 0 ? 'Today' : `${days} ${days === 1 ? 'Day' : 'Days'}`
  return (
    <span style={EXAM_ROW}>
      <span aria-hidden style={EXAM_MARK_COL}>
        <CircleCheckSolid size={14} aria-hidden style={DONE_MARK} />
        <span style={EXAM_SPINE} />
      </span>
      <span style={EXAM_SCHEDULED_BODY}>
        <span style={EXAM_SCHEDULED_HEAD}>
          <span style={EXAM_SCHEDULED_LABEL}>Scheduled</span>
          {/* ⚠ EDIT ALONE, as the mock has it — Remove moved into the
              calendar's footer on 2026-10-20 ("move 'remove' to the left side
              of this line, make it a red link cta").

              ⚠ IT IS STILL REACHABLE, AND THAT MATTERS more than where it
              sits: the pace model reads this date, so the page must be able to
              give it up or it is acting on an input it cannot undo — the whole
              of the bug `main`'s copy was fixed for. Edit → Remove is one
              click deeper than it was, not gone. If Edit ever stops opening
              the calendar, the way out goes with it. */}
          <span style={EXAM_SCHEDULED_ACTIONS}>
            <button type="button" className="cre-compass-v2-link" style={EXAM_EDIT} onClick={onAdd}>
              Edit
            </button>
          </span>
        </span>
        <span style={EXAM_SCHEDULED_DATE}>
          {full}
          {count ? <span style={EXAM_SCHEDULED_COUNT}>{`  |  ${count}`}</span> : null}
        </span>
      </span>
    </span>
  )
}

/**
 * THE CALENDAR, INSIDE THE CARD — 2026-10-20, Jillienne: "jill atlass version
 * should be this version of the exam date set on default", with the mock
 * showing the month grid opening inside the Primary 100 card under its own
 * heading, Cancel and Set Exam Date beneath it.
 *
 * ⚠ IT IS `AtlasExamDateCard`'s GRID, extracted rather than retyped — see
 * `AtlasExamCalendar`. That card is the Figma component (224:4118) the mock was
 * drawn from, and it is NOT rendered on this version (`onWhite` is true here),
 * so the calendar had to come to the prompt. Extracting it is what kept the
 * product at two month grids instead of three.
 *
 * ⚠ AND IT RUNS ON THE PAGE'S CLOCK, which is the one thing the mock could not
 * show. `AtlasExamCalendar` defaults `today` to the wall clock — the behaviour
 * Eric's card keeps — and this passes the demo clock, so the month it opens on,
 * the day it rings as today, the count beside the scheduled date and the pace
 * it re-plans all read one "today". The mock had an exam in November against a
 * pace model anchored to May, which is why the same date showed "29 Days" in
 * one place and "18 days" in another.
 *
 * The heading and the sub-line stay above the grid: the card is still asking
 * the question while the learner answers it.
 */
function ExamDatePickerPanel({ today, onCancel, onSave, onRemove, examDate }: ExamPromptWiring) {
  return (
    <span style={{ ...EXAM_CARD, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
      <span style={EXAM_CARD_TEXT}>
        <span style={EXAM_CARD_TITLE}>When is your exam?</span>
        <span style={EXAM_CARD_SUB}>
          Entering your exam date will help us structure your study plan.
        </span>
      </span>
      {/* The grid on its own white ground inside the tinted card, as drawn. */}
      <span style={EXAM_CAL_PANEL}>
        <AtlasExamCalendar
          initialDate={examDate ? dateFromIso(examDate) : null}
          today={today}
          onCancel={onCancel}
          onSave={(date) => onSave(isoFromDate(date))}
          /* ⚠ ONLY WHEN THERE IS A DATE TO REMOVE. Reached by Edit, never by
             Add Date, so the first-time flow is Cancel / Set Exam Date exactly
             as it was — a red Remove under a question nobody has answered is a
             destructive control with nothing to destroy. */
          onRemove={examDate ? onRemove : undefined}
        />
      </span>
    </span>
  )
}

/**
 * ⚠ WIRED 2026-10-20, and its own note above ("IT IS NOT WIRED, and never was:
 * Yes and Not Yet do nothing") is what this replaces. The pill is the prompt on
 * the DEFAULT screen — the card arm needs `?journey=full` — so leaving this one
 * dead would have meant Add Date worked only on a URL you had to know about,
 * and the pace card still could not be fed from the page you actually open.
 *
 * Yes opens the picker. Not Yet still only dismisses, which is all it ever did
 * and all a "no" can honestly do here.
 */
export function ExamDateQuestionPill(wiring: ExamPromptWiring) {
  const [notYet, setNotYet] = useState(false)
  const onNotYet = () => setNotYet(true)
  if (wiring.picking) {
    return (
      <div style={EXAM_DATE_PROMPT}>
        <ExamDatePickerPanel {...wiring} />
      </div>
    )
  }
  if (wiring.examDate) {
    return (
      <div style={EXAM_DATE_PROMPT}>
        <ExamDateScheduled
          examDate={wiring.examDate}
          today={wiring.today}
          onAdd={wiring.onAdd}
        />
      </div>
    )
  }
  /* Dismissed — and NOT remembered past this render tree, deliberately. "Not
     yet" is a statement about today, not a preference, and persisting it would
     be a reviewer's browser quietly hiding a prompt with nothing to explain it
     (the `cgp.examDate` trap, in miniature). */
  if (notYet) return null
  return (
    <div style={EXAM_DATE_PROMPT}>
      <div style={EXAM_DATE_PILL}>
        <p style={EXAM_DATE_QUESTION_PILL}>Do you know your state exam date?</p>
        <button type="button" style={EXAM_DATE_YES} onClick={wiring.onAdd}>
          Yes
        </button>
      </div>
      <button type="button" style={EXAM_DATE_NOT_YET} onClick={onNotYet}>
        Not Yet
        <AngleRightSolid size={11} aria-hidden style={{ width: 6 }} />
      </button>
    </div>
  )
}

function ExamDatePrompt({
  onExamInfo,
  card = false,
  ...wiring
}: ExamPromptWiring & { onExamInfo?: () => void; card?: boolean }) {
  /* ⚠ THE PICKER REPLACES THE WHOLE PROMPT, both arms, rather than opening
     under it. In the card arm it is the card's own subject; in the row arm the
     row is a STOP on Step 2's journey, and a month grid hanging off a stop
     would read as a third step. Exam Information below is untouched either way
     — it is the other thing Step 2 offers and does not depend on this one. */
  if (wiring.picking) return <ExamDatePickerPanel {...wiring} />
  if (wiring.examDate) {
    return (
      <span style={EXAM_ROWS}>
        <ExamDateScheduled
          examDate={wiring.examDate}
          today={wiring.today}
          onAdd={wiring.onAdd}
        />
        {onExamInfo ? <StopLink label="Exam Information" onOpen={onExamInfo} /> : null}
      </span>
    )
  }
  return (
    /* ⚠ SPANS, NOT DIVS. `Step` renders its detail inside a `<p>`, and the
       pill this replaces was a `<div>` in there — invalid nesting that
       happened to render. Flex spans say the same thing legally. */
    <span style={EXAM_ROWS}>
      {/* ⚠ IT WEARS STEP 1's ROW (2026-10-19, Jillienne: "have that text
          style better match what is happening in step 1, include a Calendar
          icon instead of a circle icon", then "this icon should line up
          vertically with the other icons in step 1"). Step 2's prompt was
          its own thing — 13/14 bold in `text-primary` on a Primary 100 pill
          — beside a list of 13/18 regular rows, so two parts of one journey
          were set two different ways.

          ⚠ THE PILL HAD TO GO FOR THE ICONS TO LINE UP. Its 16 of side
          padding inset everything inside it, which is exactly the offset
          that put the calendar off Step 1's centre line. A ground that
          cannot be aligned with the list above it was the thing in the way,
          not a decoration to keep. */}
      {card ? (
        /* ⚠ THE CARD ARM (2026-10-19, Jillienne: "add a variant of this
           where the information is in a container, light blue to match the
           top widget, When is your exam is Bold, and there is a subtext of
           line explaining that entering your exam date will help us
           structure your study pace accordingly").

           It lifts the question OUT of the list — no ring, no spine, because
           a marker column inside a container would be aligning with a list
           the container has already stepped out of. The Primary 100 ground
           is the course card's own, which is what "match the top widget"
           names. Exam Information stays a stop below it either way. */
        <span style={EXAM_CARD}>
          <span style={EXAM_CARD_TEXT}>
            <span style={EXAM_CARD_TITLE}>When is your exam?</span>
            <span style={EXAM_CARD_SUB}>
              Entering your exam date will help us structure your study plan.
            </span>
          </span>
          <button
            type="button"
            className="cre-compass-secondary cre-atlas-home-secondary"
            style={EXAM_DATE_ADD}
            onClick={wiring.onAdd}
          >
            Add Date
          </button>
        </span>
      ) : (
      <span style={EXAM_ROW}>
        {/* ⚠ A CIRCLE, NOT A CALENDAR, AND A LINE UNDER IT (2026-10-19,
            Jillienne: "change the calendar icon to a circle icon, that is
            also blue outline bc user can do it"). The calendar said what the
            row was ABOUT; the open ring says what the learner can DO with
            it, which is the only thing Step 1's marks ever say. Both stops
            here are open, so both wear the live outline — and the spine
            between them is the journey's own, so Step 2 reads as a list
            rather than two loose lines. */}
        <span aria-hidden style={EXAM_MARK_COL}>
          <span style={MARK_CURRENT} />
          <span style={EXAM_SPINE} />
        </span>
        <span style={EXAM_PROMPT_LINE}>
          <span style={EXAM_DATE_QUESTION}>When is your exam?</span>
          {/* ⚠ "ADD DATE" — 2026-10-19, Jillienne: "change to Add Date. Make
              it a solid primary color", then, once the row had become a stop
              on the journey rather than a pill of its own: "make this a
              secondary style, no background color, reduce left and right
              padding on the button". It was "Yes", the outline half of a
              question's two answers, and with the line beside it now a
              question of its own a "Yes" answered nothing.

              ⚠ IT WENT FILLED AND CAME BACK, and the second call is the one
              that fits where it ended up: a filled button inside a list of
              stops shouted over Step 1's rows next to it. Secondary is the
              Course Overview button's own class pair on this page, so the
              two outline controls on Home match and the colour follows the
              brand skin rather than being typed here. */}
          <button
            type="button"
            className="cre-compass-secondary cre-atlas-home-secondary"
            style={EXAM_DATE_ADD}
            onClick={wiring.onAdd}
          >
            Add Date
          </button>
        </span>
      </span>
      )}
      {/* ⚠ A SECOND STOP UNDER IT (2026-10-19, Jillienne: "a 2nd option
          should be shown below that calendar icon that is a active circle
          link with 'Exam Information'"). Step 2 is two things a learner can
          do before the exam, not one — and the second is the sheet that says
          what the exam IS. It takes the journey's ACTIVE mark and the
          current stop's label colour, so it reads as live rather than as a
          stop still waiting its turn.

          ⚠ IT ACTUALLY OPENS, unlike most of this page. `onOpenStep` is one
          of the three sheet handlers exempt from `LINKS_OFF` (see the note
          there) — the same handler Quick Links' own Exam Information uses,
          with the same id, so the two cannot open different sheets. */}
      <StopLink label="Exam Information" onOpen={onExamInfo} />
    </span>
  )
}

/**
 * ONE STOP THAT IS A LINK — the journey's open mark and a label in the
 * current stop's colour (2026-10-19, Jillienne: "a 2nd option should be
 * shown below that calendar icon that is a active circle link with 'Exam
 * Information'", then the same under Step 3 for "Applying for a License").
 *
 * ⚠ ONE COMPONENT BECAUSE THEY ARE ONE THING. The second ask was the first
 * one again under a different heading, and two copies of a row this small is
 * how the two sheets' entrances start looking different from each other.
 *
 * ⚠ THESE OPEN, unlike most of this page. `onOpenStep` is one of the three
 * sheet handlers exempt from `LINKS_OFF` (see the note there) — and both
 * callers pass the same ids Quick Links' own links use, so a sheet cannot be
 * reached two ways and show two things.
 */
function StopLink({ label, onOpen }: { label: string; onOpen?: () => void }) {
  return (
    <span style={EXAM_ROW}>
      <span aria-hidden style={EXAM_MARK_COL}>
        <span style={MARK_CURRENT} />
      </span>
      <button
        type="button"
        className="cre-atlas-journey-link"
        onClick={onOpen}
        disabled={!onOpen}
        style={EXAM_INFO_LINK}
      >
        {label}
      </button>
    </span>
  )
}

function Step({
  number,
  title,
  detail,
  detailBlock = false,
  link,
  onLink,
}: {
  number: number
  title: string
  /** A node, not just a string, since 2026-10-16: Step 2's detail is the
   *  state-exam-date prompt on the walk, not a sentence. */
  detail?: ReactNode
  /** Render `detail` in a `div` rather than a `p`, for a detail that contains
   *  block content. See the note at the render. */
  detailBlock?: boolean
  link: string
  onLink?: () => void
}) {
  return (
    <section aria-label={title} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <p style={STEP_EYEBROW}>Step {number}</p>
        <p style={STEP_TITLE}>{title}</p>
      </div>
      {/* ⚠ A `div` ONLY WHERE BLOCK CONTENT CAN LAND — 2026-10-20, narrowed the
          same day it was widened.

          `AtlasExamCalendar` is a month grid of `p`s and `div`s, and inside a
          `<p>` the browser CLOSES the paragraph at the first block child and
          reparents the rest: it renders, detached from the card, with the
          styles that depend on the nesting silently gone. Same invalid nesting
          `ExamDatePrompt`'s own note records ("SPANS, NOT DIVS … invalid
          nesting that happened to render").

          ⚠ BUT IT WAS EVERY STEP AT FIRST, AND THAT WAS WRONG — caught by
          Jillienne comparing Step 3 against `main`. The two render identically
          (same 13/18, margin 0, same 335×18 box), so nothing was visibly
          broken; what was broken is that a file whose whole claim is "a
          verbatim copy of main's Home apart from the exam work" had a
          difference in it that the exam work did not need. Steps 1 and 3 are
          `<p>` again, exactly as main has them, and only Step 2 — the one
          holding the calendar — opts in. */}
      {detail ? (
        detailBlock ? (
          <div style={{ ...BODY_TEXT, margin: 0, fontSize: 13, lineHeight: '18px', color: 'var(--color-text-secondary)' }}>{detail}</div>
        ) : (
          <p style={{ ...BODY_TEXT, margin: 0, fontSize: 13, lineHeight: '18px', color: 'var(--color-text-secondary)' }}>{detail}</p>
        )
      ) : null}
      {onLink ? (
        <button type="button" className="cre-compass-v2-link" onClick={onLink} style={LINK}>
          {link} →
        </button>
      ) : null}
    </section>
  )
}


/* The exam-date prompt: a Primary 100 pill (24 in, 16 corners, 33 tall)
   with Yes in Primary 500, then Not Yet › 8 to its right. */
/* The journey's own 2px row gap, and how far down each row its mark sits —
   both read by `EXAM_SPINE`, which has to span them. */
const EXAM_ROWS_GAP = 2
const EXAM_MARK_PAD = 11
/* The two stops, stacked. */
const EXAM_ROWS: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: EXAM_ROWS_GAP,
  // 20 to Step 1, 4 under the column's 24 (2026-10-15, Eric's requests: 16,
  // then 4 more).
  marginBottom: -4,
}
/* One stop: the mark, then what it says. The journey's own 8 between them.
   `stretch`, so the first row's marker column can run a spine down to the
   second — the same shape `JourneyRow` uses. */
const EXAM_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  gap: 8,
  minHeight: 36,
}
/* ⚠ THE JOURNEY'S MARKER COLUMN, at its 14 — this is what puts the calendar
   and the circle on the same vertical line as Step 1's circles above them.
   Nothing may sit to the left of it, which is why the Primary 100 pill that
   used to wrap this went. No spine: these rows lead nowhere. */
const EXAM_MARK_COL: CSSProperties = {
  width: 14,
  flex: 'none',
  alignSelf: 'stretch',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 3,
  /* Centres the 14 mark in the 36 row, so it sits on the Add Date button's
     line rather than above it. `JourneyRow` uses 3 because its rows are a
     single line of text; this one carries a 33-tall button. */
  paddingTop: EXAM_MARK_PAD,
}
/* ── Eric's exam-date pill (the above-the-steps position) ───────────────── */
const EXAM_DATE_PROMPT: CSSProperties = {
  // Fits its content (2026-10-15, Eric's request; the design's fixed 460).
  width: 'max-content',
  // 20 to Step 1, 4 under the column's 24 (2026-10-15, Eric's requests: 16,
  // then 4 more).
  marginBottom: -4,
  // The ground takes in Yes and Not Yet too, 16 in at each end (2026-10-15,
  // Eric's request); the course card's Primary 100 (the design's Secondary
  // 200, on the question and Yes only).
  // 4 above and below Yes (2026-10-15, Eric's request) — 41 tall.
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '4px 16px',
  borderRadius: 16,
  background: 'var(--color-primary-100)',
}

/* The question and Yes, 10 apart. */
const EXAM_DATE_PILL: CSSProperties = {
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

/* ⚠ `_PILL` ONLY TO KEEP ITS NAME OFF THE WALK'S. The walk's line is
   `EXAM_DATE_QUESTION`, 13/18 regular in secondary ink; this is the 13/14
   bold it was before that, and the two must not be confused for each other
   again. */
const EXAM_DATE_QUESTION_PILL: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13,
  lineHeight: '14px',
  letterSpacing: -0.2,
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
}

const EXAM_DATE_YES: CSSProperties = {
  height: 33,
  boxSizing: 'border-box',
  padding: '0 24px',
  // White, its text in Primary 500 and its 1px border two levels lighter,
  // Primary 300 (2026-10-15, Eric's requests; the design's filled 500).
  border: '1px solid var(--color-primary-300)',
  // The standard button's corners, `COMPASS_BUTTON`'s (2026-10-15, Eric's
  // request; it was 16).
  borderRadius: COMPASS_BUTTON.borderRadius,
  background: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13.5,
  lineHeight: '20.25px',
  color: 'var(--color-primary-500)',
  cursor: 'pointer',
}

const EXAM_DATE_NOT_YET: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: 0,
  border: 'none',
  background: 'none',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 11,
  lineHeight: '11px',
  color: 'var(--color-primary-500)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
}

/* ⚠ THE CARD ARM'S CONTAINER. Primary 100 is the course card's ground at the
   top of this page — "light blue to match the top widget" — and the same one
   the pill here used to wear before Step 2 joined the list. It sits a little
   proud of the stop below it, which is the point of the variant: the
   question is being lifted out of the journey rather than placed in it. */
const EXAM_CARD: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  boxSizing: 'border-box',
  padding: '12px 16px',
  borderRadius: 12,
  background: 'var(--color-primary-100)',
  marginBottom: 6,
}
const EXAM_CARD_TEXT: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  minWidth: 0,
  flex: '1 1 0',
}
/* BOLD, as asked — it is a heading inside its own container here, where in
   the row arm it is one line of a list and takes the list's weight. */
const EXAM_CARD_TITLE: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-primary)',
}
/* …and the line that says what the date buys. 11/15, the card's secondary
   ink — the same treatment the pace card's own explanation wears, so the two
   sentences on this page that explain a control read alike. */
const EXAM_CARD_SUB: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 400,
  fontSize: 11,
  lineHeight: '15px',
  color: 'var(--color-text-secondary)',
}
/* The prompt and its button, on one line while there is room for one.
   16 between them, not 10 (2026-10-19) — the gap was set when the button was
   filled and read as its own object; an outline one needs the air to stop
   looking like the end of the sentence. */
const EXAM_PROMPT_LINE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  minWidth: 0,
  flex: '1 1 0',
}
/* ⚠ STEP 1's ROW TYPE (2026-10-19) — 13/18 regular in `text-secondary`, the
   same as a journey stop's title. It was 13/14 bold in `text-primary`, which
   made the one line a learner has to ACT on look like a heading for the list
   above it. It wraps, too: `nowrap` was safe while this was a short question
   sized to its own pill, but a sentence pushes a `max-content` row past the
   column instead of using the second line it has room for. */
const EXAM_DATE_QUESTION: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 400,
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
  minWidth: 0,
}
/* The second stop's label — the CURRENT stop's treatment from Step 1 (600 in
   the current-stop colour), because its mark is the current stop's too.
   ⚠ NO `color` HERE. It is `.cre-atlas-journey-link`'s, so the hover rule can
   win — see that file. */
const EXAM_INFO_LINK: CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'none',
  textAlign: 'left',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 13,
  lineHeight: '18px',
  cursor: 'pointer',
}
const EXAM_DATE_ADD: CSSProperties = {
  /* ⚠ THE BUTTON DOES NOT SHRINK; THE SENTENCE WRAPS. Without the pill's
     `max-content` around them the row is the column's full width, and a
     flexible button broke "Add Date" over two lines rather than letting the
     line beside it use the second one it already had. */
  flex: 'none',
  whiteSpace: 'nowrap',
  height: 33,
  boxSizing: 'border-box',
  /* 12 a side, not 24 (2026-10-19). The wide padding was a filled button's,
     hugging its label on a pill of its own; in a row beside a sentence it
     was pushing the line it sits with onto a second one for no reason. */
  padding: '0 12px',
  /* The border is the secondary class's — declared here only so the box is
     the same size whichever skin paints it. */
  border: '1px solid transparent',
  // The standard button's corners, `COMPASS_BUTTON`'s (2026-10-15, Eric's
  // request; it was 16).
  borderRadius: COMPASS_BUTTON.borderRadius,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13.5,
  lineHeight: '20.25px',
  cursor: 'pointer',
}


/* ── Styles ─────────────────────────────────────────────────────────────── */

const BODY_TEXT: CSSProperties = { fontFamily: 'var(--font-body)' }

const PAGE: CSSProperties = {
  display: 'flex',
  // 32 between the course card and the right column (2026-10-07, Eric's
  // request; it was 40). V2 only.
  gap: 32,
  alignItems: 'flex-start',
  justifyContent: 'center',
}
/* Eric/Atlas White: 40 between the columns, and every eyebrow on the page in
   Neutral 800, #404040 (2026-10-14, Eric's request) — the page's eyebrow token
   and the progress figures' labels, re-pointed here so WIP is untouched. */
const WHITE_PAGE: CSSProperties = {
  ...PAGE,
  // 32 between Quick Links and the course card (2026-10-14: 40, then 8 less).
  gap: 32,
  ['--color-compass-page-eyebrow' as string]: 'var(--color-neutral-800)',
  ['--atlas-progress-label' as string]: 'var(--color-neutral-800)',
}
/* The Home course card's surface — 48 in, 14 radius (Figma). */
const CARD: CSSProperties = {
  // 830 — a 750 CONTENT area inside the 40s (2026-10-13, Eric's request:
  // 846 inside 48s earlier that day; 750 overall from 2026-10-07, and the
  // design's 711 before that).
  flex: '0 1 830px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  // 24 on top, not 48 — the course tabs sit above the title (Figma 188:1006).
  // 40 a side and below, 48 until 2026-10-13 (Eric's request).
  // 16 above the course tabs (2026-10-13, Eric's request; it was 24). Written
  // as longhands: the no-tabs case overrides `paddingTop`, and React, moving
  // between a `padding` shorthand and that longhand, cleared the top to 0.
  paddingTop: 16,
  paddingRight: 40,
  paddingBottom: 40,
  paddingLeft: 40,
  boxSizing: 'border-box',
  borderRadius: 20, // the inner cards' 20 (2026-10-13, Eric's request); it was 14
  background: 'var(--color-compass-course-card)',
  // No outer stroke (2026-10-02, the designer's request); the Compass MEDIUM
  // shadow lifts it instead (the small one was tried the same day).
  boxShadow: 'var(--shadow-compass-md)',
}
/* The cover FILLS THE ROW'S HEIGHT — the eyebrow, title and buttons beside it
   (2026-10-06, Eric's request). A frame stretched by the row, the image
   absolutely inside it, so the photo's own proportions cannot set the row's
   height; `cover` crops. Switching course tabs no longer depends on the
   photos' proportions either (they set it from 2026-10-05 to 2026-10-06, at
   the L&H photo's 1312 × 980). */
const COVER_FRAME: CSSProperties = {
  position: 'relative',
  // 235, the left column's width (2026-10-08) — was 200.
  width: V3_LEFT_W,
  flex: 'none',
  alignSelf: 'stretch',
  borderRadius: 20, // the cards' 20 (2026-10-09, Eric; it was 8)
  overflow: 'hidden',
}
/**
 * ERIC/ATLAS WHITE'S COURSE HEADER, INSIDE WIP'S CARD (2026-10-13) — Figma
 * 312:1650's arrangement as White draws it (`AtlasHomeEricWhite`), without
 * White's Primary 100 panel, since it sits in this card: a 130 cover beside
 * the eyebrow and title (bottom-aligned), then Course Overview under the cover
 * at its width and Begin Course at the right. The title has the card's width
 * less the cover, so a long one wraps less. Clicking the cover flips back.
 */
function WhiteStyleHead({
  cover,
  title,
  onCover,
  onOverview,
  onBegin,
  beginLabel,
  meta,
}: {
  cover?: string
  title: string
  onCover: () => void
  onOverview?: () => void
  onBegin?: () => void
  beginLabel: string
  /** The Expires · Days to complete row, under the title. */
  meta?: ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'stretch' }}>
        {cover ? (
          <button
            type="button"
            aria-label="Course header — layout 2 of 2. Press to show the next layout."
            onClick={onCover}
            style={{ ...WHITE_HEAD_COVER, ...COVER_TOGGLE }}
          >
            <img src={cover} alt="" style={COVER} />
          </button>
        ) : null}
        <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'flex-end' }}>
          <p style={EYEBROW}>Current course</p>
          <h2 className="cre-compass-course-title cre-atlas-home-course-title cre-atlas-home-v2-course-title" style={TITLE}>
            {title}
          </h2>
          {meta}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        {onOverview ? (
          <button
            type="button"
            className="cre-compass-secondary cre-atlas-home-secondary"
            onClick={onOverview}
            style={{ ...HEADER_BUTTON, fontWeight: 500, width: 130, flex: 'none' }}
          >
            Course Overview
          </button>
        ) : null}
        <div style={{ flex: '1 1 0', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="cre-compass-primary cre-compass-btn-primary"
            onClick={onBegin}
            disabled={!onBegin}
            style={HEADER_BUTTON}
          >
            {beginLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
/* White's cover (130 wide, at least 105 tall, 8 radius). */
const WHITE_HEAD_COVER: CSSProperties = {
  position: 'relative',
  width: 130,
  minHeight: 105,
  flex: 'none',
  alignSelf: 'stretch',
  borderRadius: 8,
  overflow: 'hidden',
}
/* The cover as the layout toggle: a bare button, the frame's own shape. */
const COVER_TOGGLE: CSSProperties = { display: 'block', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }

/* The right rail's cards outlined in Primary 200 (2026-10-13, Eric's request)
   — WIP's own; both cards default to the nav rule elsewhere. …and padded 24
   all round, the exam-date card's own, so Quick Links matches it (same day;
   it was 24 / 32 / 32). */
const RAIL_CARD_BORDER: CSSProperties = { border: '1px solid var(--color-primary-200)', padding: 24 }

/* Figma 368:519: a rule above and below (Primary 100), 6 in, the two pairs 8
   either side of a 1px Primary 100 divider the row's height (2026-10-13; 24
   apart with no divider before), 4 inside each; Open Sans 11/14 — the label
   Medium in Neutral 700, the value SemiBold in the text colour. */
const META_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 0',
  borderTop: '1px solid var(--color-primary-100)',
  borderBottom: '1px solid var(--color-primary-100)',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '14px',
  whiteSpace: 'nowrap',
}
const META_PAIR: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4 }
// Primary 200, a step darker than the rules above and below (2026-10-13, Eric's request).
const META_DIVIDER: CSSProperties = { width: 1, alignSelf: 'stretch', flex: 'none', background: 'var(--color-primary-200)' }
const META_LABEL: CSSProperties = { fontWeight: 500, color: 'var(--color-neutral-700)' }
const META_VALUE: CSSProperties = { fontWeight: 600, color: 'var(--color-text-primary)' }

/* Eric/Atlas White's Progress + Readiness panel (Figma 286:9455, 2026-10-14):
   a Primary 200 outline, 20 corners, 24 / 32 in, 16 between. The hairline
   between them is the design's #E7E0D6 — tan 300 is the nearest token. */
const WHITE_PROGRESS_PANEL: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  // 8 top and bottom (2026-10-14, Eric's request: 24, then 16 less) — the
  // cards inside keep their own 24.
  // 24 a side (2026-10-19). It was 32, briefly 40, and came back below both
  // when the column itself grew — see `V3_LEFT_W`. Tight sides on a wide
  // column is where the content ends up widest.
  padding: '8px 24px',
  boxSizing: 'border-box',
  borderRadius: 20,
  // No stroke, a Secondary 100 fill (2026-10-15, Eric's request; it had
  // Quick Links' border).
  background: 'var(--color-atlas-tan-100)',
}
const WHITE_PROGRESS_RULE: CSSProperties = { display: 'block', height: 1, background: 'var(--color-atlas-tan-300)' }

/* Eric/Atlas White's course head (2026-10-14): a Primary 100 panel, 24 in
   (32 at first, the same day),
   the card's 20 corners; 24 between the tabs and the header, the card's own
   gap. */
/* White's course-head padding. The cover is the left rail's width less this,
   so its right edge stays on the rail's below. */
const WHITE_HEAD_PAD = 40
const WHITE_COURSE_HEAD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  // 24 under the tabs (2026-10-14: 24, then 16, then 24 again).
  gap: 24,
  // The tab bar's rule — and the active tab, which shares it — in Primary 200,
  // so they show on the panel's Primary 100 (same day).
  ['--color-atlas-outlined-card' as string]: 'var(--color-primary-200)',
  // 40 all round (2026-10-14, Eric's requests: 32, then 24, then 32 with the
  // top trimmed to 24, then 16, back to 32 once the tabs were hidden, 48, 40).
  padding: WHITE_HEAD_PAD,
  // 8 more below it, before the Progress row (2026-10-14, Eric's requests:
  // 8, then 8 more; 8 less on 2026-10-15).
  marginBottom: 8,
  borderRadius: 20,
  background: 'var(--color-primary-100)',
}

const COVER: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
}
const EYEBROW: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '16.5px',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--color-compass-page-eyebrow)',
}
/* Serif H4, as the V1 course card's title (38 / 40). */
const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 400,
  fontSize: 'var(--type-atlas-h4-base-size, 38px)',
  lineHeight: 'var(--type-atlas-h4-base-line, 40px)',
  letterSpacing: '-0.01em',
  color: 'var(--color-compass-page-heading)',
}
// Page and step dividers in primary-100 (2026-10-09, Eric; briefly 200) — were the warm nav rule.
const RULE: CSSProperties = { display: 'block', height: 1, background: 'var(--color-primary-100)' }
/* The design's text links: Open Sans Bold 13, the brand's button colour. */
const LINK: CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  whiteSpace: 'nowrap',
  textAlign: 'left',
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  // The left cards' links ("Edit My Study Pace", "Help me get ready →"): Bold
  // 11 / 13 (2026-10-09, Eric's request; SemiBold 13 / 19.5 since 2026-10-06).
  fontWeight: 700,
  fontSize: 11,
  lineHeight: '13px',
  color: 'var(--color-compass-page-button)',
}
/*
 * THE STEP EYEBROWS ARE THE PAGE'S EYEBROW (2026-10-19, Jillienne: "the Step
 * 1 eyebrow should match the styling of the other eyebrows").
 *
 * It had drifted on all four axes at once — 10/15 at 0.18em against the
 * column's 11/16.5 at 0.16em, and bold where nothing else on the page is.
 * None of that was a decision; it is what two constants describing one thing
 * do when they are edited on different days.
 *
 * ⚠ AN ALIAS, NOT A COPY. Spelling the values out again is exactly how the
 * drift happened; pointing the name at `EYEBROW` makes a second divergence
 * impossible. The name stays because "STEP_EYEBROW" says where it is used.
 *
 * ⚠ THE BOLD IS GONE, including the 600 on "· Study Journey". "Step 1" was
 * set apart from the section name by weight; the separator already does that
 * work, and an eyebrow that is heavier than the eyebrows beside it is the
 * mismatch being removed, not a hierarchy being kept. One `fontWeight` on
 * this constant brings it back if the step number should lead again.
 */
const STEP_EYEBROW: CSSProperties = EYEBROW
/* Serif H8 (20 / 24). */
const STEP_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 400,
  fontSize: 'var(--type-atlas-h8-base-size, 20px)',
  lineHeight: 'var(--type-atlas-h8-base-line, 24px)',
  letterSpacing: '-0.01em',
  color: 'var(--color-text-primary)',
}
/* ⚠ THE GREY LOOK IS THINNER THAN THE LIVE ONE (2026-10-19, Jillienne: "when
   these are in the light gray look - have the stroke be slightly thinner").
   The untravelled track — the open rings and the line between them — was the
   same 2 as the green checks' line and the current stop's dot, so the part of
   the journey that has not happened carried the same weight as the part that
   has. Half a pixel is enough: it reads as quieter without turning into a
   hairline that disappears on a low-contrast screen. */
const GREY_STROKE = 1.5
const LIVE_STROKE = 2
/* ⚠ AN OUTLINE, NOT A DISC — 2026-10-19, Jillienne: "these should be circle
   strokes, not filled because they are currently being worked on". A filled
   mark is a finished one: it is what the green check is, and a solid dot a
   row above an unfinished stop said the same thing in a different colour.
   The current stop keeps the COLOUR, which is what makes it live, and gives
   up the fill, which is what made it look done. It stays at `LIVE_STROKE`
   while the stops below it are thinner — the ring is open, not faint. */
const MARK_CURRENT: CSSProperties = {
  width: 14,
  height: 14,
  boxSizing: 'border-box',
  borderRadius: '50%',
  // The current stop's title colour (XCEL: Secondary 600 brown).
  background: 'transparent',
  border: `${LIVE_STROKE}px solid var(--color-atlas-home-current-stop, var(--color-compass-page-button))`,
  flex: 'none',
}
/**
 * The REGULATED lock mark, in the ring's slot — 2026-10-15, the direct ask
 * ("show the small gray lock icon on the left instead of the outline circle").
 *
 * 12px, the ring's own box, so the spine it hangs on does not step sideways
 * when a row locks. `--color-border-subtle` is the ring's colour too: the lock
 * is `aria-hidden` decoration beside a label that is already dimmed, so it
 * should not outweigh the words it annotates — the same call Hybrid's
 * `MARK_LOCK` records for the same glyph.
 */
const LOCK_MARK: CSSProperties = {
  width: 12,
  height: 12,
  flex: 'none',
  color: 'var(--color-border-subtle)',
}

/* The completed stop's mark — the solid check, in the success green. Sized to
   the ring it replaces (12 + the icon's own 2 of inset) so the spine below it
   stays on the same centre line. */
const DONE_MARK: CSSProperties = { color: 'var(--color-success-500)', flex: 'none', marginTop: -1 }
const MARK: CSSProperties = {
  width: 12,
  height: 12,
  boxSizing: 'border-box',
  borderRadius: '50%',
  // Solid, not the design's dashed (2026-10-02, the designer's request) —
  // the rings and the spine both.
  border: `${GREY_STROKE}px solid var(--color-border-subtle)`,
  flex: 'none',
}
const SPINE: CSSProperties = {
  flex: '1 1 0',
  minHeight: 1,
  width: 0,
  borderLeft: `${GREY_STROKE}px solid var(--color-border-subtle)`,
}
/* The travelled half of the track — the same green as the check it hangs
   from (`DONE_MARK`), so the mark and its line read as one object rather
   than two things that happen to sit near each other. It keeps the FULL
   weight: thinning is what marks a stop as not yet reached, so a thin green
   line would be saying two things at once. */
const SPINE_DONE: CSSProperties = {
  ...SPINE,
  borderLeftWidth: LIVE_STROKE,
  borderLeftColor: 'var(--color-success-500)',
}
/* ⚠ THE SPINE HAS TO REACH THE NEXT MARK, and the mark it is reaching is
   inset by this row's own `paddingTop` plus the gap between the rows. Left
   to end at its row's edge it stopped 13 short — a line pointing at nothing.
   Pulled past by exactly that, it closes on the journey's own 3. */
const EXAM_SPINE: CSSProperties = {
  ...SPINE,
  marginBottom: -(EXAM_ROWS_GAP + EXAM_MARK_PAD - 3),
}
/* The course card's actions — the page's main button size (the Begin Course
   button's, 13.5 / 20.25 with 5×8 padding), side by side. */
const HEADER_BUTTON: CSSProperties = {
  ...COMPASS_BUTTON,
  minHeight: 0,
  padding: '5px 8px',
  fontSize: 13.5,
  lineHeight: '20.25px',
}

/* The primary (Begin / Resume Course): 8 more each side, 16 (2026-10-15,
   Eric's request). */
const HEADER_PRIMARY: CSSProperties = { ...HEADER_BUTTON, padding: '5px 16px' }
const CHEVRON: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: 0,
  height: 18,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  color: 'var(--color-compass-page-button)',
}
/* Hugs its label with 24 a side (2026-10-09, Eric) — it filled the column. */
const REQUIREMENTS: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '0 24px',
  height: 40,
  borderRadius: 8,
  border: '1px solid',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 14,
}

/* The DEMO bar's Progress control → the module's state, its figure, and the
   readiness band beside it (2026-10-16; it was the Design bar's until then).

   ⚠ ONE TABLE, THREE CARDS. The whole point of moving it was that a single
   pick has to leave the ring, the progress module and the Readiness card
   telling the same story — so the percentage and the band live here together
   rather than being derived twice.

   ⚠ READINESS IS NOT COMPLETION. "Ready" at 100% is the demo's shorthand and
   Jillienne flagged it the same day: somebody can finish a course and not be
   ready. When real scoring lands, THIS is the map that has to stop being a
   straight line from progress. */
/* ⚠ THE THREE TABLES ARE ONE LIST NOW — `atlasProgressLadder.ts`, 2026-10-16.
   The percentages, the readiness bands and the dropdown's labels each had
   their own copy of the same five states, so a rung could exist in one and
   not the others. `V3_READINESS_FOR` and `V3_PROGRESS_ORDER` were the other
   two; the ladder answers all three questions and the flag's variants are
   built from it.

   ⚠ READINESS IS NOT COMPLETION. "Ready" at the top is the demo's shorthand
   and Jillienne flagged it the same day: somebody can finish a course and not
   be ready. When real scoring lands, the ladder's `readiness` is the column
   that has to stop being a straight line from `percent`. */
/* Off the picker since 2026-10-16 — the ladder is a scale and "expired" is
   not a point on it. Kept so an `?ff=` pin or a stored value still resolves
   to something rather than falling through. */
const V3_EXPIRED: { stage: ProgressStage; percent?: number } = { stage: 'expired' }

/* ── V3's left column (Figma 254:7973) ──────────────────────────────────── */


/* A link tile: a thin FA icon, a count over its noun, and "View ›". */
/* A STACKED link tile (Figma 269:8778): the thin icon at 38 over a centred
   two-line label, the whole tile the button. Tertiary 200, 8 radius, 12 / 16 /
   16; the design's soft 2px drop shadow on hover only. Fixed width when given, else it fills. */
function StackedTile({
  icon,
  count,
  noun,
  second,
  label,
  onView,
  width,
}: {
  icon: ReactNode
  count: number
  noun: string
  second: string
  label: string
  onView: () => void
  width?: number
}) {
  return (
    <button
      type="button"
      className="cre-atlas-link-tile"
      onClick={onView}
      aria-label={label}
      style={{ ...V3_STACKED_TILE, ...(width ? { width, flex: 'none' } : { flex: '1 1 0', minWidth: 0 }) }}
    >
      {/* Icons 20% under the design's 38 → 30 (2026-10-09, Eric); the line box with them. */}
      <span aria-hidden style={{ display: 'inline-flex', height: 35, alignItems: 'center', color: 'var(--color-primary-500)' }}>
        {icon}
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, lineHeight: '14px', textAlign: 'center', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
        <strong style={{ fontWeight: 700 }}>{count}</strong> {noun}
        <br />
        {second}
      </span>
    </button>
  )
}

function LinkTile({
  icon,
  count,
  noun,
  onView,
  grow = false,
}: {
  icon: ReactNode
  count: number
  noun: string
  onView: () => void
  grow?: boolean
}) {
  return (
    <div style={{ ...V3_TILE, ...(grow ? { flex: '1 1 0', minWidth: 0 } : { flex: 'none' }) }}>
      <span aria-hidden style={{ display: 'inline-flex', color: 'var(--color-primary-400)' }}>
        {icon}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 2, fontFamily: 'var(--font-body)', fontSize: 11, lineHeight: '12px' }}>
        <span style={{ color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
          <strong style={{ fontWeight: 700 }}>{count}</strong> {noun}
        </span>
        <button type="button" className="cre-compass-v2-link" onClick={onView} aria-label={`View ${noun.toLowerCase()}`} style={V3_VIEW}>
          View
          <AngleRightSolid size={9} aria-hidden />
        </button>
      </div>
    </div>
  )
}



/* The current stop's "Next" pill (Figma 265:8145): Primary 100 capsule, 2 / 6,
   SemiBold 11 / 14 in Primary 500. */
const NEXT_PILL: CSSProperties = {
  flex: 'none',
  padding: '2px 6px',
  borderRadius: 20,
  background: 'var(--color-primary-100)',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 11,
  lineHeight: '14px',
  color: 'var(--color-primary-500)',
  whiteSpace: 'nowrap',
}

const V3_STACKED_TILE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  // 12px under the label (16 in Figma) and the cards' 20 radius (8 in Figma)
  // — 2026-10-09, Eric's request.
  padding: '12px 16px 12px',
  boxSizing: 'border-box',
  borderRadius: 20,
  border: 'none',
  background: 'var(--color-primary-100)', // Primary 100 (2026-10-09, Eric; was Tertiary 200)
  // The design's drop shadow shows on HOVER only (tokens.css, Eric 2026-10-09).
  transition: 'filter 150ms',
  cursor: 'pointer',
}

const V3_TILE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '12px 8px',
  boxSizing: 'border-box',
  borderRadius: 8,
  background: 'var(--color-primary-100)', // Primary 100 (2026-10-09, Eric; was Tertiary 200)
}
const V3_VIEW: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 11,
  lineHeight: '12px',
  color: 'var(--color-compass-page-button)',
}

/* ─── the Scheduled stop (2026-10-20) ─────────────────────────────────────
   Set on Step 1's row type, not on a card's: the whole move of the third
   screen is that a booked exam stops being a prompt and joins the list. */
const EXAM_SCHEDULED_BODY: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  minWidth: 0,
  flex: '1 1 auto',
}
const EXAM_SCHEDULED_HEAD: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
}
/* ⚠ GREEN, MATCHING ITS MARK. Every other stop label takes the journey's ink;
   this one is the only FINISHED stop on Step 2, and a green check over a
   neutral label read as a check that had come loose from its row. */
const EXAM_SCHEDULED_LABEL: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-success-500)',
}
const EXAM_SCHEDULED_ACTIONS: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flex: 'none',
}
const EXAM_SCHEDULED_DATE: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-primary)',
}
/* The count is a second fact on one line, so it steps back rather than wrapping
   — the separator is drawn with spaces in the string, as the mock has it. */
const EXAM_SCHEDULED_COUNT: CSSProperties = {
  color: 'var(--color-text-secondary)',
  whiteSpace: 'pre',
}
const EXAM_EDIT: CSSProperties = {
  padding: 0,
  border: 0,
  background: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
}
/* The calendar's white ground inside the Primary 100 card. 12 to the card's
   own 12, so the inner corner reads as concentric rather than coincidental. */
const EXAM_CAL_PANEL: CSSProperties = {
  display: 'block',
  padding: 12,
  borderRadius: 12,
  background: 'var(--color-surface-card)',
}
