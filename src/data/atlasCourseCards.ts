import type { AtlasCourseCardData } from '@/components/compass/AtlasCourseCard'
import type { Brand } from '@/context/AccountContext'
import { ATLAS_PROGRESS_LADDER } from '@/components/compass/atlasProgressLadder'
import { certificateForCourse, certificatePdfUrl, certificateStateForCourse } from './certificateFixtures'
import { EXPIRY_PICKER } from './courseFixtures'
import { courseExpiryState, daysUntilIso, formatMilestoneDate, usableDaysLeft } from './courseExpiry'
import { FIXTURE_TODAY, myCoursesFor, type MyCourseRecord } from './myCoursesFixtures'

/**
 * The Atlas My Courses page's cards — 2026-10-06, Eric's request: the Figma
 * card (213:3619) for the Home course, and "another card off of the home page
 * second course info and image".
 *
 * ⚠ THE CONTENT IS THE DESIGN'S, NOT THE FIXTURES'. The first card carries the
 * Figma's own badge, date and button verbatim. The second is the Home course
 * tabs' invented New York Property & Casualty course (AtlasHomeV2
 * `DEMO_OTHER_COURSES`, same image), and its badge, date and button are
 * INVENTED for the demo — no fixture has a P&C enrolment to read them from.
 *
 * ⚠ RE-DATED 2026-11-23 for the My Courses PRD (section 3, Chi Wang,
 * 2026-11-16). Each card now carries ISO `expiresAt` / `completedOn` dates set
 * RELATIVE TO `FIXTURE_TODAY` (2026-05-11), and its date line is COMPUTED by
 * `designDates` — the same `dateLine` the library goes through — so the five
 * PRD shapes ("Access ends … · N days left", "Expired:", "Completed: … ·
 * Score") are on screen at once and cannot drift from the fixtures' shapes.
 * The authored "October 19, 2026 · 5:49 PM CDT" strings went with that: a
 * Due Soon card dated five months out contradicted its own pill. (mm/dd/yyyy
 * since 2026-11-24.)
 *
 * ⚠ THE CE PACKAGE CARD (`demo-ny-pclh-refresher-ce`) was out of scope for
 * the Jan 12 release and is OFF THE PAGE since 2026-11-24 — kept below as
 * `ATLAS_CE_PACKAGE_CARD`, read by nothing. The Failed row of the PRD's table
 * is demonstrated by the practice-exam card (`demo-fl-pc-practice-exam`).
 */
/* ⚠ DECLARED ABOVE THE CARDS ON PURPOSE: `designDates` runs while `ATLAS_MY_COURSES` is built, and a `const` below the
   array would still be in its temporal dead zone — a ReferenceError at module load, not a type error. */
/** Where View Certificate lands when there is no certificate to open — the certificates page, never a dead button
 *  (the PRD's "No dead ends"). `certificatePdfUrl` returns the same page today; see its `TODO(data)`. */
export const CERTIFICATES_PAGE = '/my-learning/certificates'


export const ATLAS_MY_COURSES: readonly AtlasCourseCardData[] = [
  {
    id: 'xcel-ny-producer-prelicensing',
    title: 'Florida Life and Health Pre-licensing',
    imageUrl: '/courses/fl-life-health.webp', // Florida's beach (2026-11-12, Eric: the cards in Florida; New York's skyline before)
    badge: 'Due Soon',
    // FIVE usable days left (2026-11-24, Jillienne: "adjust this card so its 5 days left to complete" — inside the week the
    // pill counts down in; two weeks the day before). Enrolled six weeks ago.
    ...designDates({ myStatus: 'in-progress', enrolledAt: '2026-04-01', expiresAt: '2026-05-17' }),
    description: 'Every topic on the Florida Life & Health exam in self-paced lessons, with a practice quiz at the end of each one.',
    actionLabel: 'Resume Course',
    // Figma 706:2416's facts (2026-11-12, Eric) — the state is the course's, New York; the design's frame says Florida.
    state: 'Florida',
    category: 'Licensing',
    lineOfAuthority: 'Life and Health',
    // Invented demo copy for the Course Details sheet (2026-11-18, Eric).
    packageSummary:
      'Our Premier package adds flashcards, a recorded review class, and our Pass Guarantee to the standard package and is ideal for those looking to maximize their studying with various learning formats.',
    progress: 45,
  },
  /* THE SECOND CARD (2026-11-24, Jillienne: "another example of a card that is in progress that is more than 30 days until
     access expires so that its the normal atlas blue progress and there is no badge"): IN PROGRESS, ten months of access
     left — well outside the 60-day warning window — so the pill is the plain "In Progress", the bar the Info ramp's blue,
     and the access line a long count. Everything invented; the image is the project's stock study photo (`/courses/3.webp`). */
  {
    id: 'demo-fl-health-prelicensing',
    title: 'Florida Health Insurance Pre-licensing',
    imageUrl: '/courses/3.webp',
    ...designDates({ myStatus: 'in-progress', enrolledAt: '2026-03-01', expiresAt: '2027-03-01' }),
    description: 'Every topic on the Florida Health exam in self-paced lessons, with a practice quiz at the end of each one.',
    actionLabel: 'Resume Course',
    state: 'Florida',
    category: 'Licensing',
    lineOfAuthority: 'Health',
    packageSummary:
      'Our Standard package covers every topic on the Florida Health exam with self-paced lessons and practice quizzes, and is ideal for those who like to study on their own schedule.',
    progress: 30,
  },
  {
    id: 'demo-ny-pc',
    title: 'Florida Property & Casualty',
    // A Florida street of tile roofs and palms (2026-11-12, Eric). Unsplash photo 4T4AcGJvARQ, Unsplash License — free, no
    // credit required. New York's brownstones before.
    imageUrl: '/courses/fl-property-casualty.jpg',
    // Seven months of access, just enrolled (2026-11-23; "December 15, 2026 · 11:59 PM CST" before).
    ...designDates({ myStatus: 'not-started', enrolledAt: '2026-05-04', expiresAt: '2026-12-15' }),
    description: 'Every topic on the Florida Property & Casualty exam in self-paced lessons, with a practice quiz at the end of each one.',
    actionLabel: 'Begin Course',
    actionStyle: 'secondary',
    state: 'Florida',
    category: 'Licensing',
    lineOfAuthority: 'Property & Casualty',
    // Invented demo copy for the Course Details sheet (2026-11-18, Eric).
    packageSummary:
      'Our Standard package covers every topic on the Florida Property & Casualty exam with self-paced lessons and practice quizzes, and is ideal for those who like to study on their own schedule.',
    progress: 0,
  },
  /* The THIRD card (2026-10-06, Eric's request), its badge, date and button
     INVENTED like the P&C card's. PLACEHOLDER IMAGE: a Hamptons house (Long
     Island, NY) by Chastity Cortijo on Unsplash, under the Unsplash License —
     free, no credit required
     (https://unsplash.com/photos/white-concrete-house-near-green-trees-during-daytime-c7wHwFGC8_k).
     It replaced a Wikimedia contract-signing photo the same day ("one that
     shows a New York home type"). */
  {
    id: 'demo-ny-preferred-business-practices',
    title: 'FL Preferred Business Practices for the Insurance Producer',
    // A white stucco Florida house under palms (2026-11-12, Eric). Unsplash photo Eek1JU-RFRw, Unsplash License — free, no
    // credit required. The Hamptons house before.
    imageUrl: '/courses/fl-preferred-business-practices.jpg',
    // COMPLETED (2026-10-06, Eric's request) — an invented past completion
    // date; it was "Available until January 31, 2027" with Begin Course.
    completed: true,
    // Finished in March with a 92 (2026-11-23; "September 18, 2026 · 3:12 PM CDT" before). The score is invented — the PRD's
    // "Completed: [date] · Score" line needs one.
    ...designDates({ myStatus: 'completed', enrolledAt: '2026-02-20', completedOn: '2026-03-18', expiresAt: '2027-01-31', score: 92 }),
    description: "One self-paced module on Florida's Preferred Business Practices requirement for licensed producers.",
    // No certificate record for an invented course, so View Certificate lands on the certificates page — the PRD's fallback.
    certificateHref: CERTIFICATES_PAGE,
    actionLabel: 'Completed',
    state: 'Florida',
    category: 'Continuing Education',
    lineOfAuthority: 'All Lines',
    // Invented demo copy for the Course Details sheet (2026-11-18, Eric).
    packageSummary:
      "This continuing education course meets Florida's Preferred Business Practices requirement in one self-paced module, and is ideal for producers renewing their license on a tight timeline.",
    progress: 100,
  },
  /* A SECOND COMPLETED CARD (2026-11-24, Jillienne: "show another completed course (make up the name and the image), and
     make this Certificate link at the bottom show a Hourglass icon, and Certificate Pending") — finished, its certificate
     NOT YET ISSUED, so the foot says Certificate Pending and the sheet offers no View Certificate. Everything invented; the
     image is the project's stock photo `/courses/5.webp`. */
  {
    id: 'demo-fl-ethics-producers',
    title: 'Florida Ethics for Insurance Producers',
    imageUrl: '/courses/5.webp',
    completed: true,
    ...designDates({ myStatus: 'completed', enrolledAt: '2026-03-10', completedOn: '2026-04-28', expiresAt: '2027-03-10', score: 88 }),
    description: 'The ethical duties of a Florida producer, with case studies drawn from Department of Financial Services actions.',
    certificatePending: true,
    actionLabel: 'Completed',
    state: 'Florida',
    category: 'Continuing Education',
    lineOfAuthority: 'All Lines',
    packageSummary:
      'This continuing education course meets Florida\u2019s ethics requirement in one self-paced module. Its certificate is issued once the affidavit is signed.',
    progress: 100,
  },
  /* THE FOURTH CARD (2026-11-12, Eric): New York Personal Lines, EXPIRED — its access ran out partway through, so its button
     is Purchase Extension (not wired). Badge, date, progress and button INVENTED like the P&C card's. The image is the
     project's own stock homeowners photo (`/courses/0.webp`, a couple and an agent over a new home's keys) — personal lines,
     though not New York. */
  {
    id: 'demo-ny-personal-lines',
    title: 'Florida Personal Lines Pre-licensing',
    imageUrl: '/courses/0.webp',
    badge: 'Expired',
    // Access ended three weeks ago (2026-11-23; "November 2, 2026 · 11:59 PM CST" before).
    ...designDates({ myStatus: 'in-progress', enrolledAt: '2025-10-20', expiresAt: '2026-04-20' }),
    description: 'Homeowners, auto and other personal lines coverage for the Florida exam, with practice questions throughout.',
    actionLabel: 'Purchase Extension',
    // Begin Course's outline (2026-11-12, Eric; the Expired pill's pink outline for a moment — `expired`, kept on the card).
    actionStyle: 'secondary',
    state: 'Florida',
    category: 'Licensing',
    lineOfAuthority: 'Personal Lines',
    // Invented demo copy for the Course Details sheet (2026-11-18, Eric).
    packageSummary:
      'Our Plus package adds flashcards and timed practice exams to the standard package and is ideal for those who want to test their readiness before exam day.',
    progress: 62,
  },
  /* THE FIFTH CARD (2026-11-23; the sixth until the CE package card left on 2026-11-24): a FAILED practice exam, so the PRD's
     Failed row — the access line, her score, Retake Course — is on screen. Everything invented; the image is the P&C card's
     Florida street again (same line of authority, no new photo). */
  {
    id: 'demo-fl-pc-practice-exam',
    title: 'Florida Property & Casualty Practice Exam',
    imageUrl: '/courses/fl-property-casualty.jpg',
    ...designDates({ myStatus: 'failed', enrolledAt: '2026-03-02', expiresAt: '2027-03-02' }),
    score: 62,
    description: 'A timed 150-question simulation of the Florida Property & Casualty exam, scored on submission.',
    actionLabel: 'Retake Course',
    state: 'Florida',
    category: 'Licensing',
    lineOfAuthority: 'Property & Casualty',
    packageSummary:
      'The practice exam comes with every Florida Property & Casualty package and can be retaken as often as you like while your access lasts.',
    progress: 87, // (2026-11-24, Jillienne: "change this progress made to the 87%"; 100 the day before)
  },
]

/* THE CE PACKAGE CARD, OFF THE PAGE (2026-11-24, Jillienne, with it selected: "remove this version"). It was the fifth design
   card from 2026-11-12 (Eric) and was out of scope for the Jan 12 release — left untouched while the PRD card took shape
   around it — until she took it off the page. KEPT HERE, READ BY NOTHING, so putting it back is one line in the array
   above (its Archive row says so); `atlasHomeCourseFor` no longer finds it, which is right, since no card opens it. */
export const ATLAS_CE_PACKAGE_CARD: AtlasCourseCardData = {
  id: 'demo-ny-pclh-refresher-ce',
  title: 'FL Property, Casualty, Life, and Health Refresher CE Package',
  imageUrl: '/courses/6.webp',
  availableDate: 'January 15, 2027',
  availableTime: '11:59 PM CST',
  actionLabel: 'Retake Course',
  state: 'Florida',
  category: 'Continuing Education',
  lineOfAuthority: 'Property, Casualty, Life and Health',
  // Invented demo copy for the Course Details sheet (2026-11-18, Eric).
  packageSummary:
    'Our Refresher CE Package bundles the hours Florida requires across Property, Casualty, Life and Health into one purchase, and is ideal for producers who hold several lines of authority.',
  progress: 87, // (2026-11-12, Eric; 100 first)
}


/** A design card's ISO dates → its date line AND the ISO fields themselves, so the card carries both. */
function designDates(
  c: Pick<MyCourseRecord, 'myStatus' | 'enrolledAt' | 'expiresAt' | 'completedOn' | 'score'>,
): Pick<AtlasCourseCardData, 'dateLabel' | 'availableDate' | 'availableTime' | 'expiresAt' | 'completedOn' | 'score'> {
  return {
    ...dateLine({ ...c, status: c.myStatus }, FIXTURE_TODAY),
    expiresAt: c.expiresAt,
    completedOn: c.completedOn,
    score: c.score,
  }
}

/** The links card's column — 260, the Home page's side column (2026-10-06,
 *  Eric's request; it was 280). */
export const ATLAS_MY_COURSES_ASIDE_W = 260
/** One Atlas course card's width: the Figma card's 255. Three fit in one row
 *  beside the 260 links card inside the shell's 1092px content box (260 + 24 +
 *  3 × 255 + 2 × 16 = 1081). It was 250 while the links card was 280. */
export const ATLAS_COURSE_CARD_W = 265 // Figma 706:2416's card (2026-11-12, Eric; was 255)

/**
 * HOW MANY CARDS SIT IN ONE ROW — three, the design's row (2026-10-06).
 *
 * ⚠ IT WAS `ATLAS_MY_COURSES.length` UNTIL 2026-11-02, which tied the page's
 * WIDTH to the length of one hand-picked fixture list. That held only while the
 * page drew exactly those three cards: the moment it renders the learner's real
 * library (`atlasCoursesFor`, below) the list is 5–9 long and a length-derived
 * width would stretch the page to a single unreadable row. Three is the design's
 * row either way, so the grid wraps to a second row of three instead.
 *
 * The value is unchanged for the three-card list — this is a re-derivation, not
 * a resize.
 */
export const ATLAS_MY_COURSES_COLUMNS = 3

/** The Quick Links rail grew 234 → 280 for its longer labels (2026-11-18, Eric — `QUICK_LINKS_W` in
 *  AtlasJourneyLinksCard). The page grows by the same 46, or the rail takes it from the cards and My Courses drops to
 *  two a row (Eric: "increase the body … to allow 3 columns of course cards"). */
export const ATLAS_QUICK_LINKS_GROWTH = 46

/** My Courses' centred content: the links card, a 24 gap, then three cards with
 *  16 between (2026-10-06, Eric's request: "center all of the page content").
 *  The header takes the same width so the title lines up with it. */
export const ATLAS_MY_COURSES_WIDTH =
  ATLAS_MY_COURSES_ASIDE_W +
  24 +
  ATLAS_MY_COURSES_COLUMNS * ATLAS_COURSE_CARD_W +
  (ATLAS_MY_COURSES_COLUMNS - 1) * 16 +
  ATLAS_QUICK_LINKS_GROWTH


/**
 * THE LEARNER'S REAL LIBRARY AS ATLAS CARDS — 2026-11-02, Jillienne's request
 * that My Courses stop being a picture.
 *
 * `ATLAS_MY_COURSES` above is the DESIGN's content: three cards whose badge,
 * date and button were authored to match a Figma frame. This reads the same
 * fixtures the non-Atlas `/my-learning/courses` page reads, so the Demo bar's
 * Course and Progress controls move this page too, and a learner with nine
 * enrolments sees nine cards.
 *
 * ⚠ ARCHIVED RECORDS ARE NOT HERE. Archiving is a LOCATION (axis E, see
 * `MyCourseRecord.archived`), and the Atlas page has no View Archived link —
 * `hideListControls` takes it — so an archived course would appear on the only
 * collection the page can show, indistinguishable from an active one. That is
 * exactly the confusion decision 33 forbids. The archived collection needs the
 * link back before it can have cards.
 *
 * WHAT EACH FIELD BECOMES: see `dateLine` for the date row's five shapes. Until
 * 2026-11-23 it had three, the third an "Enrolled:" line for the many records
 * with no `expiresAt`; the PRD has no such line, so every XCEL record carries
 * an access date now and the row always has a date to say.
 */
export function atlasCoursesFor(brand: Brand, today: Date = FIXTURE_TODAY): AtlasCourseCardData[] {
  return myCoursesFor(brand)
    .filter((c) => !c.archived)
    .map((c) => atlasCourseCardFor(c, today, brand))
}

/** One record → one card. Exported for the tests and the dev handoff's preview.
 *  `brand` is for the certificate lookup (2026-11-23); it defaults to the only brand. */
export function atlasCourseCardFor(course: MyCourseRecord, today: Date = FIXTURE_TODAY, brand: Brand = 'xcel'): AtlasCourseCardData {
  const completed = course.myStatus === 'completed'
  const expiry = courseExpiryState(course, today)
  return {
    id: course.id,
    title: course.title,
    // The picker in `myCoursesFor` has already applied one, unique per brand.
    imageUrl: course.imageUrl ?? '',
    /* The WARNING ramp's badge, and only on a course that still has a clock:
       `courseExpiryState` returns 'none' for a completed course whatever its
       dates say (ruling 5), so a finished course never wears "Due Soon". */
    badge: expiry === 'expired' ? 'Expired' : expiry === 'expiring-soon' ? 'Due Soon' : undefined,
    ...dateLine(course, today),
    completed,
    ...action(course.myStatus),
    // Figma 706:2416's rows (2026-11-12): the record's state and progress — and, since 2026-11-23, the PRD's labels too
    // (section 3): category and line of authority are on the record now, invented per course.
    state: course.state,
    category: course.category,
    lineOfAuthority: course.lineOfAuthority,
    progress: completed ? 100 : (course.progress ?? 0),
    /* THE PRD'S FIELDS (2026-11-23). `description` is passed through as-is — the CARD draws "Description coming soon" when
       it is absent, so the fallback is one string in one place rather than a sentence stored on every record. */
    description: course.description,
    score: course.score,
    expiresAt: course.expiresAt,
    completedOn: course.completedOn,
    /* A completed course's View Certificate: the course's own certificate when one is issued (`certificatePdfUrl` — the
       one place the real document URL will land), else the certificates page. Never undefined on a completed card: the
       PRD's "No dead ends" rules out a dead button. Not set on an unfinished course — it has no certificate to view. */
    certificateHref: completed ? (certificatePdfUrl(certificateForCourse(brand, course.id)) ?? CERTIFICATES_PAGE) : undefined,
    // Not yet issued — the card says "Certificate Pending" rather than linking (2026-11-24).
    certificatePending: completed && certificateStateForCourse(brand, course.id) === 'pending',
  }
}

/**
 * THE DATE ROW — the PRD's five shapes (section 3, 2026-11-16), one per status,
 * and the Enrolled line that stood in for a missing clock is gone (2026-11-23).
 * In the Home course head's wording and mm/dd/yyyy since 2026-11-24
 * (Jillienne: "Update Access Ends to match this style"):
 *
 *   Not Started · In Progress · Failed · Completed   Access Ends: 05/17/2026, (5 days)
 *   Expired                                          Expired: 04/20/2026
 *
 * The bold part is `availableDate`; `dateLabel` leads it and `availableTime`
 * trails it, which is the shape `AtlasCourseCardData` already had. The days are
 * `usableDaysLeft` — expiry minus one, the figure the study plan is built on —
 * and the expired test is `courseExpiryState`, so this never does the date
 * arithmetic itself. A record with NO `expiresAt` (none in XCEL now) gets an
 * empty line rather than a sixth shape the PRD does not name.
 */
function dateLine(
  course: Pick<MyCourseRecord, 'myStatus' | 'status' | 'enrolledAt' | 'expiresAt' | 'completedOn' | 'score' | 'warnDays'>,
  today: Date,
): Pick<AtlasCourseCardData, 'dateLabel' | 'availableDate' | 'availableTime'> {
  /* A COMPLETED COURSE SAYS WHEN ITS ACCESS ENDS, like a live one (2026-11-24, Jillienne: "also add this to the completed
     cards") — access really does end then, certificate or no certificate. Its completion date is the status row's and its
     score the pill's, so the "Completed: [date], Score N%" line this returned until that day is gone. No clock, no line. */
  if (!course.expiresAt) return { availableDate: '' }
  if (course.myStatus === 'completed') {
    const days = Math.max(0, usableDaysLeft(course.expiresAt, today) ?? 0)
    return { dateLabel: 'Access Ends:', availableDate: formatMilestoneDate(course.expiresAt), availableTime: `(${days} ${days === 1 ? 'day' : 'days'})` }
  }
  if (courseExpiryState({ ...course, status: course.status ?? course.myStatus }, today) === 'expired') {
    return { dateLabel: 'Expired:', availableDate: formatMilestoneDate(course.expiresAt) }
  }
  const days = Math.max(0, usableDaysLeft(course.expiresAt, today) ?? 0)
  // "(293 days)" in parentheses (2026-11-24, Jillienne: "Access Ends: mm/dd/yyyy, (293 days)"; "293 days to complete" before).
  return {
    dateLabel: 'Access Ends:',
    availableDate: formatMilestoneDate(course.expiresAt),
    availableTime: `(${days} ${days === 1 ? 'day' : 'days'})`,
  }
}

/** The button — one per lifecycle state. `completed` draws its own inactive
 *  button in the card, so its label is only what a screen reader reads. */
function action(status: MyCourseRecord['myStatus']): Pick<AtlasCourseCardData, 'actionLabel' | 'actionStyle'> {
  switch (status) {
    case 'in-progress':
      return { actionLabel: 'Resume Course' }
    case 'completed':
      return { actionLabel: 'Completed' }
    case 'failed':
      // A failed course is still in play — the primary button, not the outline.
      return { actionLabel: 'Retake Course' }
    case 'not-started':
    default:
      // The design's outline button for a course not yet opened (2026-10-06).
      return { actionLabel: 'Begin Course', actionStyle: 'secondary' }
  }
}


/**
 * A CARD OPENS HOME IN ITS OWN STATE — 2026-11-04, Eric's request: "add click
 * to take user back to learner home with it reloaded to the card's content and
 * progress state".
 *
 * `?atlasCourse=<card id>` names the card; Home reads it for the course's
 * title and cover (`atlasHomeCourseFor`). The progress and the access window
 * are not URL state — they are the demo bar's Progress and Expires controls —
 * so the card SETS those two (`atlasHomeStateFor`) on its way out, exactly as
 * picking them on the bar would, and the bar then shows what Home is showing.
 *
 * ⚠ THE PROGRESS IS READ OFF THE CARD, NOT A RECORD. The card says only its
 * lifecycle: Completed → Ready 100%, Begin → Not Started 0%, anything still in
 * play → Developing 36%. Its badge sets the window: Due Soon → 7 days, Expired
 * → three days past, none → 30 days (the bar's default).
 */
export const ATLAS_HOME_COURSE_PARAM = 'atlasCourse'

export function atlasHomeStateFor(card: AtlasCourseCardData): { progress: string; expiry: string } {
  /* THE NEAREST PRESETS (2026-11-24; three coarse ones before — Developing 36% for anything in play, 30 days for anything
     unbadged). Home itself reads the card's exact date and percent now (`AtlasHomeJillMain`, `cardCourse`); this sets the
     two bar controls to the rows closest to them so the bar is nearly honest rather than wildly off. Completed and
     Begin Course keep their own rungs; Expired keeps the picker's one expired row. */
  const progress = card.completed
    ? 'completed'
    : card.actionLabel === 'Begin Course'
      ? 'not-started'
      : nearestRung(card.progress ?? 0)
  const expiry =
    card.badge === 'Expired'
      ? '-3'
      : String(nearestExpiryRow(card.expiresAt ? (daysUntilIso(card.expiresAt, FIXTURE_TODAY) ?? 30) : 30))
  return { progress, expiry }
}

/** The ladder rung whose percent is closest to the card's — the readiness band and the checks follow it. Exported for the
 *  sheet's Outline (2026-11-24), which ticks the same rows Home would. */
export function nearestRung(percent: number): string {
  let best = ATLAS_PROGRESS_LADDER[0]
  for (const rung of ATLAS_PROGRESS_LADDER) if (Math.abs(rung.percent - percent) < Math.abs(best.percent - percent)) best = rung
  return best.key
}

/** The Expires row closest to the card's days-until, among the positive rows. */
function nearestExpiryRow(days: number): number {
  const rows = EXPIRY_PICKER.map((o) => o.value).filter((v): v is number => typeof v === 'number' && v > 0)
  return rows.reduce((best, v) => (Math.abs(v - days) < Math.abs(best - days) ? v : best), rows[0])
}

/** `?atlasCourse=` → that card's title and cover, from the design's three or
 *  the learner's library; null when the param is absent or unknown. */
export function atlasHomeCourseFor(id: string | null, brand: Brand): AtlasCourseCardData | null {
  if (!id) return null
  return ATLAS_MY_COURSES.find((c) => c.id === id) ?? atlasCoursesFor(brand).find((c) => c.id === id) ?? null
}
