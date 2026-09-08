/**
 * Achievements — public API.
 *
 * Three selector helpers, all of which accept a `Brand` so the data layer
 * stays brand-aware end-to-end:
 *
 *   - `achievementsFor(brand)` — the full joined 57-entry list, with each
 *     entry's user state filled in. Ids the brand fixture doesn't mention
 *     default to `status: 'locked'` so consumers never see undefined fields.
 *
 *   - `railAchievementsFor(brand, max)` — the "Within reach" rail for the
 *     dashboard widget. Sort: `railPriority` ascending if present, else
 *     `progress` items by % complete descending, then `available` items
 *     in catalog order. Cuts at `max` (default 4).
 *
 *   - `recentStampsFor(brand, max)` — the "Stamps collected" strip. The
 *     earned items, newest by `earnedOn` first. Cuts at `max` (default 5).
 *
 * `iconForAchievement(key)` translates an `AchievementIconKey` to an icon
 * component. The 57-key union forces an exhaustive switch — adding a new
 * key without mapping it will fail typecheck.
 */

import type { Brand } from '@/context/AccountContext'
import {
  Award,
  AwardThin,
  BadgeCheckThin,
  Bell,
  BookOpen,
  BookOpenThin,
  Briefcase,
  CalendarDay,
  CalendarPen,
  ChalkboardUser,
  Check,
  CircleCheck,
  Clock,
  Crown,
  CrownThin,
  FileText,
  Gem,
  GemThin,
  GraduationCap,
  GraduationCapThin,
  Heart,
  HelpCircle,
  HourglassClock,
  IdCard,
  Library,
  LibraryThin,
  Lock,
  Search,
  Share2,
  Star,
  StarSolid,
  User,
  Users,
} from '@/icons'
import type { Achievement, AchievementIconKey, AchievementStatus } from './types'
import { ACHIEVEMENT_CATALOG } from './catalog'
import { userStateMapFor } from './byBrand'

/** Map an icon key onto an existing FA Pro Light icon component.
 *
 *  Keys map onto whatever icon best reads as that achievement at 16–36px.
 *  We deliberately reuse the existing registry rather than introduce
 *  one-off art per badge — when the engagement service ships, the icon
 *  registry is the only thing that needs to grow (not the data model). */
export function iconForAchievement(
  key: AchievementIconKey,
): React.ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' | 'false' }> {
  switch (key) {
    // Streaks — calendar / clock family
    case 'streak3':
    case 'streak7':
      return CalendarDay
    case 'streak14':
    case 'streak30':
      return CalendarPen
    case 'streak60':
    case 'streak100':
      return Star
    case 'streak200':
      return StarSolid
    case 'streak365':
      return HourglassClock
    // Engagement habits
    case 'comebackKid':
      return Heart
    case 'weekendWarrior':
      return Star
    case 'earlyBird':
      return Clock
    case 'nightOwl':
      return Bell
    case 'lunchLearner':
      return Clock
    // Courses
    case 'firstCourse':
      return BookOpen
    case 'fiveCourses':
      return BadgeCheckThin
    case 'tenCourses':
      return Library
    case 'twentyFiveCourses':
      return LibraryThin
    case 'fiftyCourses':
      return BookOpenThin
    case 'hundredCourses':
      return GraduationCap
    // Certs + paths
    case 'firstCert':
      return Award
    case 'fiveCerts':
      return AwardThin
    case 'tenCerts':
      return Award
    case 'pathDone':
      return GraduationCap
    // Career
    case 'threePaths':
      return GraduationCapThin
    case 'allCe':
      return CircleCheck
    case 'threeRenewals':
      return BookOpen
    // Mastery
    case 'perfectQuiz':
      return Check
    case 'quizStreak':
      return CircleCheck
    case 'examReady':
      return FileText
    case 'firstTryPass':
      return Award
    case 'specialist':
      return Gem
    case 'expert':
      return GemThin
    case 'deepDiver':
      return BookOpenThin
    // Lifecycle
    case 'welcome':
      return Heart
    case 'firstLogin':
      return User
    case 'verifiedPro':
      return IdCard
    case 'premium':
      return Crown
    case 'premium1y':
      return CrownThin
    case 'premium3y':
      return Crown
    case 'anniversary':
      return Star
    case 'founding':
      return StarSolid
    case 'renewed':
      return BookOpen
    // Community
    case 'firstReview':
      return Star
    case 'helpfulReviewer':
      return Heart
    case 'recommender':
      return Share2
    case 'studyBuddy':
      return Users
    case 'mentor':
      return ChalkboardUser
    case 'advocate':
      return Briefcase
    // Hidden
    case 'polymath':
      return Library
    case 'speedReader':
      return BookOpen
    case 'libraryCard':
      return Search
    case 'resourceCollector':
      return FileText
    case 'curiousMind':
      return HelpCircle
    case 'brandHopper':
      return Star
    case 'patientScholar':
      return BookOpenThin
    case 'holidayHustler':
      return Star
    case 'loyaltyLegend':
      return Lock
  }
}

/** Full joined list of 57 achievements for the given brand. Ids the
 *  brand's user-state map doesn't mention default to a locked state with
 *  rarityPct: 0 (the UI treats 0 as "rarity unknown" and skips that
 *  metadata line). Order matches `ACHIEVEMENT_CATALOG`. */
export function achievementsFor(brand: Brand): Achievement[] {
  const stateMap = userStateMapFor(brand)
  return ACHIEVEMENT_CATALOG.map((def) => {
    const state = stateMap[def.id]
    if (state) return { ...def, ...state }
    return { ...def, status: 'locked' as AchievementStatus, rarityPct: 0 }
  })
}

/** The "Within reach" rail.
 *
 *  Returns two separate buckets — the dashboard widget renders them as
 *  two sub-groups divided by a dashed vertical line: "Ready" on the left
 *  (single-action unlocks) and "In progress" on the right (quantitative).
 *
 *  Caps each side at 2 (4 total on the rail).
 *
 *  Sort:
 *   - `railPriority` (low wins) if any candidate sets it.
 *   - Ready fallback: by rarity ascending (easiest unlock surfaces first).
 *   - Progress fallback: by % complete descending (closest first). */
export function railAchievementsFor(brand: Brand): {
  ready: Achievement[]
  progress: Achievement[]
} {
  const all = achievementsFor(brand)
  const ready = all
    .filter((a) => a.status === 'ready')
    .sort((a, b) => sortRail(a, b, 'ready'))
    .slice(0, 2)
  const progress = all
    .filter((a) => a.status === 'progress')
    .sort((a, b) => sortRail(a, b, 'progress'))
    .slice(0, 2)
  return { ready, progress }
}

function sortRail(a: Achievement, b: Achievement, mode: 'ready' | 'progress'): number {
  const ap = a.railPriority ?? Number.POSITIVE_INFINITY
  const bp = b.railPriority ?? Number.POSITIVE_INFINITY
  if (ap !== bp) return ap - bp
  if (mode === 'progress') {
    const aPct = a.progress ? a.progress.current / a.progress.target : 0
    const bPct = b.progress ? b.progress.current / b.progress.target : 0
    return bPct - aPct
  }
  // ready fallback — easier wins first (higher rarityPct = more common = easier)
  return b.rarityPct - a.rarityPct
}

/** The "Stamps collected" strip. Earned items only, newest first by
 *  `earnedOn`. Defensive against missing earnedOn — those sink to the
 *  end of the list. */
export function recentStampsFor(brand: Brand, max = 5): Achievement[] {
  const all = achievementsFor(brand)
  const earned = all.filter((a) => a.status === 'earned')
  earned.sort((a, b) => {
    if (!a.earnedOn && !b.earnedOn) return 0
    if (!a.earnedOn) return 1
    if (!b.earnedOn) return -1
    return b.earnedOn.localeCompare(a.earnedOn)
  })
  return earned.slice(0, max)
}

/** Build the "N {unit} to go" sub-line copy used by the Within Reach
 *  stacked list. The achievement's `progress` object carries the count
 *  and unit; we just compute the remainder and pluralize the unit
 *  string verbatim.
 *
 *  Examples:
 *    { current: 41, target: 100, unit: 'days' }     → "59 days to go"
 *    { current: 5,  target: 10,  unit: 'courses' }  → "5 courses to go"
 *    { current: 3,  target: 5 }                     → "2 to go"
 *    { current: 100, target: 100 }                  → "0 to go" (defensive)
 */
export function remainingPhrase(progress: {
  current: number
  target: number
  unit?: string
}): string {
  const remaining = Math.max(0, progress.target - progress.current)
  const unit = progress.unit ? ` ${progress.unit}` : ''
  return `${remaining}${unit} to go`
}

/** Re-exports for consumer convenience — keeps imports to one path. */
export type {
  Achievement,
  AchievementCategory,
  AchievementDefinition,
  AchievementIconKey,
  AchievementStatus,
  AchievementUserState,
} from './types'
export { ACHIEVEMENT_CATALOG, ACHIEVEMENT_BY_ID } from './catalog'
