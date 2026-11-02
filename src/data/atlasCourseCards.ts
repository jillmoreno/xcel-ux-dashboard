import type { AtlasCourseCardData } from '@/components/compass/AtlasCourseCard'
import type { Brand } from '@/context/AccountContext'
import { courseExpiryState } from './courseExpiry'
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
 */
export const ATLAS_MY_COURSES: readonly AtlasCourseCardData[] = [
  {
    id: 'xcel-ny-producer-prelicensing',
    title: 'New York Life and Health Pre-licensing',
    imageUrl: '/courses/ny-life-health.webp',
    badge: 'Due Soon',
    availableDate: 'October 19, 2026',
    availableTime: '5:49 PM CDT',
    actionLabel: 'Resume Course',
  },
  {
    id: 'demo-ny-pc',
    title: 'New York Property & Casualty',
    imageUrl: '/courses/ny-property-casualty.webp',
    availableDate: 'December 15, 2026',
    availableTime: '11:59 PM CST',
    actionLabel: 'Begin Course',
    actionStyle: 'secondary',
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
    title: 'NY Preferred Business Practices for the Insurance Producer',
    imageUrl: '/courses/ny-preferred-business-practices.jpg',
    // COMPLETED (2026-10-06, Eric's request) — an invented past completion
    // date; it was "Available until January 31, 2027" with Begin Course.
    completed: true,
    availableDate: 'September 18, 2026',
    availableTime: '3:12 PM CDT',
    actionLabel: 'Completed',
  },
]

/** The links card's column — 260, the Home page's side column (2026-10-06,
 *  Eric's request; it was 280). */
export const ATLAS_MY_COURSES_ASIDE_W = 260
/** One Atlas course card's width: the Figma card's 255. Three fit in one row
 *  beside the 260 links card inside the shell's 1092px content box (260 + 24 +
 *  3 × 255 + 2 × 16 = 1081). It was 250 while the links card was 280. */
export const ATLAS_COURSE_CARD_W = 255

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

/** My Courses' centred content: the links card, a 24 gap, then three cards with
 *  16 between (2026-10-06, Eric's request: "center all of the page content").
 *  The header takes the same width so the title lines up with it. */
export const ATLAS_MY_COURSES_WIDTH =
  ATLAS_MY_COURSES_ASIDE_W +
  24 +
  ATLAS_MY_COURSES_COLUMNS * ATLAS_COURSE_CARD_W +
  (ATLAS_MY_COURSES_COLUMNS - 1) * 16

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
 * WHAT EACH FIELD BECOMES, and why the date line has three shapes rather than
 * one: the Atlas card draws a single date row inside a four-row subgrid, so
 * every card in a row must draw one or the titles, rules and buttons stop
 * lining up. Most fixture records carry no `expiresAt` — "Available until" has
 * nothing to say for them — so the label changes instead of the row vanishing.
 */
export function atlasCoursesFor(brand: Brand, today: Date = FIXTURE_TODAY): AtlasCourseCardData[] {
  return myCoursesFor(brand)
    .filter((c) => !c.archived)
    .map((c) => atlasCourseCardFor(c, today))
}

/** One record → one card. Exported for the tests and the dev handoff's preview. */
export function atlasCourseCardFor(course: MyCourseRecord, today: Date = FIXTURE_TODAY): AtlasCourseCardData {
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
    ...dateLine(course, completed),
    completed,
    ...action(course.myStatus),
  }
}

/** The date row's label and value — the three shapes described above. */
function dateLine(
  course: MyCourseRecord,
  completed: boolean,
): Pick<AtlasCourseCardData, 'dateLabel' | 'availableDate'> {
  if (completed) {
    // `completedOn` is required in practice for a completed record; a fixture
    // that forgot it falls back to the enrolment rather than rendering "undefined".
    return { availableDate: longDate(course.completedOn ?? course.enrolledAt) }
  }
  if (course.expiresAt) return { availableDate: longDate(course.expiresAt) }
  /* NO CLOCK — most of the library. "Available until" would be a date the
     course does not have, so the row says when it was enrolled instead. */
  return { dateLabel: 'Enrolled:', availableDate: longDate(course.enrolledAt) }
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

/** `2026-10-19` → `October 19, 2026`, the long form the design's cards use. */
function longDate(iso: string | undefined): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso ?? ''
  return `${MONTHS[m - 1]} ${d}, ${y}`
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
