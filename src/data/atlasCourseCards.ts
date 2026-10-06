import type { AtlasCourseCardData } from '@/components/compass/AtlasCourseCard'

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
    availableDate: 'January 31, 2027',
    availableTime: '11:59 PM CST',
    actionLabel: 'Begin Course',
    actionStyle: 'secondary',
  },
]

/** The links card's column — 260, the Home page's side column (2026-10-06,
 *  Eric's request; it was 280). */
export const ATLAS_MY_COURSES_ASIDE_W = 260
/** One Atlas course card's width: the Figma card's 255. Three fit in one row
 *  beside the 260 links card inside the shell's 1092px content box (260 + 24 +
 *  3 × 255 + 2 × 16 = 1081). It was 250 while the links card was 280. */
export const ATLAS_COURSE_CARD_W = 255
/** My Courses' centred content: the links card, a 24 gap, then the cards in one
 *  row with 16 between (2026-10-06, Eric's request: "center all of the page
 *  content"). The header takes the same width so the title lines up with it. */
export const ATLAS_MY_COURSES_WIDTH =
  ATLAS_MY_COURSES_ASIDE_W + 24 + ATLAS_MY_COURSES.length * ATLAS_COURSE_CARD_W + (ATLAS_MY_COURSES.length - 1) * 16
