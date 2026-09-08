import type { AchievementDefinition } from './types'

/**
 * The complete 57-entry achievement catalog.
 *
 * Brand-agnostic on purpose — every brand sees the same titles, categories,
 * icons, and unlock conditions. Per-brand expression happens through which
 * achievements a user has actually earned, which lives in `byBrand.ts`.
 *
 * Authoring conventions:
 *   - `unlockCondition` is a complete sentence ending with a period. It is
 *     rendered verbatim as the tooltip body and the empty-stamp legend on
 *     the Passport page.
 *   - `id` is stable kebab-case; never change one after ship — the
 *     engagement service joins on it.
 *   - Counts per category total 57: streaks 8 + engagement 5 + courses 6 +
 *     certs/paths 4 + career 3 + mastery 7 + lifecycle 8 + community 6 +
 *     hidden 10. Hidden ships at 10 (one more than the 9-item taxonomy in
 *     achievements-redesign.md so the Passport tab feels substantive once
 *     the user has unlocked just one). Adjust here when adding more.
 *
 * Source of truth: explorations/achievements-redesign/achievements-redesign.md §6.
 */
export const ACHIEVEMENT_CATALOG: readonly AchievementDefinition[] = [
  /* ─── Streaks (8) ────────────────────────────────────────────────── */
  {
    id: 'streak-3',
    title: '3-day Streak',
    category: 'streaks',
    iconKey: 'streak3',
    unlockCondition: 'Log learning three days in a row.',
    // Used as a comeback nudge for lapsed users — when a user with no
    // active streak logs in, this badge surfaces as ready.
    readyPrompt: 'Start a 3-day learning streak',
  },
  {
    id: 'streak-7',
    title: '7-day Streak',
    category: 'streaks',
    iconKey: 'streak7',
    unlockCondition: 'Log learning seven days in a row.',
  },
  {
    id: 'streak-14',
    title: '14-day Streak',
    category: 'streaks',
    iconKey: 'streak14',
    unlockCondition: 'Log learning fourteen days in a row.',
  },
  {
    id: 'streak-30',
    title: '30-day Streak',
    category: 'streaks',
    iconKey: 'streak30',
    unlockCondition: 'Log learning thirty days in a row.',
  },
  {
    id: 'streak-60',
    title: '60-day Streak',
    category: 'streaks',
    iconKey: 'streak60',
    unlockCondition: 'Log learning sixty days in a row.',
  },
  {
    id: 'streak-100',
    title: '100-day Streak',
    category: 'streaks',
    iconKey: 'streak100',
    unlockCondition: 'Log learning one hundred days in a row.',
  },
  {
    id: 'streak-200',
    title: '200-day Streak',
    category: 'streaks',
    iconKey: 'streak200',
    unlockCondition: 'Log learning two hundred days in a row.',
  },
  {
    id: 'streak-365',
    title: 'Year of Learning',
    category: 'streaks',
    iconKey: 'streak365',
    unlockCondition: 'Log learning every day for a full year.',
  },

  /* ─── Engagement habits (5) — bucketed under 'streaks' since they're
       consistency-shaped, but kept as their own visual family via icon. */
  {
    id: 'comeback-kid',
    title: 'Comeback Kid',
    category: 'streaks',
    iconKey: 'comebackKid',
    unlockCondition: 'Resume learning after a seven-day gap.',
    readyPrompt: 'Resume any course today',
  },
  {
    id: 'weekend-warrior',
    title: 'Weekend Warrior',
    category: 'streaks',
    iconKey: 'weekendWarrior',
    unlockCondition: 'Stay active on eight consecutive weekends.',
  },
  {
    id: 'early-bird',
    title: 'Early Bird',
    category: 'streaks',
    iconKey: 'earlyBird',
    unlockCondition: 'Complete five sessions before 7 am local time.',
  },
  {
    id: 'night-owl',
    title: 'Night Owl',
    category: 'streaks',
    iconKey: 'nightOwl',
    unlockCondition: 'Complete five sessions after 10 pm local time.',
  },
  {
    id: 'lunch-learner',
    title: 'Lunch Learner',
    category: 'streaks',
    iconKey: 'lunchLearner',
    unlockCondition: 'Complete ten sessions between 11 am and 1 pm.',
  },

  /* ─── Achievements — courses (6) ─────────────────────────────────── */
  {
    id: 'first-course',
    title: 'First Course',
    category: 'achievements',
    iconKey: 'firstCourse',
    unlockCondition: 'Complete your first course.',
    readyPrompt: 'Finish any enrolled course',
  },
  {
    id: 'five-courses',
    title: '5 Courses Completed',
    category: 'achievements',
    iconKey: 'fiveCourses',
    unlockCondition: 'Complete five courses.',
  },
  {
    id: 'ten-courses',
    title: '10 Courses Completed',
    category: 'achievements',
    iconKey: 'tenCourses',
    unlockCondition: 'Complete ten courses.',
  },
  {
    id: 'twenty-five-courses',
    title: '25 Courses Completed',
    category: 'achievements',
    iconKey: 'twentyFiveCourses',
    unlockCondition: 'Complete twenty-five courses.',
  },
  {
    id: 'fifty-courses',
    title: '50 Courses Completed',
    category: 'achievements',
    iconKey: 'fiftyCourses',
    unlockCondition: 'Complete fifty courses.',
  },
  {
    id: 'hundred-courses',
    title: '100 Courses Completed',
    category: 'achievements',
    iconKey: 'hundredCourses',
    unlockCondition: 'Complete one hundred courses.',
  },

  /* ─── Achievements — certs + paths (4) ───────────────────────────── */
  {
    id: 'first-cert',
    title: 'First Certificate',
    category: 'achievements',
    iconKey: 'firstCert',
    unlockCondition: 'Earn your first certificate.',
  },
  {
    id: 'five-certs',
    title: '5 Certificates',
    category: 'achievements',
    iconKey: 'fiveCerts',
    unlockCondition: 'Earn five certificates.',
  },
  {
    id: 'ten-certs',
    title: '10 Certificates',
    category: 'achievements',
    iconKey: 'tenCerts',
    unlockCondition: 'Earn ten certificates.',
  },
  {
    id: 'path-done',
    title: 'Path Completed',
    category: 'achievements',
    iconKey: 'pathDone',
    unlockCondition: 'Complete every course in a single learning path.',
  },

  /* ─── Achievements — career (3) — under 'achievements' category. */
  {
    id: 'three-paths',
    title: '3 Paths Completed',
    category: 'achievements',
    iconKey: 'threePaths',
    unlockCondition: 'Finish three full learning paths.',
  },
  {
    id: 'all-ce',
    title: 'All CE Complete',
    category: 'achievements',
    iconKey: 'allCe',
    unlockCondition: 'Finish every required CE course in a renewal cycle.',
  },
  {
    id: 'three-renewals',
    title: '3 Renewal Cycles',
    category: 'achievements',
    iconKey: 'threeRenewals',
    unlockCondition: 'Renew your license three times via Colibri.',
  },

  /* ─── Mastery (7) ─────────────────────────────────────────────────── */
  {
    id: 'perfect-quiz',
    title: 'Perfect Quiz',
    category: 'mastery',
    iconKey: 'perfectQuiz',
    unlockCondition: 'Score 100% on a quiz for the first time.',
    readyPrompt: 'Score 100 on any quiz',
  },
  {
    id: 'quiz-streak',
    title: 'Quiz Streak',
    category: 'mastery',
    iconKey: 'quizStreak',
    unlockCondition: 'Score 90% or higher on five quizzes in a row.',
  },
  {
    id: 'exam-ready',
    title: 'Exam Ready',
    category: 'mastery',
    iconKey: 'examReady',
    unlockCondition: 'Complete every prep module in an Exam Prep track.',
  },
  {
    id: 'first-try-pass',
    title: 'First-try Pass',
    category: 'mastery',
    iconKey: 'firstTryPass',
    unlockCondition: 'Pass a licensing exam on the first attempt.',
    readyPrompt: 'Pass your next exam on the first try',
  },
  {
    id: 'specialist',
    title: 'Specialist',
    category: 'mastery',
    iconKey: 'specialist',
    unlockCondition: 'Earn a specialty designation.',
  },
  {
    id: 'expert',
    title: 'Expert',
    category: 'mastery',
    iconKey: 'expert',
    unlockCondition: 'Earn three specialty designations.',
  },
  {
    id: 'deep-diver',
    title: 'Deep Diver',
    category: 'mastery',
    iconKey: 'deepDiver',
    unlockCondition: 'Spend five or more hours inside a single course.',
  },

  /* ─── Lifecycle (9 — 8 from taxonomy + License Renewed already
       in the existing fixture, kept here under lifecycle since it's
       a license event rather than a course-completion event). */
  {
    id: 'welcome',
    title: 'Welcome Aboard',
    category: 'lifecycle',
    iconKey: 'welcome',
    unlockCondition: 'Complete your member profile.',
    readyPrompt: 'Finish your profile in Account settings',
  },
  {
    id: 'first-login',
    title: 'First Login',
    category: 'lifecycle',
    iconKey: 'firstLogin',
    unlockCondition: 'Sign in for the first time.',
    readyPrompt: 'Sign in to claim',
  },
  {
    id: 'verified-pro',
    title: 'Verified Pro',
    category: 'lifecycle',
    iconKey: 'verifiedPro',
    unlockCondition: 'Upload an active professional license.',
  },
  {
    id: 'premium',
    title: 'Premium Member',
    category: 'lifecycle',
    iconKey: 'premium',
    unlockCondition: 'Upgrade to a Premium plan.',
  },
  {
    id: 'premium-1y',
    title: 'Premium 1-year',
    category: 'lifecycle',
    iconKey: 'premium1y',
    unlockCondition: 'Hold Premium for twelve consecutive months.',
  },
  {
    id: 'premium-3y',
    title: 'Premium 3-year',
    category: 'lifecycle',
    iconKey: 'premium3y',
    unlockCondition: 'Hold Premium for three consecutive years.',
  },
  {
    id: 'anniversary',
    title: 'Anniversary',
    category: 'lifecycle',
    iconKey: 'anniversary',
    unlockCondition: 'Reach a yearly anniversary of joining.',
  },
  {
    id: 'founding',
    title: 'Founding Member',
    category: 'lifecycle',
    iconKey: 'founding',
    unlockCondition: 'Joined during the platform launch year.',
  },
  {
    id: 'renewed',
    title: 'License Renewed',
    category: 'lifecycle',
    iconKey: 'renewed',
    unlockCondition: 'Complete a license renewal through Colibri.',
  },

  /* ─── Community (6) ──────────────────────────────────────────────── */
  {
    id: 'first-review',
    title: 'First Review',
    category: 'community',
    iconKey: 'firstReview',
    unlockCondition: 'Leave your first course review.',
    readyPrompt: 'Review any course',
  },
  {
    id: 'helpful-reviewer',
    title: 'Helpful Reviewer',
    category: 'community',
    iconKey: 'helpfulReviewer',
    unlockCondition: 'Post ten reviews that receive positive votes.',
  },
  {
    id: 'recommender',
    title: 'Course Recommender',
    category: 'community',
    iconKey: 'recommender',
    unlockCondition: 'Recommend a course to a colleague.',
  },
  {
    id: 'study-buddy',
    title: 'Study Buddy',
    category: 'community',
    iconKey: 'studyBuddy',
    unlockCondition: 'Join a course discussion thread.',
  },
  {
    id: 'mentor',
    title: 'Mentor',
    category: 'community',
    iconKey: 'mentor',
    unlockCondition: 'Answer twenty community questions.',
  },
  {
    id: 'advocate',
    title: 'Brand Advocate',
    category: 'community',
    iconKey: 'advocate',
    unlockCondition: 'Refer five new members.',
  },

  /* ─── Hidden / Easter eggs (9) — invisible until earned. The whole
       category tab is suppressed until at least one is unlocked. */
  {
    id: 'polymath',
    title: 'Polymath',
    category: 'hidden',
    iconKey: 'polymath',
    unlockCondition: 'Complete courses in three or more topic areas.',
  },
  {
    id: 'speed-reader',
    title: 'Speed Reader',
    category: 'hidden',
    iconKey: 'speedReader',
    unlockCondition: 'Complete a course in under 24 hours from start.',
    readyPrompt: 'Finish a course in one sitting',
  },
  {
    id: 'library-card',
    title: 'Library Card',
    category: 'hidden',
    iconKey: 'libraryCard',
    unlockCondition: 'Visit the catalog fifty times.',
  },
  {
    id: 'resource-collector',
    title: 'Resource Collector',
    category: 'hidden',
    iconKey: 'resourceCollector',
    unlockCondition: 'Download twenty-five resources.',
  },
  {
    id: 'curious-mind',
    title: 'Curious Mind',
    category: 'hidden',
    iconKey: 'curiousMind',
    unlockCondition: 'Visit every dashboard tab in one session.',
    readyPrompt: 'Click through every dashboard tab',
  },
  {
    id: 'brand-hopper',
    title: 'Brand Hopper',
    category: 'hidden',
    iconKey: 'brandHopper',
    unlockCondition: 'Try another brand via Switch Brand.',
    readyPrompt: 'Open Switch Brand once',
  },
  {
    id: 'patient-scholar',
    title: 'Patient Scholar',
    category: 'hidden',
    iconKey: 'patientScholar',
    unlockCondition: 'Resume a course after a 30-day pause.',
  },
  {
    id: 'holiday-hustler',
    title: 'Holiday Hustler',
    category: 'hidden',
    iconKey: 'holidayHustler',
    unlockCondition: 'Log learning on a major holiday.',
    readyPrompt: 'Log a session on a holiday',
  },
  {
    id: 'loyalty-legend',
    title: 'Loyalty Legend',
    category: 'hidden',
    iconKey: 'loyaltyLegend',
    unlockCondition: 'Stay an active member for five or more years.',
  },
] as const

/** Hard-runtime assertion that the catalog has the size the rest of the
 *  app expects. Catches accidental duplicates and missed deletes during
 *  refactors — the "N of 57" headline in the widget would silently wander
 *  otherwise. */
const EXPECTED_CATALOG_SIZE = 57
if (ACHIEVEMENT_CATALOG.length !== EXPECTED_CATALOG_SIZE) {
  // eslint-disable-next-line no-console
  console.error(
    `[achievements] catalog size mismatch — expected ${EXPECTED_CATALOG_SIZE}, got ${ACHIEVEMENT_CATALOG.length}.`,
  )
}

/** Convenience map for O(1) id → definition lookup. Frozen so accidental
 *  mutation surfaces immediately rather than silently corrupting state. */
export const ACHIEVEMENT_BY_ID: Readonly<Record<string, AchievementDefinition>> =
  Object.freeze(
    ACHIEVEMENT_CATALOG.reduce<Record<string, AchievementDefinition>>(
      (acc, def) => {
        acc[def.id] = def
        return acc
      },
      {},
    ),
  )
