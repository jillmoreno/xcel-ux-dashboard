// TODO(data): replace with real Dashboard API integration.
// Lofi sketch: /Users/jill/Downloads/IMG_1100.heic (2026-05-18).

import type { ComponentType } from 'react'
import {
  Award,
  BookOpen,
  ChalkboardUser,
  Gem,
  GraduationCap,
  Library,
  Star,
} from '@/icons'

type IconCmp = ComponentType<{ size?: number }>

export type Kpi = {
  id: string
  label: string
  value: string
  caption?: string
  Icon: IconCmp
  /** When true, only show for `member` accounts. */
  memberOnly?: boolean
}

/**
 * @deprecated The dashboard hero band reads from
 * `dashboardStatsFor(brand)` in `src/data/learnerOverviewFixtures.ts`
 * now. This fixture (and the `KpiStrip` consumer it once fed) was
 * retired in the welcome-stats merge — kept as a back-compat shim
 * for one release. Delete next iteration.
 */
export const KPIS: Kpi[] = [
  {
    id: 'credits',
    label: 'Completed Credits',
    value: '15',
    caption: 'of 200',
    Icon: BookOpen,
  },
  {
    id: 'progress',
    label: 'Overall Progress',
    value: '7.5%',
    caption: 'across all paths',
    Icon: Library,
  },
  {
    id: 'certificates',
    label: 'Certificates Earned',
    value: '12',
    caption: 'lifetime',
    Icon: Award,
  },
  {
    id: 'savings',
    label: 'Saved with Membership',
    value: '$842',
    caption: 'this year',
    Icon: Gem,
    memberOnly: true,
  },
]

export type QuickAction = {
  id: string
  label: string
  caption: string
  Icon: IconCmp
  href: string
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'continue',
    label: 'Continue Learning',
    caption: 'Pick up where you left off',
    Icon: BookOpen,
    href: '/my-learning/courses',
  },
  {
    id: 'jump',
    label: 'Jump Back In',
    caption: 'Resume your active path',
    Icon: GraduationCap,
    href: '/my-learning/path',
  },
  {
    id: 'next',
    label: 'What’s Next',
    caption: 'See your suggested course',
    Icon: Star,
    href: '/catalog',
  },
  {
    id: 'quick-resources',
    label: 'Quick Resources',
    caption: 'Guides, articles & podcasts',
    Icon: Library,
    href: '/my-learning/podcasts',
  },
]

export type ProgressSlice = {
  id: 'completed' | 'in-progress' | 'not-started'
  label: string
  value: number
  /** CSS variable reference (no raw hex). */
  color: string
}

export const COURSE_PROGRESS: ProgressSlice[] = [
  { id: 'completed', label: 'Completed', value: 12, color: 'var(--color-primary-500)' },
  { id: 'in-progress', label: 'In Progress', value: 5, color: 'var(--color-secondary-500)' },
  { id: 'not-started', label: 'Not Started', value: 8, color: 'var(--color-neutral-300)' },
]

export const LICENSE_TRACKER = {
  licenseName: 'North Carolina Real Estate Broker License',
  // ~18 months out — > 52 so the "Time Remaining" stat demos the
  // "1 year, 28 wks" year+weeks format (MarketingFocusedBand splits it).
  weeksLeft: 80,
  expires: {
    month: 'NOVEMBER',
    day: 30,
    year: 2026,
  },
  editHref: '/account/licenses',
}

export type SidebarCardItem = {
  label: string
  caption?: string
  /** Marks the tier as the recommended/best-value option. */
  featured?: boolean
}

export type SidebarCard = {
  id: string
  eyebrow?: string
  title: string
  /** Optional descriptive paragraph. Either `body` or `items` (or both) should be set. */
  body?: string
  /** Optional list of bulleted rows (e.g. plan tiers). Renders below `body`. */
  items?: SidebarCardItem[]
  ctaLabel: string
  ctaHref: string
  Icon: IconCmp
  /** `'cta'` = filled CTA button; `'secondary'` = outline button. */
  ctaVariant?: 'primary' | 'secondary'
  /** Hide for member accounts (used by Upgrade Membership). */
  hideForMember?: boolean
}

export const SIDEBAR_CARDS: SidebarCard[] = [
  {
    id: 'rubi-tutor',
    eyebrow: 'AI Assistant',
    title: 'Rubi Tutor',
    body: 'Ask Rubi anything about your course material — 24/7 personalized tutoring.',
    ctaLabel: 'Let’s Go',
    ctaHref: '/account/tutoring',
    Icon: ChalkboardUser,
    ctaVariant: 'secondary',
  },
  {
    id: 'whats-new',
    eyebrow: 'Dashboard Updates',
    title: 'What’s New',
    body: 'We’ve added new CE electives and refreshed the course player.',
    ctaLabel: 'Learn More',
    ctaHref: '/catalog',
    Icon: Star,
    ctaVariant: 'secondary',
  },
  {
    id: 'premium-membership',
    eyebrow: 'Membership',
    title: 'Premium Membership',
    body: 'Unlock unlimited CE, premium support, and exclusive member savings with Premium.',
    ctaLabel: 'Upgrade to Premium',
    ctaHref: '/membership/plans',
    ctaVariant: 'secondary',
    Icon: Gem,
  },
]
