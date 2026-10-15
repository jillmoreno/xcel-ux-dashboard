/**
 * Dashboard Rebrand — progress-state personas + the Onboarding Flow hand-off.
 *
 * Feeds the `dashboard-progress-state` demo feature flag (4 populated states)
 * AND the standalone Onboarding Flow's hand-off (`personaFromSetup`). Each
 * variant resolves to a demo persona the Dashboard Rebrand overview consumes in
 * place of the default `progressPath`, so a reviewer can walk the dashboard's
 * Current Learning Path through: 0% → some progress (On Track / At Risk) → 100%
 * renewal-ready — and so a learner who just finished onboarding lands on a
 * populated dashboard that reflects what they entered.
 *
 * Now covers **all four brands** (CRE · McKissock · Elite · STC) via per-brand
 * `BrandProgressProfile`s: a brand-true continuing-education renewal cycle
 * (Real Estate CE · Appraiser CE · Nursing CE · Securities CE) with its own
 * title, required-hour split, license expiry, and Jump Back In courses. Brands
 * without a profile (e.g. Fitzgerald) return `null` and fall back to today's
 * default learning-path resolution.
 *
 * TODO(data): the required-hour totals, renewal dates, and Jump Back In courses
 * are representative demo values — replace once real per-license progress exists.
 */
import {
  NY_LH_COURSE_IMAGE,
  NY_LH_PRELICENSING_LESSONS,
  NY_PRODUCER_HOURS_INVENTED,
} from '@/data/nyProducerRequirements'
import { XCEL_NY_PRODUCER_PATH_ID } from '@/data/studyCalendarFixtures'
import {
  courseCePathIdFor,
  coursePathIdFor,
  courseStateFor,
  type CourseId,
} from '@/data/courseFixtures'
import { FIXTURE_TODAY } from '@/data/myCoursesFixtures'
import type { Brand } from '@/context/AccountContext'
import type { CourseCardData, CourseStatus } from '@/components/courses/CourseCard'
import type { LearningPathSummary, LearningPathCategoryBreakdown, LearningPathCategory } from '@/data/learningFixtures'
import type { HomeStatus } from '@/components/learning/learningPathsHomeUtil'
import { educationTypesFor, type EducationType } from '@/data/onboarding/onboardingContent'

export type DashboardProgressVariant =
  // Setup complete, 0% logged — On Track. The state a learner lands on after
  // finishing the Onboarding Flow (kept for that hand-off; not in the demo-bar
  // picker, which uses `not-started` for the true "Not Started" compliance state).
  | 'setup-complete-0'
  // Explicit "Not Started" compliance state — 0% AND the not-started status band.
  | 'not-started'
  | 'progress-on-track'
  | 'progress-at-risk'
  // Behind pace while the license is still valid (more time left than At Risk,
  // but under-progressed for the time remaining).
  | 'progress-off-track'
  // Past the renewal/completion deadline with the requirement unmet.
  | 'progress-expired'
  | 'complete-100'
  // Persona-only "nothing in the queue" states that drive the Jump Back In
  // discovery empty branch (not in the compliance picker). `completed-empty` =
  // finished everything, nothing left to launch (celebratory copy). `new-empty`
  // = brand-new learner with nothing started or queued (get-started copy). Both
  // send the learner to the Course Catalog.
  | 'completed-empty'
  | 'new-empty'

export type DashboardProgressPersona = {
  /** Setup wizard complete? Always true now that the new-user gate lives in the
   *  standalone Onboarding Flow — kept on the type so consumers stay unchanged. */
  setupComplete: boolean
  /** A `LearningPathSummary`-shaped demo path (with mandatory/elective breakdown
   *  so the segmented gauge works) the dashboard renders instead of the default. */
  path: LearningPathSummary
  /** Explicit status — drives the Current Learning Path status band directly. */
  status: HomeStatus
  /** Resume course id (informational; the course itself rides on
   *  `path.jumpBackIn`). */
  jumpBackInId?: string
  /** Demo renewal override for the band's Deadline / Time Remaining cells. */
  renewal?: { deadline: string; weeksLeft: number }
  /** Minutes studied per day this week, Monday-first — see
   *  `STUDY_MINUTES_BY_VARIANT`. Absent when there is no progress to read. */
  weekMinutes?: number[]
  /** The last 30 days, oldest first, ending TODAY — the activity streak's
   *  history. Authored per variant; see `STUDY_ACTIVITY_BY_VARIANT`. */
  dailyMinutes?: number[]
  /** Renewal-ready treatment (100% complete): swap the resume card for a
   *  "Requirements met" state + a View certificate / Start next cycle CTA. */
  renewalReady?: boolean
  /** How the Jump Back In slot renders (auto-derived per variant):
   *   - `resume`    → an in-progress course ("Jump Back In" / "Resume course").
   *   - `up-next`   → a queued, not-started course ("Up Next" / "Launch course").
   *   - `discovery` → nothing to resume or launch — the empty state that sends
   *                   the learner to the Course Catalog. */
  jumpBackInMode?: 'resume' | 'up-next' | 'discovery'
  /** Copy tone for the `discovery` empty state: `completed` (all caught up) vs
   *  `new` (get started). Only set when `jumpBackInMode === 'discovery'`. */
  discoveryTone?: 'completed' | 'new'
}

/* ─── Per-brand progress profile ─────────────────────────────────────────── */

type BrandProgressProfile = {
  pathId: string
  /** Renewal-cycle title shown as the Current Learning Path name. */
  title: string
  category: string
  /** Two-letter state shown in the path meta. */
  state: string
  /** Total required hours (mandatory + elective). */
  mandatoryReq: number
  electiveReq: number
  /** License expiry (mm/dd/yyyy) shown on the path. */
  licenseExpiresOn: string
  /** Jump Back In course for the 0% state (not started). */
  upNext: CourseCardData
  /** Jump Back In course for the on-track state (~mid progress). */
  resumeMid: CourseCardData
  /** Jump Back In course for the at-risk state (early progress). */
  resumeEarly: CourseCardData
  /** Education-type-aware labels for the two gauge segments + the deadline stat
   *  cell. CE profiles omit these (→ the "Mandatory" / "Elective" / "License
   *  Expires" defaults); QE profiles set them per-brand so the same gauge reads
   *  as a get-licensed journey with a "Target Date". */
  mandatoryLabel?: string
  electiveLabel?: string
  deadlineLabel?: string
  /** Short unit for `hours` + the category requirements ("hrs" when unset).
   *  The QE profile measures days of the study plan. */
  unitLabel?: string
  /**
   * Generalized requirement categories (N > 2) for this journey. When set,
   * `personaFor` allocates completed hours across the list and puts it on the
   * path — the gauge/legend/detail then render N categories (superseding
   * Mandatory/Elective). `required` is the per-category hour requirement. Used
   * by the QE "Multiple Categories" journeys.
   *
   * THE LIST IS ORDERED, AND THE ORDER IS THE CURRICULUM. `personaFor` fills it
   * sequentially (see the waterfall there), so entry 0 must be the thing a
   * learner does first.
   *
   * `segment` says which half of the two-segment gauge a category belongs to —
   * declaring what used to be implicit in `mandatoryReq` / `electiveReq`. It
   * has to be explicit, because `personaFor` now derives those two totals FROM
   * this list: without it the category view and the Mandatory/Elective view
   * would allocate the same hours by two different rules and disagree.
   */
  categories?: {
    key: string
    label: string
    required: number
    segment: 'mandatory' | 'elective'
  }[]
}

/**
 * Per-brand progress profiles, keyed by education type.
 *
 * This used to be two sibling maps (`BRAND_PROFILES` for CE, `BRAND_QE_PROFILES`
 * for QE) with a hardcoded two-way branch in `profileFor`. Adding XCEL's third
 * type (`exam-prep`) as a third sibling plus a second `if` would have worked
 * and would have rotted, so the three collapse into one record here and
 * `profileFor` walks a declared fallback chain instead.
 */
const PROFILES: Record<EducationType, Partial<Record<Brand, BrandProgressProfile>>> = {
  ce: {
    // Insurance producer CE renewal (Florida Life & Health). The two category
    // names are XCEL's OWN two CE flavours — Initial Training (which adds annuity
    // and long-term care for L&H, flood for P&C) and Refresher Training — rather
    // than the generic Mandatory / Elective.
    // TODO(data): the 10/14 split is representative. XCEL publishes no per-state
    // hour breakdown in the brand file, and CE deadlines are NOT uniform — they
    // can fall on the licence anniversary or the licensee's date of birth, and
    // are not annual in every state. Do not generalise this fixture into a rule.
    xcel: {
      pathId: 'xcel-fl-lh-ce',
      title: 'Florida Life & Health CE',
      category: 'Insurance Continuing Education',
      state: 'FL',
      mandatoryReq: 10,
      electiveReq: 14,
      licenseExpiresOn: '10/31/2026',
      mandatoryLabel: 'Initial Training',
      electiveLabel: 'Refresher Training',
      upNext: { id: 'jbi-xcel-ce-ethics', title: 'Insurance Ethics', hours: 5, state: 'FL', delivery: 'online', badge: 'mandatory', status: 'not-started', progress: 0 },
      resumeMid: { id: 'jbi-xcel-ce-ltc', title: 'Long-Term Care Initial Training', hours: 8, state: 'FL', delivery: 'online', badge: 'mandatory', status: 'in-progress', progress: 45 },
      resumeEarly: { id: 'jbi-xcel-ce-annuity', title: 'Annuity Initial Training', hours: 4, state: 'FL', delivery: 'online', badge: 'mandatory', status: 'in-progress', progress: 20 },
    },
  },

  /* ─── QE (Qualifying / pre-licensing) ──────────────────────────────────────
   * Only the brands whose dashboard demos a get-licensed journey. Same shape as
   * the CE profiles — the `mandatory` segment reads as required coursework, the
   * `elective` segment as exam-prep / electives — so the two-segment gauge +
   * Deadline / Time Remaining band reuse works unchanged. Fitzgerald has no
   * entry, so it falls back to CE. */
  qe: {
    // Insurance pre-licensing (Florida Life & Health) — Part 1 of the 3-Part
    // Training Program. `Target Date` rather than `License Expires`: a
    // candidate has no licence to expire yet. The `exam-prep` entry below
    // shares this path id and covers Parts 2–3.
    // NEW YORK INSURANCE PRODUCER from 2026-09-16 — the QE Focused version's
    // demo licence. It was Florida Life & Health; the Florida pre-licensing PATH
    // is still in `learningFixtures` and still reachable, and the CE persona
    // below is untouched, so this is a change of which licence the QE journey
    // demos rather than a jurisdiction sweep.
    //
    // Every hour figure reads `NY_PRODUCER_HOURS_INVENTED`. Nothing here should
    // carry a literal — that file is the single owner, so replacing the invented
    // numbers with the real DFS requirements is one edit.
    xcel: {
      pathId: XCEL_NY_PRODUCER_PATH_ID,
      // The PRODUCT's own name, from its page. It read "New York Insurance
      // Producer Pre-Licensing", which is the licence rather than the thing
      // XCEL sells; "Premier" is dropped because the dashboard tracks the
      // learner's course, not their package tier.
      title: 'New York Life and Health Pre-licensing',
      category: 'Insurance Pre-Licensing',
      state: 'NY',
      mandatoryReq: NY_LH_PRELICENSING_LESSONS,
      // Nothing elective. Parts 2 and 3 are steps on the journey with no lesson
      // count, not a second requirement segment — see the categories below.
      electiveReq: 0,
      licenseExpiresOn: '12/15/2026',
      mandatoryLabel: 'Pre-License Education',
      electiveLabel: 'Exam Prep',
      deadlineLabel: 'Target Date',
      // Lessons of the pre-licensing course, from the LMS course card ("0 of
      // 42 lessons completed") — see `NY_LH_PRELICENSING_LESSONS`.
      unitLabel: 'lessons',
      // The 3-Part Training Program plus the study tool that follows it, as
      // four requirement categories summing to the 24 + 16 split above. This
      // is what the "Multiple categories (QE)" demo persona exists to show —
      // without it XCEL renders the plain two-segment gauge and that persona
      // is indistinguishable from the default view.
      // IN CURRICULUM ORDER — state-required education first, then XCEL's prep
      // products, then the final review. `personaFor` fills them in this order,
      // so the journey reads as a sequence rather than four part-done bars.
      /*
       * ONE COUNTED CATEGORY — the pre-licensing course, 42 lessons.
       *
       * It was four categories in invented hours, then three in days of the
       * study plan. It is Part 1 alone now, because that is what the product
       * actually counts: the course card reads "0 of 42 lessons completed" and
       * nothing on the storefront states a lesson, section or chapter count for
       * Parts 2 and 3.
       *
       * Those two are NOT dropped — they follow the course as steps on the
       * journey with no count (`PROGRAM_PART_STOPS` in `studyJourneyUtil`), the
       * same treatment the completion tasks get. Giving them invented counts to
       * keep the gauge multi-segment is precisely the move the hour figures
       * taught us not to make.
       *
       * Consequence worth knowing: the gauge and the category bars now show ONE
       * segment. That is honest — there is one measured thing — and it is why
       * the journey below it carries the programme's shape instead.
       */
      categories: [
        { key: 'pre-license', label: 'Pre-licensing Course', required: NY_LH_PRELICENSING_LESSONS, segment: 'mandatory' },
      ],
      // The resume card is the PART the learner is on, not the programme. It
      // briefly carried the path's own title, which put the same string on the
      // band heading and the card a few inches below it — one learner, one
      // course, printed twice.
      //
      // `hours` here is the COURSE's credit hours: the state's real 40, not a
      // day count. The two units sit on one screen and mean different things —
      // 40 credit hours is what New York requires, 7 days is how XCEL's plan
      // paces it.
      //
      // THE 30-DAY ACCESS WINDOW (2026-09-21). Added so the course carries the
      // one fact the pacing surfaces need and had been deriving nothing from:
      // when access ends. Without it `studyPace` has NO CEILING — `binding`
      // resolves to `'none'`, it falls back to the Focused horizon, and both
      // the `presets` card and Testing 2's tile quote a date nothing enforces.
      //
      // **30 IS SOURCED, NOT PICKED.** XCEL's own product page — "30 days
      // access to Part 1" — which is `ACCESS_DAYS_CONFIRMED` in
      // `xcel-pace-presets.html`'s rules table, one of the two constants there
      // that come from the storefront rather than from us. This IS Part 1.
      //
      // ⚠ `enrolledAt` IS LOAD-BEARING, and dropping it as redundant is the
      // mistake this note exists to stop. `warnWindowFor` clamps the countdown
      // to HALF the enrolment window, so 30 days of access gives a 15-day
      // warning window and the badge stays off at 23 days out. Without
      // `enrolledAt` there is no window to halve, the configured 60 stands, and
      // the Jump Back In card grows an "expiring soon" badge — on QE Focused,
      // which is XCEL's DEFAULT version and the thing a stakeholder lands on.
      // The clamp's own header calls this out: it exists so a course whose
      // window is shorter than its countdown does not warn from the day it is
      // bought.
      //
      /*
       * Dates are relative to FIXTURE_TODAY (2026-05-11), like every other date
       * in this file.
       *
       * ⚠ THE EXPIRY MOVED 2026-09-23, from 2026-06-03, and the reason is a
       * disagreement a learner could read off one screen: the header cell said
       * "29 days to complete course" while the Study Pace card two tiles down
       * said "22 days left to finish the course material". Both were right
       * about their own fixture and neither knew about the other.
       *
       *   - The header counts to the RENEWAL deadline, derived from
       *     `DAYS_LEFT_BY_VARIANT` — 29 for this state.
       *   - The card counts to this ACCESS expiry, minus one. `resolveCeiling`
       *     subtracts a day on purpose ("finishing on the day access dies is
       *     not finishing"), so a 30-day window shows 29 usable days.
       *
       * The old date was `enrolledAt` + 30, i.e. a 30-day window that started a
       * week ago and had 23 days left. `MAX_DEMO_DAYS_LEFT`'s own note assumed
       * the opposite — it says 29 "sits just inside the pre-licensing access
       * window the course fixture carries (30 days)", which was only true of a
       * window starting today. So the two fixtures were built against different
       * readings of the same 30 days.
       *
       * FIXTURE_TODAY + 30 makes the note true and the surfaces agree: 29 in
       * both places, one date. `enrolledAt` stays where it was — the learner
       * did enrol a week ago, and that is not what either figure counts.
       *
       * ⚠ IF JUN 3 IS THE REAL ACCESS DATE, this is the wrong end to fix and
       * `DAYS_LEFT_BY_VARIANT` should come down to 22 instead. One line either
       * way; nothing else reads these two against each other.
       *
       * All THREE states share the pair — it is one course, and an access
       * window that changed with how far along the learner is would be the
       * fixture contradicting itself.
       */
      upNext: { id: 'jbi-xcel-qe-ny', title: 'Pre-licensing Course', imageUrl: NY_LH_COURSE_IMAGE, hours: NY_PRODUCER_HOURS_INVENTED.preLicenseEducation, state: 'NY', delivery: 'online', badge: 'mandatory', status: 'not-started', progress: 0, enrolledAt: '2026-05-04', expiresAt: '2026-06-10' },
      resumeMid: { id: 'jbi-xcel-qe-ny', title: 'Pre-licensing Course', imageUrl: NY_LH_COURSE_IMAGE, hours: NY_PRODUCER_HOURS_INVENTED.preLicenseEducation, state: 'NY', delivery: 'online', badge: 'mandatory', status: 'in-progress', progress: 45, enrolledAt: '2026-05-04', expiresAt: '2026-06-10' },
      resumeEarly: { id: 'jbi-xcel-qe-ny', title: 'Pre-licensing Course', imageUrl: NY_LH_COURSE_IMAGE, hours: NY_PRODUCER_HOURS_INVENTED.preLicenseEducation, state: 'NY', delivery: 'online', badge: 'mandatory', status: 'in-progress', progress: 20, enrolledAt: '2026-05-04', expiresAt: '2026-06-10' },
    },
  },

  /* ─── Exam prep (XCEL only) ────────────────────────────────────────────────
   * XCEL is the only brand that sells exam preparation as a product of its own,
   * so it is the only entry here. Every other brand bundles exam prep into its
   * qualifying education, and `profileFor`'s fallback chain resolves them to
   * their `qe` (then `ce`) profile.
   *
   * DECIDED 2026-09-04: this is NOT a fourth learning path — it shares the
   * pre-licensing path's `pathId`. XCEL's 3-Part Training Program is ONE
   * journey (Pre-License Education → Prep Review Course → Exam Simulators), so
   * a separate path would split one curriculum in two and show a candidate two
   * paths for one licence. What differs is the FRAMING: `qe` above is Part 1
   * (the state hour requirement), and this is Parts 2–3 (the run-up to the
   * exam) — hence the smaller hour totals, the tighter window, and the
   * "Exam Date" deadline label.
   */
  'exam-prep': {
    xcel: {
      pathId: coursePathIdFor('fl'),
      title: 'Florida Life & Health Exam Prep',
      category: 'Insurance Exam Preparation',
      state: 'FL',
      mandatoryReq: 14,
      electiveReq: 8,
      licenseExpiresOn: '06/12/2026',
      mandatoryLabel: 'Prep Review',
      electiveLabel: 'Exam Simulators',
      // A pre-licensing candidate has no licence to expire — the date that
      // matters is when they sit.
      deadlineLabel: 'Exam Date',
      // The 3-Part Program's Parts 2 and 3, as the two gauge segments.
      // Curriculum order, and the segments reproduce this profile's own
      // `mandatoryReq: 14` (prep-review 8 + study-tools 6) and
      // `electiveReq: 8` (simulators) — which is what makes deriving those two
      // totals from this list a no-op rather than a change.
      categories: [
        { key: 'prep-review', label: 'Prep Review Course', required: 8, segment: 'mandatory' },
        { key: 'study-tools', label: 'Study Tools & Reviews', required: 6, segment: 'mandatory' },
        { key: 'simulators', label: 'Exam Simulators', required: 8, segment: 'elective' },
      ],
      upNext: { id: 'jbi-xcel-ep-prep', title: 'Prep Review Course', hours: 8, state: 'FL', delivery: 'online', badge: 'mandatory', status: 'not-started', progress: 0 },
      resumeMid: { id: 'jbi-xcel-ep-sim1', title: 'Exam Simulator 1', hours: 2, state: 'FL', delivery: 'online', badge: 'mandatory', status: 'in-progress', progress: 45 },
      resumeEarly: { id: 'jbi-xcel-ep-cram', title: 'Exam Cram', hours: 2, state: 'FL', delivery: 'video', badge: 'elective', status: 'in-progress', progress: 20 },
    },
  },
}

/**
 * TEXAS LIFE & HEALTH EXAM PREP — the Course control's second exam-prep
 * profile (2026-10-15).
 *
 * SPREAD FROM FLORIDA'S rather than hand-authored, and the spread is doing
 * real work: the four `categories` and their hour splits are XCEL's 3-Part
 * Training Program, which is a PRODUCT structure and carries across
 * jurisdictions unchanged — the same reasoning `nyProducerRequirements`'s
 * header gives for not treating the categories as a state requirement. What is
 * state-specific is the path it points at, what it is called, and the
 * jurisdiction stamped on the Jump Back In cards.
 *
 * ⚠ THE EXAM DATE (`licenseExpiresOn`) IS TEXAS'S, matching the Texas path and
 * the Texas study plan. The three have to agree — that is what
 * `ProgressAgreement.test.tsx` is for.
 */
const XCEL_EXAM_PREP_TX: BrandProgressProfile = {
  ...PROFILES['exam-prep'].xcel!,
  pathId: coursePathIdFor('tx'),
  title: 'Texas Life & Health Exam Prep',
  state: 'TX',
  licenseExpiresOn: '06/26/2026',
  /*
   * ⚠ THE JUMP BACK IN CARDS ARE RE-AUTHORED, not spread with `state: 'TX'`
   * — corrected 2026-10-15, the same day, after the control shipped looking
   * broken.
   *
   * The first version of this profile changed `pathId`, `title`, `state` and
   * `licenseExpiresOn` and nothing else. Every one of those is invisible on
   * Home: the band prints the CATEGORY bars, the JUMP BACK IN course and
   * TODAY'S TASKS, and `licenseExpiresOn` is overwritten downstream by
   * `RENEWAL_BY_VARIANT` (the Progress axis owns the deadline, not the
   * course). So flipping to Texas re-resolved the persona and rendered a
   * byte-identical page — the axis was working and could not be seen to.
   *
   * The lesson generalises: a demo axis is only real if it moves something
   * the band actually PRINTS. Check against the three above before adding a
   * course.
   *
   * ⚠ The COUNTS stay Florida's (8 / 6 / 8). XCEL's 3-Part Training Program
   * is a product structure and carries across jurisdictions unchanged — the
   * same reasoning `nyProducerRequirements`'s header gives for not treating
   * the four categories as a state requirement. What is Texan is which
   * course you are sitting in, not how many simulators XCEL sells.
   */
  upNext: { ...PROFILES['exam-prep'].xcel!.upNext, id: 'jbi-xcel-ep-tx-prep', title: 'Prep Review Course — Texas L&H', state: 'TX' },
  resumeMid: { ...PROFILES['exam-prep'].xcel!.resumeMid, id: 'jbi-xcel-ep-tx-sim1', title: 'Exam Simulator 1 — Texas L&H', state: 'TX' },
  resumeEarly: { ...PROFILES['exam-prep'].xcel!.resumeEarly, id: 'jbi-xcel-ep-tx-cram', title: 'Exam Cram — Texas L&H', state: 'TX' },
}

/**
 * TEXAS LIFE & HEALTH CE — the Course control's second renewal cycle,
 * 2026-10-15.
 *
 * ⚠ IT EXISTS BECAUSE OF WHERE THE CONTROL IS USED, NOT BECAUSE THE DATA WAS
 * READY. The first pass deliberately left CE on Florida: a renewal cycle is a
 * different object from a pre-licensing course — deadlines can fall on the
 * licence anniversary or the licensee's birthday and are not annual
 * everywhere — so a Texas one has to be invented rather than derived. That
 * reasoning has not changed and the warning below is the price of overriding
 * it.
 *
 * What changed is the consequence. Home's band resolves `ce` by DEFAULT and
 * `qe` (New York) on QE Focused, so with CE outside the axis the only arm the
 * Course control touched was `exam-prep` — which no version opens on. The
 * control did nothing on the landing page, which is the one page every
 * stakeholder sees.
 *
 * ⚠ EVERY FIGURE BELOW IS INVENTED: the 24-hour total, the 12/12 split, the
 * renewal date, and the course names. Texas's real CE requirement, its ethics
 * component and its renewal rule are all unconfirmed.
 *
 * TODO(data): confirm against XCEL's Texas CE catalogue and the Texas
 * Department of Insurance, then strip the markers. The FLORIDA entry above is
 * itself only representative (see its own TODO), so neither is a rule.
 */
const XCEL_CE_TX: BrandProgressProfile = {
  ...PROFILES.ce.xcel!,
  pathId: courseCePathIdFor('tx'),
  title: 'Texas Life & Health CE',
  state: 'TX',
  /* ⚠ INVENTED — an even 12/12 against Florida's 10/14, so the two cycles are
     visibly different cycles rather than one cycle with a different name.
     Texas's own split is unconfirmed. */
  mandatoryReq: 12,
  electiveReq: 12,
  /* ⚠ INVENTED. Texas renewals are believed to run on the licence
     anniversary, which is exactly the kind of rule the Florida entry's own
     note says not to generalise. One concrete date for the demo. */
  licenseExpiresOn: '11/30/2026',
  upNext: { ...PROFILES.ce.xcel!.upNext, id: 'jbi-xcel-ce-tx-ethics', title: 'Texas Insurance Ethics', state: 'TX' },
  resumeMid: { ...PROFILES.ce.xcel!.resumeMid, id: 'jbi-xcel-ce-tx-ltc', title: 'Long-Term Care Partnership (TX)', state: 'TX' },
  resumeEarly: { ...PROFILES.ce.xcel!.resumeEarly, id: 'jbi-xcel-ce-tx-annuity', title: 'Annuity Certification (TX)', state: 'TX' },
}

/**
 * The profiles the COURSE axis re-points, keyed education type → brand →
 * course.
 *
 * ⚠ `qe` IS NOT HERE, AND THAT IS A DECISION rather than an omission. It demos
 * NEW YORK and has since 2026-09-16. The Course control is a Florida/Texas
 * axis; it has no New York arm and must not acquire one by accident, so the
 * qualifying journey stays outside it.
 *
 * ⚠ `ce` WAS NOT HERE FOR HALF A DAY, and the gap is worth recording because
 * it is the kind that passes every test. Leaving CE on Florida was the right
 * call about the DATA — a Texas renewal cycle has to be invented — and it made
 * the control inert on the one page everybody opens: Home's band is `ce` by
 * default, `qe` on QE Focused, so `exam-prep` was the only arm the axis
 * touched and no version opens on it. The axis worked on Readiness and the
 * Compass tree and nowhere a stakeholder would look first.
 *
 * `profileFor` checks this map BEFORE `PROFILES` for each type in the fallback
 * chain, so an entry here wins for the course it names and nothing else moves.
 */

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  THE NEW YORK ARMS, AND THE QUALIFYING JOURNEY'S OTHER TWO — 2026-10-15
 * ─────────────────────────────────────────────────────────────────────────
 *
 * When New York joined the Course control the axis stopped being "which
 * pre-licensing product" and became "which LICENCE", and that imposed one
 * rule: every journey answers for every course. Three journeys, three
 * courses, nine profiles — anything missing falls back to its journey's own
 * default and puts a jurisdiction on screen that the Course pill does not
 * name, which is the exact contradiction New York joining was meant to end.
 *
 * Six of the nine already existed. These are the other three.
 *
 * ⚠ ALL THREE ARE INVENTED, and the asymmetry is worth stating plainly: the
 * New York QUALIFYING licence is the one thing in this repo confirmed against
 * XCEL's published requirements page, and it is untouched below. A New York
 * CE renewal cycle and a New York exam-prep arm are not products this repo
 * knows anything about — they exist so the control cannot lie. Likewise the
 * Florida and Texas qualifying arms: the paths are real fixtures, the LESSON
 * COUNTS are not.
 *
 * TODO(data): confirm against XCEL's own state catalogues. Until then these
 * are shapes with placeholder numbers in them.
 */

/** ⚠ INVENTED — a New York renewal cycle, so the CE journey answers for the
 *  New York licence. Derived from Florida's; only identity and the deadline
 *  differ. TODO(data): New York's real CE requirement and renewal rule. */
const XCEL_CE_NY: BrandProgressProfile = {
  ...PROFILES.ce.xcel!,
  pathId: courseCePathIdFor('ny'),
  title: 'New York Life & Health CE',
  state: 'NY',
  licenseExpiresOn: '12/31/2026',
  upNext: { ...PROFILES.ce.xcel!.upNext, id: 'jbi-xcel-ce-ny-ethics', title: 'New York Insurance Ethics', state: 'NY' },
  resumeMid: { ...PROFILES.ce.xcel!.resumeMid, id: 'jbi-xcel-ce-ny-ltc', title: 'Long-Term Care Partnership (NY)', state: 'NY' },
  resumeEarly: { ...PROFILES.ce.xcel!.resumeEarly, id: 'jbi-xcel-ce-ny-annuity', title: 'Annuity Suitability (NY)', state: 'NY' },
}

/** ⚠ INVENTED — a New York exam-prep arm. The 3-Part Training Program is a
 *  PRODUCT structure and carries across jurisdictions unchanged, so only the
 *  path, the title and the jurisdiction on the cards differ. */
const XCEL_EXAM_PREP_NY: BrandProgressProfile = {
  ...PROFILES['exam-prep'].xcel!,
  pathId: coursePathIdFor('ny'),
  title: 'New York Life & Health Exam Prep',
  state: 'NY',
  licenseExpiresOn: '12/15/2026',
  upNext: { ...PROFILES['exam-prep'].xcel!.upNext, id: 'jbi-xcel-ep-ny-prep', title: 'Prep Review Course — New York L&H', state: 'NY' },
  resumeMid: { ...PROFILES['exam-prep'].xcel!.resumeMid, id: 'jbi-xcel-ep-ny-sim1', title: 'Exam Simulator 1 — New York L&H', state: 'NY' },
  resumeEarly: { ...PROFILES['exam-prep'].xcel!.resumeEarly, id: 'jbi-xcel-ep-ny-cram', title: 'Exam Cram — New York L&H', state: 'NY' },
}

/**
 * The QUALIFYING journey for Florida and Texas — ⚠ INVENTED lesson counts.
 *
 * Derived from the New York qualifying profile, which is the one this repo
 * has reasoned about hardest (see `nyProducerRequirements.ts`). What carries
 * across unchanged is the SHAPE: one counted category, the pre-licensing
 * course, measured in lessons, with Parts 2 and 3 following as uncounted
 * steps on the journey. That shape is XCEL's product, not New York's law.
 *
 * ⚠ WHAT DOES NOT CARRY IS THE COUNT. New York's 42 comes from the LMS course
 * card for that specific course. Nothing states Florida's or Texas's, so the
 * figures below are placeholders chosen to be visibly different from each
 * other and from 42 — a reviewer flipping the control should see the
 * denominator move, and nobody should mistake these for published counts.
 */
function xcelQualifyingFor(
  course: 'fl' | 'tx',
  title: string,
  /** ⚠ INVENTED lesson count. TODO(data): the LMS course card for this course. */
  lessons: number,
): BrandProgressProfile {
  const ny = PROFILES.qe.xcel!
  return {
    ...ny,
    pathId: coursePathIdFor(course),
    title,
    state: courseStateFor(course),
    mandatoryReq: lessons,
    categories: [
      { key: 'pre-license', label: 'Pre-licensing Course', required: lessons, segment: 'mandatory' },
    ],
    // The resume card is the PART the learner is on, and its image is New
    // York's course art — dropped rather than re-pointed, so no card claims
    // a jurisdiction it does not have.
    upNext: { ...ny.upNext, id: `jbi-xcel-qe-${course}`, imageUrl: undefined, hours: lessons, state: courseStateFor(course) },
    resumeMid: { ...ny.resumeMid, id: `jbi-xcel-qe-${course}`, imageUrl: undefined, hours: lessons, state: courseStateFor(course) },
    resumeEarly: { ...ny.resumeEarly, id: `jbi-xcel-qe-${course}`, imageUrl: undefined, hours: lessons, state: courseStateFor(course) },
  }
}

const XCEL_QE_FL = xcelQualifyingFor('fl', 'Florida Life and Health Pre-licensing', 36)
const XCEL_QE_TX = xcelQualifyingFor('tx', 'Texas Life and Health Pre-licensing', 30)

const COURSE_PROFILES: Partial<
  Record<EducationType, Partial<Record<Brand, Record<CourseId, BrandProgressProfile>>>>
> = {
  'exam-prep': {
    xcel: {
      fl: PROFILES['exam-prep'].xcel!,
      tx: XCEL_EXAM_PREP_TX,
      ny: XCEL_EXAM_PREP_NY,
    },
  },
  /* ⚠ THE QUALIFYING JOURNEY IS HERE NOW, and its New York arm is the
     UNTOUCHED published profile — `PROFILES.qe.xcel` itself, not a copy. With
     New York selected (the default) this map resolves to exactly what
     `profileFor` resolved before the Course control existed, which is what
     keeps a plain load of `main` unchanged. */
  qe: {
    xcel: {
      fl: XCEL_QE_FL,
      tx: XCEL_QE_TX,
      ny: PROFILES.qe.xcel!,
    },
  },
  ce: {
    xcel: {
      fl: PROFILES.ce.xcel!,
      tx: XCEL_CE_TX,
      ny: XCEL_CE_NY,
    },
  },
}

/**
 * Fallback chain, declared once: `exam-prep` → `qe` → `ce`.
 *
 * A brand degrades to the nearest journey it actually has, so no caller gets
 * `undefined` for a brand that has any profile at all. Written as a walk over
 * an ordered list rather than a stack of `if`s so a fourth education type is a
 * one-line change here instead of another branch.
 */
const PROFILE_FALLBACK: Record<EducationType, EducationType[]> = {
  ce: ['ce'],
  qe: ['qe', 'ce'],
  'exam-prep': ['exam-prep', 'qe', 'ce'],
}

function profileFor(
  brand: Brand,
  educationType: EducationType,
  course?: CourseId,
): BrandProgressProfile | undefined {
  for (const t of PROFILE_FALLBACK[educationType]) {
    /* ⚠ NO COURSE MEANS "WHAT THIS JOURNEY ALWAYS RESOLVED", and that is the
       whole of how the control's `auto` default works — see `CourseSelection`.
       There is no default course applied here on purpose: defaulting to
       Florida would drag the qualifying journey off New York, and defaulting
       to New York would drag CE off Florida. Both of those were tried, both
       changed what a plain load of `main` renders, and one has a test on it.

       The lookup is INSIDE the fallback walk rather than before it, so a
       brand whose `exam-prep` is course-aware and whose `qe` is not degrades
       the way it always did instead of skipping a rung. */
    const byCourse = course ? COURSE_PROFILES[t]?.[brand] : undefined
    if (byCourse) return byCourse[course!]
    const found = PROFILES[t][brand]
    if (found) return found
  }
  return undefined
}

/**
 * Whether the Demo Controls bar shows the Education dropdown for this brand.
 *
 * REDEFINED 2026-09-04. It used to mean "has a QE profile", which was the same
 * question only while there were exactly two education types. It now means
 * "switching the dropdown would actually change the dashboard" — the number of
 * DISTINCT personas the brand's offered types resolve to, after `profileFor`'s
 * fallback chain has collapsed the ones that alias.
 *
 * Two weaker definitions were considered and are both wrong:
 *
 *   - "has more than one PROFILE entry" — would miss that two entries can be
 *     for types the brand does not offer.
 *   - "offers more than one TYPE" (`educationTypesFor(brand).length > 1`) —
 *     reads well and is wrong for Fitzgerald, which lists qe + ce but has no
 *     progress profile of either kind. That would have turned its dropdown on
 *     as a control with two options and no effect. Every brand lists at least
 *     two types, so that version would also never return false for anyone.
 *
 * Answers, unchanged from before this widening except for the new brand:
 * CRE · McKissock · Elite · STC · XCEL true, Fitzgerald false.
 */
export function dashboardEducationSupported(brand: Brand): boolean {
  const personas = new Set(educationTypesFor(brand).map((t) => profileFor(brand, t.type)))
  personas.delete(undefined)
  return personas.size > 1
}

/** Total required hours for a brand's demo renewal cycle (0 when no profile). */
function setupReqHoursFor(brand: Brand): number {
  const p = PROFILES.ce[brand]
  return p ? p.mandatoryReq + p.electiveReq : 0
}
export { setupReqHoursFor }

/** Legacy alias, kept for back-compat with call sites that still import the
 *  Elite-era name. Now resolves XCEL's required hours — the constant is the
 *  ACTIVE brand's total, and there is only one brand. */
export const ELITE_SETUP_REQ_HOURS = setupReqHoursFor('xcel')

/* ─── Shared per-variant templates (brand-agnostic demo values) ──────────── */

// Completed fractions of each category's requirement, per variant. Applied to a
// brand's mandatory/elective requirement to derive the gauge (Elite's original
// 6/9 + 8/15 on-track and 3/9 + 3/15 at-risk fall out of these ratios).
// Uniform per-category ratios so the derived overall % lands on the demo
// targets (0% · ~15% · ~63% · 100%) across every brand's hour split (integer
// rounding keeps it within a couple points of the label). `progress-expired`
// sits mid-way (~40%) with the requirement unmet.
/** Exported for `ProgressArithmetic.test.ts`, which checks that the activity
 *  history adds up to the progress these ratios put on the ring. */
export const PROGRESS_RATIOS: Record<DashboardProgressVariant, { m: number; e: number }> = {
  'setup-complete-0': { m: 0, e: 0 },
  'not-started': { m: 0, e: 0 },
  'progress-on-track': { m: 0.63, e: 0.63 },
  'progress-at-risk': { m: 0.15, e: 0.15 },
  // Behind pace: only ~20% done with the license still valid.
  'progress-off-track': { m: 0.2, e: 0.2 },
  'progress-expired': { m: 0.4, e: 0.4 },
  'complete-100': { m: 1, e: 1 },
  // Finished everything (100%) but nothing left in the queue → discovery.
  'completed-empty': { m: 1, e: 1 },
  // Brand-new learner, nothing started or queued → discovery.
  'new-empty': { m: 0, e: 0 },
}

/**
 * ON TRACK is 27 DAYS OUT, not 22 weeks — changed 2026-09-16 at Jillienne's
 * request, and `weeksLeft` is therefore a FRACTION here.
 *
 * Why days: the default view is now QE Focused, a New York producer candidate
 * working a fixed curriculum towards a booked exam. "22 wks" reads as a learner
 * with no reason to open the app this month, which is the opposite of the story
 * the Study Journey beside it tells. Under 30 days `timeRemaining` switches to
 * a day countdown on its own, so the surfaces need no special case — that
 * switch is exactly what this constant is reaching for.
 *
 * **No At Risk treatment comes with it**, which was the explicit ask. The
 * status is not derived from this number for any persona: `STATUS_BY_VARIANT`
 * supplies a `statusOverride`, and every band and the detail sheet prefer it
 * over their `weeksLeft`-based `derivedStatus`. The tint, the pill and the
 * message all follow the override, so On Track stays On Track at 27 days.
 *
 * FIXED 2026-09-21, and it was forced rather than chosen. This note used to end
 * "`deadline` and `weeksLeft` in this map have never agreed with each other …
 * deriving one from the other is the fix; it would move every state's visible
 * date, so it is its own change." The direct ask — "demo data for now should
 * never be more than 30 days to complete course" — IS that change: capping the
 * countdown while leaving authored deadlines would have put "20 days to
 * complete" beside a date in 2027 on every state but this one, turning a
 * documented quirk into a fresh contradiction.
 *
 * So the table below authors DAYS and derives the deadline from
 * `FIXTURE_TODAY`. One number per state, and the pair can no longer disagree.
 */
const ON_TRACK_DAYS_LEFT = 17

/**
 * The cap the ask sets — "demo data for now should never be more than 30 days
 * to complete course".
 *
 * ⚠ IT WAS 29 UNTIL 2026-10-05, and the reason is worth keeping because it was
 * right at the time: `timeRemaining` switched to a day countdown at
 * `days < 30`, so 30 was the one value inside the cap that still rendered as
 * "4 wks" — a state nominally within the window and visibly outside it. 29 was
 * then "the largest value that both satisfies the ask and reads as the ask
 * intends".
 *
 * The ask that made this 30 ("the top should say 30 days to complete course")
 * was answered at the OTHER end: `timeRemaining` now counts days at
 * `days <= 30`, so thirty is sayable and the cap can be the number the product
 * actually sells. The window and the countdown finally name the same figure.
 *
 * ⚠ IT ONLY SHOWS WHEN NO EXAM DATE IS SET. A stored exam date overrides the
 * persona's renewal entirely (`examDateRenewal`, 2026-09-21) so the date, the
 * countdown and the Pacing tile move together — so a learner with May 20 booked
 * reads "9 days" here and should. This number is the no-date case.
 *
 * It also sits just inside the pre-licensing access window the course fixture
 * carries (30 days), so no state counts down longer than the access it is
 * counting inside — which is the thing that read as wrong to begin with.
 */
const MAX_DEMO_DAYS_LEFT = 30

/** `FIXTURE_TODAY` + n days, as the zero-padded `MM/DD/YYYY` every consumer of
 *  `deadline` already parses. Built from local parts, never from an ISO string
 *  — the UTC off-by-one `courseExpiry` documents. */
function deadlineIn(days: number): string {
  const d = new Date(FIXTURE_TODAY)
  d.setDate(d.getDate() + days)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${d.getFullYear()}`
}

/**
 * How long the pre-licensing course grants access, in days.
 *
 * THE WINDOW IS THE SAME FOR EVERYONE; what differs is when they enrolled —
 * 2026-09-23, the chosen model. The fixture's own note refuses a window that
 * varies by state ("an access window that changed with how far along the
 * learner is would be the fixture contradicting itself"), and that still
 * holds: one course sells one window. A persona further through it simply
 * bought earlier.
 */
const COURSE_ACCESS_DAYS = 30

/**
 * The enrolment / expiry pair that makes the Study Pace card count to the SAME
 * figure the header does.
 *
 * ⚠ THE `+ 1` IS LOAD-BEARING. `resolveCeiling` takes the access expiry and
 * subtracts a day — "finishing on the day access dies is not finishing" — so a
 * window that ends in N+1 days is what shows N usable ones. Derived here rather
 * than authored per state because the two figures disagreed once already, on
 * one persona, and nothing on screen said which was wrong.
 */
function accessWindowFor(daysLeft: number): { enrolledAt: string; expiresAt: string } {
  const expires = new Date(FIXTURE_TODAY)
  expires.setDate(expires.getDate() + daysLeft + 1)
  const enrolled = new Date(expires)
  enrolled.setDate(enrolled.getDate() - COURSE_ACCESS_DAYS)
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { enrolledAt: iso(enrolled), expiresAt: iso(expires) }
}

/**
 * The window the ACCESS-WINDOW CONTROL asks for — 2026-10-15.
 *
 * ⚠ A SECOND BUILDER RATHER THAN A WIDER `accessWindowFor`, and the clamp is
 * why. That one puts enrolment exactly `COURSE_ACCESS_DAYS` before expiry,
 * which is right for every figure it serves (all ≤ 30) and nonsense past
 * that: 400 days of access would date the enrolment 371 days into the FUTURE,
 * and `warnWindowFor` divides that window in half to decide whether to badge.
 * Here enrolment is never later than today — a longer window means the
 * learner bought a longer product, not that they bought it next year.
 *
 * ⚠ IT DOES NOT TOUCH `accessWindowFor`, deliberately. Clamping there would
 * move `not-started`'s enrolment (today + 1 on `main`) back to today, widening
 * its window from 30 days to 31 and its badge threshold from 15 to 15.5 —
 * enough to flip the expiring-soon badge on a persona nobody asked to change.
 *
 * ⚠ AND THERE IS NO `+ 1` HERE, which is the other difference from
 * `accessWindowFor`. That one adds a day so the PACE card's usable-days
 * figure matches the header's countdown. This control is read the other way
 * round: a reviewer picking "7 days" is asking the header to say 7, and the
 * first build of this shipped saying 8. The pace ceiling is then `expires`
 * minus one, which is correct on its own terms — finishing on the day access
 * dies is not finishing — so "1 day" leaves no usable day at all and the pace
 * card drops into its no-honest-pace branch, which is the state that row is
 * there to demo.
 */
function demoExpiryWindowFor(daysLeft: number): { enrolledAt: string; expiresAt: string } {
  const expires = new Date(FIXTURE_TODAY)
  expires.setDate(expires.getDate() + daysLeft)
  const enrolled = new Date(expires)
  enrolled.setDate(enrolled.getDate() - COURSE_ACCESS_DAYS)
  const today = new Date(FIXTURE_TODAY)
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { enrolledAt: iso(enrolled > today ? today : enrolled), expiresAt: iso(expires) }
}

/**
 * The states whose course window is aligned to their countdown.
 *
 * NOT ALL OF THEM, by instruction. `progress-off-track` authors its own short
 * window on purpose (see the chain below — it is what makes the unreachable-pace
 * branch reachable), `progress-expired` sits in the past, and the fresh-start
 * states have nothing to reconcile. Aligning those would have rewritten stories
 * nobody asked to change.
 */
const ALIGNED_WINDOW_VARIANTS = new Set<DashboardProgressVariant>([
  'not-started',
  'progress-on-track',
  'progress-at-risk',
])

/** Days left per state — every one at or under {@link MAX_DEMO_DAYS_LEFT}. */
const DAYS_LEFT_BY_VARIANT: Record<DashboardProgressVariant, number> = {
  // A fresh start has the whole window.
  'setup-complete-0': MAX_DEMO_DAYS_LEFT,
  'not-started': MAX_DEMO_DAYS_LEFT,
  'progress-on-track': ON_TRACK_DAYS_LEFT,
  /* At Risk = a short runway with the requirement barely begun — 3 days as of
     2026-09-23, the direct ask, down from 21.

     ⚠ NO PACE FITS THERE, and that was asked about and confirmed rather than
     discovered afterwards. At ~15% of 42 lessons roughly 36 remain; three days
     puts `minsPerWeek` past `CEILING_MINS × 6` on every preset, so the Study
     Pace card drops into its `state: 'no'` branch and says no honest number
     exists. That is the intended reading — a learner who has genuinely run out
     of runway — and it means this persona now exercises a branch only
     `progress-off-track` reached before. */
  'progress-at-risk': 3,
  // Off Track = less room than On Track and well behind the pace needed. It was
  // "~3 months of runway"; the 30-day cap makes that story unavailable, so what
  // distinguishes it now is the SHORTFALL rather than the horizon — which is
  // what `STATUS_BY_VARIANT`'s override was always carrying anyway.
  /* 10, matching the short access window this state's course now carries (see
     the jump-back-in chain). A renewal countdown LONGER than the access it sits
     inside is the kind of disagreement the deadline/days-left pair was just
     rebuilt to stop. */
  'progress-off-track': 10,
  // Expired = the deadline is behind us. The STATE comes from the status
  // override, not from this number; the date is a day in the past so the two
  // do not contradict each other on the surfaces that print it.
  'progress-expired': -1,
  'complete-100': MAX_DEMO_DAYS_LEFT,
  'completed-empty': MAX_DEMO_DAYS_LEFT,
  'new-empty': MAX_DEMO_DAYS_LEFT,
}

const RENEWAL_BY_VARIANT: Record<DashboardProgressVariant, { deadline: string; weeksLeft: number }> =
  Object.fromEntries(
    (Object.keys(DAYS_LEFT_BY_VARIANT) as DashboardProgressVariant[]).map((v) => {
      const days = DAYS_LEFT_BY_VARIANT[v]
      return [
        v,
        {
          deadline: deadlineIn(days),
          /* A FRACTION on purpose. `timeRemaining` switches to a day countdown
             under 30 days and every state is now inside that, so what the
             surfaces print is days — the weeks value exists because that is the
             unit the consumers take, not because anything displays weeks. Never
             below 0: an expired state's date is in the past, but a negative
             countdown renders "-1 days" beside a required rate of infinity. */
          weeksLeft: Math.max(0, days) / 7,
        },
      ]
    }),
  ) as Record<DashboardProgressVariant, { deadline: string; weeksLeft: number }>

/**
 * MINUTES ACTUALLY STUDIED, Monday-first, for the week containing
 * `FIXTURE_TODAY` — 2026-09-21, the direct ask that the pace card's week strip
 * stop being a suggestion once there is progress to read.
 *
 * ⚠ THIS IS NEW DEMO DATA, and authoring it was the decision rather than a
 * detail. The pacing version has refused observed rates throughout — its flag
 * description says none of the treatments "invents an observed rate, a schedule
 * to be ahead of, or a projected finish date, because nothing here knows any of
 * those", and a test sweeps every treatment for that copy. Deriving a week's
 * activity from a progress PERCENTAGE would have been exactly that invention:
 * plausible, unfalsifiable and false. Giving the model the fact instead is the
 * honest way to have it.
 *
 * PER VARIANT, which is the whole point — the demo picker has to change the
 * strip. `not-started` is absent deliberately: with nothing studied there is
 * nothing to read, and the card falls back to stating the suggested week.
 *
 * ⚠ THE FIXTURE CLOCK IS A MONDAY (2026-05-11), so only index 0 has elapsed and
 * the strip shows ONE filled circle whatever these say. The later days are
 * authored anyway — they are what the week looks like, and they become visible
 * the moment the clock moves. See the card's own note for the two ways out.
 *
 * NOT `LEARNING_STREAK.recent30`, which already carries per-day minutes: it is
 * one array for every brand and every state (so the picker would not move it),
 * and its "today" is 2026-05-20 — nine days off this file's clock.
 */
const STUDY_MINUTES_BY_VARIANT: Partial<Record<DashboardProgressVariant, number[]>> = {
  // Behind: a short Monday against a target of roughly an hour and three
  // quarters, which is what "at risk" should look like in a week rather than
  // only in a status pill.
  'progress-at-risk': [25, 0, 40, 0, 0, 0, 0],
  // On track: a full Monday, then a week that keeps the pace.
  'progress-on-track': [105, 95, 110, 0, 100, 0, 0],
  'progress-off-track': [30, 0, 0, 45, 0, 0, 0],
  // Finished: the week tapers because there is nothing left to do.
  'complete-100': [60, 40, 0, 0, 0, 0, 0],
  'progress-expired': [0, 0, 0, 0, 0, 0, 0],
}


/**
 * How far through the path the learner is, 0-100.
 *
 * ⚠ EXTRACTED 2026-10-15 so `personaFor` can ask the same question `buildPath`
 * answers. It needs to, because the JUMP BACK IN card carries a percentage of
 * its own and on a one-course path that is the SAME percentage — see the
 * alignment in `personaFor`. Two expressions for one fact is how they came to
 * disagree by eighteen points.
 *
 * When a category list is present it drives the totals (the gauge reads it);
 * otherwise the Mandatory/Elective sum does.
 */
function pathProgressPct(
  mandatory: LearningPathCategoryBreakdown,
  elective: LearningPathCategoryBreakdown,
  categories?: LearningPathCategory[],
): number {
  const totalRequired = categories?.length
    ? categories.reduce((a, c) => a + c.required, 0)
    : mandatory.required + elective.required
  const totalCompleted = categories?.length
    ? categories.reduce((a, c) => a + c.completed, 0)
    : mandatory.completed + elective.completed
  return totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0
}

/**
 * EVERY DAY THE LEARNER HAS HAD THE COURSE, oldest first, the final entry being
 * TODAY — 2026-09-23, for the activity streak.
 *
 * ⚠ ITS LENGTH IS NOT 30, AND THAT WAS THE BUG. A first build drew a flat
 * thirty-day chart for every persona, which is impossible: access is
 * `COURSE_ACCESS_DAYS` (30) and On Track has 17 days LEFT, so that learner has
 * had the course for THIRTEEN days. The card was showing more history than the
 * enrolment has existed, and claiming a three-week streak inside it.
 *
 * SO EACH ARRAY IS `COURSE_ACCESS_DAYS - daysLeft` LONG, and
 * `ProgressArithmetic.test.ts` asserts exactly that rather than trusting this
 * note. It also checks the two other sums that have to hold:
 *
 *   TOTAL MINUTES = the progress percentage × the course's own hours. A
 *   learner 63% through a 40-hour course has studied 1,512 minutes, and the
 *   bars have to add up to it — otherwise the chart and the progress ring are
 *   describing two different people.
 *
 *   THE LAST ENTRY = `STUDY_MINUTES_BY_VARIANT`'s Monday. `FIXTURE_TODAY` is a
 *   Monday, so today is the only day the two arrays overlap; where they touch
 *   they must state the same number.
 *
 * ⚠ THE CONSEQUENCE IS A SHORT STREAK, and it is the honest one. Thirteen days
 * contains exactly ONE complete Mon–Sun week, so On Track reads "1 week on
 * pace" and cannot read more. A longer run needs a persona further into its
 * window — which means fewer days left, which the header countdown states.
 * The two cannot be tuned apart.
 *
 * ⚠ AND `complete-100` HAS NO ENTRY. It carries `MAX_DEMO_DAYS_LEFT` (29) with
 * the course finished, which works out to one day of access — a 40-hour course
 * completed the day it was opened. That is a pre-existing oddity in the
 * persona, not something an activity chart can draw, so it shows no streak.
 *
 * AUTHORED, NOT DERIVED, the way `NY_LH_LESSON_TITLES_INVENTED` is. Nothing in
 * this repo records a learner's history; a streak needs a past, so a past was
 * written.
 */
const STUDY_ACTIVITY_BY_VARIANT: Partial<Record<DashboardProgressVariant, number[]>> = {
  /* ON TRACK — 13 days (30 − 17), 1,512 minutes (63% of 40 hours), 11 study
     nights averaging just over 2¼ hours. Ahead of the plan's 1¾, which is what
     "on track with 17 days left at 63%" actually means.

     ⚠ THE SPREAD IS DELIBERATE, widened 2026-09-23. These were all 132–150 —
     every evening within a quarter-hour of every other — and the activity
     chart rendered as a flat row whatever shading it was given, because there
     was nothing for the shades to distinguish. Real study weeks are not
     uniform. The range is now 85–200 against a 1¾-hour target, which exercises
     four of `barTone`'s five stops and makes a heavy night legible.

     The total and the night count are unchanged, so the card's three figures
     still reconcile — `ProgressArithmetic.test.ts` holds that. */
  'progress-on-track': [
    // Wed–Sun, the tail of the week before
    90, 175, 120, 0, 160,
    // Mon–Sun, the one complete week
    200, 85, 0, 150, 110, 165, 152,
    // today (Monday) — the 105 `STUDY_MINUTES_BY_VARIANT` opens its week with
    105,
  ],
  /* AT RISK — 27 days (30 − 3), 360 minutes (15% of 40 hours). Sparse on
     purpose: this is the persona with three days left and 85% still to do, and
     the streak it produces is 0. That zero is the state every concept but
     "no streak at all" needed designing for. */
  'progress-at-risk': [
    0, 0, 55, 0, 0, 0, 0,
    0, 45, 0, 0, 0, 60, 0,
    0, 0, 0, 50, 0, 0, 0,
    0, 65, 0, 0, 60,
    // today — the 25 the week array opens with
    25,
  ],
}

const STATUS_BY_VARIANT: Record<DashboardProgressVariant, HomeStatus> = {
  // The onboarding hand-off destination reads as On Track (a fresh, on-schedule
  // plan) — distinct from the picker's explicit Not Started state below.
  'setup-complete-0': 'on-track',
  'not-started': 'not-started',
  'progress-on-track': 'on-track',
  'progress-at-risk': 'at-risk',
  'progress-off-track': 'off-track',
  'progress-expired': 'expired',
  'complete-100': 'completed',
  'completed-empty': 'completed',
  'new-empty': 'not-started',
}

function breakdown(required: number, ratio: number): LearningPathCategoryBreakdown {
  return { completed: Math.round(required * ratio), required }
}

function buildPath(
  profile: BrandProgressProfile,
  mandatory: LearningPathCategoryBreakdown,
  elective: LearningPathCategoryBreakdown,
  jumpBackIn?: CourseCardData,
  categories?: LearningPathCategory[],
): LearningPathSummary {
  const progressPct = pathProgressPct(mandatory, elective, categories)
  // The path's size, by the same rule the percentage uses: the category list
  // when there is one, the Mandatory/Elective sum otherwise.
  const totalRequired = categories?.length
    ? categories.reduce((a, c) => a + c.required, 0)
    : mandatory.required + elective.required
  return {
    id: profile.pathId,
    title: profile.title,
    category: profile.category,
    state: profile.state,
    hours: totalRequired,
    licenseExpiresOn: profile.licenseExpiresOn,
    progressPct,
    lastViewedAt: '2026-05-20T08:15:00Z',
    mandatory,
    elective,
    categories,
    // Education-type-aware labels (CE default when the profile omits them).
    mandatoryLabel: profile.mandatoryLabel,
    electiveLabel: profile.electiveLabel,
    deadlineLabel: profile.deadlineLabel,
    unitLabel: profile.unitLabel,
    jumpBackIn,
  }
}

function personaFor(
  profile: BrandProgressProfile,
  variant: DashboardProgressVariant,
  /** The access-window control's day count, or undefined under `auto`. */
  expiryDays?: number,
): DashboardProgressPersona {
  const ratio = PROGRESS_RATIOS[variant]
  /*
   * SEQUENTIAL (WATERFALL) ALLOCATION — changed 2026-09-16.
   *
   * It used to be `completed: Math.round(c.required * ratio.m)`: one ratio
   * applied to every category independently. That is a PROPORTIONAL fill, and
   * on the four-category New York journey it produced a learner who was
   * simultaneously 63% through their pre-licensing coursework, 63% through the
   * prep review, 63% through the exam simulators and 63% through the exam cram.
   *
   * Nobody studies like that, and the Study Journey is where it showed: a
   * SEQUENCE whose every stop read "In progress" says nothing about what to do
   * next, which is the one question a journey exists to answer. The category
   * bars had the same problem and it just read as decoration there.
   *
   * So the hours now fill the list IN ORDER, each category taking what it can
   * before the next gets any. The category list is the curriculum order (see
   * the type's note), so 63% of the way through means "coursework nearly done,
   * nothing after it started" rather than "everything a bit done".
   *
   * THE TOTAL IS UNCHANGED — `round(totalRequired × ratio)` either way — so
   * `displayedProgressPct` still reports the same figure and the cross-surface
   * agreement `ProgressAgreement.test.tsx` pins is untouched. Only the
   * DISTRIBUTION moved.
   */
  const catTotalRequired = profile.categories?.reduce((sum, c) => sum + c.required, 0) ?? 0
  let unallocated = Math.round(catTotalRequired * ratio.m)
  const categories: LearningPathCategory[] | undefined = profile.categories?.map((c) => {
    const completed = Math.min(c.required, unallocated)
    unallocated -= completed
    return { key: c.key, label: c.label, required: c.required, completed }
  })
  /*
   * Mandatory / Elective are DERIVED from that same allocation when a profile
   * has categories, rather than computed from `mandatoryReq` × ratio.
   *
   * Two rules over one set of hours is two answers. With the proportional fill
   * they happened to agree; under the waterfall they would not — the New York
   * persona's categories give 35/40 to pre-licensing and 0 to everything after,
   * while `mandatoryReq × 0.63` gives 25/40 and `electiveReq × 0.63` gives
   * 10/16. Both views are on screen: the Progress section reads categories, and
   * the Learner Focused band's legend reads these two.
   *
   * A profile with no categories keeps the old computation exactly.
   */
  const segmentTotal = (seg: 'mandatory' | 'elective'): LearningPathCategoryBreakdown => ({
    completed: (profile.categories ?? [])
      .map((c, i) => (c.segment === seg ? categories![i].completed : 0))
      .reduce((a, b) => a + b, 0),
    required: (profile.categories ?? [])
      .filter((c) => c.segment === seg)
      .reduce((a, c) => a + c.required, 0),
  })
  const mandatory = categories
    ? segmentTotal('mandatory')
    : breakdown(profile.mandatoryReq, ratio.m)
  const elective = categories
    ? segmentTotal('elective')
    : breakdown(profile.electiveReq, ratio.e)
  // The discovery states (`completed-empty` / `new-empty`) have nothing to
  // resume or launch.
  const isDiscovery = variant === 'completed-empty' || variant === 'new-empty'
  // "Empty path — add courses" (`new-empty`) — the learner has a path with real
  // license requirements but hasn't added any courses yet. Distinct from
  // `completed-empty` (100% done, nothing next), which keeps its completed course
  // list. Only `new-empty` flags the path as having no courses so the detail
  // panel swaps its course list for the "Add your first course" prompt.
  const isNewEmpty = variant === 'new-empty'
  // Not-started states surface the "up next" course; partial states resume
  // where the learner left off; complete-100 swaps Jump Back In for the
  // renewal-ready card; the discovery states have no course at all.
  const jumpBackIn = isDiscovery
    ? undefined
    : variant === 'setup-complete-0' || variant === 'not-started'
      ? profile.upNext
      : variant === 'progress-on-track'
        ? profile.resumeMid
        : variant === 'progress-at-risk' || variant === 'progress-expired'
          ? profile.resumeEarly
          : variant === 'progress-off-track'
            ? /* OFF TRACK GETS A SHORT WINDOW, and that is what finally makes
                 the model's "won't fit" state reachable — 2026-09-21.
                 `state: 'no'` needs `minsPerWeek` past `CEILING_MINS × 6`
                 (1260). With 32 hours left against the standard 30-day window
                 that is 610, so no progress level could ever trigger it and the
                 card's whole unreachable-pace branch was dead copy.

                 11 days of access against 32 hours of work is ~1344 — over the
                 line, and true to what the state is FOR: someone who bought
                 late and left it. It is the window that is short here, not the
                 course that is long, because a learner cannot change the course.

                 ⚠ IT ALSO FIXES A SILENT FALLBACK. `progress-off-track` was
                 absent from this chain entirely and fell through to
                 `undefined`, which sent the band to `myCoursesFor(brand)` and a
                 different course with a stock photo — the same defect
                 `complete-100` had. */
              { ...profile.resumeEarly, expiresAt: '2026-05-22' }
          : variant === 'complete-100'
            ? /* THE COURSE AT 100%, not `undefined` — 2026-09-21. This read
                 "complete-100 → renewal-ready card replaces Jump Back In",
                 which was true while the band returned that card instead of
                 itself. It no longer does (the ask for a completed state on the
                 normal band), so an absent course fell through to the band's
                 `myCoursesFor(brand)` fallback and the page came up showing a
                 DIFFERENT course: a Florida CE record with a stock photo of a
                 house, under a header naming the New York pre-licensing path,
                 with "Review course" pointing at it.

                 `resumeMid` at 100% progress — same course record, finished. */
              { ...profile.resumeMid, progress: 100, status: 'completed' as const }
            : undefined
  /*
   * THE WINDOW FOLLOWS THE COUNTDOWN, for the three states that name one.
   *
   * Applied HERE rather than on the three profile entries because the entries
   * are shared: `resumeEarly` serves At Risk, Expired and Off Track, and each
   * wants a different window (or, for two of them, the one it already has).
   * Overriding at the point the variant picks its course is the only place that
   * distinction exists.
   */
  const jumpBackInWindowed =
    jumpBackIn && ALIGNED_WINDOW_VARIANTS.has(variant)
      ? { ...jumpBackIn, ...accessWindowFor(DAYS_LEFT_BY_VARIANT[variant]) }
      : jumpBackIn
  /*
   * ─────────────────────────────────────────────────────────────────────
   *  ONE COURSE, ONE PERCENTAGE — 2026-10-15
   * ─────────────────────────────────────────────────────────────────────
   *
   * ⚠ THE CARD AND THE JOURNEY WERE DESCRIBING THE SAME COURSE AND
   * DISAGREEING BY EIGHTEEN POINTS. On the qualifying journey the Jump Back
   * In card IS the path: one course, "Pre-licensing Course", the same thing
   * Step 1 counts lessons through. Its `progress` is authored on the profile
   * (45 for `resumeMid`), while the path's comes from `PROGRESS_RATIOS` and
   * the Progress dropdown (63). So Step 1 read "26 of 42 completed" above a
   * Study Pace planning for 22 hours of work when 15 remained, and the pace
   * it printed — 3 weeks — did not fit the 18 days of access stated two lines
   * above it.
   *
   * ⚠ ONLY WHERE THE CARD IS THE WHOLE PATH, which is what the single
   * category tests for. A CE path has no categories and its card is one
   * course of several ("Long-Term Care Initial Training"); exam prep has
   * three. In both, the card's own progress is a different fact from the
   * path's and must stay authored — aligning those would be the error in the
   * other direction.
   *
   * The STATUS follows the same number, or a 0% card would still claim to be
   * in progress.
   */
  const pathPct = pathProgressPct(mandatory, elective, categories)
  const cardIsWholePath = categories?.length === 1
  const jumpBackInProgressAligned =
    jumpBackInWindowed && cardIsWholePath
      ? {
          ...jumpBackInWindowed,
          progress: pathPct,
          status: (pathPct >= 100
            ? 'completed'
            : pathPct > 0
              ? 'in-progress'
              : 'not-started') as CourseStatus,
        }
      : jumpBackInWindowed
  /*
   * THE ACCESS-WINDOW CONTROL, applied LAST — 2026-10-15.
   *
   * ⚠ IT OVERRIDES EVERY OTHER WINDOW ON PURPOSE, including the three states
   * in `ALIGNED_WINDOW_VARIANTS` and the two that author their own
   * (`progress-off-track`'s deliberately short 11 days, `progress-expired`'s
   * date in the past). A reviewer who picks "1 day" is asking to see one day
   * left, and a Progress state quietly winning that argument would make the
   * control look broken on exactly the two states most worth demoing it on.
   * `auto` leaves all of them exactly as they were.
   */
  const jumpBackInAligned =
    jumpBackInProgressAligned && expiryDays != null
      ? { ...jumpBackInProgressAligned, ...demoExpiryWindowFor(expiryDays) }
      : jumpBackInProgressAligned
  // Jump Back In slot mode — auto-derived from the variant. A not-started course
  // is "Up Next" (launch), a partial course is "Resume", and the discovery
  // states send the learner to the catalog.
  const jumpBackInMode: 'resume' | 'up-next' | 'discovery' = isDiscovery
    ? 'discovery'
    : variant === 'setup-complete-0' || variant === 'not-started'
      ? 'up-next'
      : 'resume'
  const discoveryTone: 'completed' | 'new' | undefined =
    variant === 'completed-empty' ? 'completed' : variant === 'new-empty' ? 'new' : undefined
  return {
    setupComplete: true,
    status: STATUS_BY_VARIANT[variant],
    jumpBackInId: jumpBackInAligned?.id,
    jumpBackInMode,
    discoveryTone,
    renewal: RENEWAL_BY_VARIANT[variant],
    weekMinutes: STUDY_MINUTES_BY_VARIANT[variant],
    dailyMinutes: STUDY_ACTIVITY_BY_VARIANT[variant],
    renewalReady: variant === 'complete-100',
    // Carry the state's time + deadline onto the path so the detail panel's
    // Time Remaining ("Xd" / "N wks" / "Y yr, N wks") AND License Expires read
    // the same state-specific values (instead of the static LICENSE_TRACKER),
    // and agree with the dashboard band that opened the panel.
    path: {
      ...buildPath(profile, mandatory, elective, jumpBackInAligned, categories),
      weeksRemaining: RENEWAL_BY_VARIANT[variant].weeksLeft,
      licenseExpiresOn: RENEWAL_BY_VARIANT[variant].deadline,
      statusOverride: STATUS_BY_VARIANT[variant],
      // Empty path — no courses added yet. Drives the detail panel's
      // "Add your first course" empty state (undefined for every other state,
      // which keeps their authored course lists).
      coursesAdded: isNewEmpty ? false : undefined,
    },
  }
}

/**
 * Resolve the `dashboard-progress-state` flag variant to a demo persona for the
 * brand. Returns `null` for brands without a progress profile so callers fall
 * back to today's default learning-path resolution.
 *
 * `course` (2026-10-15) is the Demo Controls bar's Course axis, and it is
 * OPTIONAL BY DESIGN: omitted — which is what the control's `auto` default
 * resolves to — every journey returns exactly the persona it returned before
 * the axis existed. That is what let the eighty-odd existing call sites stay
 * untouched, and what keeps a plain load of `main` unchanged.
 */
export function dashboardProgressPersonaFor(
  brand: Brand,
  variant: string | undefined,
  educationType: EducationType = 'ce',
  course?: CourseId,
  /**
   * The access-window control's day count (2026-10-15), or omitted under its
   * `auto` default — in which case every Progress state keeps the window it
   * already authored.
   */
  expiryDays?: number,
): DashboardProgressPersona | null {
  const profile = profileFor(brand, educationType, course)
  if (!profile) return null
  const v = (variant ?? 'progress-on-track') as DashboardProgressVariant
  const safe: DashboardProgressVariant = PROGRESS_RATIOS[v] ? v : 'progress-on-track'
  return personaFor(profile, safe, expiryDays)
}

/**
 * The five compliance states shown in the Demo Controls "Progress" picker, in
 * display order. Each maps to a `dashboard-progress-state` flag variant + the
 * `HomeStatus` it produces, so the demo bar and the Feature Flag panel stay in
 * sync. (`setup-complete-0` is intentionally excluded — it's the onboarding
 * hand-off destination, not a compliance state a reviewer picks.)
 */
export type ProgressPickerOption = {
  variant: DashboardProgressVariant
  label: string
  status: HomeStatus
  /**
   * Present = the row is OFFERED BUT NOT SELECTABLE, and this says why.
   *
   * For a state the flag supports and the DESIGN does not yet — the fixtures
   * resolve it, so the dashboard would render something, but nobody has decided
   * what that something should say. Picking it would put a reviewer in front of
   * a screen the team has not agreed on and let them read it as the proposal.
   *
   * SHOWN RATHER THAN DROPPED: the state is part of the compliance story and a
   * stakeholder who asks "what about expired?" should see it listed and pending,
   * not absent. Deleting the row would read as "we forgot".
   *
   * ⚠ NOT A KILL SWITCH. The variant stays declared and `?ff=` / the Feature
   * Flag panel still reach it — this governs the reviewer-facing picker only, so
   * whoever is DESIGNING the state can still open it.
   */
  unavailable?: string
}

/**
 * ⚠ TWO ROWS, NOT FIVE — 2026-09-23, the direct ask: the Progress control
 * "should ONLY include the Not Started 0% and On Track 63%".
 *
 * WHAT WAS REMOVED, so putting it back is a re-add and not a rebuild:
 *
 *   { variant: 'progress-at-risk',    label: 'At Risk · ~15%',    status: 'at-risk' },
 *   { variant: 'progress-expired',    label: 'Expired',           status: 'expired',
 *     unavailable: 'Requirements for the expired state are not defined yet.' },
 *   { variant: 'complete-100',        label: 'Completed · 100%',  status: 'completed' },
 *
 * ⚠ THE VARIANTS THEMSELVES ARE UNTOUCHED. This list is the REVIEWER-FACING
 * PICKER and nothing else: `dashboard-progress-state` still declares all five,
 * the fixtures still resolve them, and `?ff=dashboard-progress-state:complete-100`
 * or the Feature Flag panel still reaches every one. Nothing was deleted — a
 * menu got shorter.
 *
 * ⚠ IT NARROWS TEST COVERAGE, which is the cost to know about. Four suites
 * iterate this list rather than naming states — `ProgressAgreement`,
 * `ReadinessPanel`, `QeFocusedVersion` and `DemoControlsBar` — so they still
 * pass and now sweep two states instead of five. At Risk and Completed stop
 * being checked for cross-surface agreement by anything at all. If those states
 * matter again, re-add the rows above rather than writing new assertions.
 *
 * ⚠ AND IT REVERSES A DECISION RECORDED ON `unavailable` DIRECTLY BELOW ITS
 * OWN TYPE: "SHOWN RATHER THAN DROPPED — a stakeholder who asks 'what about
 * expired?' should see it listed and pending, not absent. Deleting the row
 * would read as 'we forgot'." That argument still stands on its own terms; the
 * ask overrides it for this branch, and `unavailable` remains the middle
 * ground if the Expired row should come back as visible-but-unpickable.
 */
export const DASHBOARD_PROGRESS_PICKER: ProgressPickerOption[] = [
  { variant: 'not-started', label: 'Not Started · 0%', status: 'not-started' },
  { variant: 'progress-on-track', label: 'On Track · ~63%', status: 'on-track' },
]

/**
 * Enrich the brand's setup-complete-0 persona with the wizard's collected data
 * (expiration + the first selected course of interest) so finishing the
 * Onboarding Flow flips the dashboard to a populated Current Learning Path that
 * reflects what the learner just entered — while keeping the brand's coherent
 * renewal-cycle title + state. Falls back to `null` for brands without a
 * profile.
 */
export function personaFromSetup(
  brand: Brand,
  data: {
    licenseType: string
    expires: string
    courses: string[]
    modalities: string[]
  },
): DashboardProgressPersona | null {
  const base = dashboardProgressPersonaFor(brand, 'setup-complete-0')
  if (!base) return null
  const firstCourse = data.courses[0]
  const jumpBackIn: CourseCardData | undefined = firstCourse
    ? { id: 'jbi-setup-first', title: firstCourse, hours: 2, state: base.path.state ?? 'National', delivery: 'online', badge: 'elective', status: 'not-started', progress: 0 }
    : base.path.jumpBackIn
  const licenseExpiresOn = fmtDate(data.expires) ?? base.path.licenseExpiresOn
  return {
    ...base,
    path: { ...base.path, licenseExpiresOn, jumpBackIn },
  }
}

/** Format an ISO date input value (yyyy-mm-dd) as mm/dd/yyyy; `null` if empty. */
function fmtDate(iso: string): string | null {
  if (!iso) return null
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  const [y, m, d] = parts
  return `${m}/${d}/${y}`
}
