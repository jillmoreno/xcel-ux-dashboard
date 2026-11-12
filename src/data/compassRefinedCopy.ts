import { REFINED_COURSE_TOTALS } from './compassRefinedCourse'
import { daysUntilIso } from './courseExpiry'

/**
 * REFINED'S OWN WORDS — the first fixture Refined forks, 2026-11-10.
 *
 * ⚠ THE COURSE IS AN EYEBROW ON EVERY PAGE NOW. Jillienne: "The Florida Life
 * & Health Pre-licensing should be an eyebrow about the title. And the
 * eyebrow should exist on EVERY page because this entire platform is about
 * that 1 course!" In Jeff's build the course name is a line under the
 * Overview's title and appears nowhere else — so a learner four pages deep
 * has nothing on screen saying what they are studying.
 *
 * ⚠ IT LIVES HERE RATHER THAN IN `JEFF_MVP_OVERVIEW_COPY`, which is where he
 * put it, for the reason the data rule gives: his fixture is the OVERVIEW's
 * copy, and this is the platform's. Reading it out of a page's fixture to
 * render it on twelve pages would make every page depend on the Overview.
 *
 * ⚠ IT IS A FORK, AND THE WORDS ARE HIS SO FAR. The strings are carried
 * verbatim from `JEFF_MVP_OVERVIEW_COPY.course` and `.access`; what changed
 * is where they are and what they are for. When Refined decides different
 * words, they change here and the commit says why — the shared-data rule
 * guards against accidental divergence, not against deciding.
 */
export const REFINED_COURSE = {
  /** The one course this platform is about. */
  name: 'Florida Life and Health Pre-licensing',
  /**
   * ⚠ WHAT KIND OF COURSE IT IS, UNDER THE NAME — 2026-11-12, Jillienne on
   * the Your Course header: "This should be the course name in the Playfair
   * font style. Below in smaller text should be Qualifying Education -
   * Florida."
   *
   * The two lines swapped. The card led with "Qualifying Education" — the
   * regulatory CATEGORY — and put the course underneath, so the biggest
   * words in the card named something every XCEL course is rather than the
   * one this platform is about.
   *
   * ⚠ A HYPHEN, HERS VERBATIM, like the Overview's title.
   */
  kind: 'Qualifying Education - Florida',
  /** ⚠ TO THE RIGHT OF THE NAME, dot-separated — the direct ask ("move the
   *  Access ends to the right of the florida eyebrow with a small dot
   *  divider"). It was a line in the Overview's meta row, beside two pills
   *  that are now gone. */
  access: 'Access ends Jan 20, 2027',
  /**
   * ⚠ THE SAME DATE AS AN ISO, AND IT IS THE SOURCE — 2026-11-12: "add
   * another data point after this that shows how many days remaining until
   * access ends."
   *
   * The line above is his string and stays his; the countdown is DERIVED
   * from this rather than typed beside it, which is the rule
   * `MembershipRenewal` already records for exactly this shape: "The Figma
   * cards each carried their own date AND their own day count, and the two
   * disagreed by four days — deriving makes that impossible."
   *
   * ⚠ WHICH MEANS THE TWO CAN STILL DRIFT, in one direction: edit the
   * sentence and not this, and the date on screen stops being the date being
   * counted to. `CompassRefinedShell.test.tsx` holds them to each other.
   */
  accessEndsOn: '2027-01-20',
  /**
   * ⚠ THE COURSE'S OWN ART, ALREADY IN THE REPO — 2026-11-12, behind
   * `compass-course-image`. It is the file the Atlas dashboard's course card
   * draws (`COURSE_ART.fl` in `dashboardProgressFixtures.ts`) and the one
   * the handoff previews use, so Compass and the dashboard show a learner
   * the same picture of the same course rather than two.
   *
   * ⚠ NOT `import.meta.env.BASE_URL` — every other Compass asset on these
   * pages is an absolute path and the app is served from the root. The
   * handoff preview prefixes it because it renders inside a captured frame.
   */
  image: '/courses/fl-life-health.webp',
} as const

/**
 * THE OVERVIEW'S TITLE — one string for all sixteen states, 2026-11-11.
 *
 * ⚠ IT USED TO CHANGE WITH THE LEARNER'S PHASE. Jeff's prototype retitles the
 * page "Your exam prep" on the three P states and "Your learning journey" on
 * the other thirteen, on the argument that after the course this page becomes
 * a different page. Jillienne, landing on the default state: "why does this
 * say exam prep when we are on the overview page" — the rail row says
 * Overview, the page said something else, and nothing on screen reconciled
 * them. A learner who clicks Overview and arrives somewhere differently named
 * has to work out whether they went to the wrong place.
 *
 * ⚠ THE PHASE IS NOT LOST, it stops being the page's NAME. "Overview = Your
 * Learning Journey, and then there can be a small marker near it describing
 * the phase of the journey. We can touch on that later because it would
 * likely be described in the first widget of the overview page." So the
 * marker is deliberately not built yet — it belongs with that widget.
 *
 * ⚠ ONE CONSTANT, TWO COMPONENTS. The P series and the U/Q series are
 * different components; a string typed into both is two strings that agree
 * today. `CompassRefinedShell.test.tsx` holds every state to this one.
 */
/* ⚠ THE RAIL'S WORD LEADS THE TITLE — 2026-11-11: "Change this to Overview -
   Your Learning Journey". The row says Overview and the page said Your
   Learning Journey, which is the mismatch that started this thread on
   2026-11-10 ("why does this say exam prep when we are on the overview
   page"). Naming both settles it in one line instead of making the reader
   hold the equivalence.

   ⚠ A HYPHEN, NOT AN EN DASH, and it is hers verbatim. The course's own rows
   are punctuated the same way — "Course Introduction - Life and Health
   Pre-licensing" — so the page agrees with the data it lists. */
export const REFINED_OVERVIEW_TITLE = 'Overview - Your Learning Journey'

/**
 * EVERY PAGE TITLE, IN ONE PLACE AND IN TITLE CASE — 2026-11-11, Jillienne:
 * "title case everywhere".
 *
 * ⚠ THE SET WAS MIXED AND NOBODY CHOSE IT. "Your Course", "Prep Review",
 * "Exam Simulator" and "Flashcards" were title case; "Your readiness",
 * "Study planner" and "Your learning journey" were sentence case. Both
 * conventions came through the port from different screens of Jeff's file, so
 * the rail and the pages disagreed with each other and with themselves.
 *
 * ⚠ THE MAP IS THE WHOLE SET, not just the three that changed. Listing only
 * the exceptions would mean the convention lives nowhere you can read it, and
 * the next page added would be a coin toss. `CompassRefinedShell.test.tsx`
 * holds every rail page's title to this map and every title in it to the
 * convention.
 *
 * ⚠ IT IS A FORK OF HIS WORDS, and the data rule covers it: a fixture forks
 * when Refined decides different words. `JEFF_MVP_*.title` keeps its own
 * casing — the version that still draws them is not changing.
 */
export const REFINED_PAGE_TITLES = {
  overview: REFINED_OVERVIEW_TITLE,
  learn: 'Your Course',
  'study-planner': 'Study Planner',
  'prep-review': 'Prep Review',
  practice: 'Practice',
  flashcards: 'Flashcards',
  'exam-simulator': 'Exam Simulator',
  readiness: 'Your Readiness',
} as const

/**
 * THE RAIL'S ROW LABELS, held to the same rule.
 *
 * ⚠ ONLY "Study planner" MOVED, and the rail is where it mattered most: the
 * row and the page it opens were spelled differently from each other.
 *
 * ⚠ THE "Exam prep" GROUP LABEL IS DELIBERATELY NOT HERE. Its capitals are
 * `text-transform` — the fixture says "Exam prep" and the stylesheet
 * uppercases it, which the 2026-11-05 parity run recorded the hard way. Title
 * casing the string would change nothing on screen and would break the parity
 * check against his `innerText`.
 */
export const REFINED_RAIL_LABELS: Record<string, string> = {
  overview: 'Overview',
  /* ⚠ "Your Course", NOT "Learn" — 2026-11-11. The row opened a page titled
     "Your Course" and called itself something else; this is the same row/page
     agreement the title-case pass made for Study Planner. */
  learn: 'Your Course',
  'study-planner': 'Study Planner',
  'prep-review': 'Prep Review',
  practice: 'Practice',
  flashcards: 'Flashcards',
  'exam-simulator': 'Exam Simulator',
  readiness: 'Readiness',
}

/**
 * THE PACE FIGURES, AS ATLAS STATES THEM — 2026-11-11, Jillienne: "The
 * Progress UI should more closely match the screen from atlas with the pacing
 * details as well."
 *
 * ⚠ THEY DID NOT EXIST IN THE DATA. Every stage carries a `prog.note` and it
 * is free prose — "Your 6-week goal: about 10 hours a week. Estimated
 * completion Jul 18." on q1, "On pace · 6 lessons this week." on q2, "Lessons
 * complete Jul 15. Access ends Jul 31." on q5. One sentence, different shape
 * each time, so there is nothing to lift a pace NAME or an hours-per-week
 * figure out of. Atlas's card states them as fields: a gauge, "Average · N
 * Week Goal", "about N hours / week".
 *
 * ⚠ SO THIS IS INVENTED DATA, and it says so. The pace is the LEARNER's, not
 * the stage's — Atlas shows one pace across its whole card and Compass's
 * planner heads the same plan "Your pace · Average" — so one block serves
 * every state rather than sixteen sets of figures nobody has written. The
 * stage's own `note` still renders beneath it, which is where the per-state
 * truth stays.
 *
 * ⚠ THE FIGURES TRACK `nyProducerRequirements.ts`'S PRECEDENT, not a real
 * plan: hours and a goal that read right beside q1's own sentence. Confirm
 * them before any of this reaches a stakeholder.
 */
export const REFINED_PACE = {
  /* ⚠ THE FIGURES ARE JILLIENNE'S, 2026-11-11, given with the three-line
     spec: "Study Pace - Average | 1 Week Goal (about 12 hours/week)" and
     "Estimated Completion - Month + Day (in 18 days)". They replace the ones
     invented the hour before (6 Week Goal, about 10 hours / week) — hers are
     the ones to carry. Still not a real plan: no pace engine has produced
     them, and q1's own note still says six weeks and ten hours, which is the
     disagreement to settle when the figures become real. */
  name: 'Average',
  goal: '1 Week Goal',
  /* ⚠ PARENTHESISED AND ABBREVIATED — 2026-11-11: "change to (12hr / wk)".
     It read "about 12 hours/week". The brackets do what the dot before it
     does — mark this as a qualifier on the goal rather than a second fact —
     so the row now says it twice; worth deciding which one goes. */
  hours: '(12hr / wk)',
  /** Month + Day, as asked — the long form is the smaller line under it. */
  completion: 'Jul 18',
  completionIn: 'in 18 days',
  /**
   * ⚠ DAY-ONE COPY, AND ONLY DAY ONE — 2026-11-11: "have this message be
   * under the Study pace section, but only when the user is at 0%."
   *
   * The same call Atlas made on 2026-10-19, in the same words. "Your default
   * recommended study pace is just a starting point" is true on day one and
   * stale every day after, because by then the learner HAS a pace and how it
   * is going is the thing worth the line. `atlas-pace-standing` was added
   * there for exactly this, and its own note reads "at 0% it is ignored" —
   * so the two surfaces now agree without sharing a line of code.
   *
   * ⚠ WHAT REPLACES IT PAST 0% IS NOT DECIDED HERE. Atlas swaps in one of
   * five standings from `paceStanding.ts`. Refined shows nothing yet rather
   * than borrowing those sentences: they are scaled from a goal this card's
   * figures do not have — see this object's own warning above.
   */
  dayOne:
    'Your default recommended study pace is just a starting point, you can further customize your pace',
  /** The word that carries the link, so the sentence can be split around it. */
  dayOneAction: 'here',
  /** ⚠ ONE WORD, ON THE ROW — 2026-11-11, twice. It began as "Change here"
   *  under a closed sentence; then "add this in the same line as the Study
   *  Pace, change to 'Adjust'". On the row it is not a sentence's offer any
   *  more, it is the row's control — and a control at the end of a line
   *  reading "Study Pace · Average | 1 Week Goal · (12hr / wk)" needs one
   *  verb, not a phrase pointing at itself. */
  dayOneLink: 'Adjust',
} as const

/**
 * THE THREE LINES — 2026-11-11, Jillienne: "this needs to be 3 simple lines /
 * Completed Lessons - 0 of 36 / Study Pace - Average | 1 Week Goal (about 12
 * hours/week) smaller text underneath. / Estimated Completion - Month + Day
 * (in 18 days) smaller text underneath."
 *
 * ⚠ THE LABELS LIVE HERE, NOT IN THE COMPONENT, for the reason every other
 * string in this file does: they are Refined's words, and the next person to
 * change one should find all three together rather than three JSX literals.
 */
export const REFINED_PROGRESS_LINES = {
  lessons: 'Completed Lessons',
  pace: 'Study Pace',
  completion: 'Estimated Completion',
} as const

/**
 * THE NEXT-STEP EYEBROW — 2026-11-11, Jillienne: "remove the date from here,
 * just Your Next Step".
 *
 * ⚠ A CONSTANT, NOT A TRIM OF HIS STRING. `hero.nextLabel` carries a date on
 * every state — "Your next step · Tonight, Tue Jun 16", "Recommended next ·
 * Tonight, Wed Jul 29" — so cutting at the "·" would leave the LABEL varying
 * too: "Your next step" on some states and "Recommended next" on others, for
 * no reason a reviewer could see. One eyebrow on all sixteen.
 *
 * ⚠ THE DATE IS NOT LOST TO THE PAGE. "Tonight, Tue Jun 16" is the only place
 * the card said WHEN, and the meta line under the section still carries the
 * duration and the pacing ("1h 40m · on pace for Jul 15"). If the day turns
 * out to matter, it belongs with that line rather than in the eyebrow.
 *
 * ⚠ SENTENCE CASE HERE, CAPITALS ON SCREEN. The stylesheet uppercases this,
 * the way `JEFF_MVP_RAIL.groupLabel` is uppercased — typing "YOUR NEXT STEP"
 * would double-transform nowhere and break any parity check that reads
 * `innerText`.
 */
export const REFINED_NEXT_EYEBROW = 'Your next step'

/**
 * THE TWO STATES OF THE NEXT-STEP CARD — 2026-11-12, Jillienne: "If the user
 * has not started anything, or has just finished a section, the Eyebrow
 * should be Your Next Step, and the CTA should be Start Lesson. If the user
 * is in the middle of a lesson and the progress of that lesson is being
 * shown, the eyebrow is Where you left off, and the CTA is Resume lesson."
 *
 * ⚠ ONE CARD, TWO READINGS OF THE SAME LEARNER, and the words follow the
 * data rather than the page: the Overview and Your Course both draw this
 * card, so a card that said "Your next step" on one page and "Where you left
 * off" on the other for one learner would be the two-pages-disagreeing
 * problem audit finding 4 was about, in copy.
 *
 * ⚠ WHAT DECIDES IT IS `intoCurrent` — the remainder the section count
 * throws away. Standing between rows (0) is a next step; part way through one
 * is where you left off. There is no third source for it: the course list has
 * no sub-structure, so nothing else on the page knows a lesson is half read.
 *
 * ⚠ "Where you left off" IS HIS PHRASE, carried from `JEFF_MVP_LEARN_COPY.
 * resumeEyebrow` rather than re-worded, because it is the one already on the
 * page this card is replacing.
 */
export const REFINED_NEXT_STEP = {
  /** Between sections — nothing started, or a section just finished. */
  fresh: { eyebrow: 'Your next step', cta: 'Start lesson' },
  /** Part way through a section, with that section's own progress drawn. */
  resuming: { eyebrow: 'Where you left off', cta: 'Resume lesson' },
} as const

/**
 * RUBI'S INTRODUCTION — 2026-11-11, "update the Rubi section to match the
 * screenshot."
 *
 * ⚠ IT REPLACES ONE BLOCK, NOT EVERY RUBI. The stage fixtures put a
 * task-specific Rubi on most states — "Recap beneficiary terms", "Practice ·
 * 12 min" — and only two of the sixteen carry the INTRODUCTION, labelled
 * "Rubi · your study partner". The screenshot is that one: a first meeting,
 * not a suggestion. So Refined swaps the block whose label matches and leaves
 * the task Rubis alone; replacing all of them would have thrown away the
 * per-stage content to satisfy a note about day one.
 *
 * ⚠ IT SAYS WHAT SHE WILL DO, where his said what she is. "Ask me anything,
 * any time" over "I'm grounded in your Florida course" is a claim about
 * scope; this names the three things she does, when she will interrupt, and
 * how to stop her — which is the part a learner meeting an AI tutor actually
 * wants settled.
 *
 * ⚠ AND IT CAN BE DECLINED. "Not now" beside the primary is new: an
 * introduction with one button is not an introduction, it is a prompt.
 */
export const REFINED_RUBI_INTRO = {
  /** The label this replaces, so the swap is targeted rather than global. */
  replacesLabel: 'Rubi · your study partner',
  /** ⚠ "Meet Rubi", NOT "Rubi" — 2026-11-11. The eyebrow named the section;
   *  this names the MOMENT. It is an introduction, and on the toast it is the
   *  first thing a learner reads on their first visit, so telling them what
   *  is about to happen beats labelling the box it happens in.
   *
   *  ⚠ THE BAND TAKES IT TOO. Both surfaces read this object, and at 0% they
   *  are the same introduction — one in the corner, one in the page. */
  label: 'Meet Rubi - Your Learning Support',
  /** ⚠ THE TITLE IS A FUNCTION OF THE LEARNER NOW — 2026-11-11: "incorporate
   *  the users name, so it would be Hi Jordan, I'm Rubi." A greeting that
   *  does not use the name it has is a greeting addressed to nobody, and the
   *  account already carries one — the header beside this says "Jordan
   *  Navarro". Falls back to the nameless form rather than printing "Hi ,",
   *  because a demo persona without a first name is a state this has to
   *  survive. */
  title: (firstName?: string) => (firstName ? `Hi ${firstName}, I'm Rubi` : "Hi, I'm Rubi"),
  /** ⚠ HERS VERBATIM, AND THE THIRD DRAFT TODAY — 2026-11-11. Each one moved
   *  the same sentence further from terms-of-service and closer to an
   *  introduction: the port's line listed what she can do and closed "you can
   *  pause my offers any time"; the second opened with why she is there and
   *  closed "you're always in control"; this one drops the reassurance
   *  entirely and says what she will DO unprompted — "pop in with helpful
   *  tips and reminders". Naming the interruption is a better promise than
   *  promising it can be stopped. */
  why: "I'm here to make learning a little easier. Ask me to explain a concept, share an example, or recap a lesson whenever you need. I'll also pop in with helpful tips and reminders as you work through your learning.",
  cta: 'Talk with Rubi',
  dismiss: 'Not now',
  /** ⚠ UNUSED SINCE 2026-11-11, "remove this". It was the toast's navy
   *  primary for an hour — the reasoning being that a greeting to somebody
   *  who has not begun should not make meeting the tutor the first ask. The
   *  string stays because the reasoning might come back; nothing renders it,
   *  and the next-step card opposite carries starting instead. */
  start: 'Start the course',
  close: 'Dismiss',
} as const

/**
 * WHAT THE NEXT SECTION COSTS — 2026-11-11: "change this to 3 sections (small
 * dot) appx time to complete".
 *
 * His line was "1h 40m · insurable interest · how a policy pays": a duration
 * followed by two topics. The topics are what the section is ABOUT, which the
 * title above already says; what a learner weighing "do I start this now?"
 * needs is how long it is and how far in they would get.
 *
 * ⚠ THE INVENTED "3 sections" IS GONE — 2026-11-12: "Use Lessons instead of
 * sections. and update that data point on the Overview to show the total
 * count." It was a placeholder: the course list has no sub-structure ("do not
 * worry about the course content right now"), so nothing knew the Course
 * Introduction has three parts, and the same 3 stood on every state. A made-up
 * number beside a real duration is the kind of figure somebody quotes back.
 *
 * ⚠ IT IS THE COURSE'S OWN LESSON COUNT NOW, counted rather than typed, and
 * it is the same figure the Your Course header's eyebrow leads with — so the
 * two pages state one fact in one word.
 *
 * ⚠ "LESSONS", NOT "SECTIONS", and that is the word everywhere this page and
 * Your Course count the course. It is also the course's own: its instruction
 * reads "Complete all lessons in the list below".
 *
 * ⚠ THE DURATION IS NOT INVENTED. It is the first segment of his own meta
 * line, reused rather than retyped, so the time on screen stays whatever his
 * fixture says for that state.
 */
export const REFINED_NEXT_META = {
  parts: `${REFINED_COURSE_TOTALS.lessons} Lessons`,
  /** Prefixes the duration lifted from the stage's own meta line. */
  approx: 'about',
} as const

/**
 * THE RAIL'S TOP GROUP — 2026-11-11: "Exam Prep Sections off the bottom
 * section, We need a top section called Your Learning (same styling)".
 *
 * ⚠ HIS RAIL LABELS ONE GROUP AND NOT THE OTHER. "Exam prep" rules off the
 * five rows below it, which makes the three above an unnamed remainder —
 * readable only as "everything that is not exam prep". Naming both makes the
 * split his row order already argues for ("planning is part of learning, and
 * what sits under EXAM PREP is what you do once the course is behind you")
 * visible instead of implied.
 *
 * ⚠ SENTENCE CASE HERE, CAPITALS ON SCREEN — the same trap `JEFF_MVP_RAIL.
 * groupLabel` carries: the stylesheet uppercases it, so typing "YOUR
 * LEARNING" would double-transform nowhere and break a parity check reading
 * `innerText`.
 */
export const REFINED_RAIL_TOP_GROUP = 'Your learning'

/**
 * THE RING'S SUB-LABEL — 2026-11-11, on "Lessons": "Complete".
 *
 * ⚠ IT NAMES WHAT THE FIGURE IS, NOT WHAT IS BEING COUNTED. The row beneath
 * already says "Completed Lessons · 0 of 41", so "0% / LESSONS" repeated the
 * noun and left the percentage unexplained — per cent of what? "0% /
 * COMPLETE" says it. It is also what `AtlasPaceRingCard` puts under its own
 * dial, so the two surfaces label the same figure the same way.
 *
 * ⚠ ONE WORD FOR EVERY STATE. `prog.ringLab` is "Lessons" on all sixteen, so
 * nothing varies that this replaces.
 */
export const REFINED_RING_LABEL = 'Complete'

/**
 * HOW THE COURSE ENDS — 2026-11-12, Jillienne: "we will need the Final Exam
 * Section, as well as a survey section, and a certificate section."
 *
 * ⚠ JEFF'S PAGE ENDED ON ONE CARD AND IT WAS WRONG IN THREE WAYS. His
 * "Certification Exam" card is typed copy: it names an exam the course list
 * does not contain, notes "Opens after all 19 chapters" against a course with
 * twenty-one, and stops there — no survey, no certificate, so the page's last
 * word to a learner is an exam rather than the thing they are studying for.
 *
 * ⚠ SO THE ENDING IS NOW THREE ROWS OF THE COURSE, not a card beside it.
 * `REFINED_FINISH_STEPS` reads whatever follows the last chapter in
 * `REFINED_COURSE_SECTIONS` — today the Final Exam, the Course Survey and the
 * Certificate — and these are the words it renders them with. Add a fourth
 * row to the course and it lists, with a note from `stepNote` and nothing
 * here to edit unless it is a kind the course has never had.
 *
 * ⚠ THE EXAM'S NOTE COUNTS. It is a function of the chapter count for exactly
 * the reason his was wrong: "19" was true when it was typed.
 */
/**
 * HOW LONG IS LEFT, as a phrase — 2026-11-12, from her reference line
 * ("Course Access Ends: 06/10/2026, 29 days to complete").
 *
 * ⚠ IT COUNTS FROM TODAY, so it is right on the day it is read and wrong in
 * no other way. A typed figure beside a fixed date is the thing that goes
 * quietly stale; see `REFINED_COURSE.accessEndsOn`.
 *
 * ⚠ AND IT SAYS NOTHING ONCE THE DATE HAS PASSED. "-3 days to complete" is
 * worse than no line; the eyebrow simply ends at the date. What an expired
 * course should say is its own decision, and the stage fixtures do not carry
 * one yet.
 */
export function refinedAccessDaysLabel(today = new Date()): string | null {
  const days = daysUntilIso(REFINED_COURSE.accessEndsOn, today)
  if (days == null || days < 0) return null
  if (days === 0) return 'Last day to complete'
  return `${days} ${days === 1 ? 'day' : 'days'} to complete`
}

export const REFINED_FINISH_COPY = {
  /** The section's own eyebrow and title, in the page's title case. */
  eyebrow: 'Course Completion',
  title: 'Finish Your Course',
  /** The word over each row — what KIND of step this is.
   *  ⚠ "Exam", NOT "Final Exam": the row below it is already titled Final
   *  Exam, and every chapter exam on this page wears the same word
   *  (`examEyebrow`). An eyebrow that repeats its own title is a line of
   *  noise, and one that differs from the twenty above it is worse. */
  kindLabel: {
    exam: 'Exam',
    survey: 'Survey',
    certificate: 'Certificate',
  } as Record<string, string>,
  /** What opens it, which is the half of a locked row that his page left out
   *  everywhere except the chapters ("a locked step tells you exactly what
   *  opens it" is the page's own lead). */
  stepNote: {
    exam: (chapters: number) => `Opens after all ${chapters} chapters`,
    survey: () => 'Opens after the final exam',
    certificate: () => 'Issued when the survey is complete',
  } as Record<string, (chapters: number) => string>,
  /**
   * ⚠ HOW THE ENDING IS NAMED IN THE COURSE HEADER'S EYEBROW — 2026-11-12,
   * Jillienne replacing "21 chapters · 21 exams" with "21 Sections - Final
   * Course Exam - Survey - Certificate".
   *
   * A SECOND name per kind, and deliberately: the rows are titled as the
   * course titles them ("Final Exam", "Course Survey"), and the eyebrow is a
   * summary of what the course contains — where "Final Course Exam" says
   * what it is to somebody who has not scrolled to it, and "Survey" needs no
   * qualifier. If the course's own titles are confirmed, these change with
   * them.
   */
  summaryLabel: {
    exam: 'Final Course Exam',
    survey: 'Survey',
    certificate: 'Certificate',
  } as Record<string, string>,
  /** The button's words. A certificate is downloaded, not taken — so the
   *  verb follows the kind rather than being one word for all three.
   *  ⚠ "Take exam" IS THE CHAPTER EXAMS' OWN CTA (`examCta`), carried here so
   *  the last exam on the page is not the one worded differently. */
  cta: {
    exam: 'Take exam',
    survey: 'Take survey',
    certificate: 'Download',
  } as Record<string, string>,
} as const

/**
 * ONE SENTENCE PER CHAPTER — 2026-11-12, for the roadmap card variant.
 *
 * ⚠ EVERY ONE OF THESE IS INVENTED. The uploaded course list is titles only:
 * no blurbs, no objectives, no durations. These were written from the chapter
 * NAMES and from what a Florida Life & Health pre-licensing syllabus
 * ordinarily covers — which is a reasonable guess and not the course. Nobody
 * at XCEL has read them.
 *
 * ⚠ SO THEY ARE OFF BY DEFAULT. `compass-course-blurb` is a toggle, not an
 * arm, and it starts off: "Make a toggle to show the blurb or not, have it
 * off on default. You can make up the one-sentence blurb." The card draws
 * without them, which is also the honest state of the data.
 *
 * ⚠ AND THIS IS THE LIST TO HAND SOMEBODY. Twenty-one sentences in one
 * object, keyed by the chapter's own title, the way the invented Texas
 * figures were kept together so they could be checked in one pass. A key
 * nothing matches simply draws no blurb.
 */
export const REFINED_CHAPTER_BLURBS: Record<string, string> = {
  'Life and Health Pre-licensing':
    'How the course runs, what the state requires of you, and how your hours are recorded.',
  'Basic Principles of Life and Health Insurance':
    'Risk, insurable interest, indemnity and the vocabulary every later chapter assumes.',
  'Nature of Insurance':
    'What an insurer is, how stock, mutual and fraternal companies differ, and who regulates them.',
  'Legal Concepts of Insurance':
    'Contract law as it applies to a policy — offer, acceptance, consideration and utmost good faith.',
  'Life Insurance Policy Types':
    'Term, whole life, universal and variable policies, and the trade-offs between them.',
  'Life Insurance Provisions, Options, and Riders':
    'Standard provisions, nonforfeiture and settlement options, and the riders that change a policy.',
  'Life Insurance Premiums Proceeds and Beneficiaries':
    'How premiums are calculated, how proceeds are paid, and how beneficiaries are named and changed.',
  'Life Insurance Underwriting and Policy Issue':
    'Applications, field underwriting, risk classification and what happens between signature and issue.',
  'Group Life Insurance':
    'Group contracts, eligibility, conversion rights and how employer-sponsored cover differs.',
  Annuities:
    'Accumulation and payout, fixed against variable, and the tax treatment of each.',
  'Uses of Life Insurance':
    'Personal, business and estate uses — buy-sell agreements, key person cover and liquidity.',
  'Retirement Plans':
    'Qualified and non-qualified plans, contribution limits, and how insurance products sit inside them.',
  'Social Security':
    'Benefits, eligibility and how Social Security interacts with the cover you sell.',
  'Health and Accident Insurance':
    'The structure of a health contract and the perils an accident policy does and does not cover.',
  'Health Insurance Providers':
    'Commercial insurers, Blue plans, HMOs and PPOs, and how each pays for care.',
  'Medical Expense Insurance':
    'Basic and major medical cover, deductibles, coinsurance and stop-loss.',
  'Disability Income Insurance':
    'Definitions of disability, elimination periods, benefit periods and occupational classes.',
  'Health Insurance Plans for Seniors':
    'Medicare parts and supplements, Medicaid eligibility, and long-term care cover.',
  'Health Insurance Policy Provisions':
    'Required and optional provisions, exclusions, and the claim process end to end.',
  'Health Insurance Underwriting and Policy Issue':
    'Health underwriting, pre-existing conditions and what makes a health application different.',
  'Florida Life and Health Laws, Rules, and Regulations':
    'Florida statutes, DFS oversight, licensing and appointment, and unfair trade practice rules.',
}
