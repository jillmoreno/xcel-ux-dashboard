/**
 * Achievements — type definitions.
 *
 * The model is split deliberately into two halves:
 *
 *   - `AchievementDefinition` lives client-side, sourced from `catalog.ts`.
 *     Holds the static facts (title, category, icon, unlock condition) that
 *     never change per user.
 *
 *   - `AchievementUserState` lives server-side in production (the planned
 *     engagement service at `GET /api/achievements/me`). Holds the per-user
 *     facts (status, progress, earnedOn, rarity, rail priority).
 *
 * The client joins the two on `id` to produce the `Achievement` record that
 * the UI consumes. While we're still in prototype-fixture land, the join
 * happens in `byBrand.ts` against hand-authored demo states.
 */

/** Coarse grouping used by the Passport page's category tabs. The `hidden`
 *  bucket is for Easter-egg unlocks — its tab is only rendered once the
 *  user has earned at least one entry in it. */
export type AchievementCategory =
  | 'streaks'
  | 'achievements'
  | 'mastery'
  | 'lifecycle'
  | 'community'
  | 'hidden'

/** Five-state machine driving the tile + stamp visuals.
 *
 *  - `earned`   — unlocked. Solid silhouette, full saturation. Has `earnedOn`.
 *  - `ready`    — one deliberate action away. Dashed silhouette + 85%
 *                 opacity + a green READY chip overlay. No accumulation
 *                 (single-action badges like Perfect Quiz, First Review).
 *                 Renders the badge's `readyPrompt` as the subtitle.
 *  - `progress` — measurably advancing through a quantitative count.
 *                 Dashed silhouette + 85% opacity + cyan progress ring +
 *                 a cyan {N}% chip overlay. Always carries a `progress`
 *                 object.
 *  - `locked`   — not yet within reach. Dashed silhouette in faded brown.
 *                 Page shows the empty silhouette; rail ignores.
 *  - `hidden`   — Easter egg. Invisible in the UI until earned (renders
 *                 with `???` for name + `HIDDEN` for date inside its
 *                 category page tab; never on the rail or stamps strip).
 *
 *  The transition graph:
 *    locked → ready    → earned   (single-action)
 *    locked → progress → earned   (quantitative)
 *    locked → earned              (auto-earned, e.g. Welcome Aboard)
 */
export type AchievementStatus =
  | 'earned'
  | 'ready'
  | 'progress'
  | 'locked'
  | 'hidden'

/** Discriminated union of every icon key referenced by the 57-entry catalog.
 *  Adding a new achievement means: 1) extend this union, 2) map it to a
 *  real icon component in `iconForAchievement` (see `index.ts`). */
export type AchievementIconKey =
  // Streaks (8)
  | 'streak3'
  | 'streak7'
  | 'streak14'
  | 'streak30'
  | 'streak60'
  | 'streak100'
  | 'streak200'
  | 'streak365'
  // Engagement habits (5)
  | 'comebackKid'
  | 'weekendWarrior'
  | 'earlyBird'
  | 'nightOwl'
  | 'lunchLearner'
  // Achievements — courses (6)
  | 'firstCourse'
  | 'fiveCourses'
  | 'tenCourses'
  | 'twentyFiveCourses'
  | 'fiftyCourses'
  | 'hundredCourses'
  // Achievements — certs + paths (4)
  | 'firstCert'
  | 'fiveCerts'
  | 'tenCerts'
  | 'pathDone'
  // Achievements — career (3)
  | 'threePaths'
  | 'allCe'
  | 'threeRenewals'
  // Mastery (7)
  | 'perfectQuiz'
  | 'quizStreak'
  | 'examReady'
  | 'firstTryPass'
  | 'specialist'
  | 'expert'
  | 'deepDiver'
  // Lifecycle (8)
  | 'welcome'
  | 'firstLogin'
  | 'verifiedPro'
  | 'premium'
  | 'premium1y'
  | 'premium3y'
  | 'anniversary'
  | 'founding'
  | 'renewed'
  // Community (6)
  | 'firstReview'
  | 'helpfulReviewer'
  | 'recommender'
  | 'studyBuddy'
  | 'mentor'
  | 'advocate'
  // Hidden / Easter eggs (9)
  | 'polymath'
  | 'speedReader'
  | 'libraryCard'
  | 'resourceCollector'
  | 'curiousMind'
  | 'brandHopper'
  | 'patientScholar'
  | 'holidayHustler'
  | 'loyaltyLegend'

/** Static, brand-agnostic definition of an achievement. */
export type AchievementDefinition = {
  /** Stable identifier — used as the join key between client catalog and
   *  server-supplied user state. Kebab-case. */
  id: string
  /** Display title. Title case, no trailing punctuation. */
  title: string
  category: AchievementCategory
  iconKey: AchievementIconKey
  /** Plain-language unlock condition. Used verbatim as the tooltip body —
   *  author each as a complete sentence ending with a period. */
  unlockCondition: string
  /** Short action prompt rendered as the rail subtitle when the badge
   *  is in the `ready` state. Examples: "Score 100 on any quiz",
   *  "Review any course". Required for any badge that can ever land in
   *  the `ready` state (single-action unlocks); optional otherwise. */
  readyPrompt?: string
}

/** Per-user state for one achievement. */
export type AchievementUserState = {
  status: AchievementStatus
  /** ISO YYYY-MM-DD. Present iff status === 'earned'. */
  earnedOn?: string
  /** Numeric progress toward unlock. Present for 'progress' and sometimes
   *  for 'available' when the unlock condition has a numeric target. */
  progress?: { current: number; target: number; unit?: string }
  /** Personal-best snapshot — surfaces in tooltips for streak-style quests
   *  so the user sees "your best so far: N days". */
  personalBest?: { value: number; unit: string }
  /** 0–100. The percentage of members in the user's cohort who hold this
   *  badge. Hardcoded in fixtures; populated by the engagement service in
   *  production. */
  rarityPct: number
  /** Optional server-ranked priority for the dashboard's "Within reach"
   *  rail. Lower numbers surface earlier. When absent, the client falls
   *  back to: `progress` items by % descending, then `available` items. */
  railPriority?: number
}

/** Joined client/server view of one achievement. The UI consumes this
 *  shape exclusively. */
export type Achievement = AchievementDefinition & AchievementUserState
