/**
 * ─────────────────────────────────────────────────────────────────────────
 *  NEW YORK INSURANCE PRODUCER — the QE Focused demo's licence
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  Added 2026-09-16 with the QE Focused dashboard version, which demos a
 *  candidate working towards a New York Insurance Producer licence.
 *
 *  ⚠ THE FIGURES WERE INVENTED FOR ONE DAY AND ARE NOT ANY MORE. They were
 *  authored as flagged placeholders, then confirmed on 2026-09-16 against
 *  XCEL's own published requirements page:
 *
 *      https://www.xcelsolutions.com/new-york/insurance-license/requirements
 *
 *  What that page settles, and what it does not, is the distinction this file
 *  now exists to keep straight:
 *
 *    - **STATE requirements are real.** The 40-hour Life, Accident & Health
 *      pre-licensing requirement, the 100-question / 120-minute PSI sitting,
 *      the 70% pass mark and the fees are all published figures. They are
 *      marked `invented: false` and the surface stops apologising for them.
 *    - **XCEL's PRODUCT hours are still invented.** Prep Review Course, Exam
 *      Simulators and Exam Cram are XCEL's own prep products, not a state
 *      requirement, and the requirements page does not state their hours. They
 *      stay flagged — a smaller claim than a wrong regulatory number, but a
 *      claim.
 *
 *  The 40-hour figure happened to match what was guessed, which is luck and not
 *  a reason to trust the next guess: the questions (150 → 100), the time
 *  (2h30 → 2h) and the provider ("a state-approved test centre" → PSI) were all
 *  wrong.
 *
 *  WHAT IS NOT A REQUIREMENT AT ALL: the four requirement CATEGORIES.
 *  Pre-License Education → Prep Review Course → Exam Simulators → Exam Cram is
 *  XCEL's 3-Part Training Program plus the study tool after it — a product
 *  structure, so it carries across jurisdictions unchanged. Only the hour
 *  requirements are state-specific.
 *
 *  TODO(data): the P&C (90h) and Personal Lines (40h) lines of authority are
 *  published too but not modelled — the demo is one licence. Add them here if a
 *  second path ever lands.
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THE MEASURE IS LESSONS — 2026-09-16
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The QE dashboard reported credit HOURS (three of whose four figures were
 * invented), then briefly DAYS of XCEL's 7-day study plan. It reports
 * **lessons of the pre-licensing course** now, at Jillienne's request, and the
 * course card is the source: "0 of 42 lessons completed".
 *
 * **Where 42 comes from, stated plainly.** The LMS course card — a real XCEL
 * surface, and the one this demo is modelled on. It is NOT on the storefront:
 * that page publishes 40 credit hours, three exam simulators and eight "What
 * You'll Learn" topics, and no count of lessons, sections, chapters or modules
 * anywhere. So 42 is sourced from the product, not from the catalogue, and
 * that is a weaker footing than a published figure but a much stronger one
 * than the hour splits it replaces — those were authored here.
 *
 * **CONFIRMED from the product page** (raw HTML, not a summary — the lesson
 * from the exam-figures correction):
 * `https://www.xcelsolutions.com/new-york/insurance-license/life-and-health/`
 * `new-york-life-and-health-pre-licensing-premier-611ny040002p00`
 *
 *   - Title "New York Life and Health Pre-licensing Premier", $299.00,
 *     Line of Authority "Life and Health", Credit Hours 40.
 *   - The 3-Part Training Program: Pre-licensing Course → Prep Review Course →
 *     Exam Simulator. THREE simulators, unlocked in sequence, unlimited
 *     retakes.
 *   - Access: 30 days for Part 1, then 30 days for Parts 2-3.
 *   - Recommended scores: 70% on Part 1 course exams, 80% on Part 2 chapter
 *     exams, 85% on the simulators.
 *
 * **ONLY PART 1 IS COUNTED**, and that is the shape of the ask: the 42 lessons
 * are the pre-licensing course, and the course is the FIRST part of the study
 * journey. Parts 2 and 3 follow it as steps with no lesson count — see
 * `PROGRAM_PART_STOPS` in `studyJourneyUtil`. Giving them invented lesson
 * counts to keep the gauge multi-segment is exactly the move this file exists
 * to stop; the storefront states none.
 *
 * So the overall reads "N of 42 lessons", which is the card's own sentence.
 */
export const NY_LH_PRELICENSING_LESSONS = 42

/**
 * The 7-day study plan XCEL links from the product page
 * (`https://prepare2pass.com/COURSES/study_guides/lh_ca_7days.pdf`, "Read our
 * recommended study plan"). Kept as a fact about the product even though the
 * dashboard no longer measures in days: it is what the journey's pacing story
 * would be built from, and the link is confirmed.
 *
 * The file is named `lh_ca` and IS the guide the New York page links — XCEL
 * serves it as the Life & Health study plan rather than a per-state one, so it
 * is not a wrong-jurisdiction document.
 */
export const NY_LH_STUDY_PLAN_DAYS = 7

/** The plan itself. CONFIRMED: this is the URL XCEL's own New York product page
 *  links as "Read our recommended study plan". */
export const NY_LH_STUDY_PLAN_URL =
  'https://prepare2pass.com/COURSES/study_guides/lh_ca_7days.pdf'

/**
 * Course art for the New York Life & Health course.
 *
 * ⚠ **THE FILE IS NOT IN THE REPO YET.** The band renders it through an
 * `<img onError>` that falls back to the stock pool (`getCourseImage`), so this
 * path can be authored before the asset lands and the page shows a real
 * photograph either way — the `FeaturePreviewThumb` mechanism the gateway
 * already uses, and the reason CLAUDE.md says that fallback "lets paths be
 * authored before the screenshots exist".
 *
 * That is the ONLY reason a path to a missing file is allowed here. Without the
 * fallback this would be the defect the Resources section shipped four of.
 *
 * To finish it: save the New York skyline as
 * `public/courses/ny-life-health.webp` and nothing else changes. The stock pool
 * (`/courses/0-9.webp`) is real-estate photography, so until then the cover is
 * generic rather than wrong.
 */
export const NY_LH_COURSE_IMAGE = '/courses/ny-life-health.webp'

export const NY_LH_GUIDE_CHAPTERS_PARTIAL = [
  'Basic Principles of Life and Health Insurance',
  'Nature of Insurance',
  'Legal Concepts of Insurance',
  'Life Insurance Policy Types',
  'Life Insurance Policy Provisions, Options and Riders',
  'Group Life Insurance',
  'Annunities',
  'Uses of Life Insurance',
  'Retirement Plans',
  'Social Security',
  'Life Insurance Underwriting and Policy Issue',
  'State Laws, Rules, and Regulations',
] as const

/**
 * The chapter the QE demo learner is working through — the one the Jump Back In
 * widget names (2026-09-17).
 *
 * IT IS AN INDEX INTO THE DECODED LIST, not a string authored here, so the
 * title on screen is one XCEL's own study guide publishes rather than copy
 * written to fill a card. That is the whole reason the recovered list was kept.
 *
 * WHAT IS NOT SOURCED, and it matters for how the widget labels it: **there is
 * no published lesson-to-chapter mapping.** The course card counts 42 LESSONS
 * and the study guide lists CHAPTERS (twelve recovered, and the extraction is
 * known to be short — see the note above). Nothing says which chapter lesson 27
 * falls in. So the widget's NUMBER is derived from progress (26 complete → on
 * 27) while the TITLE is picked here, and the two come from different
 * numbering systems.
 *
 * That pairing is the demo's choice, not a fact.
 *
 * PARTLY RESOLVED 2026-09-17: the widget's label reads "Lesson 27" rather than
 * "Chapter 27" now, which is the honest half — 27 IS the lesson index (26 of 42
 * complete), so the number and its own label finally agree. What remains
 * mismatched is that the TITLE beneath it is a chapter name, so the card reads
 * "Lesson 27" over a chapter. Closing that needs the lesson-to-chapter mapping
 * nobody publishes; until then this is a smaller and more visible mismatch than
 * the one it replaced.
 */
/**
 * XCEL's **3-Part Training Program** — Pre-licensing Course, Prep Review
 * Course, Exam Simulator. Confirmed from the product page (raw HTML, 2026-09-16)
 * under "What's Included", and the same three the study journey walks.
 *
 * PUBLISHED, not invented: the page names the three parts, numbers its "How It
 * Works" steps by them, and states that Parts 2 and 3 unlock on completing
 * Part 1. The journey shows FOUR stops because it adds the attestation and
 * certificate, which happen after the programme rather than inside it — so a
 * "Part N of 3" label counts the programme and a journey count does not.
 */
/**
 * THE PRE-LICENSING COURSE'S CHAPTERS — supplied by Jillienne on 2026-09-17 as
 * a sample, and the list the Course Breakdown renders.
 *
 * IT SUPERSEDES `NY_LH_GUIDE_CHAPTERS_PARTIAL` as the thing on screen, and the
 * two differ in ways worth recording rather than quietly reconciling. That one
 * was decoded from the study guide PDF and is twelve entries; this is eleven.
 * Against it, this list:
 *
 *   - ADDS "Life Insurance Premiums, Proceeds & Beneficiaries", which the
 *     extraction missed entirely.
 *   - DROPS "Life Insurance Policy Types" and "State Laws, Rules, and
 *     Regulations".
 *   - FIXES "Annunities", which was a decoding artefact rather than a typo in
 *     the source.
 *   - REORDERS several — Social Security and Retirement Plans swap, and
 *     Underwriting moves up.
 *
 * The decoded list is KEPT, unrendered, because it is the only independent
 * record of what the PDF actually says and the disagreements above are the
 * useful part of having both.
 *
 * **KNOWN, AND THE REASON THIS IS CALLED A SAMPLE:** every chapter here is
 * LIFE. There is no accident-and-health content — no medical plans, no
 * Medicare, no disability — and this is a Life AND Health course whose state
 * requirement is 20 hours of each. So the list is very likely the life half of
 * a longer outline. It is rendered anyway because it was supplied for that, and
 * eleven real chapter names beat one synthesized "Pre-licensing Course" row;
 * but the count MUST NOT be read as the course's length, which is why nothing
 * derives a total from it and the 42 lessons still come from the course card.
 */
export const NY_LH_COURSE_CHAPTERS = [
  'Basic Principles of Life & Health Insurance',
  'Nature of Insurance, Risk, Perils & Hazards',
  'Legal Concepts of the Insurance Contract',
  'Life Insurance Policies — Provisions, Options & Riders',
  'Life Insurance Premiums, Proceeds & Beneficiaries',
  'Life Insurance Underwriting & Policy Issue',
  'Group Life Insurance',
  'Annuities',
  'Social Security',
  'Retirement Plans',
  'Uses of Life Insurance',
] as const

export const NY_LH_PROGRAM_PARTS = 3

/**
 * How many PARTS a lesson is split into — three, supplied by Jillienne on
 * 2026-09-23: "Part 1 of 3 is actually part 1 of a 3-part section in lesson 27."
 *
 * ⚠ IT IS NOT {@link NY_LH_PROGRAM_PARTS}, AND THE CARD WAS USING THAT ONE.
 * The Jump Back In card renders "Lesson 27 · Part 1 of 3", and until today both
 * halves of that label were wrong about what they counted: the denominator was
 * the programme's three parts (Pre-licensing / Prep Review / Exam Simulator)
 * and the numerator was WHICH OF THOSE the learner had reached, derived from
 * the ordered category list. The label means neither of those things — it is a
 * position inside ONE LESSON.
 *
 * TWO COINCIDENCES HID IT, which is the only reason it survived review: both
 * counts are three, and a learner in programme-part 1 is also on lesson-part 1,
 * so the rendered string was right for entirely the wrong reason. It would have
 * diverged the moment the demo advanced past the pre-licensing course — the
 * card would have read "Part 2 of 3" because of where they were in the
 * PROGRAMME, on a lesson they had just opened.
 *
 * SUPPLIED, NOT PUBLISHED, and separate from the `_INVENTED` constants for that
 * reason — nobody made this number up to fill a card, but no source in this
 * repo states it either. It is also the SAME FOR EVERY LESSON, which is a
 * simplification rather than a fact: nothing here knows lesson 14 from lesson
 * 27. A real per-lesson part count replaces this constant and nothing else.
 */
export const NY_LH_LESSON_PARTS = 3

/**
 * Which part of the current lesson the demo learner is on.
 *
 * ONE, and stated rather than derived, because NOTHING IN THE FIXTURES TRACKS
 * IT. Progress is counted in whole lessons — "26 of 42 complete" — so the
 * learner is at the START of lesson 27 by definition, and part 1 is what that
 * means. Deriving it from anything available would be inventing a position
 * inside a lesson the fixtures resolve only to its boundary.
 *
 * It is a constant so that real per-part progress replaces one value, and so a
 * reader asking "why is this always 1" finds the answer instead of the maths
 * that used to produce it.
 */
export const NY_LH_CURRENT_LESSON_PART = 1



/**
 * Minutes to finish the current lesson — **INVENTED**, and the name says so for
 * the reason `NY_PRODUCER_HOURS_INVENTED` keeps its suffix: a figure that looks
 * like a measurement and is a guess must be impossible to mistake for one.
 *
 * Added 2026-09-17 at Jillienne's request ("Estimated Time to Complete: 18
 * minutes"). It REVERSES a rule this version had held throughout — the
 * reference mock's "· 14 minutes left" was refused three times on the grounds
 * that nothing in the fixtures knows how long a lesson takes, and two tests
 * forbade the copy outright.
 *
 * WHAT WOULD MAKE IT REAL: XCEL's LMS knows a lesson's length; the storefront
 * does not publish one. The product page states 40 credit hours across the
 * course and "less than 2 weeks" to complete the programme, and neither
 * divides into a per-lesson figure honestly — 40 hours over 42 lessons is 57
 * minutes, which is a different claim about a different unit. So this is not
 * derived from anything; it is a number chosen to demo the line.
 *
 * It is a CONSTANT rather than a literal in the card so that replacing it with
 * a real per-lesson duration is one edit, and so that a reader who greps for
 * `_INVENTED` finds it with the other three.
 */
export const NY_LH_LESSON_MINUTES_INVENTED = 18

export const NY_LH_CURRENT_CHAPTER_INDEX = 4
/**
 * The chapter the demo learner is on.
 *
 * ⚠ READS `NY_LH_COURSE_CHAPTERS` AS OF 2026-09-22. It read
 * `NY_LH_GUIDE_CHAPTERS_PARTIAL` — the twelve decoded from the study guide PDF
 * — which was defensible while ONE surface showed a chapter name: the Jump
 * Back In card, where the choice of list was invisible.
 *
 * THE COMPASS COURSE PLAYER MADE IT VISIBLE AND WRONG. Its contents tree
 * renders `NY_LH_COURSE_CHAPTERS` (the eleven Jillienne supplied, which the
 * note on that list already calls the thing on screen), and marks index 4 as
 * the current one. So the card said "Life Insurance Policy Provisions, Options
 * and Riders" while the tree three inches away highlighted "Life Insurance
 * Premiums, Proceeds & Beneficiaries" — and the card's chapter was not in the
 * tree AT ALL, because the two lists differ by more than order. A learner
 * clicking Resume was told they were somewhere the contents could not show
 * them.
 *
 * One list, read by both surfaces, is the fix. `NY_LH_GUIDE_CHAPTERS_PARTIAL`
 * stays exactly as its own note says — unrendered, the independent record of
 * what the PDF says.
 *
 * WHAT THIS DOES NOT FIX, and it is the open question underneath: nothing
 * published maps a LESSON number onto a chapter. The card counts 42 lessons
 * and says "Lesson 27"; this list counts 11 chapters and says index 4. The two
 * numbering systems still do not reconcile — they now at least name the same
 * chapter.
 */
export const NY_LH_CURRENT_CHAPTER: string =
  NY_LH_COURSE_CHAPTERS[NY_LH_CURRENT_CHAPTER_INDEX]

/**
 * ⚠ INVENTED LESSON TITLES — authored 2026-09-23 on the direct ask ("can we
 * have lesson 27 title match what is demo, and then make up the others that
 * are shown on the screen 28-33").
 *
 * WHAT IS REAL HERE IS EXACTLY ONE ENTRY. Lesson 27 reads
 * {@link NY_LH_CURRENT_CHAPTER} — REFERENCED, not retyped, so the course
 * player's contents tree and the Jump Back In card cannot drift into naming the
 * learner's position two different things. Everything from 28 down is written
 * to look like a New York Life & Health pre-licensing outline and is sourced
 * from nobody.
 *
 * ⚠ ALL 42 NOW, AS OF 2026-09-23 — the direct ask, "title them all." It covered
 * 27–33 for one day, which was the window a reviewer saw at 62%, and the note
 * here argued the partial map WAS the honesty mechanism: the ordinal fallback
 * made the authored window obvious at a glance.
 *
 * WHAT KILLED THAT ARGUMENT is that the window moves. The demo's PROGRESS
 * control has a Not Started setting, and at 0% the tree shows lessons 1–7 —
 * seven rows reading "Lesson 1" … "Lesson 7", every one of them a fallback,
 * with nothing on screen saying so. The mechanism only looked honest from the
 * one position it was authored for. From every other position it looked like a
 * half-built feature.
 *
 * So the invention is total and the honesty moved into the NAME and this note,
 * where it does not depend on which lesson the learner happens to be on.
 *
 * HOW THEY WERE BUILT, so a reader can judge them: the 42 are laid over
 * {@link NY_LH_COURSE_CHAPTERS} in order, five to nine lessons per chapter,
 * with lesson 27 landing on chapter index 4 because that is where
 * {@link NY_LH_CURRENT_CHAPTER_INDEX} already put the learner. That alignment
 * is a CONSEQUENCE of the existing fixtures rather than a new claim — but it is
 * not a published mapping, and nothing outside this file should read the
 * grouping as one. The topics are ordinary pre-licensing curriculum; the
 * SEQUENCE, the split points and the wording are all invented.
 *
 * `_INVENTED` in the name for the same reason the other three carry it: someone
 * grepping for what this demo made up finds this with them. When a real outline
 * arrives it replaces this map and the component needs no change — the lookup
 * and the fallback already handle a partial map, and the fallback stays for
 * exactly that reason even though nothing reaches it today.
 */
export const NY_LH_LESSON_TITLES_INVENTED: Record<number, string> = {
  // Chapter 1 — Basic Principles of Life & Health Insurance
  1: 'Course Orientation and Exam Overview',
  2: 'What Insurance Is and How It Works',
  3: 'The Principle of Indemnity and Insurable Risk',
  4: 'The Business of Insurance: Insurers and Producers',
  5: 'Types of Insurers and Marketing Systems',
  // Chapter 2 — Nature of Insurance, Risk, Perils & Hazards
  6: 'Risk: Pure, Speculative and Insurable',
  7: 'Perils, Hazards and Loss Exposure',
  8: 'Methods of Handling Risk',
  9: 'The Law of Large Numbers and Adverse Selection',
  10: 'Reinsurance and Risk Sharing',
  // Chapter 3 — Legal Concepts of the Insurance Contract
  11: 'Elements of a Legal Contract',
  12: 'Offer, Acceptance and Consideration',
  13: 'Contracts of Adhesion and Aleatory Contracts',
  14: 'Utmost Good Faith: Representations and Warranties',
  15: 'Concealment, Fraud and Material Misrepresentation',
  16: 'Agency Law: Authority and Responsibilities',
  17: 'Waiver, Estoppel and the Parol Evidence Rule',
  // Chapter 4 — Life Insurance Policies: Provisions, Options & Riders
  18: 'Term Life: Level, Decreasing and Increasing',
  19: 'Whole Life: Straight, Limited-Pay and Single-Premium',
  20: 'Universal Life and Variable Products',
  21: 'Endowments and Modified Policies',
  22: 'Standard Policy Provisions and the Entire Contract',
  23: 'Incontestability, Grace Period and Reinstatement',
  24: 'Nonforfeiture Options and Cash Value',
  25: 'Dividend Options and Participating Policies',
  26: 'Riders: Waiver of Premium, AD&D and Term Riders',
  /* Chapter 5 — and the ONE REAL ENTRY. Lesson 27 reads
     {@link NY_LH_CURRENT_CHAPTER}, REFERENCED rather than retyped, so the
     player's contents tree and the Jump Back In card cannot drift into naming
     the learner's position two different things. */
  27: NY_LH_CURRENT_CHAPTER,
  28: 'Beneficiary Designations and Settlement Options',
  29: 'Policy Loans, Withdrawals and Surrenders',
  // Chapter 6 — Life Insurance Underwriting & Policy Issue
  30: 'Underwriting: Applications and Insurable Interest',
  31: 'Risk Classification and Substandard Ratings',
  32: 'Policy Issue, Delivery and Free Look',
  // Chapter 7 — Group Life Insurance
  33: 'Group Life: Eligibility, Conversion and Portability',
  // Chapter 8 — Annuities
  34: 'Annuities: Structure, Parties and Purpose',
  35: 'Fixed, Variable and Indexed Annuities',
  36: 'Annuity Payout and Settlement Options',
  37: 'Annuity Taxation and Suitability',
  // Chapter 9 — Social Security
  38: 'Social Security Benefits and the Blackout Period',
  // Chapter 10 — Retirement Plans
  39: 'Qualified Plans: 401(k), IRA and Roth',
  40: 'Nonqualified Plans and Employer-Sponsored Benefits',
  // Chapter 11 — Uses of Life Insurance
  41: 'Business Uses: Buy-Sell, Key Person and Split-Dollar',
  42: 'Personal Uses, Needs Analysis and Exam Review',
}

/**
 * Hour requirements — **superseded as the dashboard's MEASURE** (see the days
 * block above), and kept because `preLicenseEducation` is a real regulatory
 * figure that the requirements sheet still states. The other three are the
 * invented product hours the days replaced; they are unreferenced by the QE
 * surfaces now.
 *
 * Owner: the state for the first field, FinServ product / XCEL curriculum for
 * the rest.
 */
export const NY_PRODUCER_HOURS_INVENTED = {
  /**
   * CONFIRMED. New York requires 40 hours for the Life, Accident & Health
   * lines of authority (20 Life only + 20 Accident & Health only). Published
   * on XCEL's requirements page.
   */
  preLicenseEducation: 40,
  /** ⚠ INVENTED — XCEL's own prep product; the page states no hour figure. */
  prepReviewCourse: 8,
  /** ⚠ INVENTED — practice sittings, scored by us. */
  examSimulators: 6,
  /** ⚠ INVENTED — the final condensed review. */
  examCram: 2,
} as const

/** Total credit hours the path reports. Derived so the parts cannot drift from
 *  the whole — the incoherence the CE path already hit once, where the gauge
 *  claimed completed hours the course list could not support. */
export const NY_PRODUCER_TOTAL_HOURS =
  NY_PRODUCER_HOURS_INVENTED.preLicenseEducation +
  NY_PRODUCER_HOURS_INVENTED.prepReviewCourse +
  NY_PRODUCER_HOURS_INVENTED.examSimulators +
  NY_PRODUCER_HOURS_INVENTED.examCram

/**
 * The licensing exam's published facts, per state.
 *
 * A FUNCTION rather than the module constant it replaces. `EXAM_FACTS` in
 * `ReadinessPanel` was a hardcoded Florida 2-15 block, which was correct while
 * Florida was the only demo licence and became a contradiction the moment Home
 * could say New York — two rail items apart, with nothing on either screen
 * admitting it. The same class of defect as the Study Plan showing a different
 * COURSE from the dashboard, which `ProgressAgreement.test.tsx` exists to stop.
 *
 * `passMark` is read by the readiness gauge's band boundary AND printed in the
 * facts table, from this one field, so the arc and the stated number cannot
 * drift — they sit one tab apart, where nobody sees both at once.
 */
export type ExamFacts = {
  /** Jurisdiction code, matching a path's `state`. */
  state: string
  exam: string
  examNote?: string
  questions: string
  questionsNote?: string
  timeAllowed: string
  /** Percent. The gauge's green band starts here. */
  passMark: number
  where: string
  whereNote?: string
  /** True when every figure above still needs confirming against the board. */
  invented: boolean
}

const EXAM_FACTS_BY_STATE: Record<string, ExamFacts> = {
  // Florida 2-15. The published figures at time of writing — NOT invented, but
  // still carrying the original `TODO(data)`: confirm against the current PSI
  // bulletin before this is shown to a real learner.
  FL: {
    state: 'FL',
    exam: 'Florida 2-15 Health & Life',
    examNote: 'including Annuities & Variable Contracts',
    questions: '165 scored',
    questionsNote: 'plus unscored pretest items',
    timeAllowed: '3 hours 15 minutes',
    passMark: 70,
    where: 'A PSI test centre',
    whereNote: 'or online with remote proctoring',
    invented: false,
  },
  // CONFIRMED 2026-09-16 against XCEL's own published requirements page (see
  // this file's header). Every figure below is stated there.
  NY: {
    state: 'NY',
    exam: 'New York Insurance Producer',
    examNote: 'Life, Accident & Health lines of authority',
    // ⚠ CORRECTED 2026-09-16, same day it shipped. This read "100 questions /
    // 2 hours", which is the figure for a SINGLE line (Life only, Health only,
    // or Personal Lines). The demo persona holds the COMBINED Life, Accident &
    // Health line — the 40-hour one — and that sitting is 150 scored questions
    // in 150 minutes, the same as Property & Casualty.
    //
    // The first fetch of the requirements page summarised the table as "100
    // (Life/Health) or 150 (Personal Lines/P&C)", which has it backwards; the
    // page's own table is per line of authority. Read the table, not a summary
    // of it — and if a second line of authority is ever modelled, these move
    // with it rather than staying keyed by state alone.
    questions: '150 scored questions',
    questionsNote: 'a single line of authority sits 100',
    timeAllowed: '150 minutes',
    passMark: 70,
    where: 'PSI — test centre or online proctored',
    whereNote: 'registration at test-takers.psiexams.com/nyins',
    invented: false,
  },
}

/** Facts for a jurisdiction, falling back to Florida — the licence every other
 *  XCEL fixture is still authored against, so an unknown state degrades to a
 *  coherent screen rather than an empty facts table. */
export function examFactsFor(state: string | undefined): ExamFacts {
  return EXAM_FACTS_BY_STATE[state ?? ''] ?? EXAM_FACTS_BY_STATE.FL
}

/* ─── Getting licensed — the steps after the coursework ──────────────── */

/**
 * XCEL's published route to a New York licence is FOUR steps:
 *
 *   1. Complete the Pre-Licensing Course
 *   2. Schedule the New York State Examination
 *   3. Pass the State Exam
 *   4. Apply for your License
 *
 * Step 1 IS the Study Journey — the journey is that step expanded into its
 * categories, plus the two completion tasks the page names under certificate
 * eligibility (submit the student attestation, then download and print the
 * certificate through the dashboard). So the journey owns step 1 and
 * `GET_LICENSED_STEPS` below owns steps 2-4.
 *
 * **They are two sections rather than one long list because the OWNER
 * changes.** Everything in the journey happens inside the LMS and XCEL knows
 * whether it is done. Nothing in steps 2-4 does: PSI schedules the sitting, PSI
 * scores it, and the Department of Financial Services issues the licence.
 *
 * **Which is why these steps carry NO completion state.** Giving them one would
 * be the product claiming to know something it has no feed for — the same
 * category error as a readiness score presented as a prediction. They are an
 * ordered explainer, and the absence of a checkbox is the honest part. A test
 * asserts they have no status field, so wiring one in is a deliberate act that
 * needs a real feed behind it.
 *
 * Source: https://www.xcelsolutions.com/new-york/insurance-license/requirements
 * — confirmed 2026-09-16. The fees and the PSI registration URL are published
 * there too.
 */
/**
 * Jurisdiction NAMES, for surfaces that say "Get Licensed in New York" rather
 * than "…in NY".
 *
 * A map rather than a field on the path, because a path carries a two-letter
 * CODE (`state: 'NY'`) and expanding it is presentation. Deliberately not a
 * 50-state table: only the jurisdictions this repo actually demos are here, and
 * `jurisdictionName` falls back to the code, so an unmapped state reads as "NY"
 * rather than as a blank or a guess.
 */
const JURISDICTION_NAMES: Record<string, string> = {
  NY: 'New York',
  FL: 'Florida',
}

export function jurisdictionName(state: string | undefined): string {
  if (!state) return ''
  return JURISDICTION_NAMES[state] ?? state
}

export type LicensingStep = {
  id: string
  title: string
  /** One line on what the learner actually does. */
  detail: string
  /** Who owns the step — never XCEL, for all three. */
  owner: string
  /**
   * A SHORT form of `owner`, for the narrow step CARDS (2026-09-21, the direct
   * ask: "change to NY - $80 application fee").
   *
   * Only the licensing authority needs one — "NY Dept. of Financial Services"
   * is 30 characters on a ~300px card and wrapped its fee onto a second line,
   * where "PSI" is already short. Omitted → `owner` is used, so a step wants
   * this only when the full name does not fit.
   *
   * The FULL name is unchanged and is what the Get Licensed RAIL still prints
   * on QE Focused, which has the width for it. This is the same split
   * `jurisdictionName` already makes between the code a path carries and the
   * name a surface spells out — an abbreviation is presentation, so it lives
   * beside the content rather than replacing it.
   */
  ownerShort?: string
  /** Published fee, when the page states one. */
  fee?: string
  /**
   * Label for the link that opens this step's own detail sheet, when the step
   * is rendered as its OWN WIDGET (2026-09-21) rather than as a row in the Get
   * Licensed rail.
   *
   * AUTHORED PER STEP rather than one shared string, because what the sheet
   * answers differs: how to register, what the sitting is like, how to apply.
   * "What to expect" on the application step would be the generic label that
   * tells a learner nothing — which is the reason `ResourceIcon`'s four glyphs
   * stopped all being `blog`.
   *
   * It lives in the DATA, beside the content it labels, so the label and the
   * sections it opens cannot drift. A `switch` on `step.id` at the call site
   * was the alternative and is how a fourth step ships with no label.
   */
  detailLabel?: string
  /** The real destination, when there is one. Confirmed on the way IN. */
  href?: string
  /**
   * The step's FULL published detail, shown in the sheet the row opens.
   *
   * Added 2026-09-17 from XCEL's own requirements page, supplied as screenshots
   * of its steps 2-4. Quoted close to the source rather than paraphrased: these
   * are fees, ID rules and a retake policy — the kind of thing a learner is told
   * once and then has to act on, which is the same reason the requirements box
   * quotes the forced-progression rule verbatim.
   *
   * Every URL here is one the page itself prints. **One had to be corrected on
   * the way in:** the page renders the NIPR link as
   * `https://http://www.nipr.com/`, a malformed href on their side; it is
   * `https://www.nipr.com/` here. That is a fix, not an invention — the domain
   * is theirs and the doubled scheme is plainly a typo.
   */
  sections?: LicensingStepSection[]
}

/** One headed group of bullets inside a step's detail sheet. */
export type LicensingStepSection = {
  /** Omitted for the step's lead bullets, which sit under no sub-heading. */
  heading?: string
  bullets: LicensingStepBullet[]
}

export type LicensingStepBullet = {
  text: string
  /** A published link inside the bullet, rendered after the text. */
  href?: string
  /** What the link says. Defaults to the bare URL, as the source page shows it. */
  linkLabel?: string
  /** Nested bullets — the source page indents these under their parent. */
  children?: LicensingStepBullet[]
}

/**
 * THE GOVERNING AGENCY — New York's Department of Financial Services, from
 * XCEL's published requirements page (supplied 2026-09-17).
 *
 * It sits at the foot of all THREE Get Licensed step sheets, identically, and
 * the repetition is the point: DFS governs the LICENCE, not any one step. A
 * learner reading about the exam fee and a learner reading about the
 * application both want the same phone number, and putting it on one of the
 * three would make finding it depend on which step you happened to open.
 *
 * Every field is published. The `website` is a second confirmed DFS URL
 * alongside the deeper application one in step 4 — worth noting, because the
 * course header band's "DFS Statutory Rules" button was removed in September
 * for the stated reason that no DFS URL existed in this repo.
 *
 * NOT rendered on the Study Journey's own four stops: those happen inside the
 * LMS, where XCEL is the party to contact. The agency belongs to the half of
 * the sequence XCEL does not own, which is the same line that splits the two
 * sections in the first place.
 */
export const NY_GOVERNING_AGENCY = {
  name: 'New York State Department of Financial Services',
  phone: '518-474-6630',
  website: 'https://www.dfs.ny.gov/',
  email: 'licensing@dfs.ny.gov',
  address: 'One Commerce Plaza, Suite 2003 Albany, NY 12257',
} as const

export const GET_LICENSED_STEPS: LicensingStep[] = [
  {
    id: 'schedule-exam',
    /* "Schedule State Exam", not "How to register" — 2026-09-21, the direct
       ask. It names the ACT rather than the reading, which is what the other
       two labels do for their own steps.

       TWO THINGS IT CREATES, both deliberate and both one line to reverse:
       it repeats the card's own heading, and it promises an action while
       opening the step's DETAIL SHEET. The sheet is the scheduling
       information — its first bullet is the PSI registration link, and the
       card names PSI in its meta — so the route is right even though the label
       is bolder than "How to register" was. Point `detailLabel` back, or give
       this step's card the external `href`, if the promise reads as too
       strong. */
    detailLabel: 'Schedule State Exam',
    title: 'Schedule State Exam',
    /* XCEL's own voice, 2026-09-21 (the direct ask), replacing the published
       page's "Register with PSI once your certificate of completion is in
       hand." The PRECONDITION that line carried is not lost — forced
       progression and the certificate requirement are both stated in this
       step's `sections` and in the requirements sheet, which is where a learner
       acting on them will be. What the card wants is the invitation. */
    detail: 'Schedule your exam when you’re ready.',
    owner: 'PSI',
    fee: '$40 exam fee',
    href: 'https://test-takers.psiexams.com/nyins',
    sections: [
      {
        bullets: [
          {
            text: 'Registration must be completed online on the PSI website:',
            href: 'https://test-takers.psiexams.com/nyins',
          },
          { text: 'Exam fee — $40' },
          { text: 'Spanish exams are available' },
        ],
      },
      {
        heading: 'Online proctored exams',
        bullets: [
          {
            text: 'You must check the compatibility of your computer before registering for the exam.',
            href: 'https://syscheck.bridge.psiexams.com',
          },
          {
            text: 'If your computer is not compatible with the online software, you will need to schedule your examination at a PSI test center.',
          },
        ],
      },
      {
        heading: 'Limitation on repeat examinations',
        bullets: [{ text: 'There are no limitations on retaking the exam.' }],
      },
    ],
  },
  {
    id: 'pass-exam',
    detailLabel: 'What to expect',
    title: 'Pass State Exam',
    detail: '150 questions in 150 minutes. 70% to pass.',
    owner: 'PSI',
    sections: [
      {
        bullets: [
          {
            text: "Be sure to take advantage of XCEL's 3-Part training program, including Part 2 (Prep Review Course) and Part 3 (Exam Simulator). These are the two sections we hear from students value the most during the exam waiting period.",
            children: [
              {
                text: 'Prep Review Course: This part of the training scales down content to focus solely on the most important material with weighted sections identical to the state exam. Chapters have only a few pages of material, but the content must be mastered to pass. Instructionally designed to teach individuals how to pass, most study effort should be invested here. Chapter exams are substantially larger (50+ questions), providing exposure to the types of questions seen on the state exam.',
              },
              {
                text: 'Exam Simulator: These special exams are designed to gauge content retention levels. Important: Only take the Exam Simulators after the Prep Review Course has been successfully completed. It ensures these questions will be "fresh in the mind".',
              },
            ],
          },
          {
            text: 'On the day of testing, you must present one form of identification bearing your signature, one of which must be a valid government issued photo id.',
          },
        ],
      },
    ],
  },
  {
    id: 'apply-license',
    detailLabel: 'How to apply',
    title: 'Apply for your License',
    detail: 'Submit your certificate of completion with the application.',
    owner: 'NY Dept. of Financial Services',
    ownerShort: 'NY',
    fee: '$80 application fee',
    sections: [
      {
        bullets: [
          {
            text: 'After passing the examination you must submit your license application to the Department:',
            href: 'https://www.dfs.ny.gov/apps_and_licensing/agents_and_brokers/home',
          },
          {
            text: 'Or electronically through NIPR:',
            href: 'https://www.nipr.com/',
          },
        ],
      },
      {
        heading: 'Application fees',
        bullets: [
          {
            text: 'All licensing fees are non-refundable. A full fee is charged when a license is issued for a licensing period of more than one year; a half fee is charged when a license is issued for a period of one year or less.',
            children: [
              { text: 'For New York residents the full fee is $80, half fee is $40.' },
            ],
          },
        ],
      },
    ],
  },
]
